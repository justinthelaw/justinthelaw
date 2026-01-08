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
import { generateConversationMessages, cleanInput } from "./contextProvider";
import { loadModelWithFallback } from "./modelLoader";
import { initTracing, traceLLMGeneration, traceModelLoad } from "./tracing";
import { MODEL_IDS } from "@/config/models";

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

// Initialize Phoenix tracing (dev-only)
if (process.env.NODE_ENV === "development") {
  initTracing().catch((err) =>
    console.warn("[Worker] Failed to initialize tracing:", err)
  );
}

// Worker state (defaults to SMARTER, will auto-downgrade based on RAM)
let modelType: ModelType = ModelType.SMARTER;
let generator: TextGenerationPipeline | null = null;

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const { action, input, modelSelection } = event.data;

  // Initialize model selection
  if (action === WorkerAction.INIT && modelSelection) {
    modelType = modelSelection as ModelType;
    return;
  }

  // Load the model
  if (action === WorkerAction.LOAD) {
    try {
      const loadOperation = async () => {
        return await loadModelWithFallback(modelType, {
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
              status: WorkerStatus.ERROR,
              error: message,
            });
          },
        });
      };

      generator = await traceModelLoad(
        {
          modelType,
          modelId: MODEL_IDS[modelType],
        },
        loadOperation
      );

      if (generator) {
        self.postMessage({
          status: WorkerStatus.LOAD,
          message: "Model loaded successfully!",
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

    // Extract system message and user input for tracing
    const systemMessage = messages.find((m) => m.role === "system")?.content;
    const userMessage =
      messages.find((m) => m.role === "user")?.content || cleanedInput;

    // Get model-specific generation parameters
    const generationParams = { ...GENERATION_PARAMS[modelType] };

    try {
      const generateOperation = async () => {
        // Type guard - generator is checked above but needed for closure
        if (!generator || !generator.tokenizer) {
          throw new Error("Generator not available");
        }

        // Count input tokens for tracing
        const inputTokenIds = generator.tokenizer(
          messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
          { return_tensor: false }
        );
        const promptTokens = Array.isArray(inputTokenIds.input_ids)
          ? inputTokenIds.input_ids.length
          : inputTokenIds.input_ids.data.length;

        let fullResponse = "";

        // Create streamer for real-time output
        const streamer = new TextStreamer(generator.tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (text: string) => {
            fullResponse += text;
            self.postMessage({ status: WorkerStatus.STREAM, response: text });
          },
        });

        // Generate with model-optimized parameters
        await generator(messages, {
          temperature: generationParams.temperature,
          max_new_tokens: generationParams.maxTokens,
          do_sample: false,
          repetition_penalty: generationParams.repetitionPenalty,
          top_k: generationParams.topK,
          early_stopping: true,
          streamer,
        });

        // Count output tokens for tracing
        const outputTokenIds = generator.tokenizer(fullResponse, {
          return_tensor: false,
        });
        const completionTokens = Array.isArray(outputTokenIds.input_ids)
          ? outputTokenIds.input_ids.length
          : outputTokenIds.input_ids.data.length;

        return {
          output: fullResponse,
          fullResponse,
          promptTokens,
          completionTokens,
        };
      };

      await traceLLMGeneration(
        {
          modelType,
          modelId: MODEL_IDS[modelType],
          systemMessage,
          input: userMessage,
          temperature: generationParams.temperature,
          maxTokens: generationParams.maxTokens,
          topK: generationParams.topK,
          repetitionPenalty: generationParams.repetitionPenalty,
        },
        generateOperation
      );
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
