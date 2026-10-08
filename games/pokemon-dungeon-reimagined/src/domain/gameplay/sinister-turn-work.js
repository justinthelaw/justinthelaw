import { beginSinisterAttack, continueSinisterAttack } from './sinister-combat.js';
import { sinisterImmobilized } from './sinister-condition-lifecycle.js';
import { confusedAction } from './confused-action.js';
import { clone, blocked, value, profile } from './support.js';
import { actorAt } from '../turns/support.js';
import { fingerprint } from '../state/relations.js';
import { SINISTER_WORK_REVISION } from '../state/sinister-work-revision.js';
import { sinisterTurnProblem, sinisterTerminalPc } from '../state/sinister-turn-proof.js';
/** Actual unselected work producers. The selected campaign cannot import these
 * before route/resource/caller admission is complete.
 * @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {import('../turns/types.js').ActorRef} Ref
 * @typedef {import('./support.js').Catalogs} Catalogs
 * @typedef {import('../../contracts/sinister-work.js').Attack} Attack
 * @typedef {import('../../contracts/sinister-work.js').SinisterCheckpoint['kind']} Boundary
 * @typedef {import('../../contracts/sinister-work.js').SinisterTerminalReceipt} Terminal */
/** Every transition strips tag-specific payloads; actual scene identity belongs
 * only to the captured return owner.
 * @param {import('../../contracts/campaign.js').SchedulerState} current */
export function sinisterSchedulerFields(current) {
  const { resultId,sceneInstanceId,...common } = /** @type {typeof current & {resultId?:unknown,sceneInstanceId?:unknown}} */ (current);
  void resultId; void sceneInstanceId; return common;
}
/** @param {Context} context */
function owner(context) {
  const s = context.state.session;
  if (context.state.contentRevision !== SINISTER_WORK_REVISION || !s?.sinisterTurn) return blocked('sinister-work-owner');
  return { s,w: s.sinisterTurn,c: s.scheduler.continuation };
}
/** Called only after the native PC/index/obligation advances. Never manufactures
 * a prompt or clears a remaining follower/flush suffix.
 * @param {Context} context @param {Boundary} kind @param {Ref|null} ref @param {Catalogs} catalogs */
export function saveSinisterCheckpoint(context,kind,ref,catalogs) {
  const {s,w,c} = owner(context);
  if (w.checkpoint || s.learning || s.learningWork || context.state.pendingResult || context.state.earlyWork?.clientPrompt) return blocked('sinister-checkpoint-exclusive');
  w.checkpoint = { kind,actor: ref ? clone(ref) : null,createdRevision: context.state.revision+1,frameFingerprint: fingerprint(c) };
  s.scheduler = { ...sinisterSchedulerFields(s.scheduler),kind: 'sinister-continuing' };
  const problem = sinisterTurnProblem(context.state,catalogs,context.state.revision+1); if (problem) return blocked('sinister-checkpoint-native-pc');
}
/** Frame sealing is only for actual synchronous terminal action completion:
 * engine installs after0 after the exit/give-up hook captured its terminal.
 * @param {Context} context */
export function sealSinisterTerminalFrame(context) {
  const s = context.state.session,t = s?.sinisterTurn?.terminal;
  if (!s || !t) return;
  if (t.requestedRevision !== context.state.revision+1 || t.phase !== 'captured') return blocked('sinister-terminal-reseal');
  t.sourceFrame = clone(s.scheduler.continuation); t.frameFingerprint = fingerprint(t.sourceFrame);
  const p = s.sinisterTurn?.checkpoint; if (p) p.frameFingerprint = t.frameFingerprint;
}
/** The original action remains on frame.action; confusion has its own actual
 * direction sample and resolved target. PP, LAST_USED and Barrage count happen
 * once. Charge remains owed until complete/cancel, never in a prepare finally.
 * @param {Context} context @param {Ref} ref @param {Attack} selected @param {Catalogs} catalogs */
export function prepareSinisterMove(context,ref,selected,catalogs) {
  const {s,w,c} = owner(context),a = actorAt(s,ref);
  if (!a || w.move || w.combat.sequence || w.terminal || w.checkpoint || c.stage !== 'decision' || c.step !== 0 || fingerprint(c.action) !== fingerprint(selected)) return blocked('sinister-prepare-source');
  const beforeRandom = clone(context.state.random.combatRecruitment),facingBefore = a.facing,confused = a.conditions.cringe?.statusId === 'confused';
  const action = /** @type {Attack} */ (confusedAction(context,a,selected,catalogs));
  if (!['attack','struggle','move-use'].includes(action.kind)) return blocked('sinister-resolved-attack');
  const directionRandom = clone(context.state.random.combatRecruitment),chargeBefore = a.conditions.bide?.statusId === 'charging' ? clone(a.conditions.bide) : null;
  const beforePp = action.kind === 'move-use' ? a.battleMoves.slots.find(row => row.moveSlotId === action.moveSlotId)?.currentPp ?? null : null;
  const q = beginSinisterAttack(context,a,action,catalogs,w.combat);
  if (!q) {
    // Genuine failed use completes its source action. It paid no PP/count draw;
    // old Charge is still cleaned only here, after the actual failed attempt.
    if (chargeBefore && fingerprint(a.conditions.bide) === fingerprint(chargeBefore)) { a.conditions.bide = null; context.emit({ type: 'conditionChanged',actorId: a.actorId }); }
    return false;
  }
  const afterPp = action.kind === 'move-use' ? a.battleMoves.slots.find(row => row.moveSlotId === action.moveSlotId)?.currentPp ?? null : null;
  w.move = { actor: clone(ref),selectedAction: clone(selected),action: clone(action),confused,facingBefore,facingAfter: a.facing,beforeRandom,directionRandom,afterRandom: clone(context.state.random.combatRecruitment),chargeBefore,chargeOwned: chargeBefore !== null,preparedRevision: context.state.revision+1,beforePp,afterPp,totalHits: q.totalHits,completedHits: 0,disposition: 'active' };
  c.stage = 'effect'; c.step = 0; c.activeEffect = null;
  saveSinisterCheckpoint(context,'prepared-move',ref,catalogs); return true;
}
/** Exactly one complete impact; caller arbitrates genuine terminal/loss before
 * publishing this result and before any next hit/end/experience work.
 * @param {Context} context @param {Catalogs} catalogs */
export function advanceSinisterImpact(context,catalogs) {
  const {s,w,c} = owner(context),m = w.move,q = w.combat.sequence;
  if (!m || !q || m.disposition !== 'active' || w.checkpoint || w.terminal || s.scheduler.kind !== 'ready' || c.stage !== 'effect') return blocked('sinister-impact-source');
  const a = s.actors[m.actor.actorId]; if (!a) return blocked('sinister-impact-actor');
  const removed = a.placement.kind !== 'map' || a.resources.hp <= 0;
  const cannot = sinisterImmobilized(a) || ['cringe','infatuated'].includes(a.conditions.cringe?.statusId ?? '') || a.conditions.burn?.statusId === 'paralysis' || ['sleep','nightmare','napping'].includes(a.conditions.sleep?.statusId ?? '');
  const charge = m.chargeOwned ? a.conditions.bide : null;
  const result = continueSinisterAttack(context,catalogs,w.combat,() => true);
  if (result === 'paused') return blocked('sinister-unowned-impact-pause');
  m.completedHits = q.nextHit;
  if (m.chargeOwned && (charge === null || charge !== a.conditions.bide)) m.chargeOwned = false;
  if (result === 'complete') {
    m.disposition = q.nextHit === q.totalHits ? 'hit-count' : removed ? 'actor-removed' : cannot ? 'cannot-attack' : 'targets-empty';
    c.stage = 'after'; c.step = 0; c.activeEffect = null;
  }
  return result;
}
/** Original Charge cleanup is after final/canceled impact, with replacement
 * identity retained across saved hits. Native Truant/after-action caller remains
 * the required concrete hook, invoked exactly once by the direct engine.
 * @param {Context} context */
export function finishSinisterMove(context) {
  const {s,w} = owner(context),m = w.move;
  if (!m || m.disposition === 'active' || w.combat.sequence) return blocked('sinister-move-incomplete');
  const a = s.actors[m.actor.actorId];
  if (a && m.chargeOwned && fingerprint(a.conditions.bide) === fingerprint(m.chargeBefore)) { a.conditions.bide = null; context.emit({ type: 'conditionChanged',actorId: a.actorId }); }
  m.chargeOwned = false;
}
/** Capture a real terminal even if no actor owes EXP. No cleanup/copyback here.
 * The source route/scene caller must independently qualify outcome/last scene.
 * @param {Context} context @param {Terminal['origin']} origin */
export function captureSinisterTerminal(context,origin) {
  const {s,w,c} = owner(context);
  if (w.terminal || s.learning || s.learningWork || context.state.pendingResult || w.checkpoint) return blocked('sinister-terminal-exclusive');
  const schedulerTag = s.scheduler.kind === 'scene-paused' ? { kind: /** @type {const} */ ('scene-paused'),sceneInstanceId: s.scheduler.sceneInstanceId } : { kind: /** @type {const} */ ('ready') };
  const casualties = s.scheduler.teamSlots.flatMap((id,slot) => {
    const a = id ? s.actors[id] : null;
    return a?.resources.hp === 0 ? [{ actor: { side: /** @type {const} */ ('team'),slot,actorId: a.actorId },level: a.growth.level }] : [];
  });
  w.terminal = { phase: 'captured',origin: clone(origin.kind === 'settlement' ? { ...origin,casualties: casualties.map(row => ({ actorId: row.actor.actorId,level: row.level })) } : origin),requestedRevision: context.state.revision+1,sourceFrame: clone(c),frameFingerprint: fingerprint(c),schedulerTag,casualties };
  if (w.move?.disposition === 'active') { w.move.disposition = 'terminal'; w.combat.sequence = null; }
  // Synchronous exit/give-up is sealed by beginAction after its actual hook.
  // Other callers have already advanced their native PC before calling here.
  const sealing = c.stage === 'decision' && c.step === 0 && ['exit','give-up'].includes(c.action?.kind ?? '');
  if (!sealing && !sinisterTerminalPc(context.state,s,w.terminal)) return blocked('sinister-terminal-source-pc');
  s.scheduler = { ...sinisterSchedulerFields(s.scheduler),kind: 'sinister-continuing' };
}
/** A separate canonical dispatch seals a drained traversal, including the empty
 * one. Parent cleanup remains owed to a later return checkpoint.
 * @param {Context} context @param {Catalogs} catalogs */
export function markSinisterTerminalReturn(context,catalogs) {
  const {s,w} = owner(context),t = w.terminal;
  if (!t || t.phase !== 'captured' || s.learning || s.learningWork || context.state.pendingResult || w.checkpoint) return blocked('sinister-terminal-growth-owner');
  for (const id of s.scheduler.teamSlots) {
    const a = id ? s.actors[id] : null; if (!a || a.binding.kind === 'escort-guest') continue;
    if (a.pendingExperience || a.growth.level < 100 && value(a.growth.totalExperience) >= catalogs.species.getGrowthAtLevel(profile(a.identity,catalogs).id,a.growth.level+1).cumulativeExperience) return blocked('sinister-terminal-growth-owed');
  }
  t.phase = 'return'; saveSinisterCheckpoint(context,'terminal',null,catalogs);
}
