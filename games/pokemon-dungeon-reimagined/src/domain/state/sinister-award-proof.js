import { SINISTER_WORK_REVISION } from './sinister-work-revision.js';
import { sinisterShapeProblem, sinisterWorkRef } from './sinister-turn-proof.js';
import { fingerprint } from './relations.js';
import { randomInteger, validateRandomState } from '../rng.js';
import { DIRECTIONS } from '../navigation/geometry.js';
import { facing, value } from '../gameplay/support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').ExpeditionState} Session
 * @typedef {import('../../contracts/campaign.js').TurnContinuation} Frame
 * @typedef {import('../../contracts/campaign.js').ActorSlotRef} Ref
 * @typedef {import('../../contracts/move-learning.js').PendingExperience['awards'][number]} Award
 * @typedef {import('../gameplay/support.js').Catalogs} Catalogs */
/** Recorded frames retain old actor generations and original actions. No
 * current opportunity projection is constructed to classify a past producer.
 * @param {Session} s @param {Frame} f */
function frameValid(s,f) {
  if (f.phase < 0 || f.phase >= 24 || f.step < 0 || f.step > 5 || f.slotIndex < 0 || f.slotIndex > 128 || f.followerRound < 0 || f.followerRound > 3 || f.followerOrder.length > 4 || f.followerIndex < 0 || f.followerIndex > f.followerOrder.length || f.replanCount < 0 || f.replanCount > 2 || f.activeEffect || f.terminal !== 'none') return false;
  /** @param {Ref} ref */ const real = ref => sinisterWorkRef(s,ref,true);
  if (f.active && !real(f.active) || !f.followerOrder.every(row => row.side === 'team' && real(row)) || new Set(f.followerOrder.map(row => row.actorId)).size !== f.followerOrder.length) return false;
  if (f.special && (f.pass !== 'leader' || f.special.leader.actorId !== s.leaderActorId || f.special.leader.side !== 'team' || !real(f.special.leader) || f.special.index < 0 || f.special.index > 132)) return false;
  if (f.flushing && (f.flushing.order.length > 132 || f.flushing.index < 0 || f.flushing.index >= f.flushing.order.length || f.flushing.step < 0 || f.flushing.step > 5 || !f.flushing.order.every(real) || new Set(f.flushing.order.map(row => row.actorId)).size !== f.flushing.order.length)) return false;
  const a = f.action;
  if (a && 'actorId' in a && !s.actors[a.actorId]) return false;
  if (a?.kind === 'move-use' && !s.actors[a.actorId]?.moves.slots.some(row => row?.moveSlotId === a.moveSlotId && row.moveId === a.moveId) && !s.forgottenMoves?.some(row => row.actorId === a.actorId && row.moveSlot.moveSlotId === a.moveSlotId && row.moveSlot.moveId === a.moveId)) return false;
  return !a || !('target' in a) || a.target.kind !== 'actor' || !!s.actors[a.target.actorId];
}
/** @param {Session} s @param {Frame} f @param {Ref} ref */
function opportunity(s,f,ref) {
  if (f.flushing || fingerprint(f.active) !== fingerprint(ref) || !f.beginningRan) return false;
  if (f.pass === 'leader') return f.slotIndex === 0 && (f.special ? ref.actorId !== s.leaderActorId && f.special.index === ref.slot+(ref.side === 'wild' ? s.scheduler.teamSlots.length : 0)+1 : ref.side === 'team' && ref.actorId === s.leaderActorId);
  if (f.special) return false;
  if (f.pass === 'team' || f.pass === 'wild') return ref.side === f.pass && ref.actorId !== s.leaderActorId && f.slotIndex === ref.slot+1;
  return f.pass === 'followers' && ref.side === 'team' && ref.actorId !== s.leaderActorId && f.slotIndex === 0 && f.followerRound < 3 && f.followerIndex >= 1 && fingerprint(f.followerOrder[f.followerIndex-1]) === fingerprint(ref);
}
/** Replay the preparation witness captured BEFORE the awarded hit increments.
 * Current PP/LAST_USED may have changed in later genuine opportunities; those
 * current resources are proved separately, never equated with historical ones.
 * @param {Session} s @param {Award} award @param {number} revision */
function impactValid(s,award,revision) {
  const source = award.sinisterSource; if (source?.kind !== 'impact') return false;
  const m = source.move,q = source.sequence,f = award.sourceFrame,a = s.actors[source.actor.actorId];
  if (!a || !opportunity(s,f,source.actor) || f.stage !== 'effect' || f.step !== 0 || fingerprint(m.actor) !== fingerprint(source.actor) || m.action.actorId !== a.actorId || m.selectedAction.actorId !== a.actorId || fingerprint(f.action) !== fingerprint(m.selectedAction) || m.disposition !== 'active' || m.preparedRevision <= s.entry.entryRevision || m.preparedRevision > award.awardedRevision || award.awardedRevision > revision) return false;
  if (q.sessionId !== s.sessionId || q.mapId !== s.floor.mapId || q.actorId !== a.actorId || fingerprint(q.action) !== fingerprint(m.action) || q.totalHits !== m.totalHits || q.nextHit !== m.completedHits || q.nextHit < 0 || q.nextHit >= q.totalHits) return false;
  let random; try { random = validateRandomState(m.beforeRandom); } catch { return false; }
  let action = m.selectedAction,expected = m.facingBefore;
  if (m.confused) { const direction = randomInteger(random,8); random = direction.state; const step = DIRECTIONS[direction.value]; expected = step ? facing(step.x,step.z) : m.facingBefore; action = { ...action,target: { kind: 'facing' } }; }
  if (fingerprint(random) !== fingerprint(m.directionRandom) || fingerprint(action) !== fingerprint(m.action) || expected !== m.facingAfter) return false;
  const hit = action.kind === 'move-use' && action.moveId === 'move-barrage' ? randomInteger(random,4) : null;
  if (m.totalHits !== (hit ? hit.value+2 : 1) || fingerprint(m.afterRandom) !== fingerprint(hit?.state ?? random)) return false;
  if (action.kind === 'move-use') {
    const known = a.moves.slots.some(row => row?.moveSlotId === action.moveSlotId && row.moveId === action.moveId) || s.forgottenMoves?.some(row => row.actorId === a.actorId && row.moveSlot.moveSlotId === action.moveSlotId && row.moveSlot.moveId === action.moveId && row.forgottenRevision >= award.awardedRevision);
    if (!known || m.beforePp === null || m.afterPp === null || m.beforePp < 1 || m.beforePp > 99 || m.afterPp !== m.beforePp-1) return false;
  } else if (m.beforePp !== null || m.afterPp !== null) return false;
  if (m.chargeBefore !== null && m.chargeBefore.statusId !== 'charging' || m.chargeOwned && m.chargeBefore === null) return false;
  const live = s.sinisterTurn?.move;
  if (live && live.actor.actorId === m.actor.actorId && live.preparedRevision === m.preparedRevision) {
    if (fingerprint(live.selectedAction) !== fingerprint(m.selectedAction) || fingerprint(live.action) !== fingerprint(m.action) || fingerprint(live.beforeRandom) !== fingerprint(m.beforeRandom) || fingerprint(live.afterRandom) !== fingerprint(m.afterRandom) || live.totalHits !== m.totalHits || live.completedHits <= m.completedHits) return false;
  }
  return true;
}
/** @param {Session} s @param {Award} award @param {number} revision */
function sourceValid(s,award,revision) {
  const source = award.sinisterSource,f = award.sourceFrame;
  if (!source || source.actor.side !== 'team' || source.actor.actorId !== award.attackerActorId || !sinisterWorkRef(s,source.actor) || !frameValid(s,f)) return false;
  if (source.kind === 'impact') return impactValid(s,award,revision);
  if (source.kind === 'action') return opportunity(s,f,source.actor) && f.stage === 'decision' && f.step === 0 && f.action?.kind === 'item' && ['use','throw'].includes(f.action.operation) && f.action.actorId === award.attackerActorId;
  if (f.flushing) {
    const parent = f.pass === 'leader' && f.stage === 'begin' && f.step === 0 && f.active?.actorId === s.leaderActorId || f.pass === 'boundary' && f.stage === 'select' && f.step === 1 && f.active === null;
    return parent && !f.special && !f.action && !f.beginningRan && f.flushing.step === 3 && fingerprint(f.flushing.order[f.flushing.index]) === fingerprint(source.actor);
  }
  return opportunity(s,f,source.actor) && f.stage === 'after' && f.step === 3 || f.pass === 'follower-end' && f.stage === 'select' && f.step === 0 && f.active === null && !f.action && !f.beginningRan && !f.special && f.slotIndex === source.actor.slot+1;
}
/** New-only source ledger on the real detached prospective state. Complete
 * actor/cache/condition/history admission is an independent factory obligation.
 * @param {State} state @param {Catalogs} catalogs @param {number} [revision] */
export function sinisterAwardProblem(state,catalogs,revision = state.revision) {
  const shape = sinisterShapeProblem(state); if (shape) return shape;
  const s = state.session;
  if (state.contentRevision !== SINISTER_WORK_REVISION || !s?.sinisterTurn || s.escortGuest) return 'Sinister awards require their actual new session; retained v24 stays with its original owner.';
  for (const actor of Object.values(s.actors)) {
    const pending = actor.pendingExperience; if (!pending) continue;
    if (actor.binding.kind !== 'roster' || actor.affiliation !== 'team' || !s.teamOrder.includes(actor.actorId) || !s.scheduler.teamSlots.includes(actor.actorId) || pending.level !== actor.growth.level || pending.level >= 100 || pending.amount < 1 || pending.amount > 9999999 || pending.experienceBefore.denominator !== 1 || pending.gainsBefore.denominator !== 1 || pending.experienceBefore.numerator < 0 || pending.gainsBefore.numerator < 0 || pending.experienceBefore.numerator+pending.amount !== value(actor.growth.totalExperience) || pending.gainsBefore.numerator+pending.amount !== value(actor.gains.experience) || !pending.awards.length || pending.awards.length > 128) return 'Sinister pending EXP requires exact new source credit and unchanged pre-award growth.';
    let total = pending.experienceBefore.numerator; const seen = new Set();
    for (const award of pending.awards) {
      const target = s.actors[award.defeatedActorId],attacker = s.actors[award.attackerActorId],f = award.sourceFrame,c = s.scheduler.continuation;
      if (!target || !attacker || seen.has(target.actorId) || target.affiliation !== 'hostile' || target.binding.kind !== 'wild' || target.resources.hp !== 0 || target.placement.kind !== 'off-map' || target.placement.reason !== 'fainted' || attacker.affiliation !== 'team' || attacker.binding.kind !== 'roster' || !s.teamOrder.includes(attacker.actorId) || award.awardedRevision <= s.entry.entryRevision || award.awardedRevision > revision || !sourceValid(s,award,revision) || award.sourceRound < 0 || (s.scheduler.roundNumber-award.sourceRound)*24+c.phase-f.phase < 0 || (s.scheduler.roundNumber-award.sourceRound)*24+c.phase-f.phase >= 24) return 'Sinister award lost its real defeated generation, source preparation/end PC or committed time.';
      const p = catalogs.species.getProfile(target.identity.speciesId,target.identity.formId),base = p.experienceYield+Math.trunc(p.experienceYield*(target.growth.level-1)/10),xp = Math.max(1,target.memory.experienceContributors.length ? base : Math.trunc(base/2));
      if (award.amount !== Math.min(9999999-total,xp) || award.amount < 1 || state.random.combatRecruitment.draws < (award.sinisterSource?.kind === 'impact' ? award.sinisterSource.move.afterRandom.draws : 0)) return 'Sinister source award differs from the actual species yield, cap or consumed preparation draws.';
      total += award.amount; seen.add(target.actorId);
    }
    if (total !== value(actor.growth.totalExperience)) return 'Sinister newly credited sum differs from its retained ledger.';
  }
  return null;
}
