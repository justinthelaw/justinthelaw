import { SELF_STATUS_MOVES, selfBattleStatus } from './battle-status.js';
import { damageHp } from './hp-damage.js';
import { rapidSpinCleanup, takeDownRecoil } from './post-hit-effects.js';
import { contactReactions, confusionSecondary, hasNegativeStatus } from './conditions.js';
import { tryRevive } from './revival.js';
import { recordSpeciesSeen } from '../state/species-seen.js';
import { calculateNormalDamage } from '../rules/damage.js';
import { ELEMENT_TYPES, isPhysicalType, lookupTypeMatchup, combineTypeMatchups } from '../rules/type-context.js';
import { moveTargets } from './move-targets.js';
import { STAT_MOVES, changeStatStage } from './stat-effects.js';
import { draw, value, maxHp, ability, profile, blocked, quantity } from './support.js';

/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor */
/** @typedef {import('../turns/types.js').MutationContext} Context */
// Pinned R dungeon_config.c:gAccEvsStatStageMultipliers (Q8 truncation).
const ACCURACY = [84, 89, 94, 102, 110, 115, 140, 153, 179, 204, 256, 320, 384, 409, 422, 435, 448, 460, 473, 486, 512];
const EVASION = [512, 486, 473, 460, 448, 435, 422, 409, 384, 345, 256, 204, 179, 153, 128, 102, 89, 76, 64, 51, 38];
/** @param {Actor} actor @param {Catalogs} catalogs @returns {[import('../rules/type-context.js').ElementType,import('../rules/type-context.js').ElementType]} */
function types(actor, catalogs) { const ids = profile(actor.identity, catalogs).typeIds; return [ELEMENT_TYPES[ids[0] ?? 0] ?? 'None', ELEMENT_TYPES[ids[1] ?? 0] ?? 'None']; }
/** @param {Catalogs} catalogs @param {string} id */
export function supportedMove(catalogs, id) {
  const move = catalogs.effects.getMove(id);
  return SELF_STATUS_MOVES.includes(id) || ['move-rapid-spin', 'move-take-down', 'move-confusion'].includes(id) || STAT_MOVES.includes(id) || move.hitCountContract.count === 1 && move.target.rangeCode === 0 && move.effects.length === 1 && move.effects.every(effect => effect.op === 'normal-damage' && Object.keys(effect).every(key => ['op', 'finalMultiplier'].includes(key))) && move.effects.some(effect => effect.op === 'normal-damage' && (effect.finalMultiplier === undefined || typeof effect.finalMultiplier === 'number'));
}
/** @param {Context} context @param {Actor} attacker @param {Actor} target @param {number} base @param {boolean} physical @param {Catalogs} catalogs */
function accuracy(context, attacker, target, base, physical, catalogs) {
  const roll = draw(context.state, 100);
  if (attacker.actorId === target.actorId || base > 100) return true;
  const a = Math.max(0, Math.min(20, attacker.stages.accuracy + (ability(attacker, catalogs, 'Compoundeyes') ? 2 : 0)));
  const e = Math.max(0, Math.min(20, target.stages.evasion + (physical && ability(attacker, catalogs, 'Hustle') ? 2 : 0)));
  return roll < Math.trunc(Math.trunc(base * (ACCURACY[a] ?? 256) / 256) * (EVASION[e] ?? 256) / 256);
}
/** Native pre-dispatch wake occurs before protection and hit checks, but only
 * clears indefinite spawn sleep, never finite sleep from an item/effect.
 * @param {Context} context @param {Actor} target */
function wakeSpawnSleeper(context, target) {
  if (target.conditions.sleep?.duration.kind !== 'indefinite') return;
  target.conditions.sleep = null;
  context.emit({ type: 'conditionChanged', actorId: target.actorId });
}
/** Single-impact supported actions resolve HP before returning to the scheduler.
 * @param {Context} context @param {Actor} attacker @param {import('../../contracts/campaign.js').ResolvedAction & {kind:'attack'|'move-use'}} action @param {Catalogs} catalogs */
export function attack(context, attacker, action, catalogs) {
  const session = context.state.session;
  if (!session || attacker.placement.kind !== 'map') return blocked('combat-session');
  if (attacker.conditions.burn?.statusId === 'paralysis') { context.emit({ type: 'message', messageId: 'paralysis-prevents-attack' }); return; }
  const regular = action.kind === 'attack';
  const move = regular ? catalogs.effects.getAction(355) : catalogs.effects.getMove(action.moveId);
  if (!regular && !supportedMove(catalogs, action.moveId)) return blocked('move-effect-not-supported');
  const slot = !regular ? attacker.moves.slots.find(row => row?.moveSlotId === action.moveSlotId) : null;
  if (!regular) {
    const pp = attacker.battleMoves.slots.find(row => row.moveSlotId === action.moveSlotId);
    if (!pp || pp.currentPp === 0 || pp.sealed || !slot) return blocked('move-pp-unavailable');
    pp.currentPp--; pp.usedForExperience = true;
    attacker.memory.lastUsedMove = { moveId: action.moveId, moveSlotId: action.moveSlotId };
  }
  const targets = moveTargets(session, attacker, move.target.rangeCode, catalogs, action.target);
  if (!regular && SELF_STATUS_MOVES.includes(action.moveId) && slot) {
    wakeSpawnSleeper(context, attacker);
    accuracy(context, attacker, attacker, move.numeric.accuracyBeforeEffect, true, catalogs);
    if (attacker.affiliation !== 'team' && !attacker.memory.experienceContributors.includes(attacker.actorId)) attacker.memory.experienceContributors.push(attacker.actorId);
    selfBattleStatus(context, attacker, slot);
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: attacker.actorId, outcome: 'hit' }); return;
  }
  if (!regular && STAT_MOVES.includes(action.moveId)) {
    const effect = move.effects[0];
    if (effect?.op !== 'stat-stage' || !['attack', 'defense', 'accuracy'].includes(effect.stat)) return blocked('stat-move-projection');
    for (const target of targets) {
      wakeSpawnSleeper(context, target);
      if (action.moveId === 'move-growl' && ability(target, catalogs, 'Soundproof')) {
        context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'immune' }); continue;
      }
      if (!accuracy(context, attacker, target, move.numeric.accuracyBeforeEffect, move.numeric.type !== 'psychic', catalogs)) {
        context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'miss' }); continue;
      }
      // Native UseMoveAgainstTargets raises the experience multiplier before
      // dispatch, even when a stat cap or protection makes the effect fail.
      if (target.affiliation !== 'team' && !target.memory.experienceContributors.includes(attacker.actorId)) target.memory.experienceContributors.push(attacker.actorId);
      changeStatStage(context, target, /** @type {'attack'|'defense'|'accuracy'} */ (effect.stat), effect.delta, catalogs);
      context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'hit' });
    }
    if (!targets.length) context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: null, outcome: 'miss' });
    return;
  }
  const target = targets[0];
  if (!target) { context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: null, outcome: 'miss' }); return; }
  wakeSpawnSleeper(context, target);
  const moveType = ELEMENT_TYPES.find(type => type.toLowerCase() === move.numeric.type);
  if (!moveType) return blocked('move-type');
  const physical = isPhysicalType(moveType);
  // Source physical-type retaliation is resolved below after positive damage.
  if (!accuracy(context, attacker, target, move.numeric.accuracyBeforeEffect, physical, catalogs)) {
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'miss' }); return;
  }
  const provisionalCredit = !regular && target.affiliation !== 'team' && !target.memory.experienceContributors.includes(attacker.actorId);
  if (provisionalCredit) target.memory.experienceContributors.push(attacker.actorId);
  const restoreFailedCredit = () => { if (provisionalCredit) target.memory.experienceContributors.splice(target.memory.experienceContributors.indexOf(attacker.actorId), 1); };
  const a = (/** @type {string} */ name) => ability(attacker, catalogs, name);
  const d = (/** @type {string} */ name) => ability(target, catalogs, name);
  const offense = physical ? 'attack' : 'specialAttack'; const defense = physical ? 'defense' : 'specialDefense';
  const armor = d('Battle Armor') || d('Shell Armor');
  const early = attacker.actorId !== session.leaderActorId && Math.floor(value(attacker.resources.belly)) === 0 || regular && d('Wonder Guard');
  const effect = move.effects.find(effect => effect.op === 'normal-damage');
  const multiplier = effect && typeof effect.finalMultiplier === 'number' ? effect.finalMultiplier : 1;
  const result = calculateNormalDamage({
    type: { moveType, attackerTypes: types(attacker, catalogs), defenderTypes: types(target, catalogs), defenderExposed: false,
      abilities: { wonderGuard: d('Wonder Guard'), thickFat: d('Thick Fat'), flashFire: d('Flash Fire'), levitate: d('Levitate'), torrent: a('Torrent'), overgrow: a('Overgrow'), swarm: a('Swarm'), blaze: a('Blaze') },
      attackerHp: attacker.resources.hp, attackerMaxHp: maxHp(attacker), weather: 'clear', mudSport: false, waterSport: false, charging: false },
    stats: { rawOffense: attacker.growth.naturalStats[offense] + attacker.growth.permanentStatBonuses[offense], rawDefense: target.growth.naturalStats[defense] + target.growth.permanentStatBonuses[defense], movePower: move.numeric.power + (slot?.powerBoost ?? 0), offenseStage: attacker.stages[offense], defenseStage: target.stages[defense], offensiveMultiplierQ8: value(attacker.multipliers[offense]) * 256, defensiveMultiplierQ8: value(target.multipliers[defense]) * 256,
      flashFireBoost: 0, attackerForm: 'none', defenderForm: 'none', skullBash: false, attackerItem: 'none', defenderItem: 'none',
      abilities: { guts: a('Guts'), attackerNegativeStatus: hasNegativeStatus(attacker), hugePower: a('Huge Power'), purePower: a('Pure Power'), hustle: a('Hustle'), plus: a('Plus'), minus: a('Minus'), sameSidePlus: Object.values(session.actors).some(actor => actor.affiliation === attacker.affiliation && actor.placement.kind === 'map' && ability(actor, catalogs, 'Plus')), sameSideMinus: Object.values(session.actors).some(actor => actor.affiliation === attacker.affiliation && actor.placement.kind === 'map' && ability(actor, catalogs, 'Minus')), intimidate: d('Intimidate'), marvelScale: d('Marvel Scale'), defenderNegativeStatus: hasNegativeStatus(target) } },
    critical: { moveChance: move.numeric.criticalPercent, focusEnergy: attacker.conditions.sureShot?.statusId === 'focus-energy', typeAdvantageMaster: false, battleArmor: d('Battle Armor'), shellArmor: d('Shell Armor') },
    teamMember: attacker.affiliation === 'team', leader: attacker.actorId === session.leaderActorId, integerBelly: Math.floor(value(attacker.resources.belly)), level: attacker.growth.level, regularAttack: regular,
    targetEffectsApply: true, reflect: false, lightScreen: false, moveEffectMultiplierQ8: Math.trunc(multiplier * 256), rolls: early ? null : { sharedPowerRoll: draw(context.state, 100), criticalRoll: armor ? null : draw(context.state, 100), varianceRoll: draw(context.state, 16384) } });
  // Native CalcDamage draws precede the second accuracy check. Stat effects
  // never run that damage-only check.
  if (!accuracy(context, attacker, target, move.numeric.accuracyAfterDamage, physical, catalogs)) {
    restoreFailedCredit();
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'miss' }); return;
  }
  if (result.damage === 0) restoreFailedCredit();
  damageHp(target, result.damage);
  if (result.damage > 0) contactReactions(context, attacker, target, physical, catalogs);
  context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: result.damage ? 'hit' : 'immune' });
  const resolution = finishDamage(context, target, catalogs, attacker);
  if (!regular && action.moveId === 'move-confusion' && result.damage > 0 && resolution !== 'revived') confusionSecondary(context, attacker, target, catalogs);
  if (!regular && result.damage > 0) {
    if (action.moveId === 'move-take-down' && takeDownRecoil(attacker, catalogs)) {
      finishDamage(context, attacker, catalogs, attacker, false);
      context.emit({ type: 'message', messageId: 'move-recoil' });
    }
    if (action.moveId === 'move-rapid-spin') rapidSpinCleanup(context, attacker);
  }
}

/** Shared faint/experience ownership for damage moves and fixed item damage.
 * @param {Context} context @param {Actor} target @param {Catalogs} catalogs @param {Actor} attacker @param {boolean} [giveExperience] */
export function finishDamage(context, target, catalogs, attacker, giveExperience = true) {
  const session = context.state.session; if (!session) return blocked('damage-session');
  if (tryRevive(context, target, catalogs)) return 'revived';
  if (target.resources.hp === 0 && attacker.actorId === session.leaderActorId) recordSpeciesSeen(context.state, target.identity);
  if (target.resources.hp === 0 && target.affiliation !== 'team') {
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

/** Source internal Bide2 release is typed fixed damage and consumes no learned
 * slot PP, second accuracy, variance or critical roll. Current facing is used.
 * @param {Context} context @param {Actor} actor @param {number} amount @param {Catalogs} catalogs */
export function releaseBide(context, actor, amount, catalogs) {
  const session = context.state.session; if (!session) return;
  const target = moveTargets(session, actor, 0, catalogs, { kind: 'facing' })[0];
  if (!target) { context.emit({ type: 'attackResolved', actorId: actor.actorId, targetId: null, outcome: 'miss' }); return; }
  wakeSpawnSleeper(context, target);
  if (!accuracy(context, actor, target, catalogs.effects.getAction(357).numeric.accuracyBeforeEffect, true, catalogs)) {
    context.emit({ type: 'attackResolved', actorId: actor.actorId, targetId: target.actorId, outcome: 'miss' }); return;
  }
  const targetTypes = types(target, catalogs);
  const matchup = combineTypeMatchups(lookupTypeMatchup('Fighting', targetTypes[0], false), lookupTypeMatchup('Fighting', targetTypes[1], false));
  const damage = ability(target, catalogs, 'Wonder Guard') && matchup !== 'super' ? 0 : amount;
  if (damage > 0 && target.affiliation !== 'team' && !target.memory.experienceContributors.includes(actor.actorId)) target.memory.experienceContributors.push(actor.actorId);
  damageHp(target, damage);
  if (damage > 0) contactReactions(context, actor, target, true, catalogs);
  context.emit({ type: 'attackResolved', actorId: actor.actorId, targetId: target.actorId, outcome: damage ? 'hit' : 'immune' });
  finishDamage(context, target, catalogs, actor);
}
