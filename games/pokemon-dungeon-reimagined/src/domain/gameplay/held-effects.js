/** Source HasHeldItem checks actual held ownership and nonsticky flags.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {import('../../contracts/campaign.js').SessionActor} actor @param {string} itemId */
export function hasHeldItem(state, actor, itemId) {
  const held = state.containers[actor.heldContainerId];
  return held?.itemIds.some(id => state.items[id]?.template.itemId === itemId && state.items[id]?.template.sticky === false) === true;
}
