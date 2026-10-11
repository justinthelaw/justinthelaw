import { createCampaignContent as createEscortContent } from '../../../content/state/escort-campaign.js';
import { checkSinisterRosterDomain } from '../../../content/state/sinister-roster-domain.js';
import { FRIEND_AREA_FACTS } from '../../../content/authored/friend-area-facts.js';
import { SINISTER_ROSTER_MAPPING_FACTS as FACTS } from '../../../content/authored/sinister-roster-facts.js';
import { SINISTER_UNLOCK } from '../../../content/authored/escort-work.js';
import { TEAM } from '../../../content/authored/team-formation.js';
import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { validateCampaign, freezeData } from '../state/validate.js';
import { nativeOrdinaryRosterCapacity } from './escort-entry-owner.js';
/** @typedef {import('../../contracts/campaign.js').PokemonId} PokemonId
 * @typedef {import('./support.js').Catalogs} Catalogs
 * @typedef {{pokemonId:PokemonId,nativeRecruitedId:number,bodySize:number}} NativeMember */

/** Prepare a new source mapping only from an independently admitted complete
 * predecessor at the real settled departure. The source-address inference is
 * justified by the exhausted genuine acquisition domain, never native-address
 * history inferred from final UI order. No existing snapshot, roster, selected
 * order, seed or old session is modified. Actual entry must retain this entire
 * preparation beside its genuine run/construction receipt when it commits.
 * @param {unknown} input @param {Catalogs} catalogs */
export function prepareSinisterRosterMapping(input,catalogs) {
  const admitted = validateCampaign(input,createEscortContent(catalogs));
  if (!admitted.ok) throw new TypeError('A genuine complete original escort campaign must precede Sinister entry.');
  const state = admitted.snapshot,main = state.progress.native.scenarios.MAIN,work = state.earlyWork;
  if (state.contentRevision !== ESCORT_WORK_REVISION || state.session || state.mode !== 'town' || state.pendingScene || state.pendingResult || state.town.mapDefinitionId !== TEAM.map || main.chapter !== 5 || main.step !== 9 || state.friends?.phase !== 'sinister-ready' || !state.progress.milestones[SINISTER_UNLOCK] || !work || work.returned || work.reward || work.clientPrompt) throw new TypeError('Only the actual settled MAIN5,9 source departure may prepare this mapping.');
  if (!Number.isSafeInteger(state.revision) || state.revision >= Number.MAX_SAFE_INTEGER) throw new TypeError('Sinister entry requires a genuine available successor revision.');
  if (!checkSinisterRosterDomain(state,catalogs).ok || state.selectedPartyIds.length > nativeOrdinaryRosterCapacity(catalogs,'sinister-woods')) throw new TypeError('The exact source original acquisition and route party domain must be independently proved.');
  /** Ordered cumulative native capacities, including the zero-size NONE row. */
  let start = 0;
  const partitions = FRIEND_AREA_FACTS.map(area => { const row = { ...area,start,end: start+area.capacity }; start = row.end; return row; });
  if (start !== FACTS.capacity || partitions.some((row,index) => row.nativeId !== index || !Number.isSafeInteger(row.capacity) || row.capacity < 0)) throw new TypeError('The complete native Friend Area address partitions are required.');
  const giftId = state.friends.magnemiteId;
  if (!giftId) throw new TypeError('The authenticated original story gift identity is required.');
  /** Source creation order is hero then partner, followed by the later genuine
   * Magnemite grant. Retain a released gift as an acquisition witness only. */
  const originals = [
    { pokemonId: state.profile.heroId,identity: state.profile.originalHeroIdentity,role: 'hero' },
    { pokemonId: state.profile.partnerId,identity: state.profile.originalPartnerIdentity,role: 'partner' },
    { pokemonId: giftId,identity: { speciesId: 'pokemon-081',formId: null },role: 'story-gift' },
  ];
  const occupied = new Set();
  const acquisitions = originals.map(row => {
    const profile = catalogs.species.getProfile(row.identity.speciesId,row.identity.formId);
    const area = partitions.find(partition => partition.id === profile.friendAreaId);
    if (!area || !state.economy.ownedFriendAreaIds.some(id => id === profile.friendAreaId)) throw new TypeError('Every actual original acquisition must join its owned native Friend Area.');
    let nativeRecruitedId = area.start;
    while (nativeRecruitedId < area.end && occupied.has(nativeRecruitedId)) nativeRecruitedId++;
    if (nativeRecruitedId >= area.end) throw new TypeError('The genuine source Friend Area has no allocation capacity.');
    occupied.add(nativeRecruitedId);
    return { pokemonId: row.pokemonId,nativeRecruitedId,friendAreaId: profile.friendAreaId,role: row.role,survives: !!state.roster[row.pokemonId] };
  });
  const members = state.selectedPartyIds.map(pokemonId => {
    const pokemon = state.roster[pokemonId],address = acquisitions.find(row => row.pokemonId === pokemonId);
    if (!pokemon || !address?.survives) throw new TypeError('Every selected individual must retain its actual source allocation.');
    return { pokemonId,nativeRecruitedId: address.nativeRecruitedId,bodySize: catalogs.species.getProfile(pokemon.identity.speciesId,pokemon.identity.formId).bodySize };
  }).sort((a,b) => a.nativeRecruitedId-b.nativeRecruitedId);
  if (members.reduce((sum,row) => sum+row.bodySize,0) > 6) throw new TypeError('The genuine selected party exceeds native body capacity.');
  /** @type {(NativeMember|null)[]} */ const teamSlots = [...members];
  while (teamSlots.length < 4) teamSlots.push(null);
  return freezeData({ kind: 'sinister-original-roster-mapping-prepared',factsId: FACTS.id,source: FACTS,
    predecessorRevision: state.revision,mappingRevision: state.revision+1,acquisitions,selectedPartyIds: [...state.selectedPartyIds],teamSlots,
    leaderSlot: members.findIndex(row => row.pokemonId === state.profile.heroId),
  });
}
