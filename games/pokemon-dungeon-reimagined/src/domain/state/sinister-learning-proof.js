/** Direct prospective learning proof. Actual turn source PCs reuse the preserved
 * pure PC predicate on the same state; terminal/impact source ownership is v25.
 * Complete scene/history/actor admission remains the raw factory's obligation.
 * @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').ExpeditionState} Session
 * @typedef {import('../gameplay/support.js').Catalogs} Catalogs */
import { SINISTER_WORK_REVISION } from './sinister-work-revision.js';
import { sinisterTurnProblem, sinisterTerminalPc } from './sinister-turn-proof.js';
import { sinisterAwardProblem } from './sinister-award-proof.js';
import { learningPc as turnLearningPc, forgottenProblem } from './escort-learning-proof.js';
import { learningCandidates } from '../gameplay/escort-native-learning.js';
import { randomInteger } from '../rng.js';
import { fingerprint } from './relations.js';
import { maxHp, value } from '../gameplay/support.js';
/** @param {State} state @param {Session} s @param {Pick<import('../../contracts/move-learning.js').LearningChoice,'origin'|'schedulerTag'>|undefined} [l] */
function learningPc(state,s,l = s.learning) {
  const w = s.sinisterTurn;
  if (!l || !w || w.checkpoint || w.combat.sequence || w.move && !w.terminal) return false;
  if (l.origin.kind === 'turn') return !w.terminal && turnLearningPc(state,s,l);
  return !!w.terminal && fingerprint(l.origin) === fingerprint(w.terminal.origin) && fingerprint(l.schedulerTag) === fingerprint(w.terminal.schedulerTag) && sinisterTerminalPc(state,s,w.terminal);
}
/** @param {State} state @param {import('../../contracts/move-learning.js').LearningOrigin} origin @param {import('../../contracts/escort-work.js').EscortLearningWork['schedulerTag']} schedulerTag */
export function sinisterLearningOriginProblem(state,origin,schedulerTag) {
  return !state.session || !learningPc(state,state.session,{ origin,schedulerTag }) ? 'Learning must start at its real native producer PC.' : null;
}
/** Full proof of every new field before predecessor metadata validation. Old
 * resources/history and all unmodified source/state owners still run independently.
 * @param {State} state @param {Catalogs} catalogs @param {number} [revision] @returns {string|null} */
export function sinisterLearningProblem(state,catalogs,revision = state.revision) {
  const s = state.session,l = s?.learning,result = state.pendingResult;
  if (state.contentRevision !== SINISTER_WORK_REVISION) return 'Unknown exact learning identity.';
  const native = sinisterTurnProblem(state,catalogs,revision); if (native) return native;
  if (s?.escortGuest || s?.scheduler.teamSlots.some(id => id && s.actors[id]?.binding.kind !== 'roster')) return 'Genuine v24 guest sessions keep their original learning owner until return.';
  if (s) { const problem = sinisterAwardProblem(state,catalogs,revision) ?? forgottenProblem(s,catalogs,revision,state.roster); if (problem) return problem; }
  if (Object.values(state.rescue.suspended?.session.actors ?? {}).some(actor => actor.pendingExperience)) return 'Live EXP producer cannot invent suspended rescue credit.';
  if (state.rescue.suspended?.session.learning || state.rescue.suspended?.session.forgottenMoves) return 'This live learning producer cannot invent suspended rescue history.';
  const workIssue = sinisterLearningWorkProblem(state,catalogs,revision); if (workIssue) return workIssue;
  if (!l) return result?.kind === 'move-learn-choice' || s?.scheduler.kind === 'choice-paused' && !state.earlyWork?.clientPrompt ? 'A learning prompt requires its actual producer.' : null;
  if (!s || s.status !== 'active' || state.earlyWork?.clientPrompt || !result || result.kind !== 'move-learn-choice' || s.scheduler.kind !== 'choice-paused' || result.resultId !== s.scheduler.resultId || result.sessionId !== s.sessionId || result.owner.kind !== 'actor' || result.owner.actorId !== l.actorId || result.moveId !== l.moveId || result.createdRevision !== l.selectionRevision || result.cursor !== 0 || !result.canDecline || l.selectionRevision <= s.entry.entryRevision || l.selectionRevision > revision) return 'Learning result/actor/session/revision has no exclusive live producer.';
  const actor = s.actors[l.actorId]; if (!actor || actor.binding.kind !== 'roster' || actor.affiliation !== 'team' || actor.pendingExperience || actor.moves.slots.some(slot => slot === null) || actor.growth.level !== l.level || l.beforeGrowth.level+1 !== l.level || l.beforeGrowth.totalExperience.denominator !== 1 || fingerprint(l.beforeGrowth.totalExperience) !== fingerprint(actor.growth.totalExperience) || fingerprint(l.beforeGrowth.permanentStatBonuses) !== fingerprint(actor.growth.permanentStatBonuses) || l.beforeGrowth.iqPoints !== actor.growth.iqPoints) return 'Source level/experience/unchanged four slots require their native prior growth.';
  const p = catalogs.species.getProfile(actor.identity.speciesId,actor.identity.formId),old = catalogs.species.getGrowthAtLevel(p.id,l.beforeGrowth.level),next = catalogs.species.getGrowthAtLevel(p.id,l.level);
  if (fingerprint(l.beforeGrowth.naturalStats) !== fingerprint(old.stats) || fingerprint(actor.growth.naturalStats) !== fingerprint(next.stats) || value(actor.growth.totalExperience) < next.cumulativeExperience || l.beforeHp < 0 || l.beforeHp > old.stats.hp+l.beforeGrowth.permanentStatBonuses.hp || actor.resources.hp !== Math.min(maxHp(actor),l.beforeHp+next.stats.hp-old.stats.hp)) return 'Stats/HP must be the one actual sourced level increment before the candidate.';
  const candidates = learningCandidates(actor,l.level,catalogs); if (!candidates.length) return 'This level has no source candidate.';
  let sampled; try { sampled = randomInteger(l.candidateRng,candidates.length); } catch { return 'Invalid pre-candidate browser RNG.'; }
  if (candidates[sampled.value] !== l.moveId || fingerprint(sampled.state) !== fingerprint(state.random.combatRecruitment)) return 'The exact source-selected candidate must own the sole saved browser sample.';
  if (fingerprint({ moves: actor.moves,pp: actor.battleMoves }) !== l.movesFingerprint || fingerprint(s.scheduler.continuation) !== l.resumeFrameFingerprint || fingerprint(result.replaceableSlotIds) !== fingerprint(actor.moves.slots.flatMap(slot => slot ? [slot.moveSlotId] : [])) || fingerprint(result.continuation) !== fingerprint({ kind: 'resume-turn',sessionId: s.sessionId,gate: { kind: 'result',resultId: result.resultId } })) return 'Saved unchanged slots/PP/result gate and exact native PC differ from the producer.';
  if (l.origin.kind === 'settlement') {
    const casualties = l.origin.casualties;
    if (!casualties || new Set(casualties.map(row => row.actorId)).size !== casualties.length || casualties.length > 4 || (l.origin.outcome === 'fainting') !== (casualties.length > 0)) return 'Only actual unrecovered source casualties own a pending defeat.';
    for (const row of casualties) {
      const a = s.actors[row.actorId];
      if (!a || a.binding.kind !== 'roster' || !s.teamOrder.includes(a.actorId) || row.level < 1 || row.level > a.growth.level) return 'Pending defeat lost its original casualty.';
      const profile = catalogs.species.getProfile(a.identity.speciesId,a.identity.formId),atFaint = catalogs.species.getGrowthAtLevel(profile.id,row.level);
      if (a.resources.hp !== a.growth.naturalStats.hp-atFaint.stats.hp) return 'Pending casualty HP only reflects its preserved pre-copyback growth increment.';
    }
  }
  const order = s.scheduler.teamSlots.flatMap(id => id ? [id] : []);
  if (fingerprint(order) !== fingerprint(l.actorOrder) || l.actorIndex < 0 || l.actorIndex >= order.length || order[l.actorIndex] !== l.actorId || !learningPc(state,s)) return 'Learning cannot overtake its actual native recipient/settlement traversal or saved PC.';
  for (const id of order.slice(0,l.actorIndex)) {
    const prior = s.actors[id];
    if (!prior || prior.pendingExperience || prior.growth.level < 100 && value(prior.growth.totalExperience) >= catalogs.species.getGrowthAtLevel(catalogs.species.getProfile(prior.identity.speciesId,prior.identity.formId).id,prior.growth.level+1).cumulativeExperience) return 'A later recipient cannot overtake unresolved earlier team growth.';
  }
  if (l.origin.kind === 'scene') {
    const scene = state.pendingScene,origin = l.origin;
    if (!s.sinisterTurn?.terminal || fingerprint(s.sinisterTurn.terminal.origin) !== fingerprint(origin)) return 'Only the captured actual terminal scene owns this learning traversal.';
    if (state.mode !== 'scene' || !scene || scene.sceneId !== l.origin.sceneId || scene.sceneInstanceId !== l.origin.sceneInstanceId || scene.cursor !== l.origin.cursor || scene.awaiting.kind !== 'advance' || l.schedulerTag.kind !== 'scene-paused' || l.schedulerTag.sceneInstanceId !== scene.sceneInstanceId) return 'Only the unchanged real terminal scene acknowledgment owns this deferred continuation.';
  } else if (state.pendingScene || state.mode !== 'dungeon') return 'Native turn/settlement input requires the actual dungeon owner.';
  return null;
}

/** Direct raw successor traversal admission; never projects a fake LearningChoice
 * or changes the source frame. Every saved yield owns one real recipient index
 * and its exact native parent PC, including true terminal completed-action PC.
 * @param {State} state @param {Catalogs} catalogs @param {number} [revision] @returns {string|null} */
export function sinisterLearningWorkProblem(state,catalogs,revision = state.revision) {
  const native = sinisterTurnProblem(state,catalogs,revision); if (native) return native;
  const s = state.session,work = s?.learningWork;
  if (!work) return s?.scheduler.kind === 'learning-continuing' ? 'Learning continuation requires its genuine recipient traversal owner.' : null;
  if (!s || state.contentRevision !== SINISTER_WORK_REVISION || state.earlyWork?.clientPrompt || s.status !== 'active' || !['learning-continuing','choice-paused'].includes(s.scheduler.kind) || work.createdRevision <= s.entry.entryRevision || work.createdRevision > revision || fingerprint(s.scheduler.continuation) !== work.resumeFrameFingerprint || !learningPc(state,s,work)) return 'Saved EXP traversal needs its actual exact revision/session/committed native parent PC.';
  const order = s.scheduler.teamSlots.flatMap(id => id ? [id] : []);
  if (fingerprint(order) !== fingerprint(work.actorOrder) || work.actorIndex < 0 || work.actorIndex > order.length || (work.phase === 'return') !== (work.actorIndex === order.length)) return 'Native traversal preserves every real occupied slot and one exact next-recipient/return cursor.';
  if (s.learning) {
    if (!state.pendingResult || state.pendingResult.kind !== 'move-learn-choice' || work.phase !== 'recipient' || s.learning.actorIndex !== work.actorIndex || fingerprint(s.learning.actorOrder) !== fingerprint(order) || fingerprint(s.learning.origin) !== fingerprint(work.origin) || fingerprint(s.learning.schedulerTag) !== fingerprint(work.schedulerTag)) return 'Candidate input remains exclusive to the actual current recipient of saved EXP work.';
  } else if (state.pendingResult || s.scheduler.kind !== 'learning-continuing') return 'Automatic EXP continuation is a yield, with no fabricated input or pending result.';
  for (const id of order.slice(0,work.actorIndex)) {
    const prior = s.actors[id];
    if (!prior || prior.binding.kind !== 'roster' || prior.pendingExperience || prior.growth.level < 100 && value(prior.growth.totalExperience) >= catalogs.species.getGrowthAtLevel(catalogs.species.getProfile(prior.identity.speciesId,prior.identity.formId).id,prior.growth.level+1).cumulativeExperience) return 'Later EXP work cannot overtake earlier unresolved native growth.';
  }
  if (work.origin.kind === 'scene') {
    const scene = state.pendingScene;
    if (!s.sinisterTurn?.terminal || fingerprint(s.sinisterTurn.terminal.origin) !== fingerprint(work.origin) || state.mode !== 'scene' || !scene || scene.sceneId !== work.origin.sceneId || scene.sceneInstanceId !== work.origin.sceneInstanceId || scene.cursor !== work.origin.cursor || scene.awaiting.kind !== 'advance' || work.schedulerTag.kind !== 'scene-paused' || work.schedulerTag.sceneInstanceId !== scene.sceneInstanceId) return 'Deferred scene EXP returns only to the captured actual final acknowledgment.';
  } else if (state.pendingScene || state.mode !== 'dungeon') return 'Native EXP yield retains the actual dungeon mode and parent.';
  if (work.origin.kind === 'settlement') {
    const casualties = work.origin.casualties;
    if (!casualties || casualties.length > 4 || new Set(casualties.map(row => row.actorId)).size !== casualties.length || (work.origin.outcome === 'fainting') !== (casualties.length > 0)) return 'Saved terminal work retains its actual original casualties and outcome.';
    for (const row of casualties) {
      const actor = s.actors[row.actorId];
      if (!actor || actor.binding.kind !== 'roster' || !s.teamOrder.includes(actor.actorId) || row.level < 1 || row.level > actor.growth.level) return 'Terminal traversal retains each original roster casualty.';
      const original = catalogs.species.getGrowthAtLevel(catalogs.species.getProfile(actor.identity.speciesId,actor.identity.formId).id,row.level);
      if (actor.resources.hp !== actor.growth.naturalStats.hp-original.stats.hp) return 'Saved casualty HP reflects only genuine drained native growth.';
    }
  }
  return null;
}
