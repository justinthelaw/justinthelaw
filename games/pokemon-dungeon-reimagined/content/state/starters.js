/** @typedef {import('../onboarding.js').OnboardingCatalog} OnboardingCatalog */
/** @typedef {import('../species.js').SpeciesCatalog} SpeciesCatalog */
/** @typedef {Awaited<ReturnType<typeof import('../effects.js').loadEffectCatalog>>} EffectCatalog */
/** @typedef {Readonly<{onboarding:OnboardingCatalog,species:SpeciesCatalog,effects:EffectCatalog}>} StarterCatalogs */

/** A source mismatch blocks construction; no fallback species or move is used.
 * @param {unknown} condition @param {string} field @returns {asserts condition}
 */
function requireJoin(condition, field) {
  if (!condition) throw new Error(`Starting profile catalog mismatch: ${field}`);
}

/** Keep native level-one roster facts distinct from the entry-boosted actor.
 * No IQ/tactic/scene identity, outcome encoding or boost guard is invented here.
 * @param {StarterCatalogs} catalogs @param {string} speciesId
 */
function joinProfile({ onboarding, species, effects }, speciesId) {
  const starting = onboarding.getStartingProfile(speciesId);
  const profile = species.getProfile(speciesId, starting.formId);
  requireJoin(profile.persistence === 'persistent' && profile.id === starting.profileId && profile.formId === starting.formId, 'species/form');
  requireJoin(profile.friendAreaId === starting.friendAreaId, 'friend-area');
  requireJoin(profile.levelResourceId === starting.catalogResources.levelResourceId && profile.learnsetResourceId === starting.catalogResources.learnsetResourceId, 'growth/learning resource');
  for (const stage of [starting.rosterCreation, starting.firstPlayable]) {
    const growth = species.getGrowthAtLevel(profile.id, stage.level);
    requireJoin(growth.cumulativeExperience === stage.cumulativeExp, 'experience');
    for (const key of /** @type {const} */ (['hp', 'attack', 'defense', 'specialAttack', 'specialDefense'])) requireJoin(growth.stats[key] === stage.stats[key], `stats/${key}`);
    for (const move of stage.moves) {
      const effect = effects.getMove(move.moveId);
      requireJoin(effect.id === move.moveId && effect.internalId === move.originalMoveId, 'move crosswalk');
      requireJoin(species.getLearnset(profile.id).levelUp.some(([level, id]) => level === move.learnedAtLevel && id === move.originalMoveId), 'learned move');
      if ('maximumPP' in move) requireJoin(effect.numeric.pp === move.maximumPP && move.currentPP === move.maximumPP, 'initial full PP');
    }
  }
  return Object.freeze({
    identity: Object.freeze({ speciesId: starting.speciesId, formId: starting.formId }),
    rosterCreation: starting.rosterCreation,
    firstPlayable: starting.firstPlayable,
    friendAreaId: starting.friendAreaId,
    profile,
    evidence: starting.evidence,
  });
}

/** Exact sourced selection lookup; callers must separately bind a confirmed
 * quiz revision/outcome ID and canonical naming/scene rules before saving.
 * @param {StarterCatalogs} catalogs @param {string} natureId
 * @param {'male'|'female'} column @param {string} partnerSpeciesId
 */
export function joinStartingPair(catalogs, natureId, column, partnerSpeciesId) {
  const outcome = catalogs.onboarding.getGenderOutcome(natureId, column);
  const pair = catalogs.onboarding.getPair(outcome.speciesId, partnerSpeciesId);
  const hero = joinProfile(catalogs, pair.heroSpeciesId);
  const partner = joinProfile(catalogs, pair.partnerSpeciesId);
  const areas = [...new Set([hero.friendAreaId, partner.friendAreaId])];
  requireJoin(pair.heroFormId === hero.identity.formId && pair.partnerFormId === partner.identity.formId, 'pair forms');
  requireJoin(areas.length === pair.ownedFriendAreaIds.length && areas.every((id, index) => id === pair.ownedFriendAreaIds[index]), 'ordered starter-area union');
  return Object.freeze({ outcome, pair, hero, partner, initialization: catalogs.onboarding.getInitialization() });
}
