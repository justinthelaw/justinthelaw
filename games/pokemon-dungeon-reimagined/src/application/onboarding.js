import { createQuiz, campaignSeed } from './quiz.js';
import { createInitialSelection } from '../../content/state/initial.js';
import { createCampaign } from '../domain/state.js';
import { node } from '../ui/view.js';

/** Quiz/result/partner/name screens remain uncommitted until canonical validation
 * and a concrete persistence preview. No alternate hero selector is exposed.
 * @param {{catalogs:import('../domain/gameplay/support.js').Catalogs,gameplay:ReturnType<typeof import('../domain/gameplay/index.js').createGameplay>,view:ReturnType<typeof import('../ui/view.js').createView>,commit:(snapshot:import('../contracts/campaign.js').CampaignSnapshot,mode:'durable'|'memory')=>void,back:()=>void,getOptions:()=>import('../contracts/campaign.js').CampaignOptions,isCurrent:()=>boolean}} options */
export function startOnboarding({ catalogs, gameplay, view, commit, back, getOptions, isCurrent }) {
  const quiz = createQuiz(catalogs.onboarding);
  /** @type {string|null} */ let nature = null;
  /** @param {()=>void} action */
  function safely(action) { if (!isCurrent()) return; try { action(); } catch (error) { view.notify(error instanceof Error ? error.message : 'Quiz could not continue. Start a new quiz.'); } }
  function questionScreen() {
    const question = quiz.current();
    if (!question) { nature = quiz.result(); genderScreen(); return; }
    const progress = quiz.progress();
    view.show(`Question ${progress.count} of ${progress.total}${progress.followUp ? ' · follow-up' : ''}`, question.prompt, [
      ...question.options.map(option => ({ label: option.text, run: () => safely(() => { quiz.answer(option.optionId); questionScreen(); }) })),
      { label: 'Cancel quiz', run: back },
    ]);
  }
  function genderScreen() {
    const gender = catalogs.onboarding.getGenderFacts();
    view.show('Your result column', gender.prompt, [
      { label: gender.labels.male, run: () => safely(() => partnerScreen('male')) },
      { label: gender.labels.female, run: () => safely(() => partnerScreen('female')) },
      { label: 'Cancel quiz', run: back },
    ]);
  }
  /** @param {'male'|'female'} column */
  function partnerScreen(column) {
    if (!nature) throw new Error('Missing quiz result.');
    const hero = catalogs.onboarding.getGenderOutcome(nature, column);
    const result = catalogs.onboarding.getNatureResult(nature);
    view.show(`You are ${catalogs.species.getSpecies(hero.speciesId).name}`, result.description, [
      ...catalogs.onboarding.getPartners(hero.speciesId).map(pair => ({ label: catalogs.species.getSpecies(pair.partnerSpeciesId).name, run: () => namesScreen(column, pair.partnerSpeciesId) })),
      { label: 'Back to column', run: genderScreen },
    ]);
  }
  /** @param {'male'|'female'} column @param {string} partner */
  function namesScreen(column, partner) {
    if (!nature) throw new Error('Missing quiz result.');
    const selection = createInitialSelection(catalogs, nature, column, partner);
    const heroInput = document.createElement('input'); heroInput.type = 'text'; heroInput.maxLength = 10; heroInput.value = catalogs.species.getSpecies(selection.hero.speciesId).name; heroInput.autocomplete = 'off'; heroInput.id = 'hero-name';
    const partnerInput = document.createElement('input'); partnerInput.type = 'text'; partnerInput.maxLength = 10; partnerInput.value = catalogs.species.getSpecies(partner).name; partnerInput.autocomplete = 'off'; partnerInput.id = 'partner-name';
    const heroLabel = node('label', 'Your name'); heroLabel.setAttribute('for', heroInput.id);
    const partnerLabel = node('label', 'Partner nickname'); partnerLabel.setAttribute('for', partnerInput.id);
    const names = node('div', '', 'name-fields'); names.append(heroLabel, heroInput, partnerLabel, partnerInput);
    /** @param {'durable'|'memory'} mode */
    function prepare(mode) { safely(() => {
      // Spaces are native name cells; canonical validation owns length/glyphs.
      const result = createCampaign({ selection, heroName: heroInput.value, partnerName: partnerInput.value, teamName: 'Pokémon',
        seed: campaignSeed(), createdAt: new Date().toISOString(), options: structuredClone(getOptions()), initialProfileId: gameplay.authored.profileId }, gameplay.content);
      if (!result.ok) { view.notify(result.kind === 'blocked' ? `New campaign needs: ${result.requirementIds.join(', ')}` : result.issues.map(issue => issue.message).join(' ')); return; }
      commit(result.snapshot, mode);
    }); }
    view.show('Names & new adventure', 'Names use one to ten supported character cells. Your rescue team is not named yet. Choose browser saving or memory-only play; both show a confirmation preview.', [
      { label: 'Preview browser game', run: () => prepare('durable') },
      { label: 'Preview memory game', run: () => prepare('memory') },
      { label: 'Back to partners', run: () => partnerScreen(column) },
    ], [names]);
  }
  questionScreen();
}
