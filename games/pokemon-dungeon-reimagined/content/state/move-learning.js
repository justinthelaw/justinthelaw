import { BRONZE_JOBS_REVISION } from '../../src/domain/state/bronze-jobs-revision.js';
import { learningProblem, forgottenProblem } from '../../src/domain/state/move-learning-proof.js';
import { INITIAL_SCHEDULE_POLICY_ID } from './expedition.js';
import { pendingSpecialSwap } from '../../src/domain/gameplay/swap-continuation.js';
import { diagnostics } from './pokemon-rules.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('../../src/contracts/campaign.js').ExpeditionState} Session
 * @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies
 * @typedef {import('../../src/domain/gameplay/support.js').Catalogs} Catalogs */
/** Only independently proved new producer fields are omitted. No scene/history,
 * claim, resource, candidate or native epoch is manufactured for gameplay.
 * @param {State} state @returns {State} */
export function learningPrerequisite(state) {
  const s = state.session;
  if (!s) return { ...state,contentRevision: BRONZE_JOBS_REVISION };
  const learning = s.learning,rest = { ...s }; delete rest.learning; delete rest.forgottenMoves;
  const { resultId,sceneInstanceId,...scheduler } = /** @type {Session['scheduler'] & {resultId?:import('../../src/contracts/campaign.js').ResultId;sceneInstanceId?:import('../../src/contracts/campaign.js').SceneInstanceId}} */ (s.scheduler); void resultId; void sceneInstanceId;
  const actors = Object.fromEntries(Object.entries(rest.actors).map(([id,actor]) => { const view = { ...actor }; delete view.pendingExperience; return [id,view]; }));
  const session = learning ? { ...rest,actors,scheduler: { ...scheduler,...learning.schedulerTag } } : { ...rest,actors };
  return { ...state,contentRevision: BRONZE_JOBS_REVISION,session,pendingResult: learning ? null : state.pendingResult };
}
/** Each callback first runs the same complete raw producer proof; callbacks
 * never depend on progress/scheduler traversal order or earlier side effects.
 * @param {Policies} prior @param {Catalogs} catalogs @returns {Partial<Policies>} */
export function learningPolicies(prior,catalogs) {
  /** @param {State} state @param {(view:State)=>import('../../src/contracts/campaign.js').RuleCheck} callback */
  function proven(state,callback) {
    const problem = learningProblem(state,catalogs);
    if (!problem) return callback(learningPrerequisite(state));
    const r = diagnostics(); r.check(false,'/session/learning',problem); return r.result();
  }
  return {
    profile: state => proven(state,view => prior.profile(view)),
    economy: state => proven(state,view => prior.economy(view)),
    progress: state => proven(state,view => prior.progress(view)),
    rescue: state => proven(state,view => prior.rescue(view)),
    town: (town,state) => proven(state,view => prior.town(town,view)),
    pokemon: (record,state,scope) => proven(state,view => prior.pokemon(record,view,scope)),
    job: (job,state) => proven(state,view => prior.job(job,view)),
    scene: (scene,state) => proven(state,view => prior.scene(scene,view)),
    result(result,state) { return proven(state,view => result.kind === 'move-learn-choice' ? { ok: true } : prior.result(result,view)); },
    item: (item,container,state,scope) => proven(state,view => prior.item(item,container,view,scope)),
    expeditionEntry: (session,state,scope) => proven(state,view => prior.expeditionEntry(view.session?.sessionId === session.sessionId ? view.session : session,view,scope)),
    actor(actor,session,state,scope) { return proven(state,view => {
      const s = view.session?.sessionId === session.sessionId ? view.session : session;
      // A genuinely pending defeat can pause before its atomic copyback. Its
      // zero-HP source actor remains in the actual map/slot for that outcome;
      // only the old actor policy's live-placement HP requirement is projected.
      const casualty = session.learning?.origin.kind === 'settlement' && session.learning.origin.outcome === 'fainting' && actor.resources.hp === 0 && actor.placement.kind === 'map';
      return prior.actor(casualty ? { ...actor,placement: { kind: 'off-map',reason: 'fainted' } } : actor,s,view,scope);
    }); },
    floor(floor,session,state,scope) { return proven(state,view => {
      let s = view.session?.sessionId === session.sessionId ? view.session : session;
      if (session.learning) s = pendingSpecialSwap(s,catalogs)?.original ?? s;
      return prior.floor(floor,s,view,scope);
    }); },
    scheduler(session,state,scope) { return proven(state,view => {
      if (!session.learning || session.learning.origin.kind === 'scene') return prior.scheduler(view.session?.sessionId === session.sessionId ? view.session : session,view,scope);
      const r = diagnostics();
      r.check(scope.kind === 'live' && session === state.session && session.scheduler.schedulePolicyId === INITIAL_SCHEDULE_POLICY_ID,'/scheduler','The independently proved native learning PC retains its actual live schedule.'); return r.result();
    }); },
    conditions(actor,session,scope,state) {
      if (!state) { const r = diagnostics(); r.check(false,'/conditions','The learning source policy requires its actual complete canonical owner.'); return r.result(); }
      return proven(state,view => {
        if (!session.forgottenMoves?.length) return prior.conditions(actor,session,scope,view);
        const problem = forgottenProblem(session,catalogs,state.revision,state.roster);
        if (problem || scope.kind !== 'live' || state.session !== session || session.actors[actor.actorId] !== actor) { const r = diagnostics(); r.check(false,'/forgottenMoves',problem ?? 'Only the actual live session owns forgotten source slots.'); return r.result(); }
        // Historical source slots are only frozen condition provenance witnesses.
        // Real actor slots, AI, PP and commands never regain forgotten moves.
        const actors = { ...session.actors };
        for (const source of Object.values(actors)) {
          const retired = session.forgottenMoves.filter(row => row.actorId === source.actorId).map(row => row.moveSlot);
          if (retired.length) actors[source.actorId] = { ...source,moves: { ...source.moves,slots: /** @type {typeof source.moves.slots} */ (/** @type {unknown} */ ([...source.moves.slots,...retired])) } };
        }
        return prior.conditions(actors[actor.actorId] ?? actor,{ ...session,actors },scope,view);
      });
    },
  };
}
