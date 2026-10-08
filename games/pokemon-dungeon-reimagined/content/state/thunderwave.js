import { THUNDERWAVE as T } from '../authored/thunderwave.js';
import { MORNING } from '../authored/first-morning.js';
import { TEAM } from '../authored/team-formation.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';
import { diagnostics } from './pokemon-rules.js';
import { fingerprint } from '../../src/domain/state/relations.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {unknown} a @param {unknown} b */ const equal = (a,b) => fingerprint(a) === fingerprint(b);
/** Current-only owner. The exact morning predecessor remains composed separately.
 * Project only explicitly checked successor fields through the morning prerequisite.
 * @param {import('../authored/opening.js').AuthoredOpening} authored
 * @param {Pick<Policies,'progress'|'scene'|'town'|'rescue'|'job'|'result'>} prior
 * @returns {Pick<Policies,'progress'|'scene'|'town'|'rescue'|'job'|'result'>} */
export function withThunderwavePolicies(authored, prior) { return { ...prior,
  progress(state) {
    const p = state.progress;
    if (![T.story, T.returned, T.complete].includes(p.storyNodeId)) return prior.progress(state);
    const r = diagnostics(), session = state.session, scene = state.pendingScene;
    const success = p.storyNodeId !== T.story, complete = p.storyNodeId === T.complete;
    const previousIds = authored.scenes.slice(0, 13).map(row => row.id);
    const prerequisite = prior.progress({ ...state, session: null, pendingScene: null, mode: 'town',
      town: { ...state.town, mapDefinitionId: TEAM.map }, progress: { ...p, storyNodeId: MORNING.story,
        native: { ...p.native, scenarios: { ...p.native.scenarios, MAIN: { chapter: 3, step: 5 } } },
        clears: Object.fromEntries(Object.entries(p.clears).filter(([id]) => id === 'tiny-woods')),
        statistics: { ...p.statistics, rescuesCompleted: 1 },
        seenScenes: Object.fromEntries(Object.entries(p.seenScenes).filter(([id]) => previousIds.some(key => key === id))),
        appliedGrants: p.appliedGrants.slice(0, 9) } });
    if (!prerequisite.ok) {
      if (prerequisite.kind === 'invalid') for (const issue of prerequisite.issues) r.check(false, issue.path, issue.message);
      else for (const id of prerequisite.requirementIds) r.need(id);
    }
    r.check(equal(p.native, { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: complete ? { chapter: 4, step: 0 } : { chapter: 3, step: 6 } } }), '/native', 'Departure owns MAIN(3,6); only the completed evening owns MAIN(4,0).');
    r.check(p.statistics.expeditions >= 2 && p.statistics.rescuesCompleted === (success ? 2 : 1) && state.town.day === 1 && state.pendingResult === null, '', 'First request owns exactly one extra rescue, no unrelated result or next day.');
    const clear = p.clears[T.dungeonId];
    r.check(Object.keys(p.clears).length === (success ? 2 : 1) && (success ? clear?.clearCount === 1 && equal(clear.reachedFloorIds, T.floors) && clear.firstClearRevision === clear.lastClearRevision && clear.firstClearRevision === p.seenScenes[T.rescue]?.lastRevision && clear.firstClearDay === 1 && clear.lastClearDay === 1 : !clear), '/clears', 'Only acknowledged rescue settles the complete five-floor expedition once.');
    const extras = success ? [T.rescue, ...(complete || scene?.sceneId === T.evening ? [T.reward] : []), ...(complete ? [T.evening] : [])] : [];
    r.check(Object.keys(p.seenScenes).length === previousIds.length + extras.length, '/seenScenes', 'No missing or future story completion is admitted.');
    let previous = p.seenScenes[MORNING.scenes[6] ?? '']?.lastRevision ?? -1;
    for (const id of extras) {
      const visit = p.seenScenes[id];
      r.check(visit && visit.sceneId === id && visit.count === 1 && visit.firstRevision === visit.lastRevision && visit.firstRevision > previous && visit.lastRevision <= state.revision && visit.firstDay === 1 && visit.lastDay === 1, '/seenScenes', 'Thunderwave scenes complete once in order on the request day.');
      previous = visit?.lastRevision ?? previous;
    }
    const rewarded = extras.includes(T.reward), receipt = p.appliedGrants[9];
    r.check(p.appliedGrants.length === (rewarded ? 10 : 9) && (!rewarded || receipt?.grantId === T.grant && receipt.revision === p.seenScenes[T.reward]?.lastRevision && receipt.day === 1), '/appliedGrants', 'Reward receipt belongs exactly to the acknowledged cave-entry thanks.');
    if (session) {
      r.check(!success && session.dungeonId === T.dungeonId && session.purpose.kind === 'story' && session.purpose.storyNodeId === T.story && equal(session.visitedFloorIds, T.floors.slice(0, session.visitedFloorIds.length)) && session.visitedFloorIds.length >= 1 && session.visitedFloorIds.length <= 5 && session.floor.location.kind === 'exploration' && session.floor.location.address.floorId === session.visitedFloorIds.at(-1), '/session', 'The single active request visits its five source floors in order.');
      r.check(scene ? state.mode === 'scene' && scene.sceneId === T.rescue : state.mode === 'dungeon', '/mode', 'Only final rescue pauses this expedition.');
    } else r.check(complete ? state.mode === 'town' && !scene : success ? state.mode === 'scene' && scene?.sceneId === (rewarded ? T.evening : T.reward) : state.mode === 'town' && !scene, '/mode', 'Return, retry and completion each retain their exact resumable boundary.');
    if (scene) r.check((success ? scene.entryRevision === previous : scene.entryRevision > previous) && scene.entryRevision <= state.revision && state.revision - scene.entryRevision >= scene.cursor, '/pendingScene', 'Scene cursor and entry follow their prerequisite transaction.');
    const map = complete || !session && !success ? MORNING.interior : scene?.sceneId === T.reward ? T.entrance : TEAM.map;
    r.check(state.town.mapDefinitionId === map, '/town/mapDefinitionId', 'Success returns via the cave entrance and base; failures return to the interior.');
    return r.result();
  },
  town(town, state) {
    if (![T.story, T.returned, T.complete].includes(state.progress.storyNodeId)) return prior.town(town, state);
    const r = diagnostics();
    const inside = town.mapDefinitionId === MORNING.interior;
    const placements = inside ? [{ reference: { kind: 'pokemon', pokemonId: state.profile.heroId }, ...MORNING.hero }] : [{ reference: { kind: 'pokemon', pokemonId: state.profile.heroId }, ...TEAM.hero }, { reference: { kind: 'pokemon', pokemonId: state.profile.partnerId }, ...TEAM.partner }];
    r.check(town.day === 1 && town.serviceStock.length === 0 && equal(town.placements, placements), '', 'Story ground staging preserves the original pair; no new member or service is created.');
    return r.result();
  },
  scene(scene, state) {
    if (![T.rescue, T.reward, T.evening].includes(scene.sceneId)) return prior.scene(scene, state);
    const r = diagnostics(), script = authored.scenes.find(row => row.id === scene.sceneId);
    r.check(script && scene.cursor >= 0 && scene.cursor < script.lines.length && scene.awaiting.kind === 'advance' && scene.choices.length === 0 && equal(scene.continuation, script.continuation), '', 'Request scenes use exact authored advance-only cursors.');
    r.check(scene.bindings.length === 2 && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.heroRoleId && row.pokemonId === state.profile.heroId) && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.partnerRoleId && row.pokemonId === state.profile.partnerId), '/bindings', 'Clients are scene actors, never fabricated roster recruits.');
    if (scene.sceneId === T.rescue) {
      const s = state.session, action = s?.scheduler.continuation.action, exit = action?.kind === 'exit' ? s?.floor.exits[action.exitId] : null, leader = s?.actors[s.leaderActorId];
      r.check(state.progress.storyNodeId === T.story && s?.floor.location.kind === 'exploration' && s.floor.location.address.floorId === T.floors[4] && s.scheduler.continuation.terminal === 'dungeon-exit' && leader?.placement.kind === 'map' && exit && equal(exit.position, leader.placement.position), '', 'Separate rescue scene is entered only from the leader-owned fifth-floor stairs.');
    } else r.check(state.progress.storyNodeId === T.returned && state.session === null, '', 'Thanks and evening follow settled rescue.');
    return r.result();
  },
}; }
