import { allocate, blocked, clone } from './support.js';

/** Native code_801B60C reward delivery. The caller owns the persisted reward
 * cursor and final receipt; this owner transfers exactly one promised slot.
 * @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('../../contracts/campaign.js').ItemGrant} Grant
 * @typedef {{kind:'discard-reward'}|{kind:'replace',itemInstanceId:import('../../contracts.js').ItemInstanceId,operation:'store'|'discard'}} RewardItemChoice
 */

/** @param {Snapshot} state @param {Readonly<Grant>} grant */
function storageFits(state, grant) {
  if (['item-nothing', 'item-poke', 'item-used-tm'].includes(grant.template.itemId) || grant.template.payload.kind === 'machine' && grant.template.payload.state === 'used') return false;
  return (state.economy.storedItems.find(row => row.template.itemId === grant.template.itemId)?.count ?? 0) + grant.quantity <= 999;
}

/** A reward always takes a fresh toolbox slot, even when another projectile
 * stack has room. Full-bag storage is all-or-nothing, including all10 rocks.
 * @param {Snapshot} state @param {Readonly<Grant>} grant
 * @returns {'toolbox'|'storage'|'choice'} */
export function rewardItemRoute(state, grant) {
  const bag = state.containers[state.economy.toolbox];
  if (!bag || bag.owner.kind !== 'campaign-toolbox') return blocked('reward-toolbox');
  if (bag.itemIds.length < 20) return 'toolbox';
  return storageFits(state, grant) ? 'storage' : 'choice';
}

/** Choice selections are rechecked at confirmation. Cancelling a menu never
 * calls this owner or advances the caller's reward cursor.
 * @param {Snapshot} state @param {Readonly<Grant>} grant
 * @param {RewardItemChoice} choice @returns {string|null} */
export function rewardItemChoiceProblem(state, grant, choice) {
  if (rewardItemRoute(state, grant) !== 'choice') return 'This reward no longer needs an inventory choice.';
  if (choice.kind === 'discard-reward') return null;
  if (choice.kind !== 'replace' || !['store', 'discard'].includes(choice.operation)) return 'Choose how to make room for the reward.';
  const item = state.items[choice.itemInstanceId], bag = state.containers[state.economy.toolbox];
  if (!item || !bag?.itemIds.includes(item.itemInstanceId)) return 'Select an item in your toolbox.';
  return choice.operation === 'store' && !storageFits(state, item) ? 'Storage cannot hold that complete toolbox slot.' : null;
}

/** @param {import('../../contracts/campaign.js').CampaignState} state @param {Readonly<Grant>} grant */
function store(state, grant) {
  const stored = state.economy.storedItems.find(row => row.template.itemId === grant.template.itemId);
  if (stored) stored.count += grant.quantity;
  else state.economy.storedItems.push({ template: { ...clone(grant.template), sticky: false }, count: grant.quantity });
}

/** No partial write on a missing/invalid choice. The enclosing Adventure draft
 * commits this transfer and its caller's cursor together, preserving reload and
 * rejection rollback. Replacement removes a whole selected slot, not one unit.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {Readonly<Grant>} grant @param {RewardItemChoice} [choice]
 * @returns {'received'|'discarded'|'choice'} */
export function receiveRewardItem(context, grant, choice) {
  const state = context.state, route = rewardItemRoute(state, grant);
  if (route === 'choice' && !choice) return 'choice';
  if (choice && rewardItemChoiceProblem(state, grant, choice)) return blocked('reward-choice-unavailable');
  if (choice?.kind === 'discard-reward') return 'discarded';
  const bag = state.containers[state.economy.toolbox]; if (!bag) return blocked('reward-toolbox');
  if (choice?.kind === 'replace') {
    const old = state.items[choice.itemInstanceId]; if (!old) return blocked('reward-replacement-item');
    if (choice.operation === 'store') store(state, old);
    bag.itemIds.splice(bag.itemIds.indexOf(old.itemInstanceId), 1); delete state.items[old.itemInstanceId];
    context.emit({ type: 'itemChanged', itemInstanceId: old.itemInstanceId });
  }
  if (route === 'storage') {
    store(state, grant); context.emit({ type: 'message', messageId: 'reward-sent-to-storage' });
  } else {
    const itemInstanceId = allocate(state, 'item-instance');
    state.items[itemInstanceId] = { itemInstanceId, template: clone(grant.template), quantity: grant.quantity, shopLotId: null };
    bag.itemIds.push(itemInstanceId); context.emit({ type: 'itemChanged', itemInstanceId });
  }
  return 'received';
}
