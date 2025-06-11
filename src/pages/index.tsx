"use client";

import { Fragment, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import LinkIconButton from "@/components/LinkIconButton";
import GitHubProfileDescription from "@/components/GitHubProfileDescription";
import ResumeCoverLetterViewer from "@/components/ResumeCoverLetterViewer";

// NOTE: Dynamically load ChatBox only when user wants AI chat
const ChatBox = dynamic(() => import("../components/ChatBox/ChatBox"), { ssr: false });

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
          This mainly concerns the PDF from Google Drive and Link Icons hosted on GitHub.
    */
    setIsMounted(true);
  }, []);

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen gap-2 pb-4 pt-8">
      <div className="flex flex-col items-center gap-4">
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
          <footer className="flex gap-1 sm:gap-1 md:gap-2 lg:gap-3 justify-center pb-2">
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
          className="fixed border bottom-4 right-4 bg-black text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2"
          onClick={() => setShowChatBox(true)}
        >
          <span className="text-lg hidden sm:inline">AI Chatbot</span>
          <svg className="w-5 h-5" fill="currentColor" viewBox="2 0 20 26">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2A1 1 0 003.8 21.454l3.032-.892A9.958 9.958 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-3 9a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2z"/>
          </svg>
        </button>
      )}
      {showChatBox && <ChatBox onClose={() => setShowChatBox(false)} />}
    </div>
  );
}
