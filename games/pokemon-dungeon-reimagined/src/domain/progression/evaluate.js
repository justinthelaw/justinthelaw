import { blocked, compare, flagIndex, inRange, invalid, validateNativeProgress } from './support.js';

/** @typedef {import('./types.js').NativeProgressState} NativeProgressState */
/** @typedef {import('./types.js').CampaignCatalog} CampaignCatalog */
/** @typedef {import('./types.js').NativePredicate} NativePredicate */
/** @template T @typedef {import('./types.js').ProgressionResult<T>} ProgressionResult */

/** Scalar crosswalk is finite; arrays retain their independent native cells.
 * @param {NativeProgressState} state @param {string} variableId @returns {ProgressionResult<number>}
 */
export function projectNativeScalar(state, variableId) {
  switch (variableId) {
    case 'campaign-variable-clear-count': return { status: 'ready', value: state.clearCount };
    case 'campaign-variable-dungeon-enter-frequency': return { status: 'ready', value: state.entryFrequency };
    case 'campaign-variable-event-s07e01-sum': return { status: 'ready', value: state.eventS07E01.reduce((sum, bit) => sum + Number(bit), 0) };
    case 'campaign-variable-event-gonbe-0': return { status: 'ready', value: state.eventGonbe[0] };
    case 'campaign-variable-base-level': return { status: 'ready', value: state.scalars.baseLevel };
    case 'campaign-variable-script-mode': return { status: 'ready', value: Number(state.scalars.scriptMode) };
    case 'campaign-variable-warp-lock': return { status: 'ready', value: state.scalars.warpLock };
    case 'campaign-variable-previous-map': return { status: 'ready', value: state.scalars.previousMap };
    case 'campaign-variable-event-local': return { status: 'ready', value: state.scalars.eventLocal };
    case 'campaign-variable-dungeon-enter': return { status: 'ready', value: state.scalars.dungeonEnter };
    case 'campaign-variable-dungeon-enter-index': return { status: 'ready', value: state.scalars.dungeonEnterIndex };
    case 'campaign-variable-flag-kind': return { status: 'ready', value: state.scalars.flagKind };
    case 'campaign-variable-flag-kind-change-request': return { status: 'ready', value: state.scalars.flagKindChangeRequest };
    case 'campaign-variable-partner1-kind': return { status: 'ready', value: state.scalars.partner1Kind };
    case 'campaign-variable-partner2-kind': return { status: 'ready', value: state.scalars.partner2Kind };
    default: return blocked(`campaign-scalar-projection:${variableId}`);
  }
}

/** Native before/after have a chapter-58 exception; ge/le are their negations.
 * Equality and direct chapter-only predicates do not inherit that exception.
 * @param {import('../../contracts/campaign.js').NativeScenarioPair} pair
 * @param {'eq'|'lt'|'le'|'gt'|'ge'} comparison @param {number} chapter @param {number} step
 * @returns {boolean}
 */
export function compareNativeScenario(pair, comparison, chapter, step) {
  const delta = pair.chapter === chapter && step >= 0 ? pair.step - step : pair.chapter - chapter;
  const before = pair.chapter !== 58 && delta < 0;
  const after = pair.chapter !== 58 && delta > 0;
  switch (comparison) {
    case 'eq': return pair.chapter === chapter && (step < 0 || pair.step === step);
    case 'lt': return before;
    case 'gt': return after;
    case 'ge': return !before;
    case 'le': return !after;
    default: throw new TypeError('Unsupported scenario comparison.');
  }
}

/** Evaluate a bounded DAG from a validated factual catalog. No text evaluation,
 * callback invocation or short-circuit bypass of missing domain requirements.
 * Cached results are local to this one immutable entry-state evaluation.
 * @param {unknown} input @param {CampaignCatalog} catalog @param {string} predicateId
 * @returns {ProgressionResult<boolean>}
 */
export function evaluateNativePredicate(input, catalog, predicateId) {
  const checked = validateNativeProgress(input);
  if (checked.status !== 'ready') return checked;
  const state = checked.value;
  /** @type {Map<string,ProgressionResult<boolean>>} */ const cache = new Map();
  /** @type {Set<string>} */ const active = new Set();
  let visits = 0;
  /** @param {string} id @param {number} depth @returns {ProgressionResult<boolean>} */
  function visit(id, depth) {
    const cached = cache.get(id);
    if (cached) return cached;
    if (depth > 128 || ++visits > 4096 || active.has(id)) return blocked('campaign-predicate-graph-bound');
    let row;
    try { row = catalog.getPredicate(id); }
    catch { return blocked(`campaign-predicate-lookup:${id}`); }
    active.add(id);
    const result = evaluate(row, depth);
    active.delete(id); cache.set(id, result);
    return result;
  }
  /** @param {NativePredicate} row @param {number} depth @returns {ProgressionResult<boolean>} */
  function evaluate(row, depth) {
    switch (row.kind) {
      case 'always': return { status: 'ready', value: true };
      case 'scenario':
        return { status: 'ready', value: compareNativeScenario(state.scenarios[row.scenarioId], row.comparison, row.chapter, row.step) };
      case 'scenario-chapter':
        return { status: 'ready', value: compare(state.scenarios[row.scenarioId].chapter, row.comparison, row.chapter) };
      case 'scalar': {
        const scalar = projectNativeScalar(state, row.variableId);
        return scalar.status === 'ready' ? { status: 'ready', value: compare(scalar.value, row.comparison, row.value) } : scalar;
      }
      case 'not': {
        const child = visit(row.predicateId, depth + 1);
        return child.status === 'ready' ? { status: 'ready', value: !child.value } : child;
      }
      case 'all': case 'any': {
        if (row.predicateIds.length > 4096) return blocked('campaign-predicate-graph-bound');
        const children = row.predicateIds.map(id => visit(id, depth + 1));
        const bad = children.find(child => child.status === 'invalid');
        if (bad) return bad;
        const requirements = children.flatMap(child => child.status === 'blocked' ? child.requirementIds : []);
        if (requirements.length) return { status: 'blocked', requirementIds: [...new Set(requirements)].slice(0, 100) };
        const values = children.map(child => child.status === 'ready' && child.value);
        return { status: 'ready', value: row.kind === 'all' ? values.every(Boolean) : values.some(Boolean) };
      }
      case 'callback-result': return blocked(`campaign-callback-result:${row.callbackId}`);
      default: return blocked(`campaign-predicate-consumer:${row.kind}`);
    }
  }
  try { return visit(predicateId, 0); }
  catch { return blocked(`campaign-predicate-contract:${predicateId}`); }
}

/** Null means the catalog's absent flag sentinel. Unknown IDs never mean false.
 * Reads ignore pending writes until an explicit flush.
 * @param {NativeProgressState} state @param {CampaignCatalog} catalog @param {string|null} flagId
 * @returns {ProgressionResult<boolean>}
 */
export function readPersistentFlag(state, catalog, flagId) {
  if (flagId === null) return { status: 'ready', value: false };
  const index = flagIndex(catalog, flagId);
  return index.status === 'ready' ? readPersistentFlagIndex(state, index.value) : index;
}

/** @param {NativeProgressState} state @param {number} index @returns {ProgressionResult<boolean>} */
export function readPersistentFlagIndex(state, index) {
  if (index === 255) return { status: 'ready', value: false };
  if (!inRange(index, 0, 63)) return invalid('/flags', 'Cutscene flag index must be 0..63 or the 255 read sentinel.');
  const value = state.flags.persistent[index];
  return typeof value === 'boolean' ? { status: 'ready', value } : invalid('/flags/persistent', 'Persistent cutscene bit is absent.');
}
