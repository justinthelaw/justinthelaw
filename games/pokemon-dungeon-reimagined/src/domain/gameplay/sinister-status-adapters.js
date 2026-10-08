import { DIRECTIONS } from '../navigation/geometry.js';
import { activeActors } from './move-targets.js';
import { hasNegativeStatus, refreshSpeed, statusTurns } from './conditions.js';
import { hasHeldItem } from './held-effects.js';
import { SINISTER_EFFECT_POLICY, releaseSinisterWrap } from './sinister-condition-lifecycle.js';
import { ability, blocked, maxHp, profile } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {import('../../contracts/campaign.js').EffectSource} EffectSource */

/** Native TriggerTargetAbilityEffect uses actor as BOTH user and target. Source
 * remains the actual captured Effect Spore defender, including retired history.
 * Sleep's CalculateStatusTurns has already run before this call; consume its
 * final result, then Early Bird, without another draw or boundary increment.
 * Para/poison consume their concrete shared duration owner after actual guards.
 * This unselected leaf never supplies display/floor/AI/factory/save admission.
 * @param {Context} context @param {Actor} actor
 * @param {'paralysis'|'poison'|'sleep'} status @param {EffectSource} source
 * @param {number|null} turns @param {Catalogs} catalogs @returns {void} */
export function sinisterSelfStatus(context, actor, status, source, turns, catalogs) {
  if (!validRecipient(context, actor)) return;
  if (source.kind !== 'ability' || source.abilityId !== 'ability-effect-spore') return blocked('sinister-self-status-source');
  if (status === 'sleep' && (turns === null || !Number.isInteger(turns) || turns < 1 || turns > 127)) return blocked('sinister-sleep-supplied-counter');
  requireConcreteDomain(actor);
  if (status === 'sleep') {
    // CannotSleep: Safeguard, IQ, Insomnia, Vital Spirit, held item, in order.
    if (safeguard(context, actor)) return;
    if (actor.enabledIqSkillIds.some(id => id === 'iq-nonsleeper')) return notify(context, 'nonsleeper-prevented-sleep');
    if (ability(actor, catalogs, 'Insomnia')) return notify(context, 'insomnia-prevented-sleep');
    if (ability(actor, catalogs, 'Vital Spirit')) return notify(context, 'vital-spirit-prevented-sleep');
    if (hasHeldItem(context.state, actor, 'item-insomniscope')) return notify(context, 'insomniscope-prevented-sleep');
    const previous = actor.conditions.sleep?.statusId;
    if (previous === 'sleepless') return notify(context, 'sleepless-prevented-sleep');
    if (previous === 'napping') return notify(context, 'napping-prevented-sleep');
    // The native shared sleep setter leaves ordinary Sleep/Nightmare unchanged.
    if (previous === 'sleep') return notify(context, 'sleep-already-active');
    if (previous === 'nightmare') return notify(context, 'nightmare-already-active');
    if (turns === null) return blocked('sinister-sleep-supplied-counter');
    let remaining = turns;
    if (remaining !== 127 && ability(actor, catalogs, 'Early Bird')) remaining = Math.max(1, Math.trunc(remaining / 2));
    actor.conditions.sleep = { statusId: 'sleep', source, duration: { kind: 'counter', policyId: SINISTER_EFFECT_POLICY, remaining }, periodicCountdown: null, payload: { kind: 'none' } };
    context.emit({ type: 'conditionChanged', actorId: actor.actorId });
    notify(context, 'sleep-status');
    return;
  }
  if (status !== 'paralysis' && status !== 'poison') return blocked('sinister-self-status-kind');
  afflict(context, actor, status, source, catalogs);
}

/** Status-specific native guard messages and direct burn-class replacement.
 * Set before Synchronize recursion: repeat guards terminate every cycle. Poison
 * does not perform Paralysis's CalcSpeedStage; cache refresh remains at its real
 * later owner. Native immunity/type order precedes already-poisoned checks.
 * @param {Context} context @param {Actor} actor
 * @param {'paralysis'|'poison'} status @param {EffectSource} source
 * @param {Catalogs} catalogs @returns {void} */
function afflict(context, actor, status, source, catalogs) {
  if (!validRecipient(context, actor)) return;
  requireConcreteDomain(actor);
  if (safeguard(context, actor)) return;
  if (status === 'paralysis') {
    if (ability(actor, catalogs, 'Limber')) return notify(context, 'limber-prevented-paralysis');
    if (actor.conditions.burn?.statusId === 'paralysis') return notify(context, 'paralysis-already-active');
  } else {
    if (hasHeldItem(context.state, actor, 'item-pecha-scarf')) return notify(context, 'pecha-scarf-prevented-poison');
    if (ability(actor, catalogs, 'Immunity')) return notify(context, 'immunity-prevented-poison');
    if (profile(actor.identity, catalogs).typeIds.some(id => id === 8 || id === 17)) return notify(context, 'type-prevented-poison');
    if (actor.conditions.burn?.statusId === 'badly-poisoned') return notify(context, 'badly-poisoned-already-active');
    if (actor.conditions.burn?.statusId === 'poisoned') return notify(context, 'poisoned-already-active');
  }
  const remaining = status === 'paralysis' ? statusTurns(context, actor, 1, 2, catalogs) + 1 : statusTurns(context, actor, 127, 127, catalogs) + 1;
  actor.conditions.burn = { statusId: status === 'paralysis' ? 'paralysis' : 'poisoned', source, duration: { kind: 'counter', policyId: SINISTER_EFFECT_POLICY, remaining }, periodicCountdown: status === 'paralysis' ? null : 0, payload: { kind: 'none' } };
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  notify(context, status === 'paralysis' ? 'paralysis-status' : 'poisoned-status');
  if (status === 'paralysis') refreshSpeed(actor, catalogs);
  if (!ability(actor, catalogs, 'Synchronize')) return;
  const session = context.state.session;
  if (!session || actor.placement.kind !== 'map') return blocked('sinister-synchronize-session');
  const position = actor.placement.position;
  let printed = false;
  for (const direction of DIRECTIONS) {
    const neighbor = activeActors(session).find(other => validRecipient(context, other) && other.placement.kind === 'map' && other.placement.position.x === position.x + direction.x && other.placement.position.z === position.z + direction.z);
    if (!neighbor) continue;
    // Native prints on its first valid neighboring monster, even an ally or
    // ignored client. Treatment controls recursion, not this message.
    if (!printed) { printed = true; notify(context, 'synchronize-status'); }
    if (enemyTreatment(actor, neighbor)) afflict(context, neighbor, status, source, catalogs);
  }
}

/** Shared sub_8079F20(entity,entity,1,0), with FALSE,FALSE sleep ending. Its
 * negative predicate gates ALL class ends, including beneficial sureShot and
 * eyesight classes. Reflect/Bide/invisible/stat stages/positive speed and every
 * scheduler flag survive. Slow counters and existing sealed slots always clear.
 * Napping heals999, clears sleep before one recursive all-cure, and never deals
 * Nightmare expiry damage or turns Yawning into Sleep. Reciprocal Wrap requires
 * its real counterpart before mutation; retirement cannot erase that debt.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs
 * @returns {void} */
export function cureSinisterStatuses(context, actor, catalogs) {
  if (!validRecipient(context, actor)) return;
  requireConcreteDomain(actor);
  const negative = hasNegativeStatus(actor);
  if (negative) {
    // No native Snatch-global/Decoy appearance owner exists in this shape yet.
    // Hold the complete action before partially erasing its cure obligations.
    if (actor.conditions.curse && ['snatch', 'decoy'].includes(actor.conditions.curse.statusId)) return blocked('sinister-cure-global-class-owner');
    requireReciprocalWrap(context, actor);
    endSleep(context, actor, catalogs);
    if (!validRecipient(context, actor)) return;
    endCondition(context, actor, 'burn');
    endFrozen(context, actor);
    endCondition(context, actor, 'cringe');
    refreshSpeed(actor, catalogs);
    endCondition(context, actor, 'curse');
    endCondition(context, actor, 'leechSeed');
    endCondition(context, actor, 'sureShot');
    endCondition(context, actor, 'blinker');
    endAuxiliary(context, actor, 'muzzled');
    endAuxiliary(context, actor, 'perishSong');
    endAuxiliary(context, actor, 'exposed');
  }
  // CalcSpeedStage precedes clearing the five negative counters, then repeats.
  refreshSpeed(actor, catalogs);
  const before = actor.speed.cachedStage;
  const slowed = actor.speed.negativeTimers.some(Boolean);
  actor.speed.negativeTimers.fill(0);
  refreshSpeed(actor, catalogs);
  if (slowed) context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  const speedChanged = before !== actor.speed.cachedStage;
  if (speedChanged) notify(context, 'speed-restored');
  let unsealed = false;
  for (const slot of actor.battleMoves.slots) if (slot.sealed) { slot.sealed = false; unsealed = true; }
  if (unsealed) {
    context.emit({ type: 'conditionChanged', actorId: actor.actorId });
    notify(context, 'moves-unsealed');
  }
  if (!negative && !speedChanged && !unsealed) notify(context, 'heal-already-cured');
}

/** @param {Context} context @param {Actor} actor @param {Catalogs} catalogs */
function endSleep(context, actor, catalogs) {
  const sleep = actor.conditions.sleep;
  if (!sleep) return;
  notify(context, sleep.statusId + '-ended');
  if (sleep.statusId === 'napping') {
    const hp = actor.resources.hp;
    actor.resources.hp = Math.min(maxHp(actor), hp + 999);
    if (actor.resources.hp !== hp) {
      context.emit({ type: 'conditionChanged', actorId: actor.actorId });
      notify(context, actor.resources.hp === maxHp(actor) ? 'hp-fully-healed' : 'hp-recovered');
    }
  }
  actor.conditions.sleep = null;
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  if (sleep.statusId === 'napping') cureSinisterStatuses(context, actor, catalogs);
}

/** @param {Context} context @param {Actor} actor */
function endFrozen(context, actor) {
  const frozen = actor.conditions.frozen;
  if (!frozen) return;
  notify(context, ['wrap', 'wrapped'].includes(frozen.statusId) ? 'wrap-ended' : frozen.statusId + '-ended');
  if (['wrap', 'wrapped'].includes(frozen.statusId)) releaseSinisterWrap(context, actor);
  else { actor.conditions.frozen = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); }
}

/** @param {Context} context @param {Actor} actor
 * @param {'burn'|'cringe'|'curse'|'leechSeed'|'sureShot'|'blinker'} group */
function endCondition(context, actor, group) {
  const condition = actor.conditions[group];
  if (!condition) return;
  notify(context, ['poisoned', 'badly-poisoned'].includes(condition.statusId) ? 'poisoned-ended' : condition.statusId + '-ended');
  actor.conditions[group] = null;
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
}

/** @param {Context} context @param {Actor} actor
 * @param {'muzzled'|'perishSong'|'exposed'} group */
function endAuxiliary(context, actor, group) {
  if (!actor.auxiliaryConditions[group]) return;
  if (group === 'muzzled') notify(context, 'muzzled-ended');
  actor.auxiliaryConditions[group] = null;
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  if (group !== 'muzzled') notify(context, group === 'perishSong' ? 'perish-song-ended' : group + '-ended');
}

/** @param {Context} context @param {Actor} actor */
function requireReciprocalWrap(context, actor) {
  const condition = actor.conditions.frozen;
  if (!condition || !['wrap', 'wrapped'].includes(condition.statusId)) return;
  if (condition.payload.kind !== 'actor-link' || !condition.payload.actorId) return blocked('sinister-wrap-link');
  const other = context.state.session?.actors[condition.payload.actorId];
  if (!other || other.conditions.frozen?.payload.kind !== 'actor-link' || other.conditions.frozen.payload.actorId !== actor.actorId || !['wrap', 'wrapped'].includes(other.conditions.frozen.statusId)) return blocked('sinister-wrap-reciprocity');
}

/** Source ability/type primitives require real current facts. Broader effective
 * form/type/ability and transformed states are held instead of assumed normal.
 * @param {Actor} actor */
function requireConcreteDomain(actor) {
  if (actor.overrides.types !== null || actor.overrides.abilities !== null || actor.overrides.form !== null || actor.conditions.invisible?.statusId === 'transformed') return blocked('sinister-status-effective-context');
}

/** GetTreatmentBetweenMonstersIgnoreStatus: rescue clients, experience-locked
 * clients and shopkeepers are ignored. Ordinary supplied roster/wild joined-at
 * and shopkeeper facts need caller authentication; affiliation is not new proof.
 * @param {Actor} first @param {Actor} second */
function enemyTreatment(first, second) {
  if (first.binding.kind === 'guest' || second.binding.kind === 'guest') return blocked('sinister-synchronize-guest-joined-at');
  const ignored = (/** @type {Actor} */ actor) => actor.affiliation === 'neutral' || ['job-client', 'escort-guest'].includes(actor.binding.kind);
  return !ignored(first) && !ignored(second) && first.affiliation !== second.affiliation;
}

/** Native valid-entity checks operate only on authenticated current generations.
 * The caller proves ≤4 team+128 wild, distinct ordinary tile occupancy and no
 * dangling retired Wrap tokens before composing this finite leaf.
 * @param {Context} context @param {Actor} actor */
function validRecipient(context, actor) {
  const session = context.state.session;
  return !!session && session.actors[actor.actorId] === actor && actor.placement.kind === 'map' && actor.placement.mapId === session.floor.mapId && actor.resources.hp > 0;
}

/** @param {Context} context @param {Actor} actor */
function safeguard(context, actor) {
  if (actor.conditions.reflect?.statusId !== 'safeguard') return false;
  notify(context, 'safeguard-prevented-status');
  return true;
}
/** @param {Context} context @param {string} messageId */
function notify(context, messageId) { context.emit({ type: 'message', messageId }); }
