/**
 * AI Context Provider
 * Generates conversation messages for SmolLM2 models
 */

import { ModelType } from "@/types";
import { PROFILE, SITE_CONFIG } from "@/config/site";
import { CHATBOT_CONFIG } from "@/config/prompts";
import { INPUT_CONSTRAINTS } from "@/config/prompts";

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ResponseValidation {
  isValid: boolean;
  issues: string[];
}

/**
 * System message for DUMBER model with full profile context
 * Built dynamically from site config and profile data
 */
function buildSystemMessage(): string {
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

  return `${CHATBOT_CONFIG.systemPrompt}

About ${SITE_CONFIG.name}:
${profileLines}`;
}

/**
 * Generate conversation messages based on model type
 * Single-turn only - no conversation history is passed
 */
export function generateConversationMessages(userInput: string): ChatMessage[] {
  const question = cleanInput(userInput);

  return [
    { role: "system", content: buildSystemMessage() },
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
    .slice(0, INPUT_CONSTRAINTS.MAX_LENGTH);
}

/**
 * Basic response validation
 */
export function validateResponse(
  response: string,
  _modelType: ModelType
): ResponseValidation {
  const issues: string[] = [];

  if (!response.trim()) {
    issues.push("Empty response");
  }

  // Check for excessive repetition
  const words = response.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio =
    words.length > 0 ? uniqueWords.size / words.length : 1;

  if (repetitionRatio < 0.3) {
    issues.push("High repetition detected");
  }

  // Check for gibberish patterns
  const gibberishPattern = /(.)\1{4,}|[^\w\s,.!?-]{3,}|^\W+$/;
  if (gibberishPattern.test(response)) {
    issues.push("Gibberish pattern detected");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
