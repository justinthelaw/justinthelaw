/** One retained menu model shared by its nested town/friends/work/reward views.
 * Only the view-owned current repaint supplies a canonical snapshot;
 * retired buttons keep their old token and cannot inherit the new authority.
 * @typedef {import('../contracts/campaign.js').CampaignSnapshot} Snapshot
 * @param {{snapshot:Snapshot,view:ReturnType<typeof import('../ui/view.js').createView>,send:(intent:import('../domain/turns/types.js').Intent,shown:Snapshot)=>void}} options */
export function createSnapshotPanel({snapshot,view,send}) {
  let current = snapshot;
  return {
    snapshot: () => current,
    /** @param {import('../domain/turns/types.js').Intent} intent */
    send(intent) { send(intent,current); },
    /** @param {()=>void} rebuild @param {string} title @param {string} text
     * @param {import('../ui/view.js').Action[]} actions @param {HTMLElement[]} [extra] */
    show(rebuild,title,text,actions,extra = []) {
      const shown = current;
      let token = Symbol('pending');
      token = view.show(title,text,actions.map(action => ({...action,run() {
        if (view.ownsPanel(token) && current === shown) action.run();
      }})),extra,fresh => {
        if (!view.ownsPanel(token) || current !== shown) return;
        current = fresh; rebuild();
      });
    },
  };
}
