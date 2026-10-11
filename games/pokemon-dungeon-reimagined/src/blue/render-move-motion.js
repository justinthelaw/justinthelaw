import {MOVE_MOTION_FACTS} from './render-move-motion-data.js';

/** Source sub_800EA44 selects the first species override before the move default.
 * The battle timeline handles rotation IDs 98/99 separately from atlas motions.
 * Overlay coverage and trajectory qualifications belong to that owner.
 * @param {string} moveId @param {string} speciesId */
export function moveEffects(moveId,speciesId){
  const record=MOVE_MOTION_FACTS[moveId];if(!record)return undefined;
  return{animation:record.overrides[speciesId]??record.animation,preparation:record.preparation,cast:record.cast,target:record.target,travel:record.travel,attachmentSet:record.attachmentOverrides[speciesId]??record.attachmentSet,travelSpeed:record.travelSpeed};
}
