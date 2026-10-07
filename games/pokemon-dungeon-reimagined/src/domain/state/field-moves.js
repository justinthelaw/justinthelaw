import { recordsFieldMoves as recordsV16FieldMoves } from './field-moves-v16.js';
/** Exact admitted roots retain the v16 field cache shape and links.
 * @param {string} revision */
export const recordsFieldMoves = revision => recordsV16FieldMoves(revision) || revision.startsWith('blue-campaign-state-v17-item-impact-opening:browser-opening-v12-friends:');
