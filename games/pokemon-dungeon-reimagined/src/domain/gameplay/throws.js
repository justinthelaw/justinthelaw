import { NATIVE_THROW_CAPABILITY } from '../../../content/throw-capability-facts.js';
import { NATIVE_ITEM_AI_FACTS } from '../../../content/item-ai-facts.js';
import { consumeItemOrigin } from './item-effects.js';
import { throwDungeonProjectile } from './projectiles.js';
import { inBounds } from '../navigation/geometry.js';
import { profile, ability, maxHp, blocked } from './support.js';
/** Verified uncaught/caught recipient effects with reviewed bounded continuation.
 * Ginseng's self-use is not
 * thrown-effect admission. No generic damage or inventory filtering. */
export const THROWABLE_ITEMS = Object.freeze(['item-oran-berry', 'item-pecha-berry', 'item-rawst-berry', 'item-cheri-berry', 'item-apple', 'item-big-apple', 'item-max-elixir', 'item-reviver-seed', 'item-plain-seed', 'item-sleep-seed', 'item-stun-seed', 'item-heal-seed', 'item-quick-seed', 'item-blast-seed', 'item-gravelerock']);
/** Shared player/later-AI predicate: missing or mismatched evidence is null,
 * never a default true. Identity is the canonical native profile, not shape.
 * @param {import('../../../content/navigation-types.js').ReadonlyData<import('../../contracts/campaign.js').SessionActor>} actor
 * @param {import('./support.js').Catalogs} catalogs */
export function canThrowItems(actor, catalogs) {
  let canonical;
  try { canonical = profile(actor.identity, catalogs); } catch { return null; }
  const row = NATIVE_THROW_CAPABILITY[canonical.internalId];
  if (!row || row.nativeId !== canonical.internalId || row.disposition !== 'canonical-profile' || row.profileId !== canonical.id || row.speciesId !== canonical.speciesId || row.formId !== canonical.formId || row.persistence !== canonical.persistence) return null;
  return row.canThrowItems;
}
/** Source-qualified category from the existing independently checked projection.
 * @param {string} itemId */
export function throwCategory(itemId) { return NATIVE_ITEM_AI_FACTS.find(row => row.itemId === itemId)?.category ?? null; }
/** Deliberate facing or explicit arc tile only; one existing selector owner.
 * @param {import('../../contracts/campaign.js').TargetSelector} target
 * @param {string} category @param {import('../../../content/navigation-types.js').ReadonlyData<import('../../contracts/campaign.js').ExpeditionState>} session */
export function validThrowSelector(target, category, session) {
  return target.kind === 'facing' || category === 'thrown_arc' && target.kind === 'tile' && target.mapId === session.floor.mapId && inBounds(session.floor, target.position);
}
/** Native sticky-held, sticky-projectile, then flee failures consume the normal
 * action and retain origin. Bag nonprojectile sticky lots reach shared impact.
 * Flight remains atomic: the scheduler can pause only after this function.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../contracts/campaign.js').ResolvedAction & {kind:'item'}} action
 * @param {import('./support.js').Catalogs} catalogs */
export function launchDungeonItem(context, action, catalogs) {
  const state = context.state, session = state.session, actor = session?.actors[action.actorId], item = state.items[action.itemInstanceId];
  if (!session || !actor || actor.placement.kind !== 'map' || actor.placement.mapId !== session.floor.mapId || actor.resources.hp <= 0 || !item || !THROWABLE_ITEMS.includes(item.template.itemId)) return blocked('throw-item-effect-consumer');
  const bag = state.containers[session.inventory], held = state.containers[actor.heldContainerId];
  if (bag?.owner.kind !== 'session-toolbox' || bag.owner.sessionId !== session.sessionId || held?.owner.kind !== 'actor-held' || held.owner.sessionId !== session.sessionId || held.owner.actorId !== actor.actorId) return blocked('throw-item-owner');
  const owners = [bag, held].filter(row => row.itemIds.includes(item.itemInstanceId));
  const origin = owners[0]; if (owners.length !== 1 || !origin) return blocked('throw-item-owner');
  const capability = canThrowItems(actor, catalogs); if (capability === null) return blocked('throw-capability-profile');
  if (!capability) { context.emit({ type: 'message', messageId: 'item-cannot-throw' }); return; }
  const category = throwCategory(item.template.itemId); if (!category || category !== catalogs.effects.getItem(item.template.itemId).category) return blocked('throw-item-category');
  if (action.target.kind !== 'self' && !validThrowSelector(action.target, category, session) || action.target.kind === 'self' && item.template.itemId !== 'item-gravelerock') return blocked('throw-item-selector');
  const projectile = category === 'thrown_line' || category === 'thrown_arc';
  if (origin === held && item.template.sticky) { context.emit({ type: 'message', messageId: 'item-sticky' }); return; }
  if (projectile && item.template.sticky) { context.emit({ type: 'message', messageId: 'item-sticky' }); return; }
  // Terrified is not admitted by the finite state policies; leaders ignore
  // Run Away/tactics, matching ShouldMonsterRunAway1056..1087.
  if (actor.actorId !== session.leaderActorId && (ability(actor, catalogs, 'Run Away') && actor.resources.hp < Math.trunc(maxHp(actor) / 2) || actor.tacticId === 'tactic-get-away' || actor.tacticId === 'tactic-avoid-trouble' && actor.resources.hp <= Math.trunc(maxHp(actor) / 2))) { context.emit({ type: 'message', messageId: 'item-flee' }); return; }
  if (item.shopLotId !== null) return blocked('throw-shop-aggression-consumer');
  const detached = consumeItemOrigin(context, origin, item, projectile);
  throwDungeonProjectile(context, actor, detached, catalogs, category === 'thrown_arc', action.target);
  context.emit({ type: 'itemChanged', itemInstanceId: item.itemInstanceId });
}
