import type { RefObject } from "react";
import { GAME_KEYS, type GameKey } from "@/components/arcade/gameKeys";
import { noteTouch } from "@/components/arcade/touchCapability";

export interface FrameTarget {
  iframe: HTMLIFrameElement;
  document: Document;
}

export interface Recipient extends FrameTarget {
  target: Element;
}

export interface KeyRecipient extends Recipient {
  key: GameKey;
}

export function isTyping(element: Element | null): boolean {
  return Boolean(element?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"));
}

export function frameTargetFor(iframe: HTMLIFrameElement | null): FrameTarget | null {
  try {
    const frameDocument = iframe?.contentDocument;
    return iframe?.isConnected && frameDocument?.body && frameDocument.defaultView
      ? { iframe, document: frameDocument }
      : null;
  } catch {
    return null;
  }
}

export function isCurrentFrame(iframe: HTMLIFrameElement | null, target: FrameTarget): boolean {
  try {
    return iframe === target.iframe && target.iframe.isConnected && target.iframe.contentDocument === target.document;
  } catch {
    return false;
  }
}

export function focusFrame(iframeRef: RefObject<HTMLIFrameElement | null>, target: FrameTarget): boolean {
  if (!isCurrentFrame(iframeRef.current, target)) return false;
  try {
    target.iframe.focus();
    target.document.defaultView?.focus();
    // Focus handlers can navigate or dispose the frame. Never deliver input
    // unless the exact captured document actually regained focus.
    return isCurrentFrame(iframeRef.current, target) && target.document.hasFocus();
  } catch {
    return false;
  }
}

export function acceptsKeys(target: Element, keys: readonly GameKey[]): boolean {
  if (!isTyping(target)) return true;
  // A form can opt its focused editable text field into submit only.
  // Movement, B, Select/Menu and every other typing surface stay protected.
  return keys.length === 1 && (keys[0]?.code === GAME_KEYS.a.code || keys[0]?.code === GAME_KEYS.start.code)
    && target.matches('input[type="text"][data-game-controls-confirm="submit"]:not(:disabled):not([readonly])')
    && !target.closest("[inert], [hidden]");
}

export function recipientFor(iframe: HTMLIFrameElement | null, keys: readonly GameKey[], remembered: Recipient | null): Recipient | null {
  try {
    const frame = frameTargetFor(iframe);
    if (!frame || isTyping(document.activeElement)) return null;
    const frameDocument = frame.document;
    const active = frameDocument.activeElement ?? frameDocument.body;
    // Some browsers report body after focus moves to the website toolbar.
    // Retain the actual child recipient so this cannot bypass typing guards.
    const target = !frameDocument.hasFocus() && active === frameDocument.body
      && remembered && isCurrentFrame(iframe, remembered) ? remembered.target : active;
    if (!target.isConnected || target.ownerDocument !== frameDocument || !acceptsKeys(target, keys)) return null;
    return { ...frame, target };
  } catch {
    // An external frame cannot receive this same-origin adapter.
    return null;
  }
}

export function emitKey(held: KeyRecipient, type: "keydown" | "keyup", shiftKey: boolean): void {
  try {
    const FrameKeyboardEvent = held.document.defaultView?.KeyboardEvent;
    if (!FrameKeyboardEvent) return;
    held.target.dispatchEvent(new FrameKeyboardEvent(type, {
      key: held.key.key,
      code: held.key.code,
      location: held.key.location ?? 0,
      keyCode: held.key.keyCode,
      which: held.key.keyCode,
      shiftKey,
      bubbles: true,
      cancelable: true,
      composed: true,
    }));
  } catch {
    // A frame may have navigated while its controls were held.
  }
}

export function subscribeFrame(iframe: HTMLIFrameElement | null, clearAll: () => void, onKeyUp: (event: KeyboardEvent) => void, onFocus: (recipient: Recipient) => void): () => void {
  try {
    const frameDocument = iframe?.contentDocument;
    const frameWindow = frameDocument?.defaultView;
    if (!iframe || !frameDocument || !frameWindow) return () => {};
    let attached = true;
    const rememberFocus = (target: Element): void => { onFocus({ iframe, document: frameDocument, target }); };
    const onFocusIn = (event: FocusEvent): void => {
      if (event.target instanceof frameWindow.Element) rememberFocus(event.target);
    };
    const onFocusOut = (): void => {
      // Preserve the recipient when focus leaves the iframe, but forget an
      // explicitly blurred input while its own document remains focused.
      queueMicrotask(() => {
        if (attached && frameDocument.hasFocus()) rememberFocus(frameDocument.activeElement ?? frameDocument.body);
      });
    };
    rememberFocus(frameDocument.activeElement ?? frameDocument.body);
    const onVisibility = (): void => { if (frameDocument.hidden) clearAll(); };
    frameDocument.addEventListener("focusin", onFocusIn, true);
    frameDocument.addEventListener("focusout", onFocusOut, true);
    frameDocument.addEventListener("pointerdown", noteTouch, true);
    frameDocument.addEventListener("keyup", onKeyUp, true);
    frameDocument.addEventListener("visibilitychange", onVisibility);
    frameWindow.addEventListener("blur", clearAll);
    frameWindow.addEventListener("pagehide", clearAll);
    frameWindow.addEventListener("beforeunload", clearAll);
    return () => {
      attached = false;
      frameDocument.removeEventListener("focusin", onFocusIn, true);
      frameDocument.removeEventListener("focusout", onFocusOut, true);
      frameDocument.removeEventListener("pointerdown", noteTouch, true);
      frameDocument.removeEventListener("keyup", onKeyUp, true);
      frameDocument.removeEventListener("visibilitychange", onVisibility);
      try {
        frameWindow.removeEventListener("blur", clearAll);
        frameWindow.removeEventListener("pagehide", clearAll);
        frameWindow.removeEventListener("beforeunload", clearAll);
      } catch {
        // The captured WindowProxy may now point to a cross-origin document.
        // Its old document listeners are already detached; cleanup must finish.
      }
    };
  } catch {
    // Native keyboard input still works for an inaccessible frame.
    return () => {};
  }
}
