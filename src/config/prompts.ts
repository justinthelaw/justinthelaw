/**
 * AI Prompt Configuration
 * System instructions and prompt templates optimized for SmolLM2 models
 */

import { ModelType, type GenerationParams } from "@/types";

/**
 * Model-specific generation parameters for optimal SmolLM2 performance
 *
 * SMARTER (fine-tuned): Uses greedy decoding (do_sample=false) for consistent
 * factual recall. Parameters match pipeline/scripts/test_model.py test_onnx().
 *
 * DUMBER (base model): Needs slightly higher temp for creativity since
 * it relies on context injection rather than fine-tuned knowledge.
 */
export const GENERATION_PARAMS: Record<ModelType, GenerationParams> = {
  [ModelType.DUMBER]: {
    temperature: 0.3,
    maxTokens: 128,
    topK: 30,
    repetitionPenalty: 1.2,
  },
  [ModelType.SMARTER]: {
    // Match pipeline/scripts/test_model.py test_onnx() parameters
    temperature: 0.0,
    maxTokens: 80,
    topK: 0,
    repetitionPenalty: 1.2,
  },
};

/**
 * Input sanitization limits
 */
export const INPUT_CONSTRAINTS = {
  MAX_LENGTH: 256,
  MAX_WORDS: 64,
} as const;
