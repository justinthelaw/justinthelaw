import { useState, useEffect, useRef, useCallback } from "react";

import Typewriter from "@/components/Typewriter";

interface ChatBoxProps {
  onClose: () => void;
  showChatBox: boolean;
}

export default function ChatBox({ onClose, showChatBox }: ChatBoxProps) {
  const [result, setResult] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>(""); // Controlled input state

  const worker = useRef<Worker | null>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for input field

  const initialMessage =
    "Hello, I am Justin Law's AI assistant! Got any questions for me?";

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
          setResult(e.data.response);
          setLoading(false);
          break;
      }
    };

    worker.current.addEventListener("message", handleMessage);
    worker.current.postMessage({ action: "load" });

    return () => worker.current?.removeEventListener("message", handleMessage);
  }, [showChatBox]);

  const textGeneration = useCallback((text: string) => {
    if (!text.trim()) return;

    setLoading(true);
    setResult(null);

    if (worker.current) {
      worker.current.postMessage({ action: "text-generation", text });
    }
  }, []);

  const handleSend = () => {
    textGeneration(inputText);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-end z-50 p-6">
      <div className="border bg-black rounded-lg shadow-lg p-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-transparent hover:bg-gray-800 rounded-full w-8 h-8 pb-0.5 items-center justify-center"
        >
          🗙
        </button>
        <h3 className="text-lg font-bold mb-3 text-white">AI Chatbot 🤖</h3>
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            className="bg-gray-700 w-full p-2 border rounded text-white "
            placeholder={!ready ? "Loading..." : "Enter a question..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyUp={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            disabled={!ready || loading}
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded disabled:opacity-50"
            disabled={!ready || loading || !inputText.trim()}
          >
            Send
          </button>
        </div>
        <div className="bg-gray-700 p-2 rounded text-white whitespace-pre-line mt-2 overflow-auto max-h-[65vh] max-w-[100vw] lg:xl:w-[40vw]">
          {!ready || loading ? (
            <div className="w-6 h-6 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <Typewriter text={result || ""} delay={15} />
          )}
        </div>
      </div>
    </div>
  );
}
