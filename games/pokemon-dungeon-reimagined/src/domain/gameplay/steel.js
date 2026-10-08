import { refreshGround } from './ground-refresh.js';
import { STEEL } from '../../../content/authored/mt-steel.js';
import { WORK } from '../../../content/authored/early-work.js';
import { placeAtBase } from '../../../content/authored/team-formation.js';
import { placeInside } from '../../../content/authored/first-morning.js';
import { createScheduler } from '../turns.js';
import { INITIAL_SCHEDULE_POLICY_ID } from '../../../content/state/expedition.js';
import { requestScene } from './scenes.js';
import { enterOpening, settleExpedition } from './expedition.js';
import { receiveRewardItem, rewardItemChoiceProblem } from './reward-items.js';
import { blocked } from './support.js';
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** @typedef {import('../../../content/authored/opening.js').AuthoredOpening} Authored */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @param {Snapshot} state */
export function steelReady(state) {
  return state.mode === 'town' && !state.session && !state.pendingScene && !state.pendingResult && !!state.earlyWork && !state.earlyWork.returned && !state.earlyWork.reward && !state.earlyWork.clientPrompt && (state.steel?.phase === 'ready' || !state.steel && state.progress.storyNodeId === WORK.story && WORK.scenes.every(id => state.progress.seenScenes[id]?.count === 1));
}
/** @param {Context} context @param {Authored} authored @param {number} index */
function scene(context, authored, index) {
  const script = authored.scenes.find(row => row.id === STEEL.scenes[index]);
  if (!script) return blocked('steel-scene-script');
  requestScene(context, authored, script);
}
/** @param {Context} context @param {Authored} authored */
export function beginSteelTravel(context, authored) {
  const s = context.state;
  if (!s.steel) s.steel = { startedRevision: s.revision + 1, requestDay: s.town.day, priorExpeditions: s.progress.statistics.expeditions, attempts: 0, bossVisits: 0, bossDefeated: false, phase: 'travel', rewardCursor: 0, rewardChoice: false, lastSessionId: null, winRevision: null };
  s.steel.phase = 'travel'; s.progress.storyNodeId = STEEL.story;
  placeAtBase(s); s.town.mapDefinitionId = STEEL.entrance;
  scene(context, authored, s.steel.attempts === 0 ? 0 : 1);
}
/** Fixed floor entry selects first/retry from reached history, independently of
 * travel retries. Poststory is a noncombat observation then automatic clear.
 * @param {Context} context @param {Authored} authored */
export function enterSteelSummit(context, authored) {
  const state = context.state, steel = state.steel, session = state.session;
  if (!steel || !session || session.purpose.kind !== 'story' || session.dungeonId !== STEEL.dungeonId) return blocked('steel-summit-owner');
  const repeat = steel.bossVisits > 0; steel.bossVisits++;
  state.progress.native.flags.persistent[0] = true;
  steel.phase = steel.bossDefeated ? 'poststory' : 'battle-intro';
  scene(context, authored, steel.bossDefeated ? 10 : repeat ? 3 : 2);
  if (!state.pendingScene) return blocked('steel-summit-scene');
  session.scheduler = { ...session.scheduler, kind: 'scene-paused', sceneInstanceId: state.pendingScene.sceneInstanceId };
  session.scheduler.continuation.terminal = 'dungeon-exit';
}
/** Called only from the actual faint owner, never enemy-count/scene buttons.
 * @param {Context} context @param {import('../../contracts/campaign.js').SessionActor} target */
export function noteSteelBossFaint(context, target) {
  const state = context.state, session = state.session, steel = state.steel;
  if (!steel || steel.phase !== 'battle' || !session || session.purpose.kind !== 'story' || session.dungeonId !== STEEL.dungeonId || session.floor.location.kind !== 'boss' || target.binding.kind !== 'boss' || target.binding.encounterId !== STEEL.bossRole || target.identity.speciesId !== 'pokemon-227' || target.resources.hp !== 0) return;
  steel.bossDefeated = true; state.progress.native.flags.persistent[1] = true;
}
/** Run after same-hit recoil/revival and forced partner/leader loss checks.
 * @param {Context} context @param {Authored} authored */
export function finishSteelBattle(context, authored) {
  const state = context.state, steel = state.steel, session = state.session;
  if (!steel?.bossDefeated || steel.phase !== 'battle' || !session || session.purpose.kind !== 'story' || session.dungeonId !== STEEL.dungeonId) return;
  steel.phase = 'departure';
  scene(context, authored, 5);
  if (!state.pendingScene) return blocked('steel-departure-scene');
  session.scheduler = { ...session.scheduler, kind: 'scene-paused', sceneInstanceId: state.pendingScene.sceneInstanceId };
  session.scheduler.continuation.terminal = 'dungeon-exit';
}
/** Shared settlement has already retained/lost real roster/inventory state.
 * @param {Context} context @param {boolean} success @param {Authored} authored */
export function afterSteelSettlement(context, success, authored) {
  const state = context.state, steel = state.steel; if (!steel) return blocked('steel-return-owner');
  state.progress.native.scenarios.MAIN = { chapter: 4, step: 7 };
  if (success) {
    steel.phase = 'bridge'; steel.winRevision = state.revision + 1;
    placeAtBase(state); state.town.mapDefinitionId = STEEL.summit;
    scene(context, authored, 9);
  } else {
    steel.phase = 'loss'; placeInside(state); scene(context, authored, 4);
  }
}
/** @param {number} cursor @returns {import('../../contracts/campaign.js').ItemGrant} */
export function steelRewardItem(cursor) {
  if (cursor !== 1 && cursor !== 2) return blocked('steel-reward-cursor');
  return { template: { itemId: /** @type {import('../../contracts.js').ItemId} */ (cursor === 1 ? 'item-pecha-scarf' : 'item-ginseng'), sticky: false, payload: { kind: 'none' } }, quantity: 1 };
}
/** @param {Context} context @param {Authored} authored */
function recordScene(context, authored) {
  const state = context.state, pending = state.pendingScene;
  if (!pending || !authored.scenes.some(row => row.id === pending.sceneId)) return blocked('steel-scene-owner');
  const prior = state.progress.seenScenes[pending.sceneId], revision = state.revision + 1;
  state.progress.seenScenes[pending.sceneId] = { sceneId: pending.sceneId, count: (prior?.count ?? 0) + 1, firstRevision: prior?.firstRevision ?? revision, lastRevision: revision, firstDay: prior?.firstDay ?? state.town.day, lastDay: state.town.day };
}
/** @param {Context} context */
function receipt(context) {
  const state = context.state, steel = state.steel, id = steel ? STEEL.grants[steel.rewardCursor] : null;
  if (!steel || !id || state.progress.appliedGrants.some(row => row.grantId === id)) return blocked('steel-reward-replay');
  state.progress.appliedGrants.push({ grantId: id, revision: state.revision + 1, day: state.town.day }); steel.rewardCursor++;
}
/** @param {Context} context @param {Authored} authored */
function deliverSteelRewards(context, authored) {
  const state = context.state, steel = state.steel; if (!steel) return blocked('steel-reward-owner');
  while (steel.rewardCursor < 3) {
    if (steel.rewardCursor === 0) {
      // Native scripted money refuses the whole grant above capacity.
      if (state.economy.carriedMoney <= 99499) state.economy.carriedMoney += 500;
      receipt(context);
    } else {
      if (receiveRewardItem(context, steelRewardItem(steel.rewardCursor)) === 'choice') { steel.rewardChoice = true; return; }
      receipt(context);
    }
  }
  recordScene(context, authored); steel.phase = 'home'; steel.rewardChoice = false; scene(context, authored, 8);
}
/** All Steel scene effects share the ordinary transaction/cursor owner. Pauses
 * are stable save boundaries; the success bridge never calls enterOpening.
 * @param {Context} context @param {Authored} authored @param {Catalogs} catalogs
 * @returns {import('../turns/types.js').MutationResult} */
export function advanceSteelScene(context, authored, catalogs) {
  const state = context.state, steel = state.steel, pending = state.pendingScene;
  const script = authored.scenes.find(row => row.id === pending?.sceneId);
  if (!steel || !pending || !script || steel.rewardChoice) return { kind: 'rejected', reason: 'unavailable' };
  if (pending.cursor + 1 < script.lines.length) { pending.cursor++; return { kind: 'changed', resumeDungeon: false }; }
  if (steel.phase === 'thanks') { deliverSteelRewards(context, authored); return { kind: 'changed', resumeDungeon: false }; }
  recordScene(context, authored);
  const phase = steel.phase;
  state.pendingScene = null;
  if (phase === 'travel') {
    steel.phase = 'exploration'; steel.attempts++;
    enterOpening(context, catalogs, authored, STEEL.dungeonId);
    steel.lastSessionId = state.session?.sessionId ?? null;
    return { kind: 'changed', resumeDungeon: true };
  }
  if (phase === 'battle-intro') {
    const session = state.session; if (!session) return blocked('steel-battle-session');
    steel.phase = 'battle'; state.mode = 'dungeon';
    session.scheduler = createScheduler(INITIAL_SCHEDULE_POLICY_ID, [session.teamOrder[0] ?? null, session.teamOrder[1] ?? null, null, null], [...session.scheduler.wildSlots]);
    return { kind: 'changed', resumeDungeon: true };
  }
  if (phase === 'departure' || phase === 'poststory') settleExpedition(context, 'success', catalogs, authored);
  else if (phase === 'bridge') { refreshGround(state, catalogs); steel.phase = 'crossing'; state.progress.native.scenarios.MAIN = { chapter: 4, step: 8 }; scene(context, authored, 6); }
  else if (phase === 'crossing') { steel.phase = 'thanks'; placeAtBase(state); scene(context, authored, 7); }
  else if (phase === 'loss') { steel.phase = 'ready'; state.mode = 'town'; placeInside(state); }
  else if (phase === 'home') {
    steel.phase = 'complete'; state.mode = 'town'; placeInside(state);
    state.progress.storyNodeId = STEEL.complete; state.progress.native.scenarios.MAIN = { chapter: 5, step: 0 }; state.progress.native.clearCount = 0;
    state.progress.statistics.rescuesCompleted++;
    state.progress.clears[STEEL.dungeonId] = { dungeonId: /** @type {import('../../contracts.js').DungeonId} */ (STEEL.dungeonId), firstClearRevision: state.revision + 1, lastClearRevision: state.revision + 1, firstClearDay: state.town.day, lastClearDay: state.town.day, clearCount: 1, reachedFloorIds: /** @type {import('../../contracts/campaign.js').FloorId[]} */ ([...STEEL.floors]) };
  } else return blocked('steel-scene-phase');
  return { kind: 'changed', resumeDungeon: false };
}
/** @param {Authored} authored @returns {import('../turns/types.js').CommandHandler} */
export function steelRewardHandler(authored) { return {
  plan(state, intent) {
    const steel = state.steel;
    if (intent.type !== 'steelRewardChoice' || state.mode !== 'scene' || state.pendingScene?.sceneId !== STEEL.scenes[7] || steel?.phase !== 'thanks' || !steel.rewardChoice) return { kind: 'rejected', reason: 'unavailable' };
    return rewardItemChoiceProblem(state, steelRewardItem(steel.rewardCursor), intent.choice) ? { kind: 'rejected', reason: 'unavailable' } : { kind: 'mutation' };
  },
  apply(context, intent) {
    const steel = context.state.steel;
    if (!steel || intent.type !== 'steelRewardChoice') return { kind: 'rejected', reason: 'unavailable' };
    receiveRewardItem(context, steelRewardItem(steel.rewardCursor), intent.choice); receipt(context); steel.rewardChoice = false;
    deliverSteelRewards(context, authored); return { kind: 'changed', resumeDungeon: false };
  },
}; }
