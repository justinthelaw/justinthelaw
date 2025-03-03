import { useState, useEffect, useRef, useCallback, Fragment } from "react";

import ChatBoxInputResultArea from "@/components/ChatBox/ChatBoxInputResultArea";

export default function ChatBoxInput() {
  const [inputText, setInputText] = useState<string>(""); // Controlled input state
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const worker = useRef<Worker | null>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for input field

  useEffect(() => {
    worker.current = new Worker(
      new URL("@/components/ChatBox/utils/generation.ts", import.meta.url),
      {
        type: "module",
      }
    );

    const handleMessage = (e: MessageEvent) => {
      const status = e.data.status;
      const response = e.data.response;

      switch (status) {
        case "done":
          setLoading(false);
          break;
        case "initiate":
          setResult("");
          setLoading(true);
          break;
        case "reading":
          setLoadingMessage("Reading the documents...");
          setLoading(true);
          break;
        case "answering":
          setLoadingMessage("Generating an answer...");
          setLoading(true);
          break;
        case "stream":
          setLoading(false);
          setResult((prev) => prev + response);
          break;
      }
    };

    worker.current.addEventListener("message", handleMessage);
    worker.current.postMessage({ action: "load" });

    return () => worker.current?.removeEventListener("message", handleMessage);
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
          className="bg-gray-700 w-full p-2 border rounded text-white "
          placeholder={loading ? "Loading models..." : "Enter a question..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded disabled:opacity-50"
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
