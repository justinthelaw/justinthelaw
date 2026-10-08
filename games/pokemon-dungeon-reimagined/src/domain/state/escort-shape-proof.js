import { copyPlainData } from './plain.js';
import { inspectShape } from './structure.js';
import { ESCORT_WORK_SHAPES } from './escort-work-schema.js';
/** Independent raw exact preflight for prospective callbacks. Detachment never
 * freezes a caller, invokes accessors or admits unknown/falsy/sparse owners.
 * The complete content factory must still prove graph/provenance/domain rules;
 * exact shape alone does not activate or admit the successor.
 * @param {unknown} input @returns {string|null} */
export function escortShapeProblem(input) {
  let data; try { data = copyPlainData(input); } catch { return 'Prospective escort owner requires bounded detached plain data.'; }
  /** @type {import('../../contracts/campaign.js').StateIssue[]} */ const issues = [];
  return inspectShape(data,'CampaignStateWithFieldMoves',issues,undefined,'',ESCORT_WORK_SHAPES) ? null : 'Prospective escort owner requires its exact complete raw shape.';
}
