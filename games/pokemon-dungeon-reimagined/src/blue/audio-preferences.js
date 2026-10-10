/** Adapted from this project's original src/audio/preferences.js for the scoped Blue opening. */
/** @typedef {import('./audio-types.js').AudioPreferences} AudioPreferences */
export const DEFAULT_AUDIO_PREFERENCES = Object.freeze({ master: .5, music: .35, effects: .5, muted: false });
/** Invalid fields use the quiet existing campaign defaults; numeric input clamps.
 * This returns a detached preference record and never persists or changes a save.
 * @param {unknown} input @returns {AudioPreferences}
 */
export function normalizeAudioPreferences(input) {
  const record = input !== null && typeof input === 'object' ? /** @type {Record<string,unknown>} */ (input) : {};
  /** @param {unknown} value @param {number} fallback */
  const volume = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;
  return Object.freeze({ master: volume(record.master, DEFAULT_AUDIO_PREFERENCES.master), music: volume(record.music, DEFAULT_AUDIO_PREFERENCES.music), effects: volume(record.effects, DEFAULT_AUDIO_PREFERENCES.effects), muted: typeof record.muted === 'boolean' ? record.muted : true });
}
