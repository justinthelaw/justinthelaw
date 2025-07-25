import { useState, useEffect } from "react";
import ChatBoxInputArea from "@/components/ChatBox/ChatBoxInputArea";
import ModelSelector from "@/components/ChatBox/ModelSelector";
import { clearMessageHistory, getIsGenerating } from "@/components/ChatBox/utils/messageHistory";

interface ChatBoxProps {
  onClose: () => void;
}

export default function ChatBox({ onClose }: ChatBoxProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Check generation status periodically
  useEffect(() => {
    const checkGenerationStatus = () => {
      setIsGenerating(getIsGenerating());
    };

    // Check immediately
    checkGenerationStatus();

    // Set up interval to check periodically
    const interval = setInterval(checkGenerationStatus, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleClearHistory = () => {
    clearMessageHistory();
    // Dispatch a custom event to notify input area to refresh
    const event = new CustomEvent('clearChatHistory');
    document.dispatchEvent(event);
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Large screens: bottom right chat box */}
      <div className="hidden lg:block pointer-events-auto">
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-black border border-gray-700 rounded-lg shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white flex items-center">
              <span className="mr-2">AI Chatbot</span>
            </h3>
            <div className="flex space-x-2 items-center">
              <ModelSelector />
              <button
                onClick={handleClearHistory}
                disabled={isGenerating}
                className={`${
                  isGenerating 
                    ? 'text-gray-600 bg-gray-900 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700'
                } rounded-md w-8 h-8 flex items-center justify-center transition-colors duration-200`}
                aria-label="Clear chat history"
                title={isGenerating ? "Cannot clear history while generating" : "Clear chat history"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

          {/* Chat content area */}
          <div className="flex-1 overflow-hidden">
            <ChatBoxInputArea />
          </div>
        </div>
      </div>

      {/* Small/medium screens: full modal overlay */}
      <div className="lg:hidden pointer-events-auto">
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-700 rounded-lg shadow-2xl w-full max-w-md h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="mr-2">AI Chatbot</span>
              </h3>
              <div className="flex space-x-2 items-center">
                <ModelSelector />
                <button
                  onClick={handleClearHistory}
                  disabled={isGenerating}
                  className={`${
                    isGenerating 
                      ? 'text-gray-600 bg-gray-900 cursor-not-allowed' 
                      : 'text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700'
                  } rounded-md w-8 h-8 flex items-center justify-center transition-colors duration-200`}
                  aria-label="Clear chat history"
                  title={isGenerating ? "Cannot clear history while generating" : "Clear chat history"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

            {/* Chat content area */}
            <div className="flex-1 overflow-hidden">
              <ChatBoxInputArea />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
