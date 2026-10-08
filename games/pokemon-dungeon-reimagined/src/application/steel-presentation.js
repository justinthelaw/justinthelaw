import { STEEL } from '../../content/authored/mt-steel.js';
import { buildSteelArena } from '../domain/generation/steel-arena.js';
import { immutableRenderSnapshot } from '../presentation/projection.js';
/** Original scene staging only. Canonical HP, roles, map and outcomes never
 * derive from these positions. Each cursor is a stable visible save boundary.
 * @param {import('../contracts/campaign.js').CampaignSnapshot} snapshot
 * @param {string} epoch @param {import('../../content/species.js').SpeciesCatalog} species
 * @returns {import('../presentation/types.js').RenderSnapshot} */
export function steelScene(snapshot, epoch, species) {
  const scene = snapshot.pendingScene, index = STEEL.scenes.findIndex(id => id === scene?.sceneId), cursor = scene?.cursor ?? 0;
  const travel = index < 2;
  const tiles = travel ? Array.from({ length: 12 }, (_, z) => Array.from({ length: 13 }, (_, x) => x < 3 || x > 9 || z === 0 ? /** @type {const} */ ('wall') : /** @type {const} */ ('floor'))) : buildSteelArena().cells.map(row => row.map(tile => tile.terrain));
  const mask = tiles.map(row => row.map(() => true));
  /** @type {import('../presentation/types.js').ActorView[]} */ const actors = [];
  /** @param {string} actorId @param {string} speciesId @param {number} x @param {number} z @param {import('../presentation/types.js').ActorView['role']} role @param {number} [elevation]
   * @param {Partial<Pick<import('../presentation/types.js').ActorView, 'formId'|'name'|'hp'|'maxHp'>>} [details] */
  function add(actorId, speciesId, x, z, role, elevation = 0, details = {}) {
    actors.push({ actorId, speciesId, formId: null, name: species.getSpecies(speciesId).name, x, z, heading: role === 'hero' || role === 'partner' ? Math.PI : 0, elevation, role, hp: 1, maxHp: 1, ...details, statuses: [], clip: 'idle', clipToken: `${epoch}:${scene?.sceneInstanceId}:${cursor}:${actorId}`, tint: '#ffffff', bounds: { width: 1, height: 1 } });
  }
  for (const [i, id] of [snapshot.profile.heroId, snapshot.profile.partnerId].entries()) {
    const pokemon = snapshot.roster[id]; if (!pokemon) continue;
    const actor = Object.values(snapshot.session?.actors ?? {}).find(candidate => candidate.binding.kind === 'roster' && candidate.binding.pokemonId === id);
    const identity = actor?.identity ?? pokemon.identity, growth = actor?.growth ?? pokemon.growth;
    const maxHp = growth.naturalStats.hp + growth.permanentStatBonuses.hp;
    add(actor?.actorId ?? id, identity.speciesId, travel ? 6 + i : 9 + i, travel ? 8 : 13, i === 0 ? 'hero' : 'partner', 0,
      { formId: identity.formId, name: pokemon.nickname || species.getSpecies(identity.speciesId).name, hp: actor?.resources.hp ?? maxHp, maxHp });
  }
  if (travel) { if (index === 0) add('steel-dugtrio-travel', 'pokemon-051', 7, 5, 'npc'); }
  else if (index !== 10) {
    if (index === 2 || index === 3 || index === 5) add('steel-skarmory-scene', 'pokemon-227', index === 5 && cursor > 0 ? 7 : 9, index === 5 && cursor > 0 ? 7 : 11, 'boss', index === 5 && cursor > 0 ? 3 : 0);
    const crossing = index === 6;
    add('steel-diglett-scene', 'pokemon-050', 9, crossing && cursor >= 3 ? 12 : crossing && cursor === 2 ? 10 : 7, 'client', crossing && cursor === 2 ? 1.1 : 0);
    if (crossing && cursor >= 1) for (let i = 0; i < 2; i++) add(`steel-magnemite-${i}`, 'pokemon-081', 8 + i * 2, cursor === 1 ? 14 : cursor === 2 ? 10 : 12, 'npc', cursor === 2 ? 1.1 : .5);
  }
  return immutableRenderSnapshot({ epoch, revision: snapshot.revision, world: { worldId: `${epoch}:${travel ? STEEL.entrance : STEEL.summit}`, revision: snapshot.revision, width: tiles[0]?.length ?? 0, height: tiles.length, biomeId: 'cave', tiles, visible: mask, explored: mask, exits: [], props: [] }, actors, pickups: [], events: [] });
}
