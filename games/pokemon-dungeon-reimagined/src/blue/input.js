/** Browser input adapter. Simulation is never advanced by native key repeat. */
/** @typedef {'confirm'|'cancel'|'menu'|'map'|'wait'|'setMove'|'north'|'south'|'west'|'east'} InputAction */
/** @typedef {{action:(action:InputAction)=>void,move:(dx:number,dy:number,faceOnly:boolean,run:boolean)=>void,activate:(event:Event)=>void,interrupt:()=>void}} InputHandlers */

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

  function clearPending() { pending.clear(); pendingRun = false; pendingFace = false; pendingDiagonal = false; }
  function clear() {
    revision += 1; owners.clear(); held.clear(); clearPending(); nextMove = 0; moving = false; bUsed = false; shiftUsed = false;
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
      bUsed = hasDirection() || pending.size > 0;
      if (pending.size) pendingRun = true;
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
    return key;
  }
  /** @param {string} key */
  function queueDirection(key) {
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
    handlers.activate(event);
    if (isTyping(event.target)) {
      const overlayConfirm = !event.isTrusted && event.code === 'KeyZ' && confirmsInput(event.target);
      if (event.key === 'Enter' || event.key === 'Escape' || overlayConfirm) {
        event.preventDefault();
        if (!event.repeat) handlers.action(event.key === 'Escape' ? 'cancel' : 'confirm');
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
      if (event.repeat || !hold(keyboardOwner(event), direction)) return;
      // Preserve even a complete down/up pulse until the frame can coalesce
      // both halves of a website diagonal and deliver its first step once.
      queueDirection(direction);
      return;
    }
    const key = event.key.toLowerCase();
    if (['z', 'a', 'x', 'b', 'q', 'c', 'y', 'r', 's', 'shift', 'enter', 'escape', ' '].includes(key)) {
      event.preventDefault();
      if (event.repeat || !hold(keyboardOwner(event), key)) return;
      if (key === 'shift') shiftUsed = false;
      if (key === 'a' || key === 'z') {
        if (hasB()) bUsed = true;
        handlers.action(held.has('q') ? 'setMove' : hasB() ? 'wait' : 'confirm');
      } else if (key === 'enter' || key === 'escape') handlers.action('menu');
      else if (key === 's') handlers.action('map');
      else if (key === ' ') handlers.action('wait');
    }
  }
  /** @param {KeyboardEvent} event */
  function keyup(event) {
    const key = release(keyboardOwner(event));
    if (!hasDirection() && !pending.size) { moving = false; nextMove = 0; }
    if ((key === 'b' || key === 'x') && !hasB() && !bUsed && !disposed && !doc.hidden && doc.hasFocus()) handlers.action('cancel');
    if (key === 'shift' && !held.has('shift') && !shiftUsed && !disposed && !doc.hidden && doc.hasFocus()) handlers.action('map');
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
      if ((dx || dy) && !(dungeonActive && diagonalOnly && (!dx || !dy))) {
        if (dungeonActive) handlers.move(dx, dy, faceOnly, run);
        else if (dy) handlers.action(dy < 0 ? 'north' : 'south');
        else handlers.action(dx < 0 ? 'west' : 'east');
      }
      // Scene changes and interruptions may synchronously clear input. Do not
      // resurrect a repeat timer after the handler has cancelled its ownership.
      if (disposed || revision !== currentRevision || pending.size) return;
      nextMove = hasDirection() ? now + (moving ? dungeonActive ? run ? 95 : 170 : 110 : 280) : 0;
      moving = Boolean(nextMove);
    },
    /** Pointer controls share held-key ownership and interruption handling.
     * Pass cancelled=true for pointercancel/lostpointercapture, never a B action.
     * @param {string} key @param {boolean} down @param {Event} event @param {boolean} [cancelled]
     */
    pointer(key, down, event, cancelled = false) {
      if (disposed || doc.hidden) return;
      handlers.activate(event);
      const owner = `pointer:${'pointerId' in event ? String(event.pointerId) : key}`;
      if (!down) {
        const released = release(owner);
        if (!released) return;
        if (cancelled && !held.has(released)) {
          pending.delete(released);
          if (!pending.size) clearPending();
        }
        if (!hasDirection() && !pending.size) { moving = false; nextMove = 0; }
        if (!cancelled && (released === 'b' || released === 'x') && !hasB() && !bUsed) handlers.action('cancel');
        return;
      }
      if (isTyping(doc.activeElement)) {
        if (key === 'a' && confirmsInput(doc.activeElement)) handlers.action('confirm');
        return;
      }
      if (!hold(owner, key)) return;
      if (DIRECTIONS[key]) queueDirection(key);
      else if (key === 'a') { if (hasB()) bUsed = true; handlers.action(hasB() ? 'wait' : 'confirm'); }
      else if (key === 'menu') handlers.action('menu');
      else if (key === 'map') handlers.action('map');
      else if (key === 'wait') handlers.action('wait');
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
