/**
 * useChatHistory Hook
 * Manages chat message history with welcome messages
 */

import { useEffect, useCallback } from "react";
import type { ChatMessage } from "@/types";
import { useChatStore } from "@/stores/chatStore";
import { SITE_CONFIG } from "@/config";

const WELCOME_MESSAGES = [
  `Hello, I am ${SITE_CONFIG.name}'s AI assistant! Got any questions for me?`,
  `Hey there! Got any questions about ${SITE_CONFIG.name} for me?`,
  `Hi! Interested in learning more about ${SITE_CONFIG.name}?`,
  `What would you like to know about ${SITE_CONFIG.name}?`,
  `I heard you had questions about ${SITE_CONFIG.name}? Just ask away!`,
  `Thanks for visiting! Do you want to learn more about ${SITE_CONFIG.name}?`,
];

function getRandomWelcomeMessage(): string {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
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
      addMessage(
        "ai",
        "Hello! I'm your AI assistant. Feel free to ask me anything!"
      );
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
