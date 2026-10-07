import { calculateSpeedStage, tickSpeedTimers } from '../rules/speed.js';
/** @typedef {import('./types.js').MutationContext} Context */
/** @typedef {import('./types.js').ActorRef} ActorRef */
/** @typedef {import('../../contracts/campaign.js').ExpeditionState} Session */
/** @typedef {import('./types.js').TurnHooks} Hooks */

export class TurnFault extends Error {
  /** @param {'content-blocked'|'rejected'} kind @param {string} code */
  constructor(kind, code) { super('The command could not be completed.'); this.kind = kind; this.code = code; }
}
/** @param {unknown} value @returns {asserts value is {kind:string}} */
export function resultShape(value) {
  if (!value || typeof value !== 'object' || !('kind' in value) || typeof value.kind !== 'string' || 'then' in value) throw new TurnFault('content-blocked', 'turn-hook-result');
  if (value.kind === 'content-blocked' || value.kind === 'rejected') throw new TurnFault(value.kind, value.kind === 'rejected' ? 'unavailable' : 'turn-content');
}
/** @param {import('./types.js').HookResult} result @param {Context} context @param {boolean} [existingPrompt] */
export function hookResult(result, context, existingPrompt = false) {
  resultShape(result);
  if (result.kind !== 'continue' && result.kind !== 'prompt') throw new TurnFault('content-blocked', 'turn-hook-result');
  if (!existingPrompt || result.kind === 'prompt') checkPrompt(result.kind, context);
}
/** @param {string} kind @param {Context} context */
export function checkPrompt(kind, context) {
  const paused = context.state.session?.scheduler.kind !== 'ready';
  if (kind === 'prompt' && (!context.state.session || !paused || (!context.state.pendingResult && !context.state.pendingScene))) throw new TurnFault('content-blocked', 'turn-prompt-gate');
  if (kind !== 'prompt' && context.state.session && paused && context.state.session.scheduler.continuation.terminal === 'none') throw new TurnFault('content-blocked', 'turn-prompt-result');
}
/** @param {Context} context @returns {Session} */
export function sessionOf(context) {
  if (!context.state.session) throw new TurnFault('rejected', 'unavailable');
  return context.state.session;
}
/** ActorId is never reused; slot reuse cannot revive an old continuation. @param {Session} session @param {ActorRef|null} ref */
export function actorAt(session, ref) {
  if (!ref) return null;
  const slots = ref.side === 'team' ? session.scheduler.teamSlots : session.scheduler.wildSlots;
  const actor = session.actors[ref.actorId];
  return slots[ref.slot] === ref.actorId && actor?.placement.kind === 'map' && actor.placement.mapId === session.floor.mapId ? actor : null;
}
/** @param {Session} session @param {'team'|'wild'} side @param {number} slot @returns {ActorRef|null} */
export function slotAt(session, side, slot) {
  const actorId = (side === 'team' ? session.scheduler.teamSlots : session.scheduler.wildSlots)[slot];
  return actorId ? { side, slot, actorId } : null;
}
/** @param {Session} session @returns {ActorRef|null} */
export function leaderRef(session) {
  const slot = session.scheduler.teamSlots.indexOf(session.leaderActorId);
  return slot < 0 ? null : slotAt(session, 'team', slot);
}
/** @param {Session} session @returns {ActorRef[]} */
export function activeOrder(session) {
  /** @type {ActorRef[]} */ const refs = [];
  for (const side of /** @type {const} */ (['team', 'wild'])) {
    const slots = side === 'team' ? session.scheduler.teamSlots : session.scheduler.wildSlots;
    for (let i = 0; i < slots.length; i++) { const ref = slotAt(session, side, i); if (ref && actorAt(session, ref)) refs.push(ref); }
  }
  return refs;
}
/** @param {Context} context @param {Hooks} hooks @param {ActorRef} ref @param {boolean} tick */
export function refreshSpeed(context, hooks, ref, tick) {
  const actor = actorAt(sessionOf(context), ref);
  if (!actor) throw new TurnFault('content-blocked', 'turn-actor-identity');
  const supplied = hooks.speed(context, ref);
  if (!supplied || typeof supplied !== 'object' || 'then' in supplied) throw new TurnFault('content-blocked', 'turn-speed-context');
  const speed = { ...supplied, positiveTimers: actor.speed.positiveTimers, negativeTimers: actor.speed.negativeTimers };
  if (tick) {
    const change = tickSpeedTimers(speed);
    actor.speed.positiveTimers = [...change.positiveTimers]; actor.speed.negativeTimers = [...change.negativeTimers]; actor.speed.cachedStage = change.after;
  } else actor.speed.cachedStage = calculateSpeedStage(speed);
  return actor.speed.cachedStage;
}
/** @param {Hooks} hooks */
export function requireTurnHooks(hooks) {
  for (const name of ['speed', 'spawn', 'refreshSides', 'forcedLoss', 'begin', 'fieldUpkeep', 'experience', 'ai', 'startAction', 'effect', 'effectAllowed', 'invalidReference', 'end', 'tile', 'room', 'wind']) {
    if (typeof Object.getOwnPropertyDescriptor(hooks, name)?.value !== 'function') throw new TurnFault('content-blocked', `turn-${name}`);
  }
}

/** Install a result from the reviewed pure speed core. Lowering never erases an
 * earlier raise's immediate-refresh flag. No timer duration or RNG is invented.
 * @param {Context} context @param {ActorRef} ref
 * @param {import('../rules/speed.js').TimerChange} change */
export function installSpeedChange(context, ref, change) {
  const actor = actorAt(sessionOf(context), ref);
  if (!actor) throw new TurnFault('content-blocked', 'turn-actor-identity');
  if (change.positiveTimers.length !== 5 || change.negativeTimers.length !== 5 || !Number.isInteger(change.after) || change.after < 0 || change.after > 4 || [...change.positiveTimers, ...change.negativeTimers].some(timer => !Number.isInteger(timer) || timer < 0 || timer > 127)) throw new TurnFault('content-blocked', 'turn-speed-change');
  actor.speed.positiveTimers = [...change.positiveTimers]; actor.speed.negativeTimers = [...change.negativeTimers];
  actor.speed.cachedStage = change.after;
  actor.speed.speedRaisedThisAction ||= change.speedRaisedThisAction;
  if (change.clearAttackLock) actor.speed.attackLocked = false;
}
