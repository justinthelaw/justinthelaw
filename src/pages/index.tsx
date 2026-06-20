import { Fragment, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { Bot } from "@deemlol/next-icons";
import { SITE_CONFIG } from "@/config/site";
import { LinkIconButton } from "@/components/links";
import { GitHubProfile } from "@/components/profile";
import { ResumeViewer } from "@/components/resume";

const ChatContainer = dynamic(
  () => import("@/components/chat").then((mod) => ({ default: mod.ChatContainer })),
  { ssr: false }
);

const ProfileVisualizerModal = dynamic(
  () => import("@/components/profile/ProfileVisualizerModal"),
  { ssr: false }
);

interface SocialLinkItem {
  href: string;
  filename: string;
  altText: string;
}

export default function Home(): React.ReactElement {
  const [showChatBox, setShowChatBox] = useState(false);
  const [showProfileVisualizer, setShowProfileVisualizer] = useState(false);
  const chatButtonRef = useRef<HTMLButtonElement>(null);

  function focusChatButtonSoon(): void {
    window.requestAnimationFrame(() => {
      chatButtonRef.current?.focus();
    });
  }

  function closeChatBox(): void {
    setShowChatBox(false);
    focusChatButtonSoon();
  }

  const socialLinks: SocialLinkItem[] = [
    {
      href: SITE_CONFIG.socialLinks.github,
      altText: `${SITE_CONFIG.fullName}'s GitHub Profile`,
      filename: "github.png",
    },
    {
      href: SITE_CONFIG.socialLinks.linkedin,
      altText: `${SITE_CONFIG.fullName}'s LinkedIn Profile`,
      filename: "linkedin.png",
    },
    {
      href: SITE_CONFIG.socialLinks.huggingface,
      altText: `${SITE_CONFIG.fullName}'s HuggingFace Profile`,
      filename: "huggingface.png",
    },
    {
      href: SITE_CONFIG.socialLinks.gitlab,
      altText: `${SITE_CONFIG.fullName}'s GitLab Profile`,
      filename: "gitlab.png",
    },
  ].filter((link) => link.href.length > 0);

  return (
    <Fragment>
      <Head>
        <title>{SITE_CONFIG.seo.title}</title>
        <meta name="description" content={SITE_CONFIG.seo.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="grid grid-rows-[auto_1fr_auto] h-screen gap-2 pb-4 pt-8">
        <div className="flex flex-col items-center gap-4">
          <header
            className="text-center text-3xl sm:text-5xl font-bold"
            data-testid="main-header"
          >
            {SITE_CONFIG.fullName}
          </header>
          <GitHubProfile />
        </div>

        <main className="flex items-center justify-center overflow-hidden">
          <ResumeViewer />
        </main>

        <footer
          className="flex gap-1 sm:gap-1 md:gap-2 lg:gap-3 justify-center pb-2"
          data-testid="social-footer"
        >
          {socialLinks.map((link) => (
            <LinkIconButton
              key={link.filename}
              link={link.href}
              altText={link.altText}
              filename={link.filename}
            />
          ))}
        </footer>

        {!showChatBox && !showProfileVisualizer && (
          <button
            ref={chatButtonRef}
            type="button"
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-lg border border-gray-700 bg-black px-3 py-3 text-white shadow-lg transition-colors duration-200 hover:border-gray-500 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
            onClick={() => setShowChatBox(true)}
            aria-label="Open AI chatbot"
            data-testid="ai-chatbot-button"
          >
            <Bot className="h-5 w-5" aria-hidden="true" />
            <span className="text-lg hidden sm:inline">AI Chatbot</span>
          </button>
        )}

        {showChatBox && !showProfileVisualizer && (
          <ChatContainer
            onClose={closeChatBox}
            onOpenVisualizer={() => {
              setShowChatBox(false);
              setShowProfileVisualizer(true);
            }}
          />
        )}

        {showProfileVisualizer && (
          <ProfileVisualizerModal
            onClose={() => {
              setShowProfileVisualizer(false);
              focusChatButtonSoon();
            }}
          />
        )}
      </div>
    </Fragment>
  );
}
