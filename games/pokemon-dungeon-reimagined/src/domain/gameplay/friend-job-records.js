export { promisedJobReward } from './job-records.js';
import { promisedJobReward, nextEarlyNews } from './job-records.js';
import { FRIEND_JOB_FACTS as FACTS } from '../../../content/authored/friend-job-facts.js';
import { allocate, blocked } from './support.js';
import { generateEarlyBoard } from './friend-job-generation.js';

/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('../../contracts/early-work.js').EarlyWorkState} Work
 * @typedef {import('../../contracts/early-work.js').EarlyJob} EarlyJob
 * @typedef {import('../../contracts/campaign.js').JobRecord} Job
 * @typedef {import('../../contracts/campaign.js').RewardBundle} Reward
 * @typedef {import('./friend-job-generation.js').GeneratedJob} Generated
 */

/** Native SortJobSlots and SortMailboxSlots use dungeon then floor order.
 * @param {Snapshot['progress']['jobs'][string]} left
 * @param {Snapshot['progress']['jobs'][string]} right */
export function compareJobLocations(left, right) {
  return (FACTS.routes.find(row => row.dungeonId === left.goal.destination.dungeonId)?.nativeDungeonId ?? 0) - (FACTS.routes.find(row => row.dungeonId === right.goal.destination.dungeonId)?.nativeDungeonId ?? 0)
    || Number(left.goal.destination.floorId.split('-').at(-1)) - Number(right.goal.destination.floorId.split('-').at(-1));
}

/** @param {string} speciesId */
const client = speciesId => ({ identity: { speciesId: /** @type {import('../../contracts.js').SpeciesId} */ (speciesId), formId: null }, nickname: null });
/** @param {State} state @param {Generated} raw @param {'board'|'mailbox'} posting @returns {EarlyJob} */
export function createJobRecord(state, raw, posting) {
  const route = FACTS.routes.find(row => row.dungeonId === raw.dungeonId); if (!route) return blocked('job-source-route');
  const destination = /** @type {import('../../contracts/campaign.js').FloorAddress} */ ({ dungeonId: raw.dungeonId, sectionId: raw.dungeonId, floorId: `${raw.dungeonId}-floor-${String(raw.floor).padStart(2, '0')}` });
  const person = client(raw.clientSpecies);
  /** @type {Job['goal']} */ const goal = raw.missionType === 0 ? { kind: 'rescue', client: person, destination }
    : raw.missionType === 1 ? { kind: 'find-pokemon', client: person, target: client(raw.targetSpecies), destination }
      : { kind: raw.missionType === 3 ? 'retrieve-item' : 'deliver-item', client: person, destination, itemId: /** @type {import('../../contracts.js').ItemId} */ (raw.targetItem), quantity: 1 };
  /** @type {EarlyJob['source']} */ const source = { kind: 'generated', generationPolicyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('browser-friend-native-jobs-v1'), posting, generatedDay: state.town.day, seed: raw.seed, missionType: raw.missionType, targetItem: /** @type {import('../../contracts.js').ItemId} */ (raw.targetItem), itemReward: /** @type {import('../../contracts.js').ItemId} */ (raw.itemReward), rewardType: raw.rewardType };
  return { jobId: allocate(state, 'job'), source, goal, difficultyId: 'native-mission-difficulty-1', reward: promisedJobReward(source), phase: { kind: 'offered', offeredDay: state.town.day, expiryDay: null } };
}

/** Accepted copies keep their location occupied even while suspended. Claimed
 * history does not reserve locations after its posting has been refreshed.
 * @param {Snapshot} state @param {Readonly<Work>} work */
export function jobOccupancy(state, work) {
  const ids = new Set([...work.boardJobIds, ...work.mailbox.flatMap(row => row.kind === 'job' ? [row.jobId] : []), ...state.progress.acceptedJobIds]);
  return [...ids].map(id => {
    const job = state.progress.jobs[id]; if (!job) return blocked('job-posting-reference');
    const route = FACTS.routes.find(row => row.dungeonId === job.goal.destination.dungeonId);
    const floor = Number(job.goal.destination.floorId.split('-').at(-1));
    if (!route || !route.floorNumbers.includes(floor)) return blocked('job-posting-location');
    return { dungeonId: route.dungeonId, floor, escort: job.goal.kind === 'escort' };
  });
}

/** GeneratePelipperJobs clears old postings, preserves accepted copies and
 * regenerates against mailbox/accepted occupancy. @param {State} state @param {Work} work */
export function refreshJobBoard(state, work) {
  for (const id of work.boardJobIds) if (state.progress.jobs[id]?.phase.kind === 'offered') delete state.progress.jobs[id];
  work.boardJobIds = [];
  for (const raw of generateEarlyBoard(state, jobOccupancy(state, work))) {
    const job = createJobRecord(state, raw, 'board'); state.progress.jobs[job.jobId] = job; work.boardJobIds.push(job.jobId);
  }
}

/** Ground refresh precedes reward cleanup. The board can therefore reserve
 * fewer locations than the following morning: claiming frees accepted floors.
 * @param {State} state @param {Work} work */
export function refreshGroundJobs(state, work) {
  refreshJobBoard(state, work);
  if (nextEarlyNews(work) !== 0) work.mailPending = true;
}
