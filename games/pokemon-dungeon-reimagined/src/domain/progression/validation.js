import { issue, pointer } from '../state/structure.js';

/** @typedef {import('../../contracts/campaign.js').NativeProgressState} NativeProgressState */
/** @typedef {import('../../contracts/campaign.js').StateIssue} StateIssue */

/** Sourced storage/index bounds only; narrative legality remains a required policy.
 * Called only after the exact NativeProgressState shape has been validated.
 * @param {NativeProgressState} state @param {StateIssue[]} issues @param {string} [path]
 */
export function checkNativeProgress(state, issues, path = '') {
  /** @param {number} value @param {number} min @param {number} max @param {string} at */
  const bound = (value, min, max, at) => {
    if (!Number.isSafeInteger(value) || value < min || value > max) issue(issues, 'range', at, `Native value must be an integer in ${min}..${max}.`);
  };
  for (const [name, pair] of Object.entries(state.scenarios)) {
    bound(pair.chapter, 0, 255, `${path}/scenarios/${name}/chapter`);
    bound(pair.step, 0, 255, `${path}/scenarios/${name}/step`);
  }
  bound(state.clearCount, 0, 100, `${path}/clearCount`);
  bound(state.entryFrequency, 0, 65535, `${path}/entryFrequency`);
  for (const scope of ['persistent', 'pending']) {
    const bits = scope === 'persistent' ? state.flags.persistent : state.flags.pending;
    if (bits.length !== 64) issue(issues, 'range', `${path}/flags/${scope}`, 'Exactly 64 native cutscene bits are required.');
  }
  if (state.eventS07E01.length !== 16) issue(issues, 'range', `${path}/eventS07E01`, 'Exactly sixteen event bits are required.');
  state.eventGonbe.forEach((value, index) => bound(value, -32768, 32767, `${path}/eventGonbe/${index}`));
  const s = state.scalars;
  for (const key of /** @type {const} */ (['baseLevel', 'warpLock', 'flagKind', 'flagKindChangeRequest'])) bound(s[key], -128, 127, pointer(`${path}/scalars`, key));
  for (const key of /** @type {const} */ (['previousMap', 'eventLocal'])) bound(s[key], -32768, 32767, pointer(`${path}/scalars`, key));
  for (const key of /** @type {const} */ (['dungeonEnter', 'dungeonEnterIndex'])) bound(s[key], -1, 82, pointer(`${path}/scalars`, key));
  for (const key of /** @type {const} */ (['partner1Kind', 'partner2Kind'])) bound(s[key], 0, 255, pointer(`${path}/scalars`, key));
}
