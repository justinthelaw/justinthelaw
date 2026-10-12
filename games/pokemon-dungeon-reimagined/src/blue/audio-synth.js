/** Adapted from this project's original src/audio/synth.js for the scoped Blue opening. */
import { AUDIO_CATALOG } from './audio-catalog.js';
/** @typedef {import('./audio-types.js').Cue} Cue */
/** @typedef {import('./audio-types.js').Note} Note */
/** @typedef {{source:OscillatorNode,gain:GainNode}} Voice */
export const MAX_VOICES = 32;
const MAX_BUS_VOICES = 16;
/** One oscillator/envelope per voice; no samples, buffers, noise RNG or worklets.
 * @param {AudioContext} context @param {GainNode} effects @param {()=>number} [otherVoices]
 */
export function createSynth(context, effects, otherVoices = () => 0) {
  /** @type {Set<Voice>} */ const voices = new Set();
  /** @param {Voice} voice */
  function release(voice) {
    voice.source.onended = null;
    try { voice.source.disconnect(); } catch { /* Already disconnected. */ }
    try { voice.gain.disconnect(); } catch { /* Already disconnected. */ }
    voices.delete(voice);
  }
  function stop() {
    for (const voice of voices) {
      try { voice.source.stop(); } catch { /* Stop may already be queued. */ }
      release(voice);
    }
  }
  /** Bounded admission drops the new presentation voice rather than allocating.
   * @param {Note} note @param {Cue} cue @param {number} when
   */
  function schedule(note, cue, when) {
    if (voices.size + otherVoices() >= MAX_VOICES || voices.size >= MAX_BUS_VOICES) return false;
    const patch = AUDIO_CATALOG.patches[note.patch];
    if (!patch) return false;
    const length = note.length * 60 / cue.bpm;
    const source = context.createOscillator();
    /** @type {GainNode|undefined} */ let gain;
    /** @type {Voice|undefined} */ let voice;
    try {
      gain = context.createGain();
      voice = { source, gain }; voices.add(voice);
      source.type = patch.wave;
      const frequency = 440 * 2 ** ((note.pitch - 69) / 12);
      source.frequency.setValueAtTime(frequency, when);
      if (patch.glide) source.frequency.exponentialRampToValueAtTime(frequency * (1 + patch.glide), when + length);
      const level = patch.gain * note.velocity;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(level, when + Math.min(patch.attack, length / 2));
      gain.gain.linearRampToValueAtTime(level * .6, when + length);
      gain.gain.exponentialRampToValueAtTime(.0001, when + length + patch.release);
      source.connect(gain); gain.connect(effects);
      const retained = voice;
      source.onended = () => release(retained);
      source.start(when); source.stop(when + length + patch.release + .01);
      return true;
    } catch (error) {
      if (voice) { try { source.stop(); } catch { /* An unstarted node. */ } release(voice); }
      else { source.disconnect(); gain?.disconnect(); }
      throw error;
    }
  }
  return Object.freeze({ schedule, stop, count: () => voices.size });
}
