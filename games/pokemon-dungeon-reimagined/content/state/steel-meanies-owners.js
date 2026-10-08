import { FRIENDS } from '../authored/friends.js';
import { STEEL } from '../authored/mt-steel.js';
import { ORDINARY_SUMMIT, MEANIES_POLICY, MEANIES_POSTING, POSTING_CURSOR } from '../authored/steel-meanies.js';
import { isScriptedPidgey } from '../../src/domain/gameplay/steel-meanies-mail.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { steelSame as same, steelAppend as append } from './steel-progress.js';
import { createScheduler } from '../../src/domain/turns.js';
import { INITIAL_SCHEDULE_POLICY_ID } from './expedition.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** Actual scene/posting provenance is proved before any prerequisite projection.
 * @param {State} state */
export function checkMeaniesOwners(state) {
  const r = diagnostics(), f = state.friends, p = state.progress, scene = state.pendingScene;
  const outside = f?.phase === 'meanies', finished = f?.phase === 'work-two';
  const posted = finished || outside && (scene?.cursor ?? -1) >= POSTING_CURSOR;
  const receipts = p.appliedGrants.filter(row => row.grantId === MEANIES_POSTING), receipt = receipts[0];
  const morning = p.seenScenes[FRIENDS.scenes[5] ?? ''], encounter = p.seenScenes[FRIENDS.scenes[6] ?? ''];
  const jobs = Object.values(p.jobs).filter(job => job.source.kind === 'generated' && job.source.generationPolicyId === MEANIES_POLICY);
  r.check(receipts.length === Number(posted), '/appliedGrants', 'Only the actual op6 cursor commits one exact posting receipt.');
  if (outside || finished) {
    r.check(morning && morning.count === 1 && (outside ? scene && scene.sceneId === FRIENDS.scenes[6] && scene.entryRevision > morning.lastRevision && !encounter : encounter && encounter.count === 1 && encounter.firstRevision === encounter.lastRevision && encounter.lastRevision > (receipt?.revision ?? state.revision) && encounter.firstDay === state.town.day && encounter.lastDay === state.town.day), '/seenScenes', 'The outside encounter follows the completed inside wakeup and finishes after its posting, on the same day.');
    if (receipt) r.check(receipt.day === state.town.day && bounded(receipt.revision,outside ? (scene?.entryRevision ?? state.revision)+POSTING_CURSOR : (morning?.lastRevision ?? state.revision)+POSTING_CURSOR+1,state.revision), '/appliedGrants', 'Posting commits after the real Pelipper cursor; save conversion never fabricates it.');
  } else r.check(!encounter, '/seenScenes', 'No outside scene receipt precedes the base exit.');
  r.check(jobs.length <= Number(posted) && (!outside || !posted || jobs.length === 1), '/jobs', 'One scripted request is retained throughout the posting scene; only later explicit discard/delete can remove it.');
  if (posted) for (const slot of state.earlyWork?.mailbox ?? []) if (slot.kind === 'job') r.check(jobs.some(job => job.jobId === slot.jobId), '/mailbox', 'Op6 replaces nonnewsletter postings without erasing accepted copies or board records.');
  for (const job of jobs) {
    const source = job.source, phase = job.phase;
    r.check(isScriptedPidgey(job) && source.kind === 'generated' && 'generatedDay' in source && source.generatedDay === receipt?.day && !state.earlyWork?.boardJobIds.includes(job.jobId), '/jobs/source', 'Only exact Pidgey/Steel3F/rescue0/MONEY1 metadata and the factual masks join this scene receipt.');
    r.check(phase.kind === 'offered' ? phase.offeredDay === receipt?.day && phase.expiryDay === null && !!state.earlyWork?.mailbox.some(slot => slot.kind === 'job' && slot.jobId === job.jobId) && !p.acceptedJobIds.includes(job.jobId) : finished && (phase.kind === 'accepted' || phase.kind === 'suspended') && p.acceptedJobIds.includes(job.jobId) && bounded(phase.acceptedRevision,(receipt?.revision ?? state.revision)+1,state.revision) && !state.earlyWork?.mailbox.some(slot => slot.kind === 'job' && slot.jobId === job.jobId), '/jobs/phase', 'Offer, acceptance and Take/Suspend retain their actual source; second-interval active/completed/reward history is held.');
  }
  return r.result();
}
/** Summit acknowledgement has its own ordinary history and grants no story clear.
 * @param {State} state */
export function checkOrdinarySummitHistory(state) {
  const r = diagnostics(), visit = state.progress.seenScenes[ORDINARY_SUMMIT], f = state.friends;
  if (!visit) return r.result();
  const rest = state.progress.seenScenes[FRIENDS.scenes[4] ?? ''], morning = state.progress.seenScenes[FRIENDS.scenes[5] ?? ''];
  r.check(f && rest && bounded(visit.count,1,state.progress.statistics.expeditions-f.priorExpeditions) && bounded(visit.firstRevision,rest.lastRevision+1,state.revision) && bounded(visit.lastRevision,visit.firstRevision,state.revision) && (visit.count > 1 || visit.firstRevision === visit.lastRevision) && bounded(visit.firstDay,f.startedDay+1,state.town.day) && bounded(visit.lastDay,visit.firstDay,state.town.day), '/seenScenes', 'Ordinary empty-summit acknowledgements belong to real post-rest runs, separately from Diglett story receipts.');
  r.check(!morning || visit.lastRevision < morning.firstRevision, '/seenScenes', 'Every ordinary summit return precedes the mandatory wakeup; the held second interval cannot add later summit history.');
  return r.result();
}
/** Purpose-qualified successor actor/entry/pause and source owners. Numerical,
 * resource, growth, floor, condition and ordinary client obligations stay shared.
 * @param {Policies} prior @param {import('../authored/opening.js').AuthoredOpening} authored
 * @returns {Pick<Policies,'actor'|'expeditionEntry'|'scheduler'|'scene'|'job'>} */
export function steelMeaniesOwners(prior, authored) { return {
  actor(actor,session,state,scope) {
    if (session.dungeonId !== STEEL.dungeonId || session.purpose.kind !== 'ordinary' || actor.binding.kind !== 'job-client') return prior.actor(actor,session,state,scope);
    // Only skip the frozen story Steel interception; its underlying ordinary
    // client owner still receives the actual Steel floor, job, identity and PC.
    return prior.actor(actor,{ ...session,dungeonId: /** @type {import('../../src/contracts.js').DungeonId} */ ('tiny-woods') },state,scope);
  },
  expeditionEntry(session,state,scope) {
    const r = diagnostics(); append(r,prior.expeditionEntry(session,state,scope));
    if (session.dungeonId === STEEL.dungeonId && session.purpose.kind === 'ordinary') r.check(state.friends?.phase === 'work-three' && state.steel?.phase === 'complete' && state.progress.native.scenarios.MAIN.chapter === 5 && state.progress.native.scenarios.MAIN.step === 5 && state.progress.native.clearCount < 3 && same(session.entry.selectedPartyIds,[state.profile.heroId,state.profile.partnerId]), '/purpose', 'Ordinary Steel is a completed-story original-pair first-interval revisit, never story readiness or a forced party conversion.');
    return r.result();
  },
  scheduler(session,state,scope) {
    if (session.dungeonId !== STEEL.dungeonId || session.purpose.kind !== 'ordinary' || session.scheduler.kind !== 'scene-paused') return prior.scheduler(session,state,scope);
    const r = diagnostics(), s = session.scheduler, fresh = createScheduler(INITIAL_SCHEDULE_POLICY_ID,[...s.teamSlots],[...s.wildSlots]);
    r.check(scope.kind === 'live' && state.pendingScene?.sceneId === ORDINARY_SUMMIT && s.sceneInstanceId === state.pendingScene.sceneInstanceId && s.continuation.terminal === 'dungeon-exit' && s.roundNumber === fresh.roundNumber && s.schedulePolicyId === fresh.schedulePolicyId && same({ ...s.continuation,terminal: 'none' },fresh.continuation), '/continuation', 'The ordinary summit pauses its freshly entered floor before any actor turn or boss callback.');
    append(r,prior.scheduler({ ...session,dungeonId: /** @type {import('../../src/contracts.js').DungeonId} */ ('tiny-woods'),scheduler: fresh },state,scope)); return r.result();
  },
  scene(scene,state) { return [ORDINARY_SUMMIT,FRIENDS.scenes[6]].includes(scene.sceneId) ? checkSteelMeaniesScene(scene,state,authored) : prior.scene(scene,state); },
  job(job,state) {
    if (job.source.kind !== 'generated' || job.source.generationPolicyId !== MEANIES_POLICY) return prior.job(job,state);
    // The actual-source owner checks the complete scene, metadata and lifecycle
    // together; no generic friend floor/seen predicate is weakened.
    return checkMeaniesOwners(state);
  },
}; }

/** Actual saved script proof, before any prerequisite projection.
 * @param {import('../../src/contracts/campaign.js').PendingScene} scene
 * @param {State} state @param {import('../authored/opening.js').AuthoredOpening} authored */
export function checkSteelMeaniesScene(scene,state,authored) {
  const r = diagnostics(), script = authored.scenes.find(row => row.id === scene.sceneId), summit = scene.sceneId === ORDINARY_SUMMIT;
  r.check(script && scene.awaiting.kind === 'advance' && scene.choices.length === 0 && bounded(scene.cursor,0,script.lines.length-1) && same(scene.continuation,script.continuation) && bounded(scene.entryRevision,1,state.revision) && state.revision-scene.entryRevision >= scene.cursor, '', 'The real authored scene retains its persisted cursor, entry and continuation.');
  r.check(scene.bindings.length === 2 && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.heroRoleId && row.pokemonId === state.profile.heroId) && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.partnerRoleId && row.pokemonId === state.profile.partnerId), '/bindings', 'The original pair stays bound; visiting rivals and Pelipper never become recruits.');
  if (summit) {
    const session = state.session;
    r.check(state.friends?.phase === 'work-three' && session?.purpose.kind === 'ordinary' && session.dungeonId === STEEL.dungeonId && session.floor.location.kind === 'boss' && session.floor.location.address.floorId === STEEL.floors[8] && session.visitedFloorIds.length === 9 && same(session.visitedFloorIds,STEEL.floors) && Object.values(session.actors).every(actor => actor.binding.kind === 'roster') && Object.keys(session.floor.exits).length === 0 && scene.entryRevision > session.entry.entryRevision, '/session', 'The independently authored POSTSTORY representation has an empty fixed9, no boss/client/guest, no invented stairs and no battle grant.');
  } else r.check(state.friends?.phase === 'meanies' && !state.session, '/friends', 'Actual MAIN5,6 base exit owns the outside script.');
  return r.result();
}
