/**
 * AI Worker
 * Web Worker for AI text generation using HuggingFace Transformers.
 */

import {
  TextStreamer,
  env,
  type Text2TextGenerationOutput,
  type TextGenerationOutput,
} from "@huggingface/transformers";
import { WorkerAction, WorkerStatus, type WorkerRequest } from "@/types/worker";
import { GENERATION_PARAMS } from "@/config/prompts";
import { createLogger, LOG_AREAS } from "@/utils";
import { generatePrompt, cleanInput } from "./contextProvider";
import { loadModel, type LoadedGenerationPipeline } from "./modelLoader";

env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

let viewportWidth: number | undefined;
let loadedPipeline: LoadedGenerationPipeline | null = null;
const logger = createLogger(LOG_AREAS.AI_WORKER);

function extractGeneratedText(output: TextGenerationOutput): string {
  const generated = output[0]?.generated_text;

  if (typeof generated === "string") {
    return generated.trim();
  }

  if (Array.isArray(generated)) {
    for (let index = generated.length - 1; index >= 0; index -= 1) {
      const message = generated[index];
      if (message.role !== "assistant") {
        continue;
      }

      if (typeof message.content === "string") {
        return message.content.trim();
      }

      if (Array.isArray(message.content)) {
        return message.content
          .map((part) => {
            if (typeof part === "string") {
              return part;
            }

            if (
              typeof part === "object" &&
              part !== null &&
              "text" in part &&
              typeof part.text === "string"
            ) {
              return part.text;
            }

            return "";
          })
          .join("")
          .trim();
      }
    }
  }

  return "";
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const {
    action,
    input,
    conversationTurns,
    viewportWidth: nextViewportWidth,
  } = event.data;

  if (action === WorkerAction.INIT) {
    viewportWidth = nextViewportWidth;
    logger.info(`initialized: viewportWidth=${viewportWidth ?? "unknown"}`);
    return;
  }

  if (action === WorkerAction.LOAD) {
    try {
      loadedPipeline = await loadModel({
        viewportWidth,
        onProgress: (progress, message) => {
          self.postMessage({
            status: WorkerStatus.LOAD,
            message,
            progress,
          });
        },
      });

      if (loadedPipeline) {
        logger.info(`model loaded via ${loadedPipeline.task}`);
        self.postMessage({
          status: WorkerStatus.LOAD,
          message: "Model loaded successfully!",
        });
      } else {
        self.postMessage({
          status: WorkerStatus.ERROR,
          error: "Failed to load model.",
          message:
            "Model loading failed. Please refresh the page to try again.",
        });
      }
    } catch (error) {
      self.postMessage({
        status: WorkerStatus.ERROR,
        error: String(error),
        message: "Model loading failed. Please refresh the page to try again.",
      });
    }
    self.postMessage({ status: WorkerStatus.DONE });
    return;
  }

  if (action === WorkerAction.GENERATE) {
    const cleanedInput = cleanInput(input);

    if (cleanedInput.length === 0) {
      self.postMessage({ status: WorkerStatus.DONE });
      return;
    }

    if (!loadedPipeline) {
      self.postMessage({
        status: WorkerStatus.STREAM,
        response:
          "Model not loaded yet. Please wait for the model to finish loading before sending messages.",
      });
      self.postMessage({ status: WorkerStatus.DONE });
      return;
    }

    if (!loadedPipeline.generator.tokenizer) {
      self.postMessage({
        status: WorkerStatus.STREAM,
        response:
          "Model tokenizer not available. Please try reloading the page.",
      });
      self.postMessage({ status: WorkerStatus.DONE });
      return;
    }

    self.postMessage({ status: WorkerStatus.INITIATE });

    const prompt = generatePrompt(cleanedInput, { conversationTurns });
    const generationParams = { ...GENERATION_PARAMS };
    let streamedText = "";

    try {
      const streamer = new TextStreamer(loadedPipeline.generator.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text: string) => {
          streamedText += text;
          self.postMessage({ status: WorkerStatus.STREAM, response: text });
        },
      });

      if (loadedPipeline.task === "text-generation") {
        const output = await loadedPipeline.generator(prompt, {
          temperature: generationParams.temperature,
          max_new_tokens: generationParams.maxTokens,
          do_sample: false,
          repetition_penalty: generationParams.repetitionPenalty,
          top_k: generationParams.topK,
          early_stopping: true,
          return_full_text: false,
          streamer,
        });

        const generatedText = extractGeneratedText(
          output as TextGenerationOutput
        );
        if (!generatedText) {
          logger.warn("text-generation output completed without assistant text");
        } else if (!streamedText.trim()) {
          self.postMessage({
            status: WorkerStatus.STREAM,
            response: generatedText,
          });
        }
      } else {
        const output = await loadedPipeline.generator(prompt, {
          temperature: generationParams.temperature,
          max_new_tokens: generationParams.maxTokens,
          do_sample: false,
          repetition_penalty: generationParams.repetitionPenalty,
          top_k: generationParams.topK,
          early_stopping: true,
          streamer,
        });

        const generatedText =
          (output as Text2TextGenerationOutput)[0]?.generated_text.trim() ?? "";

        if (!generatedText) {
          logger.warn("text2text-generation output completed without text");
        } else if (!streamedText.trim()) {
          self.postMessage({
            status: WorkerStatus.STREAM,
            response: generatedText,
          });
        }
      }
    } catch (e) {
      self.postMessage({
        status: WorkerStatus.STREAM,
        response: `Error generating answer: ${e}`,
      });
    } finally {
      self.postMessage({ status: WorkerStatus.DONE });
    }
  }
});
