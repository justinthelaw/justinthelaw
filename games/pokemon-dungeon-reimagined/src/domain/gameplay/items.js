import { value, quantity, maxHp, blocked } from './support.js';

/** Source item facts: Oran heals100; Oran/Pecha/Rawst each restore5 Belly.
 * Deletion precedes the effect, including a full-resource ineffective use.
 * @param {import('../turns/types.js').MutationContext} context @param {import('../../contracts/campaign.js').ResolvedAction & {kind:'item'}} action */
export function useBerry(context, action) {
  const state = context.state; const session = state.session; const actor = session?.actors[action.actorId];
  const item = state.items[action.itemInstanceId]; const bag = session ? [state.containers[session.inventory], actor ? state.containers[actor.heldContainerId] : null].find(container => container?.itemIds.includes(action.itemInstanceId)) : null;
  if (!session || !actor || !item || !bag?.itemIds.includes(item.itemInstanceId) || action.operation !== 'use' || action.target.kind !== 'self' || !['item-oran-berry', 'item-pecha-berry', 'item-rawst-berry'].includes(item.template.itemId)) return blocked('item-action-not-supported');
  if (item.template.sticky) { context.emit({ type: 'message', messageId: 'item-sticky' }); return; }
  bag.itemIds.splice(bag.itemIds.indexOf(item.itemInstanceId), 1); delete state.items[item.itemInstanceId];
  const raw = Math.min(value(actor.resources.maxBelly) * 65536, value(actor.resources.belly) * 65536 + 5 * 65536);
  actor.resources.belly = quantity(raw, 65536);
  if (item.template.itemId === 'item-oran-berry') actor.resources.hp = Math.min(maxHp(actor), actor.resources.hp + 100);
  if (item.template.itemId === 'item-pecha-berry' && ['poisoned', 'badly-poisoned'].includes(actor.conditions.burn?.statusId ?? '') || item.template.itemId === 'item-rawst-berry' && actor.conditions.burn?.statusId === 'burn') actor.conditions.burn = null;
  context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId }); context.emit({ type: 'message', messageId: 'berry-used' });
}
