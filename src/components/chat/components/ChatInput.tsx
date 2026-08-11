/**
 * ChatInput Component
 * Input field and send button for user messages
 */

import React, { KeyboardEvent, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { getPromptBudget } from "@/services/ai/contextProvider";
import type { ConversationTurn } from "@/types";

import { LimitWarning } from "./LimitWarning";

export interface ChatInputProps {
  onSend: (message: string) => void;
  isSendDisabled: boolean;
  isInputDisabled: boolean;
  placeholder: string;
  conversationTurns?: readonly ConversationTurn[];
}

export function ChatInput({
  onSend,
  isSendDisabled,
  isInputDisabled,
  placeholder,
  conversationTurns = [],
}: ChatInputProps): React.ReactElement {
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();
  const promptBudget = getPromptBudget(inputText, { conversationTurns });
  const showInputLimitWarning =
    inputText.trim().length > 0 && promptBudget.isInputTrimmed;

  function handleSend(): void {
    if (!inputText.trim() || isSendDisabled) {
      return;
    }

    onSend(inputText.trim());
    setInputText("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="bg-card/55">
      <Separator />
      <div className="p-4">
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={inputId} className="sr-only">
              Message to AI assistant
            </label>
            <Textarea
              aria-describedby={
                showInputLimitWarning ? "chat-input-limit-warning" : undefined
              }
              className="field-sizing-fixed min-h-11! max-h-24 resize-none bg-background/55 px-3 py-2.5 text-sm placeholder:text-muted-foreground"
              data-testid="chat-input"
              disabled={isInputDisabled}
              id={inputId}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              ref={inputRef}
              rows={2}
              value={inputText}
            />
          </div>
          <div className="relative flex h-11 w-20 shrink-0 items-end justify-center">
            {showInputLimitWarning && (
              <LimitWarning
                className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2"
                id="chat-input-limit-warning"
                message={`Message: ${promptBudget.trimmedInputCharacters} chars over; tail trimmed.`}
                testId="chat-input-limit-warning"
              />
            )}
            <Button
              className="h-11 w-full"
              data-testid="chat-send-button"
              disabled={isSendDisabled || !inputText.trim()}
              onClick={handleSend}
              type="button"
            >
              Send
            </Button>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI can make mistakes. Always verify the information.
        </p>
      </div>
    </div>
  );
}
