import { freezeData } from '../../src/domain/state/validate.js';

/** Original browser exterior and prose. Sourced map identity 9 is a location
 * join, not native geometry or acceptance of all species base appearances.
 * @typedef {import('../../src/contracts/campaign.js').SceneAwait} SceneAwait
 * @typedef {{awaiting:SceneAwait,next:number|null,options:{id:import('../../src/contracts/campaign.js').SceneOptionId,label:string,next:number|null}[]}} SceneStage
 */
export const TEAM = freezeData({
  map: /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-team-base-exterior'),
  sourceMap: 'campaign-map-team-base', nativeMapIndex: 9, kitId: 'town',
  story: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-team-formation'),
  foundedStory: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-team-founded'),
  offer: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-team-base-offer'),
  naming: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-team-naming'),
  celebration: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-team-name-celebration'),
  offerChoice: /** @type {import('../../src/contracts/campaign.js').SceneChoiceId} */ ('browser-team-offer-choice'),
  nameChoice: /** @type {import('../../src/contracts/campaign.js').SceneChoiceId} */ ('browser-team-name-choice'),
  accept: /** @type {import('../../src/contracts/campaign.js').SceneOptionId} */ ('browser-team-accept'),
  refuse: /** @type {import('../../src/contracts/campaign.js').SceneOptionId} */ ('browser-team-refuse'),
  confirm: /** @type {import('../../src/contracts/campaign.js').SceneOptionId} */ ('browser-team-name-confirm'),
  edit: /** @type {import('../../src/contracts/campaign.js').SceneOptionId} */ ('browser-team-name-edit'),
  grant: /** @type {import('../../src/contracts/campaign.js').GrantId} */ ('browser-team-founded'),
  width: 13, height: 11,
  // Original courtyard footprint. Town kit explicitly binds cobbled ground,
  // textured timber/plaster shelter and the mailbox; spaces are outside bounds.
  ground: ['  #########  ', ' ##.......## ', ' #.........# ', '#...........#', '#...........#', '#...........#', '#...........#', '#...........#', ' #.........# ', ' ##.......## ', '  #########  '],
  hero: { position: { x: 6, z: 6 }, facing: /** @type {const} */ ('n') },
  partner: { position: { x: 7, z: 6 }, facing: /** @type {const} */ ('nw') },
  props: [ { id: 'base-shelter', kind: 'cottage', x: 6, z: 3, yaw: 0 },
    { id: 'base-mailbox', kind: 'mailbox', x: 8, z: 5, yaw: 0 },
    { id: 'base-garden', kind: 'flower-patch', x: 4, z: 5, yaw: .4 },
    { id: 'base-tree', kind: 'broadleaf-tree', x: 2, z: 3, yaw: .2 },
    { id: 'base-fence', kind: 'fence-section', x: 10, z: 3, yaw: 0 } ],
});
/** @returns {import('../../src/contracts/campaign.js').InitialContinuation} */
export function baseContinuation() { return { kind: 'town', destination: { kind: 'town', mapDefinitionId: TEAM.map, entryId: 'team-base' } }; }
/** @param {number|null} next @returns {SceneStage} */
const advance = next => ({ awaiting: { kind: 'advance' }, next, options: [] });
/** @returns {import('./opening.js').AuthoredScene[]} */
export function createTeamScenes() {
  return [
    { id: TEAM.offer, continuation: baseContinuation(), lines: [
      'Your companion leads you to a small shelter. "You can stay here. After today, a quiet place to rest sounds good."',
      'Beside the path stands a mailbox. "Letters arrive here. Someday, someone might write asking for help."',
      '"Strange disasters keep happening. Pokémon are getting separated and trapped. I want to reach them, the way we reached Caterpie."',
      '"Will you form a rescue team with me?"',
      '"Then we are partners! Before we begin, our team needs a name. What would you like to call us?"',
      'Your companion looks down, then gathers courage. "I still hope we can help others together. Will you think about it once more?"',
    ], stages: [advance(1), advance(2), advance(3), { awaiting: { kind: 'choice', choiceId: TEAM.offerChoice, optionIds: [TEAM.accept, TEAM.refuse] }, next: null,
      options: [{ id: TEAM.accept, label: 'Form a team', next: 4 }, { id: TEAM.refuse, label: 'Not yet', next: 5 }] }, advance(null), advance(3)] },
    { id: TEAM.naming, continuation: baseContinuation(), lines: ['Choose a name for your rescue team.', 'Is this the name you want for your team?'], stages: [
      { awaiting: { kind: 'name-input', field: 'team', value: 'Pokémon' }, next: null, options: [] },
      { awaiting: { kind: 'name-confirm', field: 'team', value: 'Pokémon', choiceId: TEAM.nameChoice, optionIds: [TEAM.confirm, TEAM.edit] }, next: null,
        options: [{ id: TEAM.confirm, label: 'Confirm name', next: null }, { id: TEAM.edit, label: 'Edit name', next: 0 }] },
    ] },
    { id: TEAM.celebration, continuation: baseContinuation(), lines: [
      'Your companion beams. "That is our name! Today we found our first friend, and now we have a team."',
      '"Tomorrow, we will start helping others from this home. For tonight, let us rest."',
      'Evening settles around the little shelter. Two new partners carry the hope of their first rescue into the quiet night.',
    ], stages: [advance(1), advance(2), advance(null)] },
  ];
}
/** @param {import('../../src/contracts/campaign.js').CampaignState} state */
export function placeAtBase(state) {
  state.town.mapDefinitionId = TEAM.map;
  state.town.placements = [{ reference: { kind: 'pokemon', pokemonId: state.profile.heroId }, ...TEAM.hero }, { reference: { kind: 'pokemon', pokemonId: state.profile.partnerId }, ...TEAM.partner }];
}
