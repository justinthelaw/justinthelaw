import { ability, maxHp, blocked } from './support.js';
import { damageHp } from './hp-damage.js';

/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** Current consumer correction over the frozen candidate Rapid Spin projection.
 * Native post-chain helpers clear complete frozen/leech-seed classes and never
 * remove traps. Wrap consumers remain separately gated; admitted reciprocal
 * actor links are released together, not left pointing at a cleared class.
 * @param {Context} context @param {Actor} actor */
export function rapidSpinCleanup(context, actor) {
  if (actor.placement.kind !== 'map' || actor.resources.hp === 0) return;
  const frozen = actor.conditions.frozen;
  if (frozen?.statusId === 'wrap' || frozen?.statusId === 'wrapped') {
    if (frozen.payload.kind !== 'actor-link' || !frozen.payload.actorId) return blocked('wrap-cleanup-link');
    const other = context.state.session?.actors[frozen.payload.actorId];
    if (other?.conditions.frozen?.payload.kind !== 'actor-link' || other.conditions.frozen.payload.actorId !== actor.actorId) return blocked('wrap-cleanup-counterpart');
    other.conditions.frozen = null;
    context.emit({ type: 'conditionChanged', actorId: other.actorId });
  }
  if (frozen || actor.conditions.leechSeed) {
    actor.conditions.frozen = null; actor.conditions.leechSeed = null;
    context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  }
}
/** Source Take Down/Double Edge recoil: nonzero successful damage, valid user,
 * Rock Head immunity, floor(maxHP/8) with minimum1. Chance0 consumes no draw.
 * Caller owns immediate shared faint/revival with no recoil experience grant.
 * @param {Actor} actor @param {import('./support.js').Catalogs} catalogs */
export function takeDownRecoil(actor, catalogs) {
  if (actor.placement.kind !== 'map' || actor.resources.hp === 0 || ability(actor, catalogs, 'Rock Head')) return false;
  damageHp(actor, Math.max(1, Math.trunc(maxHp(actor) / 8)));
  return true;
}
