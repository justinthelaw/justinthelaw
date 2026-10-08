import { recordsFieldMoves as recordsV18FieldMoves } from './field-moves-v18.js';
import { TURN_CONTINUATION_REVISION } from './continuation-revision.js';
/** Exact admitted roots retain the v16 field cache shape and links.
 * @param {string} revision */
export const recordsFieldMoves = revision => recordsV18FieldMoves(revision) || revision === TURN_CONTINUATION_REVISION;
