import { createCampaignContent as createChapterWorkContent } from './chapter-work-campaign.js';
import { createCampaignContent as createContinuationContent } from './continuation-campaign.js';
import { createSteelMeaniesContent, ORDINARY_SUMMIT, MEANIES_POLICY, MEANIES_POSTING, MEANIES_ACTORS } from '../authored/steel-meanies.js';
import { steelMeaniesWorkPolicies } from './steel-meanies-work.js';
import { steelMeaniesOwners } from './steel-meanies-owners.js';
import { STEEL_MEANIES_REVISION } from '../../src/domain/state/steel-meanies-revision.js';
import { steelSame } from './steel-progress.js';
/** Frozen v20 authenticates original envelopes. Successor history has an
 * independent actual-state proof before the frozen v19 onboarding prerequisite.
 * @param {import('./opening-campaign.js').CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createSteelMeaniesContent()) {
  if (!steelSame(authoredContent,createSteelMeaniesContent())) throw new TypeError('Unknown Steel/Meanies authoring contract.');
  const prior = createChapterWorkContent(catalogs), onboarding = createContinuationContent(catalogs);
  const contentRevision = prior.contentRevision.replace('v20-chapter-work-opening:browser-opening-v20-chapter-work:', 'v21-steel-meanies-opening:browser-opening-v21-steel-meanies:');
  if (contentRevision !== STEEL_MEANIES_REVISION) throw new TypeError('Unknown Steel/Meanies factual boundary.');
  const work = steelMeaniesWorkPolicies(onboarding.policies,catalogs,authoredContent);
  const policies = { ...prior.policies,...work };
  return Object.freeze({ ...prior,contentRevision,
    identities: Object.freeze({ ...prior.identities,has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) {
      if (kind === 'scene' && id === ORDINARY_SUMMIT || kind === 'policy' && id === MEANIES_POLICY || kind === 'grant' && id === MEANIES_POSTING || kind === 'story-actor' && MEANIES_ACTORS.some(actor => actor.id === id)) return true;
      return prior.identities.has(kind,id);
    } }),
    policies: Object.freeze({ ...policies,...steelMeaniesOwners(policies,authoredContent),
  }) });
}
