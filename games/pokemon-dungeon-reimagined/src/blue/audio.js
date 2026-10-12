import { createAudioBus } from './audio-transport.js';
import { DEFAULT_AUDIO_PREFERENCES, normalizeAudioPreferences } from './audio-preferences.js';
import { MENU_EFFECTS, MENU_EFFECT_THROTTLE_SECONDS } from './audio-menu-data.js';
/** @typedef {import('./audio-types.js').AudioEffect} AudioEffect */
/** @typedef {import('./audio-types.js').AudioPreferences} AudioPreferences */
/** @type {Readonly<Record<AudioEffect,string>>} */
const EFFECTS = Object.freeze({
  cursor: 'effect-ui-cursor', confirm: 'effect-ui-confirm', cancel: 'effect-ui-cancel',
  open: 'effect-ui-open', denied: 'effect-ui-denied',
  attack: 'effect-attack', regularAttack: 'effect-regular-attack', hit: 'effect-hit', heal: 'effect-heal', heart: 'effect-heart',
  berryResult: 'effect-pickup',
  se356: 'effect-throw-spin', se711: 'effect-item-loss',
  se678: 'effect-rapid-spin', se809: 'effect-synthesis', se621: 'effect-move-preparation', se413: 'effect-whiffer',
  se407: 'effect-sleep-helper', se745: 'effect-vine-whip', se825: 'effect-razor-leaf',
  se807: 'effect-leech-seed-travel',
  se628: 'effect-bubble-impact', se717: 'effect-water-sport', se344: 'effect-tackle',
  se330: 'effect-pickup-team', se331: 'effect-pickup-other', se332: 'effect-pickup-money',
  stairs: 'effect-stairs', rescue: 'effect-rescue-found',
  reward: 'effect-reward', levelUp: 'effect-level-up', faint: 'effect-faint',
  // Explicit native sequence roles: accuracy1 uses attacker leader status;
  // accuracy2 and raw zero use target team status. The data IDs stay stable.
  se342: 'effect-no-damage-team', se343: 'effect-no-damage-other',
});
/** Scoped authored and comparative native PSG/PCM effects. The caller owns the dungeon context;
 * this manager never imports game state, allocates WebGL, or changes a save.
 * Call activate(event) directly within the iframe's native input handler. It
 * remains silent until that trusted gesture; synthesized host keys cannot unlock.
 * @param {Document} doc
 */
export function createOpeningAudio(doc) {
  const bus = createAudioBus({ document: doc });
  const epoch = 'blue-opening';
  let inDungeon = false;
  /** @type {AudioPreferences} */ let preferences = DEFAULT_AUDIO_PREFERENCES;
  let revision = 0, eventId = 0, disposed = false, lastGeneralMenuEffect = -Infinity;
  bus.beginEpoch(epoch);
  bus.setPreferences(preferences);
  /** @param {readonly {eventId:number,cueId:string}[]} [effects] */
  function present(effects = []) {
    return bus.present({ epoch, revision: ++revision, effects });
  }
  present();
  /** Dungeon menus use their source timing; general menus throttle rapid cues.
   * @param {boolean} next
   */
  function setDungeon(next) {
    if (disposed || typeof next !== 'boolean') return false;
    if (inDungeon === next) return true;
    inDungeon = next;
    return present();
  }
  /** Effects consumed while paused/muted are never replayed on activation.
   * @param {AudioEffect} name
   */
  function effect(name) {
    if (disposed || !Object.hasOwn(EFFECTS, name)) return false;
    if (!inDungeon && MENU_EFFECTS[EFFECTS[name]]) {
      const now = (doc.defaultView?.performance.now() ?? Date.now()) / 1000;
      if (now - lastGeneralMenuEffect < MENU_EFFECT_THROTTLE_SECONDS) return true;
      lastGeneralMenuEffect = now;
    }
    return present([{ eventId: ++eventId, cueId: EFFECTS[name] }]);
  }
  /** Setting mute never grants permission to start audio.
   * @param {boolean} muted
   */
  function setMuted(muted) {
    if (disposed || typeof muted !== 'boolean') return false;
    preferences = normalizeAudioPreferences({ ...preferences, muted });
    bus.setPreferences(preferences);
    return true;
  }
  return Object.freeze({
    activate: bus.activate, setDungeon, effect, setMuted, pause: bus.pause,
    status: () => Object.freeze({ ...bus.status(), ...preferences }),
    dispose() { if (disposed) return; disposed = true; bus.dispose(); },
  });
}
