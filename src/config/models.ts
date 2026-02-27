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

/**
 * Get the appropriate dtype based on device type
 * Mobile devices use q4 for efficiency, desktops use fp32 for quality
 */
export function getDeviceSpecificDtype(): "fp32" | "q4" {
  return isMobileDevice() ? "q4" : "fp32";
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
