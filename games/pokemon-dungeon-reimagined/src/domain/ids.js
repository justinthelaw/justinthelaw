/** @typedef {import('../contracts.js').IdSequence} IdSequence */
/** @typedef {import('../contracts.js').InstanceKind} InstanceKind */
/** @typedef {import('../contracts.js').CatalogKind} CatalogKind */

const instanceKinds = new Set(['pokemon', 'actor', 'move-slot', 'item-instance', 'session', 'job', 'transaction', 'map', 'room', 'container', 'trap', 'exit', 'scene-instance', 'result', 'shop', 'shop-lot', 'rescue-request', 'imported-team']);
const catalogKinds = new Set(['species', 'form', 'move', 'item', 'dungeon', 'scene', 'friend-area', 'section', 'floor', 'map-definition', 'terrain', 'trap-kind', 'weather', 'type', 'ability', 'iq-skill', 'tactic', 'story-node', 'story-branch', 'milestone', 'grant', 'scene-role', 'scene-choice', 'scene-option', 'story-actor', 'encounter', 'policy', 'effect-program', 'item-variant']);
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);

/** Membership is evidence supplied by an accepted catalog, not by spelling.
 * This function does not promote an authoring inventory to runtime-ready data.
 * @template {CatalogKind} Kind
 * @param {Kind} kind
 * @param {unknown} value
 * @param {ReadonlySet<string>} members
 * @returns {import('../contracts.js').Id<Kind>}
 */
export function catalogId(kind, value, members) {
  if (!catalogKinds.has(kind) || typeof value !== 'string' ||
      !/^[a-z][a-z0-9-]{0,95}$/.test(value) || forbiddenKeys.has(value) || !members.has(value)) {
    throw new TypeError('Unknown catalog identity.');
  }
  return /** @type {import('../contracts.js').Id<Kind>} */ (value);
}

/** @param {number} dexNo @param {ReadonlySet<string>} members */
export function speciesIdFromDex(dexNo, members) {
  if (!Number.isSafeInteger(dexNo) || dexNo < 1 || dexNo > 386) {
    throw new RangeError('Species is outside the original Blue roster.');
  }
  return catalogId('species', `pokemon-${String(dexNo).padStart(3, '0')}`, members);
}

/** Validate a save-local generated identity without conflating its kind.
 * Existence and ownership must additionally be checked against canonical state.
 * @template {InstanceKind} Kind
 * @param {Kind} kind
 * @param {unknown} value
 * @returns {import('../contracts.js').Id<Kind>}
 */
export function instanceId(kind, value) {
  if (!instanceKinds.has(kind) || typeof value !== 'string' || value.length > 48 || !value.startsWith(`${kind}:`)) {
    throw new TypeError('Invalid instance identity.');
  }
  const suffix = value.slice(kind.length + 1);
  if (!/^[1-9][0-9]*$/.test(suffix) || !Number.isSafeInteger(Number(suffix))) {
    throw new TypeError('Invalid instance sequence.');
  }
  return /** @type {import('../contracts.js').Id<Kind>} */ (value);
}

/** Pure allocation: the caller commits both ID and counter in one transaction.
 * The counter is save-local and persisted; IDs consume no gameplay RNG.
 * @template {InstanceKind} Kind
 * @param {IdSequence} sequence
 * @param {Kind} kind
 * @param {ReadonlySet<string>} existingIds All extant identities of this kind.
 */
export function allocateId(sequence, kind, existingIds) {
  if (!Number.isSafeInteger(sequence.next) || sequence.next < 1 || sequence.next >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Instance sequence is invalid or exhausted.');
  }
  const id = instanceId(kind, `${kind}:${sequence.next}`);
  if (existingIds.has(id)) throw new Error('Instance identity already exists.');
  return Object.freeze({ id, sequence: Object.freeze({ next: sequence.next + 1 }) });
}
