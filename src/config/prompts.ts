/**
 * AI Prompt Configuration
 * System instructions and prompt templates optimized for SmolLM2 models
 */

import { ModelSize, type GenerationParams } from "@/types";
import { MODEL_CONTEXT_LIMITS } from "./models";
import { SITE_CONFIG } from "./site";

/**
 * Model-specific generation parameters for optimal SmolLM2 performance
 */
export const GENERATION_PARAMS: Record<ModelSize, GenerationParams> = {
  [ModelSize.DUMBER]: {
    temperature: 0.1,
    maxTokens: 128,
    topK: 50,
    repetitionPenalty: 1.3,
  },
  [ModelSize.SMARTER]: {
    temperature: 0.2,
    maxTokens: 256,
    topK: 50,
    repetitionPenalty: 1.1,
  },
};

/**
 * Base system instruction for all models
 */
export const BASE_SYSTEM_INSTRUCTION = `You are ${SITE_CONFIG.name}'s AI assistant. Answer questions about ${SITE_CONFIG.name} using only the provided context. Give informative but concise answers. Stay factual and context-based.`;

/**
 * Model-specific system instructions
 */
export const SYSTEM_INSTRUCTIONS: Record<ModelSize, string> = {
  [ModelSize.DUMBER]: `${BASE_SYSTEM_INSTRUCTION} Limit to 1-3 short sentences.`,
  [ModelSize.SMARTER]: `${BASE_SYSTEM_INSTRUCTION} Limit to 3-4 short sentences.`,
};

/**
 * Chat history limits by model size
 */
export const HISTORY_LIMITS: Record<ModelSize, number> = {
  [ModelSize.DUMBER]: 3,
  [ModelSize.SMARTER]: 5,
};

/**
 * Context allocation ratios (how much of token limit to use for context)
 */
export const CONTEXT_ALLOCATION_RATIO = 0.75;

/**
 * Input sanitization limits
 */
export const INPUT_CONSTRAINTS = {
  MAX_LENGTH: 256,
  MAX_WORDS: 64,
} as const;

/**
 * Response validation thresholds
 */
export const VALIDATION_THRESHOLDS = {
  MIN_CONFIDENCE: 0.3,
  MAX_ISSUES: 4,
  MIN_REPETITION_RATIO: 0.3,
  MAX_LENGTH_MULTIPLIER: 3.0,
  MIN_RELEVANCE_LENGTH: 50,
} as const;

/**
 * Expected response lengths by model size
 */
export const EXPECTED_RESPONSE_LENGTHS: Record<ModelSize, number> = {
  [ModelSize.DUMBER]: 128,
  [ModelSize.SMARTER]: 256,
};

/**
 * Get context limit for a model size
 */
export function getContextLimit(modelSize: ModelSize): number {
  return MODEL_CONTEXT_LIMITS[modelSize];
}

/**
 * Get allocated context tokens for a model size
 */
export function getAllocatedContextTokens(modelSize: ModelSize): number {
  return Math.floor(getContextLimit(modelSize) * CONTEXT_ALLOCATION_RATIO);
}
