import { allocateId } from '../ids.js';
import { copyPlainData } from '../state/plain.js';
import { randomInteger } from '../rng.js';
import { TurnFault } from '../turns/support.js';

/** @typedef {import('../../contracts/campaign.js').CampaignState} State */
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../../../content/state/campaign.js').CampaignCatalogs & {navigation:import('../../../content/navigation-types.js').NavigationCatalog}} Catalogs */
/** @template T @param {T} value @returns {T} */
export function clone(value) { return /** @type {T} */ (/** @type {unknown} */ (copyPlainData(value))); }
/** @template {import('../../contracts.js').InstanceKind} K @param {State} state @param {K} kind */
export function allocate(state, kind) { const result = allocateId(state.idSequence, kind, new Set()); state.idSequence = result.sequence; return result.id; }
/** @param {string} requirement @returns {never} */
export function blocked(requirement) { throw new TurnFault('content-blocked', requirement); }
/** @param {State} state @param {number} upper @param {keyof State['random']} [stream] */
export function draw(state, upper, stream = 'combatRecruitment') { const result = randomInteger(state.random[stream], upper); state.random[stream] = result.state; return result.value; }
/** @param {import('../../contracts/campaign.js').Quantity} q */
export const value = q => q.numerator / q.denominator;
/** @param {number} numerator @param {number} [denominator] */
export function quantity(numerator, denominator = 1) { let a = Math.abs(numerator); let b = denominator; while (b) { const remainder = a % b; a = b; b = remainder; } const divisor = a || 1; return { numerator: numerator / divisor, denominator: denominator / divisor }; }
/** @param {import('../../../content/navigation-types.js').ReadonlyData<Actor>} actor */
export const maxHp = actor => actor.growth.naturalStats.hp + actor.growth.permanentStatBonuses.hp;
/** @param {import('../../contracts/campaign.js').SpeciesForm} identity @param {Catalogs} catalogs */
export function profile(identity, catalogs) { return catalogs.species.getProfile(identity.speciesId, identity.formId); }
/** @param {import('../../../content/navigation-types.js').ReadonlyData<Actor>} actor @param {Catalogs} catalogs @param {string} name */
export function ability(actor, catalogs, name) { const id = catalogs.species.identities.abilities.find(row => row.name === name); return !!id && profile(actor.identity, catalogs).abilityIds.includes(id.originalId); }
/** @param {import('../../../content/navigation-types.js').ReadonlyData<Actor>} actor */
export function navActor(actor) {
  if (actor.placement.kind !== 'map') return blocked('actor-off-map');
  return { actorId: actor.actorId, identity: actor.identity, position: actor.placement.position, mobile: false, mobileScarf: false, allTerrainHiker: false, superMobile: false };
}
/** @param {import('../../contracts/campaign.js').CampaignSnapshot['session']} session @param {Catalogs} catalogs */
export function navigationContext(session, catalogs) {
  if (!session || !('address' in session.floor.location)) return blocked('exploration-floor-required');
  const factual = catalogs.dungeons.getFloorById(session.floor.location.address.floorId);
  const parameters = catalogs.dungeons.getGeneration(factual.generationId).parameters;
  return { catalog: catalogs.navigation, tileset: parameters.tileset, visibilityRange: parameters.visibilityRange };
}
export const FACINGS = /** @type {const} */ (['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']);
/** @param {number} dx @param {number} dz @returns {import('../../contracts/campaign.js').Facing} */
export function facing(dx, dz) { const angle = Math.round(Math.atan2(dx, -dz) * 4 / Math.PI); return FACINGS[(angle + 8) % 8] ?? 's'; }
/** @param {import('../../contracts/campaign.js').CampaignSnapshot['session']} session */
export function occupants(session) { return Object.values(session?.actors ?? {}).flatMap(actor => actor.placement.kind === 'map' ? [{ actorId: actor.actorId, position: actor.placement.position }] : []); }
