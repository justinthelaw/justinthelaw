import { requireRelation as check, unique, keyed, checkMoves, checkPp, fingerprint } from './relations.js';

/** @typedef {import('./relations.js').GraphContext} GraphContext */
/** @typedef {import('../../contracts/campaign.js').ExpeditionState} ExpeditionState */
/** @typedef {import('../../contracts/campaign.js').SessionActor} SessionActor */

/** Resolve all permanent participant claims, even on a malformed graph. Rescue
 * reservation cannot be bypassed by omitting the claimed participant's baseline.
 * @param {ExpeditionState} session @returns {Set<string>}
 */
export function participantPokemonIds(session) {
  const ids = new Set(Object.keys(session.entry.entrants));
  for (const id of session.entry.selectedPartyIds) ids.add(id);
  for (const actor of Object.values(session.actors)) if (actor.binding.kind === 'roster') ids.add(actor.binding.pokemonId);
  for (const settlement of session.participantSettlements) if (settlement.pokemonId !== null) ids.add(settlement.pokemonId);
  return ids;
}

/** Bidirectional participant graph, shared by active and suspended sessions.
 * A retired actor may be absent, with its settlement retaining the historical
 * actor/Pokemon pair. Any extant binding must agree with both sides of that pair.
 * @param {GraphContext} context @param {ExpeditionState} session @param {string} path
 * @returns {Record<string,import('../../contracts/campaign.js').PokemonRecord>}
 */
export function checkParticipants(context, session, path) {
  const entry = session.entry;
  check(context, entry.sessionId === session.sessionId, path, 'Entry baseline belongs to another session.');
  unique(context, entry.selectedPartyIds, `${path}/entry/selectedPartyIds`);
  keyed(context, entry.entrants, entrant => entrant.pokemon.pokemonId, `${path}/entry/entrants`);
  unique(context, session.participantSettlements.map(settlement => settlement.actorId), `${path}/participantSettlements`);
  unique(context, session.participantSettlements.flatMap(settlement => settlement.pokemonId ? [settlement.pokemonId] : []), `${path}/participantSettlements`);

  /** @type {Map<string,SessionActor>} */ const bound = new Map();
  const settledByActor = new Map(session.participantSettlements.map(settlement => [settlement.actorId, settlement]));
  const settledByPokemon = new Map(session.participantSettlements.flatMap(settlement => settlement.pokemonId ? [[settlement.pokemonId, settlement]] : []));
  for (const actor of Object.values(session.actors)) {
    if (actor.binding.kind !== 'roster') continue;
    const id = actor.binding.pokemonId;
    check(context, !bound.has(id), path, 'Individual has more than one session actor.');
    check(context, !!context.state.roster[id] && !!entry.entrants[id], path, 'Permanent participant requires its roster record and entry baseline.');
    bound.set(id, actor);
    const actorSettlement = settledByActor.get(actor.actorId);
    const pokemonSettlement = settledByPokemon.get(id);
    if (actorSettlement) check(context, actorSettlement.pokemonId === id, path, 'Actor settlement names another permanent participant.');
    if (pokemonSettlement) {
      check(context, pokemonSettlement.actorId === actor.actorId, path, 'Permanent participant settlement names another actor.');
      check(context, actor.placement.kind !== 'map' && !session.teamOrder.includes(actor.actorId), path, 'Settled permanent participant remains active.');
    }
  }
  for (const settlement of session.participantSettlements) {
    const actor = session.actors[settlement.actorId];
    check(context, !session.teamOrder.includes(settlement.actorId), path, 'Settled participant remains active in team order.');
    check(context, actor?.placement.kind !== 'map', path, 'Settled participant remains on the live map.');
    if (settlement.pokemonId !== null) {
      const id = settlement.pokemonId;
      check(context, !!entry.entrants[id] && !!context.state.roster[id], path, 'Settled permanent participant has no baseline or roster.');
      check(context, !actor || actor.binding.kind === 'roster' && actor.binding.pokemonId === id, path, 'Settlement actor binding contradicts its permanent participant.');
      const participant = bound.get(id);
      check(context, !participant || participant.actorId === settlement.actorId, path, 'Settlement contradicts an extant permanent participant binding.');
    } else {
      check(context, actor?.binding.kind !== 'roster', path, 'Permanent participant cannot have an anonymous settlement.');
    }
  }
  for (const [id, entrant] of Object.entries(entry.entrants)) {
    checkMoves(context, entrant.pokemon.moves, path);
    checkMoves(context, entrant.projectedMoves, path);
    checkPp(context, entrant.projectedPp, entrant.projectedMoves, path);
    if (!settledByPokemon.has(entrant.pokemon.pokemonId)) {
      check(context, fingerprint(context.state.roster[id]) === fingerprint(entrant.pokemon), path, 'Unsettled entrant permanent record differs from entry baseline.');
      check(context, bound.has(id), path, 'Unsettled entrant has no session actor.');
    }
  }
  for (const id of entry.selectedPartyIds) check(context, !!entry.entrants[id], path, 'Selected entrant baseline is absent.');
  return Object.fromEntries(Object.entries(entry.entrants).map(([id, entrant]) => [id, entrant.pokemon]));
}
