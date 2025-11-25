/**
 * ChatMessages Component
 * Displays chat message history and current AI response
 */

import React, { useState } from 'react';
import type { ChatMessage } from '@/types';
import { Typewriter } from './Typewriter';

const QUIRK_MESSAGES = [
  "Digging into Justin's history...",
  "Consulting my Justin database...",
  "Channeling my inner Justin...",
  "Reading Justin's mind...",
  "Checking Justin's secret diary...",
  "Analyzing Justin's preferences...",
  "Decoding Justin's GitHub commits...",
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
}

export function ChatMessages({
  messages,
  currentResponse,
  isGenerating,
  isLoading,
  loadingMessage,
}: ChatMessagesProps): React.ReactElement {
  const [randomQuirkMessage] = useState(() =>
    QUIRK_MESSAGES[Math.floor(Math.random() * QUIRK_MESSAGES.length)]
  );

  return (
    <div className="space-y-4">
      {/* Loading state - only for initial model loading */}
      {(isLoading || loadingMessage) &&
      !loadingMessage?.includes('Generating') ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-300">{loadingMessage || 'Loading...'}</p>
          </div>
          {loadingMessage && loadingMessage.includes('Error') && (
            <div className="mt-3 flex flex-col items-center gap-2">
              {loadingMessage.includes('memory') && (
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
        <>
          {/* Display message history */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-white'
                }`}
              >
                <div className="text-xs mb-1 opacity-70">
                  {message.type === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div className="leading-relaxed whitespace-pre-line">
                  {/* Show typewriter effect only for the first AI message (welcome message) */}
                  {message.type === 'ai' &&
                  messages.length === 1 &&
                  message.id === messages[0].id ? (
                    <Typewriter text={message.content} delay={200} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Show AI response being generated */}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg p-3 max-w-[80%]">
                <div className="text-gray-300 text-sm mb-1">AI Assistant</div>
                <div className="text-white leading-relaxed whitespace-pre-line">
                  {!currentResponse ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                      <span>{randomQuirkMessage}</span>
                    </div>
                  ) : (
                    <>
                      {currentResponse}
                      <span className="animate-pulse">|</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
