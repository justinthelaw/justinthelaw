import { statusTurns } from './conditions.js';
import { blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** Source PetrifiedStatusTarget, after T01 Belly/sticky and T02 hit/catch.
 * Native Wrap/Wrapped linkage has no admitted owner yet; never discard only
 * one side of a future reciprocal condition. No boss or ability immunity.
 * @param {Context} context @param {Actor} user @param {Actor} target
 * @param {import('./support.js').Catalogs} catalogs */
export function stunSeed(context, user, target, catalogs) {
  const session = context.state.session;
  if (!session || session.actors[user.actorId] !== user || session.actors[target.actorId] !== target) return blocked('stun-session-actor');
  if (target.placement.kind !== 'map' || target.placement.mapId !== session.floor.mapId || target.resources.hp <= 0) return;
  if (target.conditions.reflect?.statusId === 'safeguard') { context.emit({ type: 'message', messageId: 'stun-protected' }); return; }
  if (['wrap', 'wrapped'].includes(target.conditions.frozen?.statusId ?? '')) return blocked('stun-reciprocal-wrap-release');
  if (target.conditions.frozen?.statusId === 'petrified') context.emit({ type: 'message', messageId: 'petrified-already-active' });
  else {
    const leader = target.actorId === session.leaderActorId;
    target.conditions.frozen = { statusId: 'petrified', source: { kind: 'item', itemId: /** @type {import('../../contracts.js').ItemId} */ ('item-stun-seed'), user: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: user.actorId, identity: { ...user.identity } } }, duration: { kind: 'counter', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-stun-seed-v18'), remaining: statusTurns(context, target, leader ? 20 : 127, leader ? 30 : 127, catalogs) + 1 }, periodicCountdown: null, payload: { kind: 'none' } };
    context.emit({ type: 'conditionChanged', actorId: target.actorId });
    context.emit({ type: 'message', messageId: 'petrified-status' });
  }
  // The represented AI owns only target/destination/waiting, not the native
  // objective enum. Native leaves the remembered position when ending chase.
  if (target.affiliation !== 'team') for (const id of session.scheduler.teamSlots) {
    const teammate = id ? session.actors[id] : null;
    if (teammate?.ai.target?.kind === 'actor' && teammate.ai.target.actorId === target.actorId) teammate.ai.target = null;
  }
}
