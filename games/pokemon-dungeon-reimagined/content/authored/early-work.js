import { freezeData } from '../../src/domain/state/validate.js';
import { TEAM } from './team-formation.js';
/** Original dialogue at the source two-reward morning gate. */
export const WORK = freezeData({
  story: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-diglett-request'),
  scenes: /** @type {import('../../src/contracts.js').SceneId[]} */ (['browser-dugtrio-request', 'browser-diglett-departure']),
});
/** @returns {import('./opening.js').AuthoredScene[]} */
export function createDiglettScenes() {
  const lines = [
    ['The ground trembles outside your rescue base. A Dugtrio rises from the earth, urgently searching for your team.', 'His son Diglett has been carried to Mt. Steel. Skarmory blames Diglett for the recent earthquakes and refuses to let him go.', 'Your partner listens, then turns to you. "We will help. Let us bring Diglett home." Dugtrio describes the mountain before hurrying ahead.'],
    ['Your partner waits beside the path. "We should prepare carefully. Diglett is counting on us."', "Mt. Steel is your next story destination. Its expedition is still in development; this checkpoint preserves Dugtrio's request without opening an unfinished route."],
  ];
  return WORK.scenes.map((id, index) => ({ id, lines: lines[index] ?? [], continuation: { kind: 'town', destination: { kind: 'town', mapDefinitionId: TEAM.map, entryId: 'diglett-request' } } }));
}
