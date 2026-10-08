import { DIRECTIONS } from '../navigation/geometry.js';
import { activeActors } from './move-targets.js';
import { inflictBurn } from './damage-status.js';
import { inflictParalysis, statusTurns } from './conditions.js';
import { moveConditionSource, secondaryAllowed } from './move-conditions.js';
import { hasHeldItem } from './held-effects.js';
import { SINISTER_EFFECT_POLICY, releaseSinisterWrap } from './sinister-condition-lifecycle.js';
import { ability, profile } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
export const SINISTER_DAMAGE_MOVES = Object.freeze(['move-poison-sting', 'move-lick', 'move-thunder-punch', 'move-fire-punch', 'move-ice-punch']);
/** Source PoisonedStatusTarget recursion terminates before a duration draw on
 * poisoned/badly-poisoned recipients. Preserve causal source across Synchronize.
 * @param {Context} context @param {Actor} target
 * @param {import('../../contracts/campaign.js').EffectSource} source @param {Catalogs} catalogs */
export function inflictSinisterPoison(context, target, source, catalogs) {
  const session = context.state.session;
  if (!session || target.placement.kind !== 'map' || target.resources.hp <= 0 || target.conditions.reflect?.statusId === 'safeguard' || hasHeldItem(context.state, target, 'item-pecha-scarf') || ability(target, catalogs, 'Immunity') || profile(target.identity, catalogs).typeIds.some(id => id === 8 || id === 17) || ['poisoned', 'badly-poisoned'].includes(target.conditions.burn?.statusId ?? '')) return false;
  target.conditions.burn = { statusId: 'poisoned', source, duration: { kind: 'counter', policyId: SINISTER_EFFECT_POLICY, remaining: statusTurns(context, target, 127, 127, catalogs) + 1 }, periodicCountdown: 0, payload: { kind: 'none' } };
  context.emit({ type: 'conditionChanged', actorId: target.actorId }); context.emit({ type: 'message', messageId: 'poisoned-status' });
  if (ability(target, catalogs, 'Synchronize')) {
    const position = target.placement.position;
    for (const d of DIRECTIONS) {
      const neighbor = activeActors(session).find(a => a.placement.kind === 'map' && a.placement.position.x === position.x + d.x && a.placement.position.z === position.z + d.z);
      if (neighbor && target.affiliation !== 'neutral' && neighbor.affiliation !== 'neutral' && target.affiliation !== neighbor.affiliation) inflictSinisterPoison(context, neighbor, source, catalogs);
    }
  }
  return true;
}
/** Native Frozen replacement releases any existing Wrap token first. Lava,
 * Ice and Magma Armor guards precede duration RNG; existing Frozen never refreshes.
 * @param {Context} context @param {Actor} target
 * @param {import('../../contracts/campaign.js').EffectSource} source @param {Catalogs} catalogs */
export function inflictSinisterFrozen(context, target, source, catalogs) {
  const session = context.state.session;
  if (!session || target.placement.kind !== 'map' || target.resources.hp <= 0 || target.conditions.frozen?.statusId === 'frozen' || target.conditions.reflect?.statusId === 'safeguard' || ability(target, catalogs, 'Magma Armor') || profile(target.identity, catalogs).typeIds.includes(6)) return false;
  const position = target.placement.position, tile = session.floor.tiles[position.z]?.[position.x];
  if (tile && catalogs.navigation.terrain(tile.terrainId).kind === 'lava') return false;
  releaseSinisterWrap(context, target);
  target.conditions.frozen = { statusId: 'frozen', source, duration: { kind: 'counter', policyId: SINISTER_EFFECT_POLICY, remaining: statusTurns(context, target, 3, 5, catalogs) + 1 }, periodicCountdown: 0, payload: { kind: 'none' } };
  context.emit({ type: 'conditionChanged', actorId: target.actorId }); context.emit({ type: 'message', messageId: 'frozen-status' }); return true;
}
/** Called only after positive damage and shared faint/Reviver/source ownership.
 * Same-hit revival skips the entire common chance helper. Common secondary
 * chance then Shield Dust precede application guards/duration/Synchronize.
 * @param {Context} context @param {Actor} user @param {Actor} target
 * @param {import('../../contracts.js').MoveId} moveId @param {Catalogs} catalogs */
export function sinisterDamageSecondary(context, user, target, moveId, catalogs) {
  const chance = moveId === 'move-poison-sting' ? 18 : moveId === 'move-lick' ? 15 : moveId === 'move-thunder-punch' ? 20 : moveId === 'move-fire-punch' || moveId === 'move-ice-punch' ? 10 : 0;
  if (!chance || !secondaryAllowed(context, user, target, chance, catalogs)) return;
  const source = moveConditionSource(context, user, moveId);
  if (moveId === 'move-poison-sting') inflictSinisterPoison(context, target, source, catalogs);
  else if (moveId === 'move-fire-punch') inflictBurn(context, target, source, catalogs);
  else if (moveId === 'move-ice-punch') inflictSinisterFrozen(context, target, source, catalogs);
  else inflictParalysis(context, target, source, catalogs, SINISTER_EFFECT_POLICY);
}
