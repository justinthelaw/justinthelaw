/**
 * ChatContainer Component
 * Main container orchestrating chat functionality with all hooks and child components
 */

import React, { useCallback, useEffect, useId, useRef } from "react";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { useChatHistory, useAIGeneration, useModelManagement } from "../hooks";
import {
  getPersonalContextBudget,
  getRecentConversationTurns,
} from "@/services/ai/contextProvider";
import { CHATBOT_CONFIG } from "@/config";
import { MODEL_DOWNLOAD_SIZE_MB } from "@/config/models";

export interface ChatContainerProps {
  onClose: () => void;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hasAttribute("disabled"))
    .filter(
      (element) => element.offsetParent !== null || element === document.activeElement
    );
}

export function ChatContainer({ onClose }: ChatContainerProps): React.ReactElement {
  const titleId = useId();
  const { messages, clearHistory, canClear } = useChatHistory();
  const { isGenerating, currentResponse, generate } = useAIGeneration();
  const {
    isLoading,
    isReady,
    error,
    loadingMessage,
    startModelLoad,
  } = useModelManagement();
  const personalContextBudget = getPersonalContextBudget();
  const welcomeMessages = new Set<string>(CHATBOT_CONFIG.welcomeMessages);
  const conversationTurns = getRecentConversationTurns(
    messages.filter((message) => !welcomeMessages.has(message.content))
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleDialogKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        if (event.shiftKey) {
          lastElement.focus();
        } else {
          firstElement.focus();
        }
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.addEventListener("keydown", handleDialogKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [handleDialogKeyDown]);

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
          ? "Load the AI model to start chatting..."
          : "Type your message...";
  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="pointer-events-auto fixed inset-0 flex items-center justify-center bg-black/80 p-4 lg:inset-auto lg:bottom-6 lg:right-6 lg:block lg:bg-transparent lg:p-0">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="w-full max-w-md h-[80vh] bg-black border border-gray-700 rounded-lg shadow-2xl flex flex-col lg:w-96 lg:max-w-none lg:h-[600px]"
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 id={titleId} className="text-lg lg:text-xl font-bold text-white">
              AI Chatbot
            </h3>
            <div className="flex space-x-2 items-center">
              <div className="group relative">
                <button
                  onClick={handleClearHistory}
                  disabled={isGenerating}
                  className={`${
                    isGenerating
                      ? "text-gray-600 bg-gray-900 cursor-not-allowed"
                      : "text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700"
                  } rounded-md w-8 h-8 flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300`}
                  aria-label="Clear chat history"
                  data-testid="chat-clear-button"
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
                <span
                  id="chat-clear-tooltip"
                  role="tooltip"
                  className="pointer-events-none invisible absolute right-0 top-10 z-10 whitespace-nowrap rounded-md border border-gray-700 bg-black px-2 py-1 text-xs text-gray-200 opacity-0 shadow-lg transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
                  data-testid="chat-clear-tooltip"
                >
                  {isGenerating
                    ? "Cannot clear history while generating"
                    : "Clear chat history"}
                </span>
              </div>
              <button
                ref={closeButtonRef}
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
            className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4"
            data-testid="chat-messages-scroll"
          >
            {!isReady && !isLoading && !error ? (
              <section
                className="m-auto max-w-sm rounded-lg border border-blue-900 bg-blue-950/40 p-5 text-center text-sm text-blue-100"
                data-testid="model-download-consent"
                aria-labelledby={`${titleId}-download-title`}
              >
                <h4
                  id={`${titleId}-download-title`}
                  className="text-base font-semibold"
                >
                  Run the AI model on this device
                </h4>
                <p className="mt-2 text-blue-200">
                  Loading the chatbot downloads about {MODEL_DOWNLOAD_SIZE_MB} MB.
                  If the first format is incompatible, its fallback can require
                  another download of similar size. Questions and answers stay in
                  this browser.
                </p>
                <button
                  type="button"
                  onClick={startModelLoad}
                  className="mt-4 rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  data-testid="model-load-button"
                >
                  Load AI model
                </button>
              </section>
            ) : (
              <ChatMessages
                messages={messages}
                currentResponse={currentResponse}
                isGenerating={isGenerating}
                isLoading={isLoading}
                error={error}
                loadingMessage={loadingMessage}
                showPersonalContextTrimWarning={
                  personalContextBudget.isTrimmed
                }
                overBudgetPersonalContextCharacters={
                  personalContextBudget.overBudgetCharacters
                }
                trimmedPersonalContextCharacters={
                  personalContextBudget.trimmedCharacters
                }
                onRetryModelLoad={startModelLoad}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatInput
            onSend={handleSend}
            isSendDisabled={!isReady || isGenerating || !!error}
            isInputDisabled={!isReady || isGenerating || !!error}
            placeholder={placeholder}
            conversationTurns={conversationTurns}
          />
        </div>
      </div>
    </div>
  );
}
