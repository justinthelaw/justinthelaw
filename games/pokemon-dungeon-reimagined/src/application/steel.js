import { STEEL } from '../../content/authored/mt-steel.js';
import { steelRewardItem } from '../domain/gameplay/steel.js';
import { showRewardChoices } from './reward-panel.js';
import { createSnapshotPanel } from './snapshot-panel.js';
/** Shared canonical reward owner, with explicit discard/replace confirmations.
 * The shell binds these callbacks to the shown snapshot and adventure epoch.
 * @param {{snapshot:import('../contracts/campaign.js').CampaignSnapshot,view:ReturnType<typeof import('../ui/view.js').createView>,send:(intent:import('../domain/turns/types.js').Intent,shown:import('../contracts/campaign.js').CampaignSnapshot)=>void,saves:()=>void,open:()=>void}} options */
export function showSteelReward({ snapshot, view, send, saves, open }) {
  const model = createSnapshotPanel({snapshot,view,send});
  snapshot = model.snapshot();
  const steel = snapshot.steel; if (!steel?.rewardChoice) return;
  const grant = steelRewardItem(steel.rewardCursor);
  open();
  showRewardChoices({ model, grant, itemName: id => id.replace(/^item-/, '').replaceAll('-', ' '), menu: saves, send: choice => model.send({ type: 'steelRewardChoice', choice }) });
}
/** @param {import('../contracts/campaign.js').CampaignSnapshot} snapshot */
export const steelGroundBoundary = snapshot => snapshot.mode === 'town' && (snapshot.progress.storyNodeId === STEEL.story || snapshot.progress.storyNodeId === STEEL.complete);
