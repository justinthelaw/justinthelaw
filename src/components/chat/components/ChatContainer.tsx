/**
 * ChatContainer Component
 * Main container orchestrating chat functionality with all hooks and child components
 */

import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { Trash2Icon, XIcon } from "lucide-react";

import { CHATBOT_CONFIG } from "@/config";
import { MODEL_DOWNLOAD_SIZE_MB } from "@/config/models";
import {
  getPersonalContextBudget,
  getRecentConversationTurns,
} from "@/services/ai/contextProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIGeneration, useChatHistory, useModelManagement } from "../hooks";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";

export interface ChatContainerProps {
  onClose: () => void;
}

export function ChatContainer({ onClose }: ChatContainerProps): React.ReactElement {
  const shouldReduceMotion = useReducedMotion();
  const { messages, clearHistory, canClear } = useChatHistory();
  const { isGenerating, currentResponse, generate } = useAIGeneration();
  const {
    isLoading,
    isReady,
    error,
    loadingMessage,
    startModelLoad,
  } = useModelManagement();
  const personalContextBudget = getPersonalContextBudget();
  const welcomeMessages = new Set<string>(CHATBOT_CONFIG.welcomeMessages);
  const conversationTurns = getRecentConversationTurns(
    messages.filter((message) => !welcomeMessages.has(message.content))
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  }, [messages, currentResponse, isGenerating, isLoading, shouldReduceMotion]);

  function handleSend(message: string): void {
    if (error) {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      return;
    }

    if (!isReady) {
      return;
    }

    generate(message);
  }

  function handleClearHistory(): void {
    if (canClear) {
      clearHistory();
    }
  }

  function handleOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      onClose();
    }
  }

  const placeholder = error
    ? "Retry loading to chat…"
    : isLoading && !isReady
      ? "Loading…"
      : isGenerating
        ? "Replying…"
        : !isReady
          ? "Start chat to ask a question…"
          : "Ask a question…";

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex h-[min(80vh,46rem)] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden border border-border/80 bg-popover/98 p-0 shadow-2xl ring-1 ring-white/5 lg:top-auto lg:right-6 lg:bottom-6 lg:left-auto lg:h-[min(42rem,calc(100vh-3rem))] lg:w-[28rem] lg:max-w-none lg:translate-x-0 lg:translate-y-0"
        onCloseAutoFocus={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          closeButtonRef.current?.focus();
        }}
        onPointerDownOutside={(event) => event.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader className="flex-row items-center justify-between gap-2 border-b border-border/70 px-4 py-3.5">
          <div className="min-w-0 space-y-1">
            <DialogTitle className="text-base font-medium tracking-tight">
              AI Chatbot
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Private, on-device
            </DialogDescription>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              aria-label="Clear chat history"
              data-testid="chat-clear-button"
              disabled={isGenerating}
              onClick={handleClearHistory}
              size="icon"
              type="button"
              variant="ghost"
              tooltip={isGenerating ? "Clear after reply" : "Clear chat history"}
              tooltipId="chat-clear-tooltip"
              tooltipSide="bottom"
            >
              <Trash2Icon aria-hidden="true" className="size-4" />
            </Button>

            <DialogClose asChild>
              <Button
                aria-label="Close chat"
                tooltip="Close chat"
                tooltipSide="bottom"
                ref={closeButtonRef}
                size="icon"
                type="button"
                variant="ghost"
              >
                <XIcon aria-hidden="true" className="size-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <ScrollArea
          className="min-h-0 flex-1 bg-background/35"
          data-testid="chat-messages-scroll"
        >
          <div className="flex min-h-full flex-col p-4">
            {!isReady && !isLoading && !error ? (
              <section
                aria-label="Start private chat"
                className="m-auto w-full max-w-sm space-y-4 px-2 text-center"
                data-testid="model-download-consent"
              >
                <h2 className="font-heading text-base font-medium">Chat privately</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Downloads about {MODEL_DOWNLOAD_SIZE_MB} MB; a compatibility fallback
                  may download another {MODEL_DOWNLOAD_SIZE_MB} MB. Chats stay in this browser.
                </p>
                <Button
                  data-testid="model-load-button"
                  onClick={startModelLoad}
                  size="lg"
                  type="button"
                  tooltip="Start private chat"
                >
                  Start chat
                </Button>
              </section>
            ) : (
              <ChatMessages
                currentResponse={currentResponse}
                error={error}
                isGenerating={isGenerating}
                isLoading={isLoading}
                loadingMessage={loadingMessage}
                messages={messages}
                onRetryModelLoad={startModelLoad}
                showPersonalContextTrimWarning={personalContextBudget.isTrimmed}
                trimmedPersonalContextCharacters={
                  personalContextBudget.trimmedCharacters
                }
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <ChatInput
          conversationTurns={conversationTurns}
          isInputDisabled={!isReady || isGenerating || !!error}
          isSendDisabled={!isReady || isGenerating || !!error}
          onSend={handleSend}
          placeholder={placeholder}
        />
      </DialogContent>
    </Dialog>
  );
}
