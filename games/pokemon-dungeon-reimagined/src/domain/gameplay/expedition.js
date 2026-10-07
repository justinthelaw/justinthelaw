import { STEEL } from '../../../content/authored/mt-steel.js';
import { STEEL_SLEEP_CHANCES, STEEL_FLOOR_ITEMS } from '../../../content/state/steel-facts.js';
import { steelReady, enterSteelSummit, afterSteelSettlement } from './steel.js';
import { workReady } from './work.js';
import { enterJobObjectives, floorJobClient, leaveJobFloor, settleJobObjectives } from './job-objectives.js';
import { refreshGround } from './ground-refresh.js';
import { TOWN, placeInTown } from '../../../content/authored/town.js';
import { SPAWN_SLEEP_CHANCES, eligibleEncounter } from '../../../content/state/expedition-facts.js';
import { THUNDERWAVE as T } from '../../../content/authored/thunderwave.js';
import { MORNING, placeInside } from '../../../content/authored/first-morning.js';
import { TEAM, placeAtBase } from '../../../content/authored/team-formation.js';
import { resetFloorConditions } from './conditions.js';
import { USABLE_ITEMS } from './items.js';
import { applyExperience } from './growth.js';
import { generateFloor, materializeFloor } from '../generation.js';
import { createScheduler } from '../turns.js';
import { INITIAL_SCHEDULE_POLICY_ID } from '../../../content/state/expedition.js';
import { OPENING_EXPEDITION as OPENING } from '../../../content/authored/expedition.js';
import { decodePokeQuantity } from '../../../content/state/items.js';
import { createActor } from './actors.js';
import { allocate, blocked, clone, draw, quantity } from './support.js';
import { requestScene } from './scenes.js';

/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @param {Catalogs} catalogs @param {import('../../contracts/campaign.js').CampaignSnapshot} state @param {string} [dungeonId] */
export function admission(catalogs, state, dungeonId = 'tiny-woods') {
  const steel = dungeonId === STEEL.dungeonId;
  const ordinary = !steel && workReady(state);
  if (steel && !steelReady(state)) return 'steel-prerequisite';
  if (ordinary && state.town.mapDefinitionId !== TEAM.map) return 'departure-at-base';
  if (state.session || state.mode !== 'town' || !ordinary && state.progress.clears[dungeonId]) return 'expedition-unavailable';
  const cave = dungeonId === T.dungeonId;
  if (!ordinary && !steel && (cave ? ![MORNING.story, T.story].includes(state.progress.storyNodeId) || !state.progress.appliedGrants.some(row => row.grantId === MORNING.grants[6]) : !['browser-story-awakening', OPENING.storyNode].includes(state.progress.storyNodeId))) return 'expedition-prerequisite';
  if (state.selectedPartyIds.length !== 2 || !ordinary && !steel && Object.values(state.items).some(item => !(cave ? USABLE_ITEMS : ['item-oran-berry', 'item-pecha-berry']).includes(item.template.itemId))) return 'opening-party-inventory';
  // Abilities needing post-hit reactions cannot be silently ignored.
  const reactive = ['Poison Point', 'Effect Spore', 'Synchronize', 'Color Change'];
  for (const id of state.selectedPartyIds) {
    const pokemon = state.roster[id]; if (!pokemon) return 'opening-party';
    const p = catalogs.species.getProfile(pokemon.identity.speciesId, pokemon.identity.formId);
    if (reactive.some(name => { const ability = catalogs.species.identities.abilities.find(row => row.name === name); return ability && p.abilityIds.includes(ability.originalId); })) return 'reaction-ability-not-supported';
  }
  return null;
}
/** @param {Context} context @param {Catalogs} catalogs @param {import('../../../content/authored/opening.js').AuthoredOpening} authored @param {string} [dungeonId] @param {boolean} [ordinary] */
export function enterOpening(context, catalogs, authored, dungeonId = 'tiny-woods', ordinary = false) {
  const state = context.state, cave = dungeonId === T.dungeonId, steel = dungeonId === STEEL.dungeonId;
  if (cave || steel) placeAtBase(state);
  const route = steel ? { ...STEEL, storyNode: STEEL.story } : cave ? { ...T, storyNode: T.story, rescueScene: T.rescue, returnNode: T.returned } : OPENING;
  if (!ordinary && !cave && !steel && !state.progress.milestones[OPENING.boostGuard]) {
    for (const id of state.selectedPartyIds) {
      const pokemon = state.roster[id]; if (!pokemon) return blocked('opening-party');
      const start = catalogs.onboarding.getStartingProfile(pokemon.identity.speciesId).firstPlayable;
      pokemon.growth.level = start.level; pokemon.growth.totalExperience = quantity(start.cumulativeExp); pokemon.growth.naturalStats = { ...start.stats };
      for (let i = 0; i < start.moves.length; i++) {
        const move = start.moves[i]; if (!move) continue;
        const old = pokemon.moves.slots[i];
        pokemon.moves.slots[i] = { moveSlotId: old?.moveSlotId ?? allocate(state, 'move-slot'), moveId: /** @type {import('../../contracts.js').MoveId} */ (move.moveId), enabled: true, powerBoost: 0, ppCapacityBonus: 0 };
      }
    }
    state.progress.milestones[OPENING.boostGuard] = { milestoneId: OPENING.boostGuard, acquiredRevision: state.revision + 1, acquiredDay: state.town.day };
  }
  const itemArchive = clone({ items: state.items, containers: state.containers });
  const home = state.containers[state.economy.toolbox]; if (!home) return blocked('entry-toolbox');
  const sessionId = allocate(state, 'session'); const inventory = allocate(state, 'container');
  state.containers[inventory] = { containerId: inventory, owner: { kind: 'session-toolbox', sessionId }, itemIds: [...home.itemIds] }; home.itemIds = [];
  const blueprint = buildFloor(state, catalogs, `${dungeonId}-floor-01`, authored, ordinary);
  /** @type {import('../../contracts/campaign.js').ExpeditionState['actors']} */ const actors = {};
  /** @type {import('../../contracts/campaign.js').ExpeditionEntryBaseline['entrants']} */ const entrants = {};
  for (let i = 0; i < state.selectedPartyIds.length; i++) {
    const id = state.selectedPartyIds[i]; const pokemon = id ? state.roster[id] : null; const position = blueprint.partyPositions[i];
    if (!pokemon || !position) return blocked('party-placement');
    const actor = createActor(state, catalogs, { kind: 'roster', pokemonId: pokemon.pokemonId }, pokemon.identity, pokemon.growth.level, blueprint.floor.mapId, position, sessionId);
    actors[actor.actorId] = actor;
    entrants[pokemon.pokemonId] = { pokemon: clone(pokemon), projectedGrowth: clone(actor.growth), projectedMoves: clone(actor.moves), projectedIqSkillIds: [...actor.enabledIqSkillIds], projectedResources: clone(actor.resources), projectedPp: clone(actor.battleMoves), projectedTacticId: actor.tacticId, projectedHiddenPower: null };
  }
  const teamOrder = Object.values(actors).map(actor => actor.actorId); const leaderActorId = teamOrder[0]; if (!leaderActorId) return blocked('party-leader');
  const money = state.economy.carriedMoney; state.economy.carriedMoney = 0;
  state.moveState = null;
  state.session = { sessionId, dungeonId: /** @type {import('../../contracts.js').DungeonId} */ (dungeonId), purpose: ordinary ? { kind: 'ordinary' } : { kind: 'story', storyNodeId: route.storyNode }, status: 'active', leaderActorId, teamOrder, actors,
    floor: /** @type {import('../../contracts/campaign.js').FloorState} */ (clone(blueprint.floor)), inventory, carriedMoney: money, shops: {}, objectives: [],
    scheduler: createScheduler(INITIAL_SCHEDULE_POLICY_ID, [leaderActorId, teamOrder[1] ?? null, null, null], Array(16).fill(null)),
    entry: { sessionId, entryRevision: state.revision + 1, entryPolicyId: route.entryPolicy, outcomePolicySetId: route.outcomePolicy, entrants, selectedPartyIds: [...state.selectedPartyIds], carriedMoney: money, toolboxContainerId: state.economy.toolbox, itemArchive },
    visitedFloorIds: [/** @type {import('../../contracts/campaign.js').FloorId} */ (`${dungeonId}-floor-01`)], completedEventIds: [], participantSettlements: [] };
  if (ordinary) enterJobObjectives(state, state.session);
  else { state.progress.storyNodeId = route.storyNode; if (cave) state.progress.native.scenarios.MAIN = { chapter: 3, step: 6 }; }
  state.mode = 'dungeon'; state.progress.statistics.expeditions++;
  populate(context, catalogs, blueprint.placements);
  context.emit({ type: 'floorChanged', mapId: blueprint.floor.mapId });
}
/** @param {import('../../contracts/campaign.js').CampaignState} state @param {Catalogs} catalogs @param {string} floorId @param {import('../../../content/authored/opening.js').AuthoredOpening} authored @param {boolean} [ordinary] */
function buildFloor(state, catalogs, floorId, authored, ordinary = state.session?.purpose.kind === 'ordinary') {
  const factual = catalogs.dungeons.getFloorById(floorId); const generation = catalogs.dungeons.getGeneration(factual.generationId);
  const client = ordinary ? floorJobClient(state, floorId) : null;
  const summit = factual.dungeonId === STEEL.dungeonId && generation.parameters.fixedRoomNumber === 1;
  const fixedActors = state.steel?.bossDefeated ? [] : [{ roleId: STEEL.bossRole, speciesId: 'pokemon-227', formId: null, level: 10 }, { roleId: STEEL.clientRole, speciesId: 'pokemon-050', formId: null, level: 5 }];
  const result = generateFloor({ profile: factual, generation, streams: { layout: state.random.layout, encountersItems: state.random.encountersItems }, context: {
    floorType: summit ? 'fixed' : 'normal', missionSuppressesHouse: !!client, missionAddsEnemy: !!client, ...(client ? { missionClient: { roleId: client.jobId, speciesId: client.identity.speciesId, formId: client.identity.formId, level: 1 } } : {}), canChangeLeader: false, teamSize: 2, enemyLimit: 16, required: [], fixedEncounter: summit ? { callbackId: 'steel-skarmory-faint', actors: fixedActors, isolatedRoleIds: [STEEL.clientRole], exit: 'none' } : null, receivedTeam: null, specialPopulation: null, ownedRewardItemIds: [],
  } }, { navigation: catalogs.navigation, dungeons: catalogs.dungeons, isEncounterEligible: eligibleEncounter });
  if (result.kind !== 'ready') return blocked('floor-generation');
  const section = catalogs.dungeons.getSection(factual.sectionId); const floors = section.variants[0]?.floorIds ?? []; const next = floors[floors.indexOf(floorId) + 1];
  const address = /** @type {import('../../contracts/campaign.js').FloorAddress} */ ({ dungeonId: factual.dungeonId, sectionId: factual.sectionId, floorId });
  const materialized = materializeFloor(result.blueprint, { sequence: state.idSequence, existingIds: new Set(), location: summit ? { kind: 'boss', encounterId: STEEL.bossRole, address } : { kind: 'exploration', address }, definitionId: /** @type {import('../../contracts/campaign.js').MapDefinitionId} */ (summit ? 'navigation-fixed-1' : 'navigation-procedural'),
    weather: { natural: [], contributions: [], damageCounter: 0 }, windCounter: catalogs.dungeons.getRestrictions(factual.restrictionId).fields.turnLimit,
    exit: summit ? null : { kind: factual.dungeonId === STEEL.dungeonId ? 'stairs-up' : 'stairs-down', lock: { kind: 'open' }, destination: next ? { kind: 'floor', address: /** @type {import('../../contracts/campaign.js').FloorAddress} */ ({ dungeonId: factual.dungeonId, sectionId: factual.sectionId, floorId: next }), entryId: 'stairs' } : ordinary ? { kind: 'town', mapDefinitionId: TOWN.post, entryId: 'ordinary-return' } : { kind: 'town', mapDefinitionId: factual.dungeonId === T.dungeonId ? T.clearing : authored.town.mapDefinitionId, entryId: factual.dungeonId === T.dungeonId ? 'magnemite-rescue' : 'caterpie-clearing' } }, trapKindIds: new Set(['trap-wonder-tile']) }, catalogs.navigation);
  // Native Wonder Tiles start visible; they are not hidden ordinary traps.
  const floor = /** @type {import('../../contracts/campaign.js').FloorState} */ (clone(materialized.floor));
  for (const trap of Object.values(floor.traps)) if (trap.trapKindId === 'trap-wonder-tile') trap.revealed = true;
  state.idSequence = materialized.sequence; state.random.layout = result.streams.layout; state.random.encountersItems = result.streams.encountersItems;
  return { ...materialized, floor };
}
/** @param {Context} context @param {Catalogs} catalogs @param {readonly import('../generation/types.js').ReadonlyData<import('../generation/types.js').Placement>[]} placements */
function populate(context, catalogs, placements) {
  const state = context.state; const session = state.session; if (!session || !('address' in session.floor.location)) return blocked('population-session');
  for (const placement of placements) {
    if (placement.kind === 'enemy') {
      const identity = /** @type {import('../../contracts/campaign.js').SpeciesForm} */ ({ speciesId: placement.encounter.speciesId, formId: placement.encounter.formId });
      const client = placement.route === 'mission-client' ? floorJobClient(state, session.floor.location.address.floorId) : null;
      if (placement.route === 'mission-client' && (!client || placement.encounter.roleId !== client.jobId)) return blocked('job-client-placement');
      /** @type {import('../../contracts/campaign.js').ActorBinding} */
      const binding = placement.route === 'fixed' ? placement.encounter.roleId === STEEL.bossRole ? { kind: 'boss', encounterId: STEEL.bossRole } : { kind: 'guest', storyActorId: STEEL.clientRole } : client ? /** @type {const} */ ({ kind: 'job-client', jobId: client.jobId }) : /** @type {const} */ ({ kind: 'wild', encounterId: /** @type {import('../../contracts/campaign.js').EncounterId} */ (`${session.dungeonId}-${identity.speciesId}`), spawnedAt: { ...session.floor.location.address } });
      const actor = createActor(state, catalogs, binding, identity, placement.encounter.level, session.floor.mapId, placement.position, session.sessionId);
      const index = session.scheduler.wildSlots.indexOf(null); if (index < 0) return blocked('wild-capacity');
      session.actors[actor.actorId] = actor; session.scheduler.wildSlots[index] = actor.actorId;
      if (client) {
        const objective = session.objectives.find(row => row.jobId === client.jobId); if (!objective) return blocked('job-client-objective');
        objective.state = { kind: 'actor-target', actorId: actor.actorId, complete: false }; continue;
      }
      if (placement.route === 'fixed') continue;
      const chance = SPAWN_SLEEP_CHANCES[identity.speciesId] ?? STEEL_SLEEP_CHANCES[identity.speciesId];
      if (chance === undefined) return blocked('spawn-sleep-chance');
      if (draw(state, 100, 'encountersItems') < chance) actor.conditions.sleep = { statusId: 'sleep', source: { kind: 'actor', actor: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: actor.actorId, identity: actor.identity }, moveId: null }, duration: { kind: 'indefinite', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-spawn-sleep') }, periodicCountdown: null, payload: { kind: 'none' } };
    } else if (placement.kind === 'item') {
      if (!(session.dungeonId === STEEL.dungeonId ? STEEL_FLOOR_ITEMS : ['item-poke', ...USABLE_ITEMS]).includes(placement.itemId)) return blocked('floor-item-construction');
      let amount = placement.itemId === 'item-gravelerock' ? 3 + draw(state, 2, 'encountersItems') : 1;
      if (placement.itemId === 'item-poke') { let index = draw(state, 100, 'encountersItems'); for (let i = 0; i < 200 && decodePokeQuantity(index) > placement.quantityContext.moneyUpperBound * 40; i++) index = Math.trunc(index / 2); amount = decodePokeQuantity(index); }
      const itemInstanceId = allocate(state, 'item-instance'); const containerId = allocate(state, 'container');
      state.items[itemInstanceId] = { itemInstanceId, template: { itemId: /** @type {import('../../contracts.js').ItemId} */ (placement.itemId), sticky: placement.sticky, payload: { kind: 'none' } }, quantity: amount, shopLotId: null };
      state.containers[containerId] = { containerId, owner: { kind: 'floor', sessionId: session.sessionId, mapId: session.floor.mapId, position: { ...placement.position }, placement: 'ground' }, itemIds: [itemInstanceId] };
    } else return blocked('floor-population');
  }
}
/** @param {Context} context @param {Catalogs} catalogs @param {import('../../../content/authored/opening.js').AuthoredOpening} authored @param {import('../../contracts/campaign.js').ExitId} exitId */
export function takeStairs(context, catalogs, authored, exitId) {
  const session = context.state.session; const exit = session?.floor.exits[exitId]; if (!session || !exit) return blocked('exit-unavailable');
  if (exit.destination.kind === 'town') {
    if (session.purpose.kind === 'ordinary') { settleExpedition(context, 'success', catalogs); return; }
    const script = authored.scenes.find(row => row.id === (session.dungeonId === T.dungeonId ? T.rescue : OPENING.rescueScene)); if (!script) return blocked('rescue-scene');
    requestScene(context, authored, script); const scene = context.state.pendingScene; if (!scene) return blocked('rescue-scene');
    session.scheduler = { ...session.scheduler, kind: 'scene-paused', sceneInstanceId: scene.sceneInstanceId };
    session.scheduler.continuation.terminal = 'dungeon-exit'; return;
  }
  if (exit.destination.kind !== 'floor') return blocked('exit-destination');
  const next = buildFloor(context.state, catalogs, exit.destination.address.floorId, authored);
  leaveJobFloor(session);
  for (const [id, actor] of Object.entries(session.actors)) if (actor.affiliation !== 'team') { delete context.state.containers[actor.heldContainerId]; delete session.actors[id]; }
  for (const [id, container] of Object.entries(context.state.containers)) if (container.owner.kind === 'floor') { for (const item of container.itemIds) delete context.state.items[item]; delete context.state.containers[id]; }
  context.state.moveState = null;
  session.floor = /** @type {import('../../contracts/campaign.js').FloorState} */ (clone(next.floor)); session.visitedFloorIds.push(exit.destination.address.floorId);
  session.teamOrder.forEach((id, i) => {
    const actor = session.actors[id], pos = next.partyPositions[i]; if (!actor || !pos) return blocked('party-placement');
    actor.placement = { kind: 'map', mapId: session.floor.mapId, position: { ...pos } };
    actor.speed.movementPending = false; actor.speed.endEffectsPending = false; actor.speed.deferred = false;
    actor.resources.hpRegenerationAccumulator = quantity(0);
    actor.memory.lastUsedMove = null; actor.memory.lastIncomingMove = null;
    actor.memory.lastDamage = null; actor.memory.experienceContributors = [];
    resetFloorConditions(actor, catalogs);
  });
  session.scheduler = createScheduler(INITIAL_SCHEDULE_POLICY_ID, [session.teamOrder[0] ?? null, session.teamOrder[1] ?? null, null, null], Array(16).fill(null));
  populate(context, catalogs, next.placements);
  if (session.dungeonId === STEEL.dungeonId && session.floor.location.kind === 'boss') enterSteelSummit(context, authored);
  context.emit({ type: 'floorChanged', mapId: session.floor.mapId });
}

/** Source-qualified non-reset retention; all participant, floor and inventory
 * ownership changes commit together in the dispatch transaction.
 * @param {Context} context @param {'success'|'fainting'|'wind-expulsion'|'give-up'} outcome @param {Catalogs} catalogs @param {import('../../../content/authored/opening.js').AuthoredOpening} [authored] */
export function settleExpedition(context, outcome, catalogs, authored) {
  const state = context.state; const session = state.session; if (!session) return blocked('settlement-session');
  for (const actor of Object.values(session.actors)) if (actor.binding.kind === 'roster') {
    applyExperience(context, actor, catalogs);
    const pokemon = state.roster[actor.binding.pokemonId]; if (!pokemon) return blocked('settlement-participant');
    const held = state.containers[actor.heldContainerId]; const homeHeld = state.containers[pokemon.heldContainerId];
    if (!held || !homeHeld || homeHeld.itemIds.length) return blocked('settlement-held-container');
    if (outcome === 'success') {
      homeHeld.itemIds = [...held.itemIds];
      // Native retained held items become BulkItem (identity/quantity only).
      if (session.purpose.kind === 'ordinary' || session.dungeonId === STEEL.dungeonId) for (const id of homeHeld.itemIds) {
        const item = state.items[id]; if (!item) return blocked('settlement-held-item');
        item.template.sticky = false;
      }
    }
    else for (const id of held.itemIds) delete state.items[id];
    held.itemIds = [];
    pokemon.growth = clone(actor.growth); pokemon.moves = clone(actor.moves); pokemon.enabledIqSkillIds = [...actor.enabledIqSkillIds]; pokemon.tacticId = actor.tacticId;
  }
  const bag = state.containers[session.inventory]; const home = state.containers[state.economy.toolbox]; if (!bag || !home) return blocked('settlement-inventory');
  for (const id of bag.itemIds) { if (outcome === 'success' || draw(state, 100, 'encountersItems') >= 50) home.itemIds.push(id); else delete state.items[id]; }
  for (const [id, container] of Object.entries(state.containers)) if ('sessionId' in container.owner && container.owner.sessionId === session.sessionId) {
    if (container.containerId !== session.inventory) for (const item of container.itemIds) delete state.items[item];
    delete state.containers[id];
  }
  state.economy.carriedMoney = outcome === 'success' ? session.carriedMoney : 0;
  if (session.purpose.kind === 'ordinary') {
    const work = state.earlyWork; if (!work) return blocked('ordinary-work-owner');
    // Native ground refresh occurs while completed accepted slots still occupy
    // their floors; station cleanup later frees them for morning mail.
    // Failure cleanup happens earlier in main_loops, before ground refresh.
    const failedJobs = outcome === 'success' ? [] : settleJobObjectives(state, session, false);
    refreshGround(state, catalogs);
    const jobIds = outcome === 'success' ? settleJobObjectives(state, session, true) : failedJobs;
    work.returned = { sessionId: session.sessionId, dungeonId: session.dungeonId, outcome, jobIds, cursor: 0 };
    placeInTown(state, outcome === 'success' ? TOWN.post : MORNING.interior);
  } else if (outcome === 'success' && session.dungeonId !== STEEL.dungeonId) {
    state.progress.clears[session.dungeonId] = { dungeonId: session.dungeonId, firstClearRevision: state.revision + 1, lastClearRevision: state.revision + 1, firstClearDay: state.town.day, lastClearDay: state.town.day, clearCount: 1, reachedFloorIds: [...session.visitedFloorIds] };
    state.progress.statistics.rescuesCompleted++; state.progress.storyNodeId = session.dungeonId === T.dungeonId ? T.returned : OPENING.returnNode;
  }
  if (session.purpose.kind !== 'ordinary' && session.dungeonId === T.dungeonId) { if (outcome === 'success') placeAtBase(state); else placeInside(state); }
  state.moveState = null;
  state.session = null; state.pendingScene = null; state.mode = 'town'; context.emit({ type: 'expeditionEnded', outcome });
  if (session.dungeonId === STEEL.dungeonId) { refreshGround(state, catalogs); if (!authored) return blocked('steel-return-script'); afterSteelSettlement(context, outcome === 'success', authored); }
}
