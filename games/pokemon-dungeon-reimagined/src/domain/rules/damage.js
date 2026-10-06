import { divQ16, integerPartQ8, integerToQ16, mulQ, Q8, q8ToQ16, requireBooleans, requireInteger, roundFinalQ16 } from './fixed-point.js';
import { buildTypeContextModifier, isPhysicalType, neutralTypeModifier, validateTypeContext } from './type-context.js';

/** @typedef {import('./type-context.js').TypeContext} TypeContext */
/** @typedef {import('./type-context.js').TypeModifier} TypeModifier */
/** @typedef {'none'|'normal'|'attack'|'defense'|'speed'} DeoxysForm */
/** Only relevant, already-usable held items; resolve sticky/suppression predicates upstream.
 * @typedef {'none'|'powerBand'|'specialBand'|'munchBelt'|'defScarf'|'zincBand'|'scopeLens'|'patsyBand'} DamageItem */
/** @typedef {Readonly<{guts:boolean,attackerNegativeStatus:boolean,hugePower:boolean,purePower:boolean,hustle:boolean,plus:boolean,minus:boolean,sameSidePlus:boolean,sameSideMinus:boolean,intimidate:boolean,marvelScale:boolean,defenderNegativeStatus:boolean}>} StatAbilities */
/** @typedef {Readonly<{rawOffense:number,rawDefense:number,movePower:number,offenseStage:number,defenseStage:number,offensiveMultiplierQ8:number,defensiveMultiplierQ8:number,flashFireBoost:number,attackerForm:DeoxysForm,defenderForm:DeoxysForm,skullBash:boolean,attackerItem:DamageItem,defenderItem:DamageItem,abilities:StatAbilities}>} StatContext */
/** @typedef {Readonly<{moveChance:number,focusEnergy:boolean,typeAdvantageMaster:boolean,battleArmor:boolean,shellArmor:boolean}>} CriticalContext */
/** criticalRoll is null precisely when armor skips that draw.
 * @typedef {Readonly<{sharedPowerRoll:number,criticalRoll:number|null,varianceRoll:number}>} DamageRolls */
/** Full numerical/context facts; no actor, data catalog, RNG or scene dependencies.
 * rolls is null precisely for early one-damage branches. targetEffectsApply gates
 * offensive Flash Fire stage, defensive held bonus and screens, as in R arg_10.
 * @typedef {Readonly<{type:TypeContext,stats:StatContext,critical:CriticalContext,teamMember:boolean,leader:boolean,integerBelly:number,level:number,regularAttack:boolean,targetEffectsApply:boolean,reflect:boolean,lightScreen:boolean,moveEffectMultiplierQ8:number,rolls:DamageRolls|null}>} NormalDamageInput */
/** @typedef {Readonly<{offenseStage:number,defenseStage:number,offenseBeforeAbilities:number,defenseBeforeAbilities:number,offense:number,defense:number,wildRawOffense:number|null,levelContributionQ16:number,differenceQ16:number,baseQ16:number,contextModifierQ16:number,finalModifierQ16:number,damageQ16:number,criticalChance:number|null,criticalRolled:boolean}>} DamageFacts */
/** These facts are derived event evidence, never authoritative campaign state.
 * @typedef {Readonly<{kind:'normalDamage'|'fixedDamage',damage:number,critical:boolean,type:TypeModifier,earlyReason:'emptyBelly'|'regularWonderGuard'|null,facts:DamageFacts|null}>} DamageResult */

export const ATTACK_STAGE_Q8 = Object.freeze([64, 69, 74, 79, 84, 89, 102, 115, 128, 179, 256, 332, 384, 409, 422, 435, 448, 460, 473, 486, 512]);
export const DEFENSE_STAGE_Q8 = Object.freeze([64, 69, 74, 79, 84, 89, 102, 140, 179, 222, 256, 332, 384, 409, 422, 435, 448, 460, 473, 486, 512]);

/** @param {number} n @param {number} low @param {number} high @returns {number} */
function clamp(n, low, high) { return Math.max(low, Math.min(high, n)); }

/** @param {readonly number[]} table @param {number} stage @returns {number} */
function stageFactor(table, stage) {
  const value = table[stage];
  if (value === undefined) throw new RangeError('Missing stat stage.');
  return value;
}

/** @param {StatContext} stats @returns {void} */
function validateStats(stats) {
  const a = stats.abilities;
  requireBooleans([stats.skullBash, a.guts, a.attackerNegativeStatus, a.hugePower, a.purePower, a.hustle, a.plus, a.minus, a.sameSidePlus, a.sameSideMinus, a.intimidate, a.marvelScale, a.defenderNegativeStatus]);
  requireInteger(stats.rawOffense, 0, 999, 'raw offense');
  requireInteger(stats.rawDefense, 0, 999, 'raw defense');
  requireInteger(stats.movePower, 0, 32767 - stats.rawOffense, 'boosted move power');
  requireInteger(stats.offenseStage, 0, 20, 'offense stage');
  requireInteger(stats.defenseStage, 0, 20, 'defense stage');
  requireInteger(stats.offensiveMultiplierQ8, 0, 2147483647, 'offensive multiplier');
  requireInteger(stats.defensiveMultiplierQ8, 0, 2147483647, 'defensive multiplier');
  requireInteger(stats.flashFireBoost, 0, 2, 'Flash Fire boost');
  for (const form of [stats.attackerForm, stats.defenderForm]) {
    if (!['none', 'normal', 'attack', 'defense', 'speed'].includes(form)) throw new RangeError('Unknown apparent Deoxys form.');
  }
  for (const item of [stats.attackerItem, stats.defenderItem]) {
    if (!['none', 'powerBand', 'specialBand', 'munchBelt', 'defScarf', 'zincBand', 'scopeLens', 'patsyBand'].includes(item)) throw new RangeError('Unknown numerical held item.');
  }
}

/** Accumulate integer ratios, divide once per stat. R Guts intentionally has no physical guard.
 * @param {number} offense @param {number} defense @param {boolean} physical
 * @param {StatAbilities} abilities @param {number} powerRoll @returns {{offense:number,defense:number}} */
function adjustAbilities(offense, defense, physical, abilities, powerRoll) {
  let numerator = 1;
  let denominator = 1;
  if (abilities.guts && abilities.attackerNegativeStatus) numerator *= 2;
  if (physical && powerRoll < 33 && (abilities.hugePower || abilities.purePower)) { numerator *= 3; denominator *= 2; }
  if (physical && abilities.hustle) { numerator *= 3; denominator *= 2; }
  if (!physical && abilities.plus && abilities.sameSideMinus) { numerator *= 15; denominator *= 10; }
  if (!physical && abilities.minus && abilities.sameSidePlus) { numerator *= 15; denominator *= 10; }
  if (physical && abilities.intimidate) { numerator *= 4; denominator *= 5; }
  const adjustedOffense = Math.trunc(offense * numerator / denominator);
  const adjustedDefense = physical && abilities.marvelScale && abilities.defenderNegativeStatus ? Math.trunc(defense * 3 / 2) : defense;
  // These feed original integer conversion; invalid enlarged values fail, never wrap.
  requireInteger(adjustedOffense, 0, 32767, 'adjusted offense');
  requireInteger(adjustedDefense, 0, 32767, 'adjusted defense');
  return { offense: adjustedOffense, defense: adjustedDefense };
}

/** @param {NormalDamageInput} input @param {boolean} physical @param {number} powerRoll */
function prepareStats(input, physical, powerRoll) {
  const s = input.stats;
  const offenseFormDelta = s.attackerForm === 'attack' ? 2 : s.attackerForm === 'defense' || s.attackerForm === 'speed' ? -2 : 0;
  const defenseFormDelta = s.defenderForm === 'defense' ? 2 : s.defenderForm === 'attack' || s.defenderForm === 'speed' ? -2 : 0;
  const offenseStage = clamp(s.offenseStage + offenseFormDelta + (input.targetEffectsApply && input.type.moveType === 'Fire' ? s.flashFireBoost : 0), 0, 20);
  const defenseStage = clamp(s.defenseStage + defenseFormDelta + Number(physical && s.skullBash), 0, 20);
  let offense = integerPartQ8(mulQ(mulQ((s.rawOffense + s.movePower) * Q8, stageFactor(ATTACK_STAGE_Q8, offenseStage), 8), s.offensiveMultiplierQ8, 8));
  let defense = integerPartQ8(mulQ(mulQ(s.rawDefense * Q8, stageFactor(DEFENSE_STAGE_Q8, defenseStage), 8), s.defensiveMultiplierQ8, 8));
  if ((physical && s.attackerItem === 'powerBand') || (!physical && s.attackerItem === 'specialBand')) offense += 12;
  if (s.attackerItem === 'munchBelt') offense += 8;
  if (input.targetEffectsApply && ((physical && s.defenderItem === 'defScarf') || (!physical && s.defenderItem === 'zincBand'))) defense += 8;
  offense = clamp(offense, 0, 999);
  const adjusted = adjustAbilities(offense, defense, physical, s.abilities, powerRoll);
  return { offenseStage, defenseStage, offenseBeforeAbilities: offense, defenseBeforeAbilities: defense, ...adjusted };
}

/** @param {NormalDamageInput} input @param {TypeModifier} type @returns {number} */
function criticalChance(input, type) {
  const critical = input.critical;
  if (critical.focusEnergy) return 999;
  let chance = input.teamMember ? critical.moveChance : 0;
  if (input.stats.attackerItem === 'scopeLens') chance += 40;
  if (input.stats.defenderItem === 'patsyBand') chance += 40;
  if (type.matchup === 'super' && critical.typeAdvantageMaster) chance = 40;
  return chance;
}

/** Does no RNG sampling and applies no HP/status/reaction mutations.
 * RNG caller consumes power, optional critical, then variance draws only for ordinary route.
 * @param {NormalDamageInput} input @returns {DamageResult} */
export function calculateNormalDamage(input) {
  const c = input.critical;
  requireBooleans([input.teamMember, input.leader, input.regularAttack, input.targetEffectsApply, input.reflect, input.lightScreen, c.focusEnergy, c.typeAdvantageMaster, c.battleArmor, c.shellArmor]);
  validateTypeContext(input.type);
  validateStats(input.stats);
  requireInteger(input.integerBelly, 0, 32767, 'integer Belly');
  requireInteger(input.level, 1, 100, 'level');
  requireInteger(input.moveEffectMultiplierQ8, 0, 2147483647, 'move effect multiplier');
  requireInteger(input.critical.moveChance, 0, 100, 'move critical chance');
  if (input.leader && !input.teamMember) throw new RangeError('Leader must be a team member.');
  const earlyReason = !input.leader && input.integerBelly === 0 ? 'emptyBelly' : input.regularAttack && input.type.abilities.wonderGuard ? 'regularWonderGuard' : null;
  if (earlyReason !== null) {
    if (input.rolls !== null) throw new RangeError('Early one-damage exceptions consume no damage rolls.');
    return { kind: 'normalDamage', damage: 1, critical: false, type: neutralTypeModifier(), earlyReason, facts: null };
  }
  if (input.rolls === null) throw new RangeError('Ordinary damage requires explicit sampled rolls.');
  const rolls = input.rolls;
  requireInteger(rolls.sharedPowerRoll, 0, 99, 'shared power roll');
  requireInteger(rolls.varianceRoll, 0, 16383, 'variance roll');
  const armored = input.critical.battleArmor || input.critical.shellArmor;
  if (armored) {
    if (rolls.criticalRoll !== null) throw new RangeError('Critical armor skips its random draw.');
  } else {
    if (rolls.criticalRoll === null) throw new RangeError('Critical roll required without armor.');
    requireInteger(rolls.criticalRoll, 0, 99, 'critical roll');
  }
  const physical = isPhysicalType(input.type.moveType);
  const stats = prepareStats(input, physical, rolls.sharedPowerRoll);
  const wildRawOffense = input.teamMember ? null : adjustAbilities(input.stats.rawOffense, 1, physical, input.stats.abilities, rolls.sharedPowerRoll).offense;
  const levelContributionQ16 = wildRawOffense === null ? mulQ(integerToQ16(input.level), 43690, 16) : divQ16(integerToQ16(wildRawOffense), integerToQ16(3));
  const differenceQ16 = divQ16(integerToQ16(stats.offense - stats.defense), integerToQ16(8)) + levelContributionQ16;
  const quadratic = mulQ(mulQ(differenceQ16, differenceQ16, 16), 3276, 16);
  const linear = 2 * differenceQ16 - integerToQ16(stats.defense) + integerToQ16(10);
  const baseQ16 = clamp(quadratic + linear, integerToQ16(1), integerToQ16(999));
  const type = buildTypeContextModifier(input.type);
  let finalModifierQ16 = type.modifierQ16;
  if (input.targetEffectsApply && ((physical && input.reflect) || (!physical && input.lightScreen))) finalModifierQ16 = mulQ(finalModifierQ16, 32768, 16);
  const chance = armored ? null : criticalChance(input, type);
  let critical = chance !== null && rolls.criticalRoll !== null && rolls.criticalRoll < chance;
  if (critical) finalModifierQ16 = mulQ(finalModifierQ16, 98304, 16);
  let damageQ16 = mulQ(baseQ16, finalModifierQ16, 16);
  damageQ16 = mulQ(damageQ16, q8ToQ16(input.moveEffectMultiplierQ8), 16);
  damageQ16 = mulQ(damageQ16, 57344 + rolls.varianceRoll, 16);
  const damage = roundFinalQ16(damageQ16);
  if (damage === 0) critical = false;
  return {
    kind: 'normalDamage', damage, critical, type, earlyReason: null,
    facts: { ...stats, wildRawOffense, levelContributionQ16, differenceQ16, baseQ16, contextModifierQ16: type.modifierQ16, finalModifierQ16, damageQ16, criticalChance: chance, criticalRolled: !armored },
  };
}

/** Fixed damage only. Direct HP changes (e.g. Dragon Rage65/Sonicboom55) require
 * their own effect route; status effects must never enter this function.
 * @param {Readonly<{baseAmount:number,type:TypeContext}>} input @returns {DamageResult} */
export function calculateFixedDamage(input) {
  requireInteger(input.baseAmount, -2147483648, 2147483647, 'fixed base amount');
  const type = buildTypeContextModifier(input.type);
  const damage = roundFinalQ16(mulQ(integerToQ16(clamp(input.baseAmount, 1, 999)), type.modifierQ16, 16));
  return { kind: 'fixedDamage', damage, critical: false, type, earlyReason: null, facts: null };
}
