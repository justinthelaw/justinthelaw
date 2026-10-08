import { checkMeaniesOwners } from './steel-meanies-owners.js';
import { checkBronzeJob } from './bronze-jobs.js';
import { workJobPolicy as friendJobPolicy } from './friend-jobs.js';
import { workJobPolicy as earlyJobPolicy } from './work-jobs.js';
import { BRONZE_JOB_POLICY } from '../../src/domain/state/bronze-jobs-revision.js';
import { MEANIES_POLICY, MEANIES_POSTING } from '../authored/steel-meanies.js';
import { FRIENDS } from '../authored/friends.js';
import { isScriptedPidgey } from '../../src/domain/gameplay/steel-meanies-mail.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { steelAppend as append } from './steel-progress.js';
/** Direct source-specific job callbacks. Whole second-work progress must still
 * prove every historical interval/scene/count; a job label cannot replace it.
 * @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @type {Policies['job']} */
const unsupported = () => { const r = diagnostics(); r.check(false,'/source','No exact source owner for this ordinary request.'); return r.result(); };
const inherited = friendJobPolicy(/** @type {Policies} */ (/** @type {unknown} */ ({ job: earlyJobPolicy(/** @type {Policies} */ (/** @type {unknown} */ ({ job: unsupported }))) })));
/** The original Pidgey can remain offered beside new mail, be taken/suspended,
 * enter an actual later outing, finish its station, or record a real lost return.
 * Its source, seed, reward and original posting receipt are never relabeled.
 * @param {import('../../src/contracts/campaign.js').JobRecord} job @param {State} state */
export function checkEscortPidgey(job,state) {
  const r = diagnostics(),source = job.source,phase = job.phase,work = state.earlyWork;
  const receipts = state.progress.appliedGrants.filter(row => row.grantId === MEANIES_POSTING),receipt = receipts[0];
  const encounter = state.progress.seenScenes[FRIENDS.scenes[6] ?? ''];
  r.check(isScriptedPidgey(job) && receipts.length === 1 && source.kind === 'generated' && 'generatedDay' in source && source.generatedDay === receipt?.day && encounter && encounter.firstDay === receipt?.day && encounter.lastDay === receipt?.day && encounter.firstRevision === encounter.lastRevision && encounter.count === 1 && encounter.lastRevision > (receipt?.revision ?? state.revision) && encounter.lastDay <= state.town.day && !work?.boardJobIds.includes(job.jobId),'/source','The unchanged scripted Pidgey is tied to its actual original op6 and completed encounter, even on later days.');
  const after = receipt?.revision ?? state.revision,accepted = state.progress.acceptedJobIds.includes(job.jobId),mailed = work?.mailbox.some(row => row.kind === 'job' && row.jobId === job.jobId);
  if (phase.kind === 'offered') r.check(phase.offeredDay === receipt?.day && phase.expiryDay === null && mailed && !accepted,'/phase','The old Pidgey offer retains its actual original mailbox slot alongside new letters.');
  else {
    r.check(!mailed,'/phase','An accepted or historical Pidgey has no detached duplicate mailbox offer.');
    if (phase.kind === 'accepted' || phase.kind === 'suspended') r.check(accepted && bounded(phase.acceptedRevision,after+1,state.revision),'/phase','Pidgey Take/Suspend preserves its actual acceptance revision.');
    else if (phase.kind === 'active' || phase.kind === 'objective-complete') r.check(accepted && state.session?.purpose.kind === 'ordinary' && state.session.dungeonId === 'mt-steel' && state.session.entry.entryRevision > (encounter?.lastRevision ?? state.revision) && phase.sessionId === state.session.sessionId && (phase.kind !== 'objective-complete' || bounded(phase.completedRevision,state.session.entry.entryRevision+1,state.revision)),'/phase','Pidgey activation/completion belongs to its actual later Steel expedition.');
    else if (phase.kind === 'reward-ready') r.check(accepted && work?.returned?.outcome === 'success' && work.returned.dungeonId === 'mt-steel' && work.returned.jobIds.includes(job.jobId) && bounded(phase.completedRevision,(encounter?.lastRevision ?? state.revision)+1,state.revision),'/phase','Pidgey reward is owned by the real successful Steel station.');
    else if (phase.kind === 'claimed') r.check(!accepted && bounded(phase.claimedRevision,(encounter?.lastRevision ?? state.revision)+1,state.revision),'/phase','Only the complete later station claim retires Pidgey and grants its original five points.');
    else r.check(!accepted && phase.reasonId === 'native-completed-job-lost-return' && bounded(phase.failedRevision,(encounter?.lastRevision ?? state.revision)+1,state.revision),'/phase','Completed Pidgey lost before return records failure without reward.');
  }
  return r.result();
}
/** @type {Policies['job']} */
export function checkEscortJob(job,state) {
  const r = diagnostics(),source = job.source;
  if (source.kind !== 'generated' || !('posting' in source)) return unsupported(job,state);
  append(r,source.generationPolicyId === BRONZE_JOB_POLICY ? checkBronzeJob(job,state) : source.generationPolicyId === MEANIES_POLICY ? state.friends?.phase === 'meanies' ? checkMeaniesOwners(state) : checkEscortPidgey(job,state) : inherited(job,state));
  const accepted = state.progress.acceptedJobIds.includes(job.jobId),phase = job.phase;
  r.check(accepted === ['suspended','accepted','active','objective-complete','reward-ready'].includes(phase.kind),'/phase','The complete accepted list and actual source lifecycle agree in every interval.');
  if (phase.kind === 'reward-ready') r.check(state.earlyWork?.returned?.outcome === 'success','/phase','All source rewards require a genuine successful return.');
  return r.result();
}
