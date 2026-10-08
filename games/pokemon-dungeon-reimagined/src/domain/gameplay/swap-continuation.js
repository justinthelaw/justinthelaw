import { movementPlan } from './movement.js';
import { FACINGS } from './support.js';
/** @typedef {import('../../contracts/campaign.js').ExpeditionState} Session */

/** A native swap moves the leader before the queued reverse walk. Identify only
 * that exact temporary pair, before the counterpart's slot is consumed (or
 * during its owned active opportunity). The origin is recoverable from the
 * already stored reverse facing; no extra saved coordinate or identity is added.
 * @param {Session} session @param {import('./support.js').Catalogs} catalogs */
export function pendingSpecialSwap(session, catalogs) {
  const s = session.scheduler, c = s.continuation, special = c.special;
  if (c.pass !== 'leader' || !special || special.leader.side !== 'team' || s.teamSlots[special.leader.slot] !== special.leader.actorId || special.leader.actorId !== session.leaderActorId) return null;
  const leader = session.actors[special.leader.actorId];
  if (!leader || leader.placement.kind !== 'map' || leader.placement.mapId !== session.floor.mapId || leader.resources.hp <= 0 || leader.speed.petrifiedSwap || !leader.speed.swapSkip || !leader.speed.movementPending || !leader.speed.endEffectsPending) return null;
  const position = leader.placement.position;
  const overlaps = Object.values(session.actors).filter(actor => actor.actorId !== leader.actorId && actor.placement.kind === 'map' && actor.placement.position.x === position.x && actor.placement.position.z === position.z);
  const other = overlaps[0];
  if (overlaps.length !== 1 || !other || other.placement.kind !== 'map' || other.placement.mapId !== session.floor.mapId || other.affiliation !== 'team' || other.resources.hp <= 0 || !other.speed.petrifiedSwap) return null;
  const slot = s.teamSlots.indexOf(other.actorId);
  const selecting = c.active === null && special.index <= slot;
  const acting = c.active?.side === 'team' && c.active.slot === slot && c.active.actorId === other.actorId && special.index === slot + 1;
  if (slot < 0 || !selecting && !acting || (FACINGS.indexOf(leader.facing) + 4) % 8 !== FACINGS.indexOf(other.facing)) return null;
  const direction = FACINGS.indexOf(other.facing) * Math.PI / 4;
  const origin = { x: position.x + Math.round(Math.sin(direction)), z: position.z - Math.round(Math.cos(direction)) };
  if (Object.values(session.actors).some(actor => actor.placement.kind === 'map' && actor.placement.position.x === origin.x && actor.placement.position.z === origin.z)) return null;
  const originalLeader = { ...leader, placement: { ...leader.placement, position: origin } };
  const original = { ...session, actors: { ...session.actors, [leader.actorId]: originalLeader } };
  // Recheck the original safe-swap geometry/status/role contract. This is a
  // validation projection only; neither actor is moved or simulated here.
  const plan = movementPlan(original, originalLeader, position, catalogs);
  return plan.kind === 'swap' && plan.other === other.actorId ? { leader, other, origin, original } : null;
}
