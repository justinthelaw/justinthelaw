import { forgottenSlots } from '../domain/gameplay/native-learning.js';
/** Read-only UI: canonical choices own all mutation, draws and resources.
 * Every linked tail is named before the player explicitly confirms forgetting.
 * @param {{snapshot:import('../contracts/campaign.js').CampaignSnapshot,catalogs:import('../domain/gameplay/support.js').Catalogs,view:ReturnType<typeof import('../ui/view.js').createView>,send:(intent:import('../domain/turns/types.js').Intent)=>void,menu:()=>void,open:()=>void}} options */
export function showMoveLearning({ snapshot,catalogs,view,send,menu,open }) {
  const result = snapshot.pendingResult;
  if (result?.kind !== 'move-learn-choice' || result.owner.kind !== 'actor') return;
  const actor = snapshot.session?.actors[result.owner.actorId]; if (!actor) return;
  const candidate = catalogs.effects.getMove(result.moveId).name;
  const person = catalogs.species.getSpecies(actor.identity.speciesId).name;
  /** @param {import('../contracts.js').MoveSlotId|null} replaceSlotId */
  const choose = replaceSlotId => send({ type: 'ackResult',resultId: result.resultId,cursor: result.cursor,revision: snapshot.revision,choice: { kind: 'move',replaceSlotId } });
  /** @param {string} title @param {string} text @param {import('../ui/view.js').Action[]} actions */
  function show(title,text,actions) {
    let token = Symbol('pending'); token = view.show(title,text,actions.map(action => ({ ...action,run() { if (view.ownsPanel(token)) action.run(); } }))); open();
  }
  function choices() {
    if (!actor) return;
    show('Learn a move',`${person} can learn ${candidate}. Choose a move to forget, or keep the current four moves.`,[
      ...actor.moves.slots.flatMap(slot => {
        if (!slot) return [];
        const pp = actor.battleMoves.slots.find(row => row.moveSlotId === slot.moveSlotId);
        const ids = forgottenSlots(actor,slot.moveSlotId),names = actor.moves.slots.flatMap(move => move && ids.includes(move.moveSlotId) ? [catalogs.effects.getMove(move.moveId).name] : []);
        return [{ label: `Forget ${catalogs.effects.getMove(slot.moveId).name} · ${pp?.currentPp ?? 0} PP`,detail: names.join(', '),run: () => show('Forget these moves?',`Forget ${names.join(', ')} and learn ${candidate}?${names.length > 1 ? ' These moves are linked.' : ''}`,[{ label: 'Forget and learn',run: () => choose(slot.moveSlotId) },{ label: 'Cancel',run: choices }]) }];
      }),
      { label: `Decline ${candidate}`,run: () => show('Keep current moves?',`Keep all four moves and decline ${candidate}?`,[{ label: 'Keep current moves',run: () => choose(null) },{ label: 'Cancel',run: choices }]) },
      { label: 'Campaign & saves',run: menu },
    ]);
  }
  choices();
}
