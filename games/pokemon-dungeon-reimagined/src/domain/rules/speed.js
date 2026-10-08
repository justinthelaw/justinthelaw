import { requireBooleans, requireInteger } from './fixed-point.js';

/** @typedef {Readonly<{baseMovementSpeed:number,positiveTimers:readonly number[],negativeTimers:readonly number[],paralyzed:boolean,iceType:boolean,snow:boolean,deoxysSpeedForm:boolean,wildKecleonInTheftMode:boolean}>} SpeedContext */
/** @typedef {Readonly<{positiveTimers:readonly number[],negativeTimers:readonly number[],before:number,after:number,inserted:number,speedRaisedThisAction:boolean,clearAttackLock:boolean}>} TimerChange */

/** @param {readonly number[]} timers @returns {void} */
function validateTimers(timers) {
  if (timers.length !== 5) throw new RangeError('Speed requires exactly five counters per sign.');
  for (const value of timers) requireInteger(value, 0, 127, 'speed counter');
}

/** Effective stage: current form/weather/hostility facts supplied by the caller.
 * @param {SpeedContext} context @returns {number} */
export function calculateSpeedStage(context) {
  requireBooleans([context.paralyzed, context.iceType, context.snow, context.deoxysSpeedForm, context.wildKecleonInTheftMode]);
  requireInteger(context.baseMovementSpeed, 0, 4, 'base movement speed');
  validateTimers(context.positiveTimers);
  validateTimers(context.negativeTimers);
  const occupied = (/** @type {readonly number[]} */ timers) => timers.filter(n => n !== 0).length;
  const value = context.baseMovementSpeed + occupied(context.positiveTimers) - occupied(context.negativeTimers)
    - Number(context.paralyzed) + Number(context.iceType && context.snow)
    + Number(context.deoxysSpeedForm) + Number(context.wildKecleonInTheftMode);
  return Math.max(0, Math.min(4, value));
}

/** Pure phase query; caller checks attack lock and live (slot,generation) identity separately.
 * @param {number} stage @param {number} phase @returns {boolean} */
export function hasSpeedOpportunity(stage, phase) {
  requireInteger(stage, 0, 4, 'speed stage');
  requireInteger(phase, 0, 23, 'floor phase');
  switch (stage) {
    case 0: return phase % 8 === 7;
    case 1: return phase % 4 === 3;
    case 2: return phase % 2 === 1;
    case 3: return phase % 4 !== 0;
    case 4: return true;
    default: throw new RangeError('Invalid speed stage.');
  }
}

/** Input is a sampled integer from the half-open [8,10) source range.
 * @param {number} sampledTurns @returns {number} */
export function makeRaisedSpeedTimer(sampledTurns) {
  return requireInteger(sampledTurns, 8, 9, 'raise sample') + 1;
}

/** Input is sampled from [6,8); halve, cap, minimum, then boundary offset.
 * @param {number} sampledTurns @param {boolean} selfCurer @param {boolean} naturalCure @returns {number} */
export function makeLoweredSpeedTimer(sampledTurns, selfCurer, naturalCure) {
  requireBooleans([selfCurer, naturalCure]);
  let turns = requireInteger(sampledTurns, 6, 7, 'lower sample');
  if (selfCurer) turns = Math.trunc(turns / 2);
  if (naturalCure) turns = Math.min(turns, 5);
  return Math.max(1, turns) + 1;
}

/** Already admitted opportunities remain admitted after expiration. No input mutation.
 * @param {SpeedContext} context @returns {TimerChange} */
export function tickSpeedTimers(context) {
  const before = calculateSpeedStage(context);
  const tick = (/** @type {number} */ n) => n === 0 || n === 127 ? n : n - 1;
  const positiveTimers = context.positiveTimers.map(tick);
  const negativeTimers = context.negativeTimers.map(tick);
  const after = calculateSpeedStage({ ...context, positiveTimers, negativeTimers });
  return { positiveTimers, negativeTimers, before, after, inserted: 0, speedRaisedThisAction: false, clearAttackLock: false };
}

/** Timers are already sampled/constructed. A raise uses one timer (127 is indefinite).
 * Lower batches check stage zero once, then fill first-empty slots for each requested stage.
 * Flags describe this operation; callers OR refresh flags, never erase an earlier raise.
 * @param {SpeedContext} context @param {'raise'|'lower'} direction
 * @param {readonly number[]} timers @param {boolean} safeguardBlocks @returns {TimerChange} */
export function applySpeedTimers(context, direction, timers, safeguardBlocks) {
  requireBooleans([safeguardBlocks]);
  if (direction !== 'raise' && direction !== 'lower') throw new RangeError('Unknown speed direction.');
  if (timers.length < 1 || timers.length > 5 || (direction === 'raise' && timers.length !== 1)) {
    throw new RangeError('Expected one raise timer or one to five lower timers.');
  }
  for (const timer of timers) requireInteger(timer, 1, 127, 'new speed counter');
  const before = calculateSpeedStage(context);
  const positiveTimers = [...context.positiveTimers];
  const negativeTimers = [...context.negativeTimers];
  const blocked = direction === 'raise' ? before === 4 : before === 0 || safeguardBlocks;
  let inserted = 0;
  if (!blocked) {
    const destination = direction === 'raise' ? positiveTimers : negativeTimers;
    for (const timer of timers) {
      const slot = destination.indexOf(0);
      if (slot === -1) break;
      destination[slot] = timer;
      inserted += 1;
    }
  }
  const after = calculateSpeedStage({ ...context, positiveTimers, negativeTimers });
  const raised = direction === 'raise' && after > before;
  return { positiveTimers, negativeTimers, before, after, inserted, speedRaisedThisAction: raised, clearAttackLock: raised };
}

/** Call once at an eligible Speed Boost after-action hook, not each phase.
 * @param {number} counter @returns {{counter:number,requestIndefiniteRaise:boolean}} */
export function advanceSpeedBoostCounter(counter) {
  requireInteger(counter, 0, 249, 'Speed Boost counter');
  return { counter: counter === 249 ? 0 : counter + 1, requestIndefiniteRaise: counter === 249 };
}
