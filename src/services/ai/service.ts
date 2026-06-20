/**
 * AI Service
 * Clean API for interacting with the AI worker.
 */

import { WorkerAction, WorkerStatus, type WorkerResponse } from "@/types/worker";
import type { ConversationTurn } from "@/types";
import { createLogger, LOG_AREAS } from "@/utils";

export type AIServiceCallback = (response: WorkerResponse) => void;
const logger = createLogger(LOG_AREAS.AI_SERVICE);

export class AIService {
  private worker: Worker | null = null;
  private modelLoaded = false;
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
      const response = event.data;
      if (
        response.status === WorkerStatus.LOAD &&
        response.message?.includes("successfully")
      ) {
        this.modelLoaded = true;
      }
      if (response.status === WorkerStatus.ERROR) {
        this.modelLoaded = false;
      }

      this.callbacks.forEach((callback) => callback(response));
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
  generate(
    input: string,
    conversationTurns: readonly ConversationTurn[] = []
  ): void {
    if (!this.worker) {
      logger.error("worker not initialized");
      return;
    }

    this.worker.postMessage({
      action: WorkerAction.GENERATE,
      input,
      conversationTurns,
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
    this.modelLoaded = false;
  }

  /**
   * Check if worker is initialized.
   */
  isInitialized(): boolean {
    return this.worker !== null;
  }

  /**
   * Check if the current worker has completed model loading.
   */
  isModelReady(): boolean {
    return this.modelLoaded;
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
