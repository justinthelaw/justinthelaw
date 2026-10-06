import { requireRelation as check, unique, keyed, fingerprint, inBounds } from './relations.js';
import { pointer } from './structure.js';

/** @typedef {import('./relations.js').GraphContext} GraphContext */
/** @typedef {import('../../contracts/campaign.js').ItemArchive} ItemArchive */
/** @typedef {import('../../contracts/campaign.js').ExpeditionState} ExpeditionState */
/** @typedef {import('../../contracts/campaign.js').PokemonRecord} PokemonRecord */

/** Validate each namespace independently, including reciprocal ownership.
 * @param {GraphContext} context @param {ItemArchive} archive
 * @param {ExpeditionState|null} session @param {Record<string,PokemonRecord>} roster
 * @param {'live'|'entry-history'|'rescue-suspended'} scope @param {string} path
 * @param {import('../../contracts.js').ContainerId|null} toolbox
 */
export function checkInventory(context, archive, session, roster, scope, path, toolbox) {
  keyed(context, archive.items, i => i.itemInstanceId, `${path}/items`);
  keyed(context, archive.containers, c => c.containerId, `${path}/containers`);
  const placed = new Set();
  for (const container of Object.values(archive.containers)) {
    const at = pointer(`${path}/containers`, container.containerId);
    unique(context, container.itemIds, `${at}/itemIds`);
    for (const id of container.itemIds) {
      check(context, Object.hasOwn(archive.items, id) && !placed.has(id), at, 'Live item must have exactly one owning container.');
      placed.add(id);
    }
    const owner = container.owner;
    switch (owner.kind) {
      case 'campaign-toolbox':
        check(context, scope !== 'rescue-suspended' && container.containerId === toolbox, at, 'Campaign toolbox ownership is not reciprocal.'); break;
      case 'pokemon-held':
        check(context, roster[owner.pokemonId]?.heldContainerId === container.containerId, at, 'Pokemon held ownership is not reciprocal.'); break;
      case 'session-toolbox':
        check(context, scope !== 'entry-history' && session?.sessionId === owner.sessionId && session.inventory === container.containerId, at, 'Session toolbox ownership is not reciprocal.'); break;
      case 'actor-held':
        check(context, scope !== 'entry-history' && session?.sessionId === owner.sessionId && session.actors[owner.actorId]?.heldContainerId === container.containerId, at, 'Actor held ownership is not reciprocal.'); break;
      case 'floor':
        check(context, scope !== 'entry-history' && session?.sessionId === owner.sessionId && session.floor.mapId === owner.mapId, at, 'Floor container belongs to an absent map.');
        if (session) inBounds(context, owner.position, session.floor, at);
        break;
      case 'result-escrow':
        check(context, scope === 'live' && context.state.pendingResult?.resultId === owner.resultId, at, 'Result escrow has no owning result.'); break;
    }
  }
  for (const item of Object.values(archive.items)) {
    const at = pointer(`${path}/items`, item.itemInstanceId);
    check(context, placed.has(item.itemInstanceId) && item.quantity > 0, at, 'Item is orphaned or has an empty stack.');
    if (item.shopLotId !== null) {
      const lots = session ? Object.values(session.shops).flatMap(shop => Object.values(shop.lotById)) : [];
      const lot = lots.find(candidate => candidate.shopLotId === item.shopLotId);
      check(context, !!lot && fingerprint(lot.template) === fingerprint(item.template), at, 'Item shop claim does not resolve to its original lot template.');
    }
  }
  if (toolbox !== null) check(context, archive.containers[toolbox]?.owner.kind === 'campaign-toolbox', path, 'Home toolbox is absent.');
  for (const pokemon of Object.values(roster)) {
    const container = archive.containers[pokemon.heldContainerId];
    check(context, container?.owner.kind === 'pokemon-held' && container.owner.pokemonId === pokemon.pokemonId, path, 'Pokemon held container is absent.');
  }
  if (session && scope !== 'entry-history') {
    const container = archive.containers[session.inventory];
    check(context, container?.owner.kind === 'session-toolbox' && container.owner.sessionId === session.sessionId, path, 'Session toolbox is absent.');
    for (const actor of Object.values(session.actors)) {
      const held = archive.containers[actor.heldContainerId];
      check(context, held?.owner.kind === 'actor-held' && held.owner.sessionId === session.sessionId && held.owner.actorId === actor.actorId, path, 'Actor held container is absent.');
    }
  }
}
