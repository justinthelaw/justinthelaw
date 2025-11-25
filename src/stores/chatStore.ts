/**
 * Chat Store
 * Zustand store for managing chat messages and generation state
 */

import { create } from 'zustand';
import type { ChatMessage } from '@/types';

interface ChatState {
  // Message history
  messages: ChatMessage[];
  
  // Generation state
  isGenerating: boolean;
  currentResponse: string;
  
  // Actions
  addMessage: (type: 'user' | 'ai', content: string) => void;
  updateCurrentResponse: (response: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  clearMessages: () => void;
  canClearMessages: () => boolean;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isGenerating: false,
  currentResponse: '',
  
  // Add a message to history with deduplication
  addMessage: (type, content) => {
    const messages = get().messages;
    const lastMessage = messages[messages.length - 1];
    
    // Prevent duplicate consecutive messages
    if (lastMessage && lastMessage.type === type && lastMessage.content === content) {
      return;
    }
    
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      content,
      timestamp: Date.now(),
    };
    
    set({ messages: [...messages, newMessage] });
  },
  
  // Update the current streaming response
  updateCurrentResponse: (response) => {
    set({ currentResponse: response });
  },
  
  // Set generation state
  setIsGenerating: (isGenerating) => {
    set({ isGenerating });
  },
  
  // Clear all messages
  clearMessages: () => {
    if (!get().isGenerating) {
      set({ messages: [], currentResponse: '' });
    }
  },
  
  // Check if messages can be cleared
  canClearMessages: () => {
    return !get().isGenerating;
  },
}));
