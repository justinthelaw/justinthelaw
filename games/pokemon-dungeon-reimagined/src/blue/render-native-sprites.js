/** Native Rescue Team image playback. All inputs are local, pinned PNG/JSON. */
import {nativeShadow} from './render-native-ui.js';
const SPECIES_IDS=[1,4,7,10,12,16,25,52,54,66,102,104,133,152,155,158,191,252,255,258,265,279,300].map(value=>`pokemon-${String(value).padStart(3,'0')}`);
const SPECIES=new Set(SPECIES_IDS),DIRECTIONS=['s','se','e','ne','n','nw','w','sw'];
// The 8 MiB atlas cap applies after a scene loads. Its previous scene remains
// drawable during loading; all 23 pinned atlases bound that overlap at
// 11,657,216 decoded pixel bytes, excluding the separate portrait/status sheets.
const ASSET_ROOT=new URL('../../assets/blue/',import.meta.url),MAX_ATLASES=12,MAX_DECODED_BYTES=8*1024*1024;
/** @typedef {[number,number,number,number,number,number]} NativePose */
/** @typedef {[number,number,number,number,number,number,number]} NativeFrame */
/** @typedef {{animation:number,loop:boolean}} NativeClip */
/** @typedef {{schemaVersion:2,speciesId:string,width:number,height:number,dungeonOffsetY?:number,directions:string[],poses:NativePose[],statusOffsets?:[number,number][],animations:NativeFrame[][][],clips:Record<string,NativeClip>,shadowSize:number,sourceEdition:string}} NativeMetadata */
/** @typedef {{speciesId:string,emotion:string,x:number,y:number,width:number,height:number}} Portrait */
/** @typedef {{schemaVersion:2,width:number,height:number,cell:number,records:Portrait[]}} PortraitMetadata */
/** @typedef {{image:ImageBitmap,metadata:NativeMetadata,used:number}} Atlas */

/** @param {NativeMetadata} metadata @param {string} speciesId */
function validateMetadata(metadata,speciesId){
  if(metadata.schemaVersion!==2||metadata.speciesId!==speciesId||!Number.isInteger(metadata.width)||!Number.isInteger(metadata.height)||metadata.width<1||metadata.height<1||metadata.width>1024||metadata.height>2048||metadata.width*metadata.height*4>2*1024*1024||metadata.directions?.join(',')!==DIRECTIONS.join(','))throw Error('Native character metadata has invalid dimensions or directions.');
  if(!Array.isArray(metadata.poses)||metadata.poses.length<1||metadata.poses.length>1024||!Array.isArray(metadata.animations)||metadata.animations.length<8||metadata.animations.length>32)throw Error('Native character metadata has invalid pose tables.');
  for(const pose of metadata.poses)if(pose.length!==6||pose.some(value=>!Number.isInteger(value))||pose[0]<0||pose[1]<0||pose[2]<1||pose[3]<1||pose[0]+pose[2]>metadata.width||pose[1]+pose[3]>metadata.height)throw Error('Native pose exceeds its atlas.');
  if(metadata.statusOffsets!==undefined&&(!Array.isArray(metadata.statusOffsets)||metadata.statusOffsets.length!==metadata.poses.length||metadata.statusOffsets.some(offset=>offset.length!==2||offset.some(value=>!Number.isInteger(value)||Math.abs(value)>32767))))throw Error('Native status attachment positions are invalid.');
  const dungeonOffsetY=metadata.dungeonOffsetY;
  if(dungeonOffsetY!==undefined&&(!Number.isInteger(dungeonOffsetY)||dungeonOffsetY<1||dungeonOffsetY*2!==metadata.height||metadata.poses.some(pose=>pose[1]+pose[3]>dungeonOffsetY)))throw Error('Native battle palette exceeds its atlas.');
  for(const animation of metadata.animations){
    if(animation.length!==8)throw Error('Native animation does not cover all eight directions.');
    for(const sequence of animation){
      if(sequence.length<1||sequence.length>128)throw Error('Native animation sequence is invalid.');
      for(const frame of sequence)if(frame.length!==7||frame.some(value=>!Number.isInteger(value))||frame[0]<0||frame[0]>=metadata.poses.length||frame[1]<1||frame[1]>255)throw Error('Native animation frame is invalid.');
    }
  }
  if(!metadata.clips?.idle||!metadata.clips.walk)throw Error('Native character is missing playback aliases.');
  for(const clip of Object.values(metadata.clips))if(!Number.isInteger(clip.animation)||clip.animation<0||clip.animation>=metadata.animations.length||typeof clip.loop!=='boolean')throw Error('Native playback alias is invalid.');
}

export class SpriteBank {
  constructor(){
    /** @type {Map<string,Atlas>} */this.images=new Map();
    /** @type {Map<string,Promise<void>>} */this.pending=new Map();
    /** @type {ImageBitmap|null} */this.portraits=null;
    /** @type {Promise<void>|null} */this.portraitsPending=null;
    /** @type {Map<string,Portrait>} */this.portraitRects=new Map();
    this.controller=new AbortController();this.disposed=false;this.clock=0;
  }

  /** @param {string[]} ids */
  async loadSpecies(ids){
    const unique=[...new Set(ids)];if(unique.length>MAX_ATLASES)throw Error('A scene exceeds the opening character cache.');
    await Promise.all([...unique.map(id=>this.load(id)),this.loadPortraits()]);
    const protectedIds=new Set(unique);
    const decodedBytes=()=>[...this.images.values()].reduce((sum,entry)=>sum+entry.image.width*entry.image.height*4,0);
    while(this.images.size>MAX_ATLASES||decodedBytes()>MAX_DECODED_BYTES){
      const oldest=[...this.images].filter(([id])=>!protectedIds.has(id)).sort((left,right)=>left[1].used-right[1].used)[0];
      if(!oldest)throw Error('Native characters exceed the decoded-image budget.');
      oldest[1].image.close();this.images.delete(oldest[0]);
    }
  }

  /** @param {string} path */
  async response(path){
    if(this.disposed)throw new DOMException('Renderer was disposed.','AbortError');
    const response=await fetch(new URL(path,ASSET_ROOT),{signal:this.controller.signal});
    if(!response.ok)throw Error(`Could not load native artwork (${response.status}).`);
    return response;
  }

  async loadPortraits(){
    if(this.portraits)return;
    if(this.portraitsPending)return this.portraitsPending;
    const promise=(async()=>{
      const response=await this.response('portraits.json');
      const metadata=/** @type {PortraitMetadata} */(await response.json());
      if(metadata.schemaVersion!==2||metadata.cell!==40||!Number.isInteger(metadata.width)||!Number.isInteger(metadata.height)||metadata.width<40||metadata.height<40||metadata.width*metadata.height>512*2048||!Array.isArray(metadata.records))throw Error('Native portrait metadata is invalid.');
      for(const record of metadata.records)if(!SPECIES.has(record.speciesId)||record.width!==40||record.height!==40||record.x<0||record.y<0||record.x+40>metadata.width||record.y+40>metadata.height)throw Error('Native portrait is outside its sheet.');
      const image=await window.createImageBitmap(await(await this.response('portraits.png')).blob());
      if(this.disposed){image.close();throw new DOMException('Renderer was disposed.','AbortError');}
      if(image.width!==metadata.width||image.height!==metadata.height){image.close();throw Error('Native portrait image has unexpected dimensions.');}
      for(const record of metadata.records)this.portraitRects.set(`${record.speciesId}:${record.emotion}`,record);
      this.portraits=image;
    })();
    this.portraitsPending=promise;
    try{await promise;}finally{this.portraitsPending=null;}
  }

  /** @param {string} id */
  async load(id){
    if(this.disposed)throw new DOMException('Renderer was disposed.','AbortError');
    if(!SPECIES.has(id))throw Error(`Character is outside the opening: ${id}`);
    const existing=this.images.get(id);if(existing){existing.used=++this.clock;return;}
    const pending=this.pending.get(id);if(pending)return pending;
    const promise=(async()=>{
      const response=await this.response(`${id}.json`),metadata=/** @type {NativeMetadata} */(await response.json());
      validateMetadata(metadata,id);
      const image=await window.createImageBitmap(await(await this.response(`${id}.png`)).blob());
      if(this.disposed){image.close();throw new DOMException('Renderer was disposed.','AbortError');}
      if(image.width!==metadata.width||image.height!==metadata.height){image.close();throw Error('Native character artwork has unexpected dimensions.');}
      this.images.set(id,{image,metadata,used:++this.clock});
    })();
    this.pending.set(id,promise);
    try{await promise;}finally{this.pending.delete(id);}
  }

  /** @param {CanvasRenderingContext2D} context @param {string} id @param {number} x @param {number} y
   * @param {{direction?:string,clip?:string,time?:number,scale?:number,frame?:number,shadow?:boolean,alpha?:number,dungeon?:boolean,teamShadow?:boolean,lift?:number}} [options]
   * @returns {{x:number,y:number}|undefined} Native status attachment for the drawn pose. */
  draw(context,id,x,y,options={}){
    const entry=this.images.get(id);if(!entry)return;entry.used=++this.clock;
    const metadata=entry.metadata,clip=metadata.clips[options.clip??'idle']??metadata.clips.idle;
    if(!clip)return;
    const direction=Math.max(0,DIRECTIONS.indexOf(options.direction??'s')),sequence=metadata.animations[clip.animation]?.[direction];
    if(!sequence?.length)return;
    const duration=sequence.reduce((sum,frame)=>sum+frame[1],0);
    let ticks=Math.max(0,options.time??0)*60/1000;
    if(clip.loop)ticks%=duration;
    let index=0;while(index<sequence.length-1&&ticks>=(sequence[index]?.[1]??0)){ticks-=sequence[index]?.[1]??0;index++;}
    if(options.frame!==undefined)index=Math.max(0,Math.min(sequence.length-1,Math.floor(options.frame)));
    const frame=sequence[index];if(!frame)return;
    const pose=metadata.poses[frame[0]];if(!pose)return;
    const scale=options.scale??1;
    context.save();context.globalAlpha=options.alpha??1;
    if(options.shadow!==false){
      const sx=x+frame[4]*scale,sy=y+frame[5]*scale;
      nativeShadow(context,metadata.shadowSize,sx,sy,scale,Boolean(options.dungeon&&options.teamShadow));
    }
    context.drawImage(entry.image,pose[0],pose[1]+(options.dungeon?metadata.dungeonOffsetY??0:0),pose[2],pose[3],Math.round(x+(pose[4]+frame[2])*scale),Math.round(y+(pose[5]+frame[3]-(options.lift??0))*scale),Math.round(pose[2]*scale),Math.round(pose[3]*scale));
    context.restore();
    const attachment=metadata.statusOffsets?.[frame[0]];
    if(attachment&&(attachment[0]!==99||attachment[1]!==99))return{x:Math.round(x+(attachment[0]+frame[2])*scale),y:Math.round(y+(attachment[1]+frame[3]-(options.lift??0))*scale)};
  }

  /** @param {CanvasRenderingContext2D} context @param {string} id @param {number} x @param {number} y @param {number} [size]
   * @param {{flip?:boolean,face?:boolean,emotion?:string}} [options] */
  portrait(context,id,x,y,size=40,options={}){
    if(options.face===false){
      context.fillStyle='#bea653';context.fillRect(x,y,size,size);context.fillStyle='#f1dd9f';context.fillRect(x+1,y+size-10,size-2,9);
      this.draw(context,id,x+size/2,y+size-5,{direction:'s',clip:'idle',frame:0,shadow:false});return;
    }
    const emotion=options.emotion==='surprise'?'shocked':options.emotion==='hurt'?'pain':options.emotion==='determined'?'special':options.emotion??'normal';
    const portrait=this.portraitRects.get(`${id}:${emotion}`)??this.portraitRects.get(`${id}:normal`);
    if(!this.portraits||!portrait)return;
    context.save();context.translate(Math.round(x)+(options.flip?size:0),Math.round(y));if(options.flip)context.scale(-1,1);
    context.drawImage(this.portraits,portrait.x,portrait.y,40,40,0,0,size,size);context.restore();
  }

  dispose(){
    if(this.disposed)return;this.disposed=true;this.controller.abort();
    for(const entry of this.images.values())entry.image.close();this.images.clear();
    this.portraits?.close();this.portraits=null;this.portraitRects.clear();this.pending.clear();
  }
}
