import { createCampaignContent as createTownCampaignContent } from './town-campaign.js';
import { createOpeningContent, createTownOpeningContent } from '../authored/opening.js';
import { createSeenPolicy } from './species-seen.js';
import { fingerprint } from '../../src/domain/state/relations.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Current seen-history composition; all previous factories keep exact behavior.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createOpeningContent()) {
  if (fingerprint(authoredContent) !== fingerprint(createOpeningContent())) throw new TypeError('Unknown seen-history authoring contract.');
  const prior = createTownCampaignContent(catalogs, createTownOpeningContent());
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v6-town-opening:browser-opening-v6-town:', 'v7-seen-opening:browser-opening-v7-seen:'),
    policies: Object.freeze({ ...prior.policies, progress: createSeenPolicy(catalogs, prior.policies.progress) }),
  });
}
