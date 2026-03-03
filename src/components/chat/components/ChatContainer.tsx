/**
 * ChatContainer Component
 * Main container orchestrating chat functionality with all hooks and child components
 */

import React, { useEffect, useRef } from "react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatSettings } from "./ChatSettings";
import { useChatHistory, useAIGeneration, useModelManagement } from "../hooks";

export interface ChatContainerProps {
  onClose: () => void;
}

export function ChatContainer({ onClose }: ChatContainerProps): React.ReactElement {
  const { messages, clearHistory, canClear } = useChatHistory();
  const { isGenerating, currentResponse, generate } = useAIGeneration();
  const {
    isLoading,
    isReady,
    error,
    loadingMessage,
    reloadWithNewModel,
  } = useModelManagement();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse, isGenerating, isLoading]);

  function handleSend(message: string): void {
    if (error) {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      return;
    }

    if (!isReady) {
      return;
    }

    generate(message);
  }

  function handleClearHistory(): void {
    if (canClear) {
      clearHistory();
    }
  }

  const placeholder = error
    ? "Model failed to load. Please refresh the page."
    : isLoading && !isReady
      ? "Loading model..."
      : isGenerating
        ? "Generating answer..."
        : !isReady
          ? "Model not ready..."
          : "Type your message...";

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="pointer-events-auto fixed inset-0 flex items-center justify-center bg-black/80 p-4 lg:inset-auto lg:bottom-6 lg:right-6 lg:block lg:bg-transparent lg:p-0">
        <div className="w-full max-w-md h-[80vh] bg-black border border-gray-700 rounded-lg shadow-2xl flex flex-col lg:w-96 lg:max-w-none lg:h-[600px]">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="text-lg lg:text-xl font-bold text-white">
              AI Chatbot
            </h3>
            <div className="flex space-x-2 items-center">
              <ChatSettings onReload={reloadWithNewModel} />
              <button
                onClick={handleClearHistory}
                disabled={isGenerating}
                className={`${
                  isGenerating
                    ? "text-gray-600 bg-gray-900 cursor-not-allowed"
                    : "text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700"
                } rounded-md w-8 h-8 flex items-center justify-center transition-colors duration-200`}
                aria-label="Clear chat history"
                title={
                  isGenerating
                    ? "Cannot clear history while generating"
                    : "Clear chat history"
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md w-8 h-8 flex items-center justify-center transition-colors duration-200"
                aria-label="Close chat"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto p-4"
            data-testid="chat-messages-scroll"
          >
            <ChatMessages
              messages={messages}
              currentResponse={currentResponse}
              isGenerating={isGenerating}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
            />
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            onSend={handleSend}
            isDisabled={!isReady || isGenerating || !!error}
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  );
}
