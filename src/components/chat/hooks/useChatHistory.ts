/**
 * useChatHistory Hook
 * Manages chat message history with welcome messages
 */

import { useEffect, useCallback, useRef } from "react";
import type { ChatMessage } from "@/types";
import { useChatStore } from "@/stores/chatStore";
import { CHATBOT_CONFIG } from "@/config";

export function getRandomWelcomeMessage(): string {
  const messages = CHATBOT_CONFIG.welcomeMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}

export interface UseChatHistoryReturn {
  messages: ChatMessage[];
  clearHistory: () => void;
  canClear: boolean;
}

export function useChatHistory(): UseChatHistoryReturn {
  const { messages, clearMessages, canClearMessages, addMessage } =
    useChatStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    if (useChatStore.getState().messages.length === 0) {
      addMessage("ai", getRandomWelcomeMessage());
    }
  }, [addMessage]);

  // Listen for clear history custom events
  useEffect(() => {
    const handleClearHistory = () => {
      if (canClearMessages()) {
        clearMessages();
        addMessage("ai", getRandomWelcomeMessage());
      }
    };

    document.addEventListener("clearChatHistory", handleClearHistory);

    return () => {
      document.removeEventListener("clearChatHistory", handleClearHistory);
    };
  }, [canClearMessages, clearMessages, addMessage]);

  const handleClearHistory = useCallback(() => {
    if (canClearMessages()) {
      clearMessages();
      addMessage("ai", getRandomWelcomeMessage());
    }
  }, [canClearMessages, clearMessages, addMessage]);

  return {
    messages,
    clearHistory: handleClearHistory,
    canClear: canClearMessages(),
  };
}
