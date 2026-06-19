/**
 * ChatInput Component
 * Input field and send button for user messages
 */

import React, { useState, useRef, KeyboardEvent } from "react";
import { getPromptBudget } from "@/services/ai/contextProvider";
import { LimitWarning } from "./LimitWarning";

export interface ChatInputProps {
  onSend: (message: string) => void;
  isSendDisabled: boolean;
  isInputDisabled: boolean;
  placeholder: string;
}

export function ChatInput({
  onSend,
  isSendDisabled,
  isInputDisabled,
  placeholder,
}: ChatInputProps): React.ReactElement {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const promptBudget = getPromptBudget(inputText);
  const showInputLimitWarning =
    inputText.trim().length > 0 && promptBudget.isInputTrimmed;

  const handleSend = () => {
    if (!inputText.trim() || isSendDisabled) return;

    onSend(inputText.trim());
    setInputText("");

    // Refocus input after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-700">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isInputDisabled}
            rows={2}
            aria-describedby={
              showInputLimitWarning ? "chat-input-limit-warning" : undefined
            }
            className="block min-h-11 max-h-24 w-full resize-none rounded-lg bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="chat-input"
          />
        </div>
        <div className="relative flex h-11 w-20 shrink-0 items-end justify-center">
          {showInputLimitWarning && (
            <LimitWarning
              id="chat-input-limit-warning"
              testId="chat-input-limit-warning"
              className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2"
              message={`Message: ${promptBudget.trimmedInputCharacters} chars over; tail trimmed.`}
            />
          )}
          <button
            onClick={handleSend}
            disabled={isSendDisabled || !inputText.trim()}
            className="h-11 w-full rounded-lg bg-blue-600 px-0 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
            data-testid="chat-send-button"
          >
            Send
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        AI can make mistakes. Always verify the information.
      </p>
    </div>
  );
}
