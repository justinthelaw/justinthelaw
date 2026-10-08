import { fingerprint } from './relations.js';
/** Actual saved mode1 floor epoch and mode0 four-position history.
 * Shared domain proofs separately authenticate original entry and map/resources.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {number} [revision] @returns {string|null} */
export function escortHistoryProblem(state,revision = state.revision) {
  const session = state.session,history = session?.nativeTeamHistory,guest = session?.escortGuest;
  if (!session?.entry.nativeEscort) return history || guest?.ai ? 'Legacy expedition cannot invent prospective movement history.' : null;
  if (!history || history.mapId !== session.floor.mapId || Object.keys(history.members).length > 4) return 'Native party position history belongs to the actual current map epoch and four slots.';
  const valid = (/** @type {{x:number,z:number}} */ p) => Number.isInteger(p.x) && Number.isInteger(p.z) && p.x >= 0 && p.z >= 0 && p.x < session.floor.width && p.z < session.floor.height;
  for (const id of session.scheduler.teamSlots) if (id && !history.members[id]) return 'Every actual occupied team slot retains four real previous positions.';
  for (const [id,row] of Object.entries(history.members)) {
    const actor = session.actors[id];
    if (!actor || actor.affiliation !== 'team' || actor.binding.kind !== 'roster' && actor.binding.kind !== 'escort-guest' || row.positions.length !== 4 || !row.positions.every(valid)) return 'Position-history identities and source tuple remain genuine team members on this map.';
    if (!row.lastWalk) {
      if (actor.placement.kind === 'map' && !row.positions.every(p => fingerprint(p) === fingerprint(actor.placement.kind === 'map' ? actor.placement.position : null))) return 'Fresh mode1 history equals the actual source placement four times.';
    } else {
      const walk = row.lastWalk;
      if (walk.before.length !== 4 || !walk.before.every(valid) || !valid(walk.from) || !valid(walk.to) || fingerprint(walk.from) === fingerprint(walk.to) || walk.revision < session.entry.entryRevision || walk.revision > revision || actor.placement.kind === 'map' && fingerprint(walk.to) !== fingerprint(actor.placement.position)) return 'Last actual ordinary walk requires a committed changing position and source-map tuple.';
      if (fingerprint(row.positions) !== fingerprint([walk.invisible ? walk.before[0] : walk.from,walk.before[0],walk.before[1],walk.before[2]])) return 'Mode0 history shifts all positions and suppresses only Invisible slot0 insertion.';
    }
  }
  if (guest?.lifecycle.kind === 'removed') return guest.ai === null ? null : 'Removed guest cannot retain native live AI targets or deferred follow work.';
  if (!guest) return null;
  const ai = guest.ai,actor = session.actors[guest.entry.actorId];
  if (!ai || !actor || actor.placement.kind !== 'map' || ai.mapId !== session.floor.mapId || ai.mobileTurnTimer !== 0 || ai.targetingEnemy || ai.turningAround || ai.moveRandomly || ai.targetPosition.x < -56 || ai.targetPosition.x > 112 || ai.targetPosition.z < -32 || ai.targetPosition.z > 64) return 'Finite Lets Go Together guest retains its actual source AI epoch and bounded mirrored target, without unsupported mobility/tactic flags.';
  if (ai.target) {
    const target = ai.target.ref;
    if (ai.target.mapId !== session.floor.mapId || target.side !== 'team' || target.actorId !== session.leaderActorId || session.scheduler.teamSlots[target.slot] !== target.actorId || !history.members[target.actorId]) return 'Native leader-follow pointer retains its actual map/slot/generation owner.';
  }
  if (['chase','remembered'].includes(ai.objective) && !ai.target) return 'Native chase/remembered objective needs the genuine retained leader target.';
  return null;
}
