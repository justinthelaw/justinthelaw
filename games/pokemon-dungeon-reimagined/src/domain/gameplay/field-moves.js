import { activeActors } from './move-targets.js';
import { moveConditionSource } from './move-conditions.js';
import { statusTurns } from './conditions.js';
import { dealDamage } from './damage-resolution.js';
import { ability, profile, maxHp, draw, blocked } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
export const FIELD_MOVE_IDS = Object.freeze(['move-leech-seed', 'move-water-sport']);
const POLICY = /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-field-moves-v16');
/** Handler follows the common first hit boundary, never damage accuracy/type
 * immunity. Leech Seed samples only after guards; Water Sport always refreshes.
 * @param {Context} context @param {Actor} user @param {Actor} target
 * @param {import('../../contracts/campaign.js').MoveId} moveId @param {Catalogs} catalogs */
export function applyFieldMove(context, user, target, moveId, catalogs) {
  if (moveId === 'move-water-sport') {
    const field = context.state.moveState;
    if (!field || !('waterSportTurns' in field)) return blocked('field-move-owner');
    field.waterSportTurns = 10 + draw(context.state, 2);
    context.emit({ type: 'message', messageId: 'water-sport-status' }); return true;
  }
  if (user.actorId === target.actorId || target.conditions.reflect?.statusId === 'safeguard' || profile(target.identity, catalogs).typeIds.includes(4)) {
    context.emit({ type: 'message', messageId: 'leech-seed-protected' }); return false;
  }
  if (target.conditions.leechSeed?.statusId === 'leech-seed') { context.emit({ type: 'message', messageId: 'leech-seed-already-active' }); return false; }
  target.conditions.leechSeed = { statusId: 'leech-seed', source: moveConditionSource(context, user, moveId), duration: { kind: 'counter', policyId: POLICY, remaining: statusTurns(context, target, 10, 12, catalogs) + 1 }, periodicCountdown: 0, payload: { kind: 'actor-link', actorId: user.actorId } };
  context.emit({ type: 'conditionChanged', actorId: target.actorId });
  context.emit({ type: 'message', messageId: 'leech-seed-status' }); return true;
}
/** Leech class expiry belongs between Reflect and sureShot at own beginning.
 * @param {Context} context @param {Actor} actor */
export function tickLeechSeed(context, actor) {
  const c = actor.conditions.leechSeed;
  if (c?.statusId === 'leech-seed' && c.duration.kind === 'counter' && --c.duration.remaining === 0) {
    actor.conditions.leechSeed = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId });
    context.emit({ type: 'message', messageId: 'leech-seed-ended' });
  }
}
/** Native pulse before Bide, with fixed nominal transfer even at low HP or
 * same-pulse revival/faint. Freeze skips both sides after resetting countdown.
 * Captured Liquid Ooze and dummy damage cannot trigger Rage, contact or XP.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs */
export function pulseLeechSeed(context, actor, catalogs) {
  const c = actor.conditions.leechSeed, session = context.state.session;
  if (!session || c?.statusId !== 'leech-seed' || c.periodicCountdown === null) return;
  if (c.periodicCountdown > 0 && --c.periodicCountdown > 0) return;
  c.periodicCountdown = 2;
  const user = c.payload.kind === 'actor-link' && c.payload.actorId ? session.actors[c.payload.actorId] : null;
  if (!user || user.resources.hp === 0 || !activeActors(session).includes(user)) { actor.conditions.leechSeed = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); return; }
  if (actor.conditions.frozen?.statusId === 'frozen') return;
  const ooze = ability(actor, catalogs, 'Liquid Ooze');
  // Shared dealDamage owns Petrified/native127 Sleep release before HP; the
  // healing branch never calls it. Liquid Ooze interrupts its damage recipient.
  dealDamage(context, actor, catalogs, { attacker: null, amount: 10, contact: false, physical: false, giveExperience: false });
  if (ooze) {
    dealDamage(context, user, catalogs, { attacker: null, amount: 10, contact: false, physical: false, giveExperience: false });
  }
  else user.resources.hp = Math.min(maxHp(user), user.resources.hp + 10);
  context.emit({ type: 'message', messageId: ooze ? 'leech-seed-ooze' : 'leech-seed-drained' });
}
/** Floor-wide expiry uses the native base-speed phase boundary, not an actor
 * action, leader wind count or Lightningrod refresh. @param {Context} context */
export function tickWaterSport(context) {
  const field = context.state.moveState;
  if (field && 'waterSportTurns' in field && field.waterSportTurns > 0 && --field.waterSportTurns === 0) context.emit({ type: 'message', messageId: 'water-sport-ended' });
}
/** @param {import('../../contracts/campaign.js').CampaignState} state */
export const waterSportActive = state => !!state.moveState && 'waterSportTurns' in state.moveState && state.moveState.waterSportTurns > 0;
