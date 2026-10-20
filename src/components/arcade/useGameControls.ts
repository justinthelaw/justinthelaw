import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { GAME_KEYS, type GameKey } from "@/components/arcade/gameKeys";
import {
  acceptsKeys,
  emitKey,
  focusFrame,
  frameTargetFor,
  isCurrentFrame,
  isTyping,
  recipientFor,
  subscribeFrame,
  type FrameTarget,
  type KeyRecipient,
  type Recipient,
} from "@/components/arcade/gameFrame";
import { subscribeTouch, touchSnapshot } from "@/components/arcade/touchCapability";

interface KeyboardActivationBase {
  element: HTMLButtonElement;
  key: string;
}

type KeyboardActivation = KeyboardActivationBase & (
  | { kind: "control"; recipient: Recipient; keys: readonly GameKey[]; interruptsMovement: boolean }
  | { kind: "toggle"; focus: FrameTarget }
);

interface HeldKey extends KeyRecipient {
  owners: number;
}

interface PointerOwner {
  keys: readonly GameKey[];
  element: HTMLButtonElement;
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
