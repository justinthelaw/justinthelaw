/** Native Rescue Team UI tiles. Generated image data is synchronous and local. */
import {NATIVE_UI_TILES,NATIVE_UI_PALETTES,NATIVE_CURSOR_TILES,NATIVE_CURSOR_PALETTE,NATIVE_SHADOWS,NATIVE_TEAM_SHADOWS,NATIVE_SHADOW_PALETTE,NATIVE_DAMAGE_TILES,NATIVE_DAMAGE_PALETTES,NATIVE_TOUCH_BUTTONS} from './render-native-ui-data.js';

/** @type {Map<string,HTMLCanvasElement>} */
const ATLASES=new Map();

/** @param {string} key @param {string[]} tiles @param {string[]} palette */
function atlas(key,tiles,palette){
  const existing=ATLASES.get(key);if(existing)return existing;
  const image=document.createElement('canvas');image.width=tiles.length*8;image.height=8;
  const context=image.getContext('2d');if(!context)throw Error('A 2D canvas is required for native UI.');
  tiles.forEach((tile,index)=>Array.from(tile).forEach((value,pixel)=>{
    const color=parseInt(value,16);if(color===0)return;
    context.fillStyle=palette[color]??'#000000';context.fillRect(index*8+pixel%8,Math.floor(pixel/8),1,1);
  }));
  ATLASES.set(key,image);return image;
}

/** @param {boolean} pink @param {number} [bank] */
function palette(pink,bank){return NATIVE_UI_PALETTES[bank??(pink?4:0)]??[];}
/** @param {boolean} pink @param {number} [bank] */
function windowAtlas(pink,bank){const id=bank??(pink?4:0);return atlas(`window:${id}`,NATIVE_UI_TILES,palette(pink,id));}

/** @param {CanvasRenderingContext2D} context @param {HTMLCanvasElement} image @param {number} tile
 * @param {number} x @param {number} y @param {boolean} [flipX] @param {boolean} [flipY] */
function drawTile(context,image,tile,x,y,flipX=false,flipY=false){
  context.save();context.translate(Math.round(x)+(flipX?8:0),Math.round(y)+(flipY?8:0));
  context.scale(flipX?-1:1,flipY?-1:1);context.drawImage(image,tile*8,0,8,8,0,0,8,8);context.restore();
}

/** @param {CanvasRenderingContext2D} context @param {HTMLCanvasElement} image @param {number} tile
 * @param {number} x @param {number} y @param {number} width @param {number} height @param {boolean} [flipX] @param {boolean} [flipY] */
function repeatTile(context,image,tile,x,y,width,height,flipX=false,flipY=false){
  context.save();context.beginPath();context.rect(x,y,width,height);context.clip();
  for(let yy=y;yy<y+height;yy+=8)for(let xx=x;xx<x+width;xx+=8)drawTile(context,image,tile,xx,yy,flipX,flipY);
  context.restore();
}

/** Bounding boxes include the native visible border. Dialogue is the special
 * type0 window (224×40); portraits accept a48×48 box for a40×40 image.
 * @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {number} width @param {number} height
 * @param {{opacity?:number,pink?:boolean,kind?:'dialogue'|'normal'|'portrait'}} [options] */
export function panel(context,x,y,width,height,options={}){
  const pink=options.pink??false,colors=palette(pink),image=windowAtlas(pink),kind=options.kind??'normal';
  x=Math.round(x);y=Math.round(y);width=Math.round(width);height=Math.round(height);
  context.save();context.globalAlpha=options.opacity??1;
  if(kind==='portrait'){
    // Transparent outer half of each source8×8 tile is outside the visible box.
    context.save();context.beginPath();context.rect(x,y,width,height);context.clip();
    drawTile(context,image,100,x-4,y-4);drawTile(context,image,100,x+width-4,y-4,true);
    drawTile(context,image,100,x-4,y+height-4,false,true);drawTile(context,image,100,x+width-4,y+height-4,true,true);
    repeatTile(context,image,101,x+4,y-4,width-8,8);repeatTile(context,image,101,x+4,y+height-4,width-8,8,false,true);
    repeatTile(context,image,102,x-4,y+4,8,height-8);repeatTile(context,image,102,x+width-4,y+4,8,height-8,true);
    context.restore();context.restore();return;
  }
  context.fillStyle=colors[1]??'#204969';context.fillRect(x+3,y+3,Math.max(0,width-6),Math.max(0,height-6));
  const corner=kind==='dialogue'?31:96;
  drawTile(context,image,corner,x,y);drawTile(context,image,corner,x+width-8,y,true);
  drawTile(context,image,corner,x,y+height-8,false,true);drawTile(context,image,corner,x+width-8,y+height-8,true,true);
  repeatTile(context,image,98,x,y+8,8,height-16);repeatTile(context,image,98,x+width-8,y+8,8,height-16,true);
  if(kind==='dialogue'){
    for(let row=0;row<3;row++){
      context.fillStyle=colors[15-row]??'#000000';context.fillRect(x+8,y+row,width-16,1);context.fillRect(x+8,y+height-row-1,width-16,1);
    }
  }else{
    repeatTile(context,image,97,x+8,y,width-16,8);repeatTile(context,image,97,x+8,y+height-8,width-16,8,false,true);
  }
  context.restore();
}

/** One selected native window header, as used by the partner list. Arguments
 * are the content origin/size in pixels, matching the source WindowTemplate;
 * the native border extends eight pixels beyond it. Header width excludes its
 * two side tiles. Text belongs at(contentX+12,contentY), first row at+16.
 * @param {CanvasRenderingContext2D} context @param {number} contentX @param {number} contentY
 * @param {number} contentWidth @param {number} contentHeight @param {number} [headerWidth] @param {boolean} [pink] */
export function nativeMenuFrame(context,contentX,contentY,contentWidth,contentHeight,headerWidth=48,pink=false){
  const image=windowAtlas(pink),colors=palette(pink),x=Math.round(contentX),y=Math.round(contentY);
  context.fillStyle=colors[1]??'#204969';
  context.fillRect(x+3,y-4,headerWidth+12,12);
  context.fillRect(x-5,y+8,contentWidth+10,contentHeight-3);
  drawTile(context,image,96,x-8,y+8);drawTile(context,image,96,x+contentWidth,y+8,true);
  repeatTile(context,image,98,x-8,y+16,8,contentHeight-16);repeatTile(context,image,98,x+contentWidth,y+16,8,contentHeight-16,true);
  drawTile(context,image,96,x-8,y+contentHeight,false,true);drawTile(context,image,96,x+contentWidth,y+contentHeight,true,true);
  repeatTile(context,image,97,x,y+contentHeight,contentWidth,8,false,true);
  drawTile(context,image,104,x,y-8);drawTile(context,image,98,x,y);drawTile(context,image,111,x,y+8,true);
  repeatTile(context,image,105,x+8,y-8,headerWidth,8);
  const right=x+headerWidth+8;
  drawTile(context,image,104,right,y-8,true);drawTile(context,image,98,right,y,true);drawTile(context,image,111,right,y+8);
  repeatTile(context,image,97,right+8,y+8,Math.max(0,contentWidth-headerWidth-16),8);
}

/** Original Blue touch labels/borders, preserving toolbar-specific spacing.
 * @param {CanvasRenderingContext2D} context @param {boolean} [pink] */
export function nativeTouchToolbar(context,pink=false){
  const key=pink?'touch:female':'touch:male';let image=ATLASES.get(key);
  if(!image){
    image=document.createElement('canvas');image.width=200;image.height=16;
    const pixels=image.getContext('2d');if(!pixels)throw Error('A 2D canvas is required for native touch buttons.');
    const colors=palette(pink);
    NATIVE_TOUCH_BUTTONS.forEach((button,index)=>Array.from(button.pixels).forEach((value,pixel)=>{
      const color=parseInt(value,16);if(color){pixels.fillStyle=colors[color]??'#000000';pixels.fillRect(index*40+pixel%40,Math.floor(pixel/40),1,1);}
    }));
    ATLASES.set(key,image);
  }
  NATIVE_TOUCH_BUTTONS.forEach((button,index)=>context.drawImage(image,index*40,0,40,16,button.x,button.y,40,16));
}

/** Independent copies keep caller hit-testing from mutating source geometry. */
export function touchToolbarBounds(){return NATIVE_TOUCH_BUTTONS.map(({id,label,x,y,width,height})=>({id,label,x,y,width,height}));}

/** Native8×8 menu arrow; color parameter is retained for caller compatibility.
 * @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {string} [_color] */
export function cursor(context,x,y,_color){drawTile(context,atlas('cursor',NATIVE_CURSOR_TILES,NATIVE_CURSOR_PALETTE),4,x,y);}

/** Native16×8 downward dialogue prompt.
 * @param {CanvasRenderingContext2D} context @param {number} x @param {number} y */
export function dialogueArrow(context,x,y){
  const image=atlas('cursor',NATIVE_CURSOR_TILES,NATIVE_CURSOR_PALETTE);
  drawTile(context,image,0,x,y);drawTile(context,image,1,x+8,y);
}

/** Native shadow bitmap and source AX anchor. Species Diglett/Dugtrio are not
 * in this opening roster; their native no-shadow exception is not needed here.
 * @param {CanvasRenderingContext2D} context @param {number} shadowSize @param {number} x @param {number} y @param {number} [scale] @param {boolean} [team] */
export function nativeShadow(context,shadowSize,x,y,scale=1,team=false){
  const index=Math.max(0,Math.min(2,shadowSize));
  if(team){
    const shadow=NATIVE_TEAM_SHADOWS[index];if(!shadow)return;
    const key=`shadow:team:${index}`;let image=ATLASES.get(key);
    if(!image){
      image=document.createElement('canvas');image.width=shadow.width;image.height=shadow.height;
      const pixels=image.getContext('2d');if(!pixels)throw Error('A 2D canvas is required for native shadows.');
      Array.from(shadow.pixels).forEach((value,pixel)=>{const color=parseInt(value,16);if(color){pixels.fillStyle=NATIVE_SHADOW_PALETTE[color]??'#000000';pixels.fillRect(pixel%shadow.width,Math.floor(pixel/shadow.width),1,1);}});
      ATLASES.set(key,image);
    }
    context.drawImage(image,Math.round(x-shadow.width*scale/2),Math.round(y-shadow.height*scale/2),shadow.width*scale,shadow.height*scale);return;
  }
  const shadow=NATIVE_SHADOWS[index];if(!shadow)return;
  context.fillStyle='#000000';
  shadow.rows.forEach((row,yy)=>{for(let xx=0;xx<shadow.width;xx++)if((row>>>xx)&1)context.fillRect(Math.round(x+(xx-shadow.width/2)*scale),Math.round(y+(yy-4)*scale),Math.max(1,Math.round(scale)),Math.max(1,Math.round(scale)));});
}

/** Original HUD uses fixed8×8 label/digit tiles. The HP bar is one pixel per
 * maximum HP up to96, then proportionally scaled. Coordinates match Blue ss01.
 * @param {CanvasRenderingContext2D} context
 * @param {{floor:number,level:number,hp:number,maxHp:number,belly?:number,pink?:boolean,time?:number}} state */
export function nativeHud(context,state){
  const warn=Math.floor((state.time??0)*60/1000)&16;
  const bank=warn&&state.belly===0?3:warn&&state.hp>0&&state.hp<=state.maxHp/4?2:state.pink?4:0;
  const image=windowAtlas(Boolean(state.pink),bank),colors=palette(Boolean(state.pink),bank);
  /** @param {number} tile @param {number} column */
  const put=(tile,column)=>drawTile(context,image,tile,column*8,0);
  /** @param {number} value @param {number} column @param {number} length */
  const digits=(value,column,length)=>{
    const characters=String(Math.max(0,Math.min(999,Math.floor(value)))).padStart(length,' ');
    Array.from(characters).slice(-length).forEach((character,index)=>{if(character!==' ')put(16+Number(character),column+index);});
  };
  put(70,1);digits(state.floor,2,state.floor<10?1:2);put(64,state.floor<10?3:4);
  put(65,5);put(66,6);digits(state.level,7,2);put(67,9);put(68,10);
  digits(state.hp,11,3);put(69,14);digits(state.maxHp,15,3);
  const maximum=Math.max(1,Math.min(96,state.maxHp)),remaining=Math.max(0,Math.min(maximum,state.maxHp>=96?Math.floor(state.hp*96/state.maxHp):state.hp));
  context.fillStyle=colors[7]??'#fbfbfb';context.fillRect(144,1,maximum,1);context.fillRect(144,6,maximum,1);
  context.fillStyle=colors[2]??'#fb8259';context.fillRect(144,2,maximum,4);
  context.fillStyle=colors[4]??'#59fb59';context.fillRect(144,2,remaining,4);
}

/** Native8×8 floating-number glyphs, with a six-pixel advance.
 * @param {CanvasRenderingContext2D} context @param {number} amount @param {number} x @param {number} y @param {boolean} [heal] */
export function nativeDamage(context,amount,x,y,heal=false){
  const colors=NATIVE_DAMAGE_PALETTES[heal?1:0]??[],image=atlas(heal?'damage:heal':'damage:hurt',NATIVE_DAMAGE_TILES,colors);
  const characters=String(Math.min(999,Math.max(0,Math.floor(amount)))),width=(characters.length+1)*6;
  let left=Math.round(x-width/2);drawTile(context,image,heal?10:11,left,y);left+=6;
  for(const character of characters){drawTile(context,image,Number(character),left,y);left+=6;}
}

/** Release only lazily generated UI atlases; all source data stays immutable. */
export function disposeNativeUi(){for(const image of ATLASES.values()){image.width=0;image.height=0;}ATLASES.clear();}
