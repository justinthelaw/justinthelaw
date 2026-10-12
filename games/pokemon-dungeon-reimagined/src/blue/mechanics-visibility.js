/** Camera/minimap knowledge only. AI and targeting retain inSight unchanged. */
import {inSight} from './mechanics-common.js';
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */

/** Native minimap/monster-dot sight uses the current camera member's room plus
 * its one-tile border, or radius2 in a corridor. Tiny Woods' light level0 affects
 * world dimming separately; it does not reveal the whole minimap.
 * @param {DungeonState} state @param {Actor} member @param {boolean[]} [result] @param {boolean} [retainFainted] */
export function cameraSight(state,member,result=Array(state.width*state.height).fill(false),retainFainted=false){
  result.fill(false);if(member.hp<=0&&!retainFainted)return result;
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

/** Pure knowledge from a captured camera position, independent of current actors.
 * @param {DungeonState} state @param {import('./mechanics-types.js').Point} position
 * @param {readonly boolean[]} [known] @returns {number[]} */
export function cameraDiscovery(state,position,known=state.explored){
  const discovered=[];
  for(let y=0;y<state.height;y++)for(let x=0;x<state.width;x++){
    const index=y*state.width+x;
    if(!known[index]&&inSight(state,position,{x,y}))discovered.push(index);
  }
  return discovered;
}
/** Apply a complete, current-floor knowledge receipt without a turn or draw.
 * The app owns dungeon/tiles/transition identity before calling this function.
 * @param {DungeonState} state @param {readonly number[]} discovered */
export function applyCameraDiscovery(state,discovered){
  const size=state.width*state.height;
  if(discovered.length>size||discovered.some(index=>!Number.isInteger(index)||index<0||index>=size))throw new RangeError('Invalid camera discovery.');
  let changed=false;
  for(const index of discovered)if(!state.explored[index]){state.explored[index]=true;changed=true;}
  return changed;
}
