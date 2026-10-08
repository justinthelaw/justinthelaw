import { createCampaignContent as createBronzeContent } from './bronze-jobs-campaign.js';
import { createEscortWorkContent, SINISTER_UNLOCK, CATERPIE_ACTOR } from '../authored/escort-work.js';
import { createEscortResourcePolicies, escortResourceProof } from './escort-resources.js';
import { checkEscortHeritage } from './escort-heritage.js';
import { checkEscortWorkHistory } from './escort-work-history.js';
import { checkEscortJob } from './escort-jobs.js';
import { escortTownPolicy, escortScenePolicy } from './escort-ground.js';
import { ESCORT_WORK_REVISION } from '../../src/domain/state/escort-work-revision.js';
import { BRONZE_JOBS_REVISION } from '../../src/domain/state/bronze-jobs-revision.js';
import { steelSame as same, steelAppend as append } from './steel-progress.js';
import { diagnostics } from './pokemon-rules.js';
import { TOWN } from '../authored/town.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {State} state */
const chapterWork = state => !!state.friends && ['work-three','meanies-morning','meanies-ready','meanies','work-two','caterpie-morning','caterpie-ready','caterpie','sinister-ready'].includes(state.friends.phase);
/** Earlier authentic episode only: after independent complete new-field proof,
 * expose its same resources/history/actors and captured native scheduler tag to
 * the original progress/ground/scene owner. No later episode or guest can enter.
 * @param {State} state @returns {State} */
function earlierEpisode(state) {
  if (chapterWork(state) || state.session?.escortGuest || Object.values(state.session?.actors ?? {}).some(actor => actor.binding.kind === 'escort-guest')) throw new TypeError('Later work cannot enter an original episode callback.');
  const session = state.session,learning = session?.learning ?? session?.learningWork;
  if (!session) return { ...state,contentRevision: BRONZE_JOBS_REVISION };
  const view = { ...session }; delete view.learning; delete view.learningWork; delete view.forgottenMoves;
  const { resultId,sceneInstanceId,...scheduler } = /** @type {typeof session.scheduler & {resultId?:string;sceneInstanceId?:string}} */ (session.scheduler); void resultId; void sceneInstanceId;
  if (learning) view.scheduler = { ...scheduler,...learning.schedulerTag };
  return { ...state,contentRevision: BRONZE_JOBS_REVISION,session: view,pendingResult: session.learning ? null : state.pendingResult };
}
/** Actual source result, independent of callback traversal order.
 * @param {import('../../src/contracts/campaign.js').PendingResult} result @param {State} state */
function stationResult(result,state) {
  const r = diagnostics(),returned = state.earlyWork?.returned,job = result.kind === 'job-reward' ? state.progress.jobs[result.jobId] : null;
  r.check(result.kind === 'job-reward' && state.pendingResult === result && returned?.outcome === 'success' && returned.cursor > 0 && returned.jobIds[returned.cursor-1] === result.jobId && !state.earlyWork?.reward && state.mode === 'town' && result.cursor === 0 && result.createdRevision === result.grantedRevision && job?.phase.kind === 'claimed' && job.phase.claimedRevision === result.grantedRevision && result.grantedRevision <= state.revision && same(result.reward,job.reward) && same(result.continuation,{ kind: 'town',destination: { kind: 'town',mapDefinitionId: TOWN.post,entryId: 'ordinary-reward' } }),'/pendingResult','The genuine complete station claim owns this exact reward/result/revision and next queue cursor.');
  return r.result();
}
/** Complete raw proof repeats before every state-bearing callback. Resource
 * primitives retain actual actors, guest, slots, moves and containers.
 * @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} [authored]
 * @returns {Readonly<import('../../src/contracts/campaign.js').CampaignContent>} */
export function createCampaignContent(catalogs,authored = createEscortWorkContent()) {
  if (!same(authored,createEscortWorkContent())) throw new TypeError('Unknown complete escort/second-work authoring contract.');
  const prior = createBronzeContent(catalogs),runtimeCatalogs = /** @type {import('../../src/domain/gameplay/support.js').Catalogs} */ (catalogs);
  const town = escortTownPolicy(catalogs),scene = escortScenePolicy(authored);
  /** @param {State} state */
  function complete(state) {
    const raw = escortResourceProof(state,runtimeCatalogs); if (!raw.ok) return raw;
    const r = diagnostics();
    // Rescue exchange is not fabricated by guest admission; original unsupported
    // restoration/format owners remain explicit requirements on actual records.
    append(r,prior.policies.rescue(state));
    if (chapterWork(state)) {
      append(r,checkEscortHeritage(state,catalogs)); append(r,checkEscortWorkHistory(state,runtimeCatalogs));
      const extra = Object.values(state.roster).filter(row => row.pokemonId !== state.profile.heroId && row.pokemonId !== state.profile.partnerId);
      r.check(extra.length <= 1 && extra.every(row => row.pokemonId === state.friends?.magnemiteId),'/roster','Only the genuine surviving story gift extends the original roster; guest clients never acquire permanent records.');
      r.check(state.selectedPartyIds.length >= 1 && state.selectedPartyIds.length <= 3 && state.selectedPartyIds[0] === state.profile.heroId && state.selectedPartyIds.reduce((sum,id) => { const row = state.roster[id]; return sum+(row ? catalogs.species.getProfile(row.identity.speciesId,row.identity.formId).bodySize : 99); },0) <= 6,'/selectedPartyIds','Actual selected source roster1–3 retains its leader and six-body limit independently of an optional temporary slot4.');
      append(r,town(state.town,state));
      if (state.pendingScene) append(r,scene(state.pendingScene,state));
      if (state.pendingResult && state.pendingResult.kind !== 'move-learn-choice') append(r,stationResult(state.pendingResult,state));
    } else {
      const view = earlierEpisode(state);
      append(r,prior.policies.progress(view)); append(r,prior.policies.town(view.town,view));
      if (view.pendingScene) append(r,prior.policies.scene(view.pendingScene,view));
      if (view.pendingResult) append(r,prior.policies.result(view.pendingResult,view));
    }
    return r.result();
  }
  /** @param {State} state @param {()=>import('../../src/contracts/campaign.js').RuleCheck} callback */
  function proven(state,callback) { const raw = complete(state); return raw.ok ? callback() : raw; }
  const identities = Object.freeze({ ...prior.identities,has(/** @type {import('../../src/contracts.js').CatalogKind} */ kind,/** @type {string} */ id) {
    return kind === 'milestone' && id === SINISTER_UNLOCK || kind === 'story-actor' && id === CATERPIE_ACTOR.id || prior.identities.has(kind,id);
  } });
  /** @type {Policies} */
  const policies = {
    ...createEscortResourcePolicies(runtimeCatalogs,identities,complete),
    progress: complete,
    rescue: state => proven(state,() => prior.policies.rescue(state)),
    town: (value,state) => proven(state,() => chapterWork(state) ? town(value,state) : prior.policies.town(value,earlierEpisode(state))),
    scene: (value,state) => proven(state,() => chapterWork(state) ? scene(value,state) : prior.policies.scene(value,earlierEpisode(state))),
    job: (value,state) => proven(state,() => chapterWork(state) ? checkEscortJob(value,state) : prior.policies.job(value,earlierEpisode(state))),
    result: (value,state) => proven(state,() => value.kind === 'move-learn-choice' ? { ok: true } : chapterWork(state) ? stationResult(value,state) : prior.policies.result(value,earlierEpisode(state))),
  };
  return Object.freeze({ ...prior,contentRevision: ESCORT_WORK_REVISION,identities,policies: Object.freeze(policies) });
}
