import { refreshTownShops } from './town-shop.js';
import { refreshGroundJobs } from './job-records.js';
import { blocked } from './support.js';
/** The ground-return refresh owns shops, board/mail scheduling, then toolbox
 * cleanup. It is not a floor transition or an implicit day increment.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {import('./support.js').Catalogs} catalogs */
export function refreshGround(state, catalogs) {
  const work = state.earlyWork, bag = state.containers[state.economy.toolbox];
  if (!work || !bag) return blocked('ground-refresh-owner');
  refreshTownShops(state, catalogs); refreshGroundJobs(state, work);
  for (const id of bag.itemIds) {
    const item = state.items[id]; if (!item) return blocked('ground-refresh-item');
    item.template.sticky = false;
  }
}
