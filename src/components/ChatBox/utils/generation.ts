import {
  pipeline,
  TextStreamer,
  env,
  TextGenerationPipeline,
  FeatureExtractionPipeline,
} from "@huggingface/transformers";
import { getRelevantChunks } from "@/components/ChatBox/utils/embeddingsSearch";

env.allowLocalModels = false;

const EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const GENERATION_MODEL = "HuggingFaceTB/SmolLM2-135M-Instruct";

let embedder: FeatureExtractionPipeline;
let generator: TextGenerationPipeline;

const initialMessage =
  "Hello, I am Justin Law's AI assistant! Got any questions for me?";

interface MessageData {
  action: string;
  input: string;
}

self.addEventListener("message", async (event: MessageEvent<MessageData>) => {
  const { action, input } = event.data;

  if (action === "load") {
    embedder = await pipeline("feature-extraction", EMBEDDING_MODEL, {
      dtype: "fp32",
    });
    generator = await pipeline("text-generation", GENERATION_MODEL, {
      dtype: "q4f16",
    });
    self.postMessage({ status: "done", response: initialMessage });
    return;
  }

  if (input?.trim().length > 0) {
    self.postMessage({ status: "initiate" });

    self.postMessage({ status: "reading" });

    const contextArray = await getRelevantChunks(input, embedder);
    const context = contextArray.join(" ");

    self.postMessage({ status: "answering" });

    const messages = [
      {
        role: "system",
        content: [
          "YOU ARE an AI assistant created by Justin Law.",
          "YOUR GOAL is to provide answers about Justin Law.",
          "YOU WILL be succinct and terse, using full sentences.",
        ].join(" "),
      },
      {
        role: "user",
        content: `Here is some context on Justin's background: \`\`\`${context}\`\`\`. Answer the following user query using ONLY context from Justin's background: \`\`\`${input}\`\`\``,
      },
    ];

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
        temperature: 0.1,
        max_new_tokens: 1024,
        streamer,
      });
    } catch (e) {
      console.error("Error generating answer: ", e);
    }
  }
});
