import { IQ_SKILLS, TACTICS, diagnostics, bounded, sameForm, checkName } from './pokemon-rules.js';

/** @typedef {import('../../src/contracts/campaign.js').PokemonRecord} PokemonRecord */
/** @typedef {import('../../src/contracts/campaign.js').CampaignState} CampaignState */
/** @typedef {import('../../src/contracts/campaign.js').ValidationScope} ValidationScope */

/** Suspended rescues own actors/history, never a separate permanent roster.
 * @param {PokemonRecord} record @param {CampaignState} state @param {ValidationScope} scope */
function owns(record, state, scope) {
  if (scope.kind === 'live') return state.roster[record.pokemonId] === record;
  if (scope.kind === 'rescue-suspended') return false;
  const session = scope.owner === 'active-session' ? state.session : state.rescue.suspended?.session;
  return session?.sessionId === scope.sessionId && Object.values(session.entry.entrants).some(entrant => entrant.pokemon === record);
}

/** Permanent-roster admission, independent of actor resets. Missing historical
 * acquisition/evolution owners remain requirements, not permissive fallbacks.
 * @param {{species:import('../species.js').SpeciesCatalog,effects:Awaited<ReturnType<typeof import('../effects.js').loadEffectCatalog>>}} catalogs
 * @returns {import('../../src/contracts/campaign.js').CampaignStatePolicies['pokemon']} */
export function createPokemonPolicy({ species, effects }) {
  return (record, state, scope) => {
    const report = diagnostics();
    report.check(owns(record, state, scope), '', 'Record must belong to the exact live roster or selected entry history.');
    const profile = species.getProfile(record.identity.speciesId, record.identity.formId);
    report.check(profile.persistence === 'persistent' && profile.formId === record.identity.formId, '/identity', 'Permanent roster requires its explicit persistent species/form.');
    report.check(record.friendAreaId === profile.friendAreaId, '/friendAreaId', 'Residence must match current species, including after evolution re-add.');
    report.check(state.economy.ownedFriendAreaIds.includes(record.friendAreaId), '/friendAreaId', 'Resident Friend Area must be owned.');
    checkName(record.nickname, species.getSpecies(record.identity.speciesId).name, report, '/nickname');
    const growth = record.growth;
    const experience = growth.totalExperience.numerator;
    report.check(bounded(growth.level, 1, 100), '/growth/level', 'Permanent level must be 1–100.');
    report.check(growth.totalExperience.denominator === 1 && bounded(experience, 0, 9999999), '/growth/totalExperience', 'Permanent experience is an integer quantity within source bounds.');
    report.check(bounded(growth.iqPoints, 1, 999), '/growth/iqPoints', 'Permanent IQ must be 1–999.');
    if (bounded(growth.level, 1, 100)) {
      const current = species.getGrowthAtLevel(profile.id, growth.level);
      const next = growth.level < 100 ? species.getGrowthAtLevel(profile.id, growth.level + 1).cumulativeExperience : 10000000;
      report.check(experience >= current.cumulativeExperience && experience < next, '/growth/totalExperience', 'Experience must lie in the permanent level interval.');
      for (const stat of /** @type {const} */ (['hp', 'attack', 'defense', 'specialAttack', 'specialDefense'])) {
        const cap = stat === 'hp' ? 999 : 255;
        const natural = growth.naturalStats[stat];
        const bonus = growth.permanentStatBonuses[stat];
        report.check(bounded(natural, stat === 'hp' ? 1 : 0, cap) && bounded(bonus, 0, cap - (stat === 'hp' ? 1 : 0)), `/growth/${stat}`, 'Permanent stat components exceed source bounds.');
        // Components retain effective contributions after saturation/loss, not
        // unbounded lifetime gains. Their sum is the source's stored stat.
        report.check(natural + bonus <= cap, `/growth/${stat}`, 'Retained natural and bonus components must sum within the effective stat cap.');
      }
    }
    const groups = new Set();
    const iqIds = new Set();
    for (const id of record.enabledIqSkillIds) {
      const skill = IQ_SKILLS.find(row => row.id === id);
      report.check(skill && !iqIds.has(id), '/enabledIqSkillIds', 'IQ skill must be a unique supported identity.');
      iqIds.add(id);
      if (skill) {
        report.check(growth.iqPoints >= skill.minimumIq, '/enabledIqSkillIds', 'IQ skill exceeds its permanent threshold.');
        report.check(!groups.has(skill.group), '/enabledIqSkillIds', 'Mutually exclusive IQ skills cannot be enabled together.');
        groups.add(skill.group);
      }
    }
    const tactic = TACTICS.find(row => row.id === record.tacticId);
    report.check(tactic, '/tacticId', 'Unused/sentinel tactics cannot be permanent tactics.');
    // Selection checks the dungeon leader via validateTacticSelection. Retained
    // settings survive level loss/leader changes; admission must not invent a
    // historical unlock receipt or compare the receiving member's level.
    const stages = [];
    let previous = record.evolutionHistory[0]?.from ?? record.identity;
    for (const step of record.evolutionHistory) {
      report.check(sameForm(previous, step.from) && !sameForm(step.from, step.to), '/evolutionHistory', 'Evolution must form a connected sequence of changed identities.');
      report.check(bounded(step.level, 1, 100), '/evolutionHistory', 'Evolution level must be 1–100; later level loss remains possible.');
      for (const identity of [step.from, step.to]) {
        const form = species.getProfile(identity.speciesId, identity.formId);
        report.check(form.formId === identity.formId && form.persistence === 'persistent', '/evolutionHistory', 'Evolution endpoints must be explicit persistent forms.');
      }
      stages.push(step.from);
      previous = step.to;
      report.need(`P17:evolution-policy:${step.policyId}`);
    }
    report.check(sameForm(previous, record.identity), '/evolutionHistory', 'Evolution history must finish at current identity.');
    stages.push(record.identity);
    const learnsets = stages.map(identity => species.getLearnset(species.getProfile(identity.speciesId, identity.formId).id));
    const canSketch = stages.some(identity => identity.speciesId === 'pokemon-235');
    const slots = record.moves.slots.filter(slot => slot !== null);
    report.check(slots.length > 0, '/moves', 'Permanent Pokémon needs a learned move or explicit fallback acquisition.');
    for (const slot of slots) {
      const move = effects.getMove(slot.moveId);
      // Native town teaching does not reject duplicate move identities. Slot
      // identities, not move IDs, remain unique under the graph contract.
      report.check(bounded(slot.powerBoost, 0, move.numeric.ginsengCap), '/moves', 'Power boost exceeds the source-specific Ginseng cap.');
      report.check(slot.ppCapacityBonus === 0, '/moves', 'Original Rescue Team has fixed base PP without permanent capacity upgrades.');
      // Higher-level moves survive level loss. Raw level-up eligibility is not
      // truncated by current level; auxiliary membership covers machine moves.
      const ordinary = learnsets.some(set => set.levelUp.some(pair => pair[1] === move.internalId) || set.auxiliary.includes(move.internalId));
      if (!ordinary && !canSketch) report.need(`P17:permanent-move-acquisition:${slot.moveId}`);
      if (['MOVE_FRENZY_PLANT', 'MOVE_HYDRO_CANNON', 'MOVE_BLAST_BURN', 'MOVE_VOLT_TACKLE'].includes(move.symbol) && !canSketch) report.check(growth.iqPoints >= 333, '/moves', 'Special starter move requires sourced minimum IQ.');
    }
    // Graph checks adjacency/overlap; set shortcuts refer to sequence heads.
    for (const link of record.moves.links) {
      report.check(record.moves.setMoveSlotId === null || !link.slice(1).includes(record.moves.setMoveSlotId), '/moves/links', 'Set move must be a linked sequence head.');
      for (const id of link) {
        const slot = slots.find(entry => entry.moveSlotId === id);
        if (!slot) continue; // Missing links are rejected by the graph contract.
        const symbol = effects.getMove(slot.moveId).symbol;
        report.check(!['MOVE_SOLARBEAM', 'MOVE_SKY_ATTACK', 'MOVE_RAZOR_WIND', 'MOVE_FOCUS_PUNCH', 'MOVE_SKULL_BASH', 'MOVE_FLY', 'MOVE_BOUNCE', 'MOVE_DIVE', 'MOVE_DIG'].includes(symbol), '/moves/links', 'Charging moves cannot be linked, including SolarBeam in sunny weather.');
        report.check(id === link[0] || !slot.enabled, '/moves/links', 'Only a linked sequence head can be enabled for AI.');
      }
    }
    const origin = record.origin;
    if (origin.kind === 'starter') {
      const expectedId = origin.role === 'hero' ? state.profile.heroId : state.profile.partnerId;
      const original = origin.role === 'hero' ? state.profile.originalHeroIdentity : state.profile.originalPartnerIdentity;
      report.check(record.pokemonId === expectedId && origin.selectionOutcomeId === state.profile.selection.outcomeId && sameForm(record.evolutionHistory[0]?.from ?? record.identity, original), '/origin', 'Starter provenance must match original profile selection.');
    } else if (origin.kind === 'recruited') {
      report.check(bounded(origin.metLevel, 1, 100), '/origin/metLevel', 'Recruit met level must be 1–100.');
      report.check(origin.sessionId === origin.actor.sessionId && sameForm(origin.actor.identity, record.evolutionHistory[0]?.from ?? record.identity), '/origin', 'Recruit provenance must retain source actor and original species.');
      report.need('P17:permanent-recruitment-admission');
    } else if (origin.kind === 'scripted') {
      report.check(bounded(origin.metLevel, 1, 100), '/origin/metLevel', 'Scripted met level must be 1–100.');
      report.need(`P19:pokemon-grant:${origin.grantId}`);
    } else {
      report.check(record.identity.speciesId === 'pokemon-292' && origin.sourcePokemonId !== record.pokemonId && bounded(origin.createdRevision, 0, state.revision), '/origin', 'Evolution extra must be distinct Shedinja with valid creation revision.');
      report.need(`P17:evolution-extra:${origin.evolutionPolicyId}`);
    }
    return report.result();
  };
}
