/** Prospective direct v24 learning owner. Frozen v23 consumer is unchanged.
 * Guest occupies the actual traversal slot but source XP lock skips its growth;
 * roster EXP, candidate order, prior HP/stats, real choice PC and retired slots
 * use the preserved v23 algorithm. No predecessor projection is constructed. */
import { MOVE_LEARNING_FACTS } from '../../../content/authored/move-learning-facts.js';
import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { escortEntryProblem, ownsEscortSourceRef } from '../state/escort-entry-proof.js';
import { learningProblem } from '../state/escort-learning-proof.js';
import { fingerprint } from '../state/relations.js';
import { allocate, blocked, clone, draw, maxHp, profile, value } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor
 * @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {import('./support.js').Catalogs} Catalogs
 * @typedef {import('../../contracts/move-learning.js').LearningOrigin} Origin */
/** Keep common saved work fields; old tag payloads never cross a transition.
 * The genuine scene return identity remains in learning/work.schedulerTag.
 * @param {import('../../contracts/campaign.js').SchedulerState} current */
function schedulerFields(current) {
  const { resultId,sceneInstanceId,...scheduler } = /** @type {import('../../contracts/campaign.js').SchedulerState & {resultId?:import('../../contracts/campaign.js').ResultId;sceneInstanceId?:import('../../contracts/campaign.js').SceneInstanceId}} */ (current);
  void resultId; void sceneInstanceId; return scheduler;
}
/** Native source ordered candidates, pokemon.c1062–1104. Known moves are not
 * excluded; duplicated move identities retain distinct real slot identities.
 * @param {Actor} actor @param {number} level @param {Catalogs} catalogs */
export function learningCandidates(actor,level,catalogs) {
  const p = profile(actor.identity,catalogs);
  return catalogs.species.getLearnset(p.id).levelUp.filter(row => row[0] === level).map(row => {
    const id = catalogs.species.identities.moves.find(move => move.originalId === row[1])?.id;
    if (!id) return blocked('level-move-identity'); return /** @type {import('../../contracts.js').MoveId} */ (id);
  }).filter(id => actor.growth.iqPoints >= MOVE_LEARNING_FACTS.ultimateIq || !['move-frenzy-plant','move-hydro-cannon','move-blast-burn','move-volt-tackle'].includes(id)).slice(0,MOVE_LEARNING_FACTS.maxCandidates);
}
/** Trailing empty slots are native; an authenticated inherited internal gap
 * needs its genuine layout owner. Never truncate or repair those old resources.
 * @param {Actor} actor */
export function compactMoves(actor) {
  const empty = actor.moves.slots.indexOf(null);
  return empty < 0 || actor.moves.slots.slice(empty).every(slot => slot === null);
}
/** Native forget operation removes the selected slot and its subsequent linked
 * tail; retained moves compact without changing identities or PP (menu1047–1078).
 * @param {Actor|NonNullable<import('../../contracts/campaign.js').CampaignSnapshot['session']>['actors'][string]} actor @param {import('../../contracts.js').MoveSlotId} id */
export function forgottenSlots(actor,id) {
  const link = actor.moves.links.find(group => group.includes(id));
  return link ? link.slice(link.indexOf(id)) : [id];
}
/** All retained resources remain untouched until actual explicit confirmation.
 * @param {Context} context @param {Actor} actor @param {import('../../contracts.js').MoveId} moveId
 * @param {Catalogs} catalogs @param {import('../../contracts.js').MoveSlotId|null} [replaceSlotId] */
function learnMove(context,actor,moveId,catalogs,replaceSlotId = null) {
  const removed = new Set(replaceSlotId ? forgottenSlots(actor,replaceSlotId) : []);
  const keep = actor.moves.slots.flatMap(slot => slot && !removed.has(slot.moveSlotId) ? [slot] : []);
  if (keep.length >= 4) return blocked('learning-free-slot');
  const s = context.state.session; if (!s) return blocked('learning-session');
  for (const slot of actor.moves.slots) if (slot && removed.has(slot.moveSlotId)) (s.forgottenMoves ??= []).push({ actorId: actor.actorId,moveSlot: clone(slot),forgottenRevision: context.state.revision+1 });
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
/** Settlement owns the entire native team traversal before any copyback; normal
 * hooks own the whole native team traversal and their actual triggering source. Stops immediately at actual native input.
 * @param {Context} context @param {Catalogs} catalogs @param {Origin} origin
 * @param {import('../../contracts.js').ActorId[]} [order] @param {number} [start] */
export function processLearning(context,catalogs,origin,order,start = 0) {
  const s = context.state.session;
  if (!s || context.state.contentRevision !== ESCORT_WORK_REVISION) return false;
  if (escortEntryProblem(context.state,catalogs,context.state.revision+1)) return blocked('escort-learning-raw-entry');
  const prior = s.learningWork;
  if (prior) {
    const same = prior.origin.kind === origin.kind && (origin.kind === 'settlement' ? prior.origin.kind === 'settlement' && prior.origin.outcome === origin.outcome : fingerprint(prior.origin) === fingerprint(origin));
    if (!same) return blocked('escort-learning-parent-owner');
    if (prior.phase === 'return') { delete s.learningWork; s.scheduler = { ...schedulerFields(s.scheduler),...prior.schedulerTag }; return false; }
    return true;
  }
  if (s.learning) return blocked('escort-learning-missing-work');
  if (origin.kind === 'settlement' && !origin.casualties) origin = { ...origin,casualties: s.scheduler.teamSlots.flatMap(id => { const actor = id ? s.actors[id] : null; return actor?.resources.hp === 0 ? [{ actorId: actor.actorId,level: actor.growth.level }] : []; }) };
  if (origin.kind === 'settlement' && s.escortGuest?.lifecycle.kind === 'removed' && s.escortGuest.lifecycle.reason === 'fainted') {
    if (origin.outcome !== 'fainting') return blocked('escort-client-loss-settlement');
    const ref = s.escortGuest.lifecycle.source,guest = s.actors[ref.actorId];
    if (!guest || !ownsEscortSourceRef(context.state,ref,true,context.state.revision+1)) return blocked('escort-learning-casualty');
    if (!origin.casualties?.some(row => row.actorId === guest.actorId)) origin = { ...origin,casualties: [...(origin.casualties ?? []),{ actorId: guest.actorId,level: guest.growth.level }] };
  }
  const ids = order ?? s.scheduler.teamSlots.flatMap(id => id ? [id] : []);
  const needsGrowth = ids.some(id => { const a = s.actors[id]; return a?.binding.kind === 'roster' && (a.pendingExperience || a.growth.level < 100 && value(a.growth.totalExperience) >= catalogs.species.getGrowthAtLevel(profile(a.identity,catalogs).id,a.growth.level+1).cumulativeExperience); });
  if (!needsGrowth) return false;
  if (!['ready','scene-paused'].includes(s.scheduler.kind)) return blocked('escort-learning-start-tag');
  const schedulerTag = s.scheduler.kind === 'scene-paused' ? { kind: /** @type {const} */ ('scene-paused'),sceneInstanceId: s.scheduler.sceneInstanceId } : { kind: /** @type {const} */ ('ready') };
  s.learningWork = { phase: 'recipient',origin: clone(origin),actorOrder: [...ids],actorIndex: start,createdRevision: context.state.revision+1,resumeFrameFingerprint: fingerprint(s.scheduler.continuation),schedulerTag };
  drainRecipient(context,catalogs); return true;
}
/** One complete eligible roster recipient per actual dispatch. Native guest
 * slots remain in order and are skipped only by genuine source XP lock. The
 * completed last recipient commits a return boundary before any parent work.
 * @param {Context} context @param {Catalogs} catalogs */
function drainRecipient(context,catalogs) {
  const s = context.state.session,work = s?.learningWork;
  if (!s || !work || work.phase !== 'recipient' || s.learning) return blocked('escort-learning-recipient-owner');
  s.scheduler = { ...schedulerFields(s.scheduler),...work.schedulerTag };
  while (work.actorIndex < work.actorOrder.length) {
    const a = s.actors[work.actorOrder[work.actorIndex] ?? '']; if (!a) return blocked('learning-recipient');
    if (a.binding.kind === 'escort-guest') {
      const slot = s.scheduler.teamSlots.indexOf(a.actorId);
      if (a.pendingExperience || !ownsEscortSourceRef(context.state,{ side: 'team',slot,actorId: a.actorId })) return blocked('escort-learning-xp-lock');
      work.actorIndex++; continue;
    }
    if (a.binding.kind !== 'roster') return blocked('learning-recipient');
    if (grow(context,a,catalogs,work.origin,work.actorOrder,work.actorIndex)) return;
    work.actorIndex++; break;
  }
  if (work.actorIndex === work.actorOrder.length) work.phase = 'return';
  s.scheduler = { ...schedulerFields(s.scheduler),kind: 'learning-continuing' };
}
/** A saved advance drains one recipient or returns exactly once to its captured
 * native parent. It never executes suffix recipients on an acknowledgment.
 * @param {Context} context @param {Catalogs} catalogs
 * @param {(context:Context,origin:Origin)=>import('../turns/types.js').MutationResult} resume
 * @returns {import('../turns/types.js').MutationResult} */
export function advanceLearningWork(context,catalogs,resume) {
  const s = context.state.session,work = s?.learningWork;
  if (!s || !work || s.scheduler.kind !== 'learning-continuing' || context.state.pendingResult || context.state.earlyWork?.clientPrompt || fingerprint(s.scheduler.continuation) !== work.resumeFrameFingerprint) return blocked('escort-learning-advance-owner');
  if (work.phase === 'recipient') { drainRecipient(context,catalogs); return { kind: 'changed',resumeDungeon: false }; }
  s.scheduler = { ...schedulerFields(s.scheduler),...work.schedulerTag };
  if (work.origin.kind === 'turn') delete s.learningWork;
  return resume(context,work.origin);
}
/** beginAction installs the real completed synchronous effect PC after the
 * terminal owner requested its learning prompt. Capture that PC once, never a
 * fabricated performance checkpoint. @param {Context} context */
export function sealLearningFrame(context) {
  const s = context.state.session; if (s?.learning) s.learning.resumeFrameFingerprint = fingerprint(s.scheduler.continuation); if (s?.learningWork) s.learningWork.resumeFrameFingerprint = fingerprint(s.scheduler.continuation);
}
/** @param {Catalogs} catalogs
 * @returns {import('../turns/types.js').CommandHandler} */
export function learningHandler(catalogs) { return {
  plan(state,intent) {
    const result = state.pendingResult;
    return state.contentRevision === ESCORT_WORK_REVISION && intent.type === 'ackResult' && intent.choice.kind === 'move' && result?.kind === 'move-learn-choice' && state.session?.learning && (intent.choice.replaceSlotId === null && result.canDecline || intent.choice.replaceSlotId !== null && result.replaceableSlotIds.includes(intent.choice.replaceSlotId)) ? { kind: 'mutation' } : { kind: 'rejected',reason: 'unavailable' };
  },
  apply(context,intent) {
    const s = context.state.session,result = context.state.pendingResult,owner = s?.learning;
    if (!s || !owner || intent.type !== 'ackResult' || intent.choice.kind !== 'move' || result?.kind !== 'move-learn-choice') return blocked('learning-choice-owner');
    if (learningProblem(context.state,catalogs)) return blocked('escort-learning-raw-choice');
    const actor = s.actors[owner.actorId]; if (!actor || fingerprint({ moves: actor.moves,pp: actor.battleMoves }) !== owner.movesFingerprint || fingerprint(s.scheduler.continuation) !== owner.resumeFrameFingerprint) return blocked('learning-resume-owner');
    if (intent.choice.replaceSlotId !== null) learnMove(context,actor,owner.moveId,catalogs,intent.choice.replaceSlotId);
    else context.emit({ type: 'message',messageId: 'move-learning-declined' });
    context.state.pendingResult = null; delete s.learning;
    s.scheduler = { ...schedulerFields(s.scheduler),...owner.schedulerTag };
    // An imported authentic v23 prompt keeps its original candidate fields.
    // Only this real acknowledgment creates the prospective execution cursor.
    const work = s.learningWork ??= { phase: 'recipient',origin: clone(owner.origin),actorOrder: [...owner.actorOrder],actorIndex: owner.actorIndex,createdRevision: context.state.revision+1,resumeFrameFingerprint: owner.resumeFrameFingerprint,schedulerTag: clone(owner.schedulerTag) };
    if (!work || work.phase !== 'recipient' || work.actorIndex !== owner.actorIndex || fingerprint(work.actorOrder) !== fingerprint(owner.actorOrder) || fingerprint(work.origin) !== fingerprint(owner.origin)) return blocked('escort-learning-choice-traversal');
    s.scheduler = { ...schedulerFields(s.scheduler),kind: 'learning-continuing' };
    return { kind: 'changed',resumeDungeon: false };
  },
}; }
