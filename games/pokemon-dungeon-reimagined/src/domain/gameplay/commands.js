import { workHandlers, workReady, facingJobClient } from './work.js';
import { refreshJobBoard } from './job-records.js';
import { townHandlers } from './town.js';
import { USABLE_ITEMS } from './items.js';
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
    if (!session || state.earlyWork?.clientPrompt || state.mode !== 'dungeon' || session.scheduler.kind !== 'ready' || leader?.placement.kind !== 'map') return { kind: 'rejected', reason: 'unavailable' };
    const nav = navigationContext(session, catalogs);
    if (intent.type === 'move') {
      if (![-1, 0, 1].includes(intent.dx) || ![-1, 0, 1].includes(intent.dz) || !intent.dx && !intent.dz) return { kind: 'rejected', reason: 'invalid-command' };
      const destination = { x: leader.placement.position.x + intent.dx, z: leader.placement.position.z + intent.dz };
      if (movementPlan(session, leader, destination, catalogs).kind === 'blocked') return { kind: 'rejected', reason: 'unavailable' };
      return { kind: 'action', action: { kind: 'move', actorId: leader.actorId, destination } };
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
      if (target && (target.affiliation !== 'hostile' || target.placement.kind !== 'map' || !canMeleeAttack(navActor(leader), session.floor, target.placement.position, nav))) return { kind: 'rejected', reason: 'unavailable' };
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
  return { ...work, ...townHandlers(catalogs, authored), beginMorning: morningHandler(authored), submitSceneName: nameHandler(authored), ackScene: sceneHandler(authored, catalogs, tutorialSaved), move: dungeonAction, wait: dungeonAction, attack: { plan(state, intent) { return intent.type === 'attack' && facingJobClient(state, catalogs) ? { kind: 'mutation' } : dungeonAction.plan(state, intent); }, apply(context) { return work.workAction?.apply?.(context, { type: 'workAction', order: { kind: 'client-talk' } }) ?? { kind: 'rejected', reason: 'unavailable' }; } }, useMove: dungeonAction, useItem: dungeonAction, useStairs: dungeonAction, giveUp: dungeonAction,
    presentation: { plan: () => ({ kind: 'presentation' }) },
    advance: { plan: state => state.mode === 'dungeon' && !state.earlyWork?.clientPrompt && state.session?.scheduler.kind === 'ready' ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' }, apply: () => ({ kind: 'changed', resumeDungeon: true }) },
    enterDungeon: { plan(state, intent) { if (intent.type !== 'enterDungeon' || !['tiny-woods', T.dungeonId].includes(intent.dungeonId)) return { kind: 'content-blocked', requirement: 'dungeon-entry-not-supported' }; const reason = admission(catalogs, state, intent.dungeonId); return reason ? { kind: 'content-blocked', requirement: reason } : { kind: 'mutation' }; }, apply(context, intent) { if (intent.type !== 'enterDungeon') return { kind: 'rejected', reason: 'invalid-command' }; const ordinary = workReady(context.state); if (ordinary && context.state.earlyWork) refreshJobBoard(context.state, context.state.earlyWork); enterOpening(context, catalogs, authored, intent.dungeonId, ordinary); return { kind: 'changed', resumeDungeon: true }; } },
    face: { plan(state, intent) { if (intent.type !== 'face' || state.earlyWork?.clientPrompt || !state.session || state.mode !== 'dungeon' || ![-1, 0, 1].includes(intent.dx) || ![-1, 0, 1].includes(intent.dz) || !intent.dx && !intent.dz) return { kind: 'rejected', reason: 'unavailable' }; return { kind: 'mutation' }; }, apply(context, intent) { const session = context.state.session; const actor = session?.actors[session.leaderActorId]; if (!actor || intent.type !== 'face') return { kind: 'rejected', reason: 'unavailable' }; const next = facing(intent.dx, intent.dz); if (actor.facing === next) return { kind: 'unchanged' }; actor.facing = next; return { kind: 'changed', resumeDungeon: false }; } },
  };
}
