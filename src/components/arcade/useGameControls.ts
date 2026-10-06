import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

export interface GameKey {
  key: string;
  code: string;
  keyCode: number;
  location?: number;
}

export const GAME_KEYS = {
  up: { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
  right: { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
  down: { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
  left: { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
  a: { key: "z", code: "KeyZ", keyCode: 90 },
  b: { key: "x", code: "KeyX", keyCode: 88 },
  start: { key: "Enter", code: "Enter", keyCode: 13 },
  select: { key: "Shift", code: "ShiftRight", keyCode: 16, location: 2 },
  menu: { key: "Escape", code: "Escape", keyCode: 27 },
} satisfies Record<string, GameKey>;

interface Recipient {
  document: Document;
  target: Element;
}

interface HeldKey extends Recipient {
  key: GameKey;
  owners: number;
}

interface PointerOwner {
  keys: readonly GameKey[];
  element: HTMLButtonElement;
}

// This is browser input capability, not a persisted player preference.
let touchSeen = false;
const touchSubscribers = new Set<() => void>();

function noteTouch(event: PointerEvent): void {
  if (event.pointerType !== "touch" || touchSeen) return;
  touchSeen = true;
  touchSubscribers.forEach((notify) => notify());
}

function touchSnapshot(): boolean {
  return touchSeen || window.matchMedia("(pointer: coarse)").matches;
}

function subscribeTouch(notify: () => void): () => void {
  const query = window.matchMedia("(pointer: coarse)");
  touchSubscribers.add(notify);
  query.addEventListener("change", notify);
  window.addEventListener("pointerdown", noteTouch, true);
  return () => {
    touchSubscribers.delete(notify);
    query.removeEventListener("change", notify);
    window.removeEventListener("pointerdown", noteTouch, true);
  };
}

function isTyping(element: Element | null): boolean {
  return Boolean(element?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"));
}

function recipientFor(iframe: HTMLIFrameElement | null, keys: readonly GameKey[]): Recipient | null {
  try {
    const frameDocument = iframe?.contentDocument;
    if (!frameDocument?.body || isTyping(document.activeElement)) return null;
    const target = frameDocument.activeElement ?? frameDocument.body;
    if (isTyping(target)) {
      // A form can opt its focused editable text field into submit only.
      // Movement, B, Select/Menu and every other typing surface stay protected.
      const confirmsInput = keys.length === 1 && (keys[0]?.code === GAME_KEYS.a.code || keys[0]?.code === GAME_KEYS.start.code)
        && target.matches('input[type="text"][data-game-controls-confirm="submit"]:not(:disabled):not([readonly])')
        && !target.closest("[inert], [hidden]");
      if (!confirmsInput) return null;
    }
    return { document: frameDocument, target };
  } catch {
    // An external frame cannot receive this same-origin adapter.
    return null;
  }
}

function emitKey(held: HeldKey, type: "keydown" | "keyup", shiftKey: boolean): void {
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

function subscribeFrame(iframe: HTMLIFrameElement | null, clearAll: () => void): () => void {
  try {
    const frameDocument = iframe?.contentDocument;
    const frameWindow = frameDocument?.defaultView;
    if (!frameDocument || !frameWindow) return () => {};
    const onVisibility = (): void => { if (frameDocument.hidden) clearAll(); };
    frameDocument.addEventListener("pointerdown", noteTouch, true);
    frameDocument.addEventListener("visibilitychange", onVisibility);
    frameWindow.addEventListener("blur", clearAll);
    frameWindow.addEventListener("pagehide", clearAll);
    frameWindow.addEventListener("beforeunload", clearAll);
    return () => {
      frameDocument.removeEventListener("pointerdown", noteTouch, true);
      frameDocument.removeEventListener("visibilitychange", onVisibility);
      frameWindow.removeEventListener("blur", clearAll);
      frameWindow.removeEventListener("pagehide", clearAll);
      frameWindow.removeEventListener("beforeunload", clearAll);
    };
  } catch {
    // Native keyboard input still works for an inaccessible frame.
    return () => {};
  }
}

export function useGameControls(iframeRef: RefObject<HTMLIFrameElement | null>) {
  const prefersTouch = useSyncExternalStore(subscribeTouch, touchSnapshot, () => false);
  const [manualVisibility, setManualVisibility] = useState<boolean | null>(null);
  const visible = manualVisibility ?? prefersTouch;
  const heldKeysRef = useRef(new Map<string, HeldKey>());
  const pointerOwnersRef = useRef(new Map<number, PointerOwner>());

  const releaseKeys = useCallback((keys: readonly GameKey[]): void => {
    for (const key of keys) {
      const held = heldKeysRef.current.get(key.code);
      if (!held || --held.owners > 0) continue;
      heldKeysRef.current.delete(key.code);
      emitKey(held, "keyup", heldKeysRef.current.has(GAME_KEYS.select.code));
    }
  }, []);

  const releasePointer = useCallback((pointerId: number): void => {
    const owner = pointerOwnersRef.current.get(pointerId);
    if (!owner) return;
    pointerOwnersRef.current.delete(pointerId);
    releaseKeys(owner.keys);
    if (owner.element.hasPointerCapture(pointerId)) owner.element.releasePointerCapture(pointerId);
  }, [releaseKeys]);

  const clearAll = useCallback((): void => {
    for (const pointerId of [...pointerOwnersRef.current.keys()]) releasePointer(pointerId);
    // A frame event handler can interrupt a press before pointer ownership is
    // assigned. Disposal must release even those in-flight key events.
    const remaining = [...heldKeysRef.current.values()];
    heldKeysRef.current.clear();
    for (const held of remaining) emitKey(held, "keyup", false);
  }, [releasePointer]);

  const clearMovement = useCallback((): void => {
    for (const owner of pointerOwnersRef.current.values()) {
      const movement = owner.keys.filter((key) => key.code.startsWith("Arrow"));
      owner.keys = owner.keys.filter((key) => !key.code.startsWith("Arrow"));
      releaseKeys(movement);
    }
  }, [releaseKeys]);

  const pressKeys = useCallback((keys: readonly GameKey[]): boolean => {
    const recipient = recipientFor(iframeRef.current, keys);
    if (!recipient) return false;
    for (const key of keys) {
      const held = heldKeysRef.current.get(key.code);
      if (held) {
        held.owners += 1;
      } else {
        const nextHeld = { ...recipient, key, owners: 1 };
        heldKeysRef.current.set(key.code, nextHeld);
        emitKey(nextHeld, "keydown", heldKeysRef.current.has(GAME_KEYS.select.code));
      }
    }
    return true;
  }, [iframeRef]);

  const pressPointer = useCallback((pointerId: number, element: HTMLButtonElement, keys: readonly GameKey[], interruptsMovement: boolean): void => {
    releasePointer(pointerId);
    if (interruptsMovement) clearMovement();
    if (!pressKeys(keys)) return;
    pointerOwnersRef.current.set(pointerId, { element, keys });
    try {
      element.setPointerCapture(pointerId);
    } catch {
      // Synthetic assistive input may not have an active browser pointer.
    }
  }, [clearMovement, pressKeys, releasePointer]);

  const pulse = useCallback((keys: readonly GameKey[], interruptsMovement: boolean): void => {
    if (interruptsMovement) clearMovement();
    if (pressKeys(keys)) releaseKeys(keys);
  }, [clearMovement, pressKeys, releaseKeys]);

  const toggle = useCallback((): void => {
    clearAll();
    setManualVisibility(!visible);
  }, [clearAll, visible]);

  useEffect(() => {
    if (!visible) clearAll();
  }, [clearAll, visible]);

  useEffect(() => {
    const iframe = iframeRef.current;
    let detachFrame = (): void => {};
    const onVisibilityChange = (): void => { if (document.hidden) clearAll(); };
    const attachFrame = (): void => {
      clearAll();
      detachFrame();
      detachFrame = subscribeFrame(iframe, clearAll);
    };
    attachFrame();
    iframe?.addEventListener("load", attachFrame);
    const navigationObserver = new MutationObserver(clearAll);
    if (iframe) navigationObserver.observe(iframe, { attributes: true, attributeFilter: ["src", "srcdoc"] });
    window.addEventListener("blur", clearAll);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearAll();
      detachFrame();
      navigationObserver.disconnect();
      iframe?.removeEventListener("load", attachFrame);
      window.removeEventListener("blur", clearAll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [clearAll, iframeRef]);

  return { visible, toggle, pressPointer, releasePointer, pulse };
}
