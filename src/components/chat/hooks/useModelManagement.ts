/**
 * useModelManagement Hook
 * Manages model selection, loading, and error states
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { ModelType } from "@/types";
import { WorkerStatus, type WorkerResponse } from "@/types/worker";
import { useModelStore } from "@/stores/modelStore";
import { getAIService } from "@/services/ai";
import { createLogger, LOG_AREAS } from "@/utils";

export interface UseModelManagementReturn {
  modelType: ModelType;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  loadingMessage: string | null;
  needsReload: boolean;
  setModelType: (size: ModelType) => void;
  reloadWithNewModel: (model: ModelType) => void;
}

const logger = createLogger(LOG_AREAS.AI_MODEL);

export function useModelManagement(): UseModelManagementReturn {
  const { selectedModel, setSelectedModel } = useModelStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(
    "Initializing..."
  );
  const [loadedModel, setLoadedModel] = useState<ModelType | null>(null);
  const selectedModelRef = useRef(selectedModel);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  const startModelLoad = useCallback((model: ModelType) => {
    logger.info(`load requested: ${model}`);
    const aiService = getAIService();
    aiService.terminate();
    aiService.initialize(model);
    aiService.loadModel();
  }, []);

  const handleWorkerResponse = useCallback(
    (response: WorkerResponse) => {
      switch (response.status) {
        case WorkerStatus.LOAD: {
          if (!response.message) {
            return;
          }

          setLoadingMessage(response.message);

          if (response.message.includes("successfully")) {
            const actualLoadedModel = response.loadedModel ?? selectedModelRef.current;
            setLoadedModel(actualLoadedModel);
            logger.info(
              `load complete: requested=${selectedModelRef.current}, loaded=${actualLoadedModel}`
            );
            setIsLoading(false);
            setIsReady(true);
            setError(null);
            setLoadingMessage(null);
          }
          return;
        }

        case WorkerStatus.FALLBACK_MODEL: {
          if (!response.fallbackModel) {
            return;
          }

          const fallback = response.fallbackModel;
          logger.warn(`fallback activated: ${fallback}`);
          setLoadedModel(fallback);
          setSelectedModel(fallback);
          setLoadingMessage(`Falling back to ${fallback} model...`);
          return;
        }

        case WorkerStatus.ERROR:
          logger.error(
            `load failed: requested=${selectedModelRef.current}, error=${response.error || "Unknown error"}`
          );
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
    },
    [setSelectedModel]
  );

  useEffect(() => {
    const aiService = getAIService();
    const unsubscribe = aiService.subscribe(handleWorkerResponse);
    return () => {
      unsubscribe();
    };
  }, [handleWorkerResponse]);

  useEffect(() => {
    startModelLoad(selectedModelRef.current);
  }, [startModelLoad]);

  const reloadWithNewModel = useCallback((model: ModelType) => {
    selectedModelRef.current = model;
    setIsLoading(true);
    setIsReady(false);
    setError(null);
    setLoadingMessage("Reinitializing...");
    setLoadedModel(null);
    startModelLoad(model);
  }, [startModelLoad]);

  const handleSetModelType = useCallback(
    (size: ModelType) => {
      selectedModelRef.current = size;
      setSelectedModel(size);
    },
    [setSelectedModel]
  );

  return {
    modelType: selectedModel,
    isLoading,
    isReady,
    error,
    loadingMessage,
    needsReload: selectedModel !== loadedModel,
    setModelType: handleSetModelType,
    reloadWithNewModel,
  };
}
