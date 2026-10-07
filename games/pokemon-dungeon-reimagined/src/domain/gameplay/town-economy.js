import { allocate, clone } from './support.js';

/** Source-qualified bank/storage transaction primitives; plan/TOWN-JOBS.md.
 * Called only inside an Adventure draft, after the town service access check.
 * Selection and cancellation are presentation-only. Recheck on confirmation.
 * @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {{kind:'bank',operation:'deposit'|'withdraw',amount:number}|{kind:'storage-deposit',itemInstanceId:import('../../contracts.js').ItemInstanceId}|{kind:'storage-withdraw',itemId:import('../../contracts.js').ItemId,quantity:number}} EconomyOrder
 */

/** Native bank selector bounds both accounts. @param {Snapshot} state
 * @param {'deposit'|'withdraw'} operation */
export function bankLimit(state, operation) {
  return operation === 'deposit' ? Math.min(state.economy.carriedMoney, 9999999 - state.economy.bankedMoney)
    : Math.min(state.economy.bankedMoney, 99999 - state.economy.carriedMoney);
}
/** @param {import('./support.js').Catalogs} catalogs @param {string} itemId */
function thrown(catalogs, itemId) { return ['thrown_line', 'thrown_arc'].includes(catalogs.effects.getItem(itemId).category); }

/** No clamping: a confirmed transfer either fits in full or changes nothing.
 * Storage deposits consume a complete selected toolbox slot. Withdrawal uses a
 * fresh slot even for projectiles, as AddHeldItemToInventory does in town.
 * @param {Snapshot} state @param {EconomyOrder} order @param {import('./support.js').Catalogs} catalogs
 * @returns {string|null} */
export function economyOrderProblem(state, order, catalogs) {
  if (state.mode !== 'town' || state.session || state.pendingScene || state.pendingResult) return 'Finish the current adventure before using a service.';
  if (order.kind === 'bank') {
    if (!['deposit', 'withdraw'].includes(order.operation) || !Number.isSafeInteger(order.amount) || order.amount < 1) return 'Choose a positive whole amount.';
    return order.amount <= bankLimit(state, order.operation) ? null : 'That amount exceeds your balance or the receiving account limit.';
  }
  const bag = state.containers[state.economy.toolbox];
  if (!bag || bag.owner.kind !== 'campaign-toolbox') return 'Your toolbox is unavailable.';
  if (order.kind === 'storage-deposit') {
    const item = state.items[order.itemInstanceId];
    if (!item || !bag.itemIds.includes(order.itemInstanceId)) return 'Select an item in your toolbox.';
    if (['item-nothing', 'item-poke', 'item-used-tm'].includes(item.template.itemId) || item.template.payload.kind === 'machine' && item.template.payload.state === 'used') return 'Money and Used TMs cannot be stored.';
    const count = state.economy.storedItems.find(row => row.template.itemId === item.template.itemId)?.count ?? 0;
    return count + item.quantity <= 999 ? null : 'Storage can hold at most 999 units of each item.';
  }
  const stored = state.economy.storedItems.find(row => row.template.itemId === order.itemId);
  if (!stored) return 'That item is no longer in storage.';
  if (bag.itemIds.length >= 20) return 'Make space in your 20-slot toolbox first.';
  const maximum = thrown(catalogs, order.itemId) ? Math.min(99, stored.count) : 1;
  return Number.isSafeInteger(order.quantity) && order.quantity >= 1 && order.quantity <= maximum ? null : `Choose between 1 and ${maximum}.`;
}

/** The caller owns the access predicate and synchronous transaction. This
 * function independently rechecks balances/ownership before its first write.
 * @param {Context} context @param {EconomyOrder} order @param {import('./support.js').Catalogs} catalogs
 * @returns {import('../turns/types.js').MutationResult} */
export function applyEconomyOrder(context, order, catalogs) {
  const state = context.state;
  if (economyOrderProblem(state, order, catalogs)) return { kind: 'rejected', reason: 'unavailable' };
  if (order.kind === 'bank') {
    const signed = order.operation === 'deposit' ? order.amount : -order.amount;
    state.economy.carriedMoney -= signed; state.economy.bankedMoney += signed;
  } else if (order.kind === 'storage-deposit') {
    const item = state.items[order.itemInstanceId], bag = state.containers[state.economy.toolbox];
    if (!item || !bag) return { kind: 'rejected', reason: 'unavailable' };
    const stored = state.economy.storedItems.find(row => row.template.itemId === item.template.itemId);
    if (stored) stored.count += item.quantity;
    else state.economy.storedItems.push({ template: { ...clone(item.template), sticky: false }, count: item.quantity });
    bag.itemIds.splice(bag.itemIds.indexOf(item.itemInstanceId), 1); delete state.items[item.itemInstanceId];
    context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId });
  } else {
    const stored = state.economy.storedItems.find(row => row.template.itemId === order.itemId), bag = state.containers[state.economy.toolbox];
    if (!stored || !bag) return { kind: 'rejected', reason: 'unavailable' };
    const itemInstanceId = allocate(state, 'item-instance');
    state.items[itemInstanceId] = { itemInstanceId, template: clone(stored.template), quantity: order.quantity, shopLotId: null };
    bag.itemIds.push(itemInstanceId); stored.count -= order.quantity;
    if (!stored.count) state.economy.storedItems.splice(state.economy.storedItems.indexOf(stored), 1);
    context.emit({ type: 'itemChanged', itemInstanceId });
  }
  context.emit({ type: 'message', messageId: 'town-transfer-complete' });
  return { kind: 'changed', resumeDungeon: false };
}
