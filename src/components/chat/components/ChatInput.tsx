/**
 * ChatInput Component
 * Input field and send button for user messages
 */

import React, { useState, useRef, KeyboardEvent } from 'react';

export interface ChatInputProps {
  onSend: (message: string) => void;
  isDisabled: boolean;
  placeholder: string;
}

export function ChatInput({
  onSend,
  isDisabled,
  placeholder,
}: ChatInputProps): React.ReactElement {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!inputText.trim() || isDisabled) return;

    onSend(inputText.trim());
    setInputText('');
    
    // Refocus input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-700">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isDisabled}
          className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="chat-input"
        />
        <button
          onClick={handleSend}
          disabled={isDisabled || !inputText.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
          data-testid="chat-send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
