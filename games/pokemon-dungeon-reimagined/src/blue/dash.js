import { actorAt, canStep, directionFor, index, open, DIRECTIONS, VECTORS } from './mechanics-common.js';

/** Automatic continuation only; the first deliberate B+direction step is not
 * rejected by this policy. Comparative native owner: dungeon_main.c,
 * sub_805E874. Tiny Woods has no traps or special terrain movement types.
 * The browser geometry identifies natural junctions from its room/corridor
 * boundary; it does not retain the original cartridge's terrain-flag bytes.
 * @param {import('./mechanics-types.js').DungeonState} state
 * @param {number} dx @param {number} dy */
export function canContinueDash(state, dx, dy) {
  const hero = state.hero, x = hero.x, y = hero.y;
  if (!Number.isInteger(dx) || !Number.isInteger(dy) || Math.abs(dx) > 1 || Math.abs(dy) > 1 || (!dx && !dy)) return false;
  if (state.items.some(item => item.x === x && item.y === y) || !open(state, x, y) || !canStep(state, hero, dx, dy)) return false;
  const direction = DIRECTIONS.indexOf(directionFor(dx, dy));
  const roomAt = (/** @type {number} */ xx, /** @type {number} */ yy) => state.roomIds[index(state, xx, yy)] ?? -1;
  const room = roomAt(x, y);
  if (room < 0 && roomAt(x + dx, y + dy) >= 0) return false;
  const cardinal = /** @type {const} */ ([[0, 1], [-1, 0], [0, -1], [1, 0]]);
  if (room >= 0 && cardinal.some(([xx, yy]) => open(state, x + xx, y + yy) && roomAt(x + xx, y + yy) < 0)) return false;
  for (const offset of [-1, 0, 1]) {
    const vector = VECTORS[DIRECTIONS[(direction + offset + 8) % 8] ?? 's'];
    const xx = x + vector[0], yy = y + vector[1];
    if (actorAt(state, xx, yy) || (state.stairs.x === xx && state.stairs.y === yy)) return false;
  }
  const behind = [3, 4, 5].map(offset => VECTORS[DIRECTIONS[(direction + offset) % 8] ?? 's']);
  for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
    if (!behind.some(vector => vector[0] === xx && vector[1] === yy) &&
        state.items.some(item => item.x === x + xx && item.y === y + yy)) return false;
    if ((xx === 0) !== (yy === 0) && (xx !== -dx || yy !== -dy) &&
        open(state, x + xx, y + yy) && room >= 0 && roomAt(x + xx, y + yy) !== room) return false;
  }
  if (dx === 0) {
    for (const side of [-1, 1]) if (open(state, x + side, y) &&
      (!open(state, x + side, y - 1) || !open(state, x + side, y + 1))) return false;
  } else if (dy === 0) {
    for (const side of [-1, 1]) if (open(state, x, y + side) &&
      (!open(state, x - 1, y + side) || !open(state, x + 1, y + side))) return false;
  }
  return true;
}
