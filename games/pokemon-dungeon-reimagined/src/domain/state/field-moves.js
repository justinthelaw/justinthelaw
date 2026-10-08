import { recordsFieldMoves as recordsV19FieldMoves } from './field-moves-v19.js';
import { CHAPTER_WORK_REVISION } from './chapter-work-revision.js';
/** Exact successor recognition; historical roots retain their original admission.
 * @param {string} revision */
export const recordsFieldMoves = revision => recordsV19FieldMoves(revision) || revision === CHAPTER_WORK_REVISION;
