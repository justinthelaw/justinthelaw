import ChatBoxInputArea from "@/components/ChatBox/ChatBoxInputArea";
import ModelSelector from "@/components/ChatBox/ModelSelector";

interface ChatBoxProps {
  onClose: () => void;
}

export default function ChatBox({ onClose }: ChatBoxProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40 p-6">
      <div className="border border-gray-700 bg-black rounded-lg shadow-lg p-5 relative max-h-[70vh] w-full max-w-2xl mx-auto overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center">
            <span className="mr-2">AI Chatbot</span> <span role="img" aria-label="robot">🤖</span>
          </h3>
          <div className="flex space-x-3 items-center">
            <ModelSelector />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl bg-transparent hover:bg-black rounded-full w-8 h-8 flex items-center justify-center"
            >
              &times;
            </button>
          </div>
        </div>
        <div className="flex-grow">
          <ChatBoxInputArea />
        </div>
      </div>
    </div>
  );
}
