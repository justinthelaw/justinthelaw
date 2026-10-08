import { recordsContinuation as recordsV21Continuation } from './continuation-registry-v21.js';
import { BRONZE_JOBS_REVISION } from './bronze-jobs-revision.js';
/** Only exact complete trusted revisions own the unchanged continuation shapes.
 * @param {string} revision */
export const recordsContinuation = revision => recordsV21Continuation(revision) || revision === BRONZE_JOBS_REVISION;
