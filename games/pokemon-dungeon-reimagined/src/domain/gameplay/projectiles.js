import { dropFloorItem } from './item-drops.js';
import { draw, FACINGS, blocked } from './support.js';
import { impactDungeonItem, protectedItemTarget } from './item-effects.js';
import { hasHeldItem } from './held-effects.js';
import { inBounds, tileAt } from '../navigation/geometry.js';
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
/** Only supported ordinary flight. Equipment/status trajectories need their
 * named consumers before admission; do not silently apply range10 to them.
 * @param {Context} context @param {Actor} actor */
function ordinaryTrajectory(context, actor) {
  if (actor.conditions.longToss || actor.conditions.invisible?.statusId === 'transformed' || actor.conditions.curse?.statusId === 'decoy') return blocked('throw-trajectory-status-consumer');
  for (const id of ['item-no-aim-scope', 'item-curve-band', 'item-pierce-band', 'item-lockon-specs', 'item-whiff-specs']) if (hasHeldItem(context.state, actor, id)) return blocked(`throw-trajectory-equipment:${id}`);
}
/** Interception includes teammates and protected roles; hit protection itself
 * is applied later and skips accuracy RNG. Semi-invulnerable target policies
 * are not yet admitted, so expose their owner instead of using move filtering.
 * @param {Context} context @param {Actor} target */
function ordinaryTarget(context, target) {
  if (['flying', 'bouncing', 'diving', 'digging'].includes(target.conditions.bide?.statusId ?? '')) return blocked('throw-projectile-eligibility-consumer');
  for (const id of ['item-bounce-band', 'item-dodge-scarf']) if (hasHeldItem(context.state, target, id)) return blocked(`throw-trajectory-equipment:${id}`);
}
/** @param {Context} context @param {Actor} actor @param {import('./item-effects.js').DetachedItem} item
 * @param {import('./support.js').Catalogs} catalogs @param {boolean} arc
 * @param {import('../../contracts/campaign.js').TargetSelector} selector */
export function throwDungeonProjectile(context, actor, item, catalogs, arc, selector) {
  const session = context.state.session;
  if (!session || actor.placement.kind !== 'map' || actor.placement.mapId !== session.floor.mapId) return blocked('projectile-session');
  ordinaryTrajectory(context, actor);
  const origin = actor.placement.position, search = arcOffsets(actor);
  /** @param {import('../../contracts/campaign.js').GridPosition} position */
  const occupant = position => Object.values(session.actors).find(other => other.resources.hp > 0 && other.placement.kind === 'map' && other.placement.mapId === session.floor.mapId && other.placement.position.x === position.x && other.placement.position.z === position.z);
  /** @param {Actor} target */
  const hit = target => {
    ordinaryTarget(context, target);
    if (protectedItemTarget(target) || draw(context.state, 100) >= 90) return false;
    impactDungeonItem(context, actor, target, item, catalogs); return true;
  };
  if (arc) {
    let landing = { x: origin.x + search.fallback.x, z: origin.z + search.fallback.z };
    // CheckVariousStatuses2(TRUE) precedes both search and explicit AI tile.
    const blockedSearch = actor.conditions.blinker?.statusId === 'blinker' || ['sleep','napping','nightmare'].includes(actor.conditions.sleep?.statusId ?? '') || ['paused','infatuated'].includes(actor.conditions.cringe?.statusId ?? '') || actor.conditions.frozen?.statusId === 'petrified';
    if (blockedSearch) landing = { x: origin.x + search.fallback.x / 2 * 3, z: origin.z + search.fallback.z / 2 * 3 };
    else if (selector.kind === 'tile') {
      if (selector.mapId !== session.floor.mapId || !inBounds(session.floor, selector.position)) return blocked('throw-item-selector');
      landing = { ...selector.position };
    } else for (const offset of search.positions) {
      const position = { x: origin.x + offset.x, z: origin.z + offset.z }, enemy = occupant(position);
      if (enemy && enemy.affiliation !== actor.affiliation && enemy.binding.kind !== 'job-client') { landing = position; break; }
    }
    // Only destination resolves; intervening walls/actors never intercept arcs.
    const target = occupant(landing);
    if (target && hit(target)) return;
    dropFloorItem(context, landing, item.payload, catalogs, false, item.existingId); return;
  }
  const angle = FACINGS.indexOf(actor.facing) * Math.PI / 4;
  const dx = Math.round(Math.sin(angle)), dz = -Math.round(Math.cos(angle));
  let endpoint = { ...origin };
  for (let step = 1; step <= 10; step++) {
    const next = { x: origin.x + dx * step, z: origin.z + dz * step };
    if (!inBounds(session.floor, next)) { context.emit({ type: 'message', messageId: 'item-drop-lost' }); return; }
    const tile = tileAt(session.floor, next); if (!tile) return blocked('throw-projectile-tile');
    if (catalogs.navigation.terrain(tile.terrainId).kind === 'wall') break;
    endpoint = next;
    const target = occupant(endpoint);
    if (target) { if (hit(target)) return; break; }
  }
  // A miss stops at its first eligible occupant, and ordinary drops include it.
  dropFloorItem(context, endpoint, item.payload, catalogs, true, item.existingId);
}
