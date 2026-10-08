import { createCampaignContent as createWildCampaignContent } from './wild-ai-campaign.js';
import { createFriendsContent } from '../authored/friends.js';
import { partyMovePolicies } from './party-moves.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Party move sources extend condition admission outside the exact v13 owner.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createFriendsContent()) {
  const prior = createWildCampaignContent(catalogs, authoredContent);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v13-wild-ai-opening:', 'v14-party-moves-opening:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) { return kind === 'policy' && id === 'native-party-status-v14' || prior.identities.has(kind, id); } }),
    policies: Object.freeze({ ...prior.policies, ...partyMovePolicies(prior.policies, catalogs) }),
  });
}
