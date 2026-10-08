import { ESCORT_ENTRY_FACTS as FACTS } from '../../../content/authored/escort-entry-facts.js';
import { nativeOrdinaryRosterCapacity } from '../gameplay/escort-entry-owner.js';
import { prepareNativeEscortEntry } from '../gameplay/native-escort-entry.js';
import { escortHistoryProblem } from './escort-history-proof.js';
import { escortPickupProblem } from './escort-pickup-proof.js';
import { escortObjectiveProblem } from './escort-objective-proof.js';
import { escortGuestProblem } from './escort-guest-proof.js';
import { escortShapeProblem } from './escort-shape-proof.js';
import { escortGuestEntryProblem } from './escort-guest-entry-proof.js';
import { fingerprint } from './relations.js';
import { escortRuntimeProblem, escortGeneralStateProblem } from './escort-runtime-proof.js';
/** Raw current entry/source receipt proof, independent of v23 roster-only EXP
 * assumptions. Later activation composes geometry/AI/lifecycle/learning owners;
 * this module alone never admits a factory or constructs a predecessor view.
 * @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').SessionActor} Actor
 * @typedef {import('../gameplay/support.js').Catalogs} Catalogs */

/** @param {State} state @param {Catalogs} catalogs @param {number} [revision] @returns {string|null} */
export function escortEntryProblem(state,catalogs,revision = state.revision) {
  const shapeProblem = escortShapeProblem(state); if (shapeProblem) return shapeProblem;
  const runtimeProblem = escortRuntimeProblem(state,revision); if (runtimeProblem) return runtimeProblem;
  const session = state.session,conversion = session?.entry.nativeEscort,guest = session?.escortGuest;
  const guests = Object.values(session?.actors ?? {}).filter(actor => actor.binding.kind === 'escort-guest');
  if (!conversion) return guest || guests.length ? 'A temporary escort requires its real new entry conversion owner.' : null;
  const runtime = state.escortRuntime;
  if (!session || !runtime || session.status !== 'active' || session.entry.entryRevision < runtime.adoptedRevision || session.entry.selectedPartyIds.length > nativeOrdinaryRosterCapacity(catalogs,session.dungeonId)) return 'Native conversion receipt requires its actual prospective entry/adoption epoch.';
  const members = session.entry.selectedPartyIds.map(pokemonId => {
    const entrant = session.entry.entrants[pokemonId]?.pokemon;
    return entrant ? { pokemonId,bodySize: catalogs.species.getProfile(entrant.identity.speciesId,entrant.identity.formId).bodySize } : null;
  });
  if (!members.length || members.some(member => member === null)) return 'Native conversions require every genuine selected entry roster owner.';
  const takenEscorts = state.progress.acceptedJobIds.flatMap(id => {
    const job = state.progress.jobs[id];
    const taken = job?.phase.kind === 'accepted' || (job?.phase.kind === 'active' || job?.phase.kind === 'objective-complete') && job.phase.sessionId === session.sessionId;
    return taken && job?.goal.kind === 'escort' ? [{ jobId: job.jobId,dungeonId: job.goal.destination.dungeonId,client: { ...job.goal.client.identity },recipient: { ...job.goal.recipient.identity } }] : [];
  });
  const input = { dungeonId: session.dungeonId,teamSlots: [...members,...Array(4-members.length).fill(null)],takenEscorts,generalRandom: conversion.input.generalRandom };
  const beforeProblem = escortGeneralStateProblem(input.generalRandom); if (beforeProblem) return beforeProblem;
  if (session.entry.entryRevision === runtime.adoptedRevision && input.generalRandom.transitions !== 0) return 'First prospective adoption cannot fabricate earlier native general draws.';
  if (fingerprint(conversion.input) !== fingerprint(input)) return 'Source conversion input must match actual selected roster/native slot order and taken request/client/recipient.';
  let prepared; try { prepared = prepareNativeEscortEntry(input); } catch { return 'Invalid source-ordered native entry conversion receipt.'; }
  if (fingerprint(prepared) !== fingerprint(conversion.result) || prepared.generalRandom.transitions > runtime.generalRandom.transitions) return 'Actual native conversion witnesses must retain every roster-before-guest conditional draw.';
  if (prepared.kind !== 'guest-prepared') return conversion.guest !== null || conversion.construction !== null || conversion.objective !== null || guest || guests.length ? 'Rejected/no escort preparation cannot manufacture a guest actor or slot.' : escortPickupProblem(state,catalogs,revision);
  if (!conversion.guest || !conversion.construction || !guest || guests.length !== 1 || fingerprint(conversion.guest) !== fingerprint(guest.entry)) return 'One actual admitted temporary guest owns its genuine separate baseline.';
  const record = conversion.construction;
  const constructionProblem = escortGuestEntryProblem(record.actor,record.entry,record.container,record.sessionId,catalogs,record.witness,record.allocationMark);
  if (constructionProblem || record.sessionId !== session.sessionId || record.allocationMark > state.idSequence.next || fingerprint(record.entry) !== fingerprint(conversion.guest) || fingerprint(record.witness.prepared) !== fingerprint(/** @type {{guest:import('../../contracts/escort-work.js').PreparedGuest}} */ (/** @type {unknown} */ (conversion.result)).guest)) return constructionProblem ?? 'The real source preparation must own the actual archived guest allocation and entry resources.';
  const actor = guests[0],entry = guest.entry,job = state.progress.jobs[entry.jobId];
  const supplied = /** @type {{guest:import('../../contracts/escort-work.js').PreparedGuest}} */ (/** @type {unknown} */ (conversion.result)).guest;
  if (!actor || actor.actorId !== entry.actorId || actor.binding.kind !== 'escort-guest' || actor.binding.jobId !== entry.jobId || actor.affiliation !== 'team' || session.leaderActorId === actor.actorId || !job || job.goal.kind !== 'escort' || !supplied || entry.jobId !== supplied.jobId || entry.slot !== supplied.slot || fingerprint(entry.client) !== fingerprint(supplied.client) || fingerprint(entry.recipient) !== fingerprint(supplied.recipient) || fingerprint(actor.identity) !== fingerprint(entry.client) || fingerprint(entry.hiddenPower) !== fingerprint(supplied.hiddenPower) || entry.nativeRecruitedId !== FACTS.temporaryRecruitedId || entry.joinLocation !== FACTS.joinLocation || entry.joinFloor !== FACTS.joinFloor || actor.heldContainerId !== entry.heldContainerId) return 'Guest must retain its actual source client, independent recipient, allocation identity/native entry data and XP-locked team binding.';
  // Shared resource/condition owners compose after this exact new lifecycle.
  return escortHistoryProblem(state,revision) ?? escortGuestProblem(state,revision) ?? escortObjectiveProblem(state,catalogs,revision) ?? escortPickupProblem(state,catalogs,revision);
}

/** Exact retained source generation at a current team slot or an independently
 * recorded same-floor irreversible client faint. Used by new learning PCs only.
 * @param {State} state @param {import('../../contracts/campaign.js').ActorSlotRef} ref
 * @param {boolean} [removed] @param {number} [revision] */
export function ownsEscortSourceRef(state,ref,removed = false,revision = state.revision) {
  const session = state.session,guest = session?.escortGuest,actor = session?.actors[ref.actorId];
  if (!session || !guest || !actor || actor.binding.kind !== 'escort-guest' || ref.side !== 'team' || ref.slot !== guest.entry.slot || ref.actorId !== guest.entry.actorId || actor.binding.jobId !== guest.entry.jobId || actor.affiliation !== 'team') return false;
  if (guest.lifecycle.kind === 'live') return session.scheduler.teamSlots[ref.slot] === ref.actorId && session.teamOrder.includes(ref.actorId) && guest.joinLocation === FACTS.joinLocation && actor.placement.kind === 'map' && actor.placement.mapId === session.floor.mapId;
  return removed && guest.lifecycle.reason === 'fainted' && fingerprint(guest.lifecycle.source) === fingerprint(ref) && guest.lifecycle.removedRevision > session.entry.entryRevision && guest.lifecycle.removedRevision <= revision && guest.lifecycle.mapId === session.floor.mapId && session.scheduler.teamSlots[ref.slot] === null && !session.teamOrder.includes(ref.actorId) && guest.joinLocation === FACTS.joinLocation && actor.resources.hp === 0 && actor.placement.kind === 'off-map' && actor.placement.reason === 'fainted';
}
