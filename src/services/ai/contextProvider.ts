/**
 * AI Context Provider
 * Generates conversation context and messages optimized for SmolLM2 models
 */

import { ModelSize, type ProfileSection } from '@/types';
import {
  JUSTIN_PROFILE,
  RELEVANT_TERMS,
  CONTEXT_PRIORITIES,
} from '@/config/profile';
import {
  SYSTEM_INSTRUCTIONS,
  HISTORY_LIMITS,
  getAllocatedContextTokens,
  INPUT_CONSTRAINTS,
  VALIDATION_THRESHOLDS,
  EXPECTED_RESPONSE_LENGTHS,
} from '@/config/prompts';

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ResponseValidation {
  isValid: boolean;
  confidence: number;
  issues: string[];
}

/**
 * Generate structured context optimized for SmolLM2 instruction format
 */
function generateStructuredContext(
  modelSize: ModelSize,
  userQuery?: string
): string {
  const profile = JUSTIN_PROFILE;

  // Provide structured detail with query-aware prioritization
  if (userQuery) {
    const prioritizedContext = prioritizeContextForQuery(userQuery, profile);
    return `About Justin Law:\n${prioritizedContext}\n- Personality: ${profile.personality}`;
  }

  return `About Justin Law:
- Role: ${profile.role}  
- Company: ${profile.company}
- Background: ${profile.background}
- Education: ${profile.education}
- Military Service: ${profile.military}
- Technical Skills: ${profile.skills}
- Personality: ${profile.personality}
- Interests: ${profile.interests}`;
}

/**
 * Truncate text to fit model context limits while preserving important information
 */
function truncateForModel(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Try to truncate at sentence boundaries
  const sentences = text.split(/[.!?]+/);
  let result = '';

  for (const sentence of sentences) {
    const withSentence = result + sentence + '.';
    if (withSentence.length > maxLength) break;
    result = withSentence;
  }

  // If no complete sentences fit, truncate at word boundaries
  if (result.length < maxLength * 0.5) {
    const words = text.split(' ');
    result = '';
    for (const word of words) {
      const withWord = result + (result ? ' ' : '') + word;
      if (withWord.length > maxLength - 10) break;
      result = withWord;
    }
    result += '...';
  }

  return result;
}

/**
 * Build conversation history context for continuity
 */
export function buildConversationContext(
  modelSize: ModelSize,
  messageHistory: Array<{ type: string; content: string }>
): string {
  if (messageHistory.length === 0) return '';

  const historyLimit = HISTORY_LIMITS[modelSize];
  const recentHistory = messageHistory.slice(-historyLimit);

  const contextPairs = recentHistory
    .filter((msg) => msg.type === 'user' || msg.type === 'ai')
    .map(
      (msg) =>
        `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    )
    .join('\n');

  return contextPairs ? `\nRecent conversation:\n${contextPairs}\n` : '';
}

/**
 * Enhanced conversation message generation with model-aware optimization
 */
export function generateConversationMessages(
  userInput: string,
  modelSize: ModelSize,
  messageHistory: Array<{ type: string; content: string }> = []
): ChatMessage[] {
  const question = cleanInput(userInput);
  const contextLimit = getAllocatedContextTokens(modelSize);

  // Build structured context with query-aware prioritization
  const profileContext = generateStructuredContext(modelSize, question);
  const conversationContext = buildConversationContext(
    modelSize,
    messageHistory
  );
  const fullContext = profileContext + conversationContext;

  // Truncate context if needed
  const truncatedContext = truncateForModel(fullContext, contextLimit);

  // Build optimized system message
  const systemInstructions = SYSTEM_INSTRUCTIONS[modelSize];
  const systemMessage = `${systemInstructions}\n\nContext: ${truncatedContext}`;

  return [
    { role: 'system', content: systemMessage },
    { role: 'user', content: question },
  ];
}

/**
 * Enhanced input sanitization with better cleaning
 */
export function cleanInput(input?: string): string {
  if (!input) return '';

  return input
    .replace(/`/g, '') // Remove backticks
    .replace(/[<>]/g, '') // Remove potential HTML/XML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, INPUT_CONSTRAINTS.MAX_LENGTH); // Limit input length
}

/**
 * Response quality validation for SmolLM2 models
 */
export function validateResponse(
  response: string,
  modelSize: ModelSize
): ResponseValidation {
  const issues: string[] = [];
  let confidence = 1.0;

  // Basic sanity checks
  if (!response.trim()) {
    issues.push('Empty response');
    confidence = 0;
  }

  // Check for excessive repetition (common SmolLM2 issue)
  const words = response.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = words.length > 0 ? uniqueWords.size / words.length : 1;

  if (repetitionRatio < VALIDATION_THRESHOLDS.MIN_REPETITION_RATIO) {
    issues.push('High repetition detected');
    confidence *= 0.6;
  }

  // Check for gibberish patterns
  const gibberishPattern = /(.)\1{4,}|[^\w\s,.!?-]{3,}|^\W+$/;
  if (gibberishPattern.test(response)) {
    issues.push('Gibberish pattern detected');
    confidence *= 0.3;
  }

  // Check response length appropriateness for model size
  const expectedMaxLength = EXPECTED_RESPONSE_LENGTHS[modelSize];
  if (
    response.length >
    expectedMaxLength * VALIDATION_THRESHOLDS.MAX_LENGTH_MULTIPLIER
  ) {
    issues.push('Response too verbose for model size');
    confidence *= 0.8;
  }

  // Check if response seems relevant (contains key context clues)
  const containsRelevantInfo = RELEVANT_TERMS.some((term) =>
    response.toLowerCase().includes(term.toLowerCase())
  );

  if (
    !containsRelevantInfo &&
    response.length > VALIDATION_THRESHOLDS.MIN_RELEVANCE_LENGTH
  ) {
    issues.push('Response may lack context relevance');
    confidence *= 0.7;
  }

  return {
    isValid:
      confidence > VALIDATION_THRESHOLDS.MIN_CONFIDENCE &&
      issues.length < VALIDATION_THRESHOLDS.MAX_ISSUES,
    confidence,
    issues,
  };
}

/**
 * Advanced context prioritization for better relevance
 */
export function prioritizeContextForQuery(
  query: string,
  profile: ProfileSection
): string {
  const queryLower = query.toLowerCase();

  // Score each section based on query relevance
  const scoredSections = CONTEXT_PRIORITIES.map(
    ({ section, keywords, weight }) => {
      const relevanceScore = keywords.reduce((score, keyword) => {
        return queryLower.includes(keyword) ? score + weight : score;
      }, 0);

      return {
        section,
        score: relevanceScore,
        content: profile[section] || '',
      };
    }
  ).sort((a, b) => b.score - a.score);

  // Build prioritized context
  const topSections = scoredSections.filter((s) => s.score > 0).slice(0, 4);
  if (topSections.length === 0) {
    // No specific relevance found, return balanced summary
    return `${profile.role} at ${profile.company}. ${profile.background} ${profile.education}`;
  }

  return topSections.map((s) => `${s.section}: ${s.content}`).join('. ');
}
