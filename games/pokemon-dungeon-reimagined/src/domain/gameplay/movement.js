import { canStep } from '../navigation/geometry.js';
import { checkSwap } from '../navigation/path.js';
import { navActor, navigationContext, occupants } from './support.js';

/** @typedef {import('../../../content/navigation-types.js').ReadonlyData<import('../../contracts/campaign.js').SessionActor>} Actor */
/** @param {Actor} actor @returns {import('../navigation/types.js').SwapActor} */
function swapActor(actor) {
  const sleep = actor.conditions.sleep?.statusId ?? 'none';
  return { actor: navActor(actor), immobilized: actor.conditions.frozen !== null && actor.conditions.frozen.statusId !== 'petrified', confused: actor.conditions.cringe?.statusId === 'confused', sleep: sleep === 'none' || sleep === 'sleepless' || sleep === 'yawning' ? sleep : 'other', charging: actor.conditions.bide !== null, swapEligible: actor.affiliation === 'team' };
}
/** Ordinary movement and safe team exchanges share the canonical geometry.
 * Unsafe terrain swaps require a future explicit confirmation/relocation path.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot['session']} session @param {Actor} actor @param {import('../../contracts.js').GridPosition} destination @param {import('./support.js').Catalogs} catalogs
 * @returns {{kind:'walk'}|{kind:'swap',other:import('../../contracts.js').ActorId}|{kind:'blocked'}} */
export function movementPlan(session, actor, destination, catalogs) {
  if (!session || actor.placement.kind !== 'map') return { kind: 'blocked' };
  const nav = navigationContext(session, catalogs);
  if (canStep(navActor(actor), session.floor, actor.placement.position, destination, occupants(session), nav)) return { kind: 'walk' };
  if (actor.actorId !== session.leaderActorId) return { kind: 'blocked' };
  const other = Object.values(session.actors).find(other => other.actorId !== actor.actorId && other.placement.kind === 'map' && other.placement.position.x === destination.x && other.placement.position.z === destination.z);
  if (!other || checkSwap(session.floor, swapActor(actor), swapActor(other), nav, false).kind !== 'allowed') return { kind: 'blocked' };
  return { kind: 'swap', other: other.actorId };
}
