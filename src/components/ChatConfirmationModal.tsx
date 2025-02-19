// src/components/LLMChatModal.tsx
import React from "react";

interface ChatConfirmationModal {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ChatConfirmationModal({
  onConfirm,
  onCancel,
}: ChatConfirmationModal) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end z-50 p-4">
      <div className="border bg-black p-4 rounded shadow-lg">
        <p className="mb-4">Activate local LLM inferencing?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1 bg-red-500 rounded">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-3 py-1 bg-blue-500 rounded">
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
