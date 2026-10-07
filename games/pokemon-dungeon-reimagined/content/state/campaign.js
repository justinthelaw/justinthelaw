import { createCampaignContent as createMovesCampaignContent } from './moves-campaign.js';
import { createFriendsContent, FRIENDS, FRIEND_AREA_FACTS, areaMapId } from '../authored/friends.js';
import { friendPolicies } from './friend-progress.js';
import { steelSame } from './steel-progress.js';
/** @typedef {import('./opening-campaign.js').CampaignCatalogs} CampaignCatalogs */
/** @param {CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authoredContent]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs, authoredContent = createFriendsContent()) {
  if (!steelSame(authoredContent, createFriendsContent())) throw new TypeError('Unknown Friend Area authoring contract.');
  const prior = createMovesCampaignContent(catalogs);
  return Object.freeze({ ...prior,
    contentRevision: prior.contentRevision.replace('v11-moves-opening:browser-opening-v11-moves:', 'v12-friends-opening:browser-opening-v12-friends:'),
    identities: Object.freeze({ ...prior.identities, has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind, /** @type {string} */ id) {
      return kind === 'policy' && id === 'browser-friend-native-jobs-v1' || kind === 'scene' && FRIENDS.scenes.some(key => key === id) || kind === 'story-node' && id === FRIENDS.story || kind === 'grant' && [FRIENDS.grant,FRIENDS.areaGrant].some(key => key === id) || kind === 'map-definition' && FRIEND_AREA_FACTS.some(row => row.id && areaMapId(row.id) === id) || prior.identities.has(kind,id);
    } }),
    policies: Object.freeze({ ...prior.policies, ...friendPolicies(prior.policies,catalogs,authoredContent) }),
  });
}
