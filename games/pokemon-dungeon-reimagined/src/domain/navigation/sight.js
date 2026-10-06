import { tileAt, inBounds } from './geometry.js';
import { snapshotNavigationData } from '../../../content/navigation.js';
/** @typedef {import('./types.js').NavigationMap} NavigationMap */
/** @typedef {import('./types.js').Position} Position */
/** @param {NavigationMap} map @param {Position} origin @param {Position} target @param {number} visibilityRange */
export function isActuallyInSight(map, origin, target, visibilityRange) {
    const tile = tileAt(map, origin);
    if (!tile || !inBounds(map, target))
        return false;
    if (!Number.isInteger(visibilityRange) || visibilityRange < 0 || visibilityRange > 64)
        throw new RangeError('Invalid floor visibility.');
    if (tile.roomId === null)
        return Math.max(Math.abs(origin.x - target.x), Math.abs(origin.z - target.z)) <= (visibilityRange || 2);
    const room = map.rooms[tile.roomId];
    if (!room)
        throw new Error('Absent sight room.');
    const b = room.bounds;
    return target.x >= b.x - 1 && target.z >= b.z - 1 && target.x < b.x + b.width + 1 && target.z < b.z + b.height + 1;
}
/** @param {NavigationMap} map @param {Position} origin @param {Position} target @param {import('./types.js').NavigationContext} context */
export function isExtendedTargetInSight(map, origin, target, context) {
    const tile = tileAt(map, origin);
    if (!tile || !inBounds(map, target))
        return false;
    if (tile.roomId !== null && isActuallyInSight(map, origin, target, context.visibilityRange))
        return true;
    const distance = Math.max(Math.abs(origin.x - target.x), Math.abs(origin.z - target.z));
    if (distance <= 1)
        return true;
    if (distance > 2)
        return false;
    for (const [start, end] of [[origin, target], [target, origin]]) {
        if (!start || !end)
            return false;
        let p = { ...start };
        for (let step = 0; step < 2; step++) {
            p = { x: p.x + Math.sign(end.x - p.x), z: p.z + Math.sign(end.z - p.z) };
            const at = tileAt(map, p);
            if (!at || context.catalog.terrain(at.terrainId).kind === 'wall')
                return false;
        }
    }
    return true;
}
/** @param {NavigationMap} map @param {import('./types.js').SightViewer} viewer @param {import('./types.js').VisibleActor} target @param {import('./types.js').NavigationContext} context @param {'actual'|'extended'|'room-move'} policy */
export function canSeeActor(map, viewer, target, context, policy) {
    if (!target.present)
        return false;
    if (policy !== 'room-move' && (viewer.blinded || (target.invisible && !viewer.seesInvisible)))
        return false;
    return policy === 'extended' ? isExtendedTargetInSight(map, viewer.position, target.position, context) : isActuallyInSight(map, viewer.position, target.position, context.visibilityRange);
}
/** Current terrain sight is distinct from entity blindness and explored memory.
 * @param {NavigationMap} map @param {Position} origin @param {number} visibilityRange
 */
export function visibleTiles(map, origin, visibilityRange) {
    if (map.width * map.height > 4096 || map.width <= 0 || map.height <= 0)
        throw new RangeError('Invalid map dimensions.');
    return Object.freeze(Array.from({ length: map.height }, (_, z) => Object.freeze(Array.from({ length: map.width }, (_, x) => isActuallyInSight(map, origin, { x, z }, visibilityRange)))));
}
/** Immutable renderer-compatible view. Caller may commit returned explored memory separately.
 * @param {import('./types.js').VisibilityInput} input @returns {import('../../presentation/types.js').VisibilityView}
 */
export function projectVisibility(input) {
    const { map, viewer, context } = input, visible = visibleTiles(map, viewer.position, context.visibilityRange);
    const explored = visible.map((row, z) => row.map((value, x) => value || map.knowledge.layoutRevealed || map.knowledge.explored[z]?.[x] === true));
    const isVisible = /** @param {Position} p */ /** @param {Position} p */ p => visible[p.z]?.[p.x] === true;
    return snapshotNavigationData({ mapId: map.mapId, revision: input.revision, visible, explored,
        actorIds: input.actors.filter(a => canSeeActor(map, viewer, a, context, 'actual')).map(a => a.actorId),
        itemIds: input.items.filter(i => i.onGround && isVisible(i.position)).map(i => i.itemId),
        trapIds: Object.values(map.traps).filter(t => (t.revealed || input.revealTraps) && isVisible(t.position)).map(t => t.trapId),
        exitIds: Object.values(map.exits).filter(e => map.knowledge.stairsRevealed || explored[e.position.z]?.[e.position.x]).map(e => e.exitId) });
}
