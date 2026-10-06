// Calculation-only boundary; no scheduler, RNG, actor mutation or runtime bootstrap.
export { Q8, Q16, mulQ, divQ16, integerToQ16, q8ToQ16, integerPartQ8, roundFinalQ16 } from './fixed-point.js';
export { calculateSpeedStage, hasSpeedOpportunity, makeRaisedSpeedTimer, makeLoweredSpeedTimer, tickSpeedTimers, applySpeedTimers, advanceSpeedBoostCounter } from './speed.js';
export { ELEMENT_TYPES, TYPE_FACTORS_Q16, isPhysicalType, lookupTypeMatchup, combineTypeMatchups, buildTypeContextModifier } from './type-context.js';
export { ATTACK_STAGE_Q8, DEFENSE_STAGE_Q8, calculateNormalDamage, calculateFixedDamage } from './damage.js';
