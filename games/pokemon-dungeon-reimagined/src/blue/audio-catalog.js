import { OPENING_AUDIO_BANK } from './audio-bank.js';
import { MENU_EFFECTS, BATTLE_EFFECTS } from './audio-menu-data.js';
import { PCM_EFFECTS } from './audio-pcm-data.js';
/** @typedef {import('./audio-types.js').Cue} Cue */
/** @template T @param {T} value @returns {T} */
function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
/** Only local original effect note/envelope data; no downloads or decoding. */
export const AUDIO_CATALOG = freeze(OPENING_AUDIO_BANK);
const effects = new Map(AUDIO_CATALOG.effects.map(cue => [cue.id, cue]));
/** @param {string} id @returns {Cue|null} */
export function effectCue(id) { return effects.get(id) ?? null; }
/** Native effects have bounded PSG/PCM data independent of the authored bank.
 * @param {string} id */
export function isKnownEffect(id) { return effects.has(id) || Object.hasOwn(MENU_EFFECTS, id) || Object.hasOwn(BATTLE_EFFECTS, id) || Object.hasOwn(PCM_EFFECTS, id); }
