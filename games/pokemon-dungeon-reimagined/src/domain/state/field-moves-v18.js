import { recordsFieldMoves as recordsV17FieldMoves } from './field-moves-v17.js';
/** Exact admitted roots retain the v16 field cache shape and links.
 * @param {string} revision */
export const recordsFieldMoves = revision => recordsV17FieldMoves(revision) || revision.startsWith('blue-campaign-state-v18-stun-seed-opening:browser-opening-v12-friends:');
