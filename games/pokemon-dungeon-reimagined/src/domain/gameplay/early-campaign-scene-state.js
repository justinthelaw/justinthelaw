import { SINISTER_WORK_REVISION } from '../state/sinister-work-revision.js';
import { CAMPAIGN_SCENE_STAGING } from '../../../content/authored/campaign-scene-package.js';
import { beginEarlyCampaignSceneCursor,readEarlyCampaignSceneCursor,advanceEarlyCampaignSceneCursor,earlyCampaignSceneDefinition,earlyCampaignSceneReturn } from './early-campaign-scene-cursor.js';
import { copyPlainData } from '../state/plain.js';
import { freezeData } from '../state/validate.js';
import { fingerprint } from '../state/relations.js';
import { actorAt } from '../turns/support.js';
import { instanceId } from '../ids.js';
import { allocate,blocked,clone } from './support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').PendingScene} PendingScene
 * @typedef {import('../../contracts/campaign.js').SceneBinding} Binding
 * @typedef {import('../../contracts/campaign.js').ActorSlotRef} Ref
 * @typedef {import('../../contracts/early-campaign-scenes.js').EarlyCampaignSceneCursor} Cursor
 * @typedef {import('../../../content/authored/campaign-scene-package.js').CampaignSceneDefinition} Script */
const LIMITS = Object.freeze({ maxDepth: 10,maxNodes: 512,maxArrayLength: 32,maxObjectKeys: 32,maxStringLength: 160,maxTextLength: 16384 });
const roleDefinitions = freezeData(clone(CAMPAIGN_SCENE_STAGING.roles));
const SINISTER_MEANIES_ENCOUNTER = 'campaign-boss-sinister-woods-team-meanies';
/** @param {Script} script */
function roles(script) {
  /** @type {{role:string;source:import('../../../content/authored/campaign-scene-package.js').CampaignScenePlacement['actorSource']}[]} */ const result = [];
  for (const stage of script.stages) for (const placement of stage.placements) {
    const prior = result.find(row => row.role === placement.role);
    if (prior && prior.source !== placement.actorSource) return blocked('early-scene-role-source');
    if (!prior) result.push({ role: placement.role,source: placement.actorSource });
  }
  return result;
}
/** Actual generation references come from the route's constructor/cutscene
 * owner, never a species search. This verifies current source kind/identity and
 * occupancy and exact canonical fixed encounter. This browser boss binding is
 * separate from native flags and behavior; the full raw route proof must still
 * prove actual fixed construction, native roles, first/retry and source entry.
 * @param {State} state @param {Script} script @param {unknown} input */
function qualifyActors(state,script,input) {
  const raw = copyPlainData(input,LIMITS);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return blocked('early-scene-actor-record');
  const refs = /** @type {Record<string,Ref>} */ (/** @type {unknown} */ (raw));
  const actualRoles = roles(script).filter(row => row.source === 'authenticated-session').map(row => row.role);
  if (fingerprint(Object.keys(refs).sort()) !== fingerprint(actualRoles.sort())) return blocked('early-scene-actor-roles');
  if (new Set(Object.values(refs).map(ref => ref.actorId)).size !== actualRoles.length) return blocked('early-scene-distinct-actors');
  const session = state.session;
  if (actualRoles.length === 0 ? session !== null : session === null) return blocked('early-scene-session-owner');
  for (const [role,ref] of Object.entries(refs)) {
    if (!ref || typeof ref !== 'object' || Array.isArray(ref) || Object.keys(ref).sort().join(',') !== 'actorId,side,slot' || !['team','wild'].includes(ref.side) || !Number.isSafeInteger(ref.slot) || ref.slot < 0) return blocked('early-scene-actor-ref');
    instanceId('actor',ref.actorId);
    if (!session) return blocked('early-scene-session');
    const actor = actorAt(session,ref),definition = roleDefinitions.find(row => row.id === role);
    if (!actor || !definition || actor.placement.kind !== 'map' || actor.placement.mapId !== session.floor.mapId || actor.resources.hp <= 0) return blocked('early-scene-live-generation');
    const pokemonId = definition.binding === 'profile-hero' ? state.profile.heroId : definition.binding === 'profile-partner' ? state.profile.partnerId : null;
    if (pokemonId) {
      if (ref.side !== 'team' || actor.binding.kind !== 'roster' || actor.binding.pokemonId !== pokemonId) return blocked('early-scene-actor-identity');
    } else {
      // The fixed Meanies occupy actual wild scheduler slots, with BossBinding.
      // Natural encounters of these species cannot substitute for that source.
      if (!['gengar','ekans','medicham'].includes(role) || !['browser-sinister-first-battle','browser-sinister-retry-battle'].includes(script.id)
        || session.dungeonId !== 'sinister-woods' || session.floor.location.kind !== 'boss' || session.floor.location.encounterId !== SINISTER_MEANIES_ENCOUNTER
        || session.floor.location.address.dungeonId !== 'sinister-woods' || session.floor.location.address.sectionId !== 'sinister-woods' || session.floor.location.address.floorId !== 'sinister-woods-floor-13'
        || ref.side !== 'wild' || actor.binding.kind !== 'boss' || actor.binding.encounterId !== SINISTER_MEANIES_ENCOUNTER || actor.affiliation !== 'hostile'
        || actor.identity.speciesId !== definition.speciesId || actor.identity.formId !== null) return blocked('early-scene-actor-identity');
    }
  }
  return refs;
}
/** Original role identities are distinct even for the two Jumpluff. Profile
 * and actual expedition actors are never replaced by story-only surrogates.
 * @param {State} state @param {Script} script @param {Record<string,Ref>} refs @returns {Binding[]} */
function bindings(state,script,refs) {
  return roles(script).map(row => {
    const roleId = /** @type {import('../../contracts/campaign.js').SceneRoleId} */ (`browser-early-role-${row.role}`);
    const definition = roleDefinitions.find(role => role.id === row.role);
    if (!definition) return blocked('early-scene-role-definition');
    if (row.source === 'authenticated-session') {
      const ref = refs[row.role]; if (!ref) return blocked('early-scene-actor-binding');
      return { roleId,kind: 'actor',actorId: ref.actorId };
    }
    if (row.source === 'profile') {
      const pokemonId = definition.binding === 'profile-hero' ? state.profile.heroId : definition.binding === 'profile-partner' ? state.profile.partnerId : null;
      if (!pokemonId || !state.roster[pokemonId]) return blocked('early-scene-profile-binding');
      return { roleId,kind: 'pokemon',pokemonId };
    }
    if (definition.binding !== 'story-only' || !definition.speciesId) return blocked('early-scene-ground-binding');
    return { roleId,kind: 'story-actor',storyActorId: /** @type {import('../../contracts/campaign.js').StoryActorId} */ (`browser-early-ground-${row.role}`) };
  });
}
/** @param {Script} script @param {string} stageId */
function choiceId(script,stageId) { return /** @type {import('../../contracts/campaign.js').SceneChoiceId} */ (`${script.id}-${stageId}-choice`); }
/** @param {State} state @param {Readonly<Cursor>} cursor @param {Record<string,Ref>} refs @returns {PendingScene} */
function pending(state,cursor,refs) {
  const script = earlyCampaignSceneDefinition(cursor.sceneId),index = script.stages.findIndex(row => row.id === cursor.stageId),stage = script.stages[index];
  if (!stage) return blocked('early-scene-active-stage');
  return { sceneInstanceId: cursor.sceneInstanceId,sceneId: /** @type {import('../../contracts.js').SceneId} */ (script.id),entryRevision: cursor.entryRevision,cursor: index,
    bindings: bindings(state,script,refs),choices: cursor.acknowledgments.flatMap(row => row.optionId === null ? [] : [{ choiceId: choiceId(script,row.stageId),optionId: /** @type {import('../../contracts/campaign.js').SceneOptionId} */ (row.optionId) }]),
    awaiting: stage.choices.length ? { kind: 'choice',choiceId: choiceId(script,stage.id),optionIds: stage.choices.map(option => /** @type {import('../../contracts/campaign.js').SceneOptionId} */ (option.id)) } : { kind: 'advance' },
    continuation: { kind: 'early-campaign',cursor: clone(cursor),actors: clone(refs) } };
}
/** Full raw factories call this only with their descriptor-safe actual state.
 * It proves the canonical scene/cursor/UI/role joins, not source route admission.
 * @param {State} state @returns {PendingScene & {continuation:import('../../contracts/campaign.js').Continuation & {kind:'early-campaign'}}} */
export function readEarlyPendingScene(state) {
  if (state.contentRevision !== SINISTER_WORK_REVISION) return blocked('early-scene-revision-owner');
  const scene = /** @type {PendingScene|null} */ (/** @type {unknown} */ (copyPlainData(state.pendingScene,LIMITS)));
  if (state.mode !== 'scene' || !scene || scene.continuation.kind !== 'early-campaign') return blocked('early-scene-canonical-owner');
  const cursor = readEarlyCampaignSceneCursor(scene.continuation.cursor,state.revision);
  if (cursor.day !== state.town.day) return blocked('early-scene-current-day');
  const refs = qualifyActors(state,earlyCampaignSceneDefinition(cursor.sceneId),scene.continuation.actors),expected = pending(state,cursor,refs);
  if (fingerprint(scene) !== fingerprint(expected)) return blocked('early-scene-exact-pending');
  if (state.pendingResult || state.session && (state.session.scheduler.kind !== 'scene-paused' || state.session.scheduler.sceneInstanceId !== scene.sceneInstanceId)) return blocked('early-scene-pause-owner');
  return /** @type {PendingScene & {continuation:import('../../contracts/campaign.js').Continuation & {kind:'early-campaign'}}} */ (scene);
}
/** The genuine route caller proves its source entry before calling this
 * mechanics owner. All supplied references/roles are checked before allocation.
 * It preserves the actual turn frame and pauses its existing scheduler; it does
 * not invent a dungeon terminal, new turn, source flags, grants or map placement.
 * @param {import('../turns/types.js').MutationContext} context @param {string} sceneId @param {unknown} actors */
export function requestEarlyCampaignScene(context,sceneId,actors) {
  const state = context.state;
  if (state.contentRevision !== SINISTER_WORK_REVISION) return blocked('early-scene-revision-owner');
  const script = earlyCampaignSceneDefinition(sceneId),refs = qualifyActors(state,script,actors);
  if (state.pendingScene || state.pendingResult || state.revision >= Number.MAX_SAFE_INTEGER || state.session && (state.mode !== 'dungeon' || state.session.scheduler.kind !== 'ready') || !state.session && state.mode !== 'town') return blocked('early-scene-request-boundary');
  const bound = bindings(state,script,refs);
  if (!bound.length || !Number.isSafeInteger(state.town.day) || state.town.day < 0) return blocked('early-scene-request-bindings');
  const cursor = beginEarlyCampaignSceneCursor({ sceneId,sceneInstanceId: allocate(state,'scene-instance'),entryRevision: state.revision+1,day: state.town.day });
  const prepared = pending(state,cursor,refs);
  state.pendingScene = prepared; state.mode = 'scene';
  if (state.session) state.session.scheduler = { ...state.session.scheduler,kind: 'scene-paused',sceneInstanceId: prepared.sceneInstanceId };
  context.emit({ type: 'sceneRequested',sceneId: prepared.sceneId });
  return prepared;
}
/** Plan one real acknowledgment without mutating the supplied state. A final
 * return must be consumed by the concrete route handler in the same transaction;
 * it must first finish genuine terminal learning where that source owner owes it.
 * The final stage is not recorded as complete merely because a button is shown.
 * @param {State} state @param {import('../turns/types.js').Intent} intent */
export function prepareEarlySceneAcknowledgment(state,intent) {
  const scene = readEarlyPendingScene(state);
  if (intent.type !== 'ackScene' || intent.revision !== state.revision || intent.sceneInstanceId !== scene.sceneInstanceId || intent.sceneId !== scene.sceneId || intent.cursor !== scene.cursor) return blocked('early-scene-stale-acknowledgment');
  const cursor = advanceEarlyCampaignSceneCursor(scene.continuation.cursor,intent.optionId,state.revision);
  if (cursor.stageId === null) return { kind: /** @type {const} */ ('return'),receipt: earlyCampaignSceneReturn(cursor,state.revision+1),actors: clone(scene.continuation.actors) };
  return { kind: /** @type {const} */ ('advance'),pendingScene: pending(state,cursor,scene.continuation.actors) };
}
