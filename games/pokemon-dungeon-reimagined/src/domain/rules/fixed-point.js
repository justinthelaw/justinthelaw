/** Exact bounded arithmetic; evidence and accepted domain: RULES-BROWSER-CONTRACT.md §6. */
export const Q8 = 256;
export const Q16 = 65536;
const MAX_PRODUCT = (1n << 64n) - 1n;

/** @param {number} value @param {number} min @param {number} max @param {string} name @returns {number} */
export function requireInteger(value, min, max, name) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new RangeError(`${name} must be an integer in [${min}, ${max}].`);
  }
  return value;
}

/** @param {bigint} value @returns {number} */
function toSafeNumber(value) {
  if (value < BigInt(Number.MIN_SAFE_INTEGER) || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('Fixed-point result exceeds the exact Number domain.');
  }
  return Number(value);
}

/** @param {number} n @returns {bigint} */
function magnitude(n) {
  requireInteger(n, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 'operand');
  return BigInt(n < 0 ? -n : n);
}

/** Raw Q8 operands/results must fit signed 32-bit; Q16 uses safe integers.
 * Intermediate magnitude product must fit unsigned 64-bit. Ties round away from zero.
 * @param {number} a @param {number} b @param {8|16} fractionBits @returns {number}
 */
export function mulQ(a, b, fractionBits) {
  if (fractionBits !== 8 && fractionBits !== 16) throw new RangeError('Expected Q8 or Q16.');
  if (fractionBits === 8) {
    requireInteger(a, -2147483648, 2147483647, 'Q8 operand');
    requireInteger(b, -2147483648, 2147483647, 'Q8 operand');
  }
  const product = magnitude(a) * magnitude(b);
  if (product > MAX_PRODUCT) throw new RangeError('Fixed-point product exceeds retained 64 bits.');
  const scale = 1n << BigInt(fractionBits);
  const rounded = (product + scale / 2n) / scale;
  const result = toSafeNumber(((a < 0) !== (b < 0)) ? -rounded : rounded);
  return fractionBits === 8 ? requireInteger(result, -2147483648, 2147483647, 'Q8 result') : result;
}

/** Numerator bias is 32768 BEFORE division, not nearest quotient rounding.
 * @param {number} a @param {number} b @returns {number}
 */
export function divQ16(a, b) {
  const divisor = magnitude(b);
  if (divisor === 0n) throw new RangeError('Cannot divide by zero.');
  const dividend = magnitude(a);
  if (dividend === 0n) return 0;
  const numerator = dividend * 65536n + 32768n;
  if (numerator > MAX_PRODUCT) throw new RangeError('Q16 dividend exceeds retained 64 bits.');
  const result = numerator / divisor;
  return toSafeNumber(((a < 0) !== (b < 0)) ? -result : result);
}

/** Signed-16-bit input avoids the original integer-conversion sign-bit defect.
 * @param {number} n @returns {number} */
export function integerToQ16(n) {
  return requireInteger(n, -32768, 32767, 'integer conversion') * Q16;
}

/** @param {number} n @returns {number} */
export function q8ToQ16(n) {
  return requireInteger(n, -2147483648, 2147483647, 'Q8 conversion') * Q8;
}

/** @param {number} n @returns {number} */
export function integerPartQ8(n) {
  return Math.trunc(requireInteger(n, -2147483648, 2147483647, 'Q8 extraction') / Q8);
}

/** Half ties toward positive infinity; signed-32-bit damage result, no 32767 cap.
 * @param {number} n @returns {number} */
export function roundFinalQ16(n) {
  requireInteger(n, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 'Q16 final conversion');
  const shifted = BigInt(n) + 32768n;
  const quotient = shifted / 65536n;
  const floor = shifted < 0n && shifted % 65536n !== 0n ? quotient - 1n : quotient;
  return requireInteger(toSafeNumber(floor), -2147483648, 2147483647, 'signed damage');
}

/** Reject omitted/nonboolean context flags instead of silently defaulting imported state.
 * @param {readonly boolean[]} values @returns {void} */
export function requireBooleans(values) {
  if (values.some(value => typeof value !== 'boolean')) throw new TypeError('Every context flag must be an explicit boolean.');
}
