/**
 * useModelManagement Hook
 * Manages model selection, loading, and error states
 */

import { useState, useEffect, useCallback } from 'react';
import { ModelType } from '@/types';
import { WorkerStatus, type WorkerResponse } from '@/types/worker';
import { useModelStore } from '@/stores/modelStore';
import { getAIService } from '@/services/ai';

export interface UseModelManagementReturn {
  modelType: ModelType;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  loadingMessage: string | null;
  needsReload: boolean;
  setModelType: (size: ModelType) => void;
  reloadWithNewModel: () => void;
}

export function useModelManagement(): UseModelManagementReturn {
  const { selectedModel, setSelectedModel } = useModelStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(
    'Initializing...'
  );
  const [loadedModel, setLoadedModel] = useState<ModelType | null>(null);

  const needsReload = selectedModel !== loadedModel;

  // Initialize AI service and load model
  useEffect(() => {
    const aiService = getAIService();
    
    // Reset states (intentional setup on model change)
    setIsLoading(true);
    setIsReady(false);
    setError(null);
    setLoadingMessage('Initializing...');

    // Initialize service with selected model
    aiService.initialize(selectedModel);
    
    // Subscribe to worker responses
    const unsubscribe = aiService.subscribe((response: WorkerResponse) => {
      switch (response.status) {
        case WorkerStatus.LOAD:
          if (response.message) {
            setLoadingMessage(response.message);
            
            if (response.message.includes('successfully')) {
              setIsLoading(false);
              setIsReady(true);
              setLoadedModel(selectedModel);
              // Clear loading message after successful load
              setTimeout(() => setLoadingMessage(null), 0);
            }
          }
          break;
          
        case WorkerStatus.FALLBACK_MODEL:
          if (response.fallbackModel) {
            setSelectedModel(response.fallbackModel as ModelType);
          }
          break;
          
        case WorkerStatus.ERROR:
          setError(response.error || 'Unknown error');
          setLoadingMessage(response.message || null);
          setIsLoading(false);
          setIsReady(false);
          break;
          
        case WorkerStatus.DONE:
          // Model loading complete
          if (isLoading) {
            setIsLoading(false);
            if (!error) {
              setIsReady(true);
            }
          }
          break;
      }
    });
    
    // Load the model
    aiService.loadModel();
    
    return () => {
      unsubscribe();
    };
    // selectedModel triggers re-init, setSelectedModel for fallback updates
    // error and isLoading are managed within subscription callbacks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel, setSelectedModel]);

  const reloadWithNewModel = useCallback(() => {
    // Terminate old worker
    const aiService = getAIService();
    aiService.terminate();
    
    // Reset states
    setIsLoading(true);
    setIsReady(false);
    setError(null);
    setLoadingMessage('Reinitializing...');
    setLoadedModel(null);
    
    // Reinitialize with new model
    aiService.initialize(selectedModel);
    
    // Subscribe to responses
    aiService.subscribe((response: WorkerResponse) => {
      switch (response.status) {
        case WorkerStatus.LOAD:
          if (response.message) {
            setLoadingMessage(response.message);
            
            if (response.message.includes('successfully')) {
              setIsLoading(false);
              setIsReady(true);
              setLoadedModel(selectedModel);
              // Clear loading message after successful load
              setTimeout(() => setLoadingMessage(null), 0);
            }
          }
          break;
          
        case WorkerStatus.FALLBACK_MODEL:
          if (response.fallbackModel) {
            setSelectedModel(response.fallbackModel as ModelType);
          }
          break;
          
        case WorkerStatus.ERROR:
          setError(response.error || 'Unknown error');
          setLoadingMessage(response.message || null);
          setIsLoading(false);
          setIsReady(false);
          break;
          
        case WorkerStatus.DONE:
          if (isLoading) {
            setIsLoading(false);
            if (!error) {
              setIsReady(true);
            }
          }
          break;
      }
    });
    
    // Load the model
    aiService.loadModel();
  }, [selectedModel, setSelectedModel, isLoading, error]);

  const handleSetModelType = useCallback((size: ModelType) => {
    setSelectedModel(size);
  }, [setSelectedModel]);

  return {
    modelType: selectedModel,
    isLoading,
    isReady,
    error,
    loadingMessage,
    needsReload,
    setModelType: handleSetModelType,
    reloadWithNewModel,
  };
}
