import { freezeData } from '../../src/domain/state/validate.js';
import { MORNING } from './first-morning.js';
import { baseContinuation } from './team-formation.js';

/** Original browser staging. Native event/reward trace: THUNDERWAVE.md. */
export const THUNDERWAVE = freezeData({
  dungeonId: 'thunderwave-cave',
  entryPolicy: /** @type {import('../../src/contracts/campaign.js').PolicyId} */ ('thunderwave-standard-entry-v1'),
  outcomePolicy: /** @type {import('../../src/contracts/campaign.js').PolicyId} */ ('thunderwave-return-v1'),
  story: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-thunderwave'),
  returned: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-thunderwave-return'),
  complete: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-first-request-complete'),
  rescue: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-magnemite-rescue'),
  reward: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-magnemite-thanks'),
  evening: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-first-request-evening'),
  grant: /** @type {import('../../src/contracts/campaign.js').GrantId} */ ('browser-magnemite-reward'),
  clearing: /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-thunderwave-clearing'),
  entrance: /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-thunderwave-entrance'),
  floors: Array.from({ length: 5 }, (_, i) => `thunderwave-cave-floor-0${i + 1}`),
});
/** @returns {import('./opening.js').AuthoredScene[]} */
export function createThunderwaveScenes() {
  return [
    { id: THUNDERWAVE.rescue, lines: ['Beyond the last passage, two Magnemite hover together, unable to pull apart. Your partner answers their worried crackling.', 'Working together, you guide the joined pair out of the cave and away from the strange electromagnetic wave.'], continuation: { kind: 'town', destination: { kind: 'town', mapDefinitionId: THUNDERWAVE.entrance, entryId: 'rescue-return' } } },
    { id: THUNDERWAVE.reward, lines: ['In the open air, the two Magnemite separate. Their friend circles them, relieved to see each moving freely again.', 'The Magnemite thank your team with 500 Poké, a Reviver Seed, and a Rawst Berry. Your first request is finished.'], continuation: baseContinuation() },
    { id: THUNDERWAVE.evening, lines: ['Back at the base, your partner admits how nervous the first request made them. "We reached them together. That is what matters."', 'Exhausted but happy, your partner heads home. You return to your bed, ready to keep a checkpoint before tomorrow.'], continuation: { kind: 'town', destination: { kind: 'town', mapDefinitionId: MORNING.interior, entryId: 'first-request-complete' } } },
  ];
}
