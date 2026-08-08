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
  private modelLoading = false;
  private lastLifecycleResponse: WorkerResponse | null = null;
  private callbacks: Set<AIServiceCallback> = new Set();

  /**
   * Initialize the AI service.
   */
  initialize(): void {
    if (typeof window === "undefined") {
      return;
    }

    this.terminate();

    let worker: Worker;
    try {
      worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start AI worker";
      logger.error(`worker initialization failed: ${message}`);
      this.notifyError(message);
      return;
    }

    this.worker = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      if (response.status === WorkerStatus.LOAD) {
        this.lastLifecycleResponse = response;
        if (response.message?.includes("successfully")) {
          this.modelLoaded = true;
          this.modelLoading = false;
        }
      }
      if (response.status === WorkerStatus.ERROR) {
        this.modelLoaded = false;
        this.modelLoading = false;
        this.lastLifecycleResponse = response;
      }

      this.callbacks.forEach((callback) => callback(response));
    };

    worker.onerror = (event: ErrorEvent) => {
      event.preventDefault();
      if (this.worker !== worker) return;
      this.terminate();
      this.notifyError(event.message || "AI worker failed to start");
    };

    worker.onmessageerror = () => {
      if (this.worker !== worker) return;
      this.terminate();
      this.notifyError("AI worker returned an unreadable response");
    };

    worker.postMessage({
      action: WorkerAction.INIT,
      viewportWidth: window.innerWidth,
    });
  }

  private notifyError(error: string): void {
    const response: WorkerResponse = {
      status: WorkerStatus.ERROR,
      message: "Model loading failed.",
      error,
    };
    this.lastLifecycleResponse = response;
    this.callbacks.forEach((callback) => callback(response));
  }

  /**
   * Load the model.
   */
  loadModel(): void {
    if (!this.worker) {
      logger.error("worker not initialized");
      return;
    }

    if (this.modelLoaded || this.modelLoading) {
      return;
    }

    this.modelLoading = true;
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
    if (this.lastLifecycleResponse) {
      callback(this.lastLifecycleResponse);
    }

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
    this.modelLoading = false;
    this.lastLifecycleResponse = null;
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

  /**
   * Check if the current worker is already loading the model.
   */
  isModelLoading(): boolean {
    return this.modelLoading;
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
