import { DIRECTIONS } from '../navigation/geometry.js';
import { calculateSpeedStage } from '../rules/speed.js';
import { currentSpeedContext } from './speed-context.js';
import { clearPetrified } from './status-interruptions.js';
import { activeActors } from './move-targets.js';
import { hasHeldItem } from './held-effects.js';
import { ability, profile, draw, blocked, quantity } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** Native MonsterHasNegativeStatus excludes Bide and beneficial sureShot
 * effects; positive statuses must not activate Guts or Marvel Scale.
 * @param {Actor} actor */
export function hasNegativeStatus(actor) {
  const c = actor.conditions, a = actor.auxiliaryConditions;
  return ['sleep', 'nightmare', 'yawning'].includes(c.sleep?.statusId ?? '') || c.burn !== null || c.frozen !== null && c.frozen.statusId !== 'ingrain' || c.cringe !== null || ['cursed', 'decoy'].includes(c.curse?.statusId ?? '') || c.leechSeed?.statusId === 'leech-seed' || c.sureShot?.statusId === 'whiffer' || ['blinker', 'cross-eyed'].includes(c.blinker?.statusId ?? '') || a.muzzled !== null || a.exposed !== null || a.perishSong !== null || actor.battleMoves.slots.some(slot => slot.sealed) || actor.speed.negativeTimers.some(Boolean);
}
/** Native CalculateStatusTurns; equal endpoints do not draw. @param {Context} context @param {Actor} actor @param {number} low @param {number} high @param {Catalogs} catalogs */
export function statusTurns(context, actor, low, high, catalogs) {
  let n = low + (high === low ? 0 : draw(context.state, high - low));
  if (n !== 127 && actor.enabledIqSkillIds.some(id => id === 'iq-self-curer')) n = Math.trunc(n / 2);
  if (n !== 127 && ability(actor, catalogs, 'Natural Cure')) n = Math.min(n, 5);
  return Math.max(1, n);
}
/** @param {Actor} actor @param {Catalogs} catalogs */
export function refreshSpeed(actor, catalogs) {
  actor.speed.cachedStage = calculateSpeedStage(currentSpeedContext(actor, catalogs));
}
/** Only the admitted early-route contact abilities are consumed here. Native
 * rolls flags after damage/faint/revival; move-specific effects run before the
 * separate application phase. No status duration is sampled while rolling.
 * @typedef {'Static'|'Poison Point'|'Cute Charm'} ContactAbility
 * @typedef {{ability:ContactAbility, defender:Actor}} ContactReaction
 * @param {Context} context @param {Actor} attacker @param {Actor} defender
 * @param {boolean} physical @param {Catalogs} catalogs
 * @returns {ContactReaction[]} */
export function rollContactReactions(context, attacker, defender, physical, catalogs) {
  if (attacker.placement.kind !== 'map' || defender.placement.kind !== 'map' || attacker.resources.hp <= 0 || defender.resources.hp <= 0 || attacker.actorId === defender.actorId || Math.max(Math.abs(attacker.placement.position.x - defender.placement.position.x), Math.abs(attacker.placement.position.z - defender.placement.position.z)) > 1 || defender.conditions.sleep && defender.conditions.sleep.statusId !== 'sleepless' || ['frozen', 'petrified'].includes(defender.conditions.frozen?.statusId ?? '') || defender.conditions.bide) return [];
  const reactions = [];
  for (const name of /** @type {const} */ (['Static', 'Poison Point', 'Cute Charm'])) {
    if (name !== 'Poison Point' && !physical || !ability(defender, catalogs, name) || draw(context.state, 100) >= 12) continue;
    reactions.push({ ability: name, defender });
  }
  return reactions;
}
/** Native flag application uses the attacker as both effect user and recipient;
 * causal defender identity remains recorded for save provenance. Flags are local
 * to the atomic action; revival preserves flags, while removal prevents application.
 * @param {Context} context @param {Actor} attacker
 * @param {ContactReaction[]} reactions @param {Catalogs} catalogs */
export function applyContactReactions(context, attacker, reactions, catalogs) {
  const session = context.state.session; if (!session) return blocked('reaction-session');
  if (attacker.placement.kind !== 'map' || attacker.resources.hp <= 0) return;
  for (const { ability: name, defender } of reactions) {
    const status = name === 'Static' ? 'paralysis' : name === 'Poison Point' ? 'poisoned' : 'infatuated';
    const group = name === 'Cute Charm' ? 'cringe' : 'burn';
    if (attacker.conditions[group]?.statusId === status || attacker.conditions.reflect?.statusId === 'safeguard') continue;
    if (status === 'paralysis' && ability(attacker, catalogs, 'Limber') || status === 'infatuated' && ability(attacker, catalogs, 'Oblivious')) continue;
    if (status === 'poisoned' && (hasHeldItem(context.state, attacker, 'item-pecha-scarf') || ability(attacker, catalogs, 'Immunity') || profile(attacker.identity, catalogs).typeIds.some(id => id === 8 || id === 17) || attacker.conditions.burn?.statusId === 'badly-poisoned')) continue;
    const source = catalogs.species.identities.abilities.find(row => row.name === name); if (!source) return blocked('reaction-ability');
    if (status === 'paralysis') {
      inflictParalysis(context, attacker, { kind: 'ability', actor: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: defender.actorId, identity: { ...defender.identity } }, abilityId: /** @type {import('../../contracts/campaign.js').AbilityId} */ (source.id) }, catalogs);
      continue;
    }
    const duration = status === 'poisoned' ? 128 : statusTurns(context, attacker, 4, 6, catalogs) + 1;
    attacker.conditions[group] = { statusId: status, source: { kind: 'ability', actor: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: defender.actorId, identity: { ...defender.identity } }, abilityId: /** @type {import('../../contracts/campaign.js').AbilityId} */ (source.id) }, duration: { kind: 'counter', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-cave-condition'), remaining: duration }, periodicCountdown: status === 'poisoned' ? 0 : null, payload: { kind: 'none' } };
    refreshSpeed(attacker, catalogs); context.emit({ type: 'conditionChanged', actorId: attacker.actorId });
  }
}
/** Confusion secondary chance follows damage/faint/revival. The caller skips
 * revived targets; successful chance is then blocked by Shield Dust before
 * Safeguard, held Persim Band and Own Tempo application guards.
 * @param {Context} context @param {Actor} user @param {Actor} target @param {Catalogs} catalogs */
export function confusionSecondary(context, user, target, catalogs) {
  const session = context.state.session;
  if (!session || user.placement.kind !== 'map' || user.resources.hp === 0 || target.placement.kind !== 'map' || target.resources.hp === 0 || session.teamOrder.some(id => session.actors[id]?.resources.hp === 0)) return;
  if (draw(context.state, 100) >= (ability(user, catalogs, 'Serene Grace') ? 20 : 10)) return;
  if (user.actorId !== target.actorId && ability(target, catalogs, 'Shield Dust')) return;
  if (target.conditions.reflect?.statusId === 'safeguard' || hasHeldItem(context.state, target, 'item-persim-band') || ability(target, catalogs, 'Own Tempo') || target.conditions.cringe?.statusId === 'confused') return;
  target.conditions.cringe = { statusId: 'confused', source: { kind: 'actor', actor: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: user.actorId, identity: { ...user.identity } }, moveId: /** @type {import('../../contracts.js').MoveId} */ ('move-confusion') }, duration: { kind: 'counter', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-battle-status-v9'), remaining: statusTurns(context, target, 6, 12, catalogs) + 1 }, periodicCountdown: null, payload: { kind: 'none' } };
  context.emit({ type: 'conditionChanged', actorId: target.actorId });
  context.emit({ type: 'message', messageId: 'confused-status' });
}
/** Native duration draw precedes all sleep guards. Real user provenance is
 * retained; only nonself item sources require the additive v17 policy.
 * @param {Context} context @param {Actor} user @param {Actor} target @param {Catalogs} catalogs */
export function sleepSeed(context, user, target, catalogs) {
  const session = context.state.session; if (!session) return blocked('sleep-session');
  let duration = statusTurns(context, target, 3, 7, catalogs);
  if (target.placement.kind !== 'map' || target.resources.hp === 0 || target.conditions.reflect?.statusId === 'safeguard' || ability(target, catalogs, 'Insomnia') || ability(target, catalogs, 'Vital Spirit') || target.enabledIqSkillIds.some(id => id === 'iq-nonsleeper') || hasHeldItem(context.state, target, 'item-insomniscope') || ['sleep', 'nightmare', 'sleepless', 'napping'].includes(target.conditions.sleep?.statusId ?? '')) return;
  if (ability(target, catalogs, 'Early Bird')) duration = Math.max(1, Math.trunc(duration / 2));
  target.conditions.sleep = { statusId: 'sleep', source: { kind: 'item', itemId: /** @type {import('../../contracts.js').ItemId} */ ('item-sleep-seed'), user: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: user.actorId, identity: { ...user.identity } } }, duration: { kind: 'counter', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ (user.actorId === target.actorId ? 'native-cave-condition' : 'native-item-impact-v17'), remaining: duration }, periodicCountdown: null, payload: { kind: 'none' } };
  context.emit({ type: 'conditionChanged', actorId: target.actorId });
}
/** Native counter 127 persists, including poison's 128→127 first tick.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs */
export function tickConditions(context, actor, catalogs) {
  for (const group of /** @type {const} */ (['sleep', 'burn', 'frozen', 'cringe', 'reflect'])) {
    const c = actor.conditions[group];
    if (c?.duration.kind !== 'counter' || c.duration.remaining === 127) continue;
    if (--c.duration.remaining === 0) {
      if (group === 'frozen' && c.statusId === 'petrified') clearPetrified(context, actor);
      else { actor.conditions[group] = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); }
    }
  }
  refreshSpeed(actor, catalogs);
}
/** Native periodic poison/burn countdowns; the caller applies returned damage
 * through the dummy-source immediate damage owner before further upkeep.
 * @param {Context} context @param {Actor} actor */
export function periodicStatusDamage(context, actor) {
  const c = actor.conditions.burn;
  if (!c || !['poisoned', 'burn'].includes(c.statusId) || c.periodicCountdown === null) return 0;
  if (c.periodicCountdown > 0) c.periodicCountdown--;
  if (c.periodicCountdown !== 0) return 0;
  const burned = c.statusId === 'burn'; c.periodicCountdown = burned ? 20 : 10;
  context.emit({ type: 'message', messageId: burned ? 'burn-damage' : 'poison-damage' });
  return burned ? 5 : 4;
}

/** Reused by visible Wonder Tiles and new-floor cleanup. Speed is independent.
 * @param {Actor} actor */
export function resetStatChanges(actor) {
  for (const key of /** @type {const} */ (['attack', 'defense', 'specialAttack', 'specialDefense', 'accuracy', 'evasion'])) actor.stages[key] = 10;
  for (const key of /** @type {const} */ (['attack', 'defense', 'specialAttack', 'specialDefense'])) actor.multipliers[key] = quantity(1);
}
/** Floor transitions discard temporary conditions before their source actors.
 * @param {Actor} actor @param {Catalogs} catalogs */
export function resetFloorConditions(actor, catalogs) {
  for (const key of /** @type {const} */ (['sleep', 'burn', 'frozen', 'cringe', 'bide', 'reflect', 'curse', 'leechSeed', 'sureShot', 'longToss', 'invisible', 'blinker'])) actor.conditions[key] = null;
  resetStatChanges(actor);
  actor.speed.positiveTimers.fill(0); actor.speed.negativeTimers.fill(0);
  refreshSpeed(actor, catalogs);
}

/** Source burn-class replacement, speed update and adjacent Synchronize recurse
 * in native direction order. A repeated paralysis stops before duration RNG;
 * this also terminates cycles. Propagation retains the original effect source.
 * @param {Context} context @param {Actor} target
 * @param {import('../../contracts/campaign.js').EffectSource} source @param {Catalogs} catalogs
 * @param {import('../../contracts/campaign.js').PolicyId} [policyId] */
export function inflictParalysis(context, target, source, catalogs, policyId = /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-move-status-v11')) {
  const session = context.state.session;
  if (!session || target.placement.kind !== 'map' || target.resources.hp === 0 || target.conditions.reflect?.statusId === 'safeguard' || ability(target, catalogs, 'Limber') || target.conditions.burn?.statusId === 'paralysis') return false;
  target.conditions.burn = { statusId: 'paralysis', source, duration: { kind: 'counter', policyId, remaining: statusTurns(context, target, 1, 2, catalogs) + 1 }, periodicCountdown: null, payload: { kind: 'none' } };
  refreshSpeed(target, catalogs); context.emit({ type: 'conditionChanged', actorId: target.actorId });
  context.emit({ type: 'message', messageId: 'paralysis-status' });
  if (!ability(target, catalogs, 'Synchronize')) return true;
  const position = target.placement.position;
  for (const d of DIRECTIONS) {
    const neighbor = activeActors(session).find(a => a.placement.kind === 'map' && a.placement.position.x === position.x + d.x && a.placement.position.z === position.z + d.z);
    if (neighbor && target.affiliation !== 'neutral' && neighbor.affiliation !== 'neutral' && neighbor.affiliation !== target.affiliation) inflictParalysis(context, neighbor, source, catalogs, policyId);
  }
  return true;
}
