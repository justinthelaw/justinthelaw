import { fingerprint } from '../../src/domain/state/relations.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';
import { diagnostics, sameForm } from './pokemon-rules.js';

/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {unknown} a @param {unknown} b */
const equal = (a, b) => fingerprint(a) === fingerprint(b);

/** Concrete admission for the authored awakening and its empty meadow boundary.
 * These checks admit any coherent scene cursor, not only revision zero. Later
 * story nodes have their own explicit owner; no callback receipt replaces it.
 * @param {import('../authored/opening.js').AuthoredOpening} authored
 * @param {import('../../src/contracts/campaign.js').CampaignContent['initialCampaign']} initialCampaign
 * @returns {Pick<Policies,'progress'|'scene'|'town'|'rescue'|'job'|'result'>} */
export function createOpeningPolicies(authored, initialCampaign) {
  return {
    progress(state) {
      const r = diagnostics(); const p = state.progress;
      if (p.storyNodeId !== authored.storyNodeId) r.need(`P19:story-node:${p.storyNodeId}`);
      else {
        const initial = initialCampaign(authored.profileId, { ...state.profile.selection, hero: state.profile.originalHeroIdentity, partner: state.profile.originalPartnerIdentity });
        if (initial.status === 'blocked') for (const id of initial.requirementIds) r.need(id);
        else {
          const definition = initial.value;
          r.check(Object.keys(state.roster).length === 2 && equal(state.selectedPartyIds, [state.profile.heroId, state.profile.partnerId]), '/roster', 'Awakening contains exactly the selected starter team.');
          for (const role of /** @type {const} */ (['hero', 'partner'])) {
            const record = state.roster[role === 'hero' ? state.profile.heroId : state.profile.partnerId];
            const expected = definition[role];
            r.check(record && equal(record.growth, expected.growth) && equal(record.enabledIqSkillIds, expected.enabledIqSkillIds) && record.tacticId === expected.tacticId && record.friendAreaId === expected.friendAreaId && record.evolutionHistory.length === 0, '/roster', 'Awakening starters must retain the exact level-one source profile.');
            if (record) {
              const actual = record.moves.slots.map(slot => slot ? { moveId: slot.moveId, enabled: slot.enabled, powerBoost: slot.powerBoost, ppCapacityBonus: slot.ppCapacityBonus } : null);
              const expectedSlots = Array.from({ length: 4 }, (_, position) => expected.moves[position] ?? null);
              const linkedPositions = record.moves.links.map(group => group.map(id => record.moves.slots.findIndex(slot => slot?.moveSlotId === id)));
              const setPosition = record.moves.setMoveSlotId === null ? null : record.moves.slots.findIndex(slot => slot?.moveSlotId === record.moves.setMoveSlotId);
              r.check(equal(actual, expectedSlots) && equal(linkedPositions, expected.linkedPositionGroups) && setPosition === expected.setMovePosition, '/roster/moves', 'Awakening move positions, links and settings must match the native roster creation.');
            }
          }
          r.check(state.economy.carriedMoney === definition.carriedMoney && state.economy.bankedMoney === definition.bankedMoney && state.economy.storedItems.length === 0 && Object.keys(state.items).length === 0 && equal(state.economy.ownedFriendAreaIds, definition.friendAreaIds), '/economy', 'Awakening has the exact empty source inventory and ordered starter areas.');
        }
        r.check(equal(p.native, INITIAL_NATIVE_PROGRESS), '/native', 'Awakening must retain the sourced pre-scenario native reset.');
        r.check(p.rankPoints === 0 && Object.keys(p.branches).length === 0 && Object.keys(p.milestones).length === 0, '', 'Awakening precedes rank awards, branches and milestones.');
        r.check(Object.keys(p.clears).length === 0 && Object.keys(p.jobs).length === 0 && p.acceptedJobIds.length === 0 && p.appliedGrants.length === 0 && p.consumedMail.length === 0, '', 'Awakening cannot contain expedition, job, reward or mail history.');
        r.check(Object.values(p.statistics).every(value => value === 0), '/statistics', 'Awakening precedes completed jobs, rescues and expeditions.');
        r.check(p.recruitedHistory.length === 2 && p.recruitedHistory[0] && p.recruitedHistory[1] && sameForm(p.recruitedHistory[0], state.profile.originalHeroIdentity) && sameForm(p.recruitedHistory[1], state.profile.originalPartnerIdentity), '/recruitedHistory', 'Initial acquisition history contains the ordered original starters.');
        r.check(state.session === null && state.pendingResult === null && (state.mode === 'scene' || state.mode === 'town'), '', 'Awakening is a ground scene or its meadow continuation.');
        for (const visit of Object.values(p.seenScenes)) {
          r.check(authored.scenes[0]?.id === visit.sceneId && visit.count === 1, '/seenScenes', 'Opening scenes may complete only once.');
          r.check(state.pendingScene?.sceneId !== visit.sceneId, '/seenScenes', 'Completed opening cannot be active again.');
        }
        if (state.mode === 'town') r.check(p.seenScenes[authored.scenes[0]?.id ?? '']?.count === 1, '/seenScenes', 'Meadow continuation requires the completed opening scene.');
      }
      return r.result();
    },
    scene(scene, state) {
      const r = diagnostics(); const script = authored.scenes.find(row => row.id === scene.sceneId);
      if (!script) { r.need(`P19:scene-script:${scene.sceneId}`); return r.result(); }
      r.check(state.progress.storyNodeId === authored.storyNodeId && state.town.mapDefinitionId === authored.town.mapDefinitionId && state.session === null, '', 'Opening scene requires its story, meadow and ground context.');
      r.check(scene.cursor >= 0 && scene.cursor < script.lines.length && scene.awaiting.kind === 'advance' && scene.choices.length === 0, '/cursor', 'Opening cursor must address an authored advance-only line.');
      r.check(equal(scene.continuation, script.continuation), '/continuation', 'Scene continuation must match the authored destination.');
      r.check(scene.bindings.length === 2 && scene.bindings.some(binding => binding.roleId === authored.heroRoleId && binding.kind === 'pokemon' && binding.pokemonId === state.profile.heroId) && scene.bindings.some(binding => binding.roleId === authored.partnerRoleId && binding.kind === 'pokemon' && binding.pokemonId === state.profile.partnerId), '/bindings', 'Opening roles must bind the two original individuals.');
      return r.result();
    },
    town(town, state) {
      const r = diagnostics();
      if (town.mapDefinitionId !== authored.town.mapDefinitionId) { r.need(`P20:ground-map:${town.mapDefinitionId}`); return r.result(); }
      r.check(town.day === authored.town.day && town.serviceStock.length === 0, '', 'The opening meadow has day zero and no town services.');
      r.check(town.placements.length === 2, '/placements', 'Opening meadow contains the hero and partner.');
      const occupied = new Set(); const present = new Set();
      for (const placement of town.placements) {
        const { x, z } = placement.position; const key = `${x},${z}`;
        r.check(x >= 0 && z >= 0 && x < authored.width && z < authored.height && !occupied.has(key), '/placements', 'Ground placements must be in bounds and occupy distinct tiles.'); occupied.add(key);
        r.check(placement.reference.kind === 'pokemon' && [state.profile.heroId, state.profile.partnerId].includes(placement.reference.pokemonId), '/placements', 'Only the starters occupy the awakening meadow.');
        if (placement.reference.kind === 'pokemon') { r.check(!present.has(placement.reference.pokemonId), '/placements', 'Ground participant must not be placed twice.'); present.add(placement.reference.pokemonId); }
      }
      return r.result();
    },
    rescue(state) {
      const r = diagnostics();
      if (state.rescue.suspended) r.need(`P21:rescue-restoration:${state.rescue.suspended.outcomePolicySetId}`);
      for (const record of Object.values(state.rescue.records)) r.need(`P21:rescue-format:${record.formatId}`);
      for (const team of Object.values(state.rescue.importedTeams)) r.need(`P21:imported-team-format:${team.formatId}`);
      if (state.progress.storyNodeId === authored.storyNodeId) r.check(!state.rescue.suspended && Object.keys(state.rescue.records).length === 0 && Object.keys(state.rescue.importedTeams).length === 0, '', 'Awakening precedes all rescue exchange state.');
      return r.result();
    },
    job(job) {
      const r = diagnostics();
      if (job.source.kind === 'authored') r.need(`P21:job-grant:${job.source.grantId}`);
      else if (job.source.kind === 'generated') r.need(`P21:job-generation:${job.source.generationPolicyId}`);
      else r.need(`P21:job-mail-format:${job.source.formatId}`);
      return r.result();
    },
    result(result) { const r = diagnostics(); r.need(`P19:result-definition:${result.kind}`); return r.result(); },
  };
}
