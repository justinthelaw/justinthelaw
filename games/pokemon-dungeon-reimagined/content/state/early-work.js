import { TOWN, placeInTown } from '../authored/town.js';
import { WORK } from '../authored/early-work.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';
import { TEAM } from '../authored/team-formation.js';
import { MORNING } from '../authored/first-morning.js';
import { diagnostics } from './pokemon-rules.js';
import { fingerprint } from '../../src/domain/state/relations.js';
import { checkWorkOwners, workJobPolicy } from './work-jobs.js';
import { workExpeditionPolicies } from './work-expedition.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {unknown} a @param {unknown} b */ const same = (a,b) => fingerprint(a) === fingerprint(b);
/** @param {ReturnType<typeof diagnostics>} r @param {import('../../src/contracts/campaign.js').RuleCheck} check */
function append(r, check) {
  if (check.ok) return;
  if (check.kind === 'invalid') for (const issue of check.issues) r.check(false, issue.path, issue.message);
  else for (const id of check.requirementIds) r.need(id);
}
/** Current-only admission. Explicitly checked work facts project through exact
 * predecessor prerequisites; old bodies and old serialized roots stay frozen.
 * @param {import('../authored/opening.js').AuthoredOpening} authored @param {Policies} prior
 * @param {import('./campaign.js').CampaignCatalogs} catalogs @returns {Partial<Policies>} */
export function withWorkPolicies(authored, prior, catalogs) { return {
  ...workExpeditionPolicies(prior, catalogs), job: workJobPolicy(prior),
  progress(state) {
    const p = state.progress, work = state.earlyWork, inWork = [TOWN.story, WORK.story].includes(p.storyNodeId);
    if (!inWork) {
      const r = diagnostics(); r.check(work === null, '/earlyWork', 'Pre-town states have no ordinary work owner.'); append(r, prior.progress(state)); return r.result();
    }
    const r = diagnostics(); append(r, checkWorkOwners(state, catalogs)); if (!work) return r.result();
    const introCount = TOWN.scenes.filter(id => p.seenScenes[id]).length, requestCount = WORK.scenes.filter(id => p.seenScenes[id]).length;
    const request = p.storyNodeId === WORK.story;
    const claimed = Object.values(p.jobs).filter(job => job.phase.kind === 'claimed').length;
    r.check(claimed <= 4 && p.statistics.jobsCompleted === claimed && p.rankPoints === claimed * 5, '/statistics', 'Each station receipt grants exactly5 points; the mandatory two-receipt morning gate bounds this interval to one final batch of at most three jobs.');
    const step = introCount === 0 ? 1 : introCount < 3 ? 2 : introCount === 3 ? 3 : requestCount === 0 ? 4 : requestCount === 1 ? 5 : 6;
    r.check(same(p.native, { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 4, step } }, clearCount: requestCount > 0 ? 0 : claimed, scalars: { ...INITIAL_NATIVE_PROGRESS.scalars, warpLock: step === 3 ? 3 : 0 } }), '/native', 'MAIN progression resets CLEAR_COUNT only on the next source scenario assignment.');
    const ordinaryRuns = p.statistics.expeditions - work.storyExpeditions;
    r.check(state.town.day === 2 + ordinaryRuns - Number(state.session !== null) - Number(work.returned !== null) && p.statistics.rescuesCompleted === 2, '/town/day', 'Browser days advance once after each real ordinary return; story rescue counts are unchanged.');
    r.check(introCount === 4 || ordinaryRuns === 0 && claimed === 0 && p.acceptedJobIds.length === 0 && !work.returned && !work.reward && !work.clientPrompt, '', 'The introduction precedes all job acceptance, expeditions and station flows.');
    if (state.session) {
      const session = state.session, ids = catalogs.dungeons.getDungeon(session.dungeonId).sectionIds.flatMap(id => catalogs.dungeons.getSection(id).variants[0]?.floorIds ?? []);
      r.check(!request && claimed < 2 && !work.returned && !work.reward && state.mode === 'dungeon' && !state.pendingScene && !state.pendingResult && session.purpose.kind === 'ordinary' && ['tiny-woods','thunderwave-cave'].includes(session.dungeonId) && session.visitedFloorIds.length >= 1 && session.visitedFloorIds.length <= ids.length && same(session.visitedFloorIds, ids.slice(0,session.visitedFloorIds.length)) && session.floor.location.kind === 'exploration' && session.floor.location.address.floorId === session.visitedFloorIds.at(-1), '/session', 'Only the real taken-job early route runs before the mandatory request, in source floor order.');
      const taken = p.acceptedJobIds.filter(id => ['active','objective-complete'].includes(p.jobs[id]?.phase.kind ?? ''));
      r.check(same(session.objectives.map(row => row.jobId), taken), '/session/objectives', 'Every active/completed taken request owns exactly one objective in native slot order.');
      for (const objective of session.objectives) {
        const job = objective.jobId ? p.jobs[objective.jobId] : null;
        r.check(job && objective.definitionId === 'native-early-job-objective' && job.goal.destination.dungeonId === session.dungeonId && ['active','objective-complete'].includes(job.phase.kind), '/session/objectives', 'Every objective joins a taken job of the current dungeon.');
        if (objective.state.kind === 'complete') r.check(job?.phase.kind === 'objective-complete' && objective.state.completedRevision === job.phase.completedRevision, '/session/objectives', 'Completed objective and request share the same receipt.');
        else r.check(objective.state.kind === 'pending' || objective.state.kind === 'actor-target' && job?.goal.kind !== 'retrieve-item', '/session/objectives', 'Find requests do not spawn client actors or invented pickup objectives.');
      }
    } else if (introCount === 4 && !request) r.check(state.mode === 'town' && !state.pendingScene && (!state.pendingResult || state.pendingResult.kind === 'job-reward') && (claimed < 2 || work.returned !== null), '/mode', 'Two receipts must finish their return queue then enter the next morning request before any further departure.');
    if (request) {
      r.check(introCount === 4 && claimed >= 2 && !state.session && !work.returned && !work.reward && !work.clientPrompt && !state.pendingResult && (requestCount < 2 ? state.mode === 'scene' && state.pendingScene?.sceneId === WORK.scenes[requestCount] : state.mode === 'town' && !state.pendingScene), '/mode', 'Diglett request owns the next morning and keeps Mt. Steel gated.');
      let previous = Math.max(...Object.values(p.jobs).flatMap(job => job.phase.kind === 'claimed' ? [job.phase.claimedRevision] : []));
      for (const id of WORK.scenes.slice(0,requestCount)) {
        const visit = p.seenScenes[id];
        r.check(visit && visit.count === 1 && visit.firstRevision === visit.lastRevision && visit.lastRevision > previous && visit.lastRevision <= state.revision && visit.firstDay === state.town.day && visit.lastDay === state.town.day, '/seenScenes', 'Diglett scenes complete once, in order, after real reward receipts.');
        previous = visit?.lastRevision ?? previous;
      }
    } else r.check(requestCount === 0, '/seenScenes', 'Work days cannot contain a future story request receipt.');
    const projected = { ...state, earlyWork: null, session: null, pendingResult: null, pendingScene: introCount < 4 ? state.pendingScene : null, mode: /** @type {'scene'|'town'} */ (introCount < 4 ? 'scene' : 'town'),
      town: { ...state.town, day: 2 }, progress: { ...p, storyNodeId: TOWN.story,
        native: { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 4, step: Math.min(4, step) } }, scalars: { ...INITIAL_NATIVE_PROGRESS.scalars, warpLock: step === 3 ? 3 : 0 } },
        jobs: {}, acceptedJobIds: [], rankPoints: 0, statistics: { ...p.statistics, jobsCompleted: 0, expeditions: work.storyExpeditions }, seenScenes: Object.fromEntries(Object.entries(p.seenScenes).filter(([id]) => !WORK.scenes.some(key => key === id))) } };
    append(r, prior.progress(projected));
    return r.result();
  },
  town(town, state) {
    if (!state.earlyWork) return prior.town(town, state);
    const r = diagnostics(), request = state.progress.storyNodeId === WORK.story;
    r.check(request ? town.mapDefinitionId === TEAM.map : [TEAM.map, MORNING.interior, TOWN.square, TOWN.post].includes(town.mapDefinitionId), '/mapDefinitionId', 'Work stays in the introduced ground maps; the request stages at the rescue base.');
    const projection = { ...state, town: { ...town } }; placeInTown(projection, town.mapDefinitionId);
    r.check(same(town.placements, projection.town.placements), '/placements', 'Town placement belongs to its canonical map.');
    append(r, prior.town({ ...town, day: 2 }, { ...state, progress: { ...state.progress, storyNodeId: TOWN.story } }));
    return r.result();
  },
  scene(scene, state) {
    if (!WORK.scenes.includes(scene.sceneId)) return prior.scene(scene, state);
    const r = diagnostics(), script = authored.scenes.find(row => row.id === scene.sceneId);
    r.check(state.progress.storyNodeId === WORK.story && script && scene.cursor >= 0 && scene.cursor < script.lines.length && scene.awaiting.kind === 'advance' && scene.choices.length === 0 && same(scene.continuation, script.continuation) && scene.entryRevision > 0 && scene.entryRevision <= state.revision && state.revision - scene.entryRevision >= scene.cursor, '', 'Diglett request retains an exact authored cursor and continuation.');
    r.check(scene.bindings.length === 2 && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.heroRoleId && row.pokemonId === state.profile.heroId) && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.partnerRoleId && row.pokemonId === state.profile.partnerId), '/bindings', 'Request roles bind the original pair without recruiting its client.');
    return r.result();
  },
  result(result, state) {
    if (!state.earlyWork || result.kind !== 'job-reward') return prior.result(result, state);
    const r = diagnostics(), returned = state.earlyWork.returned;
    r.check(returned?.outcome === 'success' && returned.cursor > 0 && returned.jobIds[returned.cursor - 1] === result.jobId && !state.earlyWork.reward && state.mode === 'town' && result.cursor === 0 && result.createdRevision <= state.revision && same(result.continuation, { kind: 'town', destination: { kind: 'town', mapDefinitionId: TOWN.post, entryId: 'ordinary-reward' } }), '', 'Reward display follows its single committed station claim and queue cursor.');
    return r.result();
  },
}; }
