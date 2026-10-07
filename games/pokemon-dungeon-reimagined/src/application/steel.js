import { STEEL } from '../../content/authored/mt-steel.js';
import { steelRewardItem } from '../domain/gameplay/steel.js';
import { showRewardChoices } from './reward-panel.js';
/** Shared canonical reward owner, with explicit discard/replace confirmations.
 * The shell binds these callbacks to the shown snapshot and adventure epoch.
 * @param {{snapshot:import('../contracts/campaign.js').CampaignSnapshot,view:ReturnType<typeof import('../ui/view.js').createView>,send:(intent:import('../domain/turns/types.js').Intent)=>void,saves:()=>void}} options */
export function showSteelReward({ snapshot, view, send, saves }) {
  const steel = snapshot.steel; if (!steel?.rewardChoice) return;
  const grant = steelRewardItem(steel.rewardCursor);
  /** @param {string} title @param {string} text @param {import('../ui/view.js').Action[]} actions */
  function show(title, text, actions) {
    let token = Symbol('pending'); token = view.show(title, text, actions.map(action => ({ ...action, run() { if (view.ownsPanel(token)) action.run(); } })));
  }
  showRewardChoices({ snapshot, grant, itemName: id => id.replace(/^item-/, '').replaceAll('-', ' '), show, menu: saves, send: choice => send({ type: 'steelRewardChoice', choice }) });
}
/** @param {import('../contracts/campaign.js').CampaignSnapshot} snapshot */
export const steelGroundBoundary = snapshot => snapshot.mode === 'town' && (snapshot.progress.storyNodeId === STEEL.story || snapshot.progress.storyNodeId === STEEL.complete);
