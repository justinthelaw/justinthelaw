import { FIELD_MOVE_IDS, applyFieldMove, waterSportActive } from './field-moves.js';
import { payDayDrop } from './item-drops.js';
import { damageStatusSecondary } from './damage-status.js';
import { PARTY_DAMAGE_MOVES, lowKickMultiplier, damageStatSecondary } from './damage-moves.js';
import { PARTY_STATUS_MOVES, applyPartyStatus } from './party-status.js';
import { lightningRodTarget } from './field-abilities.js';
import { secondaryAllowed, inflictParalysis, moveConditionSource, hypnosis } from './move-conditions.js';
import { SELF_STATUS_MOVES, selfBattleStatus } from './battle-status.js';
import { dealDamage } from './damage-resolution.js';
import { rapidSpinCleanup, takeDownRecoil, struggleRecoil } from './post-hit-effects.js';
import { applyContactReactions, confusionSecondary, hasNegativeStatus } from './conditions.js';
import { calculateNormalDamage } from '../rules/damage.js';
import { ELEMENT_TYPES, isPhysicalType, lookupTypeMatchup, combineTypeMatchups } from '../rules/type-context.js';
import { moveTargets } from './move-targets.js';
import { STAT_MOVES, changeStatStage } from './stat-effects.js';
import { draw, value, maxHp, ability, profile, blocked } from './support.js';

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
  return FIELD_MOVE_IDS.includes(id) || PARTY_DAMAGE_MOVES.includes(id) || PARTY_STATUS_MOVES.includes(id) || SELF_STATUS_MOVES.includes(id) || ['move-rapid-spin', 'move-take-down', 'move-confusion', 'move-thunder-shock', 'move-hypnosis', 'move-absorb', 'move-quick-attack'].includes(id) || STAT_MOVES.includes(id) || move.hitCountContract.count === 1 && move.target.rangeCode === 0 && move.effects.length === 1 && move.effects.every(effect => effect.op === 'normal-damage' && Object.keys(effect).every(key => ['op', 'finalMultiplier'].includes(key))) && move.effects.some(effect => effect.op === 'normal-damage' && (effect.finalMultiplier === undefined || typeof effect.finalMultiplier === 'number'));
}
/** @param {Context} context @param {Actor} attacker @param {Actor} target @param {number} base @param {boolean} physical @param {Catalogs} catalogs */
function accuracy(context, attacker, target, base, physical, catalogs) {
  const roll = draw(context.state, 100);
  if (attacker.actorId === target.actorId || attacker.conditions.sureShot?.statusId === 'sure-shot') return true;
  if (attacker.conditions.sureShot?.statusId === 'whiffer') return false;
  if (base > 100) return true;
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
 * @param {Context} context @param {Actor} attacker @param {import('../../contracts/campaign.js').ResolvedAction & {kind:'attack'|'struggle'|'move-use'}} action @param {Catalogs} catalogs */
export function attack(context, attacker, action, catalogs) {
  const session = context.state.session;
  if (!session || attacker.placement.kind !== 'map') return blocked('combat-session');
  if (attacker.conditions.cringe?.statusId === 'cringe') { context.emit({ type: 'message', messageId: 'cringe-prevents-attack' }); return; }
  if (attacker.conditions.burn?.statusId === 'paralysis') { context.emit({ type: 'message', messageId: 'paralysis-prevents-attack' }); return; }
  const regular = action.kind === 'attack', learned = action.kind === 'move-use';
  const move = learned ? catalogs.effects.getMove(action.moveId) : catalogs.effects.getAction(regular ? 355 : 352);
  if (learned && !supportedMove(catalogs, action.moveId)) return blocked('move-effect-not-supported');
  const slot = learned ? attacker.moves.slots.find(row => row?.moveSlotId === action.moveSlotId) : null;
  if (learned) {
    const pp = attacker.battleMoves.slots.find(row => row.moveSlotId === action.moveSlotId);
    if (!pp || !slot) return blocked('move-slot-unavailable');
    // Default party AI has no PP Checker and may choose an exhausted slot.
    // Native failed use still completes the action, before last-used, PP/EXP
    // flags, target enumeration, wake or accuracy. Charge cleanup is external.
    if (pp.currentPp === 0 || pp.sealed) { context.emit({ type: 'message', messageId: pp.sealed ? 'move-is-sealed' : 'move-has-no-pp' }); return; }
    pp.currentPp--; pp.usedForExperience = true;
    attacker.memory.lastUsedMove = { moveId: action.moveId, moveSlotId: action.moveSlotId };
  }
  if (action.kind === 'struggle') attacker.memory.lastUsedMove = { moveId: /** @type {import('../../contracts/campaign.js').MoveId} */ ('move-struggle'), moveSlotId: null };
  const targets = moveTargets(session, attacker, move.target.rangeCode, catalogs, action.target, move.target.categoryCode);
  if (learned && SELF_STATUS_MOVES.includes(action.moveId) && slot) {
    if (move.numeric.type === 'electric') {
      const redirect = lightningRodTarget(context.state, attacker, attacker);
      if (redirect.redirected) {
        wakeSpawnSleeper(context, redirect.target);
        accuracy(context, attacker, redirect.target, move.numeric.accuracyBeforeEffect, false, catalogs);
        context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: redirect.target.actorId, outcome: 'immune' }); return;
      }
    }
    wakeSpawnSleeper(context, attacker);
    accuracy(context, attacker, attacker, move.numeric.accuracyBeforeEffect, true, catalogs);
    if (attacker.affiliation !== 'team' && !attacker.memory.experienceContributors.includes(attacker.actorId)) attacker.memory.experienceContributors.push(attacker.actorId);
    selfBattleStatus(context, attacker, slot);
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: attacker.actorId, outcome: 'hit' }); return;
  }
  if (learned && STAT_MOVES.includes(action.moveId)) {
    const effects = move.effects.filter(effect => effect.op === 'stat-stage');
    if (!effects.length || effects.some(effect => !['attack', 'defense', 'accuracy', 'special-attack', 'special-defense'].includes(effect.stat))) return blocked('stat-move-projection');
    for (const target of targets) {
      wakeSpawnSleeper(context, target);
      if (['move-growl', 'move-metal-sound'].includes(action.moveId) && ability(target, catalogs, 'Soundproof')) {
        context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'immune' }); continue;
      }
      if (!accuracy(context, attacker, target, move.numeric.accuracyBeforeEffect, move.numeric.type !== 'psychic', catalogs)) {
        context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'miss' }); continue;
      }
      // Native UseMoveAgainstTargets raises the experience multiplier before
      // dispatch, even when a stat cap or protection makes the effect fail.
      if (target.affiliation !== 'team' && !target.memory.experienceContributors.includes(attacker.actorId)) target.memory.experienceContributors.push(attacker.actorId);
      // Helping Hand can include the user only through confusion's target
      // override; its handler rejects self after the common hit/EXP boundary.
      if (action.moveId !== 'move-helping-hand' || attacker.actorId !== target.actorId) for (const effect of effects) changeStatStage(context, target, effect.stat === 'special-defense' ? 'specialDefense' : effect.stat === 'special-attack' ? 'specialAttack' : /** @type {'attack'|'defense'|'accuracy'} */ (effect.stat), effect.delta, catalogs);
      context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'hit' });
    }
    if (!targets.length) context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: null, outcome: 'miss' });
    return;
  }
  const initialTarget = targets[0];
  const redirect = initialTarget && move.numeric.type === 'electric' ? lightningRodTarget(context.state, attacker, initialTarget) : null;
  const target = redirect?.target ?? initialTarget;
  if (!target) { context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: null, outcome: 'miss' }); return; }
  wakeSpawnSleeper(context, target);
  const moveType = ELEMENT_TYPES.find(type => type.toLowerCase() === move.numeric.type);
  if (!moveType) return blocked('move-type');
  const physical = isPhysicalType(moveType);
  // Source physical-type retaliation is resolved below after positive damage.
  if (!accuracy(context, attacker, target, move.numeric.accuracyBeforeEffect, physical, catalogs)) {
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'miss' }); return;
  }
  if (redirect?.redirected) { context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'immune' }); return; }
  if (learned && FIELD_MOVE_IDS.includes(action.moveId)) {
    if (target.affiliation !== 'team' && !target.memory.experienceContributors.includes(attacker.actorId)) target.memory.experienceContributors.push(attacker.actorId);
    if (action.moveId === 'move-leech-seed' && attacker.affiliation !== 'team' && !attacker.memory.experienceContributors.includes(attacker.actorId)) attacker.memory.experienceContributors.push(attacker.actorId);
    const applied = applyFieldMove(context, attacker, target, action.moveId, catalogs);
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: applied ? 'hit' : 'immune' }); return;
  }
  if (learned && PARTY_STATUS_MOVES.includes(action.moveId) && slot) {
    if (target.affiliation !== 'team' && !target.memory.experienceContributors.includes(attacker.actorId)) target.memory.experienceContributors.push(attacker.actorId);
    const applied = applyPartyStatus(context, attacker, target, slot, catalogs);
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: applied ? 'hit' : 'immune' }); return;
  }
  if (learned && action.moveId === 'move-hypnosis') {
    if (target.affiliation !== 'team' && !target.memory.experienceContributors.includes(attacker.actorId)) target.memory.experienceContributors.push(attacker.actorId);
    hypnosis(context, attacker, target, catalogs);
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'hit' }); return;
  }
  if (learned && action.moveId === 'move-ember' && target.conditions.frozen?.statusId === 'frozen') { target.conditions.frozen = null; context.emit({ type: 'conditionChanged', actorId: target.actorId }); context.emit({ type: 'message', messageId: 'thawed-status' }); }
  const provisionalCredit = !regular && target.affiliation !== 'team' && !target.memory.experienceContributors.includes(attacker.actorId);
  if (provisionalCredit) target.memory.experienceContributors.push(attacker.actorId);
  const restoreFailedCredit = () => { if (provisionalCredit) target.memory.experienceContributors.splice(target.memory.experienceContributors.indexOf(attacker.actorId), 1); };
  const a = (/** @type {string} */ name) => ability(attacker, catalogs, name);
  const d = (/** @type {string} */ name) => ability(target, catalogs, name);
  const offense = physical ? 'attack' : 'specialAttack'; const defense = physical ? 'defense' : 'specialDefense';
  const armor = d('Battle Armor') || d('Shell Armor');
  const early = attacker.actorId !== session.leaderActorId && Math.floor(value(attacker.resources.belly)) === 0 || regular && d('Wonder Guard');
  const effect = move.effects.find(effect => effect.op === 'normal-damage');
  const multiplier = learned && action.moveId === 'move-low-kick' ? lowKickMultiplier(target, catalogs) : effect && typeof effect.finalMultiplier === 'number' ? effect.finalMultiplier : 1;
  const result = calculateNormalDamage({
    type: { moveType, attackerTypes: types(attacker, catalogs), defenderTypes: types(target, catalogs), defenderExposed: false,
      abilities: { wonderGuard: d('Wonder Guard'), thickFat: d('Thick Fat'), flashFire: d('Flash Fire'), levitate: d('Levitate'), torrent: a('Torrent'), overgrow: a('Overgrow'), swarm: a('Swarm'), blaze: a('Blaze') },
      attackerHp: attacker.resources.hp, attackerMaxHp: maxHp(attacker), weather: 'clear', mudSport: false, waterSport: waterSportActive(context.state), charging: attacker.conditions.bide?.statusId === 'charging' },
    stats: { rawOffense: attacker.growth.naturalStats[offense] + attacker.growth.permanentStatBonuses[offense], rawDefense: target.growth.naturalStats[defense] + target.growth.permanentStatBonuses[defense], movePower: move.numeric.power + (slot?.powerBoost ?? 0), offenseStage: attacker.stages[offense], defenseStage: target.stages[defense], offensiveMultiplierQ8: value(attacker.multipliers[offense]) * 256, defensiveMultiplierQ8: value(target.multipliers[defense]) * 256,
      flashFireBoost: 0, attackerForm: 'none', defenderForm: 'none', skullBash: false, attackerItem: 'none', defenderItem: 'none',
      abilities: { guts: a('Guts'), attackerNegativeStatus: hasNegativeStatus(attacker), hugePower: a('Huge Power'), purePower: a('Pure Power'), hustle: a('Hustle'), plus: a('Plus'), minus: a('Minus'), sameSidePlus: Object.values(session.actors).some(actor => actor.affiliation === attacker.affiliation && actor.placement.kind === 'map' && ability(actor, catalogs, 'Plus')), sameSideMinus: Object.values(session.actors).some(actor => actor.affiliation === attacker.affiliation && actor.placement.kind === 'map' && ability(actor, catalogs, 'Minus')), intimidate: d('Intimidate'), marvelScale: d('Marvel Scale'), defenderNegativeStatus: hasNegativeStatus(target) } },
    critical: { moveChance: move.numeric.criticalPercent, focusEnergy: attacker.conditions.sureShot?.statusId === 'focus-energy', typeAdvantageMaster: false, battleArmor: d('Battle Armor'), shellArmor: d('Shell Armor') },
    teamMember: attacker.affiliation === 'team', leader: attacker.actorId === session.leaderActorId, integerBelly: Math.floor(value(attacker.resources.belly)), level: attacker.growth.level, regularAttack: regular,
    targetEffectsApply: true, reflect: target.conditions.reflect?.statusId === 'reflect', lightScreen: false, moveEffectMultiplierQ8: Math.trunc(multiplier * 256), rolls: early ? null : { sharedPowerRoll: draw(context.state, 100), criticalRoll: armor ? null : draw(context.state, 100), varianceRoll: draw(context.state, 16384) } });
  // Native CalcDamage draws precede the second accuracy check. Stat effects
  // never run that damage-only check.
  if (!accuracy(context, attacker, target, move.numeric.accuracyAfterDamage, physical, catalogs)) {
    restoreFailedCredit();
    context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: 'miss' }); return;
  }
  if (result.damage === 0) restoreFailedCredit();
  const liquidOoze = ability(target, catalogs, 'Liquid Ooze');
  const formerPosition = target.placement.kind === 'map' ? { ...target.placement.position } : null;
  const hit = dealDamage(context, target, catalogs, { attacker, amount: result.damage, contact: true, physical });
  const reactions = hit.reactions;
  context.emit({ type: 'attackResolved', actorId: attacker.actorId, targetId: target.actorId, outcome: result.damage ? 'hit' : 'immune' });
  const resolution = hit.resolution;
  if (learned && action.moveId === 'move-pay-day' && result.damage > 0 && formerPosition) payDayDrop(context, attacker, target, formerPosition, catalogs);
  if (learned && result.damage > 0 && resolution !== 'revived') damageStatusSecondary(context, attacker, target, action.moveId, catalogs);
  if (learned && result.damage > 0) damageStatSecondary(context, attacker, target, action.moveId, resolution === 'revived', catalogs);
  if (!(context.state.steel?.bossDefeated && context.state.steel.phase === 'battle') && learned && action.moveId === 'move-confusion' && result.damage > 0 && resolution !== 'revived') confusionSecondary(context, attacker, target, catalogs);
  if (learned && action.moveId === 'move-thunder-shock' && result.damage > 0 && resolution !== 'revived' && secondaryAllowed(context, attacker, target, 10, catalogs)) inflictParalysis(context, target, moveConditionSource(context, attacker, action.moveId), catalogs);
  if (learned && action.moveId === 'move-absorb' && result.damage > 0 && attacker.placement.kind === 'map' && attacker.resources.hp > 0) {
    if (attacker.affiliation !== 'team' && !attacker.memory.experienceContributors.includes(attacker.actorId)) attacker.memory.experienceContributors.push(attacker.actorId);
    const amount = Math.max(1, Math.trunc(result.damage / 2));
    if (liquidOoze) dealDamage(context, attacker, catalogs, { attacker: null, amount, contact: false, physical: false, giveExperience: false });
    else attacker.resources.hp = Math.min(maxHp(attacker), attacker.resources.hp + amount);
    context.emit({ type: 'message', messageId: liquidOoze ? 'liquid-ooze-damage' : 'absorb-healed' });
  }
  if (!regular && result.damage > 0) {
    const recoil = action.kind === 'struggle' ? struggleRecoil(attacker) : learned && action.moveId === 'move-take-down' ? takeDownRecoil(attacker, catalogs) : 0;
    if (recoil) {
      dealDamage(context, attacker, catalogs, { attacker, amount: recoil, contact: false, physical: false, giveExperience: false });
      context.emit({ type: 'message', messageId: 'move-recoil' });
    }
    if (learned && action.moveId === 'move-rapid-spin') rapidSpinCleanup(context, attacker);
  }
  if (!session.teamOrder.some(id => session.actors[id]?.resources.hp === 0) && !(context.state.steel?.bossDefeated && context.state.steel.phase === 'battle')) applyContactReactions(context, attacker, reactions, catalogs);
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
  const hit = dealDamage(context, target, catalogs, { attacker: actor, amount: damage, contact: true, physical: true });
  context.emit({ type: 'attackResolved', actorId: actor.actorId, targetId: target.actorId, outcome: damage ? 'hit' : 'immune' });
  if (!session.teamOrder.some(id => session.actors[id]?.resources.hp === 0) && !(context.state.steel?.bossDefeated && context.state.steel.phase === 'battle')) applyContactReactions(context, actor, hit.reactions, catalogs);
}
