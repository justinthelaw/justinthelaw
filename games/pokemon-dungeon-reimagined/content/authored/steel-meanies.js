import { createChapterWorkContent } from './chapter-work.js';
import { FRIENDS, placeFriendsGround } from './friends.js';
import { TEAM } from './team-formation.js';
import { TOWN } from './town.js';
export const MEANIES_POLICY = 'browser-meanies-scripted-pidgey-v1';
export const MEANIES_POSTING = /** @type {import('../../src/contracts/campaign.js').GrantId} */ ('browser-meanies-op3b06-posting');
export const ORDINARY_SUMMIT = /** @type {import('../../src/contracts.js').SceneId} */ ('browser-steel-ordinary-empty-summit');
// Advancing Pelipper's arrival commits op6 before displaying delivered mail.
export const POSTING_CURSOR = 9;
export const MEANIES_ACTORS = Object.freeze([
  { id: 'browser-meanies-gengar', speciesId: 'pokemon-094', x: 6, z: 5 },
  { id: 'browser-meanies-ekans', speciesId: 'pokemon-023', x: 5, z: 6 },
  { id: 'browser-meanies-medicham', speciesId: 'pokemon-308', x: 7, z: 5 },
  { id: 'browser-meanies-pelipper', speciesId: 'pokemon-279', x: 9, z: 5 },
].map(actor => Object.freeze(actor)));
/** Original dialogue and staging over the frozen chapter-five wakeup.
 * @returns {import('./opening.js').AuthoredOpening} */
export function createSteelMeaniesContent() {
  const prior = createChapterWorkContent();
  return { ...prior, revision: 'browser-opening-v21-steel-meanies', scenes: [...prior.scenes.map(scene => scene.id !== FRIENDS.scenes[6] ? scene : { ...scene,
    lines: ['Your partner greets you outside. "Another morning! Let us see who needs help today."',
      'Three strangers approach the base: Gengar, Ekans and Medicham. Gengar looks over your small home with a crooked smile.',
      '"We are Team Meanies," Gengar says. "So this is the rescue team everyone has been talking about."',
      'Ekans and Medicham crowd around the mailbox. Your partner asks them to leave the requests alone.',
      'Gengar laughs. "Rescues can bring in a tidy reward. We intend to make the most of that."',
      '"People are counting on us," your partner replies. "Their trouble is more than a way to earn money."',
      'Team Meanies turns away. Gengar warns that you will see them again, and the three disappear down the path.',
      'Your partner opens the mailbox and recoils. "The requests are gone! They took our mail while we were talking."',
      'A shadow passes overhead. Pelipper glides down to the mailbox with a fresh rescue request.',
      'Pelipper places the new mail in the box, then takes flight. A Pidgey needs help on Mt. Steel, 3F.',
      '"We have a request again," your partner says. "We can keep helping Pokémon. But I will be watching those three next time."'],
  }), { id: ORDINARY_SUMMIT, lines: ['You reach the summit and look across the ledge. The mountain is quiet; nobody is waiting here.', 'With the climb complete, your team prepares to return home.'], continuation: { kind: 'town', destination: { kind: 'town', mapDefinitionId: TOWN.post, entryId: 'ordinary-steel-return' } } }] };
}
/** Canonical saved staging follows the real cursor; selected residents remain.
 * @param {import('../../src/contracts/campaign.js').CampaignState} state @param {number} cursor */
export function placeMeaniesGround(state, cursor) {
  placeFriendsGround(state, TEAM.map);
  const actors = cursor >= 1 && cursor < 6 ? MEANIES_ACTORS.slice(0,3) : cursor >= 8 && cursor <= POSTING_CURSOR ? MEANIES_ACTORS.slice(3) : [];
  for (const actor of actors) state.town.placements.push({ reference: { kind: 'story-actor', storyActorId: /** @type {import('../../src/contracts/campaign.js').StoryActorId} */ (actor.id) }, position: { x: actor.x,z: actor.z }, facing: 's' });
}
