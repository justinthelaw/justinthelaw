/** A small, separate browser save journal for the Tiny Woods opening.
 * Historical campaign keys are never read, migrated, overwritten or removed.
 */
import { isNamingText, validateNamingState } from './naming.js';
/** @typedef {import('./onboarding.js').QuizState} QuizState */
/** @typedef {import('./mechanics.js').DungeonState} DungeonState */
/** @typedef {'welcome'|'quiz'|'gender'|'result'|'partner'|'partner-confirm'|'partner-name'|'partner-name-confirm'|'departure'|'awakening'|'hero-name'|'hero-name-confirm'|'named'|'trouble'|'help-choice'|'enter'|'dungeon'|'clearing'|'reunion'|'complete'|'defeated'} Phase */
/** @typedef {{version:1,phase:Phase,line:number,quiz:QuizState,gender:'male'|'female',natureId:string,heroSpeciesId:string,partnerSpeciesId:string,heroName:string,partnerName:string,nameDraft:string,naming?:import('./naming.js').NamingState,dungeon:DungeonState|null,tutorialSeen:number[],rewarded:boolean}} OpeningSave */
/** @typedef {{state:OpeningSave|null,warning:string|null,hasStored:boolean}} LoadResult */
/** @typedef {{slot:0|1,revision:number,state:OpeningSave}} SaveRecord */

const SAVE_PREFIX = 'pokemon.blue-rescue-opening.v1';
const MAX_SAVE_LENGTH = 500000;
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

/** Complete shallow shell validation; the mechanics owner validates its dungeon.
 * @param {unknown} value
 * @param {(value:unknown)=>boolean} validateDungeon
 * @param {Set<string>} speciesIds
 * @returns {value is OpeningSave}
 */
export function validateOpeningSave(value, validateDungeon, speciesIds) {
  if (!object(value) || value.version !== 1 || typeof value.phase !== 'string' || !PHASES.has(value.phase) ||
      !integer(value.line, 100) || !object(value.quiz) || !object(value.quiz.scores) ||
      !integer(value.quiz.answered, 8) || !Array.isArray(value.quiz.usedCategories) ||
      value.quiz.usedCategories.length > 8 || value.quiz.usedCategories.some(id => typeof id !== 'string') ||
      new Set(value.quiz.usedCategories).size !== value.quiz.usedCategories.length ||
      typeof value.quiz.followUp !== 'boolean' ||
      !(value.quiz.questionId === null || typeof value.quiz.questionId === 'string') ||
      Object.keys(value.quiz.scores).length !== 13 ||
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
  /** @type {OpeningSave|null} */ let lastState = null;

  /** @returns {LoadResult} */
  function load() {
    if (!storage) return { state: null, warning: unavailable, hasStored: false };
    /** @type {SaveRecord[]} */ const valid = [];
    let hasStored = false, damaged = false;
    for (const slot of /** @type {const} */ ([0, 1])) {
      try {
        const raw = storage.getItem(`${SAVE_PREFIX}.${slot}`);
        if (raw === null) continue;
        hasStored = true;
        if (raw.length > MAX_SAVE_LENGTH) throw new Error('Oversized save');
        const envelope = JSON.parse(raw);
        if (!object(envelope) || envelope.format !== SAVE_PREFIX || !integer(envelope.revision, 1000000000) ||
            typeof envelope.payload !== 'string' || envelope.checksum !== checksum(envelope.payload)) throw new Error('Invalid save');
        const state = JSON.parse(envelope.payload);
        if (!validate(state)) throw new Error('Invalid saved adventure');
        valid.push({ slot, revision: /** @type {number} */ (envelope.revision), state });
      } catch { damaged = true; }
    }
    valid.sort((a, b) => b.revision - a.revision);
    const record = valid[0];
    if (record) { revision = record.revision; currentSlot = record.slot; lastState = record.state; }
    return {
      state: record?.state ?? null,
      warning: damaged ? record ? 'An interrupted save was recovered from the previous checkpoint.'
        : 'The opening save could not be read. Its data has been preserved.' : null,
      hasStored,
    };
  }

  /** @param {OpeningSave} state @returns {string|null} */
  function save(state) {
    if (!storage) return unavailable;
    try {
      if (!validate(state)) throw new Error('The current adventure could not be saved.');
      const payload = JSON.stringify(state);
      if (payload.length > MAX_SAVE_LENGTH - 2000) throw new Error('The adventure is too large to save.');
      const nextSlot = currentSlot === 0 ? 1 : 0;
      const nextRevision = revision + 1;
      if (nextRevision > 1000000000) throw new Error('The save journal is full.');
      const raw = JSON.stringify({ format: SAVE_PREFIX, revision: nextRevision, checksum: checksum(payload), payload });
      storage.setItem(`${SAVE_PREFIX}.${nextSlot}`, raw);
      // A failed write cannot invalidate the previous slot. Retain that slot
      // until the new exact serialized record has been read back successfully.
      if (storage.getItem(`${SAVE_PREFIX}.${nextSlot}`) !== raw) throw new Error('Save verification failed.');
      revision = nextRevision; currentSlot = nextSlot; lastState = state;
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'The browser could not save progress.';
    }
  }

  return {
    load, save,
    hasSave: () => lastState !== null,
    /** Only the game's explicit Delete Save Data confirmation calls this. */
    remove() {
      if (!storage) return false;
      try {
        storage.removeItem(`${SAVE_PREFIX}.0`); storage.removeItem(`${SAVE_PREFIX}.1`);
        lastState = null; revision = 0; currentSlot = 1;
        return true;
      } catch { return false; }
    },
    /** Export the current scoped checkpoint; no old campaign keys are accessed. */
    export() { return lastState ? JSON.stringify({ format: SAVE_PREFIX, state: lastState }, null, 2) : null; },
  };
}
