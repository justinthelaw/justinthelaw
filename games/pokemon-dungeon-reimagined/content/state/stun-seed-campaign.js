import { createCampaignContent as createItemImpactContent } from './item-impact-campaign.js';
import { createFriendsContent } from '../authored/friends.js';
import { stunSeedPolicies } from './stun-seed.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Add only Stun Seed Petrified over the exact frozen v17 factory.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createFriendsContent()) {
  const prior = createItemImpactContent(catalogs, authoredContent);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v17-item-impact-opening:', 'v18-stun-seed-opening:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) { return kind === 'policy' && id === 'native-stun-seed-v18' || prior.identities.has(kind, id); } }),
    policies: Object.freeze({ ...prior.policies, ...stunSeedPolicies(prior.policies, catalogs) }),
  });
}
