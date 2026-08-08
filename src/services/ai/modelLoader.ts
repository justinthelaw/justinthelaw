/**
 * Model loader.
 * Handles loading the browser text-to-text generation model with dtype fallback.
 */

import {
  pipeline,
  env,
  type Text2TextGenerationPipeline,
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
const GENERATION_TASK = "text2text-generation" as const;

export type GenerationPipelineFactory = (
  task: typeof GENERATION_TASK,
  modelId: string,
  options: Record<string, unknown>
) => Promise<Text2TextGenerationPipeline>;

export interface LoadedGenerationPipeline {
  task: typeof GENERATION_TASK;
  generator: Text2TextGenerationPipeline;
}

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

function normalizeProgress(progress: number): number {
  return Math.min(DOWNLOAD_COMPLETE_PROGRESS, Math.max(0, Math.round(progress)));
}

async function createGenerationPipeline(
  task: typeof GENERATION_TASK,
  modelId: string,
  options: Record<string, unknown>
): Promise<Text2TextGenerationPipeline> {
  const pipelineResult = await pipeline(task, modelId, options);
  return pipelineResult as Text2TextGenerationPipeline;
}

/**
 * Loads the configured text-to-text generation model.
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
        GENERATION_TASK,
        MODEL_ID,
        pipelineOptions
      );

      return {
        task: GENERATION_TASK,
        generator: pipelineResult,
      };
    } catch (error) {
      const normalizedError = normalizeLoadError(error);
      const fallbackHint = normalizedError.isLikelyMemoryError
        ? "Likely memory/runtime pressure. Trying lower-memory dtype fallback."
        : "Trying next dtype fallback option.";

      logger.error(
        `attempt ${attempts} failed for ${dtype} (${GENERATION_TASK}): ${normalizedError.message}`
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
