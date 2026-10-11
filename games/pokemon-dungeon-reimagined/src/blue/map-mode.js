/** Original DS display combinations. Adventure saves do not contain these. */
/** @typedef {0|1|2|3|4|5|6} DisplayMode */
/** @typedef {'off'|'clear'|'shade'} MapStyle */
/** @type {readonly {letter:string,top:'team'|'log'|'map',bottom:MapStyle}[]} */
export const DISPLAY_MODES=Object.freeze([
  {letter:'A',top:'team',bottom:'off'},
  {letter:'B',top:'team',bottom:'clear'},
  {letter:'C',top:'team',bottom:'shade'},
  {letter:'D',top:'log',bottom:'off'},
  {letter:'E',top:'log',bottom:'clear'},
  {letter:'F',top:'log',bottom:'shade'},
  {letter:'G',top:'map',bottom:'off'},
]);
/** @param {unknown} value @returns {value is DisplayMode} */
export function isDisplayMode(value){return typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=6;}
/** @param {DisplayMode} mode */
export function displaySettings(mode){return DISPLAY_MODES[mode]??{letter:'B',top:/** @type {const} */('team'),bottom:/** @type {const} */('clear')};}

/** SELECT temporarily enables an existing lower-map style, retaining the
 * upper display. Native entry waits10frames; close completes2display frames. */
export class FloorMap {
  constructor(){
    this.active=false;this.showMonsters=true;this.readyAt=0;this.resumeAt=0;
    /** @type {DisplayMode} */
    this.mode=1;
  }
  reset(){this.active=false;this.showMonsters=true;this.readyAt=0;this.resumeAt=0;this.mode=1;}
  /** @param {DisplayMode} mode @param {number} time */
  open(mode,time){
    if(mode===6)return false;
    this.mode=mode===0?1:mode===3?4:mode;this.active=true;this.showMonsters=true;this.readyAt=time+10*1000/60;this.resumeAt=0;
    return true;
  }
  /** @param {number} time */
  blocks(time){return this.active||time<this.resumeAt;}
  /** @param {import('./input.js').InputAction} action @param {number} time
   * @returns {'waiting'|'toggle'|'closed'|'ignored'} */
  handle(action,time){
    if(!this.active)return'ignored';
    if(time<this.readyAt)return'waiting';
    if(action==='confirm'){this.showMonsters=!this.showMonsters;return'toggle';}
    if(action==='map'||action==='cancel'){this.active=false;this.showMonsters=true;this.resumeAt=time+2*1000/60;return'closed';}
    return'ignored';
  }
}
