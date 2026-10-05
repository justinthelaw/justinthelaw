/** Structural JSON safety only. Full state/catalog validation belongs to P07/P08.
 * No campaign defaults or source-dependent game rules live in this module.
 * @typedef {import('../contracts.js').JsonValue} JsonValue
 * @typedef {import('../contracts.js').ReadonlyJson} ReadonlyJson
 * @typedef {{maxDepth: number, maxNodes: number, maxArrayLength: number, maxObjectKeys: number, maxStringLength: number, maxTextLength: number}} PlainDataLimits
 */

/** Safety budgets, not original-game capacities. Text is counted in UTF-16 units.
 * @type {Readonly<PlainDataLimits>}
 */
export const PLAIN_DATA_LIMITS = Object.freeze({
  maxDepth: 64,
  maxNodes: 200000,
  maxArrayLength: 50000,
  maxObjectKeys: 50000,
  maxStringLength: 65536,
  maxTextLength: 4 * 1024 * 1024,
});
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);

/** Copy an already parsed value without evaluating getters or retaining aliases.
 * Callers must separately bound input bytes before JSON.parse. Arbitrary Proxy
 * objects are not a supported input boundary; imports must come from JSON.parse.
 * @param {unknown} input
 * @param {Readonly<PlainDataLimits>} [limits]
 * @returns {JsonValue}
 */
export function copyPlainData(input, limits = PLAIN_DATA_LIMITS) {
  for (const key of /** @type {(keyof PlainDataLimits)[]} */ (Object.keys(PLAIN_DATA_LIMITS))) {
    if (!Number.isSafeInteger(limits[key]) || limits[key] < 1 || limits[key] > PLAIN_DATA_LIMITS[key]) {
      throw new RangeError('Invalid plain-data safety budget.');
    }
  }
  const ancestors = new WeakSet();
  let nodes = 0;
  let textLength = 0;
  /** @param {string} value */
  function countText(value) {
    textLength += value.length;
    if (value.length > limits.maxStringLength || textLength > limits.maxTextLength) {
      throw new RangeError('Plain data exceeds its text budget.');
    }
  }
  /** @param {unknown} value @param {number} depth @returns {JsonValue} */
  function copy(value, depth) {
    if (++nodes > limits.maxNodes || depth > limits.maxDepth) throw new RangeError('Plain data is too large or deep.');
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) throw new TypeError('Plain data requires finite numbers.');
      return value;
    }
    if (typeof value === 'string') { countText(value); return value; }
    if (typeof value !== 'object') throw new TypeError('Plain data contains an unsupported value.');
    if (ancestors.has(value)) throw new TypeError('Plain data contains a cycle.');
    const array = Array.isArray(value);
    const prototype = Object.getPrototypeOf(value);
    if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Plain data requires ordinary arrays or objects.');
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some(key => typeof key !== 'string')) throw new TypeError('Plain data cannot contain symbol keys.');
    ancestors.add(value);
    /** @param {string} key @returns {JsonValue} */
    function property(key) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) {
        throw new TypeError('Plain data cannot contain accessors, hidden fields or sparse entries.');
      }
      return copy(descriptor.value, depth + 1);
    }
    /** @type {JsonValue} */
    let result;
    if (array) {
      if (value.length > limits.maxArrayLength || keys.length !== value.length + 1) {
        throw new TypeError('Plain array is oversized, sparse or has extra fields.');
      }
      /** @type {JsonValue[]} */
      const items = [];
      for (let index = 0; index < value.length; index++) items.push(property(String(index)));
      result = items;
    } else {
      if (keys.length > limits.maxObjectKeys) throw new RangeError('Plain object has too many fields.');
      /** @type {{[key: string]: JsonValue}} */
      const record = Object.create(null);
      for (const key of /** @type {string[]} */ (keys)) {
        if (forbiddenKeys.has(key)) throw new TypeError('Plain data contains an unsafe key.');
        countText(key);
        record[key] = property(key);
      }
      result = record;
    }
    ancestors.delete(value);
    return result;
  }
  return copy(input, 0);
}

/** Detached deeply immutable view. This never freezes or retains the input.
 * @param {unknown} input
 * @param {Readonly<PlainDataLimits>} [limits]
 * @returns {ReadonlyJson}
 */
export function snapshotPlainData(input, limits = PLAIN_DATA_LIMITS) {
  /** @param {JsonValue} value @returns {ReadonlyJson} */
  function freeze(value) {
    if (value !== null && typeof value === 'object') {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  }
  return freeze(copyPlainData(input, limits));
}
