import { throwRock } from './projectiles.js';
import { consumeItemOrigin, applyDungeonItemEffect, USABLE_ITEMS } from './item-effects.js';
import { receiveRewardItem } from './reward-items.js';
import { maxHp, ability, blocked } from './support.js';
export { USABLE_ITEMS } from './item-effects.js';

/** Origin/operation admission stays separate from recipient effects. Existing
 * self ingestion and player Gravelerock arc search remain the finite surface.
 * @param {import('../turns/types.js').MutationContext} context @param {import('../../contracts/campaign.js').ResolvedAction & {kind:'item'}} action @param {import('./support.js').Catalogs} catalogs */
export function useDungeonItem(context, action, catalogs) {
  const state = context.state; const session = state.session; const actor = session?.actors[action.actorId];
  const item = state.items[action.itemInstanceId]; const origin = session ? [state.containers[session.inventory], actor ? state.containers[actor.heldContainerId] : null].find(container => container?.itemIds.includes(action.itemInstanceId)) : null;
  if (!session || !actor || !item || !origin?.itemIds.includes(item.itemInstanceId) || action.operation !== 'use' && action.operation !== 'throw' || action.target.kind !== 'self' || !USABLE_ITEMS.includes(item.template.itemId)) return blocked('item-action-not-supported');
  if (item.template.sticky) { context.emit({ type: 'message', messageId: 'item-sticky' }); return; }
  const projectile = item.template.itemId === 'item-gravelerock';
  if (!projectile && actor.auxiliaryConditions.muzzled && ['food_gummies', 'berries_seeds_vitamins'].includes(catalogs.effects.getItem(item.template.itemId).category)) { context.emit({ type: 'message', messageId: 'item-muzzled' }); return; }
  const detached = consumeItemOrigin(context, origin, item, projectile);
  if (projectile) throwRock(context, actor, detached, catalogs);
  else { applyDungeonItemEffect(context, actor, actor, detached.payload, 'eaten', catalogs); context.emit({ type: 'message', messageId: 'berry-used' }); }
  context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId });
}

/** Native pickup chooses largest nonfull same-sticky stack, then largest with
 * either sticky flag. Native saturation discards excess over99; no second stack.
 * @param {import('../turns/types.js').MutationContext} context @param {import('../../contracts/campaign.js').SessionActor} actor @param {import('./support.js').Catalogs} catalogs */
export function pickup(context, actor, catalogs) {
  const state = context.state, s = state.session;
  if (!s || actor.placement.kind !== 'map') return;
  if (actor.actorId !== s.leaderActorId) return pickupCompanion(context, actor, catalogs);
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
/** Completed-movement acquisition, pinned Red MonTryPickUpItem429..576.
 * Candidates keep native bag order, then this roster companion's held slot.
 * Special actors/shop lots and stationary pickup are outside this owner.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../contracts/campaign.js').SessionActor} actor
 * @param {import('./support.js').Catalogs} catalogs */
function pickupCompanion(context, actor, catalogs) {
  const state = context.state, s = state.session;
  if (!s || s.scheduler.continuation.terminal !== 'none' || actor.binding.kind !== 'roster' || !state.roster[actor.binding.pokemonId] || actor.affiliation !== 'team' || actor.placement.kind !== 'map' || actor.placement.mapId !== s.floor.mapId || actor.resources.hp <= 0) return;
  // Get Away and Avoid Trouble are distinct from the strict Run Away threshold.
  // No terrified-turns field is admitted; no unrelated status stands in for it.
  if (ability(actor, catalogs, 'Run Away') && actor.resources.hp < Math.trunc(maxHp(actor) / 2) || actor.tacticId === 'tactic-get-away' || actor.tacticId === 'tactic-avoid-trouble' && actor.resources.hp <= Math.trunc(maxHp(actor) / 2)) return;
  const held = state.containers[actor.heldContainerId];
  if (held?.owner.kind !== 'actor-held' || held.owner.actorId !== actor.actorId || held.owner.sessionId !== s.sessionId) return blocked('pickup-held-owner');
  const toolbox = state.progress.appliedGrants.some(row => row.grantId === 'browser-starter-set');
  const bag = toolbox ? state.containers[s.inventory] : null;
  if (toolbox && (bag?.owner.kind !== 'session-toolbox' || bag.owner.sessionId !== s.sessionId)) return blocked('pickup-toolbox-owner');
  const candidates = bag ? [bag, held] : [held];
  const pos = actor.placement.position;
  for (const floor of Object.values(state.containers)) {
    const owner = floor.owner;
    if (owner.kind !== 'floor' || owner.sessionId !== s.sessionId || owner.mapId !== s.floor.mapId || owner.placement !== 'ground' || owner.position.x !== pos.x || owner.position.z !== pos.z) continue;
    for (const id of [...floor.itemIds]) {
      const item = state.items[id]; if (!item) return blocked('pickup-item');
      if (item.shopLotId !== null) continue;
      const category = catalogs.effects.getItem(item.template.itemId).category;
      if (category === 'poke') { s.carriedMoney = Math.min(99999, s.carriedMoney + item.quantity); delete state.items[id]; }
      else {
        /** @type {import('../../contracts/campaign.js').ItemInstance | null} */ let merge = null;
        if (category === 'thrown_line' || category === 'thrown_arc') {
          const stacks = candidates.flatMap(container => container.itemIds.map(key => state.items[key] ?? blocked('pickup-candidate-item')));
          // Strict comparisons preserve first-candidate ties in both passes.
          for (const sameSticky of [true, false]) {
            for (const row of stacks) if (row.shopLotId === null && row.template.itemId === item.template.itemId && row.quantity < 99 && (!sameSticky || row.template.sticky === item.template.sticky) && (!merge || row.quantity > merge.quantity)) merge = row;
            if (merge) break;
          }
        }
        if (merge) { merge.quantity = Math.min(99, merge.quantity + item.quantity); merge.template.sticky ||= item.template.sticky; delete state.items[id]; }
        else {
          const destination = candidates.find(container => container.itemIds.length < (container === bag ? 20 : 1));
          if (!destination) continue;
          destination.itemIds.push(id);
        }
      }
      floor.itemIds.splice(floor.itemIds.indexOf(id), 1); context.emit({ type: 'itemChanged', itemInstanceId: id });
    }
    if (!floor.itemIds.length) delete state.containers[floor.containerId];
  }
}
/** Source scripted item rewards overflow into per-item storage. One caller-owned
 * receipt commits all item/money changes atomically. @param {import('../turns/types.js').MutationContext} context @param {string} id */
export function grantItem(context, id) {
  const grant = { template: { itemId: /** @type {import('../../contracts.js').ItemId} */ (id), sticky: false, payload: /** @type {const} */ ({ kind: 'none' }) }, quantity: 1 };
  if (receiveRewardItem(context, grant) === 'choice') return blocked('reward-storage-choice');
}
