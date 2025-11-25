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
 * Model size options
 */
export enum ModelSize {
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

/**
 * Model configuration
 */
export interface ModelConfig {
  id: string;
  size: ModelSize;
  memoryRequirement: number;
  tokenLimit: number;
  quantization: string;
}

/**
 * Profile section for AI context
 */
export interface ProfileSection {
  role?: string;
  company?: string;
  background?: string;
  education?: string;
  military?: string;
  skills?: string;
  personality?: string;
  interests?: string;
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
 * Device capabilities for model selection
 */
export interface DeviceCapabilities {
  memory: number;
  cores: number;
  isMobile: boolean;
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
