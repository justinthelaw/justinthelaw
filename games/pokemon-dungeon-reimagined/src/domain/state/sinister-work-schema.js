import { ESCORT_WORK_SHAPES as PRIOR } from './escort-work-schema.js';
/** Separate prospective exact shapes. No current registry selects this table.
 * @typedef {import('./schema.js').Shape} Shape */
/** @param {string} name @returns {Shape} */ const ref = name => ({ kind: 'ref',name });
/** @param {string|number|null} value @returns {Shape} */ const lit = value => ({ kind: 'literal',value });
/** @param {Record<string,Shape>} fields @returns {Shape} */ const obj = fields => ({ kind: 'object',fields });
/** @param {Shape[]} members @returns {Shape} */ const union = members => ({ kind: 'union',members });
/** @param {Shape} value @returns {Shape} */ const array = value => ({ kind: 'array',value });
/** @param {Shape} value @returns {Shape} */ const nullable = value => union([value,lit(null)]);
const text = /** @type {Shape} */ ({ kind: 'string' }),boolean = /** @type {Shape} */ ({ kind: 'boolean' });
const scheduler = PRIOR.SchedulerState,expedition = PRIOR.ExpeditionState;
if (scheduler?.kind !== 'union' || expedition?.kind !== 'union' || expedition.members.some(row => row.kind !== 'object')) throw new TypeError('Original scheduler/session shapes changed.');
const ready = scheduler.members.find(row => row.kind === 'object' && row.fields.kind?.kind === 'literal' && row.fields.kind.value === 'ready');
const choice = expedition.members.find(row => row.kind === 'object' && row.fields.learning?.kind === 'object');
if (ready?.kind !== 'object' || choice?.kind !== 'object' || choice.fields.learning?.kind !== 'object') throw new TypeError('Original ready/learning shapes changed.');
const origin = choice.fields.learning.fields.origin;
if (origin?.kind !== 'union') throw new TypeError('Original learning origin changed.');
const terminalOrigins = origin.members.filter(row => row.kind === 'object' && row.fields.kind?.kind === 'literal' && ['scene','settlement'].includes(String(row.fields.kind.value)));
if (terminalOrigins.length !== 2) throw new TypeError('Original terminal origins changed.');
const action = PRIOR.ResolvedAction;
if (action?.kind !== 'union') throw new TypeError('Original action shape changed.');
const attacks = action.members.filter(row => row.kind === 'object' && row.fields.kind?.kind === 'literal' && ['attack','move-use','struggle'].includes(String(row.fields.kind.value)));
if (attacks.length !== 3) throw new TypeError('Original attack variants changed.');
const attack = union(attacks),tag = union([obj({ kind: lit('ready') }),obj({ kind: lit('scene-paused'),sceneInstanceId: ref('SceneInstanceId') })]);
const checkpoint = obj({ kind: union(['prepared-move','impact','move-complete','opportunity-end','flush-end','follower-end','terminal'].map(lit)),actor: nullable(ref('ActorSlotRef')),createdRevision: ref('Int'),frameFingerprint: text });
const sequence = obj({ actorId: ref('ActorId'),sessionId: ref('SessionId'),mapId: ref('MapId'),action: attack,nextHit: ref('Int'),totalHits: ref('Int') });
const move = obj({ actor: ref('ActorSlotRef'),selectedAction: attack,action: attack,confused: boolean,facingBefore: ref('Facing'),facingAfter: ref('Facing'),directionRandom: ref('RandomState'),chargeBefore: nullable(ref('ConditionState')),chargeOwned: boolean,preparedRevision: ref('Int'),beforePp: nullable(ref('Int')),afterPp: nullable(ref('Int')),beforeRandom: ref('RandomState'),afterRandom: ref('RandomState'),totalHits: ref('Int'),completedHits: ref('Int'),disposition: union(['active','hit-count','cannot-attack','actor-removed','targets-empty','terminal'].map(lit)) });
const terminal = obj({ phase: union([lit('captured'),lit('return')]),origin: union(terminalOrigins),requestedRevision: ref('Int'),sourceFrame: ref('TurnContinuation'),frameFingerprint: text,schedulerTag: tag,casualties: array(obj({ actor: ref('ActorSlotRef'),level: ref('Int') })) });
const work = obj({ combat: obj({ lastUsed: { kind: 'record',value: obj({ slots: array(ref('MoveSlotId')),struggle: boolean }) },sequence: nullable(sequence) }),move: nullable(move),checkpoint: nullable(checkpoint),terminal: nullable(terminal) });
/** @type {Readonly<Record<string,Shape>>} */
export const SINISTER_WORK_SHAPES = Object.freeze({ ...PRIOR,
  SchedulerState: union([...scheduler.members,obj({ ...ready.fields,kind: lit('sinister-continuing') })]),
  ExpeditionState: union([...expedition.members,...expedition.members.map(row => row.kind === 'object' ? obj({ ...row.fields,sinisterTurn: work }) : row)]),
});
/** @param {unknown} value */ function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } }
Object.values(SINISTER_WORK_SHAPES).forEach(freeze);
