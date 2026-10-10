/** Camera/minimap knowledge only. AI and targeting retain inSight unchanged. */
import {inSight} from './mechanics-common.js';
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */

/** Native minimap/monster-dot sight uses the current camera member's room plus
 * its one-tile border, or radius2 in a corridor. Tiny Woods' light level0 affects
 * world dimming separately; it does not reveal the whole minimap.
 * @param {DungeonState} state @param {Actor} member @param {boolean[]} [result] */
export function cameraSight(state,member,result=Array(state.width*state.height).fill(false)){
  result.fill(false);if(member.hp<=0)return result;
  for(let y=0;y<state.height;y++)for(let x=0;x<state.width;x++)result[y*state.width+x]=inSight(state,member,{x,y});
  return result;
}

/** Source DiscoverMinimap is monotonic knowledge and consumes neither a turn
 * nor random numbers. No traps or sight-altering items exist in this slice.
 * @param {DungeonState} state @param {'hero'|'partner'} memberId @returns {boolean} */
export function discoverCameraArea(state,memberId){
  const member=state[memberId];if(member.hp<=0)return false;let changed=false;
  for(let y=0;y<state.height;y++)for(let x=0;x<state.width;x++){
    const index=y*state.width+x;
    if(!state.explored[index]&&inSight(state,member,{x,y})){state.explored[index]=true;changed=true;}
  }
  return changed;
}
