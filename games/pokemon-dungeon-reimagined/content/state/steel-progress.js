import { TOWN, placeInTown } from '../authored/town.js';
import { STEEL } from '../authored/mt-steel.js';
import { WORK } from '../authored/early-work.js';
import { TEAM, placeAtBase } from '../authored/team-formation.js';
import { MORNING, placeInside } from '../authored/first-morning.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';
import { SPAWN_SLEEP_CHANCES } from './expedition-facts.js';
import { STEEL_SLEEP_CHANCES } from './steel-facts.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { fingerprint } from '../../src/domain/state/relations.js';
import { rewardItemRoute } from '../../src/domain/gameplay/reward-items.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {unknown} a @param {unknown} b */
export const steelSame = (a, b) => fingerprint(a) === fingerprint(b);
/** @param {ReturnType<typeof diagnostics>} r @param {import('../../src/contracts/campaign.js').RuleCheck} check @param {readonly string[]} [replace] */
export function steelAppend(r, check, replace = []) {
  if (check.ok) return;
  if (check.kind === 'invalid') for (const issue of check.issues) r.check(false, issue.path, issue.message);
  else for (const id of check.requirementIds) if (!replace.includes(id)) r.need(id);
}
/** Project exactly the completed request prerequisite after separately checking
 * all successor history. Inventory, roster, jobs, old receipts and old seen
 * identities still pass the unchanged predecessor owners.
 * @param {import('../../src/contracts/campaign.js').CampaignState} state */
export function steelPrerequisite(state) {
  const steel = state.steel;
  const extras = new Set([...Object.keys(STEEL_SLEEP_CHANCES), 'pokemon-227', 'pokemon-050'].filter(id => !Object.hasOwn(SPAWN_SLEEP_CHANCES, id)));
  const projected = { ...state, steel: null, session: null, pendingScene: null, pendingResult: null, mode: /** @type {const} */ ('town'),
    town: { ...state.town, day: steel?.requestDay ?? state.town.day },
    speciesSeen: state.speciesSeen ? { ...state.speciesSeen, identities: state.speciesSeen.identities.filter(row => !extras.has(row.speciesId) || state.progress.recruitedHistory.some(prior => steelSame(prior, row))) } : undefined,
    progress: { ...state.progress, storyNodeId: WORK.story,
      native: { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 4, step: 6 } } },
      statistics: { ...state.progress.statistics, expeditions: steel?.priorExpeditions ?? state.progress.statistics.expeditions, rescuesCompleted: 2 },
      clears: Object.fromEntries(Object.entries(state.progress.clears).filter(([id]) => id !== STEEL.dungeonId)),
      seenScenes: Object.fromEntries(Object.entries(state.progress.seenScenes).filter(([id]) => !STEEL.scenes.some(key => key === id))),
      appliedGrants: state.progress.appliedGrants.filter(row => !STEEL.grants.includes(row.grantId)) } };
  placeAtBase(projected); return projected;
}
/** @param {Policies} prior @param {import('../authored/opening.js').AuthoredOpening} authored
 * @returns {Pick<Policies,'progress'|'town'|'scene'>} */
export function steelProgressPolicies(prior, authored) { return {
  progress(state) {
    const r = diagnostics(), steel = state.steel, p = state.progress;
    if (!steel) { r.check(steel === null, '/steel', 'Current saves require an explicit null pre-Steel owner.'); steelAppend(r, prior.progress(state)); return r.result(); }
    const phase = steel.phase, complete = phase === 'complete', live = ['exploration', 'battle-intro', 'battle', 'departure', 'poststory'].includes(phase);
    const won = steel.winRevision !== null, finishedRuns = steel.attempts - Number(live), failures = finishedRuns - Number(won);
    const quiet = Number(phase === 'poststory' || !!p.seenScenes[STEEL.scenes[10] ?? '']);
    const battleVisits = steel.bossVisits - quiet;
    r.check(bounded(steel.startedRevision, 1, state.revision) && steel.startedRevision > (p.seenScenes[WORK.scenes[1] ?? '']?.lastRevision ?? state.revision) && steel.requestDay === state.town.day && bounded(steel.priorExpeditions, 2, p.statistics.expeditions), '/steel', 'Steel begins after the completed request and retains its day and expedition baseline.');
    r.check(bounded(steel.attempts, 0, p.statistics.expeditions) && p.statistics.expeditions === steel.priorExpeditions + steel.attempts && bounded(steel.bossVisits, 0, steel.attempts) && failures >= 0, '/steel/attempts', 'Travel acknowledgments count actual entries; summit visits cannot exceed them.');
    r.check(p.storyNodeId === (complete ? STEEL.complete : STEEL.story) && p.statistics.rescuesCompleted === (complete ? 3 : 2) && state.pendingResult === null, '/progress', 'Only the completed rescue return advances the story and rescue count.');
    r.check(steel.bossDefeated ? steel.bossVisits > 0 : !won && !['departure', 'poststory'].includes(phase), '/steel/bossDefeated', 'Durable boss completion requires a real summit visit and precedes every success return.');
    r.check(won ? steel.bossDefeated && ['bridge', 'crossing', 'thanks', 'home', 'complete'].includes(phase) && bounded(steel.winRevision ?? 0, steel.startedRevision, state.revision) : !['bridge', 'crossing', 'thanks', 'home', 'complete'].includes(phase), '/steel/winRevision', 'Successful settlement has a distinct receipt from boss defeat, including recoil losses.');
    r.check(steel.attempts === 0 ? steel.lastSessionId === null && phase === 'travel' : steel.lastSessionId !== null, '/steel/lastSessionId', 'Each actual entry retains its last session identity.');
    const stage = complete ? { chapter: 5, step: 0 } : { chapter: 4, step: ['crossing', 'thanks', 'home'].includes(phase) ? 8 : finishedRuns > 0 ? 7 : 6 };
    const flags = [...INITIAL_NATIVE_PROGRESS.flags.persistent]; flags[0] = steel.bossVisits > 0; flags[1] = steel.bossDefeated;
    r.check(steelSame(p.native, { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: stage }, flags: { ...INITIAL_NATIVE_PROGRESS.flags, persistent: flags } }), '/native', 'Reached/complete native flags survive retries independently of MAIN return and reward stages.');
    const counts = [Number(steel.attempts > 0), Math.max(0, steel.attempts - 1), Number(battleVisits > 0 && !(phase === 'battle-intro' && battleVisits === 1)), Math.max(0, battleVisits - 1 - Number(phase === 'battle-intro' && battleVisits > 1)), failures - Number(phase === 'loss'), Number(won && !quiet), Number(['thanks', 'home', 'complete'].includes(phase)), Number(['home', 'complete'].includes(phase)), Number(complete), Number(['crossing', 'thanks', 'home', 'complete'].includes(phase)), Number(won && quiet)];
    for (const [index, id] of STEEL.scenes.entries()) {
      const visit = p.seenScenes[id], count = counts[index] ?? -1;
      r.check(count >= 0 && (count === 0 ? !visit : visit && visit.count === count && visit.firstDay === steel.requestDay && visit.lastDay === steel.requestDay && bounded(visit.firstRevision, steel.startedRevision, state.revision) && bounded(visit.lastRevision, visit.firstRevision, state.revision) && (count > 1 || visit.firstRevision === visit.lastRevision)), '/seenScenes', 'Steel scene counts and revision ranges match completed travel, summit, loss and one successful return.');
    }
    if (won) r.check(p.seenScenes[STEEL.scenes[quiet ? 10 : 5] ?? '']?.lastRevision === steel.winRevision, '/steel/winRevision', 'Successful settlement shares the actual departure or quiet-summit acknowledgment revision.');
    const ordered = [9, 6, 7, 8]; let previous = steel.winRevision ?? 0;
    for (const index of ordered) { const visit = p.seenScenes[STEEL.scenes[index] ?? '']; if (visit) { r.check(visit.firstRevision > previous, '/seenScenes', 'Success bridge, crossing, thanks and home finish in order.'); previous = visit.lastRevision; } }
    const receipts = p.appliedGrants.filter(row => STEEL.grants.includes(row.grantId));
    r.check(receipts.length === 0 || steelSame(p.appliedGrants.slice(-receipts.length), receipts), '/appliedGrants', 'Steel rewards append after all prior story receipts.');
    r.check(bounded(steel.rewardCursor, 0, 3) && steelSame(receipts.map(row => row.grantId), STEEL.grants.slice(0, steel.rewardCursor)) && (['home', 'complete'].includes(phase) ? steel.rewardCursor === 3 : phase === 'thanks' ? steel.rewardCursor < 3 : steel.rewardCursor === 0), '/appliedGrants', 'Cash, scarf and Ginseng receipts form one exact ordered prefix.');
    previous = p.seenScenes[STEEL.scenes[6] ?? '']?.lastRevision ?? 0;
    for (const receipt of receipts) { r.check(receipt.day === steel.requestDay && bounded(receipt.revision, previous, state.revision) && receipt.revision > (p.seenScenes[STEEL.scenes[6] ?? '']?.lastRevision ?? 0), '/appliedGrants', 'Rewards follow the crossing and preserve their delivery revisions.'); previous = receipt.revision; }
    if (steel.rewardChoice) {
      const itemId = /** @type {import('../../src/contracts.js').ItemId} */ (steel.rewardCursor === 1 ? 'item-pecha-scarf' : 'item-ginseng');
      r.check(phase === 'thanks' && [1, 2].includes(steel.rewardCursor) && state.pendingScene?.cursor === (authored.scenes.find(row => row.id === STEEL.scenes[7])?.lines.length ?? 0) - 1 && rewardItemRoute(state, { template: { itemId, sticky: false, payload: { kind: 'none' } }, quantity: 1 }) === 'choice', '/steel/rewardChoice', 'Reward pause is a genuine full bag/storage choice at the final thanks line.');
    } else r.check(phase !== 'thanks' || steel.rewardCursor === 0, '/steel/rewardCursor', 'Partial delivery always retains its recoverable choice.');
    const clear = p.clears[STEEL.dungeonId];
    r.check(complete ? clear && clear.clearCount === 1 && steelSame(clear.reachedFloorIds, STEEL.floors) && clear.firstClearRevision === p.seenScenes[STEEL.scenes[8] ?? '']?.lastRevision && clear.lastClearRevision === clear.firstClearRevision && clear.firstClearDay === steel.requestDay && clear.lastClearDay === steel.requestDay : !clear, '/clears', 'Only the final home acknowledgment records the complete nine-floor rescue.');
    const session = state.session;
    r.check(live === !!session, '/session', 'Only exploration and summit stages retain the real expedition.');
    if (session) {
      r.check(session.sessionId === steel.lastSessionId && session.dungeonId === STEEL.dungeonId && session.purpose.kind === 'story' && session.purpose.storyNodeId === STEEL.story && session.objectives.length === 0 && session.completedEventIds.length === 0 && session.participantSettlements.length === 0 && bounded(session.visitedFloorIds.length, 1, 9) && steelSame(session.visitedFloorIds, STEEL.floors.slice(0, session.visitedFloorIds.length)) && 'address' in session.floor.location && session.floor.location.address.floorId === session.visitedFloorIds.at(-1), '/session', 'One story expedition owns the exact ordered floors without mission/recruitment substitutes.');
      r.check(phase === 'exploration' ? session.floor.location.kind === 'exploration' && session.visitedFloorIds.length < 9 : session.floor.location.kind === 'boss' && session.visitedFloorIds.length === 9, '/session/floor', 'The ninth floor is the fixed summit, never procedural exploration.');
      const boss = Object.values(session.actors).filter(row => row.binding.kind === 'boss'), clients = Object.values(session.actors).filter(row => row.binding.kind === 'guest');
      if (phase !== 'exploration') r.check(phase === 'poststory' ? boss.length === 0 && clients.length === 0 && steel.bossDefeated : boss.length === 1 && clients.length === 1 && (phase === 'departure' ? boss[0]?.resources.hp === 0 && steel.bossDefeated : boss[0]?.resources.hp !== 0 && !steel.bossDefeated), '/session/actors', 'Actual boss faint owns departure; poststory removes both fixed actors without a second battle.');
    }
    const sceneIndex = phase === 'travel' ? steel.attempts === 0 ? 0 : 1 : phase === 'battle-intro' ? steel.bossVisits === 1 ? 2 : 3 : ({ loss: 4, departure: 5, crossing: 6, thanks: 7, home: 8, bridge: 9, poststory: 10, battle: undefined, complete: undefined, exploration: undefined, ready: undefined })[phase];
    r.check(sceneIndex === undefined ? !state.pendingScene && state.mode === (live ? 'dungeon' : 'town') : state.mode === 'scene' && state.pendingScene?.sceneId === STEEL.scenes[sceneIndex], '/pendingScene', 'Every Steel phase has its exact scene or command boundary.');
    for (const row of state.speciesSeen?.identities ?? []) if (!Object.hasOwn(SPAWN_SLEEP_CHANCES, row.speciesId) && (Object.hasOwn(STEEL_SLEEP_CHANCES, row.speciesId) || ['pokemon-227', 'pokemon-050'].includes(row.speciesId))) r.check(row.formId === null && (['pokemon-227', 'pokemon-050'].includes(row.speciesId) ? steel.bossVisits > 0 : steel.attempts > 0), '/speciesSeen', 'New seen flags require their reachable ordinary or fixed encounter history.');
    r.check(new Set(state.speciesSeen?.identities.map(row => `${row.speciesId}:${row.formId}`)).size === state.speciesSeen?.identities.length, '/speciesSeen', 'Seen identities remain unique after adding summit encounters.');
    steelAppend(r, prior.progress(steelPrerequisite(state))); return r.result();
  },
  town(town, state) {
    if (!state.steel) {
      if (state.progress.storyNodeId !== WORK.story || state.pendingScene || !WORK.scenes.every(id => state.progress.seenScenes[id]?.count === 1)) return prior.town(town, state);
      const r = diagnostics(), projection = { ...state, town: { ...town } };
      r.check([TEAM.map, MORNING.interior, TOWN.square, TOWN.post].includes(town.mapDefinitionId), '/town', 'Request preparation stays within introduced service maps.');
      placeInTown(projection, town.mapDefinitionId); r.check(steelSame(town.placements, projection.town.placements), '/placements', 'Preparation uses canonical service-map placements.');
      placeAtBase(projection); steelAppend(r, prior.town(projection.town, projection)); return r.result();
    }
    const phase = state.steel.phase, r = diagnostics();
    const map = phase === 'travel' ? STEEL.entrance : ['bridge', 'crossing'].includes(phase) ? STEEL.summit : ['loss', 'ready', 'complete'].includes(phase) ? MORNING.interior : TEAM.map;
    const expected = { ...state, town: { ...town } }; if (phase === 'ready') placeInTown(expected, town.mapDefinitionId); else if (map === MORNING.interior) placeInside(expected); else placeAtBase(expected);
    r.check((phase === 'ready' ? [TEAM.map, MORNING.interior, TOWN.square, TOWN.post].includes(town.mapDefinitionId) : town.mapDefinitionId === map) && steelSame(town.placements, expected.town.placements), '/town', 'Steel ground stages retain exact pair/base placements.');
    const prerequisite = steelPrerequisite(state); steelAppend(r, prior.town(prerequisite.town, prerequisite)); return r.result();
  },
  scene(scene, state) {
    if (!STEEL.scenes.includes(scene.sceneId)) return prior.scene(scene, state);
    const r = diagnostics(), script = authored.scenes.find(row => row.id === scene.sceneId);
    r.check(state.steel && script && bounded(scene.cursor, 0, script.lines.length - 1) && scene.awaiting.kind === 'advance' && scene.choices.length === 0 && steelSame(scene.continuation, script.continuation) && bounded(scene.entryRevision, state.steel.startedRevision, state.revision) && state.revision - scene.entryRevision >= scene.cursor, '', 'Steel uses its exact original advance-only scene and persisted cursor.');
    r.check(scene.bindings.length === 2 && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.heroRoleId && row.pokemonId === state.profile.heroId) && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.partnerRoleId && row.pokemonId === state.profile.partnerId), '/bindings', 'Story guests do not become fabricated permanent recruits.');
    return r.result();
  },
}; }
