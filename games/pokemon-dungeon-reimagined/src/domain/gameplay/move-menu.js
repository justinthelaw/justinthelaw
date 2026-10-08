import { draw } from './support.js';
import { leaderInputReady } from '../turns/readiness.js';

/** SET is an explicit owning-slot toggle, with no turn, PP, hunger or RNG cost.
 * Selection does not require that the move's runtime effect is implemented.
 * @type {import('../turns/types.js').CommandHandler} */
export const setMoveHandler = {
  plan(state, intent) {
    const session = state.session, actor = session?.actors[session.leaderActorId];
    if (intent.type !== 'setMove' || !leaderInputReady(state) || actor?.placement.kind !== 'map' || actor.actorId !== intent.actorId) return { kind: 'rejected', reason: 'unavailable' };
    if (!actor.moves.slots.some(slot => slot?.moveSlotId === intent.moveSlotId)) return { kind: 'rejected', reason: 'unavailable' };
    if (actor.moves.links.length) return { kind: 'content-blocked', requirement: 'linked-move-menu-not-supported' };
    return { kind: 'mutation' };
  },
  apply(context, intent) {
    const session = context.state.session, actor = session?.actors[session.leaderActorId];
    if (intent.type !== 'setMove' || !actor) return { kind: 'rejected', reason: 'unavailable' };
    actor.moves.setMoveSlotId = actor.moves.setMoveSlotId === intent.moveSlotId ? null : intent.moveSlotId;
    return { kind: 'changed', resumeDungeon: false };
  },
};

/** Source chance is sampled even for nonleader/no SET/zero-power/capped use.
 * Canonical move powerBoost persists through the existing non-reset settlement;
 * a separate reset-dungeon gain ledger is not fabricated by this consumer.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../contracts/campaign.js').SessionActor} actor
 * @param {import('./support.js').Catalogs} catalogs */
export function useGinseng(context, actor, catalogs) {
  const amount = draw(context.state, 100) < 12 ? 3 : 1;
  const slot = actor.moves.slots.find(slot => slot?.moveSlotId === actor.moves.setMoveSlotId);
  if (actor.actorId !== context.state.session?.leaderActorId || !slot) {
    context.emit({ type: 'message', messageId: 'ginseng-no-effect' }); return;
  }
  const move = catalogs.effects.getMove(slot.moveId), before = slot.powerBoost;
  if (move.numeric.power !== 0) slot.powerBoost = Math.min(move.numeric.ginsengCap, before + amount);
  context.emit({ type: 'message', messageId: slot.powerBoost === before ? 'ginseng-no-effect' : amount === 3 ? 'ginseng-great-boost' : 'ginseng-boost' });
}
