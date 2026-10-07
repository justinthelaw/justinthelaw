import { freezeData } from '../../src/domain/state/validate.js';
import { createOpeningContent } from './opening.js';
import { TEAM } from './team-formation.js';
import { MORNING } from './first-morning.js';
import { WORK } from './early-work.js';

/** Source roles/floors, independently authored staging; comparative provenance
 * and success-return bridge are recorded in MT-STEEL.md. */
export const STEEL = freezeData({
  dungeonId: 'mt-steel',
  story: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-mt-steel'),
  complete: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-diglett-rescued'),
  entryPolicy: /** @type {import('../../src/contracts/campaign.js').PolicyId} */ ('steel-standard-entry-v1'),
  outcomePolicy: /** @type {import('../../src/contracts/campaign.js').PolicyId} */ ('steel-return-v1'),
  entrance: /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-steel-entrance'),
  summit: /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-steel-rescue-summit'),
  bossRole: /** @type {import('../../src/contracts/campaign.js').EncounterId} */ ('browser-steel-skarmory'),
  clientRole: /** @type {import('../../src/contracts/campaign.js').StoryActorId} */ ('browser-steel-diglett'),
  scenes: /** @type {import('../../src/contracts.js').SceneId[]} */ (['browser-steel-first-travel', 'browser-steel-retry-travel', 'browser-steel-first-battle', 'browser-steel-retry-battle', 'browser-steel-loss', 'browser-steel-departure', 'browser-steel-crossing', 'browser-steel-thanks', 'browser-steel-home', 'browser-steel-return-bridge']),
  grants: /** @type {import('../../src/contracts/campaign.js').GrantId[]} */ (['browser-steel-money', 'browser-steel-pecha-scarf', 'browser-steel-ginseng']),
  floors: Array.from({ length: 9 }, (_, i) => `mt-steel-floor-0${i + 1}`),
  bossPosition: { x: 9, z: 13 }, clientPosition: { x: 9, z: 7 }, entryPosition: { x: 9, z: 19 },
});
/** @returns {import('./opening.js').AuthoredOpening} */
export function createSteelOpeningContent() {
  const prior = createOpeningContent();
  const lines = [
    ['The mountain rises above the clouds. Dugtrio emerges beside the trail, too worried to stay still.', '"Diglett is up there," your partner says. "We will find a way to reach him." You begin the climb.'],
    ['Your partner meets you at the mountain path. "We know the way now. Let us bring Diglett home."'],
    ['At the summit, Skarmory guards a narrow ledge. Across a deep gap, Diglett calls for help.', 'Skarmory spreads its wings, blaming Diglett for the shaking mountain. Your partner steps forward. "He did not cause those earthquakes. Please let him go."', 'The steel wings rise again. You stand beside your partner, ready to protect Diglett.'],
    ['Skarmory turns as you reach the summit again. Diglett waits beyond the gap.', 'Your partner holds their ground. "We came back for him."'],
    ['You wake at the rescue base, shaken from the climb. Your partner is waiting nearby.', '"We could not reach Diglett this time. Let us prepare, then try again."'],
    ['Skarmory folds its battered wings. It still fears the earthquakes, but can no longer bar your path.', 'The bird takes flight, leaving Diglett stranded on the far ledge. Your partner calls across the gap to reassure him.'],
    ['Diglett answers from the ledge. The gap is too wide to cross safely.', 'A familiar metallic hum rises from below. The Magnemite you helped have followed your team to the summit.', 'The two Magnemite hover across the gap, carefully lift Diglett, and carry him back to solid ground.', 'Diglett rests beside your partner, safe at last. Together, you descend the mountain.'],
    ['At the rescue base, Dugtrio rushes to Diglett. Father and son are together again.', 'Dugtrio offers 500 Poké, a Pecha Scarf, and Ginseng in thanks. The Magnemite hope to help your team again.'],
    ['Your partner watches the family leave. "We could not have crossed that gap alone. I am glad the Magnemite found us."', 'You return inside the base. Diglett is safe, and this adventure is ready to be saved.'],
    ['The fighting is over. Your partner turns toward the far ledge, where Diglett is waiting.'],
  ];
  const scenes = STEEL.scenes.map((id, i) => ({ id, lines: lines[i] ?? [], continuation: { kind: /** @type {const} */ ('town'), destination: { kind: /** @type {const} */ ('town'), mapDefinitionId: i < 2 ? STEEL.entrance : i === 4 || i === 8 ? MORNING.interior : i < 7 || i === 9 ? STEEL.summit : TEAM.map, entryId: 'steel-story' } } }));
  return { ...prior, revision: 'browser-opening-v10-steel', scenes: [...prior.scenes.map(scene => scene.id === WORK.scenes[1] ? { ...scene, lines: [scene.lines[0] ?? '', 'The path to Mt. Steel is open. Your partner waits for you to finish preparing.'] } : scene), ...scenes] };
}
