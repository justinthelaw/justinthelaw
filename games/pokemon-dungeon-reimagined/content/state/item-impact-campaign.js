import { createCampaignContent as createFieldCampaignContent } from './field-moves-campaign.js';
import { createFriendsContent } from '../authored/friends.js';
import { itemImpactPolicies } from './item-impact.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Add only nonself Sleep Seed provenance over the exact frozen v16 factory.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createFriendsContent()) {
  const prior = createFieldCampaignContent(catalogs, authoredContent);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v16-field-moves-opening:', 'v17-item-impact-opening:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) { return kind === 'policy' && id === 'native-item-impact-v17' || prior.identities.has(kind, id); } }),
    policies: Object.freeze({ ...prior.policies, ...itemImpactPolicies(prior.policies, catalogs) }),
  });
}
