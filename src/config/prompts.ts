/**
 * AI Prompt Configuration
 * System instructions and prompt templates optimized for SmolLM2 models
 */

import { ModelType, type GenerationParams } from "@/types";

/**
 * Model-specific generation parameters for optimal SmolLM2 performance
 *
 * SMARTER (fine-tuned): Lower temperature for consistent factual recall,
 * higher repetition penalty to avoid loops, moderate max tokens
 *
 * DUMBER (base model): Needs slightly higher temp for creativity since
 * it relies on context, lower repetition penalty
 */
export const GENERATION_PARAMS: Record<ModelType, GenerationParams> = {
  [ModelType.DUMBER]: {
    temperature: 0.2,
    maxTokens: 128,
    topK: 40,
    repetitionPenalty: 1.2,
  },
  [ModelType.SMARTER]: {
    temperature: 0.1,  // Ignored when do_sample=false (greedy decoding)
    maxTokens: 80,     // Shorter for concise factual answers
    topK: 30,          // Ignored when do_sample=false (greedy decoding)
    repetitionPenalty: 1.2,  // Match test script for consistent behavior
  },
};

/**
 * Input sanitization limits
 */
export const INPUT_CONSTRAINTS = {
  MAX_LENGTH: 256,
  MAX_WORDS: 64,
} as const;
