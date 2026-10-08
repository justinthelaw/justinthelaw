import { refreshSteelMeaniesBoard as refreshFriendJobBoard } from './steel-meanies-mail.js';
import { friendHandler, friendsGroundReady, moveFriendsGround } from './friends.js';
import { leaderInputReady, automaticTurnReady } from '../turns/readiness.js';
import { MORNING } from '../../../content/authored/first-morning.js';
import { canTransferHeldItem, supportedHeldItem } from './held-items.js';
import { STEEL } from '../../../content/authored/mt-steel.js';
import { beginSteelTravel, steelRewardHandler } from './steel.js';
import { setMoveHandler } from './move-menu.js';
import { workHandlers, workReady, facingJobClient } from './work.js';
import { refreshJobBoard } from './job-records.js';
import { townHandlers } from './town.js';
import { USABLE_ITEMS } from './items.js';
import { canThrowItems, THROWABLE_ITEMS, throwCategory } from './throws.js';
import { THUNDERWAVE as T } from '../../../content/authored/thunderwave.js';
import { canMeleeAttack } from '../navigation/geometry.js';
import { movementPlan } from './movement.js';
import { admission, enterOpening } from './expedition.js';
import { sceneHandler, nameHandler, morningHandler } from './scenes.js';
import { supportedMove } from './combat.js';
import { facing, navActor, navigationContext, FACINGS } from './support.js';

/** @param {import('./support.js').Catalogs} catalogs @param {import('../../../content/authored/opening.js').AuthoredOpening} authored
 * @param {(snapshot:import('../../contracts/campaign.js').CampaignSnapshot)=>boolean} tutorialSaved
 * @returns {import('../turns/types.js').CommandHandlers} */
export function createCommandHandlers(catalogs, authored, tutorialSaved) {
  const work = workHandlers(catalogs, authored);
  /** @type {import('../turns/types.js').CommandHandler} */ const dungeonAction = { plan(state, intent) {
    const session = state.session; const leader = session?.actors[session.leaderActorId];
    if (!leaderInputReady(state) || !session || leader?.placement.kind !== 'map') return { kind: 'rejected', reason: 'unavailable' };
    const nav = navigationContext(session, catalogs);
    if (intent.type === 'move') {
      if (![-1, 0, 1].includes(intent.dx) || ![-1, 0, 1].includes(intent.dz) || !intent.dx && !intent.dz) return { kind: 'rejected', reason: 'invalid-command' };
      const destination = { x: leader.placement.position.x + intent.dx, z: leader.placement.position.z + intent.dz };
      if (movementPlan(session, leader, destination, catalogs).kind === 'blocked') return { kind: 'rejected', reason: 'unavailable' };
      return { kind: 'action', action: { kind: 'move', actorId: leader.actorId, destination } };
    }
    if (intent.type === 'equipItem') {
      const item = state.items[intent.itemInstanceId];
      if (!state.progress.appliedGrants.some(row => row.grantId === MORNING.grants[2])) return { kind: 'rejected', reason: 'unavailable' };
      if (item && state.containers[session.inventory]?.itemIds.includes(item.itemInstanceId) && !supportedHeldItem(catalogs, item.template.itemId)) return { kind: 'content-blocked', requirement: 'held-item-effect-not-supported' };
      if (intent.actorId !== leader.actorId || intent.target.kind !== 'self' || !canTransferHeldItem(leader) || !item || ![session.inventory, leader.heldContainerId].some(id => state.containers[id]?.itemIds.includes(item.itemInstanceId))) return { kind: 'rejected', reason: 'unavailable' };
      return { kind: 'action', action: { kind: 'item', actorId: leader.actorId, itemInstanceId: item.itemInstanceId, operation: 'equip', target: { kind: 'self' } } };
    }
    if (intent.type === 'throwItem') {
      const item = state.items[intent.itemInstanceId], bag = state.containers[session.inventory], held = state.containers[leader.heldContainerId];
      const frame = session.scheduler.continuation;
      if (intent.actorId !== leader.actorId || leader.resources.hp <= 0 || leader.placement.mapId !== session.floor.mapId || frame.terminal !== 'none' || frame.pass !== 'leader' || frame.stage !== 'decision' || frame.active?.actorId !== leader.actorId || !item || bag?.owner.kind !== 'session-toolbox' || bag.owner.sessionId !== session.sessionId || held?.owner.kind !== 'actor-held' || held.owner.actorId !== leader.actorId || held.owner.sessionId !== session.sessionId || [bag,held].filter(row => row.itemIds.includes(item.itemInstanceId)).length !== 1) return { kind: 'rejected', reason: 'unavailable' };
      const capability = canThrowItems(leader, catalogs);
      if (capability === null) return { kind: 'content-blocked', requirement: 'throw-capability-profile' };
      if (!capability) return { kind: 'rejected', reason: 'unavailable' };
      if (!THROWABLE_ITEMS.includes(item.template.itemId)) return { kind: 'content-blocked', requirement: `item-throw-effect-consumer:${item.template.itemId}` };
      const category = throwCategory(item.template.itemId);
      if (!category || category !== catalogs.effects.getItem(item.template.itemId).category) return { kind: 'content-blocked', requirement: 'throw-item-category' };
      if (intent.target.kind !== 'facing') return { kind: 'rejected', reason: 'invalid-command' };
      if (item.shopLotId !== null) return { kind: 'content-blocked', requirement: 'throw-shop-aggression-consumer' };
      return { kind: 'action', action: { kind: 'item', actorId: leader.actorId, itemInstanceId: item.itemInstanceId, operation: 'throw', target: intent.target } };
    }
    if (intent.type === 'useItem') {
      const item = state.items[intent.itemInstanceId]; const bag = state.containers[session.inventory];
      if (intent.actorId !== leader.actorId || intent.target.kind !== 'self' || !item || !bag?.itemIds.includes(item.itemInstanceId) && !state.containers[leader.heldContainerId]?.itemIds.includes(item.itemInstanceId)) return { kind: 'rejected', reason: 'unavailable' };
      if (!USABLE_ITEMS.includes(item.template.itemId)) return { kind: 'content-blocked', requirement: 'item-action-not-supported' };
      return { kind: 'action', action: { kind: 'item', actorId: leader.actorId, itemInstanceId: item.itemInstanceId, operation: item.template.itemId === 'item-gravelerock' ? 'throw' : 'use', target: { kind: 'self' } } };
    }
    if (intent.type === 'wait') return { kind: 'action', action: { kind: 'wait', actorId: leader.actorId } };
    if (intent.type === 'giveUp' && intent.sessionId === session.sessionId) return { kind: 'action', action: { kind: 'give-up' } };
    if (intent.type === 'useStairs' && intent.sessionId === session.sessionId) {
      const pos = leader.placement.position; const exit = Object.values(session.floor.exits).find(exit => exit.position.x === pos.x && exit.position.z === pos.z && exit.lock.kind === 'open');
      return exit ? { kind: 'action', action: { kind: 'exit', actorId: leader.actorId, exitId: exit.exitId } } : { kind: 'rejected', reason: 'unavailable' };
    }
    if (intent.type === 'attack' || intent.type === 'useMove') {
      const angle = FACINGS.indexOf(leader.facing) * Math.PI / 4; const pos = leader.placement.position;
      const target = intent.type === 'attack' && intent.targetId ? session.actors[intent.targetId] : Object.values(session.actors).find(actor => actor.placement.kind === 'map' && actor.placement.position.x === pos.x + Math.round(Math.sin(angle)) && actor.placement.position.z === pos.z - Math.round(Math.cos(angle)));
      if (intent.type === 'attack' && leader.conditions.cringe?.statusId !== 'confused' && target && (target.affiliation !== 'hostile' || target.placement.kind !== 'map' || !canMeleeAttack(navActor(leader), session.floor, target.placement.position, nav))) return { kind: 'rejected', reason: 'unavailable' };
      const selector = target ? /** @type {const} */ ({ kind: 'actor', actorId: target.actorId }) : /** @type {const} */ ({ kind: 'facing' });
      if (intent.type === 'attack') return { kind: 'action', action: { kind: 'attack', actorId: leader.actorId, target: selector } };
      if (intent.actorId !== leader.actorId) return { kind: 'rejected', reason: 'unavailable' };
      const slot = leader.moves.slots.find(slot => slot?.moveSlotId === intent.moveSlotId); const pp = leader.battleMoves.slots.find(slot => slot.moveSlotId === intent.moveSlotId);
      if (!slot || !pp || pp.currentPp === 0 || pp.sealed) return { kind: 'rejected', reason: 'unavailable' };
      if (leader.moves.links.some(link => link.includes(slot.moveSlotId)) || !supportedMove(catalogs, slot.moveId)) return { kind: 'content-blocked', requirement: 'move-effect-not-supported' };
      return { kind: 'action', action: { kind: 'move-use', actorId: leader.actorId, moveSlotId: slot.moveSlotId, moveId: slot.moveId, target: selector } };
    }
    return { kind: 'rejected', reason: 'invalid-command' };
  } };
  return { friendAction: friendHandler(catalogs, authored), steelRewardChoice: steelRewardHandler(authored), ...work, ...townHandlers(catalogs, authored), beginMorning: morningHandler(authored), submitSceneName: nameHandler(authored), ackScene: sceneHandler(authored, catalogs, tutorialSaved), move: { plan(state,intent) { return intent.type === 'move' && friendsGroundReady(state) ? { kind: 'mutation' } : dungeonAction.plan(state,intent); }, apply(context,intent) { return intent.type === 'move' && moveFriendsGround(context,authored,intent.dx,intent.dz) ? { kind: 'changed', resumeDungeon: false } : { kind: 'rejected', reason: 'unavailable' }; } }, wait: dungeonAction, attack: { plan(state, intent) { return intent.type === 'attack' && facingJobClient(state, catalogs) ? { kind: 'mutation' } : dungeonAction.plan(state, intent); }, apply(context) { return work.workAction?.apply?.(context, { type: 'workAction', order: { kind: 'client-talk' } }) ?? { kind: 'rejected', reason: 'unavailable' }; } }, useMove: dungeonAction, setMove: setMoveHandler, useItem: dungeonAction, throwItem: dungeonAction, equipItem: dungeonAction, useStairs: dungeonAction, giveUp: dungeonAction,
    presentation: { plan: () => ({ kind: 'presentation' }) },
    advance: { plan: state => automaticTurnReady(state) ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' }, apply: () => ({ kind: 'changed', resumeDungeon: true }) },
    enterDungeon: { plan(state, intent) { if (intent.type !== 'enterDungeon' || !['tiny-woods', T.dungeonId, STEEL.dungeonId].includes(intent.dungeonId)) return { kind: 'content-blocked', requirement: 'dungeon-entry-not-supported' }; const reason = admission(catalogs, state, intent.dungeonId); return reason ? { kind: 'content-blocked', requirement: reason } : { kind: 'mutation' }; }, apply(context, intent) { if (intent.type !== 'enterDungeon') return { kind: 'rejected', reason: 'invalid-command' }; if (intent.dungeonId === STEEL.dungeonId && !workReady(context.state)) { beginSteelTravel(context, authored); return { kind: 'changed', resumeDungeon: false }; } const ordinary = workReady(context.state); if (ordinary && context.state.earlyWork) (context.state.friends ? refreshFriendJobBoard : refreshJobBoard)(context.state, context.state.earlyWork); enterOpening(context, catalogs, authored, intent.dungeonId, ordinary); return { kind: 'changed', resumeDungeon: true }; } },
    face: { plan(state, intent) { if (intent.type !== 'face' || !leaderInputReady(state) || ![-1, 0, 1].includes(intent.dx) || ![-1, 0, 1].includes(intent.dz) || !intent.dx && !intent.dz) return { kind: 'rejected', reason: 'unavailable' }; return { kind: 'mutation' }; }, apply(context, intent) { const session = context.state.session; const actor = session?.actors[session.leaderActorId]; if (!actor || intent.type !== 'face') return { kind: 'rejected', reason: 'unavailable' }; const next = facing(intent.dx, intent.dz); if (actor.facing === next) return { kind: 'unchanged' }; actor.facing = next; return { kind: 'changed', resumeDungeon: false }; } },
  };
}
