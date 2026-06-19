/**
 * Model loader.
 * Handles loading the browser text generation model with dtype fallback.
 */

import {
  pipeline,
  env,
  type Text2TextGenerationPipeline,
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

export type GenerationTask = "text-generation" | "text2text-generation";

export type GenerationPipeline =
  | TextGenerationPipeline
  | Text2TextGenerationPipeline;

export type GenerationPipelineFactory = (
  task: GenerationTask,
  modelId: string,
  options: Record<string, unknown>
) => Promise<GenerationPipeline>;

export interface LoadedTextGenerationPipeline {
  task: "text-generation";
  generator: TextGenerationPipeline;
}

export interface LoadedText2TextGenerationPipeline {
  task: "text2text-generation";
  generator: Text2TextGenerationPipeline;
}

export type LoadedGenerationPipeline =
  | LoadedTextGenerationPipeline
  | LoadedText2TextGenerationPipeline;

export interface LoaderCallbacks {
  viewportWidth?: number;
  onProgress?: (progress: number, message: string) => void;
}

interface TransformerProgressData {
  progress?: number;
  status?: string;
}

interface NormalizedLoadError {
  message: string;
  isLikelyMemoryError: boolean;
  isNumericRuntimeCode: boolean;
  isLikelyTaskMismatch: boolean;
}

const DOWNLOAD_COMPLETE_PROGRESS = 100;
const MEMORY_LOADING_MESSAGE = "Loading into memory...";

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
      isLikelyTaskMismatch: false,
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
      isLikelyTaskMismatch: isLikelyTaskMismatchMessage(lower),
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
      isLikelyTaskMismatch: isLikelyTaskMismatchMessage(lower),
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
      isLikelyTaskMismatch: isLikelyTaskMismatchMessage(lower),
    };
  }

  return {
    message: String(error),
    isLikelyMemoryError: false,
    isNumericRuntimeCode: false,
    isLikelyTaskMismatch: false,
  };
}

export function isLikelyTaskMismatchMessage(message: string): boolean {
  const lower = message.toLowerCase();

  return (
    lower.includes("unsupported model type") ||
    lower.includes('for task "text-generation"') ||
    lower.includes("modelwithlmhead") ||
    lower.includes("modelforcausallm")
  );
}

function normalizeProgress(progress: number): number {
  return Math.min(DOWNLOAD_COMPLETE_PROGRESS, Math.max(0, Math.round(progress)));
}

async function createGenerationPipeline(
  task: GenerationTask,
  modelId: string,
  options: Record<string, unknown>
): Promise<GenerationPipeline> {
  if (task === "text-generation") {
    const pipelineResult = await pipeline("text-generation", modelId, options);
    return pipelineResult as TextGenerationPipeline;
  }

  const pipelineResult = await pipeline("text2text-generation", modelId, options);
  return pipelineResult as Text2TextGenerationPipeline;
}

/**
 * Loads the configured text generation model.
 * Dtype is selected from viewport-aware preferences with fallback ordering.
 */
export async function loadModel(
  callbacks: LoaderCallbacks = {},
  createPipeline: GenerationPipelineFactory = createGenerationPipeline
): Promise<LoadedGenerationPipeline | null> {
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
    let hasAggregateProgress = false;
    let hasReportedMemoryLoad = false;
    let lastDownloadProgress = 0;
    let lastReportedProgress = -1;
    let lastReportedMessage: string | null = null;

    const reportProgress = (progress: number, message: string): void => {
      if (!callbacks.onProgress) {
        return;
      }

      if (
        progress === lastReportedProgress &&
        message === lastReportedMessage
      ) {
        return;
      }

      lastReportedProgress = progress;
      lastReportedMessage = message;
      callbacks.onProgress(progress, message);
    };

    const reportMemoryLoad = (): void => {
      if (hasReportedMemoryLoad) {
        return;
      }

      hasReportedMemoryLoad = true;
      lastDownloadProgress = DOWNLOAD_COMPLETE_PROGRESS;
      reportProgress(DOWNLOAD_COMPLETE_PROGRESS, MEMORY_LOADING_MESSAGE);
    };

    const reportDownloadProgress = (rawProgress: number): void => {
      const progress = Math.max(
        lastDownloadProgress,
        normalizeProgress(rawProgress)
      );
      lastDownloadProgress = progress;

      if (progress >= DOWNLOAD_COMPLETE_PROGRESS) {
        reportMemoryLoad();
        return;
      }

      reportProgress(progress, `Downloading model... ${progress}%`);
    };

    const pipelineOptions: Record<string, unknown> = {
      dtype,
      device: "wasm",
      progress_callback: (progressData: unknown) => {
        if (typeof progressData !== "object" || progressData === null) {
          return;
        }

        const data = progressData as TransformerProgressData;

        if (!callbacks.onProgress) {
          return;
        }

        if (data.status === "ready") {
          reportMemoryLoad();
          return;
        }

        if (data.status === "done") {
          if (lastDownloadProgress >= DOWNLOAD_COMPLETE_PROGRESS) {
            reportMemoryLoad();
          }
          return;
        }

        if (
          typeof data.progress !== "number" ||
          !Number.isFinite(data.progress)
        ) {
          return;
        }

        if (data.status === "progress_total") {
          hasAggregateProgress = true;
          reportDownloadProgress(data.progress);
          return;
        }

        if (data.status === "progress" && !hasAggregateProgress) {
          reportDownloadProgress(data.progress);
        }
      },
    };

    try {
      logger.log(`loading model (${dtype}): ${MODEL_ID}`);

      const pipelineResult = await createPipeline(
        "text-generation",
        MODEL_ID,
        pipelineOptions
      );

      return {
        task: "text-generation",
        generator: pipelineResult as TextGenerationPipeline,
      };
    } catch (error) {
      const normalizedError = normalizeLoadError(error);
      const fallbackHint = normalizedError.isLikelyMemoryError
        ? "Likely memory/runtime pressure. Trying lower-memory dtype fallback."
        : "Trying next dtype fallback option.";

      logger.error(
        `attempt ${attempts} failed for ${dtype} (text-generation): ${normalizedError.message}`
      );

      if (normalizedError.isLikelyTaskMismatch) {
        logger.warn(
          `model ${MODEL_ID} appears incompatible with text-generation; retrying text2text-generation for the same dtype.`
        );

        try {
          const pipelineResult = await createPipeline(
            "text2text-generation",
            MODEL_ID,
            pipelineOptions
          );

          return {
            task: "text2text-generation",
            generator: pipelineResult as Text2TextGenerationPipeline,
          };
        } catch (fallbackError) {
          const normalizedFallbackError = normalizeLoadError(fallbackError);
          const fallbackTaskHint = normalizedFallbackError.isLikelyMemoryError
            ? "Likely memory/runtime pressure while retrying text2text-generation."
            : "Trying next dtype fallback option.";

          logger.error(
            `attempt ${attempts} failed for ${dtype} (text2text-generation): ${normalizedFallbackError.message}`
          );

          if (
            normalizedFallbackError.isLikelyMemoryError ||
            normalizedFallbackError.isNumericRuntimeCode
          ) {
            logger.warn(fallbackTaskHint);
            if (normalizedFallbackError.isNumericRuntimeCode) {
              logger.warn(
                "numeric runtime codes from ONNX/WebAssembly are often opaque; fallback will continue."
              );
            }
          }
        }
      }

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
