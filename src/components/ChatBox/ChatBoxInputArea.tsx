import { useState, useEffect, useRef, useCallback, Fragment } from "react";

import ChatBoxInputResultArea from "@/components/ChatBox/ChatBoxInputResultArea";

export default function ChatBoxInput() {
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [answering, setAnswering] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>("");
  const [result, setResult] = useState<string>("");

  const worker = useRef<Worker | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    worker.current = new Worker(
      new URL(
        "@/components/ChatBox/utils/answerGeneration.ts",
        import.meta.url
      ),
      {
        type: "module",
      }
    );

    const handleMessage = (e: MessageEvent) => {
      const status = e.data.status;
      const response = e.data.response;

      switch (status) {
        case "load":
          setLoading(true);
          if (response?.progress && response?.name) {
            setLoadingMessage(
              `Loading \`${response.name}\`... (${Math.round(
                response.progress
              )}%)`
            );
          }
          break;
        case "done":
          setLoading(false);
          setLoadingMessage(null);
          setAnswering(false);
          break;
        case "read":
          setLoadingMessage("Reading context...");
          setLoading(true);
          setResult("");
          break;
        case "answer":
          setLoadingMessage("Generating an answer...");
          setLoading(true);
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
      <div className="gap-2 mb-3">
        <ChatBoxInputResultArea
          loadingMessage={loadingMessage}
          result={result}
          loading={loading}
        />
      </div>
      <div className="flex gap-2 mb-3">
        <input
          ref={inputRef}
          type="text"
          className={`w-full p-2 text-white rounded bg-gray-700 ${
            loading ? "" : "border"
          }`}
          placeholder={loading ? "Loading..." : "Enter a question..."}
          value={inputText}
          disabled={loading || answering}
          onChange={(e) => setInputText(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded disabled:opacity-50"
          disabled={loading || !inputText.trim()}
        >
          Send
        </button>
      </div>
    </Fragment>
  );
}
