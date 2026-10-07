import { freezeData } from '../../src/domain/state/validate.js';
import { MORNING } from './first-morning.js';
import { TEAM } from './team-formation.js';

/** Independently authored town route. Source stage transitions: TOWN-JOBS.md. */
export const TOWN = freezeData({
  story: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-town-work'),
  square: /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-pokemon-square'),
  post: /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-pelipper-post-office'),
  scenes: /** @type {import('../../src/contracts.js').SceneId[]} */ (['browser-town-dream', 'browser-town-mailbox', 'browser-square-tour', 'browser-post-tour']),
  width: 19, height: 13,
  hero: { position: { x: 9, z: 8 }, facing: /** @type {const} */ ('n') },
  partner: { position: { x: 10, z: 8 }, facing: /** @type {const} */ ('nw') },
});
/** @param {import('../../src/contracts/campaign.js').CampaignState} state @param {import('../../src/contracts/campaign.js').MapDefinitionId} map */
export function placeInTown(state, map) {
  state.town.mapDefinitionId = map;
  state.town.placements = map === MORNING.interior ? [{ reference: { kind: 'pokemon', pokemonId: state.profile.heroId }, ...MORNING.hero }]
    : [{ reference: { kind: 'pokemon', pokemonId: state.profile.heroId }, ...(map === TEAM.map ? TEAM.hero : TOWN.hero) }, { reference: { kind: 'pokemon', pokemonId: state.profile.partnerId }, ...(map === TEAM.map ? TEAM.partner : TOWN.partner) }];
}
/** @returns {import('./opening.js').AuthoredScene[]} */
export function createTownScenes() {
  const maps = [TEAM.map, TOWN.square, TOWN.post, TOWN.post];
  const lines = [
    ['In sleep, the shelter fades away. A distant figure seems familiar, but you cannot bring a name to mind.', 'Morning light wakes you. The dream slips from memory. There may be a new request waiting in the mailbox.'],
    ['The mailbox holds no new rescue requests. Your partner arrives and peers inside with you.', '"We have only just formed our team. Let us visit Pokémon Square. The Pelipper Post Office may have requests on its board."'],
    ['Your partner introduces Pokémon Square. The Kecleon brothers sell supplies and buy spare items at their two counters.', 'Persian keeps deposited Poké at Felicity Bank. Kangaskhan protects stored items while your team explores dangerous dungeons.', 'Gulpin can link moves so a Pokémon uses them together. Your partner points onward: "The Post Office is just beyond the square. Let us start there."'],
    ['Pelipper carry letters between the Post Office and rescue teams. Your partner leads you around to the bulletin board.', 'Requests name a dungeon and floor, explain who needs help, and list a reward. Taking a request commits your team to that work.', '"Prepare in the square before heading out. We should help the Pokémon whose requests we take, then return for their thanks."'],
  ];
  return TOWN.scenes.map((id, i) => ({ id, lines: lines[i] ?? [], continuation: { kind: 'town', destination: { kind: 'town', mapDefinitionId: maps[i] ?? TOWN.post, entryId: 'town-tour' } } }));
}
