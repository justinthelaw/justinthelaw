/**
 * useModelManagement Hook
 * Manages model loading and error states.
 */

import { useState, useEffect, useCallback } from "react";
import { WorkerStatus, type WorkerResponse } from "@/types/worker";
import { getAIService } from "@/services/ai";
import { createLogger, LOG_AREAS } from "@/utils";

export interface UseModelManagementReturn {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  loadingMessage: string | null;
}

const logger = createLogger(LOG_AREAS.AI_MODEL);

export function useModelManagement(): UseModelManagementReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(
    "Initializing..."
  );

  const startModelLoad = useCallback(() => {
    logger.info("load requested");
    const aiService = getAIService();
    aiService.terminate();
    aiService.initialize();
    aiService.loadModel();
  }, []);

  const handleWorkerResponse = useCallback((response: WorkerResponse) => {
    switch (response.status) {
      case WorkerStatus.LOAD: {
        if (!response.message) {
          return;
        }

        setLoadingMessage(response.message);

        if (response.message.includes("successfully")) {
          logger.info("load complete");
          setIsLoading(false);
          setIsReady(true);
          setError(null);
          setLoadingMessage(null);
        }
        return;
      }

      case WorkerStatus.ERROR:
        logger.error(`load failed: ${response.error || "Unknown error"}`);
        setError(response.error || "Unknown error");
        setLoadingMessage(response.message || null);
        setIsLoading(false);
        setIsReady(false);
        return;

      case WorkerStatus.DONE:
        setIsLoading(false);
        return;

      default:
        return;
    }
  }, []);

  useEffect(() => {
    const aiService = getAIService();
    const unsubscribe = aiService.subscribe(handleWorkerResponse);
    return () => {
      unsubscribe();
    };
  }, [handleWorkerResponse]);

  useEffect(() => {
    startModelLoad();
  }, [startModelLoad]);

  return {
    isLoading,
    isReady,
    error,
    loadingMessage,
  };
}
