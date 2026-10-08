import { copyPlainData } from './plain.js';
import { inspectShape } from './structure.js';
import { SINISTER_WORK_SHAPES } from './sinister-work-schema.js';
import { SINISTER_WORK_REVISION } from './sinister-work-revision.js';
import { fingerprint } from './relations.js';
import { randomInteger, validateRandomState } from '../rng.js';
import { sinisterImmobilized } from '../gameplay/sinister-condition-lifecycle.js';
import { moveTargets } from '../gameplay/move-targets.js';
import { DIRECTIONS } from '../navigation/geometry.js';
import { facing } from '../gameplay/support.js';
/** Prospective PC proof, not a substitute for route/actor/resource admission.
 * The complete successor must call this independently on every raw callback.
 * @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').ExpeditionState} Session
 * @typedef {import('../../contracts/campaign.js').ActorSlotRef} Ref
 * @typedef {import('../../contracts/sinister-work.js').SinisterTerminalReceipt} Terminal */
/** @param {unknown} input */
export function sinisterShapeProblem(input) {
  let data; try { data = copyPlainData(input); } catch { return 'Sinister work needs bounded detached plain data.'; }
  /** @type {import('../../contracts/campaign.js').StateIssue[]} */ const issues = [];
  return inspectShape(data,'CampaignStateWithFieldMoves',issues,undefined,'',SINISTER_WORK_SHAPES) ? null : 'Sinister work needs its exact prospective raw shape.';
}
/** Resolve the captured generation, never a replacement in its old slot.
 * A removed hostile remains identifiable only at its real fainted generation.
 * @param {Session} s @param {Ref|null} ref @param {boolean} [removed] */
export function sinisterWorkRef(s,ref,removed = false) {
  if (!ref || !Number.isSafeInteger(ref.slot)) return false;
  const slots = ref.side === 'team' ? s.scheduler.teamSlots : s.scheduler.wildSlots,a = s.actors[ref.actorId];
  if (!a || ref.slot < 0 || ref.slot >= slots.length || (ref.side === 'team' ? a.affiliation !== 'team' : a.affiliation === 'team')) return false;
  return slots[ref.slot] === a.actorId && a.placement.kind === 'map' && a.placement.mapId === s.floor.mapId || removed && ref.side === 'wild' && slots[ref.slot] === null && a.affiliation === 'hostile' && a.resources.hp === 0 && a.placement.kind === 'off-map' && a.placement.reason === 'fainted';
}
/** @param {Session} s */
function opportunity(s) {
  const c = s.scheduler.continuation,r = c.active;
  if (!r || !sinisterWorkRef(s,r,true) || c.flushing || c.replanCount < 0 || c.replanCount > 2) return false;
  if (c.pass === 'leader') {
    if (c.slotIndex !== 0) return false;
    if (!c.special) return r.side === 'team' && r.actorId === s.leaderActorId;
    return c.special.leader.side === 'team' && c.special.leader.actorId === s.leaderActorId && sinisterWorkRef(s,c.special.leader) && r.actorId !== s.leaderActorId && c.special.index === r.slot+(r.side === 'wild' ? s.scheduler.teamSlots.length : 0)+1;
  }
  if (c.special) return false;
  if (c.pass === 'team' || c.pass === 'wild') return r.side === c.pass && r.actorId !== s.leaderActorId && c.slotIndex === r.slot+1;
  const captured = c.followerOrder[c.followerIndex-1];
  return c.pass === 'followers' && r.side === 'team' && r.actorId !== s.leaderActorId && c.slotIndex === 0 && c.followerRound >= 0 && c.followerRound < 3 && c.followerIndex >= 1 && c.followerIndex <= c.followerOrder.length && captured?.side === r.side && captured.slot === r.slot && captured.actorId === r.actorId && c.followerOrder.every((row,index) => row.side === 'team' && sinisterWorkRef(s,row,index < c.followerIndex));
}
/** Exact still-live prefix/suffix and native leader-first slot order.
 * @param {Session} s @param {2|3} [step] */
function flushEnd(s,step = 3) {
  const c = s.scheduler.continuation,f = c.flushing;
  if (!f || f.step !== step || new Set(f.order.map(row => row.actorId)).size !== f.order.length || f.index < 0 || f.index >= f.order.length || c.special || c.action || c.activeEffect || c.beginningRan) return false;
  const leader = c.pass === 'leader' && c.step === 0 && c.slotIndex === 0 && c.stage === 'begin' && c.active?.side === 'team' && c.active.actorId === s.leaderActorId && sinisterWorkRef(s,c.active) && c.replanCount === 0 && c.actionStop === 'none' && !c.leaderChanged;
  const boundary = c.pass === 'boundary' && c.step === 1 && c.slotIndex === 0 && c.stage === 'select' && c.active === null;
  if (!leader && !boundary) return false;
  let rank = -2;
  for (const [index,ref] of f.order.entries()) {
    if (!sinisterWorkRef(s,ref,true)) return false;
    const a = s.actors[ref.actorId],next = ref.actorId === s.leaderActorId ? -1 : ref.side === 'team' ? ref.slot : s.scheduler.teamSlots.length+ref.slot;
    if (!a || next <= rank || index <= f.index && a.speed.movementPending || (index < f.index || index === f.index && step === 3) && a.speed.endEffectsPending || index > f.index && !a.speed.movementPending) return false;
    rank = next;
  }
  return Object.values(s.actors).every(a => !a.speed.movementPending || f.order.some((r,index) => index > f.index && r.actorId === a.actorId && sinisterWorkRef(s,r)));
}
/** Independently replay only the real preparation draws: confusion direction,
 * then Barrage count, using the explicitly inherited browser combat stream.
 * Impact RNG is subsequent live work and must not be rewound to this receipt.
 * @param {State} state @param {Session} s @param {number} revision @param {import('../gameplay/support.js').Catalogs} catalogs */
function moveProblem(state,s,revision,catalogs) {
  const work = s.sinisterTurn,m = work?.move,q = work?.combat.sequence,c = s.scheduler.continuation;
  if (!m) return q ? 'Sinister sequence has no actual preparation.' : null;
  if (m.preparedRevision < 1 || m.preparedRevision > revision || !sinisterWorkRef(s,m.actor,true) || m.action.actorId !== m.actor.actorId || m.selectedAction.actorId !== m.actor.actorId || fingerprint(c.action) !== fingerprint(m.selectedAction)) return 'Sinister move lost its original action/generation.';
  const a = s.actors[m.actor.actorId]; if (!a) return 'Sinister move actor is missing.';
  let random; try { random = validateRandomState(m.beforeRandom); } catch { return 'Sinister move has invalid preparation RNG.'; }
  let resolved = m.selectedAction,expectedFacing = m.facingBefore;
  if (m.confused) { const direction = randomInteger(random,8); random = direction.state; const step = DIRECTIONS[direction.value]; expectedFacing = step ? facing(step.x,step.z) : m.facingBefore; resolved = { ...resolved,target: { kind: 'facing' } }; }
  if (fingerprint(random) !== fingerprint(m.directionRandom) || fingerprint(resolved) !== fingerprint(m.action) || expectedFacing !== m.facingAfter) return 'Sinister confused action lacks its real direction draw.';
  const barrage = m.action.kind === 'move-use' && m.action.moveId === 'move-barrage';
  const hit = barrage ? randomInteger(random,4) : null;
  if (m.totalHits !== (hit ? hit.value+2 : 1) || fingerprint(m.afterRandom) !== fingerprint(hit?.state ?? random) || state.random.combatRecruitment.draws < m.afterRandom.draws || !Number.isSafeInteger(m.completedHits) || m.completedHits < 0 || m.completedHits > m.totalHits) return 'Sinister hit count lacks its one real preparation sample.';
  if (m.action.kind === 'move-use') {
    const action = m.action,slot = a.moves.slots.find(row => row?.moveSlotId === action.moveSlotId && row.moveId === action.moveId);
    const forgotten = wTerminalForgotten(s,a.actorId,action.moveSlotId,action.moveId,m.preparedRevision);
    if (!slot && !forgotten || m.beforePp === null || m.afterPp === null || m.beforePp < 1 || m.beforePp > 99 || m.afterPp !== m.beforePp-1) return 'Sinister move lacks its paid original PP slot.';
    if (!forgotten && (!work?.combat.lastUsed[a.actorId]?.slots.includes(action.moveSlotId) || work.combat.lastUsed[a.actorId]?.struggle)) return 'Sinister move lost its actual LAST_USED flag.';
  } else if (m.beforePp !== null || m.afterPp !== null || m.action.kind === 'struggle' && (!work?.combat.lastUsed[a.actorId]?.struggle || work.combat.lastUsed[a.actorId]?.slots.length)) return 'Sinister nonlearned preparation fabricated PP/flags.';
  if (m.chargeBefore !== null && m.chargeBefore.statusId !== 'charging' || m.chargeOwned && (m.chargeBefore === null || fingerprint(a.conditions.bide) !== fingerprint(m.chargeBefore))) return 'Sinister Charge cleanup has no original condition.';
  if (m.disposition === 'active') {
    if (!q || q.actorId !== a.actorId || q.sessionId !== s.sessionId || q.mapId !== s.floor.mapId || q.nextHit !== m.completedHits || q.totalHits !== m.totalHits || q.nextHit >= q.totalHits || fingerprint(q.action) !== fingerprint(m.action)) return 'Sinister active sequence differs from its paid preparation.';
  } else if (q || m.disposition === 'hit-count' && m.completedHits !== m.totalHits || m.disposition !== 'hit-count' && m.completedHits >= m.totalHits) return 'Sinister completion/cancellation lacks its factual disposition.';
  const removed = a.placement.kind !== 'map' || a.resources.hp <= 0;
  const cannot = sinisterImmobilized(a) || ['cringe','infatuated'].includes(a.conditions.cringe?.statusId ?? '') || a.conditions.burn?.statusId === 'paralysis' || ['sleep','nightmare','napping'].includes(a.conditions.sleep?.statusId ?? '');
  if (!work?.terminal && (m.disposition === 'actor-removed' && !removed || m.disposition === 'cannot-attack' && (removed || !cannot))) return 'Sinister cancellation has no actual stop condition.';
  if (m.disposition === 'targets-empty') {
    const move = catalogs.effects.getMove('move-barrage');
    if (!barrage || m.completedHits === 0 || removed || cannot || move.target.rangeCode !== 0 || moveTargets(s,a,move.target.rangeCode,catalogs,m.action.target,move.target.categoryCode).length) return 'Sinister cancellation has no exhausted target enumeration.';
  }
  if (m.disposition === 'terminal' && !work?.terminal || m.disposition !== 'active' && m.chargeOwned) return 'Sinister completed action retained Charge cleanup.';
  return null;
}
/** A real terminal learning receipt may retire the prepared slot. No missing
 * slot is admitted merely because a terminal or a later revision exists.
 * @param {Session} s @param {import('../../contracts.js').ActorId} actorId @param {import('../../contracts/campaign.js').MoveSlotId} slotId @param {import('../../contracts.js').MoveId} moveId @param {number} preparedRevision */
function wTerminalForgotten(s,actorId,slotId,moveId,preparedRevision) {
  return !!s.sinisterTurn?.terminal && !!s.forgottenMoves?.some(row => row.actorId === actorId && row.moveSlot.moveSlotId === slotId && row.moveSlot.moveId === moveId && row.forgottenRevision >= preparedRevision);
}
/** Source classification is independent of the stored frame fingerprint. Full
 * route completion/scene/native-history qualification remains the live factory's
 * responsibility; this proves that its terminal caller used a real native PC.
 * @param {State} state @param {Session} s @param {Terminal} terminal */
export function sinisterTerminalPc(state,s,terminal) {
  const c = s.scheduler.continuation,o = terminal.origin;
  if (o.kind === 'scene') return terminal.schedulerTag.kind === 'scene-paused' && state.mode === 'scene' && state.pendingScene?.sceneId === o.sceneId && state.pendingScene.sceneInstanceId === o.sceneInstanceId && state.pendingScene.cursor === o.cursor && state.pendingScene.awaiting.kind === 'advance' && c.terminal === 'dungeon-exit';
  if (terminal.schedulerTag.kind !== 'ready' || state.pendingScene || c.terminal !== 'none') return false;
  const selected = c.stage === 'select' && c.active === null && c.action === null && !c.beginningRan && !c.special && !c.flushing;
  const leader = opportunity(s) && c.pass === 'leader' && !c.special && c.active?.actorId === s.leaderActorId;
  if (o.outcome === 'give-up') return leader && c.stage === 'after' && c.step === 0 && c.action?.kind === 'give-up';
  if (o.outcome === 'success') return leader && c.stage === 'after' && c.step === 0 && c.action?.kind === 'exit' || leader && c.stage === 'decision' && c.action === null && s.purpose.kind === 'ordinary' && s.objectives.some(row => row.state.kind === 'complete');
  if (o.outcome === 'wind-expulsion') return selected && c.pass === 'leader' && c.step === 3 && s.floor.windCounter === 0;
  if (o.outcome !== 'fainting' || !terminal.casualties.length) return false;
  return opportunity(s) && (c.stage === 'effect' || c.stage === 'after' && [0,1,3].includes(c.step)) || (flushEnd(s,2) || flushEnd(s,3)) || selected && (c.pass === 'prephase' && c.step === 4 || c.pass === 'boundary' && c.step === 3 || c.pass === 'follower-end' && c.step === 0 && c.slotIndex > 0 && c.slotIndex <= s.scheduler.teamSlots.length);
}
/** Exact PC proof on the actual prospective state. Generic graph, source actor,
 * condition/PP/growth and terminal route proof must ALSO admit this same state.
 * @param {State} state @param {import('../gameplay/support.js').Catalogs} catalogs @param {number} [revision] @returns {string|null} */
export function sinisterTurnProblem(state,catalogs,revision = state.revision) {
  const shape = sinisterShapeProblem(state); if (shape) return shape;
  const s = state.session,w = s?.sinisterTurn;
  if (state.contentRevision !== SINISTER_WORK_REVISION || !s || !w) return 'Sinister work requires its actual prospective session.';
  const c = s.scheduler.continuation,p = w.checkpoint,t = w.terminal;
  const badMove = moveProblem(state,s,revision,catalogs); if (badMove) return badMove;
  if (Object.keys(w.combat.lastUsed).some(id => !s.actors[id]) || Object.values(s.actors).some(a => {
    const flags = w.combat.lastUsed[a.actorId];
    return !flags || flags.slots.length > 4 || new Set(flags.slots).size !== flags.slots.length || flags.struggle && flags.slots.length > 0 || flags.slots.some(id => !a.moves.slots.some(slot => slot?.moveSlotId === id));
  })) return 'Sinister LAST_USED rows differ from actual retained actors/slots.';
  if (t && (t.requestedRevision < 1 || t.requestedRevision > revision || t.frameFingerprint !== fingerprint(t.sourceFrame) || t.frameFingerprint !== fingerprint(c) || !sinisterTerminalPc(state,s,t) || t.casualties.length > 4 || new Set(t.casualties.map(row => row.actor.actorId)).size !== t.casualties.length || t.casualties.some(row => row.level < 1 || row.level > (s.actors[row.actor.actorId]?.growth.level ?? 0) || row.actor.side !== 'team' || !sinisterWorkRef(s,row.actor) || s.actors[row.actor.actorId]?.growth.level === row.level && s.actors[row.actor.actorId]?.resources.hp !== 0))) return 'Sinister terminal return lacks its actual source frame/casualties.';
  if (t?.origin.kind === 'settlement' && fingerprint(t.origin.casualties) !== fingerprint(t.casualties.map(row => ({ actorId: row.actor.actorId,level: row.level })))) return 'Sinister settlement lost its captured casualty order.';
  if (!p) return s.scheduler.kind === 'sinister-continuing' ? 'Automatic Sinister tag has no native checkpoint.' : null;
  if (s.scheduler.kind !== 'sinister-continuing' || state.pendingResult || s.learning || s.learningWork || state.earlyWork?.clientPrompt || p.createdRevision < 1 || p.createdRevision > revision || p.frameFingerprint !== fingerprint(c)) return 'Sinister checkpoint is not the exclusive current automatic owner.';
  if (p.kind === 'terminal') return t && p.actor === null ? null : 'Terminal checkpoint omitted its retained return marker.';
  if (t || state.pendingScene || state.mode !== 'dungeon' || c.terminal !== 'none' || !p.actor || !sinisterWorkRef(s,p.actor,true)) return 'Sinister native work was overtaken by another owner.';
  if (['prepared-move','impact','move-complete'].includes(p.kind)) {
    const m = w.move;
    if (!m || fingerprint(p.actor) !== fingerprint(m.actor) || !opportunity(s) || !c.beginningRan || c.activeEffect || c.step !== 0) return 'Sinister move checkpoint has a foreign opportunity.';
    if (p.kind === 'move-complete') return m.disposition !== 'active' && c.stage === 'after' ? null : 'Completed move still owes an impact.';
    return m.disposition === 'active' && c.stage === 'effect' && (p.kind === 'prepared-move' ? m.completedHits === 0 : m.completedHits > 0) ? null : 'Sinister impact cursor has no actual completed prefix.';
  }
  if (w.move || w.combat.sequence) return 'End checkpoint overtook unfinished move work.';
  const a = s.actors[p.actor.actorId]; if (!a || a.speed.endEffectsPending) return 'End checkpoint has not discharged its recipient.';
  if (p.kind === 'opportunity-end') return opportunity(s) && fingerprint(c.active) === fingerprint(p.actor) && c.stage === 'after' && c.step === 3 && !a.speed.movementPending && !a.speed.deferred ? null : 'Foreign opportunity end PC.';
  if (p.kind === 'flush-end') return flushEnd(s) && fingerprint(c.flushing?.order[c.flushing.index]) === fingerprint(p.actor) ? null : 'Foreign flush end/prefix PC.';
  return c.pass === 'follower-end' && c.stage === 'select' && c.step === 0 && c.active === null && c.action === null && c.activeEffect === null && !c.beginningRan && !c.special && !c.flushing && p.actor.side === 'team' && c.slotIndex === p.actor.slot+1 && s.scheduler.teamSlots.slice(0,c.slotIndex).every(id => !id || !s.actors[id]?.speed.deferred) && !a.speed.deferred ? null : 'Foreign deferred follower end PC.';
}
