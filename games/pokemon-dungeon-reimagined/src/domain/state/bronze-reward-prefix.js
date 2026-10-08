import { BRONZE_JOBS_REVISION, BRONZE_JOB_POLICY } from './bronze-jobs-revision.js';
import { STEEL_MEANIES_REVISION } from './steel-meanies-revision.js';
import { fingerprint } from './relations.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('../../contracts/early-work.js').EarlyWorkState} Work */
const priorPrefix = 'v21-steel-meanies-opening:browser-opening-v21-steel-meanies:';
/** Complete exact prior boundaries, never startsWith/version guessing. These
 * are the original compatibility factories that can own a prepared station.
 * @type {readonly string[]} */
export const LEGACY_PREFIX_CONTENT_REVISIONS = Object.freeze([
  'v8-work-opening:browser-opening-v8-work:',
  'v9-battle-opening:browser-opening-v9-battle:',
  'v10-steel-opening:browser-opening-v10-steel:',
  'v11-moves-opening:browser-opening-v11-moves:',
  'v12-friends-opening:browser-opening-v12-friends:',
  'v13-wild-ai-opening:browser-opening-v12-friends:',
  'v14-party-moves-opening:browser-opening-v12-friends:',
  'v15-damage-status-opening:browser-opening-v12-friends:',
  'v16-field-moves-opening:browser-opening-v12-friends:',
  'v17-item-impact-opening:browser-opening-v12-friends:',
  'v18-stun-seed-opening:browser-opening-v12-friends:',
  'v19-turn-continuation-opening:browser-opening-v12-friends:',
  'v20-chapter-work-opening:browser-opening-v20-chapter-work:',
  priorPrefix,
].map(prefix => STEEL_MEANIES_REVISION.replace(priorPrefix,prefix)));
/** Exact unchanged lot, original queue/job history and RNG while debt is pending.
 * Conversion revision/content/allocator metadata is deliberately outside this
 * signature; no previous payment or gameplay event is invented.
 * @param {Snapshot} state */
export function legacyPrefixQueueFingerprint(state) {
  const work = state.earlyWork, prepared = work?.reward, returned = work?.returned;
  if (!prepared || !returned) throw new TypeError('Missing original station queue.');
  return fingerprint({ prepared: { jobId: prepared.jobId,preparedRevision: prepared.preparedRevision,nextItem: prepared.nextItem },
    returned,jobs: returned.jobIds.map(id => state.progress.jobs[id]),random: state.random });
}
/** Debt remains valid only for the authenticated source revision/queue and its
 * actual metadata conversion. Missing prefix alone is never proof of debt.
 * @param {Snapshot} state @returns {string|null} */
export function legacyUnpaidPrefixProblem(state) {
  const work = state.earlyWork, prepared = work?.reward, debt = prepared?.unpaidPrefix, returned = work?.returned;
  const job = prepared ? state.progress.jobs[prepared.jobId] : null;
  if (!prepared || !debt || prepared.prefixAppliedRevision !== undefined) return 'An unpaid prefix requires its exclusive original-envelope conversion owner.';
  if (state.contentRevision !== BRONZE_JOBS_REVISION || !LEGACY_PREFIX_CONTENT_REVISIONS.includes(debt.sourceContentRevision)) return 'Unpaid debt names an unknown original content boundary.';
  if (debt.conversionRevision !== debt.sourceRevision+1 || debt.conversionRevision > state.revision || prepared.preparedRevision < 1 || prepared.preparedRevision > debt.sourceRevision) return 'Conversion must follow the original canonical/prepared revision.';
  if (state.session || state.pendingScene || state.pendingResult || !returned || returned.outcome !== 'success' || returned.jobIds[returned.cursor] !== prepared.jobId || job?.phase.kind !== 'reward-ready' || job.phase.completedRevision > debt.sourceRevision || job.source.kind !== 'generated' || !('posting' in job.source) || job.source.generationPolicyId === BRONZE_JOB_POLICY || job.reward.friendAreaIds.length !== 0) return 'Only the unchanged old-source successful station queue owns historical unpaid money.';
  return debt.queueFingerprint === legacyPrefixQueueFingerprint(state) ? null : 'The original prepared lot, queue, job history or RNG changed before paying conversion debt.';
}
/** Called only with successful exact original-factory admission, after codec
 * envelope/time/hash agreement and before prospective encoding. Records current
 * conversion debt, never a past gameplay/payment receipt; no resources change.
 * @param {State} draft
 * @param {Extract<import('../../contracts/campaign.js').CampaignValidation,{ok:true}>} admitted
 * @param {string} sourceContentRevision @param {number} conversionRevision */
export function recordLegacyUnpaidPrefix(draft,admitted,sourceContentRevision,conversionRevision) {
  const original = admitted.snapshot, prepared = original.earlyWork?.reward;
  if (draft.contentRevision !== BRONZE_JOBS_REVISION || !prepared) return;
  if (original.contentRevision !== sourceContentRevision || !LEGACY_PREFIX_CONTENT_REVISIONS.includes(sourceContentRevision) || prepared.prefixAppliedRevision !== undefined || prepared.unpaidPrefix !== undefined || conversionRevision !== original.revision+1 || draft.revision !== conversionRevision || !draft.earlyWork?.reward) throw new TypeError('Unknown authenticated unpaid station conversion.');
  draft.earlyWork.reward.unpaidPrefix = { sourceContentRevision,sourceRevision: original.revision,conversionRevision,queueFingerprint: legacyPrefixQueueFingerprint(original) };
  if (legacyUnpaidPrefixProblem(draft)) throw new TypeError('Original station ownership was not preserved during conversion.');
}
