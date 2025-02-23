import { pipeline, TextStreamer, env } from "@huggingface/transformers";

// Disable local model usage.
env.allowLocalModels = false;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
let generator: any = null;

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
async function loadGenerator(): Promise<any> {
  if (!generator) {
    generator = await pipeline(
      "text-generation",
      "HuggingFaceTB/SmolLM2-360M-Instruct",
      { dtype: "fp16" }
    );
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
    "Justin Law IS a software engineer and IS a veteran of the United States Air and Space Forces.",
    "Justin Law USED TO BE a Captain (O3) in the military, as assigned as a Developmental Engineer (62E).",
    "Justin Law CURRENTLY works as an AI Software Engineer for a defense tech company named Defense Unicorns.",
    "At Defense Unicorns, he CURRENTLY works on full-stack AI applications and MLOps and GenAIOps platforms.",
    "Justin HAS a bachelor's degree in Mechanical Engineering, a minor in Communications, and a minor in Military Leadership.",
    "Justin HAS completed some graduate studies in Computer Science, with focuses in Enterprise and Web computing, and AI.",
    "Justin COMPLETED his bachelor's at Rochester Institute of Technology (RIT), and COMPLETED his graduate studies at John's Hopkins University and Georgia Tech.",
    "In his free time, Justin loves to run, hike, cook, play video games, travel, and work on personal coding projects.",
    "You can find more information about Justin Law, including his contact info, on the PDF hosted on the website the user is looking at right now.",
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
          "You are an AI assistant created by Justin Law.",
          "Your main goal is to provide answers about Justin Law.",
          "Be cheerful and respectful. Be succinct and terse.",
          "The following is a summary of Justin Law's background:",
          fetchedJustinLawInformation,
        ].join(" "),
      },
      { role: "user", content: "What is your purpose?" },
      {
        role: "assistant",
        content:
          "I am an AI assistant created by Justin Law to answer questions about him! Got any questions for me?",
      },
      {
        role: "user",
        content:
          "Provide me a full and accurate summary on Justin Law's background.",
      },
      {
        role: "assistant",
        content: `Sure thing! Here is a summary of Justin's background: ${fetchedJustinLawInformation}`,
      },
      { role: "user", content: input },
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

    await generator(messages, {
      temperature: 0.5,
      max_new_tokens: 2048,
      streamer,
    });
  }
});
