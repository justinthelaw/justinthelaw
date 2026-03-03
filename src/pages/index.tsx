import { Fragment, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { SITE_CONFIG } from "@/config/site";
import { LinkIconButton } from "@/components/links";
import { GitHubProfile } from "@/components/profile";
import { ResumeViewer } from "@/components/resume";
import { useModelStore } from "@/stores/modelStore";

const ChatContainer = dynamic(
  () => import("@/components/chat").then((mod) => ({ default: mod.ChatContainer })),
  { ssr: false }
);

interface SocialLinkItem {
  href: string;
  filename: string;
  altText: string;
}

export default function Home(): React.ReactElement {
  const { shouldReopenChat, setShouldReopenChat } = useModelStore();
  const [showChatBox, setShowChatBox] = useState(shouldReopenChat);

  useEffect(() => {
    if (shouldReopenChat) {
      setShouldReopenChat(false);
    }
  }, [setShouldReopenChat, shouldReopenChat]);

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

        {!showChatBox && (
          <button
            className="fixed border bottom-4 right-4 bg-black text-white p-3 rounded-lg shadow-lg hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2"
            onClick={() => setShowChatBox(true)}
            data-testid="ai-chatbot-button"
          >
            <span className="text-lg hidden sm:inline">AI Chatbot</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="2 0 20 26">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2A1 1 0 003.8 21.454l3.032-.892A9.958 9.958 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm-3 9a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2zm3 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
          </button>
        )}

        {showChatBox && <ChatContainer onClose={() => setShowChatBox(false)} />}
      </div>
    </Fragment>
  );
}
