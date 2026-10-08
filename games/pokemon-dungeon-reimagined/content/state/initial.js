import { joinStartingPair } from './starters.js';
import { createQuizSelectionLookup, QUIZ_REVISION } from './profile.js';
import { IQ_SKILLS, TACTICS, sameForm } from './pokemon-rules.js';
import { createInitialNativeProgress } from '../authored/opening.js';

/** Select a supported quiz result and ordered partner, retaining source joins.
 * @param {import('./starters.js').StarterCatalogs} catalogs @param {string} natureId
 * @param {'male'|'female'} column @param {string} partnerSpeciesId
 * @returns {import('../../src/contracts/campaign.js').ConfirmedBlueSelection} */
export function createInitialSelection(catalogs, natureId, column, partnerSpeciesId) {
  const pair = joinStartingPair(catalogs, natureId, column, partnerSpeciesId);
  return { quizRevision: QUIZ_REVISION, outcomeId: `quiz-${natureId}-${column}`, hero: { ...pair.hero.identity }, partner: { ...pair.partner.identity } };
}

/** @param {import('./starters.js').StarterCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} authored
 * @returns {import('../../src/contracts/campaign.js').CampaignContent['initialCampaign']} */
export function createInitialCampaignLookup(catalogs, authored) {
  const selections = createQuizSelectionLookup(catalogs.onboarding);
  return (profileId, selection) => {
    if (profileId !== authored.profileId) return { status: 'blocked', requirementIds: [`P19:initial-profile:${profileId}`] };
    try {
      const outcome = selections.get(selection.quizRevision, selection.outcomeId);
      // Outcome IDs are a closed crosswalk, never arbitrary string parsing.
      const natureId = catalogs.onboarding.natureIds.find(nature => ['male', 'female'].some(column => `quiz-${nature}-${column}` === outcome.outcomeId));
      if (!natureId) throw new RangeError('Missing nature crosswalk.');
      const column = outcome.outcomeId === `quiz-${natureId}-male` ? 'male' : 'female';
      const pair = joinStartingPair(catalogs, natureId, column, selection.partner.speciesId);
      if (!sameForm(pair.hero.identity, selection.hero) || !sameForm(pair.partner.identity, selection.partner)) throw new RangeError('Selection mismatch.');
      const init = pair.initialization;
      const tactic = TACTICS.find(row => row.sourceSymbol === init.members.tacticSourceSymbol);
      const skills = init.members.enabledIqSourceSymbols.map(symbol => IQ_SKILLS.find(row => row.sourceSymbol === symbol));
      if (!tactic || skills.some(row => !row)) return { status: 'blocked', requirementIds: ['P17:starter-iq-tactic-crosswalk'] };
      /** @param {typeof pair.hero} member @returns {import('../../src/contracts/campaign.js').InitialPokemonDefinition} */
      const member = member => ({ identity: { ...member.identity }, growth: {
        level: member.rosterCreation.level, totalExperience: { numerator: member.rosterCreation.cumulativeExp, denominator: 1 },
        naturalStats: { ...member.rosterCreation.stats }, permanentStatBonuses: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0 }, iqPoints: init.members.iq,
      }, moves: member.rosterCreation.moves.map(move => ({ moveId: /** @type {import('../../src/contracts.js').MoveId} */ (move.moveId), enabled: init.moves.enabledForAI, powerBoost: init.moves.ginsengBoost, ppCapacityBonus: 0 })),
      linkedPositionGroups: [], setMovePosition: null, enabledIqSkillIds: skills.flatMap(row => row ? [row.id] : []), tacticId: tactic.id,
      friendAreaId: member.friendAreaId, heldItems: [] });
      const scene = authored.scenes[0];
      if (!scene) return { status: 'blocked', requirementIds: ['P19:opening-scene'] };
      return { status: 'ready', value: { profileId, nativeProgress: createInitialNativeProgress(), hero: member(pair.hero), partner: member(pair.partner),
        selectedRoles: ['hero', 'partner'], carriedMoney: init.economy.carriedMoney, bankedMoney: init.economy.bankSavings,
        toolboxItems: [], storedItems: [], friendAreaIds: [...new Set([pair.hero.friendAreaId, pair.partner.friendAreaId])], storyNodeId: authored.storyNodeId,
        milestones: [], initialBranches: [], rankPoints: 0,
        // Canonical acquisition history includes starters; native speciesSeen is true.
        recruitedHistory: [{ ...pair.hero.identity }, { ...pair.partner.identity }], town: authored.town,
        initialScene: { sceneId: scene.id, cursor: 0, awaiting: { kind: 'advance' }, bindings: [
          { roleId: authored.heroRoleId, reference: { kind: 'starter', role: 'hero' } },
          { roleId: authored.partnerRoleId, reference: { kind: 'starter', role: 'partner' } },
        ], continuation: scene.continuation } } };
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      return { status: 'blocked', requirementIds: ['P19:confirmed-original-blue-selection'] };
    }
  };
}
