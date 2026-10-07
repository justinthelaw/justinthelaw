import { blocked } from './support.js';
/** Leader Give/Take target gate from CheckVariousConditions. Confusion and
 * paralysis, Rage and Charge do not prevent this item operation. Native
 * projectile SET is not represented by any currently exposed item command.
 * @param {import('../../../content/navigation-types.js').ReadonlyData<import('../../contracts/campaign.js').SessionActor>} actor */
export function canTransferHeldItem(actor) {
  return (!actor.conditions.sleep || actor.conditions.sleep.statusId === 'sleepless') && !['frozen', 'petrified'].includes(actor.conditions.frozen?.statusId ?? '') && !['paused', 'infatuated'].includes(actor.conditions.cringe?.statusId ?? '') && (!actor.conditions.bide || ['charging', 'enraged'].includes(actor.conditions.bide.statusId));
}
/** @param {import('./support.js').Catalogs} catalogs @param {string} itemId */
export function supportedHeldItem(catalogs, itemId) {
  return ['item-pecha-scarf', 'item-twist-band'].includes(itemId) || catalogs.effects.getItem(itemId).heldEffects.every(effect => effect.op === 'no-held-effect');
}
/** A whole bag lot swaps with held ownership, using the freed bag slot even
 * when full. Taking requires a free slot. Sticky failure consumes the action.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../contracts/campaign.js').ResolvedAction & {kind:'item'}} action */
export function transferHeldItem(context, action) {
  const state = context.state, session = state.session, actor = session?.actors[action.actorId];
  if (!session || !actor || actor.actorId !== session.leaderActorId || action.target.kind !== 'self' || !canTransferHeldItem(actor)) return blocked('held-transfer-target');
  const bag = state.containers[session.inventory], held = state.containers[actor.heldContainerId], item = state.items[action.itemInstanceId];
  if (!bag || !held || !item) return blocked('held-transfer-owner');
  const current = held.itemIds[0] ? state.items[held.itemIds[0]] : null;
  if (current?.template.sticky) { context.emit({ type: 'message', messageId: 'item-sticky' }); return; }
  const index = bag.itemIds.indexOf(item.itemInstanceId);
  if (index >= 0) {
    bag.itemIds.splice(index, 1);
    if (current) bag.itemIds.push(current.itemInstanceId);
    held.itemIds = [item.itemInstanceId];
  } else if (current?.itemInstanceId === item.itemInstanceId) {
    if (bag.itemIds.length >= 20) { context.emit({ type: 'message', messageId: 'held-bag-full' }); return; }
    held.itemIds = []; bag.itemIds.push(item.itemInstanceId);
  } else return blocked('held-transfer-owner');
  context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId });
}
