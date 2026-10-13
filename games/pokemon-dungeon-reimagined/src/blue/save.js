/** A small, separate browser save journal for the Tiny Woods opening.
 * Historical campaign keys are never read, migrated, overwritten or removed.
 */
import { isNamingText, validateNamingState } from './naming.js';
/** @typedef {import('./onboarding.js').QuizState} QuizState */
/** @typedef {import('./mechanics.js').DungeonState} DungeonState */
/** @typedef {'welcome'|'quiz'|'gender'|'result'|'partner'|'partner-confirm'|'partner-name'|'partner-name-confirm'|'departure'|'awakening'|'hero-name'|'hero-name-confirm'|'named'|'trouble'|'help-choice'|'enter'|'dungeon'|'clearing'|'reunion'|'complete'|'defeated'} Phase */
/** @typedef {'checkpoint'|'quicksave'|'completed'|'unknown'} SaveKind */
/** @typedef {{playFrames:number|null,adventures:number|null,saveKind:SaveKind}} ProgressMetadata */
/** @typedef {{version:1|2,phase:Phase,line:number,quiz:QuizState,gender:'male'|'female',natureId:string,heroSpeciesId:string,partnerSpeciesId:string,heroName:string,partnerName:string,nameDraft:string,naming?:import('./naming.js').NamingState,dungeon:DungeonState|null,tutorialSeen:number[],rewarded:boolean,progress?:ProgressMetadata}} OpeningSave */
/** @typedef {{state:OpeningSave|null,warning:string|null,hasStored:boolean}} LoadResult */
/** @typedef {{slot:0|1,revision:number,payload:string,state:OpeningSave}} SaveRecord */
/** @typedef {[string|null,string|null,string|null]} SaveReceipt */

const LEGACY_SAVE_PREFIX = 'pokemon.blue-rescue-opening.v1';
const SAVE_PREFIX = 'pokemon.blue-rescue-opening.v2';
const MARKER_KEY = `${SAVE_PREFIX}.handled`;
const ACTIVE_MARKER = JSON.stringify({ format: `${SAVE_PREFIX}.marker`, state: 'active' });
const DELETED_MARKER = JSON.stringify({ format: `${SAVE_PREFIX}.marker`, state: 'deleted' });
const MAX_SAVE_LENGTH = 500000;
const CHANGED_SAVE = 'Saved data changed outside this tab. Reload before saving again.';
const UNVERIFIED_SAVE = 'The saved data could not be verified. Reload before saving again.';
const PHASES = new Set([
  'welcome', 'quiz', 'gender', 'result', 'partner', 'partner-confirm',
  'partner-name', 'partner-name-confirm', 'departure', 'awakening',
  'hero-name', 'hero-name-confirm', 'named', 'trouble', 'help-choice',
  'enter', 'dungeon', 'clearing', 'reunion', 'complete', 'defeated',
]);

/** Corruption detection, not an authentication or security signature. @param {string} text */
function checksum(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** @param {unknown} value @returns {value is Record<string,unknown>} */
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
/** @param {unknown} value @param {number} max */
function integer(value, max) { return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max; }

/** Exact serialized observations detect changes even when revisions or checksums
 * coincide. localStorage has no atomic compare-and-swap across browser processes;
 * these bounded checks do not serialize simultaneous writers.
 * @param {Storage} storage @returns {SaveReceipt}
 */
function readReceipt(storage, prefix = SAVE_PREFIX) {
  return [storage.getItem(`${prefix}.0`), storage.getItem(`${prefix}.1`),
    prefix === SAVE_PREFIX ? storage.getItem(MARKER_KEY) : null];
}
/** @param {SaveReceipt} left @param {SaveReceipt} right */
function sameReceipt(left, right) {
  return left[0] === right[0] && left[1] === right[1] && left[2] === right[2];
}

/** Complete shallow shell validation; the mechanics owner validates its dungeon.
 * @param {unknown} value
 * @param {(value:unknown)=>boolean} validateDungeon
 * @param {Set<string>} speciesIds
 * @returns {value is OpeningSave}
 */
export function validateOpeningSave(value, validateDungeon, speciesIds) {
  if (!object(value) || value.version !== 1 && value.version !== 2 || typeof value.phase !== 'string' || !PHASES.has(value.phase) ||
      !integer(value.line, 100) || !object(value.quiz) || !object(value.quiz.scores) ||
      !integer(value.quiz.answered, 8) || !Array.isArray(value.quiz.usedCategories) ||
      value.quiz.usedCategories.length > 8 || value.quiz.usedCategories.some(id => typeof id !== 'string') ||
      new Set(value.quiz.usedCategories).size !== value.quiz.usedCategories.length ||
      typeof value.quiz.followUp !== 'boolean' ||
      !(value.quiz.questionId === null || typeof value.quiz.questionId === 'string') ||
      ![13, 14].includes(Object.keys(value.quiz.scores).length) ||
      Object.values(value.quiz.scores).some(score => !integer(score, 64)) ||
      !['male', 'female'].includes(String(value.gender)) || typeof value.natureId !== 'string' ||
      typeof value.rewarded !== 'boolean' || !Array.isArray(value.tutorialSeen) ||
      value.tutorialSeen.length > 3 || value.tutorialSeen.some(floor => !integer(floor, 3) || floor === 0)) return false;
  for (const field of ['heroName', 'partnerName', 'nameDraft']) {
    if (!isNamingText(value[field])) return false;
  }
  if (Object.hasOwn(value, 'naming') && (!validateNamingState(value.naming) || value.naming.text !== value.nameDraft)) return false;
  for (const field of ['heroSpeciesId', 'partnerSpeciesId']) {
    if (typeof value[field] !== 'string' || !speciesIds.has(value[field])) return false;
  }
  if (value.version === 2) {
    if (!object(value.progress) || Object.keys(value.progress).length !== 3 ||
        !Object.hasOwn(value.progress, 'playFrames') || !Object.hasOwn(value.progress, 'adventures') || !Object.hasOwn(value.progress, 'saveKind') ||
        !(value.progress.playFrames === null || integer(value.progress.playFrames, 9999 * 60 * 60 * 60 + 59 * 60 * 60 + 59 * 60 + 59)) ||
        !(value.progress.adventures === null || integer(value.progress.adventures, 99999)) ||
        typeof value.progress.saveKind !== 'string' || !['checkpoint', 'quicksave', 'completed', 'unknown'].includes(value.progress.saveKind)) return false;
  } else if (Object.hasOwn(value, 'progress')) return false;
  if (value.dungeon !== null && !validateDungeon(value.dungeon)) return false;
  if (['dungeon', 'clearing', 'reunion', 'complete', 'defeated'].includes(value.phase) && value.dungeon === null) return false;
  return true;
}

/** @param {(value:unknown)=>value is OpeningSave} validate */
export function createSaveRepository(validate) {
  /** @type {Storage|null} */ let storage = null;
  /** @type {string|null} */ let unavailable = null;
  try { storage = window.localStorage; }
  catch { unavailable = 'Browser storage is unavailable. Keep this tab open to retain progress.'; }
  let revision = 0;
  /** @type {0|1} */ let currentSlot = 1;
  /** The live adventure may mutate after save; retain only its verified bytes. */
  /** @type {string|null} */ let lastPayload = null;
  /** @type {SaveReceipt|null} */ let observed = null;
  let ownershipWarning = UNVERIFIED_SAVE;

  /** @param {SaveReceipt} receipt @param {string} prefix */
  function inspect(receipt, prefix) {
    /** @type {SaveRecord[]} */ const valid = [];
    /** @type {{slot:0|1,revision:number}[]} */ const unsupported = [];
    let damaged = false;
    for (const slot of /** @type {const} */ ([0, 1])) {
      try {
        const raw = receipt[slot];
        if (raw === null) continue;
        if (raw.length > MAX_SAVE_LENGTH) throw new Error('Oversized save');
        const envelope = JSON.parse(raw);
        if (!object(envelope) || envelope.format !== prefix || !integer(envelope.revision, 1000000000) ||
            typeof envelope.payload !== 'string' || envelope.checksum !== checksum(envelope.payload)) throw new Error('Invalid save');
        const state = JSON.parse(envelope.payload);
        if (!validate(state)) {
          unsupported.push({ slot, revision: /** @type {number} */ (envelope.revision) });
          continue;
        }
        valid.push({ slot, revision: /** @type {number} */ (envelope.revision), payload: envelope.payload, state });
      } catch { damaged = true; }
    }
    valid.sort((a, b) => b.revision - a.revision);
    unsupported.sort((a, b) => b.revision - a.revision);
    return { valid, unsupported, damaged };
  }

  /** A failed or divergent observation never adopts the other writer's state.
   * A fresh load is the only way to acquire ownership again.
   * @returns {SaveReceipt}
   */
  function requireReceipt() {
    if (!storage || !observed) throw new Error(ownershipWarning);
    try {
      if (!sameReceipt(readReceipt(storage), observed)) {
        ownershipWarning = CHANGED_SAVE;
        throw new Error(ownershipWarning);
      }
      return observed;
    } catch {
      observed = null;
      throw new Error(ownershipWarning);
    }
  }

  /** @returns {LoadResult} */
  function load() {
    revision = 0; currentSlot = 1; lastPayload = null; observed = null;
    ownershipWarning = UNVERIFIED_SAVE;
    if (!storage) return { state: null, warning: unavailable, hasStored: false };
    /** @type {SaveReceipt} */ let receipt;
    try {
      receipt = readReceipt(storage);
      if (!sameReceipt(receipt, readReceipt(storage))) {
        ownershipWarning = CHANGED_SAVE;
        return { state: null, warning: ownershipWarning, hasStored: receipt.some(raw => raw !== null) };
      }
    } catch { return { state: null, warning: ownershipWarning, hasStored: false }; }

    // Any v2 slot or marker permanently selects v2. Damaged or partially deleted
    // v2 bytes are preserved; this path never consults the legacy journal.
    if (receipt.some(raw => raw !== null)) {
      const review = inspect(receipt, SAVE_PREFIX);
      const record = review.valid[0];
      const unreadable = review.unsupported[0];
      const newest = !record || unreadable && unreadable.revision >= record.revision ? unreadable : record;
      if (newest) { revision = newest.revision; currentSlot = newest.slot; }
      observed = receipt;
      if (receipt[2] === DELETED_MARKER) {
        return { state: null, warning: review.damaged ? 'An interrupted save deletion was preserved.' : null, hasStored: false };
      }
      if (unreadable && (!record || unreadable.revision >= record.revision)) {
        return { state: null, warning: 'A newer opening save could not be read. Its data has been preserved.', hasStored: true };
      }
      const markerDamaged = receipt[2] !== null && receipt[2] !== ACTIVE_MARKER;
      if (markerDamaged) {
        return { state: null, warning: 'The opening save marker could not be read. Its data has been preserved.', hasStored: true };
      }
      if (record) lastPayload = record.payload;
      return {
        state: record?.state ?? null,
        warning: !record || review.damaged || markerDamaged || receipt[2] === null
          ? record ? 'An interrupted save was recovered from the previous checkpoint.'
            : 'The opening save could not be read. Its data has been preserved.' : null,
        hasStored: true,
      };
    }

    // v2 is wholly absent. Observe v1 twice, then copy its newest valid bytes
    // into v2 without changing either legacy slot.
    /** @type {SaveReceipt} */ let legacy;
    try {
      legacy = readReceipt(storage, LEGACY_SAVE_PREFIX);
      if (!sameReceipt(legacy, readReceipt(storage, LEGACY_SAVE_PREFIX)) ||
          !sameReceipt(receipt, readReceipt(storage))) {
        ownershipWarning = CHANGED_SAVE;
        return { state: null, warning: ownershipWarning, hasStored: legacy.some(raw => raw !== null) };
      }
    } catch { return { state: null, warning: ownershipWarning, hasStored: false }; }
    const review = inspect(legacy, LEGACY_SAVE_PREFIX);
    const record = review.valid[0];
    const unreadable = review.unsupported[0];
    const legacyStored = legacy[0] !== null || legacy[1] !== null;
    if (unreadable && (!record || unreadable.revision >= record.revision)) {
      revision = unreadable.revision; currentSlot = unreadable.slot; observed = receipt;
      return { state: null, warning: 'A newer opening save could not be read. Its data has been preserved.', hasStored: true };
    }
    if (!record) {
      observed = receipt;
      return {
        state: null,
        warning: review.damaged ? 'The opening save could not be read. Its data has been preserved.' : null,
        hasStored: legacyStored,
      };
    }
    try {
      const nextRevision = record.revision + 1;
      if (nextRevision > 1000000000) throw new Error('The save journal is full.');
      const nextSlot = /** @type {0|1} */ (record.slot === 0 ? 1 : 0);
      const raw = JSON.stringify({ format: SAVE_PREFIX, revision: nextRevision,
        checksum: checksum(record.payload), payload: record.payload });
      const expected = /** @type {SaveReceipt} */ ([...receipt]);
      expected[nextSlot] = raw;
      if (!sameReceipt(readReceipt(storage), receipt) ||
          !sameReceipt(readReceipt(storage, LEGACY_SAVE_PREFIX), legacy)) throw new Error(CHANGED_SAVE);
      storage.setItem(`${SAVE_PREFIX}.${nextSlot}`, raw);
      if (!sameReceipt(readReceipt(storage), expected) ||
          !sameReceipt(readReceipt(storage, LEGACY_SAVE_PREFIX), legacy)) throw new Error(UNVERIFIED_SAVE);
      expected[2] = ACTIVE_MARKER;
      storage.setItem(MARKER_KEY, ACTIVE_MARKER);
      if (!sameReceipt(readReceipt(storage), expected) ||
          !sameReceipt(readReceipt(storage, LEGACY_SAVE_PREFIX), legacy)) throw new Error(UNVERIFIED_SAVE);
      revision = nextRevision; currentSlot = nextSlot; lastPayload = record.payload; observed = expected;
      return { state: record.state, warning: review.damaged
        ? 'An interrupted save was recovered from the previous checkpoint.' : null, hasStored: true };
    } catch {
      observed = null;
      return { state: null, warning: UNVERIFIED_SAVE, hasStored: true };
    }
  }

  /** @param {OpeningSave} state @returns {string|null} */
  function save(state) {
    if (!storage) return unavailable;
    let writing = false;
    try {
      if (!validate(state)) throw new Error('The current adventure could not be saved.');
      const payload = JSON.stringify(state);
      if (payload.length > MAX_SAVE_LENGTH - 2000) throw new Error('The adventure is too large to save.');
      if (payload === lastPayload) { requireReceipt(); return null; }
      const nextSlot = currentSlot === 0 ? 1 : 0;
      const nextRevision = revision + 1;
      if (nextRevision > 1000000000) throw new Error('The save journal is full.');
      const raw = JSON.stringify({ format: SAVE_PREFIX, revision: nextRevision, checksum: checksum(payload), payload });
      const before = requireReceipt();
      /** @type {SaveReceipt} */ const expected = [...before];
      if (expected[2] !== null && expected[2] !== ACTIVE_MARKER) {
        // Complete deletion or replace an unknown handled marker before
        // reopening the journal.
        // ACTIVE with empty slots is intentionally visible as unreadable if a
        // later payload write fails; no valid new checkpoint is hidden.
        writing = true;
        for (const slot of /** @type {const} */ ([0, 1])) {
          if (expected[slot] === null) continue;
          storage.removeItem(`${SAVE_PREFIX}.${slot}`);
          expected[slot] = null;
          if (!sameReceipt(readReceipt(storage), expected)) throw new Error(UNVERIFIED_SAVE);
        }
        expected[2] = ACTIVE_MARKER;
        storage.setItem(MARKER_KEY, ACTIVE_MARKER);
        if (!sameReceipt(readReceipt(storage), expected)) throw new Error(UNVERIFIED_SAVE);
      }
      expected[nextSlot] = raw;
      writing = true;
      storage.setItem(`${SAVE_PREFIX}.${nextSlot}`, raw);
      if (!sameReceipt(readReceipt(storage), expected)) throw new Error(UNVERIFIED_SAVE);
      if (expected[2] !== ACTIVE_MARKER) {
        expected[2] = ACTIVE_MARKER;
        storage.setItem(MARKER_KEY, ACTIVE_MARKER);
        if (!sameReceipt(readReceipt(storage), expected)) throw new Error(UNVERIFIED_SAVE);
      }
      revision = nextRevision; currentSlot = nextSlot; lastPayload = payload; observed = expected;
      return null;
    } catch (error) {
      if (writing) { observed = null; ownershipWarning = UNVERIFIED_SAVE; return ownershipWarning; }
      return error instanceof Error ? error.message : 'The browser could not save progress.';
    }
  }

  return {
    load, save,
    hasSave: () => lastPayload !== null,
    /** Only the game's explicit Delete Save Data confirmation calls this. */
    remove() {
      if (!storage) return false;
      let writing = false;
      try {
        const before = requireReceipt();
        /** @type {SaveReceipt} */ const expected = [...before];
        // Publish the handled tombstone before removing either checkpoint. A
        // crash can leave v2 bytes behind, but can never re-enable v1 fallback.
        writing = true;
        expected[2] = DELETED_MARKER;
        storage.setItem(MARKER_KEY, DELETED_MARKER);
        if (!sameReceipt(readReceipt(storage), expected)) throw new Error(UNVERIFIED_SAVE);
        for (const slot of [currentSlot === 0 ? 1 : 0, currentSlot]) {
          if (expected[slot] === null) continue;
          storage.removeItem(`${SAVE_PREFIX}.${slot}`);
          expected[slot] = null;
          if (!sameReceipt(readReceipt(storage), expected)) throw new Error(UNVERIFIED_SAVE);
        }
        lastPayload = null; revision = 0; currentSlot = 1; observed = expected;
        return true;
      } catch {
        if (writing) { observed = null; ownershipWarning = UNVERIFIED_SAVE; }
        return false;
      }
    },
    /** Export the current scoped checkpoint; no old campaign keys are accessed. */
    export() { return lastPayload === null ? null : JSON.stringify({ format: SAVE_PREFIX, state: JSON.parse(lastPayload) }, null, 2); },
  };
}
