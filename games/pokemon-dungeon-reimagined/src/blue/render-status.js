/** Native Rescue Team status symbols. Rendering consumes only local artwork
 * and the caller's pause-aware clock; it never changes gameplay or its RNG. */
const ROOT=new URL('../../assets/blue/',import.meta.url);
const WIDTH=256,HEIGHT=144,SELECTION_FRAMES=61,ANIMATION_TICKS=4;
const JSON_LIMIT=16*1024,PNG_LIMIT=256*1024;

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {{id:string,x:number,y:number,width:number,height:number,frames:number,bit:number,phase:number,xShift:number}} StatusRecord */
/** @typedef {{schemaVersion:1,width:number,height:number,selectionFrames:number,animationFrameTicks:number,records:StatusRecord[]}} StatusMetadata */
/** @typedef {{selectedBit:number|null,nextTick:number}} StatusCycle */

// Native status bit indices, graphic dimensions/counts and upload phases.
// The single selectable bank does not include the separate frozen-body bank.
/** @type {Readonly<Record<string,readonly [number,number,number,number,number]>>} */
const EXPECTED=Object.freeze({
  sleep:[26,16,10,3,8],
  burn:[1,16,7,0,0],
  poison:[2,16,16,0,0],
  confusion:[4,32,4,1,0],
  whiffer:[17,16,9,1,0],
  reflect:[8,16,13,2,0],
  'focus-energy':[19,16,13,2,0],
  'low-hp':[13,8,8,1,0],
  'stat-down':[27,16,10,2,0],
});
const BITS=Object.values(EXPECTED).map(record=>record[0]).sort((a,b)=>a-b);

/** @param {unknown} value @returns {StatusMetadata} */
function metadata(value){
  if(!value||typeof value!=='object')throw Error('Status artwork metadata is missing.');
  const data=/** @type {StatusMetadata} */(value);
  if(data.schemaVersion!==1||data.width!==WIDTH||data.height!==HEIGHT||data.selectionFrames!==SELECTION_FRAMES||data.animationFrameTicks!==ANIMATION_TICKS||!Array.isArray(data.records)||data.records.length!==9)throw Error('Unsupported native status artwork.');
  const ids=new Set(),bits=new Set();
  /** @type {StatusRecord[]} */const validated=[];
  for(const record of data.records){
    if(!record||typeof record!=='object'||typeof record.id!=='string'||!Object.hasOwn(EXPECTED,record.id))throw Error('Unknown native status symbol.');
    const expected=EXPECTED[record.id];
    if(!expected||ids.has(record.id)||bits.has(record.bit)||record.height!==16||record.bit!==expected[0]||record.width!==expected[1]||record.frames!==expected[2]||record.phase!==expected[3]||record.xShift!==expected[4])throw Error('Native status symbol parameters changed.');
    if(!Number.isInteger(record.x)||!Number.isInteger(record.y)||record.x<0||record.y<0||record.x+record.width*record.frames>WIDTH||record.y+record.height>HEIGHT)throw Error('Native status strip exceeds its atlas.');
    for(const other of validated)if(record.x<other.x+other.width*other.frames&&record.x+record.width*record.frames>other.x&&record.y<other.y+other.height&&record.y+record.height>other.y)throw Error('Native status strips overlap.');
    ids.add(record.id);bits.add(record.bit);validated.push(record);
  }
  return data;
}

/** Bounded body consumption also covers a missing or incorrect Content-Length.
 * @param {string} name @param {number} limit @param {AbortSignal} signal */
async function bytes(name,limit,signal){
  const response=await fetch(new URL(name,ROOT),{signal,credentials:'same-origin',redirect:'error'});
  if(!response.ok)throw Error(`Could not load status artwork (${response.status}).`);
  const declared=response.headers.get('content-length');
  if(declared!==null&&Number(declared)>limit)throw Error('Status artwork exceeds its byte budget.');
  if(!response.body)throw Error('Status artwork response has no body.');
  const reader=response.body.getReader();
  /** @type {Uint8Array[]} */const chunks=[];let total=0;
  try{
    while(true){
      const result=await reader.read();if(result.done)break;
      total+=result.value.byteLength;
      if(total>limit){await reader.cancel();throw Error('Status artwork exceeds its byte budget.');}
      chunks.push(result.value);
    }
  }finally{reader.releaseLock();}
  const data=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
  return data;
}

/** Check dimensions before decoding, then verify the decoded bitmap too.
 * @param {Uint8Array} data */
function validatePng(data){
  const signature=[137,80,78,71,13,10,26,10];
  if(data.byteLength<33||signature.some((value,index)=>data[index]!==value)||String.fromCharCode(...data.subarray(12,16))!=='IHDR')throw Error('Status artwork is not a PNG.');
  const header=new DataView(data.buffer,data.byteOffset,data.byteLength);
  if(header.getUint32(8)!==13||header.getUint32(16)!==WIDTH||header.getUint32(20)!==HEIGHT)throw Error('Status artwork has unexpected dimensions.');
}

/** Supported UpdateStatusIconFlags routes only. Low HP is strict and applies
 * to the team; stat-down concerns battle stages, not movement speed.
 * @param {Actor} actor */
function statusMask(actor){
  if(actor.hp<=0)return 0;
  let mask=0;
  if(actor.status.sleep)mask|=1<<26;
  if(actor.status.burn)mask|=1<<1;
  if(actor.status.poison)mask|=1<<2;
  if(actor.status.confusion)mask|=1<<4;
  if(actor.status.whiffer)mask|=1<<17;
  if(actor.status.reflect)mask|=1<<8;
  if(actor.status.focusEnergy)mask|=1<<19;
  if((actor.id==='hero'||actor.id==='partner')&&actor.hp<Math.floor(actor.maxHp/4))mask|=1<<13;
  if(Object.values(actor.stages).some(stage=>stage<10))mask|=1<<27;
  return mask;
}

export class StatusSprites {
  /** @param {{signal?:AbortSignal}} [options] */
  constructor(options={}){
    /** @type {ImageBitmap|null} */this.image=null;
    /** @type {Map<number,StatusRecord>} */this.records=new Map();
    /** @type {Map<string,StatusCycle>} */this.cycles=new Map();
    /** @type {Promise<void>|null} */this.pending=null;
    /** @type {number[]|null} */this.tiles=null;
    this.startedAt=0;this.lastTime=0;this.tick=0;this.reducedMotion=false;
    this.controller=new AbortController();this.disposed=false;
    this.externalSignal=options.signal;
    this.abort=()=>this.dispose();
    if(this.externalSignal?.aborted)this.dispose();
    else this.externalSignal?.addEventListener('abort',this.abort,{once:true});
  }

  async load(){
    if(this.disposed)throw new DOMException('Status artwork loading was cancelled.','AbortError');
    if(this.image)return;
    if(this.pending)return this.pending;
    const promise=(async()=>{
      /** @type {ImageBitmap|null} */let decoded=null;
      try{
        const [json,png]=await Promise.all([
          bytes('status-icons.json',JSON_LIMIT,this.controller.signal),
          bytes('status-icons.png',PNG_LIMIT,this.controller.signal),
        ]);
        const data=metadata(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(json)));
        validatePng(png);
        decoded=await window.createImageBitmap(new Blob([png],{type:'image/png'}));
        if(this.disposed)throw new DOMException('Status artwork loading was cancelled.','AbortError');
        if(decoded.width!==WIDTH||decoded.height!==HEIGHT)throw Error('Decoded status artwork has unexpected dimensions.');
        for(const record of data.records)this.records.set(record.bit,{...record});
        this.image=decoded;decoded=null;
      }catch(error){decoded?.close();this.dispose();throw error;}
    })();
    this.pending=promise;
    try{await promise;}finally{if(this.pending===promise)this.pending=null;}
  }

  /** Update every active actor, even when it is outside the displayed room.
   * Selection catches up arithmetically, with at most nine bits per actor.
   * @param {DungeonState} state @param {number} time
   * @param {{reducedMotion?:boolean}} [options] */
  beginFrame(state,time,options={}){
    if(this.disposed)return;
    if(!Number.isFinite(time)||time<0)throw new RangeError('Invalid status animation clock.');
    if(this.tiles!==state.tiles||time<this.lastTime){this.cycles.clear();this.tiles=state.tiles;this.startedAt=time;}
    this.lastTime=time;this.tick=Math.max(0,Math.floor((time-this.startedAt)*60/1000));
    this.reducedMotion=Boolean(options.reducedMotion);
    const seen=new Set();
    for(const actor of [state.hero,state.partner,...state.enemies.slice(0,10)]){
      if(actor.hp<=0)continue;seen.add(actor.id);
      let cycle=this.cycles.get(actor.id);
      if(!cycle){cycle={selectedBit:null,nextTick:this.tick};this.cycles.set(actor.id,cycle);}
      const mask=statusMask(actor);
      if(mask===0){cycle.selectedBit=null;cycle.nextTick=this.tick;continue;}
      const active=BITS.filter(bit=>(mask&(1<<bit))!==0);
      if(cycle.selectedBit===null){cycle.selectedBit=active[0]??null;cycle.nextTick=this.tick+SELECTION_FRAMES;continue;}
      if(this.tick<cycle.nextTick)continue;
      const steps=1+Math.floor((this.tick-cycle.nextTick)/SELECTION_FRAMES);
      const after=active.findIndex(bit=>bit>(cycle.selectedBit??-1));
      cycle.selectedBit=active[((after<0?0:after)+(steps-1)%active.length)%active.length]??null;
      cycle.nextTick+=steps*SELECTION_FRAMES;
    }
    for(const id of this.cycles.keys())if(!seen.has(id))this.cycles.delete(id);
  }

  /** Attachment already includes the selected native pose/frame head offsets.
   * @param {CanvasRenderingContext2D} context @param {Actor} actor
   * @param {{x:number,y:number}|undefined} attachment */
  draw(context,actor,attachment){
    if(this.disposed||!this.image||!attachment||actor.hp<=0||!Number.isFinite(attachment.x)||!Number.isFinite(attachment.y))return;
    const bit=this.cycles.get(actor.id)?.selectedBit;if(bit===undefined||bit===null)return;
    const record=this.records.get(bit);if(!record)return;
    // Native phase0..3 uploads stagger the shared graphic strips. All strips
    // are initially loaded at frame zero, before their first phased update.
    const frame=this.reducedMotion?0:Math.floor(Math.max(0,this.tick-record.phase)/ANIMATION_TICKS)%record.frames;
    const x=Math.round(attachment.x-record.width/2+record.xShift),y=Math.round(attachment.y-record.height/2-16);
    if(x+record.width<=0||y+record.height<=0||x>=context.canvas.width||y>=context.canvas.height)return;
    context.save();context.imageSmoothingEnabled=false;
    context.drawImage(this.image,record.x+frame*record.width,record.y,record.width,record.height,x,y,record.width,record.height);
    context.restore();
  }

  /** Retire a dungeon presentation without reloading its artwork. Continuing
   * the same live save must not include time spent on the top menu. */
  reset(){
    this.cycles.clear();this.tiles=null;
    this.startedAt=0;this.lastTime=0;this.tick=0;
  }

  dispose(){
    if(this.disposed)return;this.disposed=true;this.controller.abort();
    this.externalSignal?.removeEventListener('abort',this.abort);
    this.image?.close();this.image=null;this.records.clear();this.reset();this.pending=null;
  }
}
