/**
 * Model Configuration
 * Constants and configurations for Qwen2.5 models
 * DUMBER = Generic model (public HuggingFace ONNX)
 * SMARTER = Fine-tuned model (resume-specific SFT+LoRA)
 */

import { ModelType } from "@/types";

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

export type ModelDtype = "fp32" | "int8" | "uint8" | "q4";

/**
 * Get the preferred dtype for browser loading.
 * Browser loading defaults to int8 because the q4 artifacts for these ONNX
 * models can require external data mounting that is not reliable in ORT WASM.
 */
export function getDeviceSpecificDtype(_viewportWidth?: number): ModelDtype {
  return "int8";
}

/**
 * Ordered dtype options to try, with the preferred dtype first.
 * Automatic fallback skips q4 to avoid external `.onnx.data` runtime failures
 * in browser WebAssembly. fp32 is kept for explicit/manual diagnostics.
 */
export function getDtypeFallbackOrder(preferredDtype: ModelDtype): ModelDtype[] {
  if (preferredDtype === "uint8") {
    return ["uint8", "int8"];
  }
  if (preferredDtype === "int8") {
    return ["int8", "uint8"];
  }
  if (preferredDtype === "q4") {
    return ["int8", "uint8"];
  }
  return ["fp32", "int8", "uint8"];
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
