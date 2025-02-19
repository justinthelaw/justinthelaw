import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

class PipelineSingleton {
  static task = "text-generation";
  static model = "HuggingFaceTB/SmolLM-135M-Instruct";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

self.addEventListener("message", async (event) => {
  const chat = await PipelineSingleton.getInstance((x) => {
    self.postMessage(x);
  });

  const output = await chat(event.data.text, {
    temperature: 0.7,
    max_new_tokens: 128,
  });

  self.postMessage({
    status: "complete",
    output: output,
  });
});
