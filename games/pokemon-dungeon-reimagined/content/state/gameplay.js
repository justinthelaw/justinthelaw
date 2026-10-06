import { OPENING_EXPEDITION as O } from '../authored/expedition.js';
import { diagnostics } from './pokemon-rules.js';
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
    if (state.progress.storyNodeId === authored.storyNodeId) return opening.progress(state);
    const r = diagnostics(); const p = state.progress;
    if (![O.storyNode, O.returnNode].includes(p.storyNodeId)) { r.need(`P19:story-node:${p.storyNodeId}`); return r.result(); }
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
      r.check(p.appliedGrants.length === Number(p.seenScenes[O.returnScene]?.count === 1), '/appliedGrants', 'Reunion reward is granted exactly once on acknowledgement.');
    }
    if (state.session) {
      r.check(state.containers[state.session.inventory]?.itemIds.length === 0 && state.session.entry.itemArchive.containers[state.session.entry.toolboxContainerId]?.itemIds.length === 0, '/session/inventory', 'Before team naming, this opening uses held slots and has no usable toolbox inventory.');
    }
    if (state.session) r.check(state.session.dungeonId === 'tiny-woods' && state.session.purpose.kind === 'story' && state.session.purpose.storyNodeId === O.storyNode, '/session', 'Only the Tiny Woods story expedition is admitted.');
    return r.result();
  },
  scene(scene, state) {
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
