import { rewardItemChoiceProblem } from '../domain/gameplay/reward-items.js';
/** Shared read-only full-bag/full-storage reward choices. The caller binds show
 * and send to its actual snapshot, panel and adventure epoch.
 * @param {{snapshot:import('../contracts/campaign.js').CampaignSnapshot,grant:Readonly<import('../contracts/campaign.js').ItemGrant>,itemName:(id:string)=>string,show:(title:string,text:string,actions:import('../ui/view.js').Action[])=>void,send:(choice:import('../domain/gameplay/reward-items.js').RewardItemChoice)=>void,menu:()=>void}} options */
export function showRewardChoices({ snapshot, grant, itemName, show, send, menu }) {
  const label = `${itemName(grant.template.itemId)} ×${grant.quantity}`;
  /** @param {import('../domain/gameplay/reward-items.js').RewardItemChoice} choice @param {string} text */
  const confirm = (choice, text) => show('Confirm reward choice', text, [{ label: 'Confirm', run: () => send(choice) }, { label: 'Cancel', run: flow }]);
  function flow() {
    show('Make room for reward', `The toolbox and storage cannot hold ${label}. Choose a complete toolbox slot to replace, or decline this reward.`, [
      { label: 'Discard received item', run: () => confirm({ kind: 'discard-reward' }, `Discard the received ${label}?`) },
      ...(snapshot.containers[snapshot.economy.toolbox]?.itemIds.flatMap(id => {
        const item = snapshot.items[id]; if (!item) return [];
        const name = `${itemName(item.template.itemId)} ×${item.quantity}`;
        return [{ label: `Replace ${name}`, run: () => show('Choose replacement', `Make room for ${label} by removing the whole ${name} slot.`, [
          { label: 'Send to storage', disabled: !!rewardItemChoiceProblem(snapshot, grant, { kind: 'replace', itemInstanceId: id, operation: 'store' }), run: () => confirm({ kind: 'replace', itemInstanceId: id, operation: 'store' }, `Store ${name} and receive ${label}?`) },
          { label: 'Discard toolbox item', run: () => confirm({ kind: 'replace', itemInstanceId: id, operation: 'discard' }, `Discard ${name} and receive ${label}?`) }, { label: 'Cancel', run: flow },
        ]) }];
      }) ?? []), { label: 'Campaign & saves', run: menu },
    ]);
  }
  flow();
}
