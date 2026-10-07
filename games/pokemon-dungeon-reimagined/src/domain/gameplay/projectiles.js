import { dropFloorItem } from './item-drops.js';
import { draw, FACINGS, blocked } from './support.js';
import { impactDungeonItem, protectedItemTarget } from './item-effects.js';
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
/** @param {Context} context @param {Actor} actor @param {import('./item-effects.js').DetachedItem} rock @param {import('./support.js').Catalogs} catalogs */
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
  if (target && !protectedItemTarget(target) && draw(context.state, 100) < 90) {
    impactDungeonItem(context, actor, target, rock, catalogs);
    return;
  }
  // Native missed arcs skip the impact tile but reveal/preserve its trap.
  dropFloorItem(context, landing, rock.payload, catalogs, false, rock.existingId);
}
