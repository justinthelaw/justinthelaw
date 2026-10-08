import { FRIEND_JOB_FACTS } from '../authored/friend-job-facts.js';
import { FRIENDS, placeFriendsGround } from '../authored/friends.js';
import { TEAM } from '../authored/team-formation.js';
import { MORNING } from '../authored/first-morning.js';
import { TOWN } from '../authored/town.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { steelSame as same, steelAppend as append } from './steel-progress.js';
import { checkWorkOwners } from './friend-jobs.js';
// The currently admitted routes have two/three legal objective floors. This
// is a source-derived history bound, never a cap on station rewards/points.
const MAX_BATCH = Math.max(...FRIEND_JOB_FACTS.routes.filter(row => ['tiny-woods','thunderwave-cave'].includes(row.dungeonId)).map(row => row.floorNumbers.filter(floor => !row.excludedFloorNumbers.includes(floor)).length));
/** @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** This projection exists only for the frozen onboarding prerequisite. Actual
 * state, accepted jobs, receipts, growth and saved PCs are never replaced by it.
 * @param {State} state */
function onboardingPrerequisite(state) {
  const f = state.friends, p = state.progress;
  const projected = { ...state, friends: f ? { ...f, phase: /** @type {const} */ ('work-three') } : f,
    mode: /** @type {const} */ ('town'), session: null, pendingScene: null, pendingResult: null, moveState: null,
    town: { ...state.town, day: (f?.startedDay ?? 0) + 1 },
    earlyWork: state.earlyWork ? { ...state.earlyWork, boardJobIds: [], mailbox: [], returned: null, reward: null, clientPrompt: null } : null,
    progress: { ...p, native: { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 5, step: 5 } }, flags: { ...INITIAL_NATIVE_PROGRESS.flags, persistent: [true,true,...INITIAL_NATIVE_PROGRESS.flags.persistent.slice(2)] } },
      jobs: Object.fromEntries(Object.entries(p.jobs).filter(([,job]) => job.phase.kind === 'claimed' && job.phase.claimedRevision < (f?.startedRevision ?? 0))), acceptedJobIds: [], rankPoints: (f?.priorJobs ?? 0) * 5,
      statistics: { jobsCompleted: f?.priorJobs ?? 0, expeditions: f?.priorExpeditions ?? 0, rescuesCompleted: 3 },
      seenScenes: Object.fromEntries(Object.entries(p.seenScenes).filter(([id]) => id !== FRIENDS.scenes[5])) } };
  placeFriendsGround(projected, TEAM.map); return projected;
}
/** Independently check the actual field cache before removing its session from
 * the prerequisite. These are the unchanged v11/v16 cache obligations.
 * @param {{check:(condition:unknown,path:string,message:string)=>void}} report @param {State} state
 * @param {import('./campaign.js').CampaignCatalogs} catalogs */
function checkField(report, state, catalogs) {
  const field = state.moveState, session = state.session;
  report.check(field !== undefined, '/moveState', 'Current saves retain their explicit field cache owner.');
  if (field) {
    const actor = field.lightningRodActorId ? session?.actors[field.lightningRodActorId] : null;
    const rod = catalogs.species.identities.abilities.find(row => row.name === 'Lightningrod');
    report.check(session && field.sessionId === session.sessionId && field.mapId === session.floor.mapId && (field.lightningRodActorId === null || actor && rod && catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId).abilityIds.includes(rod.originalId)) && 'waterSportTurns' in field && bounded(field.waterSportTurns,0,11), '/moveState', 'The Lightningrod actor and Water Sport counter belong to this exact historical session floor.');
  } else if (session) report.check(session.scheduler.continuation.pass === 'prephase' && session.scheduler.continuation.step <= 1, '/moveState', 'Null field cache is only legal before the first native refresh.');
}
/** Own MAIN5,5 work and MAIN5,6 inside-base boundary; all other policy owners
 * remain exact predecessors, including conditions, scheduler, entry and growth.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} authored
 * @returns {Pick<Policies,'progress'|'town'|'scene'>} */
export function chapterWorkPolicies(prior, catalogs, authored) { return {
  progress(state) {
    const f = state.friends, p = state.progress, work = state.earlyWork;
    if (!f || !['work-three','meanies-morning','meanies-ready'].includes(f.phase)) return prior.progress(state);
    const r = diagnostics(); append(r,checkWorkOwners(state,catalogs)); checkField(r,state,catalogs);
    if (!work) return r.result();
    const rest = p.seenScenes[FRIENDS.scenes[4] ?? ''], morning = p.seenScenes[FRIENDS.scenes[5] ?? ''];
    const oldClaims = Object.values(p.jobs).filter(job => job.phase.kind === 'claimed' && job.phase.claimedRevision < f.startedRevision);
    const newClaims = Object.values(p.jobs).filter(job => job.phase.kind === 'claimed' && job.phase.claimedRevision >= f.startedRevision);
    const newFailures = Object.values(p.jobs).filter(job => job.phase.kind === 'failed' && job.phase.failedRevision >= f.startedRevision);
    const count = newClaims.length, runs = p.statistics.expeditions - f.priorExpeditions;
    r.check(rest && rest.count === 1 && oldClaims.length === f.priorJobs && p.storyNodeId === FRIENDS.story && state.steel?.phase === 'complete', '/friends', 'New work starts after real rest and preserves every earlier Steel/onboarding receipt.');
    for (const job of newClaims) r.check(job.phase.kind === 'claimed' && bounded(job.phase.claimedRevision,(rest?.lastRevision ?? state.revision)+1,state.revision) && ['tiny-woods','thunderwave-cave'].includes(job.goal.destination.dungeonId) && job.reward.rankPoints === 5, '/jobs', 'New receipts are actual later Tiny/Cave station claims, including retained old accepted copies.');
    for (const job of newFailures) r.check(job.phase.kind === 'failed' && bounded(job.phase.failedRevision,(rest?.lastRevision ?? state.revision)+1,state.revision) && ['tiny-woods','thunderwave-cave'].includes(job.goal.destination.dungeonId), '/jobs', 'New failed history belongs to actual post-rest Tiny/Cave losses; older history and uncompleted Steel copies retain their inherited owners.');
    r.check(p.statistics.jobsCompleted === f.priorJobs + count && p.rankPoints === p.statistics.jobsCompleted * 5 && p.statistics.rescuesCompleted === 3 && runs >= 0 && count <= runs * MAX_BATCH && count <= 2 + MAX_BATCH, '/statistics', 'Each receipt retains five points. The first interval departs below three claims and processes a full source-sized final batch, admitting all realizable overshoot without reward truncation.');
    r.check(state.town.day === f.startedDay + 1 + runs - Number(!!state.session) - Number(!!work.returned), '/town/day', 'Every completed return acknowledgement advances one day; active expeditions and pending station batches do not.');
    const ready = f.phase === 'meanies-ready', waking = f.phase === 'meanies-morning';
    const expectedNative = { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 5, step: ready ? 6 : 5 } }, clearCount: ready ? 0 : count, flags: { ...INITIAL_NATIVE_PROGRESS.flags, persistent: [true,true,...INITIAL_NATIVE_PROGRESS.flags.persistent.slice(2)] } };
    r.check(same(p.native,expectedNative), '/native', 'Job receipts own CLEAR_COUNT until the completed inside-base morning assigns MAIN5,6 and resets it.');
    r.check(!FRIENDS.scenes.slice(6).some(id => p.seenScenes[id]), '/seenScenes', 'Outside Meanies, its posting transaction and later chapter scenes remain unconsumed.');
    const latestClaim = Math.max(rest?.lastRevision ?? 0,...newClaims.flatMap(job => job.phase.kind === 'claimed' ? [job.phase.claimedRevision] : []));
    if (ready || waking) {
      r.check(count >= 3 && runs >= 1 && !state.session && !work.returned && !work.reward && !work.clientPrompt && !state.pendingResult && state.moveState === null && state.town.mapDefinitionId === MORNING.interior, '/mode', 'The entire station batch and its overflow/results finish before the mandatory inside-base wakeup.');
      r.check(ready ? state.mode === 'town' && !state.pendingScene && morning && morning.count === 1 && morning.firstRevision === morning.lastRevision && bounded(morning.lastRevision,latestClaim+1,state.revision) && morning.firstDay === state.town.day && morning.lastDay === state.town.day : state.mode === 'scene' && state.pendingScene?.sceneId === FRIENDS.scenes[5] && !morning, '/pendingScene', 'Wakeup has its actual saved script then one same-day receipt before the outside base dispatch.');
    } else {
      r.check(!morning && !state.pendingScene && (!state.pendingResult || state.pendingResult.kind === 'job-reward') && (count < 3 || !!work.returned), '/mode', 'Three or more receipts finish the complete final station batch before any additional work.');
      if (state.session) {
        const session = state.session, floors = catalogs.dungeons.getDungeon(session.dungeonId).sectionIds.flatMap(id => catalogs.dungeons.getSection(id).variants[0]?.floorIds ?? []);
        r.check(count < 3 && !work.returned && !work.reward && !state.pendingResult && state.mode === 'dungeon' && session.status === 'active' && session.purpose.kind === 'ordinary' && ['tiny-woods','thunderwave-cave'].includes(session.dungeonId) && session.entry.entryRevision > (rest?.lastRevision ?? state.revision) && same(session.entry.selectedPartyIds,[state.profile.heroId,state.profile.partnerId]) && session.visitedFloorIds.length >= 1 && same(session.visitedFloorIds,floors.slice(0,session.visitedFloorIds.length)) && session.floor.location.kind === 'exploration' && session.floor.location.address.floorId === session.visitedFloorIds.at(-1) && session.completedEventIds.length === 0 && session.participantSettlements.length === 0, '/session', 'Only the original pair enters unchanged Tiny/Cave work routes in actual source floor order.');
        const active = p.acceptedJobIds.filter(id => ['active','objective-complete'].includes(p.jobs[id]?.phase.kind ?? ''));
        const taken = active.filter(id => p.jobs[id]?.goal.destination.dungeonId === session.dungeonId);
        r.check(active.length === taken.length, '/acceptedJobIds', 'Other-route taken requests remain accepted; only the current dungeon can activate a request.');
        r.check(same(session.objectives.map(row => row.jobId),taken), '/session/objectives', 'Every current taken request owns exactly one objective in native slot order.');
        for (const objective of session.objectives) {
          const job = objective.jobId ? p.jobs[objective.jobId] : null;
          r.check(job && objective.definitionId === 'native-early-job-objective' && job.goal.destination.dungeonId === session.dungeonId && ['active','objective-complete'].includes(job.phase.kind), '/session/objectives', 'The objective belongs to this real taken request and dungeon.');
          r.check(objective.state.kind === 'complete' ? job?.phase.kind === 'objective-complete' && objective.state.completedRevision === job.phase.completedRevision : objective.state.kind === 'pending' || objective.state.kind === 'actor-target' && job?.goal.kind !== 'retrieve-item', '/session/objectives', 'Completion receipts, floor clients and toolbox searches retain their separate obligations.');
        }
      } else {
        r.check(state.mode === 'town' && !work.clientPrompt && state.moveState === null && (!state.pendingResult || !!work.returned), '/mode', 'Ground reward/results cannot escape their canonical return owner.');
        if (work.returned) {
          r.check(['tiny-woods','thunderwave-cave'].includes(work.returned.dungeonId) && work.returned.jobIds.length <= MAX_BATCH && runs >= 1, '/returned', 'The station queue belongs to an actual Tiny/Cave work run with at most three source objective floors.');
          r.check(state.town.mapDefinitionId === (work.returned.outcome === 'success' ? TOWN.post : MORNING.interior), '/town/mapDefinitionId', 'Pending successful station returns, rewards and results remain at the Post Office; loss returns remain inside the base.');
        }
      }
    }
    append(r,prior.progress(onboardingPrerequisite(state))); return r.result();
  },
  town(town,state) {
    if (!state.friends || !['work-three','meanies-morning','meanies-ready'].includes(state.friends.phase)) return prior.town(town,state);
    const r = diagnostics(), prerequisite = onboardingPrerequisite(state);
    // Frozen ground placement/area ownership still checks the actual map and
    // resident selection. Its historical day is validation metadata only.
    append(r,prior.town({ ...town,day: prerequisite.town.day }, { ...prerequisite,town: { ...town,day: prerequisite.town.day } }));
    if (state.friends.phase !== 'work-three') r.check(town.mapDefinitionId === MORNING.interior, '/mapDefinitionId', 'The first interval ends inside the base before Meanies ENTER_CONTROL.');
    return r.result();
  },
  scene(scene,state) {
    if (scene.sceneId !== FRIENDS.scenes[5]) return prior.scene(scene,state);
    const r = diagnostics(), script = authored.scenes.find(row => row.id === scene.sceneId);
    const claims = Object.values(state.progress.jobs).flatMap(job => job.phase.kind === 'claimed' ? [job.phase.claimedRevision] : []);
    r.check(state.friends?.phase === 'meanies-morning' && script && bounded(scene.cursor,0,script.lines.length-1) && scene.awaiting.kind === 'advance' && scene.choices.length === 0 && same(scene.continuation,script.continuation) && bounded(scene.entryRevision,Math.max(0,...claims)+1,state.revision) && state.revision-scene.entryRevision >= scene.cursor, '', 'The mandatory wakeup retains its real cursor, entry revision and inside-base continuation after every claim.');
    r.check(scene.bindings.length === 2 && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.heroRoleId && row.pokemonId === state.profile.heroId) && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.partnerRoleId && row.pokemonId === state.profile.partnerId), '/bindings', 'Only the original pair binds this inside-base morning.');
    return r.result();
  },
}; }
