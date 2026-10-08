import { FRIEND_AREA_FACTS } from '../../../content/authored/friend-area-facts.js';
import { FRIENDS, areaMapId, placeFriendsGround } from '../../../content/authored/friends.js';
import { DEFAULT_IQ } from '../../../content/state/opening-facts.js';
import { IQ_SKILLS, checkName, diagnostics } from '../../../content/state/pokemon-rules.js';
import { recordSpeciesSeen } from '../state/species-seen.js';
import { allocate, quantity, clone, blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {{kind:'buy-area';areaId:string}|{kind:'resident';pokemonId:import('../../contracts.js').PokemonId;operation:'join'|'standby'|'farewell'|'take'}|{kind:'give';pokemonId:import('../../contracts.js').PokemonId;itemInstanceId:import('../../contracts.js').ItemInstanceId}|{kind:'move-toggle';pokemonId:import('../../contracts.js').PokemonId;moveSlotId:import('../../contracts.js').MoveSlotId}|{kind:'iq-toggle';pokemonId:import('../../contracts.js').PokemonId;iqSkillId:import('../../contracts.js').IqSkillId}} ResidentOrder */
/** @param {Snapshot} state */
export function nearWigglytuff(state) {
  const hero = state.town.placements.find(row => row.reference.kind === 'pokemon' && row.reference.pokemonId === state.profile.heroId);
  return state.town.mapDefinitionId === 'browser-pokemon-square' && !!hero && Math.max(Math.abs(hero.position.x-FRIENDS.wigglytuff.x),Math.abs(hero.position.z-FRIENDS.wigglytuff.z)) <= 1;
}
/** @param {Snapshot} state */
export function nearbyResident(state) {
  const hero = state.town.placements.find(row => row.reference.kind === 'pokemon' && row.reference.pokemonId === state.profile.heroId); if (!hero) return null;
  for (const row of state.town.placements) {
    if (row.reference.kind !== 'pokemon' || row.reference.pokemonId === state.profile.heroId) continue;
    const pokemon = state.roster[row.reference.pokemonId];
    if (pokemon && state.town.mapDefinitionId === areaMapId(pokemon.friendAreaId) && Math.max(Math.abs(row.position.x-hero.position.x),Math.abs(row.position.z-hero.position.z)) <= 1) return pokemon;
  }
  return null;
}
/** Current native shop includes only unowned story-shop areas. Postgame shop,
 * Wonder Mail and legendary grants retain their separate source unlock kinds.
 * @param {Snapshot} state */
export function availableFriendAreas(state) {
  const main = state.progress.native.scenarios.MAIN;
  return FRIEND_AREA_FACTS.filter(row => row.id && !state.economy.ownedFriendAreaIds.some(id => id === row.id) && (row.unlock === 'shop_story' || main.chapter > 17 && row.unlock === 'shop_post_game'));
}
/** @param {Snapshot} state @param {Snapshot['roster'][string]} pokemon */
export function farewellItemRoute(state, pokemon) {
  const itemId = state.containers[pokemon.heldContainerId]?.itemIds[0], item = itemId ? state.items[itemId] : null;
  if (!item) return 'none';
  if ((state.containers[state.economy.toolbox]?.itemIds.length ?? 20) < 20) return 'bag';
  if (['item-poke', 'item-used-tm'].includes(item.template.itemId) || item.template.payload.kind === 'machine' && item.template.payload.state === 'used') return 'blocked';
  return (state.economy.storedItems.find(row => row.template.itemId === item.template.itemId)?.count ?? 0) + item.quantity <= 999 ? 'storage' : 'blocked';
}
/** @param {Snapshot} state @param {ResidentOrder} order @param {Catalogs} catalogs */
export function residentOrderProblem(state, order, catalogs) {
  const main = state.progress.native.scenarios.MAIN;
  if (!state.friends || state.mode !== 'town' || state.pendingScene || state.session || main.chapter < 5 || main.chapter === 5 && main.step < 4) return 'Finish the Friend Area introduction first.';
  if (order.kind === 'buy-area') {
    const area = availableFriendAreas(state).find(row => row.id === order.areaId);
    if (!nearWigglytuff(state) || !area) return 'That area is not available here.';
    return state.economy.carriedMoney >= area.price ? null : 'You need more carried Poké for this area.';
  }
  const pokemon = state.roster[order.pokemonId];
  if (!pokemon || nearbyResident(state)?.pokemonId !== pokemon.pokemonId) return 'Visit this Pokémon in its Friend Area.';
  const active = state.selectedPartyIds.includes(pokemon.pokemonId), bag = state.containers[state.economy.toolbox];
  if (order.kind === 'iq-toggle') return IQ_SKILLS.some(row => row.id === order.iqSkillId && row.minimumIq <= pokemon.growth.iqPoints) ? null : 'This skill requires more IQ.';
  if (order.kind === 'move-toggle') return pokemon.moves.slots.some(row => row?.moveSlotId === order.moveSlotId) ? null : 'That move is no longer learned.';
  if (order.kind === 'give') return bag?.itemIds.includes(order.itemInstanceId) && state.items[order.itemInstanceId] ? null : 'Choose a complete toolbox slot.';
  if (order.operation === 'take') return !state.containers[pokemon.heldContainerId]?.itemIds.length ? 'This Pokémon is not holding an item.' : !bag || bag.itemIds.length >= 20 ? 'Taking an item requires a free toolbox slot.' : null;
  if (order.operation === 'join') {
    if (active) return 'This Pokémon is already on the team.';
    const size = state.selectedPartyIds.reduce((sum, id) => { const p = state.roster[id]; return sum + (p ? catalogs.species.getProfile(p.identity.speciesId, p.identity.formId).bodySize : 0); }, catalogs.species.getProfile(pokemon.identity.speciesId, pokemon.identity.formId).bodySize);
    return state.selectedPartyIds.length >= 4 || size > 6 ? 'The team can have four members and a total body size of six.' : null;
  }
  if (pokemon.pokemonId === state.profile.heroId || pokemon.origin.kind === 'starter') return 'The original hero and partner stay with this team.';
  if (order.operation === 'standby') return active ? null : 'This Pokémon is already resting here.';
  if (active) return 'Choose Standby before saying farewell.';
  return farewellItemRoute(state, pokemon) === 'blocked' ? 'Make room for the held item in your toolbox or storage first.' : null;
}
/** Atomic exact-quantity held swap; bag fullness is checked after removing the
 * selected lot, so the replaced held lot always fits the freed position.
 * @param {Context} context @param {ResidentOrder} order @param {Catalogs} catalogs */
export function applyResidentOrder(context, order, catalogs) {
  const state = context.state;
  if (residentOrderProblem(state, order, catalogs)) return false;
  if (order.kind === 'buy-area') {
    const area = availableFriendAreas(state).find(row => row.id === order.areaId); if (!area?.id || !state.friends) return false;
    state.economy.carriedMoney -= area.price;
    const areaId = /** @type {import('../../contracts/campaign.js').FriendAreaId} */ (area.id);
    state.economy.ownedFriendAreaIds.push(areaId); state.friends.purchases.push({ areaId, price: area.price, revision: state.revision + 1 }); return true;
  }
  const pokemon = state.roster[order.pokemonId], bag = state.containers[state.economy.toolbox];
  if (!pokemon || !bag) return false;
  const held = state.containers[pokemon.heldContainerId]; if (!held) return false;
  if (order.kind === 'iq-toggle') {
    const skill = IQ_SKILLS.find(row => row.id === order.iqSkillId); if (!skill) return false;
    const enabled = pokemon.enabledIqSkillIds.includes(skill.id);
    pokemon.enabledIqSkillIds = IQ_SKILLS.filter(row => row.id === skill.id ? !enabled : pokemon.enabledIqSkillIds.includes(row.id) && (enabled || row.group !== skill.group)).map(row => row.id);
    return true;
  }
  if (order.kind === 'move-toggle') { const slot = pokemon.moves.slots.find(row => row?.moveSlotId === order.moveSlotId); if (!slot) return false; slot.enabled = !slot.enabled; return true; }
  if (order.kind === 'give') { bag.itemIds.splice(bag.itemIds.indexOf(order.itemInstanceId), 1); bag.itemIds.push(...held.itemIds); held.itemIds = [order.itemInstanceId]; }
  else if (order.operation === 'take') { bag.itemIds.push(...held.itemIds); held.itemIds = []; }
  else if (order.operation === 'join') state.selectedPartyIds.push(pokemon.pokemonId);
  else if (order.operation === 'standby') state.selectedPartyIds.splice(state.selectedPartyIds.indexOf(pokemon.pokemonId), 1);
  else {
    const route = farewellItemRoute(state, pokemon), id = held.itemIds[0], item = id ? state.items[id] : null;
    if (route === 'bag') bag.itemIds.push(...held.itemIds);
    else if (route === 'storage' && item) {
      const stored = state.economy.storedItems.find(row => row.template.itemId === item.template.itemId);
      if (stored) stored.count += item.quantity;
      else state.economy.storedItems.push({ template: { ...clone(item.template), sticky: false }, count: item.quantity });
      delete state.items[item.itemInstanceId];
    }
    delete state.containers[pokemon.heldContainerId]; delete state.roster[pokemon.pokemonId];
  }
  const hero = state.town.placements.find(row => row.reference.kind === 'pokemon' && row.reference.pokemonId === state.profile.heroId);
  placeFriendsGround(state, state.town.mapDefinitionId);
  const moved = state.town.placements.find(row => row.reference.kind === 'pokemon' && row.reference.pokemonId === state.profile.heroId);
  if (hero && moved) { moved.position = hero.position; moved.facing = hero.facing; }
  return true;
}
/** Natural level6 is statically equal to native story preset38/20/18/20/18,
 * EXP4560. Preserve native ordered moves, origin70 via the exact grant identity,
 * fresh slot/container IDs and unboosted PP semantics; do not auto-join team.
 * @param {Context} context @param {Catalogs} catalogs @param {string|null} name */
export function enrollStoryMagnemite(context, catalogs, name) {
  const state = context.state, friends = state.friends;
  if (!friends || friends.magnemiteId || state.progress.appliedGrants.some(row => row.grantId === FRIENDS.grant)) return blocked('story-magnemite-replay');
  const identity = { speciesId: /** @type {import('../../contracts.js').SpeciesId} */ ('pokemon-081'), formId: null };
  const profile = catalogs.species.getProfile(identity.speciesId, null), growth = catalogs.species.getGrowthAtLevel(profile.id, 6), nickname = name ?? catalogs.species.getSpecies(identity.speciesId).name;
  const report = diagnostics(); checkName(nickname, 'Magnemite', report, '/nickname'); if (!report.result().ok) return false;
  // Native operation 0x19 follows both naming branches and owns the area
  // and resident together. Invalid nicknames cannot partially grant the area.
  const areaId = /** @type {import('../../contracts.js').FriendAreaId} */ (profile.friendAreaId);
  if (!state.economy.ownedFriendAreaIds.includes(areaId)) state.economy.ownedFriendAreaIds.push(areaId);
  state.progress.appliedGrants.push({ grantId: FRIENDS.areaGrant, revision: state.revision + 1, day: state.town.day });
  const pokemonId = allocate(state, 'pokemon'), heldContainerId = allocate(state, 'container');
  state.containers[heldContainerId] = { containerId: heldContainerId, owner: { kind: 'pokemon-held', pokemonId }, itemIds: [] };
  state.roster[pokemonId] = { pokemonId, identity, nickname, growth: { level: 6, totalExperience: quantity(growth.cumulativeExperience), naturalStats: { ...growth.stats }, permanentStatBonuses: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0 }, iqPoints: 1 },
    moves: { slots: /** @type {import('../../contracts/campaign.js').FourMoves} */ ([...FRIENDS.magnemiteMoves.map(moveId => ({ moveSlotId: allocate(state, 'move-slot'), moveId: /** @type {import('../../contracts.js').MoveId} */ (moveId), enabled: true, powerBoost: 0, ppCapacityBonus: 0 })), null]), links: [], setMoveSlotId: null },
    enabledIqSkillIds: [...DEFAULT_IQ], tacticId: /** @type {import('../../contracts/campaign.js').TacticId} */ ('tactic-lets-go-together'), friendAreaId: /** @type {import('../../contracts.js').FriendAreaId} */ (profile.friendAreaId), heldContainerId,
    origin: { kind: 'scripted', grantId: FRIENDS.grant, metLevel: 6 }, evolutionHistory: [] };
  friends.magnemiteId = pokemonId; friends.nicknamePrompt = null;
  if (!state.progress.recruitedHistory.some(row => row.speciesId === identity.speciesId && row.formId === null)) state.progress.recruitedHistory.push(identity);
  recordSpeciesSeen(state, identity);
  state.progress.appliedGrants.push({ grantId: FRIENDS.grant, revision: state.revision + 1, day: state.town.day });
  return true;
}
