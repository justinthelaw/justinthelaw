/**
 * useAIGeneration Hook
 * Manages AI text generation and streaming responses
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkerStatus, type WorkerResponse } from '@/types/worker';
import { getAIService } from '@/services/ai';
import { useChatStore } from '@/stores/chatStore';

export interface UseAIGenerationReturn {
  isGenerating: boolean;
  currentResponse: string;
  generate: (input: string) => void;
}

export function useAIGeneration(): UseAIGenerationReturn {
  const { setIsGenerating, updateCurrentResponse, addMessage } = useChatStore();
  const [isGenerating, setLocalGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const currentResultRef = useRef('');

  useEffect(() => {
    const aiService = getAIService();

    const unsubscribe = aiService.subscribe((response: WorkerResponse) => {
      switch (response.status) {
        case WorkerStatus.INITIATE:
          setLocalGenerating(true);
          setIsGenerating(true);
          setCurrentResponse('');
          updateCurrentResponse('');
          currentResultRef.current = '';
          break;

        case WorkerStatus.STREAM:
          if (response.response) {
            currentResultRef.current += response.response;
            setCurrentResponse(currentResultRef.current);
            updateCurrentResponse(currentResultRef.current);
          }
          break;

        case WorkerStatus.DONE:
          // Save the AI response to history when generation completes
          if (currentResultRef.current.trim()) {
            addMessage('ai', currentResultRef.current.trim());
            currentResultRef.current = '';
            setCurrentResponse('');
            updateCurrentResponse('');
          }
          
          setLocalGenerating(false);
          setIsGenerating(false);
          break;

        case WorkerStatus.ERROR:
          setLocalGenerating(false);
          setIsGenerating(false);
          // Show error as a message
          if (response.error) {
            currentResultRef.current = `Error: ${response.error}`;
            setCurrentResponse(currentResultRef.current);
          }
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [setIsGenerating, updateCurrentResponse, addMessage]);

  const generate = useCallback((input: string) => {
    if (!input.trim()) return;

    const aiService = getAIService();
    
    if (!aiService.isInitialized()) {
      console.error('AI service not initialized');
      return;
    }

    // Add user message to history
    addMessage('user', input.trim());
    
    // Start generation
    aiService.generate(input.trim());
  }, [addMessage]);

  return {
    isGenerating,
    currentResponse,
    generate,
  };
}
