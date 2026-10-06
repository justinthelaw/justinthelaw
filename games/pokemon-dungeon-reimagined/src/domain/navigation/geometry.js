/** @typedef {import('./types.js').NavigationMap} NavigationMap */
/** @typedef {import('./types.js').Position} Position */
/** @typedef {import('./types.js').NavigationActor} NavigationActor */
/** @typedef {import('./types.js').NavigationContext} NavigationContext */
/** @typedef {import('./types.js').Occupant} Occupant */
export const DIRECTIONS = Object.freeze([{ x: 0, z: 1 }, { x: 1, z: 1 }, { x: 1, z: 0 }, { x: 1, z: -1 }, { x: 0, z: -1 }, { x: -1, z: -1 }, { x: -1, z: 0 }, { x: -1, z: 1 }].map(value => Object.freeze(value)));
/** @param {Position} a @param {Position} b */
export function samePosition(a, b) { return a.x === b.x && a.z === b.z; }
/** @param {NavigationMap} map @param {Position} p */
export function inBounds(map, p) { return Number.isInteger(p.x) && Number.isInteger(p.z) && p.x >= 0 && p.z >= 0 && p.x < map.width && p.z < map.height; }
/** @param {NavigationMap} map @param {Position} p */
export function tileAt(map, p) { return inBounds(map, p) ? map.tiles[p.z]?.[p.x] ?? null : null; }
/** @param {NavigationActor} actor @param {NavigationContext} context */
export function baseMobility(actor, context) {
    const native = context.catalog.mobility(actor.identity.speciesId, actor.identity.formId).movementType;
    if (native === 4)
        return context.catalog.liquid(context.tileset) === 'lava' ? 1 : 0;
    if (native === 5)
        return context.catalog.liquid(context.tileset) === 'lava' ? 0 : 1;
    return native;
}
/** Source direction overrides are ordered; they can narrow native wall movement.
 * @param {NavigationActor} actor @param {NavigationContext} context @param {boolean} diagonal @param {boolean} melee
 */
export function directionMobility(actor, context, diagonal, melee) {
    let mobility = baseMobility(actor, context);
    if (melee)
        mobility = Math.max(2, mobility);
    if (context.tileset <= 63) {
        if (actor.mobile || actor.mobileScarf)
            mobility = 3;
        else if (actor.allTerrainHiker)
            mobility = 2;
        else if (actor.superMobile)
            mobility = diagonal ? 2 : 3;
    }
    return mobility;
}
/** @param {number} mobility @param {import('../../../content/navigation-types.js').TerrainKind} kind */
export function terrainAllowed(mobility, kind) { return mobility === 3 || kind === 'floor' || (mobility >= 1 && (kind === 'water' || kind === 'lava')) || (mobility === 2 && kind === 'void'); }
/** Position-only helper: no corner context; source IQ assignments differ from direction checks.
 * @param {NavigationActor} actor @param {NavigationMap} map @param {Position} target @param {NavigationContext} context
 */
export function canEnter(actor, map, target, context) {
    const tile = tileAt(map, target);
    if (!tile)
        return false;
    const terrain = context.catalog.terrain(tile.terrainId);
    if (terrain.impassable)
        return false;
    let mobility = baseMobility(actor, context);
    if (context.tileset <= 63 && (actor.mobile || actor.mobileScarf))
        mobility = 3;
    else {
        if (actor.allTerrainHiker)
            mobility = 2;
        if (actor.superMobile)
            mobility = 3;
    }
    return terrainAllowed(mobility, terrain.kind);
}
/** @param {NavigationActor} actor @param {NavigationMap} map @param {Position} from @param {Position} to @param {NavigationContext} context @param {boolean} melee */
function directionalTerrain(actor, map, from, to, context, melee) {
    const dx = to.x - from.x, dz = to.z - from.z;
    if (!inBounds(map, from) || Math.max(Math.abs(dx), Math.abs(dz)) !== 1)
        return false;
    const tile = tileAt(map, to);
    if (!tile)
        return false;
    const terrain = context.catalog.terrain(tile.terrainId);
    if (terrain.impassable)
        return false;
    const mobility = directionMobility(actor, context, dx !== 0 && dz !== 0, melee);
    if (!terrainAllowed(mobility, terrain.kind))
        return false;
    if (mobility === 3)
        return to.x >= 1 && to.z >= 1 && to.x < map.width - 1 && to.z < map.height - 1;
    if (dx !== 0 && dz !== 0) {
        const a = tileAt(map, { x: from.x + dx, z: from.z }), b = tileAt(map, { x: from.x, z: from.z + dz });
        if (!a || !b || context.catalog.terrain(a.terrainId).kind === 'wall' || context.catalog.terrain(b.terrainId).kind === 'wall')
            return false;
    }
    return true;
}
/** Shared direction predicate; pathing and normal movement use this same authority.
 * @param {NavigationActor} actor @param {NavigationMap} map @param {Position} from @param {Position} to @param {readonly Occupant[]} occupancy @param {NavigationContext} context
 */
export function canStep(actor, map, from, to, occupancy, context) {
    return directionalTerrain(actor, map, from, to, context, false) && !occupancy.some(other => other.actorId !== actor.actorId && samePosition(other.position, to));
}
/** @param {NavigationActor} actor @param {NavigationMap} map @param {Position} target @param {NavigationContext} context */
export function canMeleeAttack(actor, map, target, context) { return directionalTerrain(actor, map, actor.position, target, context, true); }
/** Two-away/front range uses a position helper, not melee corner checks.
 * @param {NavigationActor} actor @param {NavigationMap} map @param {Position} target @param {NavigationContext} context
 */
export function canTargetPosition(actor, map, target, context) {
    const tile = tileAt(map, target);
    if (!tile)
        return false;
    const terrain = context.catalog.terrain(tile.terrainId);
    if (terrain.impassable)
        return false;
    if (terrain.kind !== 'wall')
        return true;
    return canEnter(actor, map, target, context);
}
/** AI preferences do not change player terrain permission.
 * @param {NavigationActor} actor @param {NavigationMap} map @param {Position} to @param {readonly Occupant[]} occupancy @param {NavigationContext} context @param {import('./types.js').AiPreferences} preferences
 */
export function canAiStep(actor, map, to, occupancy, context, preferences) {
    const tile = tileAt(map, to);
    if (!tile)
        return false;
    if (preferences.houseAvoider && tile.roomId && map.rooms[tile.roomId]?.monsterHouse === 'armed')
        return false;
    if (preferences.trapAvoider && Object.values(map.traps).some(trap => samePosition(trap.position, to) && (trap.revealed || preferences.eyedrops)))
        return false;
    if (preferences.lavaEvader && context.catalog.terrain(tile.terrainId).kind === 'lava')
        return false;
    return canStep(actor, map, actor.position, to, occupancy, context);
}
/** Straight projectiles intentionally ignore orthogonal corner cells and floor impassable flags.
 * @param {NavigationMap} map @param {Position} origin @param {number} direction @param {{range:number,piercing:boolean}} options @param {NavigationContext} context
 */
export function traceProjectile(map, origin, direction, options, context) {
    const delta = DIRECTIONS[direction];
    if (!delta || !Number.isInteger(direction) || !Number.isInteger(options.range) || options.range < 0 || options.range > 128)
        throw new RangeError('Invalid projectile geometry.');
    /** @type {Position[]} */ const tiles = [];
    for (let step = 1; step <= options.range; step++) {
        const p = { x: origin.x + delta.x * step, z: origin.z + delta.z * step }, tile = tileAt(map, p);
        if (!tile || (!options.piercing && context.catalog.terrain(tile.terrainId).kind === 'wall'))
            break;
        tiles.push(Object.freeze(p));
    }
    return Object.freeze(tiles);
}
