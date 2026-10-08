import { CONTINUATION_SHAPES as PRIOR } from './continuation-schema.js';
import { BRONZE_JOB_POLICY } from './bronze-jobs-revision.js';
/** Exact successor extensions only. No old registry/shape is modified and
 * new posting/area metadata stays absent on conversion. Only an actual old
 * prepared queue receives its truthful unpaid conversion descriptor.
 * @typedef {import('./schema.js').Shape} Shape */
/** @param {string} name */
function object(name) { const shape = PRIOR[name]; if (shape?.kind !== 'object') throw new TypeError('Missing frozen object shape.'); return shape; }
const record = object('JobRecord'), work = object('EarlyWorkState'), friends = object('FriendsState');
if (record.fields.source?.kind !== 'union' || work.fields.reward?.kind !== 'union') throw new TypeError('Missing frozen source/reward shape.');
const source = record.fields.source.members[0], reward = work.fields.reward.members.find(row => row.kind === 'object');
if (source?.kind !== 'object' || reward?.kind !== 'object') throw new TypeError('Missing frozen generated/prepared shape.');
/** @param {(string|number|null)[]} values @returns {Shape} */
const union = values => ({ kind: 'union',members: values.map(value => ({ kind: 'literal',value })) });
/** @param {string} name @returns {Shape} */
const ref = name => ({ kind: 'ref',name });
/** @type {Readonly<Record<string,Shape>>} */
export const BRONZE_JOBS_SHAPES = Object.freeze({ ...PRIOR,
  JobRecord: { ...record,fields: { ...record.fields,source: { kind: 'union',members: [...record.fields.source.members,
    { kind: 'object',fields: { ...source.fields,generationPolicyId: { kind: 'literal',value: BRONZE_JOB_POLICY },generatedRevision: ref('Int'),missionType: union([0,1,2,3,4]),rewardType: union([0,1,2,3,4,5,6,7,8]),unk2: ref('Int'),friendAreaReward: { kind: 'union',members: [ref('FriendAreaId'),{ kind: 'literal',value: null }] } } },
  ] } } },
  EarlyWorkState: { ...work,fields: { ...work.fields,reward: { kind: 'union',members: [
    { kind: 'literal',value: null },
    { ...reward,fields: { ...reward.fields,prefixAppliedRevision: ref('Int') } },
    { ...reward,fields: { ...reward.fields,unpaidPrefix: { kind: 'object',fields: { sourceContentRevision: { kind: 'string' },sourceRevision: ref('Int'),conversionRevision: ref('Int'),queueFingerprint: { kind: 'string' } } } } },
  ] } } },
  FriendsState: { kind: 'union',members: [friends,{ ...friends,fields: { ...friends.fields,missionAreaRewards: { kind: 'array',value: { kind: 'object',fields: {
    jobId: ref('JobId'),areaId: ref('FriendAreaId'),revision: ref('Int'),day: ref('Int'),outcome: union(['unlocked','already-owned-money']),
  } } } } }] },
});
/** @param {unknown} value */
function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { for (const child of Object.values(value)) freeze(child); Object.freeze(value); } }
for (const shape of Object.values(BRONZE_JOBS_SHAPES)) freeze(shape);
