/** @typedef {import('../contracts.js').DirectionDelta} DirectionDelta */
/** @typedef {{readonly dx: DirectionDelta, readonly dz: DirectionDelta}} Direction */
/** @typedef {'world' | 'menu' | 'dialogue' | 'blocked'} InputMode */
/** @typedef {'menu' | 'context' | 'map' | 'inventory' | 'tactics'} Panel */
/**
 * @typedef {(
 * {readonly type: 'move' | 'face', readonly direction: Direction} |
 * {readonly type: 'primary' | 'cancel' | 'wait' | 'confirm'} |
 * {readonly type: 'moveSlot', readonly slot: 0 | 1 | 2 | 3} |
 * {readonly type: 'panel', readonly panel: Panel} |
 * {readonly type: 'navigate', readonly direction: Direction}
 * )} ApplicationIntent
 */
/**
 * @typedef {(
 * {readonly type: 'cameraAdjust', readonly yaw: number, readonly zoom: number} |
 * {readonly type: 'cameraRecenter'}
 * )} CameraIntent
 */

/** @type {Readonly<Record<string, Direction>>} */
const DIRECTIONS = Object.freeze({
  KeyW: { dx: 0, dz: -1 }, ArrowUp: { dx: 0, dz: -1 },
  KeyS: { dx: 0, dz: 1 }, ArrowDown: { dx: 0, dz: 1 },
  KeyA: { dx: -1, dz: 0 }, ArrowLeft: { dx: -1, dz: 0 },
  KeyD: { dx: 1, dz: 0 }, ArrowRight: { dx: 1, dz: 0 },
});

/** @param {string} code @returns {Direction | null} */
export function keyDirection(code) {
  return Object.hasOwn(DIRECTIONS, code) ? DIRECTIONS[code] ?? null : null;
}

/**
 * Union aliases before subtracting: W + Up does not outweigh Down.
 * @param {(code: string) => boolean} held
 * @returns {Direction | null}
 */
export function heldDirection(held) {
  const dx = Number(held('KeyD') || held('ArrowRight')) - Number(held('KeyA') || held('ArrowLeft'));
  const dz = Number(held('KeyS') || held('ArrowDown')) - Number(held('KeyW') || held('ArrowUp'));
  return dx || dz ? { dx: /** @type {DirectionDelta} */ (dx), dz: /** @type {DirectionDelta} */ (dz) } : null;
}

/**
 * Opposing held keys still belong to a movement press group.
 * @param {(code: string) => boolean} held
 * @returns {boolean}
 */
export function hasHeldMovement(held) {
  return Object.keys(DIRECTIONS).some(held);
}

/**
 * Half-sector ties round toward increasing atan2 angle. No legality inference.
 * @param {Direction} direction
 * @param {number} yaw
 * @param {'camera' | 'grid'} controlDirection
 * @returns {Direction}
 */
export function orientDirection(direction, yaw, controlDirection) {
  if (controlDirection === 'grid') return { ...direction };
  const angle = Number.isFinite(yaw) ? yaw % (Math.PI * 2) : 0;
  const x = direction.dx * Math.cos(angle) + direction.dz * Math.sin(angle);
  const z = -direction.dx * Math.sin(angle) + direction.dz * Math.cos(angle);
  const snapped = Math.round(Math.atan2(z, x) / (Math.PI / 4)) * (Math.PI / 4);
  return {
    dx: /** @type {DirectionDelta} */ (Math.round(Math.cos(snapped)) || 0),
    dz: /** @type {DirectionDelta} */ (Math.round(Math.sin(snapped)) || 0),
  };
}

/** @param {string} code @param {InputMode} mode @returns {ApplicationIntent | null} */
export function keyAction(code, mode) {
  if (mode === 'blocked') return null;
  if (mode === 'menu' || mode === 'dialogue') {
    const direction = keyDirection(code);
    if (direction) return { type: 'navigate', direction };
    if (code === 'KeyZ' || code === 'Enter') return { type: 'confirm' };
    if (code === 'KeyX' || code === 'Escape') return { type: 'cancel' };
    return null;
  }
  switch (code) {
    case 'KeyZ': return { type: 'primary' };
    case 'KeyX': return { type: 'cancel' };
    case 'Space': return { type: 'wait' };
    case 'Digit1': return { type: 'moveSlot', slot: 0 };
    case 'Digit2': return { type: 'moveSlot', slot: 1 };
    case 'Digit3': return { type: 'moveSlot', slot: 2 };
    case 'Digit4': return { type: 'moveSlot', slot: 3 };
    case 'Enter': return { type: 'panel', panel: 'menu' };
    case 'Escape': return { type: 'panel', panel: 'context' };
    case 'ShiftRight': case 'KeyM': return { type: 'panel', panel: 'map' };
    case 'KeyI': return { type: 'panel', panel: 'inventory' };
    case 'KeyT': return { type: 'panel', panel: 'tactics' };
    default: return null;
  }
}

/** @param {string} code @returns {CameraIntent | null} */
export function keyCamera(code) {
  if (code === 'KeyR') return { type: 'cameraRecenter' };
  if (code === 'KeyQ' || code === 'KeyE') {
    return { type: 'cameraAdjust', yaw: (code === 'KeyQ' ? -1 : 1) * Math.PI / 8, zoom: 0 };
  }
  return null;
}

/** @param {ApplicationIntent} intent @returns {boolean} */
export function needsWorldReady(intent) {
  return ['move', 'face', 'primary', 'wait', 'moveSlot'].includes(intent.type);
}
