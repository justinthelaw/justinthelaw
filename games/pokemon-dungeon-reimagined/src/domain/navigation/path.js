import { DIRECTIONS, canStep, canEnter, samePosition, inBounds } from './geometry.js';
/** @typedef {import('./types.js').Position} Position */
/** Deterministic breadth-first search, at most one visit per map cell. No RNG.
 * @param {import('./types.js').NavigationActor} actor @param {import('./types.js').NavigationMap} map @param {Position} goal @param {readonly import('./types.js').Occupant[]} occupancy @param {import('./types.js').NavigationContext} context @param {{allowOccupiedGoal:boolean,maxSteps:number}} options
 */
export function findPath(actor, map, goal, occupancy, context, options) {
    if (!inBounds(map, actor.position) || !inBounds(map, goal) || map.width * map.height > 4096 || !Number.isInteger(options.maxSteps) || options.maxSteps < 0 || options.maxSteps > 4096)
        throw new RangeError('Invalid path request.');
    const key = /** @param {Position} p */ /** @param {Position} p */ p => p.z * map.width + p.x;
    const queue = [actor.position], parents = new Map([[key(actor.position), -1]]), positions = new Map([[key(actor.position), actor.position]]), depths = new Map([[key(actor.position), 0]]);
    const occupied = options.allowOccupiedGoal ? occupancy.filter(other => !samePosition(other.position, goal)) : occupancy;
    for (let cursor = 0; cursor < queue.length && cursor < map.width * map.height; cursor++) {
        const from = queue[cursor];
        if (!from)
            break;
        if (samePosition(from, goal)) {
            /** @type {Position[]} */ const path = [];
            let next = key(goal);
            for (let count = 0; count <= map.width * map.height; count++) {
                const p = positions.get(next);
                const parent = parents.get(next);
                if (!p || parent === undefined || parent === -1)
                    break;
                path.push(p);
                next = parent;
            }
            return Object.freeze({ kind: /** @type {const} */ ('found'), path: Object.freeze(path.reverse().map(p => Object.freeze({ ...p }))) });
        }
        const depth = depths.get(key(from)) ?? 0;
        if (depth >= options.maxSteps)
            continue;
        for (const d of DIRECTIONS) {
            const to = { x: from.x + d.x, z: from.z + d.z }, k = key(to);
            if (parents.has(k) || !canStep(actor, map, from, to, occupied, context))
                continue;
            parents.set(k, key(from));
            positions.set(k, to);
            depths.set(k, depth + 1);
            queue.push(to);
        }
    }
    return Object.freeze({ kind: /** @type {const} */ ('unreachable'), path: Object.freeze([]) });
}
/** @param {import('./types.js').SwapActor} a */
function immobilized(a) { return a.immobilized || a.confused || a.sleep === 'other'; }
/** Swap is a proposed atomic exchange; scheduler owns timing and commit.
 * @param {import('./types.js').NavigationMap} map @param {import('./types.js').SwapActor} first @param {import('./types.js').SwapActor} second @param {import('./types.js').NavigationContext} context @param {boolean} confirmUnsafe @returns {import('./types.js').SwapResult}
 */
export function checkSwap(map, first, second, context, confirmUnsafe) {
    if (!second.swapEligible || immobilized(first) || immobilized(second) || second.charging)
        return { kind: 'blocked', reason: 'swap-status-or-affiliation' };
    if (!canStep(first.actor, map, first.actor.position, second.actor.position, [], context))
        return { kind: 'blocked', reason: 'leader-cannot-enter' };
    const unsafe = !canEnter(second.actor, map, first.actor.position, context);
    if (unsafe && !confirmUnsafe)
        return { kind: 'confirmation-required', reason: 'partner-terrain-relocation' };
    return Object.freeze({ kind: 'allowed', unsafe, first: Object.freeze({ ...second.actor.position }), second: Object.freeze({ ...first.actor.position }) });
}
