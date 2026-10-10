/** Generated from pinned comparative Rescue Team menu-effect facts; no music or PCM samples. */
export const MENU_EFFECT_SOURCE_SHA256 = 'cb7cbf55f1a0acff63d6491ed6af5d1f5357094a448bba5d1c87d3a61f519631';
export const MENU_EFFECT_GAIN = 0.22;
export const MENU_EFFECT_TICK_SECONDS = 280896 / 16777216;
export const MENU_EFFECT_THROTTLE_SECONDS = 4 * MENU_EFFECT_TICK_SECONDS;
/** Each note is [start tick, gate ticks, frequency divisor, four-bit envelope]. */
/** @type {Readonly<Record<string,{duty:number,notes:[number,number,number,number][]}>>} */
export const MENU_EFFECTS = {"effect-ui-cursor":{"duty":0.5,"notes":[[0,2,126,6]]},"effect-ui-confirm":{"duty":0.5,"notes":[[0,2,89,7]]},"effect-ui-cancel":{"duty":0.25,"notes":[[0,2,563,6],[3,2,669,6],[5,1,335,5],[6,1,335,1]]},"effect-ui-open":{"duty":0.5,"notes":[[0,1,100,7]]},"effect-ui-denied":{"duty":0.25,"notes":[[0,2,563,6],[3,2,669,6],[5,1,335,5],[6,1,335,1]]}};
