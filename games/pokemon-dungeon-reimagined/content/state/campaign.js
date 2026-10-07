import { createCampaignContent as createSeenCampaignContent } from './seen-campaign.js';
import { createOpeningContent, createSeenOpeningContent } from '../authored/opening.js';
import { WORK } from '../authored/early-work.js';
import { withWorkPolicies } from './early-work.js';
import { fingerprint } from '../../src/domain/state/relations.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Current ordinary work composition; exact v2-v7 factories remain separate.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createOpeningContent()) {
  if (fingerprint(authoredContent) !== fingerprint(createOpeningContent())) throw new TypeError('Unknown ordinary-work authoring contract.');
  const prior = createSeenCampaignContent(catalogs, createSeenOpeningContent());
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v7-seen-opening:browser-opening-v7-seen:', 'v8-work-opening:browser-opening-v8-work:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) {
      if (kind === 'scene' && WORK.scenes.some(key => key === id) || kind === 'story-node' && id === WORK.story) return true;
      return prior.identities.has(kind, id);
    } }),
    policies: Object.freeze({ ...prior.policies, ...withWorkPolicies(authoredContent, prior.policies, catalogs) }),
  });
}
