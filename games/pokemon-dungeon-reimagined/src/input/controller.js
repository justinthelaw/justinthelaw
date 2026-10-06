import { hasHeldMovement, heldDirection, keyAction, keyCamera, keyDirection, needsWorldReady, orientDirection } from './map.js';
import { createKeyOwnership, startsOnControl, typingOwnsInput } from './ownership.js';

/** @typedef {import('./map.js').Direction} Direction */
/** @typedef {import('./map.js').ApplicationIntent} ApplicationIntent */
/** @typedef {import('./map.js').CameraIntent} CameraIntent */
/**
 * @typedef {object} InputContext
 * @property {import('./map.js').InputMode} mode
 * @property {string | null} epoch
 * @property {number | null} revision
 * @property {boolean} worldReady
 * @property {number} cameraYaw
 * @property {'camera' | 'grid'} controlDirection
 */
/**
 * @typedef {object} IntentEnvelope
 * @property {InputContext['mode']} mode
 * @property {string | null} epoch
 * @property {number | null} revision
 * @property {ApplicationIntent | CameraIntent} intent
 */
/**
 * @typedef {object} InputOptions
 * @property {Document} target Game document receiving native and bubbling bridge keys.
 * @property {HTMLElement} cameraSurface World surface; its upper half permits camera starts.
 * @property {(envelope: IntentEnvelope) => void} onIntent Synchronous application boundary.
 */
/**
 * @typedef {object} InputController
 * @property {(context: InputContext) => void} setContext
 * @property {() => Direction | null} flush Returns current selected world direction for UI.
 * @property {() => void} cancel
 * @property {() => void} dispose
 */

/**
 * This adapter owns input only. The injected sink validates current application
 * context and resolves commands once; it never receives fabricated domain IDs.
 * @param {InputOptions} options
 * @returns {InputController}
 */
export function createInputController({ target, cameraSurface, onIntent }) {
  const view = target.defaultView;
  if (!view || cameraSurface.ownerDocument !== target) {
    throw new TypeError('Input requires a live document and a surface in that document.');
  }
  const keys = createKeyOwnership();
  /** @type {InputContext} */
  let context = { mode: 'blocked', epoch: null, revision: null, worldReady: false, cameraYaw: 0, controlDirection: 'camera' };
  /** @type {IntentEnvelope | null} */
  let pending = null;
  /** @type {{envelope: IntentEnvelope, completed: boolean} | null} */
  let movementPulse = null;
  let movementConsumed = true;
  /** @type {CameraIntent | null} */
  let camera = null;
  /** @type {Map<number, {role: 'camera', x: number}>} */
  const pointers = new Map();
  let worldPermit = false;
  let disposed = false;
  let flushing = false;

  /** @param {number} pointerId */
  function releasePointer(pointerId) {
    // Delete first: the resulting lostpointercapture is not an interruption.
    pointers.delete(pointerId);
    try {
      if (cameraSurface.hasPointerCapture(pointerId)) cameraSurface.releasePointerCapture(pointerId);
    } catch {
      // Detached surfaces or browser-cancelled pointers already lost capture.
    }
  }

  function cancel() {
    keys.clear();
    pending = null;
    movementPulse = null;
    movementConsumed = true;
    camera = null;
    worldPermit = false;
    for (const pointerId of pointers.keys()) releasePointer(pointerId);
  }

  /** @param {InputContext} next */
  function setContext(next) {
    if (disposed) return;
    if (!['world', 'menu', 'dialogue', 'blocked'].includes(next.mode) ||
        !['camera', 'grid'].includes(next.controlDirection) ||
        typeof next.worldReady !== 'boolean' ||
        (next.epoch !== null && (typeof next.epoch !== 'string' || !next.epoch)) ||
        (next.revision !== null && (!Number.isSafeInteger(next.revision) || next.revision < 0)) ||
        (next.mode === 'world' && (next.epoch === null || next.revision === null))) {
      throw new TypeError('Invalid input context; world input requires a bound epoch and revision.');
    }
    const changed = next.epoch !== context.epoch || next.revision !== context.revision;
    const modeChanged = next.mode !== context.mode;
    const rearm = changed || modeChanged || (!context.worldReady && next.worldReady);
    if (next.epoch !== context.epoch || modeChanged) cancel();
    else if (changed) {
      pending = null;
      movementPulse = null;
      movementConsumed = true;
      camera = null;
    }
    if (!next.worldReady) worldPermit = false;
    else if (rearm) worldPermit = true;
    context = { ...next, cameraYaw: Number.isFinite(next.cameraYaw) ? next.cameraYaw : 0 };
  }

  /** @returns {Direction | null} */
  function selectedDirection() {
    if (context.mode !== 'world') return null;
    const direction = heldDirection(keys.held);
    return direction ? orientDirection(direction, context.cameraYaw, context.controlDirection) : null;
  }

  function rememberMovement() {
    if (movementConsumed || movementPulse?.completed) return;
    const direction = selectedDirection();
    movementPulse = direction ? {
      envelope: envelope({ type: keys.held('ShiftLeft') ? 'face' : 'move', direction }),
      completed: false,
    } : null;
  }

  /** @param {ApplicationIntent | CameraIntent} intent @returns {IntentEnvelope} */
  function envelope(intent) {
    return { epoch: context.epoch, revision: context.revision, mode: context.mode, intent };
  }

  /** @param {IntentEnvelope} queued @returns {boolean} */
  function current(queued) {
    return queued.epoch === context.epoch && queued.revision === context.revision && queued.mode === context.mode;
  }

  /** @param {ApplicationIntent} intent */
  function queue(intent) {
    if (pending) return; // First activation wins; never grow a turn backlog.
    pending = envelope(intent);
    if (needsWorldReady(intent) && context.worldReady) worldPermit = true;
  }

  /** @param {CameraIntent} intent */
  function queueCamera(intent) {
    if (intent.type === 'cameraRecenter') { camera = intent; return; }
    if (camera?.type === 'cameraRecenter') return;
    camera = {
      type: 'cameraAdjust',
      yaw: clamp((camera?.yaw ?? 0) + intent.yaw, Math.PI / 2),
      zoom: clamp((camera?.zoom ?? 0) + intent.zoom, 1),
    };
  }

  /** @returns {Direction | null} */
  function flush() {
    if (disposed || flushing) return null;
    if (target.hidden) { cancel(); return null; }
    flushing = true;
    try {
      if (camera && context.mode === 'world') {
        const next = camera;
        camera = null;
        onIntent(envelope(next));
      }
      // The sink may synchronously replace/dispose context during camera work.
      if (disposed) return null;
      if (pending && !current(pending)) pending = null;
      if (movementPulse && !current(movementPulse.envelope)) movementPulse = null;
      const direction = selectedDirection();
      const candidate = pending ?? (movementPulse?.completed ? movementPulse.envelope :
        direction ? envelope({ type: keys.held('ShiftLeft') ? 'face' : 'move', direction }) : null);
      if (!candidate || candidate.intent.type === 'cameraAdjust' || candidate.intent.type === 'cameraRecenter') return direction;
      if (needsWorldReady(candidate.intent)) {
        if (!context.worldReady || !worldPermit) return direction;
        worldPermit = false; // Consume before callback, including rejection/throw.
      }
      if (candidate.intent.type === 'move' || candidate.intent.type === 'face') {
        movementPulse = null;
        movementConsumed = true; // Subsequent keyup cannot add a second pulse.
      }
      pending = null;
      onIntent(candidate);
      return disposed ? null : selectedDirection();
    } finally {
      flushing = false;
    }
  }

  /** @param {KeyboardEvent} event */
  function keydown(event) {
    if (disposed || target.hidden || context.mode === 'blocked') return;
    if (typingOwnsInput(event, target) || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) {
      cancel();
      return;
    }
    const direction = keyDirection(event.code);
    const facing = context.mode === 'world' && event.code === 'ShiftLeft';
    // ShiftLeft is the sole facing modifier; ShiftRight is the bridge's Select.
    if (event.shiftKey && event.code !== 'ShiftRight' && !facing && !(direction && keys.held('ShiftLeft'))) return;
    const action = keyAction(event.code, context.mode);
    const cameraAction = context.mode === 'world' ? keyCamera(event.code) : null;
    if (!direction && !facing && !action && !cameraAction) return;
    event.preventDefault();
    if (event.repeat) return;
    const neutral = heldDirection(keys.held) === null;
    const newMovementGroup = !hasHeldMovement(keys.held);
    if (!keys.press(event.code, event.isTrusted ? 'keyboard' : 'bridge')) return;
    if (context.mode === 'world' && direction) {
      if (newMovementGroup) movementConsumed = false;
      rememberMovement();
      if (neutral && context.worldReady) worldPermit = true;
    } else if (action) queue(action);
    else if (cameraAction) queueCamera(cameraAction);
    else if (facing) rememberMovement();
  }

  /** @param {KeyboardEvent} event */
  function keyup(event) {
    const released = keys.release(event.code, event.isTrusted ? 'keyboard' : 'bridge');
    // Preserve the last combined press direction across sequential diagonal
    // releases. Live held movement still wins until the whole group is up.
    if (released && keyDirection(event.code) && !hasHeldMovement(keys.held) && movementPulse) movementPulse.completed = true;
    if (released && !typingOwnsInput(event, target) && !event.ctrlKey && !event.metaKey && !event.altKey) event.preventDefault();
  }

  /** @param {PointerEvent | WheelEvent} event @returns {boolean} */
  function cameraStartAllowed(event) {
    if (disposed || target.hidden || context.mode !== 'world' || startsOnControl(event) || typingOwnsInput(event, target)) return false;
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
    const rect = cameraSurface.getBoundingClientRect();
    return event.clientX >= rect.left && event.clientX < rect.right &&
      event.clientY >= rect.top && event.clientY < rect.top + rect.height / 2;
  }

  /** @param {PointerEvent} event */
  function pointerdown(event) {
    if (event.button !== 0 || !cameraStartAllowed(event) || pointers.has(event.pointerId)) return;
    try { cameraSurface.setPointerCapture(event.pointerId); } catch { return; }
    pointers.set(event.pointerId, { role: 'camera', x: event.clientX });
    event.preventDefault();
  }

  /** @param {PointerEvent} event */
  function pointermove(event) {
    const pointer = pointers.get(event.pointerId);
    if (!pointer || disposed || context.mode !== 'world') return;
    const delta = event.clientX - pointer.x;
    pointer.x = event.clientX;
    if (Number.isFinite(delta)) queueCamera({ type: 'cameraAdjust', yaw: clamp(-delta * 0.005, Math.PI / 4), zoom: 0 });
    event.preventDefault();
  }

  /** @param {PointerEvent} event */
  function pointerup(event) {
    if (!pointers.has(event.pointerId)) return;
    releasePointer(event.pointerId);
    event.preventDefault();
  }

  /** @param {PointerEvent} event */
  function lostcapture(event) {
    if (pointers.has(event.pointerId)) cancel();
  }

  /** @param {WheelEvent} event */
  function wheel(event) {
    if (!cameraStartAllowed(event) || !Number.isFinite(event.deltaY)) return;
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? cameraSurface.clientHeight : 1;
    queueCamera({ type: 'cameraAdjust', yaw: 0, zoom: clamp(event.deltaY * scale / 600, 1) });
    event.preventDefault();
  }

  function visibility() { if (target.hidden) cancel(); }
  /** @param {FocusEvent} event */
  function focus(event) { if (typingOwnsInput(event, target)) cancel(); }

  target.addEventListener('keydown', keydown);
  target.addEventListener('keyup', keyup);
  target.addEventListener('focusin', focus);
  target.addEventListener('visibilitychange', visibility);
  target.addEventListener('pointercancel', cancel);
  view.addEventListener('blur', cancel);
  view.addEventListener('pagehide', cancel);
  cameraSurface.addEventListener('pointerdown', pointerdown);
  cameraSurface.addEventListener('pointermove', pointermove);
  cameraSurface.addEventListener('pointerup', pointerup);
  cameraSurface.addEventListener('lostpointercapture', lostcapture);
  cameraSurface.addEventListener('wheel', wheel, { passive: false });

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancel();
    target.removeEventListener('keydown', keydown);
    target.removeEventListener('keyup', keyup);
    target.removeEventListener('focusin', focus);
    target.removeEventListener('visibilitychange', visibility);
    target.removeEventListener('pointercancel', cancel);
    view?.removeEventListener('blur', cancel);
    view?.removeEventListener('pagehide', cancel);
    cameraSurface.removeEventListener('pointerdown', pointerdown);
    cameraSurface.removeEventListener('pointermove', pointermove);
    cameraSurface.removeEventListener('pointerup', pointerup);
    cameraSurface.removeEventListener('lostpointercapture', lostcapture);
    cameraSurface.removeEventListener('wheel', wheel);
  }

  return { setContext, flush, cancel, dispose };
}

/** @param {number} value @param {number} limit @returns {number} */
function clamp(value, limit) {
  return Math.max(-limit, Math.min(limit, value));
}
