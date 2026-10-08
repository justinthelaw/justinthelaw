import { createCampaignContent as createBattleCampaignContent } from './battle-campaign.js';
import { createSteelOpeningContent, STEEL } from '../authored/mt-steel.js';
import { STEEL_SLEEP_CHANCES } from './steel-facts.js';
import { steelProgressPolicies, steelSame } from './steel-progress.js';
import { steelExpeditionPolicies } from './steel-expedition.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Current Steel composition; every predecessor factory/body remains immutable.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createSteelOpeningContent()) {
  if (!steelSame(authoredContent, createSteelOpeningContent())) throw new TypeError('Unknown Steel authoring contract.');
  const prior = createBattleCampaignContent(catalogs);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v9-battle-opening:browser-opening-v9-battle:', 'v10-steel-opening:browser-opening-v10-steel:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) {
      if (kind === 'scene' && STEEL.scenes.some(key => key === id) || kind === 'story-node' && [STEEL.story, STEEL.complete].some(key => key === id) || kind === 'map-definition' && [STEEL.entrance, STEEL.summit].some(key => key === id) || kind === 'policy' && [STEEL.entryPolicy, STEEL.outcomePolicy].some(key => key === id) || kind === 'grant' && STEEL.grants.some(key => key === id) || kind === 'encounter' && (id === STEEL.bossRole || Object.keys(STEEL_SLEEP_CHANCES).some(species => id === `${STEEL.dungeonId}-${species}`)) || kind === 'story-actor' && id === STEEL.clientRole) return true;
      return prior.identities.has(kind, id);
    } }),
    policies: Object.freeze({ ...prior.policies, ...steelProgressPolicies(prior.policies, authoredContent), ...steelExpeditionPolicies(prior.policies, catalogs) }),
  });
}
