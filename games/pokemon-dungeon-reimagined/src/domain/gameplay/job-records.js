import { EARLY_JOB_FACTS as FACTS } from '../../../content/authored/early-job-facts.js';
import { allocate, blocked, clone, draw } from './support.js';
import { generateEarlyBoard, generateEarlyJob, earlyRewardItem } from './job-generation.js';

/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('../../contracts/early-work.js').EarlyWorkState} Work
 * @typedef {import('../../contracts/early-work.js').EarlyJob} EarlyJob
 * @typedef {import('../../contracts/campaign.js').JobRecord} Job
 * @typedef {import('../../contracts/campaign.js').RewardBundle} Reward
 * @typedef {import('./job-generation.js').GeneratedJob} Generated
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
/** @param {string} id */
const itemGrant = id => ({ template: { itemId: /** @type {import('../../contracts.js').ItemId} */ (id), sticky: false, payload: /** @type {const} */ ({ kind: 'none' }) }, quantity: id === 'item-gravelerock' ? 10 : 1 });

/** Promised portion only; extra item samples belong to the reward station.
 * Source mission difficulty1 is rank-index0, with5 team points per receipt.
 * @param {Readonly<EarlyJob['source']>} source @returns {Reward} */
export function promisedJobReward(source) {
  const kind = source.rewardType % 4;
  return { money: kind < 2 ? source.rewardType < 4 ? 100 : 200 : 0, rankPoints: 5,
    items: kind === 0 ? [] : [itemGrant(source.itemReward)], friendAreaIds: [], recruitGrantIds: [] };
}

/** Two or three pairwise-distinct items for native ITEM_EXTRA/ITEM1_EXTRA.
 * The caller persists this prepared bundle before exposing overflow choices.
 * @param {State} state @param {Readonly<EarlyJob['source']>} source */
export function prepareJobReward(state, source) {
  const reward = promisedJobReward(source);
  const count = source.rewardType === 3 ? 2 : source.rewardType === 7 ? 3 : reward.items.length;
  let attempts = 0;
  while (reward.items.length < count) {
    if (++attempts > 4096) return blocked('job-extra-rejection-bound');
    const id = earlyRewardItem(state);
    if (!reward.items.some(row => row.template.itemId === id)) reward.items.push(itemGrant(id));
  }
  return reward;
}

/** @param {State} state @param {Generated} raw @param {'board'|'mailbox'} posting @returns {EarlyJob} */
export function createJobRecord(state, raw, posting) {
  const route = FACTS.routes.find(row => row.dungeonId === raw.dungeonId); if (!route) return blocked('job-source-route');
  const destination = /** @type {import('../../contracts/campaign.js').FloorAddress} */ ({ dungeonId: raw.dungeonId, sectionId: raw.dungeonId, floorId: `${raw.dungeonId}-floor-${String(raw.floor).padStart(2, '0')}` });
  const person = client(raw.clientSpecies);
  /** @type {Job['goal']} */ const goal = raw.missionType === 0 ? { kind: 'rescue', client: person, destination }
    : raw.missionType === 1 ? { kind: 'find-pokemon', client: person, target: client(raw.targetSpecies), destination }
      : { kind: raw.missionType === 3 ? 'retrieve-item' : 'deliver-item', client: person, destination, itemId: /** @type {import('../../contracts.js').ItemId} */ (raw.targetItem), quantity: 1 };
  /** @type {EarlyJob['source']} */ const source = { kind: 'generated', generationPolicyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('browser-early-native-jobs-v1'), posting, generatedDay: state.town.day, seed: raw.seed, missionType: raw.missionType, targetItem: /** @type {import('../../contracts.js').ItemId} */ (raw.targetItem), itemReward: /** @type {import('../../contracts.js').ItemId} */ (raw.itemReward), rewardType: raw.rewardType };
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

/** sub_8096E2C skips queued regular newsletters before searching read flags.
 * @param {Readonly<Work>} work */
export function nextEarlyNews(work) {
  const first = Math.max(0, ...work.mailbox.flatMap(row => row.kind === 'news' && row.newsId < 50 ? [row.newsId + 1] : []));
  for (let id = first; id < 50; id++) if (!work.newsRead.includes(id)) return id;
  return 56;
}

/** Ground refresh precedes reward cleanup. The board can therefore reserve
 * fewer locations than the following morning: claiming frees accepted floors.
 * @param {State} state @param {Work} work */
export function refreshGroundJobs(state, work) {
  refreshJobBoard(state, work);
  if (nextEarlyNews(work) !== 0) work.mailPending = true;
}

/** Source sub_80961D8 at base group8/opcode3b04. The newsletter goto enters
 * the loop body, then continues with remaining job slots; it is not news-only.
 * Special news and Maze14 are outside MAIN4,4. Friend Area reward eligibility
 * is zero at rankF, but its four-unowned-area sample happens BEFORE that gate.
 * @param {State} state @param {Work} work @returns {boolean} */
export function deliverEarlyMailbox(state, work) {
  let count = work.mailbox.length;
  const index = count === 4 ? 4 : count + draw(state, 4 - count, 'jobsRewards');
  if (count >= 4 || !work.mailPending) return false;
  work.mailPending = false;
  let delivered = false;
  const news = nextEarlyNews(work);
  if (news <= 2) { work.mailbox.push({ kind: 'news', newsId: news }); count++; delivered = true; }
  for (; count <= index; count++) {
    const raw = generateEarlyJob(state, jobOccupancy(state, work)); if (!raw) break;
    draw(state, FACTS.unownedNativeMailAreaIds.length, 'jobsRewards');
    const reward = 4 + draw(state, 5, 'jobsRewards');
    const job = createJobRecord(state, { ...raw, rewardType: /** @type {4|5|6|7} */ (reward === 8 ? 4 : reward) }, 'mailbox');
    state.progress.jobs[job.jobId] = job; work.mailbox.push({ kind: 'job', jobId: job.jobId }); delivered = true;
  }
  work.mailbox.sort((a, b) => {
    if (a.kind === 'news') return b.kind === 'news' ? a.newsId - b.newsId : 1;
    if (b.kind === 'news') return -1;
    const left = state.progress.jobs[a.jobId], right = state.progress.jobs[b.jobId];
    if (!left || !right) return blocked('mailbox-sort-reference');
    return compareJobLocations(left, right);
  });
  return delivered;
}

/** Board acceptance preserves its visible posting; mailbox acceptance removes
 * the mail slot. Native5 is suspended, native6 is Take Job. No menu action earns
 * rank points or increments CLEAR_COUNT.
 * @param {State} state @param {Work} work @param {import('../../contracts.js').JobId} jobId
 * @param {'accept'|'take'|'suspend'|'delete'} operation @returns {boolean} */
export function changeJobSelection(state, work, jobId, operation) {
  const job = state.progress.jobs[jobId]; if (!job || job.source.kind !== 'generated' || !('posting' in job.source)) return false;
  if (operation === 'accept') {
    const mailIndex = work.mailbox.findIndex(row => row.kind === 'job' && row.jobId === jobId);
    if (job.phase.kind !== 'offered' || !work.boardJobIds.includes(jobId) && mailIndex < 0 || state.progress.acceptedJobIds.length >= 8) return false;
    state.progress.acceptedJobIds.push(jobId); job.phase = { kind: 'suspended', acceptedRevision: state.revision + 1 };
    state.progress.acceptedJobIds.sort((a, b) => {
      const left = state.progress.jobs[a], right = state.progress.jobs[b];
      if (!left || !right) return blocked('accepted-job-sort-reference');
      return compareJobLocations(left, right);
    });
    if (mailIndex >= 0) work.mailbox.splice(mailIndex, 1);
    return true;
  }
  if (!['accepted', 'suspended'].includes(job.phase.kind) || !state.progress.acceptedJobIds.includes(jobId)) return false;
  if (operation === 'take' || operation === 'suspend') {
    const kind = operation === 'take' ? 'accepted' : 'suspended'; if (job.phase.kind === kind) return false;
    job.phase = { kind, acceptedRevision: state.revision + 1 }; return true;
  }
  if (operation !== 'delete') return false;
  state.progress.acceptedJobIds.splice(state.progress.acceptedJobIds.indexOf(jobId), 1);
  // A still-visible board offer can be accepted again after discarding its
  // accepted copy; preserve the source posting, not a fake failed receipt.
  if (work.boardJobIds.includes(jobId)) job.phase = { kind: 'offered', offeredDay: job.source.generatedDay, expiryDay: null };
  else delete state.progress.jobs[jobId];
  return true;
}

/** @param {Job} job @returns {EarlyJob} */
export function earlyJob(job) {
  if (job.source.kind !== 'generated' || !('posting' in job.source)) return blocked('early-job-source');
  return /** @type {EarlyJob} */ (clone(job));
}
