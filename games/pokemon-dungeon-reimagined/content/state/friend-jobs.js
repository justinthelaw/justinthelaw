import { interactableJobClient } from '../../src/domain/gameplay/job-interaction.js';
import { rewardItemRoute } from '../../src/domain/gameplay/reward-items.js';
import { FRIEND_JOB_FACTS as FACTS } from '../authored/friend-job-facts.js';
import { promisedJobReward, compareJobLocations } from '../../src/domain/gameplay/friend-job-records.js';
import { diagnostics } from './pokemon-rules.js';
import { fingerprint } from '../../src/domain/state/relations.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {unknown} a @param {unknown} b */ const same = (a,b) => fingerprint(a) === fingerprint(b);
/** @param {import('../../src/contracts/campaign.js').CampaignState} state
 * @param {import('./campaign.js').CampaignCatalogs} catalogs */
export function checkWorkOwners(state, catalogs) {
  const r = diagnostics(), work = state.earlyWork;
  if (!work) { r.check(false, '/earlyWork', 'Ordinary work requires its persisted owners.'); return r.result(); }
  r.check(work.startedRevision > 0 && work.startedRevision <= state.revision && work.storyExpeditions >= 2 && work.storyExpeditions <= state.progress.statistics.expeditions, '', 'Work begins after the two story rescues with an explicit revision and expedition baseline.');
  r.check(work.boardJobIds.length <= 8 && new Set(work.boardJobIds).size === work.boardJobIds.length && work.mailbox.length <= 4 && new Set(work.newsRead).size === work.newsRead.length && work.newsRead.includes(0) && work.newsRead.every(id => [0,1,2].includes(id)), '', 'Board, mailbox and read news stay within the current source interval.');
  const mailJobs = work.mailbox.flatMap(row => row.kind === 'job' ? [row.jobId] : []), news = work.mailbox.flatMap(row => row.kind === 'news' ? [row.newsId] : []);
  r.check(new Set(mailJobs).size === mailJobs.length && new Set(news).size === news.length && news.every(id => [1,2].includes(id) && !work.newsRead.includes(id)), '/mailbox', 'Mailbox keeps unique unread early newsletters and job references.');
  for (const [ids, posting] of [[work.boardJobIds, 'board'], [mailJobs, 'mailbox']]) {
    if (!Array.isArray(ids)) continue;
    for (const id of ids) {
      const job = state.progress.jobs[id];
      r.check(job?.source.kind === 'generated' && 'posting' in job.source && job.source.posting === posting && (posting === 'board' ? ['offered','suspended','accepted'].includes(job.phase.kind) : job.phase.kind === 'offered'), '', 'Posting references retain their source and unexpired lifecycle.');
    }
  }
  r.check(state.progress.acceptedJobIds.length <= 8, '/acceptedJobIds', 'The job list has eight native slots.');
  const active = [...new Set([...work.boardJobIds, ...mailJobs, ...state.progress.acceptedJobIds])].flatMap(id => state.progress.jobs[id] ?? []);
  const locations = active.map(job => `${job.goal.destination.dungeonId}:${job.goal.destination.floorId}`);
  r.check(new Set(locations).size === locations.length, '/jobs', 'Distinct current postings/accepted copies cannot occupy the same source floor.');
  for (let index = 1; index < state.progress.acceptedJobIds.length; index++) {
    const left = state.progress.jobs[state.progress.acceptedJobIds[index - 1] ?? ''], right = state.progress.jobs[state.progress.acceptedJobIds[index] ?? ''];
    r.check(left && right && compareJobLocations(left, right) <= 0, '/acceptedJobIds', 'Accepted jobs retain native dungeon/floor order for reward priority.');
  }
  const returned = work.returned, reward = work.reward;
  if (returned) {
    r.check(!state.session && FACTS.routes.some(row => row.dungeonId === returned.dungeonId) && returned.cursor >= 0 && returned.cursor <= returned.jobIds.length && new Set(returned.jobIds).size === returned.jobIds.length && (returned.outcome === 'success' || returned.jobIds.length === 0), '/returned', 'Only successful returns carry a bounded ordered station queue.');
    for (let i = 0; i < returned.jobIds.length; i++) {
      const job = state.progress.jobs[returned.jobIds[i] ?? ''];
      const preceding = state.progress.jobs[returned.jobIds[i - 1] ?? ''];
      r.check(job && job.goal.destination.dungeonId === returned.dungeonId && (!preceding || compareJobLocations(preceding, job) <= 0), '/returned/jobIds', 'Reward candidates retain their returned dungeon and native slot order.');
      r.check(job && (i < returned.cursor ? job.phase.kind === 'claimed' || job.phase.kind === 'accepted' && job.goal.kind === 'retrieve-item' : job.phase.kind === 'reward-ready' || job.phase.kind === 'accepted' && job.goal.kind === 'retrieve-item'), '/returned/jobIds', 'Station cursor separates processed claims/skipped finds from pending eligible requests.');
    }
  }
  if (reward) {
    const job = state.progress.jobs[reward.jobId], grant = job?.reward.items[reward.nextItem];
    r.check(returned?.jobIds[returned.cursor] === reward.jobId && job?.phase.kind === 'reward-ready' && reward.preparedRevision > 0 && reward.preparedRevision <= state.revision && reward.nextItem >= 0 && reward.nextItem < (job?.reward.items.length ?? 0), '/reward', 'An overflow pause owns one prepared bundle and its next undelivered slot.');
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

/** @param {Policies} prior @returns {Policies['job']} */
export function workJobPolicy(prior) { return (job, state) => {
  if (!state.earlyWork || !state.friends || job.source.kind !== 'generated' || job.source.generationPolicyId !== 'browser-friend-native-jobs-v1') return prior.job(job, state);
  const r = diagnostics(), source = job.source, work = state.earlyWork;
  if (source.kind !== 'generated' || !('posting' in source)) { r.check(false, '/source', 'This interval admits only its native generated requests.'); return r.result(); }
  const goal = job.goal, route = FACTS.routes.find(row => row.dungeonId === goal.destination.dungeonId);
  const floor = Number(goal.destination.floorId.split('-').at(-1));
  r.check(source.generationPolicyId === 'browser-friend-native-jobs-v1' && source.generatedDay >= 2 && source.generatedDay <= state.town.day && source.seed >= 0 && source.seed <= 0xffffff && job.difficultyId === 'native-mission-difficulty-1', '/source', 'Generated requests retain exact source metadata and difficulty.');
  r.check(route && route.floorNumbers.includes(floor) && !route.excludedFloorNumbers.includes(floor) && goal.destination.sectionId === route.dungeonId && goal.destination.floorId === `${route.dungeonId}-floor-${String(floor).padStart(2,'0')}`, '/goal/destination', 'Destination joins a permitted native early mission floor.');
  const kinds = { 0: 'rescue', 1: 'find-pokemon', 3: 'retrieve-item', 4: 'deliver-item' };
  r.check(goal.kind === kinds[source.missionType] && route?.targetItemIds.includes(source.targetItem) && (source.itemReward !== source.targetItem || [3,4].includes(source.missionType) && FACTS.favoriteItems.some(([id,item]) => id === goal.client.identity.speciesId && item === source.targetItem)) && FACTS.rewardItems.some(row => row.itemId === source.itemReward), '/goal', 'Numeric mission, item mask and distinct promised reward retain their source joins.');
  if (goal.kind === 'retrieve-item' || goal.kind === 'deliver-item') r.check(goal.itemId === source.targetItem && goal.quantity === 1, '/goal', 'Early item requests consume one complete target slot.');
  const people = [goal.client, ...(goal.kind === 'find-pokemon' ? [goal.target] : [])];
  for (const [index, person] of people.entries()) {
    const id = person.identity.speciesId;
    r.check(person.nickname === null && person.identity.formId === null && FACTS.eligibleSeenSpecies.includes(id) && id !== state.roster[state.profile.heroId]?.identity.speciesId && id !== state.roster[state.profile.partnerId]?.identity.speciesId && (state.speciesSeen?.identities.some(row => same(row, person.identity)) || (index === 0 ? FACTS.fallbackClient : FACTS.fallbackTarget) === id), '/goal', 'Clients/targets require the finite native pool, recorded flags or explicit empty-pool fallback.');
  }
  r.check(source.posting === 'board' ? source.rewardType <= 3 : source.rewardType >= 4 && source.rewardType <= 7, '/source/rewardType', 'Board and mailbox preserve their separate reward draws.');
  const promised = promisedJobReward(source), prepared = work.reward?.jobId === job.jobId || job.phase.kind === 'claimed';
  const count = prepared && source.rewardType === 3 ? 2 : prepared && source.rewardType === 7 ? 3 : promised.items.length;
  r.check(job.reward.money === promised.money && job.reward.rankPoints === 5 && job.reward.friendAreaIds.length === 0 && job.reward.recruitGrantIds.length === 0 && job.reward.items.length === count && new Set(job.reward.items.map(row => row.template.itemId)).size === count, '/reward', 'Reward bundle keeps the source money, points and pairwise-distinct item count.');
  for (const [index, item] of job.reward.items.entries()) r.check(FACTS.rewardItems.some(row => row.itemId === item.template.itemId) && (index !== 0 || item.template.itemId === source.itemReward) && !item.template.sticky && item.template.payload.kind === 'none' && item.quantity === (item.template.itemId === 'item-gravelerock' ? 10 : 1), '/reward/items', 'Prepared rewards use native clean slots and10-unit projectile quantity.');
  const phase = job.phase;
  if (phase.kind === 'offered') r.check(phase.offeredDay === source.generatedDay && phase.expiryDay === null && (work.boardJobIds.includes(job.jobId) || work.mailbox.some(row => row.kind === 'job' && row.jobId === job.jobId)), '/phase', 'An offer belongs to a live posting until source refresh.');
  else if (phase.kind === 'accepted' || phase.kind === 'suspended') r.check(phase.acceptedRevision > work.startedRevision && phase.acceptedRevision <= state.revision, '/phase', 'Acceptance/Take/Suspend retain a committed revision.');
  else if (phase.kind === 'active' || phase.kind === 'objective-complete') r.check(state.session?.purpose.kind === 'ordinary' && phase.sessionId === state.session.sessionId && (phase.kind !== 'objective-complete' || phase.completedRevision > state.session.entry.entryRevision && phase.completedRevision <= state.revision), '/phase', 'Active/completed objectives belong to their real ordinary expedition.');
  else if (phase.kind === 'reward-ready') r.check(work.returned?.jobIds.includes(job.jobId) && phase.completedRevision > work.startedRevision && phase.completedRevision <= state.revision, '/phase', 'Only the successful return station owns pending rewards.');
  else if (phase.kind === 'claimed') r.check(phase.claimedRevision > work.startedRevision && phase.claimedRevision <= state.revision, '/phase', 'Claimed history records a committed station receipt.');
  else r.check(phase.reasonId === 'native-completed-job-lost-return' && phase.failedRevision > work.startedRevision && phase.failedRevision <= state.revision, '/phase', 'Failed history represents completed native8 lost before successful return.');
  return r.result();
}; }
