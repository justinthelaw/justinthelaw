"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import ChatConfirmationModal from "../components/ChatConfirmationModal";
import LinkIconButton from "@/components/LinkIconButton";

// Dynamically load ChatBox (client-side only)
const ChatBox = dynamic(() => import("../components/ChatBox"), { ssr: false });

export default function Home() {
  // Prevent hydration mismatch by ensuring client-side only changes.
  const [isClient, setIsClient] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [loadChat, setLoadChat] = useState(false);

  useEffect(() => {
    setIsClient(true);
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
      <div className="p-4 mt-6">
        <header className="text-center text-3xl sm:text-5xl font-bold ">
          Justin Law
        </header>
        <p className="text-center mt-4">
          A truly full-stack engineer, with expertise ranging from bare metal
          infrastructure to frontend development, and everything in between!
        </p>
      </div>
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
          <footer className="flex gap-4 p-4 justify-center mb-6">
            <LinkIconButton
              link="https://github.com/justinthelaw"
              altText="Justin's GitHub Profile"
              filename="github.png"
            />
            <LinkIconButton
              link="https://www.linkedin.com/in/justinwingchunglaw"
              altText="Justin's LinkedIn Profile"
              filename="linkedin.png"
            />
            <LinkIconButton
              link="https://huggingface.co/justinthelaw"
              altText="Justin's HuggingFace Profile"
              filename="huggingface.png"
            />
            <LinkIconButton
              link="https://repo1.dso.mil/justinthelaw"
              altText="Justin's GitLab Profile"
              filename="gitlab.png"
            />
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
