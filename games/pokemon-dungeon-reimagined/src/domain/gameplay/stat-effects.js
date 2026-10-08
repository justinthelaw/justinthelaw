import { ability } from './support.js';
import { hasHeldItem } from './held-effects.js';

/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** Explicitly audited stage consumers. Other catalog effects stay gated. */
export const STAT_MOVES = Object.freeze(['move-harden', 'move-defense-curl', 'move-meditate', 'move-growl', 'move-tail-whip', 'move-leer', 'move-sand-attack', 'move-metal-sound', 'move-withdraw', 'move-helping-hand']);

/** Native protection precedes clamping; offensive drops alone check Twist Band
 * and physical Hyper Cutter. Accuracy alone checks Keen Eye after shared guard.
 * @param {Context} context @param {Actor} target
 * @param {'attack'|'defense'|'specialAttack'|'specialDefense'|'accuracy'|'evasion'} stat
 * @param {number} delta @param {Catalogs} catalogs @param {boolean} [displayProtection] */
export function changeStatStage(context, target, stat, delta, catalogs, displayProtection = true) {
  if (target.placement.kind !== 'map' || target.resources.hp === 0) return false;
  if (delta < 0) {
    const protectedStat = target.conditions.reflect?.statusId === 'mist' || ability(target, catalogs, 'Clear Body') || ability(target, catalogs, 'White Smoke');
    const offensive = stat === 'attack' || stat === 'specialAttack';
    if (protectedStat || offensive && hasHeldItem(context.state, target, 'item-twist-band') || stat === 'attack' && ability(target, catalogs, 'Hyper Cutter') || stat === 'accuracy' && ability(target, catalogs, 'Keen Eye')) {
      if (displayProtection) context.emit({ type: 'message', messageId: 'stat-drop-protected' });
      return false;
    }
  }
  const prior = target.stages[stat];
  target.stages[stat] = Math.max(0, Math.min(20, prior + delta));
  context.emit({ type: 'message', messageId: target.stages[stat] === prior ? 'stat-stage-limit' : delta > 0 ? 'stat-stage-raised' : 'stat-stage-lowered' });
  if (target.stages[stat] !== prior) context.emit({ type: 'conditionChanged', actorId: target.actorId });
  return target.stages[stat] !== prior;
}
