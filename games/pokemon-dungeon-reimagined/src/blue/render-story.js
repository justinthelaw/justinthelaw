import { text } from './render-font.js';

/** @typedef {import('./renderer.js').View} View */
/** @typedef {import('./render-sprites.js').SpriteBank} SpriteBank */
/** @typedef {import('./mechanics-types.js').Direction} Direction */
/** @typedef {{speciesId:string,x:number,y:number,direction:Direction,clip?:string,time?:number,jump?:number,surprised?:boolean}} FieldActor */

const FRAME_MS=1000/60;
/** Comparative d01p01 ground coordinates transformed around its fixed camera.
 * @type {[number,number][]} */
const BUTTERFREE_APPROACH=[[-16,96],[12,72],[28,72],[44,88],[60,88],[84,64],[96,64],[112,80],[128,80]];

/** @param {number} dx @param {number} dy @returns {Direction} */
function direction(dx,dy){
  if(dy<0)return dx<0?'nw':dx>0?'ne':'n';
  if(dy>0)return dx<0?'sw':dx>0?'se':'s';
  return dx<0?'w':'e';
}

/** The original ground script specifies a one-pixel-per-frame waypoint route.
 * Timing here is nominal 60 Hz, not a claim about the DS animation driver.
 * @param {[number,number][]} path @param {number} elapsed */
function followPath(path,elapsed){
  let frames=Math.max(0,elapsed/FRAME_MS);
  for(let index=1;index<path.length;index++){
    const previous=path[index-1],next=path[index];if(!previous||!next)continue;
    const dx=next[0]-previous[0],dy=next[1]-previous[1],length=Math.max(Math.abs(dx),Math.abs(dy));
    if(frames<length)return{x:previous[0]+dx*frames/length,y:previous[1]+dy*frames/length,direction:direction(dx,dy),moving:true};
    frames-=length;
  }
  const last=path.at(-1)??[0,0];
  return{x:last[0],y:last[1],direction:/** @type {Direction} */('s'),moving:false};
}

/** Visual state only. Story navigation, dialogue and save data remain with the
 * app; a page change within one story line never restarts an actor's movement. */
export class StoryActors {
  constructor(){
    this.phase='';this.beat='';this.beatStart=0;
    /** @type {number|null} */this.arrivalStart=null;
    /** @type {number|null} */this.walkStart=null;
    /** @type {number|null} */this.departureStart=null;
    /** @type {number|null} */this.wakeStart=null;
    /** @type {number|null} */this.giftStart=null;
    /** @type {number|null} */this.giftReturnStart=null;
  }

  /** @param {CanvasRenderingContext2D} context @param {SpriteBank} sprites @param {View} view @param {number} time */
  draw(context,sprites,view,time){
    const phase=view.storyPhase??view.scene,line=view.storyLine??0,reduced=Boolean(view.reducedMotion);
    if(this.phase!==phase){
      if(phase==='awakening'){this.arrivalStart=null;this.walkStart=null;this.departureStart=null;this.wakeStart=null;}
      if(phase==='clearing')this.walkStart=null;
      if(phase==='reunion'){this.departureStart=null;this.giftStart=null;this.giftReturnStart=null;}
      this.phase=phase;
    }
    const beat=`${phase}:${line}:${view.storyPose??''}`;
    if(this.beat!==beat){this.beat=beat;this.beatStart=time;}
    const beatElapsed=Math.max(0,time-this.beatStart),animationTime=reduced?0:time;
    const heroId=view.heroSpeciesId??'pokemon-025',partnerId=view.partnerSpeciesId??'pokemon-004';
    const clearing=view.scene==='clearing',reunion=view.scene==='reunion'||view.scene==='complete';
    const named=phase==='named',awakening=phase==='awakening';
    /** @type {FieldActor} */const hero={speciesId:heroId,x:112,y:clearing?116:104,direction:clearing||reunion?'n':'e'};
    /** @type {FieldActor} */const partner={speciesId:partnerId,x:144,y:clearing?116:104,direction:clearing||reunion?'n':'w'};
    /** @type {FieldActor[]} */const actors=[hero,partner];

    if(awakening&&line<=2)hero.clip='story-sleep';
    if(awakening&&line>=3){
      this.wakeStart??=time;
      const awakeFor=time-this.wakeStart;
      hero.direction=!reduced&&awakeFor>=200&&awakeFor<400?'w':'e';
    }

    if(named&&line>=2){
      this.arrivalStart??=time;
      const arrival=followPath(BUTTERFREE_APPROACH,reduced?Infinity:time-this.arrivalStart);
      actors.push({speciesId:'pokemon-012',...arrival,clip:arrival.moving?'walk':'idle'});
      hero.direction=arrival.x<100?'w':'n';partner.direction=arrival.x<100?'nw':'n';
    }else if(view.scene==='trouble'){
      hero.direction='n';partner.direction='n';
      const facing=phase==='trouble'&&!reduced?/** @type {Direction[]} */(['w','s','e','s'])[Math.floor(animationTime/(30*FRAME_MS))%4]??'s':'s';
      actors.push({speciesId:'pokemon-012',x:128,y:80,direction:facing});
    }

    if(clearing){
      if(line>=1)this.walkStart??=time;
      const elapsed=this.walkStart===null?0:reduced?88*FRAME_MS:Math.max(0,time-this.walkStart);
      const progress=this.walkStart===null?0:Math.min(1,elapsed/(88*FRAME_MS));
      hero.y=204-88*progress;partner.y=204-88*progress;
      hero.clip=partner.clip=progress>0&&progress<1?'walk':'idle';
      hero.time=partner.time=elapsed;
      actors.push({speciesId:'pokemon-010',x:128,y:76,direction:line<2?'n':'s',jump:line===4&&!reduced?this.jump(beatElapsed):0});
    }

    if(reunion){
      const leaving=view.scene==='complete'||line>=8;
      if(leaving)this.departureStart??=time;
      const departed=this.departureStart!==null;
      const distance=this.departureStart===null?0:reduced?216:Math.max(0,time-this.departureStart)/FRAME_MS;
      if(phase==='reunion'&&line>=4)this.giftStart??=time;
      if(phase==='reunion'&&line>=6)this.giftReturnStart??=time;
      const giftStep=this.giftStart===null?0:this.giftReturnStart!==null?(reduced?0:Math.max(0,8-(time-this.giftReturnStart)/(2*FRAME_MS))):(reduced?8:Math.min(8,(time-this.giftStart)/(2*FRAME_MS)));
      actors.push({speciesId:'pokemon-012',x:144+Math.min(184,distance),y:76+giftStep,direction:departed?'e':'s',clip:departed?'walk':'idle'});
      actors.push({speciesId:'pokemon-010',x:112+Math.min(192,distance),y:76,direction:departed?'e':'s',clip:departed?'walk':'idle',jump:!departed&&(line===1||line===6)&&!reduced?this.jump(beatElapsed):0});
      if(departed){hero.direction='e';partner.direction=distance<144?'e':'w';}
    }

    if(view.storyPose==='surprise'){
      const speaker=actors.find(actor=>actor.speciesId===view.dialogue?.portraitSpeciesId);
      if(speaker){speaker.jump=reduced?0:this.jump(beatElapsed);speaker.surprised=beatElapsed<750||reduced;}
    }
    actors.sort((left,right)=>left.y-right.y);
    for(const actor of actors){
      // Exact Blue ss02 map crop and native AX pose matching establish the DS
      // viewport center at(129,108), twelve pixels below the nominal midpoint.
      actor.x+=1;actor.y+=12;
      const jump=actor.jump??0;
      sprites.draw(context,actor.speciesId,actor.x,actor.y,{direction:actor.direction,clip:actor.clip??'idle',time:actor.time??animationTime,lift:jump});
      if(actor.surprised){
        const x=Math.round(actor.x+7),y=Math.round(actor.y-39-jump);
        context.fillStyle='#3c445b';context.fillRect(x-1,y-2,10,13);context.fillStyle='#fffde8';context.fillRect(x,y-1,8,11);
        context.fillRect(x+1,y+10,3,2);text(context,'!',x+2,y+1,{color:'#bf4a45',shadow:false});
      }
    }
  }

  /** @param {number} elapsed */
  jump(elapsed){return elapsed<300?Math.round(8*Math.sin(Math.PI*Math.max(0,elapsed)/300)):0;}
}
