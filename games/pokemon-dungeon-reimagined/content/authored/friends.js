import { createSteelOpeningContent } from './mt-steel.js';
import { TOWN, placeInTown } from './town.js';
import { TEAM } from './team-formation.js';
import { MORNING } from './first-morning.js';
export { FRIEND_AREA_FACTS } from './friend-area-facts.js';
import { FRIEND_AREA_FACTS } from './friend-area-facts.js';
import { freezeData } from '../../src/domain/state/validate.js';

export const FRIENDS = freezeData({
  story: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-friend-areas'),
  grant: /** @type {import('../../src/contracts/campaign.js').GrantId} */ ('browser-story-magnemite-enrollment'),
  areaGrant: /** @type {import('../../src/contracts/campaign.js').GrantId} */ ('browser-wigglytuff-free-areas'),
  scenes: /** @type {import('../../src/contracts.js').SceneId[]} */ (['browser-friends-dream', 'browser-friends-morning', 'browser-wigglytuff-welcome', 'browser-square-wind-request', 'browser-friends-rest', 'browser-meanies-morning', 'browser-meanies-mailbox', 'browser-caterpie-morning', 'browser-sinister-request']),
  freeAreas: ['friend-area-wild-plains', 'friend-area-mist-rise-forest', 'friend-area-power-plant'],
  magnemiteMoves: ['move-metal-sound', 'move-tackle', 'move-thunder-shock'],
  nativeOrigin: 70,
  wigglytuff: { x: 7, z: 7 },
  encounterTrigger: { x: 14, z: 6 },
});
/** @returns {import('./opening.js').AuthoredOpening} */
export function createFriendsContent() {
  const prior = createSteelOpeningContent();
  const lines = [
    ['The night carries you into another dream. A voice almost reaches you, then fades behind a curtain of light.', 'You wake in the rescue base. The question of your human past stays with you as morning arrives.'],
    ['Your partner is waiting outside. "The Magnemite wanted to join us yesterday. Perhaps Wigglytuff can tell us what they need."', '"Let us visit the Friend Area counter in Pokémon Square together. We should settle that before another expedition."'],
    ['Wigglytuff welcomes your rescue team. "Partners need a place where they feel at home. That is what Friend Areas provide!"', 'Wigglytuff opens Wild Plains and Mist-Rise Forest for your team at no charge. The two Magnemite arrive to listen.', 'One Magnemite asks to join. Wigglytuff opens Power Plant as another free gift, so it has a home too.', 'Your new teammate can keep the name Magnemite, or you can give it a nickname.', 'Magnemite heads to Power Plant to settle in. Wigglytuff points west: "Visit your friends there, and invite them along whenever you prepare a team."'],
    ['A Jumpluff is asking Shiftry for help. Its friend is trapped where a strong wind might set it free.', 'Shiftry turns away after hearing how little Jumpluff can offer. A nearby Pokémon explains that the request has been waiting for someone willing to help.', 'Alakazam, Charizard and Tyranitar arrive. Their team urges Shiftry to take the rescue seriously, whatever the reward.', 'With everyone watching, Shiftry agrees and leaves for the rescue. Jumpluff hurries after the departing team.', 'Alakazam studies you for a moment. There is something about you that catches his attention, but he leaves with his companions without explaining.'],
    ['Back at the base, your partner talks about the Pokémon you met today. "Let us help more people and become a team they can rely on."', 'You rest. Morning brings another chance to take rescue requests.'],
    ['Morning reaches the rescue base. Your partner is already outside, checking for the next request.'],
    ["Gengar, Ekans and Medicham crowd around your mailbox. Their team treats other Pokémon's trouble as a chance to profit.", 'Your partner objects as they interfere with the mail. Team Meanies leaves with a warning that they intend to get ahead of you.', 'The interruption has not changed your purpose. Your partner suggests returning to rescue work.'],
    ['Another morning begins. Someone is waiting outside the rescue base with an urgent request.'],
    ['Caterpie has come for help. Metapod went into Sinister Woods and has not returned.', 'Team Meanies appears and turns the rescue into a contest. They intend to reach Metapod first and demand a reward.', 'Your partner reassures Caterpie that your team will search for Metapod. Sinister Woods is now the next story destination.'],
  ];
  const maps = [MORNING.interior, TEAM.map, TOWN.square, TOWN.square, MORNING.interior, MORNING.interior, TEAM.map, MORNING.interior, TEAM.map];
  return { ...prior, revision: 'browser-opening-v12-friends', scenes: [...prior.scenes, ...FRIENDS.scenes.map((id, i) => ({ id, lines: lines[i] ?? [], continuation: { kind: /** @type {const} */ ('town'), destination: { kind: /** @type {const} */ ('town'), mapDefinitionId: maps[i] ?? TEAM.map, entryId: 'friend-area-story' } } }))] };
}
/** @param {string} areaId */
export function areaMapId(areaId) { return /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ (`browser-${areaId}`); }
/** Original navigable area composition, not extracted native map geometry.
 * Each habitat has its own deterministic rock/water/grove arrangement, with
 * a clear resident court and approach from the southern entrance.
 * @param {string} areaId */
export function friendAreaMap(areaId) {
  const area = FRIEND_AREA_FACTS.find(row => row.id === areaId); if (!area?.id) throw new RangeError('Unknown Friend Area.');
  const forest = /forest|jungle|plains|field|meadow|safari/.test(areaId), wet = /sea|beach|pond|lake|swamp|river|floe/.test(areaId);
  const width = 19, height = 15;
  /** @type {import('../../src/presentation/types.js').TerrainView[][]} */
  const tiles = Array.from({ length: height }, (_, z) => Array.from({ length: width }, (_, x) => x === 0 || z === 0 || x === width - 1 || z === height - 1 ? 'wall' : wet && z < 4 && (x + area.nativeId) % 5 !== 0 ? 'water' : z < 4 && (x * 3 + z + area.nativeId) % 7 === 0 ? 'wall' : 'floor'));
  return { width, height, tiles, biomeId: forest ? 'forest' : wet ? 'cave' : 'town',
    props: [{ id: `area-feature-${area.nativeId}`, kind: forest ? 'broadleaf-tree' : 'boulder-cluster', x: 3 + area.nativeId % 3, z: 2, yaw: area.nativeId / 7 }, ...(forest ? [{ id: `area-flowers-${area.nativeId}`, kind: 'flower-patch', x: 15, z: 3, yaw: 0 }] : [])] };
}
/** Residents retain stable roster order independently of active team order.
 * @param {import('../../src/contracts/campaign.js').CampaignSnapshot} state @param {string} areaId */
export function areaResidents(state, areaId) { return Object.values(state.roster).filter(pokemon => pokemon.friendAreaId === areaId); }
/** @param {import('../../src/contracts/campaign.js').CampaignState} state @param {import('../../src/contracts/campaign.js').MapDefinitionId} map */
export function placeFriendsGround(state, map) {
  const area = FRIEND_AREA_FACTS.find(row => row.id && areaMapId(row.id) === map);
  if (!area?.id) {
    placeInTown(state, map);
    if (map !== MORNING.interior) for (const [i, id] of state.selectedPartyIds.slice(2).entries()) state.town.placements.push({ reference: { kind: 'pokemon', pokemonId: id }, position: { x: 8 - i, z: 9 }, facing: 'n' });
    return;
  }
  state.town.mapDefinitionId = map;
  state.town.placements = [{ reference: { kind: 'pokemon', pokemonId: state.profile.heroId }, position: { x: 9, z: 12 }, facing: 'n' }];
  for (const [i, pokemon] of areaResidents(state, area.id).filter(row => row.pokemonId !== state.profile.heroId).entries()) state.town.placements.push({ reference: { kind: 'pokemon', pokemonId: pokemon.pokemonId }, position: { x: 3 + i % 5 * 3, z: 5 + Math.floor(i / 5) * 2 }, facing: 's' });
}
