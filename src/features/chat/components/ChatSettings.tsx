/**
 * ChatSettings Component
 * Modal for selecting AI model size with reload functionality
 */

import React, { useState } from "react";
import { ModelSize } from "@/types";
import { MODEL_DISPLAY_NAMES, MODEL_SIZES } from "@/config/models";
import { useModelStore } from "@/stores/modelStore";
import { useChatStore } from "@/stores/chatStore";

const WELCOME_MESSAGES = [
  "Hello, I am Justin's AI assistant! Got any questions for me?",
  "Hey there! Got any questions about Justin for me?",
  "Hi! Interested in learning more about Justin?",
  "What would you like to know about Justin?",
  "I heard you had questions about Justin? Just ask away!",
  "Thanks for visiting! Do you want to learn more about Justin?",
];

function getRandomWelcomeMessage(): string {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
}

export interface ChatSettingsProps {
  onClose?: () => void;
  initialModelSize: ModelSize;
  currentModelSize: ModelSize;
  onReload: () => void;
}

export function ChatSettings({
  onClose,
  initialModelSize,
  currentModelSize: _currentModelSize,
  onReload,
}: ChatSettingsProps): React.ReactElement {
  const { selectedModel, setSelectedModel } = useModelStore();
  const { clearMessages, addMessage } = useChatStore();
  const [showSettings, setShowSettings] = useState(false);

  const handleModelChange = (modelSize: ModelSize) => {
    setSelectedModel(modelSize);

    // If model changed from current, reload immediately
    if (modelSize !== initialModelSize) {
      // Clear chat history
      clearMessages();
      // Add welcome message for new model
      addMessage("ai", getRandomWelcomeMessage());
      // Switch to new model
      onReload();
      // Close settings
      setShowSettings(false);
    }
  };

  if (!showSettings) {
    return (
      <button
        onClick={() => setShowSettings(true)}
        className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md w-8 h-8 flex items-center justify-center transition-colors duration-200"
        aria-label="Model settings"
        data-testid="model-settings-button"
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      data-testid="model-selector-modal"
    >
      <div className="bg-black border border-gray-700 rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-black border-b border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Model Settings
            </h4>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-105"
              aria-label="Close settings"
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

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="space-y-3">
              {MODEL_SIZES.map((size) => (
                <label
                  key={size}
                  className="flex items-center p-3 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 cursor-pointer transition-all duration-200 group"
                >
                  <div className="relative flex items-center">
                    <input
                      type="radio"
                      name="modelSize"
                      checked={selectedModel === size}
                      onChange={() => handleModelChange(size)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        selectedModel === size
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-500 group-hover:border-gray-400"
                      }`}
                    >
                      {selectedModel === size && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <span className="text-white font-medium">
                        {MODEL_DISPLAY_NAMES[size]}
                      </span>
                      {size === ModelSize.SMARTER && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                          Fine-Tuned
                        </span>
                      )}
                      {size === ModelSize.DUMBER && (
                        <span
                          className="ml-2 px-2 py-1 text-xs bg-purple-600 text-white rounded-full"
                          data-testid="model-tag-dumber"
                        >
                          Generic
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end items-center">
            <button
              onClick={() => {
                setShowSettings(false);
                if (onClose) onClose();
              }}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
