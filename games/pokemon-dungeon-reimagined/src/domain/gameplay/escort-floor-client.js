import { floorJobClient } from './job-objectives.js';
import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { blocked } from './support.js';
/** Native escort floor target is independent recipientSpecies, not the actual
 * team guest's client species. Other real objectives keep their primitive owner.
 * @param {import('../../contracts/campaign.js').CampaignSnapshot} state @param {string} floorId */
export function escortFloorJobClient(state,floorId) {
  if (state.contentRevision !== ESCORT_WORK_REVISION) return floorJobClient(state,floorId);
  const session = state.session; if (session?.purpose.kind !== 'ordinary') return null;
  const jobs = state.progress.acceptedJobIds.flatMap(id => { const job = state.progress.jobs[id]; return job?.phase.kind === 'active' && job.phase.sessionId === session.sessionId && job.goal.destination.floorId === floorId && job.goal.kind !== 'retrieve-item' ? [job] : []; });
  if (jobs.length > 1) return blocked('conflicting-floor-jobs');
  const job = jobs[0];
  return job?.goal.kind === 'escort' ? { jobId: job.jobId,identity: { ...job.goal.recipient.identity } } : floorJobClient(state,floorId);
}
