/** Original Rescue Team cinematic images; native sizes and source AX timing. */
const ROOT=new URL('../../assets/blue/',import.meta.url);
/** @typedef {[number,number,number,number,number,number]} Pose */
/** @typedef {[number,number,number,number,number,number,number]} Frame */
/** @typedef {{schemaVersion:2,id:string,width:number,height:number,poses:Pose[],animations:Frame[][][],scriptAnimationMap:number[]}} OrnamentMetadata */

export class OrnamentBank {
  constructor(){
    /** @type {Map<string,{image:ImageBitmap,metadata:OrnamentMetadata}>} */this.images=new Map();
    this.controller=new AbortController();this.disposed=false;
  }

  async load(){
    if(this.disposed)throw new DOMException('Cinematic artwork was disposed.','AbortError');
    try{await Promise.all(['title-bird','title-letter'].map(async id=>{
      const response=await fetch(new URL(`${id}.json`,ROOT),{signal:this.controller.signal});
      if(!response.ok)throw Error(`Could not load cinematic frame metadata (${response.status}).`);
      const metadata=/** @type {OrnamentMetadata} */(await response.json());
      if(metadata.schemaVersion!==2||metadata.id!==id||!Number.isInteger(metadata.width)||!Number.isInteger(metadata.height)||metadata.width<1||metadata.height<1||metadata.width*metadata.height>512*512||!Array.isArray(metadata.poses)||!Array.isArray(metadata.animations)||!Array.isArray(metadata.scriptAnimationMap))throw Error('Invalid native cinematic metadata.');
      for(const pose of metadata.poses)if(pose.length!==6||pose.some(value=>!Number.isInteger(value))||pose[0]<0||pose[1]<0||pose[2]<1||pose[3]<1||pose[0]+pose[2]>metadata.width||pose[1]+pose[3]>metadata.height)throw Error('Native cinematic pose exceeds its image.');
      for(const animation of metadata.animations){
        if(animation.length!==8)throw Error('Native cinematic variant table is incomplete.');
        for(const sequence of animation){
          if(sequence.length===0)throw Error('Native cinematic sequence is empty.');
          for(const frame of sequence)if(frame.length!==7||frame.some(value=>!Number.isInteger(value))||frame[0]<0||frame[0]>=metadata.poses.length||frame[1]<1)throw Error('Invalid native cinematic frame.');
        }
      }
      const png=await fetch(new URL(`${id}.png`,ROOT),{signal:this.controller.signal});if(!png.ok)throw Error(`Could not load cinematic artwork (${png.status}).`);
      const image=await window.createImageBitmap(await png.blob());
      if(this.disposed){image.close();throw new DOMException('Cinematic artwork was disposed.','AbortError');}
      if(image.width!==metadata.width||image.height!==metadata.height){image.close();throw Error('Native cinematic image dimensions changed.');}
      this.images.set(id,{image,metadata});
    }));}catch(error){this.dispose();throw error;}
  }

  /** The animation argument is the original ground-script SELECT_ANIMATION id.
   * time is milliseconds since that selection, not a synthetic flap speed.
   * @param {CanvasRenderingContext2D} context @param {'title-bird'|'title-letter'} id
   * @param {number} animation @param {number} x @param {number} y @param {number} time */
  draw(context,id,animation,x,y,time){
    const entry=this.images.get(id);if(!entry)return;
    const code=entry.metadata.scriptAnimationMap[animation];if(code===undefined||code<0)return;
    const variant=code&255,sequence=entry.metadata.animations[Math.floor(variant/8)]?.[variant%8];if(!sequence?.length)return;
    let ticks=Math.max(0,time)*60/1000;const duration=sequence.reduce((sum,frame)=>sum+frame[1],0);
    if(code&0x800)ticks%=duration;
    let index=0;while(index<sequence.length-1&&ticks>=(sequence[index]?.[1]??0)){ticks-=sequence[index]?.[1]??0;index++;}
    const frame=sequence[index];if(!frame)return;
    const pose=entry.metadata.poses[frame[0]];if(!pose)return;
    context.drawImage(entry.image,pose[0],pose[1],pose[2],pose[3],Math.round(x+pose[4]+frame[2]),Math.round(y+pose[5]+frame[3]),pose[2],pose[3]);
  }

  dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();for(const entry of this.images.values())entry.image.close();this.images.clear();}
}
