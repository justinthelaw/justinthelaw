export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
}

const HISTORY_KEY = 'chat_message_history';

export function getMessageHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = sessionStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading message history:', error);
    return [];
  }
}

export function addMessage(type: 'user' | 'ai', content: string): ChatMessage {
  const message: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content,
    timestamp: Date.now()
  };

  if (typeof window !== 'undefined') {
    try {
      const history = getMessageHistory();
      const newHistory = [...history, message];
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving message to history:', error);
    }
  }

  return message;
}

export function clearMessageHistory(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing message history:', error);
    }
  }
}
