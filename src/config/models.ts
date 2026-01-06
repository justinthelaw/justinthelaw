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
  [ModelType.SMARTER]: "justinthelaw/SmolLM2-360M-Instruct-Resume-Cover-Letter-SFT",
};

/**
 * User-friendly display names
 */
export const MODEL_DISPLAY_NAMES: Record<ModelType, string> = {
  [ModelType.DUMBER]: "Dumber",
  [ModelType.SMARTER]: "Smarter",
};

/**
 * Quantization type - auto-detect optimal format
 * transformers.js will select:
 * - q8/int8 for WASM/CPU (default for browser)
 * - fp32 for WebGPU
 */
export const MODEL_DTYPE = "auto" as const;

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
