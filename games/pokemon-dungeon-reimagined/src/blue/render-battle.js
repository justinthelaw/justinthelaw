import {TILE} from './render-terrain.js';

/** @typedef {import('./battle-presentation.js').BattleFrame} BattleFrame */
/** @typedef {import('./battle-presentation.js').BattleActor} BattleActor */
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./render-native-sprites.js').PoseOptions} PoseOptions */
/** @typedef {import('./render-battle-effects.js').EffectLayerSample} EffectLayerSample */

const BACK_DIRECTIONS=new Set(['ne','n','nw']);
const depth=(/** @type {number} */value)=>Math.max(0,Math.min(255,value));

/** Draw the supplied presentation state without advancing any clock or game.
 * Native shadows stay behind bodies; each effect's depth layers remain distinct.
 * @param {CanvasRenderingContext2D} context
 * @param {import('./render-native-sprites.js').SpriteBank} sprites
 * @param {import('./render-status.js').StatusSprites} statuses
 * @param {import('./render-battle-effects.js').BattleEffects} effects
 * @param {DungeonState} state @param {BattleFrame|undefined} battle
 * @param {number} cameraX @param {number} cameraY @param {number} time
 * @param {{fullyLit:boolean,reducedMotion:boolean}} options */
export function drawBattleActors(context,sprites,statuses,effects,state,battle,cameraX,cameraY,time,options){
  /** @type {BattleActor[]} */
  const tracks=battle?.actors??[state.hero,state.partner,...state.enemies].map(actor=>({actor,x:actor.x,y:actor.y,direction:actor.direction,clip:actor.status.sleep?'rest-sleep':actor.status.bide?'bide-hold':'idle',elapsedTicks:time*60/1000,visible:actor.hp>0}));
  if(tracks.length>12||(battle?.effects.length??0)>24)throw new RangeError('Battle presentation exceeds the opening drawing bound.');
  /** @type {Map<string,number>} */const statusHp=new Map();
  for(const track of tracks)if(track.statusHp!==undefined)statusHp.set(track.actor.id,track.statusHp);
  statuses.beginFrame(state,time,{reducedMotion:options.reducedMotion,statusHp});
  /** @type {Map<string,{track:BattleActor,x:number,y:number,pose:PoseOptions,visible:boolean}>} */
  const actors=new Map();
  /** @type {({kind:'actor',depth:number,order:number,id:string}|{kind:'effect',depth:number,order:number,layer:EffectLayerSample,x:number,y:number})[]} */
  const drawing=[];
  for(const track of tracks){
    const actor=track.actor,x=Math.round(track.x*TILE+12-cameraX),y=Math.round(track.y*TILE+16-cameraY);
    const visible=track.visible&&(options.fullyLit||actor.id==='hero'||actor.id==='partner'||Boolean(state.visible[actor.y*state.width+actor.x]));
    const pose={direction:track.direction,clip:track.clip,animation:track.animation,ticks:options.reducedMotion?0:track.elapsedTicks};
    actors.set(actor.id,{track,x,y,pose,visible});
    if(!visible)continue;
    sprites.drawShadow(context,actor.speciesId,x,y,{...pose,dungeon:true,teamShadow:actor.id==='hero'||actor.id==='partner'});
    drawing.push({kind:'actor',id:actor.id,depth:depth(Math.trunc(y/2)),order:drawing.length});
  }
  if(!options.reducedMotion)for(const effect of battle?.effects??[]){
    const sample=effects.sample(effect.id,effect.direction,effect.elapsedTicks);if(!sample)continue;
    const generic=effect.generic===true,member=effect.actorId?actors.get(effect.actorId):undefined;
    let x,y,feetY;
    if(effect.x!==undefined&&effect.y!==undefined){x=effect.x-cameraX;y=effect.y-cameraY;feetY=y;}
    else if(member){
      if(!member.visible)continue;
      x=member.x;y=member.y;feetY=member.y;
      const attachment=sprites.attachmentOffset(member.track.actor.speciesId,member.pose,effect.attachmentSet??sample.attachmentSet);
      if(!attachment)continue;
      if(attachment.valid){x+=attachment.x;y+=attachment.y;}
      else if(!generic)continue;
    }else continue;
    if(!Number.isFinite(x)||!Number.isFinite(y))throw new RangeError('Invalid battle effect position.');
    const sourceDepth=effect.depthY!==undefined||effect.depthAdd!==undefined;
    if(sourceDepth&&(!Number.isFinite(effect.depthY)||effect.depthAdd!==0&&effect.depthAdd!==1))throw new RangeError('Invalid native projectile depth.');
    // Travel depth uses unoffset feet and the source 0/1 direction table;
    // neither attachment convergence nor effect frame offsets move this anchor.
    const base=sourceDepth?Math.trunc(((effect.depthY??0)-cameraY)/2)+(effect.depthAdd??0):Math.trunc(feetY/2)+(generic?1:sample.directional&&BACK_DIRECTIONS.has(effect.direction)?-3:3);
    for(const layer of sample.layers)drawing.push({kind:'effect',depth:depth(base+layer.depthOffset),order:drawing.length,layer,x,y});
  }
  drawing.sort((left,right)=>left.depth-right.depth||left.order-right.order);
  for(const record of drawing){
    if(record.kind==='effect'){effects.drawLayer(context,record.layer,record.x,record.y);continue;}
    const member=actors.get(record.id);if(!member)continue;
    const attachment=sprites.draw(context,member.track.actor.speciesId,member.x,member.y,{...member.pose,shadow:false,dungeon:true});
    statuses.draw(context,member.track.actor,attachment);
  }
}
