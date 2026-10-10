/**
 * Opening choreography from the pinned comparative Red ground scripts:
 * DEMO_03 -> T01P04 group5 -> T01P03 group29 -> S03 group1 -> S02 group3.
 * Coordinates use the scripts' 8px ground grid and fixed-point movement speeds.
 * Native scenery, Pelipper and mail images have pinned public provenance.
 * Nominal 60Hz timings have not been frame-matched against Blue.
 */
import { OrnamentBank } from './render-ornaments.js';

const FRAME_MS = 1000 / 60;
const INSIDE_END = 497;
const OUTSIDE_END = 115;
const AERIAL_END = 407;
export const OPENING_MOVEMENT_MS = (INSIDE_END + OUTSIDE_END + AERIAL_END) * FRAME_MS;
// MUS_INTRO is continuous across all three cuts. The script holds white until
// its nonlooping876-tick track finishes. The Blue catalog reports0:19; the Red
// driver's final-tick/status timing is not proof of DS frame-exact duration.
export const OPENING_DURATION_MS = 19_000;
export const TITLE_READY_MS = 525 * FRAME_MS;
export const TITLE_PROMPT_MS = 645 * FRAME_MS;

/** The comparative source chooses from the first15 of16 starter candidates. */
export const INTRO_CLIENT_IDS = [25,52,133,300,7,158,258,54,4,255,155,104,66,1,152].map(id=>`pokemon-${String(id).padStart(3,'0')}`);

/** @typedef {{frame:number,x:number,y:number}} Keyframe */
/** @param {Keyframe[]} points @param {number} frame */
function sample(points,frame){
  const first=points[0];if(!first)throw Error('An opening path must have a first point.');
  let previous=first;
  for(const point of points){
    if(frame<=point.frame){const ratio=point.frame===previous.frame?0:Math.max(0,Math.min(1,(frame-previous.frame)/(point.frame-previous.frame)));return{x:previous.x+(point.x-previous.x)*ratio,y:previous.y+(point.y-previous.y)*ratio};}
    previous=point;
  }
  return{x:previous.x,y:previous.y};
}

/** @type {Keyframe[]} */
const CARRIER_INSIDE=[{frame:0,x:248,y:260},{frame:264,x:248,y:260},{frame:408,x:248,y:188},{frame:424,x:248,y:188},{frame:467,x:264,y:148},{frame:531,x:320,y:116}];
/** @type {Keyframe[]} */
const CARRIER_OUTSIDE=[{frame:0,x:408,y:204},{frame:50,x:456,y:188},{frame:85,x:504,y:164},{frame:139,x:592,y:100}];
/** @type {Keyframe[]} */
const CARRIER_AERIAL=[
  {frame:0,x:232,y:124},{frame:34,x:232,y:124},
  {frame:160,x:256,y:132},{frame:245,x:280,y:156},{frame:265,x:280,y:156},
  {frame:287,x:256,y:180},{frame:308,x:216,y:196},{frame:321,x:176,y:188},
  {frame:332,x:136,y:164},{frame:340,x:104,y:140},{frame:347,x:72,y:108},
  {frame:354,x:32,y:60},{frame:361,x:8,y:4},
];
/** @type {Keyframe[]} */
const TITLE_SWEEP=[{frame:468,x:8,y:180},{frame:486,x:80,y:164},{frame:501,x:152,y:132},{frame:515,x:224,y:84},{frame:525,x:280,y:36}];
/** @type {[number,number][]} */
const AERIAL_ANIMATIONS=[[0,14],[265,15],[287,16],[308,17],[321,18],[332,19],[340,20],[347,21]];
/** @type {[number,number][]} */
const TITLE_ANIMATIONS=[[468,10],[486,11],[501,12],[515,13]];

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

  /** @param {CanvasRenderingContext2D} context @param {import('./render-sprites.js').SpriteBank} sprites @param {string} client @param {number} elapsed @param {boolean} reducedMotion */
  opening(context,sprites,client,elapsed,reducedMotion){
    const elapsedFrame=elapsed/FRAME_MS;
    // Keep the three source scenes, but present one stable pose per scene when
    // the player requests reduced motion. Camera pans and flashes stop too.
    const frame=reducedMotion?(elapsedFrame<INSIDE_END?170:elapsedFrame<INSIDE_END+OUTSIDE_END?INSIDE_END+55:INSIDE_END+OUTSIDE_END+250):elapsedFrame;
    if(frame<INSIDE_END){
      const cameraY=276-Math.min(136,Math.max(0,frame-265)*.5),cameraX=276;
      this.background(context,'post-interior',cameraX,cameraY);
      sprites.draw(context,client,248-cameraX+129,380-Math.min(80,frame)-cameraY+108,{direction:'n',clip:frame<80?'walk':'idle',time:reducedMotion?0:elapsed});
      sprites.draw(context,'pokemon-279',304-cameraX+129,260-cameraY+108,{direction:frame<170?'s':'w',time:reducedMotion?0:elapsed});
      const carrier=sample(CARRIER_INSIDE,frame),rise=Math.max(0,Math.min(32,(frame-200)*.5));
      if(frame<140)sprites.draw(context,'pokemon-279',carrier.x-cameraX+129,carrier.y-cameraY+108,{direction:'s',time:reducedMotion?0:elapsed});
      else sprites.draw(context,'pokemon-279',carrier.x-cameraX+129,carrier.y-rise-cameraY+108,{direction:frame>408?'e':'s',clip:'fly',shadow:false,time:reducedMotion?0:(frame-140)*FRAME_MS});
      if(!reducedMotion){fade(context,1-frame/30);fade(context,(frame-467)/30);}
      return;
    }
    if(frame<INSIDE_END+OUTSIDE_END){
      const local=frame-INSIDE_END;this.background(context,'post-exterior',440,220);
      const carrier=sample(CARRIER_OUTSIDE,local);sprites.draw(context,'pokemon-279',carrier.x-311,carrier.y-112,{direction:'e',clip:'fly',shadow:false,time:reducedMotion?0:local*FRAME_MS});
      if(!reducedMotion){fade(context,1-local/30);fade(context,(local-85)/30);}return;
    }
    const local=frame-INSIDE_END-OUTSIDE_END,cameraY=220-Math.min(128,Math.max(0,local-54)*.25);
    this.background(context,'town-aerial',144,cameraY);
    const carrier=sample(CARRIER_AERIAL,local);
    if(local<365){const selected=selectedAnimation(AERIAL_ANIMATIONS,local);this.ornaments.draw(context,'title-bird',selected.animation,carrier.x-15,carrier.y-cameraY+108,reducedMotion?0:selected.time);}
    if(local>=340)this.ornaments.draw(context,'title-letter',8,89,140+(local-340)*51/256-cameraY+108,reducedMotion?0:(local-340)*FRAME_MS);
    if(!reducedMotion){fade(context,1-local/30);fade(context,(local-347)/60,'#ffffff');}
  }

  /** The title catches the dropped mail once; it does not loop a spare envelope.
   * @param {CanvasRenderingContext2D} context @param {import('./render-sprites.js').SpriteBank} sprites @param {number} elapsed @param {boolean} reducedMotion */
  title(context,sprites,elapsed,reducedMotion){
    if(reducedMotion)return;
    const frame=elapsed/FRAME_MS;
    if(frame>=60&&frame<512){
      const y=frame<300?4+(frame-60)*51/256:52+(frame-300)*51/256;
      this.ornaments.draw(context,'title-letter',8,193,y-8,(frame-60)*FRAME_MS);
    }
    if(frame>=300&&frame<436)sprites.draw(context,'pokemon-279',265-(frame-300)*2,44,{direction:'w',clip:'fly',shadow:false,time:(frame-300)*FRAME_MS});
    if(frame>=468&&frame<525){const carrier=sample(TITLE_SWEEP,frame),selected=selectedAnimation(TITLE_ANIMATIONS,frame);this.ornaments.draw(context,'title-bird',selected.animation,carrier.x-15,carrier.y-8,selected.time);}
    fade(context,1-frame/60,'#ffffff');
  }

  dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();this.ornaments.dispose();for(const image of this.images.values())image.close();this.images.clear();}
}
