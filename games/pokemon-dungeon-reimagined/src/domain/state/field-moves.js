import { recordsFieldMoves as recordsV20FieldMoves } from './field-moves-v20.js';
import { STEEL_MEANIES_REVISION } from './steel-meanies-revision.js';
/** Exact successor recognition; every historical root keeps its original owner.
 * @param {string} revision */
export const recordsFieldMoves = revision => recordsV20FieldMoves(revision) || revision === STEEL_MEANIES_REVISION;
