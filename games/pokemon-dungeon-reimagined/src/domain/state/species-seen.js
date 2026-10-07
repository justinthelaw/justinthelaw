/** Exact root-shape selection. Older content never admits the new field.
 * @param {string} revision */
export const recordsSpeciesSeen = revision => revision.startsWith('blue-campaign-state-v7-seen-opening:browser-opening-v7-seen:');

/** Source pokemon.c sets seen flags on roster creation/recruit placement.
 * Migrating saves cannot recover discarded wild defeats or their attacker.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {boolean} incomplete */
export function initializeSpeciesSeen(state, incomplete) {
  state.speciesSeen = { history: incomplete ? 'legacy-incomplete' : 'from-creation', startedRevision: state.revision, identities: [] };
  for (const identity of state.progress.recruitedHistory) recordSpeciesSeen(state, identity);
}

/** Called only for a source seen-flag trigger, never spawn or visibility.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {import('../../contracts/campaign.js').SpeciesForm} identity */
export function recordSpeciesSeen(state, identity) {
  const history = state.speciesSeen;
  if (!history || history.identities.some(row => row.speciesId === identity.speciesId && row.formId === identity.formId)) return;
  history.identities.push({ ...identity });
}
