/**
 * useChatHistory Hook
 * Manages chat message history with welcome messages
 */

import { useEffect, useCallback } from "react";
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

  // Initialize with welcome message on first mount only
  useEffect(() => {
    // Only add welcome message if no messages exist
    if (messages.length === 0) {
      addMessage("ai", getRandomWelcomeMessage());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
