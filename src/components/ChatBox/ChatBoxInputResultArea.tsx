import Typewriter from "@/components/ChatBox/Typewriter";
import { ChatMessage } from "@/components/ChatBox/utils/messageHistory";

interface ChatBoxInputResultAreaProps {
  loading: boolean;
  result: string;
  loadingMessage: string | null;
  messageHistory: ChatMessage[];
  answering: boolean;
}

export default function ChatBoxInputResultArea({
  loading,
  result,
  loadingMessage,
  messageHistory,
  answering,
}: ChatBoxInputResultAreaProps) {
  const quirkMessages = [
    "Digging into Justin's history...",
    "Consulting my Justin database...",
    "Channeling my inner Justin...",
    "Reading Justin's mind from afar...",
    "Checking Justin's secret diary...",
    "Analyzing Justin's preferences...",
    "Decoding Justin's GitHub commits...",
  ];

  const getRandomQuirkMessage = () => {
    return quirkMessages[Math.floor(Math.random() * quirkMessages.length)];
  };

  return (
    <div className="space-y-4">
      {/* Loading state - only for initial model loading, not for generating answers */}
      {(loading || loadingMessage) &&
      !loadingMessage?.includes("Generating") ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-gray-300">{loadingMessage || "Loading..."}</p>
          </div>
          {loadingMessage && loadingMessage.includes("Error") && (
            <div className="mt-3 flex flex-col items-center gap-2">
              {loadingMessage.includes("memory") && (
                <p className="text-sm text-red-400 text-center max-w-xs">
                  Your device doesn&apos;t have enough available memory to run
                  this model. Try closing other tabs or applications to free up
                  memory.
                </p>
              )}
              <button
                onClick={() => {
                  // Force reload the model - using parent's retry handler instead of custom event
                  if (typeof window !== "undefined" && window.parent) {
                    const event = new Event("retryModelLoad", {
                      bubbles: true,
                    });
                    document.dispatchEvent(event);
                  }
                }}
                className="mt-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                {loadingMessage.includes("memory")
                  ? "Try Smaller Model"
                  : "Retry Model Download"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Display message history */}
          {messageHistory.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.type === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-white"
                }`}
              >
                <div className="text-xs mb-1 opacity-70">
                  {message.type === "user" ? "You" : "AI Assistant"}
                </div>
                <div className="leading-relaxed whitespace-pre-line">
                  {/* Show typewriter effect only for the first AI message if it's the welcome message */}
                  {message.type === "ai" && 
                   messageHistory.length === 1 && 
                   message.id === messageHistory[0].id ? (
                    <Typewriter text={message.content} delay={200} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Show AI response being generated or typed */}
          {(answering || result || loadingMessage?.includes("Generating")) && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg p-3 max-w-[80%]">
                <div className="text-gray-300 text-sm mb-1">AI Assistant</div>
                <div className="text-white leading-relaxed whitespace-pre-line">
                  {loadingMessage?.includes("Generating") ? (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="w-3 h-3 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                      <span>{getRandomQuirkMessage()}</span>
                    </div>
                  ) : (
                    <>
                      {result}
                      {answering && <span className="animate-pulse">|</span>}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
