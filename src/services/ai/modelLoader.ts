/**
 * Model Loader
 * Handles loading text generation models with progressive fallback on failure
 */

import {
  pipeline,
  env,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { ModelType } from "@/types";
import { MODEL_IDS, MODEL_DTYPE, MODEL_SIZES } from "@/config/models";
import { SITE_CONFIG } from "@/config/site";

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

export interface LoaderCallbacks {
  onProgress?: (progress: number, message: string) => void;
  onFallback?: (newModel: ModelType) => void;
  onError?: (message: string) => void;
}

/**
 * Get the next smaller model size for fallback
 */
export function getNextSmallerModel(currentSize: ModelType): ModelType | null {
  if (currentSize === ModelType.SMARTER) return ModelType.DUMBER;
  return null; // Already at smallest (DUMBER)
}

/**
 * Loads a text generation model with progressive fallback on failure
 */
export async function loadModelWithFallback(
  modelType: ModelType,
  callbacks: LoaderCallbacks = {}
): Promise<TextGenerationPipeline | null> {
  let currentSize = modelType;
  let generator: TextGenerationPipeline | null = null;
  let attempts = 0;
  const maxAttempts = MODEL_SIZES.length;

  while (!generator && attempts < maxAttempts) {
    attempts++;
    try {
      const modelId = MODEL_IDS[currentSize];

      // Track if we're in download phase (first time seeing progress)
      let isDownloading = true;

      // For custom fine-tuned model (SMARTER), use non-quantized ONNX
      // The model is exported as model.onnx, not model_quantized.onnx
      const pipelineOptions: Record<string, unknown> = {
        dtype: MODEL_DTYPE,
        progress_callback: (progressData: unknown) => {
          if (typeof progressData === "object" && progressData !== null) {
            const data = progressData as { progress?: number; status?: string };
            if (data.progress !== undefined && callbacks.onProgress) {
              const progress = Math.round(data.progress);

              // Differentiate between download and loading into memory
              let message: string;
              if (data.status === "progress") {
                message = `Downloading model... ${progress}%`;
                isDownloading = true;
              } else if (data.status === "done" || progress === 100) {
                message = `Loading into memory... ${progress}%`;
                isDownloading = false;
              } else {
                message = isDownloading
                  ? `Downloading model... ${progress}%`
                  : `Loading into memory... ${progress}%`;
              }

              callbacks.onProgress(progress, message);
            }
          }
        },
      };

      const pipelineResult = await pipeline(
        "text-generation",
        modelId,
        pipelineOptions
      );

      generator = pipelineResult as TextGenerationPipeline;
      return generator;
    } catch (e) {
      const errorStr = String(e);
      console.error(`Model loading attempt ${attempts} failed:`, errorStr);

      // If SMARTER model fails, provide context-specific error and fall back
      if (currentSize === ModelType.SMARTER) {
        if (callbacks.onError) {
          callbacks.onError(
            `Sorry, we couldn't load the smarter model, so now you are talking with me - the dumber one! However, I am still able to answer basic questions about ${SITE_CONFIG.name || "this person"}, so please ask away!`
          );
          console.error(errorStr);
        }

        const nextSize = getNextSmallerModel(currentSize);
        if (nextSize) {
          currentSize = nextSize;
          if (callbacks.onFallback) {
            callbacks.onFallback(nextSize);
          }
          console.log(
            `Loading smarter model failed, falling back to: ${MODEL_IDS[nextSize]}`
          );
        } else {
          break;
        }
      } else {
        const isMemoryError =
          errorStr.includes("memory") || errorStr.includes("allocation");

        if (isMemoryError) {
          const nextSize = getNextSmallerModel(currentSize);

          if (!nextSize) {
            console.error("Already at Dumber model, cannot fallback further");
            break;
          }

          currentSize = nextSize;
          if (callbacks.onFallback) {
            callbacks.onFallback(nextSize);
          }
          console.log(`Memory error, falling back to: ${MODEL_IDS[nextSize]}`);
        } else {
          // Non-memory errors or network issues should stop attempts
          break;
        }
      }
    }
  }

  return null;
}
