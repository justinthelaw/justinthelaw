/**
 * This file handles the generation of text using the SmolLM2 models from HuggingFace.
 * 
 * The model selection logic has been moved to modelSelection.ts for better organization
 * and reusability. This file focuses solely on text generation using the selected model.
 */
import { pipeline, TextStreamer, env } from "@huggingface/transformers";
import { MODEL_SELECTION } from "./modelSelection";
import { generateConversationMessages, cleanInput } from "./contextProvider";

env.allowLocalModels = false;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
let generator: any = null;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
async function loadGenerator(): Promise<any> {
  try {
    if (!generator) {
      const pipelineOptions = {
        // Use dtype from the model selection, or fall back to fp32
        dtype: MODEL_SELECTION.dtype || "fp32", 
        progress_callback: (x: any) =>
          self.postMessage({ status: "load", response: x }),
      };
      
      // Log the model and quantization being loaded
      console.log(`Loading ${MODEL_SELECTION.model} with ${pipelineOptions.dtype} precision`);
      
      generator = await pipeline(
        "text-generation", 
        MODEL_SELECTION.model, 
        pipelineOptions
      );
    }
  } catch (e) {
    const error = `Error loading text-generation pipeline: ${e}`;
    self.postMessage({ status: "stream", response: error });
    console.error(error);
    
    // Attempt fallback to smaller model if loading fails
    try {
      console.log("Attempting fallback to smallest model with highest quantization");
      const fallbackModel = "HuggingFaceTB/SmolLM2-135M-Instruct";
      const fallbackOptions = {
        dtype: "int8" as "int8",
        progress_callback: (x: any) =>
          self.postMessage({ status: "load", response: x }),
      };
      
      generator = await pipeline(
        "text-generation", 
        fallbackModel, 
        fallbackOptions
      );
    } catch (fallbackError) {
      const criticalError = `Critical error: Failed to load fallback model: ${fallbackError}`;
      self.postMessage({ status: "stream", response: criticalError });
      console.error(criticalError);
    }
  }
  return generator;
}

interface MessageData {
  action: string;
  input: string;
}

self.addEventListener("message", async (event: MessageEvent<MessageData>) => {
  const { action, input } = event.data;

  /* 
    NOTE: Loads the generator for the first time, downloading and caching the model
          for quicker turnaround upon the first, and follow-up, chat requests.
  */
  if (action === "load") {
    self.postMessage({ status: "load" });
    await loadGenerator();
    self.postMessage({ status: "done" });
    return;
  }

  const cleanedInput = cleanInput(input);

  if (cleanedInput.length > 0) {
    self.postMessage({ status: "initiate" });

    const messages = generateConversationMessages(cleanedInput);

    const streamer = new TextStreamer(generator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (text: string) => {
        self.postMessage({
          status: "stream",
          response: text,
        });
      },
    });

    try {
      await generator(messages, {
        temperature: 0.5,
        max_new_tokens: 512,
        early_stopping: true,
        streamer,
      });
    } catch (e) {
      const error = `Error generating answer: ${e}`;
      self.postMessage({ status: "stream", response: error });
      console.error(error);
    } finally {
      self.postMessage({ status: "done" });
    }
  }
});
