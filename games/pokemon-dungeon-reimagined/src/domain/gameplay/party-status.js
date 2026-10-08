import { ability, draw } from './support.js';
import { statusTurns, inflictParalysis } from './conditions.js';
import { moveConditionSource } from './move-conditions.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
export const PARTY_STATUS_POLICY = /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-party-status-v14');
export const PARTY_STATUS_MOVES = Object.freeze(['move-thunder-wave', 'move-disable', 'move-attract', 'move-smokescreen', 'move-reflect']);
/** The ordinary move owner resolves target/wake/accuracy first. These handlers
 * preserve source-specific duration draw timing and never refresh an existing
 * same status. Beneficial Reflect ignores curer skills when sampling.
 * @param {Context} context @param {Actor} user @param {Actor} target
 * @param {import('../../contracts/campaign.js').MoveSlot} slot @param {Catalogs} catalogs */
export function applyPartyStatus(context, user, target, slot, catalogs) {
  const moveId = slot.moveId, source = moveConditionSource(context, user, moveId);
  if (moveId === 'move-thunder-wave' || moveId === 'move-disable') {
    return inflictParalysis(context, target, source, catalogs, PARTY_STATUS_POLICY);
  }
  const whifferTurns = moveId === 'move-smokescreen' ? statusTurns(context, target, 1, 6, catalogs) : null;
  if (target.placement.kind !== 'map' || target.resources.hp === 0) return false;
  if (moveId === 'move-attract' || moveId === 'move-smokescreen') {
    if (target.conditions.reflect?.statusId === 'safeguard') return false;
    if (moveId === 'move-attract') {
      if (ability(target, catalogs, 'Oblivious') || target.conditions.cringe?.statusId === 'infatuated') return false;
      target.conditions.cringe = { statusId: 'infatuated', source, duration: { kind: 'counter', policyId: PARTY_STATUS_POLICY, remaining: statusTurns(context, target, 4, 6, catalogs) + 1 }, periodicCountdown: null, payload: { kind: 'none' } };
    } else {
      if (target.conditions.sureShot?.statusId === 'whiffer' || whifferTurns === null) return false;
      target.conditions.sureShot = { statusId: 'whiffer', source, duration: { kind: 'counter', policyId: PARTY_STATUS_POLICY, remaining: whifferTurns + 1 }, periodicCountdown: null, payload: { kind: 'none' } };
    }
  } else if (moveId === 'move-reflect') {
    if (target.conditions.reflect?.statusId === 'reflect') return false;
    target.conditions.reflect = { statusId: 'reflect', source, duration: { kind: 'counter', policyId: PARTY_STATUS_POLICY, remaining: 11 + draw(context.state, 2) }, periodicCountdown: null, payload: { kind: 'none' } };
  } else return false;
  context.emit({ type: 'conditionChanged', actorId: target.actorId });
  context.emit({ type: 'message', messageId: moveId === 'move-attract' ? 'infatuated-status' : moveId === 'move-smokescreen' ? 'whiffer-status' : 'reflect-status' });
  return true;
}
