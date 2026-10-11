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

interface FrameTarget {
  iframe: HTMLIFrameElement;
  document: Document;
}

interface Recipient extends FrameTarget {
  target: Element;
}

interface KeyboardActivationBase {
  element: HTMLButtonElement;
  key: string;
}

type KeyboardActivation = KeyboardActivationBase & (
  | { kind: "control"; recipient: Recipient; keys: readonly GameKey[]; interruptsMovement: boolean }
  | { kind: "toggle"; focus: FrameTarget }
);

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

function frameTargetFor(iframe: HTMLIFrameElement | null): FrameTarget | null {
  try {
    const frameDocument = iframe?.contentDocument;
    return iframe?.isConnected && frameDocument?.body && frameDocument.defaultView
      ? { iframe, document: frameDocument }
      : null;
  } catch {
    return null;
  }
}

function isCurrentFrame(iframe: HTMLIFrameElement | null, target: FrameTarget): boolean {
  try {
    return iframe === target.iframe && target.iframe.isConnected && target.iframe.contentDocument === target.document;
  } catch {
    return false;
  }
}

function focusFrame(iframeRef: RefObject<HTMLIFrameElement | null>, target: FrameTarget): boolean {
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

function acceptsKeys(target: Element, keys: readonly GameKey[]): boolean {
  if (!isTyping(target)) return true;
  // A form can opt its focused editable text field into submit only.
  // Movement, B, Select/Menu and every other typing surface stay protected.
  return keys.length === 1 && (keys[0]?.code === GAME_KEYS.a.code || keys[0]?.code === GAME_KEYS.start.code)
    && target.matches('input[type="text"][data-game-controls-confirm="submit"]:not(:disabled):not([readonly])')
    && !target.closest("[inert], [hidden]");
}

function recipientFor(iframe: HTMLIFrameElement | null, keys: readonly GameKey[], remembered: Recipient | null): Recipient | null {
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

function subscribeFrame(iframe: HTMLIFrameElement | null, clearAll: () => void, onKeyUp: (event: KeyboardEvent) => void, onFocus: (recipient: Recipient) => void): () => void {
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
  const keyboardActivationRef = useRef<KeyboardActivation | null>(null);
  const hostActivationKeysRef = useRef(new Set<string>());
  const interruptionRef = useRef(0);
  const frameRecipientRef = useRef<Recipient | null>(null);

  const cancelKeyboard = useCallback((): void => {
    keyboardActivationRef.current = null;
  }, []);

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
    interruptionRef.current += 1;
    cancelKeyboard();
    for (const pointerId of [...pointerOwnersRef.current.keys()]) releasePointer(pointerId);
    // A frame event handler can interrupt a press before pointer ownership is
    // assigned. Disposal must release even those in-flight key events.
    const remaining = [...heldKeysRef.current.values()];
    heldKeysRef.current.clear();
    for (const held of remaining) emitKey(held, "keyup", false);
  }, [cancelKeyboard, releasePointer]);

  const clearMovement = useCallback((): void => {
    for (const owner of pointerOwnersRef.current.values()) {
      const movement = owner.keys.filter((key) => key.code.startsWith("Arrow"));
      owner.keys = owner.keys.filter((key) => !key.code.startsWith("Arrow"));
      releaseKeys(movement);
    }
  }, [releaseKeys]);

  const pressKeys = useCallback((keys: readonly GameKey[], recipient: Recipient | null): boolean => {
    if (hostActivationKeysRef.current.size > 0 || !recipient || !isCurrentFrame(iframeRef.current, recipient)
      || !recipient.target.isConnected
      || isTyping(document.activeElement)) return false;
    // Re-admit the same recipient: editable opt-ins can change while a host
    // activation key is held, and focus restoration must not bypass protection.
    if (recipientFor(iframeRef.current, keys, frameRecipientRef.current)?.target !== recipient.target) return false;
    if (!focusFrame(iframeRef, recipient) || !acceptsKeys(recipient.target, keys)) return false;
    if (recipient.document.activeElement !== recipient.target) {
      // Restore only a browser-cleared recipient, never replace a new focus
      // target selected by a child focus handler.
      if (recipient.document.activeElement !== recipient.document.body) return false;
      const FrameHTMLElement = recipient.document.defaultView?.HTMLElement;
      if (!FrameHTMLElement || !(recipient.target instanceof FrameHTMLElement)) return false;
      recipient.target.focus({ preventScroll: true });
    }
    if (recipient.document.activeElement !== recipient.target
      || recipientFor(iframeRef.current, keys, frameRecipientRef.current)?.target !== recipient.target) return false;
    const interruption = interruptionRef.current;
    for (const key of keys) {
      const held = heldKeysRef.current.get(key.code);
      if (held) {
        held.owners += 1;
      } else {
        const nextHeld = { ...recipient, key, owners: 1 };
        heldKeysRef.current.set(key.code, nextHeld);
        emitKey(nextHeld, "keydown", heldKeysRef.current.has(GAME_KEYS.select.code));
      }
      if (interruptionRef.current !== interruption || !isCurrentFrame(iframeRef.current, recipient)) return false;
    }
    return true;
  }, [iframeRef]);

  const pressPointer = useCallback((pointerId: number, element: HTMLButtonElement, keys: readonly GameKey[], interruptsMovement: boolean): void => {
    cancelKeyboard();
    releasePointer(pointerId);
    const recipient = recipientFor(iframeRef.current, keys, frameRecipientRef.current);
    if (!recipient) return;
    if (interruptsMovement) clearMovement();
    if (!pressKeys(keys, recipient)) return;
    pointerOwnersRef.current.set(pointerId, { element, keys });
    try {
      element.setPointerCapture(pointerId);
    } catch {
      // Synthetic assistive input may not have an active browser pointer.
    }
  }, [cancelKeyboard, clearMovement, iframeRef, pressKeys, releasePointer]);

  const pulseRecipient = useCallback((keys: readonly GameKey[], interruptsMovement: boolean, recipient: Recipient | null): void => {
    if (!recipient) return;
    if (interruptsMovement) clearMovement();
    if (pressKeys(keys, recipient)) releaseKeys(keys);
  }, [clearMovement, pressKeys, releaseKeys]);

  const pulse = useCallback((keys: readonly GameKey[], interruptsMovement: boolean): void => {
    cancelKeyboard();
    pulseRecipient(keys, interruptsMovement, recipientFor(iframeRef.current, keys, frameRecipientRef.current));
  }, [cancelKeyboard, iframeRef, pulseRecipient]);

  const changeVisibility = useCallback((): void => {
    clearAll();
    setManualVisibility((current) => !(current ?? prefersTouch));
  }, [clearAll, prefersTouch]);

  const toggle = useCallback((): void => {
    const focus = frameTargetFor(iframeRef.current);
    changeVisibility();
    if (focus && hostActivationKeysRef.current.size === 0) focusFrame(iframeRef, focus);
  }, [changeVisibility, iframeRef]);

  const beginKeyboard = useCallback((key: string, element: HTMLButtonElement, keys: readonly GameKey[], interruptsMovement: boolean): void => {
    hostActivationKeysRef.current.add(key);
    const recipient = recipientFor(iframeRef.current, keys, frameRecipientRef.current);
    keyboardActivationRef.current = recipient
      ? { kind: "control", key, element, keys, interruptsMovement, recipient }
      : null;
  }, [iframeRef]);

  const beginToggleKeyboard = useCallback((key: string, element: HTMLButtonElement): void => {
    hostActivationKeysRef.current.add(key);
    const focus = frameTargetFor(iframeRef.current);
    // Match native button timing without allowing Enter's click to move focus
    // before its keyup. Space activates only after release.
    if (key === "Enter") changeVisibility();
    keyboardActivationRef.current = focus ? { kind: "toggle", key, element, focus } : null;
  }, [changeVisibility, iframeRef]);

  const endKeyboard = useCallback((key: string, element: HTMLButtonElement): void => {
    hostActivationKeysRef.current.delete(key);
    const activation = keyboardActivationRef.current;
    if (!activation || activation.key !== key || activation.element !== element) return;
    cancelKeyboard();
    if (!element.isConnected || document.activeElement !== element) return;
    if (activation.kind === "control") {
      pulseRecipient(activation.keys, activation.interruptsMovement, activation.recipient);
    } else if (hostActivationKeysRef.current.size === 0 && isCurrentFrame(iframeRef.current, activation.focus)) {
      if (key === " ") changeVisibility();
      focusFrame(iframeRef, activation.focus);
    }
  }, [cancelKeyboard, changeVisibility, iframeRef, pulseRecipient]);

  useEffect(() => {
    // A toggle already released held input before changing visibility. Its
    // owning keyboard key still needs to finish in the host after hiding.
    if (!visible && keyboardActivationRef.current?.kind !== "toggle") clearAll();
  }, [clearAll, visible]);

  useEffect(() => {
    const iframe = iframeRef.current;
    const publishVisibility = (): void => {
      const frame = frameTargetFor(iframe);
      if (!frame || !isCurrentFrame(iframeRef.current, frame)) return;
      try {
        const frameWindow = frame.document.defaultView;
        const root = frame.document.documentElement;
        const value = String(visible);
        if (!frameWindow || root.dataset.arcadeControlsVisible === value) return;
        // The attribute supports games that start after load; the event keeps
        // an already running game aligned with manual overlay toggles.
        root.dataset.arcadeControlsVisible = value;
        if (!isCurrentFrame(iframeRef.current, frame)) return;
        frameWindow.dispatchEvent(new frameWindow.CustomEvent("arcade-controls-visibility", { detail: { visible } }));
      } catch {
        // Navigation or an external frame can prevent same-origin publication.
      }
    };
    publishVisibility();
    iframe?.addEventListener("load", publishVisibility);
    return () => { iframe?.removeEventListener("load", publishVisibility); };
  }, [iframeRef, visible]);

  useEffect(() => {
    const iframe = iframeRef.current;
    let detachFrame = (): void => {};
    const onVisibilityChange = (): void => {
      if (document.hidden) {
        hostActivationKeysRef.current.clear();
        clearAll();
      }
    };
    const onWindowBlur = (): void => {
      if (!document.hasFocus()) hostActivationKeysRef.current.clear();
      clearAll();
    };
    // Cancellation does not release a physically held host activation key.
    // Track its keyup even if focus moved to another website control.
    const onHostKeyUp = (event: KeyboardEvent): void => { hostActivationKeysRef.current.delete(event.key); };
    const onFrameKeyUp = (event: KeyboardEvent): void => {
      if (frameTargetFor(iframeRef.current)?.document !== event.currentTarget) return;
      // A user can click into the game while a host activation key is held.
      // Its native release only clears ownership; it never revives a pulse.
      hostActivationKeysRef.current.delete(event.key);
      cancelKeyboard();
    };
    const onFrameFocus = (recipient: Recipient): void => {
      if (!isCurrentFrame(iframeRef.current, recipient)) return;
      if (frameRecipientRef.current?.target !== recipient.target) clearAll();
      frameRecipientRef.current = recipient;
    };
    const invalidateFrame = (): void => {
      frameRecipientRef.current = null;
      clearAll();
    };
    const attachFrame = (): void => {
      invalidateFrame();
      detachFrame();
      detachFrame = subscribeFrame(iframe, clearAll, onFrameKeyUp, onFrameFocus);
    };
    attachFrame();
    iframe?.addEventListener("load", attachFrame);
    const navigationObserver = new MutationObserver(invalidateFrame);
    if (iframe) navigationObserver.observe(iframe, { attributes: true, attributeFilter: ["src", "srcdoc"] });
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("keyup", onHostKeyUp, true);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      invalidateFrame();
      detachFrame();
      navigationObserver.disconnect();
      iframe?.removeEventListener("load", attachFrame);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("keyup", onHostKeyUp, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [cancelKeyboard, clearAll, iframeRef]);

  return { visible, toggle, pressPointer, releasePointer, pulse, beginKeyboard, beginToggleKeyboard, endKeyboard, cancelKeyboard };
}
