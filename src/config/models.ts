/**
 * Model Configuration
 * Constants and configurations for SmolLM2 models
 * DUMBER = Generic model (generically trained)
 * SMARTER = Fine-tuned model (fine-tuned for better performance)
 */

import { ModelType, type ModelConfig } from "@/types";

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
 * Note: Fine-tuned model may be slightly larger due to additional weights
 */
export const MODEL_MEMORY_REQUIREMENTS: Record<ModelType, number> = {
  [ModelType.DUMBER]: 800,
  [ModelType.SMARTER]: 900,
};

/**
 * Context length limits by model size (conservative estimates)
 * Reduced for fine-tuned model since it trained with max_length=384
 */
export const MODEL_CONTEXT_LIMITS: Record<ModelType, number> = {
  [ModelType.DUMBER]: 768,
  [ModelType.SMARTER]: 512,
};

/**
 * Full model configurations
 */
export const MODEL_CONFIGS: Record<ModelType, ModelConfig> = {
  [ModelType.DUMBER]: {
    id: MODEL_IDS[ModelType.DUMBER],
    size: ModelType.DUMBER,
    memoryRequirement: MODEL_MEMORY_REQUIREMENTS[ModelType.DUMBER],
    tokenLimit: MODEL_CONTEXT_LIMITS[ModelType.DUMBER],
    quantization: MODEL_DTYPE,
  },
  [ModelType.SMARTER]: {
    id: MODEL_IDS[ModelType.SMARTER],
    size: ModelType.SMARTER,
    memoryRequirement: MODEL_MEMORY_REQUIREMENTS[ModelType.SMARTER],
    tokenLimit: MODEL_CONTEXT_LIMITS[ModelType.SMARTER],
    quantization: MODEL_DTYPE,
  },
};

/**
 * Default model selection (always use fine-tuned model)
 */
export const DEFAULT_MODEL_SIZE = ModelType.SMARTER;
