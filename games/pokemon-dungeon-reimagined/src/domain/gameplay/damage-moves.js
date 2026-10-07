import { profile, blocked } from './support.js';
import { secondaryAllowed } from './move-conditions.js';
import { changeStatStage } from './stat-effects.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
export const PARTY_DAMAGE_MOVES = Object.freeze(['move-low-kick', 'move-metal-claw', 'move-mud-slap', 'move-water-gun']);
/** Native GetWeight reads apparent species/form's Q8 multiplier, not body slots.
 * Reuse the qualified factual crosswalk; no weight bands or duplicate data.
 * @param {Actor} target @param {Catalogs} catalogs */
export function lowKickMultiplier(target, catalogs) {
  const identity = { ...target.identity, formId: target.overrides.form?.formId ?? target.identity.formId };
  const id = profile(identity, catalogs).internalId;
  const facts = catalogs.effects.getSpeciesParameters(`body-${String(id).padStart(3, '0')}`);
  const [numerator, denominator] = facts.lowKickMultiplier;
  if (facts.internalId !== id || numerator === undefined || denominator !== 256) return blocked('low-kick-weight-facts');
  return numerator / denominator;
}
/** Secondary recipient is the user for Metal Claw, irrespective of the victim's
 * fate. Mud-Slap uses native chance0 (no RNG draw), then Shield Dust/stat guards.
 * @param {Context} context @param {Actor} user @param {Actor} target
 * @param {string} moveId @param {boolean} targetRevived @param {Catalogs} catalogs */
export function damageStatSecondary(context, user, target, moveId, targetRevived, catalogs) {
  if (moveId === 'move-metal-claw' && secondaryAllowed(context, user, user, 10, catalogs)) {
    changeStatStage(context, user, 'attack', 1, catalogs);
    if (user.affiliation !== 'team' && !user.memory.experienceContributors.includes(user.actorId)) user.memory.experienceContributors.push(user.actorId);
  }
  if (moveId === 'move-mud-slap' && !targetRevived && secondaryAllowed(context, user, target, 0, catalogs)) changeStatStage(context, target, 'accuracy', -1, catalogs, false);
}
