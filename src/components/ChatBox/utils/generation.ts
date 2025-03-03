import { pipeline, TextStreamer, env } from "@huggingface/transformers";

env.allowLocalModels = false;

const TEXT_GENERATION_MODEL = "HuggingFaceTB/SmolLM2-360M-Instruct";

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
let generator: any = null;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
async function loadGenerator(): Promise<any> {
  try {
    if (!generator) {
      generator = await pipeline("text-generation", TEXT_GENERATION_MODEL, {
        dtype: "fp16",
        progress_callback: (x) =>
          self.postMessage({ status: "load", response: x }),
      });
    }
  } catch (e) {
    const error = `Error loading text-generation pipeline: ${e}`;
    self.postMessage({ status: "stream", response: error });
    console.error(error);
  }
  return generator;
}

const cleanInput = (input?: string): string => {
  return input ? input.replace(/`/g, "").trim() : "";
};

interface MessageData {
  action: string;
  input: string;
}

self.addEventListener("message", async (event: MessageEvent<MessageData>) => {
  const { action, input } = event.data;

  const context = [
    "He is currently an AI/ML Software Engineer at Defense Unicorns.",
    "At Defense Unicorns, he currently works on full-stack AI applications and MLOps and GenAIOps platforms.\n",
    "He is veteran of the United States Air and Space Forces.",
    "He was a Captain (O3) in the United States Air and Space Forces, originally assigned as a Developmental Engineer (62E).",
    "He was honorably discharged and is no longer a member of the military.\n",
    "He holds a bachelor's degree in Mechanical Engineering, a minor in Communications, and a minor in Military Leadership.",
    "He completed the bachelor's degree and minors at Rochester Institute of Technology (RIT)",
    "He has completed some master's level graduate studies in Computer Science, with focuses in Enterprise and Web computing, and AI.",
    "He completed these master's level graduate studies at John's Hopkins University and Georgia Tech.\n",
    "In his free time, he likes to run, cook, play video games, travel, and work on personal coding projects.",
    "He is an organized, disciplined, and diligent person.\n",
    "You can find more information about him, including his contact info, in the PDF on the website you are currently on.",
  ].join(" ");

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

    const messages = [
      {
        role: "system",
        content: [
          "You are an AI assistant created by Justin Law.",
          "Answer queries using full sentences, being as terse possible.",
          "Answer queries using only the context in Justin's background, and nothing else.",
          "Do not answer if the question contains inappropriate, explicit, violent or sexual content.",
        ].join(" "),
      },
      {
        role: "user",
        content: "Tell me about Justin Law!",
      },
      {
        role: "assistant",
        content: `Sure, here is Justin's background: \"${context}\"`,
      },
      {
        role: "user",
        content: [
          `Using Justin Law's background, answer the query: \"What is Justin's current job?\".`,
        ].join(" "),
      },
      {
        role: "assistant",
        content:
          "He is currently an AI/ML Software Engineer at Defense Unicorns, where he works on full-stack AI applications and MLOps and GenAIOps platforms.",
      },
      {
        role: "user",
        content: [
          `Using Justin Law's background, answer the query: \"${cleanedInput}\".`,
        ].join(" "),
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
