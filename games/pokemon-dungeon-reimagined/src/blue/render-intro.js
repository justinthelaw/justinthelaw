/**
 * Opening choreography from the pinned comparative Red ground scripts:
 * S04 company cards -> DEMO_03 -> T01P04 -> T01P03 -> S03 -> S02.
 * Coordinates use the scripts' 8px ground grid and fixed-point movement speeds.
 * Native scenery, Pelipper and mail images have pinned public provenance.
 * Nominal 60Hz timings have not been frame-matched against Blue.
 */
import { OrnamentBank } from './render-ornaments.js';

const FRAME_MS = 1000 / 60;
const BOOT_CARD_STARTS=[0,122,244,366];
// Four20/60/20-tick cards, cue handshakes, the final4-tick wait, parent
// return, and its60-tick palette-bank exit. Blue video confirms the black
// interval before Pelipper; exact cross-driver frame timing remains qualified.
export const BOOT_DURATION_MS=534*FRAME_MS;
// MUS_INTRO is continuous across all three cuts. The script holds white until
// its nonlooping876-tick track finishes. The Blue catalog reports0:19; the Red
// driver's final-tick/status timing is not proof of DS frame-exact duration.
export const OPENING_DURATION_MS = BOOT_DURATION_MS+19_000;

/** The comparative source chooses from the first15 of16 starter candidates. */
export const INTRO_CLIENT_IDS = [25,52,133,300,7,158,258,54,4,255,155,104,66,1,152].map(id=>`pokemon-${String(id).padStart(3,'0')}`);

/** Positions stay in native signed 24.8 units until drawing.
 * @typedef {{x:number,y:number}} FixedPoint
 * @typedef {{start:number,end:number,ticks:number,from:FixedPoint,target:FixedPoint,last:FixedPoint}} Movement
 * @typedef {{origin:FixedPoint,last:FixedPoint,end:number,moves:Movement[]}} Trajectory */

/** Native positive 24.8 multiply rounds half upward; division truncates.
 * These bounded cinematic coordinates fit exactly in JavaScript integers.
 * @param {number} a @param {number} b */
function fixedMultiply(a,b){return Math.floor((a*b+128)/256);}
/** @param {number} a @param {number} b */
function fixedDivide(a,b){return Math.floor(a*256/b);}

/** Comparative FP24_8_Hypot uses three integer refinement steps, not Math.hypot.
 * @param {number} x @param {number} y */
function fixedDistance(x,y){
  let major=Math.max(Math.abs(x),Math.abs(y)),minor=Math.min(Math.abs(x),Math.abs(y));
  if(minor)for(let step=0;step<3;step++){
    let ratio=fixedDivide(minor,major);ratio=fixedMultiply(ratio,ratio);
    ratio=fixedDivide(ratio,ratio+1024);
    major+=2*fixedMultiply(major,ratio);minor=fixedMultiply(minor,ratio);
  }
  return major;
}

/** CMD_BYTE_80 draws weights (ticks,0) through (1,ticks-1). It does not snap
 * to its target before the next command reads the actor's actual position.
 * @param {FixedPoint} from @param {FixedPoint} target @param {number} ticks @param {number} elapsed */
function interpolate(from,target,ticks,elapsed){
  const step=Math.max(0,Math.min(ticks-1,Math.floor(elapsed)));
  return{x:Math.trunc(((ticks-step)*from.x+step*target.x)/ticks),y:Math.trunc(((ticks-step)*from.y+step*target.y)/ticks)};
}

/** @param {number} x @param {number} y @param {number} [start] @returns {Trajectory} */
function trajectory(x,y,start=0){const origin={x:x*256,y:y*256};return{origin,last:origin,end:start,moves:[]};}
/** @param {Trajectory} path @param {number} x @param {number} y @param {number} speed @param {number} [start] */
function waypoint(path,x,y,speed,start=path.end){
  const from=path.last,target={x:x*256,y:y*256};
  const ticks=Math.max(1,Math.trunc(fixedDistance(target.x-from.x,target.y-from.y)/speed));
  const last=interpolate(from,target,ticks,ticks-1),move={start,end:start+ticks,ticks,from,target,last};
  path.moves.push(move);path.last=last;path.end=move.end;return move;
}
/** Native sprite drawing truncates each world coordinate before camera offset.
 * @param {Trajectory} path @param {number} frame */
function sample(path,frame){
  let position=path.origin;
  for(const move of path.moves){
    if(frame<move.start)break;
    position=frame<move.end?interpolate(move.from,move.target,move.ticks,frame-move.start):move.last;
    if(frame<move.end)break;
  }
  return{x:Math.trunc(position.x/256),y:Math.trunc(position.y/256)};
}

// GroundScript_Unlock delivers a cue after all actors/effects have acted.
// Its recipient resumes on the next tick. WALK_GRID instead clamps every axis
// to speed and reaches its target; its completion check runs one tick later.
const CLIENT_END=80,CARRIER_FLY_START=CLIENT_END+1+60;
const STAFF_TURN_START=CARRIER_FLY_START+30+1;
const CARRIER_RISE_START=CARRIER_FLY_START+60,CARRIER_RISE_END=CARRIER_RISE_START+64;
const INSIDE_CAMERA_START=CARRIER_RISE_END+1+1;
const CARRIER_INSIDE=trajectory(248,260,CARRIER_RISE_END);
const INSIDE_ASCENT=waypoint(CARRIER_INSIDE,248,188,128);
const CARRIER_TURN_START=INSIDE_ASCENT.end;
const INSIDE_EXIT=waypoint(CARRIER_INSIDE,264,148,256,CARRIER_TURN_START+16);
waypoint(CARRIER_INSIDE,320,116,256);
const INSIDE_FADE_START=INSIDE_EXIT.end+1,INSIDE_END=INSIDE_FADE_START+30;

const CARRIER_OUTSIDE=trajectory(408,204);
waypoint(CARRIER_OUTSIDE,456,188,256);
const OUTSIDE_EXIT=waypoint(CARRIER_OUTSIDE,504,164,384);
waypoint(CARRIER_OUTSIDE,592,100,512);
const OUTSIDE_FADE_START=OUTSIDE_EXIT.end+1,OUTSIDE_END=OUTSIDE_FADE_START+30;

const AERIAL_CAMERA_START=30+4+20+1;
const CARRIER_AERIAL=trajectory(232,124,30+4+1);
waypoint(CARRIER_AERIAL,256,132,51);
waypoint(CARRIER_AERIAL,280,156,102);
/** @type {[number,number][]} */
const AERIAL_ANIMATIONS=[[0,14],[CARRIER_AERIAL.end+20,15]];
waypoint(CARRIER_AERIAL,256,180,384,CARRIER_AERIAL.end+20);
AERIAL_ANIMATIONS.push([CARRIER_AERIAL.end,16]);waypoint(CARRIER_AERIAL,216,196,512);
AERIAL_ANIMATIONS.push([CARRIER_AERIAL.end,17]);waypoint(CARRIER_AERIAL,176,188,768);
AERIAL_ANIMATIONS.push([CARRIER_AERIAL.end,18]);waypoint(CARRIER_AERIAL,136,164,1024);
AERIAL_ANIMATIONS.push([CARRIER_AERIAL.end,19]);waypoint(CARRIER_AERIAL,104,140,1280);
const AERIAL_LETTER_START=CARRIER_AERIAL.end+1;
AERIAL_ANIMATIONS.push([CARRIER_AERIAL.end,20]);waypoint(CARRIER_AERIAL,72,108,1536);
const AERIAL_FADE_START=CARRIER_AERIAL.end+1;
AERIAL_ANIMATIONS.push([CARRIER_AERIAL.end,21]);waypoint(CARRIER_AERIAL,32,60,2048);
AERIAL_ANIMATIONS.push([CARRIER_AERIAL.end,21]);waypoint(CARRIER_AERIAL,8,4,2048);
const AERIAL_LETTER=trajectory(104,140,AERIAL_LETTER_START);
waypoint(AERIAL_LETTER,104,308,51);
const AERIAL_END=AERIAL_FADE_START+60;

const TITLE_LETTER_START=60,TITLE_LETTER=trajectory(208,4,TITLE_LETTER_START);
const TITLE_LETTER_FIRST=waypoint(TITLE_LETTER,208,52,51);
waypoint(TITLE_LETTER,208,96,51);
const TITLE_SMALL_START=TITLE_LETTER_FIRST.end+1,TITLE_SMALL=trajectory(280,52,TITLE_SMALL_START);
waypoint(TITLE_SMALL,8,52,512);
const TITLE_SWEEP_START=TITLE_SMALL.end+1+32,TITLE_SWEEP=trajectory(8,180,TITLE_SWEEP_START);
/** @type {[number,number][]} */
const TITLE_ANIMATIONS=[[TITLE_SWEEP_START,10]];
waypoint(TITLE_SWEEP,80,164,1024);
TITLE_ANIMATIONS.push([TITLE_SWEEP.end,11]);waypoint(TITLE_SWEEP,152,132,1280);
TITLE_ANIMATIONS.push([TITLE_SWEEP.end,12]);waypoint(TITLE_SWEEP,224,84,1536);
TITLE_ANIMATIONS.push([TITLE_SWEEP.end,13]);waypoint(TITLE_SWEEP,280,36,1792);
export const OPENING_MOVEMENT_MS=BOOT_DURATION_MS+(INSIDE_END+OUTSIDE_END+AERIAL_END)*FRAME_MS;
export const TITLE_READY_MS=(TITLE_SWEEP.end+1)*FRAME_MS;
export const TITLE_PROMPT_MS=TITLE_READY_MS+120*FRAME_MS;

/** @param {[number,number][]} selections @param {number} frame */
function selectedAnimation(selections,frame){
  let selected=selections[0]??[0,0];
  for(const candidate of selections){if(candidate[0]>frame)break;selected=candidate;}
  return{animation:selected[1]??0,time:Math.max(0,frame-(selected[0]??0))*FRAME_MS};
}

/** @param {CanvasRenderingContext2D} context @param {number} alpha @param {string} [color] */
function fade(context,alpha,color='#000000'){if(alpha<=0)return;context.save();context.globalAlpha=Math.min(1,alpha);context.fillStyle=color;context.fillRect(0,0,256,192);context.restore();}

export class IntroArtwork {
  constructor(){
    /** @type {Map<string,ImageBitmap>} */this.images=new Map();
    this.ornaments=new OrnamentBank();
    this.controller=new AbortController();this.disposed=false;
  }

  async load(){
    const descriptions=[
      {id:'post-interior',width:384,height:312,path:'scenery/post-interior.png'},
      {id:'post-exterior',width:256,height:192,path:'scenery/post-exterior.png'},
      {id:'town-aerial',width:288,height:312,path:'scenery/town-aerial.png'},
      {id:'title-background',width:256,height:192,path:'scenery/title.png'},
      {id:'title-prompt',width:75,height:11,path:'scenery/title-prompt.png'},
      {id:'boot-cards',width:256,height:768,path:'scenery/boot-cards.png'},
    ];
    try{await Promise.all([this.ornaments.load(),...descriptions.map(async({id,width,height,path})=>{
      const response=await fetch(new URL(`../../assets/blue/${path}`,import.meta.url),{signal:this.controller.signal});
      if(!response.ok)throw Error(`Could not load opening artwork (${response.status}).`);
      const image=await window.createImageBitmap(await response.blob());
      if(this.disposed){image.close();return;}
      if(image.width!==width||image.height!==height){image.close();throw Error('Opening artwork has unexpected dimensions.');}
      this.images.set(id,image);
    })]);}catch(error){this.dispose();throw error;}
  }

  /** @param {CanvasRenderingContext2D} context @param {string} id @param {number} cameraX @param {number} cameraY */
  background(context,id,cameraX,cameraY){
    const image=this.images.get(id);context.fillStyle='#000000';context.fillRect(0,0,256,192);
    if(!image)return;
    if(id==='post-interior')context.drawImage(image,Math.round(129+72-cameraX),Math.round(108+90-cameraY));
    else if(id==='post-exterior')context.drawImage(image,0,0);
    else context.drawImage(image,Math.round(129-cameraX),Math.round(108-cameraY));
  }

  /** Native title logo, sky and ocean at one observed phase. The captured mail
   * was replaced only with unoccluded pixels from a second original frame.
   * @param {CanvasRenderingContext2D} context */
  titleBackdrop(context){
    const image=this.images.get('title-background');if(image)context.drawImage(image,0,0);
  }

  /** @param {CanvasRenderingContext2D} context */
  titlePrompt(context){
    const image=this.images.get('title-prompt');if(image)context.drawImage(image,95,144);
  }

  /** Published Blue company/copyright cards. Firmware and health-warning
   * screens are outside this game's selected boot sequence.
   * @param {CanvasRenderingContext2D} context @param {number} elapsed @param {boolean} reducedMotion */
  boot(context,elapsed,reducedMotion){
    context.fillStyle='#000000';context.fillRect(0,0,256,192);
    const frame=Math.max(0,Math.floor(elapsed/FRAME_MS));
    const page=BOOT_CARD_STARTS.findIndex(start=>frame>=start&&frame<start+100);
    const image=this.images.get('boot-cards');if(page<0||!image)return;
    const local=frame-(BOOT_CARD_STARTS[page]??0);
    context.drawImage(image,0,page*192,256,192,0,0,256,192);
    if(!reducedMotion){
      const brightness=local<20?256-Math.floor((19-local)*256/20):local>=80?Math.floor((99-local)*256/20):256;
      fade(context,1-brightness/256);
    }
  }

  /** @param {CanvasRenderingContext2D} context @param {import('./render-sprites.js').SpriteBank} sprites @param {string} client @param {number} elapsed @param {boolean} reducedMotion */
  opening(context,sprites,client,elapsed,reducedMotion){
    if(elapsed<BOOT_DURATION_MS){this.boot(context,elapsed,reducedMotion);return;}
    const elapsedFrame=Math.max(0,Math.floor((elapsed-BOOT_DURATION_MS)/FRAME_MS));
    // Keep the three source scenes, but present one stable pose per scene when
    // the player requests reduced motion. Camera pans and flashes stop too.
    const frame=reducedMotion?(elapsedFrame<INSIDE_END?170:elapsedFrame<INSIDE_END+OUTSIDE_END?INSIDE_END+55:INSIDE_END+OUTSIDE_END+250):elapsedFrame;
    if(frame<INSIDE_END){
      const cameraY=Math.trunc(276-Math.min(136,Math.max(0,frame-INSIDE_CAMERA_START+1)*.5)),cameraX=276;
      this.background(context,'post-interior',cameraX,cameraY);
      sprites.draw(context,client,248-cameraX+129,380-Math.min(CLIENT_END,frame+1)-cameraY+108,{direction:'n',clip:frame<CLIENT_END?'walk':'idle',time:reducedMotion?0:(frame<CLIENT_END?frame:frame-CLIENT_END)*FRAME_MS});
      const staffDirection=frame<STAFF_TURN_START?'s':frame<STAFF_TURN_START+8?'sw':'w';
      const staffAnimationStart=frame<STAFF_TURN_START?0:frame<STAFF_TURN_START+8?STAFF_TURN_START:STAFF_TURN_START+8;
      sprites.draw(context,'pokemon-279',304-cameraX+129,260-cameraY+108,{direction:staffDirection,time:reducedMotion?0:(frame-staffAnimationStart)*FRAME_MS});
      const carrier=sample(CARRIER_INSIDE,frame),rise=Math.trunc(Math.max(0,Math.min(32,(frame-CARRIER_RISE_START+1)*.5)));
      const carrierDirection=frame<CARRIER_TURN_START?'s':frame<CARRIER_TURN_START+8?'se':'e';
      const carrierAnimationStart=frame<CARRIER_TURN_START?CARRIER_FLY_START:frame<CARRIER_TURN_START+8?CARRIER_TURN_START:CARRIER_TURN_START+8;
      if(frame<CARRIER_FLY_START)sprites.draw(context,'pokemon-279',carrier.x-cameraX+129,carrier.y-cameraY+108,{direction:'s',time:reducedMotion?0:frame*FRAME_MS});
      else sprites.draw(context,'pokemon-279',carrier.x-cameraX+129,carrier.y-rise-cameraY+108,{direction:carrierDirection,clip:'fly',shadow:false,time:reducedMotion?0:(frame-carrierAnimationStart)*FRAME_MS});
      if(!reducedMotion){fade(context,1-frame/30);fade(context,(frame-INSIDE_FADE_START)/30);}
      return;
    }
    if(frame<INSIDE_END+OUTSIDE_END){
      const local=frame-INSIDE_END;this.background(context,'post-exterior',440,220);
      const carrier=sample(CARRIER_OUTSIDE,local);sprites.draw(context,'pokemon-279',carrier.x-311,carrier.y-112,{direction:'e',clip:'fly',shadow:false,time:reducedMotion?0:local*FRAME_MS});
      if(!reducedMotion){fade(context,1-local/30);fade(context,(local-OUTSIDE_FADE_START)/30);}return;
    }
    const local=frame-INSIDE_END-OUTSIDE_END,cameraY=Math.trunc(220-Math.min(128,Math.max(0,local-AERIAL_CAMERA_START+1)*.25));
    this.background(context,'town-aerial',144,cameraY);
    const carrier=sample(CARRIER_AERIAL,local);
    if(local<CARRIER_AERIAL.end){const selected=selectedAnimation(AERIAL_ANIMATIONS,local);this.ornaments.draw(context,'title-bird',selected.animation,carrier.x-15,carrier.y-cameraY+108,reducedMotion?0:selected.time);}
    if(local>=AERIAL_LETTER_START){const letter=sample(AERIAL_LETTER,local);this.ornaments.draw(context,'title-letter',8,letter.x-15,letter.y-cameraY+108,reducedMotion?0:(local-AERIAL_LETTER_START)*FRAME_MS);}
    if(!reducedMotion){fade(context,1-local/30);fade(context,(local-AERIAL_FADE_START)/60,'#ffffff');}
  }

  /** The title catches the dropped mail once; it does not loop a spare envelope.
   * @param {CanvasRenderingContext2D} context @param {import('./render-sprites.js').SpriteBank} sprites @param {number} elapsed @param {boolean} reducedMotion */
  title(context,sprites,elapsed,reducedMotion){
    if(reducedMotion)return;
    const frame=Math.max(0,Math.floor(elapsed/FRAME_MS));
    if(frame>=TITLE_LETTER_START&&frame<TITLE_LETTER.end){
      const letter=sample(TITLE_LETTER,frame);
      this.ornaments.draw(context,'title-letter',8,letter.x-15,letter.y-8,(frame-TITLE_LETTER_START)*FRAME_MS);
    }
    if(frame>=TITLE_SMALL_START&&frame<TITLE_SMALL.end){const carrier=sample(TITLE_SMALL,frame);sprites.draw(context,'pokemon-279',carrier.x-15,carrier.y-8,{direction:'w',clip:'fly',shadow:false,time:(frame-TITLE_SMALL_START)*FRAME_MS});}
    if(frame>=TITLE_SWEEP_START&&frame<TITLE_SWEEP.end){const carrier=sample(TITLE_SWEEP,frame),selected=selectedAnimation(TITLE_ANIMATIONS,frame);this.ornaments.draw(context,'title-bird',selected.animation,carrier.x-15,carrier.y-8,selected.time);}
    fade(context,1-frame/60,'#ffffff');
  }

  dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();this.ornaments.dispose();for(const image of this.images.values())image.close();this.images.clear();}
}
