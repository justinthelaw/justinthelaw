/** Original personality background: two indexed layers and native palette data. */
/** @typedef {'cycle'|'cyan'|'purple'} AuraMode */
/** @typedef {{width:number,height:number,layers:number,camera:[number,number],displayCenter:[number,number],blendCoefficients:number[],paletteFrameTicks:number,scrollPixelsPerTick:number,palettes:Record<AuraMode,number[][][]>}} AuraMetadata */
const ROOT=new URL('../../assets/blue/scenery/',import.meta.url);
const MODES=/** @type {AuraMode[]} */(['cycle','cyan','purple']);
const WIDTH=256,HEIGHT=192;

export class AuraBackdrop {
  constructor(){
    this.canvas=document.createElement('canvas');this.canvas.width=WIDTH;this.canvas.height=HEIGHT;
    const context=this.canvas.getContext('2d',{alpha:false});if(!context)throw Error('A 2D canvas is required for the personality background.');
    this.context=context;this.imageData=context.createImageData(WIDTH,HEIGHT);
    this.pixels=new Uint32Array(this.imageData.data.buffer);
    this.littleEndian=new Uint8Array(new Uint32Array([0x01020304]).buffer)[0]===4;
    /** @type {Uint8Array[]} */this.layers=[];
    /** @type {Record<AuraMode,Uint32Array[]>} */this.colors={cycle:[],cyan:[],purple:[]};
    /** @type {AuraMetadata|null} */this.metadata=null;
    /** @type {number|null} */this.startedAt=null;
    this.frameKey='';this.controller=new AbortController();this.disposed=false;
  }

  async load(){
    try{
      const response=await fetch(new URL('manifest.json',ROOT),{signal:this.controller.signal});
      if(!response.ok)throw Error(`Could not load personality background metadata (${response.status}).`);
      /** @type {{profile:string,aura:AuraMetadata}} */const manifest=await response.json();
      const metadata=manifest.aura;
      if(manifest.profile!=='blue-native-scenery-v2'||metadata.width!==480||metadata.height!==384||metadata.layers!==2||metadata.paletteFrameTicks!==8||metadata.scrollPixelsPerTick!==.5||metadata.blendCoefficients?.join(',')!=='8,8'||metadata.camera?.join(',')!=='244,156'||metadata.displayCenter?.join(',')!=='129,108')throw Error('Unsupported native personality background.');
      for(const mode of MODES){
        const frames=metadata.palettes[mode];
        if(!Array.isArray(frames)||frames.length!==(mode==='cycle'?63:1))throw Error('Native personality palette cycle is incomplete.');
        for(const frame of frames){
          if(frame.length!==16||frame.some(color=>color.length!==3||color.some(value=>!Number.isInteger(value)||value<0||value>31)))throw Error('Invalid native personality palette.');
          const pairs=new Uint32Array(256);
          for(let front=0;front<16;front++)for(let back=0;back<16;back++){
            const first=frame[front]??[0,0,0],second=frame[back]??[0,0,0];
            const channels=[0,1,2].map(channel=>{
              const a=first[channel]??0,b=second[channel]??0;
              const value=front?(back?(a+b)>>1:a):b;return(value<<3)|(value>>3);
            });
            const red=channels[0]??0,green=channels[1]??0,blue=channels[2]??0;
            pairs[front*16+back]=this.littleEndian?(0xff000000|blue<<16|green<<8|red):(red<<24|green<<16|blue<<8|255);
          }
          this.colors[mode].push(pairs);
        }
      }
      const png=await fetch(new URL('aura-indices.png',ROOT),{signal:this.controller.signal});
      if(!png.ok)throw Error(`Could not load personality background layers (${png.status}).`);
      const bitmap=await window.createImageBitmap(await png.blob());
      if(this.disposed){bitmap.close();throw new DOMException('Background loading was cancelled.','AbortError');}
      if(bitmap.width!==480||bitmap.height!==768){bitmap.close();throw Error('Native personality layers have unexpected dimensions.');}
      const scratch=document.createElement('canvas');scratch.width=480;scratch.height=768;
      const pixels=scratch.getContext('2d',{willReadFrequently:true});if(!pixels){bitmap.close();throw Error('Could not decode personality background layers.');}
      pixels.drawImage(bitmap,0,0);bitmap.close();
      const data=pixels.getImageData(0,0,480,768).data;scratch.width=1;scratch.height=1;
      for(let layer=0;layer<2;layer++){
        const indices=new Uint8Array(480*384);
        for(let index=0;index<indices.length;index++){
          const offset=(layer*indices.length+index)*4,value=data[offset]??0;
          if(value%17!==0||value>238||data[offset+1]!==value||data[offset+2]!==value||data[offset+3]!==255)throw Error('A native personality index changed.');
          indices[index]=value/17;
        }
        this.layers.push(indices);
      }
      this.metadata=metadata;
    }catch(error){this.dispose();throw error;}
  }

  /** Reset once when entering the interview, not between its questions/results.
   * @param {number} time */
  reset(time){this.startedAt=time;this.frameKey='';}

  /** The caller supplies its pause-aware clock. Source palette/scroll ticks are
   * nominal60Hz; exact Blue timing still needs a direct frame comparison.
   * @param {CanvasRenderingContext2D} context @param {number} time
   * @param {{reducedMotion?:boolean,mode?:AuraMode}} [options] */
  draw(context,time,options={}){
    const metadata=this.metadata,front=this.layers[0],back=this.layers[1];
    if(this.disposed||!metadata||!front||!back)return;
    this.startedAt??=time;
    const ticks=options.reducedMotion?0:Math.max(0,Math.floor((time-this.startedAt)*60/1000));
    const mode=options.mode??'cycle',shift=Math.floor(ticks/2)%384;
    const paletteIndex=mode==='cycle'?Math.floor(ticks/8)%63:0;
    const colors=this.colors[mode][paletteIndex];if(!colors)return;
    const frameKey=`${mode}:${shift}:${paletteIndex}`;
    if(frameKey!==this.frameKey){
      this.frameKey=frameKey;
      for(let y=0;y<HEIGHT;y++){
        const frontRow=((48+y+shift)%384)*480+115;
        const backRow=((48+y-shift+384)%384)*480+115;
        const row=y*WIDTH;
        for(let x=0;x<WIDTH;x++)this.pixels[row+x]=colors[(front[frontRow+x]??0)*16+(back[backRow+x]??0)]??0xff000000;
      }
      this.context.putImageData(this.imageData,0,0);
    }
    context.drawImage(this.canvas,0,0);
  }

  dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();this.layers=[];this.colors={cycle:[],cyan:[],purple:[]};this.metadata=null;this.canvas.width=1;this.canvas.height=1;}
}
