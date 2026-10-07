import { applySpeedTimers, makeLoweredSpeedTimer } from '../rules/speed.js';
import { profile, blocked, draw, ability } from './support.js';
import { secondaryAllowed } from './move-conditions.js';
import { changeStatStage } from './stat-effects.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
export const PARTY_DAMAGE_MOVES = Object.freeze(['move-low-kick', 'move-metal-claw', 'move-mud-slap', 'move-water-gun', 'move-ember', 'move-bite', 'move-bone-club', 'move-headbutt', 'move-razor-leaf', 'move-bubble', 'move-pay-day']);
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
  if (moveId === 'move-bubble' && !targetRevived && secondaryAllowed(context, user, target, 10, catalogs)) lowerMoveSpeed(context, target, catalogs);
  if (moveId === 'move-metal-claw' && secondaryAllowed(context, user, user, 10, catalogs)) {
    changeStatStage(context, user, 'attack', 1, catalogs);
    if (user.affiliation !== 'team' && !user.memory.experienceContributors.includes(user.actorId)) user.memory.experienceContributors.push(user.actorId);
  }
  if (moveId === 'move-mud-slap' && !targetRevived && secondaryAllowed(context, user, target, 0, catalogs)) changeStatStage(context, target, 'accuracy', -1, catalogs, false);
}

/** Native LowerSpeed one-stage branch: protection/zero/full-array checks precede
 * duration RNG. Timer insertion and cached stage use the shared pure speed owner.
 * @param {Context} context @param {Actor} target @param {Catalogs} catalogs */
function lowerMoveSpeed(context, target, catalogs) {
  if (target.conditions.reflect?.statusId === 'safeguard' || target.speed.cachedStage === 0 || !target.speed.negativeTimers.includes(0)) return;
  const timer = makeLoweredSpeedTimer(6 + draw(context.state, 2), target.enabledIqSkillIds.some(id => id === 'iq-self-curer'), ability(target, catalogs, 'Natural Cure'));
  const p = profile(target.identity, catalogs);
  const change = applySpeedTimers({ baseMovementSpeed: p.baseMovementSpeed, positiveTimers: target.speed.positiveTimers, negativeTimers: target.speed.negativeTimers, paralyzed: target.conditions.burn?.statusId === 'paralysis', iceType: p.typeIds.includes(6), snow: false, deoxysSpeedForm: false, wildKecleonInTheftMode: false }, 'lower', [timer], false);
  target.speed.positiveTimers = [...change.positiveTimers]; target.speed.negativeTimers = [...change.negativeTimers]; target.speed.cachedStage = change.after;
  context.emit({ type: 'conditionChanged', actorId: target.actorId });
  if (change.after !== change.before) context.emit({ type: 'message', messageId: 'speed-lowered' });
}
