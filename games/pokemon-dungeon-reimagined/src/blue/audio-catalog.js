import { OPENING_AUDIO_BANK } from './audio-bank.js';
import { BATTLE_EFFECTS } from './audio-menu-data.js';
/** @typedef {import('./audio-types.js').Cue} Cue */
/** @template T @param {T} value @returns {T} */
function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
/** Only local original note/envelope data; no downloads or decoding. */
export const AUDIO_CATALOG = freeze(OPENING_AUDIO_BANK);
const music = new Map(AUDIO_CATALOG.music.map(cue => [cue.id, cue]));
const effects = new Map(AUDIO_CATALOG.effects.map(cue => [cue.id, cue]));
/** @param {string} id @returns {Cue|null} */
export function musicCue(id) { return music.get(id) ?? null; }
/** @param {string} id @returns {Cue|null} */
export function effectCue(id) { return effects.get(id) ?? null; }
/** Native battle effects have their own bounded SE2 data, not an authored score.
 * @param {string} id */
export function isKnownEffect(id) { return effects.has(id) || Object.hasOwn(BATTLE_EFFECTS, id); }
