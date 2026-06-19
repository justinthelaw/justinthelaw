/**
 * Model loader.
 * Handles loading the browser text generation model with dtype fallback.
 */

import {
  pipeline,
  env,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import {
  MODEL_ID,
  getDeviceSpecificDtype,
  getDtypeFallbackOrder,
} from "@/config/models";
import { createLogger, LOG_AREAS } from "@/utils";

env.allowLocalModels = false;
env.remoteHost = "https://huggingface.co";

const logger = createLogger(LOG_AREAS.AI_MODEL_LOADER);

export interface LoaderCallbacks {
  viewportWidth?: number;
  onProgress?: (progress: number, message: string) => void;
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
 * Loads the configured text generation model.
 * Dtype is selected from viewport-aware preferences with fallback ordering.
 */
export async function loadModel(
  callbacks: LoaderCallbacks = {}
): Promise<TextGenerationPipeline | null> {
  let attempts = 0;
  const preferredDtype = getDeviceSpecificDtype(callbacks.viewportWidth);
  const dtypeFallbackOrder = getDtypeFallbackOrder(preferredDtype);

  logger.log(
    `dtype preference ${preferredDtype}; fallback order ${dtypeFallbackOrder.join(
      " -> "
    )}`
  );

  for (const dtype of dtypeFallbackOrder) {
    attempts++;
    try {
      logger.log(`loading model (${dtype}): ${MODEL_ID}`);

      let isDownloading = true;

      const pipelineOptions: Record<string, unknown> = {
        dtype,
        device: "wasm",
        progress_callback: (progressData: unknown) => {
          if (typeof progressData !== "object" || progressData === null) {
            return;
          }

          const data = progressData as {
            progress?: number;
            status?: string;
          };

          if (data.progress === undefined || !callbacks.onProgress) {
            return;
          }

          const progress = Math.round(data.progress);
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
        },
      };

      const pipelineResult = await pipeline(
        "text-generation",
        MODEL_ID,
        pipelineOptions
      );

      return pipelineResult as TextGenerationPipeline;
    } catch (error) {
      const normalizedError = normalizeLoadError(error);
      const fallbackHint = normalizedError.isLikelyMemoryError
        ? "Likely memory/runtime pressure. Trying lower-memory dtype fallback."
        : "Trying next dtype fallback option.";

      logger.error(
        `attempt ${attempts} failed for ${dtype}: ${normalizedError.message}`
      );
      if (
        normalizedError.isLikelyMemoryError ||
        normalizedError.isNumericRuntimeCode
      ) {
        logger.warn(fallbackHint);
        if (normalizedError.isNumericRuntimeCode) {
          logger.warn(
            "numeric runtime codes from ONNX/WebAssembly are often opaque; fallback will continue."
          );
        }
      }
    }
  }

  return null;
}
