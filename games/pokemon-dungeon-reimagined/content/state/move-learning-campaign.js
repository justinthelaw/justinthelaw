import { createCampaignContent as createBronzeContent } from './bronze-jobs-campaign.js';
import { MOVE_LEARNING_REVISION } from '../../src/domain/state/move-learning-revision.js';
import { BRONZE_JOBS_REVISION } from '../../src/domain/state/bronze-jobs-revision.js';
import { learningPolicies } from './move-learning.js';
/** @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authored]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs,authored) {
  const prior = createBronzeContent(catalogs,authored);
  if (prior.contentRevision !== BRONZE_JOBS_REVISION || MOVE_LEARNING_REVISION !== BRONZE_JOBS_REVISION.replace('v22-bronze-jobs-opening:browser-opening-v22-bronze-jobs:','v23-move-learning-opening:browser-opening-v23-move-learning:')+':3571043e95909c127b23f76cc9ac6ed131794f8a9e0fea0de8eaa4f820c81bac') throw new TypeError('Unknown complete original Bronze boundary.');
  return Object.freeze({ ...prior,contentRevision: MOVE_LEARNING_REVISION,policies: Object.freeze({ ...prior.policies,...learningPolicies(prior.policies,/** @type {import('../../src/domain/gameplay/support.js').Catalogs} */ (catalogs)) }) });
}
