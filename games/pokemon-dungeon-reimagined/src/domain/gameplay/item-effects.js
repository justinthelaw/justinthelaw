import { useGinseng } from './move-menu.js';
import { stunSeed } from './stun-seed.js';
import { healSeed, quickSeed } from './heal-quick.js';
import { interruptPetrifiedSleep } from './status-interruptions.js';
import { sleepSeed, refreshSpeed } from './conditions.js';
import { dealDamage } from './damage-resolution.js';
import { hasHeldItem } from './held-effects.js';
import { canTransferHeldItem } from './held-items.js';
import { canTargetPosition } from '../navigation/geometry.js';
import { STEEL } from '../../../content/authored/mt-steel.js';
import { allocate, clone, value, quantity, maxHp, ability, blocked, FACINGS, navActor, navigationContext } from './support.js';

/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** A detached atomic payload owns no canonical item until a catch/drop succeeds.
 * Whole lots can reuse their removed ID; a split projectile cannot reuse its
 * still-owned origin ID. Flight is transient and cannot suspend for a prompt.
 * @typedef {{payload:Omit<import('../../contracts/campaign.js').ItemInstance,'itemInstanceId'>, existingId:import('../../contracts/campaign.js').ItemInstanceId|null}} DetachedItem */

/** Finite supported effect surface with complete Stun/Petrified lifecycle.
 * Reviver/Plain Seed ingestion is Belly only; faint revival owns Reviver use. */
export const USABLE_ITEMS = Object.freeze(['item-oran-berry', 'item-pecha-berry', 'item-rawst-berry', 'item-cheri-berry', 'item-apple', 'item-big-apple', 'item-max-elixir', 'item-reviver-seed', 'item-plain-seed', 'item-sleep-seed', 'item-stun-seed', 'item-heal-seed', 'item-quick-seed', 'item-blast-seed', 'item-gravelerock', 'item-ginseng']);

/** Copy before mutation. Remove whole canonical lots before flight/effect, or
 * decrement a projectile stack and leave the flying copy without an ID.
 * @param {Context} context @param {import('../../contracts/campaign.js').ItemContainer} origin
 * @param {import('../../contracts/campaign.js').ItemInstance} item @param {boolean} projectile
 * @returns {DetachedItem} */
export function consumeItemOrigin(context, origin, item, projectile) {
  const { template, quantity: count, shopLotId } = clone(item);
  const index = origin.itemIds.indexOf(item.itemInstanceId);
  if (index < 0 || context.state.items[item.itemInstanceId] !== item) return blocked('item-origin-owner');
  const split = projectile && count > 1;
  if (split) item.quantity--;
  else { origin.itemIds.splice(index, 1); delete context.state.items[item.itemInstanceId]; }
  return { payload: { template, quantity: projectile ? 1 : count, shopLotId }, existingId: split ? null : item.itemInstanceId };
}

/** Native direct-hit protections name roles, not every neutral affiliation.
 * Shopkeeper roles are not represented by admitted early actors.
 * @param {Actor} actor */
export function protectedItemTarget(actor) {
  return actor.binding.kind === 'job-client' || actor.binding.kind === 'guest' && actor.binding.storyActorId === STEEL.clientRole;
}

/** CheckVariousConditions subset on actually admitted state: protected rescue/
 * experience-locked Diglett role, nonleader flee, sleep, frozen, Bide, pause,
 * infatuation. Successful impact already releases Petrified before this gate.
 * Charge/Rage are not native two-turn charging moves. Terrified and wider
 * join-origin/charging policies remain separate owners.
 * @param {Context} context @param {Actor} target @param {Catalogs} catalogs */
function canCatch(context, target, catalogs) {
  const session = context.state.session;
  if (!session || target.binding.kind === 'escort-guest' || protectedItemTarget(target) || !canTransferHeldItem(target)) return false;
  return target.actorId === session.leaderActorId || !(ability(target, catalogs, 'Run Away') && target.resources.hp < Math.trunc(maxHp(target) / 2) || target.tacticId === 'tactic-get-away' || target.tacticId === 'tactic-avoid-trouble' && target.resources.hp <= Math.trunc(maxHp(target) / 2));
}

/** Successful hit only. Team Catcher permits rocks/food; wild category rules
 * exclude both projectile categories and berries/seeds/vitamins. Empty own held
 * ownership is required. Catch returns before sticky damage or ordinary effect.
 * Lock-On/Pierce and shop aggression need their wider unsupported owners.
 * @param {Context} context @param {Actor} user @param {Actor} recipient
 * @param {DetachedItem} item @param {Catalogs} catalogs */
export function impactDungeonItem(context, user, recipient, item, catalogs) {
  const state = context.state, session = state.session;
  if (!session || recipient.placement.kind !== 'map' || recipient.placement.mapId !== session.floor.mapId || recipient.resources.hp <= 0 || protectedItemTarget(recipient)) return blocked('item-impact-recipient');
  if (!USABLE_ITEMS.includes(item.payload.template.itemId)) return blocked(`item-effect-consumer:${item.payload.template.itemId}`);
  const existingId = item.existingId;
  if (existingId && (state.items[existingId] || Object.values(state.containers).some(row => row.itemIds.includes(existingId)))) return blocked('item-impact-detached-owner');
  const impactMessage = interruptPetrifiedSleep(context, recipient);
  const category = catalogs.effects.getItem(item.payload.template.itemId).category;
  const eligible = category !== 'berries_seeds_vitamins' && (recipient.affiliation === 'team' ? recipient.enabledIqSkillIds.some(id => id === 'iq-item-catcher') : category !== 'thrown_line' && category !== 'thrown_arc');
  const held = state.containers[recipient.heldContainerId];
  if (held?.owner.kind !== 'actor-held' || held.owner.actorId !== recipient.actorId || held.owner.sessionId !== session.sessionId) return blocked('item-catch-held-owner');
  if (eligible && held.itemIds.length === 0 && canCatch(context, recipient, catalogs)) {
    const id = item.existingId ?? allocate(state, 'item-instance');
    state.items[id] = { ...clone(item.payload), itemInstanceId: id }; held.itemIds.push(id);
    context.emit({ type: 'itemChanged', itemInstanceId: id }); context.emit({ type: 'message', messageId: 'item-caught' }); return 'caught';
  }
  applyDungeonItemEffect(context, user, recipient, item.payload, 'uncaught-thrown', catalogs, impactMessage);
  return 'consumed';
}

/** Source sub_8078B5C: Q16 Belly increment, full-Belly food max gain/cap200.
 * Diet Ribbon suppresses all Belly restoration only for nonleaders.
 * @param {Context} context @param {Actor} recipient @param {number} amount @param {number} maximumGain */
function restoreBelly(context, recipient, amount, maximumGain = 0) {
  if (recipient.actorId !== context.state.session?.leaderActorId && hasHeldItem(context.state, recipient, 'item-diet-ribbon')) return;
  if (maximumGain && Math.trunc(value(recipient.resources.belly)) >= Math.trunc(value(recipient.resources.maxBelly))) {
    recipient.resources.maxBelly = quantity(Math.min(200, value(recipient.resources.maxBelly) + maximumGain));
    recipient.resources.belly = recipient.resources.maxBelly;
    recipient.gains.maxBelly = quantity(value(recipient.resources.maxBelly) - 100);
  } else recipient.resources.belly = quantity(Math.min(value(recipient.resources.maxBelly) * 65536, value(recipient.resources.belly) * 65536 + amount * 65536), 65536);
}

/** Explicit recipient dispatch. No trajectory, origin consumption or generic
 * fallback belongs here. Red item_action84..362/565..616 is comparative evidence.
 * @param {Context} context @param {Actor} user @param {Actor} recipient
 * @param {DetachedItem['payload']} payload @param {'eaten'|'uncaught-thrown'} use
 * @param {Catalogs} catalogs @param {boolean} [impactMessage] */
export function applyDungeonItemEffect(context, user, recipient, payload, use, catalogs, impactMessage = false) {
  const session = context.state.session; if (!session) return blocked('item-effect-session');
  const id = payload.template.itemId;
  if (!USABLE_ITEMS.includes(id)) return blocked(`item-effect-consumer:${id}`);
  if (use === 'eaten' && user.actorId !== recipient.actorId) return blocked('item-eaten-recipient');
  if (use === 'uncaught-thrown' && payload.template.sticky) { fixedDamage(recipient, 2); return; }
  if (payload.template.sticky) return blocked('item-eaten-sticky');
  if (catalogs.effects.getItem(id).category === 'berries_seeds_vitamins') restoreBelly(context, recipient, 5);
  switch (id) {
    case 'item-gravelerock': fixedDamage(recipient, 20); break;
    case 'item-oran-berry': recipient.resources.hp = Math.min(maxHp(recipient), recipient.resources.hp + 100); break;
    case 'item-pecha-berry': cure(['poisoned', 'badly-poisoned']); break;
    case 'item-cheri-berry': cure(['paralysis']); break;
    case 'item-rawst-berry': cure(['burn']); break;
    case 'item-apple': restoreBelly(context, recipient, 50, 5); break;
    case 'item-big-apple': restoreBelly(context, recipient, 100, 10); break;
    case 'item-max-elixir':
      for (const slot of recipient.moves.slots) if (slot) {
        const battle = recipient.battleMoves.slots.find(row => row.moveSlotId === slot.moveSlotId);
        if (!battle) return blocked('item-elixir-learned-slot');
        const cap = catalogs.effects.getMove(slot.moveId).numeric.pp;
        if (battle.currentPp < cap) battle.currentPp = Math.min(cap, battle.currentPp + 999);
      }
      break;
    case 'item-ginseng': useGinseng(context, recipient, catalogs); break;
    case 'item-sleep-seed': sleepSeed(context, user, recipient, catalogs); break;
    case 'item-stun-seed': stunSeed(context, user, recipient, catalogs); break;
    case 'item-heal-seed': healSeed(context, recipient, catalogs, impactMessage); break;
    case 'item-quick-seed': quickSeed(context, recipient, catalogs); break;
    case 'item-blast-seed': {
      const boss = session.floor.location.kind === 'boss';
      const target = use === 'uncaught-thrown' ? recipient : frontTarget();
      if (target) {
        if (target.conditions.frozen?.statusId === 'frozen') { target.conditions.frozen = null; context.emit({ type: 'conditionChanged', actorId: target.actorId }); }
        fixedDamage(target, use === 'uncaught-thrown' ? boss ? 15 : 20 : boss ? 30 : 45);
      }
      break;
    }
    case 'item-reviver-seed': case 'item-plain-seed': break;
    default: return blocked(`item-effect-consumer:${id}`);
  }
  /** All fixed item damage uses immediate revival, held drop, XP/removal.
   * @param {Actor} target @param {number} amount */
  function fixedDamage(target, amount) {
    dealDamage(context, target, catalogs, { attacker: user, amount, contact: false, physical: false });
    context.emit({ type: 'attackResolved', actorId: user.actorId, targetId: target.actorId, outcome: 'hit' });
  }
  /** @param {string[]} statuses */
  function cure(statuses) {
    if (!statuses.includes(recipient.conditions.burn?.statusId ?? '')) return;
    recipient.conditions.burn = null; refreshSpeed(recipient, catalogs); context.emit({ type: 'conditionChanged', actorId: recipient.actorId });
  }
  function frontTarget() {
    const session = context.state.session;
    if (!session || user.placement.kind !== 'map') return null;
    const angle = FACINGS.indexOf(user.facing) * Math.PI / 4, pos = user.placement.position;
    const position = { x: pos.x + Math.round(Math.sin(angle)), z: pos.z - Math.round(Math.cos(angle)) };
    if (!canTargetPosition(navActor(user), session.floor, position, navigationContext(session, catalogs))) return null;
    // Eaten Blast can hit the front client/Diglett; no direct-throw protection.
    return Object.values(session.actors).find(other => other.resources.hp > 0 && other.placement.kind === 'map' && other.placement.mapId === session.floor.mapId && other.placement.position.x === position.x && other.placement.position.z === position.z) ?? null;
  }
}
