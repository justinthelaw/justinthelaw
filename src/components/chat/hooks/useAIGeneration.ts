/**
 * useAIGeneration Hook
 * Manages AI text generation and streaming responses
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkerStatus, type WorkerResponse } from '@/types/worker';
import { cleanInput, getAIService, getRecentConversationTurns } from '@/services/ai';
import { useChatStore } from '@/stores/chatStore';
import { createLogger, LOG_AREAS } from "@/utils";
import { CHATBOT_CONFIG } from "@/config";

export interface UseAIGenerationReturn {
  isGenerating: boolean;
  currentResponse: string;
  generate: (input: string) => void;
}

const logger = createLogger(LOG_AREAS.AI_GENERATION);

export function useAIGeneration(): UseAIGenerationReturn {
  const {
    messages,
    setIsGenerating: setIsGeneratingStore,
    updateCurrentResponse,
    addMessage,
  } =
    useChatStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const currentResultRef = useRef('');
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    const aiService = getAIService();

    const unsubscribe = aiService.subscribe((response: WorkerResponse) => {
      switch (response.status) {
        case WorkerStatus.INITIATE:
          isGeneratingRef.current = true;
          setIsGenerating(true);
          setIsGeneratingStore(true);
          setCurrentResponse('');
          updateCurrentResponse('');
          currentResultRef.current = '';
          break;

        case WorkerStatus.STREAM:
          if (isGeneratingRef.current && response.response) {
            currentResultRef.current += response.response;
            setCurrentResponse(currentResultRef.current);
            updateCurrentResponse(currentResultRef.current);
          }
          break;

        case WorkerStatus.DONE:
          if (!isGeneratingRef.current) break;

          // Save the AI response to history when generation completes
          if (currentResultRef.current.trim()) {
            addMessage('ai', currentResultRef.current.trim());
            currentResultRef.current = '';
            setCurrentResponse('');
            updateCurrentResponse('');
          }

          setIsGenerating(false);
          setIsGeneratingStore(false);
          isGeneratingRef.current = false;
          break;

        case WorkerStatus.ERROR:
          if (!isGeneratingRef.current) break;

          setIsGenerating(false);
          setIsGeneratingStore(false);
          isGeneratingRef.current = false;
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
      if (isGeneratingRef.current) {
        aiService.terminate();
        setIsGeneratingStore(false);
        updateCurrentResponse('');
        isGeneratingRef.current = false;
      }
    };
  }, [setIsGeneratingStore, updateCurrentResponse, addMessage]);

  const generate = useCallback((input: string) => {
    if (isGeneratingRef.current) return;

    const cleanedInput = cleanInput(input);

    if (!cleanedInput.trim()) return;

    const aiService = getAIService();

    if (!aiService.isInitialized()) {
      logger.error("service not initialized");
      return;
    }

    const welcomeMessages = new Set<string>(CHATBOT_CONFIG.welcomeMessages);
    const recentTurns = getRecentConversationTurns(
      messages.filter((message) => !welcomeMessages.has(message.content))
    );

    // Add user message to history
    addMessage('user', cleanedInput);

    // Start generation
    isGeneratingRef.current = true;
    setIsGenerating(true);
    setIsGeneratingStore(true);
    setCurrentResponse('');
    updateCurrentResponse('');
    currentResultRef.current = '';
    aiService.generate(cleanedInput, recentTurns);
  }, [addMessage, messages, setIsGeneratingStore, updateCurrentResponse]);

  return {
    isGenerating,
    currentResponse,
    generate,
  };
}
