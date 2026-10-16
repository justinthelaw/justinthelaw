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
