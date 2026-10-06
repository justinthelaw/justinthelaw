import { TEAM } from '../authored/team-formation.js';
import { checkName, sameForm, diagnostics } from './pokemon-rules.js';
import { OPENING_EXPEDITION as O } from '../authored/expedition.js';
import { fingerprint } from '../../src/domain/state/relations.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';

/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {unknown} a @param {unknown} b */ const equal = (a, b) => fingerprint(a) === fingerprint(b);
/** Scene/entry/return invariants for the concrete opening mechanics. The native
 * reset remains explicitly browser staging, not an invented cartridge cursor.
 * @param {import('../authored/opening.js').AuthoredOpening} authored @param {Pick<Policies,'progress'|'scene'|'town'|'rescue'|'job'|'result'>} opening
 * @returns {Pick<Policies,'progress'|'scene'|'town'|'rescue'|'job'|'result'>} */
export function withGameplayPolicies(authored, opening) { return { ...opening,
  progress(state) {
    if ([TEAM.story, TEAM.foundedStory].includes(state.progress.storyNodeId)) return formationProgress(state, authored);
    if (state.progress.storyNodeId === authored.storyNodeId) return opening.progress(state);
    const r = diagnostics(); const p = state.progress;
    if (![O.storyNode, O.returnNode].includes(p.storyNodeId)) { r.need(`P19:story-node:${p.storyNodeId}`); return r.result(); }
    r.check(state.town.mapDefinitionId === authored.town.mapDefinitionId, '/town', 'Rescue stages remain in the admitted meadow.');
    r.check(equal(p.native, INITIAL_NATIVE_PROGRESS), '/native', 'This authored opening retains the explicit native staging reset.');
    r.check(p.milestones[O.boostGuard]?.milestoneId === O.boostGuard && Object.keys(p.milestones).length === 1, '/milestones', 'Opening entry requires exactly its once-only boost guard.');
    r.check(Object.keys(state.roster).length === 2 && equal(state.selectedPartyIds, [state.profile.heroId, state.profile.partnerId]), '/roster', 'Opening owns exactly the original pair.');
    r.check(p.seenScenes[authored.scenes[0]?.id ?? '']?.count === 1, '/seenScenes', 'Expedition follows the acknowledged rescue request.');
    for (const visit of Object.values(p.seenScenes)) r.check(authored.scenes.some(scene => scene.id === visit.sceneId) && visit.count === 1 && visit.sceneId !== state.pendingScene?.sceneId, '/seenScenes', 'Opening scene histories are once-only authored visits.');
    r.check(Object.keys(p.branches).length === 0 && Object.keys(p.jobs).length === 0 && p.acceptedJobIds.length === 0 && p.consumedMail.length === 0 && p.rankPoints === 0 && p.statistics.jobsCompleted === 0, '', 'Opening precedes jobs, mail and rank awards.');
    r.check(p.statistics.expeditions >= 1 && p.statistics.rescuesCompleted === Number(p.storyNodeId === O.returnNode), '/statistics', 'Opening expedition/rescue history must match its stage.');
    r.check(state.pendingResult === null && state.town.day === 0, '', 'Opening has no unrelated result or day advance.');
    if (p.storyNodeId === O.storyNode) r.check(Object.keys(p.clears).length === 0 && Object.keys(p.seenScenes).length === 1 && p.appliedGrants.length === 0 && (state.session !== null || state.mode === 'town'), '', 'Active or retry opening precedes clear and reward.');
    else {
      const clear = p.clears['tiny-woods'];
      r.check(state.session === null && Object.keys(p.clears).length === 1 && clear?.clearCount === 1 && equal(clear.reachedFloorIds, ['tiny-woods-floor-01', 'tiny-woods-floor-02', 'tiny-woods-floor-03']), '/clears', 'Rescue return requires all three visited floors and one acknowledged clear.');
      r.check(p.seenScenes[O.rescueScene]?.count === 1, '/seenScenes', 'Success requires Caterpie rescue acknowledgement.');
      r.check(p.appliedGrants.length === 0 && !p.seenScenes[O.returnScene] && state.pendingScene?.sceneId === O.returnScene && Object.keys(p.seenScenes).length === 2, '/appliedGrants', 'Pending reunion precedes its atomic reward and base transition.');
    }
    if (state.session) {
      r.check(state.containers[state.session.inventory]?.itemIds.length === 0 && state.session.entry.itemArchive.containers[state.session.entry.toolboxContainerId]?.itemIds.length === 0, '/session/inventory', 'Before team naming, this opening uses held slots and has no usable toolbox inventory.');
    }
    if (state.session) r.check(state.session.dungeonId === 'tiny-woods' && state.session.purpose.kind === 'story' && state.session.purpose.storyNodeId === O.storyNode, '/session', 'Only the Tiny Woods story expedition is admitted.');
    return r.result();
  },
  scene(scene, state) {
    if ([TEAM.offer, TEAM.naming, TEAM.celebration].includes(scene.sceneId)) return formationScene(scene, state, authored);
    if (scene.sceneId === authored.scenes[0]?.id) return opening.scene(scene, state);
    const r = diagnostics(); const script = authored.scenes.find(row => row.id === scene.sceneId);
    if (!script) { r.need(`P19:scene-script:${scene.sceneId}`); return r.result(); }
    r.check(scene.cursor >= 0 && scene.cursor < script.lines.length && scene.awaiting.kind === 'advance' && scene.choices.length === 0 && equal(scene.continuation, script.continuation), '/cursor', 'Scene must use its authored advance-only cursor and continuation.');
    r.check(scene.bindings.length === 2 && scene.bindings.some(b => b.kind === 'pokemon' && b.roleId === authored.heroRoleId && b.pokemonId === state.profile.heroId) && scene.bindings.some(b => b.kind === 'pokemon' && b.roleId === authored.partnerRoleId && b.pokemonId === state.profile.partnerId), '/bindings', 'Scene roles require the original pair.');
    if (scene.sceneId === O.rescueScene) {
      const session = state.session; const action = session?.scheduler.continuation.action;
      const exit = action?.kind === 'exit' ? session?.floor.exits[action.exitId] : null;
      const leader = session?.actors[session.leaderActorId];
      r.check(exit && leader?.placement.kind === 'map' && equal(exit.position, leader.placement.position), '/continuation', 'Rescue acknowledgement must be owned by the leader at the final stairs.');
      r.check(state.progress.storyNodeId === O.storyNode && state.session?.floor.location.kind === 'exploration' && state.session.floor.location.address.floorId === 'tiny-woods-floor-03' && state.session.scheduler.continuation.terminal === 'dungeon-exit', '', 'Rescue scene belongs to the final stair exit.');
    } else r.check(scene.sceneId === O.returnScene && state.progress.storyNodeId === O.returnNode && state.session === null && state.progress.seenScenes[O.rescueScene]?.count === 1, '', 'Reunion follows settled acknowledged rescue.');
    return r.result();
  },
}; }

/** Exhaustive team formation histories and once-only receipt boundaries.
 * @param {import('../../src/contracts/campaign.js').CampaignSnapshot} state
 * @param {import('../authored/opening.js').AuthoredOpening} authored */
export function formationProgress(state, authored) {
  const r = diagnostics(), p = state.progress, scene = state.pendingScene;
  const founded = p.storyNodeId === TEAM.foundedStory;
  const expectedNative = { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: founded ? { chapter: 3, step: 0 } : INITIAL_NATIVE_PROGRESS.scenarios.MAIN } };
  r.check(equal(p.native, expectedNative), '/native', 'Only confirmed team naming changes native MAIN to (3,0).');
  r.check(state.session === null && state.pendingResult === null && state.town.day === 0 && state.town.mapDefinitionId === TEAM.map, '', 'Formation is a day-zero ground boundary at the authored base.');
  r.check(Object.keys(state.roster).length === 2 && equal(state.selectedPartyIds, [state.profile.heroId, state.profile.partnerId]), '/roster', 'Team founding retains the original pair only.');
  for (const [id, identity] of /** @type {const} */ ([[state.profile.heroId, state.profile.originalHeroIdentity], [state.profile.partnerId, state.profile.originalPartnerIdentity]])) { const record = state.roster[id]; r.check(record && sameForm(record.identity, identity) && record.evolutionHistory.length === 0, '/roster', 'Formation preserves each original species/form without evolution.'); }
  r.check(p.milestones[O.boostGuard]?.milestoneId === O.boostGuard && Object.keys(p.milestones).length === 1, '/milestones', 'Formation retains exactly the opening boost guard.');
  r.check(Object.keys(p.branches).length === 0 && Object.keys(p.jobs).length === 0 && p.acceptedJobIds.length === 0 && p.consumedMail.length === 0 && p.rankPoints === 0 && p.statistics.jobsCompleted === 0 && p.statistics.expeditions >= 1 && p.statistics.rescuesCompleted === 1, '', 'Formation creates no jobs, mail, rank, branches or extra rescue.');
  const clear = p.clears['tiny-woods'];
  r.check(Object.keys(p.clears).length === 1 && clear?.clearCount === 1 && equal(clear.reachedFloorIds, ['tiny-woods-floor-01', 'tiny-woods-floor-02', 'tiny-woods-floor-03']), '/clears', 'Formation requires exactly the settled three-floor Tiny Woods rescue.');
  const naming = scene?.sceneId === TEAM.naming;
  const expected = [authored.scenes[0]?.id, O.rescueScene, O.returnScene, ...(founded || naming ? [TEAM.offer] : []), ...(founded ? [TEAM.naming] : []), ...(founded && !scene ? [TEAM.celebration] : [])];
  r.check(Object.keys(p.seenScenes).length === expected.length, '/seenScenes', 'History contains precisely the completed prior authored scenes.');
  let previous = -1;
  for (const id of expected) {
    const visit = id ? p.seenScenes[id] : undefined;
    r.check(visit && visit.sceneId === id && visit.count === 1 && visit.firstRevision === visit.lastRevision && visit.firstRevision > previous && visit.lastRevision <= state.revision && visit.firstDay === 0 && visit.lastDay === 0, '/seenScenes', 'Opening visits are once-only, ordered and on day zero.');
    previous = visit?.lastRevision ?? previous;
  }
  r.check(p.appliedGrants.length === (founded ? 2 : 1), '/appliedGrants', 'Only reunion and confirmed formation receipts are admitted.');
  const reunion = p.appliedGrants[0], founding = p.appliedGrants[1];
  r.check(reunion?.grantId === 'browser-reunion-reward' && reunion.day === 0 && reunion.revision === p.seenScenes[O.returnScene]?.lastRevision, '/appliedGrants/0', 'Reunion receipt must exactly match its completion revision.');
  if (founded) {
    r.check(founding?.grantId === TEAM.grant && founding.day === 0 && founding.revision === p.seenScenes[TEAM.naming]?.lastRevision && founding.revision > (reunion?.revision ?? -1), '/appliedGrants/1', 'Founding receipt belongs to the naming confirmation revision.');
    checkName(state.profile.teamName, 'Pokémon', r, '/profile/teamName');
    r.check(scene ? state.mode === 'scene' && scene.sceneId === TEAM.celebration : state.mode === 'town', '/pendingScene', 'Confirmed team must celebrate before the terminal base boundary.');
  } else {
    r.check(state.profile.teamName === 'Pokémon', '/profile/teamName', 'Submitted candidates cannot mutate the initialized profile.');
    r.check(state.mode === 'scene' && scene && [TEAM.offer, TEAM.naming].includes(scene.sceneId), '/pendingScene', 'Formation must retain its pending offer or naming gate.');
  }
  if (scene) {
    // Direct requests share the prerequisite completion revision. Only the
    // already-rewarded held-v2 conversion adds one bounded migration revision.
    r.check((scene.entryRevision === previous || scene.sceneId === TEAM.offer && scene.entryRevision === previous + 1) && scene.entryRevision <= state.revision && !p.seenScenes[scene.sceneId], '/pendingScene/entryRevision', 'Active scene starts at its prerequisite transaction or the one legacy migration revision.');
    const minimumSteps = scene.sceneId === TEAM.offer && scene.cursor === 5 ? 4 : scene.cursor;
    r.check(state.revision - scene.entryRevision >= minimumSteps, '/pendingScene/cursor', 'Scene cursor cannot precede its required acknowledgments.');
  }
  return r.result();
}
/** @param {import('../../src/contracts/campaign.js').PendingScene} scene
 * @param {import('../../src/contracts/campaign.js').CampaignSnapshot} state
 * @param {import('../authored/opening.js').AuthoredOpening} authored */
function formationScene(scene, state, authored) {
  const r = diagnostics(), script = authored.scenes.find(row => row.id === scene.sceneId), stage = script?.stages?.[scene.cursor];
  if (!script || !stage) { r.need(`P19:scene-stage:${scene.sceneId}:${scene.cursor}`); return r.result(); }
  r.check(state.progress.storyNodeId === (scene.sceneId === TEAM.celebration ? TEAM.foundedStory : TEAM.story), '', 'Scene belongs to the exact formation story stage.');
  r.check(equal(scene.continuation, script.continuation), '/continuation', 'Formation continuation is authored exactly.');
  r.check(scene.bindings.length === 2 && scene.bindings.some(b => b.kind === 'pokemon' && b.roleId === authored.heroRoleId && b.pokemonId === state.profile.heroId) && scene.bindings.some(b => b.kind === 'pokemon' && b.roleId === authored.partnerRoleId && b.pokemonId === state.profile.partnerId), '/bindings', 'Formation retains exactly the original pair.');
  const expectedChoices = scene.sceneId === TEAM.offer && scene.cursor === 4 ? [{ choiceId: TEAM.offerChoice, optionId: TEAM.accept }] : [];
  r.check(equal(scene.choices, expectedChoices), '/choices', 'Only terminal accepted choices are recorded; refusal/edit loops retain no duplicate IDs.');
  if (scene.awaiting.kind === 'name-input' || scene.awaiting.kind === 'name-confirm') {
    checkName(scene.awaiting.value, 'Pokémon', r, '/awaiting/value');
    r.check(equal(scene.awaiting, { ...stage.awaiting, value: scene.awaiting.value }), '/awaiting', 'Saved name gate must match its authored stage and exact options.');
  } else r.check(equal(scene.awaiting, stage.awaiting), '/awaiting', 'Saved gate must match its authored cursor and options.');
  return r.result();
}
