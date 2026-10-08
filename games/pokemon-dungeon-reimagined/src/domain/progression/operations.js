import { instanceId } from '../ids.js';
import { copyPlainData } from '../state/plain.js';
import { blocked, flagIndex, inRange, invalid, validateNativeProgress } from './support.js';
import { evaluateNativePredicate } from './evaluate.js';

/** @typedef {import('./types.js').NativeProgressState} NativeProgressState */
/** @typedef {import('./types.js').CampaignCatalog} CampaignCatalog */
/** @typedef {import('./types.js').NativeOperation} NativeOperation */
/** @typedef {import('./types.js').ProgressionFailure} ProgressionFailure */
/** @typedef {import('./types.js').RewardReceipt} RewardReceipt */
/** @template T @typedef {import('./types.js').ProgressionResult<T>} ProgressionResult */

/** Sourced assignments available in the factual action vocabulary. Native
 * storage setters do not accept lossy casts, wraps or arbitrary variable names.
 * @param {NativeProgressState} state
 * @param {Extract<NativeOperation,{kind:'set-scalar'}>} operation
 * @returns {ProgressionFailure|null}
 */
function setScalar(state, operation) {
  const value = operation.value;
  switch (operation.variableId) {
    case 'campaign-variable-clear-count':
      if (!inRange(value, 0, 100)) return invalid('/clearCount', 'CLEAR_COUNT must be 0..100.');
      state.clearCount = value; return null;
    case 'campaign-variable-base-level':
      if (!inRange(value, -128, 127)) return invalid('/scalars/baseLevel', 'BASE_LEVEL must fit signed 8-bit storage.');
      state.scalars.baseLevel = value; return null;
    case 'campaign-variable-event-local':
      if (!inRange(value, -32768, 32767)) return invalid('/scalars/eventLocal', 'EVENT_LOCAL must fit signed 16-bit storage.');
      state.scalars.eventLocal = value; return null;
    case 'campaign-variable-partner1-kind': case 'campaign-variable-partner2-kind':
      if (!inRange(value, 0, 255)) return invalid('/scalars', 'Partner role must fit unsigned 8-bit storage.');
      if (operation.variableId === 'campaign-variable-partner1-kind') state.scalars.partner1Kind = value;
      else state.scalars.partner2Kind = value;
      return null;
    default: return blocked('campaign-scalar-write-consumer');
  }
}

/** Pure, bounded candidate construction. Input is copied and every operation
 * must succeed; a rejection returns no partially changed state. This is NOT a
 * CampaignContent policy, hook dispatcher, campaign commit or reward authority.
 * @param {unknown} input @param {CampaignCatalog} catalog @param {readonly NativeOperation[]} operations
 * @returns {ProgressionResult<import('./types.js').ProgressionCandidate>}
 */
export function applyNativeOperations(input, catalog, operations) {
  const checked = validateNativeProgress(input);
  if (checked.status !== 'ready') return checked;
  if (!Array.isArray(operations) || operations.length > 512) return invalid('', 'A native operation batch is limited to 512 operations.');
  /** @type {readonly NativeOperation[]} */ let batch;
  try { batch = /** @type {readonly NativeOperation[]} */ (/** @type {unknown} */ (copyPlainData(operations))); }
  catch { return invalid('', 'Operations must be bounded plain data.'); }
  const state = checked.value;
  /** @type {Set<string>} */ const milestones = new Set();
  /** @type {RewardReceipt[]} */ const receipts = [];
  /** @type {Set<string>} */ const granted = new Set();

  /** @param {string} id @returns {ProgressionFailure|null} */
  function acquireMilestone(id) {
    try { if (catalog.getIdentity(id).kind !== 'milestone') return blocked(`campaign-milestone-crosswalk:${id}`); }
    catch { return blocked(`campaign-milestone-lookup:${id}`); }
    milestones.add(id); return null;
  }

  /** ScenarioCalc's achievements must accompany its pair write, even for a
   * same-pair assignment. Read the dedicated sourced hooks, not invented gates.
   * @param {import('./types.js').NativeScenarioId} scenarioId @returns {ProgressionFailure|null}
   */
  function scenarioAchievements(scenarioId) {
    if (!['MAIN', 'SUB1', 'SUB9'].includes(scenarioId)) return null;
    const hook = `scenario-assigned-${scenarioId.toLowerCase()}`;
    let rules;
    try { rules = catalog.getTransitionsForHook(hook); }
    catch { return blocked(`campaign-scenario-achievements:${hook}`); }
    if (rules.length !== (scenarioId === 'MAIN' ? 3 : scenarioId === 'SUB1' ? 2 : 1)) return blocked(`campaign-scenario-achievements:${hook}`);
    for (const rule of rules) {
      const eligible = evaluateNativePredicate(state, catalog, rule.predicateId);
      if (eligible.status !== 'ready') return eligible;
      if (!eligible.value) continue;
      for (const action of rule.actions) {
        if (action.kind !== 'set-milestone') return blocked(`campaign-scenario-achievement-consumer:${action.kind}`);
        const problem = acquireMilestone(action.milestoneId);
        if (problem) return problem;
      }
    }
    return null;
  }

  /** @param {NativeOperation} operation @returns {ProgressionFailure|null} */
  function apply(operation) {
    switch (operation.kind) {
      case 'set-scenario': {
        const { scenarioId, chapter, step } = operation;
        if (!Object.hasOwn(state.scenarios, scenarioId) || !inRange(chapter, 0, 255) || !inRange(step, 0, 255)) return invalid('/scenarios', 'Scenario identity and unsigned byte pair are required.');
        const previous = state.scenarios[scenarioId];
        if (scenarioId === 'MAIN' && (chapter !== previous.chapter || step !== previous.step)) state.clearCount = 0;
        state.scenarios[scenarioId] = { chapter, step };
        return scenarioAchievements(scenarioId);
      }
      case 'set-scalar': return setScalar(state, operation);
      case 'set-flag': case 'write-cutscene-flag': {
        const bit = flagIndex(catalog, operation.flagId);
        if (bit.status !== 'ready') return bit;
        if (operation.value === false && operation.scope === 'both') {
          state.flags.persistent[bit.value] = false; state.flags.pending[bit.value] = false;
        } else if (operation.value === true && (operation.scope === 'pending' || operation.scope === 'persistent')) {
          state.flags[operation.scope][bit.value] = true;
        } else return blocked('campaign-cutscene-flag-write-semantics');
        return null;
      }
      case 'flush-pending-flags':
        if (operation.boundary !== 'boss-dispatch-after-weather-clear') return blocked('campaign-pending-flag-flush-boundary');
        state.flags.persistent = state.flags.persistent.map((bit, index) => bit || state.flags.pending[index] === true);
        state.flags.pending = state.flags.pending.map(() => false);
        return null;
      case 'clear-pending-flags':
        state.flags.pending = state.flags.pending.map(() => false); return null;
      case 'completed-job-reward': {
        const receipt = operation.receipt;
        if (receipt?.kind !== 'eligible-job-reward-created') return blocked('campaign-job-reward-acknowledgement');
        try { instanceId('job', receipt.jobId); }
        catch { return invalid('/receipt/jobId', 'An acknowledged reward must identify its job.'); }
        if (typeof receipt.grantId !== 'string' || !/^[a-z][a-z0-9-]{0,95}$/.test(receipt.grantId)) return invalid('/receipt/grantId', 'An acknowledged reward must identify its grant.');
        if (granted.has(receipt.grantId)) return invalid('/receipt/grantId', 'A reward grant cannot be counted twice in one candidate.');
        granted.add(receipt.grantId); receipts.push(receipt);
        state.clearCount = Math.min(100, state.clearCount + 1);
        return null;
      }
      case 'record-return-frequency':
        if (!['won', 'mode-10', 'mode-11', 'lost'].includes(operation.outcome)) return blocked('campaign-entry-frequency-return-boundary');
        // Source U16 write after +1: explicit arithmetic, no signed JS bitwise cast.
        state.entryFrequency = (state.entryFrequency + 1) % 65536;
        return null;
      case 'set-milestone': return acquireMilestone(operation.milestoneId);
      case 'require-callback': return blocked(`campaign-callback:${operation.callbackId}`);
      default: return blocked(`campaign-operation-consumer:${operation.kind}`);
    }
  }

  try {
    // Preserve factual catalog lifecycle ownership even for bit-only batches.
    catalog.getModel();
    for (const operation of batch) {
      const problem = apply(operation);
      if (problem) return problem;
    }
  } catch { return blocked('campaign-native-operation-contract'); }
  const validated = validateNativeProgress(state);
  if (validated.status !== 'ready') return validated;
  return { status: 'ready', value: { native: validated.value, acquiredMilestoneIds: [...milestones], rewardReceipts: receipts } };
}
