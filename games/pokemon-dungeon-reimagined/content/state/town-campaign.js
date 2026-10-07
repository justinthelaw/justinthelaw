import { createCampaignContent as createOpeningCampaignContent } from './opening-campaign.js';
import { createTownOpeningContent as createOpeningContent, createThunderwaveOpeningContent } from '../authored/opening.js';
import { TOWN } from '../authored/town.js';
import { withTownPolicies } from './town.js';
import { fingerprint } from '../../src/domain/state/relations.js';
import { freezeData } from '../../src/domain/state/validate.js';
import { copyPlainData } from '../../src/domain/state/plain.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Current-only composition. All exact v2-v5 imports use the predecessor owner.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createOpeningContent()) {
  if (fingerprint(authoredContent) !== fingerprint(createOpeningContent())) throw new TypeError('Unknown finite town authoring contract.');
  const authored = /** @type {import('../authored/opening.js').AuthoredOpening} */ (/** @type {unknown} */ (copyPlainData(authoredContent))); freezeData(authored);
  const prior = createOpeningCampaignContent(catalogs, createThunderwaveOpeningContent());
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v5-thunderwave-opening:browser-opening-v5-thunderwave:', 'v6-town-opening:browser-opening-v6-town:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) {
      if (kind === 'scene' && TOWN.scenes.some(key => key === id) || kind === 'map-definition' && [TOWN.square, TOWN.post].some(key => key === id) || kind === 'story-node' && id === TOWN.story) return true;
      return prior.identities.has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id);
    } }),
    policies: Object.freeze({ ...prior.policies, ...withTownPolicies(authored, prior.policies, catalogs) }),
  });
}
