/**
 * AI Service
 * Clean API for interacting with the AI worker.
 */

import { WorkerAction, type WorkerResponse } from "@/types/worker";
import { createLogger, LOG_AREAS } from "@/utils";

export type AIServiceCallback = (response: WorkerResponse) => void;
const logger = createLogger(LOG_AREAS.AI_SERVICE);

export class AIService {
  private worker: Worker | null = null;
  private callbacks: Set<AIServiceCallback> = new Set();

  /**
   * Initialize the AI service.
   */
  initialize(): void {
    if (typeof window === "undefined") {
      return;
    }

    this.terminate();

    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      this.callbacks.forEach((callback) => callback(event.data));
    };

    this.worker.postMessage({
      action: WorkerAction.INIT,
      viewportWidth: window.innerWidth,
    });
  }

  /**
   * Load the model.
   */
  loadModel(): void {
    if (!this.worker) {
      logger.error("worker not initialized");
      return;
    }

    this.worker.postMessage({ action: WorkerAction.LOAD });
  }

  /**
   * Generate text from user input.
   */
  generate(input: string): void {
    if (!this.worker) {
      logger.error("worker not initialized");
      return;
    }

    this.worker.postMessage({
      action: WorkerAction.GENERATE,
      input,
    });
  }

  /**
   * Subscribe to worker responses.
   */
  subscribe(callback: AIServiceCallback): () => void {
    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Terminate the worker.
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Check if worker is initialized.
   */
  isInitialized(): boolean {
    return this.worker !== null;
  }
}

let aiServiceInstance: AIService | null = null;

/**
 * Get the AI service singleton instance.
 */
export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}
