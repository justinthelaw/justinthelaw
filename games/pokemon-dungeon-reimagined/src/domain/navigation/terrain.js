import { tileAt } from './geometry.js';
import { snapshotNavigationData } from '../../../content/navigation.js';
/** Door is north of user regardless of facing. No item consumption or turn cost here.
 * @param {import('./types.js').NavigationMap} map @param {import('./types.js').Position} position @param {import('./types.js').NavigationContext} context
 */
export function openKeyDoor(map, position, context) {
    const target = { x: position.x, z: position.z - 1 }, door = tileAt(map, target);
    if (!door || !context.catalog.terrain(door.terrainId).door || door.roomId === null)
        return Object.freeze({ kind: /** @type {const} */ ('blocked'), reason: 'no-closed-door-north' });
    const roomId = door.roomId, room = map.rooms[roomId];
    if (!room)
        throw new Error('Absent locked chamber.');
    const tiles = map.tiles.map(row => row.map(cell => { const t = context.catalog.terrain(cell.terrainId); return cell.roomId === roomId && t.revealedTerrainId ? { ...cell, terrainId: /** @type {import('../../contracts/campaign.js').TerrainId} */ (t.revealedTerrainId) } : { ...cell }; }));
    return snapshotNavigationData({ kind: /** @type {const} */ ('opened'), floor: { ...map, tiles, knowledge: { ...map.knowledge, explored: map.tiles.map((row, z) => row.map((cell, x) => cell.roomId === roomId || map.knowledge.explored[z]?.[x] === true)) }, rooms: { ...map.rooms, [roomId]: { ...room, initiallyHidden: false } } } });
}
/** Post-step terrain requests; actual statuses/Belly are committed by the effect owner.
 * @param {import('./types.js').NavigationMap} map @param {import('./types.js').NavigationActor} actor @param {import('./types.js').NavigationContext} context @param {{leader:boolean,frozen:boolean,burned:boolean}} status
 */
export function applyTerrainStep(map, actor, context, status) {
    const tile = tileAt(map, actor.position);
    if (!tile)
        throw new RangeError('Off-map terrain step.');
    const terrain = context.catalog.terrain(tile.terrainId);
    const breakWall = terrain.kind === 'wall' && !terrain.impassable && !tile.unbreakable && actor.superMobile && !actor.mobile && !actor.mobileScarf && context.tileset <= 63;
    const tiles = breakWall ? map.tiles.map((row, z) => row.map((cell, x) => x === actor.position.x && z === actor.position.z ? { ...cell, terrainId: /** @type {import('../../contracts/campaign.js').TerrainId} */ ('terrain-floor') } : { ...cell })) : map.tiles;
    const native = context.catalog.mobility(actor.identity.speciesId, actor.identity.formId).movementType;
    return snapshotNavigationData({ floor: { ...map, tiles }, wallBroken: breakWall, wallBellyCost: status.leader && terrain.kind === 'wall' && !breakWall ? 5 : 0,
        thaw: terrain.kind === 'lava' && status.frozen, burnAttempt: terrain.kind === 'lava' && native !== 4 && !['pokemon-146', 'pokemon-250'].includes(actor.identity.speciesId) && !status.burned, cureBurn: terrain.kind === 'water' && status.burned });
}
