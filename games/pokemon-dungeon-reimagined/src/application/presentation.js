import { immutableRenderSnapshot, projectDungeon } from '../presentation/projection.js';
/** @typedef {import('../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** @typedef {import('../presentation/types.js').ActorView} ActorView */
/** @typedef {ReturnType<typeof import('../domain/gameplay/index.js').createGameplay>} Gameplay */
const headings = { s: 0, se: Math.PI / 4, e: Math.PI / 2, ne: Math.PI * 3 / 4, n: Math.PI, nw: -Math.PI * 3 / 4, w: -Math.PI / 2, sw: -Math.PI / 4 };

/** Presentation-only meadow staging, from authored bounds/placements. NPC staging
 * is original composition and never writes town/session records.
 * @param {Snapshot} snapshot @param {Gameplay} gameplay @param {string} epoch
 * @param {import('../../content/species.js').SpeciesCatalog} species */
function meadow(snapshot, gameplay, epoch, species) {
  const { width, height } = gameplay.authored;
  const tiles = Array.from({ length: height }, (_, z) => Array.from({ length: width }, (_, x) => x === 0 || z === 0 || x === width - 1 || z === height - 1 ? /** @type {const} */ ('wall') : /** @type {const} */ ('floor')));
  const mask = tiles.map(row => row.map(() => true));
  /** @type {ActorView[]} */ const actors = snapshot.town.placements.flatMap(placement => {
    if (placement.reference.kind !== 'pokemon') return [];
    const pokemon = snapshot.roster[placement.reference.pokemonId]; if (!pokemon) return [];
    const hp = pokemon.growth.naturalStats.hp + pokemon.growth.permanentStatBonuses.hp;
    return [{ actorId: pokemon.pokemonId, ...pokemon.identity, name: pokemon.nickname || species.getSpecies(pokemon.identity.speciesId).name,
      ...placement.position, heading: headings[placement.facing], role: pokemon.pokemonId === snapshot.profile.heroId ? 'hero' : 'partner', hp, maxHp: hp,
      statuses: [], clip: 'idle', clipToken: `${epoch}:${pokemon.pokemonId}:idle`, tint: '#ffffff', bounds: { width: 1, height: 1 } }];
  });
  const scene = snapshot.pendingScene;
  const requester = scene?.sceneId === 'browser-butterfree-reunion' || scene?.sceneId === 'browser-opening-awakening' && scene.cursor === 3;
  const client = scene?.sceneId === 'browser-caterpie-clearing' || scene?.sceneId === 'browser-butterfree-reunion';
  for (const entry of [{ show: requester, id: 'pokemon-012', name: 'Butterfree', x: 7, z: 4 }, { show: client, id: 'pokemon-010', name: 'Caterpie', x: 7, z: 5 }]) {
    if (entry.show) actors.push({ actorId: `story-${entry.id}`, speciesId: entry.id, formId: null, name: entry.name, x: entry.x, z: entry.z, heading: -Math.PI / 2,
      role: 'npc', hp: 1, maxHp: 1, statuses: [], clip: 'idle', clipToken: `${epoch}:${entry.id}:idle`, tint: '#ffffff', bounds: { width: 1, height: 1 } });
  }
  return immutableRenderSnapshot({ epoch, revision: snapshot.revision, world: { worldId: `${epoch}:meadow`, revision: snapshot.revision, width, height, biomeId: 'forest', tiles,
    visible: mask, explored: mask, exits: [], props: [ { id: 'meadow-tree', kind: 'broadleaf-tree', x: 2, z: 2, yaw: .4 }, { id: 'meadow-flowers', kind: 'flower-patch', x: 8, z: 6, yaw: 0 } ] }, actors, pickups: [], events: [] });
}

/** All dungeon knowledge and effective appearances come from their existing
 * source owners. Adapt the accepted Tiny Woods→forest kit binding explicitly.
 * @param {Snapshot} snapshot @param {Gameplay} gameplay @param {string} epoch
 * @param {import('../../content/species.js').SpeciesCatalog} species
 * @param {readonly import('../domain/turns/types.js').Event[]} [events] */
export function renderSnapshot(snapshot, gameplay, epoch, species, events = []) {
  if (!snapshot.session) return meadow(snapshot, gameplay, epoch, species);
  const visibility = gameplay.getVisibility(snapshot);
  if (!visibility) throw new Error('Current dungeon visibility is unavailable.');
  const source = gameplay.getPresentation(snapshot, epoch);
  const presentation = { ...source, actors: { ...source.actors } };
  // Detached visual clip selection cannot affect turn ordering or combat.
  for (const event of events) {
    if (!('actorId' in event)) continue;
    const actor = presentation.actors[event.actorId]; if (!actor) continue;
    if (event.type === 'actorMoved') presentation.actors[event.actorId] = { ...actor, clip: 'walk', clipToken: `${epoch}:${event.eventId}:walk` };
    if (event.type === 'attackResolved') presentation.actors[event.actorId] = { ...actor, clip: 'attack-physical', clipToken: `${epoch}:${event.eventId}:attack` };
  }
  const projected = projectDungeon(snapshot, visibility, presentation);
  return immutableRenderSnapshot({ ...projected, world: { ...projected.world, biomeId: 'forest' } });
}

/** Only player-visible facts may enter the log; concealed enemies stay concealed.
 * @param {Snapshot|null} previous @param {import('../presentation/types.js').RenderSnapshot} view
 * @param {readonly import('../domain/turns/types.js').Event[]} events */
export function eventMessages(previous, view, events) {
  const names = new Map(view.actors.map(actor => [actor.actorId, actor.name]));
  /** @type {string[]} */ const lines = [];
  for (const actor of view.actors) {
    const before = previous?.session?.actors[actor.actorId];
    if (before && before.resources.hp !== actor.hp) lines.push(`${actor.name}: ${actor.hp < before.resources.hp ? '−' : '+'}${Math.abs(actor.hp - before.resources.hp)} HP`);
  }
  const messages = { 'berry-used': 'The berry was used.', 'item-sticky': 'The item is sticky.', 'enemy-fainted': 'An enemy fainted.', 'level-up': 'A team member gained a level.', 'hunger-damage': 'Your Belly is empty. Hunger costs HP.', 'move-learning-declined-full-slots': 'Four move slots are full; the new move was declined.', 'reward-sent-to-storage': 'A reward berry was sent to storage.' };
  for (const event of events) {
    if (event.type === 'attackResolved' && names.has(event.actorId) && event.outcome !== 'hit') lines.push(`${names.get(event.actorId)}: ${event.outcome === 'miss' ? 'miss' : 'no effect'}`);
    if (event.type === 'message') lines.push(Object.hasOwn(messages, event.messageId) ? /** @type {Record<string,string>} */ (messages)[event.messageId] ?? event.messageId : event.messageId.startsWith('wind-') ? 'A mysterious wind is approaching. Find the stairs.' : event.messageId.replaceAll('-', ' '));
    if (event.type === 'expeditionEnded') lines.push(event.outcome === 'success' ? 'Caterpie is safe.' : 'The expedition ended. Growth is retained; carried items and money follow the defeat rules. You can retry.');
    if (event.type === 'itemChanged' && view.pickups.every(item => item.pickupId !== event.itemInstanceId)) lines.push('An item changed. Check your held item or toolbox.');
  }
  return lines;
}
