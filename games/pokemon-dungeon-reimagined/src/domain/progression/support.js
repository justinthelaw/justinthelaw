import { copyPlainData } from '../state/plain.js';
import { inspectShape } from '../state/structure.js';
import { checkNativeProgress } from './validation.js';

/** @typedef {import('./types.js').NativeProgressState} NativeProgressState */
/** @typedef {import('./types.js').ProgressionFailure} ProgressionFailure */
/** @template T @typedef {import('./types.js').ProgressionResult<T>} ProgressionResult */

/** @param {string} requirement @returns {ProgressionFailure} */
export function blocked(requirement) { return { status: 'blocked', requirementIds: [requirement.slice(0, 256)] }; }
/** @param {string} path @param {string} message @returns {ProgressionFailure} */
export function invalid(path, message) { return { status: 'invalid', issues: [{ code: 'range', path, message }] }; }

/** Exact shape, safe plain-data copying, and sourced numeric/index bounds.
 * Does not attest narrative legality or replace the campaign progress policy.
 * @param {unknown} input @returns {ProgressionResult<NativeProgressState>}
 */
export function validateNativeProgress(input) {
  /** @type {import('./types.js').StateIssue[]} */ const issues = [];
  let data;
  try { data = copyPlainData(input); }
  catch { return invalid('', 'Native progression must be bounded plain data.'); }
  if (!inspectShape(data, 'NativeProgressState', issues)) return { status: 'invalid', issues };
  const state = /** @type {NativeProgressState} */ (/** @type {unknown} */ (data));
  checkNativeProgress(state, issues);
  return issues.length ? { status: 'invalid', issues } : { status: 'ready', value: state };
}

/** @param {number} value @param {number} min @param {number} max */
export function inRange(value, min, max) { return Number.isSafeInteger(value) && value >= min && value <= max; }

/** @param {number} left @param {'eq'|'ne'|'lt'|'le'|'gt'|'ge'} comparison @param {number} right @returns {boolean} */
export function compare(left, comparison, right) {
  switch (comparison) {
    case 'eq': return left === right;
    case 'ne': return left !== right;
    case 'lt': return left < right;
    case 'le': return left <= right;
    case 'gt': return left > right;
    case 'ge': return left >= right;
    default: throw new TypeError('Unsupported native comparison.');
  }
}

/** Native enum order, including the noncatalog Frosty Forest flag at bit 31.
 * Slots 35..63 remain preserved even though they have no authored fact identity.
 */
const FLAG_SYMBOLS = Object.freeze([
  'MT_STEEL_REACHED', 'MT_STEEL_COMPLETE', 'SINISTER_WOODS_REACHED', 'SINISTER_WOODS_COMPLETE',
  'MT_THUNDER_PEAK_REACHED', 'MT_THUNDER_PEAK_COMPLETE', 'MT_BLAZE_PEAK_REACHED', 'MT_BLAZE_PEAK_COMPLETE',
  'FROSTY_GROTTO_REACHED', 'FROSTY_GROTTO_COMPLETE', 'MT_FREEZE_PEAK_COMPLETE', 'MAGMA_CAVERN_PIT_REACHED',
  'MAGMA_CAVERN_PIT_COMPLETE', 'MAGMA_CAVERN_MID_REACHED', 'SKY_TOWER_SUMMIT_REACHED', 'SKY_TOWER_SUMMIT_COMPLETE',
  'UPROAR_FOREST_REACHED', 'UPROAR_FOREST_COMPLETE', 'WESTERN_CAVE_REACHED', 'WESTERN_CAVE_COMPLETE',
  'FIERY_FIELD_REACHED', 'FIERY_FIELD_COMPLETE', 'LIGHTNING_FIELD_REACHED', 'LIGHTNING_FIELD_COMPLETE',
  'NORTHWIND_FIELD_REACHED', 'NORTHWIND_FIELD_COMPLETE', 'MT_FARAWAY_COMPLETE', 'NORTHERN_RANGE_REACHED',
  'NORTHERN_RANGE_COMPLETE', 'REGI_ITEM_OBTAINED', 'JIRACHI_COMPLETE', 'FROSTY_FOREST_INTRUDED',
  'MEDICHAM_COMPLETE', 'HOWLING_FOREST_COMPLETE', 'REGI_RECRUITED',
].map(name => `CUTSCENE_FLAG_${name}`));

/** @param {import('./types.js').CampaignCatalog} catalog @param {string} flagId @returns {ProgressionResult<number>} */
export function flagIndex(catalog, flagId) {
  try {
    const row = catalog.getIdentity(flagId);
    if (row.kind !== 'flag' || row.sourceNamespace !== 'native-cutscene-flag' || row.sourceSymbol === null) return blocked(`campaign-flag-crosswalk:${flagId}`);
    const index = FLAG_SYMBOLS.indexOf(row.sourceSymbol);
    return index < 0 ? blocked(`campaign-flag-crosswalk:${flagId}`) : { status: 'ready', value: index };
  } catch { return blocked(`campaign-flag-lookup:${flagId}`); }
}
