import { mulQ, Q16, requireBooleans, requireInteger } from './fixed-point.js';

/** @typedef {'None'|'Normal'|'Fire'|'Water'|'Grass'|'Electric'|'Ice'|'Fighting'|'Poison'|'Ground'|'Flying'|'Psychic'|'Bug'|'Rock'|'Ghost'|'Dragon'|'Dark'|'Steel'} ElementType */
/** @typedef {'little'|'resist'|'neutral'|'super'} MatchupClass */
/** @typedef {'clear'|'sunny'|'rain'|'cloudy'|'fog'|'snow'|'hail'|'sandstorm'} Weather */
/** @typedef {Readonly<{wonderGuard:boolean,thickFat:boolean,flashFire:boolean,levitate:boolean,torrent:boolean,overgrow:boolean,swarm:boolean,blaze:boolean}>} TypeAbilities */
/** @typedef {Readonly<{moveType:ElementType,attackerTypes:readonly [ElementType,ElementType],defenderTypes:readonly [ElementType,ElementType],defenderExposed:boolean,abilities:TypeAbilities,attackerHp:number,attackerMaxHp:number,weather:Weather,mudSport:boolean,waterSport:boolean,charging:boolean}>} TypeContext */
/** @typedef {Readonly<{modifierQ16:number,typeFactorQ16:number,typeMatchup:MatchupClass,matchup:MatchupClass,slotMatchups:readonly [MatchupClass,MatchupClass],nullifiedBy:'wonderGuard'|'flashFire'|'levitate'|null}>} TypeModifier */

/** @type {readonly ElementType[]} */
export const ELEMENT_TYPES = Object.freeze(['None', 'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel']);
/** @type {Readonly<Record<MatchupClass,number>>} */
export const TYPE_FACTORS_Q16 = Object.freeze({ little: 32768, resist: 58982, neutral: 65536, super: 98304 });
/** Sparse independent transcription of original numerical table; omitted cells neutral.
 * @type {Readonly<Record<ElementType,readonly [readonly ElementType[],readonly ElementType[],readonly ElementType[]]>>} */
const ROWS = {
  None: [[], [], []],
  Normal: [[], ['Rock', 'Steel'], []],
  Fire: [['Grass', 'Ice', 'Bug', 'Steel'], ['Fire', 'Water', 'Rock', 'Dragon'], []],
  Water: [['Fire', 'Ground', 'Rock'], ['Water', 'Grass', 'Dragon'], []],
  Grass: [['Water', 'Ground', 'Rock'], ['Fire', 'Grass', 'Poison', 'Flying', 'Bug', 'Dragon', 'Steel'], []],
  Electric: [['Water', 'Flying'], ['Grass', 'Electric', 'Dragon'], ['Ground']],
  Ice: [['Grass', 'Ground', 'Flying', 'Dragon'], ['Fire', 'Water', 'Ice', 'Steel'], []],
  Fighting: [['Normal', 'Ice', 'Rock', 'Dark', 'Steel'], ['Poison', 'Flying', 'Psychic', 'Bug'], []],
  Poison: [['Grass'], ['Poison', 'Ground', 'Rock', 'Ghost'], ['Steel']],
  Ground: [['Fire', 'Electric', 'Poison', 'Rock', 'Steel'], ['Grass', 'Bug'], ['Flying']],
  Flying: [['Grass', 'Fighting', 'Bug'], ['Electric', 'Rock', 'Steel'], []],
  Psychic: [['Fighting', 'Poison'], ['Psychic', 'Steel'], ['Dark']],
  Bug: [['Grass', 'Psychic', 'Dark'], ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Steel'], []],
  Rock: [['Fire', 'Ice', 'Flying', 'Bug'], ['Fighting', 'Ground', 'Steel'], []],
  Ghost: [['Psychic', 'Ghost'], ['Dark', 'Steel'], ['Normal']],
  Dragon: [['Dragon'], ['Steel'], []],
  Dark: [['Psychic', 'Ghost'], ['Fighting', 'Dark', 'Steel'], []],
  Steel: [['Ice', 'Rock'], ['Fire', 'Water', 'Electric', 'Steel'], []],
};

/** Rows/columns: little, resist, neutral, super. This is symbolic, not numeric comparison.
 * @type {Readonly<Record<MatchupClass,Readonly<Record<MatchupClass,MatchupClass>>>>} */
const COMPOSITION = {
  little: { little: 'little', resist: 'little', neutral: 'little', super: 'resist' },
  resist: { little: 'little', resist: 'resist', neutral: 'resist', super: 'neutral' },
  neutral: { little: 'little', resist: 'resist', neutral: 'neutral', super: 'super' },
  super: { little: 'resist', resist: 'neutral', neutral: 'super', super: 'super' },
};

/** @param {ElementType} type @returns {void} */
function validateType(type) {
  if (!ELEMENT_TYPES.includes(type)) throw new RangeError('Unknown original type.');
}

/** @param {readonly [ElementType,ElementType]} types @returns {void} */
function validateTypes(types) {
  if (types.length !== 2) throw new RangeError('Supply two type slots, using None for an absent slot.');
  for (const type of types) validateType(type);
  if (types[0] === types[1] && types[0] !== 'None') throw new RangeError('Single types use a None second slot.');
}

/** @param {ElementType} moveType @returns {boolean} */
export function isPhysicalType(moveType) {
  validateType(moveType);
  return !['Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Psychic', 'Dragon', 'Dark'].includes(moveType);
}

/** @param {ElementType} attacker @param {ElementType} defender @param {boolean} exposed @returns {MatchupClass} */
export function lookupTypeMatchup(attacker, defender, exposed) {
  requireBooleans([exposed]);
  validateType(attacker);
  validateType(defender);
  if ((attacker === 'Normal' || attacker === 'Fighting') && defender === 'Ghost' && !exposed) return 'little';
  const [superTypes, resistTypes, littleTypes] = ROWS[attacker];
  if (superTypes.includes(defender)) return 'super';
  if (resistTypes.includes(defender)) return 'resist';
  return littleTypes.includes(defender) ? 'little' : 'neutral';
}

/** @param {MatchupClass} first @param {MatchupClass} second @returns {MatchupClass} */
export function combineTypeMatchups(first, second) {
  if (!Object.hasOwn(COMPOSITION, first) || !Object.hasOwn(COMPOSITION, second)) throw new RangeError('Unknown matchup class.');
  return COMPOSITION[first][second];
}

/** @param {TypeContext} context @returns {void} */
export function validateTypeContext(context) {
  const a = context.abilities;
  requireBooleans([context.defenderExposed, context.mudSport, context.waterSport, context.charging, a.wonderGuard, a.thickFat, a.flashFire, a.levitate, a.torrent, a.overgrow, a.swarm, a.blaze]);
  validateType(context.moveType);
  validateTypes(context.attackerTypes);
  validateTypes(context.defenderTypes);
  requireInteger(context.attackerMaxHp, 1, 32767, 'maximum HP');
  requireInteger(context.attackerHp, 1, context.attackerMaxHp, 'attacker HP');
  if (!['clear', 'sunny', 'rain', 'cloudy', 'fog', 'snow', 'hail', 'sandstorm'].includes(context.weather)) {
    throw new RangeError('Unknown apparent weather.');
  }
}

/** Pure type/context pipeline. Ability predicates are resolved active-ability facts;
 * caller retains actor validation and Flash Fire once-per-turn mutation.
 * @param {TypeContext} context @returns {TypeModifier} */
export function buildTypeContextModifier(context) {
  validateTypeContext(context);
  const { moveType, abilities } = context;
  const first = lookupTypeMatchup(moveType, context.defenderTypes[0], context.defenderExposed);
  const second = lookupTypeMatchup(moveType, context.defenderTypes[1], context.defenderExposed);
  const typeMatchup = combineTypeMatchups(first, second);
  const typeFactorQ16 = mulQ(TYPE_FACTORS_Q16[first], TYPE_FACTORS_Q16[second], 16);
  let modifierQ16 = typeFactorQ16;
  let matchup = typeMatchup;
  /** @type {TypeModifier['nullifiedBy']} */
  let nullifiedBy = null;
  if (abilities.wonderGuard && moveType !== 'None' && matchup !== 'super') {
    modifierQ16 = 0;
    nullifiedBy = 'wonderGuard';
  }
  if (abilities.thickFat && (moveType === 'Fire' || moveType === 'Ice')) modifierQ16 = mulQ(modifierQ16, 32768, 16);
  if (abilities.flashFire && moveType === 'Fire') {
    modifierQ16 = 0;
    matchup = 'little';
    nullifiedBy = 'flashFire';
  }
  if (abilities.levitate && moveType === 'Ground') {
    modifierQ16 = 0;
    matchup = 'little';
    nullifiedBy = 'levitate';
  }
  const lowHpAbility = (moveType === 'Water' && abilities.torrent) || (moveType === 'Grass' && abilities.overgrow)
    || (moveType === 'Bug' && abilities.swarm) || (moveType === 'Fire' && abilities.blaze);
  if (lowHpAbility && context.attackerHp <= Math.floor(context.attackerMaxHp / 4)) modifierQ16 = mulQ(modifierQ16, 131072, 16);
  // None represents absence, so it must not itself create a same-type bonus.
  if (moveType !== 'None' && modifierQ16 !== 0 && context.attackerTypes.includes(moveType)) modifierQ16 = mulQ(modifierQ16, 98304, 16);
  if (context.weather === 'sunny') {
    if (moveType === 'Fire') modifierQ16 = mulQ(modifierQ16, 98304, 16);
    if (moveType === 'Water') modifierQ16 = mulQ(modifierQ16, 32768, 16);
  }
  if (context.weather === 'rain') {
    if (moveType === 'Water') modifierQ16 = mulQ(modifierQ16, 98304, 16);
    if (moveType === 'Fire') modifierQ16 = mulQ(modifierQ16, 32768, 16);
  }
  if (context.weather === 'cloudy' && moveType !== 'Normal') modifierQ16 = mulQ(modifierQ16, 49152, 16);
  if (moveType === 'Electric' && (context.mudSport || context.weather === 'fog')) modifierQ16 = mulQ(modifierQ16, 32768, 16);
  if (moveType === 'Fire' && context.waterSport) modifierQ16 = mulQ(modifierQ16, 32768, 16);
  if (moveType === 'Electric' && context.charging) modifierQ16 = mulQ(modifierQ16, 131072, 16);
  return { modifierQ16, typeFactorQ16, typeMatchup, matchup, slotMatchups: [first, second], nullifiedBy };
}

/** Neutral metadata for the two early one-damage exceptions.
 * @returns {TypeModifier} */
export function neutralTypeModifier() {
  return { modifierQ16: Q16, typeFactorQ16: Q16, typeMatchup: 'neutral', matchup: 'neutral', slotMatchups: ['neutral', 'neutral'], nullifiedBy: null };
}
