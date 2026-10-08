import { nextRandom } from './rng.js';
/** Prospective source scale-to-cap arithmetic over the browser's saved xoshiro
 * stream. One native DungeonRandInt call maps to one browser transition, using
 * its upper16 bits. This is explicit browser mapping, not native byte parity or
 * a reconstruction/reseed of earlier DungeonRand history.
 * @param {import('../contracts.js').RandomState} input @param {number} upper */
export function escortDungeonRandomInteger(input,upper) {
  if (!Number.isInteger(upper) || upper < 0 || upper > 65536) throw new RangeError('Native scoped dungeon sample requires a 16-bit cap.');
  const result = nextRandom(input);
  return { value: Math.floor((result.value >>> 16)*upper/65536),state: result.state };
}
