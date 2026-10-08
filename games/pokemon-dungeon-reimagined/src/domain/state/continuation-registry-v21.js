import { recordsContinuation as recordsV20Continuation } from './continuation-registry-v20.js';
import { STEEL_MEANIES_REVISION } from './steel-meanies-revision.js';
/** Only exact complete trusted revisions own the unchanged continuation shapes.
 * @param {string} revision */
export const recordsContinuation = revision => recordsV20Continuation(revision) || revision === STEEL_MEANIES_REVISION;
