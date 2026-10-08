import { canMeleeAttack } from '../navigation/geometry.js';
import { navActor, navigationContext, FACINGS } from './support.js';
import { canNativeEscortConverse, recipientSeesEscort } from './escort-objective.js';
/** @typedef {import('../../contracts/campaign.js').CampaignSnapshot} Snapshot */
/** Pure live interaction ownership, shared by creation, save admission and
 * confirmation. An already-open prompt does not change physical eligibility.
 * Exactly the leader-facing tile at the leader input boundary, with native
 * matching melee/corner geometry.
 * @param {Snapshot} state @param {import('./support.js').Catalogs} catalogs */
export function interactableEscortWorkClient(state, catalogs) {
  const session = state.session, leader = session?.actors[session.leaderActorId];
  if (!state.earlyWork || state.mode !== 'dungeon' || session?.purpose.kind !== 'ordinary' || session.scheduler.kind !== 'ready' || leader?.placement.kind !== 'map' || leader.resources.hp <= 0 || !canNativeEscortConverse(state, leader, catalogs)) return null;
  const frame = session.scheduler.continuation;
  if (frame.terminal !== 'none' || frame.pass !== 'leader' || frame.stage !== 'decision' || frame.active?.actorId !== leader.actorId || !frame.beginningRan) return null;
  const angle = FACINGS.indexOf(leader.facing) * Math.PI / 4, p = leader.placement.position;
  const target = Object.values(session.actors).find(actor => actor.binding.kind === 'job-client' && actor.placement.kind === 'map' && actor.resources.hp > 0 && actor.placement.position.x === p.x + Math.round(Math.sin(angle)) && actor.placement.position.z === p.z - Math.round(Math.cos(angle)));
  if (!target || target.placement.kind !== 'map' || !canMeleeAttack(navActor(leader), session.floor, target.placement.position, navigationContext(session, catalogs))) return null;
  // Source first clears indefinite spawn sleep/petrification on the target.
  // Neither is reachable on admitted clients; the caller retains this ordering.
  if (!canNativeEscortConverse(state,target,catalogs)) return null;
  const job = target.binding.kind === 'job-client' ? state.progress.jobs[target.binding.jobId] : null;
  if (!job || job.phase.kind !== 'active' || job.phase.sessionId !== session.sessionId) return null;
  if (job.goal.kind === 'escort') {
    const guest = session.escortGuest,actor = guest ? session.actors[guest.entry.actorId] : null;
    if (!guest || guest.lifecycle.kind !== 'live' || guest.entry.jobId !== job.jobId || !actor || !canNativeEscortConverse(state,actor,catalogs) || !recipientSeesEscort(state,target,actor,catalogs)) return null;
  }
  return target;
}
