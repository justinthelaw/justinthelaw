import { useState, useEffect, useRef, useCallback } from "react";

import ChatBoxInputResultArea from "@/components/ChatBox/ChatBoxInputResultArea";
import {
  getInitialModelSelection,
  selectModelBasedOnDevice,
} from "@/components/ChatBox/utils/modelSelection";
import {
  getMessageHistory,
  addMessage,
  ChatMessage,
  setGenerating,
} from "@/components/ChatBox/utils/messageHistory";

export default function ChatBoxInput() {
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [answering, setAnswering] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [messageHistory, setMessageHistory] = useState<ChatMessage[]>([]);
  // Add model selection state
  const [modelSelection, setModelSelection] = useState(() => {
    if (typeof window !== "undefined") {
      return selectModelBasedOnDevice();
    }
    return getInitialModelSelection();
  });

  const worker = useRef<Worker | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to create and add a welcome message
  const addWelcomeMessage = useCallback(() => {
    const welcomeMessages = [
      "Hello, I am Justin's AI assistant! Got any questions for me?",
      "Hey there! Got any questions about Justin for me?",
      "Hi! Interested in learning more about Justin?",
      "What would you like to know about Justin?",
      "I heard you had questions about Justin? Just ask away!",
      "Thanks for visiting! Do you want to learn more about Justin?",
    ];

    const randomWelcomeMessage =
      welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    const welcomeMessage = addMessage("ai", randomWelcomeMessage);
    setMessageHistory([welcomeMessage]);
    return welcomeMessage;
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messageHistory, result, answering]);

  // Also scroll when a message starts generating
  useEffect(() => {
    if (answering && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [answering]);

  // Load message history on component mount
  useEffect(() => {
    // Only set message history or add welcome message, never both
    const existingHistory = getMessageHistory();
    if (existingHistory.length > 0) {
      setMessageHistory(existingHistory);
    } else {
      // Clear any possible previous state before adding welcome
      setMessageHistory([]);
      addWelcomeMessage();
    }

    // Listen for clear history events
    const handleClearHistory = () => {
      setMessageHistory([]);
      setResult("");

      // Add welcome message back after clearing
      setTimeout(() => addWelcomeMessage(), 0);
    };

    document.addEventListener("clearChatHistory", handleClearHistory);

    return () => {
      document.removeEventListener("clearChatHistory", handleClearHistory);
    };
  }, [addWelcomeMessage]);

  // Save AI response to history when it's complete
  useEffect(() => {
    if (!answering && result.trim() && !loading) {
      const aiMessage = addMessage("ai", result.trim());
      setMessageHistory((prev) => [...prev, aiMessage]);
      setResult(""); // Clear result after saving to history
    }
  }, [answering, result, loading]);

  // Define retry handler outside of effect for closure consistency
  const handleRetryRef = useRef<() => void>(() => { });
  handleRetryRef.current = () => {
    if (worker.current) {
      const workerModelSelection = {
        model: modelSelection.model,
        dtype: modelSelection.dtype,
      };
      worker.current.postMessage({
        action: "init",
        modelSelection: workerModelSelection,
      });
      worker.current.postMessage({ action: "load" });
    }
  };

  const handleHelperText = () => {
    if (loading) return "Loading model..."
    if (answering) return "Generating answer...";
    return "Type your message..."
  }

  useEffect(() => {
    worker.current = new Worker(
      new URL("@/components/ChatBox/utils/generation.ts", import.meta.url),
      {
        type: "module",
      }
    );

    // Add event listener for retry button
    const retryListener = () =>
      handleRetryRef.current && handleRetryRef.current();
    document.addEventListener("retryModelLoad", retryListener);

    // Send model selection to worker - safe non-window-dependent version for worker
    const workerModelSelection = {
      model: modelSelection.model,
      dtype: modelSelection.dtype,
    };

    const handleMessage = (e: MessageEvent) => {
      const status = e.data.status;
      const response = e.data.response;

      switch (status) {
        case "fallback-model":
          if (response && response.model && response.dtype) {
            setModelSelection({ model: response.model, dtype: response.dtype });
          }
          break;
        case "load": {
          setLoading(true);
          setLoadingMessage(response.message);
          break;
        }
        case "done":
          setLoading(false);
          setLoadingMessage(null);
          setAnswering(false);
          setGenerating(false);
          break;
        case "initiate":
          setLoading(true);
          setLoadingMessage("Generating an answer...");
          setResult("");
          setGenerating(true);
          break;
        case "stream":
          setLoading(false);
          setLoadingMessage(null);
          setAnswering(true);
          setGenerating(true);
          setResult((prev) => prev + response);
          break;
      }
    };

    if (worker.current) {
      worker.current.addEventListener("message", handleMessage);

      // Add error handling for worker
      worker.current.addEventListener("error", (error) => {
        console.error("Worker error:", error);
        setLoadingMessage(null);
        setAnswering(false);
        setGenerating(false);
      });

      // First send the model selection, then load the model
      worker.current.postMessage({
        action: "init",
        modelSelection: workerModelSelection,
      });
      worker.current.postMessage({ action: "load" });
    }

    // Save current worker reference to avoid closure issues
    const currentWorker = worker.current;

    return () => {
      // Remove the retry event listener
      document.removeEventListener("retryModelLoad", retryListener);

      // Clean up worker if it exists
      if (currentWorker) {
        currentWorker.removeEventListener("message", handleMessage);
        // Properly terminate worker when component unmounts
        currentWorker.terminate();
      }
    };
  }, [modelSelection.model, modelSelection.dtype]);

  const textGeneration = useCallback((input: string) => {
    if (worker.current) {
      setLoading(true);
      setResult("");
      worker.current.postMessage({ input: input });
    }
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Save user message to history
    const userMessage = addMessage("user", inputText.trim());
    setMessageHistory((prev) => [...prev, userMessage]);

    // Send only the current message to the AI (no conversation context)
    textGeneration(inputText.trim());
    setInputText(""); // Clear input after sending

    // Immediately scroll to bottom after sending
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Chat messages area - takes up available space */}
      <div className="flex-1 overflow-y-auto mb-3">
        <ChatBoxInputResultArea
          loadingMessage={loadingMessage}
          result={result}
          loading={loading}
          messageHistory={messageHistory}
          answering={answering}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - fixed at bottom */}
      <div className="flex gap-2 border-t border-gray-700 pt-3">
        <input
          ref={inputRef}
          type="text"
          className={`w-full p-3 text-white rounded-md border border-gray-700 bg-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          placeholder={handleHelperText()}
          value={inputText}
          disabled={loading || answering}
          onChange={(e) => setInputText(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          onClick={handleSend}
          className="border border-black bg-blue-600 hover:bg-blue-700 text-white px-3 py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center h-[52px] w-[52px]"
          disabled={loading || !inputText.trim()}
          aria-label="Send message"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
