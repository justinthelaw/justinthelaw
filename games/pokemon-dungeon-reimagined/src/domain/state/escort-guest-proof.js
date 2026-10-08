import { DEFAULT_IQ } from '../../../content/state/opening-facts.js';
import { ESCORT_ENTRY_FACTS as FACTS } from '../../../content/authored/escort-entry-facts.js';
import { fingerprint } from './relations.js';
/** Source XP lock and saved temporary lifecycle, on actual raw actors/resources.
 * Shared numerical/PP/conditions/item/map/scheduler policies still run; this
 * proves the new binding and immutable acquisition fields they cannot infer.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {number} [revision] @returns {string|null} */
export function escortGuestProblem(state,revision = state.revision) {
  const session = state.session,guest = session?.escortGuest;
  if (!session || !guest) return null;
  const entry = guest.entry,actor = session.actors[entry.actorId],source = FACTS.clients.find(row => row.speciesId === entry.client.speciesId && row.formId === entry.client.formId);
  if (!actor || !source || actor.binding.kind !== 'escort-guest' || actor.binding.jobId !== entry.jobId || actor.affiliation !== 'team' || session.leaderActorId === actor.actorId || guest.nativeRecruitedId !== FACTS.temporaryRecruitedId || actor.heldContainerId !== entry.heldContainerId) return 'Temporary client has lost its genuine nonleader team/job/native/held owner.';
  const zero = { numerator: 0,denominator: 1 },zeroStats = { hp: 0,attack: 0,defense: 0,specialAttack: 0,specialDefense: 0 };
  if (actor.pendingExperience || actor.growth.level !== 1 || fingerprint(actor.growth.totalExperience) !== fingerprint(zero) || fingerprint(actor.growth.naturalStats) !== fingerprint(source.stats) || fingerprint(actor.growth.permanentStatBonuses) !== fingerprint(zeroStats) || actor.growth.iqPoints !== FACTS.minimumDungeonIq || fingerprint(actor.enabledIqSkillIds) !== fingerprint(DEFAULT_IQ) || actor.tacticId !== 'tactic-lets-go-together' || fingerprint(actor.gains.experience) !== fingerprint(zero) || fingerprint(actor.gains.statItems) !== fingerprint(zeroStats) || actor.gains.iq !== 0 || actor.gains.moveBoosts.length) return 'XP-locked client cannot acquire roster EXP/levels/IQ/moves/stat credit or edited team controls.';
  if (actor.moves.slots.length !== 4 || actor.moves.links.length || actor.moves.setMoveSlotId !== null || actor.battleMoves.slots.length !== source.moves.length) return 'Guest retains its actual source move-slot layout without SET/links/learning.';
  for (let index = 0; index < 4; index++) {
    const expected = source.moves[index],slot = actor.moves.slots[index],pp = actor.battleMoves.slots[index];
    if (!expected) { if (slot !== null) return 'Guest retains the genuine trailing source empty slots.'; continue; }
    if (!slot || slot.moveSlotId !== entry.moveSlotIds[index] || slot.moveId !== expected.moveId || !slot.enabled || slot.powerBoost !== 0 || slot.ppCapacityBonus !== 0 || !pp || pp.moveSlotId !== slot.moveSlotId || pp.currentPp < 0 || pp.currentPp > expected.basePp) return 'Guest move identities/order/full base-PP cap are source-owned, including exhausted selected uses.';
  }
  if (guest.lossNoticeRevision !== null && (guest.lifecycle.kind !== 'removed' || guest.lifecycle.reason !== 'fainted' || guest.lossNoticeRevision < guest.lifecycle.removedRevision || guest.lossNoticeRevision > revision)) return 'Client-loss notice is once-owned by the actual irreversible faint boundary.';
  const held = state.containers[entry.heldContainerId];
  if (!held || held.owner.kind !== 'actor-held' || held.owner.actorId !== actor.actorId || held.owner.sessionId !== session.sessionId || held.itemIds.length > 1) return 'Guest has one actual reciprocal canonical held owner.';
  if (guest.lifecycle.kind === 'live') {
    if (guest.joinLocation !== FACTS.joinLocation || session.scheduler.teamSlots[entry.slot] !== actor.actorId || !session.teamOrder.includes(actor.actorId) || actor.resources.hp <= 0 || actor.placement.kind !== 'map' || actor.placement.mapId !== session.floor.mapId) return 'Live client requires its actual current map/native slot and join74.';
  } else {
    const removal = guest.lifecycle;
    if (removal.source.side !== 'team' || removal.source.slot !== entry.slot || removal.source.actorId !== entry.actorId || removal.removedRevision <= session.entry.entryRevision || removal.removedRevision > revision || session.scheduler.teamSlots[entry.slot] !== null || session.teamOrder.includes(actor.actorId) || actor.placement.kind !== 'off-map' || actor.speed.movementPending || actor.speed.endEffectsPending || actor.speed.deferred || actor.ai.target !== null || actor.ai.destination !== null || actor.ai.waitingForLeader || held.itemIds.length || Object.values(session.actors).some(other => other.ai.target?.kind === 'actor' && other.ai.target.actorId === actor.actorId)) return 'Deleted client retains only its exact historical generation, with no live occupancy, target, held lot or work obligation.';
    if (removal.reason === 'fainted' && (removal.mapId !== session.floor.mapId || guest.joinLocation !== FACTS.joinLocation || actor.resources.hp !== 0 || actor.placement.reason !== 'fainted')) return 'Irreversible client faint requires zero HP on the actual loss floor and native join74.';
    // Objective removal receives its own before-capability/visibility/recipient
    // producer receipt before that branch can activate; a label alone is not proof.
    if (removal.reason === 'objective' && actor.placement.reason !== 'rescued') return 'Successful event deletion retains the actual rescued historical placement.';
  }
  return null;
}
