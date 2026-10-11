/** Transient menu camera. No saved fields, gameplay callbacks, or RNG. */
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {'hero'|'partner'} CameraMember */
const CHANGE_DELAY=4*1000/60;

export class DungeonCamera {
  constructor(){
    /** @type {CameraMember} */this.target='hero';
    /** @type {CameraMember|null} */this.pending=null;
    /** @type {number[]|null} */this.tiles=null;
    this.readyAt=0;
  }
  reset(){this.target='hero';this.pending=null;this.tiles=null;this.readyAt=0;}
  get locked(){return this.pending!==null;}
  /** Native TryPointCameraToMonster(0) waits four nominal frames only when
   * changing target; the camera then snaps, without a fabricated pan.
   * @param {DungeonState} state @param {CameraMember} target @param {number} time */
  request(state,target,time){
    if(this.tiles!==state.tiles){this.reset();this.tiles=state.tiles;}
    if(state[target].hp<=0)target='hero';
    if(target===this.target){this.pending=null;this.readyAt=0;return;}
    if(this.pending===target)return;
    this.pending=target;this.readyAt=time+CHANGE_DELAY;
  }
  /** Returns a newly selected member so the app can commit map discovery.
   * @param {DungeonState} state @param {number} time @returns {CameraMember|null} */
  advance(state,time){
    if(this.tiles!==state.tiles){this.reset();this.tiles=state.tiles;return null;}
    if(this.pending===null||time<this.readyAt)return null;
    this.target=state[this.pending].hp>0?this.pending:'hero';this.pending=null;this.readyAt=0;
    return this.target;
  }
}
