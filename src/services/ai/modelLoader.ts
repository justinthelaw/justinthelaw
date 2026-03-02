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
import {
  MODEL_IDS,
  getDeviceSpecificDtype,
  getDtypeFallbackOrder,
} from "@/config/models";
import { SITE_CONFIG } from "@/config/site";

// Configure environment for browser usage
env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

export interface LoaderCallbacks {
  viewportWidth?: number;
  onProgress?: (progress: number, message: string) => void;
  onFallback?: (newModel: ModelType) => void;
  onError?: (message: string) => void;
}

interface NormalizedLoadError {
  message: string;
  isLikelyMemoryError: boolean;
  isNumericRuntimeCode: boolean;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable error object]";
  }
}

function normalizeLoadError(error: unknown): NormalizedLoadError {
  if (typeof error === "number") {
    return {
      message: `Runtime error code: ${error}`,
      isLikelyMemoryError: true,
      isNumericRuntimeCode: true,
    };
  }

  if (typeof error === "string") {
    const lower = error.toLowerCase();
    return {
      message: error,
      isLikelyMemoryError:
        lower.includes("memory") ||
        lower.includes("allocation") ||
        lower.includes("out of bounds"),
      isNumericRuntimeCode: /^\d+$/.test(error.trim()),
    };
  }

  if (error instanceof Error) {
    const message = `${error.name}: ${error.message}`;
    const lower = message.toLowerCase();
    return {
      message,
      isLikelyMemoryError:
        lower.includes("memory") ||
        lower.includes("allocation") ||
        lower.includes("out of bounds"),
      isNumericRuntimeCode: false,
    };
  }

  if (typeof error === "object" && error !== null) {
    const maybeMessage =
      "message" in error && typeof error.message === "string"
        ? error.message
        : null;
    const maybeCode =
      "code" in error &&
      (typeof error.code === "string" || typeof error.code === "number")
        ? String(error.code)
        : null;

    const fallback = safeJsonStringify(error);
    const message = maybeCode
      ? `${maybeMessage ?? fallback} (code: ${maybeCode})`
      : maybeMessage ?? fallback;
    const lower = message.toLowerCase();

    return {
      message,
      isLikelyMemoryError:
        lower.includes("memory") ||
        lower.includes("allocation") ||
        lower.includes("out of bounds") ||
        (maybeCode !== null && /^\d+$/.test(maybeCode)),
      isNumericRuntimeCode: maybeCode !== null && /^\d+$/.test(maybeCode),
    };
  }

  return {
    message: String(error),
    isLikelyMemoryError: false,
    isNumericRuntimeCode: false,
  };
}

/**
 * Get the next smaller model size for fallback
 */
export function getNextSmallerModel(currentSize: ModelType): ModelType | null {
  if (currentSize === ModelType.SMARTER) return ModelType.DUMBER;
  return null; // Already at smallest (DUMBER)
}

/**
 * Loads a text generation model with model size fallback on failure
 * Dtype is selected from viewport-aware preferences with fallback ordering.
 */
export async function loadModelWithFallback(
  modelType: ModelType,
  callbacks: LoaderCallbacks = {}
): Promise<TextGenerationPipeline | null> {
  let generator: TextGenerationPipeline | null = null;
  let attempts = 0;
  let smarterErrorReported = false;

  const preferredDtype = getDeviceSpecificDtype(callbacks.viewportWidth);
  const dtypeFallbackOrder = getDtypeFallbackOrder(preferredDtype);

  console.log(
    `Using dtype preference ${preferredDtype} with fallback order: ${dtypeFallbackOrder.join(
      " -> "
    )}`
  );

  let currentSize: ModelType | null = modelType;

  while (currentSize && !generator) {
    const modelId = MODEL_IDS[currentSize];

    for (const dtype of dtypeFallbackOrder) {
      attempts++;
      try {
        console.log(`Loading ${currentSize} model (${dtype}): ${modelId}`);

        // Track if we're in download phase (first time seeing progress)
        let isDownloading = true;

        const pipelineOptions: Record<string, unknown> = {
          dtype,
          device: "wasm",
          progress_callback: (progressData: unknown) => {
            if (typeof progressData === "object" && progressData !== null) {
              const data = progressData as {
                progress?: number;
                status?: string;
              };
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
      } catch (error) {
        const normalizedError = normalizeLoadError(error);
        const fallbackHint = normalizedError.isLikelyMemoryError
          ? "Likely memory/runtime pressure. Trying lower-memory fallback."
          : "Trying next fallback option.";

        console.error(
          `Model loading attempt ${attempts} failed for ${currentSize} (${dtype}): ${normalizedError.message}`
        );
        if (
          normalizedError.isLikelyMemoryError ||
          normalizedError.isNumericRuntimeCode
        ) {
          console.warn(fallbackHint);
          if (normalizedError.isNumericRuntimeCode) {
            console.warn(
              "Numeric runtime codes from ONNX/WebAssembly are often opaque; fallback will continue."
            );
          }
        }
      }
    }

    if (currentSize === ModelType.SMARTER) {
      if (!smarterErrorReported && callbacks.onError) {
        callbacks.onError(
          `Sorry, we couldn't load the smarter model, so now you are talking with me - the dumber one! However, I am still able to answer basic questions about ${SITE_CONFIG["name"]}, so please ask away!`
        );
        smarterErrorReported = true;
      }

      const nextSize = getNextSmallerModel(currentSize);
      if (nextSize) {
        currentSize = nextSize;
        if (callbacks.onFallback) {
          callbacks.onFallback(nextSize);
        }
        console.log(
          `Loading smarter model failed across dtype fallbacks, switching to: ${MODEL_IDS[nextSize]}`
        );
      } else {
        currentSize = null;
      }
    } else {
      currentSize = null;
    }
  }

  return null;
}
