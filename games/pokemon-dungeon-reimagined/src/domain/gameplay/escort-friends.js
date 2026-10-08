import { caterpieExitReady, beginCaterpieScene } from './escort-work-scenes.js';
import { deliverEscortMailbox } from './escort-job-records.js';
import { deliverChapterMailbox } from './chapter-job-records.js';
import { meaniesExitReady, beginMeaniesScene } from './escort-meanies-scenes.js';
import { FRIENDS, placeFriendsGround, areaMapId, friendAreaMap } from '../../../content/authored/friends.js';
import { FRIEND_AREA_FACTS } from '../../../content/authored/friend-area-facts.js';
import { STEEL } from '../../../content/authored/mt-steel.js';
import { TOWN } from '../../../content/authored/town.js';
import { TEAM } from '../../../content/authored/team-formation.js';
import { MORNING } from '../../../content/authored/first-morning.js';
import { refreshGround } from './ground-refresh.js';
import { requestScene } from './scenes.js';
import { nearWigglytuff, enrollStoryMagnemite, residentOrderProblem, applyResidentOrder } from './friend-residents.js';
import { blocked, facing } from './support.js';
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {import('../../../content/authored/opening.js').AuthoredOpening} Authored */
/** @typedef {import('./friend-residents.js').ResidentOrder|{kind:'begin'}|{kind:'welcome'}|{kind:'nickname-answer';rename:boolean}|{kind:'nickname';name:string|null}} FriendOrder */
/** @param {import('../../contracts/campaign.js').CampaignSnapshot} state */
export function friendsGroundReady(state) { return !!state.friends && !['meanies-ready','caterpie-ready','sinister-ready'].includes(state.friends.phase) && state.mode === 'town' && !state.session && !state.pendingScene && !state.pendingResult && !state.earlyWork?.returned && !state.earlyWork?.reward && !state.earlyWork?.clientPrompt; }
/** Every MAIN change resets native CLEAR_COUNT, including changes of substage.
 * @param {import('../../contracts/campaign.js').CampaignState} state @param {number} step */
export function setFriendsStep(state, step) { state.progress.native.scenarios.MAIN = { chapter: 5, step }; state.progress.native.clearCount = 0; }
/** @param {Context} context @param {Authored} authored @param {number} index */
export function requestFriendsScene(context, authored, index) {
  const script = authored.scenes.find(row => row.id === FRIENDS.scenes[index]); if (!script) return blocked('friend-scene-definition');
  if (script.continuation.kind !== 'town' || script.continuation.destination.kind !== 'town') return blocked('friend-scene-map');
  placeFriendsGround(context.state, script.continuation.destination.mapDefinitionId); requestScene(context, authored, script);
}
/** @param {Context} context @param {Authored} authored @param {Catalogs} catalogs */
export function advanceFriendsScene(context, authored, catalogs) {
  const state = context.state, scene = state.pendingScene, friends = state.friends;
  if (!friends || !scene || friends.nicknamePrompt) return { kind: /** @type {const} */ ('rejected'), reason: /** @type {const} */ ('unavailable') };
  const script = authored.scenes.find(row => row.id === scene.sceneId), index = FRIENDS.scenes.indexOf(scene.sceneId);
  if (!script || index < 0) return blocked('friend-scene-owner');
  if (index === 2 && scene.cursor === 1) for (const id of FRIENDS.freeAreas.slice(0, 2)) if (!state.economy.ownedFriendAreaIds.some(area => area === id)) state.economy.ownedFriendAreaIds.push(/** @type {import('../../contracts/campaign.js').FriendAreaId} */ (id));
  if (index === 2 && scene.cursor === 2) {
    friends.nicknamePrompt = 'ask'; scene.cursor = 3;
    return { kind: /** @type {const} */ ('changed'), resumeDungeon: false };
  }
  if (scene.cursor + 1 < script.lines.length) { scene.cursor++; return { kind: /** @type {const} */ ('changed'), resumeDungeon: false }; }
  const revision = state.revision + 1, day = state.town.day;
  state.progress.seenScenes[scene.sceneId] = { sceneId: scene.sceneId, count: 1, firstRevision: revision, lastRevision: revision, firstDay: day, lastDay: day };
  state.pendingScene = null; state.mode = 'town';
  if (index === 0) { setFriendsStep(state, 2); friends.phase = 'morning-ready'; }
  else if (index === 1) { setFriendsStep(state, 3); friends.phase = 'tour'; state.progress.native.scalars.warpLock = 4; }
  else if (index === 2) { setFriendsStep(state, 4); friends.phase = 'encounter-ready'; }
  else if (index === 3) { state.progress.native.scalars.warpLock = 0; refreshGround(state, catalogs); friends.phase = 'rest'; requestFriendsScene(context, authored, 4); }
  else if (index === 4) { state.town.day++; setFriendsStep(state, 5); friends.phase = 'work-three'; placeFriendsGround(state, TEAM.map); if (state.earlyWork) deliverChapterMailbox(state,state.earlyWork); }
  else if (index === 5 && friends.phase === 'meanies-morning') { setFriendsStep(state,6); friends.phase = 'meanies-ready'; }
  else return blocked('later-friend-scene-dependency');
  return { kind: /** @type {const} */ ('changed'), resumeDungeon: false };
}
/** @param {Catalogs} catalogs @param {Authored} authored @returns {import('../turns/types.js').CommandHandler} */
export function friendHandler(catalogs, authored) { return {
  plan(state, intent) {
    if (intent.type !== 'friendAction') return { kind: 'rejected', reason: 'invalid-command' };
    const order = intent.order;
    if (order.kind === 'begin') return !state.friends && state.steel?.phase === 'complete' && state.progress.storyNodeId === STEEL.complete && state.mode === 'town' && !state.session && !state.pendingScene ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
    if (order.kind === 'welcome') return friendsGroundReady(state) && state.friends?.phase === 'tour' && nearWigglytuff(state) ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
    if (order.kind === 'nickname-answer') return state.friends?.nicknamePrompt === 'ask' && typeof order.rename === 'boolean' ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
    if (order.kind === 'nickname') return state.friends?.nicknamePrompt === 'edit' && (order.name === null || typeof order.name === 'string') ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' };
    return !friendsGroundReady(state) || residentOrderProblem(state, order, catalogs) ? { kind: 'rejected', reason: 'unavailable' } : { kind: 'mutation' };
  },
  apply(context, intent) {
    if (intent.type !== 'friendAction') return { kind: 'rejected', reason: 'invalid-command' };
    const state = context.state, order = intent.order;
    if (order.kind === 'begin') {
      state.friends = { startedRevision: state.revision + 1, startedDay: state.town.day + 1, priorExpeditions: state.progress.statistics.expeditions, priorJobs: state.progress.statistics.jobsCompleted, phase: 'dream', magnemiteId: null, nicknamePrompt: null, purchases: [] };
      state.town.day++; state.progress.storyNodeId = FRIENDS.story; setFriendsStep(state, 1);
      refreshGround(state, catalogs); requestFriendsScene(context, authored, 0);
    } else if (order.kind === 'welcome') { if (!state.friends) return blocked('friend-owner'); state.friends.phase = 'welcome'; requestFriendsScene(context, authored, 2); }
    else if (order.kind === 'nickname-answer' || order.kind === 'nickname') {
      if (!state.friends || !state.pendingScene) return blocked('friend-nickname-owner');
      if (order.kind === 'nickname-answer' && order.rename) state.friends.nicknamePrompt = 'edit';
      else {
        if (!enrollStoryMagnemite(context, catalogs, order.kind === 'nickname' ? order.name : null)) return { kind: 'rejected', reason: 'unavailable' };
        state.pendingScene.cursor = 4;
      }
    } else if (!applyResidentOrder(context, order, catalogs)) return { kind: 'rejected', reason: 'unavailable' };
    return { kind: 'changed', resumeDungeon: false };
  },
}; }
/** Normal base ENTER_CONTROL dispatch owns the morning scene. Warp lock permits
 * the companion tour to the square, never an expedition or premature area trip.
 * @param {Context} context @param {Authored} authored @param {import('../../contracts/campaign.js').MapDefinitionId} map */
export function travelFriends(context, authored, map) {
  if (caterpieExitReady(context.state)) { if (map !== TEAM.map) return false; beginCaterpieScene(context,authored); return true; }
  if (meaniesExitReady(context.state)) { if (map !== TEAM.map) return false; beginMeaniesScene(context,authored); return true; }
  const state = context.state, friends = state.friends; if (!friends || !friendsGroundReady(state)) return false;
  const area = FRIEND_AREA_FACTS.find(row => row.id && areaMapId(row.id) === map);
  if (area?.id ? state.progress.native.scenarios.MAIN.step < 4 || !state.economy.ownedFriendAreaIds.some(id => id === area.id) : ![TEAM.map, MORNING.interior, TOWN.square, TOWN.post].includes(map)) return false;
  if (friends.phase === 'tour' && ![TEAM.map, TOWN.square].includes(map)) return false;
  if (friends.phase === 'morning-ready' && map !== TEAM.map || state.town.mapDefinitionId === map) return false;
  placeFriendsGround(state, map);
  if (friends.phase === 'morning-ready') { friends.phase = 'morning'; requestFriendsScene(context, authored, 1); }
  else if (friends.phase === 'work-three' && map === TEAM.map && state.earlyWork) deliverChapterMailbox(state,state.earlyWork);
  if (friends.phase === 'work-two' && map === TEAM.map && state.earlyWork) deliverEscortMailbox(state,state.earlyWork);
  return true;
}
/** Readable ground exploration and actual proximity trigger. Domain placement
 * owns collision; view geometry and menus cannot advance the story.
 * @param {Context} context @param {Authored} authored @param {number} dx @param {number} dz */
export function moveFriendsGround(context, authored, dx, dz) {
  const state = context.state; if (!friendsGroundReady(state) || ![-1, 0, 1].includes(dx) || ![-1, 0, 1].includes(dz) || !dx && !dz) return false;
  const area = FRIEND_AREA_FACTS.find(row => row.id && areaMapId(row.id) === state.town.mapDefinitionId);
  if (!area?.id && state.town.mapDefinitionId !== TOWN.square) return false;
  const hero = state.town.placements.find(row => row.reference.kind === 'pokemon' && row.reference.pokemonId === state.profile.heroId); if (!hero) return false;
  const to = { x: hero.position.x + dx, z: hero.position.z + dz };
  const walkable = area?.id ? friendAreaMap(area.id).tiles[to.z]?.[to.x] === 'floor' : to.x >= 1 && to.x < TOWN.width - 1 && to.z >= 1 && to.z < TOWN.height - 1;
  if (!walkable || !area && to.x === FRIENDS.wigglytuff.x && to.z === FRIENDS.wigglytuff.z || state.town.placements.some(row => row !== hero && row.position.x === to.x && row.position.z === to.z)) return false;
  hero.position = to; hero.facing = facing(dx, dz);
  if (!area && state.friends?.phase === 'encounter-ready' && Math.max(Math.abs(to.x - FRIENDS.encounterTrigger.x), Math.abs(to.z - FRIENDS.encounterTrigger.z)) <= 1) { state.friends.phase = 'encounter'; requestFriendsScene(context, authored, 3); }
  return true;
}
