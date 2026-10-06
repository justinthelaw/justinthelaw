import { DEFAULT_IQ } from '../../../content/state/opening-facts.js';
import { allocate, clone, quantity, draw, profile } from './support.js';

/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @param {import('../../contracts/campaign.js').CampaignState} state @param {Catalogs} catalogs @param {import('../../contracts/campaign.js').ActorBinding} binding @param {import('../../contracts/campaign.js').SpeciesForm} identity @param {number} level @param {import('../../contracts/campaign.js').MapId} mapId @param {import('../../contracts.js').GridPosition} position @param {import('../../contracts.js').SessionId} sessionId @returns {Actor} */
export function createActor(state, catalogs, binding, identity, level, mapId, position, sessionId) {
  const p = profile(identity, catalogs); const growth = catalogs.species.getGrowthAtLevel(p.id, level);
  const permanent = binding.kind === 'roster' ? state.roster[binding.pokemonId] : null;
  /** @type {import('../../contracts/campaign.js').MoveSet} */
  const moves = permanent ? clone(permanent.moves) : { slots: [null, null, null, null], links: [], setMoveSlotId: null };
  if (!permanent) {
    let count = 0;
    for (const [learnLevel, nativeMove] of catalogs.species.getLearnset(p.id).levelUp) {
      if (learnLevel === undefined || nativeMove === undefined || learnLevel > level) break;
      const id = catalogs.species.identities.moves.find(row => row.originalId === nativeMove)?.id;
      if (!id) throw new TypeError('Missing learned move identity.');
      const position = count < 4 ? count++ : draw(state, 4, 'encountersItems');
      moves.slots[position] = { moveSlotId: allocate(state, 'move-slot'), moveId: /** @type {import('../../contracts.js').MoveId} */ (id), enabled: true, powerBoost: 0, ppCapacityBonus: 0 };
    }
  }
  const actorId = allocate(state, 'actor'); const heldContainerId = allocate(state, 'container');
  state.containers[heldContainerId] = { containerId: heldContainerId, owner: { kind: 'actor-held', sessionId, actorId }, itemIds: [] };
  return { actorId, binding, affiliation: permanent ? 'team' : 'hostile', identity: clone(identity),
    growth: permanent ? clone(permanent.growth) : { level, totalExperience: quantity(growth.cumulativeExperience), naturalStats: { ...growth.stats }, permanentStatBonuses: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0 }, iqPoints: 1 },
    moves, enabledIqSkillIds: permanent ? [...permanent.enabledIqSkillIds] : [...DEFAULT_IQ], tacticId: permanent?.tacticId ?? /** @type {import('../../contracts/campaign.js').TacticId} */ ('tactic-lets-go-together'),
    battleMoves: { slots: moves.slots.flatMap(slot => slot ? [{ moveSlotId: slot.moveSlotId, currentPp: catalogs.effects.getMove(slot.moveId).numeric.pp, sealed: false, usedForExperience: false }] : []) },
    resources: { hp: permanent ? permanent.growth.naturalStats.hp + permanent.growth.permanentStatBonuses.hp : growth.stats.hp, belly: quantity(100), maxBelly: quantity(100), hpRegenerationAccumulator: quantity(0) },
    placement: { kind: 'map', mapId, position: { ...position } }, facing: 's',
    conditions: { sleep: null, burn: null, frozen: null, cringe: null, bide: null, reflect: null, curse: null, leechSeed: null, sureShot: null, longToss: null, invisible: null, blinker: null },
    auxiliaryConditions: { perishSong: null, muzzled: null, grudge: null, exposed: null },
    stages: { attack: 10, defense: 10, specialAttack: 10, specialDefense: 10, accuracy: 10, evasion: 10 },
    multipliers: { attack: quantity(1), defense: quantity(1), specialAttack: quantity(1), specialDefense: quantity(1) },
    speed: { positiveTimers: [0, 0, 0, 0, 0], negativeTimers: [0, 0, 0, 0, 0], cachedStage: p.baseMovementSpeed, speedBoostCounter: 0, attackLocked: false, speedRaisedThisAction: false, movementPending: false, endEffectsPending: false, deferred: false, swapSkip: false, petrifiedSwap: false, replan: false },
    memory: { lastUsedMove: null, lastIncomingMove: null, lastDamage: null, furyCutterCount: 0, protectCount: 0, stockpileCount: 0, attackedThisOpportunity: false, movedThisOpportunity: false, experienceContributors: [] },
    overrides: { types: null, abilities: null, form: null, hiddenPower: null }, heldContainerId,
    gains: { experience: quantity(0), statItems: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0 }, iq: 0, maxBelly: quantity(0), moveBoosts: [] },
    ai: { target: null, destination: null, waitingForLeader: false } };
}
