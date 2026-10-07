import { resetFloorConditions } from './conditions.js';
import { maxHp, quantity } from './support.js';

/** Native dungeon_damage.c Reviver Seed branch precedes fainting and EXP.
 * The holder has priority over the bag; only team members may use bag stock.
 * ResetMonEntityData clears temporary effects, but does not restore move PP.
 * @param {import('../turns/types.js').MutationContext} context
 * @param {import('../../contracts/campaign.js').SessionActor} actor
 * @param {import('./support.js').Catalogs} catalogs */
export function tryRevive(context, actor, catalogs) {
  const state = context.state, session = state.session;
  if (!session || actor.resources.hp !== 0 || !actor.enabledIqSkillIds.some(id => id === 'iq-item-master')) return false;
  const held = state.containers[actor.heldContainerId]?.itemIds ?? [];
  const bag = actor.affiliation === 'team' ? state.containers[session.inventory]?.itemIds ?? [] : [];
  const seed = [...held, ...bag].flatMap(id => state.items[id] ?? []).find(item => item.template.itemId === 'item-reviver-seed' && !item.template.sticky);
  if (!seed) return false;
  seed.template = { itemId: /** @type {import('../../contracts.js').ItemId} */ ('item-plain-seed'), sticky: false, payload: { kind: 'none' } };
  seed.quantity = 1;
  actor.resources.hp = maxHp(actor);
  actor.resources.belly = quantity(actor.resources.maxBelly.numerator, actor.resources.maxBelly.denominator);
  resetFloorConditions(actor, catalogs);
  for (const key of /** @type {const} */ (['perishSong', 'muzzled', 'grudge', 'exposed'])) actor.auxiliaryConditions[key] = null;
  actor.overrides.types = null; actor.overrides.abilities = null;
  actor.memory.stockpileCount = 0; actor.memory.experienceContributors = [];
  actor.speed.speedBoostCounter = 0;
  context.emit({ type: 'itemChanged', itemInstanceId: seed.itemInstanceId });
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  context.emit({ type: 'message', messageId: 'reviver-seed-restored' });
  return true;
}
