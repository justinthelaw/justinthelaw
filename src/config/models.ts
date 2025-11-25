/**
 * Model Configuration
 * Constants and configurations for SmolLM2 models
 * DUMBER = Generic model (generically trained)
 * SMARTER = Fine-tuned model (fine-tuned for better performance)
 */

import { ModelSize, type ModelConfig } from '@/types';

/**
 * Available model sizes
 */
export const MODEL_SIZES = [ModelSize.DUMBER, ModelSize.SMARTER] as const;

/**
 * HuggingFace model IDs for each size
 */
export const MODEL_IDS: Record<ModelSize, string> = {
  [ModelSize.DUMBER]: 'HuggingFaceTB/SmolLM-360M-Instruct',
  [ModelSize.SMARTER]: 'HuggingFaceTB/SmolLM2-360M-Instruct',
};

/**
 * User-friendly display names
 */
export const MODEL_DISPLAY_NAMES: Record<ModelSize, string> = {
  [ModelSize.DUMBER]: 'Dumber',
  [ModelSize.SMARTER]: 'Smarter',
};

/**
 * Quantization type for all models (auto-detect optimal format)
 */
export const MODEL_DTYPE = 'auto' as const;

/**
 * Approximate memory requirements in MB
 */
export const MODEL_MEMORY_REQUIREMENTS: Record<ModelSize, number> = {
  [ModelSize.DUMBER]: 800,
  [ModelSize.SMARTER]: 2000,
};

/**
 * Context length limits by model size (conservative estimates)
 */
export const MODEL_CONTEXT_LIMITS: Record<ModelSize, number> = {
  [ModelSize.DUMBER]: 768,
  [ModelSize.SMARTER]: 1024,
};

/**
 * Full model configurations
 */
export const MODEL_CONFIGS: Record<ModelSize, ModelConfig> = {
  [ModelSize.DUMBER]: {
    id: MODEL_IDS[ModelSize.DUMBER],
    size: ModelSize.DUMBER,
    memoryRequirement: MODEL_MEMORY_REQUIREMENTS[ModelSize.DUMBER],
    tokenLimit: MODEL_CONTEXT_LIMITS[ModelSize.DUMBER],
    quantization: MODEL_DTYPE,
  },
  [ModelSize.SMARTER]: {
    id: MODEL_IDS[ModelSize.SMARTER],
    size: ModelSize.SMARTER,
    memoryRequirement: MODEL_MEMORY_REQUIREMENTS[ModelSize.SMARTER],
    tokenLimit: MODEL_CONTEXT_LIMITS[ModelSize.SMARTER],
    quantization: MODEL_DTYPE,
  },
};

/**
 * Default model selection (always use fine-tuned model)
 */
export const DEFAULT_MODEL_SIZE = ModelSize.SMARTER;
