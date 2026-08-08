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
  startModelLoad: () => void;
}

const logger = createLogger(LOG_AREAS.AI_MODEL);

export function useModelManagement(): UseModelManagementReturn {
  const [modelStateOnMount] = useState(() => {
    const aiService = getAIService();
    const lifecycleResponse = aiService.getLastLifecycleResponse();
    const lifecycleError =
      lifecycleResponse?.status === WorkerStatus.ERROR
        ? lifecycleResponse.error || "Unknown error"
        : null;
    return {
      isLoading: aiService.isModelLoading(),
      isReady: aiService.isModelReady(),
      error: lifecycleError,
      loadingMessage:
        lifecycleError || aiService.isModelLoading()
          ? lifecycleResponse?.message || null
          : null,
    };
  });
  const [isLoading, setIsLoading] = useState(modelStateOnMount.isLoading);
  const [isReady, setIsReady] = useState(modelStateOnMount.isReady);
  const [error, setError] = useState<string | null>(modelStateOnMount.error);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(
    modelStateOnMount.loadingMessage
  );

  const startModelLoad = useCallback(() => {
    logger.info("load requested");
    const aiService = getAIService();
    if (aiService.isModelReady()) {
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsReady(false);
    setLoadingMessage("Initializing...");

    if (!aiService.isInitialized()) {
      aiService.initialize();
    }
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
        } else {
          setIsLoading(true);
          setIsReady(false);
          setError(null);
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

  return {
    isLoading,
    isReady,
    error,
    loadingMessage,
    startModelLoad,
  };
}
