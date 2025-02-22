"use client";

import { Fragment, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import LinkIconButton from "@/components/LinkIconButton";
import GitHubProfileDescription from "@/components/GitHubProfileDescription";
import ResumeCoverLetterViewer from "@/components/ResumeCoverLetterViewer";

// NOTE: Dynamically load ChatBox only when user wants AI chat
const ChatBox = dynamic(() => import("../components/ChatBox"), { ssr: false });

export default function Home() {
  const [showChatBox, setShowChatBox] = useState(false);
  const [path] = useState(
    process.env.NODE_ENV === "production"
      ? "https://raw.githubusercontent.com/justinthelaw/justinthelaw/refs/heads/main/public"
      : ""
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    /* 
    NOTE: This ensures this component (index.tsx) is mounted prior to final hydration.
          Mainly concerns the PDF from Google Drive and Link Icons hosted on GitHub
    */
    setIsMounted(true);
  }, []);

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen gap-2 py-6">
      <div className="px-5 py-2 flex flex-col items-center gap-4">
        <header className="text-center text-3xl sm:text-5xl font-bold">
          Justin Law
        </header>
        <GitHubProfileDescription />
      </div>

      {isMounted && (
        <Fragment>
          <main className="flex items-center justify-center overflow-hidden">
            <ResumeCoverLetterViewer />
          </main>
          <footer className="flex gap-1 sm:gap-1 md:gap-2 lg:gap-3 justify-center py-2">
            <LinkIconButton
              link="https://github.com/justinthelaw"
              altText="Justin's GitHub Profile"
              filename="github.png"
              path={path}
            />
            <LinkIconButton
              link="https://www.linkedin.com/in/justinwingchunglaw"
              altText="Justin's LinkedIn Profile"
              filename="linkedin.png"
              path={path}
            />
            <LinkIconButton
              link="https://huggingface.co/justinthelaw"
              altText="Justin's HuggingFace Profile"
              filename="huggingface.png"
              path={path}
            />
            <LinkIconButton
              link="https://repo1.dso.mil/justinthelaw"
              altText="Justin's GitLab Profile"
              filename="gitlab.png"
              path={path}
            />
          </footer>
        </Fragment>
      )}
      {!showChatBox && (
        <button
          className="fixed border bottom-4 right-4 bg-black text-white p-2 rounded-lg shadow-lg hover:bg-gray-800"
          onClick={() => setShowChatBox(true)}
        >
          <span className="hidden sm:inline">AI Chatbot</span> 💬
        </button>
      )}
      {showChatBox && (
        <div className="fixed bottom-4 right-4">
          <ChatBox
            onClose={() => setShowChatBox(false)}
            showChatBox={showChatBox}
          />
        </div>
      )}
    </div>
  );
}
