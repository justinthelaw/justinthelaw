import { createCampaignContent as createFriendsCampaignContent } from './friends-campaign.js';
import { createFriendsContent } from '../authored/friends.js';
import { nativeWildPolicies } from './native-wild-ai.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** Exact v12 authoring and all onboarding owners remain intact. This successor
 * changes the earlier wild AI profile and its real move-selection consumer.
 * @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createFriendsContent()) {
  const prior = createFriendsCampaignContent(catalogs, authoredContent);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v12-friends-opening:', 'v13-wild-ai-opening:'),
    policies: Object.freeze({ ...prior.policies, ...nativeWildPolicies(prior.policies) }),
  });
}
