import type { KeyboardEvent, RefObject } from "react";
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
  const { visible, toggle, pressPointer, releasePointer, pulse, beginKeyboard, beginToggleKeyboard, endKeyboard, cancelKeyboard } = useGameControls(iframeRef);

  function activationKey(event: KeyboardEvent<HTMLButtonElement>): boolean {
    if (event.key !== "Enter" && event.key !== " ") return false;
    // Handle both keys explicitly so native zero-detail clicks cannot deliver
    // a second action or move keyup into the embedded document.
    event.preventDefault();
    return true;
  }

  function releaseKeyboard(event: KeyboardEvent<HTMLButtonElement>): void {
    if (activationKey(event)) endKeyboard(event.key, event.currentTarget);
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
        onKeyDown={(event) => {
          if (activationKey(event) && !event.repeat) {
            beginKeyboard(event.key, event.currentTarget, control.keys, Boolean(control.interruptsMovement));
          }
        }}
        onKeyUp={releaseKeyboard}
        onBlur={cancelKeyboard}
        onClick={(event) => {
          // Pointer and keyboard handlers already emit their keys. Assistive
          // activation without key events still needs one pulse.
          if (event.detail === 0) pulse(control.keys, Boolean(control.interruptsMovement));
        }}
      >
        <span aria-hidden="true">{control.glyph}</span>
      </Button>
    );
  }

  return (
    <div className={styles.overlay} data-game-controls-overlay="">
      <Button
        type="button"
        variant="outline"
        className={styles.toggle}
        aria-expanded={visible}
        aria-controls="arcade-game-controls"
        tooltip={visible ? "Hide game controls" : "Show game controls"}
        onPointerDown={cancelKeyboard}
        onKeyDown={(event) => {
          if (activationKey(event) && !event.repeat) beginToggleKeyboard(event.key, event.currentTarget);
        }}
        onKeyUp={releaseKeyboard}
        onBlur={cancelKeyboard}
        onClick={toggle}
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
