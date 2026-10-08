import { createCampaignContent as createWorkCampaignContent } from './work-campaign.js';
import { createOpeningContent } from '../authored/opening.js';
import { withBattlePolicies } from './battle-mechanics.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Current battle consumers; v8 ordinary-work admission stays frozen.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createOpeningContent()) {
  const prior = createWorkCampaignContent(catalogs, authoredContent);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v8-work-opening:browser-opening-v8-work:', 'v9-battle-opening:browser-opening-v9-battle:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) {
      return kind === 'policy' && id === 'native-battle-status-v9' || prior.identities.has(kind, id);
    } }),
    policies: Object.freeze({ ...prior.policies, ...withBattlePolicies(prior.policies, catalogs) }),
  });
}
