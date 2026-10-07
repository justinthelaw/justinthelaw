import { createTownScenes } from './town.js';
import { createThunderwaveScenes } from './thunderwave.js';
import { createMorningScenes } from './first-morning.js';
import { createTeamScenes, baseContinuation } from './team-formation.js';
import { freezeData } from '../../src/domain/state/validate.js';

/** Independently authored browser staging content. Geometry, dialogue, day zero,
 * roles and story IDs are adaptations; native reset data is separately sourced.
 * This meadow is not a claim to reproduce the cartridge ground-map layout.
 * @typedef {import('../../src/contracts/campaign.js').InitialTownDefinition} InitialTownDefinition
 * @typedef {{id:import('../../src/contracts.js').SceneId,lines:string[],stages?:import('./team-formation.js').SceneStage[],continuation:import('../../src/contracts/campaign.js').InitialContinuation}} AuthoredScene
 * @typedef {{revision:string,profileId:string,storyNodeId:import('../../src/contracts/campaign.js').StoryNodeId,town:InitialTownDefinition,width:number,height:number,entryId:string,scenes:AuthoredScene[],heroRoleId:import('../../src/contracts/campaign.js').SceneRoleId,partnerRoleId:import('../../src/contracts/campaign.js').SceneRoleId}} AuthoredOpening
 */

/** Return a detached, typed authoring definition; the adapter snapshots it.
 * @returns {AuthoredOpening} */
export function createTeamOpeningContent() {
  const map = /** @type {import('../../src/contracts/campaign.js').MapDefinitionId} */ ('browser-opening-meadow');
  const scene = /** @type {import('../../src/contracts.js').SceneId} */ ('browser-opening-awakening');
  return {
    revision: 'browser-opening-v3-team', profileId: 'original-blue-opening-v1',
    storyNodeId: /** @type {import('../../src/contracts/campaign.js').StoryNodeId} */ ('browser-story-awakening'),
    heroRoleId: /** @type {import('../../src/contracts/campaign.js').SceneRoleId} */ ('browser-role-hero'),
    partnerRoleId: /** @type {import('../../src/contracts/campaign.js').SceneRoleId} */ ('browser-role-partner'),
    width: 11, height: 9, entryId: 'awakening',
    town: { mapDefinitionId: map, day: 0, serviceStock: [], placements: [
      { reference: { kind: 'starter', role: 'hero' }, position: { x: 5, z: 4 }, facing: 's' },
      { reference: { kind: 'starter', role: 'partner' }, position: { x: 5, z: 5 }, facing: 'n' },
    ] },
    scenes: [{ id: scene, lines: [
      'A breeze moves through the grass. You open your eyes beneath a sky you do not recognize.',
      'Someone nearby notices you stirring. "Easy there. Take a moment. Can you stand?"',
      'Your paws press into the earth. The stranger waits as you find your balance.',
      'A Butterfree hurries into the meadow. Her Caterpie is trapped beyond Tiny Woods. Your new companion looks to you. Together, you can bring him home.',
    ], continuation: { kind: 'town', destination: { kind: 'town', mapDefinitionId: map, entryId: 'awakening' } } },
    { id: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-caterpie-clearing'), lines: ['In a quiet clearing, a small Caterpie calls out. Your companion answers, and you guide him toward the path home.', 'Caterpie stays close as you lead him safely out of the woods.'], continuation: { kind: 'town', destination: { kind: 'town', mapDefinitionId: map, entryId: 'rescue-return' } } },
    { id: /** @type {import('../../src/contracts.js').SceneId} */ ('browser-butterfree-reunion'), lines: ['Butterfree gathers Caterpie close. Relief gives way to a warm smile. She offers three berries in thanks: Oran, Pecha, and Rawst.', 'Your companion suggests a place to rest, and a new idea: a rescue team. There are others who could use your help.'], continuation: baseContinuation() }, ...createTeamScenes()],
  };
}

/** Append-only successor; the v3 team definition above is frozen in scope.
 * @returns {AuthoredOpening} */
export function createMorningOpeningContent() {
  const prior = createTeamOpeningContent();
  return { ...prior, revision: 'browser-opening-v4-morning', scenes: [...prior.scenes, ...createMorningScenes()] };
}

/** Native new-game reset, before scene-driven scenario assignments. Pinned
 * event_flag.c ThoroughlyResetScriptVars + script_vars_info.c defaults;
 * exclusive_pokemon.c InitializeExclusivePokemon; ground_main.c new-game mode.
 * MAP_PERSONALITY_TEST_CYAN is native index 162, not this authored meadow's ID.
 * @returns {import('../../src/contracts/campaign.js').NativeProgressState} */
export function createInitialNativeProgress() {
  return { scenarios: { MAIN: { chapter: 0, step: 0 }, SUB1: { chapter: 0, step: 0 }, SUB2: { chapter: 0, step: 0 },
    SUB3: { chapter: 0, step: 0 }, SUB4: { chapter: 0, step: 0 }, SUB5: { chapter: 0, step: 0 }, SUB6: { chapter: 0, step: 0 },
    SUB7: { chapter: 0, step: 0 }, SUB8: { chapter: 0, step: 0 }, SUB9: { chapter: 0, step: 0 }, SELECT: { chapter: 0, step: 0 } },
    clearCount: 0, entryFrequency: 0, flags: { persistent: Array(64).fill(false), pending: Array(64).fill(false) },
    eventS07E01: Array(16).fill(false), eventGonbe: [0, 0, 0, 0],
    scalars: { baseLevel: 0, scriptMode: false, warpLock: 0, previousMap: 162, eventLocal: 0,
      dungeonEnter: 0, dungeonEnterIndex: -1, flagKind: 0, flagKindChangeRequest: 0, partner1Kind: 0, partner2Kind: 0 } };
}

/** Shared immutable native reset for comparisons, never a load-time repair. */
export const INITIAL_NATIVE_PROGRESS = freezeData(createInitialNativeProgress());

/** Current append-only expedition continuation. @returns {AuthoredOpening} */
export function createThunderwaveOpeningContent() {
  const prior = createMorningOpeningContent();
  return { ...prior, revision: 'browser-opening-v5-thunderwave', scenes: [...prior.scenes, ...createThunderwaveScenes()] };
}

/** Current town successor, preserving the exact v5 authoring body above. @returns {AuthoredOpening} */
export function createOpeningContent() {
  const prior = createThunderwaveOpeningContent();
  return { ...prior, revision: 'browser-opening-v6-town', scenes: [...prior.scenes, ...createTownScenes()] };
}
