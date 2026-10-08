import { rewardItemChoiceProblem } from '../domain/gameplay/reward-items.js';
/** Shared read-only full-bag/full-storage reward choices. The caller binds show
 * and send to its actual snapshot, panel and adventure epoch.
 * @param {{model:ReturnType<typeof import('./snapshot-panel.js').createSnapshotPanel>,grant:Readonly<import('../contracts/campaign.js').ItemGrant>,itemName:(id:string)=>string,send:(choice:import('../domain/gameplay/reward-items.js').RewardItemChoice)=>void,menu:()=>void}} options */
export function showRewardChoices({ model, grant, itemName, send, menu }) {
  const label = `${itemName(grant.template.itemId)} ×${grant.quantity}`;
  /** @param {import('../domain/gameplay/reward-items.js').RewardItemChoice} choice @param {string} text */
  const confirm = (choice, text) => {
    const problem = rewardItemChoiceProblem(model.snapshot(),grant,choice);
    model.show(() => confirm(choice,text),'Confirm reward choice',problem ?? text,[{ label: 'Confirm',disabled: !!problem,run: () => send(choice) }, { label: 'Cancel', run: flow }]);
  };
  /** @param {import('../contracts.js').ItemInstanceId} id */
  function replacement(id) {
    const snapshot = model.snapshot(),item = snapshot.items[id]; if (!item) return;
    const name = `${itemName(item.template.itemId)} ×${item.quantity}`;
    model.show(() => replacement(id),'Choose replacement',`Make room for ${label} by removing the whole ${name} slot.`,[
      { label: 'Send to storage',disabled: !!rewardItemChoiceProblem(snapshot,grant,{kind:'replace',itemInstanceId:id,operation:'store'}),run: () => confirm({kind:'replace',itemInstanceId:id,operation:'store'},`Store ${name} and receive ${label}?`) },
      { label: 'Discard toolbox item',run: () => confirm({kind:'replace',itemInstanceId:id,operation:'discard'},`Discard ${name} and receive ${label}?`) },{label:'Cancel',run:flow},
    ]);
  }
  function flow() {
    const snapshot = model.snapshot();
    model.show(flow,'Make room for reward', `The toolbox and storage cannot hold ${label}. Choose a complete toolbox slot to replace, or decline this reward.`, [
      { label: 'Discard received item', run: () => confirm({ kind: 'discard-reward' }, `Discard the received ${label}?`) },
      ...(snapshot.containers[snapshot.economy.toolbox]?.itemIds.flatMap(id => {
        const item = snapshot.items[id]; if (!item) return [];
        const name = `${itemName(item.template.itemId)} ×${item.quantity}`;
        return [{ label: `Replace ${name}`, run: () => replacement(id) }];
      }) ?? []), { label: 'Campaign & saves', run: menu },
    ]);
  }
  flow();
}
