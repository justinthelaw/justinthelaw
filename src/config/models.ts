/**
 * Model Configuration
 * Constants and configurations for SmolLM2 models
 */

import { ModelSize, type ModelConfig } from '@/types';

/**
 * Available model sizes
 */
export const MODEL_SIZES = [ModelSize.MEDIUM, ModelSize.LARGE] as const;

/**
 * HuggingFace model IDs for each size
 */
export const MODEL_IDS: Record<ModelSize, string> = {
  [ModelSize.MEDIUM]: 'HuggingFaceTB/SmolLM2-360M-Instruct',
  [ModelSize.LARGE]: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
};

/**
 * User-friendly display names
 */
export const MODEL_DISPLAY_NAMES: Record<ModelSize, string> = {
  [ModelSize.MEDIUM]: 'Medium',
  [ModelSize.LARGE]: 'Large',
};

/**
 * Quantization type for all models (auto-detect optimal format)
 */
export const MODEL_DTYPE = 'auto' as const;

/**
 * Approximate memory requirements in MB
 */
export const MODEL_MEMORY_REQUIREMENTS: Record<ModelSize, number> = {
  [ModelSize.MEDIUM]: 800,
  [ModelSize.LARGE]: 2000,
};

/**
 * Context length limits by model size (conservative estimates)
 */
export const MODEL_CONTEXT_LIMITS: Record<ModelSize, number> = {
  [ModelSize.MEDIUM]: 768,
  [ModelSize.LARGE]: 1024,
};

/**
 * Full model configurations
 */
export const MODEL_CONFIGS: Record<ModelSize, ModelConfig> = {
  [ModelSize.MEDIUM]: {
    id: MODEL_IDS[ModelSize.MEDIUM],
    size: ModelSize.MEDIUM,
    memoryRequirement: MODEL_MEMORY_REQUIREMENTS[ModelSize.MEDIUM],
    tokenLimit: MODEL_CONTEXT_LIMITS[ModelSize.MEDIUM],
    quantization: MODEL_DTYPE,
  },
  [ModelSize.LARGE]: {
    id: MODEL_IDS[ModelSize.LARGE],
    size: ModelSize.LARGE,
    memoryRequirement: MODEL_MEMORY_REQUIREMENTS[ModelSize.LARGE],
    tokenLimit: MODEL_CONTEXT_LIMITS[ModelSize.LARGE],
    quantization: MODEL_DTYPE,
  },
};

/**
 * Default model selection
 */
export const DEFAULT_MODEL_SIZE = ModelSize.MEDIUM;

/**
 * Device capability thresholds for auto-selection
 */
export const DEVICE_THRESHOLDS = {
  LARGE: {
    memory: 8 * 1024, // 8GB
    cores: 6,
  },
  MEDIUM: {
    memory: 4 * 1024, // 4GB
    cores: 4,
  },
} as const;
