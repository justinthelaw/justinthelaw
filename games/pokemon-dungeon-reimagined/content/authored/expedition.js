/** Original browser scene/map/guard identities; factual dungeon addresses remain
 * the original catalog IDs. These IDs do not claim cartridge script parity. */
export const OPENING_EXPEDITION = Object.freeze({
  entryPolicy: /** @type {import('../../src/contracts/campaign.js').PolicyId} */ ('tiny-woods-standard-entry-v1'),
  outcomePolicy: /** @type {import('../../src/contracts/campaign.js').PolicyId} */ ('tiny-woods-return-v1'),
  boostGuard: /** @type {import('../../src/contracts/campaign.js').MilestoneId} */ ('browser-initial-boost-consumed'),
  storyNode: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-tiny-woods'),
  returnNode: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-rescue-return'),
  rescueScene: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-caterpie-clearing'),
  returnScene: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-butterfree-reunion'),
});
