import {
  TextStreamer,
  env,
  TextGenerationPipeline,
  Chat,
} from "@huggingface/transformers";

import loadModel from "@/components/ChatBox/utils/loadModel";
import { searchResults } from "@/components/ChatBox/utils/embeddingsSearch";

env.allowLocalModels = false;

const TEXT_GENERATION_MODEL = "onnx-community/Phi-3.5-mini-instruct-ONNX-GQA";
const TEXT_GENERATION_MODEL_DTYPE = "q4";
const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const EMBEDDING_MODEL_DTYPE = "fp32";

const cleanInput = (input?: string): string => {
  return input ? input.replace(/`/g, "").trim() : "";
};

interface MessageData {
  action: string;
  input: string;
}

self.addEventListener("message", async (event: MessageEvent<MessageData>) => {
  const { action, input } = event.data;

  if (action === "load") {
    await loadModel(
      "text-generation",
      TEXT_GENERATION_MODEL,
      TEXT_GENERATION_MODEL_DTYPE
    );
    await loadModel(
      "feature-extraction",
      EMBEDDING_MODEL,
      EMBEDDING_MODEL_DTYPE
    );
    self.postMessage({ status: "done" });
    return;
  }

  self.postMessage({ status: "read" });

  const cleanedInput = cleanInput(input);

  let context: string = "";
  try {
    context = await searchResults(
      EMBEDDING_MODEL,
      EMBEDDING_MODEL_DTYPE,
      cleanedInput,
      30
    );
    console.info(context);
  } catch (e) {
    const error = `Error retrieving context: ${e}`;
    self.postMessage({ status: "stream", response: error });
    console.error(error);
    return;
  }

  if (cleanedInput.length > 0) {
    self.postMessage({ status: "answer" });

    const messages: Chat = [
      {
        role: "system",
        content: [
          "You are an AI assistant created by Justin Law.",
          "Answer queries using only the context in Justin's resume.",
          "Answer queries using full sentences, being as succinct possible.",
          "Do not answer queries that are inappropriate, explicit, violent or sexual in nature.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          "The following is my query:",
          cleanedInput,
          "Answer my query using the following context from Justin Law's resume:",
          context,
        ].join("\n"),
      },
    ];

    const textGenerator = (await loadModel(
      "text-generation",
      TEXT_GENERATION_MODEL,
      TEXT_GENERATION_MODEL_DTYPE
    )) as TextGenerationPipeline;

    const streamer = new TextStreamer(textGenerator.tokenizer, {
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
      await textGenerator(messages, {
        temperature: 0.5,
        max_new_tokens: 512,
        streamer,
      });
    } catch (e) {
      const error = `Error generating answer: ${e}`;
      self.postMessage({ status: "stream", response: error });
      console.error(error);
    }
  }
});
