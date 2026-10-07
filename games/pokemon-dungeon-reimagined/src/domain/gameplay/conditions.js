import { damageHp } from './hp-damage.js';
import { ability, profile, draw, blocked, quantity } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** Native CalculateStatusTurns; equal endpoints do not draw. @param {Context} context @param {Actor} actor @param {number} low @param {number} high @param {Catalogs} catalogs */
function turns(context, actor, low, high, catalogs) {
  let n = low + (high === low ? 0 : draw(context.state, high - low));
  if (n !== 127 && actor.enabledIqSkillIds.some(id => id === 'iq-self-curer')) n = Math.trunc(n / 2);
  if (n !== 127 && ability(actor, catalogs, 'Natural Cure')) n = Math.min(n, 5);
  return Math.max(1, n);
}
/** @param {Actor} actor @param {Catalogs} catalogs */
export function refreshSpeed(actor, catalogs) {
  actor.speed.cachedStage = Math.max(0, Math.min(4, profile(actor.identity, catalogs).baseMovementSpeed + actor.speed.positiveTimers.filter(Boolean).length - actor.speed.negativeTimers.filter(Boolean).length - Number(actor.conditions.burn?.statusId === 'paralysis')));
}
/** Actual ability owner is retained as provenance; source applies these flags to
 * the attacker after the hit. Poison Point has no physical-type restriction.
 * @param {Context} context @param {Actor} attacker @param {Actor} defender @param {boolean} physical @param {Catalogs} catalogs */
export function contactReactions(context, attacker, defender, physical, catalogs) {
  const session = context.state.session; if (!session) return blocked('reaction-session');
  if (defender.resources.hp <= 0 || defender.conditions.sleep && defender.conditions.sleep.statusId !== 'sleepless' || defender.conditions.frozen || defender.conditions.bide) return;
  for (const [name, status, group] of /** @type {const} */ ([['Static', 'paralysis', 'burn'], ['Poison Point', 'poisoned', 'burn'], ['Cute Charm', 'infatuated', 'cringe']])) {
    if (name !== 'Poison Point' && !physical || !ability(defender, catalogs, name) || draw(context.state, 100) >= 12) continue;
    if (attacker.conditions[group]?.statusId === status) continue;
    if (status === 'paralysis' && ability(attacker, catalogs, 'Limber') || status === 'infatuated' && ability(attacker, catalogs, 'Oblivious')) continue;
    if (status === 'poisoned' && (ability(attacker, catalogs, 'Immunity') || profile(attacker.identity, catalogs).typeIds.some(id => id === 8 || id === 17) || attacker.conditions.burn?.statusId === 'badly-poisoned')) continue;
    const source = catalogs.species.identities.abilities.find(row => row.name === name); if (!source) return blocked('reaction-ability');
    const duration = status === 'poisoned' ? 128 : status === 'paralysis' ? turns(context, attacker, 1, 2, catalogs) + 1 : turns(context, attacker, 4, 6, catalogs) + 1;
    attacker.conditions[group] = { statusId: status, source: { kind: 'ability', actor: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: defender.actorId, identity: { ...defender.identity } }, abilityId: /** @type {import('../../contracts/campaign.js').AbilityId} */ (source.id) }, duration: { kind: 'counter', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-cave-condition'), remaining: duration }, periodicCountdown: status === 'poisoned' ? 0 : null, payload: { kind: 'none' } };
    refreshSpeed(attacker, catalogs); context.emit({ type: 'conditionChanged', actorId: attacker.actorId });
  }
}
/** @param {Context} context @param {Actor} actor @param {Catalogs} catalogs */
export function sleepSeed(context, actor, catalogs) {
  const session = context.state.session; if (!session) return blocked('sleep-session');
  let duration = turns(context, actor, 3, 7, catalogs);
  if (ability(actor, catalogs, 'Insomnia') || ability(actor, catalogs, 'Vital Spirit') || actor.enabledIqSkillIds.some(id => id === 'iq-nonsleeper') || actor.conditions.sleep) return;
  if (ability(actor, catalogs, 'Early Bird')) duration = Math.max(1, Math.trunc(duration / 2));
  actor.conditions.sleep = { statusId: 'sleep', source: { kind: 'item', itemId: /** @type {import('../../contracts.js').ItemId} */ ('item-sleep-seed'), user: { sessionId: session.sessionId, mapId: session.floor.mapId, actorId: actor.actorId, identity: { ...actor.identity } } }, duration: { kind: 'counter', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-cave-condition'), remaining: duration }, periodicCountdown: null, payload: { kind: 'none' } };
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
}
/** Native counter 127 persists, including poison's 128→127 first tick.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs */
export function tickConditions(context, actor, catalogs) {
  for (const group of /** @type {const} */ (['sleep', 'burn', 'cringe'])) {
    const c = actor.conditions[group];
    if (c?.duration.kind !== 'counter' || c.duration.remaining === 127) continue;
    if (--c.duration.remaining === 0) { actor.conditions[group] = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); }
  }
  refreshSpeed(actor, catalogs);
}
/** @param {Context} context @param {Actor} actor */
export function poisonDamage(context, actor) {
  const c = actor.conditions.burn;
  if (c?.statusId !== 'poisoned' || c.periodicCountdown === null) return;
  if (c.periodicCountdown > 0) c.periodicCountdown--;
  if (c.periodicCountdown === 0) { c.periodicCountdown = 10; damageHp(actor, 4); context.emit({ type: 'message', messageId: 'poison-damage' }); }
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
