/**
 * AI Prompt Configuration
 * System instructions and prompt templates optimized for SmolLM2 models
 */

import { ModelType, type GenerationParams } from "@/types";
import { SITE_CONFIG } from "./site";

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
    maxTokens: 96,
    topK: 30,
    repetitionPenalty: 1.2,
  },
  [ModelType.SMARTER]: {
    // Match pipeline/scripts/test_model.py test_onnx() parameters
    temperature: 0.0,
    maxTokens: 128,
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

/**
 * AI Chatbot Configuration
 * Customize the chatbot behavior and messages
 */
export const CHATBOT_CONFIG = {
  // Welcome messages shown randomly when chat opens or resets
  welcomeMessages: [
    `Hello, I am ${SITE_CONFIG.name}'s AI assistant! Got any questions for me?`,
    `Hey there! Got any questions about ${SITE_CONFIG.name} for me?`,
    `Hi! Interested in learning more about ${SITE_CONFIG.name}?`,
    `What would you like to know about ${SITE_CONFIG.name}?`,
    `I heard you had questions about ${SITE_CONFIG.name}? Just ask away!`,
    `Thanks for visiting! Do you want to learn more about ${SITE_CONFIG.name}?`,
  ],

  // System prompt template for DUMBER model (generic, not fine-tuned)
  // Uses profile data to provide context about the person
  // The SMARTER model is fine-tuned on resume data and doesn't need this
  systemPrompt: `You are ${SITE_CONFIG.fullName}'s AI assistant. Answer questions about ${SITE_CONFIG.name} using only the provided context. Give informative but concise answers in 1-3 short sentences.`,
} as const;
