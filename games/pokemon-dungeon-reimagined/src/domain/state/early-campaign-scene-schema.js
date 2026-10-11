import { SINISTER_WORK_SHAPES as PRIOR } from './sinister-work-schema.js';
/** Separate unselected scene continuation. Historical schemas and the accepted
 * work-only table remain untouched; future full raw admission selects this union.
 * @typedef {import('./schema.js').Shape} Shape */
/** @param {string} name @returns {Shape} */ const ref = name => ({ kind: 'ref',name });
/** @param {string|null} value @returns {Shape} */ const lit = value => ({ kind: 'literal',value });
/** @param {Record<string,Shape>} fields @returns {Shape} */ const obj = fields => ({ kind: 'object',fields });
/** @param {Shape[]} members @returns {Shape} */ const union = members => ({ kind: 'union',members });
const text = /** @type {Shape} */ ({ kind: 'string' }),nullableText = union([text,lit(null)]);
const continuation = PRIOR.Continuation;
if (continuation?.kind !== 'union') throw new TypeError('Original continuation variants changed.');
/** @type {Readonly<Record<string,Shape>>} */
export const EARLY_SCENE_SHAPES = Object.freeze({ ...PRIOR,
  EarlyCampaignSceneCursor: obj({ kind: lit('early-campaign-scene-v1'),sceneId: ref('SceneId'),sceneInstanceId: ref('SceneInstanceId'),entryRevision: ref('Int'),day: ref('Int'),stageId: nullableText,
    acknowledgments: { kind: 'array',value: obj({ stageId: text,optionId: nullableText,revision: ref('Int') }) } }),
  Continuation: union([...continuation.members,obj({ kind: lit('early-campaign'),cursor: ref('EarlyCampaignSceneCursor'),actors: { kind: 'record',value: ref('ActorSlotRef') } })]),
});
/** @param {unknown} value */ function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } }
Object.values(EARLY_SCENE_SHAPES).forEach(freeze);
