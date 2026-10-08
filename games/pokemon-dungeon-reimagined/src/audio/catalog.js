import { ORIGINAL_AUDIO } from './catalog-data.js';
/** @typedef {import('./types.js').Cue} Cue */
/** @template T @param {T} value @returns {T} */
function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
/** Local notes and envelopes, no fetch/decoder/source sample lifetime. */
export const AUDIO_CATALOG = freeze(ORIGINAL_AUDIO);
const music = new Map(AUDIO_CATALOG.music.map(cue => [cue.id, cue]));
const effects = new Map(AUDIO_CATALOG.effects.map(cue => [cue.id, cue]));
const nativeMusic = new Map(AUDIO_CATALOG.nativeMusic.map(row => [row.nativeId, row.cueId]));
const nativeEffects = new Map(AUDIO_CATALOG.nativeEffects.map(row => [row.nativeId, row.cueId]));
/** @param {string} id @returns {Cue|null} */
export function musicCue(id) { return music.get(id) ?? null; }
/** @param {string} id @returns {Cue|null} */
export function effectCue(id) { return effects.get(id) ?? null; }
/** Numeric joins are explicitly Red comparative; Blue parity remains unverified.
 * Native blank/stop/unused IDs remain silent, without a guessed default.
 * @param {number} id @returns {string|null}
 */
export function nativeMusicCue(id) { return nativeMusic.get(id) ?? null; }
/** floorProperties.bgMusic indexes the 76-row table, not MusicID directly.
 * @param {number} index @returns {string|null}
 */
export function dungeonMusicCue(index) {
  if (!Number.isSafeInteger(index) || index < 0) return null;
  const id = AUDIO_CATALOG.dungeonMusicIds[index];
  return id === undefined ? null : nativeMusicCue(id);
}
/** Only four cursor/confirmation/cancel/start-menu source SFX are currently joined.
 * @param {number} id @returns {string|null}
 */
export function nativeEffectCue(id) { return nativeEffects.get(id) ?? null; }
