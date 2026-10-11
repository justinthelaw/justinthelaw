import { cell, ordinary } from './support.js';
/** Five hallway attempts follow the admitted Tiny Woods layout, before finalization.
 * The input is the unchanged geometry returned by buildLayout. The original
 * shop/house/maze guards draw nothing for these three profiles; every room has
 * secondary=false and imperfect=false, so their later feature stages are inert.
 * @param {import('./types.js').Geometry} map @param {import('./support.js').Draws} rng */
export function addTinyWoodsHallways(map, rng) {
    for (let attempt = 0; attempt < 5; attempt++) {
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
            if (dir === 0 && x >= 32)
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
}
