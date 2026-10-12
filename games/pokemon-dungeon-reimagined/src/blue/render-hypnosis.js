import {battleBytes,battlePngHeader} from './render-battle-effects.js';
import {HYPNOSIS_PATTERNS} from './render-hypnosis-data.js';

/** One screen-relative comparative BG2 owner, only for Hypnosis. The assumed
 * Blue crop is 256x192 at 0,0; no actor attachment or Canvas alpha substitute. */
export class HypnosisBackground {
  constructor(){
    this.controller=new AbortController();this.disposed=false;
    /** @type {Promise<void>|null} */this.pending=null;
    /** @type {HTMLCanvasElement|null} */this.canvas=null;
    /** @type {CanvasRenderingContext2D|null} */this.context=null;
    /** @type {Uint8ClampedArray|null} */this.pixels=null;
    /** @type {ImageData|null} */this.output=null;
  }
  ready(){return !this.disposed&&this.pixels!==null;}
  async load(){
    if(this.disposed)throw new DOMException('Hypnosis artwork loading was cancelled.','AbortError');
    if(this.ready())return;if(this.pending)return this.pending;
    const promise=(async()=>{
      /** @type {ImageBitmap|null} */let image=null;
      try{
        const bytes=await battleBytes('hypnosis-background.png',4096,this.controller.signal);
        battlePngHeader(bytes,{width:416,height:32});
        if(this.disposed)throw new DOMException('Hypnosis artwork loading was cancelled.','AbortError');
        image=await window.createImageBitmap(new Blob([bytes],{type:'image/png'}));
        if(this.disposed)throw new DOMException('Hypnosis artwork loading was cancelled.','AbortError');
        if(image.width!==416||image.height!==32)throw Error('Hypnosis artwork dimensions changed.');
        const canvas=document.createElement('canvas');canvas.width=416;canvas.height=32;
        const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw Error('A 2D canvas is required for Hypnosis.');
        context.drawImage(image,0,0);const pixels=context.getImageData(0,0,416,32).data;
        for(let index=0;index<pixels.length;index++){
          const value=pixels[index]??0;
          if(index%4===3?value!==255:value!==((value>>3)<<3|(value>>3)>>3))throw Error('Hypnosis palette or opacity changed.');
        }
        canvas.width=256;canvas.height=192;context.imageSmoothingEnabled=false;
        this.canvas=canvas;this.context=context;this.pixels=pixels;this.output=context.createImageData(256,192);
      }catch(error){this.dispose();throw error;}finally{image?.close();}
    })();
    this.pending=promise;try{await promise;}finally{if(this.pending===promise)this.pending=null;}
  }
  /** @returns {CanvasRenderingContext2D} */
  world(){if(!this.ready()||!this.context)throw Error('Hypnosis artwork is unavailable.');return this.context;}
  /** The scratch contains only eligible terrain/OBJ pixels. UI/window ownership
   * is decided before drawing, never inferred from flattened pixel colors.
   * @param {CanvasRenderingContext2D} target @param {number} elapsedTicks */
  draw(target,elapsedTicks){
    const pattern=HYPNOSIS_PATTERNS[Math.floor(elapsedTicks/2)];
    if(!Number.isInteger(elapsedTicks)||elapsedTicks<0||elapsedTicks>=44||pattern===undefined||!this.pixels||!this.output||!this.context)return;
    const scene=this.context.getImageData(0,0,256,192).data,output=this.output.data;
    for(let y=0;y<192;y++)for(let x=0;x<256;x++){
      const pixel=(y*256+x)*4,source=((y&31)*416+pattern*32+(x&31))*4;
      for(let channel=0;channel<3;channel++){
        // DS 6-bit mix with rounding, then 6-to-8 expansion. Source unblended
        // Blue channels encode even 6-bit values; odd blend results survive.
        const front=this.pixels[source+channel]??0;
        // Cleared BG0 retains its opaque one-pixel guard at x0. BG0 is not
        // a second target: this foreground pixel stays unblended there.
        if(x===0){output[pixel+channel]=front;continue;}
        const six=Math.min(63,((front>>2)*10+((scene[pixel+channel]??0)>>2)*10+8)>>4);
        output[pixel+channel]=(six<<2)|(six>>4);
      }
      output[pixel+3]=255;
    }
    target.putImageData(this.output,0,0);
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;this.controller.abort();
    if(this.canvas){this.canvas.width=0;this.canvas.height=0;}
    this.canvas=null;this.context=null;this.pixels=null;this.output=null;
  }
}
