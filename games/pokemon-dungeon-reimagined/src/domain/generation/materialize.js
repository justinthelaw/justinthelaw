import { allocateId, catalogId } from '../ids.js';
import { snapshotNavigationData } from '../../../content/navigation.js';
/** Turn a validated proposal into P07 records, without mutating state or allocating actors/items.
 * Caller commits returned sequence, floor, shop plans and population in one transaction.
 * @param {import('./types.js').ReadonlyData<import('./types.js').FloorBlueprint>} blueprint
 * @param {import('./types.js').MaterializeInput & {trapKindIds:ReadonlySet<string>}} input
 * @param {import('../../../content/navigation-types.js').NavigationCatalog} navigation
 */
export function materializeFloor(blueprint, input, navigation) {
    let sequence = input.sequence;
    const used = new Set(input.existingIds);
    /** @template {import('../../contracts.js').InstanceKind} K @param {K} kind */
    const allocate = kind => { const result = allocateId(sequence, kind, used); sequence = result.sequence; used.add(result.id); return result.id; };
    if (input.definitionId !== (blueprint.fixedIndex === 0 ? 'navigation-procedural' : `navigation-fixed-${blueprint.fixedIndex}`) || !navigation.definitionIds.includes(input.definitionId))
        throw new TypeError('Unknown navigation map definition.');
    if (!Number.isInteger(input.windCounter) || input.windCounter < 0)
        throw new TypeError('Invalid wind counter.');
    const mapId = allocate('map');
    const terrainIds = new Set(navigation.terrainIds);
    /** @type {Record<string,import('../../contracts/campaign.js').RoomState>} */ const rooms = {};
    const roomIds = new Map(blueprint.geometry.rooms.map(room => { const roomId = allocate('room'); rooms[roomId] = { roomId, kind: room.kind, bounds: { ...room.bounds }, monsterHouse: room.kind === 'monster-house' ? 'armed' : 'none', initiallyHidden: room.hidden }; return [room.index, roomId]; }));
    const shopIds = new Map(blueprint.geometry.rooms.filter(room => room.kind === 'shop').map(room => [room.index, allocate('shop')]));
    const tiles = blueprint.geometry.cells.map(row => row.map(t => { const id = t.door ? 'terrain-key-door' : t.sealed ? `terrain-sealed-${t.terrain}` : t.impassable ? `terrain-impassable-${t.terrain}` : `terrain-${t.terrain}`; navigation.terrain(id); return { terrainId: catalogId('terrain', id, terrainIds), roomId: t.room === null ? null : roomIds.get(t.room) ?? null, unbreakable: t.unbreakable, junction: t.junction, shopId: t.shop && t.room !== null ? shopIds.get(t.room) ?? null : null }; }));
    /** @type {Record<string,import('../../contracts/campaign.js').TrapState>} */ const traps = {};
    for (const placement of blueprint.placements)
        if (placement.kind === 'trap') {
            const trapId = allocate('trap');
            traps[trapId] = { trapId, trapKindId: catalogId('trap-kind', placement.trapId, input.trapKindIds), position: { ...placement.position }, revealed: placement.revealed, affiliation: 'hostile', activation: 'armed' };
        }
    /** @type {Record<string,import('../../contracts/campaign.js').ExitState>} */ const exits = {};
    if (blueprint.geometry.exit !== null) {
        if (!input.exit)
            throw new TypeError('Concrete exit destination is required.');
        const exitId = allocate('exit');
        exits[exitId] = { exitId, position: { ...blueprint.geometry.exit }, ...input.exit };
    }
    else if (input.exit !== null)
        throw new TypeError('Exit supplied to a scene with no exit anchor.');
    /** @type {import('../../contracts/campaign.js').FloorState} */ const floor = { mapId, location: input.location, definitionId: input.definitionId, width: 56, height: 32, tiles, rooms, traps, exits, knowledge: { explored: Array.from({ length: 32 }, () => Array(56).fill(false)), layoutRevealed: false, stairsRevealed: false, itemSense: false, actorSense: false, itemHoldersIdentified: false }, effects: { mudSport: null, waterSport: null }, weather: input.weather, turnCounter: 0, arrivalCounter: 0, windCounter: input.windCounter, triggeredEventIds: [] };
    return snapshotNavigationData({ floor, sequence, placements: blueprint.placements.filter(placement => placement.kind !== 'trap'), partyPositions: blueprint.partyPositions, shopPlans: [...shopIds].map(([roomIndex, shopId]) => ({ shopId, mapId, roomId: roomIds.get(roomIndex), roomIndex })) });
}
