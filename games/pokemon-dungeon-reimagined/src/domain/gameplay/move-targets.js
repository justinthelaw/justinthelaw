import { canMeleeAttack, canTargetPosition } from '../navigation/geometry.js';
import { isActuallyInSight } from '../navigation/sight.js';
import { navActor, navigationContext, FACINGS } from './support.js';

/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {NonNullable<import('../../contracts/campaign.js').CampaignState['session']>} Session */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** Native activePokemon order: team slots, then wild slots. Historical faint
 * records are retained for source references but never become move targets.
 * @param {Session} session @returns {Actor[]} */
export function activeActors(session) {
  return [...session.scheduler.teamSlots, ...session.scheduler.wildSlots].flatMap(id => id && session.actors[id]?.placement.kind === 'map' ? [session.actors[id]] : []);
}
/** Shared execution targeting for admitted single-front/self/room moves.
 * AI target search deliberately uses separate native AI flags.
 * @param {Session} session @param {Actor} actor @param {number} range
 * @param {Catalogs} catalogs @param {import('../../contracts/campaign.js').TargetSelector} selector */
export function moveTargets(session, actor, range, catalogs, selector) {
  if (actor.placement.kind !== 'map') return [];
  if (range === 7) return [actor];
  const origin = actor.placement.position, nav = navigationContext(session, catalogs);
  const confused = actor.conditions.cringe?.statusId === 'confused' && !actor.enabledIqSkillIds.some(id => id === 'iq-nontraitor');
  const eligible = (/** @type {Actor} */ other) => other.affiliation !== 'neutral' && (confused || other.affiliation !== actor.affiliation);
  if (range === 3) return activeActors(session).filter(other => eligible(other) && other.placement.kind === 'map' && isActuallyInSight(session.floor, origin, other.placement.position, nav.visibilityRange));
  const angle = FACINGS.indexOf(actor.facing) * Math.PI / 4;
  const target = selector.kind === 'actor' ? session.actors[selector.actorId] : activeActors(session).find(other => other.placement.kind === 'map' && other.placement.position.x === origin.x + Math.round(Math.sin(angle)) && other.placement.position.z === origin.z - Math.round(Math.cos(angle)));
  if (!target || !eligible(target) || target.placement.kind !== 'map') return [];
  const at = target.placement.position;
  if (Math.max(Math.abs(at.x - origin.x), Math.abs(at.z - origin.z)) !== 1) return [];
  const terrain = range === 8 ? canTargetPosition(navActor(actor), session.floor, at, nav) : canMeleeAttack(navActor(actor), session.floor, at, nav);
  return terrain ? [target] : [];
}
