import { ESCORT_WORK_REVISION } from './escort-work-revision.js';
import { recordsContinuation as prior } from './continuation-registry-v22.js';
import { MOVE_LEARNING_REVISION } from './move-learning-revision.js';
/** Exact successor; frozen v22 recognizes every original identity. @param {string} revision */
export const recordsContinuation = revision => prior(revision) || revision === MOVE_LEARNING_REVISION || revision === ESCORT_WORK_REVISION;
