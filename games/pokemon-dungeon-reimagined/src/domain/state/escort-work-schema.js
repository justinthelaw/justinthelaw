import { ESCORT_GUEST_SHAPES as PRIOR } from './escort-guest-schema.js';
/** Exact prospective raw registry. Historical registries remain untouched;
 * no factory/validator selects this registry until the complete owner closes.
 * @typedef {import('./schema.js').Shape} Shape */
/** @param {string} name @returns {Shape} */ const ref = name => ({ kind: 'ref',name });
/** @param {string|number|null} value @returns {Shape} */ const lit = value => ({ kind: 'literal',value });
/** @param {Record<string,Shape>} fields @returns {Shape} */ const obj = fields => ({ kind: 'object',fields });
/** @param {Shape[]} members @returns {Shape} */ const union = members => ({ kind: 'union',members });
/** @param {Shape} value @returns {Shape} */ const array = value => ({ kind: 'array',value });
/** @param {Shape} value @returns {Shape} */ const nullable = value => union([value,lit(null)]);
/** @param {string} name */ function object(name) { const shape = PRIOR[name]; if (shape?.kind !== 'object') throw new TypeError('Unknown frozen escort prerequisite object.'); return shape; }
const actor = PRIOR.SessionActor,expedition = PRIOR.ExpeditionState,scheduler = PRIOR.SchedulerState;
if (actor?.kind !== 'union' || expedition?.kind !== 'union' || expedition.members.some(row => row.kind !== 'object')) throw new TypeError('Unknown frozen learning variants.');
if (scheduler?.kind !== 'union') throw new TypeError('Unknown original scheduler variants.');
const ready = scheduler.members.find(row => row.kind === 'object' && row.fields.kind?.kind === 'literal' && row.fields.kind.value === 'ready');
const choiceVariant = expedition.members.find(row => row.kind === 'object' && row.fields.learning?.kind === 'object');
if (ready?.kind !== 'object' || choiceVariant?.kind !== 'object' || choiceVariant.fields.learning?.kind !== 'object') throw new TypeError('Unknown original ready/learning owners.');
const workOrigin = choiceVariant.fields.learning.fields.origin,workTag = choiceVariant.fields.learning.fields.schedulerTag;
if (!workOrigin || !workTag) throw new TypeError('Original learning parent shape absent.');
const work = obj({ phase: union([lit('recipient'),lit('return')]),origin: workOrigin,actorOrder: array(ref('ActorId')),actorIndex: ref('Int'),createdRevision: ref('Int'),resumeFrameFingerprint: { kind: 'string' },schedulerTag: workTag });
const general = ref('EscortGeneralState'),hidden = ref('EscortHiddenPower');
const result = { beforeGeneralRandom: general,generalRandom: general,rosterConversions: array(obj({ pokemonId: ref('PokemonId'),slot: ref('Int'),hiddenPower: hidden,beforeGeneralRandom: general,afterGeneralRandom: general })) };
const conversion = obj({
  input: obj({ dungeonId: ref('DungeonId'),teamSlots: { kind: 'tuple',members: Array.from({ length: 4 },() => nullable(obj({ pokemonId: ref('PokemonId'),bodySize: ref('Int') }))) },takenEscorts: array(obj({ jobId: ref('JobId'),dungeonId: ref('DungeonId'),client: ref('SpeciesForm'),recipient: ref('SpeciesForm') })),generalRandom: general }),
  result: union([obj({ kind: lit('no-escort'),...result }),obj({ kind: lit('guest-not-admitted'),reason: union([lit('body-size'),lit('team-slots-full')]),jobId: ref('JobId'),...result }),obj({ kind: lit('guest-prepared'),...result,guest: ref('EscortPreparedGuest') })]),
  pickup: array(obj({ actorId: ref('ActorId'),slot: ref('Int'),mapId: ref('MapId'),floorId: ref('FloorId'),revision: ref('Int'),beforeDungeonRandom: ref('RandomState'),afterDungeonRandom: ref('RandomState'),beforeGeneralRandom: general,afterGeneralRandom: general,itemId: ref('ItemId'),item: nullable(ref('ItemInstance')) })),
  guest: nullable(ref('EscortGuestEntry')),construction: nullable(ref('EscortConstructionRecord')),objective: nullable(obj({ beforeGuest: ref('EscortGuestActor'),beforeRecipient: ref('SessionActor'),floor: ref('FloorState'),sourceFrame: ref('TurnContinuation'),completedRevision: ref('Int'),recipientSlot: ref('Int'),resetJoinLocation: ref('Int') })),
});
const history = obj({ mapId: ref('MapId'),members: { kind: 'record',value: obj({ positions: { kind: 'tuple',members: Array.from({ length: 4 },() => ref('GridPosition')) },lastWalk: nullable(obj({ before: { kind: 'tuple',members: Array.from({ length: 4 },() => ref('GridPosition')) },from: ref('GridPosition'),to: ref('GridPosition'),invisible: { kind: 'boolean' },revision: ref('Int') })) }) } });
const guest = obj({ entry: ref('EscortGuestEntry'),ai: nullable(ref('EscortNativeAi')),lossNoticeRevision: nullable(ref('Int')),joinLocation: ref('Int'),nativeRecruitedId: ref('Int'),lifecycle: union([obj({ kind: lit('live') }),obj({ kind: lit('removed'),reason: union([lit('objective'),lit('fainted')]),removedRevision: ref('Int'),mapId: ref('MapId'),source: ref('ActorSlotRef') })]) });
const variants = [...expedition.members,...expedition.members.map(row => row.kind === 'object' ? obj({ ...row.fields,nativeTeamHistory: history }) : row),...expedition.members.map(row => row.kind === 'object' ? obj({ ...row.fields,nativeTeamHistory: history,escortGuest: guest }) : row)];
/** @type {Readonly<Record<string,Shape>>} */
export const ESCORT_WORK_SHAPES = Object.freeze({ ...PRIOR,
  EscortNativeAi: obj({ mapId: ref('MapId'),objective: union(['stand','chase','remembered','roam','leave-room','run-away'].map(lit)),target: nullable(obj({ ref: ref('ActorSlotRef'),mapId: ref('MapId') })),targetPosition: obj({ x: ref('Int'),z: ref('Int') }),notNextToTarget: { kind: 'boolean' },targetingEnemy: { kind: 'boolean' },turningAround: { kind: 'boolean' },allySkip: { kind: 'boolean' },recalculateFollow: { kind: 'boolean' },waiting: { kind: 'boolean' },moveRandomly: { kind: 'boolean' },mobileTurnTimer: ref('Int') }),
  CampaignStateWithFieldMoves: obj({ ...object('CampaignStateWithFieldMoves').fields,escortRuntime: nullable(obj({ policyId: lit('native-general-prospective-conversions-and-pickup-v1'),adoptedRevision: ref('Int'),generalRandom: general })) }),
  SchedulerState: union([...scheduler.members,obj({ ...ready.fields,kind: lit('learning-continuing') })]),
  SessionActor: union([...actor.members,ref('EscortGuestActor')]),
  ExpeditionEntryBaseline: union([object('ExpeditionEntryBaseline'),obj({ ...object('ExpeditionEntryBaseline').fields,nativeEscort: conversion })]),
  ExpeditionState: union([...variants,...variants.map(row => row.kind === 'object' ? obj({ ...row.fields,learningWork: work }) : row)]),
});
/** @param {unknown} value */ function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } }
Object.values(ESCORT_WORK_SHAPES).forEach(freeze);
