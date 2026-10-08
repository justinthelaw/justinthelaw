import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { ownsEscortSourceRef } from '../state/escort-entry-proof.js';
import { blocked } from './support.js';
/** @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {import('../../contracts/campaign.js').SessionActor} Actor */

/** Source HandleFaint boundary after real Reviver arbitration and held drop.
 * Retain the actor solely as an authenticated historical source. Its native
 * team slot, map occupancy, deferred work and live targets disappear together;
 * the terminal hook owns the once-only client-loss notice and settlement.
 * This consumer does not award EXP, mutate roster, or fabricate a corpse slot.
 * @param {Context} context @param {Actor} actor */
export function removeUnrevivedEscort(context,actor) {
  const state = context.state,session = state.session,guest = session?.escortGuest;
  if (state.contentRevision !== ESCORT_WORK_REVISION || !session || !guest || actor.binding.kind !== 'escort-guest' || actor.actorId !== guest.entry.actorId || actor.binding.jobId !== guest.entry.jobId || guest.lifecycle.kind !== 'live' || actor.resources.hp !== 0 || actor.placement.kind !== 'map' || actor.placement.mapId !== session.floor.mapId || session.leaderActorId === actor.actorId || guest.joinLocation !== 74 || state.containers[actor.heldContainerId]?.itemIds.length !== 0) return blocked('escort-irreversible-faint-owner');
  const source = { side: /** @type {const} */ ('team'),slot: guest.entry.slot,actorId: actor.actorId };
  // Zero HP is intentionally accepted here: damage has already committed in
  // this synchronous unit, and no live-generation helper requires positive HP.
  if (!ownsEscortSourceRef(state,source)) return blocked('escort-irreversible-faint-generation');
  actor.placement = { kind: 'off-map',reason: 'fainted' };
  actor.speed.movementPending = false; actor.speed.endEffectsPending = false; actor.speed.deferred = false;
  session.scheduler.teamSlots[source.slot] = null;
  session.teamOrder.splice(session.teamOrder.indexOf(actor.actorId),1);
  for (const other of Object.values(session.actors)) if (other.ai.target?.kind === 'actor' && other.ai.target.actorId === actor.actorId) other.ai.target = null;
  actor.ai.target = null; actor.ai.destination = null; actor.ai.waitingForLeader = false;
  guest.ai = null;
  guest.lifecycle = { kind: 'removed',reason: 'fainted',removedRevision: state.revision+1,mapId: session.floor.mapId,source };
}

/** Native forced-loss2 is durable until real terminal settlement; a removed
 * client cannot bypass loss merely because its occupied slot is now empty.
 * @param {import('../../contracts/campaign.js').CampaignState} state */
export function hasIrreversibleEscortLoss(state) {
  const guest = state.session?.escortGuest;
  return state.contentRevision === ESCORT_WORK_REVISION && guest?.lifecycle.kind === 'removed' && guest.lifecycle.reason === 'fainted' && ownsEscortSourceRef(state,guest.lifecycle.source,true,state.revision+1);
}
