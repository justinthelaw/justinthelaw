/** Bounded native team rows and an authored Blue-inspired Roux coastal menu. */
const ROOT=new URL('../../assets/blue/',import.meta.url),LIMIT=64*1024;
/** @type {Readonly<Record<string,readonly [number,number]>>} */
const IMAGES=Object.freeze({'team-panels.png':[256,144],'../roux/menu-title.png':[256,192],'../roux/menu-landscape.png':[256,192],'../roux/menu-roux.png':[64,56]});

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
    const image=this.images.get('../roux/menu-landscape.png');if(image)context.drawImage(image,0,0);
  }
  /** A dedicated title illustration preserves detail at native display size.
   * @param {CanvasRenderingContext2D} context */
  menuLogo(context){
    const image=this.images.get('../roux/menu-title.png');if(image)context.drawImage(image,0,0);
    const hero=this.images.get('../roux/menu-roux.png');if(hero)context.drawImage(hero,170,136);
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();for(const image of this.images.values())image.close();this.images.clear();}
}
