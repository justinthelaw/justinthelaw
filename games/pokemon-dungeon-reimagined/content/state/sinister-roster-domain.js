import { FRIENDS } from '../authored/friends.js';
import { diagnostics, sameForm } from './pokemon-rules.js';
import { steelSame as same } from './steel-progress.js';
/** A finite source domain, complementary to complete resource and history
 * admission. Every future raw callback must separately authenticate all source
 * receipts and actual actor construction; this does not do so by membership.
 * @typedef {import('../../src/contracts/campaign.js').CampaignSnapshot} Snapshot
 * @typedef {import('./campaign.js').CampaignCatalogs} Catalogs */
/** Original acquisitions exhaust this scoped domain. It never trims a genuine
 * larger roster, changes selection, or relabels a later acquisition as a starter.
 * @param {Snapshot} state @param {Catalogs} catalogs */
export function checkSinisterRosterDomain(state,catalogs) {
  const r = diagnostics(),f = state.friends,hero = state.roster[state.profile.heroId],partner = state.roster[state.profile.partnerId];
  const originals = [state.profile.originalHeroIdentity,state.profile.originalPartnerIdentity];
  r.check(originals.every(row => row.formId === null) && state.profile.heroId !== state.profile.partnerId,'/profile','The scoped source domain retains two distinct original null-form individuals.');
  try { catalogs.onboarding.getPair(originals[0]?.speciesId ?? '',originals[1]?.speciesId ?? ''); }
  catch { r.check(false,'/profile','The original pair must join one of the complete sourced129 permitted pairs.'); }
  for (const [record,identity,role] of /** @type {const} */ ([[hero,state.profile.originalHeroIdentity,'hero'],[partner,state.profile.originalPartnerIdentity,'partner']])) {
    r.check(record && sameForm(record.identity,identity) && record.evolutionHistory.length === 0 && record.origin.kind === 'starter' && record.origin.role === role && record.origin.selectionOutcomeId === state.profile.selection.outcomeId,'/roster','Each original identity retains its actual starter role and confirmed selection origin.');
  }
  r.check(f?.magnemiteId !== null && f?.magnemiteId !== undefined && f.magnemiteId !== state.profile.heroId && f.magnemiteId !== state.profile.partnerId,'/friends','The original one-time story gift retains its distinct individual identity after any real farewell.');
  const gift = f?.magnemiteId ? state.roster[f.magnemiteId] : undefined;
  r.check(!gift || gift.identity.speciesId === 'pokemon-081' && gift.identity.formId === null && gift.evolutionHistory.length === 0 && gift.origin.kind === 'scripted' && gift.origin.grantId === FRIENDS.grant && gift.origin.metLevel === 6,'/roster','A surviving extra individual must be the genuine unevolved level6 story Magnemite acquisition.');
  const grants = state.progress.appliedGrants.filter(row => row.grantId === FRIENDS.grant);
  r.check(grants.length === 1 && grants[0]?.day === f?.startedDay && grants[0]?.revision !== undefined && grants[0].revision <= state.revision,'/appliedGrants','The original story gift has its retained unique source grant; current visibility cannot create an acquisition.');
  const members = [state.profile.heroId,state.profile.partnerId,...(gift ? [gift.pokemonId] : [])];
  r.check(same(Object.keys(state.roster).sort(),[...members].sort()),'/roster','Only the genuine original pair and surviving story gift inhabit this source domain.');
  r.check(same(state.progress.recruitedHistory,[...originals,{ speciesId: 'pokemon-081',formId: null }]),'/recruitedHistory','The actual source acquisition sequence is exhausted; a later or discarded unknown recruit cannot receive a guessed native address.');
  r.check(state.selectedPartyIds.length >= 2 && state.selectedPartyIds.length <= 3 && new Set(state.selectedPartyIds).size === state.selectedPartyIds.length && state.selectedPartyIds[0] === state.profile.heroId && state.selectedPartyIds.includes(state.profile.partnerId) && state.selectedPartyIds.every(id => members.includes(id)),'/selectedPartyIds','Story entry preserves the actual original hero and partner plus any selected surviving gift.');
  return r.result();
}
