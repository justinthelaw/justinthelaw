import { createCampaignContent as createDamageCampaignContent } from './damage-status-campaign.js';
import { createFriendsContent } from '../authored/friends.js';
import { fieldMovePolicies } from './field-moves.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Independently admit linked Leech Seed and floor Water Sport after exact v15.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createFriendsContent()) {
  const prior = createDamageCampaignContent(catalogs, authoredContent);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v15-damage-status-opening:', 'v16-field-moves-opening:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) { return kind === 'policy' && id === 'native-field-moves-v16' || prior.identities.has(kind, id); } }),
    policies: Object.freeze({ ...prior.policies, ...fieldMovePolicies(prior.policies, catalogs) }),
  });
}
