import { createBronzeJobRecord, drawMailFriendArea } from './bronze-job-records.js';
import { generateBronzeBoard, generateBronzeJob } from './bronze-job-generation.js';
import { jobOccupancy, compareJobLocations } from './friend-job-records.js';
import { nextEarlyNews } from './job-records.js';
import { isScriptedPidgey } from './steel-meanies-mail.js';
import { MEANIES_POSTING } from '../../../content/authored/steel-meanies.js';
import { FRIENDS } from '../../../content/authored/friends.js';
import { draw, blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('../../contracts/early-work.js').EarlyWorkState} Work */
/** Real native occupancy still includes completed8 before successful station
 * cleanup. The old scripted3F exception therefore survives active/completed/
 * reward-ready phases as well as its original posting and taken copies.
 * @param {Snapshot} state @param {Readonly<Work>} work */
export function escortWorkOccupancy(state,work) {
  const receipt = state.progress.appliedGrants.find(row => row.grantId === MEANIES_POSTING),encounter = state.progress.seenScenes[FRIENDS.scenes[6] ?? ''];
  const ids = [...new Set([...work.boardJobIds,...work.mailbox.flatMap(row => row.kind === 'job' ? [row.jobId] : []),...state.progress.acceptedJobIds])];
  const scripted = new Set(ids.filter(id => {
    const job = state.progress.jobs[id];
    return job && isScriptedPidgey(job) && job.source.kind === 'generated' && 'generatedDay' in job.source && job.source.generatedDay === receipt?.day && encounter && encounter.lastRevision > (receipt?.revision ?? state.revision) && ['offered','accepted','suspended','active','objective-complete','reward-ready'].includes(job.phase.kind);
  }));
  const rows = jobOccupancy({ ...state,progress: { ...state.progress,acceptedJobIds: state.progress.acceptedJobIds.filter(id => !scripted.has(id)) } },{ ...work,boardJobIds: work.boardJobIds.filter(id => !scripted.has(id)),mailbox: work.mailbox.filter(row => row.kind !== 'job' || !scripted.has(row.jobId)) });
  if (scripted.size > 1) return blocked('duplicate-scripted-pidgey');
  if (scripted.size) rows.push({ dungeonId: 'mt-steel',floor: 3,escort: false });
  return rows;
}
/** Prospective owner only: the dispatch keeps MAIN5,7 refresh held until the
 * separately reviewed guest lifecycle admits a genuine next outing.
 * @param {State} state @param {Work} work */
export function refreshEscortBoard(state,work) {
  for (const id of work.boardJobIds) if (state.progress.jobs[id]?.phase.kind === 'offered') delete state.progress.jobs[id];
  work.boardJobIds = [];
  for (const raw of generateBronzeBoard(state,escortWorkOccupancy(state,work))) {
    const job = createBronzeJobRecord(state,raw,'board'); state.progress.jobs[job.jobId] = job; work.boardJobIds.push(job.jobId);
  }
}
/** @param {State} state @param {Work} work */
export function refreshEscortJobs(state,work) { refreshEscortBoard(state,work); if (nextEarlyNews(work) !== 0) work.mailPending = true; }
/** Native regular issue0–49 opens under Maze14 at MAIN5,7. No special/postgame
 * issue is added here. Existing queued/full-mail/read/pending state stays owned.
 * @param {State} state @param {Work} work */
export function deliverEscortMailbox(state,work) {
  let count = work.mailbox.length;
  const index = count === 4 ? 4 : count+draw(state,4-count,'jobsRewards');
  if (count >= 4 || !work.mailPending) return false;
  work.mailPending = false;
  let delivered = false;
  const news = nextEarlyNews(work);
  if (news <= 49) { work.mailbox.push({ kind: 'news',newsId: news }); count++; delivered = true; }
  for (; count <= index; count++) {
    const raw = generateBronzeJob(state,escortWorkOccupancy(state,work)); if (!raw) break;
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
