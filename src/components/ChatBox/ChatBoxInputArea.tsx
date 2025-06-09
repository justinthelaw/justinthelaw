import { useState, useEffect, useRef, useCallback, Fragment } from "react";

import ChatBoxInputResultArea from "@/components/ChatBox/ChatBoxInputResultArea";
import { MODEL_SELECTION } from "@/components/ChatBox/utils/modelSelection";

export default function ChatBoxInput() {
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [answering, setAnswering] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<string>("");

  const worker = useRef<Worker | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define retry handler outside of effect for closure consistency
  const handleRetry = useCallback(() => {
    if (worker.current) {
      setLoadingMessage("Retrying model download...");
      // Send fresh model selection on retry
      const workerModelSelection = {
        model: MODEL_SELECTION.model,
        dtype: MODEL_SELECTION.dtype || "fp32"
      };
      worker.current.postMessage({ 
        action: "init", 
        modelSelection: workerModelSelection 
      });
      worker.current.postMessage({ action: "load" });
    }
  }, []);

  useEffect(() => {
    console.log("Initializing worker for model loading...");
    worker.current = new Worker(
      new URL("@/components/ChatBox/utils/generation.ts", import.meta.url),
      {
        type: "module",
      }
    );
    
    // Add event listener for retry button
    document.addEventListener('retryModelLoad', handleRetry);
    
    // Send model selection to worker - safe non-window-dependent version for worker
    const workerModelSelection = {
      model: MODEL_SELECTION.model,
      dtype: MODEL_SELECTION.dtype || "fp32"
    };

    const handleMessage = (e: MessageEvent) => {
      const status = e.data.status;
      const response = e.data.response;

      switch (status) {
        case "load":
          setLoading(true);
          if (response && typeof response === 'object') {
            if (response.progress !== undefined) {
              // Set loading message with progress percentage
              const progressPercent = Math.round(response.progress / 100);
              setLoadingMessage(
                `Downloading model... (${progressPercent}%)`
              );
            } else if (response.error) {
              // Handle error messages
              const errorMessage = `Error loading model: ${response.error}`;
              setLoadingMessage(errorMessage);
              console.error(errorMessage);
            } else {
              // Generic loading message if no progress data
              setLoadingMessage("Loading model...");
            }
          } else {
            // Generic loading message if no response data
            setLoadingMessage("Loading model...");
          }
          break;
        case "done":
          setLoading(false);
          setLoadingMessage(null);
          setAnswering(false);
          break;
        case "initiate":
          setLoading(true);
          setLoadingMessage("Generating an answer...");
          setResult("");
          break;
        case "stream":
          setLoading(false);
          setLoadingMessage(null);
          setAnswering(true);
          setResult((prev) => prev + response);
          break;
      }
    };

    if (worker.current) {
      worker.current.addEventListener("message", handleMessage);
      
      // Add error handling for worker
      worker.current.addEventListener("error", (error) => {
        console.error("Worker error:", error);
        setLoadingMessage(`Error initializing model: ${error.message}`);
      });
      
      console.log("Starting model load process...");
      // First send the model selection, then load the model
      worker.current.postMessage({ 
        action: "init", 
        modelSelection: workerModelSelection 
      });
      worker.current.postMessage({ action: "load" });
      setLoadingMessage("Initializing model...");
    }

    // Save current worker reference to avoid closure issues
    const currentWorker = worker.current;
    
    return () => {
      // Remove the retry event listener
      document.removeEventListener('retryModelLoad', handleRetry);
      
      // Clean up worker if it exists
      if (currentWorker) {
        currentWorker.removeEventListener("message", handleMessage);
        // Properly terminate worker when component unmounts
        currentWorker.terminate();
      }
    };
  }, []);

  const textGeneration = useCallback((input: string) => {
    if (worker.current) {
      setLoading(true);
      setResult("");
      worker.current.postMessage({ input: input });
    }
  }, []);

  const handleSend = () => {
    textGeneration(inputText);
  };

  return (
    <Fragment>
      <div className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          type="text"
          className={`w-full p-2 text-white rounded border border-gray-800 bg-black focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500`}
          placeholder={loading ? "Loading model..." : "Enter a question..."}
          value={inputText}
          disabled={loading || answering}
          onChange={(e) => setInputText(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          onClick={handleSend}
          className="bg-gray-800 hover:bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50 transition"
          disabled={loading || !inputText.trim()}
        >
          Send
        </button>
      </div>
      <ChatBoxInputResultArea
        loadingMessage={loadingMessage}
        result={result}
        loading={loading}
      />
    </Fragment>
  );
}
