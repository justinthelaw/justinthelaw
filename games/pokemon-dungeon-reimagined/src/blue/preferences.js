/** Presentation preferences are separate from adventure checkpoints. */
/** @typedef {{version:1,textSpeed:0|14|28,topScreen:'map'|'team'|'log',fastDungeon:boolean,grids:boolean,muted:boolean}} PresentationPreferences */
const KEY = 'pokemon.blue-rescue-opening.preferences.v1';
/** @type {Readonly<PresentationPreferences>} */
const DEFAULTS = Object.freeze({ version: 1, textSpeed: 28, topScreen: 'team', fastDungeon: false, grids: true, muted: false });

/** @param {unknown} value @returns {value is PresentationPreferences} */
function valid(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = /** @type {Record<string,unknown>} */ (value);
  return Object.keys(record).sort().join(',') === 'fastDungeon,grids,muted,textSpeed,topScreen,version' &&
    record.version === 1 && [0, 14, 28].includes(/** @type {number} */ (record.textSpeed)) &&
    ['map', 'team', 'log'].includes(/** @type {string} */ (record.topScreen)) &&
    typeof record.fastDungeon === 'boolean' && typeof record.grids === 'boolean' && typeof record.muted === 'boolean';
}

export function createPreferencesRepository() {
  /** @type {Storage|null} */ let storage = null;
  try { storage = window.localStorage; } catch { /* The options still work for this tab. */ }
  return {
    /** @returns {PresentationPreferences} */
    load() {
      try {
        const raw = storage?.getItem(KEY);
        if (raw && raw.length <= 2048) {
          const value = JSON.parse(raw);
          if (valid(value)) return value;
        }
      } catch { /* Keep an unreadable preference record recoverable. */ }
      return { ...DEFAULTS };
    },
    /** @param {PresentationPreferences} value */
    save(value) {
      if (!valid(value) || !storage) return false;
      try { storage.setItem(KEY, JSON.stringify(value)); return true; } catch { return false; }
    },
  };
}
