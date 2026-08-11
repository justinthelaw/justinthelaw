/**
 * ChatMessages Component
 * Displays chat message history and current AI response
 */

import React, { Fragment, useState } from "react";

import { PROFILE_SUBJECT } from "@/config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ChatMessage } from "@/types";

import { LimitWarning } from "./LimitWarning";
import { Typewriter } from "./Typewriter";

export const GENERATION_STATUS_MESSAGES = [
  `Reviewing ${PROFILE_SUBJECT.shortName}'s public profile...`,
  `Finding relevant public details about ${PROFILE_SUBJECT.shortName}...`,
  `Checking ${PROFILE_SUBJECT.shortName}'s public resume context...`,
  `Reviewing ${PROFILE_SUBJECT.shortName}'s public project history...`,
  "Preparing a profile-grounded answer...",
] as const;

export interface ChatMessagesProps {
  messages: ChatMessage[];
  currentResponse: string;
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
  loadingMessage: string | null;
  showPersonalContextTrimWarning: boolean;
  overBudgetPersonalContextCharacters: number;
  trimmedPersonalContextCharacters: number;
  onRetryModelLoad: () => void;
}

export function ChatMessages({
  messages,
  currentResponse,
  isGenerating,
  isLoading,
  error,
  loadingMessage,
  showPersonalContextTrimWarning,
  overBudgetPersonalContextCharacters,
  trimmedPersonalContextCharacters,
  onRetryModelLoad,
}: ChatMessagesProps): React.ReactElement {
  const [generationStatusMessage] = useState(
    () =>
      GENERATION_STATUS_MESSAGES[
        Math.floor(Math.random() * GENERATION_STATUS_MESSAGES.length)
      ]
  );
  const showModelStatus = isLoading && !loadingMessage?.includes("Generating");

  return (
    <div
      className={
        showModelStatus ? "flex min-h-full flex-col items-center" : "space-y-4"
      }
    >
      {showModelStatus ? (
        <div
          aria-live="polite"
          className="flex w-full flex-col items-center gap-3 py-8"
          role="status"
        >
          <div
            className="flex w-fit max-w-full items-center justify-center gap-3"
            data-testid="model-loading-status-row"
          >
            <Spinner className="size-6 shrink-0 text-muted-foreground" />
            <p
              className="min-w-0 break-words text-muted-foreground tabular-nums"
              data-testid="model-loading-status"
            >
              {loadingMessage || "Loading..."}
            </p>
          </div>
        </div>
      ) : error ? (
        <Alert
          className="w-full border-destructive/40 bg-destructive/10 p-4 text-center text-foreground"
          data-testid="model-error-status"
        >
          <AlertTitle>Model failed to load</AlertTitle>
          <AlertDescription className="mt-1 text-muted-foreground">
            {error}
          </AlertDescription>
          <div className="mt-3 flex justify-center">
            <Button
              data-testid="model-retry-button"
              onClick={onRetryModelLoad}
              size="sm"
              type="button"
              variant="outline"
            >
              Try loading again
            </Button>
          </div>
        </Alert>
      ) : (
        <Fragment>
          {messages.map((message, index) => {
            const showProfileWarning =
              showPersonalContextTrimWarning &&
              message.type === "ai" &&
              index === 0;

            return (
              <div
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
                key={message.id}
              >
                <Card
                  className={`relative min-w-0 max-w-[80%] gap-0 rounded-lg py-0 ring-1 [--card-spacing:0] ${
                    message.type === "user"
                      ? "bg-secondary/85 ring-border/80"
                      : "bg-card ring-border/60"
                  }`}
                  data-testid={
                    message.type === "user"
                      ? "chat-message-user"
                      : "chat-message-ai"
                  }
                >
                  <CardContent className="relative p-3">
                    <div className="mb-1 text-xs text-muted-foreground">
                      {message.type === "user" ? "You" : "AI Assistant"}
                    </div>
                    <div className="whitespace-pre-line leading-relaxed [overflow-wrap:anywhere]">
                      {message.type === "ai" &&
                      messages.length === 1 &&
                      message.id === messages[0].id ? (
                        <Typewriter text={message.content} delay={100} />
                      ) : (
                        message.content
                      )}
                    </div>
                    {showProfileWarning && (
                      <LimitWarning
                        className="absolute top-1.5 right-1.5"
                        message={`Profile: ${overBudgetPersonalContextCharacters} chars over; tail trimmed.${trimmedPersonalContextCharacters > overBudgetPersonalContextCharacters ? ` ${trimmedPersonalContextCharacters} chars removed.` : ""}`}
                        testId="profile-trim-warning"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {isGenerating && (
            <div
              aria-live="polite"
              className="flex justify-start"
              role="status"
            >
              <Card className="max-w-[80%] gap-0 rounded-lg bg-card py-0 ring-1 ring-border/60 [--card-spacing:0]">
                <CardContent className="p-3">
                  <div className="mb-1 text-xs text-muted-foreground">
                    AI Assistant
                  </div>
                  <div className="whitespace-pre-line leading-relaxed [overflow-wrap:anywhere]">
                    {!currentResponse ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Spinner className="size-3.5" />
                        <span>{generationStatusMessage}</span>
                      </div>
                    ) : (
                      <Fragment>
                        {currentResponse}
                        <span className="animate-pulse">|</span>
                      </Fragment>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
}
