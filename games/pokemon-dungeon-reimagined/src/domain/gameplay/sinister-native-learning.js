/** Direct new-session v25 learning. Genuine active v24 sessions keep their
 * original consumer and envelope until real return; no imported prompt retag.
 * @typedef {import('../../contracts/campaign.js').SessionActor} Actor
 * @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {import('./support.js').Catalogs} Catalogs
 * @typedef {import('../../contracts/move-learning.js').LearningOrigin} Origin */
import { SINISTER_WORK_REVISION } from '../state/sinister-work-revision.js';
import { sinisterLearningProblem, sinisterLearningOriginProblem } from '../state/sinister-learning-proof.js';
import { learningCandidates, compactMoves, forgottenSlots } from './escort-native-learning.js';
import { sinisterSchedulerFields as schedulerFields, markSinisterTerminalReturn } from './sinister-turn-work.js';
import { fingerprint } from '../state/relations.js';
import { allocate, blocked, clone, draw, maxHp, profile, value } from './support.js';
/** All retained resources remain untouched until actual explicit confirmation.
 * @param {Context} context @param {Actor} actor @param {import('../../contracts.js').MoveId} moveId
 * @param {Catalogs} catalogs @param {import('../../contracts.js').MoveSlotId|null} [replaceSlotId] */
function learnMove(context,actor,moveId,catalogs,replaceSlotId = null) {
  const removed = new Set(replaceSlotId ? forgottenSlots(actor,replaceSlotId) : []);
  const keep = actor.moves.slots.flatMap(slot => slot && !removed.has(slot.moveSlotId) ? [slot] : []);
  if (keep.length >= 4) return blocked('learning-free-slot');
  const s = context.state.session; if (!s) return blocked('learning-session');
  for (const slot of actor.moves.slots) if (slot && removed.has(slot.moveSlotId)) (s.forgottenMoves ??= []).push({ actorId: actor.actorId,moveSlot: clone(slot),forgottenRevision: context.state.revision+1 });
  const flags = s.sinisterTurn?.combat.lastUsed[actor.actorId];
  if (!flags) return blocked('sinister-learning-last-used');
  flags.slots = flags.slots.filter(id => !removed.has(id));
  actor.moves.links = actor.moves.links.map(link => link.filter(id => !removed.has(id))).filter(link => link.length >= 2);
  actor.battleMoves.slots = actor.battleMoves.slots.filter(slot => !removed.has(slot.moveSlotId));
  if (actor.moves.setMoveSlotId && removed.has(actor.moves.setMoveSlotId)) actor.moves.setMoveSlotId = null;
  if (actor.memory.lastUsedMove?.moveSlotId && removed.has(actor.memory.lastUsedMove.moveSlotId)) actor.memory.lastUsedMove = null;
  actor.gains.moveBoosts = actor.gains.moveBoosts.filter(gain => !removed.has(gain.moveSlotId));
  const moveSlotId = allocate(context.state,'move-slot');
  keep.push({ moveSlotId,moveId,enabled: true,powerBoost: 0,ppCapacityBonus: 0 });
  actor.moves.slots = /** @type {Actor['moves']['slots']} */ ([...keep,...Array(4-keep.length).fill(null)]);
  actor.battleMoves.slots.push({ moveSlotId,currentPp: catalogs.effects.getMove(moveId).numeric.pp,sealed: false,usedForExperience: false });
  context.emit({ type: 'message',messageId: 'move-learned' });
}
/** Reused draft's native stats/HP-before-choice order, corrected to a real
 * pending result and native saved origin. No UI/load/ack draws this candidate.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs
 * @param {Origin} origin @param {import('../../contracts.js').ActorId[]} order @param {number} actorIndex */
function grow(context,actor,catalogs,origin,order,actorIndex) {
  const s = context.state.session; if (!s || actor.binding.kind !== 'roster' || actor.affiliation !== 'team') return false;
  const p = profile(actor.identity,catalogs);
  const pending = actor.pendingExperience;
  if (pending) {
    if (actor.resources.hp === 0) { actor.growth.totalExperience = clone(pending.experienceBefore); actor.gains.experience = clone(pending.gainsBefore); }
    else context.emit({ type: 'message',messageId: 'experience-gained' });
    delete actor.pendingExperience;
  }
  while (actor.growth.level < 100) {
    const next = catalogs.species.getGrowthAtLevel(p.id,actor.growth.level+1);
    if (value(actor.growth.totalExperience) < next.cumulativeExperience) break;
    if (!compactMoves(actor)) return blocked('learning-noncompact-inherited-slots');
    const beforeGrowth = clone(actor.growth),beforeHp = actor.resources.hp;
    const hp = maxHp(actor); actor.growth.level = next.level; actor.growth.naturalStats = { ...next.stats };
    actor.resources.hp = Math.min(maxHp(actor),actor.resources.hp+maxHp(actor)-hp);
    context.emit({ type: 'message',messageId: 'level-up' });
    const candidates = learningCandidates(actor,next.level,catalogs),candidateRng = clone(context.state.random.combatRecruitment);
    const moveId = candidates.length ? candidates[draw(context.state,candidates.length)] : null;
    if (!moveId) continue;
    if (actor.moves.slots.includes(null)) { learnMove(context,actor,moveId,catalogs); continue; }
    if (context.state.pendingResult || s.learning || !['ready','scene-paused'].includes(s.scheduler.kind)) return blocked('learning-choice-owner');
    const resultId = allocate(context.state,'result');
    const schedulerTag = s.scheduler.kind === 'scene-paused' ? { kind: /** @type {const} */ ('scene-paused'),sceneInstanceId: s.scheduler.sceneInstanceId } : { kind: /** @type {const} */ ('ready') };
    s.learning = { actorId: actor.actorId,level: next.level,moveId,selectionRevision: context.state.revision+1,movesFingerprint: fingerprint({ moves: actor.moves,pp: actor.battleMoves }),resumeFrameFingerprint: fingerprint(s.scheduler.continuation),candidateRng,beforeGrowth,beforeHp,origin: clone(origin),actorOrder: [...order],actorIndex,schedulerTag };
    context.state.pendingResult = { resultId,createdRevision: context.state.revision+1,cursor: 0,kind: 'move-learn-choice',sessionId: s.sessionId,owner: { kind: 'actor',actorId: actor.actorId },moveId,
      replaceableSlotIds: actor.moves.slots.flatMap(slot => slot ? [slot.moveSlotId] : []),canDecline: true,continuation: { kind: 'resume-turn',sessionId: s.sessionId,gate: { kind: 'result',resultId } } };
    s.scheduler = { ...schedulerFields(s.scheduler),kind: 'choice-paused',resultId }; return true;
  }
  return false;
}
/** Native full occupied-slot order; no subset, speculative recipient or old
 * incomplete prompt may initialize this new traversal. No-growth terminal work
 * remains with the separately captured terminal, rather than disappearing here.
 * @param {Context} context @param {Catalogs} catalogs @param {Origin} origin */
export function processSinisterLearning(context,catalogs,origin) {
  const s = context.state.session,w = s?.sinisterTurn;
  if (context.state.contentRevision !== SINISTER_WORK_REVISION || !s || !w || s.escortGuest || s.scheduler.teamSlots.some(id => id && s.actors[id]?.binding.kind !== 'roster')) return blocked('sinister-learning-session');
  if (sinisterLearningProblem(context.state,catalogs,context.state.revision+1)) return blocked('sinister-learning-raw');
  if (w.checkpoint || w.combat.sequence || w.move && !w.terminal) return blocked('sinister-learning-before-completion');
  if (origin.kind !== 'turn' && (!w.terminal || fingerprint(origin) !== fingerprint(w.terminal.origin))) return blocked('sinister-learning-terminal-marker');
  const prior = s.learningWork;
  if (prior) {
    if (fingerprint(prior.origin) !== fingerprint(origin)) return blocked('sinister-learning-parent');
    return true;
  }
  if (s.learning || !['ready','scene-paused'].includes(s.scheduler.kind)) return blocked('sinister-learning-start-tag');
  const ids = s.scheduler.teamSlots.flatMap(id => id ? [id] : []);
  const needsGrowth = ids.some(id => { const a = s.actors[id]; return a && (a.pendingExperience || a.growth.level < 100 && value(a.growth.totalExperience) >= catalogs.species.getGrowthAtLevel(profile(a.identity,catalogs).id,a.growth.level+1).cumulativeExperience); });
  if (!needsGrowth) return false;
  const schedulerTag = s.scheduler.kind === 'scene-paused' ? { kind: /** @type {const} */ ('scene-paused'),sceneInstanceId: s.scheduler.sceneInstanceId } : { kind: /** @type {const} */ ('ready') };
  if (sinisterLearningOriginProblem(context.state,origin,schedulerTag)) return blocked('sinister-learning-source-pc');
  s.learningWork = { phase: 'recipient',origin: clone(origin),actorOrder: ids,actorIndex: 0,createdRevision: context.state.revision+1,resumeFrameFingerprint: fingerprint(s.scheduler.continuation),schedulerTag };
  drainRecipient(context,catalogs); return true;
}
/** At most one real recipient per dispatch, including one actor's native level
 * loop. Never runs another recipient from a move-choice acknowledgment.
 * @param {Context} context @param {Catalogs} catalogs */
function drainRecipient(context,catalogs) {
  const s = context.state.session,work = s?.learningWork;
  if (!s || !work || work.phase !== 'recipient' || s.learning) return blocked('sinister-learning-recipient');
  s.scheduler = { ...schedulerFields(s.scheduler),...work.schedulerTag };
  const actor = s.actors[work.actorOrder[work.actorIndex] ?? ''];
  if (!actor || actor.binding.kind !== 'roster' || actor.affiliation !== 'team') return blocked('sinister-learning-real-roster');
  if (grow(context,actor,catalogs,work.origin,work.actorOrder,work.actorIndex)) return;
  work.actorIndex++;
  if (work.actorIndex === work.actorOrder.length) work.phase = 'return';
  s.scheduler = { ...schedulerFields(s.scheduler),kind: 'learning-continuing' };
}
/** Terminal growth ends at the mandatory saved return marker. Ordinary growth
 * resumes its real native engine parent, with no extra growth in that dispatch.
 * @param {Context} context @param {Catalogs} catalogs
 * @param {(context:Context)=>import('../turns/types.js').TurnOutcome} resumeTurn
 * @returns {import('../turns/types.js').TurnOutcome} */
export function advanceSinisterLearning(context,catalogs,resumeTurn) {
  const s = context.state.session,work = s?.learningWork;
  if (!s || !work || s.scheduler.kind !== 'learning-continuing' || context.state.pendingResult || sinisterLearningProblem(context.state,catalogs)) return blocked('sinister-learning-advance-owner');
  if (work.phase === 'recipient') { drainRecipient(context,catalogs); return { kind: s.learning ? 'prompt' : 'yielded',consumedTurn: false }; }
  s.scheduler = { ...schedulerFields(s.scheduler),...work.schedulerTag };
  delete s.learningWork;
  if (work.origin.kind === 'turn') return resumeTurn(context);
  if (!s.sinisterTurn?.terminal || fingerprint(s.sinisterTurn.terminal.origin) !== fingerprint(work.origin)) return blocked('sinister-learning-return-source');
  markSinisterTerminalReturn(context,catalogs);
  return { kind: 'yielded',consumedTurn: false };
}
/** @param {Catalogs} catalogs @returns {import('../turns/types.js').CommandHandler} */
export function sinisterLearningHandler(catalogs) { return {
  plan(state,intent) {
    const result = state.pendingResult;
    return state.contentRevision === SINISTER_WORK_REVISION && intent.type === 'ackResult' && intent.choice.kind === 'move' && result?.kind === 'move-learn-choice' && state.session?.learning && state.session.learningWork && (intent.choice.replaceSlotId === null && result.canDecline || intent.choice.replaceSlotId !== null && result.replaceableSlotIds.includes(intent.choice.replaceSlotId)) ? { kind: 'mutation' } : { kind: 'rejected',reason: 'unavailable' };
  },
  apply(context,intent) {
    const s = context.state.session,result = context.state.pendingResult,owner = s?.learning,work = s?.learningWork;
    if (!s || !owner || !work || intent.type !== 'ackResult' || intent.choice.kind !== 'move' || result?.kind !== 'move-learn-choice' || sinisterLearningProblem(context.state,catalogs)) return blocked('sinister-learning-raw-choice');
    const actor = s.actors[owner.actorId]; if (!actor || fingerprint({ moves: actor.moves,pp: actor.battleMoves }) !== owner.movesFingerprint || fingerprint(s.scheduler.continuation) !== owner.resumeFrameFingerprint) return blocked('sinister-learning-resume-owner');
    if (intent.choice.replaceSlotId !== null) learnMove(context,actor,owner.moveId,catalogs,intent.choice.replaceSlotId);
    else context.emit({ type: 'message',messageId: 'move-learning-declined' });
    context.state.pendingResult = null; delete s.learning;
    // Same actual recipient remains owed; ACK never creates or drains another.
    if (work.phase !== 'recipient' || work.actorIndex !== owner.actorIndex || fingerprint(work.actorOrder) !== fingerprint(owner.actorOrder) || fingerprint(work.origin) !== fingerprint(owner.origin)) return blocked('sinister-learning-choice-traversal');
    s.scheduler = { ...schedulerFields(s.scheduler),kind: 'learning-continuing' };
    return { kind: 'changed',resumeDungeon: false };
  },
}; }
/** Concrete learning portion of the saved terminal coordinator. The caller
 * still supplies its real native turn engine and exact terminal cleanup parent.
 * @param {Catalogs} catalogs
 * @param {(context:Context)=>import('../turns/types.js').TurnOutcome} resumeTurn
 * @param {(context:Context,terminal:import('../../contracts/sinister-work.js').SinisterTerminalReceipt)=>void} resumeTerminal
 * @returns {import('../turns/sinister-advance.js').SinisterTerminalOwners} */
export function createSinisterLearningOwners(catalogs,resumeTurn,resumeTerminal) {
  if (typeof resumeTurn !== 'function' || typeof resumeTerminal !== 'function') throw new TypeError('Actual Sinister native and terminal parents are required.');
  return {
    drain(context,terminal) {
      if (context.state.session?.sinisterTurn?.terminal !== terminal || terminal.phase !== 'captured') return blocked('sinister-learning-captured-parent');
      return processSinisterLearning(context,catalogs,terminal.origin) ? 'pending' : 'drained';
    },
    advanceLearning: context => advanceSinisterLearning(context,catalogs,resumeTurn),
    resume: resumeTerminal,
  };
}
