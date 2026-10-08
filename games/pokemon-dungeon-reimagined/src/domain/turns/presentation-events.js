import { TurnFault } from './support.js';
/** @typedef {import('./types.js').EventData} EventData */

/** A transient presentation contract for exactly one completed tile hook.
 * Canonical mutation and traversal order are untouched. Distinct pickup IDs are
 * intentionally replaced by a counted invalidation summary, not deduplicated
 * or represented as item quantities. Unknown events close the run in order.
 * The current tile owner emits wonder notices then pickup notices: at most two
 * published events, constant memory, exact counts. New patterns need a new bound.
 * @template T @param {import('./types.js').MutationContext} context
 * @param {(scoped:import('./types.js').MutationContext)=>T} tile @returns {T} */
export function collectTilePresentation(context, tile) {
  /** @type {EventData|null} */ let first = null;
  /** @type {'wonder'|'pickup'|null} */ let kind = null;
  let count = 0;
  function flush() {
    if (!first) return;
    if (!Number.isSafeInteger(count) || count < 1) throw new TurnFault('content-blocked', 'tile-notification-count');
    context.emit(count === 1 ? first : kind === 'wonder' ? { type: 'messageRepeated', messageId: 'wonder-tile', count } : { type: 'pickupChanges', count });
    first = null; kind = null; count = 0;
  }
  const scoped = { state: context.state, emit(/** @type {EventData} */ data) {
    const next = data.type === 'message' && data.messageId === 'wonder-tile' ? 'wonder' : data.type === 'itemChanged' ? 'pickup' : null;
    if (next === null) { flush(); context.emit(data); return; }
    if (kind !== next) { flush(); kind = next; first = { ...data }; }
    if (!Number.isSafeInteger(++count)) throw new TurnFault('content-blocked', 'tile-notification-count');
  } };
  const result = tile(scoped);
  if (scoped.state !== context.state) throw new TurnFault('content-blocked', 'tile-state-authority');
  flush(); return result;
}
