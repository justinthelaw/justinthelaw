import { interactableEscortWorkClient as interactableJobClient } from '../../src/domain/gameplay/escort-job-interaction.js';
import { escortUnpaidPrefixProblem } from '../../src/domain/state/escort-work-prefix.js';
import { FRIENDS } from '../authored/friends.js';
import { rewardItemRoute } from '../../src/domain/gameplay/reward-items.js';
import { FRIEND_JOB_FACTS as FACTS } from '../authored/friend-job-facts.js';
import { compareJobLocations } from '../../src/domain/gameplay/friend-job-records.js';
import { diagnostics, bounded } from './pokemon-rules.js';
/** @param {import('../../src/contracts/campaign.js').CampaignState} state
 * @param {import('./campaign.js').CampaignCatalogs} catalogs */
export function checkEscortStationOwners(state, catalogs) {
  const r = diagnostics(), work = state.earlyWork;
  const newsMaximum = state.progress.seenScenes[FRIENDS.scenes[6] ?? ''] ? 49 : 2;
  if (!work) { r.check(false, '/earlyWork', 'Ordinary work requires its persisted owners.'); return r.result(); }
  r.check(work.startedRevision > 0 && work.startedRevision <= state.revision && work.storyExpeditions >= 2 && work.storyExpeditions <= state.progress.statistics.expeditions, '', 'Work begins after the two story rescues with an explicit revision and expedition baseline.');
  r.check(work.boardJobIds.length <= 8 && new Set(work.boardJobIds).size === work.boardJobIds.length && work.mailbox.length <= 4 && new Set(work.newsRead).size === work.newsRead.length && work.newsRead.includes(0) && work.newsRead.every(id => bounded(id,0,newsMaximum)), '', 'Board, mailbox and read news stay within the current source interval.');
  const mailJobs = work.mailbox.flatMap(row => row.kind === 'job' ? [row.jobId] : []), news = work.mailbox.flatMap(row => row.kind === 'news' ? [row.newsId] : []);
  r.check(new Set(mailJobs).size === mailJobs.length && new Set(news).size === news.length && news.every(id => bounded(id,1,newsMaximum) && !work.newsRead.includes(id)), '/mailbox', 'Mailbox keeps unique unread source regular newsletters and job references.');
  for (const [ids, posting] of [[work.boardJobIds, 'board'], [mailJobs, 'mailbox']]) {
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      const job = state.progress.jobs[id];
      r.check(job?.source.kind === 'generated' && 'posting' in job.source && job.source.posting === posting && (posting === 'board' ? ['offered','suspended','accepted'].includes(job.phase.kind) : job.phase.kind === 'offered'), '', 'Posting references retain their source and unexpired lifecycle.');
    }
  }
  r.check(state.progress.acceptedJobIds.length <= 8, '/acceptedJobIds', 'The job list has eight native slots.');
  const ids = [...new Set([...work.boardJobIds, ...mailJobs, ...state.progress.acceptedJobIds])];
  const active = ids.flatMap(id => state.progress.jobs[id] ?? []);
  r.check(active.length === ids.length && new Set(state.progress.acceptedJobIds).size === state.progress.acceptedJobIds.length,'/acceptedJobIds','All complete posting/accepted references resolve uniquely.');
  const taken = active.filter(job => ['accepted','active','objective-complete'].includes(job.phase.kind));
  const escorts = taken.filter(job => job.goal.kind === 'escort');
  r.check(new Set(escorts.map(job => job.goal.destination.dungeonId)).size === escorts.length,'/acceptedJobIds','At most one actual taken escort owns each dungeon through completion.');
  const locations = active.map(job => `${job.goal.destination.dungeonId}:${job.goal.destination.floorId}`);
  r.check(new Set(locations).size === locations.length, '/jobs', 'Distinct current postings/accepted copies cannot occupy the same source floor.');
  for (let index = 1; index < state.progress.acceptedJobIds.length; index++) {
    const left = state.progress.jobs[state.progress.acceptedJobIds[index - 1] ?? ''], right = state.progress.jobs[state.progress.acceptedJobIds[index] ?? ''];
    r.check(left && right && compareJobLocations(left, right) <= 0, '/acceptedJobIds', 'Accepted jobs retain native dungeon/floor order for reward priority.');
  }
  const returned = work.returned, reward = work.reward;
  if (returned) {
    r.check(state.mode === 'town' && !state.pendingScene && !work.clientPrompt && !state.session && FACTS.routes.some(row => row.dungeonId === returned.dungeonId) && returned.cursor >= 0 && returned.cursor <= returned.jobIds.length && new Set(returned.jobIds).size === returned.jobIds.length && (returned.outcome === 'success' || returned.jobIds.length === 0), '/returned', 'Only successful returns carry a bounded ordered station queue.');
    for (let i = 0; i < returned.jobIds.length; i++) {
      const job = state.progress.jobs[returned.jobIds[i] ?? ''];
      const preceding = state.progress.jobs[returned.jobIds[i - 1] ?? ''];
      r.check(job && job.goal.destination.dungeonId === returned.dungeonId && (!preceding || compareJobLocations(preceding, job) <= 0), '/returned/jobIds', 'Reward candidates retain their returned dungeon and native slot order.');
      r.check(job && (i < returned.cursor ? job.phase.kind === 'claimed' || job.phase.kind === 'accepted' && job.goal.kind === 'retrieve-item' : job.phase.kind === 'reward-ready' || job.phase.kind === 'accepted' && job.goal.kind === 'retrieve-item'), '/returned/jobIds', 'Station cursor separates processed claims/skipped finds from pending eligible requests.');
    }
  }
  r.check(!reward || returned?.outcome === 'success','/reward','Prepared rewards require a genuine successful return.');
  if (reward) {
    const job = state.progress.jobs[reward.jobId], grant = job?.reward.items[reward.nextItem];
    r.check(returned?.jobIds[returned.cursor] === reward.jobId && job?.phase.kind === 'reward-ready' && reward.preparedRevision > 0 && reward.preparedRevision <= state.revision && reward.nextItem >= 0 && reward.nextItem < (job?.reward.items.length ?? 0), '/reward', 'An overflow pause owns one prepared bundle and its next undelivered slot.');
    if (reward.prefixAppliedRevision !== undefined) r.check(reward.unpaidPrefix === undefined && bounded(reward.prefixAppliedRevision,reward.preparedRevision,state.revision),'/reward/prefixAppliedRevision','Actual applied prefix is exclusive and committed before this item pause.');
    else r.check(reward.unpaidPrefix !== undefined && escortUnpaidPrefixProblem(state) === null,'/reward/unpaidPrefix','Only genuine unchanged original-envelope conversion debt can own an unpaid pause.');
    r.check(grant && rewardItemRoute(state, grant) === 'choice', '/reward', 'A persisted reward pause requires a real full-toolbox/full-storage choice.');
  }
  if (work.clientPrompt) {
    const session = state.session, actor = session?.actors[work.clientPrompt.actorId], job = actor?.binding.kind === 'job-client' ? state.progress.jobs[actor.binding.jobId] : null;
    if (work.clientPrompt.stage === 'rescue') {
      if (!catalogs.navigation) r.need('P11:navigation-catalog');
      else r.check(interactableJobClient(state, { ...catalogs, navigation: catalogs.navigation })?.actorId === work.clientPrompt.actorId, '/clientPrompt', 'A rescue prompt retains its eligible client on the current leader-facing tile at the input boundary.');
    }
    r.check(!returned && !reward && !state.pendingResult && state.mode === 'dungeon' && session?.purpose.kind === 'ordinary' && session.scheduler.kind === 'ready' && actor?.binding.kind === 'job-client' && (work.clientPrompt.stage === 'rescue' ? actor.placement.kind === 'map' && job?.phase.kind === 'active' : actor.placement.kind === 'off-map' && actor.placement.reason === 'rescued' && job?.phase.kind === 'objective-complete'), '/clientPrompt', 'No-turn dialogue owns its live confirmation or rescued-client exit loop.');
  }
  return r.result();
}
