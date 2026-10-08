import { FRIEND_JOB_FACTS as FACTS } from '../../../content/authored/friend-job-facts.js';
import { MEANIES_POLICY, MEANIES_POSTING, POSTING_CURSOR } from '../../../content/authored/steel-meanies.js';
import { FRIENDS } from '../../../content/authored/friends.js';
import { earlyRewardItem } from './job-generation.js';
import { compareJobLocations, promisedJobReward, jobOccupancy, createJobRecord } from './friend-job-records.js';
import { generateEarlyBoard } from './friend-job-generation.js';
import { nextEarlyNews } from './job-records.js';
import { allocate, draw, blocked } from './support.js';
/** Exact factual identity; the successor separately checks scene and lifecycle.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot['progress']['jobs'][string]} job */
export function isScriptedPidgey(job) {
  const source = job.source, goal = job.goal, route = FACTS.routes.find(row => row.dungeonId === 'mt-steel');
  return source.kind === 'generated' && source.generationPolicyId === MEANIES_POLICY && 'posting' in source && source.posting === 'mailbox' && source.missionType === 0 && source.rewardType === 4 && source.seed >= 0 && source.seed <= 0xffffff && route?.targetItemIds.includes(source.targetItem) && source.targetItem !== source.itemReward && FACTS.rewardItems.some(row => row.itemId === source.itemReward) && goal.kind === 'rescue' && goal.client.identity.speciesId === 'pokemon-016' && goal.client.identity.formId === null && goal.client.nickname === null && goal.destination.dungeonId === 'mt-steel' && goal.destination.sectionId === 'mt-steel' && goal.destination.floorId === 'mt-steel-floor-03' && job.difficultyId === 'native-mission-difficulty-1' && job.reward.money === 200 && job.reward.rankPoints === 5 && job.reward.items.length === 0 && job.reward.friendAreaIds.length === 0 && job.reward.recruitGrantIds.length === 0;
}
/** Exact op6, no ordinary generation or ground refresh. Cursor and posting
 * receipt persist the transaction before another acknowledgement is possible.
 * @param {import('../../contracts/campaign.js').CampaignState} state */
export function postMeaniesMail(state) {
  const work = state.earlyWork;
  if (!work || state.friends?.phase !== 'meanies' || !state.pendingScene || state.pendingScene.sceneId !== FRIENDS.scenes[6] || state.pendingScene.cursor !== POSTING_CURSOR-1 || state.progress.native.scenarios.MAIN.chapter !== 5 || state.progress.native.scenarios.MAIN.step !== 6 || state.progress.appliedGrants.some(row => row.grantId === MEANIES_POSTING)) return blocked('meanies-posting-replay');
  for (const slot of work.mailbox) if (slot.kind === 'job') {
    const job = state.progress.jobs[slot.jobId];
    if (job?.phase.kind === 'offered' && !state.progress.acceptedJobIds.includes(slot.jobId) && !work.boardJobIds.includes(slot.jobId)) delete state.progress.jobs[slot.jobId];
  }
  work.mailbox = work.mailbox.filter(slot => slot.kind === 'news');
  const seed = draw(state,0x100000000,'jobsRewards') & 0xffffff;
  const route = FACTS.routes.find(row => row.dungeonId === 'mt-steel'); if (!route) return blocked('meanies-target-mask');
  const targetItem = route.targetItemIds[draw(state,route.targetItemIds.length,'jobsRewards')]; if (!targetItem) return blocked('meanies-target-mask');
  let itemReward = earlyRewardItem(state), attempts = 0;
  while (itemReward === targetItem) {
    if (++attempts > 4096) return blocked('meanies-reward-rejection-bound');
    itemReward = earlyRewardItem(state);
  }
  /** @type {import('../../contracts/early-work.js').EarlyJob['source']} */
  const source = { kind: 'generated', generationPolicyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ (MEANIES_POLICY), posting: 'mailbox', generatedDay: state.town.day, seed, missionType: 0, targetItem: /** @type {import('../../contracts.js').ItemId} */ (targetItem), itemReward: /** @type {import('../../contracts.js').ItemId} */ (itemReward), rewardType: 4 };
  const jobId = allocate(state,'job');
  state.progress.jobs[jobId] = { jobId, source, goal: { kind: 'rescue', client: { identity: { speciesId: /** @type {import('../../contracts.js').SpeciesId} */ ('pokemon-016'),formId: null }, nickname: null }, destination: { dungeonId: /** @type {import('../../contracts.js').DungeonId} */ ('mt-steel'), sectionId: /** @type {import('../../contracts/campaign.js').SectionId} */ ('mt-steel'), floorId: /** @type {import('../../contracts/campaign.js').FloorId} */ ('mt-steel-floor-03') } }, difficultyId: 'native-mission-difficulty-1', reward: promisedJobReward(source), phase: { kind: 'offered',offeredDay: state.town.day,expiryDay: null } };
  work.mailbox.push({ kind: 'job',jobId });
  work.mailbox.sort((a,b) => {
    if (a.kind === 'news') return b.kind === 'news' ? a.newsId-b.newsId : 1;
    if (b.kind === 'news') return -1;
    const left = state.progress.jobs[a.jobId],right = state.progress.jobs[b.jobId]; if (!left || !right) return blocked('meanies-sort-reference');
    return compareJobLocations(left,right);
  });
  state.progress.appliedGrants.push({ grantId: MEANIES_POSTING,revision: state.revision+1,day: state.town.day });
}
/** Only the exact proven scripted owner can occupy3F. Random floor candidates
 * and their full rejection draws remain unchanged.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state
 * @param {Readonly<import('../../contracts/early-work.js').EarlyWorkState>} work */
export function steelMeaniesOccupancy(state,work) {
  const receipt = state.progress.appliedGrants.find(row => row.grantId === MEANIES_POSTING);
  const sceneOwned = !!state.progress.seenScenes[FRIENDS.scenes[6] ?? ''] || state.pendingScene && state.pendingScene.sceneId === FRIENDS.scenes[6] && state.pendingScene.cursor >= POSTING_CURSOR;
  const scripted = new Set(Object.values(state.progress.jobs).filter(job => isScriptedPidgey(job) && job.source.kind === 'generated' && 'generatedDay' in job.source && job.source.generatedDay === receipt?.day && sceneOwned && ['offered','accepted','suspended'].includes(job.phase.kind)).map(job => job.jobId));
  const rows = jobOccupancy({ ...state,progress: { ...state.progress,acceptedJobIds: state.progress.acceptedJobIds.filter(id => !scripted.has(id)) } },{ ...work,boardJobIds: work.boardJobIds.filter(id => !scripted.has(id)),mailbox: work.mailbox.filter(slot => slot.kind !== 'job' || !scripted.has(slot.jobId)) });
  if ([...work.mailbox.flatMap(slot => slot.kind === 'job' ? [slot.jobId] : []),...state.progress.acceptedJobIds].some(id => scripted.has(id))) rows.push({ dungeonId: 'mt-steel',floor: 3,escort: false });
  return rows;
}
/** Same ordinary generator/cleanup; only the exact scripted occupancy extends.
 * Bronze draws remain unfiltered and fail honestly until their owner is ready.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {import('../../contracts/early-work.js').EarlyWorkState} work */
export function refreshSteelMeaniesBoard(state,work) {
  for (const id of work.boardJobIds) if (state.progress.jobs[id]?.phase.kind === 'offered') delete state.progress.jobs[id];
  work.boardJobIds = [];
  for (const raw of generateEarlyBoard(state,steelMeaniesOccupancy(state,work))) {
    const job = createJobRecord(state,raw,'board'); state.progress.jobs[job.jobId] = job; work.boardJobIds.push(job.jobId);
  }
}
/** @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {import('../../contracts/early-work.js').EarlyWorkState} work */
export function refreshSteelMeaniesGround(state,work) {
  refreshSteelMeaniesBoard(state,work);
  if (nextEarlyNews(work) !== 0) work.mailPending = true;
}
