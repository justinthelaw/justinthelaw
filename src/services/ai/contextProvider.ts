/**
 * AI Context Provider
 * Generates conversation messages for SmolLM2 models
 */

import { ModelType } from "@/types";
import { PROFILE, SITE_CONFIG, CHATBOT_CONFIG } from "@/config/site";
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
 * Minimal system message for SMARTER (fine-tuned) model
 * The model has learned facts about the person during training,
 * but needs a brief identity reminder for proper association
 * NOTE: Must match the system prompt used in training (pipeline/config.yaml)
 */
function buildSmarterSystemMessage(): string {
  // Training uses full name for "X's AI assistant" and short name for "about X"
  // This matches: "You are Justin Law's AI assistant. Answer questions about Justin accurately and concisely."
  const fullName = SITE_CONFIG.name; // "Justin Law"
  const shortName = SITE_CONFIG.name.split(" ")[0]; // "Justin"
  return `You are ${fullName}'s AI assistant. Answer questions about ${shortName} accurately and concisely.`;
}

/**
 * System message for DUMBER model with full profile context
 * Built dynamically from site config and profile data
 */
function buildDumberSystemMessage(): string {
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
    .join("\\n");

  return `${CHATBOT_CONFIG.dumberSystemPrompt}

About ${SITE_CONFIG.name}:
${profileLines}`;
}

/**
 * Number of recent user/assistant message pairs to include for SMARTER model
 */
const SMARTER_HISTORY_PAIRS = 2;

/**
 * Generate conversation messages based on model type
 */
export function generateConversationMessages(
  userInput: string,
  modelType: ModelType,
  messageHistory: Array<{ type: string; content: string }> = []
): ChatMessage[] {
  const question = cleanInput(userInput);

  // SMARTER model: fine-tuned, needs minimal system context + recent history
  if (modelType === ModelType.SMARTER) {
    const messages: ChatMessage[] = [];

    // Add minimal system message for identity context
    messages.push({ role: "system", content: buildSmarterSystemMessage() });

    // Add last 2 user/assistant pairs from history
    const historyMessages = buildHistoryMessages(
      messageHistory,
      SMARTER_HISTORY_PAIRS
    );
    messages.push(...historyMessages);

    // Add current user question
    messages.push({ role: "user", content: question });

    return messages;
  }

  // DUMBER model: needs full context in system message, no history
  return [
    { role: "system", content: buildDumberSystemMessage() },
    { role: "user", content: question },
  ];
}

/**
 * Build chat history messages from recent conversation pairs
 */
function buildHistoryMessages(
  messageHistory: Array<{ type: string; content: string }>,
  pairCount: number
): ChatMessage[] {
  if (messageHistory.length === 0) return [];

  // Filter to only user and ai messages
  const relevantMessages = messageHistory.filter(
    (msg) => msg.type === "user" || msg.type === "ai"
  );

  // Take the last N pairs (2 * pairCount messages)
  const messageCount = pairCount * 2;
  const recentMessages = relevantMessages.slice(-messageCount);

  return recentMessages.map((msg) => ({
    role: msg.type === "user" ? "user" : "assistant",
    content: msg.content,
  }));
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
