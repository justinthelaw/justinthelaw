import { copyPlainData } from './state.js';

/** Browser engineering choice, NOT the original DS generator or call schedule.
 * xoshiro128** 1.1 transition/jump: Blackman & Vigna, 2018, public domain.
 * See vendor/random/NOTICE.txt and plan/STATE-FOUNDATION.md for provenance.
 * No module seed, clock, browser entropy or mutable singleton is used.
 * @typedef {import('../contracts.js').RandomWords} RandomWords
 * @typedef {import('../contracts.js').RandomState} RandomState
 * @typedef {import('../contracts.js').DomainRandomStreams} DomainRandomStreams
 */
const ALGORITHM = 'xoshiro128ss-v1';
const UINT32_RANGE = 0x100000000;
const JUMP = [0x8764000b, 0xf542d2d3, 0x6fa035c3, 0x77f2db5b];
const RANDOM_DATA_LIMITS = Object.freeze({
  maxDepth: 3, maxNodes: 12, maxArrayLength: 4, maxObjectKeys: 3,
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

/** @param {RandomWords} words @param {number} draws @returns {RandomState} */
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
  if (!record || typeof record !== 'object' || Array.isArray(record) ||
      Object.keys(record).length !== 3 || record.algorithm !== ALGORITHM ||
      typeof record.draws !== 'number' || !Number.isSafeInteger(record.draws) || record.draws < 0 ||
      !Array.isArray(record.words) || record.words.length !== 4 ||
      record.words.some(word => typeof word !== 'number' || !Number.isInteger(word) || word < 0 || word >= UINT32_RANGE) ||
      record.words.every(word => word === 0)) {
    throw new TypeError('Invalid or unsupported random state.');
  }
  const words = /** @type {[number, number, number, number]} */ (record.words);
  return freezeState(words, record.draws);
}

/** Explicit four-word seeding; the application owns entropy and lifetime.
 * Also usable for a separately owned presentation stream. Never store the
 * cosmetic stream in the campaign or pass it to domain rules.
 * @param {RandomWords} seed
 * @returns {RandomState}
 */
export function createRandomState(seed) {
  return validateRandomState({ algorithm: ALGORITHM, words: seed, draws: 0 });
}

/** Pure draw. Commit returned state only as part of an accepted transaction.
 * @param {RandomState} input
 */
export function nextRandom(input) {
  const state = validateRandomState(input);
  if (state.draws >= Number.MAX_SAFE_INTEGER) throw new RangeError('Random stream draw count is exhausted.');
  const result = step(state.words);
  return Object.freeze({ value: result.value, state: freezeState(result.words, state.draws + 1) });
}

/** Uniform integer in [0, upperExclusive), using rejection rather than rounding.
 * An engineering safety bound prevents malformed/adversarial saved streams
 * from monopolizing a command. Failure leaves the supplied state untouched.
 * @param {RandomState} input
 * @param {number} upperExclusive
 */
export function randomInteger(input, upperExclusive) {
  if (!Number.isSafeInteger(upperExclusive) || upperExclusive < 1 || upperExclusive > UINT32_RANGE) {
    throw new RangeError('Random integer bound must be between 1 and 2^32.');
  }
  const acceptedRange = Math.floor(UINT32_RANGE / upperExclusive) * upperExclusive;
  let state = input;
  for (let attempt = 0; attempt < 128; attempt++) {
    const result = nextRandom(state);
    state = result.state;
    if (result.value < acceptedRange) return Object.freeze({ value: result.value % upperExclusive, state });
  }
  throw new RangeError('Random draw safety budget exceeded.');
}

/** The reference jump separates starting states by 2^64 transitions. This
 * performs initialization only; jump work does not count as gameplay draws.
 * @param {RandomWords} seed
 * @returns {RandomWords}
 */
function jump(seed) {
  let words = seed;
  let a = 0;
  let b = 0;
  let c = 0;
  let d = 0;
  for (const polynomial of JUMP) {
    for (let bit = 0; bit < 32; bit++) {
      if ((polynomial & (1 << bit)) !== 0) {
        a = (a ^ words[0]) >>> 0;
        b = (b ^ words[1]) >>> 0;
        c = (c ^ words[2]) >>> 0;
        d = (d ^ words[3]) >>> 0;
      }
      words = step(words).words;
    }
  }
  return [a, b, c, d];
}

/** Saved domain streams only. Job/reward routing and lifetime are not decided
 * here; no gameplay draw sites or floor reseeding are implemented by P07-A.
 * @param {RandomWords} seed
 * @returns {DomainRandomStreams}
 */
export function createDomainStreams(seed) {
  const layout = createRandomState(seed);
  const encountersItems = createRandomState(jump(layout.words));
  const combatRecruitment = createRandomState(jump(encountersItems.words));
  return Object.freeze({ layout, encountersItems, combatRecruitment });
}
