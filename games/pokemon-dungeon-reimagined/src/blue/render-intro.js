/**
 * Opening choreography from the pinned comparative Red ground scripts:
 * DEMO_03 -> T01P04 group5 -> T01P03 group29 -> S03 group1 -> S02 group3.
 * Coordinates use the scripts' 8px ground grid and fixed-point movement speeds.
 * Art is original. Nominal 60Hz timings have not been frame-matched against Blue.
 */
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

/** @typedef {{frame:number,x:number,y:number,size?:number}} Keyframe */
/** @param {Keyframe[]} points @param {number} frame */
function sample(points,frame){
  const first=points[0];if(!first)throw Error('An opening path must have a first point.');
  let previous=first;
  for(const point of points){
    if(frame<=point.frame){const ratio=point.frame===previous.frame?0:Math.max(0,Math.min(1,(frame-previous.frame)/(point.frame-previous.frame)));return{x:previous.x+(point.x-previous.x)*ratio,y:previous.y+(point.y-previous.y)*ratio,size:point.size??previous.size??32};}
    previous=point;
  }
  return{x:previous.x,y:previous.y,size:previous.size??32};
}

/** @type {Keyframe[]} */
const CARRIER_INSIDE=[{frame:0,x:248,y:260},{frame:264,x:248,y:260},{frame:408,x:248,y:188},{frame:424,x:248,y:188},{frame:467,x:264,y:148},{frame:531,x:320,y:116}];
/** @type {Keyframe[]} */
const CARRIER_OUTSIDE=[{frame:0,x:408,y:204},{frame:50,x:456,y:188},{frame:85,x:504,y:164},{frame:139,x:592,y:100}];
/** @type {Keyframe[]} */
const CARRIER_AERIAL=[
  {frame:0,x:232,y:124,size:8},{frame:34,x:232,y:124,size:8},
  {frame:160,x:256,y:132,size:8},{frame:245,x:280,y:156,size:8},{frame:265,x:280,y:156,size:8},
  {frame:287,x:256,y:180,size:48},{frame:308,x:216,y:196,size:48},{frame:321,x:176,y:188,size:56},
  {frame:332,x:136,y:164,size:64},{frame:340,x:104,y:140,size:72},{frame:347,x:72,y:108,size:80},
  {frame:354,x:32,y:60,size:96},{frame:361,x:8,y:4,size:96},
];
/** @type {Keyframe[]} */
const TITLE_SWEEP=[{frame:468,x:8,y:180,size:64},{frame:486,x:80,y:164,size:64},{frame:501,x:152,y:132,size:72},{frame:515,x:224,y:84,size:80},{frame:525,x:280,y:36,size:96}];

/** @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {number} [scale] */
function envelope(context,x,y,scale=1){
  x=Math.round(x);y=Math.round(y);context.save();context.translate(x,y);context.scale(scale,scale);
  for(let row=-8;row<8;row++){const left=-16+Math.floor((row+8)/4);context.fillStyle='#24435c';context.fillRect(left,row,28,1);if(row>-8&&row<7){context.fillStyle='#fffbe0';context.fillRect(left+1,row,26,1);}}
  context.fillStyle='#b5976a';for(let n=0;n<13;n++){context.fillRect(-15+n,-7+Math.floor(n/2),1,1);context.fillRect(10-n,-7+Math.floor(n/2),1,1);}
  context.fillStyle='#b66443';context.fillRect(-3,-1,3,2);context.restore();
}

/** @param {CanvasRenderingContext2D} context @param {number} alpha @param {string} [color] */
function fade(context,alpha,color='#000000'){if(alpha<=0)return;context.save();context.globalAlpha=Math.min(1,alpha);context.fillStyle=color;context.fillRect(0,0,256,192);context.restore();}

export class IntroArtwork {
  constructor(){
    /** @type {Map<string,ImageBitmap>} */this.images=new Map();
    this.controller=new AbortController();this.disposed=false;
  }

  async load(){
    const descriptions=[{id:'post-interior',width:528,height:528},{id:'post-exterior',width:720,height:528},{id:'town-aerial',width:288,height:312},{id:'pelipper-flight',width:384,height:96}];
    try{await Promise.all(descriptions.map(async({id,width,height})=>{
      const response=await fetch(new URL(`../../assets/blue/${id}.png`,import.meta.url),{signal:this.controller.signal});
      if(!response.ok)throw Error(`Could not load opening artwork (${response.status}).`);
      const image=await window.createImageBitmap(await response.blob());
      if(this.disposed){image.close();return;}
      if(image.width!==width||image.height!==height){image.close();throw Error('Opening artwork has unexpected dimensions.');}
      this.images.set(id,image);
    }));}catch(error){this.dispose();throw error;}
  }

  /** @param {CanvasRenderingContext2D} context @param {string} id @param {number} cameraX @param {number} cameraY */
  background(context,id,cameraX,cameraY){
    const image=this.images.get(id);context.fillStyle='#080b0c';context.fillRect(0,0,256,192);
    if(image)context.drawImage(image,Math.round(128-cameraX),Math.round(96-cameraY));
  }

  /** @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {number} size @param {number} frame @param {boolean} [right] */
  bird(context,x,y,size,frame,right=false){
    const image=this.images.get('pelipper-flight');if(!image)return;
    const pose=[0,1,2,3][Math.floor(frame/3)%4]??0;
    context.save();context.translate(Math.round(x),Math.round(y));if(right)context.scale(-1,1);
    context.drawImage(image,pose*96,0,96,96,Math.round(-size/2),Math.round(-size/2),size,size);context.restore();
  }

  /** @param {CanvasRenderingContext2D} context @param {import('./render-sprites.js').SpriteBank} sprites @param {string} client @param {number} elapsed @param {boolean} reducedMotion */
  opening(context,sprites,client,elapsed,reducedMotion){
    const frame=elapsed/FRAME_MS;
    if(frame<INSIDE_END){
      const cameraY=276-Math.min(136,Math.max(0,frame-265)*.5),cameraX=276;
      this.background(context,'post-interior',cameraX,cameraY);
      sprites.draw(context,client,248-cameraX+128,380-Math.min(80,frame)-cameraY+96,{direction:'n',clip:frame<80?'walk':'idle',time:reducedMotion?0:elapsed});
      sprites.draw(context,'pokemon-279',304-cameraX+128,260-cameraY+96,{direction:frame<170?'s':'w',time:reducedMotion?0:elapsed});
      const carrier=sample(CARRIER_INSIDE,frame),rise=Math.max(0,Math.min(32,(frame-200)*.5));
      if(frame<140)sprites.draw(context,'pokemon-279',carrier.x-cameraX+128,carrier.y-cameraY+96,{direction:'s',time:reducedMotion?0:elapsed});
      else this.bird(context,carrier.x-cameraX+128,carrier.y-rise-cameraY+84,34,reducedMotion?0:frame,frame>408);
      fade(context,1-frame/30);fade(context,(frame-467)/30);
      return;
    }
    if(frame<INSIDE_END+OUTSIDE_END){
      const local=frame-INSIDE_END;this.background(context,'post-exterior',440,220);
      const carrier=sample(CARRIER_OUTSIDE,local);this.bird(context,carrier.x-312,carrier.y-132,34,reducedMotion?0:local,true);
      fade(context,1-local/30);fade(context,(local-85)/30);return;
    }
    const local=frame-INSIDE_END-OUTSIDE_END,cameraY=220-Math.min(128,Math.max(0,local-54)*.25);
    this.background(context,'town-aerial',144,cameraY);
    const carrier=sample(CARRIER_AERIAL,local);
    if(local<365)this.bird(context,carrier.x-16,carrier.y-cameraY+96,carrier.size,reducedMotion?0:local,local<265);
    if(local>=340)envelope(context,104-16+Math.round(Math.sin(local/10)*4),140+(local-340)*51/256-cameraY+96);
    fade(context,1-local/30);fade(context,(local-347)/60,'#ffffff');
  }

  /** The title catches the dropped mail once; it does not loop a spare envelope.
   * @param {CanvasRenderingContext2D} context @param {number} elapsed @param {boolean} reducedMotion */
  title(context,elapsed,reducedMotion){
    const frame=elapsed/FRAME_MS;
    if(frame>=60&&frame<512){
      const y=frame<300?4+(frame-60)*51/256:52+(frame-300)*51/256;
      envelope(context,192+Math.round(Math.sin(frame/10)*4),y-20);
    }
    if(frame>=300&&frame<436)this.bird(context,264-(frame-300)*2,26,30,reducedMotion?0:frame);
    if(frame>=468&&frame<525){const carrier=sample(TITLE_SWEEP,frame);this.bird(context,carrier.x-16,carrier.y-20,carrier.size,reducedMotion?0:frame,true);}
    fade(context,1-frame/60,'#ffffff');
  }

  dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();for(const image of this.images.values())image.close();this.images.clear();}
}
