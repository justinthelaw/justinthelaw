import { actorAt, installSpeedChange } from '../turns/support.js';
import { hasNegativeStatus, refreshSpeed } from './conditions.js';
import { hasHeldItem } from './held-effects.js';
import { cureSinisterStatuses } from './sinister-status-adapters.js';
import { releaseSinisterWrap, validSinisterWrap } from './sinister-condition-lifecycle.js';
import { interruptPetrifiedSleep } from './status-interruptions.js';
import { damageHp } from './hp-damage.js';
import { finishDamage } from './damage-resolution.js';
import { endBide } from './battle-status.js';
import { endRage } from './damage-status.js';
import { applySpeedTimers, advanceSpeedBoostCounter } from '../rules/speed.js';
import { currentSpeedContext } from './speed-context.js';
import { releaseSinisterBide } from './sinister-combat.js';
import { moveTargets } from './move-targets.js';
import { ability, blocked, draw, maxHp, quantity } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('../turns/types.js').ActorRef} ActorRef */
/** @typedef {import('../turns/types.js').HookResult} Result */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {import('../../contracts/sinister-end.js').SinisterEndState} EndState */
/** @typedef {{valid:(actor:Actor)=>boolean; isFloorOver:()=>boolean;
 * displayCheckpoint:(context:Context)=>void; forcedLoss:(context:Context)=>Result;}} Owners */
const CONTINUE = /** @type {const} */ ({ kind: 'continue' });
// Native S48_16 constants, then F48_16_SMul rounded Q16 and truncated milli conversion.
const BELLY_FACTORS = [0, 0, 0, 0, 0, 0, 6554, 16384, 32768, 49152, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 8388608, 8388608];
const LINKED_COSTS = [1, 1, 1, 2, 4];

/** One complete source end, with genuine counters and no engine continuation PC.
 * Clear-weather and missing global/contact owners are proved BEFORE mutation.
 * Display callbacks may not perform simulation or substitute damage/cure.
 * Forced loss captures only actual terminal state; growth/learning follow outside
 * this leaf. Unsupported branches are prerequisites, never live eligibility bans.
 * @param {Context} context @param {ActorRef} ref @param {Catalogs} catalogs
 * @param {Owners} owners @returns {Result} */
export function completeSinisterEnd(context, ref, catalogs, owners) {
  const session = context.state.session;
  const actor = session && actorAt(session, ref);
  if (!actor) return blocked('sinister-end-actor-ref');
  if (!owners.valid(actor) || owners.isFloorOver()) return CONTINUE;
  const end = requireEndDomain(context, actor, catalogs);
  const history = end.actors[actor.actorId];
  if (!history) return blocked('sinister-end-source-actor-history');
  history.bellyEmpty = false;
  refreshSpeed(actor, catalogs);
  if (actor.actorId === session.leaderActorId) {
    const warning = decreaseBelly(context, actor, end);
    if (milliBelly(actor) === 0) {
      if (!display(context, actor, ref, owners)) return CONTINUE;
      end.emptyBellyAlert = Math.min(10, end.emptyBellyAlert + 1);
      dummyDamage(context, actor, 1, 'hunger-damage', end, catalogs);
      history.bellyEmpty = true;
      if (milliBelly(actor) === 0) {
        const message = [null, 'belly-empty', 'belly-eat-soon', 'belly-will-faint'][end.emptyBellyAlert] ?? warning;
        if (message) notify(context, message);
      }
    } else { end.emptyBellyAlert = 0; if (warning) notify(context, warning); }
  }
  let result = settle(context, actor, ref, owners);
  if (result || !valid(context, actor, ref, owners)) return result ?? CONTINUE;
  // Native weather residual branch is empty only under the concrete clear proof.
  const shedRoll = draw(context.state, 100); // unconditional, even healthy/no Shed Skin
  if (ability(actor, catalogs, 'Shed Skin') && shedRoll < 50 && hasNegativeStatus(actor)) {
    if (!display(context, actor, ref, owners)) return CONTINUE;
    cureSinisterStatuses(context, actor, catalogs);
  }
  if (!valid(context, actor, ref, owners)) return CONTINUE;
  speedBoost(context, actor, ref, catalogs);
  if (actor.conditions.sleep?.statusId === 'yawning' && !display(context, actor, ref, owners)) return CONTINUE;
  periodicBurn(context, actor, ref, end, catalogs, owners);
  result = settle(context, actor, ref, owners);
  if (result || !valid(context, actor, ref, owners)) return result ?? CONTINUE;
  periodicFrozen(context, actor, ref, end, catalogs, owners);
  result = settle(context, actor, ref, owners);
  if (result || !valid(context, actor, ref, owners)) return result ?? CONTINUE;
  periodicCurse(context, actor, ref, end, catalogs, owners);
  result = settle(context, actor, ref, owners);
  if (result || !valid(context, actor, ref, owners)) return result ?? CONTINUE;
  periodicLeech(context, actor, ref, end, catalogs, owners);
  result = settle(context, actor, ref, owners);
  if (result || !valid(context, actor, ref, owners)) return result ?? CONTINUE;
  periodicPerish(context, actor, ref, end, catalogs, owners);
  result = settle(context, actor, ref, owners);
  if (result || !valid(context, actor, ref, owners)) return result ?? CONTINUE;
  const release = endBide(context, actor, catalogs);
  if (release !== null) {
    if (!display(context, actor, ref, owners)) return CONTINUE;
    const combat = session.sinisterTurn?.combat;
    if (!combat) return blocked('sinister-end-bide-combat-owner');
    releaseSinisterBide(context, actor, release, catalogs, combat);
  }
  result = settle(context, actor, ref, owners);
  if (result || !valid(context, actor, ref, owners)) return result ?? CONTINUE;
  const rage = actor.conditions.bide;
  if (rage?.statusId === 'enraged' && rage.duration.kind === 'counter') {
    if (rage.duration.remaining === 0) { actor.conditions.bide = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); notify(context, 'rage-ended'); }
    else if (rage.duration.remaining !== 127) endRage(context, actor);
  }
  valid(context, actor, ref, owners);
  return CONTINUE;
}

/** Authenticate complete finite live/link domain, effective weather and true
 * history before resetting bellyEmpty, refreshing speed or consuming any draw.
 * Retired history is retained but cannot hide an active unbounded link/global.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs
 * @returns {EndState} */
function requireEndDomain(context, actor, catalogs) {
  const session = context.state.session;
  if (!session || !('address' in session.floor.location)) return blocked('sinister-end-floor');
  const floor = catalogs.dungeons.getFloorById(session.floor.location.address.floorId);
  const generation = catalogs.dungeons.getGeneration(floor.generationId);
  if (session.dungeonId !== 'sinister-woods' || floor.dungeonId !== session.dungeonId || generation.parameters.weather !== 0 || session.floor.weather.natural.length || session.floor.weather.contributions.length) return blocked('sinister-end-effective-weather-owner');
  const end = /** @type {import('../../contracts/campaign.js').ExpeditionState & {sinisterEnd?:EndState}} */ (session).sinisterEnd;
  if (!end || !Number.isInteger(end.emptyBellyAlert) || end.emptyBellyAlert < 0 || end.emptyBellyAlert > 10) return blocked('sinister-end-source-alert-history');
  const live = Object.values(session.actors).filter(other => other.placement.kind === 'map' && other.placement.mapId === session.floor.mapId && other.resources.hp > 0);
  if (live.length > 132) return blocked('sinister-end-live-domain');
  for (const other of Object.values(session.actors)) {
    const current = live.includes(other), h = end.actors[other.actorId];
    if (!h || typeof h.bellyEmpty !== 'boolean' || !Number.isInteger(h.usedLinkedMovesCounter) || h.usedLinkedMovesCounter < 0 || h.usedLinkedMovesCounter > 4 || !Number.isInteger(h.turnsSinceWarpScarfActivation) || h.turnsSinceWarpScarfActivation < 0 || h.turnsSinceWarpScarfActivation > 19) return blocked('sinister-end-source-actor-history');
    if (!validSinisterWrap(other, session) || !current && other.conditions.leechSeed !== null) return blocked('sinister-end-retired-link-obligation');
    if (!current) continue;
    if (!Number.isInteger(other.resources.hp) || other.resources.hp > 999 || !Number.isInteger(maxHp(other)) || maxHp(other) < 1 || maxHp(other) > 999) return blocked('sinister-end-native-hp-domain');
    for (const c of Object.values(other.conditions)) if (c && c.periodicCountdown !== null && (!Number.isInteger(c.periodicCountdown) || c.periodicCountdown < 0 || c.periodicCountdown > 20)) return blocked('sinister-end-native-periodic-domain');
    if (other.identity.speciesId === 'pokemon-386' || other.identity.speciesId === 'pokemon-352' && other.affiliation === 'hostile') return blocked('sinister-end-special-speed-owner');
    if (other.overrides.types !== null || other.overrides.abilities !== null || other.overrides.form !== null || other.conditions.invisible?.statusId === 'transformed' || other.conditions.reflect?.statusId === 'conversion2' || ability(other, catalogs, 'Forecast')) return blocked('sinister-end-effective-profile-owner');
    if (other.conditions.curse && ['snatch', 'decoy'].includes(other.conditions.curse.statusId) || other.actorId === session.leaderActorId && other.conditions.blinker !== null) return blocked('sinister-end-global-class-owner');
    if (other.conditions.burn?.statusId === 'badly-poisoned') return blocked('sinister-end-bad-poison-ramp-history');
    if ([other.speed.positiveTimers, other.speed.negativeTimers].some(timers => timers.length !== 5 || timers.some(timer => !Number.isInteger(timer) || timer < 0 || timer > 127))) return blocked('sinister-end-native-speed-history');
    if (!Number.isInteger(other.speed.speedBoostCounter) || other.speed.speedBoostCounter < 0 || other.speed.speedBoostCounter > 249) return blocked('sinister-end-speed-boost-history');
    for (const c of [other.conditions.burn, other.conditions.frozen, other.conditions.curse, other.conditions.leechSeed]) if (c && ['burn', 'poisoned', 'constriction', 'wrapped', 'ingrain', 'cursed', 'leech-seed'].includes(c.statusId) && c.periodicCountdown === null) return blocked('sinister-end-native-periodic-history');
  }
  if (hasHeldItem(context.state, actor, 'item-warp-scarf')) return blocked('sinister-end-warp-displacement-owner');
  milliBelly(actor);
  // Existing Bide dependency lacks full contact/EXP staging. Actual pending
  // releases must not partially mutate this end before encountering that seam.
  const bide = actor.conditions.bide;
  if (bide?.statusId === 'bide' && bide.duration.kind === 'counter' && bide.duration.remaining === 1) {
    if (!session.sinisterTurn?.combat) return blocked('sinister-end-bide-combat-owner');
    const target = moveTargets(session, actor, 0, catalogs, { kind: 'facing' })[0];
    if (target && (target.conditions.reflect?.statusId !== 'protect' && target.conditions.frozen?.statusId !== 'frozen' || actor.conditions.leechSeed?.payload.kind === 'actor-link' && actor.conditions.leechSeed.payload.actorId === target.actorId && ability(actor, catalogs, 'Liquid Ooze') && target.resources.hp <= 10)) return blocked('sinister-end-bide-contact-exp-owner');
  }
  return end;
}

/** Source native FixedPoint has thousandths, not a Q16 resource value.
 * @param {Actor} actor @returns {number} */
function milliBelly(actor) {
  const belly = actor.resources.belly;
  const n = belly.numerator * 1000 / belly.denominator;
  if (!Number.isSafeInteger(n) || n < 0 || n > 32767999) return blocked('sinister-end-milli-belly-history');
  return n;
}
/** @param {Context} context @param {Actor} actor @param {EndState} end
 * @returns {string|null} */
function decreaseBelly(context, actor, end) {
  let index = hasHeldItem(context.state, actor, 'item-tight-belt') ? 0 : 10;
  if (hasHeldItem(context.state, actor, 'item-stamina-band')) index--;
  if (actor.enabledIqSkillIds.includes(/** @type {import('../../contracts/campaign.js').IqSkillId} */ ('iq-energy-saver'))) index--;
  for (const id of ['item-diet-ribbon', 'item-heal-ribbon', 'item-munch-belt']) if (hasHeldItem(context.state, actor, id)) index++;
  index = Math.max(0, Math.min(19, index));
  const factor = BELLY_FACTORS[index];
  if (factor === undefined) return blocked('sinister-end-belly-table');
  let decrement = Math.floor((6554 * factor + 32768) / 65536);
  const history = end.actors[actor.actorId];
  if (!history) return blocked('sinister-end-source-actor-history');
  if (history.usedLinkedMovesCounter > 1) {
    const linked = LINKED_COSTS[history.usedLinkedMovesCounter];
    if (linked === undefined) return blocked('sinister-end-linked-table');
    decrement += linked * 65536;
  }
  history.usedLinkedMovesCounter = 0;
  const before = milliBelly(actor);
  const milli = Math.trunc(decrement / 65536) * 1000 + Math.trunc(1000 * (decrement % 65536) / 65536);
  let after = Math.max(0, before - milli);
  if (after < 1000) after = 0;
  actor.resources.belly = quantity(after, 1000);
  if (after !== before) context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  if (Math.trunc(before / 1000) > 9 && Math.trunc(after / 1000) <= 9) return 'belly-very-low';
  if (Math.trunc(before / 1000) > 19 && Math.trunc(after / 1000) <= 19) return 'belly-low';
  return null;
}

/** @param {Context} context @param {Actor} actor @param {ActorRef} ref @param {Owners} owners */
function valid(context, actor, ref, owners) { const session = context.state.session; return !!session && actorAt(session, ref) === actor && owners.valid(actor) && !owners.isFloorOver(); }
/** @param {Context} context @param {Actor} actor @param {ActorRef} ref @param {Owners} owners */
function display(context, actor, ref, owners) { owners.displayCheckpoint(context); return valid(context, actor, ref, owners); }
/** @param {Context} context @param {Actor} actor @param {ActorRef} ref @param {Owners} owners @returns {Result|null} */
function settle(context, actor, ref, owners) {
  const result = owners.forcedLoss(context);
  if (result.kind !== 'continue') {
    if ((result.kind === 'prompt' || result.kind === 'yield') && !owners.isFloorOver()) return blocked('sinister-end-nonterminal-interruption');
    return result;
  }
  return valid(context, actor, ref, owners) ? null : CONTINUE;
}
/** @param {import('../../contracts/campaign.js').ConditionState} condition */
function due(condition) { if (condition.periodicCountdown === null) return blocked('sinister-end-periodic-counter'); return condition.periodicCountdown === 0 || --condition.periodicCountdown === 0; }
/** Native dummy HP path: interrupt, Frozen guard, 127 sleep wake, Bide nominal
 * damage, reciprocal release, immediate Reviver/faint. No contact or EXP.
 * @param {Context} context @param {Actor} actor @param {number} amount
 * @param {string} message @param {EndState} end @param {Catalogs} catalogs */
function dummyDamage(context, actor, amount, message, end, catalogs) {
  if (actor.resources.hp <= 0 || actor.placement.kind !== 'map' || actor.placement.mapId !== context.state.session?.floor.mapId) return;
  interruptPetrifiedSleep(context, actor);
  if (actor.conditions.frozen?.statusId === 'frozen') { notify(context, 'frozen-prevented-damage'); return; }
  const sleep = actor.conditions.sleep;
  if (sleep && ['napping', 'nightmare'].includes(sleep.statusId) && (sleep.duration.kind === 'indefinite' || sleep.duration.kind === 'counter' && sleep.duration.remaining === 127)) { actor.conditions.sleep = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); }
  damageHp(actor, amount);
  notify(context, message);
  if (actor.resources.hp === 0) releaseSinisterWrap(context, actor);
  const resolution = finishDamage(context, actor, catalogs, null, false);
  if (resolution === 'revived' && actor.actorId === context.state.session?.leaderActorId) end.emptyBellyAlert = 0;
}
/** HealTargetHP(...,10,0,TRUE), including its zero/full/recovery outcome.
 * @param {Context} context @param {Actor} actor */
function healTen(context, actor) {
  if (actor.resources.hp <= 0 || actor.placement.kind !== 'map' || actor.placement.mapId !== context.state.session?.floor.mapId) return;
  const before = actor.resources.hp;
  actor.resources.hp = Math.min(maxHp(actor), before + 10);
  if (actor.resources.hp !== before) context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  notify(context, actor.resources.hp === before ? 'hp-unchanged' : actor.resources.hp === maxHp(actor) ? 'hp-fully-healed' : 'hp-recovered');
}
/** Native BoostSpeed(...,127,FALSE): capped stage4 has no message; an
 * unchanged below-cap stage and a genuine raise still print their source result.
 * Existing installation updates actor refresh/unlock flags, never an engine PC.
 * @param {Context} context @param {Actor} actor @param {ActorRef} ref @param {Catalogs} catalogs */
function speedBoost(context, actor, ref, catalogs) {
  if (!ability(actor, catalogs, 'Speed Boost')) return;
  const tick = advanceSpeedBoostCounter(actor.speed.speedBoostCounter);
  actor.speed.speedBoostCounter = tick.counter;
  if (!tick.requestIndefiniteRaise) return;
  const change = applySpeedTimers(currentSpeedContext(actor, catalogs), 'raise', [127], false);
  installSpeedChange(context, ref, change);
  if (change.inserted) context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  if (change.before !== 4) notify(context, change.after > change.before ? 'speed-raised' : 'speed-unchanged');
}
/** @param {Context} context @param {Actor} actor @param {ActorRef} ref @param {EndState} end @param {Catalogs} catalogs @param {Owners} owners */
function periodicBurn(context, actor, ref, end, catalogs, owners) {
  const condition = actor.conditions.burn;
  if (!condition || !['burn', 'poisoned'].includes(condition.statusId) || !due(condition)) return;
  if (!display(context, actor, ref, owners)) return;
  condition.periodicCountdown = condition.statusId === 'burn' ? 20 : 10;
  dummyDamage(context, actor, condition.statusId === 'burn' ? 5 : 4, condition.statusId === 'burn' ? 'burn-damage' : 'poison-damage', end, catalogs);
}
/** @param {Context} context @param {Actor} actor @param {ActorRef} ref @param {EndState} end @param {Catalogs} catalogs @param {Owners} owners */
function periodicFrozen(context, actor, ref, end, catalogs, owners) {
  const condition = actor.conditions.frozen;
  if (!condition || !['constriction', 'wrapped', 'ingrain'].includes(condition.statusId) || !due(condition)) return;
  if (!display(context, actor, ref, owners)) return;
  condition.periodicCountdown = condition.statusId === 'ingrain' ? 5 : 2;
  if (condition.statusId === 'ingrain') healTen(context, actor);
  else dummyDamage(context, actor, condition.statusId === 'wrapped' ? 6 : 5, condition.statusId === 'wrapped' ? 'wrap-damage' : 'constriction-damage', end, catalogs);
}
/** @param {Context} context @param {Actor} actor @param {ActorRef} ref @param {EndState} end @param {Catalogs} catalogs @param {Owners} owners */
function periodicCurse(context, actor, ref, end, catalogs, owners) {
  const condition = actor.conditions.curse;
  if (condition?.statusId !== 'cursed' || !due(condition)) return;
  const amount = Math.max(1, Math.trunc(maxHp(actor) / 4));
  condition.periodicCountdown = 10; // source reset precedes DisplayActions
  if (!display(context, actor, ref, owners)) return;
  dummyDamage(context, actor, amount, 'curse-damage', end, catalogs);
}
/** @param {Context} context @param {Actor} actor @param {ActorRef} ref @param {EndState} end @param {Catalogs} catalogs @param {Owners} owners */
function periodicLeech(context, actor, ref, end, catalogs, owners) {
  const condition = actor.conditions.leechSeed, session = context.state.session;
  if (!session || condition?.statusId !== 'leech-seed' || !due(condition)) return;
  condition.periodicCountdown = 2;
  const source = condition.payload.kind === 'actor-link' && condition.payload.actorId ? session.actors[condition.payload.actorId] : null;
  if (!source || source.resources.hp === 0 || source.placement.kind !== 'map' || source.placement.mapId !== session.floor.mapId) { actor.conditions.leechSeed = null; context.emit({ type: 'conditionChanged', actorId: actor.actorId }); return; }
  const ooze = ability(actor, catalogs, 'Liquid Ooze'); // capture BEFORE damage/Reviver
  if (!display(context, actor, ref, owners) || !owners.valid(source)) return;
  if (actor.conditions.frozen?.statusId === 'frozen') return;
  dummyDamage(context, actor, 10, 'leech-seed-damage', end, catalogs);
  // Source intentionally transfers nominal10 without an intervening floor/HP guard.
  if (ooze) dummyDamage(context, source, 10, 'liquid-ooze-damage', end, catalogs);
  else healTen(context, source);
}
/** @param {Context} context @param {Actor} actor @param {ActorRef} ref @param {EndState} end @param {Catalogs} catalogs @param {Owners} owners */
function periodicPerish(context, actor, ref, end, catalogs, owners) {
  const condition = actor.auxiliaryConditions.perishSong;
  if (!condition || condition.duration.kind !== 'counter' || condition.duration.remaining === 0 || condition.duration.remaining === 127 || --condition.duration.remaining !== 0) return;
  actor.auxiliaryConditions.perishSong = null;
  context.emit({ type: 'conditionChanged', actorId: actor.actorId });
  if (!display(context, actor, ref, owners)) return;
  notify(context, 'perish-song-expired');
  interruptPetrifiedSleep(context, actor);
  if (actor.conditions.reflect?.statusId === 'protect') notify(context, 'protect-saved-actor');
  else dummyDamage(context, actor, 9999, 'perish-song-damage', end, catalogs);
}
/** @param {Context} context @param {string} messageId */
function notify(context, messageId) { context.emit({ type: 'message', messageId }); }
