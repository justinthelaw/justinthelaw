import { FRIEND_JOB_FACTS } from '../../../content/authored/friend-job-facts.js';
import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { canSeeActor } from '../navigation/sight.js';
import { clearLeechSeedLinks } from './leech-links.js';
import { clone, ability, maxHp, navigationContext, blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').SessionActor} Actor
 * @typedef {import('./support.js').Catalogs} Catalogs */
const TWO_TURN = Object.freeze(['solarbeam','sky-attack','razor-wind','focus-punch','skull-bash','flying','bouncing','diving','digging']);
/** Native sub_8070BC0. Bide, Rage and Charge are not in the source multi-turn
 * list, so neither their possession nor EXP lock suppresses conversation.
 * @param {State|import('../../contracts/campaign.js').CampaignSnapshot} state
 * @param {import('../../../content/navigation-types.js').ReadonlyData<Actor>} actor @param {Catalogs} catalogs */
export function canNativeEscortConverse(state,actor,catalogs) {
  const c = actor.conditions;
  return actor.resources.hp > 0 && !TWO_TURN.includes(c.bide?.statusId ?? '') && !actor.auxiliaryConditions.muzzled
    && !['yawning','nightmare','sleep','napping'].includes(c.sleep?.statusId ?? '')
    && !['petrified','frozen','wrap','wrapped'].includes(c.frozen?.statusId ?? '')
    && !['confused','cringe','infatuated','paused'].includes(c.cringe?.statusId ?? '')
    && c.invisible?.statusId !== 'invisible' && !['cross-eyed','blinker'].includes(c.blinker?.statusId ?? '') && c.curse?.statusId !== 'decoy'
    && !(actor.actorId !== state.session?.leaderActorId && ability(actor,catalogs,'Run Away') && actor.resources.hp < Math.trunc(maxHp(actor)/2));
}
/** Recipient sees the genuine live client with native positional sight, rather
 * than requiring adjacency between them. Leader interaction is a separate gate.
 * @param {State|import('../../contracts/campaign.js').CampaignSnapshot} state
 * @param {import('../../../content/navigation-types.js').ReadonlyData<Actor>} recipient
 * @param {import('../../../content/navigation-types.js').ReadonlyData<Actor>} guest @param {Catalogs} catalogs */
export function recipientSeesEscort(state,recipient,guest,catalogs) {
  const session = state.session;
  if (!session || recipient.placement.kind !== 'map' || guest.placement.kind !== 'map' || recipient.placement.mapId !== session.floor.mapId || guest.placement.mapId !== session.floor.mapId) return false;
  return canSeeActor(session.floor,{ position: recipient.placement.position,blinded: recipient.conditions.blinker?.statusId === 'blinker',seesInvisible: recipient.conditions.blinker?.statusId === 'eyedrops' },{ actorId: guest.actorId,position: guest.placement.position,present: guest.resources.hp > 0,invisible: guest.conditions.invisible?.statusId === 'invisible' },navigationContext(session,catalogs),'actual');
}
/** Genuine native8 producer, before the existing no-turn leave/stay dialogue.
 * Join resets before event deletion, preventing client-loss2; both actual slots
 * disappear, with no damage, EXP, held drop, recruitment or permanent copyback.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../contracts.js').ActorId} recipientId @param {Catalogs} catalogs */
export function completeNativeEscortObjective(context,recipientId,catalogs) {
  const state = context.state,session = state.session,guest = session?.escortGuest,conversion = session?.entry.nativeEscort,recipient = session?.actors[recipientId];
  if (state.contentRevision !== ESCORT_WORK_REVISION || !session || session.purpose.kind !== 'ordinary' || !guest || guest.lifecycle.kind !== 'live' || !conversion || conversion.objective !== null || !recipient || recipient.binding.kind !== 'job-client' || recipient.placement.kind !== 'map') return blocked('escort-objective-owner');
  const job = state.progress.jobs[recipient.binding.jobId],actor = session.actors[guest.entry.actorId],route = FRIEND_JOB_FACTS.routes.find(row => row.dungeonId === session.dungeonId);
  if (!job || job.goal.kind !== 'escort' || job.jobId !== guest.entry.jobId || job.phase.kind !== 'active' || job.phase.sessionId !== session.sessionId || session.floor.location.kind !== 'exploration' || job.goal.destination.floorId !== session.floor.location.address.floorId || !actor || actor.binding.kind !== 'escort-guest' || actor.binding.jobId !== job.jobId || !route) return blocked('escort-objective-source');
  const frame = session.scheduler.continuation;
  if (session.scheduler.kind !== 'ready' || frame.pass !== 'leader' || frame.stage !== 'decision' || frame.step !== 0 || frame.active?.side !== 'team' || frame.active.actorId !== session.leaderActorId || session.scheduler.teamSlots[frame.active.slot] !== session.leaderActorId || !frame.beginningRan || frame.skipBeginning || frame.action !== null || frame.activeEffect !== null || frame.flushing !== null || frame.special !== null || frame.terminal !== 'none' || frame.replanCount !== 0) return blocked('escort-objective-no-turn-pc');
  const objective = session.objectives[job.phase.objectiveIndex],first = session.scheduler.teamSlots.flatMap(id => id && session.actors[id]?.binding.kind === 'escort-guest' ? [id] : [])[0];
  const recipientSlot = session.scheduler.wildSlots.indexOf(recipientId);
  if (!objective || objective.state.kind !== 'actor-target' || objective.state.actorId !== recipientId || first !== actor.actorId || recipientSlot < 0 || !canNativeEscortConverse(state,recipient,catalogs) || !canNativeEscortConverse(state,actor,catalogs) || !recipientSeesEscort(state,recipient,actor,catalogs)) return blocked('escort-objective-capability-sight');
  conversion.objective = { beforeGuest: clone({ ...actor,binding: actor.binding }),beforeRecipient: clone(recipient),floor: clone(session.floor),sourceFrame: clone(session.scheduler.continuation),completedRevision: state.revision+1,recipientSlot,resetJoinLocation: route.nativeDungeonId };
  job.phase = { kind: 'objective-complete',sessionId: session.sessionId,completedRevision: state.revision+1 };
  objective.state = { kind: 'complete',completedRevision: state.revision+1 };
  guest.joinLocation = route.nativeDungeonId;
  const source = { side: /** @type {const} */ ('team'),slot: guest.entry.slot,actorId: actor.actorId };
  guest.ai = null;
  guest.lifecycle = { kind: 'removed',reason: 'objective',removedRevision: state.revision+1,mapId: session.floor.mapId,source };
  for (const removed of [recipient,actor]) {
    clearLeechSeedLinks(context,removed);
    const held = state.containers[removed.heldContainerId]; if (!held) return blocked('escort-objective-held');
    for (const id of held.itemIds) { delete state.items[id]; context.emit({ type: 'itemChanged',itemInstanceId: id }); }
    held.itemIds = [];
    removed.placement = { kind: 'off-map',reason: 'rescued' };
    removed.speed.movementPending = false; removed.speed.endEffectsPending = false; removed.speed.deferred = false;
    removed.ai.target = null; removed.ai.destination = null; removed.ai.waitingForLeader = false;
    for (const other of Object.values(session.actors)) if (other.ai.target?.kind === 'actor' && other.ai.target.actorId === removed.actorId) other.ai.target = null;
  }
  session.scheduler.teamSlots[source.slot] = null;
  session.scheduler.wildSlots[recipientSlot] = null;
  session.teamOrder.splice(session.teamOrder.indexOf(actor.actorId),1);
  context.emit({ type: 'message',messageId: 'job-objective-complete' });
}
