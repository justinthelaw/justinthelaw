import { useState, useEffect, useRef, useCallback } from "react";

interface ChatBoxProps {
  onClose: () => void;
  loadChat: boolean;
}

export default function ChatBox({ onClose, loadChat }: ChatBoxProps) {
  const [result, setResult] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // Added loading state

  const worker = useRef<Worker | null>(null);

  const initialMessage =
    "Hello, my name is Justin Law! Got any questions for me?";

  useEffect(() => {
    worker.current = new Worker(
      new URL("../model/worker.js", import.meta.url),
      {
        type: "module",
      }
    );

    const handleMessage = (e: MessageEvent) => {
      switch (e.data.status) {
        case "initiate":
          setResult(initialMessage);
          setReady(false);
          break;
        case "ready":
          setResult(initialMessage);
          setReady(true);
          break;
        case "complete":
          setResult(e.data.output[0].generated_text);
          setLoading(false); // Stop loading when complete
          break;
      }
    };

    worker.current.addEventListener("message", handleMessage);

    worker.current.postMessage({ action: "load" });

    return () => worker.current?.removeEventListener("message", handleMessage);
  }, [loadChat]);

  const textGeneration = useCallback((text: string) => {
    setLoading(true); // Start loading
    setResult(null); // Clear previous result
    if (worker.current) {
      worker.current.postMessage({ action: "text-generation", text });
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end z-50 p-4">
      <div className="border bg-black rounded-lg shadow-lg p-4 w-80 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-transparent hover:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center"
        >
          &times;
        </button>
        <h3 className="text-lg font-bold mb-2 text-white">LLM Chat</h3>
        <input
          type="text"
          className="bg-gray-700 w-full p-2 border rounded mb-2 text-white"
          placeholder="Enter a question..."
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              textGeneration((e.target as HTMLInputElement).value);
            }
          }}
        />
        <div className="bg-gray-700 p-2 rounded h-32 overflow-y-auto text-white whitespace-pre-line">
          {!ready || loading ? (
            <div className="w-6 h-6 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
          ) : (
            result
          )}
        </div>
      </div>
    </div>
  );
}
