/** Exact phase engine; downstream concrete systems must provide every typed hook. */
export { advanceTurns, createScheduler, TURN_BUDGET } from './turns/engine.js';
export { installSpeedChange } from './turns/support.js';
