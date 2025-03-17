import {
  TextStreamer,
  env,
  TextGenerationPipeline,
  Chat,
} from "@huggingface/transformers";

import loadModel from "@/components/ChatBox/utils/loadModel";

env.allowLocalModels = false;

const TEXT_GENERATION_MODEL = "HuggingFaceTB/SmolLM2-135M-Instruct";
const TEXT_GENERATION_MODEL_DTYPE = "fp16";

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
    self.postMessage({ status: "done" });
    return;
  }

  self.postMessage({ status: "read" });

  const cleanedInput = cleanInput(input);

  if (cleanedInput.length > 0) {
    self.postMessage({ status: "answer" });

    const messages: Chat = [
      {
        role: "system",
        content: [
          "You are Justin Law's AI assistant, tasked with answering questions about Justin Law.",
          "Answer questions using full sentences, being as succinct possible.",
        ].join(" "),
      },
      {
        role: "user",
        content: `Answer this user's query about Justin Law: "${cleanedInput}"`,
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
        temperature: 0.1,
        max_new_tokens: 512,
        streamer,
      });
    } catch (e) {
      const error = `Error generating answer: ${e}`;
      self.postMessage({ status: "stream", response: error });
      console.error(error);
    }
  } else {
    console.error("The user sent a mis-formatted or empty message.");
    self.postMessage({
      status: "stream",
      response:
        "Sorry, I didn't quite catch that. Please send me another question!",
    });
  }
});
