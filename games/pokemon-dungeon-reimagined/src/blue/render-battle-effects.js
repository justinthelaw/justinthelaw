/** Selected native effect artwork. The battle owner supplies every clock and
 * lifetime; this bank never starts timers or changes gameplay. */
const ROOT=new URL('../../assets/blue/',import.meta.url);
const DIRECTIONS=['s','se','e','ne','n','nw','w','sw'];
/** @typedef {'basic'|'initial'} BankId */
/** @typedef {{id:BankId,path:string,ids:readonly number[],files:readonly string[]}} BankSpec */
/** Later-level sprite effects are excluded; Hypnosis BG has its own owner.
 * @type {readonly BankSpec[]} */
const BANKS=Object.freeze([
  {id:'basic',path:'battle-effects',ids:[8,9,10,11,22,37,138,144,236,274,317,137,399,404,423],files:['efob000','efob053','efob054','efob119','efob121']},
  {id:'initial',path:'battle-effects-initial',ids:[7,15,21,128,150,225,287,312,402,425],files:['efob000','efob020','efob023','efob051','efob073','efob081','efob113']},
]);
const JSON_LIMIT=128*1024,PNG_LIMIT=256*1024,MAX_BANKS=3,MAX_DECODED_BYTES=4*1024*1024;

/** @typedef {[number,number,number,number,number,number,number]} EffectFrame */
/** @typedef {{depthOffset:number,rect:[number,number,number,number,number,number]}} EffectLayer */
/** @typedef {{bounds:[number,number,number,number],layers:EffectLayer[]}} EffectPose */
/** @typedef {{sourceAnimation:number,ticks:number,frames:EffectFrame[]}} EffectSequence */
/** @typedef {{id:number,name:string,file:string,sourceAnimation:number,directional:boolean,palette:number,attachmentSet:number,loop:boolean,sourceWaitFlag:0|1,blocksWait:boolean,sequences:EffectSequence[]}} EffectRecord */
/** @typedef {{schemaVersion:1,width:number,height:number,directions:string[],poses:EffectPose[],effects:EffectRecord[]}} EffectMetadata */
/** @typedef {{bank:BankId,depthOffset:number,source:[number,number,number,number],offset:[number,number]}} EffectLayerSample */
/** @typedef {{image:ImageBitmap,poses:EffectPose[]}} LoadedBank */
/** @typedef {{bank:BankId,record:EffectRecord}} EffectBinding */
const integer=(/** @type {number} */value,/** @type {number} */min,/** @type {number} */max)=>Number.isInteger(value)&&value>=min&&value<=max;

/** @param {unknown} value @param {BankSpec} bank @returns {EffectMetadata} */
function metadata(value,bank){
  if(!value||typeof value!=='object')throw Error('Native battle artwork metadata is missing.');
  const data=/** @type {EffectMetadata} */(value);
  if(data.schemaVersion!==1||data.width!==512||!integer(data.height,1,1024)||data.width*data.height*4>2*1024*1024||data.directions?.join(',')!==DIRECTIONS.join(',')||!Array.isArray(data.poses)||!integer(data.poses.length,1,512)||!Array.isArray(data.effects)||data.effects.length!==bank.ids.length)throw Error('Unsupported native battle artwork.');
  for(const pose of data.poses){
    if(!pose||!Array.isArray(pose.bounds)||pose.bounds.length!==4||!pose.bounds.slice(0,2).every(value=>integer(value,-256,256))||!pose.bounds.slice(2).every(value=>integer(value,1,256))||!Array.isArray(pose.layers)||!integer(pose.layers.length,1,4))throw Error('Native effect pose geometry is invalid.');
    let previous=-129;
    for(const layer of pose.layers){
      const rect=layer?.rect;
      if(!layer||!integer(layer.depthOffset,-128,127)||layer.depthOffset<=previous||!Array.isArray(rect)||rect.length!==6||!rect.every(Number.isInteger)||rect[0]<0||rect[1]<0||!integer(rect[2],1,256)||!integer(rect[3],1,256)||rect[0]+rect[2]>data.width||rect[1]+rect[3]>data.height||!rect.slice(4).every(value=>integer(value,-256,256)))throw Error('Native effect layer exceeds its atlas.');
      previous=layer.depthOffset;
    }
  }
  const remaining=new Set(bank.ids);
  for(const record of data.effects){
    if(!record||!remaining.delete(record.id)||typeof record.name!=='string'||!/^[a-z-]+$/.test(record.name)||!bank.files.includes(record.file)||!integer(record.sourceAnimation,0,63)||typeof record.directional!=='boolean'||!integer(record.palette,0,14)||!integer(record.attachmentSet,-1,3)||typeof record.loop!=='boolean'||record.sourceWaitFlag!==(record.id===37?1:0)||typeof record.blocksWait!=='boolean'||record.blocksWait!==(record.sourceWaitFlag===0)||!Array.isArray(record.sequences)||record.sequences.length!==(record.directional?8:1))throw Error('Native effect selection is invalid.');
    for(const[index,sequence]of record.sequences.entries()){
      if(!sequence||sequence.sourceAnimation!==record.sourceAnimation+(record.directional?index:0)||!integer(sequence.ticks,1,32640)||!Array.isArray(sequence.frames)||!integer(sequence.frames.length,1,128))throw Error('Native effect sequence is invalid.');
      for(const frame of sequence.frames)if(!Array.isArray(frame)||frame.length!==7||!frame.every(Number.isInteger)||!integer(frame[0],0,data.poses.length-1)||!integer(frame[1],1,255)||!frame.slice(2,6).every(value=>integer(value,-32768,32767))||!integer(frame[6],0,255))throw Error('Native effect frame exceeds its bounds.');
      if(sequence.ticks!==sequence.frames.reduce((sum,frame)=>sum+frame[1],0))throw Error('Native effect duration differs from its frames.');
    }
  }
  return data;
}

/** @param {string} path @param {number} limit @param {AbortSignal} signal */
async function bytes(path,limit,signal){
  const response=await fetch(new URL(path,ROOT),{signal,credentials:'same-origin',redirect:'error'});
  if(!response.ok)throw Error(`Could not load native battle artwork (${response.status}).`);
  const declared=response.headers.get('content-length');
  if(declared!==null&&Number(declared)>limit)throw Error('Native battle artwork exceeds its byte budget.');
  if(!response.body)throw Error('Native battle artwork has no response body.');
  const reader=response.body.getReader();
  /** @type {Uint8Array[]} */const chunks=[];let total=0;
  try{while(true){const result=await reader.read();if(result.done)break;total+=result.value.byteLength;if(total>limit){await reader.cancel();throw Error('Native battle artwork exceeds its byte budget.');}chunks.push(result.value);}}
  finally{reader.releaseLock();}
  const data=new Uint8Array(total);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}return data;
}

/** @param {Uint8Array} data @param {{width:number,height:number}} expected */
function pngHeader(data,expected){
  if(data.byteLength<33||[137,80,78,71,13,10,26,10].some((value,index)=>data[index]!==value)||String.fromCharCode(...data.subarray(12,16))!=='IHDR')throw Error('Native battle artwork is not a PNG.');
  const header=new DataView(data.buffer,data.byteOffset,data.byteLength);
  if(header.getUint32(8)!==13||header.getUint32(16)!==expected.width||header.getUint32(20)!==expected.height||data[24]!==8||data[25]!==6||data[26]!==0||data[27]!==0||data[28]!==0)throw Error('Native battle PNG geometry or format changed.');
}

export class BattleEffects {
  constructor(){
    /** @type {Map<BankId,LoadedBank>} */this.banks=new Map();
    /** @type {Map<number,EffectBinding>} */this.records=new Map();
    /** @type {Promise<void>|null} */this.pending=null;
    this.controller=new AbortController();this.disposed=false;
  }
  async load(){
    if(this.disposed)throw new DOMException('Battle artwork loading was cancelled.','AbortError');
    if(this.banks.size===BANKS.length)return;if(this.pending)return this.pending;
    const promise=(async()=>{
      /** @type {Map<BankId,LoadedBank>} */const decoded=new Map();
      try{
        if(BANKS.length<1||BANKS.length>MAX_BANKS)throw Error('Battle artwork bank count exceeds its budget.');
        const entries=await Promise.all(BANKS.map(async bank=>{
          const[json,png]=await Promise.all([bytes(`${bank.path}.json`,JSON_LIMIT,this.controller.signal),bytes(`${bank.path}.png`,PNG_LIMIT,this.controller.signal)]);
          const data=metadata(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(json)),bank);pngHeader(png,data);
          return{bank,data,png};
        }));
        let decodedBytes=53248; // Reserved closed Hypnosis background atlas.
        const ids=new Set();
        for(const entry of entries){
          decodedBytes+=entry.data.width*entry.data.height*4;
          if(decodedBytes>MAX_DECODED_BYTES)throw Error('Battle artwork exceeds its aggregate decoded budget.');
          for(const record of entry.data.effects){if(ids.has(record.id))throw Error('A native effect belongs to more than one bank.');ids.add(record.id);}
        }
        // Decode only after all metadata/header/aggregate checks pass. The
        // local owner closes every partial bitmap if a later decode fails.
        for(const entry of entries){
          if(this.disposed)throw new DOMException('Battle artwork loading was cancelled.','AbortError');
          const image=await window.createImageBitmap(new Blob([entry.png],{type:'image/png'}));
          if(this.disposed||image.width!==entry.data.width||image.height!==entry.data.height){
            image.close();
            if(this.disposed)throw new DOMException('Battle artwork loading was cancelled.','AbortError');
            throw Error('Decoded battle artwork dimensions changed.');
          }
          decoded.set(entry.bank.id,{image,poses:entry.data.poses});
        }
        for(const[bank,value]of decoded)this.banks.set(bank,value);
        for(const entry of entries)for(const record of entry.data.effects)this.records.set(record.id,{bank:entry.bank.id,record});
        decoded.clear();
      }catch(error){for(const bank of decoded.values())bank.image.close();this.dispose();throw error;}
    })();
    this.pending=promise;try{await promise;}finally{if(this.pending===promise)this.pending=null;}
  }

  /** @param {number} id @param {string} direction */
  effectInfo(id,direction){
    const binding=this.records.get(id),index=DIRECTIONS.indexOf(direction);if(!binding||index<0)return undefined;
    const record=binding.record,sequence=record.sequences[record.directional?index:0];if(!sequence)return undefined;
    return{ticks:sequence.ticks,attachmentSet:record.attachmentSet,loop:record.loop,blocksWait:record.blocksWait};
  }

  /** All timing comes from the sampled battle frame; no state is retained.
   * @param {number} id @param {string} direction @param {number} elapsedTicks */
  sample(id,direction,elapsedTicks){
    const binding=this.records.get(id),index=DIRECTIONS.indexOf(direction);
    if(this.disposed||!binding||index<0||!Number.isFinite(elapsedTicks)||elapsedTicks<0)return undefined;
    const bank=this.banks.get(binding.bank);if(!bank)return undefined;
    const record=binding.record,sequence=record.sequences[record.directional?index:0];if(!sequence)return undefined;
    if(!record.loop&&elapsedTicks>=sequence.ticks)return undefined;
    let ticks=record.loop?elapsedTicks%sequence.ticks:elapsedTicks,frameIndex=0;
    while(frameIndex<sequence.frames.length-1&&ticks>=(sequence.frames[frameIndex]?.[1]??0)){ticks-=sequence.frames[frameIndex]?.[1]??0;frameIndex++;}
    const frame=sequence.frames[frameIndex],pose=frame?bank.poses[frame[0]]:undefined;if(!frame||!pose)return undefined;
    /** @type {EffectLayerSample[]} */
    const layers=pose.layers.map(layer=>({bank:binding.bank,depthOffset:layer.depthOffset,source:[layer.rect[0],layer.rect[1],layer.rect[2],layer.rect[3]],offset:[layer.rect[4]+frame[2],layer.rect[5]+frame[3]]}));
    return{layers,directional:record.directional,attachmentSet:record.attachmentSet};
  }

  /** @param {CanvasRenderingContext2D} context @param {EffectLayerSample} layer @param {number} x @param {number} y */
  drawLayer(context,layer,x,y){
    const image=this.banks.get(layer.bank)?.image;if(!image||this.disposed)return;
    const[sx,sy,width,height]=layer.source,dx=Math.round(x+layer.offset[0]),dy=Math.round(y+layer.offset[1]);
    if(dx+width<=0||dy+height<=0||dx>=256||dy>=192)return;
    context.save();context.imageSmoothingEnabled=false;context.drawImage(image,sx,sy,width,height,dx,dy,width,height);context.restore();
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();for(const bank of this.banks.values())bank.image.close();this.banks.clear();this.records.clear();}
}

export {bytes as battleBytes,pngHeader as battlePngHeader};
