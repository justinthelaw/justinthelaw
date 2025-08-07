import { useState, useEffect } from "react";
import {
  MODEL_SIZE_NAMES,
  MODEL_SIZES,
  getModelSizeFromSelection,
  selectModelBasedOnDevice,
  type ModelSizeKey,
} from "@/components/ChatBox/utils/modelSelection";
import {
  setPreferredModelSize,
  clearModelPreference,
  getAutoDetectedModelSize,
} from "@/components/ChatBox/utils/modelPreferences";
import { clearMessageHistory } from "@/components/ChatBox/utils/messageHistory";

interface ModelSelectorProps {
  onClose?: () => void;
}

export default function ModelSelector({ onClose }: ModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<ModelSizeKey | null>(() => getAutoDetectedModelSize());
  const [showSettings, setShowSettings] = useState(false);
  // Use selectModelBasedOnDevice to get the actual model in use (including manual override)
  const [currentModelInUse, setCurrentModelInUse] = useState<ModelSizeKey>(() => {
    const inUse = selectModelBasedOnDevice();
    return getModelSizeFromSelection(inUse);
  });

  useEffect(() => {
    if (showSettings) {
      // On open, sync to the current in-use model
      const inUse = selectModelBasedOnDevice();
      const key = getModelSizeFromSelection(inUse);
      setSelectedModel(key);
      setCurrentModelInUse(key);
    }
  }, [showSettings]);

  const handleModelChange = (modelSize: ModelSizeKey) => {
    setSelectedModel(modelSize);
    setPreferredModelSize(modelSize);
  };

  const handleResetPreference = () => {
    clearModelPreference();
    setSelectedModel(currentModelInUse); // Reset to the model in use
  };

  // Show reload message if the selected model is different from the model currently in use
  const showReloadMessage =
    selectedModel !== null && selectedModel !== currentModelInUse;

  if (!showSettings) {
    return (
      <button
        onClick={() => setShowSettings(true)}
        className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md w-8 h-8 flex items-center justify-center transition-colors duration-200"
        aria-label="Model settings"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
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
              {MODEL_SIZES.map((key) => (
                <label
                  key={key}
                  className="flex items-center p-3 rounded-lg border border-gray-700 hover:border-gray-600 hover:bg-gray-800 cursor-pointer transition-all duration-200 group"
                >
                  <div className="relative flex items-center">
                    <input
                      type="radio"
                      name="modelSize"
                      checked={selectedModel === key}
                      onChange={() => handleModelChange(key)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${selectedModel === key
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-500 group-hover:border-gray-400"
                        }`}
                    >
                      {selectedModel === key && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center">
                      <span className="text-white font-medium">
                        {MODEL_SIZE_NAMES[key]}
                      </span>
                      {key === "LARGE" && (
                        <span className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded-full">
                          Highest Quality
                        </span>
                      )}
                      {key === "MEDIUM" && (
                        <span className="ml-2 px-2 py-1 text-xs bg-purple-600 text-white rounded-full">
                          Balanced
                        </span>
                      )}
                      {key === "SMALL" && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded-full">
                          Fast
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {showReloadMessage && (
              <div className="mt-5 p-2 bg-yellow-900/20 border border-yellow-600/30 rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 text-yellow-400 flex-shrink-0">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-yellow-300">
                    Changes take effect on the next page reload.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={handleResetPreference}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
              >
                Reset to Auto
              </button>
              {showReloadMessage && (
                <button
                  onClick={() => {
                    // Clear chat history before refresh
                    clearMessageHistory();
                    // Store flag to reopen chat after refresh
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('reopenChatAfterRefresh', 'true');
                    }
                    // Refresh the page
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg transition-colors duration-200 font-medium"
                >
                  Reload
                </button>
              )}
            </div>
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
