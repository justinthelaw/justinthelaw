import { BRONZE_JOBS_SHAPES as PRIOR } from './bronze-jobs-schema.js';
/** @typedef {import('./schema.js').Shape} Shape */
/** @param {string} name @returns {Shape} */ const ref = name => ({ kind: 'ref', name });
/** @param {string} value @returns {Shape} */ const lit = value => ({ kind: 'literal', value });
/** @param {Record<string,Shape>} fields @returns {Shape} */ const obj = fields => ({ kind: 'object', fields });
const origin = { kind: /** @type {const} */ ('union'), members: [obj({ kind: lit('turn'),sourceActorId: { kind: 'union',members: [ref('ActorId'),{ kind: 'literal',value: null }] } }),obj({ kind: lit('settlement'),outcome: { kind: 'union',members: ['success','fainting','wind-expulsion','give-up'].map(lit) },casualties: { kind: 'array',value: obj({ actorId: ref('ActorId'),level: ref('Int') }) } }),obj({ kind: lit('scene'),sceneId: ref('SceneId'),sceneInstanceId: ref('SceneInstanceId'),cursor: ref('Int') })] };
const learning = obj({ actorId: ref('ActorId'),level: ref('Int'),moveId: ref('MoveId'),selectionRevision: ref('Int'),movesFingerprint: { kind: 'string' },resumeFrameFingerprint: { kind: 'string' },candidateRng: ref('RandomState'),beforeGrowth: ref('PokemonGrowth'),beforeHp: ref('Int'),origin,actorOrder: { kind: 'array',value: ref('ActorId') },actorIndex: ref('Int'),schedulerTag: { kind: 'union',members: [obj({ kind: lit('ready') }),obj({ kind: lit('scene-paused'),sceneInstanceId: ref('SceneInstanceId') })] } });
const pendingExperience = obj({ experienceBefore: ref('Quantity'),gainsBefore: ref('Quantity'),amount: ref('Int'),level: ref('Int'),awards: { kind: 'array',value: obj({ defeatedActorId: ref('ActorId'),attackerActorId: ref('ActorId'),amount: ref('Int'),awardedRevision: ref('Int'),sourceRound: ref('Int'),sourceFrame: ref('TurnContinuation') }) } });
const actor = PRIOR.SessionActor; if (actor?.kind !== 'object') throw new TypeError('Unknown original actor shape.');
const retired = { kind: /** @type {const} */ ('array'),value: obj({ actorId: ref('ActorId'),moveSlot: ref('MoveSlot'),forgottenRevision: ref('Int') }) };
const expedition = PRIOR.ExpeditionState;
if (expedition?.kind !== 'object') throw new TypeError('Unknown original expedition shape.');
/** Only the exact new factory owns the disjoint actual producer field.
 * @type {Readonly<Record<string,Shape>>} */
export const MOVE_LEARNING_SHAPES = Object.freeze({ ...PRIOR,SessionActor: { kind: 'union',members: [actor,obj({ ...actor.fields,pendingExperience })] },ExpeditionState: { kind: 'union',members: [expedition,obj({ ...expedition.fields,learning }),obj({ ...expedition.fields,forgottenMoves: retired }),obj({ ...expedition.fields,learning,forgottenMoves: retired })] } });
/** @param {unknown} value */
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } }
Object.values(MOVE_LEARNING_SHAPES).forEach(freeze);
