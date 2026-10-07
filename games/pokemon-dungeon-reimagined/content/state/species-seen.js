import { eligibleEncounter } from './expedition-facts.js';
import { diagnostics, sameForm } from './pokemon-rules.js';
import { THUNDERWAVE as T } from '../authored/thunderwave.js';
import { MORNING } from '../authored/first-morning.js';
/** Seen bits are historical facts, not a reconstruction from current actors.
 * This finite admission restricts them to roster creation and reachable early
 * encounter identities; ordinary job eligibility applies its own native bans.
 * @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @param {import('../../src/contracts/campaign.js').CampaignStatePolicies['progress']} prior
 * @returns {import('../../src/contracts/campaign.js').CampaignStatePolicies['progress']} */
export function createSeenPolicy(catalogs, prior) {
  /** @param {string} id */
  const candidates = id => catalogs.dungeons.getDungeon(id).sectionIds.flatMap(section => catalogs.dungeons.getSection(section).variants.flatMap(variant => variant.floorIds.flatMap(floor => {
    const row = catalogs.dungeons.getFloorById(floor);
    return catalogs.dungeons.getEncounterPool(row.encounterPoolId).rows.filter(eligibleEncounter);
  })));
  const woods = candidates('tiny-woods'), cave = candidates(T.dungeonId);
  return state => {
    const previous = prior(state); if (!previous.ok) return previous;
    const r = diagnostics(), seen = state.speciesSeen;
    if (!seen) { r.check(false, '/speciesSeen', 'Current content requires an explicit seen-history record.'); return r.result(); }
    r.check(seen.history === 'from-creation' ? seen.startedRevision === 0 : seen.startedRevision > 0 && seen.startedRevision <= state.revision, '/speciesSeen/startedRevision', 'Complete history begins at creation; migrated history begins at its conversion revision.');
    const keys = seen.identities.map(row => `${row.speciesId}:${row.formId}`);
    r.check(new Set(keys).size === keys.length, '/speciesSeen/identities', 'Seen identities are unique native form flags.');
    for (const identity of state.progress.recruitedHistory) r.check(seen.identities.some(row => sameForm(row, identity)), '/speciesSeen', 'Every recruited identity must have its native seen flag.');
    const allowed = [...woods, ...(state.progress.appliedGrants.some(row => row.grantId === MORNING.grants[6]) ? cave : [])];
    for (const identity of seen.identities) r.check(state.progress.recruitedHistory.some(row => sameForm(row, identity)) || state.progress.statistics.expeditions > 0 && allowed.some(row => row.speciesId === identity.speciesId && row.formId === identity.formId), '/speciesSeen/identities', 'Seen identity requires a supported historical roster or reachable encounter source.');
    return r.result();
  };
}
