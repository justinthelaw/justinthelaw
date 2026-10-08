import { BRONZE_JOBS_REVISION } from './bronze-jobs-revision.js';
import { MOVE_LEARNING_REVISION } from './move-learning-revision.js';
import { ESCORT_WORK_REVISION } from './escort-work-revision.js';
import { legacyUnpaidPrefixProblem, recordLegacyUnpaidPrefix } from './bronze-reward-prefix.js';
/** Revision-only adapter; every actual source/conversion/queue/lot/RNG field
 * reaches the frozen proof unchanged. No missing marker becomes inferred debt.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state */
export function escortUnpaidPrefixProblem(state) { return legacyUnpaidPrefixProblem(state.contentRevision === ESCORT_WORK_REVISION ? { ...state,contentRevision: BRONZE_JOBS_REVISION } : state); }
/** Called only after actual original envelope and exact factory admission.
 * Existing v22/v23 applied/debt metadata remains its original owner verbatim.
 * @param {import('../../contracts/campaign.js').CampaignState} draft
 * @param {Extract<import('../../contracts/campaign.js').CampaignValidation,{ok:true}>} admitted
 * @param {string} sourceContentRevision @param {number} conversionRevision */
export function recordEscortUnpaidPrefix(draft,admitted,sourceContentRevision,conversionRevision) {
  if (draft.contentRevision !== ESCORT_WORK_REVISION) throw new TypeError('Unknown exact escort conversion target.');
  if ([BRONZE_JOBS_REVISION,MOVE_LEARNING_REVISION].includes(sourceContentRevision)) return;
  recordLegacyUnpaidPrefix({ ...draft,contentRevision: BRONZE_JOBS_REVISION },admitted,sourceContentRevision,conversionRevision);
}
