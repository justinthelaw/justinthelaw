import { legacyUnpaidPrefixProblem } from '../../src/domain/state/bronze-reward-prefix.js';
import { BRONZE_JOB_FACTS as BRONZE } from '../authored/bronze-job-facts.js';
import { FRIEND_JOB_FACTS as FACTS } from '../authored/friend-job-facts.js';
import { FRIENDS } from '../authored/friends.js';
import { BRONZE_JOB_POLICY } from '../../src/domain/state/bronze-jobs-revision.js';
import { STEEL_MEANIES_REVISION } from '../../src/domain/state/steel-meanies-revision.js';
import { compareJobLocations } from '../../src/domain/gameplay/friend-job-records.js';
import { bronzeJob, isBronzeJob, promisedBronzeReward, bronzeItemGrant } from '../../src/domain/gameplay/bronze-job-records.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { steelSame as same, steelAppend as append } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** Real mission receipts extend the exact owned-area union. This function is
 * composed by the later interval owner after successful return admission; current
 * held progress rejects these histories before projecting to its predecessor.
 * @param {State} state @param {readonly import('../../src/contracts/campaign.js').FriendAreaId[]} priorAreas */
export function checkMissionAreaRewards(state,priorAreas) {
  const r = diagnostics(), receipts = state.friends?.missionAreaRewards, areas = [...priorAreas];
  if (receipts !== undefined) r.check(receipts.length > 0, '/friends/missionAreaRewards', 'Only actual mission claims create the optional receipt owner.');
  let revision = 0;
  for (const receipt of receipts ?? []) {
    const job = state.progress.jobs[receipt.jobId], prepared = state.earlyWork?.reward;
    const source = job && isBronzeJob(job) ? bronzeJob(job).source : null;
    r.check(source?.rewardType === 8 && source.friendAreaReward === receipt.areaId && BRONZE.mailAreas.some(row => row.id === receipt.areaId && row.capacity > 0) && job?.reward.friendAreaIds.length === 1 && job.reward.friendAreaIds[0] === receipt.areaId, '/friends/missionAreaRewards', 'Area capacity/identity and the actual promised mission join this receipt.');
    r.check(bounded(receipt.revision,revision+1,state.revision) && receipt.day >= (source?.generatedDay ?? state.town.day+1) && receipt.day <= state.town.day && (job?.phase.kind === 'claimed' ? receipt.revision <= job.phase.claimedRevision : job?.phase.kind === 'reward-ready' && prepared?.jobId === job.jobId && prepared.prefixAppliedRevision === receipt.revision), '/friends/missionAreaRewards', 'Ordered area grants belong to a claimed mission or its saved prepared prefix.');
    const owned = areas.includes(receipt.areaId);
    r.check(receipt.outcome === (owned ? 'already-owned-money' : 'unlocked'), '/friends/missionAreaRewards', 'An already owned promise compensates1000 Poke instead of duplicating the area.');
    if (!owned) areas.push(receipt.areaId);
    revision = receipt.revision;
  }
  r.check(new Set((receipts ?? []).map(row => row.jobId)).size === (receipts?.length ?? 0) && same(areas,state.economy.ownedFriendAreaIds), '/ownedFriendAreaIds', 'The starter/free/purchased union extends only through unique real mission receipts in claim order.');
  return r.result();
}
/** Complete source, payload, preparation and lifecycle reward contract. The
 * current progress owner separately holds active/new claim histories.
 * @param {import('../../src/contracts/campaign.js').JobRecord} original @param {State} state */
export function checkBronzeJob(original,state) {
  const r = diagnostics();
  if (original.source.kind !== 'generated' || original.source.generationPolicyId !== BRONZE_JOB_POLICY || !isBronzeJob(original)) { r.check(false,'/source','Bronze metadata requires its separately exact source shape.'); return r.result(); }
  const job = bronzeJob(original), source = job.source, goal = job.goal, work = state.earlyWork;
  const route = FACTS.routes.find(row => row.dungeonId === goal.destination.dungeonId), floor = Number(goal.destination.floorId.split('-').at(-1));
  const encounter = state.progress.seenScenes[FRIENDS.scenes[6] ?? ''];
  r.check(work && state.friends && encounter && source.generatedDay >= encounter.lastDay && source.generatedDay <= state.town.day && bounded(source.generatedRevision,(encounter?.lastRevision ?? state.revision)+1,state.revision) && bounded(source.seed,0,0xffffff), '/source', 'New postings follow the real Meanies encounter with actual day/revision and retained24-bit seed.');
  r.check(route && route.floorNumbers.includes(floor) && !route.excludedFloorNumbers.includes(floor) && goal.destination.sectionId === route.dungeonId && goal.destination.floorId === `${route.dungeonId}-floor-${String(floor).padStart(2,'0')}`, '/goal/destination', 'New generic destinations retain the native candidates and fixed-floor rejection; the old scripted Steel3F owner stays separate.');
  const kinds = { 0: 'rescue',1: 'find-pokemon',2: 'escort',3: 'retrieve-item',4: 'deliver-item' };
  const rewardFacts = source.missionType === 2 ? BRONZE : FACTS;
  r.check(goal.kind === kinds[source.missionType] && job.difficultyId === `native-mission-difficulty-${source.missionType === 2 ? 3 : 1}` && (source.missionType !== 2 || state.progress.rankPoints >= 50), '/goal', 'Native mission2 requires Bronze, difficulty3, rank-index1 and20 points.');
  const favorite = (source.missionType === 3 || source.missionType === 4) && FACTS.favoriteItems.some(([id,item]) => id === goal.client.identity.speciesId && item === source.targetItem);
  r.check(route?.targetItemIds.includes(source.targetItem) && rewardFacts.rewardItems.some(row => row.itemId === source.itemReward) && (source.itemReward !== source.targetItem || source.unk2 === 6 && favorite) && (source.unk2 === 0 || source.unk2 === 6 && favorite), '/source', 'Promised reward and target mask preserve rejection before favorite rewrites; no eligible finite pair can manufacture subtype9.');
  if (goal.kind === 'retrieve-item' || goal.kind === 'deliver-item') r.check(goal.itemId === source.targetItem && goal.quantity === 1, '/goal', 'Native item requests consume one complete target slot.');
  const people = [goal.client,...(goal.kind === 'escort' ? [goal.recipient] : goal.kind === 'find-pokemon' ? [goal.target] : [])];
  for (const [index,person] of people.entries()) {
    const id = person.identity.speciesId;
    const seen = FACTS.eligibleSeenSpecies.includes(id) && state.speciesSeen?.identities.some(row => same(row,person.identity));
    r.check(person.nickname === null && person.identity.formId === null && id !== state.roster[state.profile.heroId]?.identity.speciesId && id !== state.roster[state.profile.partnerId]?.identity.speciesId && (seen || id === (index === 0 ? FACTS.fallbackClient : FACTS.fallbackTarget)), '/goal', 'Client and independent recipient retain source normal identities, seen eligibility and exact empty-pool fallbacks.');
  }
  r.check(source.posting === 'board' ? source.rewardType <= 3 && source.friendAreaReward === null : source.rewardType >= 4 && source.rewardType <= 8 && (source.rewardType === 8 ? source.missionType === 2 && BRONZE.mailAreas.some(row => row.id === source.friendAreaReward) : source.friendAreaReward === null), '/source/rewardType', 'Board/mail ranges remain distinct; only eligible difficulty3 reward8 retains a real Wonder Mail area.');
  const promised = promisedBronzeReward(source), prepared = work?.reward?.jobId === job.jobId || job.phase.kind === 'claimed';
  const count = prepared && source.rewardType === 3 ? 2 : prepared && source.rewardType === 7 ? 3 : promised.items.length;
  r.check(job.reward.money === promised.money && job.reward.rankPoints === promised.rankPoints && same(job.reward.friendAreaIds,promised.friendAreaIds) && job.reward.recruitGrantIds.length === 0 && job.reward.items.length === count && new Set(job.reward.items.map(row => row.template.itemId)).size === count, '/reward', 'Reward preparation preserves source money, area, points and full pairwise-distinct extra batch.');
  for (const [index,item] of job.reward.items.entries()) r.check(rewardFacts.rewardItems.some(row => row.itemId === item.template.itemId) && (index !== 0 || item.template.itemId === source.itemReward) && same(item,bronzeItemGrant(item.template.itemId)), '/reward/items', 'Every clean reward slot retains10-rock quantity or exact unused TM payload; possession does not enable teaching.');
  const phase = job.phase;
  if (phase.kind === 'offered') r.check(phase.offeredDay === source.generatedDay && phase.expiryDay === null && (source.posting === 'board' ? work?.boardJobIds.includes(job.jobId) : work?.mailbox.some(row => row.kind === 'job' && row.jobId === job.jobId)), '/phase', 'An offered source remains owned by its actual posting.');
  else if (phase.kind === 'accepted' || phase.kind === 'suspended') r.check(state.progress.acceptedJobIds.includes(job.jobId) && bounded(phase.acceptedRevision,source.generatedRevision+1,state.revision), '/phase', 'Accept creates suspended5; Take6 and Suspend retain real acceptance revisions.');
  else if (phase.kind === 'active' || phase.kind === 'objective-complete') r.check(state.session?.purpose.kind === 'ordinary' && phase.sessionId === state.session.sessionId && (phase.kind !== 'objective-complete' || bounded(phase.completedRevision,state.session.entry.entryRevision+1,state.revision)), '/phase', 'Only a real taken ordinary expedition can own activation and completion.');
  else if (phase.kind === 'reward-ready') r.check(work?.returned?.outcome === 'success' && work.returned.jobIds.includes(job.jobId) && bounded(phase.completedRevision,source.generatedRevision+1,state.revision), '/phase', 'Native9 rewards require their genuine successful ordered station return.');
  else if (phase.kind === 'claimed') r.check(!state.progress.acceptedJobIds.includes(job.jobId) && bounded(phase.claimedRevision,source.generatedRevision+1,state.revision), '/phase', 'Final claim removes the accepted copy exactly once.');
  else r.check(phase.reasonId === 'native-completed-job-lost-return' && bounded(phase.failedRevision,source.generatedRevision+1,state.revision), '/phase', 'Only completed native8 loss creates failed history without reward.');
  return r.result();
}
/** A legacy callback receives its exact predecessor view only after the whole
 * prospective addition/prefix proof succeeds. No callback-order assumption or
 * recursive predecessor invocation is used.
 * @param {Policies} prior @returns {Policies['job']} */
export function bronzeJobPolicy(prior) { return (original,state) => {
  if (original.source.kind === 'generated' && original.source.generationPolicyId === BRONZE_JOB_POLICY) return checkBronzeJob(original,state);
  const actual = checkBronzeProspective(state);
  return actual.ok ? prior.job(original,postingPrerequisite(state)) : actual;
}; }
/** Independently admit prospective postings at held MAIN5,7 before delegating
 * unchanged history/roster/resources/scene/route/continuation proof to v21.
 * Projection strips only proven new metadata for its frozen prerequisite. It
 * never becomes a save or fabricates predecessor claims/posting receipts.
 * @param {State} state */
function postingPrerequisite(state) {
  const ids = new Set(Object.values(state.progress.jobs).filter(isBronzeJob).map(job => job.jobId));
  return { ...state,contentRevision: STEEL_MEANIES_REVISION,
    earlyWork: state.earlyWork ? { ...state.earlyWork,boardJobIds: state.earlyWork.boardJobIds.filter(id => !ids.has(id)),mailbox: state.earlyWork.mailbox.filter(row => row.kind === 'job' ? !ids.has(row.jobId) : row.newsId <= 2),newsRead: state.earlyWork.newsRead.filter(id => id <= 2),reward: state.earlyWork.reward ? { jobId: state.earlyWork.reward.jobId,preparedRevision: state.earlyWork.reward.preparedRevision,nextItem: state.earlyWork.reward.nextItem } : null } : state.earlyWork,
    progress: { ...state.progress,jobs: Object.fromEntries(Object.entries(state.progress.jobs).filter(([id]) => !ids.has(/** @type {import('../../src/contracts.js').JobId} */ (id)))),acceptedJobIds: state.progress.acceptedJobIds.filter(id => !ids.has(id)) } };
}
/** Pure proof reused before every legacy job/progress/town delegation. Raw
 * new-source ownership is checked without invoking any predecessor callback.
 * @param {State} state */
export function checkBronzeProspective(state) {
    const r = diagnostics(), jobs = Object.values(state.progress.jobs).filter(job => job.source.kind === 'generated' && job.source.generationPolicyId === BRONZE_JOB_POLICY), work = state.earlyWork;
    const newNews = work?.mailbox.some(row => row.kind === 'news' && row.newsId > 2) || work?.newsRead.some(id => id > 2);
    if (jobs.length || newNews) r.check(state.friends?.phase === 'work-two' && state.progress.native.scenarios.MAIN.chapter === 5 && state.progress.native.scenarios.MAIN.step === 7 && !state.session && !work?.returned && !work?.reward && !work?.clientPrompt && !state.pendingResult && !state.pendingScene, '/earlyWork', 'Prospective Bronze postings belong to actual MAIN5,7; guest/second-work outings and receipts remain held.');
    for (const job of jobs) append(r,checkBronzeJob(job,state));
    r.check(jobs.every(job => ['offered','suspended','accepted'].includes(job.phase.kind)) && state.friends?.missionAreaRewards === undefined, '/jobs', 'This prerequisite cannot admit new active, claimed or area history before the guest/second-interval owner.');
    if (work) {
      r.check(work.boardJobIds.length <= 8 && work.mailbox.length <= 4 && state.progress.acceptedJobIds.length <= 8 && new Set(work.boardJobIds).size === work.boardJobIds.length && new Set(work.newsRead).size === work.newsRead.length && work.newsRead.includes(0) && work.newsRead.every(id => bounded(id,0,49)), '/earlyWork', 'Source slot capacity and Maze14 regular read flags stay exact.');
      const slots = work.mailbox.filter(row => row.kind === 'news'), mailIds = work.mailbox.flatMap(row => row.kind === 'job' ? [row.jobId] : []);
      r.check(new Set(slots.map(row => row.newsId)).size === slots.length && slots.every(row => bounded(row.newsId,1,49) && !work.newsRead.includes(row.newsId)) && new Set(mailIds).size === mailIds.length, '/mailbox', 'Regular queued news/job slots retain unique unread ownership; no special issue is introduced.');
      for (const [ids,posting] of [[work.boardJobIds,'board'],[mailIds,'mailbox']]) {
        if (!Array.isArray(ids)) continue;
        for (const id of ids) { const job = state.progress.jobs[id]; r.check(job?.source.kind === 'generated' && 'posting' in job.source && job.source.posting === posting && (posting === 'board' ? ['offered','suspended','accepted'].includes(job.phase.kind) : job.phase.kind === 'offered'), '/earlyWork','Every actual posting retains its source and current visible lifecycle.'); }
      }
      for (let index = 1; index < state.progress.acceptedJobIds.length; index++) {
        const left = state.progress.jobs[state.progress.acceptedJobIds[index-1] ?? ''],right = state.progress.jobs[state.progress.acceptedJobIds[index] ?? ''];
        r.check(left && right && compareJobLocations(left,right) <= 0,'/acceptedJobIds','The complete accepted list retains native route/floor slot order.');
      }
      const ids = [...new Set([...work.boardJobIds,...mailIds,...state.progress.acceptedJobIds])];
      const active = ids.flatMap(id => state.progress.jobs[id] ?? []);
      r.check(active.length === ids.length && new Set(active.map(job => `${job.goal.destination.dungeonId}:${job.goal.destination.floorId}`)).size === active.length, '/jobs', 'All current postings/accepted copies retain real distinct native floors. Earlier ordinary floors can coexist with a later escort.');
      for (const id of state.progress.acceptedJobIds) {
        const candidate = state.progress.jobs[id]; if (!candidate || candidate.phase.kind !== 'accepted' || candidate.goal.kind !== 'escort') continue;
        r.check(!state.progress.acceptedJobIds.some(otherId => { const other = state.progress.jobs[otherId]; return otherId !== id && other?.phase.kind === 'accepted' && other.goal.kind === 'escort' && other.goal.destination.dungeonId === candidate.goal.destination.dungeonId; }), '/acceptedJobIds', 'Only one taken escort reserves its dungeon; other taken ordinary floors remain valid.');
      }
      const prepared = work.reward;
      if (prepared) {
        r.check(work.returned?.jobIds[work.returned.cursor] === prepared.jobId && state.progress.jobs[prepared.jobId]?.phase.kind === 'reward-ready', '/reward', 'The prefix belongs to the actual successful station cursor/job.');
        if (prepared.prefixAppliedRevision !== undefined) r.check(prepared.unpaidPrefix === undefined && bounded(prepared.prefixAppliedRevision,prepared.preparedRevision,state.revision), '/reward/prefixAppliedRevision', 'Applied prefix and unpaid conversion debt are exclusive; the real prefix revision must be committed.');
        else r.check(prepared.unpaidPrefix !== undefined && legacyUnpaidPrefixProblem(state) === null, '/reward/unpaidPrefix', 'Missing applied prefix requires the exact authenticated original-envelope conversion debt and unchanged queue/lot/RNG.');
      }
    }
    return r.result();
}
/** @param {Policies} prior @returns {Pick<Policies,'job'|'progress'|'town'>} */
export function bronzePolicies(prior) { return {
  job: bronzeJobPolicy(prior),
  progress(state) { const actual = checkBronzeProspective(state); return actual.ok ? prior.progress(postingPrerequisite(state)) : actual; },
  town(town,state) { const actual = checkBronzeProspective(state); return actual.ok ? prior.town(town,postingPrerequisite(state)) : actual; },
}; }
