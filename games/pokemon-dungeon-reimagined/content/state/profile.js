import { compareNativeScenario } from '../../src/domain/progression/evaluate.js';
import { diagnostics, sameForm, checkName } from './pokemon-rules.js';

// Authored encoding tied to the accepted onboarding result table, not current species.
export const QUIZ_REVISION = 'original-blue-onboarding-results-4643ebc8a10ecdbb-v1';
/** @param {import('../onboarding.js').OnboardingCatalog} onboarding */
export function createQuizSelectionLookup(onboarding) {
  const rows = new Map(onboarding.natureIds.flatMap(natureId => /** @type {const} */ (['male', 'female']).map(column => {
    const outcome = onboarding.getGenderOutcome(natureId, column);
    return [`quiz-${natureId}-${column}`, Object.freeze({ ...outcome, outcomeId: `quiz-${natureId}-${column}`, quizRevision: QUIZ_REVISION })];
  })));
  return Object.freeze({
    /** @param {string} revision @param {string} outcomeId */
    get(revision, outcomeId) {
      onboarding.getAlgorithm();
      if (revision !== QUIZ_REVISION) throw new RangeError('Unknown authored quiz revision.');
      const row = rows.get(outcomeId);
      if (!row) throw new RangeError('Unknown authored quiz outcome.');
      return row;
    },
  });
}

/** Supported original-selection and name admission. Unsupported glyphs remain
 * precise requirements; this does not score a quiz or create an opening scene.
 * @param {{onboarding:import('../onboarding.js').OnboardingCatalog,species:import('../species.js').SpeciesCatalog}} catalogs
 * @returns {import('../../src/contracts/campaign.js').CampaignStatePolicies['profile']}
 */
export function createProfilePolicy({ onboarding, species }) {
  const selection = createQuizSelectionLookup(onboarding);
  return state => {
    const report = diagnostics();
    const profile = state.profile;
    report.check(profile.referenceEdition === 'blue-rescue-team', '', 'Profile must retain the Blue reference edition.');
    try {
      const row = selection.get(profile.selection.quizRevision, profile.selection.outcomeId);
      report.check(row.speciesId === profile.originalHeroIdentity.speciesId && row.formId === profile.originalHeroIdentity.formId, '/selection', 'Quiz outcome must match the immutable original hero identity.');
      const pair = onboarding.getPair(profile.originalHeroIdentity.speciesId, profile.originalPartnerIdentity.speciesId);
      report.check(pair.heroFormId === profile.originalHeroIdentity.formId && pair.partnerFormId === profile.originalPartnerIdentity.formId, '', 'Original starter pair forms must match onboarding.');
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      report.check(false, '/selection', 'Unknown revision, outcome or original starter pair.');
    }
    report.check(profile.heroId !== profile.partnerId, '', 'Hero and partner must be distinct.');
    for (const role of /** @type {const} */ (['hero', 'partner'])) {
      const id = role === 'hero' ? profile.heroId : profile.partnerId;
      const original = role === 'hero' ? profile.originalHeroIdentity : profile.originalPartnerIdentity;
      const record = state.roster[id];
      report.check(record && record.origin.kind === 'starter' && record.origin.role === role && record.origin.selectionOutcomeId === profile.selection.outcomeId, '', 'Starter identity and origin must retain the confirmed selection.');
      if (record) {
        report.check(sameForm(record.evolutionHistory[0]?.from ?? record.identity, original), '', 'Evolution must begin at the saved original starter identity.');
        checkName(record.nickname, species.getSpecies(record.identity.speciesId).name, report, `/roster/${id}/nickname`);
      }
    }
    // Native CheckQuest(QUEST_SET_TEAM_NAME), not a guessed scene-ID mapping.
    const main = state.progress.native.scenarios.MAIN;
    const named = compareNativeScenario(main, 'gt', 2, -1);
    if (main.chapter === 58) {
      checkName(profile.teamName, 'Pokémon', report, '/teamName');
    } else if (!named) report.check(profile.teamName === 'Pokémon', '/teamName', 'Before team naming the native initialized team name is Pokémon.');
    else checkName(profile.teamName, 'Pokémon', report, '/teamName');
    return report.result();
  };
}
