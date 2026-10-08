import { BRONZE_JOB_FACTS as BRONZE } from '../../../content/authored/bronze-job-facts.js';
import { FRIEND_JOB_FACTS as FACTS } from '../../../content/authored/friend-job-facts.js';
import { BRONZE_JOB_POLICY } from '../state/bronze-jobs-revision.js';
import { bronzeRewardItem, generateBronzeBoard, generateBronzeJob } from './bronze-job-generation.js';
import { steelMeaniesOccupancy } from './steel-meanies-mail.js';
import { compareJobLocations } from './friend-job-records.js';
import { nextEarlyNews, changeJobSelection } from './job-records.js';
import { draw, allocate, blocked, clone } from './support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('../../contracts/early-work.js').EarlyWorkState} Work
 * @typedef {import('../../contracts/campaign.js').JobRecord} Job
 * @typedef {import('../../contracts/bronze-jobs.js').BronzeSource} Source
 * @typedef {import('../../contracts/bronze-jobs.js').BronzeJobRecord} BronzeJob
 * @typedef {import('./bronze-job-generation.js').GeneratedJob} Generated */
/** @param {Readonly<Job>} job */
export function isBronzeJob(job) { return job.source.kind === 'generated' && job.source.generationPolicyId === BRONZE_JOB_POLICY && 'unk2' in job.source; }
/** Typed view after exact source recognition; frozen JobRecord contracts remain
 * narrow for old policy callbacks. The successor shape owns numeric2/reward8.
 * @param {Readonly<Job>} job @returns {Readonly<BronzeJob>} */
export function bronzeJob(job) { if (!isBronzeJob(job)) return blocked('bronze-job-source'); return /** @type {Readonly<BronzeJob>} */ (/** @type {unknown} */ (job)); }
/** @param {string} id @returns {import('../../contracts/campaign.js').ItemGrant} */
export function bronzeItemGrant(id) {
  const row = BRONZE.rewardItems.find(item => item.itemId === id);
  if (!row && !FACTS.rewardItems.some(item => item.itemId === id)) return blocked('bronze-reward-item');
  return { template: { itemId: /** @type {import('../../contracts.js').ItemId} */ (id),sticky: false,payload: /** @type {import('../../contracts/campaign.js').ItemTemplate['payload']} */ (row ? clone(row.payload) : { kind: 'none' }) },quantity: id === 'item-gravelerock' ? 10 : 1 };
}
/** @param {Readonly<Source>} source @returns {import('../../contracts/campaign.js').RewardBundle} */
export function promisedBronzeReward(source) {
  const rankIndex = source.missionType === 2 ? BRONZE.rankIndex : 0;
  const kind = source.rewardType % 4, area = source.rewardType === 8;
  return { money: !area && kind < 2 ? (rankIndex+1)*(source.rewardType < 4 ? 100 : 200) : 0,
    rankPoints: source.missionType === 2 ? BRONZE.rankPoints : 5,
    items: !area && kind !== 0 ? [bronzeItemGrant(source.itemReward)] : [],
    friendAreaIds: area && source.friendAreaReward ? [source.friendAreaReward] : [],recruitGrantIds: [] };
}
// Only Minun occurs in the finite exclusive table, and it is already Blue
// available. Examine both native thanks identities before claim; never forge
// comparative Red flags or assume later exclusive species are already open.
/** @param {Readonly<Job>} job */
export function prepareBronzeClientThanks(job) {
  const goal = job.goal;
  const people = [goal.client,...(goal.kind === 'escort' ? [goal.recipient] : goal.kind === 'find-pokemon' ? [goal.target] : [])];
  for (const person of people) {
    if (!FACTS.eligibleSeenSpecies.includes(person.identity.speciesId) && ![FACTS.fallbackClient,FACTS.fallbackTarget].includes(person.identity.speciesId)) return blocked('mission-exclusive-pool-owner');
    const row = BRONZE.eligibleExclusiveSpecies.find(row => row.speciesId === person.identity.speciesId);
    if (row && !row.alreadyBlueAvailable) return blocked('mission-exclusive-species-unlock-owner');
  }
  return goal.client;
}
/** All extra samples/rejections occur once before reward prefix or overflow.
 * @param {State} state @param {Readonly<Source>} source */
export function prepareBronzeReward(state,source) {
  const reward = promisedBronzeReward(source);
  const count = source.rewardType === 3 ? 2 : source.rewardType === 7 ? 3 : reward.items.length;
  let attempts = 0;
  while (reward.items.length < count) {
    if (++attempts > 4096) return blocked('bronze-extra-rejection-bound');
    const id = bronzeRewardItem(state,source.missionType);
    if (!reward.items.some(row => row.template.itemId === id)) reward.items.push(bronzeItemGrant(id));
  }
  return reward;
}
/** @param {string} speciesId */
const person = speciesId => ({ identity: { speciesId: /** @type {import('../../contracts.js').SpeciesId} */ (speciesId),formId: null },nickname: null });
/** @param {State} state @param {Generated} raw @param {'board'|'mailbox'} posting @returns {Job} */
export function createBronzeJobRecord(state,raw,posting) {
  const route = FACTS.routes.find(row => row.dungeonId === raw.dungeonId);
  if (!route || !route.floorNumbers.includes(raw.floor) || route.excludedFloorNumbers.includes(raw.floor)) return blocked('bronze-job-source-route');
  const destination = /** @type {import('../../contracts/campaign.js').FloorAddress} */ ({ dungeonId: raw.dungeonId,sectionId: raw.dungeonId,floorId: `${raw.dungeonId}-floor-${String(raw.floor).padStart(2,'0')}` });
  const client = person(raw.clientSpecies);
  /** @type {Job['goal']} */ const goal = raw.missionType === 0 ? { kind: 'rescue',client,destination }
    : raw.missionType === 1 ? { kind: 'find-pokemon',client,target: person(raw.targetSpecies),destination }
      : raw.missionType === 2 ? { kind: 'escort',client,recipient: person(raw.targetSpecies),destination }
      : { kind: raw.missionType === 3 ? 'retrieve-item' : 'deliver-item',client,destination,itemId: /** @type {import('../../contracts.js').ItemId} */ (raw.targetItem),quantity: 1 };
  /** @type {Source} */ const source = { kind: 'generated',generationPolicyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ (BRONZE_JOB_POLICY),posting,generatedDay: state.town.day,generatedRevision: state.revision+1,seed: raw.seed,missionType: raw.missionType,targetItem: /** @type {import('../../contracts.js').ItemId} */ (raw.targetItem),itemReward: /** @type {import('../../contracts.js').ItemId} */ (raw.itemReward),rewardType: raw.rewardType,unk2: raw.unk2,friendAreaReward: /** @type {import('../../contracts/campaign.js').FriendAreaId|null} */ (raw.friendAreaReward) };
  return /** @type {Job} */ (/** @type {unknown} */ ({ jobId: allocate(state,'job'),source,goal,difficultyId: `native-mission-difficulty-${raw.missionType === 2 ? 3 : 1}`,reward: promisedBronzeReward(source),phase: { kind: 'offered',offeredDay: state.town.day,expiryDay: null } }));
}
/** Complete native candidates, including suspended accepted copies. The board
 * is intentionally absent from the reward8 suppression scan.
 * @param {State} state @param {Readonly<Work>} work */
export function drawMailFriendArea(state,work) {
  const ids = [...work.mailbox.flatMap(row => row.kind === 'job' ? [row.jobId] : []),...state.progress.acceptedJobIds];
  const suppressed = ids.some(id => {
    const job = state.progress.jobs[id];
    return job && isBronzeJob(job) && bronzeJob(job).source.rewardType === 8;
  });
  const candidates = suppressed ? [] : BRONZE.mailAreas.filter(row => !state.economy.ownedFriendAreaIds.some(id => id === row.id));
  return candidates.length ? candidates[draw(state,candidates.length,'jobsRewards')]?.id ?? blocked('mail-area-source') : null;
}
/** Prospective owner only: the dispatch keeps MAIN5,7 refresh held until the
 * separately reviewed guest lifecycle admits a genuine next outing.
 * @param {State} state @param {Work} work */
export function refreshBronzeBoard(state,work) {
  for (const id of work.boardJobIds) if (state.progress.jobs[id]?.phase.kind === 'offered') delete state.progress.jobs[id];
  work.boardJobIds = [];
  for (const raw of generateBronzeBoard(state,steelMeaniesOccupancy(state,work))) {
    const job = createBronzeJobRecord(state,raw,'board'); state.progress.jobs[job.jobId] = job; work.boardJobIds.push(job.jobId);
  }
}
/** @param {State} state @param {Work} work */
export function refreshBronzeGround(state,work) { refreshBronzeBoard(state,work); if (nextEarlyNews(work) !== 0) work.mailPending = true; }
/** Native regular issue0–49 opens under Maze14 at MAIN5,7. No special/postgame
 * issue is added here. Existing queued/full-mail/read/pending state stays owned.
 * @param {State} state @param {Work} work */
export function deliverBronzeMailbox(state,work) {
  let count = work.mailbox.length;
  const index = count === 4 ? 4 : count+draw(state,4-count,'jobsRewards');
  if (count >= 4 || !work.mailPending) return false;
  work.mailPending = false;
  let delivered = false;
  const news = nextEarlyNews(work);
  if (news <= 49) { work.mailbox.push({ kind: 'news',newsId: news }); count++; delivered = true; }
  for (; count <= index; count++) {
    const raw = generateBronzeJob(state,steelMeaniesOccupancy(state,work)); if (!raw) break;
    let area = drawMailFriendArea(state,work);
    if (raw.missionType !== 2) area = null;
    const reward = 4+draw(state,5,'jobsRewards');
    const rewardType = /** @type {4|5|6|7|8} */ (reward === 8 && !area ? 4 : reward);
    const job = createBronzeJobRecord(state,{ ...raw,rewardType,friendAreaReward: rewardType === 8 ? area : null },'mailbox');
    state.progress.jobs[job.jobId] = job; work.mailbox.push({ kind: 'job',jobId: job.jobId }); delivered = true;
  }
  work.mailbox.sort((a,b) => {
    if (a.kind === 'news') return b.kind === 'news' ? a.newsId-b.newsId : 1;
    if (b.kind === 'news') return -1;
    const left = state.progress.jobs[a.jobId],right = state.progress.jobs[b.jobId];
    if (!left || !right) return blocked('mailbox-sort-reference');
    return compareJobLocations(left,right);
  });
  return delivered;
}
/** Native Take6 conflict scans only other taken copies. Candidate escort blocks
 * another escort anywhere on the same route; candidate ordinary uses its exact
 * floor, even against an escort. Capacity8 and suspended acceptance stay shared.
 * @param {State} state @param {Work} work @param {import('../../contracts.js').JobId} jobId
 * @param {'accept'|'take'|'suspend'|'delete'} operation */
export function changeBronzeJobSelection(state,work,jobId,operation) {
  const candidate = state.progress.jobs[jobId];
  if (!candidate) return false;
  if (operation === 'take') for (const id of state.progress.acceptedJobIds) {
    const other = state.progress.jobs[id];
    if (id === jobId || !other || other.phase.kind !== 'accepted') continue;
    if (other.goal.destination.dungeonId === candidate.goal.destination.dungeonId && (candidate.goal.kind === 'escort' && other.goal.kind === 'escort' || other.goal.destination.floorId === candidate.goal.destination.floorId)) return false;
  }
  if (!changeJobSelection(state,work,jobId,operation)) return false;
  state.progress.acceptedJobIds.sort((a,b) => {
    const left = state.progress.jobs[a],right = state.progress.jobs[b];
    if (!left || !right) return blocked('accepted-job-sort-reference');
    return compareJobLocations(left,right);
  });
  return true;
}
/** Persist money→area prefix before any toolbox/storage overflow. The exact
 * prefix revision prevents replay; a real mission receipt extends area ownership
 * without a fake purchase. Already owned promise compensates1000 once.
 * @param {import('../turns/types.js').MutationContext} context @param {Job} job */
export function applyBronzeRewardPrefix(context,job) {
  const state = context.state,work = state.earlyWork,prepared = work?.reward;
  if (!prepared || prepared.jobId !== job.jobId || !isBronzeJob(job) || job.phase.kind !== 'reward-ready' || work?.returned?.jobIds[work.returned.cursor] !== job.jobId) return blocked('bronze-reward-prefix-owner');
  if (prepared.unpaidPrefix !== undefined) return blocked('bronze-reward-unpaid-prefix');
  if (prepared.prefixAppliedRevision !== undefined) return;
  state.economy.carriedMoney = Math.min(99999,state.economy.carriedMoney+job.reward.money);
  for (const areaId of job.reward.friendAreaIds) {
    if (!state.friends || !BRONZE.mailAreas.some(row => row.id === areaId)) return blocked('bronze-area-reward-owner');
    const receipts = state.friends.missionAreaRewards ?? [];
    if (receipts.some(row => row.jobId === job.jobId)) return blocked('bronze-area-reward-replay');
    const owned = state.economy.ownedFriendAreaIds.includes(areaId);
    if (owned) state.economy.carriedMoney = Math.min(99999,state.economy.carriedMoney+1000);
    else state.economy.ownedFriendAreaIds.push(areaId);
    receipts.push({ jobId: job.jobId,areaId,revision: state.revision+1,day: state.town.day,outcome: owned ? 'already-owned-money' : 'unlocked' });
    state.friends.missionAreaRewards = receipts;
  }
  prepared.prefixAppliedRevision = state.revision+1;
}
