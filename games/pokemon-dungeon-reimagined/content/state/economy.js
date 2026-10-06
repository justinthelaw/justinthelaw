import { createItemRules } from './items.js';

/** @typedef {import('../../src/contracts/campaign.js').CampaignState} CampaignState */
/** @typedef {import('../../src/contracts/campaign.js').ExpeditionState} ExpeditionState */
/** @typedef {import('../../src/contracts/campaign.js').StateIssue} StateIssue */

// Native Friend Area slot counts, joined by source symbol rather than row order.
// Source: src/dungeon_data.c:gFriendAreaSettings; plan/STATE-ITEM-ECONOMY.md.
/** @type {Readonly<Record<string,number>>} */
const AREA_CAPACITIES = Object.freeze({
  FRIEND_AREA_BEAU_PLAINS: 12,
  FRIEND_AREA_MT_CLEFT: 9,
  FRIEND_AREA_TURTLESHELL_POND: 10,
  FRIEND_AREA_MIST_RISE_FOREST: 14,
  FRIEND_AREA_FLYAWAY_FOREST: 12,
  FRIEND_AREA_WILD_PLAINS: 13,
  FRIEND_AREA_RAVAGED_FIELD: 5,
  FRIEND_AREA_ENERGETIC_FOREST: 15,
  FRIEND_AREA_FURNACE_DESERT: 7,
  FRIEND_AREA_SAFARI: 15,
  FRIEND_AREA_MT_MOONVIEW: 6,
  FRIEND_AREA_DARKNESS_RIDGE: 13,
  FRIEND_AREA_SKY_BLUE_PLAINS: 13,
  FRIEND_AREA_ECHO_CAVE: 11,
  FRIEND_AREA_JUNGLE: 13,
  FRIEND_AREA_MUSHROOM_FOREST: 7,
  FRIEND_AREA_SECRETIVE_FOREST: 9,
  FRIEND_AREA_BOULDER_CAVE: 4,
  FRIEND_AREA_SCORCHED_PLAINS: 10,
  FRIEND_AREA_TADPOLE_POND: 9,
  FRIEND_AREA_DECREPIT_LAB: 7,
  FRIEND_AREA_MT_DISCIPLINE: 11,
  FRIEND_AREA_BOUNTIFUL_SEA: 9,
  FRIEND_AREA_MT_DEEPGREEN: 12,
  FRIEND_AREA_POWER_PLANT: 6,
  FRIEND_AREA_ICE_FLOE_BEACH: 5,
  FRIEND_AREA_POISON_SWAMP: 6,
  FRIEND_AREA_SHALLOW_BEACH: 5,
  FRIEND_AREA_TREASURE_SEA: 10,
  FRIEND_AREA_RUB_A_DUB_RIVER: 7,
  FRIEND_AREA_OVERGROWN_FOREST: 9,
  FRIEND_AREA_FRIGID_CAVERN: 7,
  FRIEND_AREA_CRATER: 7,
  FRIEND_AREA_WATERFALL_LAKE: 4,
  FRIEND_AREA_MYSTIC_LAKE: 4,
  FRIEND_AREA_TRANSFORM_FOREST: 6,
  FRIEND_AREA_DEEP_SEA_FLOOR: 12,
  FRIEND_AREA_ANCIENT_RELIC: 6,
  FRIEND_AREA_LEGENDARY_ISLAND: 3,
  FRIEND_AREA_CRYPTIC_CAVE: 1,
  FRIEND_AREA_FINAL_ISLAND: 1,
  FRIEND_AREA_THUNDER_MEADOW: 11,
  FRIEND_AREA_PEANUT_SWAMP: 7,
  FRIEND_AREA_AGED_CHAMBER_AN: 14,
  FRIEND_AREA_AGED_CHAMBER_O_EXCLAIM: 14,
  FRIEND_AREA_SERENE_SEA: 4,
  FRIEND_AREA_SACRED_FIELD: 3,
  FRIEND_AREA_DEEP_SEA_CURRENT: 1,
  FRIEND_AREA_RAINBOW_PEAK: 1,
  FRIEND_AREA_HEALING_FOREST: 1,
  FRIEND_AREA_DRAGON_CAVE: 3,
  FRIEND_AREA_MAGNETIC_QUARRY: 3,
  FRIEND_AREA_SOUTHERN_ISLAND: 2,
  FRIEND_AREA_SEAFLOOR_CAVE: 1,
  FRIEND_AREA_VOLCANIC_PIT: 1,
  FRIEND_AREA_STRATOS_LOOKOUT: 1,
  FRIEND_AREA_ENCLOSED_ISLAND: 1,
});

/** Concrete economy snapshot invariants. Transactions still own grants, entry
 * deletion and settlement; a valid snapshot is not a receipt for those actions.
 * @param {import('./items.js').ItemCatalogs & {species:import('../species.js').SpeciesCatalog}} catalogs
 * @returns {import('../../src/contracts/campaign.js').CampaignStatePolicies['economy']}
 */
export function createEconomyPolicy(catalogs) {
  const rules = createItemRules(catalogs);
  const areas = new Map(catalogs.species.identities.friendAreas.map(area => {
    const capacity = AREA_CAPACITIES[area.sourceSymbol];
    if (capacity === undefined) throw new TypeError('Friend Area lacks a sourced capacity.');
    return [area.id, capacity];
  }));
  if (areas.size !== 57 || [...areas.values()].reduce((sum, value) => sum + value, 0) !== 413) throw new TypeError('Incomplete Friend Area capacity join.');

  return state => {
    catalogs.species.getSpecies('pokemon-001');
    catalogs.effects.getItem('item-nothing');
    catalogs.campaign.getModel();
    /** @type {StateIssue[]} */ const issues = [];
    const requirements = new Set();
    /** @param {unknown} condition @param {string} path @param {string} message @param {StateIssue['code']} [code] */
    function check(condition, path, message, code = 'relationship') {
      if (!condition && issues.length < 100) issues.push({ code, path, message });
    }
    /** @param {number} value @param {number} maximum @param {string} path */
    function money(value, maximum, path) { check(Number.isSafeInteger(value) && value >= 0 && value <= maximum, path, 'Money account exceeds its source bounds.', 'range'); }
    /** @param {import('../../src/contracts/campaign.js').RuleCheck} result @param {string} path */
    function merge(result, path) {
      if (result.ok) return;
      if (result.kind === 'unresolved') for (const id of result.requirementIds) { if (requirements.size < 100) requirements.add(id); }
      else for (const issue of result.issues) check(false, path, issue.message, issue.code);
    }
    /** Empty containers are not visited by the item policy; capacity is checked
     * here for the complete archive as well.
     * @param {import('../../src/contracts/campaign.js').ItemArchive} archive @param {string} path */
    function capacities(archive, path) {
      for (const container of Object.values(archive.containers)) {
        const kind = container.owner.kind;
        const at = `${path}/containers/${container.containerId}`;
        if (kind === 'campaign-toolbox' || kind === 'session-toolbox') check(container.itemIds.length <= 20, at, 'Toolbox exceeds twenty occupied slots.', 'range');
        if (kind === 'pokemon-held' || kind === 'actor-held' || kind === 'floor') check(container.itemIds.length <= 1, at, 'A held slot or floor placement contains multiple stacks.');
      }
    }
    money(state.economy.carriedMoney, 99999, '/economy/carriedMoney');
    money(state.economy.bankedMoney, 9999999, '/economy/bankedMoney');
    capacities(state, '');
    const stored = new Set();
    for (const [index, stack] of state.economy.storedItems.entries()) {
      const path = `/economy/storedItems/${index}`;
      check(!stored.has(stack.template.itemId), path, 'Storage has more than one count for the same source item ID.');
      stored.add(stack.template.itemId);
      check(Number.isSafeInteger(stack.count) && stack.count >= 1 && stack.count <= 999, path, 'Storage counts individual items/projectiles, up to 999 per item ID.', 'range');
      merge(rules.template(stack.template, 'storage'), path);
    }
    const owned = new Set(state.economy.ownedFriendAreaIds);
    check(owned.size === state.economy.ownedFriendAreaIds.length, '/economy/ownedFriendAreaIds', 'Friend Area ownership contains duplicates.');
    for (const id of owned) check(areas.has(id), '/economy/ownedFriendAreaIds', 'Owned Friend Area is absent from the accepted catalog.', 'unknown-id');
    /** @type {Map<string,number>} */ const residents = new Map();
    for (const pokemon of Object.values(state.roster)) {
      check(owned.has(pokemon.friendAreaId), '/roster', 'Permanent resident has no owned accommodation.', 'ownership');
      residents.set(pokemon.friendAreaId, (residents.get(pokemon.friendAreaId) ?? 0) + 1);
    }
    for (const [id, count] of residents) check(count <= (areas.get(id) ?? 0), '/roster', 'Friend Area resident count exceeds its sourced capacity.', 'range');

    /** @param {ExpeditionState} session @param {string} path */
    function expedition(session, path) {
      money(session.carriedMoney, 99999, `${path}/carriedMoney`);
      money(session.entry.carriedMoney, 99999, `${path}/entry/carriedMoney`);
      capacities(session.entry.itemArchive, `${path}/entry/itemArchive`);
      // Historical money/items are observations, never another spendable wallet.
      // Source has one carried wallet/toolbox; P07 transfers ownership atomically.
      check(state.economy.carriedMoney === 0, '/economy/carriedMoney', 'An expedition reserves the carried-money account.');
      check(state.containers[state.economy.toolbox]?.itemIds.length === 0, '/economy/toolbox', 'The home toolbox must be empty while expedition ownership is active.');
      const settled = new Set(session.participantSettlements.flatMap(row => row.pokemonId === null ? [] : [row.pokemonId]));
      for (const entrant of Object.values(session.entry.entrants)) if (!settled.has(entrant.pokemon.pokemonId)) {
        const pokemon = state.roster[entrant.pokemon.pokemonId];
        check(pokemon && state.containers[pokemon.heldContainerId]?.itemIds.length === 0, '/containers', 'Unsettled expedition participant retains a home held item.', 'ownership');
      }
    }
    if (state.session) expedition(state.session, '/session');
    if (state.rescue.suspended) {
      capacities(state.rescue.suspended.itemArchive, '/rescue/suspended/itemArchive');
      expedition(state.rescue.suspended.session, '/rescue/suspended/session');
    }
    if (issues.length) return { ok: false, kind: 'invalid', issues };
    if (requirements.size) return { ok: false, kind: 'unresolved', requirementIds: [...requirements] };
    return { ok: true };
  };
}
