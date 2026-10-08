import { hasHeldItem } from './held-effects.js';
import { ability, draw } from './support.js';
export { inflictParalysis } from './conditions.js';
import { statusTurns } from './conditions.js';

/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
export const MOVE_CONDITION_POLICY = /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-move-status-v11');
/** @param {Context} context @param {Actor} user @param {import('../../contracts.js').MoveId} moveId
 * @returns {import('../../contracts/campaign.js').EffectSource} */
export function moveConditionSource(context, user, moveId) {
  const session = context.state.session;
  if (!session) throw new TypeError('Move status requires its session.');
  return { kind: 'actor', actor: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: user.actorId, identity: { ...user.identity } }, moveId };
}
/** Native sub_805727C: all floor/entity/revival guards precede the chance draw,
 * and Shield Dust follows it. Caller supplies the same-hit revival result.
 * @param {Context} context @param {Actor} user @param {Actor} target
 * @param {number} chance @param {Catalogs} catalogs */
export function secondaryAllowed(context, user, target, chance, catalogs) {
  const session = context.state.session;
  if (!session || user.placement.kind !== 'map' || user.resources.hp === 0 || target.placement.kind !== 'map' || target.resources.hp === 0 || session.teamOrder.some(id => session.actors[id]?.resources.hp === 0) || context.state.steel?.bossDefeated && context.state.steel.phase === 'battle') return false;
  if (chance && draw(context.state, 100) >= chance * (ability(user, catalogs, 'Serene Grace') ? 2 : 1)) return false;
  return user.actorId === target.actorId || !ability(target, catalogs, 'Shield Dust');
}
/** Hypnosis samples its finite duration before every application guard. Sleep
 * and Nightmare never refresh; Sleepless/Napping reject and yawning may replace.
 * @param {Context} context @param {Actor} user @param {Actor} target @param {Catalogs} catalogs */
export function hypnosis(context, user, target, catalogs) {
  let remaining = statusTurns(context, target, 3, 7, catalogs);
  if (target.placement.kind !== 'map' || target.resources.hp === 0 || target.conditions.reflect?.statusId === 'safeguard' || target.enabledIqSkillIds.some(id => id === 'iq-nonsleeper') || ability(target, catalogs, 'Insomnia') || ability(target, catalogs, 'Vital Spirit') || hasHeldItem(context.state, target, 'item-insomniscope') || ['sleep', 'nightmare', 'sleepless', 'napping'].includes(target.conditions.sleep?.statusId ?? '')) return;
  if (ability(target, catalogs, 'Early Bird')) remaining = Math.max(1, Math.trunc(remaining / 2));
  target.conditions.sleep = { statusId: 'sleep', source: moveConditionSource(context, user, /** @type {import('../../contracts.js').MoveId} */ ('move-hypnosis')), duration: { kind: 'counter', policyId: MOVE_CONDITION_POLICY, remaining }, periodicCountdown: null, payload: { kind: 'none' } };
  context.emit({ type: 'conditionChanged', actorId: target.actorId });
}
