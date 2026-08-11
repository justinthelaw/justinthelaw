import { Fragment, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { BotIcon } from "lucide-react";
import { DERIVED_CONFIG, SITE_CONFIG } from "@/config/site";
import { LinkIconButton } from "@/components/links";
import { GitHubProfile } from "@/components/profile";
import { ResumeViewer } from "@/components/resume";
import { Button } from "@/components/ui/button";

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
  const [showChatBox, setShowChatBox] = useState(false);
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
        <link rel="canonical" href={DERIVED_CONFIG.siteUrl} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={DERIVED_CONFIG.siteUrl} />
        <meta property="og:title" content={SITE_CONFIG.seo.title} />
        <meta property="og:description" content={SITE_CONFIG.seo.description} />
        <meta property="og:image" content={SITE_CONFIG.seo.imageUrl} />
        <meta
          property="og:image:alt"
          content={`${SITE_CONFIG.fullName}'s profile photo`}
        />
        <meta property="profile:username" content={SITE_CONFIG.githubUsername} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={SITE_CONFIG.seo.title} />
        <meta name="twitter:description" content={SITE_CONFIG.seo.description} />
        <meta name="twitter:image" content={SITE_CONFIG.seo.imageUrl} />
        <meta
          name="twitter:image:alt"
          content={`${SITE_CONFIG.fullName}'s profile photo`}
        />
      </Head>

      <div className="relative grid min-h-svh grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden bg-background px-3 pb-4 pt-8 text-foreground sm:px-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,oklch(0.24_0.008_285.95_/_0.38),transparent_68%)]"
        />

        <header className="relative z-10 flex flex-col items-center gap-3">
          <h1
            className="font-heading text-center text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl"
            data-testid="main-header"
          >
            {SITE_CONFIG.fullName}
          </h1>
          <GitHubProfile />
        </header>

        <main className="relative z-10 flex min-h-0 items-center justify-center overflow-hidden">
          <ResumeViewer />
        </main>

        <footer
          className="relative z-10 mx-auto flex items-center justify-center gap-1 rounded-xl border border-border/70 bg-card/70 p-1 shadow-sm backdrop-blur-sm md:gap-2"
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
          <Button
            ref={chatButtonRef}
            type="button"
            variant="outline"
            size="lg"
            className="fixed right-4 bottom-4 z-40 h-11 border-border/80 bg-card/95 px-3 text-foreground shadow-lg backdrop-blur-sm hover:bg-accent"
            onClick={() => setShowChatBox(true)}
            aria-label="Open AI chatbot"
            data-testid="ai-chatbot-button"
          >
            <BotIcon className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">AI Chatbot</span>
          </Button>
        )}

        {showChatBox && <ChatContainer onClose={closeChatBox} />}
      </div>
    </Fragment>
  );
}
