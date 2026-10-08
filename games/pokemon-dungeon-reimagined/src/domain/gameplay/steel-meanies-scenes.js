import { FRIENDS, placeFriendsGround } from '../../../content/authored/friends.js';
import { TEAM } from '../../../content/authored/team-formation.js';
import { MORNING } from '../../../content/authored/first-morning.js';
import { STEEL } from '../../../content/authored/mt-steel.js';
import { ORDINARY_SUMMIT, POSTING_CURSOR, placeMeaniesGround } from '../../../content/authored/steel-meanies.js';
import { STEEL_MEANIES_REVISION } from '../state/steel-meanies-revision.js';
import { ownsBronzeRuntime } from '../state/move-learning-revision.js';
import { requestScene } from './scenes.js';
import { settleExpedition } from './expedition.js';
import { postMeaniesMail } from './steel-meanies-mail.js';
import { setFriendsStep } from './friends.js';
import { blocked } from './support.js';
/** @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {import('../../../content/authored/opening.js').AuthoredOpening} Authored */
/** @param {import('../../contracts/campaign.js').CampaignSnapshot} state */
export function meaniesExitReady(state) {
  return (state.contentRevision === STEEL_MEANIES_REVISION || ownsBronzeRuntime(state.contentRevision)) && state.friends?.phase === 'meanies-ready' && state.mode === 'town' && state.town.mapDefinitionId === MORNING.interior && state.progress.native.scenarios.MAIN.chapter === 5 && state.progress.native.scenarios.MAIN.step === 6 && !state.session && !state.pendingScene && !state.pendingResult && !state.earlyWork?.returned && !state.earlyWork?.reward && !state.earlyWork?.clientPrompt;
}
/** Offer/list commands at the genuine outside input stop; no departure/refresh.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state */
export function meaniesMailboxReady(state) {
  return (state.contentRevision === STEEL_MEANIES_REVISION || ownsBronzeRuntime(state.contentRevision)) && state.friends?.phase === 'work-two' && state.mode === 'town' && state.town.mapDefinitionId === TEAM.map && state.progress.native.scenarios.MAIN.chapter === 5 && state.progress.native.scenarios.MAIN.step === 7 && !state.session && !state.pendingScene && !state.pendingResult && !state.earlyWork?.returned && !state.earlyWork?.reward && !state.earlyWork?.clientPrompt;
}
/** @param {Context} context @param {Authored} authored */
export function beginMeaniesScene(context, authored) {
  if (!meaniesExitReady(context.state) || !context.state.friends) return blocked('meanies-base-exit');
  const script = authored.scenes.find(row => row.id === FRIENDS.scenes[6]); if (!script) return blocked('meanies-script');
  context.state.friends.phase = 'meanies'; placeMeaniesGround(context.state,0); requestScene(context,authored,script);
}
/** Independent native POSTSTORY representation; fixed actors are deleted for
 * the event by materializing an empty arena, never by damage/faint/grants.
 * @param {Context} context @param {Authored} authored */
export function enterOrdinarySteelSummit(context, authored) {
  const state = context.state, session = state.session;
  if (session?.purpose.kind !== 'ordinary' || session.dungeonId !== STEEL.dungeonId || session.floor.location.kind !== 'boss' || session.floor.location.address.floorId !== STEEL.floors[8] || state.steel?.phase !== 'complete' || state.friends?.phase !== 'work-three') return blocked('ordinary-steel-summit-owner');
  const script = authored.scenes.find(row => row.id === ORDINARY_SUMMIT); if (!script) return blocked('ordinary-steel-summit-script');
  requestScene(context,authored,script); if (!state.pendingScene) return blocked('ordinary-steel-summit-scene');
  session.scheduler = { ...session.scheduler,kind: 'scene-paused',sceneInstanceId: state.pendingScene.sceneInstanceId };
  session.scheduler.continuation.terminal = 'dungeon-exit';
}
/** Every cursor, posting, completion and return commits once in the command draft.
 * @param {Context} context @param {Authored} authored
 * @param {import('./support.js').Catalogs} catalogs
 * @returns {import('../turns/types.js').MutationResult} */
export function advanceSteelMeaniesScene(context, authored, catalogs) {
  const state = context.state, scene = state.pendingScene, script = authored.scenes.find(row => row.id === scene?.sceneId);
  if (!scene || !script || ![ORDINARY_SUMMIT,FRIENDS.scenes[6]].includes(scene.sceneId)) return { kind: 'rejected',reason: 'unavailable' };
  if (scene.cursor+1 < script.lines.length) {
    if (scene.sceneId === FRIENDS.scenes[6] && scene.cursor+1 === POSTING_CURSOR) postMeaniesMail(state);
    scene.cursor++;
    if (scene.sceneId === FRIENDS.scenes[6]) placeMeaniesGround(state,scene.cursor);
    return { kind: 'changed',resumeDungeon: false };
  }
  const old = state.progress.seenScenes[scene.sceneId], revision = state.revision+1, day = state.town.day;
  state.progress.seenScenes[scene.sceneId] = { sceneId: scene.sceneId,count: (old?.count ?? 0)+1,firstRevision: old?.firstRevision ?? revision,lastRevision: revision,firstDay: old?.firstDay ?? day,lastDay: day };
  if (scene.sceneId === ORDINARY_SUMMIT) settleExpedition(context,'success',catalogs);
  else {
    if (state.friends?.phase !== 'meanies') return blocked('meanies-scene-owner');
    state.pendingScene = null; state.mode = 'town'; state.friends.phase = 'work-two'; setFriendsStep(state,7); placeFriendsGround(state,TEAM.map);
  }
  return { kind: 'changed',resumeDungeon: false };
}
