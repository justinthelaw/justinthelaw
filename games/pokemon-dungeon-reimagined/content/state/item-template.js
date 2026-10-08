/** Native clean item construction, shared by shop lots and ordinary rewards.
 * @param {Pick<import('./campaign.js').CampaignCatalogs,'effects'>} catalogs @param {string} id
 * @returns {import('../../src/contracts/campaign.js').ItemTemplate} */
export function cleanTemplate(catalogs, id) {
  const item = catalogs.effects.getItem(id);
  const teaching = item.useEffects.find(effect => effect.op === 'teach-move');
  if (teaching?.op === 'teach-move') {
    const moveId = catalogs.effects.getAction(teaching.moveId).moveId;
    if (!moveId) throw new TypeError('Unsupported machine source action.');
    return { itemId: /** @type {import('../../src/contracts.js').ItemId} */ (id), sticky: false, payload: { kind: 'machine', state: 'unused', moveId: /** @type {import('../../src/contracts.js').MoveId} */ (moveId) } };
  }
  return { itemId: /** @type {import('../../src/contracts.js').ItemId} */ (id), sticky: false, payload: { kind: 'none' } };
}
