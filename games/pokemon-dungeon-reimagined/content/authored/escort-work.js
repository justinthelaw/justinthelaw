import { createSteelMeaniesContent, MEANIES_ACTORS } from './steel-meanies.js';
import { FRIENDS, placeFriendsGround } from './friends.js';
import { TEAM } from './team-formation.js';
/** Original text/staging of native inside24 then outside31. Red ground event
 * source2085-2097 qualifies order; no commercial dialogue or map is copied. */
export const SINISTER_UNLOCK = /** @type {import('../../src/contracts/campaign.js').MilestoneId} */ ('browser-sinister-request-unlocked');
export const CATERPIE_ACTOR = Object.freeze({ id: 'browser-caterpie-request-client',speciesId: 'pokemon-010',x: 6,z: 5 });
export const CATERPIE_RIVALS = Object.freeze(MEANIES_ACTORS.slice(0,3).map(actor => Object.freeze({ ...actor,x: actor.x+3,z: actor.z-1 })));
/** @returns {import('./opening.js').AuthoredOpening} */
export function createEscortWorkContent() {
  const prior = createSteelMeaniesContent();
  return { ...prior,revision: 'browser-opening-v24-escort-work',scenes: prior.scenes.map(scene => {
    if (scene.id === FRIENDS.scenes[7]) return { ...scene,lines: ['Morning light spills into the rescue base. You wake after yesterday\'s work.', 'You get up and prepare to meet your partner outside.'] };
    if (scene.id !== FRIENDS.scenes[8]) return scene;
    return { ...scene,lines: [
      'Your partner is waiting outside. "Good morning! Let us see what today brings."',
      'Caterpie hurries toward the base. Your partner recognizes the little Pokémon you rescued in Tiny Woods.',
      '"I need your help again," Caterpie says. "Metapod went into Sinister Woods. I waited, but my friend never came back."',
      'Before your partner can answer, Gengar steps onto the path with Ekans and Medicham.',
      'Team Meanies offers to take the request, then asks what Caterpie can pay. Caterpie has no money to give them.',
      'Gengar proposes a different bargain: Caterpie should join their team and do their work in exchange for the rescue.',
      'Your partner moves beside Caterpie. "You do not have to agree to that. We will go and find Metapod."',
      'Gengar turns the search into a contest. Team Meanies heads for the woods, determined to reach Metapod first.',
      'With the three rivals gone, your partner reassures Caterpie. "Wait here. We will bring your friend home."',
      'You prepare for Sinister Woods. The request is accepted; Metapod is still waiting to be found.',
    ] };
  }) };
}
/** Saved cursor determines actual visitors. Permanent selected members retain
 * their own places; original browser geometry does not claim native map parity.
 * @param {import('../../src/contracts/campaign.js').CampaignState} state @param {number} cursor */
export function placeCaterpieGround(state,cursor) {
  placeFriendsGround(state,TEAM.map);
  const visitors = [...(cursor >= 1 ? [CATERPIE_ACTOR] : []),...(cursor >= 3 && cursor < 8 ? CATERPIE_RIVALS : [])];
  for (const actor of visitors) state.town.placements.push({ reference: { kind: 'story-actor',storyActorId: /** @type {import('../../src/contracts/campaign.js').StoryActorId} */ (actor.id) },position: { x: actor.x,z: actor.z },facing: 's' });
}
