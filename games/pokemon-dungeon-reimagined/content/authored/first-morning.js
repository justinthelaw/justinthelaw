import { freezeData } from '../../src/domain/state/validate.js';
import { baseContinuation } from './team-formation.js';

/** Original writing/composition; native Red event order is comparative evidence.
 * Blue manual establishes bed saving and badge/toolbox/news contents.
 * @typedef {import('../../src/contracts/campaign.js').GrantId} GrantId
 * @typedef {import('../../src/contracts.js').SceneId} SceneId */
export const MORNING = freezeData({
  story: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-first-morning'),
  interior: /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-team-base-interior'),
  sourceMap: 'campaign-map-team-base-inside', nativeMapIndex: 12,
  scenes: /** @type {SceneId[]} */ (['browser-morning-awakening', 'browser-morning-bed-save', 'browser-morning-refreshed', 'browser-morning-partner', 'browser-morning-starter-set', 'browser-morning-pelipper', 'browser-morning-request']),
  grants: /** @type {GrantId[]} */ (['browser-first-morning', 'browser-save-tutorial', 'browser-starter-set', 'browser-starter-news', 'browser-request-delivered', 'browser-magnemite-request-read', 'browser-magnemite-request-accepted']),
  choice: /** @type {import('../../src/contracts/campaign.js').SceneChoiceId} */ ('browser-magnemite-choice'),
  accept: /** @type {import('../../src/contracts/campaign.js').SceneOptionId} */ ('browser-magnemite-accept'),
  later: /** @type {import('../../src/contracts/campaign.js').SceneOptionId} */ ('browser-magnemite-later'),
  width: 9, height: 9, kitId: 'town',
  ground: ['#########', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '####.####'],
  hero: { position: { x: 4, z: 4 }, facing: /** @type {const} */ ('s') },
  props: [{ id: 'hero-bed', kind: 'rescue-bed', x: 4, z: 3, yaw: 0 }, { id: 'interior-window', kind: 'interior-window', x: 6, z: 1, yaw: 0 }],
});
/** @returns {import('./opening.js').AuthoredScene[]} */
export function createMorningScenes() {
  const lines = [
    ['Morning light reaches your bed. You look down: the unfamiliar paws are still yours.', 'The mystery can wait a moment. You feel unsteady, and the bed offers a little more rest.'],
    ['Rest in bed and keep a checkpoint of your adventure before going outside.'],
    ['After resting, you feel clearheaded. You remember the promise you made to your companion: a rescue team, together.', 'Your partner must be waiting outside. It is time to start your first morning.'],
    ['Outside, your partner jolts awake beside the shelter. "I waited here so we could begin together! I must have drifted off."', '"We have our name, but no requests yet. Let us check the mailbox first."'],
    ['Inside the mailbox is a Rescue Team Starter Set. Your partner opens it: a Rescue Team Badge, a Toolbox, and the first issue of Pokémon News.', '"The badge identifies us as rescuers. The toolbox carries dungeon supplies. We can keep Butterfree\'s berries in it; they may help someone today."', '"The news stays in our mailbox for reading. There are no rescue requests here yet. We are only just getting started."'],
    ['Wings beat above the path. Pelipper glides to the mailbox, leaves a letter, and takes flight again.', 'Your partner turns toward the fresh delivery. "Our first letter! Let us see who needs us."'],
    ['Magnemite\'s friend heard about you from Caterpie. An unusual electromagnetic wave in Thunderwave Cave has joined two Magnemite together. Two cannot make a complete Magneton; they need help separating.', 'Your partner looks up from the letter. "This is our first request. Shall we help Magnemite?"', '"But they need our help. This is our first chance to reach someone as a team. Will you reconsider?"'],
  ];
  return MORNING.scenes.map((id, index) => ({ id, continuation: index < 3 ? { kind: 'town', destination: { kind: 'town', mapDefinitionId: MORNING.interior, entryId: 'first-morning' } } : baseContinuation(), lines: lines[index] ?? [],
    stages: (lines[index] ?? []).map((_, cursor) => index === 6 && cursor === 1 ? { awaiting: { kind: 'choice', choiceId: MORNING.choice, optionIds: [MORNING.accept, MORNING.later] }, next: null,
      options: [{ id: MORNING.accept, label: 'Accept rescue request', next: null }, { id: MORNING.later, label: 'Not yet', next: 2 }] } : { awaiting: { kind: 'advance' }, next: index === 6 && cursor === 2 ? 1 : cursor + 1 < (lines[index]?.length ?? 0) ? cursor + 1 : null, options: [] }),
  }));
}
/** @param {import('../../src/contracts/campaign.js').CampaignState} state */
export function placeInside(state) {
  state.town.mapDefinitionId = MORNING.interior;
  state.town.placements = [{ reference: { kind: 'pokemon', pokemonId: state.profile.heroId }, ...MORNING.hero }];
}
/** Content-owned index, used by transitions, validation and presentation.
 * @param {SceneId} id */
export function morningIndex(id) { return MORNING.scenes.indexOf(id); }
/** @param {import('../../src/contracts/campaign.js').CampaignState} state @param {GrantId} grantId */
export function recordMorningGrant(state, grantId) {
  if (state.progress.appliedGrants.some(row => row.grantId === grantId)) throw new Error('Repeated first-morning receipt.');
  state.progress.appliedGrants.push({ grantId, revision: state.revision + 1, day: state.town.day });
}
