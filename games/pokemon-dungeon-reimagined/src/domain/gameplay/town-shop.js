import { cleanTemplate } from '../../../content/state/item-template.js';
import { TOWN_SHOP_POOLS } from '../../../content/authored/town-shop-facts.js';
import { allocate, clone, draw } from './support.js';

/** @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {{kind:'buy',serviceId:string,lot:number,stockRevision:number}|{kind:'sell',itemInstanceId:import('../../contracts.js').ItemInstanceId}} ShopOrder */

/** Actual native shop price, without a stickiness discount. Projectile prices
 * multiply units. Unsellable specials and zero-priced records remain excluded.
 * @param {Catalogs} catalogs @param {string} id @param {number} quantity @param {'buy'|'sell'} operation */
export function shopPrice(catalogs, id, quantity, operation) {
  const item = catalogs.effects.getItem(id);
  if (!item.availabilityEvidence.buyAndSellAllowed) return null;
  const units = ['thrown_line', 'thrown_arc'].includes(item.category) ? quantity : 1;
  return (operation === 'buy' ? item.buyPrice : item.sellPrice) * units;
}
/** Refresh only at a source day initialization. Slots remain distinct even when
 * identities repeat. RNG is persisted with the enclosing transaction.
 * @param {import('../../contracts/campaign.js').CampaignState} state @param {Catalogs} catalogs */
export function refreshTownShops(state, catalogs) {
  state.town.serviceStock = TOWN_SHOP_POOLS.map(pool => {
    const lots = Array.from({ length: pool.slots }, () => {
      const categoryRoll = draw(state, 9999, 'jobsRewards'), itemRoll = draw(state, 9999, 'jobsRewards');
      const category = pool.categories.find(row => row.threshold && row.threshold >= categoryRoll)?.category;
      const chosen = pool.items.find(row => row.category === category && row.threshold && row.threshold >= itemRoll);
      const itemId = chosen?.itemId ?? 'item-plain-seed', item = catalogs.effects.getItem(itemId);
      const range = item.spawnStackRange;
      const quantity = ['thrown_line', 'thrown_arc'].includes(item.category) && range ? (range[0] ?? 0) + draw(state, (range[1] ?? 0) - (range[0] ?? 0), 'jobsRewards') : 1;
      return { template: cleanTemplate(catalogs, itemId), quantity };
    });
    // Native ordering uses item display order, then decreasing quantity. The order column
    // is joined from the pinned native item parameter table, not item identity.
    lots.sort((a,b) => (pool.items.find(row => row.itemId === a.template.itemId)?.order ?? 0) - (pool.items.find(row => row.itemId === b.template.itemId)?.order ?? 0) || b.quantity - a.quantity);
    return { kind: /** @type {const} */ ('lots'), serviceId: pool.serviceId, stockRevision: state.revision + 1, lots };
  });
}
/** @param {Snapshot} state @param {ShopOrder} order @param {Catalogs} catalogs @returns {string|null} */
export function shopOrderProblem(state, order, catalogs) {
  if (state.mode !== 'town' || state.session || state.pendingScene || state.pendingResult) return 'Finish the current adventure before shopping.';
  const bag = state.containers[state.economy.toolbox]; if (!bag) return 'Your toolbox is unavailable.';
  if (order.kind === 'buy') {
    const stock = state.town.serviceStock.find(row => row.serviceId === order.serviceId);
    if (!stock || !('lots' in stock) || stock.stockRevision !== order.stockRevision || !Number.isSafeInteger(order.lot)) return 'The stock has changed. Select again.';
    const lot = stock.lots[order.lot]; if (!lot) return 'That lot has already been sold.';
    const price = shopPrice(catalogs, lot.template.itemId, lot.quantity, 'buy');
    if (price === null) return 'This item cannot be bought.';
    if (bag.itemIds.length >= 20) return 'Make room in your 20-slot toolbox first.';
    return state.economy.carriedMoney >= price ? null : 'You do not have enough carried Poké.';
  }
  const item = state.items[order.itemInstanceId];
  if (!item || !bag.itemIds.includes(order.itemInstanceId)) return 'Select an item in your toolbox.';
  const price = shopPrice(catalogs, item.template.itemId, item.quantity, 'sell');
  return price === null ? 'This item cannot be sold.' : price + state.economy.carriedMoney > 99999 ? 'Deposit some money before selling this item.' : null;
}
/** Whole-lot purchase or selected-slot sale. No partial mutation on a rejected
 * order; confirmation and cancellation are owned by the service UI.
 * @param {import('../turns/types.js').MutationContext} context @param {ShopOrder} order @param {Catalogs} catalogs
 * @returns {import('../turns/types.js').MutationResult} */
export function applyShopOrder(context, order, catalogs) {
  const state = context.state;
  if (shopOrderProblem(state, order, catalogs)) return { kind: 'rejected', reason: 'unavailable' };
  const bag = state.containers[state.economy.toolbox]; if (!bag) return { kind: 'rejected', reason: 'unavailable' };
  if (order.kind === 'buy') {
    const stock = state.town.serviceStock.find(row => row.serviceId === order.serviceId);
    if (!stock || !('lots' in stock)) return { kind: 'rejected', reason: 'unavailable' };
    const lot = stock.lots[order.lot]; if (!lot) return { kind: 'rejected', reason: 'unavailable' };
    const price = shopPrice(catalogs, lot.template.itemId, lot.quantity, 'buy'); if (price === null) return { kind: 'rejected', reason: 'unavailable' };
    const itemInstanceId = allocate(state, 'item-instance');
    state.items[itemInstanceId] = { itemInstanceId, template: clone(lot.template), quantity: lot.quantity, shopLotId: null }; bag.itemIds.push(itemInstanceId);
    state.economy.carriedMoney -= price; stock.lots.splice(order.lot, 1); stock.stockRevision = state.revision + 1;
    context.emit({ type: 'itemChanged', itemInstanceId });
  } else {
    const item = state.items[order.itemInstanceId]; if (!item) return { kind: 'rejected', reason: 'unavailable' };
    const price = shopPrice(catalogs, item.template.itemId, item.quantity, 'sell'); if (price === null) return { kind: 'rejected', reason: 'unavailable' };
    state.economy.carriedMoney += price; bag.itemIds.splice(bag.itemIds.indexOf(item.itemInstanceId), 1); delete state.items[item.itemInstanceId];
    context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId });
  }
  context.emit({ type: 'message', messageId: 'town-purchase-complete' }); return { kind: 'changed', resumeDungeon: false };
}
