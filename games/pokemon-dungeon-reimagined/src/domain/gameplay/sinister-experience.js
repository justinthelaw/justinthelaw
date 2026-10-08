import { SINISTER_WORK_REVISION } from '../state/sinister-work-revision.js';
import { sinisterWorkRef } from '../state/sinister-turn-proof.js';
import { fingerprint } from '../state/relations.js';
import { blocked, clone, profile, quantity, value } from './support.js';
/** @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {import('../../contracts/campaign.js').SessionActor} Actor
 * @typedef {import('./support.js').Catalogs} Catalogs
 * @typedef {import('../../contracts/sinister-learning.js').SinisterAwardSource} Source */
/** Called only by actual damage/faint after Reviver arbitration. The immutable
 * source captures the executing paid impact before its nextHit increment; it
 * never copies the selected original action over the resolved action.
 * @param {Context} context @param {Actor} attacker @returns {Source} */
function awardSource(context,attacker) {
  const s = context.state.session,w = s?.sinisterTurn,c = s?.scheduler.continuation;
  if (!s || !w || !c || w.checkpoint || w.terminal || s.learning || s.learningWork || s.scheduler.kind !== 'ready') return blocked('sinister-award-exclusive-source');
  const actor = c.flushing?.order[c.flushing.index] ?? c.active ?? (c.pass === 'follower-end' ? { side: /** @type {const} */ ('team'),slot: c.slotIndex-1,actorId: s.scheduler.teamSlots[c.slotIndex-1] ?? attacker.actorId } : null);
  if (!actor || actor.actorId !== attacker.actorId || actor.side !== 'team' || !sinisterWorkRef(s,actor)) return blocked('sinister-award-source-generation');
  if (c.stage === 'effect' && !c.flushing) {
    const move = w.move,sequence = w.combat.sequence;
    if (!move || !sequence || move.disposition !== 'active' || move.actor.actorId !== attacker.actorId || fingerprint(c.action) !== fingerprint(move.selectedAction) || sequence.nextHit !== move.completedHits || sequence.nextHit >= sequence.totalHits || c.activeEffect || c.step !== 0) return blocked('sinister-award-paid-impact');
    return { kind: 'impact',actor: clone(actor),move: clone(move),sequence: clone(sequence) };
  }
  if (w.move || w.combat.sequence) return blocked('sinister-award-overtook-impact');
  if (!c.flushing && c.stage === 'decision' && c.step === 0 && c.action?.kind === 'item' && ['use','throw'].includes(c.action.operation) && c.action.actorId === attacker.actorId) return { kind: 'action',actor: clone(actor) };
  if (c.flushing?.step === 3 || !c.flushing && c.stage === 'after' && c.step === 3 || c.pass === 'follower-end' && !c.flushing && c.stage === 'select' && c.active === null && c.step === 0) return { kind: 'end',actor: clone(actor) };
  return blocked('sinister-award-native-pc');
}
/** New-only producer. Real source XP lock, living roster order, source species
 * yield and cap are checked before capture. No displayed/generic credit can be
 * retroactively converted into this provenance.
 * @param {Context} context @param {Actor} target @param {Actor} attacker @param {Catalogs} catalogs */
export function creditSinisterDefeat(context,target,attacker,catalogs) {
  const s = context.state.session;
  if (context.state.contentRevision !== SINISTER_WORK_REVISION || !s?.sinisterTurn || s.escortGuest) return blocked('sinister-award-current-session');
  if (target.affiliation !== 'hostile' || target.binding.kind !== 'wild' || target.resources.hp !== 0 || target.placement.kind !== 'map' || target.placement.mapId !== s.floor.mapId || !s.scheduler.wildSlots.includes(target.actorId) || attacker.affiliation !== 'team' || attacker.binding.kind !== 'roster') return blocked('sinister-award-actual-defeat');
  const p = profile(target.identity,catalogs),base = p.experienceYield+Math.trunc(p.experienceYield*(target.growth.level-1)/10),xp = Math.max(1,target.memory.experienceContributors.length ? base : Math.trunc(base/2));
  const source = awardSource(context,attacker);
  for (const id of s.teamOrder) {
    const actor = s.actors[id];
    if (!actor || actor.binding.kind !== 'roster' || actor.affiliation !== 'team' || !s.scheduler.teamSlots.includes(id)) return blocked('sinister-award-roster-recipient');
    if (actor.resources.hp === 0 || actor.growth.level === 100) continue;
    const amount = Math.min(9999999-value(actor.growth.totalExperience),xp);
    if (amount <= 0) continue;
    actor.pendingExperience ??= { experienceBefore: clone(actor.growth.totalExperience),gainsBefore: clone(actor.gains.experience),amount: 0,level: actor.growth.level,awards: [] };
    actor.pendingExperience.amount += amount;
    actor.pendingExperience.awards.push({ defeatedActorId: target.actorId,attackerActorId: attacker.actorId,amount,awardedRevision: context.state.revision+1,sourceRound: s.scheduler.roundNumber,sourceFrame: clone(s.scheduler.continuation),sinisterSource: clone(source) });
    actor.growth.totalExperience = quantity(value(actor.growth.totalExperience)+amount);
    actor.gains.experience = quantity(value(actor.gains.experience)+amount);
  }
}
