import { validateCampaign, freezeData } from './state/validate.js';
import { prepareTransaction, commandContext } from './state/transaction.js';
import { copyPlainData } from './state/plain.js';
import { advanceTurns } from './turns.js';
import { TurnFault, requireTurnHooks, resultShape } from './turns/support.js';

/** @typedef {import('./turns/types.js').DispatchResult} DispatchResult */
/** @typedef {import('./turns/types.js').Command} Command */
/** @typedef {import('./turns/types.js').EventData} EventData */
/** @typedef {import('../contracts/campaign.js').CampaignState} State */
/** @typedef {import('../contracts/campaign.js').CampaignSnapshot} Snapshot */

/** @type {readonly []} */
const EMPTY_EVENTS = Object.freeze([]);

/** Command failures carry their own public code; generic turn-result handling
 * deliberately has different fallback codes. Preserve synchronous declared
 * failures before that handler, without admitting promised/malformed results.
 * @param {import('./turns/types.js').CommandPlan|import('./turns/types.js').MutationResult} result */
function commandResultShape(result) {
  if (result && typeof result === 'object' && !('then' in result)) {
    if (result.kind === 'rejected' && typeof result.reason === 'string') throw new TurnFault('rejected', result.reason);
    if (result.kind === 'content-blocked' && typeof result.requirement === 'string') throw new TurnFault('content-blocked', result.requirement);
  }
  resultShape(result);
}

/** Full validation is mandatory. A validated snapshot is retained by identity for
 * P08 detached binding; mutable inputs are detached by the validator first.
 * The domain epoch is instance-local, separate from P08's application binding epoch.
 * @param {{initial:Snapshot,content:import('../contracts/campaign.js').CampaignContent,handlers:import('./turns/types.js').CommandHandlers,turns:import('./turns/types.js').TurnHooks}} options
 * @returns {{ok:true,adventure:import('./turns/types.js').Adventure}|{ok:false,kind:'invalid'|'content-blocked',message:string}}
 */
export function createAdventure(options) {
  const checked = validateCampaign(options.initial, options.content);
  if (!checked.ok) return Object.freeze({ ok: false, kind: checked.kind === 'blocked' ? 'content-blocked' : 'invalid', message: 'The campaign could not be opened.' });
  // Only accept the original identity when all of it is frozen. A shallow frozen
  // root must not conceal an externally mutable child.
  /** @param {unknown} value @returns {boolean} */
  function deeplyFrozen(value) {
    return !value || typeof value !== 'object' || (Object.isFrozen(value) && Object.values(value).every(deeplyFrozen));
  }
  let snapshot = deeplyFrozen(options.initial) ? options.initial : checked.snapshot;
  const epoch = Symbol('adventure');
  let busy = false; let nextEventId = 1;
  /** @param {'rejected'|'content-blocked'} kind @param {string} code @returns {DispatchResult} */
  function failure(kind, code) {
    if (kind === 'content-blocked') return Object.freeze({ kind, requirement: /^[a-z0-9-]{1,80}$/.test(code) ? code : 'domain-content', message: 'This command needs content that is not available.', revision: snapshot.revision, events: EMPTY_EVENTS });
    return Object.freeze({ kind, reason: code, message: 'This command is no longer available.', revision: snapshot.revision, events: EMPTY_EVENTS });
  }
  /** @param {Command} incoming @returns {DispatchResult} */
  function dispatch(incoming) {
    if (busy) return failure('rejected', 'busy');
    busy = true;
    /** @type {State|null} */ let draft = null;
    try {
      if (!incoming || incoming.epoch !== epoch) return failure('rejected', 'stale');
      const expected = commandContext(snapshot);
      if (incoming.expectedRevision !== expected.expectedRevision || incoming.transactionId !== expected.transactionId) return failure('rejected', 'stale');
      const intent = /** @type {import('./turns/types.js').Intent} */ (/** @type {unknown} */ (freezeData(copyPlainData(incoming.intent))));
      if (!intent || typeof intent !== 'object' || typeof intent.type !== 'string') return failure('rejected', 'invalid-command');
      // A work checkpoint owns the next simulation step. This central gate also
      // covers independent mutation handlers (face, SET, equipment and future
      // menus), so no player mutation can interleave with automatic advance.
      if (snapshot.session?.scheduler.kind === 'continuing' && intent.type !== 'advance' && intent.type !== 'presentation') return failure('rejected', 'unavailable');
      if (snapshot.pendingResult?.kind === 'move-learn-choice' && intent.type !== 'ackResult' && intent.type !== 'presentation') return failure('rejected','unavailable');
      if (intent.type === 'ackResult') {
        const result = snapshot.pendingResult;
        if (!result || result.resultId !== intent.resultId || result.cursor !== intent.cursor || intent.revision !== snapshot.revision) return failure('rejected', 'stale');
      }
      if (intent.type === 'ackScene' || intent.type === 'submitSceneName') {
        const scene = snapshot.pendingScene;
        if (!scene || scene.sceneId !== intent.sceneId || scene.sceneInstanceId !== intent.sceneInstanceId || scene.cursor !== intent.cursor || intent.revision !== snapshot.revision) return failure('rejected', 'stale');
      }
      const handler = Object.getOwnPropertyDescriptor(options.handlers, intent.type)?.value;
      if (!handler || typeof Object.getOwnPropertyDescriptor(handler, 'plan')?.value !== 'function') return failure('content-blocked', 'command-handler');
      const plan = /** @type {import('./turns/types.js').CommandHandler} */ (handler).plan(snapshot, intent);
      commandResultShape(plan);
      if (plan.kind === 'presentation') return Object.freeze({ kind: 'accepted', changed: false, consumedTurn: false, turnOutcome: null, revision: snapshot.revision, events: Object.freeze([]) });
      if (plan.kind !== 'mutation' && plan.kind !== 'action') return failure('content-blocked', 'command-plan');
      if (plan.kind === 'action') requireTurnHooks(options.turns);
      const apply = /** @type {import('./turns/types.js').CommandHandler} */ (handler).apply;
      if (plan.kind === 'mutation' && typeof Object.getOwnPropertyDescriptor(handler, 'apply')?.value !== 'function') return failure('content-blocked', 'command-mutation');
      const prepared = prepareTransaction(snapshot, incoming); draft = prepared.draft; const allocatedNext = draft.idSequence.next;
      /** @type {EventData[]} */ const emitted = [];
      const context = { state: draft, emit: (/** @type {EventData} */ data) => {
        if ((data.type === 'messageRepeated' || data.type === 'pickupChanges') && (!Number.isSafeInteger(data.count) || data.count < 1)) throw new TurnFault('content-blocked', 'notification-count');
        // The tile collector publishes its bounded representation here. All
        // unknown/unaggregated notifications retain this unchanged hard guard.
        if (emitted.length >= 4096) throw new TurnFault('content-blocked', 'event-budget');
        emitted.push(/** @type {EventData} */ (/** @type {unknown} */ (freezeData(copyPlainData(data)))));
      } };
      let consumedTurn = false;
      /** @type {import('./turns/types.js').TurnOutcome['kind']|null} */ let turnOutcome = null;
      if (plan.kind === 'action') {
        const outcome = advanceTurns(context, options.turns, /** @type {import('./turns/types.js').Action} */ (/** @type {unknown} */ (copyPlainData(plan.action))));
        consumedTurn = outcome.consumedTurn; turnOutcome = outcome.kind;
      } else {
        if (!apply) throw new TurnFault('content-blocked', 'command-mutation');
        const applied = apply(context, intent); commandResultShape(applied);
        if (applied.kind === 'unchanged') return Object.freeze({ kind: 'accepted', changed: false, consumedTurn: false, turnOutcome: null, revision: snapshot.revision, events: Object.freeze([]) });
        if (applied.kind !== 'changed' || typeof applied.resumeDungeon !== 'boolean') throw new TurnFault('content-blocked', 'command-result');
        if (applied.resumeDungeon) { const outcome = advanceTurns(context, options.turns); consumedTurn = outcome.consumedTurn; turnOutcome = outcome.kind; }
      }
      // Contexts must not replace the transaction object itself. No ID/revision
      // counter is sourced from a callback's return value.
      if (context.state !== draft || draft.revision !== snapshot.revision || draft.idSequence.next < allocatedNext) throw new TurnFault('content-blocked', 'transaction-authority');
      draft.revision = prepared.commitRevision;
      const validated = validateCampaign(draft, options.content);
      if (!validated.ok) return failure('content-blocked', validated.kind === 'blocked' ? 'campaign-policy' : 'command-state');
      if (!Number.isSafeInteger(nextEventId + emitted.length)) return failure('rejected', 'exhausted');
      const events = freezeData(emitted.map((data, index) => ({ ...data, eventId: nextEventId + index, revision: prepared.commitRevision, epoch })));
      const result = Object.freeze({ kind: /** @type {const} */ ('accepted'), changed: true, consumedTurn, turnOutcome, revision: prepared.commitRevision, events });
      // All fallible work precedes this pointer swap; no callbacks or await follow.
      snapshot = validated.snapshot; nextEventId += events.length;
      return result;
    } catch (error) {
      return error instanceof TurnFault ? failure(error.kind, error.code) : failure('content-blocked', 'domain-handler');
    } finally {
      // A handler retaining a reference cannot mutate a committed or rejected
      // draft later. Published state is the separately validated frozen copy.
      try { if (draft) sealDraft(draft); } finally { busy = false; }
    }
  }
  return Object.freeze({ ok: true, adventure: Object.freeze({ getSnapshot: () => snapshot, getEpoch: () => epoch, dispatch }) });
}

/** Seal callback-retained references even when a faulty handler added a cycle.
 * Accessors are never invoked during cleanup. @param {State} draft */
function sealDraft(draft) {
  /** @type {object[]} */ const queue = [draft]; const visited = new WeakSet();
  while (queue.length) {
    const value = queue.pop();
    if (!value || visited.has(value)) continue;
    visited.add(value);
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
      if ('value' in descriptor && descriptor.value && typeof descriptor.value === 'object') queue.push(descriptor.value);
    }
    Object.freeze(value);
  }
}
