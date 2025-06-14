import {
  TextStreamer,
  env,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { generateConversationMessages, cleanInput } from "./contextProvider";
import {
  getInitialModelSelection,
  type ModelSelection,
} from "./modelSelection";
import type { MessageData } from "./types";
import { loadModelWithFallback } from "./modelLoader";

env.allowLocalModels = false;

// Model selection and generator states
let MODEL_SELECTION: ModelSelection = getInitialModelSelection();
let generator: TextGenerationPipeline | null = null;

self.addEventListener("message", async (event: MessageEvent<MessageData>) => {
  const { action, input, modelSelection } = event.data;

  if (action === "init" && modelSelection) {
    MODEL_SELECTION = modelSelection;
    return;
  }

  if (action === "load") {
    try {
      generator = await loadModelWithFallback(
        MODEL_SELECTION,
        (newSelection: ModelSelection) => {
          MODEL_SELECTION = newSelection;
        }
      );
    } catch (error) {
      self.postMessage({ status: "load", response: { error: String(error) } });
    }
    self.postMessage({ status: "done" });
    return;
  }

  const cleanedInput = cleanInput(input);
  if (cleanedInput.length > 0) {
    self.postMessage({ status: "initiate" });
    const messages = generateConversationMessages(cleanedInput);
    const streamer = new TextStreamer(generator!.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => {
        self.postMessage({ status: "stream", response: text });
      },
    });
    try {
      await generator!(messages, {
        temperature: 0.1,           // Slightly higher than 0 for more natural responses
        max_new_tokens: 512,
        do_sample: true,
        top_p: 0.9,                 // Focus on most likely tokens
        repetition_penalty: 1.2,    // Reduce repetition
        early_stopping: true, 
        streamer,
      });
    } catch (e) {
      self.postMessage({
        status: "stream",
        response: `Error generating answer: ${e}`,
      });
    } finally {
      self.postMessage({ status: "done" });
    }
  }
});
