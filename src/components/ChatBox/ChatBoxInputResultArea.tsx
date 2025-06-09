import Typewriter from "@/components/ChatBox/Typewriter";

interface ChatBoxInputResultAreaProps {
  loading: boolean;
  result: string;
  loadingMessage: string | null;
}

export default function ChatBoxInputResultArea({
  loading,
  result,
  loadingMessage,
}: ChatBoxInputResultAreaProps) {
  const defaultMessage =
    "Hello, I am Justin Law's AI assistant! Got any questions for me?";

  return (
    <div
      className="bg-black p-4 rounded text-white whitespace-pre-line mt-2 border border-gray-700 min-h-[200px] max-h-[400px] overflow-y-auto"
    >
      {loading || loadingMessage ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
            <p className="text-gray-300">{loadingMessage || "Loading..."}</p>
          </div>
          {loadingMessage && loadingMessage.includes("%") && (
            <div className="w-64 h-2 bg-black rounded-full overflow-hidden">
              <div
                className="h-full bg-black transition-all duration-300"
                style={{
                  width: `${parseInt(loadingMessage.match(/\d+/)?.[0] || "0")}%`,
                }}
              />
            </div>
          )}
          {loadingMessage && loadingMessage.includes("Error") && (
            <div className="mt-3 flex flex-col items-center gap-2">
              {loadingMessage.includes("memory") && (
                <p className="text-sm text-red-400 text-center max-w-xs">
                  Your device doesn&apos;t have enough available memory to run this model.
                  Try closing other tabs or applications to free up memory.
                </p>
              )}
              <button
                onClick={() => {
                  // Force reload the model - using parent's retry handler instead of custom event
                  if (typeof window !== 'undefined' && window.parent) {
                    const event = new Event('retryModelLoad', { bubbles: true });
                    document.dispatchEvent(event);
                  }
                }}
                className="mt-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                {loadingMessage.includes("memory") ? "Try Smaller Model" : "Retry Model Download"}
              </button>
            </div>
          )}
        </div>
      ) : !result?.length ? (
        <Typewriter text={defaultMessage} delay={200} />
      ) : (
        <span className="leading-relaxed">{result}</span>
      )}
    </div>
  );
}
