import { copyPlainData } from './state/plain.js';
import { NATIVE_GENERAL_RANDOM_FACTS as FACTS } from '../../content/authored/native-general-rng-facts.js';

/** Comparative Red random.c, distinct from DungeonRandInt and browser xoshiro.
 * The caller owns the seed and commits returned state in the same transaction
 * as its consumer. This module never seeds or converts an existing campaign.
 * @typedef {{readonly algorithm:'red-general-lcg-v1',readonly word:number,readonly transitions:number}} NativeGeneralRandomState
 * @typedef {readonly [number,number,number,number,number,number]} NativeSeedBytes
 */
const ALGORITHM = 'red-general-lcg-v1';
const MULTIPLIER = FACTS.multiplier;
const UINT32_RANGE = 0x100000000;
const LIMITS = Object.freeze({ maxDepth: 2,maxNodes: 8,maxArrayLength: 6,maxObjectKeys: 3,maxStringLength: 32,maxTextLength: 128 });

/** A signed native state is stored as its exact unsigned32 bit pattern.
 * Zero is legal for this LCG. No missing seed or transition count is repaired.
 * @param {unknown} input @returns {NativeGeneralRandomState} */
export function validateNativeGeneralRandomState(input) {
  const record = copyPlainData(input,LIMITS);
  if (!record || typeof record !== 'object' || Array.isArray(record) || Object.keys(record).sort().join(',') !== 'algorithm,transitions,word' || record.algorithm !== ALGORITHM || typeof record.word !== 'number' || !Number.isInteger(record.word) || record.word < 0 || record.word >= UINT32_RANGE || typeof record.transitions !== 'number' || !Number.isSafeInteger(record.transitions) || record.transitions < 0) throw new TypeError('Invalid native general random state.');
  return Object.freeze({ algorithm: ALGORITHM,word: record.word,transitions: record.transitions });
}

/** Exact SeedRng six-byte interface. Bytes must have a real caller-owned origin;
 * wall-clock/input/native seed parity and an old save's seed are not inferred.
 * @param {NativeSeedBytes} bytes @returns {NativeGeneralRandomState} */
export function seedNativeGeneralRandom(bytes) {
  if (!Array.isArray(bytes) || bytes.length !== 6 || bytes.some(byte => !Number.isInteger(byte) || byte < 0 || byte > 255)) throw new TypeError('Native general seed requires six bytes.');
  return validateNativeGeneralRandomState({ algorithm: ALGORITHM,word: FACTS.seedOffset + bytes[0]*bytes[1] + bytes[2]*bytes[3] + bytes[4]*bytes[5],transitions: 0 });
}

/** Rand32Bit calls Rand16Bit twice. Both halfwords are signed: sign extension
 * of the second halfword before OR is observable and must not be masked away.
 * Count LCG transitions, rather than treating this as one browser-stream draw.
 * @param {NativeGeneralRandomState} input */
export function nativeGeneralRandom32(input) {
  const state = validateNativeGeneralRandomState(input);
  if (state.transitions > Number.MAX_SAFE_INTEGER - 2) throw new RangeError('Native general random transition count exhausted.');
  const first = (Math.imul(state.word,MULTIPLIER) + FACTS.increment) >>> 0;
  const second = (Math.imul(first,MULTIPLIER) + FACTS.increment) >>> 0;
  const value = ((first >> 16) << 16) | (second >> 16);
  return Object.freeze({ value,state: validateNativeGeneralRandomState({ algorithm: ALGORITHM,word: second,transitions: state.transitions + 2 }) });
}

/** RandInt retains low16 scaling and32-bit multiplication; no rejection sample,
 * modulo reduction or elision of a zero-bound call. Native s32 bounds only.
 * @param {NativeGeneralRandomState} input @param {number} upperExclusive */
export function nativeGeneralRandomInteger(input,upperExclusive) {
  if (!Number.isInteger(upperExclusive) || upperExclusive < 0 || upperExclusive > 0x7fffffff) throw new RangeError('Native general integer bound must be a nonnegative signed32 integer.');
  const result = nativeGeneralRandom32(input);
  const value = (Math.imul(result.value & 0xffff,upperExclusive) >> 16) & 0xffff;
  return Object.freeze({ value,state: result.state });
}

/** Equal endpoints consume no sample; reversed endpoints use the same positive
 * difference. Reject overflow outside the defined source-call domain.
 * @param {NativeGeneralRandomState} input @param {number} first @param {number} second */
export function nativeGeneralRandomRange(input,first,second) {
  if (![first,second].every(value => Number.isInteger(value) && value >= -0x80000000 && value <= 0x7fffffff) || Math.abs(first-second) > 0x7fffffff) throw new RangeError('Native general range requires signed32 endpoints and difference.');
  if (first === second) return Object.freeze({ value: first,state: validateNativeGeneralRandomState(input) });
  const result = nativeGeneralRandomInteger(input,Math.abs(first-second));
  return Object.freeze({ value: result.value + Math.min(first,second),state: result.state });
}

/** Exact SetRNGSeed: after the two transitions, overwrite the LCG state with
 * the actual signed Rand32Bit result's bits, not its intermediate second word.
 * The explicit transition count remains owned by the caller's prior history.
 * @param {NativeGeneralRandomState} input @param {number} word */
export function reseedNativeGeneralRandom(input,word) {
  const previous = validateNativeGeneralRandomState(input);
  if (!Number.isInteger(word) || word < 0 || word >= UINT32_RANGE) throw new RangeError('Native general seed must be an unsigned32 bit pattern.');
  const result = nativeGeneralRandom32({ ...previous,word });
  return validateNativeGeneralRandomState({ ...result.state,word: result.value >>> 0 });
}
