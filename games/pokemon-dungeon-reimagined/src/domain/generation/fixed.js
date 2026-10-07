import { buildSteelArena } from './steel-arena.js';
import { blankGeometry, cell, addRoom, carve, center, routeAround } from './support.js';
/** @typedef {import('./types.js').Geometry} Geometry */
/** @typedef {import('../../../content/navigation-types.js').ReadonlyData<import('../../../content/navigation-types.js').FixedDefinition>} FixedDefinition */
/** Independently authored arenas: dimensions, protected barriers and tactical roles
 * come from facts, never source tile arrays. Role anchors are authored positions.
 * @param {FixedDefinition} fixed @param {'water'|'lava'} liquid @returns {Geometry}
 */
export function buildFixedArena(fixed, liquid) {
    if (fixed.index === 1) return buildSteelArena();
    const map = blankGeometry(), b = { x: 5, z: 5, width: fixed.width, height: fixed.height };
    map.protectedBounds = b;
    for (const row of map.cells)
        for (const t of row) {
            t.impassable = true;
            t.unbreakable = true;
        }
    const inner = { x: b.x + 1, z: b.z + 1, width: b.width - 2, height: b.height - 2 };
    for (let z = inner.z; z < inner.z + inner.height; z++)
        for (let x = inner.x; x < inner.x + inner.width; x++) {
            const t = cell(map, x, z);
            if (t) {
                t.impassable = false;
                t.terrain = 'floor';
            }
        }
    const room = addRoom(map, inner);
    const axis = inner.x + Math.floor(inner.width / 2);
    // Deterministic corner cut-outs distinguish arenas while keeping a broad floor route.
    const cut = fixed.index % 3;
    for (let z = inner.z; z < inner.z + inner.height; z++)
        for (let x = inner.x; x < inner.x + inner.width; x++) {
            const t = cell(map, x, z);
            if (!t)
                continue;
            const edgeX = Math.min(x - inner.x, inner.x + inner.width - 1 - x), edgeZ = Math.min(z - inner.z, inner.z + inner.height - 1 - z);
            if (cut > 0 && edgeX + edgeZ < cut && Math.abs(x - axis) > 1) {
                t.terrain = fixed.hasVoid ? 'void' : fixed.hasLiquid ? liquid : 'wall';
                t.impassable = t.terrain === 'wall';
            }
        }
    map.entry = { x: axis, z: inner.z + inner.height - 2 };
    const entry = cell(map, map.entry.x, map.entry.z);
    if (entry) {
        entry.required = true;
        entry.terrain = 'floor';
        entry.impassable = false;
    }
    for (let z = inner.z + 1; z < inner.z + inner.height - 3; z++)
        for (let offset = 0; offset < inner.width; offset++) {
            const x = inner.x + (offset + Math.floor(inner.width / 2)) % inner.width, t = cell(map, x, z);
            if (t && t.terrain === 'floor' && !t.impassable)
                map.fixedRoleAnchors.push({ x, z });
        }
    map.exit = { x: axis, z: inner.z + 1 };
    const exit = cell(map, map.exit.x, map.exit.z);
    if (exit) {
        exit.required = true;
        exit.terrain = 'floor';
        exit.impassable = false;
        exit.room = room;
    }
    return map;
}
/** Complete reward chamber access graph with newly authored geometry.
 * @param {FixedDefinition} fixed @param {import('./types.js').Parameters|Readonly<import('./types.js').Parameters>} p @param {import('./support.js').Draws} rng @param {'water'|'lava'} liquid @returns {Geometry}
 */
export function buildEmbeddedChamber(fixed, p, rng, liquid) {
    const map = blankGeometry(), columns = Math.max(1, Math.floor(56 / (fixed.width + 4))), rows = Math.max(1, Math.floor(32 / (fixed.height + 4)));
    const gx = rng.int(columns), gz = rng.int(rows), cw = Math.floor(56 / columns), ch = Math.floor(32 / rows);
    const b = { x: gx * cw + 2, z: gz * ch + 2, width: fixed.width, height: fixed.height };
    map.protectedBounds = b;
    const chamber = addRoom(map, b, 'reward-chamber'), room = map.rooms[chamber];
    if (room)
        room.hidden = fixed.doors > 0;
    /** @type {import('./types.js').Position[]} */ const ordinaryCenters = [];
    for (let z = 0; z < rows; z++)
        for (let x = 0; x < columns; x++) {
            if (x === gx && z === gz)
                continue;
            const width = Math.max(5, Math.min(cw - 4, rng.range(5, Math.max(6, cw - 3)))), height = Math.max(4, Math.min(ch - 4, rng.range(4, Math.max(5, ch - 3))));
            const box = { x: x * cw + 2, z: z * ch + 2, width, height };
            addRoom(map, box);
            ordinaryCenters.push(center(box));
        }
    for (let i = 1; i < ordinaryCenters.length; i++) {
        const a = ordinaryCenters[i - 1], end = ordinaryCenters[i];
        if (a && end)
            routeAround(map, a, end, b);
    }
    const door = { x: b.x + Math.floor(b.width / 2), z: b.z + b.height - 1 }, approach = { x: door.x, z: door.z + 1 };
    const near = ordinaryCenters.reduce((best, point) => Math.abs(point.x - approach.x) + Math.abs(point.z - approach.z) < Math.abs(best.x - approach.x) + Math.abs(best.z - approach.z) ? point : best, ordinaryCenters[0] ?? { x: 2, z: 2 });
    routeAround(map, near, approach, b);
    // Reapply chamber shell after surrounding corridors, so a corridor never bypasses its gate.
    for (let z = b.z; z < b.z + b.height; z++)
        for (let x = b.x; x < b.x + b.width; x++) {
            const t = cell(map, x, z);
            if (!t)
                continue;
            const boundary = x === b.x || z === b.z || x === b.x + b.width - 1 || z === b.z + b.height - 1;
            t.room = chamber;
            t.terrain = boundary ? 'wall' : 'floor';
            t.impassable = boundary;
            t.unbreakable = true;
            t.special = true;
            t.sealed = false;
        }
    const reward = { x: b.x + Math.floor(b.width / 2), z: b.z + Math.floor(b.height / 2) - 1 };
    map.reward = reward;
    if (fixed.access !== 'floor')
        for (let dz = -1; dz <= 1; dz++)
            for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dz)
                    continue;
                const x = reward.x + dx, z = reward.z + dz, t = cell(map, x, z);
                if (!t || x <= b.x || z <= b.z || x >= b.x + b.width - 1 || z >= b.z + b.height - 1)
                    continue;
                t.terrain = fixed.access === 'liquid' ? liquid : 'wall';
                t.unbreakable = fixed.access !== 'wall';
            }
    const rewardTile = cell(map, reward.x, reward.z);
    if (rewardTile) {
        rewardTile.terrain = 'floor';
        rewardTile.impassable = false;
        rewardTile.required = true;
    }
    const d = cell(map, door.x, door.z);
    if (d) {
        d.terrain = 'floor';
        d.impassable = fixed.doors > 0;
        d.door = fixed.doors > 0;
        d.required = true;
    }
    if (fixed.doors > 0) {
        map.keyDoor = door;
        for (let z = b.z + 1; z < b.z + b.height - 1; z++)
            for (let x = b.x + 1; x < b.x + b.width - 1; x++) {
                const t = cell(map, x, z);
                if (t)
                    t.sealed = true;
            }
    }
    // Keep one-cell floor approach inside unlocked floor-access chambers.
    if (fixed.access === 'floor')
        carve(map, { x: door.x, z: reward.z, width: 1, height: door.z - reward.z }, chamber);
    const a = cell(map, approach.x, approach.z);
    if (a) {
        a.terrain = 'floor';
        a.impassable = false;
        a.required = true;
    }
    map.entry = null;
    map.externalSecondary = false;
    return map;
}
