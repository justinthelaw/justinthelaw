import { ESCORT_ENTRY_FACTS as FACTS } from '../../../content/authored/escort-entry-facts.js';
import { DEFAULT_IQ } from '../../../content/state/opening-facts.js';
import { fingerprint } from '../state/relations.js';
import { copyPlainData } from '../state/plain.js';
import { instanceId } from '../ids.js';
import { generateNativeHiddenPower } from './native-escort-entry.js';
import { escortGuestEntryProblem } from '../state/escort-guest-entry-proof.js';
import { allocate, blocked, quantity } from './support.js';

/** @typedef {import('../../contracts/escort-work.js').PreparedGuest} PreparedGuest
 * @typedef {import('../../contracts/escort-work.js').EscortGuestActor} GuestActor
 * @typedef {import('../../contracts/escort-work.js').EscortGuestEntry} GuestEntry
 * @typedef {import('./support.js').Catalogs} Catalogs
 * @typedef {import('../../contracts/campaign.js').CampaignState} State */
const GUEST_LIMITS = Object.freeze({ maxDepth: 5,maxNodes: 160,maxArrayLength: 4,maxObjectKeys: 24,maxStringLength: 96,maxTextLength: 8192 });

/** Only source-qualified preparation values become live resources. Replay the
 * Hidden Power witness separately in the eventual complete entry proof; this
 * constructor consumes no RNG, never routes through hostile actor defaults.
 * @param {PreparedGuest} input @param {Catalogs} catalogs @returns {PreparedGuest} */
function qualifiedGuest(input,catalogs) {
  const guest = /** @type {PreparedGuest} */ (/** @type {unknown} */ (copyPlainData(input,GUEST_LIMITS)));
  if (!guest || typeof guest !== 'object' || Array.isArray(guest) || Object.keys(guest).sort().join(',') !== 'afterGeneralRandom,beforeGeneralRandom,belly,client,heldItem,hiddenPower,iqPoints,iqSkillIds,isLeader,jobId,joinFloor,joinLocation,level,maxBelly,moves,nativeRecruitedId,recipient,slot,stats,tacticId,totalExperience') return blocked('native-escort-preparation-shape');
  instanceId('job',guest.jobId);
  for (const identity of [guest.client,guest.recipient]) {
    if (!identity || typeof identity !== 'object' || Array.isArray(identity) || Object.keys(identity).sort().join(',') !== 'formId,speciesId' || typeof identity.speciesId !== 'string' || identity.formId !== null && typeof identity.formId !== 'string') return blocked('native-escort-identity-shape');
    const profile = catalogs.species.getProfile(identity.speciesId,identity.formId);
    if (profile.formId !== identity.formId) return blocked('native-escort-identity-form');
  }
  const client = FACTS.clients.find(row => row.speciesId === guest.client?.speciesId && row.formId === guest.client.formId);
  if (!client || guest.level !== 1 || guest.totalExperience !== 0 || guest.nativeRecruitedId !== FACTS.temporaryRecruitedId || guest.joinLocation !== FACTS.joinLocation || guest.joinFloor !== FACTS.joinFloor || guest.iqPoints !== FACTS.minimumDungeonIq || guest.tacticId !== 'tactic-lets-go-together' || guest.isLeader !== false || guest.heldItem !== null || guest.belly !== 100 || guest.maxBelly !== 100 || guest.slot < 0 || guest.slot >= FACTS.maxTeamSlots || !Number.isInteger(guest.slot) || fingerprint(guest.stats) !== fingerprint(client.stats) || fingerprint(guest.iqSkillIds) !== fingerprint(DEFAULT_IQ) || fingerprint(guest.moves) !== fingerprint(client.moves.map(move => ({ ...move,enabled: true,currentPp: move.basePp,powerBoost: 0,ppCapacityBonus: 0 })))) return blocked('native-escort-preparation');
  const p = catalogs.species.getProfile(guest.client.speciesId,guest.client.formId);
  if (p.bodySize !== client.bodySize || fingerprint(catalogs.species.getGrowthAtLevel(p.id,1).stats) !== fingerprint(guest.stats)) return blocked('native-escort-profile');
  for (const move of guest.moves) if (catalogs.effects.getMove(move.moveId).numeric.pp !== move.basePp) return blocked('native-escort-move-pp');
  const conversion = generateNativeHiddenPower(guest.beforeGeneralRandom);
  if (fingerprint(conversion.hiddenPower) !== fingerprint(guest.hiddenPower) || fingerprint(conversion.generalRandom) !== fingerprint(guest.afterGeneralRandom)) return blocked('native-escort-hidden-power-witness');
  return guest;
}

/** Allocate the temporary actor/real full-PP slots/empty held container once.
 * This returns a genuine prospective team actor and its baseline. The exact
 * successor must atomically own its slot, placement, general stream and receipt;
 * no current factory/entry/old conversion calls this constructor.
 * All input/catalog checks precede allocation. No persistent roster, team-area
 * residence, recruitment record or guest item archive is created.
 * The mutable draft must already be canonically validated; every pre-existing
 * generated identity is below its captured allocation mark.
 * @param {State} state @param {Catalogs} catalogs @param {PreparedGuest} input
 * @param {import('../../contracts.js').MapId} mapId @param {import('../../contracts.js').GridPosition} position
 * @param {import('../../contracts.js').SessionId} sessionId
 * @returns {{actor:GuestActor,entry:GuestEntry,witness:import('../../contracts/escort-construction.js').EscortConstructionWitness}} */
export function createNativeEscortActor(state,catalogs,input,mapId,position,sessionId) {
  const guest = qualifiedGuest(input,catalogs),p = catalogs.species.getProfile(guest.client.speciesId,guest.client.formId);
  instanceId('map',mapId); instanceId('session',sessionId);
  const entryPosition = /** @type {import('../../contracts.js').GridPosition} */ (/** @type {unknown} */ (copyPlainData(position,GUEST_LIMITS)));
  if (!entryPosition || typeof entryPosition !== 'object' || Array.isArray(entryPosition) || Object.keys(entryPosition).sort().join(',') !== 'x,z' || !Number.isInteger(entryPosition.x) || !Number.isInteger(entryPosition.z) || entryPosition.x < 0 || entryPosition.x >= 56 || entryPosition.z < 0 || entryPosition.z >= 32) return blocked('native-escort-placement');
  if (!Number.isSafeInteger(state.idSequence.next) || state.idSequence.next < 1 || state.idSequence.next > Number.MAX_SAFE_INTEGER-guest.moves.length-2) return blocked('native-escort-allocation-bound');
  const beforeNext = state.idSequence.next;
  if ([mapId,sessionId,guest.jobId].some(id => Number(id.slice(id.lastIndexOf(':')+1)) >= beforeNext)) return blocked('native-escort-existing-identity-mark');
  /** @type {import('../../contracts/campaign.js').MoveSet} */
  const moves = { slots: [null,null,null,null],links: [],setMoveSlotId: null };
  guest.moves.forEach((move,index) => { moves.slots[index] = { moveSlotId: allocate(state,'move-slot'),moveId: /** @type {import('../../contracts.js').MoveId} */ (move.moveId),enabled: true,powerBoost: 0,ppCapacityBonus: 0 }; });
  const actorId = allocate(state,'actor'),heldContainerId = allocate(state,'container');
  state.containers[heldContainerId] = { containerId: heldContainerId,owner: { kind: 'actor-held',sessionId,actorId },itemIds: [] };
  /** @type {GuestActor} */
  const actor = {
    actorId,binding: { kind: 'escort-guest',jobId: guest.jobId },affiliation: 'team',identity: { speciesId: guest.client.speciesId,formId: guest.client.formId },
    growth: { level: 1,totalExperience: quantity(0),naturalStats: { ...guest.stats },permanentStatBonuses: { hp: 0,attack: 0,defense: 0,specialAttack: 0,specialDefense: 0 },iqPoints: guest.iqPoints },
    moves,enabledIqSkillIds: /** @type {import('../../contracts/campaign.js').IqSkillId[]} */ ([...DEFAULT_IQ]),tacticId: /** @type {import('../../contracts/campaign.js').TacticId} */ ('tactic-lets-go-together'),
    battleMoves: { slots: moves.slots.flatMap((slot,index) => slot ? [{ moveSlotId: slot.moveSlotId,currentPp: guest.moves[index]?.basePp ?? blocked('native-escort-pp-slot'),sealed: false,usedForExperience: false }] : []) },
    resources: { hp: guest.stats.hp,belly: quantity(100),maxBelly: quantity(100),hpRegenerationAccumulator: quantity(0) },
    placement: { kind: 'map',mapId,position: { x: entryPosition.x,z: entryPosition.z } },facing: 's',
    conditions: { sleep: null,burn: null,frozen: null,cringe: null,bide: null,reflect: null,curse: null,leechSeed: null,sureShot: null,longToss: null,invisible: null,blinker: null },
    auxiliaryConditions: { perishSong: null,muzzled: null,grudge: null,exposed: null },
    stages: { attack: 10,defense: 10,specialAttack: 10,specialDefense: 10,accuracy: 10,evasion: 10 },
    multipliers: { attack: quantity(1),defense: quantity(1),specialAttack: quantity(1),specialDefense: quantity(1) },
    speed: { positiveTimers: [0,0,0,0,0],negativeTimers: [0,0,0,0,0],cachedStage: p.baseMovementSpeed,speedBoostCounter: 0,attackLocked: false,speedRaisedThisAction: false,movementPending: false,endEffectsPending: false,deferred: false,swapSkip: false,petrifiedSwap: false,replan: false },
    memory: { lastUsedMove: null,lastIncomingMove: null,lastDamage: null,furyCutterCount: 0,protectCount: 0,stockpileCount: 0,attackedThisOpportunity: false,movedThisOpportunity: false,experienceContributors: [] },
    overrides: { types: null,abilities: null,form: null,hiddenPower: null },heldContainerId,
    gains: { experience: quantity(0),statItems: { hp: 0,attack: 0,defense: 0,specialAttack: 0,specialDefense: 0 },iq: 0,maxBelly: quantity(0),moveBoosts: [] },
    ai: { target: null,destination: null,waitingForLeader: false },
  };
  // All19 level1 moves exclude Hidden Power. Retain the exact generated pair in
  // the guest entry owner instead of inventing an unsupported old TypeId join.
  const entry = { actorId,jobId: guest.jobId,slot: guest.slot,nativeRecruitedId: guest.nativeRecruitedId,joinLocation: guest.joinLocation,joinFloor: guest.joinFloor,client: { ...guest.client },recipient: { ...guest.recipient },hiddenPower: { ...guest.hiddenPower },moveSlotIds: moves.slots.flatMap(slot => slot ? [slot.moveSlotId] : []),heldContainerId };
  /** @type {import('../../contracts/escort-construction.js').EscortConstructionWitness} */
  const witness = { prepared: guest,allocation: { beforeNext,afterNext: state.idSequence.next,allocated: [...entry.moveSlotIds.map(id => ({ kind: /** @type {const} */ ('move-slot'),id })),{ kind: 'actor',id: actorId },{ kind: 'container',id: heldContainerId }] } };
  if (escortGuestEntryProblem(actor,entry,state.containers[heldContainerId],sessionId,catalogs,witness,state.idSequence.next)) return blocked('native-escort-constructed-entry');
  return { actor,entry,witness };
}
