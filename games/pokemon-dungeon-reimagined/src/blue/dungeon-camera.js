/** Shared transient camera clock; menus and battle timelines never own RNG. */
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {'hero'|'partner'} CameraMember */
/** @typedef {{target:CameraMember,counter:number}} CameraSnapshot */
export const CAMERA_FRAME_MS=1000/60;

/** @param {number} counter @param {number} frames */
export function advanceCameraCounter(counter,frames){
  if(!Number.isInteger(counter)||counter<0||counter>100||!Number.isFinite(frames))throw new RangeError('Invalid camera clock.');
  return Math.min(100,counter+Math.max(0,Math.floor(frames)));
}
/** Call only for a changed target, after any flag-1 effect drain.
 * @param {number} counter @param {boolean} timed */
export function cameraChangeFrames(counter,timed){return (timed?Math.max(0,60-advanceCameraCounter(counter,0)):0)+4;}
/** @param {number} time */
function tick(time){if(!Number.isFinite(time)||time<0)throw new RangeError('Invalid camera time.');return Math.floor(time/CAMERA_FRAME_MS);}

export class DungeonCamera {
  constructor(){
    /** @type {CameraMember} */this.target='hero';
    /** Only explicit menu requests use this pending slot. */
    /** @type {CameraMember|null} */this.pending=null;
    /** @type {number[]|null} */this.tiles=null;
    this.readyAt=0;this.counter=0;this.lastTick=0;this.disposed=false;
  }
  /** @param {number} [counter] */
  reset(counter=0){
    this.target='hero';this.pending=null;this.tiles=null;this.readyAt=0;
    this.counter=advanceCameraCounter(counter,0);this.lastTick=0;
  }
  dispose(){if(this.disposed)return;this.reset();this.disposed=true;}
  get locked(){return this.pending!==null;}
  /** Unprepared floors start at99; prepared input boundaries normalize to0.
   * @param {DungeonState} state @param {number} time */
  clock(state,time){
    const now=tick(time);
    if(this.tiles!==state.tiles){
      if(this.tiles!==null)this.reset(99);
      this.tiles=state.tiles;this.lastTick=now;
    }
    this.counter=advanceCameraCounter(this.counter,now-this.lastTick);this.lastTick=now;
  }
  /** @param {DungeonState} state @param {number} time @returns {CameraSnapshot} */
  snapshot(state,time){
    if(this.disposed)return {target:'hero',counter:0};
    this.clock(state,time);return {target:this.target,counter:this.counter};
  }
  /** Adopt only an active, current-floor timeline's finite projection. Its
   * native counter is rebased to browser time after reduced-motion completion.
   * @param {DungeonState} state @param {CameraSnapshot} value @param {number} time */
  adopt(state,value,time){
    if(this.disposed)return false;
    this.clock(state,time);
    if(value.target!=='hero'&&value.target!=='partner')throw new RangeError('Invalid camera member.');
    this.target=value.target;this.counter=advanceCameraCounter(value.counter,0);this.lastTick=tick(time);
    return true;
  }
  /** Native flag0 waits four frames on a changed menu target and then snaps.
   * @param {DungeonState} state @param {CameraMember} target @param {number} time */
  request(state,target,time){
    if(this.disposed)return;
    this.clock(state,time);
    if(state[target].hp<=0)target='hero';
    if(target===this.target){this.pending=null;this.readyAt=0;return;}
    if(this.pending===target)return;
    this.pending=target;this.readyAt=time+cameraChangeFrames(this.counter,false)*CAMERA_FRAME_MS;
  }
  /** Returns a newly selected member for canonical menu-map discovery.
   * @param {DungeonState} state @param {number} time @returns {CameraMember|null} */
  advance(state,time){
    if(this.disposed)return null;
    this.clock(state,time);
    if(this.pending===null||time<this.readyAt)return null;
    const target=state[this.pending].hp>0?this.pending:'hero',at=this.readyAt;
    this.pending=null;this.readyAt=0;
    if(target===this.target)return null;
    this.target=target;this.counter=advanceCameraCounter(0,tick(time)-tick(at));this.lastTick=tick(time);
    return this.target;
  }
}
