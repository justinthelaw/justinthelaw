import { useState } from "react";
import Typewriter from "@/components/ChatBox/Typewriter";
import { ChatMessage } from "@/components/ChatBox/utils/messageHistory";

interface ChatBoxInputResultAreaProps {
  loading: boolean;
  result: string;
  loadingMessage: string | null;
  messageHistory: ChatMessage[];
  answering: boolean;
}

// Move quirkMessages outside component to avoid dependency issues
const QUIRK_MESSAGES = [
  "Digging into Justin's history...",
  "Consulting my Justin database...",
  "Channeling my inner Justin...",
  "Reading Justin's mind...",
  "Checking Justin's secret diary...",
  "Analyzing Justin's preferences...",
  "Decoding Justin's GitHub commits...",
  "Making up an answer for you...",
  "Searching the dark web...",
  "Wondering the same thing you are...",
];

export default function ChatBoxInputResultArea({
  loading,
  result,
  loadingMessage,
  messageHistory,
  answering,
}: ChatBoxInputResultAreaProps) {
  // Generate random message once on component mount to avoid impurity issues
  const [randomQuirkMessage] = useState(() => 
    QUIRK_MESSAGES[Math.floor(Math.random() * QUIRK_MESSAGES.length)]
  );

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
                      <span>{randomQuirkMessage}</span>
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
