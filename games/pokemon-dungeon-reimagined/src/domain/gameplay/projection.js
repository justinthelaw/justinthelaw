import { projectVisibility } from '../navigation/sight.js';
import { navigationContext, maxHp, FACINGS } from './support.js';

/** Explicit domain sight; the renderer never decides which enemies are visible.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state @param {import('./support.js').Catalogs} catalogs */
export function visibility(state, catalogs) {
  const session = state.session; const leader = session?.actors[session.leaderActorId];
  if (!session || leader?.placement.kind !== 'map') return null;
  return projectVisibility({ map: session.floor, context: navigationContext(session, catalogs), revision: state.revision,
    viewer: { position: leader.placement.position, blinded: leader.conditions.blinker?.statusId === 'blinker', seesInvisible: leader.conditions.blinker?.statusId === 'eyedrops' },
    actors: Object.values(session.actors).flatMap(actor => actor.placement.kind === 'map' ? [{ actorId: actor.actorId, position: actor.placement.position, present: true, invisible: actor.conditions.invisible?.statusId === 'invisible' }] : []),
    items: Object.values(state.containers).flatMap(container => container.owner.kind === 'floor' && container.owner.mapId === session.floor.mapId ? container.itemIds.map(itemId => ({ itemId, position: /** @type {import('../../contracts.js').GridPosition} */ (/** @type {{position:import('../../contracts.js').GridPosition}} */ (container.owner).position), onGround: true })) : []), revealTraps: false });
}
/** @param {import('../../contracts/campaign.js').CampaignSnapshot} state @param {import('./support.js').Catalogs} catalogs */
export function actorsView(state, catalogs) {
  return Object.values(state.session?.actors ?? {}).flatMap(actor => {
    if (actor.placement.kind !== 'map') return [];
    const record = actor.binding.kind === 'roster' ? state.roster[actor.binding.pokemonId] : null;
    return [{ actorId: actor.actorId, speciesId: actor.identity.speciesId, formId: actor.identity.formId, name: record?.nickname || catalogs.species.getSpecies(actor.identity.speciesId).name,
      x: actor.placement.position.x, z: actor.placement.position.z, heading: FACINGS.indexOf(actor.facing) * Math.PI / 4, hp: actor.resources.hp, maxHp: maxHp(actor),
      role: actor.binding.kind === 'roster' ? actor.binding.pokemonId === state.profile.heroId ? 'hero' : 'partner' : 'enemy' }];
  });
}

/** Renderer adapter facts; visual clips may be replaced by the application using
 * committed events. Every visible actor retains exact species/form identity.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state @param {import('./support.js').Catalogs} catalogs @param {string} epoch
 * @returns {import('../../presentation/types.js').PresentationCatalog} */
export function presentation(state, catalogs, epoch) {
  const actors = Object.fromEntries(Object.values(state.session?.actors ?? {}).map(actor => {
    const record = actor.binding.kind === 'roster' ? state.roster[actor.binding.pokemonId] : null;
    /** @type {import('../../presentation/types.js').ActorPresentation} */ const view = {
      appearance: { ...actor.identity }, name: record?.nickname || catalogs.species.getSpecies(actor.identity.speciesId).name,
      role: actor.binding.kind === 'roster' ? actor.binding.pokemonId === state.profile.heroId ? 'hero' : 'partner' : 'enemy', maxHp: maxHp(actor),
      statuses: Object.values(actor.conditions).flatMap(c => c ? [{ id: c.statusId, label: c.statusId }] : []),
      clip: actor.conditions.sleep ? 'rest-sleep' : 'idle', clipToken: `${epoch}:${actor.actorId}:idle`, tint: '#ffffff', bounds: { width: 1, height: 1 },
    }; return [actor.actorId, view];
  }));
  return { epoch, biomeId: state.session?.dungeonId ?? 'tiny-woods', terrain: Object.fromEntries(catalogs.navigation.terrainIds.map(id => [id, catalogs.navigation.terrain(id).kind])), actors,
    items: Object.fromEntries(Object.values(state.items).map(item => [item.itemInstanceId, { label: item.template.itemId.replace(/^item-/, '').replaceAll('-', ' '), color: '#f4d35e', kind: item.template.itemId === 'item-poke' ? 'money' : 'item' }])), traps: Object.fromEntries(Object.values(state.session?.floor.traps ?? {}).map(trap => [trap.trapId, { label: 'Wonder Tile', color: '#77c9e8' }])), props: [], events: [] };
}
