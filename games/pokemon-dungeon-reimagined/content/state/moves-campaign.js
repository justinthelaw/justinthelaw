import { createCampaignContent as createSteelCampaignContent } from './steel-campaign.js';
import { createSteelOpeningContent } from '../authored/mt-steel.js';
import { withMovePolicies } from './move-mechanics.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Move-condition successor; exact v10 and earlier admission stays immutable.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createSteelOpeningContent()) {
  const prior = createSteelCampaignContent(catalogs, authoredContent);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v10-steel-opening:browser-opening-v10-steel:', 'v11-moves-opening:browser-opening-v11-moves:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) {
      return kind === 'policy' && id === 'native-move-status-v11' || prior.identities.has(kind, id);
    } }),
    policies: Object.freeze({ ...prior.policies, ...withMovePolicies(prior.policies, catalogs) }),
  });
}
