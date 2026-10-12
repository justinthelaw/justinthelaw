/** Native live-log window: three visible11-pixel rows, an11-frame row scroll.
 * Message lifetime belongs to app.js; this object owns presentation only. */
import {panel,text,wrapText} from './render-font.js';
const TICK=1000/60,ROW=11,MAX_LINES=24;

export class DungeonNotice {
  constructor(){
    /** @type {string[]} */this.lines=[];
    /** @type {string[]} */this.pending=[];
    /** @type {string[]} */this.observed=[];
    this.value='';this.clock=0;
    /** @type {number|null} */this.lastTime=null;
    /** @type {number|null} */this.scrollStarted=null;
  }

  reset(){this.lines=[];this.pending=[];this.observed=[];this.value='';this.clock=0;this.lastTime=null;this.scrollStarted=null;}

  /** @param {CanvasRenderingContext2D} context @param {string} value @param {number} time
   * @param {{pink?:boolean,visible?:boolean,reducedMotion?:boolean}} [options] */
  draw(context,value,time,options={}){
    if(!value){this.reset();return;}
    const visible=options.visible!==false;
    if(this.lastTime!==null&&visible)this.clock+=Math.max(0,time-this.lastTime);
    this.lastTime=time;
    if(value!==this.value){
      const next=wrapText(value,204).slice(-MAX_LINES);let overlap=Math.min(this.observed.length,next.length);
      while(overlap>0&&!this.observed.slice(-overlap).every((line,index)=>line===next[index]))overlap--;
      this.pending.push(...next.slice(overlap));this.pending=this.pending.slice(-MAX_LINES);
      this.observed=next;this.value=value;
    }
    while(this.lines.length<3&&this.pending.length)this.lines.push(this.pending.shift()??'');
    if(options.reducedMotion){this.lines=[...this.lines,...this.pending].slice(-3);this.pending=[];this.scrollStarted=null;}
    else{
      if(this.pending.length&&this.scrollStarted===null)this.scrollStarted=this.clock;
      while(this.scrollStarted!==null&&this.clock-this.scrollStarted>=ROW*TICK){
        this.lines=[...this.lines.slice(-2),this.pending.shift()??''];
        this.scrollStarted=this.pending.length?this.scrollStarted+ROW*TICK:null;
      }
    }
    if(!visible)return;
    panel(context,16,136,224,40,{kind:'dialogue',pink:options.pink});
    const shift=this.scrollStarted===null?0:Math.min(ROW-1,Math.floor((this.clock-this.scrollStarted)/TICK));
    const displayed=this.scrollStarted===null?this.lines:[...this.lines,this.pending[0]??''];
    context.save();context.beginPath();context.rect(24,139,208,34);context.clip();
    displayed.forEach((line,index)=>text(context,line,28,140+index*ROW-shift));
    context.restore();
  }
}
