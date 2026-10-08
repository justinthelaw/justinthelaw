import { caterpieExitReady } from './escort-work-scenes.js';
import { friendsGroundReady, travelFriends } from './escort-friends.js';
import { meaniesExitReady } from './escort-meanies-scenes.js';
import { STEEL } from '../../../content/authored/mt-steel.js';
import { WORK } from '../../../content/authored/early-work.js';
import { initializeEarlyWork } from './job-records.js';
import { TOWN, placeInTown } from '../../../content/authored/town.js';
import { THUNDERWAVE as T } from '../../../content/authored/thunderwave.js';
import { MORNING } from '../../../content/authored/first-morning.js';
import { TEAM } from '../../../content/authored/team-formation.js';
import { requestScene } from './scenes.js';
import { blocked } from './support.js';
import { refreshTownShops, shopOrderProblem, applyShopOrder } from './town-shop.js';
import { economyOrderProblem, applyEconomyOrder } from './town-economy.js';
/** @param {import('../../contracts/campaign.js').CampaignSnapshot} state */
export function townReady(state) { return (friendsGroundReady(state) || state.progress.storyNodeId === TOWN.story || state.progress.storyNodeId === WORK.story && WORK.scenes.every(id => state.progress.seenScenes[id]?.count === 1) || state.progress.storyNodeId === STEEL.story && state.steel?.phase === 'ready') && state.mode === 'town' && !state.session && !state.pendingScene && !state.pendingResult && !state.earlyWork?.returned && !state.earlyWork?.reward && !state.earlyWork?.clientPrompt && state.progress.seenScenes[TOWN.scenes[3] ?? '']?.count === 1; }
/** @param {import('./support.js').Catalogs} catalogs @param {import('../../../content/authored/opening.js').AuthoredOpening} authored
 * @returns {import('../turns/types.js').CommandHandlers} */
export function townHandlers(catalogs, authored) { return {
  beginTown: {
    plan: state => state.mode === 'town' && state.progress.storyNodeId === T.complete && !state.session && !state.pendingScene ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' },
    apply(context) {
      const state = context.state, script = authored.scenes.find(row => row.id === TOWN.scenes[0]); if (!script) return blocked('town-dream-script');
      state.progress.storyNodeId = TOWN.story; state.progress.native.scenarios.MAIN = { chapter: 4, step: 1 }; state.progress.native.clearCount = 0;
      state.progress.native.scalars.warpLock = 0; state.town.day = 2; placeInTown(state, MORNING.interior);
      refreshTownShops(state, catalogs); initializeEarlyWork(state, state.revision + 1); requestScene(context, authored, script);
      return { kind: 'changed', resumeDungeon: false };
    },
  },
  townTravel: {
    plan(state, intent) { return intent.type === 'townTravel' && ((meaniesExitReady(state) || caterpieExitReady(state)) && intent.mapId === TEAM.map || friendsGroundReady(state) || townReady(state) && [TOWN.square, TOWN.post, TEAM.map, MORNING.interior].includes(intent.mapId)) ? { kind: 'mutation' } : { kind: 'rejected', reason: 'unavailable' }; },
    apply(context, intent) {
      if (intent.type !== 'townTravel') return { kind: 'rejected', reason: 'invalid-command' };
      if (context.state.friends) return travelFriends(context, authored, intent.mapId) ? { kind: 'changed', resumeDungeon: false } : { kind: 'rejected', reason: 'unavailable' };
      if (context.state.town.mapDefinitionId === intent.mapId) return { kind: 'unchanged' };
      placeInTown(context.state, intent.mapId); return { kind: 'changed', resumeDungeon: false };
    },
  },
  townService: {
    plan(state, intent) {
      if (intent.type !== 'townService' || !townReady(state) || state.town.mapDefinitionId !== TOWN.square) return { kind: 'rejected', reason: 'unavailable' };
      const order = intent.order;
      if (!order || !['bank','storage-deposit','storage-withdraw','buy','sell'].includes(order.kind)) return { kind: 'rejected', reason: 'invalid-command' };
      const problem = order.kind === 'buy' || order.kind === 'sell' ? shopOrderProblem(state, order, catalogs) : economyOrderProblem(state, order, catalogs);
      return problem ? { kind: 'rejected', reason: 'unavailable' } : { kind: 'mutation' };
    },
    apply(context, intent) {
      if (intent.type !== 'townService') return { kind: 'rejected', reason: 'invalid-command' };
      return intent.order.kind === 'buy' || intent.order.kind === 'sell' ? applyShopOrder(context, intent.order, catalogs) : applyEconomyOrder(context, intent.order, catalogs);
    },
  },
}; }
