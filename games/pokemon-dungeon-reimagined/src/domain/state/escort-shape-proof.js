import { copyPlainData } from './plain.js';
import { inspectShape } from './structure.js';
import { ESCORT_WORK_SHAPES } from './escort-work-schema.js';

/** Successful structure under the recursively frozen registry only. The normal
 * validator owns a fresh deeply frozen input for each validation; semantic raw
 * ownership still runs independently before every callback.
 * @type {WeakSet<object>} */
const frozenShapeInputs = new WeakSet();

/** Called only after bounded plain-data and exact-shape admission. A frozen root
 * cannot hide mutable descendants; descriptors never execute caller accessors.
 * This only observes the input and never freezes or otherwise repairs it.
 * @param {unknown} input */
function deeplyFrozen(input) {
  const pending = [input];
  const visited = new WeakSet();
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== 'object' || visited.has(value)) continue;
    if (!Object.isFrozen(value)) return false;
    visited.add(value);
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) {
      if (!Object.hasOwn(descriptor,'value')) return false;
      if (descriptor.value && typeof descriptor.value === 'object') pending.push(descriptor.value);
    }
  }
  return true;
}

/** Independent raw exact preflight for prospective callbacks. Detachment never
 * freezes a caller, invokes accessors or admits unknown/falsy/sparse owners.
 * Only an already proved, entirely immutable identity reuses structural success.
 * The complete content factory must still prove graph/provenance/domain rules;
 * exact shape alone does not activate or admit the successor.
 * @param {unknown} input @returns {string|null} */
export function escortShapeProblem(input) {
  if (input && typeof input === 'object' && frozenShapeInputs.has(input)) return null;
  let data; try { data = copyPlainData(input); } catch { return 'Prospective escort owner requires bounded detached plain data.'; }
  /** @type {import('../../contracts/campaign.js').StateIssue[]} */ const issues = [];
  if (!inspectShape(data,'CampaignStateWithFieldMoves',issues,undefined,'',ESCORT_WORK_SHAPES)) return 'Prospective escort owner requires its exact complete raw shape.';
  if (input && typeof input === 'object' && deeplyFrozen(input)) frozenShapeInputs.add(input);
  return null;
}
