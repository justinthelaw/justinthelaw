import { showWork } from './work.js';
import { TOWN } from '../../content/authored/town.js';
import { TEAM } from '../../content/authored/team-formation.js';
import { MORNING } from '../../content/authored/first-morning.js';
import { bankLimit, economyOrderProblem } from '../domain/gameplay/town-economy.js';
import { shopOrderProblem, shopPrice } from '../domain/gameplay/town-shop.js';
/** @typedef {import('../domain/gameplay/town-economy.js').EconomyOrder|import('../domain/gameplay/town-shop.js').ShopOrder} Order */
/** Complete selection/confirmation/cancel flow. Local forms never own money,
 * inventory, stock or story progress. Each send retains its shown snapshot.
 * @param {{snapshot:import('../contracts/campaign.js').CampaignSnapshot,catalogs:import('../domain/gameplay/support.js').Catalogs,view:ReturnType<typeof import('../ui/view.js').createView>,send:(intent:import('../domain/turns/types.js').Intent)=>void,menu:()=>void,open:()=>void}} options */
export function showTown({ snapshot, catalogs, view, send, menu, open }) {
  const atSquare = snapshot.town.mapDefinitionId === TOWN.square;
  const name = snapshot.town.mapDefinitionId === TOWN.post ? 'Pelipper Post Office' : atSquare ? 'Pokémon Square' : 'Rescue base';
  /** @param {string} id */ const itemName = id => catalogs.effects.getItem(id).name;
  /** @param {string} title @param {string} text @param {import('../ui/view.js').Action[]} actions @param {HTMLElement[]} [extra] */
  function show(title, text, actions, extra = []) {
    let token = Symbol('pending');
    token = view.show(title, text, actions.map(action => ({ ...action, run() { if (view.ownsPanel(token)) action.run(); } })), extra);
    open();
  }
  /** @param {Order} order @param {string} description @param {()=>void} back */
  function confirm(order, description, back) {
    const problem = order.kind === 'buy' || order.kind === 'sell' ? shopOrderProblem(snapshot, order, catalogs) : economyOrderProblem(snapshot, order, catalogs);
    show('Confirm transaction', problem ?? description, [
      { label: 'Confirm', disabled: !!problem, detail: problem ?? description, run: () => send({ type: 'townService', order }) },
      { label: 'Cancel', run: back },
    ]);
  }
  /** @param {string} title @param {number} maximum @param {(quantity:number)=>void} selected @param {()=>void} back */
  function quantity(title, maximum, selected, back) {
    const label = document.createElement('label'); label.textContent = `Amount (1–${maximum}) `;
    const input = document.createElement('input'); input.type = 'number'; input.min = '1'; input.max = String(maximum); input.step = '1'; input.value = String(maximum || 1); input.inputMode = 'numeric'; label.append(input);
    show(title, maximum ? 'Choose the amount, then review before confirming.' : 'There is no available balance or capacity for this transfer.', [
      { label: 'Review amount', disabled: maximum < 1, run() { const amount = input.valueAsNumber; if (!Number.isSafeInteger(amount) || amount < 1 || amount > maximum) { view.notify(`Enter a whole amount from 1 to ${maximum}.`); return; } selected(amount); } },
      { label: 'Cancel', run: back },
    ], [label]);
  }
  function bank() {
    show('Felicity Bank', `Carried: ${snapshot.economy.carriedMoney} Poké. Savings: ${snapshot.economy.bankedMoney} Poké. Deposits stay safe during expeditions.`, [
      .../** @type {const} */ (['deposit', 'withdraw']).map(operation => ({ label: operation === 'deposit' ? 'Deposit Poké' : 'Withdraw Poké', run: () => quantity(operation === 'deposit' ? 'Deposit' : 'Withdraw', bankLimit(snapshot, operation), amount => confirm({ kind: 'bank', operation, amount }, `${operation === 'deposit' ? 'Deposit' : 'Withdraw'} ${amount} Poké?`, bank), bank) })),
      { label: 'Back to square', run: home },
    ]);
  }
  const inventory = snapshot.containers[snapshot.economy.toolbox]?.itemIds.flatMap(id => snapshot.items[id] ?? []) ?? [];
  function storage() {
    show('Kangaskhan Storage', 'Stored items stay safe during expeditions. Select a toolbox slot to deposit, or a stored item to withdraw. Capacity is 999 units of each item.', [
      { label: 'Deposit items', run: deposits }, { label: 'Withdraw items', run: withdrawals }, { label: 'Back to square', run: home },
    ]);
  }
  function deposits() {
    show('Deposit an item', inventory.length ? 'Choose one complete toolbox slot.' : 'Your toolbox is empty.', [
      ...inventory.map(item => ({ label: `${itemName(item.template.itemId)} ×${item.quantity}`, run: () => confirm({ kind: 'storage-deposit', itemInstanceId: item.itemInstanceId }, `Store ${itemName(item.template.itemId)} ×${item.quantity}?`, deposits) })), { label: 'Cancel', run: storage },
    ]);
  }
  function withdrawals() {
    show('Withdraw an item', 'Each withdrawal needs one free toolbox slot.', [
      ...snapshot.economy.storedItems.map(item => ({ label: `${itemName(item.template.itemId)} ×${item.count}`, run() {
        const selected = (/** @type {number} */ amount) => confirm({ kind: 'storage-withdraw', itemId: item.template.itemId, quantity: amount }, `Withdraw ${itemName(item.template.itemId)} ×${amount}?`, withdrawals);
        if (['thrown_line','thrown_arc'].includes(catalogs.effects.getItem(item.template.itemId).category)) quantity('Withdraw projectiles', Math.min(99, item.count), selected, withdrawals);
        else selected(1);
      } })), { label: 'Cancel', run: storage },
    ]);
  }
  /** @param {string} serviceId */
  function shop(serviceId) {
    const stock = snapshot.town.serviceStock.find(row => row.serviceId === serviceId);
    const lots = stock && 'lots' in stock ? stock.lots : [];
    show(serviceId === 'kecleon-items' ? 'Kecleon Shop' : 'Kecleon Wares', `Carried: ${snapshot.economy.carriedMoney} Poké. Prices cover the entire lot. Stock remains sold until a new day. Some item effects are still in development; buying and storing them works.`, [
      ...lots.map((lot, index) => ({ label: `${itemName(lot.template.itemId)} ×${lot.quantity} · ${shopPrice(catalogs, lot.template.itemId, lot.quantity, 'buy')} Poké`, run: () => confirm({ kind: 'buy', serviceId, lot: index, stockRevision: stock?.stockRevision ?? -1 }, `Buy ${itemName(lot.template.itemId)} ×${lot.quantity} for ${shopPrice(catalogs, lot.template.itemId, lot.quantity, 'buy')} Poké?`, () => shop(serviceId)) })),
      { label: 'Sell items', run: selling }, { label: 'Back to square', run: home },
    ]);
  }
  function selling() {
    show('Sell an item', 'Choose a complete toolbox slot. Sold items do not become new shop stock.', [
      ...inventory.map(item => ({ label: `${itemName(item.template.itemId)} ×${item.quantity} · ${shopPrice(catalogs, item.template.itemId, item.quantity, 'sell') ?? 'Cannot sell'} Poké`, run: () => confirm({ kind: 'sell', itemInstanceId: item.itemInstanceId }, `Sell ${itemName(item.template.itemId)} ×${item.quantity} for ${shopPrice(catalogs, item.template.itemId, item.quantity, 'sell')} Poké?`, selling) })),
      { label: 'Cancel', run: home },
    ]);
  }
  /** @param {'board'|'jobs'|'mailbox'|'depart'} page */
  function jobs(page) { showWork({ snapshot, catalogs, view, send, back: home, menu, open }, page); }
  function home() {
    show(name, `Team ${snapshot.profile.teamName} · ${snapshot.economy.carriedMoney} carried Poké · ${snapshot.economy.bankedMoney} saved Poké. ${snapshot.progress.storyNodeId === TOWN.story ? 'Accept requests, mark them Take Job, and complete their objectives in a real expedition.' : 'Prepare supplies for the Diglett rescue, then return to the base.'}${snapshot.earlyWork?.history === 'legacy-postings-unavailable' ? ' Imported town: this board begins new work; earlier postings were not recorded.' : ''}`, [
      ...(atSquare ? [{ label: 'Kecleon Shop', run: () => shop('kecleon-items') }, { label: 'Kecleon Wares', run: () => shop('kecleon-wares') }, { label: 'Felicity Bank', run: bank }, { label: 'Kangaskhan Storage', run: storage },
        { label: 'Other services', run: () => show('Other services', 'Gulpin linking and the Dojo are still in development. Friend Area access follows the Diglett rescue and is not open yet.', [{ label: 'Back', run: home }]) }] : []),
      ...(snapshot.progress.storyNodeId === TOWN.story && snapshot.town.mapDefinitionId === TOWN.post ? [{ label: 'Bulletin board', run: () => jobs('board') }] : []),
      ...(snapshot.progress.storyNodeId === TOWN.story ? [{ label: 'Job List', run: () => jobs('jobs') }] : []),
      ...(snapshot.progress.storyNodeId === TOWN.story && snapshot.town.mapDefinitionId === TEAM.map ? [{ label: 'Check mailbox', run: () => jobs('mailbox') }, { label: 'Choose dungeon', run: () => jobs('depart') }] : []),
      ...[{ mapId: TOWN.square, label: 'Visit Pokémon Square' }, { mapId: TOWN.post, label: 'Visit Post Office' }, { mapId: TEAM.map, label: 'Return to base' }, { mapId: MORNING.interior, label: 'Enter home' }].filter(row => row.mapId !== snapshot.town.mapDefinitionId).map(row => ({ label: row.label, run: () => send({ type: 'townTravel', mapId: row.mapId }) })),
      { label: 'Campaign & saves', run: menu },
    ]);
  }
  home();
}
