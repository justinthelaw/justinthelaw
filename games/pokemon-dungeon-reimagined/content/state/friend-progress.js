import { checkWorkOwners, workJobPolicy } from './friend-jobs.js';
import { FRIENDS, FRIEND_AREA_FACTS, areaMapId, friendAreaMap, placeFriendsGround } from '../authored/friends.js';
import { STEEL } from '../authored/mt-steel.js';
import { TOWN } from '../authored/town.js';
import { TEAM } from '../authored/team-formation.js';
import { MORNING, placeInside } from '../authored/first-morning.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';
import { DEFAULT_IQ } from './opening-facts.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { steelSame as same, steelAppend as append } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** The previous Steel history is immutable; new ground refreshes have separate
 * posting ownership. Project only the already validated successor extensions.
 * @param {import('../../src/contracts/campaign.js').CampaignState} state */
export function friendPrerequisite(state) {
  const f = state.friends, p = state.progress, pair = [state.profile.heroId, state.profile.partnerId];
  const projected = { ...state, friends: null, pendingScene: null, pendingResult: null, session: null, moveState: null, mode: /** @type {const} */ ('town'),
    roster: Object.fromEntries(Object.entries(state.roster).filter(([id]) => pair.some(key => key === id))), selectedPartyIds: pair,
    town: { ...state.town, day: state.steel?.requestDay ?? state.town.day },
    speciesSeen: state.speciesSeen ? { ...state.speciesSeen, identities: state.speciesSeen.identities.filter(row => row.speciesId !== 'pokemon-081') } : undefined,
    earlyWork: state.earlyWork ? { ...state.earlyWork, boardJobIds: [], mailbox: [], returned: null, reward: null, clientPrompt: null } : null,
    progress: { ...p, storyNodeId: STEEL.complete, recruitedHistory: [state.profile.originalHeroIdentity, state.profile.originalPartnerIdentity],
      native: { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 5, step: 0 } }, flags: { ...INITIAL_NATIVE_PROGRESS.flags, persistent: [true, true, ...INITIAL_NATIVE_PROGRESS.flags.persistent.slice(2)] } },
      jobs: Object.fromEntries(Object.entries(p.jobs).filter(([,job]) => job.phase.kind === 'claimed' && job.phase.claimedRevision < (f?.startedRevision ?? 0))), acceptedJobIds: [],
      statistics: { jobsCompleted: f?.priorJobs ?? p.statistics.jobsCompleted, rescuesCompleted: 3, expeditions: f?.priorExpeditions ?? p.statistics.expeditions }, rankPoints: (f?.priorJobs ?? p.statistics.jobsCompleted) * 5,
      seenScenes: Object.fromEntries(Object.entries(p.seenScenes).filter(([id]) => !FRIENDS.scenes.some(key => key === id))),
      appliedGrants: p.appliedGrants.filter(row => row.grantId !== FRIENDS.areaGrant && row.grantId !== FRIENDS.grant) } };
  placeInside(projected); return projected;
}
/** @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @param {import('../authored/opening.js').AuthoredOpening} authored @returns {Partial<Policies>} */
export function friendPolicies(prior, catalogs, authored) { return {
  job: workJobPolicy(prior),
  progress(state) {
    const r = diagnostics(), f = state.friends, p = state.progress;
    if (!f) { r.check(f === null, '/friends', 'Current saves require an explicit pre-onboarding null owner.'); append(r, prior.progress(state)); return r.result(); }
    append(r,checkWorkOwners(state,catalogs));
    r.check(!state.earlyWork?.returned && !state.earlyWork?.reward && !state.earlyWork?.clientPrompt, '/earlyWork', 'Onboarding cannot own unfinished station or dungeon dialogues.');
    const phases = ['dream', 'morning-ready', 'morning', 'tour', 'welcome', 'encounter-ready', 'encounter', 'rest', 'work-three'];
    const at = phases.indexOf(f.phase), completed = at < 1 ? 0 : at < 3 ? 1 : at < 5 ? 2 : at < 7 ? 3 : at < 8 ? 4 : 5;
    r.check(at >= 0 && state.steel?.phase === 'complete' && p.storyNodeId === FRIENDS.story && !state.session && !state.pendingResult && state.moveState === null, '/friends', 'This successor admits actual onboarding and ground preparation only.');
    r.check(bounded(f.startedRevision, (p.seenScenes[STEEL.scenes[8] ?? '']?.lastRevision ?? state.revision) + 1, state.revision) && f.startedDay === (state.steel?.requestDay ?? -1) + 1 && f.priorExpeditions === p.statistics.expeditions && f.priorJobs === p.statistics.jobsCompleted, '/friends', 'Onboarding starts after the completed Steel rescue and preserves its historical totals.');
    r.check(state.town.day === f.startedDay + Number(at === 8) && p.statistics.rescuesCompleted === 3 && p.rankPoints === f.priorJobs * 5, '/town/day', 'Only the actual rest advances this ground interval day.');
    const step = at === 0 ? 1 : at < 3 ? 2 : at < 5 ? 3 : at < 8 ? 4 : 5;
    const expectedNative = { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 5, step } }, flags: { ...INITIAL_NATIVE_PROGRESS.flags, persistent: [true, true, ...INITIAL_NATIVE_PROGRESS.flags.persistent.slice(2)] }, scalars: { ...INITIAL_NATIVE_PROGRESS.scalars, warpLock: at >= 3 && at <= 6 ? 4 : 0 } };
    r.check(same(p.native, expectedNative), '/native', 'Each MAIN substage resets CLEAR_COUNT; the tour lock lasts through the Square encounter.');
    let revision = f.startedRevision - 1;
    for (const [i,id] of FRIENDS.scenes.entries()) {
      const visit = p.seenScenes[id];
      if (i >= completed) r.check(!visit, '/seenScenes', 'Future scenes have no fabricated receipt.');
      else { r.check(visit && visit.count === 1 && visit.firstRevision === visit.lastRevision && bounded(visit.lastRevision, revision + 1, state.revision) && visit.firstDay === f.startedDay && visit.lastDay === f.startedDay, '/seenScenes', 'Completed onboarding scenes form one ordered same-day prefix.'); revision = visit?.lastRevision ?? revision; }
    }
    const sceneIndex = ({ dream: 0, morning: 1, welcome: 2, encounter: 3, rest: 4 })[/** @type {'dream'|'morning'|'welcome'|'encounter'|'rest'} */ (f.phase)];
    r.check(sceneIndex === undefined ? state.mode === 'town' && !state.pendingScene : state.mode === 'scene' && state.pendingScene?.sceneId === FRIENDS.scenes[sceneIndex], '/pendingScene', 'Each native scene boundary has its exact pending script.');
    const cursor = state.pendingScene?.cursor ?? -1, firstFree = at > 4 || at === 4 && cursor >= 2, allFree = at > 4 || at === 4 && cursor >= 4;
    const areaReceipt = p.appliedGrants.filter(row => row.grantId === FRIENDS.areaGrant), enrollment = p.appliedGrants.filter(row => row.grantId === FRIENDS.grant);
    r.check(areaReceipt.length === Number(allFree) && areaReceipt.every(row => row.day === f.startedDay && bounded(row.revision, state.pendingScene?.sceneId === FRIENDS.scenes[2] ? (state.pendingScene?.entryRevision ?? 0) + 4 : p.seenScenes[FRIENDS.scenes[1] ?? '']?.lastRevision ?? f.startedRevision, state.revision)), '/appliedGrants', 'The free-area delivery has one persisted receipt at the naming/enrollment convergence.');
    r.check(enrollment.length === Number(f.magnemiteId !== null) && enrollment.every(row => row.day === f.startedDay && row.revision === areaReceipt[0]?.revision), '/appliedGrants', 'Magnemite and Power Plant commit once in the same naming-convergence transaction.');
    r.check(at === 4 && cursor === 3 ? f.nicknamePrompt !== null && !f.magnemiteId : f.nicknamePrompt === null && (at < 4 || at === 4 && cursor < 3 ? !f.magnemiteId : !!f.magnemiteId), '/nicknamePrompt', 'Naming is a persisted choice before the Power Plant/enrollment transaction; it is not a join-or-decline prompt.');
    const enrolled = f.magnemiteId ? state.roster[f.magnemiteId] : null;
    r.check(!f.magnemiteId || f.magnemiteId !== state.profile.heroId && f.magnemiteId !== state.profile.partnerId, '/magnemiteId', 'The story enrollment has an identity distinct from both original starters.');
    r.check(!enrolled || enrolled.identity.speciesId === 'pokemon-081' && enrolled.identity.formId === null && enrolled.origin.kind === 'scripted' && enrolled.origin.grantId === FRIENDS.grant, '/magnemiteId', 'Any living enrollment record must bind the exact story Magnemite identity and grant.');
    r.check(at !== 4 || !f.magnemiteId || !!enrolled, '/roster', 'Enrollment remains present throughout its naming scene.');
    r.check((state.speciesSeen?.identities.filter(row => row.speciesId === 'pokemon-081').length ?? 0) === Number(!!f.magnemiteId), '/speciesSeen', 'Story Magnemite becomes seen exactly once upon enrollment.');
    if (completed >= 3) r.check((enrollment[0]?.revision ?? 0) < (p.seenScenes[FRIENDS.scenes[2] ?? '']?.lastRevision ?? 0), '/appliedGrants', "Enrollment commits before Wigglytuff's final acknowledgment.");
    r.check(at <= 4 || !!f.magnemiteId, '/magnemiteId', 'Enrollment finishes before leaving Wigglytuff.');
    const expectedHistory = [state.profile.originalHeroIdentity, state.profile.originalPartnerIdentity, ...(f.magnemiteId ? [{ speciesId: 'pokemon-081', formId: null }] : [])];
    r.check(same(p.recruitedHistory, expectedHistory), '/recruitedHistory', 'The story gift remains in acquisition history after a voluntary farewell.');
    const extra = Object.values(state.roster).filter(row => row.pokemonId !== state.profile.heroId && row.pokemonId !== state.profile.partnerId);
    r.check(extra.length <= Number(!!f.magnemiteId) && extra.every(row => row.pokemonId === f.magnemiteId), '/roster', "Only the exact enrollment creates this interval's additional resident.");
    r.check(state.selectedPartyIds[0] === state.profile.heroId && state.selectedPartyIds[1] === state.profile.partnerId && state.selectedPartyIds.length <= 4 && state.selectedPartyIds.reduce((sum,id) => { const row = state.roster[id]; return sum + (row ? catalogs.species.getProfile(row.identity.speciesId, row.identity.formId).bodySize : 99); },0) <= 6, '/selectedPartyIds', 'The original pair stays selected; town invitations respect four slots and six body units.');
    const areas = [...new Set([catalogs.species.getProfile(state.profile.originalHeroIdentity.speciesId,state.profile.originalHeroIdentity.formId).friendAreaId, catalogs.species.getProfile(state.profile.originalPartnerIdentity.speciesId,state.profile.originalPartnerIdentity.formId).friendAreaId])];
    for (const id of FRIENDS.freeAreas.slice(0, allFree ? 3 : firstFree ? 2 : 0)) if (!areas.some(key => key === id)) areas.push(/** @type {import('../../src/contracts.js').FriendAreaId} */ (id));
    revision = p.seenScenes[FRIENDS.scenes[2] ?? '']?.lastRevision ?? state.revision;
    for (const purchase of f.purchases) { const area = FRIEND_AREA_FACTS.find(row => row.id === purchase.areaId); r.check(at >= 5 && area?.unlock === 'shop_story' && area.price === purchase.price && !areas.includes(purchase.areaId) && bounded(purchase.revision, revision + 1, state.revision), '/purchases', 'Each current-story area purchase has its native price and one ordered receipt.'); areas.push(purchase.areaId); revision = purchase.revision; }
    r.check(same(areas,state.economy.ownedFriendAreaIds), '/ownedFriendAreaIds', 'Owned areas are the ordered starter union, free gifts and exact purchases.');
    for (const job of Object.values(p.jobs)) {
      const phase = job.phase, source = job.source;
      if (source.kind === 'generated' && source.generationPolicyId === 'browser-friend-native-jobs-v1') r.check('posting' in source && source.posting === 'board' && source.generatedDay === f.startedDay && phase.kind === 'offered', '/jobs', 'Onboarding owns only fresh board postings; no new receipt or acceptance is fabricated.');
      else if (phase.kind === 'claimed') r.check(phase.claimedRevision < f.startedRevision, '/jobs', 'Prior claimed work precedes onboarding.');
      else if (phase.kind === 'accepted' || phase.kind === 'suspended') r.check(phase.acceptedRevision < f.startedRevision, '/jobs', 'Retained accepted work precedes onboarding.');
      else if (phase.kind === 'failed') r.check(phase.failedRevision < f.startedRevision, '/jobs', 'Retained failed work precedes onboarding.');
    }
    append(r, prior.progress(friendPrerequisite(state))); return r.result();
  },
  town(town,state) {
    if (!state.friends) return prior.town(town,state);
    const r = diagnostics(), area = FRIEND_AREA_FACTS.find(row => row.id && areaMapId(row.id) === town.mapDefinitionId), phase = state.friends.phase;
    const expectedMap = ({ dream: MORNING.interior, 'morning-ready': MORNING.interior, morning: TEAM.map, welcome: TOWN.square, encounter: TOWN.square, rest: MORNING.interior })[/** @type {'dream'|'morning-ready'|'morning'|'welcome'|'encounter'|'rest'} */ (phase)];
    r.check(expectedMap ? town.mapDefinitionId === expectedMap : area?.id ? state.progress.native.scenarios.MAIN.step >= 4 && state.economy.ownedFriendAreaIds.some(id => id === area.id) : (phase === 'tour' ? [TEAM.map,TOWN.square] : [TEAM.map,TOWN.square,TOWN.post,MORNING.interior]).includes(town.mapDefinitionId), '/mapDefinitionId', 'Normal ground dispatch and owned-area travel obey the tour lock.');
    const projection = { ...state,town: { ...town } }; placeFriendsGround(projection,town.mapDefinitionId);
    const hero = town.placements.find(row => row.reference.kind === 'pokemon' && row.reference.pokemonId === state.profile.heroId);
    const expectedHero = projection.town.placements.find(row => row.reference.kind === 'pokemon' && row.reference.pokemonId === state.profile.heroId);
    if (hero && expectedHero && (area?.id || town.mapDefinitionId === TOWN.square)) { const pos = hero.position; r.check(area?.id ? friendAreaMap(area.id).tiles[pos.z]?.[pos.x] === 'floor' : pos.x >= 1 && pos.z >= 1 && pos.x < TOWN.width-1 && pos.z < TOWN.height-1, '/placements', 'Ground explorer stays on a navigable cell.'); expectedHero.position = hero.position; expectedHero.facing = hero.facing; }
    r.check(same(town.placements,projection.town.placements) && new Set(town.placements.map(row => `${row.position.x}:${row.position.z}`)).size === town.placements.length, '/placements', 'Residents and active companions retain canonical placements without overlap.');
    const old = friendPrerequisite(state); append(r,prior.town(old.town,old)); return r.result();
  },
  pokemon(record,state,scope) {
    if (record.origin.kind !== 'scripted' || record.origin.grantId !== FRIENDS.grant) return prior.pokemon(record,state,scope);
    const r = diagnostics(), profile = catalogs.species.getProfile('pokemon-081',null), growth = catalogs.species.getGrowthAtLevel(profile.id,6);
    r.check(state.friends?.magnemiteId === record.pokemonId && state.progress.appliedGrants.some(row => row.grantId === FRIENDS.grant) && record.identity.speciesId === 'pokemon-081' && record.identity.formId === null && record.origin.metLevel === 6 && record.evolutionHistory.length === 0, '/origin', 'The source Square origin70 maps to the exact one-time story grant.');
    r.check(record.growth.level === 6 && record.growth.totalExperience.numerator === growth.cumulativeExperience && record.growth.totalExperience.denominator === 1 && same(record.growth.naturalStats,growth.stats) && Object.values(record.growth.permanentStatBonuses).every(value => value === 0) && record.growth.iqPoints === 1, '/growth', 'Story Magnemite begins at its sourced natural level6 stats and EXP.');
    r.check(same(record.moves.slots.map(slot => slot?.moveId ?? null),[...FRIENDS.magnemiteMoves,null]) && record.moves.slots.every(slot => !slot || slot.powerBoost === 0 && slot.ppCapacityBonus === 0) && record.moves.links.length === 0 && record.moves.setMoveSlotId === null && record.tacticId === 'tactic-lets-go-together', '/moves', 'Story gift preserves native move order and tactic settings.');
    if (state.friends?.phase === 'welcome') r.check(same(record.enabledIqSkillIds,DEFAULT_IQ), '/enabledIqSkillIds', 'Enrollment starts with the exact source defaults; later resident switches use the shared threshold/group admission.');
    append(r,prior.pokemon(record,state,scope),[`P19:pokemon-grant:${FRIENDS.grant}`]); return r.result();
  },
  scene(scene,state) {
    if (!FRIENDS.scenes.includes(scene.sceneId)) return prior.scene(scene,state);
    const r = diagnostics(), script = authored.scenes.find(row => row.id === scene.sceneId);
    r.check(state.friends && script && bounded(scene.cursor,0,script.lines.length-1) && scene.awaiting.kind === 'advance' && scene.choices.length === 0 && same(scene.continuation,script.continuation) && bounded(scene.entryRevision,state.friends.startedRevision,state.revision) && state.revision-scene.entryRevision >= scene.cursor, '', 'The authored scene keeps its exact persisted cursor, continuation and entry.');
    r.check(scene.bindings.length === 2 && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.heroRoleId && row.pokemonId === state.profile.heroId) && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.partnerRoleId && row.pokemonId === state.profile.partnerId), '/bindings', 'The scenes bind the original pair without converting visiting characters into recruits.'); return r.result();
  },
}; }
