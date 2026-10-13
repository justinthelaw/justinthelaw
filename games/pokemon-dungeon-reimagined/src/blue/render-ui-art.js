/** Bounded native team rows and an authored chocolate/cream starting menu. */
import { text } from './render-font.js';
const ROOT=new URL('../../assets/blue/',import.meta.url),LIMIT=64*1024;
/** @type {Readonly<Record<string,readonly [number,number]>>} */
const IMAGES=Object.freeze({'team-panels.png':[256,144]});

export class UiArtwork {
  constructor(){
    /** @type {Map<string,ImageBitmap>} */this.images=new Map();
    this.controller=new AbortController();this.disposed=false;
  }

  async load(){
    try{await Promise.all(Object.entries(IMAGES).map(async([name,dimensions])=>{
      const response=await fetch(new URL(name,ROOT),{signal:this.controller.signal,credentials:'same-origin',redirect:'error'});
      if(!response.ok||!response.body)throw Error('Could not load native menu artwork.');
      const length=response.headers.get('content-length');if(length!==null&&Number(length)>LIMIT)throw Error('Native menu artwork exceeds its byte budget.');
      const reader=response.body.getReader();
      /** @type {Uint8Array[]} */const chunks=[];let total=0;
      try{while(true){const chunk=await reader.read();if(chunk.done)break;total+=chunk.value.byteLength;if(total>LIMIT){await reader.cancel();throw Error('Native menu artwork exceeds its byte budget.');}chunks.push(chunk.value);}}
      finally{reader.releaseLock();}
      const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      const header=new DataView(bytes.buffer),signature=[137,80,78,71,13,10,26,10];
      if(total<33||signature.some((value,index)=>bytes[index]!==value)||header.getUint32(16)!==dimensions[0]||header.getUint32(20)!==dimensions[1])throw Error('Native menu artwork has unexpected dimensions.');
      const image=await window.createImageBitmap(new Blob([bytes],{type:'image/png'}));
      if(this.disposed){image.close();throw new DOMException('Menu artwork loading was cancelled.','AbortError');}
      if(image.width!==dimensions[0]||image.height!==dimensions[1]){image.close();throw Error('Decoded menu artwork has unexpected dimensions.');}
      this.images.set(name,image);
    }));}catch(error){this.dispose();throw error;}
  }

  /** @param {CanvasRenderingContext2D} context @param {number} y @param {boolean} occupied @param {boolean} pink */
  row(context,y,occupied,pink){const image=this.images.get('team-panels.png');if(image)context.drawImage(image,0,occupied?(pink?0:48):96,256,48,0,y,256,48);}
  /** @param {CanvasRenderingContext2D} context */
  menu(context){
    context.fillStyle='#352318';context.fillRect(0,0,256,192);
    context.fillStyle='#60412a';context.fillRect(8,8,240,176);
    context.fillStyle='#443022';context.fillRect(12,12,232,168);
    context.strokeStyle='#b78b58';context.strokeRect(12.5,12.5,231,167);
  }
  /** @param {CanvasRenderingContext2D} context @param {import('./render-native-sprites.js').SpriteBank} sprites @param {number} time */
  menuLogo(context,sprites,time){
    context.fillStyle='#291b14';context.fillRect(0,0,256,192);
    context.fillStyle='#513625';context.fillRect(12,12,232,168);
    context.strokeStyle='#b78b58';context.strokeRect(16.5,16.5,223,159);
    text(context,'Pokémon Mystery Dungeon',128,30,{align:'center',color:'#f4ddb6'});
    text(context,"Roux's Adventure",128,54,{align:'center',color:'#fff4dc'});
    context.save();context.translate(128,146);context.scale(2,2);
    sprites.draw(context,'pokemon-roux',0,0,{clip:'idle',time,shadow:false});context.restore();
    text(context,'A playful rescue adventure',128,162,{align:'center',color:'#f4ddb6'});
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();for(const image of this.images.values())image.close();this.images.clear();}
}
