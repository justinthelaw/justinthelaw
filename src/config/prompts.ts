/**
 * AI prompt configuration.
 */

import type { GenerationParams } from "@/types";
import { SITE_CONFIG } from "./site";

/**
 * Generation parameters for the browser model.
 */
export const GENERATION_PARAMS: GenerationParams = {
  temperature: 0.3,
  maxTokens: 128,
  topK: 30,
  repetitionPenalty: 1.5,
};

/**
 * Context length limit for a single user message.
 */
export const MAX_SINGLE_MESSAGE_LENGTH = 88;

/**
 * AI chatbot configuration.
 */
export const CHATBOT_CONFIG = {
  welcomeMessages: [
    `Hello, I am ${SITE_CONFIG.name}'s AI assistant! Got any questions for me?`,
    `Hey there! Got any questions about ${SITE_CONFIG.name} for me?`,
    `Hi! Interested in learning more about ${SITE_CONFIG.name}?`,
    `What would you like to know about ${SITE_CONFIG.name}?`,
    `I heard you had questions about ${SITE_CONFIG.name}? Just ask away!`,
    `Thanks for visiting! Do you want to learn more about ${SITE_CONFIG.name}?`,
  ],

  systemPrompt: `You are ${SITE_CONFIG.fullName}'s AI assistant. Use only the provided context. Reply in 1-2 short sentences. If the answer is absent, say the context does not say.`,
} as const;
