import { FRIEND_JOB_FACTS as FACTS } from '../../../content/authored/friend-job-facts.js';
import { createJobRecord, jobOccupancy, compareJobLocations } from './friend-job-records.js';
import { generateEarlyJob } from './friend-job-generation.js';
import { nextEarlyNews, changeJobSelection } from './job-records.js';
import { draw, blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/early-work.js').EarlyWorkState} Work */
/** Same native fill/reward/news order as the frozen early consumer, using the
 * full post-Steel location/seen/favorite facts. Maze14/special news and Friend
 * Area rewards remain ineligible at the proven MAIN5,5 Normal rank boundary.
 * @param {State} state @param {Work} work @returns {boolean} */
export function deliverChapterMailbox(state, work) {
  let count = work.mailbox.length;
  const index = count === 4 ? 4 : count + draw(state,4-count,'jobsRewards');
  if (count >= 4 || !work.mailPending) return false;
  work.mailPending = false;
  let delivered = false;
  const news = nextEarlyNews(work);
  if (news <= 2) { work.mailbox.push({ kind: 'news',newsId: news }); count++; delivered = true; }
  for (; count <= index; count++) {
    const raw = generateEarlyJob(state,jobOccupancy(state,work)); if (!raw) break;
    draw(state,FACTS.unownedNativeMailAreaIds.length,'jobsRewards');
    const reward = 4 + draw(state,5,'jobsRewards');
    const job = createJobRecord(state,{ ...raw,rewardType: /** @type {4|5|6|7} */ (reward === 8 ? 4 : reward) },'mailbox');
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
/** Old selection mutations/draws remain exact; the successor retains the full
 * native Tiny/Cave/Steel comparator after accepting any posting.
 * @param {State} state @param {Work} work @param {import('../../contracts.js').JobId} jobId
 * @param {'accept'|'take'|'suspend'|'delete'} operation */
export function changeChapterJobSelection(state,work,jobId,operation) {
  if (!changeJobSelection(state,work,jobId,operation)) return false;
  state.progress.acceptedJobIds.sort((a,b) => {
    const left = state.progress.jobs[a],right = state.progress.jobs[b];
    if (!left || !right) return blocked('accepted-job-sort-reference');
    return compareJobLocations(left,right);
  });
  return true;
}
