import { nextRandom, validateRandomState } from '../rng.js';
/** Operation-local stream cursor. Source scale-to-bound semantics on browser u16 draws. */
export class Draws {
    /** @param {import('./types.js').RandomState} state */
    constructor(state) { this.state = validateRandomState(state); this.used = 0; }
    /** @param {number} cap */
    int(cap) { if (!Number.isInteger(cap) || cap < 0 || cap > 65536)
        throw new RangeError('Invalid source random bound.'); if (++this.used > 2000000)
        throw new RangeError('Generation draw budget.'); const draw = nextRandom(this.state); this.state = draw.state; return Math.floor((draw.value >>> 16) * cap / 65536); }
    /** @param {number} a @param {number} b */
    range(a, b) { if (a === b)
        return a; return Math.min(a, b) + this.int(Math.abs(a - b)); }
    /** Source random swaps, deliberately not Fisher-Yates. @template T @param {T[]} values @param {number} count */
    swaps(values, count) { for (let i = 0; i < count; i++) {
        const a = this.int(values.length), b = this.int(values.length);
        const av = values[a], bv = values[b];
        if (av !== undefined && bv !== undefined) {
            values[a] = bv;
            values[b] = av;
        }
    } }
}
/** @returns {import('./types.js').Geometry} */
export function blankGeometry() {
    return { cells: Array.from({ length: 32 }, (_, z) => Array.from({ length: 56 }, (_, x) => ({ terrain: 'wall', impassable: x === 0 || z === 0 || x === 55 || z === 31, unbreakable: x === 0 || z === 0 || x === 55 || z === 31, door: false, sealed: false, room: null, junction: false, shop: false, house: false, cornerCuttable: false, special: false, required: false }))), rooms: [], entry: null, exit: null, fixedRoleAnchors: [], reward: null, keyDoor: null, forceHouse: false, externalSecondary: false, protectedBounds: null };
}
/** @param {import('./types.js').Geometry} map @param {number} x @param {number} z */
export function cell(map, x, z) { return map.cells[z]?.[x] ?? null; }
/** @param {import('./types.js').Geometry} map @param {import('./types.js').Bounds} bounds @param {number|null} room */
export function carve(map, bounds, room) {
    for (let z = bounds.z; z < bounds.z + bounds.height; z++)
        for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
            const t = cell(map, x, z);
            if (t && !t.impassable) {
                t.terrain = 'floor';
                t.room = room;
            }
        }
}
/** @param {import('./types.js').Geometry} map @param {import('./types.js').Bounds} bounds @param {import('./types.js').Room['kind']} kind */
export function addRoom(map, bounds, kind = 'ordinary') {
    const index = map.rooms.length;
    map.rooms.push({ index, bounds, kind, hidden: false, secondary: false, imperfect: false, maze: false, merged: false, gridPosition: null });
    carve(map, bounds, index);
    return index;
}
/** @param {import('./types.js').Bounds} b */
export function center(b) { return { x: b.x + Math.floor(b.width / 2), z: b.z + Math.floor(b.height / 2) }; }
/** @param {import('./types.js').Geometry} map @param {import('./types.js').Position} start @param {import('./types.js').Position} end */
export function corridor(map, start, end) {
    let x = start.x, z = start.z;
    for (let count = 0; count < 88; count++) {
        const t = cell(map, x, z);
        if (!t || t.impassable)
            break;
        t.terrain = 'floor';
        if (x === end.x && z === end.z)
            break;
        if (x !== end.x)
            x += Math.sign(end.x - x);
        else
            z += Math.sign(end.z - z);
    }
}
/** @param {import('./types.js').Geometry} map @param {(tile:import('./types.js').Cell,x:number,z:number)=>boolean} predicate */
export function positions(map, predicate) { /** @type {import('./types.js').Position[]} */ const result = []; for (let x = 0; x < 56; x++)
    for (let z = 0; z < 32; z++) {
        const t = cell(map, x, z);
        if (t && predicate(t, x, z))
            result.push({ x, z });
    } return result; }
/** @param {import('./types.js').Cell} t */
export function ordinary(t) { return t.terrain === 'floor' && !t.impassable && !t.sealed; }
/** Bounded graph traversal; actor movement uses its own source-specific predicate.
 * @param {import('./types.js').Geometry} map @param {import('./types.js').Position} origin @param {boolean} generationCorners
 */
export function reachable(map, origin, generationCorners = false) {
    const start = cell(map, origin.x, origin.z);
    const seen = new Set();
    if (!start || !ordinary(start))
        return seen;
    const queue = [origin];
    seen.add(origin.z * 56 + origin.x);
    const traversable = /** @param {number} x @param {number} z */ (x, z) => { const t = cell(map, x, z); return !!t && !t.impassable && !t.sealed && (ordinary(t) || (generationCorners && t.cornerCuttable)); };
    for (let i = 0; i < queue.length && i < 1792; i++) {
        const p = queue[i];
        if (!p)
            break;
        for (let dz = -1; dz <= 1; dz++)
            for (let dx = -1; dx <= 1; dx++) {
                if (!dx && !dz)
                    continue;
                const x = p.x + dx, z = p.z + dz, k = z * 56 + x;
                if (seen.has(k) || !traversable(x, z))
                    continue;
                if (dx && dz && (!traversable(p.x + dx, p.z) || !traversable(p.x, p.z + dz)))
                    continue;
                seen.add(k);
                queue.push({ x, z });
            }
    }
    return seen;
}
/** @param {import('./types.js').Geometry} map */
export function finalizeGeometry(map) {
    for (let x = 0; x < 56; x++)
        for (const z of [1, 30]) {
            const t = cell(map, x, z);
            if (t && !t.required) {
                t.terrain = 'wall';
                t.room = null;
            }
        }
    for (let z = 0; z < 32; z++)
        for (let x = 0; x < 56; x++) {
            const t = cell(map, x, z);
            if (!t)
                continue;
            if (t.impassable && !t.door && !t.sealed && t.terrain !== 'void')
                t.terrain = 'wall';
            if (ordinary(t) && t.room !== null)
                t.junction = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => { const n = cell(map, x + (dx ?? 0), z + (dz ?? 0)); return !!n && ordinary(n) && n.room === null; });
        }
}
/** Engineering recovery corridor around a protected chamber. Plane outside an
 * inset rectangle is connected; BFS visits <=1792 cells and never enters its shell.
 * @param {import('./types.js').Geometry} map @param {import('./types.js').Position} start @param {import('./types.js').Position} end @param {import('./types.js').Bounds} barrier
 */
export function routeAround(map, start, end, barrier) {
    const key = /** @param {import('./types.js').Position} p */ /** @param {import('./types.js').Position} p */ p => p.z * 56 + p.x;
    const queue = [start], parents = new Map([[key(start), -1]]), points = new Map([[key(start), start]]);
    for (let cursor = 0; cursor < queue.length && cursor < 1792; cursor++) {
        const p = queue[cursor];
        if (!p)
            break;
        if (key(p) === key(end))
            break;
        for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
            const x = p.x + (dx ?? 0), z = p.z + (dz ?? 0), t = cell(map, x, z), k = z * 56 + x;
            if (x < 1 || z < 2 || x > 54 || z > 29 || !t || t.impassable || parents.has(k) || x >= barrier.x && x < barrier.x + barrier.width && z >= barrier.z && z < barrier.z + barrier.height)
                continue;
            parents.set(k, key(p));
            points.set(k, { x, z });
            queue.push({ x, z });
        }
    }
    if (!parents.has(key(end)))
        return false;
    let next = key(end);
    for (let steps = 0; steps < 1792; steps++) {
        const p = points.get(next), parent = parents.get(next);
        if (!p || parent === undefined)
            return false;
        const t = cell(map, p.x, p.z);
        if (t)
            t.terrain = 'floor';
        if (parent === -1)
            return true;
        next = parent;
    }
    return false;
}
