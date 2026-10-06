/** @typedef {'keyboard' | 'bridge'} KeyOwner */

/** Independent trust lanes prevent touch keyup from releasing a physical key. */
export function createKeyOwnership() {
  /** @type {Map<string, Set<KeyOwner>>} */
  const owners = new Map();
  return {
    /** @param {string} code @param {KeyOwner} owner @returns {boolean} */
    press(code, owner) {
      const keys = owners.get(code) ?? new Set();
      if (keys.has(owner)) return false;
      keys.add(owner);
      owners.set(code, keys);
      return true;
    },
    /** @param {string} code @param {KeyOwner} owner @returns {boolean} */
    release(code, owner) {
      const keys = owners.get(code);
      const released = keys?.delete(owner) ?? false;
      if (keys?.size === 0) owners.delete(code);
      return released;
    },
    /** @param {string} code @returns {boolean} */
    held(code) { return owners.has(code); },
    clear() { owners.clear(); },
  };
}

/**
 * Use structural DOM access so iframe and shadow-root elements work without
 * ambient constructor identity checks. No DOM access happens at module import.
 * @param {EventTarget | null} target
 * @returns {Element | null}
 */
function asElement(target) {
  return target && 'nodeType' in target && target.nodeType === 1
    ? /** @type {Element} */ (target) : null;
}

const TYPING = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [data-input-typing]';
const CONTROLS = `${TYPING}, button, a, [role="button"], [role="menu"], [role="dialog"], [data-input-control], [data-input-hud]`;

/** @param {Event} event @param {Document} document @returns {boolean} */
export function typingOwnsInput(event, document) {
  // Bridge events target document.activeElement: that can be a shadow host
  // whose synthetic composed path does not contain its focused editable.
  let focused = document.activeElement;
  while (focused) {
    if (focused.closest(TYPING)) return true;
    focused = focused.shadowRoot?.activeElement ?? null;
  }
  return event.composedPath().some(target => Boolean(asElement(target)?.closest(TYPING)));
}

/** @param {Event} event @returns {boolean} */
export function startsOnControl(event) {
  return event.composedPath().some(target => Boolean(asElement(target)?.closest(CONTROLS)));
}
