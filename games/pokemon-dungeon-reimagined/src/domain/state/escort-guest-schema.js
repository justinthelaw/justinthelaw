import { MOVE_LEARNING_SHAPES as PRIOR } from './move-learning-schema.js';
/** Prospective exact temporary actor shapes; no current registry selects them.
 * @typedef {import('./schema.js').Shape} Shape */
/** @param {string} name @returns {Shape} */ const ref = name => ({ kind: 'ref',name });
/** @param {Record<string,Shape>} fields @returns {Shape} */ const obj = fields => ({ kind: 'object',fields });
const actor = PRIOR.SessionActor;
if (actor?.kind !== 'union' || actor.members[0]?.kind !== 'object') throw new TypeError('Unknown exact source actor shape.');
/** @type {Shape} */
const allocation = { kind: 'union',members: ['move-slot','actor','container'].map(kind => obj({ kind: { kind: 'literal',value: kind },id: { kind: 'instance',name: /** @type {'move-slot'|'actor'|'container'} */ (kind) } })) };
/** A guest cannot possess pendingExperience or a permanent PokemonId. All other
 * actual resources/conditions remain regular actor fields; raw proof is separate.
 * @type {Readonly<Record<string,Shape>>} */
export const ESCORT_GUEST_SHAPES = Object.freeze({
  ...PRIOR,
  EscortGuestActor: obj({ ...actor.members[0].fields,binding: obj({ kind: { kind: 'literal',value: 'escort-guest' },jobId: ref('JobId') }) }),
  EscortGuestEntry: obj({ actorId: ref('ActorId'),jobId: ref('JobId'),slot: ref('Int'),nativeRecruitedId: ref('Int'),joinLocation: ref('Int'),joinFloor: ref('Int'),client: ref('SpeciesForm'),recipient: ref('SpeciesForm'),hiddenPower: obj({ nativeTypeId: ref('Int'),power: ref('Int') }),moveSlotIds: { kind: 'array',value: ref('MoveSlotId') },heldContainerId: ref('ContainerId') }),
  EscortGeneralState: obj({ algorithm: { kind: 'literal',value: 'red-general-lcg-v1' },word: ref('Int'),transitions: ref('Int') }),
  EscortHiddenPower: obj({ nativeTypeId: ref('Int'),power: ref('Int') }),
  EscortPreparedGuest: obj({ jobId: ref('JobId'),client: ref('SpeciesForm'),recipient: ref('SpeciesForm'),slot: ref('Int'),nativeRecruitedId: ref('Int'),joinLocation: ref('Int'),joinFloor: ref('Int'),level: ref('Int'),totalExperience: ref('Int'),stats: ref('StatBlock'),iqPoints: ref('Int'),iqSkillIds: { kind: 'array',value: ref('IqSkillId') },tacticId: ref('TacticId'),isLeader: { kind: 'boolean' },heldItem: { kind: 'literal',value: null },belly: ref('Int'),maxBelly: ref('Int'),hiddenPower: ref('EscortHiddenPower'),moves: { kind: 'array',value: obj({ moveId: ref('MoveId'),nativeMoveId: ref('Int'),basePp: ref('Int'),enabled: { kind: 'boolean' },currentPp: ref('Int'),powerBoost: ref('Int'),ppCapacityBonus: ref('Int') }) },beforeGeneralRandom: ref('EscortGeneralState'),afterGeneralRandom: ref('EscortGeneralState') }),
  EscortConstructionWitness: obj({ prepared: ref('EscortPreparedGuest'),allocation: obj({ beforeNext: ref('Int'),afterNext: ref('Int'),allocated: { kind: 'array',value: allocation } }) }),
  EscortConstructionRecord: obj({ actor: ref('EscortGuestActor'),entry: ref('EscortGuestEntry'),container: ref('ItemContainer'),sessionId: ref('SessionId'),witness: ref('EscortConstructionWitness'),allocationMark: ref('Int') }),
});
/** @param {unknown} value */
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } }
Object.values(ESCORT_GUEST_SHAPES).forEach(freeze);
