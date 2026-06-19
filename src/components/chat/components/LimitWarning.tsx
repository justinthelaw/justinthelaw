/**
 * Compact warning tooltip for model prompt limit notices.
 */

import { Triangle } from "@deemlol/next-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface LimitWarningProps {
  className?: string;
  id?: string;
  message: string;
  testId?: string;
}

interface TooltipPosition {
  left: number;
  maxWidth: number;
  placement: "above" | "below";
  top: number;
}

interface ViewportBounds {
  height: number;
  left: number;
  top: number;
  width: number;
}

const MAX_TOOLTIP_WIDTH = 240;
const TOOLTIP_GAP = 8;
const VIEWPORT_MARGIN = 8;

const DEFAULT_TOOLTIP_POSITION: TooltipPosition = {
  left: VIEWPORT_MARGIN,
  maxWidth: MAX_TOOLTIP_WIDTH,
  placement: "above",
  top: 0,
};

function clamp(value: number, minimum: number, maximum: number): number {
  if (maximum < minimum) {
    return minimum;
  }

  return Math.min(Math.max(value, minimum), maximum);
}

function getViewportBounds(): ViewportBounds {
  const visualViewport = window.visualViewport;

  return {
    height: visualViewport?.height ?? window.innerHeight,
    left: visualViewport?.offsetLeft ?? 0,
    top: visualViewport?.offsetTop ?? 0,
    width: visualViewport?.width ?? window.innerWidth,
  };
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
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>(
    DEFAULT_TOOLTIP_POSITION
  );
  const isVisible = isOpen || isFocused || isHovered;

  const updatePosition = useCallback(() => {
    if (typeof window === "undefined" || !triggerRef.current) {
      return;
    }

    const viewport = getViewportBounds();
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    const maxWidth = Math.min(
      MAX_TOOLTIP_WIDTH,
      Math.max(0, viewport.width - VIEWPORT_MARGIN * 2)
    );
    const tooltipWidth = Math.min(
      tooltipRect?.width || MAX_TOOLTIP_WIDTH,
      maxWidth
    );
    const tooltipHeight = tooltipRect?.height || 32;
    const triggerCenter = triggerRect.left + triggerRect.width / 2;
    const left = clamp(
      triggerCenter - tooltipWidth / 2,
      viewport.left + VIEWPORT_MARGIN,
      viewport.left + viewport.width - tooltipWidth - VIEWPORT_MARGIN
    );
    const spaceAbove = triggerRect.top - viewport.top - VIEWPORT_MARGIN;
    const spaceBelow =
      viewport.top + viewport.height - triggerRect.bottom - VIEWPORT_MARGIN;
    const placement = spaceAbove >= tooltipHeight + TOOLTIP_GAP ||
      spaceAbove > spaceBelow
      ? "above"
      : "below";
    const top =
      placement === "above"
        ? Math.max(
            viewport.top + VIEWPORT_MARGIN,
            triggerRect.top - tooltipHeight - TOOLTIP_GAP
          )
        : Math.min(
            viewport.top + viewport.height - tooltipHeight - VIEWPORT_MARGIN,
            triggerRect.bottom + TOOLTIP_GAP
          );

    setPosition({ left, maxWidth, placement, top });
  }, []);

  const refreshPosition = useCallback(() => {
    updatePosition();

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(updatePosition);
    }
  }, [updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent): void {
      if (
        triggerRef.current &&
        event.target instanceof Node &&
          triggerRef.current.contains(event.target)
      ) {
        return;
      }

      if (
        tooltipRef.current &&
        event.target instanceof Node &&
        tooltipRef.current.contains(event.target)
      ) {
        return;
      }

      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen, updatePosition]);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
    if (!isTouchLikeDevice()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    refreshPosition();
    setIsOpen((currentIsOpen) => !currentIsOpen);
  }

  function handleFocus(): void {
    if (isTouchLikeDevice()) {
      return;
    }

    setIsFocused(true);
    refreshPosition();
  }

  function handleMouseEnter(): void {
    if (isTouchLikeDevice()) {
      return;
    }

    setIsHovered(true);
    refreshPosition();
  }

  const tooltip = (
    <span
      data-testid={testId ? `${testId}-tooltip` : undefined}
      ref={tooltipRef}
      role="tooltip"
      style={{
        left: position.left,
        maxWidth: position.maxWidth,
        top: position.top,
      }}
      className={`${
        isVisible ? "visible opacity-100" : "invisible opacity-0"
      } fixed z-50 w-max whitespace-normal break-words rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium leading-snug text-amber-950 shadow-lg ring-1 ring-amber-400/60 transition-opacity duration-150`}
    >
      {message}
    </span>
  );

  return (
    <>
      <button
        id={id}
        aria-label={message}
        aria-expanded={isOpen}
        data-testid={testId}
        onBlur={() => setIsFocused(false)}
        onClick={handleClick}
        onFocus={handleFocus}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        ref={triggerRef}
        type="button"
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-amber-400 outline-none transition-colors duration-150 hover:text-amber-300 focus:ring-2 focus:ring-amber-300 ${className}`}
      >
        <span aria-hidden="true" className="relative block h-4 w-4">
          <Triangle
            aria-hidden="true"
            className="absolute inset-0 text-amber-400"
            color="currentColor"
            size={16}
            strokeWidth={2.4}
          />
          <span className="absolute left-1/2 top-[4px] h-[6px] w-[2px] -translate-x-1/2 rounded-full bg-amber-400" />
          <span className="absolute left-1/2 top-[11px] h-[2px] w-[2px] -translate-x-1/2 rounded-full bg-amber-400" />
        </span>
      </button>
      {typeof document !== "undefined" && createPortal(tooltip, document.body)}
    </>
  );
}
