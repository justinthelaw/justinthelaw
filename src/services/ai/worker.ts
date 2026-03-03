/**
 * AI Worker
 * Web Worker for AI text generation using HuggingFace Transformers
 */

import {
  TextStreamer,
  env,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { WorkerAction, WorkerStatus, type WorkerRequest } from "@/types/worker";
import { ModelType } from "@/types";
import { GENERATION_PARAMS } from "@/config/prompts";
import { createLogger, LOG_AREAS } from "@/utils";
import { generateConversationMessages, cleanInput } from "./contextProvider";
import { loadModelWithFallback } from "./modelLoader";

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

// Worker state (defaults to SMARTER, will auto-downgrade based on RAM)
let modelType: ModelType = ModelType.SMARTER;
let viewportWidth: number | undefined;
let generator: TextGenerationPipeline | null = null;
const logger = createLogger(LOG_AREAS.AI_WORKER);

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const { action, input, modelSelection, viewportWidth: nextViewportWidth } =
    event.data;

  // Initialize model selection
  if (action === WorkerAction.INIT && modelSelection) {
    modelType = modelSelection;
    viewportWidth = nextViewportWidth;
    logger.info(
      `initialized: model=${modelType}, viewportWidth=${viewportWidth ?? "unknown"}`
    );
    return;
  }

  // Load the model
  if (action === WorkerAction.LOAD) {
    try {
      generator = await loadModelWithFallback(modelType, {
        viewportWidth,
        onProgress: (progress, message) => {
          self.postMessage({
            status: WorkerStatus.LOAD,
            message,
            progress,
          });
        },
        onFallback: (newSize) => {
          modelType = newSize;
          self.postMessage({
            status: WorkerStatus.FALLBACK_MODEL,
            fallbackModel: newSize,
          });
        },
        onError: (message) => {
          self.postMessage({
            status: WorkerStatus.LOAD,
            message,
          });
        },
      });

      if (generator) {
        logger.info(`model loaded: ${modelType}`);
        self.postMessage({
          status: WorkerStatus.LOAD,
          message: "Model loaded successfully!",
          loadedModel: modelType,
        });
      } else {
        self.postMessage({
          status: WorkerStatus.ERROR,
          error: "Failed to load model. All fallback attempts failed.",
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

  // Generate text
  if (action === WorkerAction.GENERATE) {
    const cleanedInput = cleanInput(input);

    if (cleanedInput.length === 0) {
      self.postMessage({ status: WorkerStatus.DONE });
      return;
    }

    // Check if model is loaded
    if (!generator) {
      self.postMessage({
        status: WorkerStatus.STREAM,
        response:
          "Model not loaded yet. Please wait for the model to finish loading before sending messages.",
      });
      self.postMessage({ status: WorkerStatus.DONE });
      return;
    }

    // Ensure tokenizer is available
    if (!generator.tokenizer) {
      self.postMessage({
        status: WorkerStatus.STREAM,
        response:
          "Model tokenizer not available. Please try reloading the page.",
      });
      self.postMessage({ status: WorkerStatus.DONE });
      return;
    }

    self.postMessage({ status: WorkerStatus.INITIATE });

    // Generate conversation messages with model-specific optimization
    const messages = generateConversationMessages(cleanedInput, modelType);

    // Get model-specific generation parameters
    const generationParams = { ...GENERATION_PARAMS[modelType] };

    try {
      const streamer = new TextStreamer(generator.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text: string) => {
          self.postMessage({ status: WorkerStatus.STREAM, response: text });
        },
      });

      await generator(messages, {
        temperature: generationParams.temperature,
        max_new_tokens: generationParams.maxTokens,
        do_sample: false,
        repetition_penalty: generationParams.repetitionPenalty,
        top_k: generationParams.topK,
        early_stopping: true,
        streamer,
      });
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
