import { placeNativeEscortParty } from './escort-party-placement.js';
import { selectEncounter } from './encounters.js';
import { cell, positions, ordinary, reachable } from './support.js';
/** @typedef {import('./types.js').Position} Position */
/** @typedef {import('./types.js').Placement} Placement */
/** @typedef {import('./types.js').Geometry} Geometry */
/** @typedef {import('./support.js').Draws} Draws */
/** @param {Position} p */
const key = p => p.z * 56 + p.x;
/** @template {{selectionThreshold:number}} T @param {readonly T[]} rows @param {number} value */
function weighted(rows, value) { return rows.find(row => row.selectionThreshold > 0 && row.selectionThreshold >= value) ?? null; }
/** @param {import('./types.js').GenerationDependencies} dependencies @param {string} poolId @param {Draws} rng */
function item(dependencies, poolId, rng) { const pool = dependencies.dungeons.getItemPool(poolId); const category = weighted(pool.categories, rng.int(10000)); if (!category)
    return 'item-poke'; return weighted(category.items, rng.int(10000))?.itemId ?? 'item-poke'; }
/** @param {import('./types.js').GenerationDependencies} dependencies @param {string} poolId @param {Draws} rng */
function trap(dependencies, poolId, rng) { return weighted(dependencies.dungeons.getTrapPool(poolId).rows, rng.int(10000))?.trapId ?? 'trap-chestnut-trap'; }
/** @param {Position[]} list @param {number} count @param {Draws} rng */
function choosePositions(list, count, rng) { if (!list.length || count <= 0)
    return []; rng.swaps(list, 2 * list.length); const start = rng.int(list.length); return Array.from({ length: Math.min(count, list.length) }, (_, i) => list[(start + i) % list.length]).filter(/** @returns {p is Position} */ /** @returns {p is Position} */ p => p !== undefined); }
/** Positive-threshold then availability rejection, with a browser safety bound.
 * @param {import('./types.js').GenerateInput} input @param {import('./types.js').GenerationDependencies} dependencies @param {Draws} rng @param {string} roleId
 */
function enemy(input, dependencies, rng, roleId) {
    const pool = dependencies.dungeons.getEncounterPool(input.profile.encounterPoolId);
    const selected = selectEncounter(pool.rows, row => dependencies.isEncounterEligible(row, 'initial'), cap => rng.int(cap));
    return selected?.speciesId ? { roleId, speciesId: selected.speciesId, formId: selected.formId, level: selected.level } : null;
}
/** Placement count/location stream is encountersItems; terrain feature stream is layout.
 * Typed item requests preserve the exact selected identity and quantity policy context.
 * The item owner constructs canonical stacks/payloads in the same enclosing transaction.
 * Final outer recovery uses the source's explicit nonempty-house setting without
 * drawing its ordinary itemless flag. Inner geometry recovery retains the draw.
 * @param {Geometry} map @param {import('./types.js').GenerateInput} input @param {import('./types.js').GenerationDependencies} dependencies @param {Draws} rng @param {boolean} [finalRecovery] @returns {{placements:Placement[],partyPositions:Position[]}|null}
 */
export function placePopulation(map, input, dependencies, rng, finalRecovery = false) {
    const { profile, context } = input, p = input.generation.parameters, fixed = dependencies.navigation.fixed(p.fixedRoomNumber);
    /** @type {Placement[]} */ const placements = [];
    const occupied = new Set();
    const base = /** @param {import('./types.js').Cell} t */ /** @param {import('./types.js').Cell} t */ t => ordinary(t) && t.room !== null && !t.shop && !t.junction && !t.unbreakable && !t.special;
    const ordinaryPoints = () => positions(map, t => base(t));
    const houseEmpty = !finalRecovery && rng.int(100) < p.itemlessMonsterHouseChance;
    const fixedFloor = fixed.kind === 'floorwide';
    if (!map.exit && !fixedFloor) {
        const choices = ordinaryPoints();
        map.exit = choices[rng.int(choices.length)] ?? null;
    }
    if (fixedFloor && context.fixedEncounter?.exit === 'none')
        map.exit = null;
    if (map.exit) {
        occupied.add(key(map.exit));
        if (context.floorType === 'rescue') {
            const t = cell(map, map.exit.x, map.exit.z), room = t?.room === null ? null : map.rooms[t?.room ?? -1];
            if (room) {
                room.kind = 'monster-house';
                for (const row of map.cells)
                    for (const at of row)
                        if (at.room === room.index)
                            at.house = true;
            }
        }
    }
    const putItem = /** @param {Position} position @param {'floor'|'buried'|'monsterHouse'|'shop'|'fixed'} route @param {string|null} explicit */ (position, route, explicit = null) => { const itemId = explicit ?? item(dependencies, profile.itemPoolIds[route === 'fixed' ? 'floor' : route], rng); placements.push({ kind: 'item', itemId, position, sticky: route !== 'shop' && route !== 'fixed' && rng.int(100) < p.itemStickyChance, route, deferredUntil: route === 'fixed' && fixed.doors > 0 ? 'key-open' : null, rewardFallbackItemId: route === 'fixed' ? 'item-link-cable' : null, quantityContext: { moneyUpperBound: p.moneyUpperBound } }); occupied.add(key(position)); };
    if (!fixedFloor) {
        const count = p.itemDensity === 0 ? 0 : Math.max(1, rng.range(p.itemDensity - 2, p.itemDensity + 2));
        for (const pos of choosePositions(positions(map, t => base(t) && !t.house), count, rng))
            if (!occupied.has(key(pos)))
                putItem(pos, 'floor');
        const buried = p.buriedItemDensity === 0 ? 0 : rng.range(p.buriedItemDensity - 2, p.buriedItemDensity + 2);
        for (const pos of choosePositions(positions(map, t => t.terrain === 'wall' && !t.impassable && !t.sealed && !t.special), buried, rng))
            if (!occupied.has(key(pos)))
                putItem(pos, 'buried');
        if (!houseEmpty) {
            const house = positions(map, t => ordinary(t) && t.house && !t.special);
            const count = Math.min(7, Math.max(6, rng.range(Math.floor(house.length / 2), Math.floor(house.length * 8 / 10))));
            for (const pos of choosePositions(house, count, rng)) {
                if (occupied.has(key(pos)))
                    continue;
                if (rng.int(2) !== 0)
                    putItem(pos, 'monsterHouse');
                else if (context.canChangeLeader) {
                    placements.push({ kind: 'trap', trapId: trap(dependencies, profile.trapPoolId, rng), position: pos, revealed: false });
                    occupied.add(key(pos));
                }
            }
        }
        const trapCount = Math.min(56, rng.range(Math.floor(p.trapDensity / 2), p.trapDensity));
        for (const pos of choosePositions(ordinaryPoints().filter(pos => !occupied.has(key(pos))), trapCount, rng)) {
            placements.push({ kind: 'trap', trapId: trap(dependencies, profile.trapPoolId, rng), position: pos, revealed: false });
            occupied.add(key(pos));
        }
        // Secondary-island center: three treasures and a Warp Trap, separate from random candidates.
        for (const room of map.rooms) {
            const island = positions(map, t => t.room === room.index && t.special && !t.sealed && ordinary(t) && !t.required);
            if (island.length === 4) {
                for (let i = 0; i < island.length; i++) {
                    const pos = island[i];
                    if (!pos)
                        continue;
                    if (i === 0) {
                        placements.push({ kind: 'trap', trapId: 'trap-warp-trap', position: pos, revealed: false });
                        occupied.add(key(pos));
                    }
                    else
                        putItem(pos, 'floor');
                }
            }
        }
    }
    if (map.reward && fixed.rewardItemId) {
        const itemId = fixed.doors === 0 && context.ownedRewardItemIds.includes(fixed.rewardItemId) ? 'item-link-cable' : fixed.rewardItemId;
        putItem(map.reward, 'fixed', itemId);
    }
    if (!map.entry) {
        const choices = ordinaryPoints().filter(pos => !occupied.has(key(pos)));
        map.entry = choices[rng.int(choices.length)] ?? null;
    }
    if (!map.entry)
        return null;
    const component = reachable(map, map.entry, false);
    if (!component.size)
        return null;
    // Party anchors use ordinary connected floor; no actor/item is silently overwritten.
    const candidates = positions(map, (t, x, z) => ordinary(t) && !t.shop && !t.special && component.has(z * 56 + x)).filter(pos => !occupied.has(key(pos)) || key(pos) === key(map.entry ?? pos));
    candidates.sort((a, b) => Math.max(Math.abs(a.x - (map.entry?.x ?? 0)), Math.abs(a.z - (map.entry?.z ?? 0))) - Math.max(Math.abs(b.x - (map.entry?.x ?? 0)), Math.abs(b.z - (map.entry?.z ?? 0))) || key(a) - key(b));
    const partyPositions = context.nativeParty ? placeNativeEscortParty(map,context.nativeParty,dependencies,p.tileset) : [map.entry, ...candidates.filter(pos => key(pos) !== key(map.entry ?? pos)).slice(0, context.teamSize - 1)];
    if (!partyPositions || partyPositions.length !== context.teamSize)
        return null;
    for (const pos of partyPositions)
        occupied.add(key(pos));
    for (const request of context.required) {
        let choices = positions(map, (t, x, z) => ordinary(t) && !t.shop && !t.special && component.has(z * 56 + x)).filter(pos => !occupied.has(key(pos)));
        if (request.placement === 'fixed-anchor')
            choices = map.fixedRoleAnchors.filter(pos => !occupied.has(key(pos)) && component.has(key(pos)));
        if (request.placement === 'near-entry')
            choices.sort((a, b) => Math.abs(a.x - (map.entry?.x ?? 0)) + Math.abs(a.z - (map.entry?.z ?? 0)) - Math.abs(b.x - (map.entry?.x ?? 0)) - Math.abs(b.z - (map.entry?.z ?? 0)) || key(a) - key(b));
        const pos = request.placement === 'ordinary' ? choices[rng.int(choices.length)] : choices[0];
        if (!pos)
            return null;
        placements.push({ kind: 'required', request, position: pos });
        occupied.add(key(pos));
    }
    const actors = context.receivedTeam ?? context.fixedEncounter?.actors ?? (p.enemyDensity === 255 ? context.specialPopulation : null);
    if (actors) {
        const anchors = fixedFloor ? map.fixedRoleAnchors : positions(map, t => base(t));
        let cursor = 0;
        for (const encounter of actors) {
            let pos = null;
            for (; cursor < anchors.length; cursor++) {
                const candidate = anchors[cursor];
                if (candidate && !occupied.has(key(candidate)) && (component.has(key(candidate)) || fixedFloor && context.fixedEncounter?.isolatedRoleIds?.includes(encounter.roleId))) {
                    pos = candidate;
                    cursor++;
                    break;
                }
            }
            if (!pos)
                return null;
            placements.push({ kind: 'enemy', encounter, position: pos, route: context.receivedTeam ? 'received-team' : fixedFloor ? 'fixed' : 'ordinary' });
            occupied.add(key(pos));
        }
    }
    else if (!fixedFloor) {
        const density = p.enemyDensity;
        const count = Math.min(context.enemyLimit, (density > 0 ? Math.max(1, rng.range(Math.floor(density / 2), density)) : Math.abs(density)) + (context.missionAddsEnemy ? 1 : 0));
        const candidates = ordinaryPoints().filter(pos => !occupied.has(key(pos)));
        let missionClient = context.missionClient;
        for (const pos of choosePositions(candidates, count, rng)) {
            // Native first flagged monster becomes the level1 client without a
            // normal encounter sample; it is not an extra required placement.
            const encounter = missionClient ?? enemy(input, dependencies, rng, `ordinary-${placements.length}`);
            if (!encounter)
                return null;
            placements.push({ kind: 'enemy', encounter, position: pos, route: missionClient ? 'mission-client' : 'ordinary' });
            missionClient = undefined;
            occupied.add(key(pos));
        }
        if (map.forceHouse) {
            const house = positions(map, t => ordinary(t) && t.house && !t.special).filter(pos => !occupied.has(key(pos)));
            const count = Math.min(context.enemyLimit - placements.filter(p => p.kind === 'enemy').length, houseEmpty ? 4 : 18, Math.max(1, rng.range(Math.floor(house.length * 7 / 10), Math.floor(house.length * 8 / 10))));
            for (const pos of choosePositions(house, count, rng)) {
                const encounter = enemy(input, dependencies, rng, `house-${placements.length}`);
                if (!encounter)
                    return null;
                placements.push({ kind: 'enemy', encounter, position: pos, route: 'monsterHouse' });
                occupied.add(key(pos));
            }
        }
    }
    for (const room of map.rooms)
        if (room.kind === 'shop') {
            const b = room.bounds;
            let minX = b.x + 1, minZ = b.z + 1, maxX = b.x + b.width - 1, maxZ = b.z + b.height - 1;
            const width = Math.max(3, rng.range(3, maxX - minX - 2)), height = Math.max(3, rng.range(3, maxZ - minZ - 2)), rounds = rng.range(2, 4);
            for (let i = 0; i < rounds && maxX - minX > width; i++) {
                if (rng.int(100) < 50)
                    minX++;
                else
                    maxX--;
            }
            for (let i = 0; i < rounds && maxZ - minZ > height; i++) {
                if (rng.int(100) < 50)
                    minZ++;
                else
                    maxZ--;
            }
            for (const pos of positions(map, t => t.room === room.index && t.shop)) {
                const t = cell(map, pos.x, pos.z);
                if (t)
                    t.shop = pos.x >= minX && pos.z >= minZ && pos.x < maxX && pos.z < maxZ && !t.junction;
            }
            const origin = { x: Math.floor((minX + maxX) / 2) - 1, z: Math.floor((minZ + maxZ) / 2) - 1 }, chances = dependencies.navigation.shopChances(p.kecleonShopLayout);
            for (let dz = 0; dz < 3; dz++)
                for (let dx = 0; dx < 3; dx++) {
                    const pos = { x: origin.x + dx, z: origin.z + dz }, t = cell(map, pos.x, pos.z);
                    if (t?.shop && !t.house && !t.junction && (chances[dz]?.[dx] ?? 0) > rng.int(100))
                        putItem(pos, 'shop');
                }
            const keeper = positions(map, t => t.room === room.index && ordinary(t) && !t.junction).find(pos => !occupied.has(key(pos)));
            if (!keeper)
                return null;
            placements.push({ kind: 'shopkeeper', position: keeper, roomIndex: room.index });
            occupied.add(key(keeper));
        }
    if (map.exit && !component.has(key(map.exit)))
        return null;
    return { placements, partyPositions };
}
