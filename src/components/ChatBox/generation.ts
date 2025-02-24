import { pipeline, TextStreamer, env } from "@huggingface/transformers";

// Disable local model usage.
env.allowLocalModels = false;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
let generator: any = null;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
async function loadGenerator(): Promise<any> {
  try {
    if (!generator) {
      generator = await pipeline(
        "text-generation",
        "HuggingFaceTB/SmolLM2-360M-Instruct",
        { dtype: "fp16" }
      );
    }
  } catch (e) {
    console.error("Error loading text-generation pipeline", e);
  }
  return generator;
}

const initialMessage =
  "Hello, I am Justin Law's AI assistant! Got any questions for me?";

interface MessageData {
  action: string;
  input: string;
}

self.addEventListener("message", async (event: MessageEvent<MessageData>) => {
  const { action, input } = event.data;

  // TODO: fetch context about Justin Law from Google Drive, GitHub, and other sources
  const fetchedJustinLawInformation = [
    "Justin Law CURRENTLY IS a software engineer and CURRENTLY IS a veteran of the United States Air and Space Forces.",
    "Justin Law WAS, NOT CURRENTLY, a Captain (O3) in the military, assigned as a Developmental Engineer (62E).",
    "Justin Law CURRENTLY works as an AI Software Engineer for a defense tech company named Defense Unicorns.",
    "At Defense Unicorns, he CURRENTLY works on full-stack AI applications and MLOps and GenAIOps platforms.",
    "Justin CURRENTLY HAS a bachelor's degree in Mechanical Engineering, a minor in Communications, and a minor in Military Leadership.",
    "Justin COMPLETED the bachelor's degree and minors at Rochester Institute of Technology (RIT)",
    "Justin CURRENTLY HAS completed some master's level graduate studies in Computer Science, with focuses in Enterprise and Web computing, and AI.",
    "Justin COMPLETED the master's level graduate studies at John's Hopkins University and Georgia Tech.",
    "In Justin's free time, he likes to run, cook, play video games, travel, and work on personal coding projects.",
    "Justin IS very organized, disciplined, and diligent.",
    "Justin IS always trying to learn more through his friends, co-workers, and through various projects and online resources",
    "You can find more information about Justin Law, including his contact info, in the PDF on this website you are currently on.",
  ].join(" ");

  /* 
    NOTE: Loads the generator for the first time, downloading and caching the model
          for quicker turnaround upon the first, and follow-up, chat requests.
  */
  if (action === "load") {
    await loadGenerator();
    self.postMessage({ status: "done", response: initialMessage });
    return;
  }

  if (input?.trim().length > 0) {
    self.postMessage({ status: "initiate" });

    const generator = await loadGenerator();
    const messages = [
      {
        role: "system",
        content: [
          "YOU ARE an AI assistant created by Justin Law.",
          "YOUR GOAL is to provide answers about Justin Law.",
          "YOU WILL be succinct and terse, using full sentences.",
        ].join(" "),
      },
      { role: "user", content: "What is your purpose?" },
      {
        role: "assistant",
        content:
          "I am an AI assistant created by Justin Law to answer your questions about him!",
      },
      {
        role: "user",
        content: "Provide me an accurate summary of Justin Law's background.",
      },
      {
        role: "assistant",
        content: `Sure thing! Here is a summary of Justin's background: ${fetchedJustinLawInformation}`,
      },
      {
        role: "user",
        content: `Using the summary, answer the following query: \`\`\`${input}\`\`\``,
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
