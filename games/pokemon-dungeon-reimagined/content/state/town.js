import { TOWN, placeInTown } from '../authored/town.js';
import { THUNDERWAVE as T } from '../authored/thunderwave.js';
import { MORNING } from '../authored/first-morning.js';
import { TEAM } from '../authored/team-formation.js';
import { INITIAL_NATIVE_PROGRESS } from '../authored/opening.js';
import { TOWN_SHOP_POOLS } from '../authored/town-shop-facts.js';
import { diagnostics } from './pokemon-rules.js';
import { fingerprint } from '../../src/domain/state/relations.js';
import { cleanTemplate } from './item-template.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {unknown} a @param {unknown} b */ const equal = (a,b) => fingerprint(a) === fingerprint(b);
/** Finite first town day. Jobs/next mornings have no permissive policy fallback.
 * @param {import('../authored/opening.js').AuthoredOpening} authored @param {Policies} prior
 * @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Pick<Policies,'progress'|'town'|'scene'>} */
export function withTownPolicies(authored, prior, catalogs) { return {
  progress(state) {
    if (state.progress.storyNodeId !== TOWN.story) return prior.progress(state);
    const p = state.progress, r = diagnostics(), scene = state.pendingScene;
    const completed = TOWN.scenes.filter(id => p.seenScenes[id]);
    const index = completed.length;
    r.check(equal(completed, TOWN.scenes.slice(0, index)), '/seenScenes', 'Town introduction completes in order.');
    const preceding = prior.progress({ ...state, mode: 'town', pendingScene: null,
      town: { ...state.town, day: 1, mapDefinitionId: MORNING.interior, serviceStock: [] },
      progress: { ...p, storyNodeId: T.complete, native: { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 4, step: 0 } } }, seenScenes: Object.fromEntries(Object.entries(p.seenScenes).filter(([id]) => !TOWN.scenes.some(key => key === id))) } });
    if (!preceding.ok) {
      if (preceding.kind === 'invalid') for (const issue of preceding.issues) r.check(false, issue.path, issue.message);
      else for (const id of preceding.requirementIds) r.need(id);
    }
    const step = index === 0 ? 1 : index < 3 ? 2 : index === 3 ? 3 : 4;
    r.check(equal(p.native, { ...INITIAL_NATIVE_PROGRESS, scenarios: { ...INITIAL_NATIVE_PROGRESS.scenarios, MAIN: { chapter: 4, step } }, scalars: { ...INITIAL_NATIVE_PROGRESS.scalars, warpLock: step === 3 ? 3 : 0 } }), '/native', 'The town tour follows MAIN(4,1) through (4,4), with the post-office warp lock and no job count.');
    r.check(state.town.day === 2 && state.session === null && state.pendingResult === null, '', 'Town introduction is one ground day, without an expedition or reward result.');
    let previous = p.seenScenes[T.evening]?.lastRevision ?? -1;
    for (const id of completed) {
      const visit = p.seenScenes[id];
      r.check(visit && visit.count === 1 && visit.firstRevision === visit.lastRevision && visit.firstRevision > previous && visit.lastRevision <= state.revision && visit.firstDay === 2 && visit.lastDay === 2, '/seenScenes', 'Town scenes have ordered, once-only receipts.');
      previous = visit?.lastRevision ?? previous;
    }
    r.check(index < 4 ? state.mode === 'scene' && scene?.sceneId === TOWN.scenes[index] : state.mode === 'town' && !scene, '/mode', 'Town intro resumes exactly its next authored scene.');
    if (scene) r.check((index === 0 ? scene.entryRevision > previous : scene.entryRevision === previous) && scene.entryRevision <= state.revision && state.revision - scene.entryRevision >= scene.cursor, '/pendingScene', 'Town scene cursor follows its entry revision.');
    const map = index === 0 ? MORNING.interior : index === 1 ? TEAM.map : index === 2 ? TOWN.square : TOWN.post;
    r.check(index < 4 ? state.town.mapDefinitionId === map : [TEAM.map, MORNING.interior, TOWN.square, TOWN.post].includes(state.town.mapDefinitionId), '/town', 'Travel stays within the introduced ground maps.');
    return r.result();
  },
  scene(scene, state) {
    if (!TOWN.scenes.includes(scene.sceneId)) return prior.scene(scene, state);
    const r = diagnostics(), script = authored.scenes.find(row => row.id === scene.sceneId);
    r.check(state.progress.storyNodeId === TOWN.story && script && scene.cursor >= 0 && scene.cursor < script.lines.length && scene.awaiting.kind === 'advance' && !scene.choices.length && equal(scene.continuation, script.continuation), '', 'Town scene uses the exact authored cursor and continuation.');
    r.check(scene.bindings.length === 2 && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.heroRoleId && row.pokemonId === state.profile.heroId) && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.partnerRoleId && row.pokemonId === state.profile.partnerId), '/bindings', 'Town roles bind the original individuals.');
    return r.result();
  },
  town(town, state) {
    if (state.progress.storyNodeId !== TOWN.story) return prior.town(town, state);
    const r = diagnostics();
    const projection = { ...state, town: { ...town } }; placeInTown(projection, town.mapDefinitionId);
    r.check(town.day === 2 && equal(town.placements, projection.town.placements), '/placements', 'Ground positions follow the selected town location.');
    r.check(town.serviceStock.length === 2, '/serviceStock', 'Two independent Kecleon counters retain their sale lots.');
    for (const pool of TOWN_SHOP_POOLS) {
      const stock = town.serviceStock.find(row => row.serviceId === pool.serviceId);
      r.check(stock && 'lots' in stock && stock.kind === 'lots' && stock.stockRevision > (state.progress.seenScenes[T.evening]?.lastRevision ?? -1) && stock.stockRevision <= state.revision, '/serviceStock', 'Stock belongs to this town day and committed revision.');
      if (!stock || !('lots' in stock)) continue;
      r.check(stock.lots.length <= pool.slots, '/serviceStock', 'Stock cannot exceed the native number of sale slots.');
      for (const lot of stock.lots) {
        const row = pool.items.find(row => row.itemId === lot.template.itemId);
        const item = catalogs.effects.getItem(lot.template.itemId);
        r.check(row && equal(lot.template, cleanTemplate(catalogs, lot.template.itemId)) && (item.spawnStackRange && ['thrown_line', 'thrown_arc'].includes(item.category) ? lot.quantity >= (item.spawnStackRange[0] ?? 0) && lot.quantity < (item.spawnStackRange[1] ?? 0) : lot.quantity === 1), '/serviceStock/lots', 'Every lot is a clean first-tier source stock item with its own native quantity.');
      }
    }
    return r.result();
  },
}; }
