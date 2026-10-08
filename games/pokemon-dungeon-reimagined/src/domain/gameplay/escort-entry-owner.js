import { ESCORT_SPATIAL_FACTS as FACTS } from '../../../content/authored/escort-spatial-facts.js';
import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { createProspectiveNativeGeneralRandom, prepareNativeEscortEntry } from './native-escort-entry.js';
import { clone, blocked } from './support.js';
/** Prospective browser stream mapping consumes actual new entry conversions and thrown Pickup quantities; it
 * retains its exact word on browser save/load. It does not claim native saved
 * SetRNGSeed, reconstructed original draws, or the complete native call schedule.
 * @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/escort-work.js').EscortRuntime} Runtime
 * @typedef {import('./support.js').Catalogs} Catalogs */
export const ESCORT_GENERAL_POLICY = 'native-general-prospective-conversions-and-pickup-v1';

/** Real roster gate precedes conversion/guest join. Four technical slots do not
 * permit four selected roster members on ordinary no-HM routes.
 * @param {Catalogs} catalogs @param {string} dungeonId */
export function nativeOrdinaryRosterCapacity(catalogs,dungeonId) {
  catalogs.dungeons.getDungeon(dungeonId);
  const floor = catalogs.dungeons.getFloorById(`${dungeonId}-floor-01`),rules = catalogs.dungeons.getRestrictions(floor.restrictionId).fields;
  if (!Number.isInteger(rules.maxPartyMembers) || rules.maxPartyMembers < 1 || rules.maxPartyMembers > 4 || rules.HMMask !== 0) return blocked('escort-ordinary-entry-restrictions');
  return Math.min(FACTS.ordinaryNoHmRosterMaximum,rules.maxPartyMembers);
}

/** Stage one genuine entry from canonical selected roster and accepted requests.
 * No mutation/allocation/events happen here. The new caller must commit adoption,
 * conversion receipt, placement, actor/move/held/slot ownership in one transaction.
 * A legacy conversion has escortRuntime:null and invents no prior seed or guest.
 * @param {State} state @param {Catalogs} catalogs @param {string} dungeonId */
export function stageCanonicalEscortEntry(state,catalogs,dungeonId) {
  if (state.contentRevision !== ESCORT_WORK_REVISION || state.escortRuntime === undefined || state.session || !state.selectedPartyIds.length || state.selectedPartyIds.length > nativeOrdinaryRosterCapacity(catalogs,dungeonId)) return blocked('escort-canonical-entry-owner');
  catalogs.dungeons.getDungeon(dungeonId);
  /** @type {Runtime} */
  const runtime = state.escortRuntime ?? { policyId: ESCORT_GENERAL_POLICY,adoptedRevision: state.revision+1,generalRandom: createProspectiveNativeGeneralRandom() };
  const members = state.selectedPartyIds.map(pokemonId => {
    const pokemon = state.roster[pokemonId]; if (!pokemon) return blocked('escort-selected-entry-member');
    return { pokemonId,bodySize: catalogs.species.getProfile(pokemon.identity.speciesId,pokemon.identity.formId).bodySize };
  });
  const takenEscorts = state.progress.acceptedJobIds.flatMap(id => {
    const job = state.progress.jobs[id];
    return job?.goal.kind === 'escort' && job.phase.kind === 'accepted' ? [{ jobId: job.jobId,dungeonId: job.goal.destination.dungeonId,client: { ...job.goal.client.identity },recipient: { ...job.goal.recipient.identity } }] : [];
  });
  const input = { dungeonId,teamSlots: [...members,...Array(4-members.length).fill(null)],takenEscorts,generalRandom: clone(runtime.generalRandom) };
  const result = prepareNativeEscortEntry(input);
  return { runtime: { ...clone(runtime),generalRandom: clone(result.generalRandom) },input,result };
}
