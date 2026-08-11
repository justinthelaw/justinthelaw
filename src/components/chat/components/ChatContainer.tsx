/**
 * ChatContainer Component
 * Main container orchestrating chat functionality with all hooks and child components
 */

import React, { useEffect, useId, useRef } from "react";
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
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useAIGeneration, useChatHistory, useModelManagement } from "../hooks";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";

export interface ChatContainerProps {
  onClose: () => void;
}

export function ChatContainer({ onClose }: ChatContainerProps): React.ReactElement {
  const downloadTitleId = useId();
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
    ? "Model failed to load. Please refresh the page."
    : isLoading && !isReady
      ? "Loading model..."
      : isGenerating
        ? "Generating answer..."
        : !isReady
          ? "Load the AI model to start chatting..."
          : "Type your message...";
  const clearButton = (
    <Button
      aria-label="Clear chat history"
      data-testid="chat-clear-button"
      disabled={isGenerating}
      onClick={handleClearHistory}
      size="icon"
      type="button"
      variant="ghost"
    >
      <Trash2Icon aria-hidden="true" className="size-4" />
    </Button>
  );

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex h-[min(80vh,46rem)] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden border border-border/80 bg-popover/98 p-0 shadow-2xl ring-1 ring-white/5 lg:top-auto lg:right-6 lg:bottom-6 lg:left-auto lg:h-[600px] lg:w-96 lg:max-w-none lg:translate-x-0 lg:translate-y-0"
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
              Private, on-device profile assistant
            </DialogDescription>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Tooltip>
              {isGenerating ? (
                <TooltipTrigger asChild>
                  <span
                    aria-label="Cannot clear history while generating"
                    className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    tabIndex={0}
                  >
                    {clearButton}
                  </span>
                </TooltipTrigger>
              ) : (
                <TooltipTrigger asChild>{clearButton}</TooltipTrigger>
              )}
              <TooltipContent
                data-testid="chat-clear-tooltip"
                id="chat-clear-tooltip"
                side="bottom"
                sideOffset={6}
              >
                {isGenerating
                  ? "Cannot clear history while generating"
                  : "Clear chat history"}
              </TooltipContent>
            </Tooltip>

            <DialogClose asChild>
              <Button
                aria-label="Close chat"
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
                aria-labelledby={downloadTitleId}
                className="m-auto w-full max-w-sm"
                data-testid="model-download-consent"
              >
                <Card className="gap-0 border border-border/70 bg-card/80 py-0 text-center ring-0">
                  <CardHeader className="gap-2 px-5 pt-5 pb-4">
                    <CardTitle id={downloadTitleId}>
                      Run the AI model on this device
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                      Loading the chatbot downloads about {MODEL_DOWNLOAD_SIZE_MB} MB.
                      If the first format is incompatible, its fallback can require
                      another download of similar size. Questions and answers stay in
                      this browser.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="justify-center border-border/70 bg-muted/25 px-5 py-4">
                    <Button
                      data-testid="model-load-button"
                      onClick={startModelLoad}
                      size="lg"
                      type="button"
                    >
                      Load AI model
                    </Button>
                  </CardFooter>
                </Card>
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
                overBudgetPersonalContextCharacters={
                  personalContextBudget.overBudgetCharacters
                }
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
