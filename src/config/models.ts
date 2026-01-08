/**
 * Model Configuration
 * Constants and configurations for SmolLM2 models
 * DUMBER = Generic model (upstream HuggingFace)
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
  [ModelType.DUMBER]: "HuggingFaceTB/SmolLM2-360M-Instruct",
  [ModelType.SMARTER]:
    "justinthelaw/SmolLM2-360M-Instruct-Resume-Cover-Letter-SFT",
};

/**
 * User-friendly display names
 */
export const MODEL_DISPLAY_NAMES: Record<ModelType, string> = {
  [ModelType.DUMBER]: "Dumber",
  [ModelType.SMARTER]: "Smarter",
};

/**
 * Quantization type, defaults to unquantized
 */
export const MODEL_DTYPE = "fp32" as const;

/**
 * Lower-precision fallback dtypes for constrained environments
 */
export const MODEL_FALLBACK_DTYPES = ["q4", "int8"] as const;

/**
 * Ordered dtype options to try, from highest to lowest quality
 */
export const MODEL_DTYPE_OPTIONS = [
  MODEL_DTYPE,
  ...MODEL_FALLBACK_DTYPES,
] as const;

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
