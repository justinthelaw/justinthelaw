import { BRONZE_JOBS_REVISION } from './bronze-jobs-revision.js';
import { MOVE_LEARNING_REVISION } from './move-learning-revision.js';
import { legacyUnpaidPrefixProblem, recordLegacyUnpaidPrefix } from './bronze-reward-prefix.js';
/** Exact frozen debt proof: all source/conversion/queue metadata is unchanged.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state */
export function learningUnpaidPrefixProblem(state) { return legacyUnpaidPrefixProblem(state.contentRevision === MOVE_LEARNING_REVISION ? { ...state,contentRevision: BRONZE_JOBS_REVISION } : state); }
/** Original admission precedes this prospective adapter. A v22 applied/debt
 * pause already has its real owner and is carried verbatim, never restamped.
 * @param {import('../../contracts/campaign.js').CampaignState} draft
 * @param {Extract<import('../../contracts/campaign.js').CampaignValidation,{ok:true}>} admitted
 * @param {string} sourceContentRevision @param {number} conversionRevision */
export function recordLearningUnpaidPrefix(draft,admitted,sourceContentRevision,conversionRevision) {
  if (draft.contentRevision !== MOVE_LEARNING_REVISION) return recordLegacyUnpaidPrefix(draft,admitted,sourceContentRevision,conversionRevision);
  if (sourceContentRevision === BRONZE_JOBS_REVISION) return;
  recordLegacyUnpaidPrefix({ ...draft,contentRevision: BRONZE_JOBS_REVISION },admitted,sourceContentRevision,conversionRevision);
}
