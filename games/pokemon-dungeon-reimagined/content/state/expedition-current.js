import { DEFAULT_IQ } from './opening-facts.js';
import { SPAWN_SLEEP_CHANCES, eligibleEncounter } from './expedition-facts.js';
import { THUNDERWAVE as T } from '../authored/thunderwave.js';
import { OPENING_EXPEDITION as OPENING } from '../authored/expedition.js';
import { canEnter } from '../../src/domain/navigation/geometry.js';
import { diagnostics, bounded, sameForm, IQ_SKILLS, TACTICS } from './pokemon-rules.js';
import { fingerprint } from '../../src/domain/state/relations.js';

/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {import('../../src/contracts/campaign.js').Quantity} q */
const number = q => q.numerator / q.denominator;

/** Supported effective actor checks, independent of permanent/reset growth.
 * Entry projection, authored encounters and uncommon overrides retain explicit
 * owners rather than borrowing a permanent Pokémon's current resources.
 * @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Policies['actor']} */
export function createActorPolicy({ species, effects, dungeons }) {
  return (actor, session) => {
    const r = diagnostics(); const g = actor.growth;
    const profile = species.getProfile(actor.identity.speciesId, actor.identity.formId);
    r.check(profile.formId === actor.identity.formId, '/identity', 'Actor requires its explicit species form.');
    r.check(bounded(g.level, 1, 100) && bounded(g.iqPoints, 1, 999), '/growth', 'Actor level and IQ exceed supported source bounds.');
    r.check(number(g.totalExperience) >= 0 && number(g.totalExperience) <= 9999999, '/growth/totalExperience', 'Actor experience exceeds the source cap.');
    for (const key of /** @type {const} */ (['hp', 'attack', 'defense', 'specialAttack', 'specialDefense'])) {
      r.check(bounded(g.naturalStats[key], key === 'hp' ? 1 : 0, key === 'hp' ? 999 : 255) && bounded(g.permanentStatBonuses[key], 0, key === 'hp' ? 998 : 255) && g.naturalStats[key] + g.permanentStatBonuses[key] <= (key === 'hp' ? 999 : 255), '/growth', 'Effective stat components exceed source limits.');
    }
    const maxHp = g.naturalStats.hp + g.permanentStatBonuses.hp;
    r.check(bounded(actor.resources.hp, 0, maxHp), '/resources/hp', 'HP must fit the actor effective maximum.');
    r.check(number(actor.resources.belly) >= 0 && number(actor.resources.belly) <= number(actor.resources.maxBelly), '/resources/belly', 'Belly must lie within its effective maximum.');
    r.check(bounded(number(actor.resources.maxBelly), 100, 200) && Number.isInteger(number(actor.resources.hpRegenerationAccumulator)) && number(actor.resources.hpRegenerationAccumulator) >= 0 && number(actor.resources.hpRegenerationAccumulator) < 500, '/resources', 'Opening resources require ordinary maximum Belly and bounded regeneration remainder.');
    if (actor.placement.kind === 'map') r.check(actor.resources.hp > 0, '/placement', 'A fainted actor cannot remain a live map occupant.');
    for (const slot of actor.moves.slots) if (slot) {
      const move = effects.getMove(slot.moveId); const pp = actor.battleMoves.slots.find(row => row.moveSlotId === slot.moveSlotId);
      r.check(slot.ppCapacityBonus === 0 && bounded(slot.powerBoost, 0, move.numeric.ginsengCap), '/moves', 'Actor move boosts exceed their sourced limits.');
      r.check(pp && bounded(pp.currentPp, 0, move.numeric.pp), '/battleMoves', 'PP must fit the exact move maximum.');
    }
    const groups = new Set();
    for (const id of actor.enabledIqSkillIds) {
      const skill = IQ_SKILLS.find(row => row.id === id);
      r.check(skill && g.iqPoints >= skill.minimumIq && !groups.has(skill.group), '/enabledIqSkillIds', 'Actor IQ skills require thresholds and distinct exclusive groups.');
      if (skill) groups.add(skill.group);
    }
    r.check(TACTICS.some(row => row.id === actor.tacticId), '/tacticId', 'Actor tactic must have a supported source identity.');
    if (actor.binding.kind === 'roster') {
      const baseline = session.entry.entrants[actor.binding.pokemonId];
      r.check(baseline && actor.affiliation === 'team', '/binding', 'Roster actor requires its entry baseline and team affiliation.');
      if (baseline) {
        r.check(number(actor.gains.experience) === number(g.totalExperience) - number(baseline.projectedGrowth.totalExperience), '/gains', 'Run experience must equal the accumulated gain above entry.');
        const expected = species.getGrowthAtLevel(profile.id, g.level);
        r.check(fingerprint(g.naturalStats) === fingerprint(expected.stats) && fingerprint(g.permanentStatBonuses) === fingerprint(baseline.projectedGrowth.permanentStatBonuses), '/growth', 'Supported opening growth requires sourced level stats and unchanged permanent bonuses.');
      }
      if (baseline && actor.overrides.form === null) r.check(sameForm(actor.identity, baseline.pokemon.identity), '/identity', 'Roster actor identity must match its baseline absent a form override.');
    } else if (actor.binding.kind === 'wild' && ['tiny-woods', T.dungeonId].includes(session.dungeonId)) {
      const binding = actor.binding;
      r.check(binding.encounterId === `${session.dungeonId}-${actor.identity.speciesId}` && binding.spawnedAt.dungeonId === session.dungeonId && session.visitedFloorIds.includes(binding.spawnedAt.floorId), '/binding', 'Opening wild binding must join its generated encounter and visited floor.');
      const spawnFloor = dungeons.getFloorById(binding.spawnedAt.floorId);
      const encounter = dungeons.getEncounterPool(spawnFloor.encounterPoolId).rows.find(row => eligibleEncounter(row) && row.speciesId === actor.identity.speciesId && row.formId === actor.identity.formId && row.level === g.level);
      r.check(encounter && Object.hasOwn(SPAWN_SLEEP_CHANCES, actor.identity.speciesId) && actor.affiliation === 'hostile', '/identity', 'Wild identity and level must belong to its eligible source floor pool.');
      const learned = species.getLearnset(profile.id).levelUp.filter(row => row[0] !== undefined && row[0] <= g.level).map(row => species.identities.moves.find(move => move.originalId === row[1])?.id);
      r.check(learned.length <= 4 && fingerprint(actor.moves.slots.flatMap(slot => slot ? [slot.moveId] : [])) === fingerprint(learned) && actor.moves.links.length === 0 && actor.moves.setMoveSlotId === null && number(actor.gains.experience) === 0 && fingerprint(actor.enabledIqSkillIds) === fingerprint(DEFAULT_IQ), '/moves', 'Admitted wild moves/IQ require exact source initialization without links or accumulated growth.');
      const expected = species.getGrowthAtLevel(profile.id, g.level);
      r.check(number(g.totalExperience) === expected.cumulativeExperience && Object.values(g.permanentStatBonuses).every(value => value === 0), '/growth', 'Wild growth begins with exact cumulative experience and no permanent bonuses.');
      r.check(fingerprint(actor.growth.naturalStats) === fingerprint(expected.stats), '/growth', 'Wild base stats require exact species growth facts.');
    } else r.need(`P16:actor-binding:${actor.binding.kind}`);
    for (const [key, value] of Object.entries(actor.overrides)) if (value !== null) r.need(`P16:actor-override:${key}`);
    if (number(actor.gains.experience) < 0 || number(actor.gains.maxBelly) !== number(actor.resources.maxBelly) - 100 || actor.gains.iq !== 0 || Object.values(actor.gains.statItems).some(value => value !== 0) || actor.gains.moveBoosts.length) r.need('P16:actor-run-gains');
    return r.result();
  };
}

/** Neutral conditions and sourced numerical limits are supported. Nonempty
 * effects name their exact duration/program owner, never pass on identity alone.
 * @param {import('../species.js').SpeciesCatalog} species
 * @returns {Policies['conditions']} */
export function createConditionsPolicy(species) { return (actor, session) => {
  const r = diagnostics();
  for (const [group, condition] of Object.entries(actor.conditions)) if (condition) {
    if (group === 'sleep' && condition.statusId === 'sleep' && condition.duration.kind === 'indefinite' && condition.duration.policyId === 'native-spawn-sleep') {
      r.check(actor.binding.kind === 'wild' && condition.source.kind === 'actor' && condition.source.actor.actorId === actor.actorId && condition.source.actor.sessionId === session.sessionId && condition.payload.kind === 'none' && condition.periodicCountdown === null, '/conditions/sleep', 'Native spawn sleep requires its own wild actor source and indefinite timer.');
    } else if (condition.duration.policyId === 'native-opening-reaction' && condition.duration.kind === 'counter' && (group === 'burn' && condition.statusId === 'paralysis' || group === 'cringe' && condition.statusId === 'infatuated')) {
      r.check(actor.binding.kind === 'wild' && condition.source.kind === 'ability' && condition.source.actor.sessionId === session.sessionId && condition.source.actor.mapId === session.floor.mapId && condition.payload.kind === 'none' && condition.periodicCountdown === null && condition.duration.remaining >= 1 && condition.duration.remaining <= (condition.statusId === 'paralysis' ? 2 : 6), '/conditions', 'Opening reaction requires bounded native timer and wild recipient.');
      if (condition.source.kind === 'ability') {
        const source = session.actors[condition.source.actor.actorId];
        const expected = species.identities.abilities.find(row => row.name === (condition.statusId === 'paralysis' ? 'Static' : 'Cute Charm'));
        r.check(source?.affiliation === 'team' && source.binding.kind === 'roster' && expected?.id === condition.source.abilityId && species.getProfile(source.identity.speciesId, source.identity.formId).abilityIds.includes(expected.originalId), '/conditions/source', 'Opening reaction provenance must resolve to the actual team ability that inflicts it.');
      }
    } else if (condition.duration.policyId === 'native-cave-condition' && condition.duration.kind === 'counter') {
      const poison = group === 'burn' && condition.statusId === 'poisoned';
      const paralysis = group === 'burn' && condition.statusId === 'paralysis';
      const charm = group === 'cringe' && condition.statusId === 'infatuated';
      const sleep = group === 'sleep' && condition.statusId === 'sleep';
      r.check(poison || paralysis || charm || sleep, '/conditions', 'Only supported native cave condition groups are admitted.');
      r.check(condition.payload.kind === 'none' && (poison ? [127,128].includes(condition.duration.remaining) && condition.periodicCountdown !== null && bounded(condition.periodicCountdown, 0, 10) : condition.periodicCountdown === null && bounded(condition.duration.remaining, 1, paralysis ? 2 : 6)), '/conditions', 'Native cave duration and periodic countdown must retain their sourced ranges.');
      if (sleep) r.check(condition.source.kind === 'item' && condition.source.itemId === 'item-sleep-seed' && condition.source.user?.sessionId === session.sessionId && condition.source.user.actorId === actor.actorId, '/conditions/source', 'Sleep seed retains exact self-use provenance.');
      else if (condition.source.kind === 'ability') {
        const source = condition.source.actor, sourceActor = session.actors[condition.source.actor.actorId], expected = species.identities.abilities.find(row => row.name === (poison ? 'Poison Point' : paralysis ? 'Static' : 'Cute Charm'));
        r.check(source.sessionId === session.sessionId && source.mapId === session.floor.mapId && source.actorId !== actor.actorId && sourceActor && sameForm(sourceActor.identity, source.identity) && sourceActor.affiliation !== actor.affiliation && expected?.id === condition.source.abilityId && species.getProfile(source.identity.speciesId, source.identity.formId).abilityIds.includes(expected.originalId), '/conditions/source', 'Reaction retains a historical source actor with the actual inflicting ability.');
      } else r.check(false, '/conditions/source', 'Reaction must carry its ability source.');
    } else r.need(`P15:condition:${condition.statusId}:${condition.duration.policyId}`);
  }
  for (const [kind, condition] of Object.entries(actor.auxiliaryConditions)) if (condition) r.need(`P15:auxiliary:${kind}:${condition.duration.policyId}`);
  for (const stage of Object.values(actor.stages)) r.check(bounded(stage, 0, 20), '/stages', 'Native stat stages are indices zero through twenty.');
  for (const multiplier of Object.values(actor.multipliers)) r.check(multiplier.numerator >= 0 && Number.isInteger(number(multiplier) * 256) && number(multiplier) * 256 <= 2147483647, '/multipliers', 'Stat multipliers must be nonnegative representable native Q8.');
  const speed = actor.speed;
  r.check(speed.positiveTimers.length === 5 && speed.negativeTimers.length === 5 && [...speed.positiveTimers, ...speed.negativeTimers].every(value => bounded(value, 0, 127)), '/speed', 'Speed requires five native counters per sign.');
  r.check(bounded(speed.cachedStage, 0, 4) && bounded(speed.speedBoostCounter, 0, 249), '/speed', 'Cached speed and Speed Boost counter exceed source bounds.');
  const profile = species.getProfile(actor.identity.speciesId, actor.identity.formId);
  const ice = species.identities.types.find(type => type.name === 'Ice');
  const weatherSensitive = ice && profile.typeIds.includes(ice.originalId) && (session.floor.weather.natural.length || session.floor.weather.contributions.length);
  if (weatherSensitive || actor.overrides.types || actor.overrides.form || actor.identity.speciesId === 'pokemon-386' || (actor.identity.speciesId === 'pokemon-352' && actor.affiliation === 'hostile')) r.need('P15:effective-speed-weather-form-context');
  else {
    const computed = Math.max(0, Math.min(4, profile.baseMovementSpeed + speed.positiveTimers.filter(value => value !== 0).length - speed.negativeTimers.filter(value => value !== 0).length - Number(actor.conditions.burn?.statusId === 'paralysis')));
    r.check(speed.cachedStage === computed, '/speed/cachedStage', 'Cached speed must equal the supported source movement and timer projection.');
  }
  if (actor.memory.furyCutterCount || actor.memory.protectCount || actor.memory.stockpileCount) r.need('P15:actor-effect-memory');
  return r.result();
}; }


/** Ordinary generated floor admission reuses navigation's accepted map/terrain
 * and species mobility contracts. Narrative variant selection, special exits,
 * fixed encounters and nonempty effects retain their precise consumer owners.
 * @param {import('../../src/contracts/campaign.js').CampaignIdentityLookup} identities
 * @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Policies['floor']} */
export function createFloorPolicy(identities, { navigation, dungeons }) {
  return (floor, session, state, scope) => {
    const r = diagnostics(); const occupied = new Set();
    if (['tiny-woods', T.dungeonId].includes(session.dungeonId)) r.check(bounded(floor.arrivalCounter, 0, 35) && bounded(floor.windCounter, 0, 1000) && floor.turnCounter + floor.windCounter === 1000, '/counters', 'Opening arrival and wind counters must match the supported source cycles.');
    if (!navigation) { r.need('P11:navigation-catalog'); return r.result(); }
    r.check(navigation.definitionIds.includes(floor.definitionId) && floor.width === 56 && floor.height === 32, '/definitionId', 'Dungeon geometry must use a registered navigation definition and its 56 by 32 grid.');
    if (floor.location.kind !== 'exploration' && floor.location.kind !== 'boss') { r.need(`P22:floor-location:${floor.location.kind}`); return r.result(); }
    const joined = identities.permitsFloor(floor.location.address);
    if (!joined.ok) return joined;
    const factual = dungeons.getFloorById(floor.location.address.floorId);
    const generation = dungeons.getGeneration(factual.generationId);
    const fixed = generation.parameters.fixedRoomNumber;
    r.check(floor.definitionId === (fixed === 0 ? 'navigation-procedural' : `navigation-fixed-${fixed}`), '/definitionId', 'Map definition must match the addressed floor generation profile.');
    const section = dungeons.getSection(factual.sectionId);
    if (section.variants.length !== 1) r.need(`P22:floor-variant:${factual.variantId}`);
    if (fixed !== 0) r.need(`P22:fixed-floor-state:${fixed}`);
    const context = { catalog: navigation, tileset: generation.parameters.tileset, visibilityRange: generation.parameters.visibilityRange };
    const inventory = scope.kind === 'rescue-suspended' ? state.rescue.suspended?.itemArchive : state;
    for (const actor of Object.values(session.actors)) if (actor.placement.kind === 'map') {
      const position = actor.placement.position; const key = `${position.x},${position.z}`;
      r.check(!occupied.has(key), '/actors', 'Two actors cannot occupy one tile.'); occupied.add(key);
      const held = inventory?.containers[actor.heldContainerId]?.itemIds.map(id => inventory.items[id]);
      const navActor = { actorId: actor.actorId, identity: actor.identity, position,
        mobile: actor.conditions.invisible?.statusId === 'mobile',
        mobileScarf: held?.some(item => item?.template.itemId === 'item-mobile-scarf' && !item.template.sticky) ?? false,
        allTerrainHiker: actor.enabledIqSkillIds.some(id => id === 'iq-all-terrain-hiker'), superMobile: actor.enabledIqSkillIds.some(id => id === 'iq-super-mobile') };
      r.check(canEnter(navActor, floor, position, context), '/actors', 'Actor occupancy violates its sourced terrain mobility.');
    }
    for (const row of floor.tiles) for (const tile of row) navigation.terrain(tile.terrainId);
    for (const exit of Object.values(floor.exits)) {
      const tile = floor.tiles[exit.position.z]?.[exit.position.x];
      r.check(tile && navigation.terrain(tile.terrainId).kind === 'floor' && !navigation.terrain(tile.terrainId).impassable, '/exits', 'Exit anchor requires passable floor terrain.');
      if (exit.lock.kind !== 'open') r.need(`P22:exit-lock:${exit.lock.policyId}`);
      const destination = exit.destination;
      if (destination.kind === 'floor' && fixed === 0 && section.variants.length === 1) {
        const floors = section.variants[0]?.floorIds ?? []; const index = floors.indexOf(factual.id);
        r.check(destination.address.dungeonId === factual.dungeonId && destination.address.sectionId === factual.sectionId && destination.address.floorId === floors[index + 1], '/exits', 'Ordinary stairs must lead to the next floor in the selected source section.');
        const up = dungeons.getRestrictions(factual.restrictionId).fields.stairDirectionUp;
        r.check(exit.kind === (up ? 'stairs-up' : 'stairs-down'), '/exits', 'Stair direction must match the source dungeon restriction.');
      } else if (factual.id === 'tiny-woods-floor-03' && destination.kind === 'town') r.check(destination.mapDefinitionId === 'browser-opening-meadow' && destination.entryId === 'caterpie-clearing' && exit.kind === 'stairs-down', '/exits', 'Final Tiny Woods stairs lead to the authored Caterpie clearing gate.');
      else if (factual.id === T.floors[4] && destination.kind === 'town') r.check(destination.mapDefinitionId === T.clearing && destination.entryId === 'magnemite-rescue' && exit.kind === 'stairs-down', '/exits', 'Thunderwave ends after five exploration floors at the separate rescue scene.');
      else r.need(`P22:floor-exit:${factual.id}:${destination.kind}`);
    }
    if (fixed === 0) r.check(Object.keys(floor.exits).length === 1, '/exits', 'An ordinary procedural floor must retain its stair exit.');
    for (const trap of Object.values(floor.traps)) {
      const pool = dungeons.getTrapPool(factual.trapPoolId);
      r.check(trap.trapKindId === 'trap-wonder-tile' && pool.rows.some(row => row.trapId === trap.trapKindId && row.selectionThreshold > 0) && trap.activation === 'armed' && trap.affiliation === 'hostile' && trap.revealed && navigation.terrain(floor.tiles[trap.position.z]?.[trap.position.x]?.terrainId ?? '').kind === 'floor', '/traps', 'Only source-pooled, visible, reusable Wonder Tiles on floor terrain are supported.');
    }
    if (floor.weather.natural.length || generation.parameters.weather !== 0) r.need(`P15:natural-weather:${generation.parameters.weather}`);
    for (const weather of floor.weather.contributions) r.need(`P15:weather-duration:${weather.duration.policyId}`);
    if (floor.effects.mudSport || floor.effects.waterSport) r.need('P15:floor-sport-duration');
    if (floor.triggeredEventIds.length) r.need(`P22:floor-events:${factual.id}`);
    if (Object.values(session.shops).some(shop => shop.lifecycle === 'active')) r.need('P18:floor-shop-accounting');
    return r.result();
  };
}

/** Compare every roster projection at the standard unchanged-entry boundary;
 * reset/boost profiles and departure retention tables require their named owner.
 * @type {Policies['expeditionEntry']} */
export const validateExpeditionEntry = session => {
  const r = diagnostics();
  for (const baseline of Object.values(session.entry.entrants)) {
    const p = baseline.pokemon;
    for (const [a, b] of [[baseline.projectedGrowth, p.growth], [baseline.projectedMoves, p.moves], [baseline.projectedIqSkillIds, p.enabledIqSkillIds], [baseline.projectedTacticId, p.tacticId]]) {
      if (fingerprint(a) !== fingerprint(b)) r.need(`P16:entry-projection:${session.entry.entryPolicyId}`);
    }
    const hp = baseline.projectedGrowth.naturalStats.hp + baseline.projectedGrowth.permanentStatBonuses.hp;
    r.check(baseline.projectedResources.hp > 0 && baseline.projectedResources.hp <= hp, '/entry/entrants', 'Entry HP must fit projected growth.');
    if (baseline.projectedHiddenPower !== null) r.need('P16:entry-hidden-power');
  }
  const route = session.dungeonId === T.dungeonId ? T : OPENING;
  if (session.entry.entryPolicyId !== route.entryPolicy) r.need(`P16:entry-rule:${session.entry.entryPolicyId}`);
  if (session.entry.outcomePolicySetId !== route.outcomePolicy) r.need(`P16:outcome-policy-set:${session.entry.outcomePolicySetId}`);
  r.check(['tiny-woods', T.dungeonId].includes(session.dungeonId) && Object.keys(session.entry.entrants).length === 2 && session.entry.selectedPartyIds.length === 2, '/entry', 'Opening entry has exactly the original two non-reset entrants.');
  for (const baseline of Object.values(session.entry.entrants)) r.check(baseline.projectedResources.hp === baseline.projectedGrowth.naturalStats.hp + baseline.projectedGrowth.permanentStatBonuses.hp && number(baseline.projectedResources.belly) === 100 && number(baseline.projectedResources.maxBelly) === 100 && number(baseline.projectedResources.hpRegenerationAccumulator) === 0, '/entry', 'Entry projects full source resources with a zero regeneration remainder.');
  return r.result();
};
