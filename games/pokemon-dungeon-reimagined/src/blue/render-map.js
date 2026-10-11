import {nativeMapCell} from './render-native-ui.js';
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */

/** Native map cells and marker precedence, with a bounded floor-local blink. */
export class NativeMap {
  constructor(){
    /** @type {number[]|null} */
    this.tiles=null;
    /** @type {number|null} */
    this.lastTime=null;
    /** @type {number|undefined} */
    this.inputTurn=undefined;
    this.clock=0;this.flashing=false;
  }
  reset(){this.tiles=null;this.lastTime=null;this.inputTurn=undefined;this.clock=0;this.flashing=false;}
  /** @param {DungeonState} state @param {number} time @param {boolean} flashing @param {number} [inputTurn] */
  beginFrame(state,time,flashing,inputTurn){
    if(this.tiles!==state.tiles){this.reset();this.tiles=state.tiles;}
    // DungeonHandlePlayerInput resets after forced-status admission, once for
    // each prepared leader opportunity. Menus and SELECT keep the same token.
    if(inputTurn!==undefined&&inputTurn!==this.inputTurn){this.inputTurn=inputTurn;this.clock=0;this.lastTime=time;}
    if(this.lastTime!==null&&this.flashing&&flashing)this.clock+=Math.max(0,time-this.lastTime);
    this.lastTime=time;this.flashing=flashing;
  }
  /** @param {CanvasRenderingContext2D} context @param {DungeonState} state
   * @param {{style:'clear'|'shade'|'upper',modal?:boolean,showMonsters?:boolean,reducedMotion?:boolean}} options */
  draw(context,state,options){
    const upper=options.style==='upper',xOrigin=upper?16:8,yOrigin=upper?4:0,bank=upper?128:options.style==='clear'?64:0;
    const showMonsters=options.showMonsters!==false;
    const actors=new Map([state.hero,state.partner,...state.enemies].filter(actor=>actor.hp>0&&(actor===state.hero||actor===state.partner||state.visible[actor.y*state.width+actor.x])).map(actor=>[actor.y*state.width+actor.x,actor]));
    const items=new Set(state.items.map(item=>item.y*state.width+item.x)),stairs=state.stairs.y*state.width+state.stairs.x;
    const floor=(/** @type {number} */x,/** @type {number} */y)=>x>=0&&y>=0&&x<state.width&&y<state.height&&state.tiles[y*state.width+x]===1;
    context.save();context.beginPath();context.rect(xOrigin,8,224,upper?120:128);context.clip();
    for(let y=upper?1:2;y<state.height;y++)for(let x=0;x<state.width;x++){
      const index=y*state.width+x,known=Boolean(state.explored[index]),actor=showMonsters?actors.get(index):undefined;
      let pattern=1;
      if(known&&floor(x,y)){
        const mask=(floor(x,y+1)?0:1)|(floor(x+1,y)?0:2)|(floor(x,y-1)?0:4)|(floor(x-1,y)?0:8);
        pattern=16+mask;
      }
      if(actor){
        if(actor===state.hero){if(options.modal)pattern=8;}
        else pattern=actor===state.partner?10:2;
      }else if(known&&items.has(index))pattern=3;
      else if(known&&index===stairs)pattern=6;
      if(pattern!==1)nativeMapCell(context,bank+pattern,xOrigin+x*4,yOrigin+y*4);
    }
    // Normal views use the separate sprite marker; modal A hides every monster,
    // including the steady leader marker supplied by map pattern8.
    if(!options.modal&&showMonsters&&state.hero.hp>0&&(options.reducedMotion||((Math.floor(this.clock*60/1000)+1)&8)===0))nativeMapCell(context,8,xOrigin+state.hero.x*4,yOrigin+state.hero.y*4);
    context.restore();
  }
}
