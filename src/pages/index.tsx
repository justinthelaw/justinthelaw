"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ChatConfirmationModal from "../components/ChatConfirmationModal";

// Dynamically load ChatBox (client-side only)
const ChatBox = dynamic(() => import("../components/ChatBox"), { ssr: false });

export default function Home() {
  // Prevent hydration mismatch by ensuring client-side only changes.
  const [isClient, setIsClient] = useState(false);
  const [path, setPath] = useState("");
  const [showChatModal, setShowChatModal] = useState(false);
  const [loadChat, setLoadChat] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (process.env.NODE_ENV === "production") {
      setPath(
        "https://raw.githubusercontent.com/justinthelaw/justinthelaw/refs/heads/main/public"
      );
    }
  }, []);

  const handleChatConfirm = () => {
    setLoadChat(true);
    setShowChatModal(false);
  };

  const handleChatCancel = () => {
    setShowChatModal(false);
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen gap-2">
      <header className="text-center text-3xl sm:text-5xl font-bold p-6 mt-4">
        Justin Law
      </header>
      {isClient && (
        <>
          <main className="flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-5xl h-full p-2">
              <iframe
                src="https://drive.google.com/file/d/1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp/preview"
                className="w-full h-full border rounded-md shadow-lg"
                title="Justin Law's Resume"
              />
            </div>
          </main>
          <footer className="flex gap-4 p-6 justify-center mb-4">
            <a
              href="https://github.com/justinthelaw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="relative w-8 h-8">
                <Image
                  src={`${path}/github.png`}
                  alt="GitHub icon"
                  fill
                  className="object-contain"
                />
              </div>
            </a>
            <a
              href="https://www.linkedin.com/in/justinwingchunglaw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="relative w-8 h-8">
                <Image
                  src={`${path}/linkedin.png`}
                  alt="LinkedIn icon"
                  fill
                  className="object-contain"
                />
              </div>
            </a>
            <a
              href="https://huggingface.co/justinthelaw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="relative w-8 h-8">
                <Image
                  src={`${path}/huggingface.png`}
                  alt="Hugging Face icon"
                  fill
                  className="object-contain"
                />
              </div>
            </a>
            <a
              href="https://repo1.dso.mil/justinthelaw"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="relative w-8 h-8">
                <Image
                  src={`${path}/gitlab.png`}
                  alt="GitLab icon"
                  fill
                  className="object-contain"
                />
              </div>
            </a>
          </footer>
        </>
      )}
      {!loadChat && (
        <button
          className="fixed border bottom-4 right-4 bg-black text-white p-2 rounded shadow-lg"
          onClick={() => setShowChatModal(true)}
        >
          💬
        </button>
      )}
      {showChatModal && (
        <ChatConfirmationModal
          onConfirm={handleChatConfirm}
          onCancel={handleChatCancel}
        />
      )}
      {loadChat && (
        <div className="fixed bottom-4 right-4">
          <ChatBox onClose={() => setLoadChat(false)} loadChat={loadChat} />
        </div>
      )}
    </div>
  );
}
