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
      className={`bg-gray-700 p-2 rounded text-white whitespace-pre-line mt-2 ${
        loading ? "" : "border"
      }`}
    >
      {loading || loadingMessage ? (
        <div className="flex items-center gap-2">
          <span>
            <div className="w-6 h-6 border-4 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          </span>
          <p className="text-stone-400">{loadingMessage}</p>
        </div>
      ) : !result?.length ? (
        <Typewriter text={defaultMessage} delay={200} />
      ) : (
        <p>{result}</p>
      )}
    </div>
  );
}
