import { pipeline, env } from "@huggingface/transformers";

const startToken = "<|im_start|>";
const endToken = "<|im_end|>";
const systemRole = "system";
const userRole = "user";
const assistantRole = "assistant";

env.allowLocalModels = false;

class PipelineSingleton {
  static task = "text-generation";
  static model = "onnx-community/Qwen2.5-0.5B-Instruct";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback,
        device: "wasm",
        dtype: "q8",
      });
    }
    return this.instance;
  }
}

self.addEventListener("message", async (event) => {
  const chat = await PipelineSingleton.getInstance((x) => {
    self.postMessage(x);
  });

  if (event.data.text?.trim().length > 0) {
    // NOTE: `Qwen2.5-0.5B-Instruct` uses the chatML prompt format
    const prompt = [
      `${startToken}${systemRole}`,
      "You are a helpful assistant created and hosted by Justin Law, a full-stack software engineer.",
      endToken,
      `${startToken}${userRole}`,
      event.data.text,
      endToken,
      `${startToken}${assistantRole}`,
    ].join("\n");

    const output = await chat(prompt, {
      temperature: 0.1,
      max_new_tokens: 128,
    });

    console.log(output);
    const extractedOutput = output[0].generated_text;
    console.log(extractedOutput);
    const splitOutput = extractedOutput.split(`${assistantRole}\n\n`);
    console.log(splitOutput);
    const finalMessage =
      splitOutput.length > 1 ? splitOutput[1].trim() : splitOutput.trim();

    self.postMessage({
      status: "complete",
      output: finalMessage,
    });
  }
});
