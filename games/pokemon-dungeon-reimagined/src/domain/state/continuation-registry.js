import { TURN_CONTINUATION_REVISION } from './continuation-revision.js';
import { CHAPTER_WORK_REVISION } from './chapter-work-revision.js';
/** Only these complete trusted revisions own the unchanged continuation shapes.
 * @param {string} revision */
export const recordsContinuation = revision => revision === TURN_CONTINUATION_REVISION || revision === CHAPTER_WORK_REVISION;
