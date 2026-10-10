/** Browser input adapter. Simulation is never advanced by native key repeat. */
/** @typedef {'confirm'|'cancel'|'menu'|'map'|'wait'|'setMove'|'north'|'south'|'west'|'east'} InputAction */
/** @typedef {{delayMs:number,accepted:boolean,stopRepeat?:boolean}} MoveResult */
/** @typedef {{action:(action:InputAction,event?:Event)=>void,move:(dx:number,dy:number,faceOnly:boolean,run:boolean,continuedDash:boolean)=>MoveResult,activate:(event:Event)=>boolean,interrupt:()=>void}} InputHandlers */

/** @type {Readonly<Record<string,[number,number]>>} */
const DIRECTIONS = Object.freeze({
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  Numpad1: [-1, 1], Numpad2: [0, 1], Numpad3: [1, 1], Numpad4: [-1, 0],
  Numpad6: [1, 0], Numpad7: [-1, -1], Numpad8: [0, -1], Numpad9: [1, -1],
});

/** @param {Document} doc @param {InputHandlers} handlers */
export function createInput(doc, handlers) {
  /** @type {Set<string>} */
  const held = new Set();
  /** @type {Map<string,string>} */
  const owners = new Map();
  /** @type {Set<string>} */
  const pending = new Set();
  let pendingRun = false;
  let pendingFace = false;
  let pendingDiagonal = false;
  let nextMove = 0;
  let moving = false;
  let disposed = false;
  let bUsed = false;
  let shiftUsed = false;
  let revision = 0;
  /** @type {string|null} */ let dashDirection = null;

  function clearPending() { pending.clear(); pendingRun = false; pendingFace = false; pendingDiagonal = false; }
  function clear() {
    revision += 1; owners.clear(); held.clear(); clearPending(); nextMove = 0; moving = false; bUsed = false; shiftUsed = false; dashDirection = null;
  }
  function hasB() { return held.has('b') || held.has('x'); }
  function hasDirection() { return [...held].some(key => DIRECTIONS[key]); }
  /** @param {EventTarget|null} target */
  function isTyping(target) {
    return target instanceof HTMLElement &&
      (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
  }
  /** @param {EventTarget|null} target */
  function confirmsInput(target) {
    return target instanceof HTMLElement &&
      target.matches('input[type="text"][data-game-controls-confirm="submit"]:not(:disabled):not([readonly])') &&
      !target.closest('[inert], [hidden]');
  }
  /** @param {string} owner @param {string} key */
  function hold(owner, key) {
    if (owners.has(owner)) return false;
    const alreadyHeldB = hasB();
    owners.set(owner, key); held.add(key);
    if ((key === 'b' || key === 'x') && !alreadyHeldB) {
      dashDirection = null;
      bUsed = hasDirection() || pending.size > 0;
      if (pending.size) pendingRun = true;
      if (!nextMove) for (const direction of held) if (DIRECTIONS[direction]) queueDirection(direction);
    }
    if (pending.size && (key === 'c' || key === 'y')) pendingFace = true;
    if (pending.size && key === 'r') pendingDiagonal = true;
    return true;
  }
  /** @param {string} owner */
  function release(owner) {
    const key = owners.get(owner);
    if (!key) return null;
    owners.delete(owner);
    if (![...owners.values()].includes(key)) held.delete(key);
    if (DIRECTIONS[key] || ['b', 'x', 'c', 'y'].includes(key)) dashDirection = null;
    return key;
  }
  /** @param {string} key */
  function queueDirection(key) {
    dashDirection = null;
    if (!pending.size) nextMove = performance.now() + 24;
    pending.add(key);
    pendingRun ||= hasB();
    pendingFace ||= held.has('y') || held.has('c');
    pendingDiagonal ||= held.has('r');
    if (pendingRun) bUsed = true;
    moving = false;
  }
  /** @param {KeyboardEvent} event */
  function keyboardOwner(event) { return `keyboard:${event.code || event.key.toLowerCase()}`; }
  /** @param {KeyboardEvent} event */
  function keydown(event) {
    if (disposed || doc.hidden || event.ctrlKey || event.metaKey || event.altKey) return;
    if (held.has('shift') && event.key.toLowerCase() !== 'shift') shiftUsed = true;
    if (isTyping(event.target)) {
      const overlayConfirm = !event.isTrusted && event.code === 'KeyZ' && confirmsInput(event.target);
      if (event.key === 'Enter' || event.key === 'Escape' || overlayConfirm) {
        event.preventDefault();
        if (!event.repeat && handlers.activate(event)) handlers.action(event.key === 'Escape' ? 'cancel' : 'confirm', event);
      }
      return;
    }
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('button') &&
        (event.key === 'Enter' || event.key === ' ')) return;
    const code = event.code || event.key;
    if (DIRECTIONS[code] || DIRECTIONS[event.key]) {
      event.preventDefault();
      const direction = DIRECTIONS[code] ? code : event.key;
      if (event.repeat || !handlers.activate(event) || !hold(keyboardOwner(event), direction)) return;
      // Preserve even a complete down/up pulse until the frame can coalesce
      // both halves of a website diagonal and deliver its first step once.
      queueDirection(direction);
      return;
    }
    const key = event.key.toLowerCase();
    if (['z', 'a', 'x', 'b', 'q', 'c', 'y', 'r', 's', 'shift', 'enter', 'escape', ' '].includes(key)) {
      event.preventDefault();
      // Shift is also the browser's reverse-Tab modifier. Defer its standalone
      // Select action until release so keyboard navigation cannot start a game.
      if (event.repeat || key !== 'shift' && !handlers.activate(event) || !hold(keyboardOwner(event), key)) return;
      if (key === 'shift') shiftUsed = false;
      if (key === 'a' || key === 'z') {
        if (hasB()) bUsed = true;
        handlers.action(held.has('q') ? 'setMove' : hasB() ? 'wait' : 'confirm', event);
      } else if (key === 'enter' || key === 'escape') handlers.action('menu', event);
      else if (key === 's') handlers.action('map', event);
      else if (key === ' ') handlers.action('wait', event);
    }
  }
  /** @param {KeyboardEvent} event */
  function keyup(event) {
    const key = release(keyboardOwner(event));
    if (!hasDirection() && !pending.size) { moving = false; nextMove = 0; }
    if ((key === 'b' || key === 'x') && !hasB() && !bUsed && !disposed && !doc.hidden && doc.hasFocus()) handlers.action('cancel', event);
    if (key === 'shift' && !held.has('shift') && !shiftUsed && !disposed && !doc.hidden && doc.hasFocus() && handlers.activate(event)) handlers.action('map', event);
  }
  function interrupt() { clear(); handlers.interrupt(); }
  function visibility() { if (doc.hidden) interrupt(); }
  /** @param {FocusEvent} event */
  function focus(event) { if (isTyping(event.target)) clear(); }
  doc.addEventListener('keydown', keydown);
  doc.addEventListener('keyup', keyup);
  doc.addEventListener('focusin', focus);
  doc.addEventListener('visibilitychange', visibility);
  doc.defaultView?.addEventListener('blur', interrupt);
  doc.defaultView?.addEventListener('pagehide', interrupt);

  return {
    clear,
    /** An unscheduled leader beat retires queued taps, but a physically held
     * direction still belongs to the next eligible input opportunity. */
    discardQueuedMovement() {
      clearPending();
      if (!hasDirection()) { nextMove = 0; moving = false; dashDirection = null; }
    },
    isFacing() { return held.has('c') || held.has('y'); },
    /** @param {number} now @param {boolean} dungeonActive */
    update(now, dungeonActive) {
      if (disposed || doc.hidden || !nextMove || now < nextMove) return;
      let dx = 0, dy = 0;
      const queued = pending.size > 0;
      for (const key of queued ? new Set([...pending, ...held]) : held) {
        const direction = DIRECTIONS[key];
        if (direction) { dx += direction[0]; dy += direction[1]; }
      }
      dx = Math.sign(dx); dy = Math.sign(dy);
      const run = pendingRun || hasB();
      const faceOnly = pendingFace || held.has('y') || held.has('c');
      const diagonalOnly = pendingDiagonal || held.has('r');
      clearPending();
      if (run && (dx || dy)) bUsed = true;
      const currentRevision = revision;
      const direction = `${dx},${dy}`;
      /** @type {MoveResult} */ let movement = { delayMs: 0, accepted: false };
      if ((dx || dy) && !(dungeonActive && diagonalOnly && (!dx || !dy))) {
        if (dungeonActive) movement = handlers.move(dx, dy, faceOnly, run, run && !faceOnly && dashDirection === direction);
        else if (dy) handlers.action(dy < 0 ? 'north' : 'south');
        else handlers.action(dx < 0 ? 'west' : 'east');
      }
      // Scene changes and interruptions may synchronously clear input. Do not
      // resurrect a repeat timer after the handler has cancelled its ownership.
      if (disposed || revision !== currentRevision || pending.size) return;
      if (movement.stopRepeat) { dashDirection = null; nextMove = 0; moving = false; return; }
      if (!dungeonActive || !run || faceOnly) dashDirection = null;
      else if (movement.accepted) dashDirection = direction;
      // The presentation owner reports the actual remaining animation time.
      // A fixed faster repeat can otherwise land between frames and make run
      // slower than walking by repeatedly discarding its movement attempts.
      nextMove = hasDirection() ? now + (dungeonActive ? Math.max(1000 / 60, movement.delayMs) : moving ? 110 : 280) : 0;
      moving = Boolean(nextMove);
    },
    /** Pointer controls share held-key ownership and interruption handling.
     * Pass cancelled=true for pointercancel/lostpointercapture, never a B action.
     * @param {string} key @param {boolean} down @param {Event} event @param {boolean} [cancelled]
     */
    pointer(key, down, event, cancelled = false) {
      const owner = `pointer:${'pointerId' in event ? String(event.pointerId) : key}`;
      if (!down) {
        const released = release(owner);
        if (released && cancelled && !held.has(released)) {
          pending.delete(released);
          if (!pending.size) clearPending();
        }
        if (!hasDirection() && !pending.size) { moving = false; nextMove = 0; }
        // Always retire a matching owner, including while the leader is between
        // turns. Activation still receives an unowned release for the opening's
        // trusted first-tap gate, but cannot authorize a cancelled B action.
        const activated = !cancelled && !disposed && !doc.hidden && handlers.activate(event);
        if (activated && (released === 'b' || released === 'x') && !hasB() && !bUsed) handlers.action('cancel', event);
        return;
      }
      if (disposed || doc.hidden || cancelled || !handlers.activate(event)) return;
      if (isTyping(doc.activeElement)) {
        if (key === 'a' && confirmsInput(doc.activeElement)) handlers.action('confirm', event);
        return;
      }
      if (!hold(owner, key)) return;
      if (DIRECTIONS[key]) queueDirection(key);
      else if (key === 'a') { if (hasB()) bUsed = true; handlers.action(hasB() ? 'wait' : 'confirm', event); }
      else if (key === 'menu') handlers.action('menu', event);
      else if (key === 'map') handlers.action('map', event);
      else if (key === 'wait') handlers.action('wait', event);
    },
    dispose() {
      disposed = true; clear();
      doc.removeEventListener('keydown', keydown);
      doc.removeEventListener('keyup', keyup);
      doc.removeEventListener('focusin', focus);
      doc.removeEventListener('visibilitychange', visibility);
      doc.defaultView?.removeEventListener('blur', interrupt);
      doc.defaultView?.removeEventListener('pagehide', interrupt);
    },
  };
}
