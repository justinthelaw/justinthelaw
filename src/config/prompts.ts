/**
 * AI prompt configuration.
 */

import type { GenerationParams } from "@/types";
import { PROFILE_SUBJECT, type ProfileSubject } from "./site";

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
export const MAX_SINGLE_MESSAGE_LENGTH = 1200;

/**
 * AI chatbot configuration.
 */
function possessive(value: string): string {
  return value.endsWith("s") ? `${value}'` : `${value}'s`;
}

export function createGenerationStatusMessages(
  subject: ProfileSubject,
): readonly string[] {
  const shortName = subject.shortName;
  const possessiveShortName = possessive(shortName);

  return [
    `Reading ${possessiveShortName} secret diary...`,
    `Calling ${shortName} right now...`,
    `Decoding ${possessiveShortName} commits...`,
    `Skimming ${possessiveShortName} highlight reel...`,
    `Checking ${possessiveShortName} receipts...`,
    `Consulting ${possessiveShortName} rubber duck...`,
    `Connecting ${possessiveShortName} career dots...`,
    `Paging through ${possessiveShortName} lore...`,
    `Dusting off ${possessiveShortName} brag book...`,
    `Channeling my inner ${shortName}...`,
  ] as const;
}

export function createChatbotConfig(subject: ProfileSubject) {
  return {
    welcomeMessages: [
      `Hello, I am ${possessive(subject.shortName)} AI assistant! Got any questions for me?`,
      `Hey there! Got any questions about ${subject.shortName} for me?`,
      `Hi! Interested in learning more about ${subject.shortName}?`,
      `What would you like to know about ${subject.shortName}?`,
      `I heard you had questions about ${subject.shortName}? Just ask away!`,
      `Thanks for visiting! Do you want to learn more about ${subject.shortName}?`,
    ],

    generationStatusMessages: createGenerationStatusMessages(subject),

    systemPrompt: `You are ${possessive(subject.name)} AI assistant. Use only the provided context. Reply in 1-2 short sentences. If the answer is absent, say the context does not say.`,
  } as const;
}

export const CHATBOT_CONFIG = createChatbotConfig(PROFILE_SUBJECT);
export const GENERATION_STATUS_MESSAGES =
  CHATBOT_CONFIG.generationStatusMessages;
