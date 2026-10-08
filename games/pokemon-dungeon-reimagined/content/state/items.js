/** Item admission from qualified original catalogs and pinned native limits.
 * Numerical/source decisions: plan/STATE-ITEM-ECONOMY.md.
 * @typedef {import('../../src/contracts/campaign.js').RuleCheck} RuleCheck
 * @typedef {import('../../src/contracts/campaign.js').ItemTemplate} ItemTemplate
 * @typedef {import('../../src/contracts/campaign.js').CampaignState} CampaignState
 * @typedef {import('../../src/contracts/campaign.js').ValidationScope} ValidationScope
 * @typedef {Awaited<ReturnType<typeof import('../effects.js').loadEffectCatalog>>} EffectCatalog
 * @typedef {Readonly<{effects:EffectCatalog,campaign:import('../campaign.js').CampaignCatalog,dungeons:Awaited<ReturnType<typeof import('../dungeons.js').loadDungeonCatalog>>}>} ItemCatalogs
 */

// Decoded values of src/dungeon_data.c:gUnknown_810A3F0 at the pinned revision.
// All 100 values are distinct. Canonical quantity holds money, not a native index.
const POKE_AMOUNTS = Object.freeze([
  4, 6, 10, 14, 22, 26, 34, 38, 46, 58,
  62, 74, 82, 86, 94, 106, 118, 122, 134, 142,
  146, 158, 166, 178, 194, 202, 206, 214, 218, 226,
  254, 262, 274, 278, 298, 302, 314, 326, 334, 346,
  358, 362, 382, 386, 394, 398, 422, 446, 454, 458,
  466, 478, 482, 502, 514, 526, 538, 542, 554, 562,
  566, 586, 614, 622, 626, 634, 662, 674, 694, 698,
  706, 718, 734, 746, 758, 768, 778, 794, 802, 818,
  838, 842, 862, 866, 878, 886, 898, 914, 922, 926,
  934, 958, 974, 982, 998, 1000, 1100, 1300, 1500, 20000,
]);

/** @param {number} index @returns {number} */
export function decodePokeQuantity(index) {
  const amount = POKE_AMOUNTS[index];
  if (!Number.isSafeInteger(index) || amount === undefined) throw new RangeError('Unknown native money quantity index.');
  return amount;
}

/** @param {number} amount @returns {number} */
export function encodePokeQuantity(amount) {
  const index = POKE_AMOUNTS.indexOf(amount);
  if (index < 0) throw new RangeError('Money pile is absent from the source quantity table.');
  return index;
}

/** @param {string} message @param {import('../../src/contracts/campaign.js').StateIssue['code']} [code] @returns {RuleCheck} */
function invalid(message, code = 'relationship') {
  return { ok: false, kind: 'invalid', issues: [{ code, path: '', message }] };
}
/** @param {string} requirement @returns {RuleCheck} */
function unresolved(requirement) { return { ok: false, kind: 'unresolved', requirementIds: [requirement] }; }

/** Shared item-template rules for live instances and normalized storage.
 * Not exported by the public barrel; economy uses the same payload decisions.
 * @param {ItemCatalogs} catalogs
 */
export function createItemRules({ effects, campaign, dungeons }) {
  // Only canonical dungeon floors with an enabled generator context contribute.
  // Source-only/excluded floors and disabled shops do not authorize an item.
  const generated = new Set();
  const joinedPools = new Set();
  /** @param {string} id */
  function pool(id) {
    if (joinedPools.has(id)) return;
    joinedPools.add(id);
    for (const category of dungeons.getItemPool(id).categories) if (category.effectiveDrawCount > 0) {
      for (const item of category.items) if (item.effectiveDrawCount > 0) generated.add(item.itemId);
    }
  }
  for (const id of dungeons.dungeonIds) for (const sectionId of dungeons.getDungeon(id).sectionIds) {
    for (const variant of dungeons.getSection(sectionId).variants) for (const floorId of variant.floorIds) {
      const floor = dungeons.getFloorById(floorId);
      const parameters = dungeons.getGeneration(floor.generationId).parameters;
      if (parameters.itemDensity > 0) pool(floor.itemPoolIds.floor);
      if (parameters.buriedItemDensity > 0) pool(floor.itemPoolIds.buried);
      if (parameters.kecleonShopChance > 0) pool(floor.itemPoolIds.shop);
      if (parameters.monsterHouseChance > 0 && parameters.itemlessMonsterHouseChance < 100) pool(floor.itemPoolIds.monsterHouse);
    }
  }
  /** @type {Map<string,import('../effects.js').DeepReadonly<import('../effects-types.js').Item>>} */
  const machineOrigins = new Map();
  const itemIds = effects.ids.items;
  if (!itemIds?.length) throw new TypeError('Complete effect item catalog is required.');
  for (const id of itemIds) {
    if (typeof id !== 'string') throw new TypeError('Invalid item catalog identity.');
    const item = effects.getItem(id);
    for (const effect of item.useEffects) if (effect.op === 'teach-move' && !effect.reusable) {
      const moveId = effects.getAction(effect.moveId).moveId;
      // The unused Excavate/Spin Slash machines name source-only actions.
      // Their own template validation blocks; they cannot poison other joins.
      if (moveId === null) continue;
      if (machineOrigins.has(moveId)) throw new TypeError('TM origin must identify exactly one canonical move.');
      machineOrigins.set(moveId, item);
    }
  }
  const treasureIds = effects.ids.treasures;
  if (!treasureIds?.length) throw new TypeError('Fixed treasure catalog is required.');
  const treasures = new Set(treasureIds.map(id => {
    if (typeof id !== 'string') throw new TypeError('Invalid treasure catalog identity.');
    return effects.getTreasure(id).itemId;
  }));

  /** Existence of a qualified acquisition route, not proof of a specific grant.
   * Command/progress/reward owners must establish its actual transaction.
   * @param {import('../effects.js').DeepReadonly<import('../effects-types.js').Item>} item @returns {RuleCheck} */
  function available(item) {
    if (item.internalId === 0) return invalid('The empty-slot sentinel is not an item instance.');
    if (item.obtainability === 'original-red-reward-delivery-to-sculpture-event-flag') return unresolved(`item-event-delivery:${item.id}`);
    const evidence = item.availabilityEvidence;
    if (generated.has(item.id)) return { ok: true };
    // Ordinary mission difficulty selects sets 1-15. An uncalled set such as
    // set 25 is a table reference, not an obtainable reward route.
    if (!evidence.rewardBlacklist && evidence.rewardShopSetReferences.some(row => row.setId >= 1 && row.setId <= 15)) return { ok: true };
    if (treasures.has(item.id)) return { ok: true };
    if (item.id === 'item-link-cable' && item.obtainability === 'original-red-fixed-treasure-duplicate-replacement') return { ok: true };
    if (item.id === 'item-plain-seed') {
      const revival = effects.getContract('reviver-seed');
      if (revival.id === 'reviver-seed' && revival.facts.onSuccessInOrder.some(step => step.op === 'replace-selected-seed' && 'itemId' in step && step.itemId === item.internalId)) return { ok: true };
    }
    const regis = campaign.getContracts().bossSpecials.regis;
    if (regis.some(regi => regi.partItemId === item.id && regi.dropPartWhenFlagFalse)) return { ok: true };
    // MusicBoxCreation_Async combines the three sourced Regi Parts in the bag.
    if (item.id === 'item-music-box' && regis.length === 3 && new Set(regis.map(regi => regi.partItemId)).size === 3) return { ok: true };
    return unresolved(`item-acquisition-route:${item.id}`);
  }

  /** @param {ItemTemplate} template @param {'portable'|'home'|'storage'} context @returns {RuleCheck} */
  function template(template, context) {
    const item = effects.getItem(template.itemId);
    // Check the borrowed campaign is still live even for ordinary effect rows.
    campaign.getModel();
    dungeons.getDungeon('tiny-woods');
    if (template.sticky && (context !== 'portable' || ['item-poke', 'item-rock-part', 'item-ice-part', 'item-steel-part', 'item-music-box'].includes(item.id))) return invalid('Stickiness is not retained in this item context.');
    if (item.category === 'poke' && context !== 'portable') return invalid('Money piles must be converted to the carried-money account before town or storage.');
    if (context === 'storage' && (item.storageAllowed === false || item.category === 'used_tm')) return invalid('This item cannot be deposited in ordinary storage.');
    const payload = template.payload;
    if (item.category === 'used_tm') {
      if (payload.kind !== 'machine' || payload.state !== 'used') return invalid('Used TM requires its original taught move and used state.');
      const origin = machineOrigins.get(payload.moveId);
      if (!origin) return invalid('Used TM origin is not a nonreusable TM move.');
      return available(origin);
    }
    if (item.category === 'tms_hms') {
      const teaching = item.useEffects.find(effect => effect.op === 'teach-move');
      if (!teaching || teaching.op !== 'teach-move') return unresolved(`item-machine-definition:${item.id}`);
      const moveId = effects.getAction(teaching.moveId).moveId;
      if (moveId === null) return unresolved(`item-machine-source-action:${item.id}`);
      if (payload.kind !== 'machine' || payload.state !== 'unused' || moveId !== payload.moveId) return invalid('TM/HM payload does not match its unused source machine.');
    } else if (payload.kind !== 'none') return invalid('The source item has no charge or story-variant payload.');
    return available(item);
  }

  /** @param {ItemTemplate} template @param {number} quantity @returns {RuleCheck} */
  function quantity(template, quantity) {
    const item = effects.getItem(template.itemId);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return invalid('Item quantity must be a positive integer.', 'range');
    if (item.category === 'poke') return POKE_AMOUNTS.includes(quantity) ? { ok: true } : invalid('Money pile amount is absent from the source lookup table.', 'range');
    const projectile = item.category === 'thrown_line' || item.category === 'thrown_arc';
    return quantity <= (projectile ? 99 : 1) ? { ok: true } : invalid('Item quantity exceeds its source stack limit.', 'range');
  }
  return Object.freeze({ template, quantity });
}

/** Match an archive explicitly; history never borrows live inventory ownership.
 * @param {CampaignState} state @param {ValidationScope} scope
 */
function scopedArchive(state, scope) {
  if (scope.kind === 'live') return { archive: state, session: state.session };
  const suspended = state.rescue.suspended;
  if (scope.kind === 'rescue-suspended') return suspended?.requestId === scope.requestId ? { archive: suspended.itemArchive, session: suspended.session } : null;
  const session = scope.owner === 'active-session' ? state.session : suspended?.session;
  return session?.sessionId === scope.sessionId ? { archive: session.entry.itemArchive, session } : null;
}

/** Concrete CampaignStatePolicies.item; exact shape/graph validation precedes it.
 * @param {ItemCatalogs} catalogs
 * @returns {import('../../src/contracts/campaign.js').CampaignStatePolicies['item']}
 */
export function createItemPolicy(catalogs) {
  const rules = createItemRules(catalogs);
  return (item, container, state, scope) => {
    const resolved = scopedArchive(state, scope);
    if (!resolved || resolved.archive.items[item.itemInstanceId] !== item || resolved.archive.containers[container.containerId] !== container || !container.itemIds.includes(item.itemInstanceId)) return invalid('Item and container do not belong to the specified inventory scope.', 'ownership');
    const owner = container.owner;
    const home = owner.kind === 'campaign-toolbox' || owner.kind === 'pokemon-held';
    if (scope.kind === 'entry-history' && !home || scope.kind === 'rescue-suspended' && home) return invalid('Container owner is invalid for this inventory scope.', 'ownership');
    if ((owner.kind === 'actor-held' || owner.kind === 'session-toolbox' || owner.kind === 'floor') && owner.sessionId !== resolved.session?.sessionId) return invalid('Container belongs to another expedition.', 'ownership');
    const single = owner.kind === 'pokemon-held' || owner.kind === 'actor-held' || owner.kind === 'floor';
    if (single && container.itemIds.length !== 1) return invalid('A held slot or floor item placement contains multiple item stacks.');
    if ((owner.kind === 'campaign-toolbox' || owner.kind === 'session-toolbox') && container.itemIds.length > 20) return invalid('Toolbox exceeds twenty occupied slots.', 'range');
    if (item.shopLotId !== null && (home || owner.kind === 'result-escrow' || scope.kind === 'entry-history')) return invalid('Shop claims cannot enter home, reward or entry-history inventory.');
    const checked = rules.template(item.template, home ? 'home' : 'portable');
    if (!checked.ok) return checked;
    return rules.quantity(item.template, item.quantity);
  };
}
