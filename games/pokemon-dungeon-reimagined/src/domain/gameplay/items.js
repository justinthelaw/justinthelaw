import { useGinseng } from './move-menu.js';
import { damageHp } from './hp-damage.js';
import { sleepSeed, refreshSpeed } from './conditions.js';
import { finishDamage } from './combat.js';
import { throwRock } from './projectiles.js';
import { canMeleeAttack } from '../navigation/geometry.js';
import { navActor, navigationContext } from './support.js';
import { receiveRewardItem } from './reward-items.js';
import { value, quantity, maxHp, blocked, FACINGS } from './support.js';

/** Source item facts: Oran heals100; Oran/Pecha/Rawst each restore5 Belly.
 * Deletion precedes the effect, including a full-resource ineffective use.
 * @param {import('../turns/types.js').MutationContext} context @param {import('../../contracts/campaign.js').ResolvedAction & {kind:'item'}} action @param {import('./support.js').Catalogs} catalogs */
export function useDungeonItem(context, action, catalogs) {
  const state = context.state; const session = state.session; const actor = session?.actors[action.actorId];
  const item = state.items[action.itemInstanceId]; const bag = session ? [state.containers[session.inventory], actor ? state.containers[actor.heldContainerId] : null].find(container => container?.itemIds.includes(action.itemInstanceId)) : null;
  if (!session || !actor || !item || !bag?.itemIds.includes(item.itemInstanceId) || action.operation !== 'use' && action.operation !== 'throw' || action.target.kind !== 'self' || !USABLE_ITEMS.includes(item.template.itemId)) return blocked('item-action-not-supported');
  if (item.template.sticky) { context.emit({ type: 'message', messageId: 'item-sticky' }); return; }
  if (item.quantity > 1) item.quantity--;
  else { bag.itemIds.splice(bag.itemIds.indexOf(item.itemInstanceId), 1); delete state.items[item.itemInstanceId]; }
  if (item.template.itemId === 'item-gravelerock') { throwRock(context, actor, item, catalogs); context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId }); return; }
  const apple = item.template.itemId === 'item-apple' || item.template.itemId === 'item-big-apple';
  if (apple && Math.trunc(value(actor.resources.belly)) >= Math.trunc(value(actor.resources.maxBelly))) {
    actor.resources.maxBelly = quantity(Math.min(200, value(actor.resources.maxBelly) + (item.template.itemId === 'item-big-apple' ? 10 : 5))); actor.resources.belly = actor.resources.maxBelly; actor.gains.maxBelly = quantity(value(actor.resources.maxBelly) - 100);
  }
  const raw = Math.min(value(actor.resources.maxBelly) * 65536, value(actor.resources.belly) * 65536 + (apple ? item.template.itemId === 'item-big-apple' ? 100 : 50 : 5) * 65536);
  actor.resources.belly = quantity(raw, 65536);
  if (item.template.itemId === 'item-max-elixir') for (const slot of actor.moves.slots) if (slot) {
    const battle = actor.battleMoves.slots.find(row => row.moveSlotId === slot.moveSlotId);
    if (battle) battle.currentPp = catalogs.effects.getMove(slot.moveId).numeric.pp;
  }
  if (item.template.itemId === 'item-oran-berry') actor.resources.hp = Math.min(maxHp(actor), actor.resources.hp + 100);
  if (item.template.itemId === 'item-pecha-berry' && ['poisoned', 'badly-poisoned'].includes(actor.conditions.burn?.statusId ?? '') || item.template.itemId === 'item-rawst-berry' && actor.conditions.burn?.statusId === 'burn') actor.conditions.burn = null;
  if (item.template.itemId === 'item-cheri-berry' && actor.conditions.burn?.statusId === 'paralysis') { actor.conditions.burn = null; refreshSpeed(actor, catalogs); }
  if (item.template.itemId === 'item-ginseng') useGinseng(context, actor, catalogs);
  if (item.template.itemId === 'item-sleep-seed') sleepSeed(context, actor, catalogs);
  if (item.template.itemId === 'item-blast-seed' && actor.placement.kind === 'map') {
    const angle = FACINGS.indexOf(actor.facing) * Math.PI / 4, pos = actor.placement.position;
    const target = Object.values(session.actors).find(other => other.placement.kind === 'map' && other.placement.position.x === pos.x + Math.round(Math.sin(angle)) && other.placement.position.z === pos.z - Math.round(Math.cos(angle)));
    if (target?.placement.kind === 'map' && canMeleeAttack(navActor(actor), session.floor, target.placement.position, navigationContext(session, catalogs))) {
      if (target.conditions.sleep?.duration.kind === 'indefinite') target.conditions.sleep = null;
      damageHp(target, session.dungeonId === 'mt-steel' && session.floor.location.kind === 'boss' ? 30 : 45); finishDamage(context, target, catalogs, actor);
      context.emit({ type: 'attackResolved', actorId: actor.actorId, targetId: target.actorId, outcome: 'hit' });
    }
  }
  context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId }); context.emit({ type: 'message', messageId: 'berry-used' });
}

/** Finite supported use surface. Eating Reviver Seed has only the native seed
 * Belly effect; automatic revival is owned by the shared faint boundary. */
export const USABLE_ITEMS = Object.freeze(['item-oran-berry', 'item-pecha-berry', 'item-rawst-berry', 'item-cheri-berry', 'item-apple', 'item-big-apple', 'item-max-elixir', 'item-reviver-seed', 'item-plain-seed', 'item-sleep-seed', 'item-blast-seed', 'item-gravelerock', 'item-ginseng']);
/** Native pickup chooses largest nonfull same-sticky stack, then largest with
 * either sticky flag. Native saturation discards excess over99; no second stack.
 * @param {import('../turns/types.js').MutationContext} context @param {import('../../contracts/campaign.js').SessionActor} actor */
export function pickup(context, actor) {
  const state = context.state, s = state.session;
  if (!s || actor.actorId !== s.leaderActorId || actor.placement.kind !== 'map') return;
  const pos = actor.placement.position;
  const toolbox = state.progress.appliedGrants.some(row => row.grantId === 'browser-starter-set');
  const bag = state.containers[toolbox ? s.inventory : actor.heldContainerId]; if (!bag) return blocked('pickup-container');
  for (const container of Object.values(state.containers)) {
    if (container.owner.kind !== 'floor' || container.owner.mapId !== s.floor.mapId || container.owner.position.x !== pos.x || container.owner.position.z !== pos.z) continue;
    for (const id of [...container.itemIds]) {
      const item = state.items[id]; if (!item) return blocked('pickup-item');
      if (item.template.itemId === 'item-poke') { s.carriedMoney = Math.min(99999, s.carriedMoney + item.quantity); delete state.items[id]; }
      else {
        const stacks = item.template.itemId === 'item-gravelerock' ? bag.itemIds.flatMap(key => state.items[key] ?? []).filter(row => row.template.itemId === item.template.itemId && row.quantity < 99).sort((a,b) => b.quantity - a.quantity) : [];
        const merge = stacks.find(row => row.template.sticky === item.template.sticky) ?? stacks[0];
        if (merge) { merge.quantity = Math.min(99, merge.quantity + item.quantity); merge.template.sticky ||= item.template.sticky; delete state.items[id]; }
        else { if (bag.itemIds.length >= (toolbox ? 20 : 1)) continue; bag.itemIds.push(id); }
      }
      container.itemIds.splice(container.itemIds.indexOf(id), 1); context.emit({ type: 'itemChanged', itemInstanceId: id });
    }
    if (!container.itemIds.length) delete state.containers[container.containerId];
  }
}
/** Source scripted item rewards overflow into per-item storage. One caller-owned
 * receipt commits all item/money changes atomically. @param {import('../turns/types.js').MutationContext} context @param {string} id */
export function grantItem(context, id) {
  const grant = { template: { itemId: /** @type {import('../../contracts.js').ItemId} */ (id), sticky: false, payload: /** @type {const} */ ({ kind: 'none' }) }, quantity: 1 };
  if (receiveRewardItem(context, grant) === 'choice') return blocked('reward-storage-choice');
}
