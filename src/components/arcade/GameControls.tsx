import { useRef, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { GAME_KEYS, useGameControls, type GameKey } from "./useGameControls";
import styles from "./GameControls.module.css";

interface GameControlsProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
}

interface Control {
  label: string;
  glyph: string;
  keys: readonly GameKey[];
  tooltip: string;
  interruptsMovement?: boolean;
}

const directions: readonly Control[] = [
  { label: "Move up-left", glyph: "↖", keys: [GAME_KEYS.up, GAME_KEYS.left], tooltip: "Move up-left" },
  { label: "Move up", glyph: "↑", keys: [GAME_KEYS.up], tooltip: "Move up" },
  { label: "Move up-right", glyph: "↗", keys: [GAME_KEYS.up, GAME_KEYS.right], tooltip: "Move up-right" },
  { label: "Move left", glyph: "←", keys: [GAME_KEYS.left], tooltip: "Move left" },
  { label: "Move right", glyph: "→", keys: [GAME_KEYS.right], tooltip: "Move right" },
  { label: "Move down-left", glyph: "↙", keys: [GAME_KEYS.down, GAME_KEYS.left], tooltip: "Move down-left" },
  { label: "Move down", glyph: "↓", keys: [GAME_KEYS.down], tooltip: "Move down" },
  { label: "Move down-right", glyph: "↘", keys: [GAME_KEYS.down, GAME_KEYS.right], tooltip: "Move down-right" },
];

const actions: readonly Control[] = [
  { label: "B (X key)", glyph: "B", keys: [GAME_KEYS.b], tooltip: "Press B button" },
  { label: "A (Z key)", glyph: "A", keys: [GAME_KEYS.a], tooltip: "Press A button" },
];

const systemActions: readonly Control[] = [
  { label: "Select (Shift key)", glyph: "Select", keys: [GAME_KEYS.select], tooltip: "Press Select button" },
  { label: "Start (Enter key)", glyph: "Start", keys: [GAME_KEYS.start], tooltip: "Press Start button", interruptsMovement: true },
  { label: "Menu (Escape key)", glyph: "Menu", keys: [GAME_KEYS.menu], tooltip: "Open game menu", interruptsMovement: true },
];

export function GameControls({ iframeRef }: GameControlsProps): React.ReactElement {
  const { visible, toggle, pressPointer, releasePointer, pulse } = useGameControls(iframeRef);
  const activationKeyRef = useRef<string | null>(null);
  const pendingFocusRef = useRef(false);

  function focusGame(): void {
    iframeRef.current?.focus();
    iframeRef.current?.contentWindow?.focus();
  }

  function renderControl(control: Control, className: string): React.ReactElement {
    return (
      <Button
        key={control.label}
        type="button"
        variant="outline"
        className={`${styles.control} ${className}`}
        aria-label={control.label}
        tooltip={control.tooltip}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          pressPointer(event.pointerId, event.currentTarget, control.keys, Boolean(control.interruptsMovement));
        }}
        onPointerUp={(event) => releasePointer(event.pointerId)}
        onPointerCancel={(event) => releasePointer(event.pointerId)}
        onLostPointerCapture={(event) => releasePointer(event.pointerId)}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => {
          // Pointer down/up already emitted their keys; keyboard and assistive
          // activation produce a zero-detail click and need a single pulse.
          if (event.detail === 0) pulse(control.keys, Boolean(control.interruptsMovement));
        }}
      >
        <span aria-hidden="true">{control.glyph}</span>
      </Button>
    );
  }

  return (
    <div className={styles.overlay}>
      <Button
        type="button"
        variant="outline"
        className={styles.toggle}
        aria-expanded={visible}
        aria-controls="arcade-game-controls"
        tooltip={visible ? "Hide game controls" : "Show game controls"}
        onPointerDown={() => { activationKeyRef.current = null; }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") activationKeyRef.current = event.key;
        }}
        onKeyUp={(event) => {
          if (event.key !== activationKeyRef.current) return;
          activationKeyRef.current = null;
          if (pendingFocusRef.current) {
            pendingFocusRef.current = false;
            focusGame();
          }
        }}
        onBlur={() => {
          activationKeyRef.current = null;
          pendingFocusRef.current = false;
        }}
        onClick={() => {
          toggle();
          if (!visible) return;
          // Keep a keyboard activation's keyup in the host document. Pointer
          // and assistive clicks can return native game focus immediately.
          if (activationKeyRef.current) pendingFocusRef.current = true;
          else focusGame();
        }}
      >
        {visible ? "Hide controls" : "Show controls"}
      </Button>
      <div id="arcade-game-controls" role="region" aria-label="Game controls" className={styles.controls} hidden={!visible}>
        <div className={styles.dpad}>
          {directions.map((control) => renderControl(control, styles.direction))}
        </div>
        <div className={styles.actionArea}>
          <div className={styles.actions}>{actions.map((control) => renderControl(control, styles.action))}</div>
          <div className={styles.systemActions}>{systemActions.map((control) => renderControl(control, styles.system))}</div>
        </div>
      </div>
    </div>
  );
}
