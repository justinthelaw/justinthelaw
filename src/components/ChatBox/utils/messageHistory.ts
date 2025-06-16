export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

// In-memory storage - will be cleared on every page reload/revisit
let messageHistory: ChatMessage[] = [];
let isGenerating: boolean = false;

export function getMessageHistory(): ChatMessage[] {
  return [...messageHistory]; // Return a copy to prevent external mutations
}

export function addMessage(type: 'user' | 'ai', content: string): ChatMessage {
  const message: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content,
    timestamp: Date.now()
  };

  // Prevent duplicate consecutive messages from the same sender
  if (messageHistory.length > 0) {
    const lastMessage = messageHistory[messageHistory.length - 1];
    if (lastMessage.type === type && lastMessage.content.trim() === content.trim()) {
      // Return the existing message instead of adding a duplicate
      return lastMessage;
    }
  }

  messageHistory.push(message);
  return message;
}

export function setGenerating(generating: boolean): void {
  isGenerating = generating;
}

export function getIsGenerating(): boolean {
  return isGenerating;
}

export function canClearHistory(): boolean {
  return !isGenerating;
}

export function clearMessageHistory(): void {
  if (canClearHistory()) {
    messageHistory = [];
  }
}
