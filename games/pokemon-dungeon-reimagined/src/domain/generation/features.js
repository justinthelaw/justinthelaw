import { cell, positions, ordinary, center } from './support.js';
/** @typedef {import('./types.js').Geometry} Geometry */
/** @typedef {import('./types.js').Room} Room */
/** @typedef {import('./support.js').Draws} Draws */
/** @param {Geometry} map @param {Room} room @param {(x:number,z:number)=>void} visit */
function eachRoom(map, room, visit) { const b = room.bounds; for (let z = b.z; z < b.z + b.height; z++)
    for (let x = b.x; x < b.x + b.width; x++) {
        if (cell(map, x, z)?.room === room.index)
            visit(x, z);
    } }
/** @param {Geometry} map @param {number} x @param {number} z */
function hallwayNear(map, x, z) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const t = cell(map, x + (dx ?? 0), z + (dz ?? 0)); return !!t && ordinary(t) && t.room === null; }); }
/** @param {Geometry} map @param {Room} room @param {Draws} rng @param {'water'|'lava'} liquid */
function maze(map, room, rng, liquid) {
    const b = room.bounds;
    room.maze = true;
    room.secondary = true;
    for (let z = b.z; z < b.z + b.height; z += 2)
        for (let x = b.x; x < b.x + b.width; x += 2) {
            let px = x, pz = z;
            for (let step = 0; step < b.width * b.height; step++) {
                const start = rng.int(4);
                let moved = false;
                for (let j = 0; j < 4; j++) {
                    const d = [[1, 0], [0, -1], [-1, 0], [0, 1]][(start + j) % 4];
                    if (!d)
                        continue;
                    const dx = d[0] ?? 0, dz = d[1] ?? 0, nx = px + dx * 2, nz = pz + dz * 2, t = cell(map, nx, nz);
                    if (nx <= b.x || nz <= b.z || nx >= b.x + b.width - 1 || nz >= b.z + b.height - 1 || !t || t.terrain !== 'floor')
                        continue;
                    for (const [tx, tz] of [[px, pz], [px + dx, pz + dz]]) {
                        const at = cell(map, tx ?? 0, tz ?? 0);
                        if (at && !hallwayNear(map, tx ?? 0, tz ?? 0))
                            at.terrain = liquid;
                    }
                    px = nx;
                    pz = nz;
                    moved = true;
                    break;
                }
                if (!moved)
                    break;
            }
        }
}
/** @param {Geometry} map @param {Room} room @param {Draws} rng @param {'water'|'lava'} liquid @param {number} budget */
function secondary(map, room, rng, liquid, budget) {
    const draw = rng.int(6), b = room.bounds, c = center(b);
    if (draw === 0)
        return budget;
    const set = /** @param {number} x @param {number} z @param {boolean} corner */ (x, z, corner = false) => { const t = cell(map, x, z); if (t && t.room === room.index && !t.impassable) {
        t.terrain = liquid;
        t.cornerCuttable = corner;
    } };
    if (draw === 3) {
        if (b.width < 5 || b.height < 5)
            return budget;
        const x1 = rng.range(b.x + 2, b.x + b.width - 3), z1 = rng.range(b.z + 2, b.z + b.height - 3), x2 = rng.range(b.x + 2, b.x + b.width - 3), z2 = rng.range(b.z + 2, b.z + b.height - 3);
        if (!budget)
            return budget;
        for (let z = Math.min(z1, z2); z <= Math.max(z1, z2); z++)
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++)
                set(x, z);
        return budget - 1;
    }
    if (!budget)
        return budget;
    if (draw === 1) {
        if (b.width % 2 && b.height % 2)
            maze(map, room, rng, liquid);
        else if (b.width >= 5 && b.height >= 5) {
            for (let i = -1; i <= 1; i++) {
                set(c.x + i, c.z);
                set(c.x, c.z + i);
            }
        }
        else
            set(c.x, c.z);
        return budget - 1;
    }
    if (draw === 2) {
        if (!(b.width % 2 && b.height % 2))
            return budget;
        for (let i = 0; i < 64; i++) {
            const x = rng.int(b.width), z = rng.int(b.height);
            if ((x + z) % 2)
                set(b.x + x, b.z + z);
        }
        return budget - 1;
    }
    if (draw === 4) {
        if (b.width < 6 || b.height < 6)
            return budget;
        for (let dz = -2; dz <= 1; dz++)
            for (let dx = -2; dx <= 1; dx++) {
                if (dx === -2 || dx === 1 || dz === -2 || dz === 1)
                    set(c.x + dx, c.z + dz, true);
                else {
                    const t = cell(map, c.x + dx, c.z + dz);
                    if (t)
                        t.special = true;
                }
            }
        return budget - 1;
    }
    const vertical = rng.int(2) !== 0;
    const line = [];
    for (let i = 0; i < (vertical ? b.height : b.width); i++)
        line.push({ x: vertical ? c.x : b.x + i, z: vertical ? b.z + i : c.z });
    if (!line.some(p => hallwayNear(map, p.x, p.z)))
        for (const p of line)
            set(p.x, p.z);
    return budget - 1;
}
/** Source feature ordering; ordinary maze attempt is intentionally unreachable.
 * @param {Geometry} map @param {Readonly<import('./types.js').Parameters>} p @param {import('./types.js').GenerationContext} context @param {Draws} rng @param {'water'|'lava'} liquid @param {number} budget @param {number} family
 */
export function applyRoomFeatures(map, p, context, rng, liquid, budget, family) {
    const canOrdinary = [0, 1, 8, 10, 11].includes(family), fixed = p.fixedRoomNumber !== 0;
    if (!fixed && canOrdinary && p.mazeRoomChance !== 0)
        rng.int(100); // Source attempt>=0 guard then exits.
    if (!fixed && !map.forceHouse && p.kecleonShopChance !== 0 && context.floorType !== 'rescue' && rng.int(100) < p.kecleonShopChance) {
        const xs = Array.from({ length: 15 }, (_, i) => i), zs = [...xs];
        rng.swaps(xs, 200);
        rng.swaps(zs, 200);
        const order = xs.flatMap(x => zs.flatMap(z => map.rooms.filter(r => r.gridPosition?.x === x && r.gridPosition?.z === z)));
        const room = order.find(r => !r.merged && !r.maze && !r.secondary && r.bounds.width >= 5 && r.bounds.height >= 4);
        if (room) {
            room.kind = 'shop';
            const b = room.bounds;
            eachRoom(map, room, (x, z) => { const t = cell(map, x, z); if (t) {
                t.special = true;
                t.shop = x > b.x && z > b.z && x < b.x + b.width - 1 && z < b.z + b.height - (b.height === 4 ? 0 : 1);
            } });
        }
    }
    const chance = map.forceHouse ? 999 : p.monsterHouseChance;
    if (!fixed && !map.rooms.some(r => r.kind === 'shop') && chance !== 0 && rng.int(100) < chance && !context.missionSuppressesHouse && context.floorType === 'normal') {
        const candidates = map.rooms.filter(r => !r.merged && !r.maze && !r.secondary && positions(map, t => t.room === r.index && ordinary(t)).length > 0);
        candidates.sort((a, b) => (a.gridPosition?.x ?? 0) - (b.gridPosition?.x ?? 0) || (a.gridPosition?.z ?? 0) - (b.gridPosition?.z ?? 0));
        const flags = candidates.map((_, i) => i === 0);
        rng.swaps(flags, 64);
        const room = candidates[flags.indexOf(true)];
        if (room) {
            room.kind = 'monster-house';
            eachRoom(map, room, (x, z) => { const t = cell(map, x, z); if (t)
                t.house = true; });
        }
    }
    if (fixed || map.forceHouse)
        return budget;
    // Bounded hallway walks, preserving source stride/turn distributions and size cutoff.
    for (let attempt = 0; attempt < p.numExtraHallways; attempt++) {
        const room = map.rooms[rng.int(map.rooms.length)];
        if (!room || room.maze)
            continue;
        const b = room.bounds;
        let x = b.x + rng.int(b.width), z = b.z + rng.int(b.height), dir = rng.int(4), stride = rng.range(3, 6);
        for (let step = 0; step < 1792; step++) {
            const d = [[1, 0], [0, -1], [-1, 0], [0, 1]][dir];
            if (!d)
                break;
            const dx = d[0] ?? 0, dz = d[1] ?? 0;
            x += dx;
            z += dz;
            const t = cell(map, x, z);
            if (!t || x < 2 || z < 2 || x >= 54 || z >= 30 || t.impassable || t.terrain === 'water' || t.terrain === 'lava')
                break;
            if (dir === 0 && ((family === 1 && x >= 32) || (family === 11 && x >= 48)))
                break;
            if (t.room !== null && t.room !== room.index)
                break;
            if (t.room === room.index)
                continue;
            if (ordinary(t))
                break;
            const sideA = cell(map, x + dz, z + dx), sideB = cell(map, x - dz, z - dx);
            if (sideA && ordinary(sideA) || sideB && ordinary(sideB))
                break;
            t.terrain = 'floor';
            if (--stride <= 0) {
                dir = (dir + (rng.int(2) ? 1 : 3)) % 4;
                stride = rng.range(3, 6);
            }
        }
    }
    for (const room of map.rooms) {
        if (!room.imperfect || room.merged || room.secondary || room.maze || rng.int(100) < 60)
            continue;
        const b = room.bounds;
        const corners = [{ x: b.x, z: b.z }, { x: b.x + b.width - 1, z: b.z }, { x: b.x + b.width - 1, z: b.z + b.height - 1 }, { x: b.x, z: b.z + b.height - 1 }];
        const directions = [[[0, 1], [1, 0]], [[-1, 0], [0, 1]], [[0, -1], [-1, 0]], [[1, 0], [0, -1]]];
        const expected = [[true, true, false, false], [true, false, false, true], [false, false, true, true], [false, true, true, false]];
        for (let round = 0; round < Math.max(1, Math.floor((b.width + b.height) / 4)); round++)
            for (let sweep = 0; sweep < 2; sweep++) {
                const corner = rng.int(4), start = corners[corner], d = directions[corner]?.[sweep];
                if (!start || !d)
                    continue;
                for (let search = 0; search < 10; search++) {
                    const x = start.x + (d[0] ?? 0) * search, z = start.z + (d[1] ?? 0) * search, t = cell(map, x, z);
                    if (!t || !ordinary(t))
                        continue;
                    let near = false;
                    for (let dz = -2; dz <= 2; dz++)
                        for (let dx = -2; dx <= 2; dx++) {
                            const n = cell(map, x + dx, z + dz);
                            if (n && ordinary(n) && n.room === null)
                                near = true;
                        }
                    const matching = [[0, 1], [1, 0], [0, -1], [-1, 0]].every(([dx, dz], i) => { const n = cell(map, x + (dx ?? 0), z + (dz ?? 0)); return (!!n && ordinary(n)) === expected[corner]?.[i]; });
                    if (!near && matching && !t.required)
                        t.terrain = 'wall';
                    break;
                }
            }
    }
    if (canOrdinary)
        for (const room of map.rooms)
            if (room.secondary && !room.imperfect && !room.merged && room.kind === 'ordinary')
                budget = secondary(map, room, rng, liquid, budget);
    return budget;
}
/** @param {Geometry} map @param {Readonly<import('./types.js').Parameters>} p @param {Draws} rng @param {'water'|'lava'} liquid */
export function applySecondaryTerrain(map, p, rng, liquid) {
    if (!map.externalSecondary || !(p.roomFlags & 1))
        return;
    const set = /** @param {number} x @param {number} z */ (x, z) => { const t = cell(map, x, z); if (x >= 2 && z >= 2 && x < 54 && z < 30 && t && t.terrain === 'wall' && !t.impassable && !t.unbreakable && !t.special)
        t.terrain = liquid; };
    const count = [1, 1, 1, 2, 2, 2, 3, 3][rng.int(8)] ?? 1;
    for (let n = 0; n < count; n++) {
        const down = rng.int(2) !== 0;
        let x = rng.range(2, 54), z = down ? 1 : 30, vertical = true, length = rng.range(2, 8), horizontal = rng.int(2) ? 1 : -1;
        const lakeAt = rng.range(10, 60);
        for (let step = 0; step < 1792; step++) {
            if (x < 1 || x > 54 || z < 1 || z > 30)
                break;
            const t = cell(map, x, z);
            if (t?.terrain === liquid)
                break;
            set(x, z);
            if (step === lakeAt) {
                for (let q = 0; q < 64; q++) {
                    const lx = x + rng.range(-3, 4), lz = z + rng.range(-3, 4);
                    if (lx < 2 || lz < 2 || lx >= 54 || lz >= 30)
                        continue;
                    if ([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dz]) => cell(map, lx + (dx ?? 0), lz + (dz ?? 0))?.terrain === liquid))
                        set(lx, lz);
                }
                for (let lz = z - 3; lz <= z + 3; lz++)
                    for (let lx = x - 3; lx <= x + 3; lx++) {
                        let neighbors = 0;
                        for (let dz = -1; dz <= 1; dz++)
                            for (let dx = -1; dx <= 1; dx++)
                                if ((dx || dz) && cell(map, lx + dx, lz + dz)?.terrain === liquid)
                                    neighbors++;
                        if (neighbors >= 4)
                            set(lx, lz);
                    }
            }
            if (vertical)
                z += down ? 1 : -1;
            else
                x += horizontal;
            if (--length <= 0) {
                vertical = !vertical;
                length = rng.range(2, 8);
                horizontal = rng.int(2) ? 1 : -1;
            }
        }
    }
    for (let n = 0; n < p.standaloneLakeDensity; n++) {
        let origin = null;
        for (let attempt = 0; attempt < 200; attempt++) {
            const x = rng.int(56), z = rng.int(32), t = cell(map, x, z);
            if (x > 0 && z > 0 && x < 55 && z < 31 && t?.terrain === 'wall' && !t.impassable && !t.unbreakable) {
                origin = { x, z };
                break;
            }
        }
        if (!origin)
            continue;
        const masks = Array.from({ length: 10 }, (_, z) => Array.from({ length: 10 }, (_, x) => x === 0 || z === 0 || x === 9 || z === 9));
        for (let i = 0; i < 80; i++) {
            const x = rng.range(1, 9), z = rng.range(1, 9);
            if (masks[z]?.[x - 1] || masks[z]?.[x + 1] || masks[z - 1]?.[x] || masks[z + 1]?.[x]) {
                const row = masks[z];
                if (row)
                    row[x] = true;
            }
        }
        for (let z = 1; z < 9; z++)
            for (let x = 1; x < 9; x++)
                if (!masks[z]?.[x])
                    set(origin.x + x - 5, origin.z + z - 5);
    }
}
