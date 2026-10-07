import { decodePokeQuantity } from '../../../content/state/items.js';
import { allocate, blocked, clone, draw } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {import('../../contracts/campaign.js').GridPosition} Position */
// Pinned dungeon_pos_data.c: first list ends at the first99 sentinel.
const OFFSETS = [[0,0],[0,-1],[1,0],[0,1],[-1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
for (let z = -2; z <= 2; z++) for (let x = -2; x <= 2; x++) if (Math.abs(x) === 2 || Math.abs(z) === 2) OFFSETS.push([x,z]);
/** Source SpawnDroppedItem: reveal origin trap, deterministic nearby search,
 * then one item-slot allocation attempt. Actors never block item placement.
 * Existing identity is already detached from its old container by the caller;
 * copies (projectiles/new money) allocate only if a floor item actually spawns.
 * @param {Context} context @param {Position} origin
 * @param {Omit<import('../../contracts/campaign.js').ItemInstance,'itemInstanceId'>} item
 * @param {Catalogs} catalogs @param {boolean} [includeOrigin]
 * @param {import('../../contracts/campaign.js').ItemInstanceId|null} [existingId] */
export function dropFloorItem(context, origin, item, catalogs, includeOrigin = true, existingId = null) {
  const state = context.state, session = state.session; if (!session) return blocked('item-drop-session');
  const trap = Object.values(session.floor.traps).find(row => row.position.x === origin.x && row.position.z === origin.z);
  if (trap) { trap.revealed = true; context.emit({ type: 'message', messageId: 'item-drop-trap' }); }
  const floorItems = Object.values(state.containers).filter(row => row.owner.kind === 'floor' && row.owner.mapId === session.floor.mapId && row.itemIds.length > 0);
  let lostOutOfSight = false;
  for (const [dx = 0, dz = 0] of OFFSETS.slice(includeOrigin ? 0 : 1)) {
    const position = { x: origin.x + dx, z: origin.z + dz }, tile = session.floor.tiles[position.z]?.[position.x];
    if (!tile || catalogs.navigation.terrain(tile.terrainId).kind === 'wall' || Object.values(session.floor.exits).some(exit => exit.position.x === position.x && exit.position.z === position.z) || Object.values(session.floor.traps).some(row => row.position.x === position.x && row.position.z === position.z) || floorItems.some(row => row.owner.kind === 'floor' && row.owner.position.x === position.x && row.owner.position.z === position.z)) continue;
    const terrain = catalogs.navigation.terrain(tile.terrainId).kind;
    if (terrain === 'void') { lostOutOfSight = true; break; }
    if (floorItems.length >= 64) break;
    const itemInstanceId = existingId ?? allocate(state, 'item-instance'), containerId = allocate(state, 'container');
    state.items[itemInstanceId] = { ...clone(item), itemInstanceId };
    state.containers[containerId] = { containerId, owner: { kind: 'floor', sessionId: session.sessionId, mapId: session.floor.mapId, position, placement: 'ground' }, itemIds: [itemInstanceId] };
    context.emit({ type: 'itemChanged', itemInstanceId });
    context.emit({ type: 'message', messageId: terrain === 'floor' ? 'item-dropped' : 'item-dropped-liquid' });
    return true;
  }
  if (existingId) delete state.items[existingId];
  context.emit({ type: 'message', messageId: lostOutOfSight ? 'item-drop-out-of-sight' : 'item-drop-lost' });
  return false;
}
/** All unrevived nonleaders drop their held lot before XP/recruitment/removal.
 * @param {Context} context @param {Actor} target @param {Catalogs} catalogs */
export function dropFaintedHeldItem(context, target, catalogs) {
  const session = context.state.session;
  if (!session || target.resources.hp !== 0 || target.actorId === session.leaderActorId || target.placement.kind !== 'map') return;
  const held = context.state.containers[target.heldContainerId]; if (!held) return blocked('faint-held-container');
  const id = held.itemIds[0]; if (!id) return;
  const item = context.state.items[id]; if (!item) return blocked('faint-held-item');
  held.itemIds = [];
  dropFloorItem(context, target.placement.position, item, catalogs, true, id);
}
/** Pay Day uses RollSecondaryEffect(user,0), not the target/floor secondary gate.
 * Its one quantity-index draw follows held-item drop and confirmed removal.
 * @param {Context} context @param {Actor} user @param {Actor} target
 * @param {Position} formerPosition @param {Catalogs} catalogs */
export function payDayDrop(context, user, target, formerPosition, catalogs) {
  const session = context.state.session;
  if (!session || user.placement.kind !== 'map' || user.resources.hp <= 0 || target.placement.kind !== 'off-map' || target.placement.reason !== 'fainted' || !('address' in session.floor.location)) return;
  const floor = catalogs.dungeons.getFloorById(session.floor.location.address.floorId), bound = catalogs.dungeons.getGeneration(floor.generationId).parameters.moneyUpperBound * 40;
  let index = draw(context.state, 100), amount = decodePokeQuantity(1);
  for (let i = 0; i < 200; i++) {
    if (decodePokeQuantity(index) <= bound) { amount = decodePokeQuantity(index); break; }
    index = Math.trunc(index / 2);
  }
  dropFloorItem(context, formerPosition, { template: { itemId: /** @type {import('../../contracts.js').ItemId} */ ('item-poke'), sticky: false, payload: { kind: 'none' } }, quantity: amount, shopLotId: null }, catalogs);
}
