import { DIRECTIONS } from '../navigation/geometry.js';
import { activeActors } from './move-targets.js';
import { ability, profile } from './support.js';
import { statusTurns, refreshSpeed } from './conditions.js';
import { moveConditionSource, secondaryAllowed } from './move-conditions.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
export const DAMAGE_STATUS_POLICY = /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-damage-status-v15');
/** Burn replaces its class, never refreshes, and synchronizes in native order.
 * Fire/Water Veil/water terrain guard before the constant no-draw duration.
 * @param {Context} context @param {Actor} target
 * @param {import('../../contracts/campaign.js').EffectSource} source @param {Catalogs} catalogs */
function burn(context, target, source, catalogs) {
  const session = context.state.session;
  if (!session || target.placement.kind !== 'map' || target.resources.hp === 0 || target.conditions.reflect?.statusId === 'safeguard' || ability(target, catalogs, 'Water Veil') || profile(target.identity, catalogs).typeIds.includes(2)) return;
  const position = target.placement.position, tile = session.floor.tiles[position.z]?.[position.x];
  if (tile && catalogs.navigation.terrain(tile.terrainId).kind === 'water') return;
  if (target.conditions.burn?.statusId === 'burn') { context.emit({ type: 'message', messageId: 'burn-already-active' }); return; }
  target.conditions.burn = { statusId: 'burn', source, duration: { kind: 'counter', policyId: DAMAGE_STATUS_POLICY, remaining: 128 }, periodicCountdown: 0, payload: { kind: 'none' } };
  refreshSpeed(target, catalogs); context.emit({ type: 'conditionChanged', actorId: target.actorId });
  context.emit({ type: 'message', messageId: 'burn-status' });
  if (!ability(target, catalogs, 'Synchronize')) return;
  for (const d of DIRECTIONS) {
    const neighbor = activeActors(session).find(a => a.placement.kind === 'map' && a.placement.position.x === position.x + d.x && a.placement.position.z === position.z + d.z);
    if (neighbor && target.affiliation !== 'neutral' && neighbor.affiliation !== 'neutral' && neighbor.affiliation !== target.affiliation) burn(context, neighbor, source, catalogs);
  }
}
/** Positive damage and target revival are checked by the caller. Common
 * secondary guards/chance precede the specific ability/status/timer guards.
 * @param {Context} context @param {Actor} user @param {Actor} target
 * @param {import('../../contracts.js').MoveId} moveId @param {Catalogs} catalogs */
export function damageStatusSecondary(context, user, target, moveId, catalogs) {
  if (moveId === 'move-ember' && secondaryAllowed(context, user, target, 10, catalogs)) burn(context, target, moveConditionSource(context, user, moveId), catalogs);
  const chance = moveId === 'move-bite' ? 20 : moveId === 'move-bone-club' ? 10 : moveId === 'move-headbutt' ? 25 : 0;
  if (chance && secondaryAllowed(context, user, target, chance, catalogs) && target.conditions.reflect?.statusId !== 'safeguard' && !ability(target, catalogs, 'Inner Focus')) {
    if (target.conditions.cringe?.statusId === 'cringe') { context.emit({ type: 'message', messageId: 'cringe-already-active' }); return; }
    target.conditions.cringe = { statusId: 'cringe', source: moveConditionSource(context, user, moveId), duration: { kind: 'counter', policyId: DAMAGE_STATUS_POLICY, remaining: statusTurns(context, target, 1, 1, catalogs) + 1 }, periodicCountdown: null, payload: { kind: 'none' } };
    context.emit({ type: 'conditionChanged', actorId: target.actorId }); context.emit({ type: 'message', messageId: 'cringe-status' });
  }
}
/** Rage expires after the Bide phase; it never forces a pass or releases damage.
 * @param {Context} context @param {Actor} actor */
export function endRage(context, actor) {
  const c = actor.conditions.bide;
  if (c?.statusId !== 'enraged' || c.duration.kind !== 'counter') return;
  if (--c.duration.remaining === 0) { actor.conditions.bide = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); context.emit({ type: 'message', messageId: 'rage-ended' }); }
}

// Prospective source handlers reuse the exact existing burn owner with their
// own causal move source; selected Ember calls and function body are unchanged.
export { burn as inflictBurn };
