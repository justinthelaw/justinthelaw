/**
 * ChatMessages Component
 * Displays chat message history and current AI response
 */

import React, { Fragment, useState } from "react";
import type { ChatMessage } from "@/types";
import { Typewriter } from "./Typewriter";
import { SITE_CONFIG } from "@/config";
import { LimitWarning } from "./LimitWarning";

const QUIRK_MESSAGES = [
  `Digging into ${SITE_CONFIG.name}'s history...`,
  `Consulting my ${SITE_CONFIG.name} database...`,
  `Channeling my inner ${SITE_CONFIG.name}...`,
  `Reading ${SITE_CONFIG.name}'s mind...`,
  `Checking ${SITE_CONFIG.name}'s secret diary...`,
  `Analyzing ${SITE_CONFIG.name}'s preferences...`,
  `Decoding ${SITE_CONFIG.name}'s commits...`,
  "Making up an answer for you...",
  "Searching the dark web...",
  "Wondering the same thing you are...",
];

export interface ChatMessagesProps {
  messages: ChatMessage[];
  currentResponse: string;
  isGenerating: boolean;
  isLoading: boolean;
  loadingMessage: string | null;
  showPersonalContextTrimWarning: boolean;
  overBudgetPersonalContextCharacters: number;
  trimmedPersonalContextCharacters: number;
}

export function ChatMessages({
  messages,
  currentResponse,
  isGenerating,
  isLoading,
  loadingMessage,
  showPersonalContextTrimWarning,
  overBudgetPersonalContextCharacters,
  trimmedPersonalContextCharacters,
}: ChatMessagesProps): React.ReactElement {
  const [randomQuirkMessage] = useState(
    () => QUIRK_MESSAGES[Math.floor(Math.random() * QUIRK_MESSAGES.length)]
  );
  const showModelStatus =
    (isLoading || loadingMessage) && !loadingMessage?.includes("Generating");

  return (
    <div
      className={
        showModelStatus
          ? "flex min-h-full flex-col items-center"
          : "space-y-4"
      }
    >
      {/* Loading state - only for initial model loading */}
      {showModelStatus ? (
        <div className="flex w-full flex-col items-center gap-3 py-8">
          <div
            className="flex w-fit max-w-full items-center justify-center gap-3"
            data-testid="model-loading-status-row"
          >
            <div className="h-6 w-6 shrink-0 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
            <p
              className="min-w-0 break-words text-gray-300 tabular-nums"
              data-testid="model-loading-status"
            >
              {loadingMessage || "Loading..."}
            </p>
          </div>
          {loadingMessage && loadingMessage.trim().toLowerCase().includes("error") && (
            <div className="mt-3 flex flex-col items-center gap-2">
              {loadingMessage.includes("memory") && (
                <p className="text-sm text-red-400 text-center max-w-xs">
                  Your device doesn&apos;t have enough available memory to run
                  this model. Try closing other tabs or applications to free up
                  memory.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <Fragment>
          {/* Display message history */}
          {messages.map((message, index) => {
            const showProfileWarning =
              showPersonalContextTrimWarning &&
              message.type === "ai" &&
              index === 0;

            return (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[80%] flex-col ${
                    message.type === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    data-testid={
                      message.type === "user"
                        ? "chat-message-user"
                        : "chat-message-ai"
                    }
                    className={`relative w-full rounded-lg p-3 ${
                      message.type === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-white"
                    }`}
                  >
                    <div className="text-xs mb-1 opacity-70">
                      {message.type === "user" ? "You" : "AI Assistant"}
                    </div>
                    <div className="leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">
                      {/* Show typewriter effect only for the first AI message (welcome message) */}
                      {message.type === "ai" &&
                      messages.length === 1 &&
                      message.id === messages[0].id ? (
                        <Typewriter text={message.content} delay={100} />
                      ) : (
                        message.content
                      )}
                    </div>
                    {showProfileWarning && (
                      <LimitWarning
                        className="absolute right-1.5 top-1.5"
                        message={`Profile: ${overBudgetPersonalContextCharacters} chars over; tail trimmed.${trimmedPersonalContextCharacters > overBudgetPersonalContextCharacters ? ` ${trimmedPersonalContextCharacters} chars removed.` : ""}`}
                        testId="profile-trim-warning"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show AI response being generated */}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg p-3 max-w-[80%]">
                <div className="text-gray-300 text-sm mb-1">AI Assistant</div>
                <div className="text-white leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">
                  {!currentResponse ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                      <span>{randomQuirkMessage}</span>
                    </div>
                  ) : (
                    <Fragment>
                      {currentResponse}
                      <span className="animate-pulse">|</span>
                    </Fragment>
                  )}
                </div>
              </div>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
}
