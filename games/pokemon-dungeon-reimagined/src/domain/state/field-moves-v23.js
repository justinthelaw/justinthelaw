import { recordsFieldMoves as prior } from './field-moves-v22.js';
import { MOVE_LEARNING_REVISION } from './move-learning-revision.js';
/** Exact successor; frozen v22 recognizes every original identity. @param {string} revision */
export const recordsFieldMoves = revision => prior(revision) || revision === MOVE_LEARNING_REVISION;
