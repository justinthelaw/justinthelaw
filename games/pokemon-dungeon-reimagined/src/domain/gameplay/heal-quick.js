import { hasNegativeStatus, refreshSpeed } from './conditions.js';
import { clearPetrified } from './status-interruptions.js';
import { currentSpeedContext } from './speed-context.js';
import { applySpeedTimers, makeRaisedSpeedTimer } from '../rules/speed.js';
import { installSpeedChange } from '../turns/support.js';
import { blocked, draw } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */

/** Native sub_8079F20's admitted class ends in source order. Wider Napping,
 * reciprocal Wrap, Snatch/Decoy and eyesight/global ends need their real owners
 * before admission; never partially erase those future states.
 * @param {Context} context @param {Actor} target @param {Catalogs} catalogs
 * @param {boolean} impactMessage */
export function healSeed(context, target, catalogs, impactMessage) {
  if (!validRecipient(context, target)) return;
  const c = target.conditions, a = target.auxiliaryConditions;
  if (c.sleep && c.sleep.statusId !== 'sleep'
    || c.burn && !['poisoned', 'paralysis', 'burn'].includes(c.burn.statusId)
    || c.frozen && c.frozen.statusId !== 'petrified'
    || c.cringe && !['confused', 'infatuated', 'cringe'].includes(c.cringe.statusId)
    || c.curse || c.leechSeed && c.leechSeed.statusId !== 'leech-seed'
    || c.sureShot && !['focus-energy', 'whiffer'].includes(c.sureShot.statusId)
    || c.blinker || a.muzzled || a.perishSong || a.exposed) return blocked('heal-class-end-owner');
  // Exactly one predicate, after thrown interruption, including slow and seals.
  let changed = hasNegativeStatus(target);
  if (changed) {
    end('sleep', 'sleep-ended');
    end('burn', `${c.burn?.statusId ?? 'burn'}-ended`);
    clearPetrified(context, target);
    end('cringe', `${c.cringe?.statusId ?? 'cringe'}-ended`);
    // EndCringe always recalculates, even when the cringe class was empty.
    refreshSpeed(target, catalogs);
    // Curse is unadmitted. EndLeech releases only this recipient's link.
    end('leechSeed', 'leech-seed-ended');
    end('sureShot', `${c.sureShot?.statusId ?? 'sure-shot'}-ended`);
    // Eyesight, Muzzled, Perish and Exposed remain explicit unadmitted owners.
  }
  refreshSpeed(target, catalogs);
  const before = target.speed.cachedStage;
  const slowed = target.speed.negativeTimers.some(Boolean);
  target.speed.negativeTimers.fill(0);
  // CalcSpeedStage only changes cache: preserve every action/scheduler flag.
  refreshSpeed(target, catalogs);
  if (slowed) context.emit({ type: 'conditionChanged', actorId: target.actorId });
  if (before !== target.speed.cachedStage) { changed = true; context.emit({ type: 'message', messageId: 'speed-restored' }); }
  let unsealed = false;
  for (const slot of target.battleMoves.slots) if (slot.sealed) { slot.sealed = false; unsealed = true; }
  if (unsealed) {
    changed = true;
    context.emit({ type: 'conditionChanged', actorId: target.actorId });
    context.emit({ type: 'message', messageId: 'moves-unsealed' });
  }
  if (!changed && !impactMessage) context.emit({ type: 'message', messageId: 'heal-already-cured' });
  /** @param {'sleep'|'burn'|'cringe'|'leechSeed'|'sureShot'} group @param {string} messageId */
  function end(group, messageId) {
    if (!c[group]) return;
    c[group] = null;
    context.emit({ type: 'conditionChanged', actorId: target.actorId });
    context.emit({ type: 'message', messageId });
  }
}

/** Native BoostSpeed(target,0,TRUE): one unreduced duration draw before cap or
 * array checks, first empty positive slot, existing turn flag installation.
 * @param {Context} context @param {Actor} target @param {Catalogs} catalogs */
export function quickSeed(context, target, catalogs) {
  if (!validRecipient(context, target)) return;
  const timer = makeRaisedSpeedTimer(8 + draw(context.state, 2));
  const change = applySpeedTimers(currentSpeedContext(target, catalogs), 'raise', [timer], false);
  const session = context.state.session; if (!session) return blocked('quick-session');
  const team = session.scheduler.teamSlots.indexOf(target.actorId), wild = session.scheduler.wildSlots.indexOf(target.actorId);
  if (team < 0 && wild < 0) return blocked('quick-slot-owner');
  installSpeedChange(context, { side: team >= 0 ? 'team' : 'wild', slot: team >= 0 ? team : wild, actorId: target.actorId }, change);
  if (change.inserted) context.emit({ type: 'conditionChanged', actorId: target.actorId });
  context.emit({ type: 'message', messageId: change.after > change.before ? 'speed-raised' : change.before === 4 ? 'speed-at-maximum' : 'speed-unchanged' });
}
/** @param {Context} context @param {Actor} target */
function validRecipient(context, target) {
  const session = context.state.session;
  return !!session && session.actors[target.actorId] === target && target.placement.kind === 'map' && target.placement.mapId === session.floor.mapId && target.resources.hp > 0;
}
