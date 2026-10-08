import { MORNING, morningIndex } from '../authored/first-morning.js';
import { TEAM } from '../authored/team-formation.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';
import { formationProgress } from './gameplay.js';
import { diagnostics } from './pokemon-rules.js';
import { fingerprint } from '../../src/domain/state/relations.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {unknown} a @param {unknown} b */ const equal = (a, b) => fingerprint(a) === fingerprint(b);
/** Extends only the explicit new story owner. Existing policies remain exact,
 * including the separately composed predecessor migration boundary.
 * @param {import('../authored/opening.js').AuthoredOpening} authored
 * @param {Pick<Policies,'progress'|'scene'|'town'|'rescue'|'job'|'result'>} prior
 * @returns {Pick<Policies,'progress'|'scene'|'town'|'rescue'|'job'|'result'>} */
export function withMorningPolicies(authored, prior) { return { ...prior,
  progress(state) {
    if (state.progress.storyNodeId !== MORNING.story) return prior.progress(state);
    const r = diagnostics(), p = state.progress, scene = state.pendingScene;
    const index = scene ? morningIndex(scene.sceneId) : MORNING.scenes.length;
    r.check(index >= 0 && (scene ? state.mode === 'scene' : state.mode === 'town'), '/pendingScene', 'Morning has one exact authored scene or accepted request boundary.');
    // Reuse the reviewed formation prerequisite without duplicating its policy.
    // Every projected field is independently checked below against exact new
    // histories/native map/day/placements. No other field is masked.
    const prefixIds = authored.scenes.slice(0, 6).map(row => row.id);
    const prerequisite = formationProgress({ ...state, pendingScene: null, mode: 'town',
      town: { ...state.town, day: 0, mapDefinitionId: TEAM.map }, progress: { ...p, storyNodeId: TEAM.foundedStory,
        native: { ...p.native, scenarios: { ...p.native.scenarios, MAIN: { chapter: 3, step: 0 } } },
        seenScenes: Object.fromEntries(Object.entries(p.seenScenes).filter(([id]) => prefixIds.some(sceneId => sceneId === id))), appliedGrants: p.appliedGrants.slice(0, 2) } }, authored);
    if (!prerequisite.ok) {
      if (prerequisite.kind === 'invalid') for (const issue of prerequisite.issues) r.check(false, issue.path, issue.message);
      else for (const id of prerequisite.requirementIds) r.need(id);
    }
    const step = index === 0 ? 1 : index === 1 ? 2 : index === 2 ? 3 : index < 6 ? 4 : 5;
    const native = { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 3, step } } };
    r.check(equal(p.native, native), '/native', 'Morning MAIN follows awakening, save, interior, outside and delivered request; departure has not executed.');
    r.check(state.town.day === 1 && state.session === null && state.pendingResult === null, '', 'This browser morning is day one and has no expedition or result.');
    r.check(state.town.mapDefinitionId === (index < 3 ? MORNING.interior : TEAM.map), '/town/mapDefinitionId', 'Morning scenes use their exact interior or exterior destination.');
    const expectedIds = [...prefixIds, ...MORNING.scenes.slice(0, index)];
    r.check(Object.keys(p.seenScenes).length === expectedIds.length, '/seenScenes', 'Morning history admits no omitted or future scenes.');
    let previous = -1;
    for (const id of expectedIds) {
      const visit = p.seenScenes[id], day = prefixIds.some(sceneId => sceneId === id) ? 0 : 1;
      r.check(visit && visit.sceneId === id && visit.count === 1 && visit.firstRevision === visit.lastRevision && visit.firstRevision > previous && visit.lastRevision <= state.revision && visit.firstDay === day && visit.lastDay === day, '/seenScenes', 'Scenes complete once in exact order on their authored day.');
      previous = visit?.lastRevision ?? previous;
    }
    const grants = [ ...p.appliedGrants.slice(0, 2), ...MORNING.grants.flatMap((grantId, position) => {
      const completed = position < 2 ? index > position : position < 4 ? index > 4 : position === 4 ? index > 5 : position === 5 ? index > 6 || index === 6 && (scene?.cursor ?? 0) >= 1 : index > 6;
      const sceneIndex = position < 2 ? position : position < 4 ? 4 : position === 4 ? 5 : 6;
      const receipt = p.appliedGrants.find(row => row.grantId === grantId);
      const revision = position === 5 ? receipt?.revision : p.seenScenes[MORNING.scenes[sceneIndex] ?? '']?.lastRevision;
      if (position === 5 && completed) r.check(revision && revision > (p.seenScenes[MORNING.scenes[5] ?? '']?.lastRevision ?? -1) && (index > 6 ? revision < (p.seenScenes[MORNING.scenes[6] ?? '']?.lastRevision ?? -1) : revision <= state.revision) && (!scene || index !== 6 || revision === scene.entryRevision + 1), '/appliedGrants', 'Read-mail receipt follows delivery and precedes acceptance at the first read acknowledgment.');
      return completed ? [{ grantId, revision, day: 1 }] : [];
    }) ];
    r.check(equal(p.appliedGrants, grants), '/appliedGrants', 'Distinct morning/save/kit/news/delivery/accepted receipts match their completion revisions exactly.');
    if (scene) {
      r.check((index === 0 ? scene.entryRevision > previous : scene.entryRevision === previous) && scene.entryRevision <= state.revision && !p.seenScenes[scene.sceneId], '/pendingScene/entryRevision', 'Scene starts at its preceding completion, or deliberate first-morning command.');
      r.check(state.revision - scene.entryRevision >= scene.cursor, '/pendingScene/cursor', 'Cursor requires its prior acknowledgments.');
    }
    return r.result();
  },
  town(town, state) {
    if (state.progress.storyNodeId !== MORNING.story) return prior.town(town, state);
    const r = diagnostics(), inside = town.mapDefinitionId === MORNING.interior;
    r.check([MORNING.interior, TEAM.map].includes(town.mapDefinitionId) && town.day === 1 && town.serviceStock.length === 0, '', 'First morning has exact base identity and no service stock.');
    const placements = inside ? [{ reference: { kind: 'pokemon', pokemonId: state.profile.heroId }, ...MORNING.hero }] : [{ reference: { kind: 'pokemon', pokemonId: state.profile.heroId }, ...TEAM.hero }, { reference: { kind: 'pokemon', pokemonId: state.profile.partnerId }, ...TEAM.partner }];
    r.check(equal(town.placements, placements), '/placements', 'Hero awakens alone indoors; the original partner waits outside.');
    return r.result();
  },
  scene(scene, state) {
    if (morningIndex(scene.sceneId) < 0) return prior.scene(scene, state);
    const r = diagnostics(), script = authored.scenes.find(row => row.id === scene.sceneId), stage = script?.stages?.[scene.cursor];
    r.check(state.progress.storyNodeId === MORNING.story && stage && equal(scene.awaiting, stage.awaiting) && equal(scene.continuation, script?.continuation), '', 'Morning gate/cursor/continuation belongs to its authored story exactly.');
    r.check(scene.choices.length === 0, '/choices', 'Prepare-first loop records no repeated choices. Acceptance completes atomically.');
    r.check(scene.bindings.length === 2 && scene.bindings.some(b => b.kind === 'pokemon' && b.roleId === authored.heroRoleId && b.pokemonId === state.profile.heroId) && scene.bindings.some(b => b.kind === 'pokemon' && b.roleId === authored.partnerRoleId && b.pokemonId === state.profile.partnerId), '/bindings', 'Morning keeps the original pair identities. A role is not an indoor placement.');
    return r.result();
  },
}; }
