/**
 * Model Configuration
 * Constants and configurations for Qwen2.5 models
 * DUMBER = Generic model (public HuggingFace ONNX)
 * SMARTER = Fine-tuned model (resume-specific SFT+LoRA)
 */

import { ModelType } from "@/types";
import { isMobileDevice } from "@/utils";

/**
 * Available model sizes
 */
export const MODEL_SIZES = [ModelType.DUMBER, ModelType.SMARTER] as const;

/**
 * HuggingFace model IDs for each size
 */
export const MODEL_IDS: Record<ModelType, string> = {
  [ModelType.DUMBER]: "onnx-community/Qwen2.5-0.5B-Instruct",
  [ModelType.SMARTER]:
    "justinthelaw/Qwen2.5-0.5B-Instruct-Resume-Cover-Letter-SFT",
};

/**
 * User-friendly display names
 */
export const MODEL_DISPLAY_NAMES: Record<ModelType, string> = {
  [ModelType.DUMBER]: "Dumber",
  [ModelType.SMARTER]: "Smarter",
};

export type ModelDtype = "fp32" | "int8" | "q4";

/**
 * Get the preferred dtype based on viewport width.
 * Mobile/tablet defaults to q4 for reliability, desktop defaults to int8 to
 * avoid fp32 WebAssembly memory pressure during initial load.
 */
export function getDeviceSpecificDtype(viewportWidth?: number): ModelDtype {
  const isNarrowViewport =
    typeof viewportWidth === "number" ? viewportWidth < 1024 : isMobileDevice();
  return isNarrowViewport ? "q4" : "int8";
}

/**
 * Ordered dtype options to try, with the preferred dtype first.
 * Desktop prefers int8 and falls back to q4; fp32 is kept for explicit/manual selection.
 */
export function getDtypeFallbackOrder(preferredDtype: ModelDtype): ModelDtype[] {
  if (preferredDtype === "int8") {
    return ["int8", "q4"];
  }
  if (preferredDtype === "q4") {
    return ["q4", "int8"];
  }
  return ["fp32", "int8", "q4"];
}

/**
 * Context length limits by model size (conservative estimates)
 */
export const MODEL_CONTEXT_LIMITS: Record<ModelType, number> = {
  [ModelType.DUMBER]: 512,
  [ModelType.SMARTER]: 1024,
};

/**
 * Default model selection
 */
export const DEFAULT_MODEL_SIZE = ModelType.SMARTER;
