/**
 * Model Configuration
 * Constants and configurations for SmolLM2 models
 * DUMBER = Generic model (generically trained)
 * SMARTER = Fine-tuned model (fine-tuned for better performance)
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
  [ModelType.SMARTER]: "justinthelaw/SmolLM2-360M-Instruct_Resume-SFT-DPO",
};

/**
 * User-friendly display names
 */
export const MODEL_DISPLAY_NAMES: Record<ModelType, string> = {
  [ModelType.DUMBER]: "Dumber",
  [ModelType.SMARTER]: "Smarter",
};

/**
 * Quantization type for all models (auto-detect optimal format)
 */
export const MODEL_DTYPE = "auto" as const;

/**
 * Approximate memory requirements in MB
 * The fine-tuned model is larger due to non-quantization
 */
export const MODEL_MEMORY_REQUIREMENTS: Record<ModelType, number> = {
  [ModelType.DUMBER]: 800,
  [ModelType.SMARTER]: 2000,
};

/**
 * Context length limits by model size (conservative estimates)
 */
export const MODEL_CONTEXT_LIMITS: Record<ModelType, number> = {
  [ModelType.DUMBER]: 512,
  [ModelType.SMARTER]: 1024,
};

/**
 * Default model selection (always use fine-tuned model)
 */
export const DEFAULT_MODEL_SIZE = ModelType.SMARTER;
