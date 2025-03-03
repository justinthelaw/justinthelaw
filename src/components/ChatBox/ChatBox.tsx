import ChatBoxInputArea from "@/components/ChatBox/ChatBoxInputArea";

interface ChatBoxProps {
  onClose: () => void;
}

export default function ChatBox({ onClose }: ChatBoxProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-end justify-end z-50 p-6">
      <div className="border bg-black rounded-lg shadow-lg p-4 relative max-h-[40vh] sm:w-[100vw] md:w-[40vw] lg:w-[40vw] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-2xl bg-transparent hover:bg-gray-800 rounded-full w-8 h-8 pb-0.5 items-center justify-center"
        >
          &times;
        </button>
        <h3 className="text-lg font-bold mb-3 text-white">
          AI Chatbot 🤖
        </h3>
        <ChatBoxInputArea />
      </div>
    </div>
  );
}
