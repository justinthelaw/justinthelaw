/**
 * AI Service
 * Clean API for interacting with the AI worker
 */

import { ModelType } from '@/types';
import { WorkerAction, type WorkerResponse } from '@/types/worker';

export type AIServiceCallback = (response: WorkerResponse) => void;

export class AIService {
  private worker: Worker | null = null;
  private callbacks: Set<AIServiceCallback> = new Set();

  /**
   * Initialize the AI service with a specific model size
   */
  initialize(modelType: ModelType): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Terminate existing worker if any
    this.terminate();

    // Create new worker
    this.worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Set up message handler
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.callbacks.forEach((callback) => callback(event.data));
    };

    // Initialize with model selection
    this.worker.postMessage({
      action: WorkerAction.INIT,
      modelSelection: modelType,
    });
  }

  /**
   * Load the model
   */
  loadModel(): void {
    if (!this.worker) {
      console.error('Worker not initialized');
      return;
    }

    this.worker.postMessage({ action: WorkerAction.LOAD });
  }

  /**
   * Generate text from user input
   */
  generate(input: string): void {
    if (!this.worker) {
      console.error('Worker not initialized');
      return;
    }

    this.worker.postMessage({
      action: WorkerAction.GENERATE,
      input,
    });
  }

  /**
   * Subscribe to worker responses
   */
  subscribe(callback: AIServiceCallback): () => void {
    this.callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    // Don't clear callbacks - they should persist across worker restarts
  }

  /**
   * Check if worker is initialized
   */
  isInitialized(): boolean {
    return this.worker !== null;
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

/**
 * Get the AI service singleton instance
 */
export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
