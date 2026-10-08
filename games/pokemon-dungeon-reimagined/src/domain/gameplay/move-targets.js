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
 * @param {Catalogs} catalogs @param {import('../../contracts/campaign.js').TargetSelector} selector
 * @param {number} [category] */
export function moveTargets(session, actor, range, catalogs, selector, category = 0) {
  if (actor.placement.kind !== 'map') return [];
  if (range === 7) return [actor];
  const origin = actor.placement.position, nav = navigationContext(session, catalogs);
  const confused = actor.conditions.cringe?.statusId === 'confused' && !actor.enabledIqSkillIds.some(id => id === 'iq-nontraitor');
  const eligible = (/** @type {Actor} */ other) => other.affiliation !== 'neutral' && (confused || (category === 6 ? other.actorId !== actor.actorId && other.affiliation === actor.affiliation : other.affiliation !== actor.affiliation));
  if (range === 3) return activeActors(session).filter(other => eligible(other) && other.placement.kind === 'map' && isActuallyInSight(session.floor, origin, other.placement.position, nav.visibilityRange));
  const angle = FACINGS.indexOf(actor.facing) * Math.PI / 4;
  if (range === 5) {
    // Native straight-line execution stops at the first actor, including allies
    // and protected clients. These moves' category2 can hit either combat side.
    for (let distance = 1; distance <= 10; distance++) {
      const at = { x: origin.x + Math.round(Math.sin(angle)) * distance, z: origin.z - Math.round(Math.cos(angle)) * distance };
      const tile = session.floor.tiles[at.z]?.[at.x];
      if (!tile || catalogs.navigation.terrain(tile.terrainId).kind === 'wall') return [];
      const target = activeActors(session).find(other => other.placement.kind === 'map' && other.placement.position.x === at.x && other.placement.position.z === at.z);
      if (target) return target.affiliation !== 'neutral' && (category === 2 || eligible(target)) ? [target] : [];
    }
    return [];
  }
  if (range === 4) {
    // The native two-tile probe checks each destination tile, cuts corners and
    // proceeds through an ineligible ally, but never through blocked terrain.
    for (let distance = 1; distance <= 2; distance++) {
      const at = { x: origin.x + Math.round(Math.sin(angle)) * distance, z: origin.z - Math.round(Math.cos(angle)) * distance };
      if (!canTargetPosition(navActor(actor), session.floor, at, nav)) return [];
      const target = activeActors(session).find(other => other.placement.kind === 'map' && other.placement.position.x === at.x && other.placement.position.z === at.z);
      if (target && eligible(target)) return [target];
    }
    return [];
  }
  const target = selector.kind === 'actor' ? session.actors[selector.actorId] : activeActors(session).find(other => other.placement.kind === 'map' && other.placement.position.x === origin.x + Math.round(Math.sin(angle)) && other.placement.position.z === origin.z - Math.round(Math.cos(angle)));
  if (!target || !eligible(target) || target.placement.kind !== 'map') return [];
  const at = target.placement.position;
  if (Math.max(Math.abs(at.x - origin.x), Math.abs(at.z - origin.z)) !== 1) return [];
  const terrain = range === 8 ? canTargetPosition(navActor(actor), session.floor, at, nav) : canMeleeAttack(navActor(actor), session.floor, at, nav);
  return terrain ? [target] : [];
}
