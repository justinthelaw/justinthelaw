// Direct raw floor owner copied from the accepted common geometry contract.
// Only genuine ordinary final-return exits have a new, independently checked arm.
import { THUNDERWAVE as T } from '../authored/thunderwave.js';
import { TOWN } from '../authored/town.js';
import { canEnter } from '../../src/domain/navigation/geometry.js';
import { diagnostics, bounded } from './pokemon-rules.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {import('../../src/contracts/campaign.js').CampaignIdentityLookup} identities
 * @param {import('./campaign.js').CampaignCatalogs} catalogs @returns {Policies['floor']} */
export function createEscortFloorPolicy(identities, { navigation, dungeons }) {
  return (floor, session, state, scope) => {
    const r = diagnostics(); const occupied = new Set();
    if (['tiny-woods', T.dungeonId].includes(session.dungeonId)) r.check(bounded(floor.arrivalCounter, 0, 35) && bounded(floor.windCounter, 0, 1000) && floor.turnCounter + floor.windCounter === 1000, '/counters', 'Opening arrival and wind counters must match the supported source cycles.');
    if (!navigation) { r.need('P11:navigation-catalog'); return r.result(); }
    r.check(navigation.definitionIds.includes(floor.definitionId) && floor.width === 56 && floor.height === 32, '/definitionId', 'Dungeon geometry must use a registered navigation definition and its 56 by 32 grid.');
    if (floor.location.kind !== 'exploration' && floor.location.kind !== 'boss') { r.need(`P22:floor-location:${floor.location.kind}`); return r.result(); }
    const joined = identities.permitsFloor(floor.location.address);
    if (!joined.ok) return joined;
    const factual = dungeons.getFloorById(floor.location.address.floorId);
    const generation = dungeons.getGeneration(factual.generationId);
    const fixed = generation.parameters.fixedRoomNumber;
    r.check(floor.definitionId === (fixed === 0 ? 'navigation-procedural' : `navigation-fixed-${fixed}`), '/definitionId', 'Map definition must match the addressed floor generation profile.');
    const section = dungeons.getSection(factual.sectionId);
    if (section.variants.length !== 1) r.need(`P22:floor-variant:${factual.variantId}`);
    if (fixed !== 0) r.need(`P22:fixed-floor-state:${fixed}`);
    const context = { catalog: navigation, tileset: generation.parameters.tileset, visibilityRange: generation.parameters.visibilityRange };
    const inventory = scope.kind === 'rescue-suspended' ? state.rescue.suspended?.itemArchive : state;
    for (const actor of Object.values(session.actors)) if (actor.placement.kind === 'map') {
      const position = actor.placement.position; const key = `${position.x},${position.z}`;
      r.check(!occupied.has(key), '/actors', 'Two actors cannot occupy one tile.'); occupied.add(key);
      const held = inventory?.containers[actor.heldContainerId]?.itemIds.map(id => inventory.items[id]);
      const navActor = { actorId: actor.actorId, identity: actor.identity, position,
        mobile: actor.conditions.invisible?.statusId === 'mobile',
        mobileScarf: held?.some(item => item?.template.itemId === 'item-mobile-scarf' && !item.template.sticky) ?? false,
        allTerrainHiker: actor.enabledIqSkillIds.some(id => id === 'iq-all-terrain-hiker'), superMobile: actor.enabledIqSkillIds.some(id => id === 'iq-super-mobile') };
      r.check(canEnter(navActor, floor, position, context), '/actors', 'Actor occupancy violates its sourced terrain mobility.');
    }
    for (const row of floor.tiles) for (const tile of row) navigation.terrain(tile.terrainId);
    for (const exit of Object.values(floor.exits)) {
      const tile = floor.tiles[exit.position.z]?.[exit.position.x];
      r.check(tile && navigation.terrain(tile.terrainId).kind === 'floor' && !navigation.terrain(tile.terrainId).impassable, '/exits', 'Exit anchor requires passable floor terrain.');
      if (exit.lock.kind !== 'open') r.need(`P22:exit-lock:${exit.lock.policyId}`);
      const destination = exit.destination;
      if (destination.kind === 'floor' && fixed === 0 && section.variants.length === 1) {
        const floors = section.variants[0]?.floorIds ?? []; const index = floors.indexOf(factual.id);
        r.check(destination.address.dungeonId === factual.dungeonId && destination.address.sectionId === factual.sectionId && destination.address.floorId === floors[index + 1], '/exits', 'Ordinary stairs must lead to the next floor in the selected source section.');
        const up = dungeons.getRestrictions(factual.restrictionId).fields.stairDirectionUp;
        r.check(exit.kind === (up ? 'stairs-up' : 'stairs-down'), '/exits', 'Stair direction must match the source dungeon restriction.');
      } else if (session.purpose.kind === 'ordinary' && destination.kind === 'town') {
        const floors = section.variants[0]?.floorIds ?? [];
        r.check(fixed === 0 && section.variants.length === 1 && factual.id === floors.at(-1) && destination.mapDefinitionId === TOWN.post && destination.entryId === 'ordinary-return' && exit.kind === (dungeons.getRestrictions(factual.restrictionId).fields.stairDirectionUp ? 'stairs-up' : 'stairs-down'), '/exits', 'Actual ordinary final stairs end the source section at the Post Office return; no story-destination projection.');
      } else if (factual.id === 'tiny-woods-floor-03' && destination.kind === 'town') r.check(destination.mapDefinitionId === 'browser-opening-meadow' && destination.entryId === 'caterpie-clearing' && exit.kind === 'stairs-down', '/exits', 'Final Tiny Woods stairs lead to the authored Caterpie clearing gate.');
      else if (factual.id === T.floors[4] && destination.kind === 'town') r.check(destination.mapDefinitionId === T.clearing && destination.entryId === 'magnemite-rescue' && exit.kind === 'stairs-down', '/exits', 'Thunderwave ends after five exploration floors at the separate rescue scene.');
      else r.need(`P22:floor-exit:${factual.id}:${destination.kind}`);
    }
    if (fixed === 0) r.check(Object.keys(floor.exits).length === 1, '/exits', 'An ordinary procedural floor must retain its stair exit.');
    for (const trap of Object.values(floor.traps)) {
      const pool = dungeons.getTrapPool(factual.trapPoolId);
      r.check(trap.trapKindId === 'trap-wonder-tile' && pool.rows.some(row => row.trapId === trap.trapKindId && row.selectionThreshold > 0) && trap.activation === 'armed' && trap.affiliation === 'hostile' && trap.revealed && navigation.terrain(floor.tiles[trap.position.z]?.[trap.position.x]?.terrainId ?? '').kind === 'floor', '/traps', 'Only source-pooled, visible, reusable Wonder Tiles on floor terrain are supported.');
    }
    if (floor.weather.natural.length || generation.parameters.weather !== 0) r.need(`P15:natural-weather:${generation.parameters.weather}`);
    for (const weather of floor.weather.contributions) r.need(`P15:weather-duration:${weather.duration.policyId}`);
    if (floor.effects.mudSport || floor.effects.waterSport) r.need('P15:floor-sport-duration');
    if (floor.triggeredEventIds.length) r.need(`P22:floor-events:${factual.id}`);
    if (Object.values(session.shops).some(shop => shop.lifecycle === 'active')) r.need('P18:floor-shop-accounting');
    return r.result();
  };
}
