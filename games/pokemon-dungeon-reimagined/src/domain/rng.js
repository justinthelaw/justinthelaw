import { copyPlainData } from './state/plain.js';

/** Algorithm-discriminated gameplay streams. Neither state proves the original call schedule.
 * Historical saves retain xoshiro128** 1.1 (Blackman & Vigna, 2018, public domain).
 * New adventures may use the pinned comparative dungeon LCG family.
 * See vendor/random/NOTICE.txt for the source and permission notice.
 * No module seed, clock, browser entropy or mutable singleton is used.
 * @typedef {import('./shared-types.js').RandomWords} RandomWords
 * @typedef {import('./shared-types.js').RandomState} RandomState
 */
const ALGORITHM = 'xoshiro128ss-v1';
const DUNGEON_ALGORITHM = 'pmd-dungeon-lcg-v1';
const UINT32_RANGE = 0x100000000;
const DUNGEON_MULTIPLIER = 0x5d588b65;
const DUNGEON_SEED_MASK = 0xffffff;

const RANDOM_DATA_LIMITS = Object.freeze({
  maxDepth: 3, maxNodes: 12, maxArrayLength: 4, maxObjectKeys: 5,
  maxStringLength: 32, maxTextLength: 128,
});

/** @param {number} value @param {number} distance */
function rotateLeft(value, distance) {
  return ((value << distance) | (value >>> (32 - distance))) >>> 0;
}

/** Explicit unsigned conversion preserves the reference's uint32_t arithmetic.
 * @param {RandomWords} words
 * @returns {{value: number, words: RandomWords}}
 */
function step(words) {
  let [a, b, c, d] = words;
  const value = Math.imul(rotateLeft(Math.imul(b, 5), 7), 9) >>> 0;
  const temporary = b << 9;
  c = (c ^ a) >>> 0;
  d = (d ^ b) >>> 0;
  b = (b ^ c) >>> 0;
  a = (a ^ d) >>> 0;
  c = (c ^ temporary) >>> 0;
  d = rotateLeft(d, 11);
  return { value, words: [a, b, c, d] };
}

/** @param {RandomWords} words @param {number} draws @returns {import('./shared-types.js').XoshiroRandomState} */
function freezeState(words, draws) {
  return Object.freeze({ algorithm: ALGORITHM, words: Object.freeze(words), draws });
}

/** Validate all serialized fields, including algorithm version and zero state.
 * This certifies a PRNG state, not a save, probability table or draw schedule.
 * @param {unknown} input
 * @returns {RandomState}
 */
export function validateRandomState(input) {
  const record = copyPlainData(input, RANDOM_DATA_LIMITS);
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new TypeError('Invalid or unsupported random state.');
  /** @param {unknown} value @returns {value is number} */
  const integer = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
  if (record.algorithm === ALGORITHM && Object.keys(record).length === 3 && integer(record.draws) &&
      Array.isArray(record.words) && record.words.length === 4 &&
      record.words.every(word => integer(word) && word < UINT32_RANGE) && !record.words.every(word => word === 0)) {
    const words = /** @type {[number, number, number, number]} */ (record.words);
    return freezeState(words, record.draws);
  }
  if (record.algorithm === DUNGEON_ALGORITHM && Object.keys(record).length === 5 &&
      integer(record.state) && record.state < UINT32_RANGE && integer(record.preseed) && record.preseed < UINT32_RANGE &&
      integer(record.draws) && integer(record.floors)) {
    return freezeDungeonState(record.state, record.preseed, record.draws, record.floors);
  }
  throw new TypeError('Invalid or unsupported random state.');
}


/** @param {number} value */
function dungeonStep(value) { return (Math.imul(value, DUNGEON_MULTIPLIER) + 1) >>> 0; }
/** @param {number} state @param {number} preseed @param {number} draws @param {number} floors @returns {import('./shared-types.js').DungeonLcgRandomState} */
function freezeDungeonState(state, preseed, draws, floors) { return Object.freeze({algorithm:DUNGEON_ALGORITHM,state,preseed,draws,floors}); }

/** New-adventure browser seed boundary. The caller-supplied value is not a reconstruction of Blue's frame-driven global stream.
 * @param {number} seed @returns {RandomState} */
export function createDungeonRandomState(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed >= UINT32_RANGE) throw new TypeError('Invalid dungeon random seed.');
  return freezeDungeonState(1, (seed | 1) & DUNGEON_SEED_MASK, 0, 0);
}

/** Fresh floors only. Existing xoshiro saves retain their uninterrupted browser sequence.
 * @param {RandomState} input @returns {RandomState} */
export function beginDungeonFloor(input) {
  const state=validateRandomState(input);if(state.algorithm===ALGORITHM)return state;
  if(state.floors>=Number.MAX_SAFE_INTEGER)throw new RangeError('Random floor count is exhausted.');
  const first=dungeonStep(state.preseed),second=dungeonStep(first);
  const floorSeed=(((first>>>16)|(second&0xffff0000))&DUNGEON_SEED_MASK|1)>>>0;
  return freezeDungeonState(floorSeed,second,state.draws,state.floors+1);
}

/** Pure draw. Commit returned state only as part of an accepted transaction.
 * @param {RandomState} input
 */
export function nextRandom(input) {
  const state = validateRandomState(input);
  if (state.draws >= Number.MAX_SAFE_INTEGER) throw new RangeError('Random stream draw count is exhausted.');
  if(state.algorithm===DUNGEON_ALGORITHM){const value=dungeonStep(state.state);return Object.freeze({value,state:freezeDungeonState(value,state.preseed,state.draws+1,state.floors)});}
  const result = step(state.words);
  return Object.freeze({ value: result.value, state: freezeState(result.words, state.draws + 1) });
}
