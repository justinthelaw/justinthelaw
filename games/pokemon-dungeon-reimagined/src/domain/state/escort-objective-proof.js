import { FRIEND_JOB_FACTS } from '../../../content/authored/friend-job-facts.js';
import { canNativeEscortConverse, recipientSeesEscort } from '../gameplay/escort-objective.js';
import { fingerprint } from './relations.js';
/** Independent native8/reset-join/event-deletion receipt on actual source
 * actors and retained floor. This never rewrites the state as v23 or infers
 * success from counts; native9 remains the later real successful return owner.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {import('../gameplay/support.js').Catalogs} catalogs @param {number} revision
 * @returns {string|null} */
export function escortObjectiveProblem(state,catalogs,revision) {
  const session = state.session,guest = session?.escortGuest,receipt = session?.entry.nativeEscort?.objective;
  if (!session || !guest) return receipt ? 'Escort objective receipt has no actual temporary entry owner.' : null;
  if (guest.lifecycle.kind !== 'removed' || guest.lifecycle.reason !== 'objective') return receipt ? 'Objective receipt cannot coexist with live/irreversibly fainted client state.' : null;
  if (!receipt) return 'Event deletion requires its actual before-capability/visibility/recipient receipt.';
  const actor = session.actors[guest.entry.actorId],before = receipt.beforeGuest,recipient = receipt.beforeRecipient,job = state.progress.jobs[guest.entry.jobId],route = FRIEND_JOB_FACTS.routes.find(row => row.dungeonId === session.dungeonId),f = receipt.sourceFrame;
  if (!actor || !route || !job || job.goal.kind !== 'escort' || job.phase.kind !== 'objective-complete' || job.phase.sessionId !== session.sessionId || job.phase.completedRevision !== receipt.completedRevision || receipt.completedRevision !== guest.lifecycle.removedRevision || receipt.completedRevision <= session.entry.entryRevision || receipt.completedRevision > revision || receipt.floor.mapId !== guest.lifecycle.mapId || receipt.floor.location.kind !== 'exploration' || receipt.floor.location.address.floorId !== job.goal.destination.floorId || !session.visitedFloorIds.includes(job.goal.destination.floorId) || receipt.resetJoinLocation !== route.nativeDungeonId || guest.joinLocation !== route.nativeDungeonId || before.actorId !== actor.actorId || before.binding.kind !== 'escort-guest' || before.binding.jobId !== job.jobId || before.placement.kind !== 'map' || before.placement.mapId !== receipt.floor.mapId || recipient.binding.kind !== 'job-client' || recipient.binding.jobId !== job.jobId || fingerprint(recipient.identity) !== fingerprint(guest.entry.recipient) || recipient.placement.kind !== 'map' || recipient.placement.mapId !== receipt.floor.mapId || receipt.recipientSlot < 0 || receipt.recipientSlot >= session.scheduler.wildSlots.length) return 'Completed escort requires its exact request/independent recipient/floor/revision/native join reset and source identities.';
  if (!session.objectives.some(row => row.jobId === job.jobId && row.state.kind === 'complete' && row.state.completedRevision === receipt.completedRevision)) return 'Actual native8 objective state must match the sole committed producer revision.';
  if (f.pass !== 'leader' || f.stage !== 'decision' || f.step !== 0 || f.active?.side !== 'team' || f.active.actorId !== session.leaderActorId || session.scheduler.teamSlots[f.active.slot] !== session.leaderActorId || !f.beginningRan || f.skipBeginning || f.action !== null || f.activeEffect !== null || f.flushing !== null || f.special !== null || f.terminal !== 'none' || f.replanCount !== 0) return 'Escort completion cannot manufacture a no-turn leader-input source PC.';
  // Event deletion changes precisely placement/work/targets and the cleared
  // live Leech Seed link. The real guest HP/PP/stats/status/resources persist as
  // a historical actor, so fake capability snapshots cannot replace them.
  const expected = { ...before,placement: { kind: 'off-map',reason: 'rescued' },conditions: { ...before.conditions,leechSeed: null },speed: { ...before.speed,movementPending: false,endEffectsPending: false,deferred: false },ai: { target: null,destination: null,waitingForLeader: false } };
  if (fingerprint(actor) !== fingerprint(expected)) return 'Deleted guest resources must equal its actual before snapshot with only source event cleanup.';
  const currentRecipient = session.actors[recipient.actorId];
  if (currentRecipient) {
    const removed = { ...recipient,placement: { kind: 'off-map',reason: 'rescued' },conditions: { ...recipient.conditions,leechSeed: null },speed: { ...recipient.speed,movementPending: false,endEffectsPending: false,deferred: false },ai: { target: null,destination: null,waitingForLeader: false } };
    if (fingerprint(currentRecipient) !== fingerprint(removed) || session.scheduler.wildSlots.includes(recipient.actorId) || state.containers[recipient.heldContainerId]?.itemIds.length !== 0) return 'Independent recipient must undergo the same genuine event deletion without a live wild slot or held transfer.';
  } else if (session.floor.mapId === receipt.floor.mapId || state.containers[recipient.heldContainerId]) return 'Recipient generation may retire only at the actual later floor cleanup boundary.';
  if (session.floor.mapId === receipt.floor.mapId && fingerprint(session.floor) !== fingerprint(receipt.floor)) {
    // Knowledge/counters/trap revelations may legitimately advance after stay.
    // Sight geometry remains the actual map that owned this no-turn event.
    if (fingerprint({ tiles: session.floor.tiles,rooms: session.floor.rooms,location: session.floor.location,definitionId: session.floor.definitionId,width: session.floor.width,height: session.floor.height }) !== fingerprint({ tiles: receipt.floor.tiles,rooms: receipt.floor.rooms,location: receipt.floor.location,definitionId: receipt.floor.definitionId,width: receipt.floor.width,height: receipt.floor.height })) return 'Archived objective sight geometry must retain the actual source map.';
  }
  const source = { ...state,session: { ...session,floor: receipt.floor } };
  try { if (!canNativeEscortConverse(source,recipient,catalogs) || !canNativeEscortConverse(source,before,catalogs) || !recipientSeesEscort(source,recipient,before,catalogs)) return 'Recipient and client must both pass actual native capability and recipient-to-client sight.'; } catch { return 'Invalid retained native objective sight/capability source.'; }
  return null;
}
