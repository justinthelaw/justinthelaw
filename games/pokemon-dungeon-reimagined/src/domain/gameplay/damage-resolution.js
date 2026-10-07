import { damageHp } from './hp-damage.js';
import { rollContactReactions } from './conditions.js';
import { tryRevive } from './revival.js';
import { noteSteelBossFaint } from './steel.js';
import { recordSpeciesSeen } from '../state/species-seen.js';
import { blocked, profile, quantity, value } from './support.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
/** @typedef {import('./support.js').Catalogs} Catalogs */
/** Shared native damage boundary. A null attacker denotes the native dummy
 * environmental entity; real self recoil remains a monster source. Immediate
 * faint/revival precedes reactive rolls. Callers apply returned contact flags
 * only after their own secondary effects; flags survive user revival.
 * @param {Context} context @param {Actor} target @param {Catalogs} catalogs
 * @param {{attacker:Actor|null, amount:number, contact:boolean, physical:boolean, giveExperience?:boolean}} damage */
export function dealDamage(context, target, catalogs, damage) {
  damageHp(target, damage.amount);
  const resolution = finishDamage(context, target, catalogs, damage.attacker, damage.giveExperience ?? true);
  const reactions = damage.amount > 0 && damage.contact && damage.attacker ? rollContactReactions(context, damage.attacker, target, damage.physical, catalogs) : [];
  return { resolution, reactions };
}

/** Shared faint/experience ownership for damage moves and fixed item damage.
 * @param {Context} context @param {Actor} target @param {Catalogs} catalogs @param {Actor|null} attacker @param {boolean} [giveExperience] */
export function finishDamage(context, target, catalogs, attacker, giveExperience = true) {
  const session = context.state.session; if (!session) return blocked('damage-session');
  if (tryRevive(context, target, catalogs)) return 'revived';
  if (target.resources.hp === 0 && attacker?.actorId === session.leaderActorId) recordSpeciesSeen(context.state, target.identity);
  if (target.resources.hp === 0 && target.affiliation !== 'team') {
    noteSteelBossFaint(context, target);
    // R CalculateEXPGain and dungeon_damage.c: half credit until a move hits.
    const p = profile(target.identity, catalogs); const base = p.experienceYield + Math.trunc(p.experienceYield * (target.growth.level - 1) / 10);
    const xp = Math.max(1, target.memory.experienceContributors.length ? base : Math.trunc(base / 2));
    for (const id of giveExperience ? session.teamOrder : []) {
      const actor = session.actors[id]; if (!actor) continue;
      actor.growth.totalExperience = quantity(Math.min(9999999, value(actor.growth.totalExperience) + xp));
      actor.gains.experience = quantity(value(actor.gains.experience) + xp);
    }
    target.placement = { kind: 'off-map', reason: 'fainted' };
    target.speed.movementPending = false; target.speed.endEffectsPending = false; target.speed.deferred = false;
    const index = session.scheduler.wildSlots.indexOf(target.actorId); if (index >= 0) session.scheduler.wildSlots[index] = null;
    context.emit({ type: 'message', messageId: 'enemy-fainted' });
  }
  return target.resources.hp === 0 ? 'fainted' : 'alive';
}
