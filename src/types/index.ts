/**
 * Shared TypeScript type definitions
 * Domain models and interfaces used across the application
 */

/**
 * Chat message in the conversation history
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

/**
 * Sanitized conversation turn sent to the AI worker.
 */
export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * AI generation parameters
 */
export interface GenerationParams {
  temperature: number;
  maxTokens: number;
  topK: number;
  repetitionPenalty: number;
}

/**
 * Loading state for async operations
 */
export interface LoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
}

/**
 * Error state
 */
export interface ErrorState {
  hasError: boolean;
  message?: string;
}
