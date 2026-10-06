import { allocateId } from '../ids.js';
import { copyCampaignDraft } from './validate.js';

/** A UI activation captures this once; retries retain the same context.
 * @param {import('../../contracts.js').CampaignSnapshot} snapshot
 * @returns {import('../../contracts.js').CommandContext}
 */
export function commandContext(snapshot) {
  const allocated = allocateId(snapshot.idSequence, 'transaction', new Set());
  return Object.freeze({ transactionId: allocated.id, expectedRevision: snapshot.revision });
}

/** Prepare a private draft only. P12 owns execution, no-change discard, validation
 * and commit. Failed preparation never consumes live IDs, revision or randomness.
 * @param {import('../../contracts.js').CampaignSnapshot} snapshot
 * @param {import('../../contracts.js').CommandContext} context
 * @returns {{draft:import('../../contracts.js').CampaignState, commitRevision:number}}
 */
export function prepareTransaction(snapshot, context) {
  if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0 || snapshot.revision >= Number.MAX_SAFE_INTEGER) {
    throw new RangeError('Campaign revision is invalid or exhausted.');
  }
  const expected = commandContext(snapshot);
  if (context.expectedRevision !== expected.expectedRevision || context.transactionId !== expected.transactionId) {
    throw new RangeError('Stale revision or transaction identity.');
  }
  const draft = copyCampaignDraft(snapshot);
  const allocated = allocateId(draft.idSequence, 'transaction', new Set());
  draft.idSequence = allocated.sequence;
  return { draft, commitRevision: snapshot.revision + 1 };
}
