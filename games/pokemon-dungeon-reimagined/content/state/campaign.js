import { createCampaignContent as createPartyCampaignContent } from './party-status-campaign.js';
import { createFriendsContent } from '../authored/friends.js';
import { damageStatusPolicies } from './damage-status.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Damage move sources extend condition admission outside the exact v14 owner.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createFriendsContent()) {
  const prior = createPartyCampaignContent(catalogs, authoredContent);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v14-party-moves-opening:', 'v15-damage-status-opening:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) { return kind === 'policy' && id === 'native-damage-status-v15' || prior.identities.has(kind, id); } }),
    policies: Object.freeze({ ...prior.policies, ...damageStatusPolicies(prior.policies, catalogs) }),
  });
}
