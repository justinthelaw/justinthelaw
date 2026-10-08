import { createCampaignContent as createStunSeedContent } from './stun-seed-campaign.js';
import { createFriendsContent } from '../authored/friends.js';
import { continuationPolicies } from './continuation-policy.js';
import { TURN_CONTINUATION_REVISION } from '../../src/domain/state/continuation-revision.js';
/** @param {import('./opening-campaign.js').CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createFriendsContent()) {
  const prior = createStunSeedContent(catalogs, authoredContent);
  const contentRevision = prior.contentRevision.replace('v18-stun-seed-opening:', 'v19-turn-continuation-opening:');
  if (contentRevision !== TURN_CONTINUATION_REVISION) throw new TypeError('Unknown continuation factual boundary.');
  return Object.freeze({ ...prior, contentRevision,
    policies: Object.freeze({ ...prior.policies, ...continuationPolicies(prior.policies, catalogs) }),
  });
}
