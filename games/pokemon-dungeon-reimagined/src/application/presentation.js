import { FRIENDS, FRIEND_AREA_FACTS, areaMapId, friendAreaMap } from '../../content/authored/friends.js';
import { STEEL } from '../../content/authored/mt-steel.js';
import { steelScene } from './steel-presentation.js';
import { WORK } from '../../content/authored/early-work.js';
import { TOWN } from '../../content/authored/town.js';
import { THUNDERWAVE as T } from '../../content/authored/thunderwave.js';
import { MORNING } from '../../content/authored/first-morning.js';
import { TEAM } from '../../content/authored/team-formation.js';
import { immutableRenderSnapshot, projectDungeon } from '../presentation/projection.js';
/** @typedef {import('../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** @typedef {import('../presentation/types.js').ActorView} ActorView */
/** @typedef {ReturnType<typeof import('../domain/gameplay/index.js').createGameplay>} Gameplay */
const headings = { s: 0, se: Math.PI / 4, e: Math.PI / 2, ne: Math.PI * 3 / 4, n: Math.PI, nw: -Math.PI * 3 / 4, w: -Math.PI / 2, sw: -Math.PI / 4 };

/** @param {Snapshot} snapshot @param {string} epoch
 * @param {import('../../content/species.js').SpeciesCatalog} species
 * @returns {ActorView[]} */
function groundActors(snapshot, epoch, species) {
  return snapshot.town.placements.flatMap(placement => {
    if (placement.reference.kind !== 'pokemon') return [];
    const pokemon = snapshot.roster[placement.reference.pokemonId]; if (!pokemon) return [];
    const hp = pokemon.growth.naturalStats.hp + pokemon.growth.permanentStatBonuses.hp;
    return [{ actorId: pokemon.pokemonId, ...pokemon.identity, name: pokemon.nickname || species.getSpecies(pokemon.identity.speciesId).name,
      ...placement.position, heading: headings[placement.facing], role: pokemon.pokemonId === snapshot.profile.heroId ? 'hero' : 'partner', hp, maxHp: hp,
      statuses: [], clip: 'idle', clipToken: `${epoch}:${pokemon.pokemonId}:idle`, tint: '#ffffff', bounds: { width: 1, height: 1 } }];
  });
}

/** Explicit original base geometry and pair attention. No reunion NPC remains.
 * Camera follow stays with the original hero; facing and supported clips carry
 * attention without moving canonical placements or requiring animation timing.
 * @param {Snapshot} snapshot @param {string} epoch
 * @param {import('../../content/species.js').SpeciesCatalog} species */
function teamBase(snapshot, epoch, species) {
  const tiles = TEAM.ground.map(row => [...row].map(cell => cell === '#' ? /** @type {const} */ ('wall') : cell === '.' ? /** @type {const} */ ('floor') : /** @type {const} */ ('void')));
  const mask = tiles.map(row => row.map(tile => tile !== 'void'));
  const scene = snapshot.pendingScene;
  const actors = groundActors(snapshot, epoch, species).map(actor => {
    const mailbox = scene?.sceneId === TEAM.offer && scene.cursor === 1;
    const partners = scene?.sceneId === TEAM.naming || scene?.sceneId === TEAM.offer && scene.cursor >= 3;
    const heading = mailbox ? Math.atan2(8 - actor.x, 5 - actor.z) : partners ? actor.role === 'hero' ? Math.PI / 2 : -Math.PI / 2 : actor.heading;
    const clip = scene?.sceneId === TEAM.celebration && scene.cursor === 0 ? /** @type {const} */ ('celebrate') : scene?.sceneId === TEAM.celebration && scene.cursor === 2 ? /** @type {const} */ ('rest-sleep') : actor.clip;
    return { ...actor, heading, clip, clipToken: `${epoch}:${actor.actorId}:${scene?.sceneInstanceId ?? 'base'}:${scene?.cursor ?? 0}:${clip}` };
  });
  if (scene && scene.sceneId === STEEL.scenes[7]) {
    for (const [i, speciesId] of ['pokemon-051', 'pokemon-050', 'pokemon-081', 'pokemon-081'].entries()) actors.push({ actorId: `steel-thanks-${i}`, speciesId, formId: null, name: species.getSpecies(speciesId).name, x: 5 + i, z: 5, heading: 0, role: 'npc', hp: 1, maxHp: 1, statuses: [], clip: 'celebrate', clipToken: `${epoch}:${scene.sceneInstanceId}:${i}`, tint: '#ffffff', bounds: { width: 1, height: 1 } });
  }
  if (scene && scene.sceneId === WORK.scenes[0]) actors.push({ actorId: 'story-dugtrio-request', speciesId: 'pokemon-051', formId: null, name: 'Dugtrio', x: 7, z: 5, heading: 0, role: 'npc', hp: 1, maxHp: 1, statuses: [], clip: 'idle', clipToken: `${epoch}:${scene.sceneInstanceId}:dugtrio`, tint: '#ffffff', bounds: { width: 1, height: 1 } });
  if (scene && scene.sceneId === MORNING.scenes[5] && scene.cursor === 0) actors.push({ actorId: 'story-pelipper-delivery', speciesId: 'pokemon-279', formId: null, name: 'Pelipper', x: 9, z: 5, heading: -Math.PI / 2, role: 'npc', hp: 1, maxHp: 1, statuses: [], clip: 'idle', clipToken: `${epoch}:${scene.sceneInstanceId}:delivery`, tint: '#ffffff', bounds: { width: 1, height: 1 } });
  return immutableRenderSnapshot({ epoch, revision: snapshot.revision,
    world: { worldId: `${epoch}:${TEAM.map}`, revision: snapshot.revision, width: TEAM.width, height: TEAM.height, biomeId: TEAM.kitId, tiles, visible: mask, explored: mask, exits: [], props: TEAM.props },
    actors, pickups: [], events: [] });
}

/** Presentation-only meadow staging, from authored bounds/placements. NPC staging
 * is original composition and never writes town/session records.
 * @param {Snapshot} snapshot @param {Gameplay} gameplay @param {string} epoch
 * @param {import('../../content/species.js').SpeciesCatalog} species */
function meadow(snapshot, gameplay, epoch, species) {
  const { width, height } = gameplay.authored;
  const tiles = Array.from({ length: height }, (_, z) => Array.from({ length: width }, (_, x) => x === 0 || z === 0 || x === width - 1 || z === height - 1 ? /** @type {const} */ ('wall') : /** @type {const} */ ('floor')));
  const mask = tiles.map(row => row.map(() => true));
  const actors = groundActors(snapshot, epoch, species);
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
 * source owners. Bind the implemented forest/cave routes to their environment kits explicitly.
 * @param {Snapshot} snapshot @param {Gameplay} gameplay @param {string} epoch
 * @param {import('../../content/species.js').SpeciesCatalog} species
 * @param {readonly import('../domain/turns/types.js').Event[]} [events] */
export function renderSnapshot(snapshot, gameplay, epoch, species, events = []) {
  if (snapshot.pendingScene && STEEL.scenes.some((id, index) => ![4, 7, 8].includes(index) && id === snapshot.pendingScene?.sceneId)) return steelScene(snapshot, epoch, species);
  if (snapshot.pendingScene?.sceneId === T.rescue || snapshot.pendingScene?.sceneId === T.reward) return caveScene(snapshot, epoch, species);
  if (!snapshot.session) {
    const area = FRIEND_AREA_FACTS.find(row => row.id && areaMapId(row.id) === snapshot.town.mapDefinitionId);
    if (area?.id) { const map = friendAreaMap(area.id), mask = map.tiles.map(row => row.map(() => true)); return immutableRenderSnapshot({ epoch, revision: snapshot.revision, world: { ...map, worldId: `${epoch}:${snapshot.town.mapDefinitionId}`, revision: snapshot.revision, visible: mask, explored: mask, exits: [] }, actors: groundActors(snapshot,epoch,species), pickups: [], events: [] }); }
    switch (snapshot.town.mapDefinitionId) {
      case gameplay.authored.town.mapDefinitionId: return meadow(snapshot, gameplay, epoch, species);
      case TOWN.square: case TOWN.post: return townSquare(snapshot, epoch, species);
      case TEAM.map: return teamBase(snapshot, epoch, species);
      case MORNING.interior: return baseInterior(snapshot, epoch, species);
      default: throw new Error(`Unavailable ground map: ${snapshot.town.mapDefinitionId}`);
    }
  }
  if (!['tiny-woods', T.dungeonId, STEEL.dungeonId].includes(snapshot.session.dungeonId)) throw new Error('Unavailable dungeon environment binding.');
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
  return immutableRenderSnapshot({ ...projected, world: { ...projected.world, biomeId: snapshot.session.dungeonId === 'tiny-woods' ? 'forest' : 'cave' } });
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
  const messages = { 'held-bag-full': 'Your toolbox is full. Make room before taking the held item.', 'ginseng-no-effect': 'Ginseng had no effect. SET a move that can gain power.', 'ginseng-boost': 'Ginseng strengthened the SET move.', 'ginseng-great-boost': 'Ginseng gave the SET move a greater power boost!', 'confused-status': 'A Pokémon became confused.', 'move-recoil': 'The user took recoil damage.', 'stat-drop-protected': 'The stat drop was blocked.', 'stat-stage-limit': 'The stat cannot change further.', 'stat-stage-raised': 'A stat rose.', 'stat-stage-lowered': 'A stat fell.', 'reviver-seed-restored': 'A Reviver Seed restored HP and Belly, leaving a Plain Seed. Move PP is unchanged.', 'berry-used': 'The item was used.', 'poison-damage': 'Poison costs 4 HP.', 'wonder-tile': 'The Wonder Tile reset stat changes.', 'paralysis-prevents-attack': 'Paralysis prevented the attack.', 'item-sticky': 'The item is sticky.', 'enemy-fainted': 'An enemy fainted.', 'level-up': 'A team member gained a level.', 'hunger-damage': 'Your Belly is empty. Hunger costs HP.', 'move-learning-declined-full-slots': 'Four move slots are full; the new move was declined.', 'reward-sent-to-storage': 'A reward item was sent to storage.' };
  for (const event of events) {
    if (event.type === 'attackResolved' && names.has(event.actorId) && event.outcome !== 'hit') lines.push(`${names.get(event.actorId)}: ${event.outcome === 'miss' ? 'miss' : 'no effect'}`);
    if (event.type === 'message') lines.push(Object.hasOwn(messages, event.messageId) ? /** @type {Record<string,string>} */ (messages)[event.messageId] ?? event.messageId : event.messageId.startsWith('wind-') ? 'A mysterious wind is approaching. Find the stairs.' : event.messageId.replaceAll('-', ' '));
    if (event.type === 'expeditionEnded') lines.push(event.outcome === 'success' ? previous?.session?.purpose.kind === 'ordinary' ? 'The ordinary expedition ended. Eligible clients will thank you in town.' : previous?.session?.dungeonId === STEEL.dungeonId ? 'The summit is clear. Help Diglett cross the gap.' : previous?.session?.dungeonId === T.dungeonId ? 'The Magnemite are safe.' : 'Caterpie is safe.' : 'The expedition ended. Growth is retained; carried items and money follow the defeat rules. You can retry.');
    if (event.type === 'itemChanged' && view.pickups.every(item => item.pickupId !== event.itemInstanceId)) lines.push('An item changed. Check your held item or toolbox.');
  }
  return lines;
}

/** Original open-roof 3D shelter interior, lit by the town kit and its window.
 * Indoor occupancy is canonical; clips are presentation-only.
 * @param {Snapshot} snapshot @param {string} epoch
 * @param {import('../../content/species.js').SpeciesCatalog} species */
function baseInterior(snapshot, epoch, species) {
  const tiles = MORNING.ground.map(row => [...row].map(cell => cell === '#' ? /** @type {const} */ ('wall') : /** @type {const} */ ('floor')));
  const mask = tiles.map(row => row.map(() => true));
  const scene = snapshot.pendingScene;
  const actors = groundActors(snapshot, epoch, species).map(actor => {
    const clip = scene?.sceneId === MORNING.scenes[0] && scene?.cursor === 0 || scene?.sceneId === MORNING.scenes[1] ? /** @type {const} */ ('rest-sleep') : actor.clip;
    return { ...actor, ...(clip === 'rest-sleep' ? { z: 3, elevation: .72 } : {}), clip, clipToken: `${epoch}:${actor.actorId}:${scene?.sceneInstanceId}:${scene?.cursor}:${clip}` };
  });
  return immutableRenderSnapshot({ epoch, revision: snapshot.revision,
    world: { worldId: `${epoch}:${MORNING.interior}`, revision: snapshot.revision, width: MORNING.width, height: MORNING.height, biomeId: MORNING.kitId, tiles, visible: mask, explored: mask, exits: [], props: MORNING.props }, actors, pickups: [], events: [] });
}

/** Original separate scene composition; never a generated sixth floor.
 * @param {Snapshot} snapshot @param {string} epoch @param {import('../../content/species.js').SpeciesCatalog} species */
function caveScene(snapshot, epoch, species) {
  const rescue = snapshot.pendingScene?.sceneId === T.rescue;
  const width = 13, height = 11;
  const tiles = Array.from({ length: height }, (_, z) => Array.from({ length: width }, (_, x) => x === 0 || z === 0 || x === width - 1 || z === height - 1 ? /** @type {const} */ ('wall') : /** @type {const} */ ('floor')));
  const mask = tiles.map(row => row.map(() => true));
  const actors = groundActors(snapshot, epoch, species).map((actor, index) => ({ ...actor, actorId: snapshot.session?.teamOrder[index] ?? actor.actorId, x: 4 + index * 2, z: 6, heading: Math.PI }));
  for (let index = 0; index < (rescue ? 2 : 3); index++) actors.push({ actorId: `story-magnemite-${index}`, speciesId: 'pokemon-081', formId: null, name: index === 2 ? 'Magnemite friend' : 'Magnemite', x: rescue ? 5 + index : 4 + index * 2, z: 4, heading: 0, role: 'client', hp: 1, maxHp: 1, statuses: [], clip: rescue ? 'idle' : 'celebrate', clipToken: `${epoch}:magnemite:${index}:${snapshot.pendingScene?.sceneInstanceId}`, tint: '#ffffff', bounds: { width: 1, height: 1 } });
  return immutableRenderSnapshot({ epoch, revision: snapshot.revision, world: { worldId: `${epoch}:${rescue ? T.clearing : T.entrance}`, revision: snapshot.revision, width, height, biomeId: 'cave', tiles, visible: mask, explored: mask, exits: [], props: [] }, actors, pickups: [], events: [] });
}

/** Original spacious market/post-office staging, using existing local 3D props.
 * NPCs are presentation actors; services mutate only canonical domain state.
 * @param {Snapshot} snapshot @param {string} epoch
 * @param {import('../../content/species.js').SpeciesCatalog} species */
function townSquare(snapshot, epoch, species) {
  const post = snapshot.town.mapDefinitionId === TOWN.post;
  const width = TOWN.width, height = TOWN.height;
  const tiles = Array.from({ length: height }, (_, z) => Array.from({ length: width }, (_, x) => x === 0 || z === 0 || x === width - 1 || z === height - 1 ? /** @type {const} */ ('wall') : /** @type {const} */ ('floor')));
  const mask = tiles.map(row => row.map(() => true));
  const actors = groundActors(snapshot, epoch, species);
  const residents = post ? [{ id: 'pelipper', speciesId: 'pokemon-279', x: 9, z: 5 }]
    : [{ id: 'kecleon-shop', speciesId: 'pokemon-352', x: 3, z: 5 }, { id: 'kecleon-wares', speciesId: 'pokemon-352', x: 5, z: 5 }, { id: 'persian', speciesId: 'pokemon-053', x: 14, z: 5 }, { id: 'kangaskhan', speciesId: 'pokemon-115', x: 4, z: 10 }, { id: 'gulpin', speciesId: 'pokemon-316', x: 14, z: 10 }];
  if (!post && snapshot.friends) residents.push({ id: 'wigglytuff',speciesId: 'pokemon-040',...FRIENDS.wigglytuff });
  if (!post && snapshot.pendingScene && snapshot.pendingScene.sceneId === FRIENDS.scenes[2] && snapshot.pendingScene.cursor >= 1 && snapshot.pendingScene.cursor < 4) residents.push({ id: 'magnemite-a',speciesId: 'pokemon-081',x: 6,z: 8 },{ id: 'magnemite-b',speciesId: 'pokemon-081',x: 8,z: 8 });
  if (!post && ['encounter-ready','encounter'].includes(snapshot.friends?.phase ?? '')) for (const [i,id] of ['pokemon-189','pokemon-275',...(snapshot.pendingScene && snapshot.pendingScene.cursor >= 2 ? ['pokemon-065','pokemon-006','pokemon-248'] : [])].entries()) residents.push({ id: `wind-request-${i}`,speciesId: id,x: 11+i,z: 6 });
  for (const row of residents) actors.push({ actorId: `town-${row.id}`, speciesId: row.speciesId, formId: null, name: species.getSpecies(row.speciesId).name, x: row.x, z: row.z, heading: 0, role: 'npc', hp: 1, maxHp: 1, statuses: [], clip: 'idle', clipToken: `${epoch}:town-${row.id}:idle`, tint: '#ffffff', bounds: { width: 1, height: 1 } });
  const props = post ? [{ id: 'post-building', kind: 'cottage', x: 9, z: 3, yaw: 0 }, { id: 'post-board', kind: 'notice-board', x: 12, z: 7, yaw: 0 }, { id: 'post-mailbox', kind: 'mailbox', x: 6, z: 6, yaw: 0 }]
    : [{ id: 'shop-building', kind: 'cottage', x: 4, z: 3, yaw: 0 }, { id: 'bank-building', kind: 'cottage', x: 14, z: 3, yaw: 0 }, { id: 'storage-building', kind: 'cottage', x: 3, z: 11, yaw: Math.PI }, { id: 'square-well', kind: 'pond-well', x: 9, z: 5, yaw: 0 }];
  props.push({ id: 'town-tree', kind: 'broadleaf-tree', x: 17, z: 2, yaw: 0 }, { id: 'town-flowers', kind: 'flower-patch', x: 1, z: 10, yaw: 0 });
  return immutableRenderSnapshot({ epoch, revision: snapshot.revision, world: { worldId: `${epoch}:${snapshot.town.mapDefinitionId}`, revision: snapshot.revision, width, height, biomeId: TEAM.kitId, tiles, visible: mask, explored: mask, exits: [], props }, actors, pickups: [], events: [] });
}
