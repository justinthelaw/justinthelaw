/**
 * AI Context Provider
 * Generates conversation messages for Qwen2.5 models
 */

import { ModelType } from "@/types";
import { PROFILE, SITE_CONFIG } from "@/config/site";
import { CHATBOT_CONFIG } from "@/config/prompts";
import { MAX_SINGLE_MESSAGE_LENGTH } from "@/config/prompts";

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ResponseValidation {
  isValid: boolean;
  issues: string[];
}

/**
 * System message for LLM, with full profile context for DUMBER model
 * Built dynamically from the site config and profile data
 */
function buildSystemMessage(modelType: ModelType): string {
  if (modelType == ModelType.SMARTER) {
    return CHATBOT_CONFIG.systemPrompt;
  } else {
    const profileLines = [
      PROFILE.role ? `- Role: ${PROFILE.role}` : null,
      PROFILE.company ? `- Company: ${PROFILE.company}` : null,
      PROFILE.background ? `- Background: ${PROFILE.background}` : null,
      PROFILE.education ? `- Education: ${PROFILE.education}` : null,
      PROFILE.military ? `- Military Service: ${PROFILE.military}` : null,
      PROFILE.skills ? `- Technical Skills: ${PROFILE.skills}` : null,
      PROFILE.personality ? `- Personality: ${PROFILE.personality}` : null,
      PROFILE.interests ? `- Interests: ${PROFILE.interests}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return `${CHATBOT_CONFIG.systemPrompt}\nAbout ${SITE_CONFIG.name}:\n${profileLines}`;
  }
}

/**
 * Generate conversation messages based on model type
 * Single-turn only - no conversation history is passed
 */
export function generateConversationMessages(
  userInput: string,
  modelType: ModelType
): ChatMessage[] {
  const question = cleanInput(userInput);

  return [
    { role: "system", content: buildSystemMessage(modelType) },
    { role: "user", content: question },
  ];
}

/**
 * Sanitize user input
 */
export function cleanInput(input?: string): string {
  if (!input) return "";

  return input
    .replace(/`/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SINGLE_MESSAGE_LENGTH);
}
