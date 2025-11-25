/**
 * AI Prompt Configuration
 * System instructions and prompt templates optimized for SmolLM2 models
 */

import { ModelSize, type GenerationParams } from '@/types';
import { MODEL_CONTEXT_LIMITS } from './models';

/**
 * Model-specific generation parameters for optimal SmolLM2 performance
 */
export const GENERATION_PARAMS: Record<ModelSize, GenerationParams> = {
  [ModelSize.MEDIUM]: {
    temperature: 0.15,
    maxTokens: 96,
    topK: 50,
    repetitionPenalty: 1.15,
  },
  [ModelSize.LARGE]: {
    temperature: 0.2,
    maxTokens: 128,
    topK: 50,
    repetitionPenalty: 1.2,
  },
};

/**
 * Base system instruction for all models
 */
export const BASE_SYSTEM_INSTRUCTION =
  "You are Justin Law's AI assistant. Answer questions about Justin using only the provided context.";

/**
 * Model-specific system instructions
 */
export const SYSTEM_INSTRUCTIONS: Record<ModelSize, string> = {
  [ModelSize.MEDIUM]: `${BASE_SYSTEM_INSTRUCTION} Provide brief, accurate responses based on the context. Limit to 2-3 sentences.`,
  [ModelSize.LARGE]: `${BASE_SYSTEM_INSTRUCTION} Give informative but concise answers. Stay factual and context-based.`,
};

/**
 * Chat history limits by model size
 */
export const HISTORY_LIMITS: Record<ModelSize, number> = {
  [ModelSize.MEDIUM]: 4,
  [ModelSize.LARGE]: 6,
};

/**
 * Context allocation ratios (how much of token limit to use for context)
 */
export const CONTEXT_ALLOCATION_RATIO = 0.7;

/**
 * Input sanitization limits
 */
export const INPUT_CONSTRAINTS = {
  MAX_LENGTH: 200,
  MAX_WORDS: 50,
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
  [ModelSize.MEDIUM]: 150,
  [ModelSize.LARGE]: 200,
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
