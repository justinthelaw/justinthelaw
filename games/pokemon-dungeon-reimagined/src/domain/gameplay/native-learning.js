import { MOVE_LEARNING_FACTS } from '../../../content/authored/move-learning-facts.js';
import { MOVE_LEARNING_REVISION } from '../state/move-learning-revision.js';
import { fingerprint } from '../state/relations.js';
import { allocate, blocked, clone, draw, maxHp, profile, value } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor
 * @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {import('./support.js').Catalogs} Catalogs
 * @typedef {import('../../contracts/move-learning.js').LearningOrigin} Origin */
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
    s.scheduler = { ...s.scheduler,kind: 'choice-paused',resultId }; return true;
  }
  return false;
}
/** Settlement owns the entire native team traversal before any copyback; normal
 * hooks own the whole native team traversal and their actual triggering source. Stops immediately at actual native input.
 * @param {Context} context @param {Catalogs} catalogs @param {Origin} origin
 * @param {import('../../contracts.js').ActorId[]} [order] @param {number} [start] */
export function processLearning(context,catalogs,origin,order,start = 0) {
  const s = context.state.session;
  if (!s || context.state.contentRevision !== MOVE_LEARNING_REVISION) return false;
  if (s.learning) return true;
  if (origin.kind === 'settlement' && !origin.casualties) origin = { ...origin,casualties: s.scheduler.teamSlots.flatMap(id => { const actor = id ? s.actors[id] : null; return actor?.resources.hp === 0 ? [{ actorId: actor.actorId,level: actor.growth.level }] : []; }) };
  const ids = order ?? s.scheduler.teamSlots.flatMap(id => id ? [id] : []);
  for (let index = start; index < ids.length; index++) {
    const a = s.actors[ids[index] ?? '']; if (!a || a.binding.kind !== 'roster') return blocked('learning-recipient');
    if (grow(context,a,catalogs,origin,ids,index)) return true;
  }
  return false;
}
/** beginAction installs the real completed synchronous effect PC after the
 * terminal owner requested its learning prompt. Capture that PC once, never a
 * fabricated performance checkpoint. @param {Context} context */
export function sealLearningFrame(context) {
  const s = context.state.session; if (s?.learning) s.learning.resumeFrameFingerprint = fingerprint(s.scheduler.continuation);
}
/** @param {Catalogs} catalogs @param {(context:Context,origin:Origin)=>import('../turns/types.js').MutationResult} resume
 * @returns {import('../turns/types.js').CommandHandler} */
export function learningHandler(catalogs,resume) { return {
  plan(state,intent) {
    const result = state.pendingResult;
    return state.contentRevision === MOVE_LEARNING_REVISION && intent.type === 'ackResult' && intent.choice.kind === 'move' && result?.kind === 'move-learn-choice' && state.session?.learning && (intent.choice.replaceSlotId === null && result.canDecline || intent.choice.replaceSlotId !== null && result.replaceableSlotIds.includes(intent.choice.replaceSlotId)) ? { kind: 'mutation' } : { kind: 'rejected',reason: 'unavailable' };
  },
  apply(context,intent) {
    const s = context.state.session,result = context.state.pendingResult,owner = s?.learning;
    if (!s || !owner || intent.type !== 'ackResult' || intent.choice.kind !== 'move' || result?.kind !== 'move-learn-choice') return blocked('learning-choice-owner');
    const actor = s.actors[owner.actorId]; if (!actor || fingerprint({ moves: actor.moves,pp: actor.battleMoves }) !== owner.movesFingerprint || fingerprint(s.scheduler.continuation) !== owner.resumeFrameFingerprint) return blocked('learning-resume-owner');
    if (intent.choice.replaceSlotId !== null) learnMove(context,actor,owner.moveId,catalogs,intent.choice.replaceSlotId);
    else context.emit({ type: 'message',messageId: 'move-learning-declined' });
    context.state.pendingResult = null; delete s.learning;
    const { resultId,sceneInstanceId,...scheduler } = /** @type {import('../../contracts/campaign.js').SchedulerState & {resultId?:import('../../contracts/campaign.js').ResultId;sceneInstanceId?:import('../../contracts/campaign.js').SceneInstanceId}} */ (s.scheduler); void resultId; void sceneInstanceId;
    s.scheduler = { ...scheduler,...owner.schedulerTag };
    if (processLearning(context,catalogs,owner.origin,owner.actorOrder,owner.actorIndex)) return { kind: 'changed',resumeDungeon: false };
    return resume(context,owner.origin);
  },
}; }
