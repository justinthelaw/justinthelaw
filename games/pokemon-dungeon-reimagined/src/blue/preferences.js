/** Presentation preferences are separate from adventure checkpoints. */
import {isDisplayMode} from './map-mode.js';
/** @typedef {{version:2,textSpeed:0|14|28,displayMode:import('./map-mode.js').DisplayMode,fastDungeon:boolean,grids:boolean,muted:boolean}} PresentationPreferences */
const KEY = 'pokemon.blue-rescue-opening.preferences.v1';
/** @type {Readonly<PresentationPreferences>} */
const DEFAULTS = Object.freeze({ version: 2, textSpeed: 28, displayMode: 1, fastDungeon: false, grids: true, muted: false });

/** @param {unknown} value @returns {value is PresentationPreferences} */
function valid(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = /** @type {Record<string,unknown>} */ (value);
  return Object.keys(record).sort().join(',') === 'displayMode,fastDungeon,grids,muted,textSpeed,version' &&
    record.version === 2 && [0, 14, 28].includes(/** @type {number} */ (record.textSpeed)) &&
    isDisplayMode(record.displayMode) &&
    typeof record.fastDungeon === 'boolean' && typeof record.grids === 'boolean' && typeof record.muted === 'boolean';
}

/** Preserve explicitly stored v1 settings; its map overlay was transient and
 * cannot be recovered. Team/log/map therefore migrate to A/D/G. Fresh records
 * use the source default B. The same storage key remains readable.
 * @param {unknown} value @returns {PresentationPreferences|null} */
function legacy(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const record=/** @type {Record<string,unknown>} */(value);
  if(Object.keys(record).sort().join(',')!=='fastDungeon,grids,muted,textSpeed,topScreen,version'||record.version!==1||!['team','log','map'].includes(/** @type {string} */(record.topScreen)))return null;
  const candidate={version:2,textSpeed:record.textSpeed,displayMode:record.topScreen==='team'?0:record.topScreen==='log'?3:6,fastDungeon:record.fastDungeon,grids:record.grids,muted:record.muted};
  return valid(candidate)?candidate:null;
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
          const migrated=legacy(value);if(migrated)return migrated;
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
