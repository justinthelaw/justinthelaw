/** Generated from pinned comparative Rescue Team SE2 facts; no music or PCM samples. */
export const MENU_EFFECT_SOURCE_SHA256 = '2be79e75e000e57b3184c4f4ab507e4c2b2eb846028c9bac26c38c831821697b';
export const MENU_EFFECT_GAIN = 0.22;
export const MENU_EFFECT_TICK_SECONDS = 280896 / 16777216;
export const MENU_EFFECT_THROTTLE_SECONDS = 4 * MENU_EFFECT_TICK_SECONDS;
/** Each note is [start tick, gate ticks, frequency divisor, four-bit envelope]. */
/** @type {Readonly<Record<string,{duty:number,notes:[number,number,number,number][]}>>} */
export const MENU_EFFECTS = {"effect-ui-cursor":{"duty":0.5,"notes":[[0,2,126,6]]},"effect-ui-confirm":{"duty":0.5,"notes":[[0,2,88,7]]},"effect-ui-cancel":{"duty":0.25,"notes":[[0,2,562,6],[3,2,668,6],[5,1,334,5],[6,1,334,1]]},"effect-ui-open":{"duty":0.5,"notes":[[0,1,100,7]]},"effect-ui-denied":{"duty":0.25,"notes":[[0,2,562,6],[3,2,668,6],[5,1,334,5],[6,1,334,1]]}};
export const BATTLE_EFFECT_SOURCE_SHA256 = 'cba8e1d76f7bb6bb68d69d17430b5ae12e19006ae0ace12b2f64cc6dea679ddc';
/** Native SE2 battle/pickup notes are [start frame, gate frames, frequency divisor, envelope]. */
/** @type {Readonly<Record<string,{duty:number,notes:[number,number,number,number][]}>>} */
export const BATTLE_EFFECTS = {"effect-no-damage-team":{"duty":0.125,"notes":[[2,3,224,9],[5,3,282,9],[8,3,355,9],[11,3,447,9]]},"effect-no-damage-other":{"duty":0.125,"notes":[[2,3,376,9],[5,3,473,9],[8,3,596,9],[11,3,751,9]]},"effect-regular-attack":{"duty":0.5,"notes":[[2,1,158,7],[3,1,210,8],[4,1,354,9],[5,1,298,8],[6,1,198,6]]},"effect-pickup-team":{"duty":0.5,"notes":[[2,3,334,5],[5,2,224,5],[7,3,178,2],[10,2,148,8],[12,2,112,13],[15,1,112,3],[20,1,112,1]]},"effect-pickup-other":{"duty":0.5,"notes":[[3,3,210,5],[6,3,266,8],[9,3,298,2],[12,3,334,7],[15,3,316,14],[19,2,316,4]]},"effect-throw-spin":{"duty":0.5,"notes":[[1,1,250,4],[2,1,188,5],[3,1,118,7],[4,1,100,7],[5,1,88,8],[6,1,140,8],[7,1,178,6],[8,1,198,6],[9,1,298,3]]}};
