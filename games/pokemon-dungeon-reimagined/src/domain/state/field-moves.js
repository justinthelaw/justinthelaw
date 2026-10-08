import { recordsFieldMoves as recordsV21FieldMoves } from './field-moves-v21.js';
import { BRONZE_JOBS_REVISION } from './bronze-jobs-revision.js';
/** Exact successor recognition; every historical root keeps its original owner.
 * @param {string} revision */
export const recordsFieldMoves = revision => recordsV21FieldMoves(revision) || revision === BRONZE_JOBS_REVISION;
