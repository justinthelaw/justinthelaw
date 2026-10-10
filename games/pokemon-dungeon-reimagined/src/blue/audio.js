import { createAudioBus } from './audio-transport.js';
import { DEFAULT_AUDIO_PREFERENCES, normalizeAudioPreferences } from './audio-preferences.js';
/** @typedef {import('./audio-types.js').AudioScene} AudioScene */
/** @typedef {import('./audio-types.js').AudioEffect} AudioEffect */
/** @typedef {import('./audio-types.js').AudioPreferences} AudioPreferences */
/** @type {Readonly<Record<AudioScene,string|null>>} */
const SCENES = Object.freeze({
  opening: 'music-intro',
  title: 'music-title-screen',
  menu: 'music-file-select',
  quiz: 'music-welcome-to-the-world-of-pokemon',
  awakening: 'music-heartwarming',
  trouble: 'music-theres-trouble',
  dungeon: 'music-tiny-woods',
  clearing: 'music-in-the-depths-of-the-pit',
  reunion: 'music-a-successful-rescue',
  failure: 'music-dungeon-fail',
  complete: 'music-dungeon-complete',
  silent: null,
});
/** @type {Readonly<Record<AudioEffect,string>>} */
const EFFECTS = Object.freeze({
  cursor: 'effect-ui-cursor', confirm: 'effect-ui-confirm', cancel: 'effect-ui-cancel',
  open: 'effect-ui-open', denied: 'effect-ui-denied', step: 'effect-step',
  attack: 'effect-attack', hit: 'effect-hit', miss: 'effect-miss', heal: 'effect-heal',
  status: 'effect-status', pickup: 'effect-pickup', money: 'effect-money',
  stairs: 'effect-stairs', floor: 'effect-floor-enter', rescue: 'effect-rescue-found',
  reward: 'effect-reward', levelUp: 'effect-level-up', faint: 'effect-faint',
  hunger: 'effect-hunger', spark: 'effect-story-spark',
});
/** Scoped original score for the opening. The caller owns the current scene;
 * this manager never imports game state, allocates WebGL, or changes a save.
 * Call activate(event) directly within the iframe's native input handler. It
 * remains silent until that trusted gesture; synthesized host keys cannot unlock.
 * @param {Document} doc
 */
export function createOpeningAudio(doc) {
  const bus = createAudioBus({ document: doc });
  const epoch = 'blue-opening';
  /** @type {AudioScene} */ let scene = 'silent';
  /** @type {AudioPreferences} */ let preferences = DEFAULT_AUDIO_PREFERENCES;
  let revision = 0, eventId = 0, disposed = false;
  bus.beginEpoch(epoch);
  bus.setPreferences(preferences);
  /** @param {readonly {eventId:number,cueId:string}[]} [effects] */
  function present(effects = []) {
    return bus.present({ epoch, revision: ++revision, musicCue: SCENES[scene], effects });
  }
  present();
  /** Repeat presentation of the same scene preserves its music position.
   * Pass silent at the opening's black-screen narration or any silent transition.
   * @param {AudioScene} next
   */
  function setScene(next) {
    if (disposed || !Object.hasOwn(SCENES, next)) return false;
    if (scene === next) return true;
    scene = next;
    return present();
  }
  /** Effects consumed while paused/muted are never replayed on activation.
   * @param {AudioEffect} name
   */
  function effect(name) {
    if (disposed || !Object.hasOwn(EFFECTS, name)) return false;
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
  /** Finite volume updates are detached/clamped; omitted fields are retained.
   * @param {Partial<Pick<AudioPreferences,'master'|'music'|'effects'>>} volumes
   */
  function setVolumes(volumes) {
    if (disposed || !volumes || typeof volumes !== 'object') return false;
    for (const key of /** @type {const} */ (['master', 'music', 'effects'])) {
      if (Object.hasOwn(volumes, key) && (typeof volumes[key] !== 'number' || !Number.isFinite(volumes[key]))) return false;
    }
    preferences = normalizeAudioPreferences({ ...preferences,
      master: volumes.master ?? preferences.master,
      music: volumes.music ?? preferences.music,
      effects: volumes.effects ?? preferences.effects,
    });
    bus.setPreferences(preferences);
    return true;
  }
  return Object.freeze({
    activate: bus.activate, setScene, effect, setMuted, setVolumes, pause: bus.pause,
    status: () => Object.freeze({ ...bus.status(), ...preferences, scene }),
    dispose() { if (disposed) return; disposed = true; bus.dispose(); },
  });
}
