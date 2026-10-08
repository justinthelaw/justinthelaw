import { FRIENDS } from '../authored/friends.js';
import { ORDINARY_SUMMIT, MEANIES_POSTING, POSTING_CURSOR } from '../authored/steel-meanies.js';
import { SINISTER_UNLOCK } from '../authored/escort-work.js';
import { STEEL } from '../authored/mt-steel.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';
import { TOWN } from '../authored/town.js';
import { TEAM } from '../authored/team-formation.js';
import { MORNING } from '../authored/first-morning.js';
import { nativeOrdinaryRosterCapacity } from '../../src/domain/gameplay/escort-entry-owner.js';
import { checkEscortStationOwners } from './escort-station.js';
import { checkEscortJob } from './escort-jobs.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { steelSame as same, steelAppend as append } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('../../src/contracts/campaign.js').JobRecord} Job
 * @typedef {import('../../src/domain/gameplay/support.js').Catalogs} Catalogs */
const ROUTES = ['tiny-woods','thunderwave-cave','mt-steel'];
/** @param {Job} job */ const claimRevision = job => job.phase.kind === 'claimed' ? job.phase.claimedRevision : -1;
/** Source-derived necessary final-batch bound, never a producer/reward cap.
 * Every exact source job and actual pending station is checked separately.
 * @param {{check:(condition:unknown,path:string,message:string)=>void}} r @param {Job[]} claims @param {number} threshold @param {number} maximum */
function finalBatch(r,claims,threshold,maximum) {
  r.check(claims.length <= threshold-1+maximum,'/jobs','A below-threshold departure retains its entire final source-sized batch.');
  const ordered = [...claims].sort((a,b) => claimRevision(a)-claimRevision(b)),tail = ordered.slice(threshold-1),route = tail[0]?.goal.destination.dungeonId;
  r.check(tail.every(job => job.goal.destination.dungeonId === route) && new Set(tail.map(job => job.goal.destination.floorId)).size === tail.length && tail.filter(job => job.goal.kind === 'escort').length <= 1,'/jobs','The final excess claims share one actual route and distinct objective floors with at most one taken escort.');
}
/** Direct actual first/second work interval owner. No v23 episode, actor or
 * native counter is manufactured. Heritage/resource/candidate/area owners are
 * composed by the complete raw factory; this function does not replace them.
 * @param {State} state @param {Catalogs} catalogs */
export function checkEscortWorkHistory(state,catalogs) {
  const r = diagnostics(),f = state.friends,p = state.progress,work = state.earlyWork;
  if (!f || !work) { r.check(false,'/friends','Chapter work requires its actual onboarding and ordinary-work owners.'); return r.result(); }
  append(r,checkEscortStationOwners(state,catalogs));
  for (const job of Object.values(p.jobs)) append(r,checkEscortJob(job,state));
  const rest = p.seenScenes[FRIENDS.scenes[4] ?? ''],morning = p.seenScenes[FRIENDS.scenes[5] ?? ''],encounter = p.seenScenes[FRIENDS.scenes[6] ?? ''];
  const secondMorning = p.seenScenes[FRIENDS.scenes[7] ?? ''],request = p.seenScenes[FRIENDS.scenes[8] ?? ''];
  const second = ['work-two','caterpie-morning','caterpie-ready','caterpie','sinister-ready'].includes(f.phase);
  const afterFirst = second || ['meanies-ready','meanies'].includes(f.phase),wakingFirst = f.phase === 'meanies-morning';
  r.check(['work-three','meanies-morning','meanies-ready','meanies','work-two','caterpie-morning','caterpie-ready','caterpie','sinister-ready'].includes(f.phase) && p.storyNodeId === FRIENDS.story && state.steel?.phase === 'complete' && rest && rest.count === 1,'/friends','Work retains the actual completed Steel, onboarding rest and exact supported interval.');
  const allClaims = Object.values(p.jobs).filter(job => job.phase.kind === 'claimed');
  const oldClaims = allClaims.filter(job => claimRevision(job) < f.startedRevision);
  const firstClaims = allClaims.filter(job => claimRevision(job) >= f.startedRevision && (!morning || claimRevision(job) < morning.firstRevision));
  const secondClaims = allClaims.filter(job => encounter && claimRevision(job) > encounter.lastRevision);
  r.check(oldClaims.length === f.priorJobs && oldClaims.length+firstClaims.length+secondClaims.length === allClaims.length && new Set(allClaims.map(claimRevision)).size === allClaims.length,'/jobs','Every actual claim belongs to one genuine historical interval with one unique completion revision; no claim occurs inside the intervening scenes.');
  for (const job of firstClaims) r.check(claimRevision(job) > (rest?.lastRevision ?? state.revision) && claimRevision(job) <= state.revision && ROUTES.includes(job.goal.destination.dungeonId) && job.reward.rankPoints === 5,'/jobs','First-work source claims preserve their actual post-rest revisions and five-point rewards.');
  for (const job of secondClaims) r.check(second && claimRevision(job) <= state.revision && ROUTES.includes(job.goal.destination.dungeonId) && (!secondMorning || claimRevision(job) < secondMorning.firstRevision) && [5,20].includes(job.reward.rankPoints),'/jobs','Second-work claims preserve actual source five/twenty points before the real next inside wakeup.');
  finalBatch(r,firstClaims,3,4); finalBatch(r,secondClaims,2,5);
  const runs = p.statistics.expeditions-f.priorExpeditions;
  const firstRuns = morning ? morning.firstDay-f.startedDay-1 : runs,secondRuns = runs-firstRuns;
  r.check(bounded(runs,0,p.statistics.expeditions) && bounded(firstRuns,0,runs) && bounded(secondRuns,0,runs) && firstClaims.length <= firstRuns*4 && secondClaims.length <= secondRuns*5 && p.statistics.jobsCompleted === allClaims.length && p.rankPoints === allClaims.reduce((sum,job) => sum+job.reward.rankPoints,0) && p.statistics.rescuesCompleted === 3,'/statistics','Actual full claim rewards determine rank/count; real inside-morning day fixes completed first-work runs without inventing a run receipt.');
  r.check(state.town.day === f.startedDay+1+runs-Number(!!state.session)-Number(!!work.returned),'/town/day','Every acknowledged ordinary return advances one day, including losses/empty runs; live and unfinished station runs do not.');
  for (const job of Object.values(p.jobs)) if (job.phase.kind === 'failed' && job.phase.failedRevision >= f.startedRevision) {
    const rev = job.phase.failedRevision;
    r.check(ROUTES.includes(job.goal.destination.dungeonId) && bounded(rev,(rest?.lastRevision ?? state.revision)+1,state.revision) && (!morning || rev < morning.firstRevision || second && encounter && rev > encounter.lastRevision && (!secondMorning || rev < secondMorning.firstRevision)),'/jobs','Actual completed8 lost returns retain their real first/second interval and never create a claim.');
  }
  const firstLatest = Math.max(rest?.lastRevision ?? 0,...firstClaims.map(claimRevision));
  if (afterFirst) r.check(morning && morning.count === 1 && morning.firstRevision === morning.lastRevision && bounded(morning.lastRevision,firstLatest+1,state.revision) && morning.firstDay === morning.lastDay && morning.firstDay <= state.town.day && firstClaims.length >= 3 && firstRuns >= 1,'/seenScenes','The first inside wakeup follows its complete real final batch and precedes later days.');
  else r.check(!morning && !encounter && !secondMorning && !request,'/seenScenes','Future mornings/request cannot appear before their actual completed interval.');
  const posted = p.appliedGrants.filter(row => row.grantId === MEANIES_POSTING),receipt = posted[0],postingDone = second || f.phase === 'meanies' && (state.pendingScene?.cursor ?? -1) >= POSTING_CURSOR;
  r.check(posted.length === Number(postingDone),'/appliedGrants','Only the actual Meanies op6 cursor owns its one original posting.');
  if (receipt) r.check(receipt.day === morning?.lastDay && bounded(receipt.revision,(morning?.lastRevision ?? state.revision)+POSTING_CURSOR+1,state.revision),'/appliedGrants','Original Pidgey posting follows the source Pelipper cursor on its original day.');
  if (second) r.check(encounter && encounter.count === 1 && encounter.firstRevision === encounter.lastRevision && bounded(encounter.lastRevision,(receipt?.revision ?? state.revision)+1,state.revision) && encounter.firstDay === morning?.lastDay && encounter.lastDay === encounter.firstDay,'/seenScenes','Actual completed Meanies encounter is the second interval start boundary.');
  else r.check(!encounter,'/seenScenes','Meanies receipt exists only after the actual outside script completes.');
  const activeCount = second ? secondClaims.length : firstClaims.length,threshold = second ? 2 : 3;
  const step = f.phase === 'sinister-ready' ? 9 : ['caterpie-ready','caterpie'].includes(f.phase) ? 8 : second ? 7 : afterFirst ? 6 : 5;
  const clearCount = f.phase === 'work-three' || wakingFirst || f.phase === 'work-two' || f.phase === 'caterpie-morning' ? activeCount : 0;
  const native = { ...INITIAL_NATIVE_PROGRESS,scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios,MAIN: { chapter: 5,step } },clearCount,flags: { ...INITIAL_NATIVE_PROGRESS.flags,persistent: [true,true,...INITIAL_NATIVE_PROGRESS.flags.persistent.slice(2)] } };
  r.check(same(p.native,native),'/native','CLEAR_COUNT counts actual claims and resets only on source MAIN pair transitions, independently of reward points or losses.');
  const flow = ({ 'meanies-morning': FRIENDS.scenes[5],meanies: FRIENDS.scenes[6],'caterpie-morning': FRIENDS.scenes[7],caterpie: FRIENDS.scenes[8] })[/** @type {'meanies-morning'|'meanies'|'caterpie-morning'|'caterpie'} */ (f.phase)];
  const morningReady = f.phase === 'meanies-ready' || f.phase === 'caterpie-ready';
  if (flow || morningReady || f.phase === 'sinister-ready') {
    r.check(!state.session && !work.returned && !work.reward && !work.clientPrompt && !state.pendingResult && state.moveState === null && activeCount >= threshold && state.mode === (flow ? 'scene' : 'town') && (flow ? state.pendingScene?.sceneId === flow : !state.pendingScene),'/mode','The complete station and every overflow/result finish before any mandatory morning or outside request.');
    r.check(state.town.mapDefinitionId === (['meanies','caterpie','sinister-ready'].includes(f.phase) ? TEAM.map : MORNING.interior),'/town/mapDefinitionId','Inside wakeup and actual outside dispatch retain distinct saved locations.');
  } else {
    r.check((activeCount < threshold || !!work.returned) && (!state.pendingScene || state.pendingScene.sceneId === ORDINARY_SUMMIT),'/mode','The complete final batch finishes before another departure; ordinary summit remains the actual dungeon scene.');
    if (state.session) checkSession(r,state,catalogs,second ? encounter?.lastRevision ?? state.revision : rest?.lastRevision ?? state.revision);
    else r.check(state.mode === 'town' && !work.clientPrompt && state.moveState === null && (!state.pendingResult || !!work.returned),'/mode','Ground rewards/results keep their genuine return and absent dungeon cache.');
  }
  if (work.returned) {
    const returned = work.returned;
    r.check(runs >= 1 && ROUTES.includes(returned.dungeonId) && returned.jobIds.length <= (returned.dungeonId === 'mt-steel' ? 5 : returned.dungeonId === 'tiny-woods' ? 2 : 3) && new Set(returned.jobIds.map(id => p.jobs[id]?.goal.destination.floorId)).size === returned.jobIds.length,'/returned','The full real station batch retains distinct native floors including scripted Pidgey3F.');
    r.check(state.town.mapDefinitionId === (returned.outcome === 'success' ? TOWN.post : MORNING.interior),'/town/mapDefinitionId','Successful station and failed return remain at their actual source destinations.');
  }
  const summit = p.seenScenes[ORDINARY_SUMMIT];
  if (summit) r.check(bounded(summit.count,1,runs) && bounded(summit.firstRevision,(rest?.lastRevision ?? state.revision)+1,state.revision) && bounded(summit.lastRevision,summit.firstRevision,state.revision) && (summit.count > 1 || summit.firstRevision === summit.lastRevision) && bounded(summit.firstDay,f.startedDay+1,state.town.day) && bounded(summit.lastDay,summit.firstDay,state.town.day) && (!secondMorning || summit.lastRevision < secondMorning.firstRevision),'/seenScenes','Actual ordinary summits retain separate first and later visit history, never a second Steel story clear.');
  const secondLatest = Math.max(encounter?.lastRevision ?? 0,...secondClaims.map(claimRevision));
  if (['caterpie-ready','caterpie','sinister-ready'].includes(f.phase)) r.check(secondMorning && secondMorning.count === 1 && secondMorning.firstRevision === secondMorning.lastRevision && bounded(secondMorning.lastRevision,secondLatest+1,state.revision) && secondMorning.firstDay === state.town.day && secondMorning.lastDay === state.town.day,'/seenScenes','The real inside24 receipt follows every station claim and assigns5,8 on this day.');
  else r.check(!secondMorning,'/seenScenes','No inside24 receipt precedes its actual final acknowledgment.');
  const unlock = p.milestones[SINISTER_UNLOCK];
  if (f.phase === 'sinister-ready') r.check(request && request.count === 1 && request.firstRevision === request.lastRevision && bounded(request.lastRevision,(secondMorning?.lastRevision ?? state.revision)+1,state.revision) && request.firstDay === state.town.day && request.lastDay === state.town.day && unlock?.milestoneId === SINISTER_UNLOCK && unlock.acquiredRevision === request.lastRevision && unlock.acquiredDay === state.town.day,'/seenScenes','Actual outside31 completion commits request, Sinister availability and5,9 once, without claiming rescue success.');
  else r.check(!request && !unlock,'/seenScenes','Request receipt and route unlock cannot precede outside31 completion.');
  checkField(r,state,catalogs);
  return r.result();
}
/** @param {{check:(condition:unknown,path:string,message:string)=>void}} r @param {State} state @param {Catalogs} catalogs @param {number} start */
function checkSession(r,state,catalogs,start) {
  const session = state.session,work = state.earlyWork;if (!session || !work) return;
  const floors = catalogs.dungeons.getDungeon(session.dungeonId).sectionIds.flatMap(id => catalogs.dungeons.getSection(id).variants[0]?.floorIds ?? []);
  r.check(!work.returned && !work.reward && session.status === 'active' && session.purpose.kind === 'ordinary' && ROUTES.includes(session.dungeonId) && session.entry.entryRevision > start && session.entry.selectedPartyIds.length >= 1 && session.entry.selectedPartyIds.length <= nativeOrdinaryRosterCapacity(catalogs,session.dungeonId) && bounded(session.visitedFloorIds.length,1,floors.length) && same(session.visitedFloorIds,floors.slice(0,session.visitedFloorIds.length)) && 'address' in session.floor.location && session.floor.location.address.floorId === session.visitedFloorIds.at(-1) && session.completedEventIds.length === 0 && session.participantSettlements.length === 0,'/session','Actual source-capped roster and optional separate guest enter real ordinary route/floor order after the genuine interval start.');
  const liveJobs = state.progress.acceptedJobIds.filter(id => ['active','objective-complete'].includes(state.progress.jobs[id]?.phase.kind ?? ''));
  r.check(same(session.objectives.map(row => row.jobId),liveJobs),'/session/objectives','Every actual active/completed accepted request owns exactly one ordered objective.');
  for (const [index,objective] of session.objectives.entries()) {
    const job = objective.jobId ? state.progress.jobs[objective.jobId] : null;
    r.check(job && job.goal.destination.dungeonId === session.dungeonId && objective.definitionId === 'native-early-job-objective' && (job.phase.kind === 'active' ? job.phase.objectiveIndex === index && (objective.state.kind === 'pending' || objective.state.kind === 'actor-target' && job.goal.kind !== 'retrieve-item') : job.phase.kind === 'objective-complete' && objective.state.kind === 'complete' && job.phase.completedRevision === objective.state.completedRevision),'/session/objectives','Actual source objective indices/receipts and current dungeon retain their distinct pending/client/completed owners.');
  }
  const summit = session.floor.location.kind === 'boss';
  r.check(summit ? session.dungeonId === STEEL.dungeonId && session.floor.location.kind === 'boss' && session.floor.location.address.floorId === STEEL.floors[8] && state.pendingScene?.sceneId === ORDINARY_SUMMIT && state.mode === 'scene' && Object.values(session.actors).every(actor => actor.binding.kind === 'roster' || actor.binding.kind === 'escort-guest') : session.floor.location.kind === 'exploration' && state.mode === 'dungeon' && !state.pendingScene,'/session/floor','Only the actual empty ordinary Steel summit pauses a scene; its true party/guest remain present.');
  r.check(!state.pendingResult || state.pendingResult.kind === 'move-learn-choice','/pendingResult','Only a source-proved actual learning choice can pause the active outing.');
}
/** @param {{check:(condition:unknown,path:string,message:string)=>void}} r @param {State} state @param {Catalogs} catalogs */
function checkField(r,state,catalogs) {
  const field = state.moveState,session = state.session;
  r.check(field !== undefined,'/moveState','Current field cache remains explicit.');
  if (field) {
    const actor = field.lightningRodActorId ? session?.actors[field.lightningRodActorId] : null,rod = catalogs.species.identities.abilities.find(row => row.name === 'Lightningrod');
    r.check(session && field.sessionId === session.sessionId && field.mapId === session.floor.mapId && (field.lightningRodActorId === null || actor && rod && catalogs.species.getProfile(actor.identity.speciesId,actor.identity.formId).abilityIds.includes(rod.originalId)) && 'waterSportTurns' in field && bounded(field.waterSportTurns,0,11),'/moveState','Real Lightningrod identity and Water Sport duration retain their actual floor epoch.');
  } else if (session) r.check(session.scheduler.continuation.pass === 'prephase' && session.scheduler.continuation.step <= 1,'/moveState','Null cache is only before actual first refresh.');
}
