import { DIRECTIONS, canStep } from '../navigation/geometry.js';
import { draw, facing, navActor, navigationContext, occupants } from './support.js';
/** Direction replacement belongs to execution after AI selection and before
 * targeting/hit RNG. Leader walking searches cyclically from one source draw;
 * nonleaders take that one direction even when it is blocked. Player item use,
 * waits and menus are not confusion-direction actions.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../contracts/campaign.js').SessionActor} actor
 * @param {import('../../contracts/campaign.js').ResolvedAction} action
 * @param {import('./support.js').Catalogs} catalogs
 * @returns {import('../../contracts/campaign.js').ResolvedAction} */
export function confusedAction(context, actor, action, catalogs) {
  const session = context.state.session;
  if (!session || actor.placement.kind !== 'map' || actor.conditions.cringe?.statusId !== 'confused' || !['move', 'attack', 'move-use'].includes(action.kind)) return action;
  const first = draw(context.state, 8), origin = actor.placement.position;
  let direction = DIRECTIONS[first];
  if (action.kind === 'move' && actor.actorId === session.leaderActorId) {
    direction = undefined;
    for (let i = 0; i < 8; i++) {
      const d = DIRECTIONS[(first + i) % 8];
      if (d && canStep(navActor(actor), session.floor, origin, { x: origin.x + d.x, z: origin.z + d.z }, occupants(session), navigationContext(session, catalogs))) { direction = d; break; }
    }
  }
  if (direction) actor.facing = facing(direction.x, direction.z);
  if (action.kind === 'attack' || action.kind === 'move-use') return { ...action, target: { kind: 'facing' } };
  if (action.kind !== 'move' || !direction) return action;
  const destination = { x: origin.x + direction.x, z: origin.z + direction.z };
  return canStep(navActor(actor), session.floor, origin, destination, occupants(session), navigationContext(session, catalogs)) ? { ...action, destination } : { kind: 'wait', actorId: actor.actorId };
}
