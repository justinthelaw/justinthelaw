import { dealDamage } from './damage-resolution.js';
import { statusTurns, refreshSpeed } from './conditions.js';
import { clearPetrified } from './status-interruptions.js';
import { hasHeldItem } from './held-effects.js';
import { moveConditionSource } from './move-conditions.js';
import { ability, maxHp, blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
export const SINISTER_EFFECT_POLICY = /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-sinister-effects-v25');
/** Reciprocal actor IDs are this browser's native link-token equivalent. Release
 * before class replacement, cure, Reviver, removal and floor discard; never clear
 * a different new class on the counterpart. No RNG or resource mutation.
 * @param {Context} context @param {Actor} actor @param {boolean} [displayMessage] */
export function releaseSinisterWrap(context, actor, displayMessage = false) {
  const condition = actor.conditions.frozen;
  if (!condition || !['wrap', 'wrapped'].includes(condition.statusId)) return false;
  if (condition.payload.kind !== 'actor-link' || !condition.payload.actorId) return blocked('sinister-wrap-link');
  const other = context.state.session?.actors[condition.payload.actorId];
  if (!other || other.conditions.frozen?.payload.kind !== 'actor-link' || other.conditions.frozen.payload.actorId !== actor.actorId || !['wrap', 'wrapped'].includes(other.conditions.frozen.statusId)) return blocked('sinister-wrap-reciprocity');
  actor.conditions.frozen = null;
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  if (other.actorId !== actor.actorId) { other.conditions.frozen = null; context.emit({ type: 'conditionChanged', actorId: other.actorId }); }
  if (displayMessage) context.emit({ type: 'message', messageId: 'wrap-ended' }); return true;
}
/** Pure raw obligation for the successor's complete-state proof. A one-sided
 * link cannot be normalized away or projected through an older save policy.
 * @param {Actor} actor @param {import('../../contracts/campaign.js').ExpeditionState} session */
export function validSinisterWrap(actor, session) {
  const c = actor.conditions.frozen;
  if (!c || !['wrap', 'wrapped'].includes(c.statusId)) return true;
  if (c.payload.kind !== 'actor-link' || !c.payload.actorId || c.duration.kind !== 'counter' || c.duration.policyId !== SINISTER_EFFECT_POLICY || c.periodicCountdown === null || c.periodicCountdown < 0 || c.periodicCountdown > 2 || c.source.kind !== 'actor' || c.source.moveId !== 'move-wrap') return false;
  const other = session.actors[c.payload.actorId], d = other?.conditions.frozen;
  if (!other || !d || !['wrap', 'wrapped'].includes(d.statusId) || d.payload.kind !== 'actor-link' || d.payload.actorId !== actor.actorId || d.duration.kind !== 'counter' || d.duration.policyId !== SINISTER_EFFECT_POLICY || d.source.kind !== 'actor' || d.source.moveId !== 'move-wrap') return false;
  const user = c.statusId === 'wrap' ? actor : other;
  if (c.source.actor.identity.speciesId !== user.identity.speciesId || c.source.actor.identity.formId !== user.identity.formId || d.source.actor.identity.speciesId !== user.identity.speciesId || d.source.actor.identity.formId !== user.identity.formId || c.source.actor.actorId !== user.actorId || d.source.actor.actorId !== user.actorId || c.source.actor.sessionId !== session.sessionId || d.source.actor.sessionId !== session.sessionId || c.source.actor.mapId !== session.floor.mapId || d.source.actor.mapId !== session.floor.mapId || actor.placement.kind !== 'map' || other.placement.kind !== 'map' || actor.resources.hp <= 0 || other.resources.hp <= 0) return false;
  if (actor.actorId === other.actorId) return c.statusId === 'wrapped' && c.duration.remaining >= 1 && c.duration.remaining <= 5;
  return c.statusId !== d.statusId && (c.statusId === 'wrap' ? c.duration.remaining === 127 && c.periodicCountdown === 0 : c.duration.remaining >= 1 && c.duration.remaining <= 5);
}
/** Source sleep transition has a fresh self user, sampled BEFORE CannotSleep.
 * Previous yawning is cleared first. This is not Hypnosis's3–7 duration.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs */
function sleepFromYawn(context, actor, catalogs) {
  let remaining = statusTurns(context, actor, 4, 8, catalogs) + 1;
  if (actor.placement.kind !== 'map' || actor.resources.hp === 0 || actor.conditions.reflect?.statusId === 'safeguard' || ability(actor, catalogs, 'Insomnia') || ability(actor, catalogs, 'Vital Spirit') || actor.enabledIqSkillIds.some(id => id === 'iq-nonsleeper') || hasHeldItem(context.state, actor, 'item-insomniscope')) return;
  if (ability(actor, catalogs, 'Early Bird')) remaining = Math.max(1, Math.trunc(remaining / 2));
  actor.conditions.sleep = { statusId: 'sleep', source: moveConditionSource(context, actor, /** @type {import('../../contracts.js').MoveId} */ ('move-yawn')), duration: { kind: 'counter', policyId: SINISTER_EFFECT_POLICY, remaining }, periodicCountdown: null, payload: { kind: 'none' } };
  context.emit({ type: 'conditionChanged', actorId: actor.actorId }); context.emit({ type: 'message', messageId: 'yawn-became-sleep' });
}
/** Replacement for the successor's beginning counter traversal: sleep, burn,
 * frozen, cringe, Reflect, Curse in native order. Existing callers remain on
 * tickConditions. Leech Seed/sureShot and end-phase Bide retain their owners.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs */
export function tickSinisterConditions(context, actor, catalogs) {
  for (const group of /** @type {const} */ (['sleep', 'burn', 'frozen', 'cringe', 'reflect', 'curse'])) {
    const c = actor.conditions[group];
    if (c?.duration.kind !== 'counter' || c.duration.remaining === 127 || c.duration.remaining === 0) continue;
    if (--c.duration.remaining !== 0) continue;
    if (group === 'frozen' && ['wrap', 'wrapped'].includes(c.statusId)) releaseSinisterWrap(context, actor, true);
    else if (group === 'frozen' && c.statusId === 'petrified') clearPetrified(context, actor);
    else {
      actor.conditions[group] = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId });
      if (group === 'sleep' && c.statusId === 'yawning') sleepFromYawn(context, actor, catalogs);
      else if (['frozen', 'encore', 'protect', 'cursed'].includes(c.statusId)) context.emit({ type: 'message', messageId: c.statusId + '-ended' });
    }
  }
  refreshSpeed(actor, catalogs);
}
/** Dummy-source residuals preserve countdowns even when Frozen rejects HP
 * damage. The successor invokes Wrap before Curse before Leech/Bide and checks
 * immediate loss/Reviver/pending growth after each returned pulse.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs
 * @param {'wrapped'|'cursed'} status */
export function pulseSinisterResidual(context, actor, catalogs, status) {
  const c = status === 'wrapped' ? actor.conditions.frozen : actor.conditions.curse;
  if (!c || c.statusId !== status || c.periodicCountdown === null || actor.placement.kind !== 'map' || actor.resources.hp <= 0) return false;
  if (c.periodicCountdown > 0 && --c.periodicCountdown > 0) return false;
  c.periodicCountdown = status === 'wrapped' ? 2 : 10;
  if (actor.conditions.frozen?.statusId === 'frozen') {
    context.emit({ type: 'message', messageId: 'frozen-prevented-damage' }); return false;
  }
  const amount = status === 'wrapped' ? 6 : Math.max(1, Math.trunc(maxHp(actor) / 4));
  dealDamage(context, actor, catalogs, { attacker: null, amount, contact: false, physical: false, giveExperience: false });
  context.emit({ type: 'message', messageId: status === 'wrapped' ? 'wrap-damage' : 'curse-damage' }); return true;
}
/** Opportunity/movement owner uses these as pass guards, before selecting any
 * move or consuming its RNG. Yawning and Encore alone do not prevent action.
 * @param {Actor} actor */
export function sinisterImmobilized(actor) { return ['frozen', 'wrap', 'wrapped'].includes(actor.conditions.frozen?.statusId ?? ''); }
/** Explicit cure/floor-return extension: release reciprocals first, then generic
 * resetFloorConditions/heal/Reviver owner. Exposed is native floor-lifetime.
 * @param {Context} context @param {Actor} actor */
export function clearSinisterAuxiliary(context, actor) {
  releaseSinisterWrap(context, actor);
  if (actor.auxiliaryConditions.exposed) { actor.auxiliaryConditions.exposed = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); }
}
