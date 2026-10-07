import { recordsSteel } from './steel.js';
/** Exact root selection, independent of broad optional TypeScript fields.
 * @param {string} revision */
export const recordsEarlyWork = revision => recordsSteel(revision) || revision.startsWith('blue-campaign-state-v8-work-opening:browser-opening-v8-work:') || revision.startsWith('blue-campaign-state-v9-battle-opening:browser-opening-v9-battle:');
