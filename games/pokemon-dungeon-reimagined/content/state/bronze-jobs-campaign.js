import { createCampaignContent as createSteelMeaniesContent } from './steel-meanies-campaign.js';
import { createSteelMeaniesContent as createAuthored } from '../authored/steel-meanies.js';
import { BRONZE_JOB_FACTS } from '../authored/bronze-job-facts.js';
import { BRONZE_JOBS_REVISION, BRONZE_JOB_POLICY } from '../../src/domain/state/bronze-jobs-revision.js';
import { bronzePolicies } from './bronze-jobs.js';
/** @param {import('./opening-campaign.js').CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authored]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs,authored = createAuthored()) {
  const prior = createSteelMeaniesContent(catalogs,authored);
  // The exact literal revision retains every earlier factual boundary and adds
  // the independently source-checked Bronze facts. No partial revision is trusted.
  if (!BRONZE_JOBS_REVISION.startsWith(prior.contentRevision.replace('v21-steel-meanies-opening:browser-opening-v21-steel-meanies:','v22-bronze-jobs-opening:browser-opening-v22-bronze-jobs:')+':') || BRONZE_JOB_FACTS.rewardItems.length !== 45) throw new TypeError('Unknown Bronze factual boundary.');
  return Object.freeze({ ...prior,contentRevision: BRONZE_JOBS_REVISION,
    identities: Object.freeze({ ...prior.identities,has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind,/** @type {string} */ id) { return kind === 'policy' && id === BRONZE_JOB_POLICY || prior.identities.has(kind,id); } }),
    policies: Object.freeze({ ...prior.policies,...bronzePolicies(prior.policies) }),
  });
}
