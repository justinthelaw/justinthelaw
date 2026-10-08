import { refreshGround } from './ground-refresh.js';
import { refreshEscortJobs } from './escort-job-records.js';
import { refreshTownShops } from './town-shop.js';
import { ESCORT_WORK_REVISION } from '../state/escort-work-revision.js';
import { blocked } from './support.js';
/** Source shops then board/pending mail then actual bag cleanup. Only the real
 * second interval uses Bronze generation; first-work rank/draw order is retained.
 * @param {import('../../contracts/campaign.js').CampaignState} state
 * @param {import('./support.js').Catalogs} catalogs */
export function refreshEscortGround(state,catalogs) {
  if (state.contentRevision !== ESCORT_WORK_REVISION || state.friends?.phase !== 'work-two') return refreshGround(state,catalogs);
  const work = state.earlyWork,bag = state.containers[state.economy.toolbox];
  if (!work || !bag) return blocked('escort-ground-refresh-owner');
  refreshTownShops(state,catalogs); refreshEscortJobs(state,work);
  for (const id of bag.itemIds) { const item = state.items[id]; if (!item) return blocked('escort-ground-refresh-item'); item.template.sticky = false; }
}
