import { draw, ability, maxHp } from './support.js';

/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
export const SELF_STATUS_MOVES = Object.freeze(['move-bide', 'move-focus-energy']);
/** Separate from generic two-turn charge moves: Bide holds/pass-ticks and
 * releases an internal action at end phase, never charges the learned slot twice.
 * @param {Context} context @param {Actor} actor
 * @param {import('../../contracts/campaign.js').MoveSlot} slot */
export function selfBattleStatus(context, actor, slot) {
  const session = context.state.session; if (!session) return;
  const source = /** @type {import('../../contracts/campaign.js').EffectSource} */ ({ kind: 'actor', actor: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: actor.actorId, identity: { ...actor.identity } }, moveId: slot.moveId });
  const policyId = /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-battle-status-v9');
  if (slot.moveId === 'move-focus-energy') {
    if (actor.conditions.sureShot?.statusId === 'focus-energy') return;
    actor.conditions.sureShot = { statusId: 'focus-energy', source, duration: { kind: 'counter', policyId, remaining: 3 + draw(context.state, 2) }, periodicCountdown: null, payload: { kind: 'none' } };
  } else if (slot.moveId === 'move-bide') {
    actor.conditions.bide = { statusId: 'bide', source, duration: { kind: 'counter', policyId, remaining: 4 + draw(context.state, 2) }, periodicCountdown: null, payload: { kind: 'charge', moveSlotId: slot.moveSlotId, moveId: slot.moveId, target: { kind: 'self' }, storedDamage: 0 } };
  }
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
}
/** Focus Energy belongs to the before-action sureShot class, not Bide end phase.
 * @param {Context} context @param {Actor} actor */
export function tickBattleStatus(context, actor) {
  const c = actor.conditions.sureShot;
  if (c?.statusId !== 'focus-energy' || c.duration.kind !== 'counter' || c.duration.remaining === 127 || c.duration.remaining === 0) return;
  if (--c.duration.remaining === 0) { actor.conditions.sureShot = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); }
}
/** Bide expiry clears its class before checking the three native release
 * guards. Current admitted statuses are a subset; confusion alone does not stop
 * release and no last-attacker retargeting takes place.
 * @param {Context} context @param {Actor} actor @param {import('./support.js').Catalogs} catalogs
 * @returns {number|null} */
export function endBide(context, actor, catalogs) {
  const c = actor.conditions.bide;
  if (c?.statusId !== 'bide' || c.duration.kind !== 'counter' || c.payload.kind !== 'charge' || c.duration.remaining === 0 || c.duration.remaining === 127 || --c.duration.remaining > 0) return null;
  actor.conditions.bide = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  const sleep = actor.conditions.sleep?.statusId;
  if (actor.resources.hp === 0 || actor.placement.kind !== 'map' || sleep && ['sleep', 'yawning', 'nightmare', 'napping'].includes(sleep) || actor.conditions.frozen && ['frozen', 'wrap', 'wrapped', 'petrified'].includes(actor.conditions.frozen.statusId) || actor.conditions.cringe && ['cringe', 'paused', 'infatuated'].includes(actor.conditions.cringe.statusId) || actor.conditions.burn?.statusId === 'paralysis' || actor.actorId !== context.state.session?.leaderActorId && (ability(actor, catalogs, 'Run Away') && actor.resources.hp < Math.trunc(maxHp(actor) / 2) || actor.tacticId === 'tactic-get-away' || actor.tacticId === 'tactic-avoid-trouble' && actor.resources.hp <= Math.trunc(maxHp(actor) / 2))) return null;
  return Math.min(999, 2 * c.payload.storedDamage);
}
