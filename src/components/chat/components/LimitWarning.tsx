/**
 * Compact warning tooltip for model prompt limit notices.
 */

import { AlertTriangle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface LimitWarningProps {
  className?: string;
  id?: string;
  message: string;
  testId?: string;
}

function isTouchLikeDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

export function LimitWarning({
  className = "",
  id,
  message,
  testId,
}: LimitWarningProps): React.ReactElement {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchOpen, setIsTouchOpen] = useState(false);
  const isVisible = isTouchOpen || isFocused || isHovered;

  useEffect(() => {
    if (!isTouchOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent): void {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (
        triggerRef.current?.contains(event.target) ||
        tooltipRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsTouchOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isTouchOpen]);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
    if (!isTouchLikeDevice()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setIsTouchOpen((currentIsOpen) => !currentIsOpen);
  }

  function handleOpenChange(nextIsOpen: boolean): void {
    if (nextIsOpen) {
      return;
    }

    setIsFocused(false);
    setIsHovered(false);
    setIsTouchOpen(false);
  }

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <Tooltip open={isVisible} onOpenChange={handleOpenChange}>
        <TooltipTrigger asChild>
          <Button
            id={id}
            aria-label={message}
            aria-expanded={isVisible}
            className={`size-5 text-muted-foreground hover:bg-muted hover:text-foreground ${className}`}
            data-testid={testId}
            onBlur={() => setIsFocused(false)}
            onClick={handleClick}
            onFocus={() => {
              if (!isTouchLikeDevice()) {
                setIsFocused(true);
              }
            }}
            onMouseEnter={() => {
              if (!isTouchLikeDevice()) {
                setIsHovered(true);
              }
            }}
            onMouseLeave={() => setIsHovered(false)}
            ref={triggerRef}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <AlertTriangle aria-hidden="true" className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          ref={tooltipRef}
          align="center"
          avoidCollisions
          className="max-w-[min(15rem,calc(100vw-1rem))] whitespace-normal break-words border border-border bg-popover text-center font-medium leading-snug text-popover-foreground shadow-md"
          collisionPadding={8}
          data-testid={testId ? `${testId}-tooltip` : undefined}
          side="top"
          sideOffset={8}
        >
          {message}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
