import { blankGeometry, carve, addRoom, corridor } from './support.js';
/** @typedef {import('./types.js').GridCell} GridCell */
/** @typedef {import('./types.js').Geometry} Geometry */
/** @typedef {import('./types.js').Bounds} Bounds */
/** @typedef {import('./support.js').Draws} Draws */
/** @param {number} raw */
export function layoutFamily(raw) { const n = raw % 16; return n >= 12 ? 0 : n; }
/** @param {number[]} xs @param {number[]} zs @returns {GridCell[]} */
function makeGrid(xs, zs) { const out = []; for (let z = 0; z < zs.length - 1; z++)
    for (let x = 0; x < xs.length - 1; x++)
        out.push({ x, z, valid: true, room: true, bounds: null, roomIndex: null, edges: new Set(), absorbed: false }); return out; }
/** @param {GridCell[]} grid @param {number} columns @param {number} x @param {number} z */
function at(grid, columns, x, z) { if (x < 0 || z < 0 || x >= columns)
    return null; return grid[z * columns + x] ?? null; }
/** @param {GridCell[]} grid @param {GridCell} a @param {GridCell|null} b */
function link(grid, a, b) { if (!a.valid || !b?.valid)
    return; a.edges.add(grid.indexOf(b)); b.edges.add(grid.indexOf(a)); }
/** @param {GridCell[]} grid @param {number} columns @param {number} rows @param {import('./types.js').Parameters|Readonly<import('./types.js').Parameters>} p @param {Draws} rng */
function assignRooms(grid, columns, rows, p, rng) {
    const extra = rng.int(3), count = p.roomDensity < 0 ? -p.roomDensity : p.roomDensity + extra;
    const flags = Array.from({ length: 256 }, (_, i) => i < count);
    for (let i = 0; i < 64; i++) {
        const a = rng.int(columns * rows), b = rng.int(columns * rows);
        const v = flags[a] ?? false;
        flags[a] = flags[b] ?? false;
        flags[b] = v;
    }
    let cursor = 0, rooms = 0;
    for (let x = 0; x < columns; x++)
        for (let z = 0; z < rows; z++) {
            const g = at(grid, columns, x, z);
            if (!g?.valid)
                continue;
            g.room = flags[cursor++] ?? false;
            if (g.room)
                rooms++;
            if (columns % 2 && x === (columns - 1) / 2 && z === 1)
                g.room = false;
        }
    if (rooms < 2)
        for (let attempt = 0; attempt < 200; attempt++) {
            let found = false;
            for (let x = 0; x < columns && !found; x++)
                for (let z = 0; z < rows; z++) {
                    const g = at(grid, columns, x, z);
                    if (g?.valid && rng.int(100) < 60) {
                        g.room = true;
                        found = true;
                        break;
                    }
                }
            if (found)
                break;
        }
}
/** @param {Geometry} map @param {GridCell[]} grid @param {number[]} xs @param {number[]} zs @param {Draws} rng @param {number} family @param {import('./types.js').Parameters|Readonly<import('./types.js').Parameters>} p @param {number} budget */
function carveCells(map, grid, xs, zs, rng, family, p, budget) {
    const columns = xs.length - 1, rows = zs.length - 1;
    for (const g of grid) {
        if (!g.valid)
            continue;
        const left = xs[g.x] ?? 0, top = zs[g.z] ?? 0, cw = (xs[g.x + 1] ?? 56) - left, ch = (zs[g.z + 1] ?? 32) - top;
        if (g.room) {
            const special = family === 3 || family === 4, two = family === 5;
            const rw = cw - (special || two ? 3 : 4), rh = ch - 3;
            let w = rng.range(two ? 10 : 5, rw), h = rng.range(two ? 16 : 4, rh);
            if (!special && !two) {
                if ((w | 1) < rw)
                    w |= 1;
                if ((h | 1) < rh)
                    h |= 1;
                if (w > Math.floor(h * 3 / 2))
                    w = Math.floor(h * 3 / 2);
                if (h > Math.floor(w * 3 / 2))
                    h = Math.floor(w * 3 / 2);
            }
            g.bounds = { x: left + (two ? 1 : 2) + rng.int(Math.max(0, rw - w)), z: top + (two ? 1 : 2) + rng.int(Math.max(0, rh - h)), width: w, height: h };
            g.roomIndex = addRoom(map, g.bounds);
            const room = map.rooms[g.roomIndex];
            if (room)
                room.gridPosition = { x: g.x, z: g.z };
            if (room && !special && !two) {
                let secondary = rng.int(100) < 80;
                secondary = secondary && budget > 0;
                let imperfect = (p.roomFlags & 4) !== 0;
                if (secondary && imperfect) {
                    if (rng.int(100) < 50)
                        imperfect = false;
                    else
                        secondary = false;
                }
                room.secondary = secondary;
                room.imperfect = imperfect;
            }
        }
        else {
            const special = family === 3 || family === 4;
            const x = special ? left + 1 + rng.int(Math.max(0, cw - 3)) : rng.range(left + 2 + (g.x === 0 ? 1 : 2), left + 2 + cw - 4 - (g.x === columns - 1 ? 2 : 4));
            const z = special ? top + 1 + rng.int(Math.max(0, ch - 3)) : rng.range(top + 2 + (g.z === 0 ? 1 : 2), top + 2 + ch - 3 - (g.z === rows - 1 ? 2 : 4));
            g.bounds = { x, z, width: 1, height: 1 };
            carve(map, g.bounds, null);
        }
    }
}
/** Finite adaptation: actual selected neighbor replaces native erroneous right-neighbor read.
 * @param {GridCell[]} grid @param {number} columns @param {number} rows @param {number} iterations @param {boolean} deadEnds @param {Draws} rng
 */
function randomConnections(grid, columns, rows, iterations, deadEnds, rng) {
    let current = at(grid, columns, rng.int(columns), rng.int(rows)), direction = rng.int(4);
    const directions = [[1, 0], [0, -1], [-1, 0], [0, 1]];
    for (let i = 0; i < iterations; i++) {
        const replace = rng.int(8) < 4, draw = rng.int(4);
        if (replace)
            direction = draw;
        if (!current)
            break;
        let next = null;
        for (let turn = 0; turn < 4; turn++) {
            const d = directions[direction % 4];
            next = d ? at(grid, columns, current.x + (d[0] ?? 0), current.z + (d[1] ?? 0)) : null;
            if (next)
                break;
            direction++;
        }
        if (next?.valid) {
            link(grid, current, next);
            current = next;
        }
    }
    if (deadEnds)
        return;
    for (let pass = 0; pass < 2 * columns * rows; pass++) {
        let added = false;
        for (const g of grid) {
            if (!g.valid || g.room || g.edges.size !== 1)
                continue;
            for (let attempt = 0; attempt < 8; attempt++) {
                const d = directions[rng.int(4)], n = d ? at(grid, columns, g.x + (d[0] ?? 0), g.z + (d[1] ?? 0)) : null;
                if (n?.valid && !g.edges.has(grid.indexOf(n))) {
                    link(grid, g, n);
                    added = true;
                    break;
                }
            }
        }
        if (!added)
            break;
    }
}
/** @param {GridCell[]} grid @param {number} columns */
function connectStranded(grid, columns) {
    const seed = grid.findIndex(g => g.valid && g.room);
    if (seed < 0)
        return;
    const visited = new Set([seed]);
    for (let pass = 0; pass < grid.length; pass++) {
        let grew = false;
        for (const i of [...visited])
            for (const n of grid[i]?.edges ?? []) {
                if (!visited.has(n) && grid[n]?.valid) {
                    visited.add(n);
                    grew = true;
                }
            }
        for (let i = 0; i < grid.length; i++) {
            const g = grid[i];
            if (!g?.valid || visited.has(i))
                continue;
            for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
                const n = at(grid, columns, g.x + (dx ?? 0), g.z + (dz ?? 0));
                if (n && visited.has(grid.indexOf(n))) {
                    link(grid, g, n);
                    visited.add(i);
                    grew = true;
                    break;
                }
            }
        }
        if (!grew)
            break;
    }
    for (let i = 0; i < grid.length; i++)
        if (!visited.has(i)) {
            const g = grid[i];
            if (g)
                g.valid = false;
        }
}
/** @param {Geometry} map @param {GridCell[]} grid @param {number[]} xs @param {number[]} zs @param {Draws} rng @param {boolean} merge */
function joinCells(map, grid, xs, zs, rng, merge) {
    for (let i = 0; i < grid.length; i++) {
        const a = grid[i];
        if (!a?.valid || !a.bounds)
            continue;
        for (const j of [...a.edges].sort((x, y) => x - y)) {
            const b = grid[j];
            if (j < i || !b?.valid || !b.bounds)
                continue;
            const ap = { x: a.bounds.x + rng.int(a.bounds.width), z: a.bounds.z + rng.int(a.bounds.height) }, bp = { x: b.bounds.x + rng.int(b.bounds.width), z: b.bounds.z + rng.int(b.bounds.height) };
            if (a.x !== b.x) {
                const middle = xs[Math.max(a.x, b.x)] ?? Math.floor((ap.x + bp.x) / 2);
                corridor(map, ap, { x: middle, z: ap.z });
                corridor(map, { x: middle, z: ap.z }, { x: middle, z: bp.z });
                corridor(map, { x: middle, z: bp.z }, bp);
            }
            else {
                const middle = zs[Math.max(a.z, b.z)] ?? Math.floor((ap.z + bp.z) / 2);
                corridor(map, ap, { x: ap.x, z: middle });
                corridor(map, { x: ap.x, z: middle }, { x: bp.x, z: middle });
                corridor(map, { x: bp.x, z: middle }, bp);
            }
        }
    }
    if (merge)
        for (const a of grid) {
            if (rng.int(100) >= 5 || a.roomIndex === null || !a.bounds || a.absorbed)
                continue;
            const d = [[1, 0], [0, -1], [-1, 0], [0, 1]][rng.int(4)], b = d ? at(grid, xs.length - 1, a.x + (d[0] ?? 0), a.z + (d[1] ?? 0)) : null;
            if (!b?.valid || b.roomIndex === null || !b.bounds || b.absorbed || !a.edges.has(grid.indexOf(b)))
                continue;
            const ra = map.rooms[a.roomIndex], rb = map.rooms[b.roomIndex];
            if (!ra || !rb || ra.merged || rb.merged)
                continue;
            const x = Math.min(a.bounds.x, b.bounds.x), z = Math.min(a.bounds.z, b.bounds.z);
            const bounds = { x, z, width: Math.max(a.bounds.x + a.bounds.width, b.bounds.x + b.bounds.width) - x, height: Math.max(a.bounds.z + a.bounds.height, b.bounds.z + b.bounds.height) - z };
            carve(map, bounds, a.roomIndex);
            ra.bounds = bounds;
            ra.merged = true;
            rb.merged = true;
            b.absorbed = true;
        }
}
/** All12 family constructions, default aliases13/15 included. Shared feature stages are separate.
 * @param {Readonly<import('./types.js').Parameters>} p @param {Draws} rng @param {number} budget @returns {Geometry}
 */
export function buildLayout(p, rng, budget) {
    const family = layoutFamily(p.layout), map = blankGeometry();
    let columns = 4, rows = 4;
    for (let attempt = 0; attempt < 32; attempt++) {
        columns = p.layout === 8 ? rng.range(2, 5) : rng.range(2, 9);
        rows = p.layout === 8 ? rng.range(2, 4) : rng.range(2, 8);
        if (columns <= 6 && rows <= 4)
            break;
        if (attempt === 31) {
            columns = 4;
            rows = 4;
        }
    }
    if (Math.floor(56 / columns) < 8)
        columns = 1;
    if (Math.floor(32 / rows) < 8)
        rows = 1;
    if (family === 1 || family === 11) {
        columns = 4;
        rows = 2 + rng.int(2);
    }
    let xs = Array.from({ length: columns + 1 }, (_, i) => i * Math.floor(56 / columns)), zs = Array.from({ length: rows + 1 }, (_, i) => i * Math.floor(32 / rows));
    if (family === 2) {
        addRoom(map, { x: 2, z: 2, width: 52, height: 28 });
        map.forceHouse = true;
        return map;
    }
    if (family === 3) {
        xs = [0, 5, 16, 28, 39, 51, 56];
        zs = [2, 7, 16, 25, 30];
    }
    if (family === 4) {
        xs = [0, 11, 22, 33, 44, 56];
        zs = [1, 9, 16, 23, 31];
    }
    if (family === 5) {
        xs = [2, 28, 54];
        zs = [2, 30];
        map.forceHouse = true;
    }
    if (family === 6) {
        xs = [0, 11, 22, 33, 44, 56];
        zs = [4, 15];
    }
    if (family === 7) {
        xs = [11, 22, 33, 44];
        zs = [2, 11, 20, 30];
    }
    if (family === 9) {
        xs = [5, 15, 35, 50];
        zs = [2, 11, 20, 30];
    }
    columns = xs.length - 1;
    rows = zs.length - 1;
    const grid = makeGrid(xs, zs);
    for (const g of grid) {
        const edge = g.x === 0 || g.z === 0 || g.x === columns - 1 || g.z === rows - 1, corner = (g.x === 0 || g.x === columns - 1) && (g.z === 0 || g.z === rows - 1);
        if (family === 1 && g.x >= columns / 2)
            g.valid = false;
        if (family === 11 && g.x >= columns * 3 / 4)
            g.valid = false;
        if (family === 3)
            g.room = !edge;
        if (family === 4) {
            g.valid = !corner;
            g.room = edge;
        }
        if (family === 7)
            g.valid = !corner;
        if (family === 10)
            g.valid = edge;
    }
    if ([0, 1, 6, 8, 11].includes(family))
        assignRooms(grid, columns, rows, p, rng);
    carveCells(map, grid, xs, zs, rng, family, p, budget);
    for (const g of grid) {
        if (!g.valid)
            continue;
        const right = at(grid, columns, g.x + 1, g.z), down = at(grid, columns, g.x, g.z + 1);
        if (family === 3) {
            if (g.z === 0 || g.z === rows - 1)
                link(grid, g, right);
            if (g.x === 0 || g.x === columns - 1)
                link(grid, g, down);
        }
        if (family === 4) {
            if (g.z > 0 && g.z < rows - 1)
                link(grid, g, right);
            if (g.x > 0 && g.x < columns - 1)
                link(grid, g, down);
        }
        if (family === 5 || family === 9)
            link(grid, g, right);
        if (family === 7) {
            link(grid, g, right);
            link(grid, g, down);
        }
        if (family === 10) {
            if ((g.z === 0 || g.z === rows - 1) && g.x > 0 && g.x < columns - 2)
                link(grid, g, right);
            if ((g.x === 0 || g.x === columns - 1) && g.z < rows - 1)
                link(grid, g, down);
        }
    }
    if ([0, 1, 3, 6, 8, 11].includes(family))
        randomConnections(grid, columns, rows, p.floorConnectivity, p.allowDeadEnds !== 0, rng);
    connectStranded(grid, columns);
    joinCells(map, grid, xs, zs, rng, [0, 1, 3, 5, 8, 10, 11].includes(family));
    if (family === 9) {
        const spine = grid.filter(g => g.x === 1 && g.bounds);
        const first = spine[0], last = spine.at(-1);
        if (first?.bounds && last?.bounds && first.roomIndex !== null) {
            const x = Math.min(...spine.map(g => g.bounds?.x ?? 56)), end = Math.max(...spine.map(g => (g.bounds?.x ?? 0) + (g.bounds?.width ?? 0)));
            const bounds = { x, z: first.bounds.z, width: end - x, height: last.bounds.z + last.bounds.height - first.bounds.z };
            carve(map, bounds, first.roomIndex);
            const r = map.rooms[first.roomIndex];
            if (r)
                r.bounds = bounds;
        }
    }
    map.externalSecondary = [0, 1, 3, 4, 6, 8, 10, 11].includes(family);
    return map;
}
/** Source fallback, never the normal implementation for another family. @returns {Geometry} */
export function fallbackLayout() { const map = blankGeometry(); addRoom(map, { x: 2, z: 2, width: 52, height: 28 }); map.forceHouse = true; return map; }
