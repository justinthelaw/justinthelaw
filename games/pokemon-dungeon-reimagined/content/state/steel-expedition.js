import { finalizeGeometry } from '../../src/domain/generation/support.js';
import { STEEL } from '../authored/mt-steel.js';
import { OPENING_EXPEDITION } from '../authored/expedition.js';
import { WILD_ACTIVE_IQ } from '../ai-facts.js';
import { DEFAULT_IQ } from './opening-facts.js';
import { eligibleEncounter } from './expedition-facts.js';
import { STEEL_SLEEP_CHANCES } from './steel-facts.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { steelAppend, steelSame } from './steel-progress.js';
import { buildSteelArena } from '../../src/domain/generation/steel-arena.js';
import { createScheduler } from '../../src/domain/turns.js';
import { INITIAL_SCHEDULE_POLICY_ID } from './expedition.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Pick<Policies,'actor'|'floor'|'scheduler'|'expeditionEntry'>} */
export function steelExpeditionPolicies(prior, catalogs) { return {
  actor(actor, session, state, scope) {
    if (session.dungeonId !== STEEL.dungeonId || actor.binding.kind === 'roster') return prior.actor(actor, session, state, scope);
    const r = diagnostics(), binding = actor.binding, g = actor.growth;
    r.check(steelSame(actor.enabledIqSkillIds, WILD_ACTIVE_IQ), '/enabledIqSkillIds', 'Steel wild allocation uses native active IQ flags independently of IQ thresholds.');
    steelAppend(r, prior.actor({ ...actor, enabledIqSkillIds: [...DEFAULT_IQ] }, session, state, scope), [`P16:actor-binding:${binding.kind}`]);
    if (binding.kind === 'wild') {
      const spawn = catalogs.dungeons.getFloorById(binding.spawnedAt.floorId);
      const match = catalogs.dungeons.getEncounterPool(spawn.encounterPoolId).rows.some(row => eligibleEncounter(row) && row.speciesId === actor.identity.speciesId && row.formId === actor.identity.formId && row.level === g.level);
      r.check(actor.affiliation === 'hostile' && binding.encounterId === `${STEEL.dungeonId}-${actor.identity.speciesId}` && binding.spawnedAt.dungeonId === STEEL.dungeonId && binding.spawnedAt.sectionId === spawn.sectionId && spawn.dungeonId === STEEL.dungeonId && session.visitedFloorIds.some(id => id === spawn.id) && match && Object.hasOwn(STEEL_SLEEP_CHANCES, actor.identity.speciesId), '/binding', 'Ordinary wild roles join actual source floor, species, level and encounter identities.');
    } else if (binding.kind === 'boss' || binding.kind === 'guest') {
      const boss = binding.kind === 'boss';
      r.check(session.floor.location.kind === 'boss' && session.floor.location.encounterId === STEEL.bossRole && actor.identity.speciesId === (boss ? 'pokemon-227' : 'pokemon-050') && actor.identity.formId === null && g.level === (boss ? 10 : 5) && actor.affiliation === (boss ? 'hostile' : 'neutral') && (boss ? binding.encounterId === STEEL.bossRole : binding.storyActorId === STEEL.clientRole), '/binding', 'The summit has the exact level10 Skarmory and level5 neutral Diglett fixed roles.');
      if (!boss) r.check(actor.placement.kind === 'off-map' ? actor.placement.reason === 'fainted' && actor.resources.hp === 0 : steelSame(actor.placement.position, STEEL.clientPosition), '/placement', 'Diglett remains on the isolated ledge until an actual item-caused faint.');
    } else r.check(false, '/binding', 'No other temporary roles are admitted in Steel.');
    const profile = catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId), growth = catalogs.species.getGrowthAtLevel(profile.id, g.level);
    const learned = catalogs.species.getLearnset(profile.id).levelUp.filter(row => row[0] !== undefined && row[0] <= g.level).map(row => catalogs.species.identities.moves.find(move => move.originalId === row[1])?.id);
    r.check(g.iqPoints === 1 && g.totalExperience.numerator / g.totalExperience.denominator === growth.cumulativeExperience && steelSame(g.naturalStats, growth.stats) && Object.values(g.permanentStatBonuses).every(value => value === 0), '/growth', 'Wild/fixed stats are exact ordinary species growth, without a boss HP multiplier.');
    r.check(learned.length <= 4 && steelSame(actor.moves.slots.flatMap(row => row ? [row.moveId] : []), learned) && actor.moves.slots.every(row => !row || row.enabled && row.powerBoost === 0) && actor.moves.links.length === 0 && actor.moves.setMoveSlotId === null && actor.gains.experience.numerator === 0 && state.containers[actor.heldContainerId]?.itemIds.length === 0, '/moves', 'Source wild moves remain exact enabled slots without learned-slot substitution or item gains.');
    return r.result();
  },
  floor(floor, session, state, scope) {
    if (session.dungeonId !== STEEL.dungeonId) return prior.floor(floor, session, state, scope);
    const r = diagnostics(); steelAppend(r, prior.floor(floor, session, state, scope), ['P22:fixed-floor-state:1']);
    r.check(bounded(floor.arrivalCounter, 0, 35) && bounded(floor.windCounter, 0, 1000) && floor.turnCounter + floor.windCounter === 1000, '/counters', 'Steel retains the sourced wind and ordinary arrival cycles.');
    if (floor.location.kind === 'boss') {
      const map = buildSteelArena(), room = Object.values(floor.rooms)[0]; finalizeGeometry(map);
      r.check(floor.location.address.floorId === STEEL.floors[8] && floor.location.encounterId === STEEL.bossRole && floor.arrivalCounter === 0 && Object.keys(floor.exits).length === 0 && Object.keys(floor.traps).length === 0 && Object.keys(floor.rooms).length === 1 && room?.kind === 'ordinary' && room.monsterHouse === 'none' && !room.initiallyHidden && steelSame(room.bounds, map.rooms[0]?.bounds), '', 'Fixed9 has the original authored gap geometry, zero-density arrival suppression and no stair exit.');
      for (let z = 0; z < 32; z++) for (let x = 0; x < 56; x++) {
        const cell = map.cells[z]?.[x], tile = floor.tiles[z]?.[x];
        r.check(cell && tile && tile.terrainId === `terrain-${cell.impassable ? 'impassable-' : ''}${cell.terrain}` && tile.roomId === (cell.room === null ? null : room?.roomId) && tile.unbreakable === cell.unbreakable && tile.junction === cell.junction && tile.shopId === null, '/tiles', 'Summit tiles must retain the complete independently authored fixed layout.');
      }
    } else r.check(floor.location.kind === 'exploration' && STEEL.floors.slice(0, 8).some(id => 'address' in floor.location && id === floor.location.address.floorId), '/location', 'Only source floors1 through8 are procedural.');
    return r.result();
  },
  expeditionEntry(session, state, scope) {
    if (session.dungeonId !== STEEL.dungeonId) return prior.expeditionEntry(session, state, scope);
    const r = diagnostics();
    r.check(session.entry.entryPolicyId === STEEL.entryPolicy && session.entry.outcomePolicySetId === STEEL.outcomePolicy, '/entry', 'Steel uses its explicit standard non-reset entry and return policies.');
    steelAppend(r, prior.expeditionEntry({ ...session, dungeonId: /** @type {import('../../src/contracts.js').DungeonId} */ ('tiny-woods'), entry: { ...session.entry, entryPolicyId: OPENING_EXPEDITION.entryPolicy, outcomePolicySetId: OPENING_EXPEDITION.outcomePolicy } }, state, scope));
    return r.result();
  },
  scheduler(session, state, scope) {
    if (session.dungeonId !== STEEL.dungeonId || session.scheduler.kind !== 'scene-paused') return prior.scheduler(session, state, scope);
    const r = diagnostics(), s = session.scheduler, c = s.continuation, phase = state.steel?.phase;
    r.check(['battle-intro', 'poststory', 'departure'].includes(phase ?? '') && s.sceneInstanceId === state.pendingScene?.sceneInstanceId && c.terminal === 'dungeon-exit', '', 'Only a summit dialogue/departure owns this terminal scene pause.');
    const fresh = createScheduler(INITIAL_SCHEDULE_POLICY_ID, [...s.teamSlots], [...s.wildSlots]);
    if (phase === 'departure') r.check(c.stage === 'after' && c.active && c.activeEffect === null && c.actionStop === 'none' && !c.leaderChanged && Object.values(session.actors).some(actor => actor.binding.kind === 'boss' && actor.resources.hp === 0 && actor.placement.kind === 'off-map') && session.teamOrder.every(id => (session.actors[id]?.resources.hp ?? 0) > 0), '/continuation', 'Departure pauses only after a real boss faint and the same action/recoil forced-loss boundary.');
    else r.check(s.roundNumber === fresh.roundNumber && s.schedulePolicyId === fresh.schedulePolicyId && steelSame({ ...c, terminal: 'none' }, fresh.continuation), '/continuation', 'Prebattle/poststory has the freshly entered summit scheduler before any actor opportunity.');
    steelAppend(r, prior.scheduler({ ...session, scheduler: fresh }, state, scope)); return r.result();
  },
}; }
