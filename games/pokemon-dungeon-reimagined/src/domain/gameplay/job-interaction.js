import { canMeleeAttack } from '../navigation/geometry.js';
import { navActor, navigationContext, FACINGS, ability, maxHp } from './support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** Native sub8070BC0, restricted to admitted conditions. Paralysis/poison alone
 * do not prevent talking. Unsupported charge/flee/condition effects stay gated
 * by their separate policies; none gains a silent talk-specific substitute.
 * @param {Snapshot} state @param {NonNullable<Snapshot['session']>['actors'][string]} actor
 * @param {import('./support.js').Catalogs} catalogs */
function canTalk(state, actor, catalogs) {
  const c = actor.conditions;
  return !c.bide && !actor.auxiliaryConditions.muzzled
    && !['yawning','nightmare','sleep','napping'].includes(c.sleep?.statusId ?? '')
    && !['petrified','frozen','wrap','wrapped'].includes(c.frozen?.statusId ?? '')
    && !['confused','cringe','infatuated','paused'].includes(c.cringe?.statusId ?? '')
    && c.invisible?.statusId !== 'invisible' && !['cross-eyed','blinker'].includes(c.blinker?.statusId ?? '') && c.curse?.statusId !== 'decoy'
    && !(actor.actorId !== state.session?.leaderActorId && ability(actor, catalogs, 'Run Away') && actor.resources.hp < Math.trunc(maxHp(actor) / 2));
}
/** Pure live interaction ownership, shared by creation, save admission and
 * confirmation. An already-open prompt does not change physical eligibility.
 * Exactly the leader-facing tile at the leader input boundary, with native
 * matching melee/corner geometry.
 * @param {Snapshot} state @param {import('./support.js').Catalogs} catalogs */
export function interactableJobClient(state, catalogs) {
  const session = state.session, leader = session?.actors[session.leaderActorId];
  if (!state.earlyWork || state.mode !== 'dungeon' || session?.purpose.kind !== 'ordinary' || session.scheduler.kind !== 'ready' || leader?.placement.kind !== 'map' || leader.resources.hp <= 0 || !canTalk(state, leader, catalogs)) return null;
  const frame = session.scheduler.continuation;
  if (frame.terminal !== 'none' || frame.pass !== 'leader' || frame.stage !== 'decision' || frame.active?.actorId !== leader.actorId || !frame.beginningRan) return null;
  const angle = FACINGS.indexOf(leader.facing) * Math.PI / 4, p = leader.placement.position;
  const target = Object.values(session.actors).find(actor => actor.binding.kind === 'job-client' && actor.placement.kind === 'map' && actor.resources.hp > 0 && actor.placement.position.x === p.x + Math.round(Math.sin(angle)) && actor.placement.position.z === p.z - Math.round(Math.cos(angle)));
  if (!target || target.placement.kind !== 'map' || !canMeleeAttack(navActor(leader), session.floor, target.placement.position, navigationContext(session, catalogs))) return null;
  // Source first clears indefinite spawn sleep/petrification on the target.
  // Neither is reachable on admitted clients; the caller retains this ordering.
  return canTalk(state, target, catalogs) ? target : null;
}
