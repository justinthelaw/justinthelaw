import { FRIENDS, placeFriendsGround, areaMapId, friendAreaMap } from '../authored/friends.js';
import { FRIEND_AREA_FACTS } from '../authored/friend-area-facts.js';
import { placeMeaniesGround, ORDINARY_SUMMIT } from '../authored/steel-meanies.js';
import { placeCaterpieGround } from '../authored/escort-work.js';
import { TEAM } from '../authored/team-formation.js';
import { MORNING } from '../authored/first-morning.js';
import { TOWN } from '../authored/town.js';
import { TOWN_SHOP_POOLS } from '../authored/town-shop-facts.js';
import { THUNDERWAVE as T } from '../authored/thunderwave.js';
import { diagnostics, bounded } from './pokemon-rules.js';
import { cleanTemplate } from './item-template.js';
import { steelSame as same } from './steel-progress.js';
/** Direct actual ground/scene fields; complete raw history runs independently
 * before these callbacks. No day/resource/roster view is passed to an old town.
 * @typedef {import('../../src/contracts/campaign.js').CampaignState} State
 * @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** @param {import('./campaign.js').CampaignCatalogs} catalogs @returns {Policies['town']} */
export function escortTownPolicy(catalogs) { return (town,state) => {
  const r = diagnostics(),area = FRIEND_AREA_FACTS.find(row => row.id && areaMapId(row.id) === town.mapDefinitionId);
  r.check(area?.id ? state.economy.ownedFriendAreaIds.some(id => id === area.id) : [TEAM.map,MORNING.interior,TOWN.square,TOWN.post].includes(town.mapDefinitionId),'/mapDefinitionId','Actual later ground is an introduced town map or an actually owned Friend Area.');
  const expected = { ...state,town: { ...town } };
  if (state.friends?.phase === 'meanies') placeMeaniesGround(expected,state.pendingScene?.cursor ?? -1);
  else if (state.friends?.phase === 'caterpie') placeCaterpieGround(expected,state.pendingScene?.cursor ?? -1);
  else placeFriendsGround(expected,town.mapDefinitionId);
  const hero = town.placements.find(row => row.reference.kind === 'pokemon' && row.reference.pokemonId === state.profile.heroId),expectedHero = expected.town.placements.find(row => row.reference.kind === 'pokemon' && row.reference.pokemonId === state.profile.heroId);
  if (hero && expectedHero && (area?.id || town.mapDefinitionId === TOWN.square)) {
    const pos = hero.position;
    r.check(area?.id ? friendAreaMap(area.id).tiles[pos.z]?.[pos.x] === 'floor' : pos.x >= 1 && pos.z >= 1 && pos.x < TOWN.width-1 && pos.z < TOWN.height-1,'/placements','Actual explorer remains on the source-qualified browser navigable map.');
    expectedHero.position = hero.position; expectedHero.facing = hero.facing;
  }
  r.check(same(town.placements,expected.town.placements) && new Set(town.placements.map(row => `${row.position.x}:${row.position.z}`)).size === town.placements.length,'/placements','Actual residents, selected members and exact scene visitors keep distinct cursor-owned positions.');
  r.check(town.serviceStock.length === 2,'/serviceStock','Both actual Kecleon counters retain their sale lots.');
  for (const pool of TOWN_SHOP_POOLS) {
    const stock = town.serviceStock.find(row => row.serviceId === pool.serviceId);
    r.check(stock && 'kind' in stock && stock.kind === 'lots' && bounded(stock.stockRevision,(state.progress.seenScenes[T.evening]?.lastRevision ?? -1)+1,state.revision),'/serviceStock','Source first-tier sale lots retain their genuine refresh revision.');
    if (!stock || !('lots' in stock)) continue;
    r.check(stock.lots.length <= pool.slots,'/serviceStock','Actual remaining sale lots respect source slot capacity.');
    for (const lot of stock.lots) {
      const row = pool.items.find(entry => entry.itemId === lot.template.itemId),item = catalogs.effects.getItem(lot.template.itemId);
      r.check(row && same(lot.template,cleanTemplate(catalogs,lot.template.itemId)) && (item.spawnStackRange && ['thrown_line','thrown_arc'].includes(item.category) ? lot.quantity >= (item.spawnStackRange[0] ?? 0) && lot.quantity < (item.spawnStackRange[1] ?? 0) : lot.quantity === 1),'/serviceStock/lots','Every actual clean lot retains its sourced template/quantity without regenerating stock.');
    }
  }
  return r.result();
}; }
/** @param {import('../authored/opening.js').AuthoredOpening} authored @returns {Policies['scene']} */
export function escortScenePolicy(authored) { return (scene,state) => {
  const r = diagnostics(),script = authored.scenes.find(row => row.id === scene.sceneId);
  const allowed = [FRIENDS.scenes[5],FRIENDS.scenes[6],FRIENDS.scenes[7],FRIENDS.scenes[8],ORDINARY_SUMMIT];
  r.check(allowed.includes(scene.sceneId) && state.pendingScene === scene && script && scene.awaiting.kind === 'advance' && scene.choices.length === 0 && bounded(scene.cursor,0,script.lines.length-1) && same(scene.continuation,script.continuation) && bounded(scene.entryRevision,1,state.revision) && state.revision-scene.entryRevision >= scene.cursor,'/pendingScene','The actual authored chapter-work scene retains its exact exclusive cursor, entry and continuation.');
  r.check(scene.bindings.length === 2 && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.heroRoleId && row.pokemonId === state.profile.heroId) && scene.bindings.some(row => row.kind === 'pokemon' && row.roleId === authored.partnerRoleId && row.pokemonId === state.profile.partnerId),'/bindings','The original hero/partner bind these scenes; visitors never become fake recruited records.');
  const expected = ({ 'meanies-morning': FRIENDS.scenes[5],meanies: FRIENDS.scenes[6],'caterpie-morning': FRIENDS.scenes[7],caterpie: FRIENDS.scenes[8] })[/** @type {'meanies-morning'|'meanies'|'caterpie-morning'|'caterpie'} */ (state.friends?.phase ?? '')];
  if (scene.sceneId === ORDINARY_SUMMIT) r.check(state.session?.purpose.kind === 'ordinary' && scene.entryRevision > state.session.entry.entryRevision,'/entryRevision','Real ordinary summit scene is entered after its actual expedition.');
  else {
    const prior = scene.sceneId === FRIENDS.scenes[6] ? state.progress.seenScenes[FRIENDS.scenes[5] ?? ''] : scene.sceneId === FRIENDS.scenes[8] ? state.progress.seenScenes[FRIENDS.scenes[7] ?? ''] : null;
    const claims = Object.values(state.progress.jobs).flatMap(job => job.phase.kind === 'claimed' ? [job.phase.claimedRevision] : []);
    r.check(scene.sceneId === expected && !state.session && scene.entryRevision > (prior?.lastRevision ?? Math.max(0,...claims)),'/entryRevision','Actual outside ENTER_CONTROL follows inside acknowledgment; actual wakeup starts only after all claims.');
  }
  return r.result();
}; }
