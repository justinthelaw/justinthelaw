import { ESCORT_ENTRY_FACTS as FACTS } from '../../../content/authored/escort-entry-facts.js';
import { DEFAULT_IQ } from '../../../content/state/opening-facts.js';
import { fingerprint } from './relations.js';
import { copyPlainData } from './plain.js';
import { inspectShape } from './structure.js';
import { ESCORT_GUEST_SHAPES } from './escort-guest-schema.js';
import { generateNativeHiddenPower } from '../gameplay/native-escort-entry.js';
const CONSTRUCTION_LIMITS = Object.freeze({ maxDepth: 16,maxNodes: 800,maxArrayLength: 8,maxObjectKeys: 32,maxStringLength: 96,maxTextLength: 8192 });
/** Initial construction proof only. Later saved guest states need their actual
 * mutable lifecycle/PP/condition/turn/learning owner; this is no admission rule.
 * The caller supplies a previously validated canonical draft: all its existing
 * generated identities lie below the captured beforeNext. The emitted receipt
 * and actual postallocation mark prove this fresh disjoint allocation interval.
 * Raw arguments are copied/exact-shaped before any field-dependent comparison.
 * @param {unknown} actorInput @param {unknown} entryInput
 * @param {unknown} containerInput @param {unknown} sessionInput
 * @param {import('../gameplay/support.js').Catalogs} catalogs
 * @param {unknown} witnessInput @param {unknown} allocationMarkInput
 * @returns {string|null} */
export function escortGuestEntryProblem(actorInput,entryInput,containerInput,sessionInput,catalogs,witnessInput,allocationMarkInput) {
  /** @type {import('../../contracts.js').JsonValue} */ let data;
  try { data = copyPlainData({ actor: actorInput,entry: entryInput,container: containerInput,sessionId: sessionInput,witness: witnessInput,allocationMark: allocationMarkInput },CONSTRUCTION_LIMITS); } catch { return 'Fresh guest construction requires bounded detached plain data.'; }
  /** @type {import('../../contracts/campaign.js').StateIssue[]} */ const issues = [];
  const instances = new Map(); let foreignNumber = false;
  if (!inspectShape(data,'EscortConstructionRecord',issues,(name,value) => {
    const shape = ESCORT_GUEST_SHAPES[name];
    if (shape?.kind !== 'instance' || typeof value !== 'string') return;
    const number = Number(value.slice(value.lastIndexOf(':')+1)),previous = instances.get(number);
    if (previous && previous !== value) foreignNumber = true;
    instances.set(number,value);
  },'',ESCORT_GUEST_SHAPES) || foreignNumber) return 'Fresh guest resources require exact shapes and globally distinct generated identity kinds/numbers.';
  const { actor,entry,container,sessionId,witness,allocationMark } = /** @type {{actor:import('../../contracts/escort-work.js').EscortGuestActor,entry:import('../../contracts/escort-work.js').EscortGuestEntry,container:import('../../contracts/campaign.js').ItemContainer,sessionId:import('../../contracts.js').SessionId,witness:import('../../contracts/escort-construction.js').EscortConstructionWitness,allocationMark:number}} */ (/** @type {unknown} */ (data));
  const allocated = [...entry.moveSlotIds.map(id => ({ kind: 'move-slot',id })),{ kind: 'actor',id: actor.actorId },{ kind: 'container',id: container.containerId }],receipt = witness.allocation;
  if (receipt.beforeNext < 1 || receipt.afterNext !== allocationMark || receipt.afterNext !== receipt.beforeNext+allocated.length || fingerprint(receipt.allocated) !== fingerprint(allocated)) return 'Fresh guest requires its actual complete ordered allocation receipt and committed global mark.';
  const newIds = new Set(allocated.map(row => row.id));
  if (newIds.size !== allocated.length || allocated.some((row,index) => Number(row.id.slice(row.id.lastIndexOf(':')+1)) !== receipt.beforeNext+index) || [...instances].some(([number,id]) => newIds.has(id) ? number < receipt.beforeNext || number >= receipt.afterNext : number >= receipt.beforeNext)) return 'Guest moves/actor/container must own one fresh contiguous disjoint generated allocation interval.';
  const prepared = witness.prepared;
  let conversion; try { conversion = generateNativeHiddenPower(prepared.beforeGeneralRandom); } catch { return 'Guest conversion requires its actual supplied native before state.'; }
  if (fingerprint(conversion.generalRandom) !== fingerprint(prepared.afterGeneralRandom) || fingerprint(conversion.hiddenPower) !== fingerprint(prepared.hiddenPower) || fingerprint(entry.hiddenPower) !== fingerprint(conversion.hiddenPower)) return 'Guest Hidden Power must equal its actual supplied source conversion and before/after native stream witness.';
  if (entry.jobId !== prepared.jobId || entry.slot !== prepared.slot || fingerprint(entry.client) !== fingerprint(prepared.client) || fingerprint(entry.recipient) !== fingerprint(prepared.recipient)) return 'Fresh guest entry must retain its actual qualified supplied request/client/recipient/slot.';
  const source = FACTS.clients.find(row => row.speciesId === entry.client.speciesId && row.formId === entry.client.formId);
  if (!source || actor.binding.kind !== 'escort-guest' || actor.affiliation !== 'team' || actor.actorId !== entry.actorId || actor.binding.jobId !== entry.jobId || fingerprint(actor.identity) !== fingerprint(entry.client) || entry.nativeRecruitedId !== FACTS.temporaryRecruitedId || entry.joinLocation !== FACTS.joinLocation || entry.joinFloor !== FACTS.joinFloor || !Number.isInteger(entry.slot) || entry.slot < 0 || entry.slot >= 4) return 'Temporary escort identity, supplied native slot and entry baseline differ.';
  if (prepared.nativeRecruitedId !== FACTS.temporaryRecruitedId || prepared.joinLocation !== FACTS.joinLocation || prepared.joinFloor !== FACTS.joinFloor || prepared.level !== 1 || prepared.totalExperience !== 0 || fingerprint(prepared.stats) !== fingerprint(source.stats) || prepared.iqPoints !== FACTS.minimumDungeonIq || fingerprint(prepared.iqSkillIds) !== fingerprint(DEFAULT_IQ) || prepared.tacticId !== 'tactic-lets-go-together' || prepared.isLeader || prepared.heldItem !== null || prepared.belly !== 100 || prepared.maxBelly !== 100 || fingerprint(prepared.moves) !== fingerprint(source.moves.map(move => ({ ...move,enabled: true,currentPp: move.basePp,powerBoost: 0,ppCapacityBonus: 0 })))) return 'Actual supplied preparation must independently match complete source guest defaults.';
  const profile = catalogs.species.getProfile(actor.identity.speciesId,actor.identity.formId),recipient = catalogs.species.getProfile(entry.recipient.speciesId,entry.recipient.formId);
  if (profile.formId !== actor.identity.formId || recipient.formId !== entry.recipient.formId || profile.bodySize !== source.bodySize || fingerprint(catalogs.species.getGrowthAtLevel(profile.id,1).stats) !== fingerprint(source.stats)) return 'Actual guest/recipient source profiles differ from qualified entry facts.';
  const zeroStats = { hp: 0,attack: 0,defense: 0,specialAttack: 0,specialDefense: 0 },one = { numerator: 1,denominator: 1 },zero = { numerator: 0,denominator: 1 },hundred = { numerator: 100,denominator: 1 };
  if (actor.growth.level !== 1 || fingerprint(actor.growth.totalExperience) !== fingerprint(zero) || fingerprint(actor.growth.naturalStats) !== fingerprint(source.stats) || fingerprint(actor.growth.permanentStatBonuses) !== fingerprint(zeroStats) || actor.growth.iqPoints !== FACTS.minimumDungeonIq || actor.pendingExperience || fingerprint(actor.enabledIqSkillIds) !== fingerprint(DEFAULT_IQ) || actor.tacticId !== 'tactic-lets-go-together') return 'Guest starts source level1/EXP0/base stats/IQ26/default skills/tactic without growth credit.';
  if (actor.moves.slots.length !== 4 || actor.moves.links.length || actor.moves.setMoveSlotId !== null || actor.battleMoves.slots.length !== source.moves.length || entry.moveSlotIds.length !== source.moves.length || new Set(entry.moveSlotIds).size !== entry.moveSlotIds.length) return 'Guest move slots must have unique actual allocation, no SET/links and full source PP.';
  for (let index = 0; index < 4; index++) {
    const expected = source.moves[index],slot = actor.moves.slots[index],pp = actor.battleMoves.slots[index];
    if (!expected) { if (slot !== null) return 'Guest retains precisely its source-ordered level1 moves and trailing empty slots.'; continue; }
    if (!slot || slot.moveSlotId !== entry.moveSlotIds[index] || slot.moveId !== expected.moveId || !slot.enabled || slot.powerBoost !== 0 || slot.ppCapacityBonus !== 0 || !pp || pp.moveSlotId !== slot.moveSlotId || pp.currentPp !== expected.basePp || pp.sealed || pp.usedForExperience || catalogs.effects.getMove(slot.moveId).numeric.pp !== expected.basePp) return 'Guest entry move identity/order/full PP differs from its actual source.';
  }
  if (actor.heldContainerId !== entry.heldContainerId || container.containerId !== actor.heldContainerId || container.owner.kind !== 'actor-held' || container.owner.sessionId !== sessionId || container.owner.actorId !== actor.actorId || container.itemIds.length) return 'Temporary escort owns one reciprocal, genuinely empty live held container.';
  if (actor.resources.hp !== source.stats.hp || fingerprint(actor.resources.belly) !== fingerprint(hundred) || fingerprint(actor.resources.maxBelly) !== fingerprint(hundred) || fingerprint(actor.resources.hpRegenerationAccumulator) !== fingerprint(zero) || actor.placement.kind !== 'map' || actor.facing !== 's' || Object.values(actor.conditions).some(value => value !== null) || Object.values(actor.auxiliaryConditions).some(value => value !== null) || Object.values(actor.overrides).some(value => value !== null)) return 'Guest source placement/resources/conditions/overrides must start at their actual clean entry defaults.';
  if (actor.placement.position.x < 0 || actor.placement.position.x >= 56 || actor.placement.position.z < 0 || actor.placement.position.z >= 32) return 'Fresh guest placement requires the actual bounded dungeon grid.';
  if (Object.values(actor.stages).some(stage => stage !== 10) || Object.values(actor.multipliers).some(multiplier => fingerprint(multiplier) !== fingerprint(one)) || actor.speed.cachedStage !== profile.baseMovementSpeed || actor.speed.positiveTimers.length !== 5 || actor.speed.negativeTimers.length !== 5 || actor.speed.positiveTimers.some(timer => timer !== 0) || actor.speed.negativeTimers.some(timer => timer !== 0) || Object.entries(actor.speed).some(([key,value]) => !['cachedStage','positiveTimers','negativeTimers'].includes(key) && value !== false && value !== 0)) return 'Guest entry stages/speed/timers begin without synthetic combat state.';
  if (fingerprint(actor.gains) !== fingerprint({ experience: zero,statItems: zeroStats,iq: 0,maxBelly: zero,moveBoosts: [] }) || fingerprint(actor.memory) !== fingerprint({ lastUsedMove: null,lastIncomingMove: null,lastDamage: null,furyCutterCount: 0,protectCount: 0,stockpileCount: 0,attackedThisOpportunity: false,movedThisOpportunity: false,experienceContributors: [] }) || actor.ai.target !== null || actor.ai.destination !== null || actor.ai.waitingForLeader) return 'Guest entry has no fabricated gains, source memory or movement target.';
  if (!Number.isInteger(entry.hiddenPower.nativeTypeId) || entry.hiddenPower.nativeTypeId < 1 || entry.hiddenPower.nativeTypeId >= FACTS.typeCount || !FACTS.hiddenPowerPowers.includes(entry.hiddenPower.power)) return 'Guest entry retains its generated native Hidden Power pair.';
  return null;
}
