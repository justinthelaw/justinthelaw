import { allocate, draw, FACINGS, blocked } from './support.js';
import { finishDamage } from './combat.js';
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** Source R dungeon_pos_data.c directional arc search, including N/S's radius8
 * at distance10. Geometry and actors are canonical; arc ignores intervening walls.
 * @param {Actor} actor */
function arcOffsets(actor) {
  const angle = FACINGS.indexOf(actor.facing) * Math.PI / 4;
  const dx = Math.round(Math.sin(angle)), dz = -Math.round(Math.cos(angle));
  const positions = [];
  for (let d = 1; d <= 10; d++) {
    positions.push({ x: dx * d, z: dz * d });
    for (let side = 1; side < d; side++) {
      if (dx && dz) positions.push({ x: dx * d, z: dz * (d - side) }, { x: dx * (d - side), z: dz * d });
      else if (dx !== 0 || side <= 8) positions.push({ x: dx * d + dz * side, z: dz * d - dx * side }, { x: dx * d - dz * side, z: dz * d + dx * side });
    }
  }
  return { positions, fallback: { x: dx * 2, z: dz * 2 } };
}
/** @param {Context} context @param {Actor} actor @param {import('../../contracts/campaign.js').ItemInstance} rock @param {import('./support.js').Catalogs} catalogs */
export function throwRock(context, actor, rock, catalogs) {
  const session = context.state.session; if (!session || actor.placement.kind !== 'map') return blocked('projectile-session');
  const origin = actor.placement.position, search = arcOffsets(actor);
  let landing = { x: origin.x + search.fallback.x, z: origin.z + search.fallback.z };
  for (const offset of search.positions) {
    const x = origin.x + offset.x, z = origin.z + offset.z;
    const enemy = Object.values(session.actors).find(other => other.affiliation !== actor.affiliation && other.binding.kind !== 'job-client' && other.placement.kind === 'map' && other.placement.position.x === x && other.placement.position.z === z) ?? null;
    if (enemy) { landing = { x, z }; break; }
  }
  // Source HandleCurvedProjectileThrow resolves the landing tile's occupant
  // after enemy-oriented destination selection. Its fallback can hit a teammate.
  const target = Object.values(session.actors).find(other => other.resources.hp > 0 && other.placement.kind === 'map' && other.placement.mapId === session.floor.mapId && other.placement.position.x === landing.x && other.placement.position.z === landing.z);
  if (target && target.binding.kind !== 'job-client' && draw(context.state, 100) < 90) {
    if (target.conditions.sleep?.duration.kind === 'indefinite') target.conditions.sleep = null;
    target.resources.hp = Math.max(0, target.resources.hp - 20);
    context.emit({ type: 'attackResolved', actorId: actor.actorId, targetId: target.actorId, outcome: 'hit' });
    finishDamage(context, target, catalogs, actor); return;
  }
  // Native dropped-projectile search starts at offset1 (not its impact tile).
  // Wonder Tiles remain reusable; landing beside them neither deletes nor fires them.
  const offsets = [[0,-1],[1,0],[0,1],[-1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
  for (let z = -2; z <= 2; z++) for (let x = -2; x <= 2; x++) if (Math.abs(x) === 2 || Math.abs(z) === 2) offsets.push([x,z]);
  for (const [x = 0, z = 0] of offsets) {
    const pos = { x: landing.x + x, z: landing.z + z }, tile = session.floor.tiles[pos.z]?.[pos.x];
    if (!tile || catalogs.navigation.terrain(tile.terrainId).kind === 'wall' || Object.values(session.floor.exits).some(exit => exit.position.x === pos.x && exit.position.z === pos.z) || Object.values(session.floor.traps).some(trap => trap.position.x === pos.x && trap.position.z === pos.z) || Object.values(context.state.containers).some(c => c.owner.kind === 'floor' && c.owner.mapId === session.floor.mapId && c.owner.position.x === pos.x && c.owner.position.z === pos.z)) continue;
    const terrain = catalogs.navigation.terrain(tile.terrainId).kind;
    if (terrain === 'void' || terrain === 'lava') break;
    const id = allocate(context.state, 'item-instance'), container = allocate(context.state, 'container');
    context.state.items[id] = { ...rock, itemInstanceId: id, quantity: 1 };
    context.state.containers[container] = { containerId: container, owner: { kind: 'floor', sessionId: session.sessionId, mapId: session.floor.mapId, position: pos, placement: 'ground' }, itemIds: [id] };
    context.emit({ type: 'itemChanged', itemInstanceId: id }); return;
  }
  context.emit({ type: 'message', messageId: 'projectile-lost' });
}
