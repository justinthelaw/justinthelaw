/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** Native EndFrozenClassStatus's Petrified branch, without thawing another
 * frozen-class condition. Swapping uses only this narrow release.
 * @param {Context} context @param {Actor} actor */
export function clearPetrified(context, actor) {
  if (actor.conditions.frozen?.statusId !== 'petrified') return false;
  actor.conditions.frozen = null;
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  context.emit({ type: 'message', messageId: 'petrified-ended' });
  return true;
}
/** Native TrySendImmobilizeSleepEndMsg: Petrified first, then only ordinary
 * Sleep at native127. Spawn sleep uses the existing indefinite representation;
 * finite Sleep and every other sleep/frozen class remain unchanged. No RNG.
 * @param {Context} context @param {Actor} actor */
export function interruptPetrifiedSleep(context, actor) {
  const changed = clearPetrified(context, actor), sleep = actor.conditions.sleep;
  if (sleep?.statusId !== 'sleep' || !(sleep.duration.kind === 'indefinite' || sleep.duration.kind === 'counter' && sleep.duration.remaining === 127)) return changed;
  actor.conditions.sleep = null;
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  context.emit({ type: 'message', messageId: 'sleep-ended' });
  return true;
}
