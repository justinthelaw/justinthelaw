import { advanceCameraCounter, cameraChangeFrames } from './dungeon-camera.js';
import { cameraDiscovery } from './mechanics-visibility.js';
/** Playback of committed battle evidence. The comparative native sources are
 * dungeon_entity_movement.c, code_8040094_1.c, dungeon_damage.c and
 * dungeon_vram.c at the pinned Rescue Team reference. No gameplay is replayed.
 * Native cosmetic animation-start jitter is deliberately zero here; Blue binary
 * timing and effect routes without exported artwork remain qualified. */
import {captureWorld} from './battle-events.js';

/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */
/** @typedef {import('./mechanics-types.js').ActionResult} ActionResult */
/** @typedef {import('./battle-events.js').BattleWorld} BattleWorld */
/** @typedef {[number,number,number,number,number,number,number]} NativeFrame */
/** @typedef {{animation:number,preparation:number,cast:number,target:number,travel:number,attachmentSet:number,travelSpeed:number}} MoveEffects */
/** @typedef {{hypnosisReady:()=>boolean,animationInfo:(speciesId:string,animation:number,direction:string)=>{frames:readonly NativeFrame[],totalTicks:number}|undefined,effectInfo:(id:number,direction:string)=>{ticks:number,attachmentSet:number,loop:boolean,blocksWait:boolean}|undefined,moveEffects:(moveId:string,speciesId:string)=>MoveEffects|undefined,attachmentOffset:(speciesId:string,pose:import('./render-native-sprites.js').PoseOptions,setId:number)=>{x:number,y:number,valid:boolean}|undefined}} BattleAssets */
/** @typedef {{actor:Actor,x:number,y:number,direction:string,animation?:number,clip:string,elapsedTicks:number,visible:boolean,statusHp?:number}} BattleActor */
/** @typedef {{id:number,actorId?:string,x?:number,y?:number,direction:string,elapsedTicks:number,attachmentSet?:number,generic?:boolean,depthY?:number,depthAdd?:0|1}} BattleEffect */
/** @typedef {{actorId:string,amount:number,heal:boolean,miss:boolean,elapsedTicks:number}} BattleNumber */
/** @typedef {{kind:import('./mechanics-types.js').ItemKind,x:number,y:number}} BattleProjectile */
/** @typedef {import('./dungeon-camera.js').CameraSnapshot} CameraSnapshot */
/** @typedef {{dungeon:DungeonState,actors:BattleActor[],effects:BattleEffect[],projectiles:BattleProjectile[],number:BattleNumber|null,active:boolean,camera:CameraSnapshot,hypnosis:{elapsedTicks:number|null,hideHud:boolean,hideMap:boolean}|null}} BattleFrame */
/** @typedef {{at:number,ordinal:number,actors?:Actor[],items?:import('./mechanics-types.js').GroundItem[],explored?:boolean[],discovered?:readonly number[],camera?:CameraSnapshot,money?:number,hide?:string,message?:string,statusHp?:{actorId:string,hp:number},clearStatusHp?:string}} Patch */
/** @typedef {{actorId:string,start:number,end:number,idleAt?:number,animation?:number,clip:string,direction:string,from?:{x:number,y:number},to?:{x:number,y:number},moveEnd?:number,walkEpoch?:number,walkCycle?:number,repeatTicks?:number,rotate?:98|99}} PoseTrack */
/** @typedef {{x:number,y:number,depthY:number,depthAdd:0|1,visible:boolean}} TravelSample */
/** @typedef {{id:number,actorId?:string,start:number,end:number,waitEnd?:number,direction:string,attachmentSet?:number,generic?:boolean,depthY?:number,depthAdd?:0|1,frameTicks?:number,elapsedOffset?:number,from?:{x:number,y:number},to?:{x:number,y:number},samples?:readonly TravelSample[]}} EffectTrack */
/** @typedef {{actorId:string,amount:number,heal:boolean,miss:boolean,start:number,end:number}} NumberTrack */
/** @typedef {{event:GameEvent,audible:boolean}|{sound:'heal'|'heart',audible:boolean}|{clearNotice:true}} PresentationCue */
/** @typedef {PresentationCue & {at:number,ordinal:number}} BattleCue */
/** @typedef {{poses:PoseTrack[],effects:EffectTrack[],number:BattleNumber|null}} BattleCarry */

const TICK_MS=1000/60;
// Conservative current producer bound:74 target/hit pieces*32 +198 levels*6
// +13 opportunity wrappers*32 +37 residual calls*16 +12 item actions*16
// +12 admitted initial-sleep wakes*8 +64 setup =4916. A conservative365
// camera-boundary allowance gives5281, still below8192. Native wild admission is
// narrower. This rejection boundary never truncates an admitted event stream.
const MAX_EVENTS=8192,MAX_ACTORS=12,MAX_ITEMS=64;

/** Source flag bits accumulate as frames are loaded. The first frame is loaded
 * on the first nominal source tick; no random delay is added by this owner.
 * @param {readonly NativeFrame[]} frames @param {number} flag */
function firstFlag(frames,flag){
  let ticks=1;
  for(const frame of frames){if(frame[6]&flag)return ticks;ticks+=frame[1];}
  return null;
}

export class BattlePresentation {
  /** @param {BattleWorld} before @param {ActionResult} result
   * @param {DungeonState} dungeon @param {BattleAssets} assets
   * @param {{now:number,rawPauseBefore?:number,fast?:boolean,running?:boolean,reducedMotion?:boolean,carry?:BattleCarry,camera?:CameraSnapshot,farOffPals?:boolean}} options */
  constructor(before,result,dungeon,assets,options){
    if(result.events.length>MAX_EVENTS||before.actors.length>MAX_ACTORS||before.items.length>MAX_ITEMS)throw new RangeError('Battle presentation evidence exceeds the opening bound.');
    this.dungeon=dungeon;this.before=before;this.after=captureWorld(dungeon);this.startedAt=options.now;
    this.rawPauseBefore=options.rawPauseBefore??0;
    /** @type {number|null} */this.finishedRawPauseMs=null;
    /** @type {number[]} */this.rawHolds=[];
    /** @type {{takeover:number,start:number,end:number}[]} */this.backgrounds=[];
    /** @type {Patch[]} */this.patches=[];
    const sameFloor=before.tiles===dungeon.tiles&&before.floor===dungeon.floor;
    const initial=sameFloor?(options.camera??{target:'hero',counter:0}):{target:'hero',counter:99};
    if(initial.target!=='hero'&&initial.target!=='partner')throw new RangeError('Invalid battle camera.');
    /** @type {CameraSnapshot} */this.initialCamera={target:initial.target,counter:advanceCameraCounter(initial.counter,0)};
    /** @type {CameraSnapshot} */this.camera={...this.initialCamera};
    this.cameraTick=0;this.sourceEndTick=0;
    /** @type {number[]} */this.discoveredTiles=[];
    const carry=sameFloor?options.carry:undefined;
    /** @type {PoseTrack[]} */this.poses=carry?.poses.map(track=>({...track}))??[];
    /** @type {EffectTrack[]} */this.effects=carry?.effects.map(track=>({...track}))??[];
    /** @type {NumberTrack[]} */this.numbers=[];
    /** @type {{kind:import('./mechanics-types.js').ItemKind,start:number,end:number,from:{x:number,y:number},to:{x:number,y:number}}[]} */this.projectiles=[];
    /** @type {BattleCue[]} */this.cues=[];
    this.patchIndex=0;this.cueIndex=0;this.completed=false;this.endTick=0;this.lastTick=0;
    this.instant=Boolean(options.reducedMotion||before.tiles!==dungeon.tiles||before.floor!==dungeon.floor);
    const floorChanged=before.tiles!==dungeon.tiles||before.floor!==dungeon.floor;
    /** @type {Map<string,Actor>} */this.actors=new Map((floorChanged?this.after.actors:before.actors).map(actor=>[actor.id,actor]));
    this.items=floorChanged?this.after.items:before.items;this.money=before.money;this.log=[...before.log];
    this.explored=[...(floorChanged?this.after.explored:before.explored)];
    /** Pre-heal HP is retained only for the low-HP warning during its helper. */
    /** @type {Map<string,number>} */this.statusHp=new Map();
    // A new menu/learning receipt can follow a fainted team member. Native
    // HandleFaint's visibility survives that result boundary.
    /** @type {Set<string>} */this.hidden=new Set([...this.actors.values()].filter(actor=>actor.hp<=0).map(actor=>actor.id));
    if(carry?.number&&carry.number.elapsedTicks<60)this.numbers.push({...carry.number,start:-carry.number.elapsedTicks,end:60-carry.number.elapsedTicks});
    this.compile(result,assets,options);
    if(options.reducedMotion)this.endTick=0;
  }

  /** @param {ActionResult} result @param {BattleAssets} assets
   * @param {{fast?:boolean,running?:boolean,reducedMotion?:boolean,farOffPals?:boolean}} options */
  compile(result,assets,options){
    let cursor=0,ordinal=0,patchSequence=0,messageAt=0,soundCount=0;
    let camera={...this.initialCamera},cameraTick=0;
    const discovered=[...this.after.explored];
    /** @type {Map<string,{actor:Actor,segments:{from:{x:number,y:number},to:{x:number,y:number}}[]}>} */const walking=new Map();
    /** @type {{event:GameEvent,ordinal:number}[]} */let afterWalk=[];
    /** @type {Map<string,MoveEffects>} */const moves=new Map();
    /** @type {Map<string,number>} */const damageHpAt=new Map();
    const hiddenActors=new Set(this.before.actors.filter(actor=>actor.hp<=0).map(actor=>actor.id));
    const floorChanged=this.before.tiles!==this.dungeon.tiles||this.before.floor!==this.dungeon.floor;
    // Source-event ordinals order semantic cues. Emission ordinals order
    // visual patches: a flushed walk must apply before its deferred pickup,
    // even though that pickup was recorded earlier than the flush itself.
    /** @param {Patch} patch */const addPatch=patch=>this.patches.push({...patch,ordinal:patchSequence++});
    /** @param {GameEvent} event @param {number} at @param {number} order @param {boolean} [audible] */
    const cue=(event,at,order,audible=true)=>{
      if(event.type==='presentation'&&event.presentation?.kind!=='miss')return;
      this.cues.push({event,at,ordinal:order,audible});
      if(event.type==='message'&&event.text)addPatch({at,ordinal:order,message:event.text});
    };
    /** @param {Actor[]} actors @param {number} at */
    const patchActors=(actors,at)=>addPatch({at,ordinal:ordinal++,actors});
    /** Tiny Woods is fully lit; this is only the native camera tile window,
     * not AI sight or a replay of gameplay geometry. */
    const focusAtCursor=()=>{
      const focus=this.latestActor(camera.target,cursor);
      if(!focus)throw new RangeError('The camera member snapshot is missing.');
      return sampledActor(focus,this.poses,cursor,Math.floor((this.startedAt-this.rawPauseBefore+cursor*TICK_MS)/TICK_MS));
    };
    /** @param {{x:number,y:number}} point */
    const visibleTile=point=>{
      const focus=focusAtCursor();
      return Math.abs(point.x-focus.x)<=6&&Math.abs(point.y-focus.y)<=5;
    };
    /** The comparative source adds a32px sprite margin. The viewport itself
     * is Blue's256x192; its exact binary margin remains unverified.
     * @param {{x:number,y:number}} point */
    const displayed=point=>{
      if(!visibleTile(point))return false;
      const focus=focusAtCursor();
      const x=(point.x-focus.x)*24+128,y=(point.y-focus.y)*24+108;
      return x>=-32&&x<=288&&y>=-32&&y<=224;
    };
    /** sub_8042768 checks native isVisible before viewport admission.
     * @param {Actor} actor */
    const displayedActor=actor=>!hiddenActors.has(actor.id)&&displayed(actor);
    /** @param {number} id @param {Actor} actor @param {number} at @param {number|undefined} [attachmentSet] @param {string} [direction] @param {number} [waitLimit] @param {boolean} [generic] @param {boolean} [fixed] @param {boolean} [terminalHold] */
    const effect=(id,actor,at,attachmentSet,direction=actor.direction,waitLimit=Infinity,generic=false,fixed=false,terminalHold=false)=>{
      if(!displayedActor(actor))return at;
      const info=assets.effectInfo(id,direction);if(!info)return at;
      // Effect creation initializes an unloaded pose. Its first source frame
      // loads on the next tick; the terminator is visited after its last tick.
      // These newly joined application helpers retain the terminator draw;
      // sub_800DD0C removes their handle on the following source frame.
      const start=at+1,end=start+info.ticks+(terminalHold?1:0);
      /** @type {EffectTrack} */const track={id,actorId:actor.id,start,end,direction,attachmentSet:attachmentSet??info.attachmentSet,generic,...(terminalHold?{frameTicks:info.ticks}:{})};
      if(fixed){
        // sub_8041550 captures attachment and unoffset depth once, after its
        // TRUE drain. These two newly joined helpers use that static anchor.
        const pose=sampledActor(actor,this.poses,at,Math.floor((this.startedAt-this.rawPauseBefore+at*TICK_MS)/TICK_MS));
        const offset=assets.attachmentOffset(actor.speciesId,{direction:pose.direction,animation:pose.animation,clip:pose.clip,ticks:pose.elapsedTicks},track.attachmentSet??-1);
        if(!offset||!Number.isInteger(offset.x)||!Number.isInteger(offset.y))throw new RangeError('Native application attachment is unavailable.');
        const valid=offset.x!==99&&offset.y!==99,feetX=pose.x*24+12,feetY=pose.y*24+16;
        const position={x:feetX+(valid?offset.x:0),y:feetY+(valid?offset.y:0)};
        track.from=position;track.to=position;track.depthY=feetY;track.depthAdd=1;
      }
      this.effects.push(track);
      // The native effect owner requests sound once on its first source frame.
      // Carried tracks and repeated draws never enter this creation path.
      if(id===7||id===15){
        if(++soundCount>MAX_EVENTS)throw new RangeError('Effect sound receipts exceed the opening bound.');
        this.cues.push({sound:id===7?'heal':'heart',at:start,ordinal:ordinal++,audible:true});
      }
      return info.blocksWait===false?at:Math.min(end,at+waitLimit);
    };
    const drainEffects=()=>{
      const end=this.effects.reduce((maximum,track)=>Math.max(maximum,track.waitEnd??track.end),cursor);
      if(end>cursor)cursor=Math.min(end,cursor+1000)+2;
      // The TRUE native drain clears remaining effects after its bounded wait.
      // A removed projectile may retain the screen drawn on that source tick;
      // its separate waitEnd never occupies a later effect drain.
      for(const track of this.effects)if(track.waitEnd===undefined||track.waitEnd>cursor)track.end=Math.min(track.end,cursor);
    };
    /** Explicit native requests share the menu owner's finite counter algebra.
     * Only LOOK requests apply the preference/offscreen test; input and wind do not.
     * @param {Actor} actor @param {'look'|'leader'|'input'} mode */
    const requestCamera=(actor,mode)=>{
      if(actor.id!=='hero'&&actor.id!=='partner'||actor.id==='hero'&&actor.hp<=0)return;
      if(mode==='input'){
        camera={target:camera.target,counter:0};cameraTick=cursor;
        addPatch({at:cursor,ordinal:ordinal++,camera:{...camera}});
      }
      if(mode==='look'&&(options.farOffPals===false||displayedActor(actor)))return;
      if(camera.target===actor.id)return;
      drainEffects();
      const counter=advanceCameraCounter(camera.counter,cursor-cameraTick);
      cursor+=cameraChangeFrames(counter,true);
      camera={target:actor.id,counter:0};cameraTick=cursor;
      addPatch({at:cursor,ordinal:ordinal++,camera:{...camera}});
      const delta=cameraDiscovery(this.dungeon,actor,discovered);
      for(const index of delta)discovered[index]=true;
      this.discoveredTiles.push(...delta);
      if(delta.length)addPatch({at:cursor,ordinal:ordinal++,discovered:delta});
    };
    const finishAttackTails=()=>{
      /** @type {Map<string,PoseTrack>} */const current=new Map();
      for(const track of this.poses)if(track.start<=cursor)current.set(track.actorId,track);
      for(const track of current.values())if(track.animation!==undefined&&track.animation>=1&&track.animation<=4)cursor=Math.max(cursor,Math.min(track.end,cursor+100));
    };
    /** A source pose change supersedes the old animation, including its tail
     * wait. Do not resurrect a canceled cast through a historical track.
     * @param {string} actorId @param {number} at */
    const retirePose=(actorId,at)=>{for(const track of this.poses)if(track.actorId===actorId&&track.start<=at&&track.end>at)track.end=at;};
    /** @param {PoseTrack} track */
    const pose=track=>{retirePose(track.actorId,track.start);this.poses.push(track);};
    /** @param {GameEvent} event @param {number} order */
    const sync=(event,order)=>{
      const record=event.presentation;
      if(record?.kind==='sync'){
        for(const actor of record.actors){
          const active=lastMatching(this.poses,track=>track.actorId===actor.id&&track.start<=cursor&&track.end>cursor);
          const previous=this.latestActor(actor.id,cursor);
          // Native facing selects the current normal pose immediately. HP,
          // items and tactics must not restart an unchanged walking phase.
          const sleepPoseChanged=previous&&Boolean(previous.status.sleep)!==Boolean(actor.status.sleep);
          if(active&&(active.direction!==actor.direction||sleepPoseChanged))retirePose(actor.id,cursor);
        }
        addPatch({at:cursor,ordinal:order,actors:record.actors,items:record.items,money:record.money});
      }
      cue(event,cursor,order);
    };
    const flushWalk=()=>{
      if(!walking.size)return;
      const anyVisible=[...walking.values()].some(walk=>displayed(walk.segments[0]?.from??walk.actor));
      const duration=options.running||options.reducedMotion||!anyVisible?0:options.fast?12:24;
      for(const [id,walk] of walking){
        const count=walk.segments.length;
        if(count>4)throw new RangeError('A native movement group exceeds four tiles.');
        walk.segments.forEach((segment,index)=>{
          const start=cursor+duration*index/count,end=cursor+duration*(index+1)/count;
          const dx=segment.to.x-segment.from.x,dy=segment.to.y-segment.from.y;
          const direction=directionFor(dx,dy);
          if(duration===0){retirePose(id,start);return;}
          const info=assets.animationInfo(walk.actor.speciesId,0,direction);
          const previous=lastMatching(this.poses,track=>track.actorId===id&&track.start<=start&&track.end>start);
          // sub_806CDFC leaves an existing same-direction motion0 alone. Each
          // source cycle includes its terminator frame; no cosmetic RNG delay
          // is introduced. Different directions start a fresh sequence.
          const cycle=(info?.totalTicks??24)+1;
          const epoch=previous?.animation===0&&previous.direction===direction&&previous.walkEpoch!==undefined
            ?previous.walkEpoch:start+1;
          // DisplayActions updates the final pixel after its last run frame.
          // The next frame observes that last movement, then three stationary
          // frames accrue; the following animation-boundary check can idle.
          const idleEligible=end+5;
          const tailEnd=epoch+Math.max(1,Math.ceil((idleEligible-epoch)/cycle))*cycle;
          pose({actorId:id,start,end:tailEnd,moveEnd:end,walkEpoch:epoch,walkCycle:cycle,animation:0,clip:'walk',direction,from:segment.from,to:segment.to});
        });
        patchActors([walk.actor],cursor+duration);
      }
      if(walking.has('hero'))addPatch({at:cursor+duration,ordinal:ordinal++,explored:this.after.explored});
      cursor+=duration;walking.clear();messageAt=cursor;
      for(const deferred of afterWalk)sync(deferred.event,deferred.ordinal);
      afterWalk=[];
    };
    /** @param {Actor} actor @param {number} amount @param {boolean} heal @param {boolean} [miss] */
    const number=(actor,amount,heal,miss=false)=>{
      if(amount===0)return cursor;
      const previous=this.numbers.at(-1);
      if(previous&&previous.end>cursor)cursor=Math.min(previous.end,cursor+20);
      this.numbers.push({actorId:actor.id,amount,heal,miss,start:cursor,end:cursor+60});
      return cursor;
    };
    /** Replay only the visual segment already chosen by the producer. No wall
     * or recipient scan occurs here. @param {string} moveId @param {MoveEffects} route @param {Actor} caster
     * @param {{x:number,y:number}} from @param {{x:number,y:number}} to */
    const travel=(moveId,route,caster,from,to)=>{
      if(!route.travel||route.travelSpeed<=0)return;
      const distance=Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y));
      if(!Number.isInteger(distance)||distance>10)throw new RangeError('A move projectile exceeds its recorded range.');
      // sub_8056564 advances once before creating a nonzero travel effect,
      // independently of the later per-cell camera visibility checks.
      cursor++;
      const info=assets.effectInfo(route.travel,caster.direction);
      const samples=info&&moveId==='move-ember'&&distance===1?emberTrajectory(assets,caster,this.poses,cursor,Math.floor((this.startedAt-this.rawPauseBefore+cursor*TICK_MS)/TICK_MS),route,from,to):undefined;
      const dx=Math.sign(to.x-from.x),dy=Math.sign(to.y-from.y),duration=24/route.travelSpeed;
      let elapsedOffset=0;
      for(let step=1;step<=distance;step++){
        const next={x:from.x+dx*step,y:from.y+dy*step};if(!visibleTile(next))continue;
        const previous={x:next.x-dx,y:next.y-dy};
        // The first loop RunFrame loads the new pose. Its last draw is at
        // +21px for Ember; deletion follows that eighth frame, before drain.
        if(info)this.effects.push({id:route.travel,start:cursor+1,end:cursor+duration+1,waitEnd:cursor+duration,direction:caster.direction,elapsedOffset,from:{x:previous.x*24+12,y:previous.y*24+16},to:{x:next.x*24+12,y:next.y*24+16},...(samples?{samples}:{})});
        cursor+=duration;elapsedOffset+=duration;
      }
      drainEffects();
    };
    /** NULL-actor target effects use tile feet and zero attachment offsets.
     * @param {number} id @param {{x:number,y:number}} point */
    const emptyImpact=(id,point)=>{
      const info=assets.effectInfo(id,'s');if(!info)return;
      const start=cursor+1,end=start+info.ticks,position={x:point.x*24+12,y:point.y*24+16};
      this.effects.push({id,start,end,direction:'s',from:position,to:position});
      // sub_8041168 always runs one frame after effect creation, even for a
      // nonblocking effect. The selected Ember effect317 then waits to finish.
      cursor=info.blocksWait?end:start;
    };

    for(const event of result.events){
      const order=ordinal++,record=event.presentation;
      if(floorChanged){cue(event,0,order);continue;}
      if(record?.kind==='flush'){flushWalk();messageAt=cursor;continue;}
      if(record?.kind==='sync'&&record.afterWalk&&walking.size){afterWalk.push({event,ordinal:order});continue;}
      if(record?.kind==='action'){
        finishAttackTails();drainEffects();
        if(record.action==='other'){flushWalk();if(record.cameraActor)requestCamera(record.cameraActor,'look');cursor++;}
        messageAt=cursor;continue;
      }
      if(record?.kind==='camera'){flushWalk();requestCamera(record.actor,record.mode);messageAt=cursor;continue;}
      if(record?.kind==='face'){
        // Rotate-mode input explicitly selects the normal idle pose even if
        // the requested heading is unchanged (dungeon_main.c420–425).
        retirePose(record.actor.id,cursor);patchActors([record.actor],cursor);
        messageAt=cursor;continue;
      }
      if(event.type==='move'&&event.actorId&&event.from&&event.to&&record?.kind==='move'){
        let walk=walking.get(event.actorId);
        if(!walk){walk={actor:record.actor,segments:[]};walking.set(event.actorId,walk);}
        walk.actor=record.actor;walk.segments.push({from:{...event.from},to:{...event.to}});continue;
      }
      if(record?.kind==='cast'){
        flushWalk();finishAttackTails();drainEffects();patchActors([record.actor],cursor);
        const route=assets.moveEffects(record.moveId,record.actor.speciesId);
        if(route)moves.set(record.actor.id,route);
        const start=cursor;messageAt=start;
        const visible=displayedActor(record.actor);
        cue(event.type==='presentation'?{type:'attack',actorId:record.actor.id,moveId:record.moveId}:event,start,order,visible);
        if(!visible)continue;
        if(route?.preparation&&record.first){
          if(record.moveId==='move-hypnosis'&&assets.hypnosisReady()){
            // BG upload owns one raw VBlank before the ordinary preparation
            // frame. It advances no actor/effect/camera dungeon-frame age.
            this.rawHolds.push(cursor);
            this.cues.push({clearNotice:true,at:cursor,ordinal:ordinal++});
            const start=cursor+2,end=start+44;
            this.backgrounds.push({takeover:cursor,start,end});
            this.effects.push({id:222,start,end,direction:'s'});
            cursor++;
          }else{cursor++;effect(route.preparation,record.actor,cursor);}
        }
        const animation=route?.animation;
        if(animation===98||animation===99){
          const duration=animation===99?16:18;
          if(route?.cast)effect(route.cast,record.actor,cursor+1,route.attachmentSet);
          pose({actorId:record.actor.id,start:cursor,end:cursor+duration,clip:'walk',direction:record.actor.direction,rotate:animation});
          cursor+=duration;
        }else if(animation!==undefined){
          const info=assets.animationInfo(record.actor.speciesId,animation,record.actor.direction);
          if(info){
            const castAt=animation===9?1:firstFlag(info.frames,2),releaseAt=firstFlag(info.frames,1)??info.totalTicks+2;
            // The nested cast creation advances one source frame. It only
            // delays the exit when flag1 is reached on that nested frame or
            // was already sampled together with flag2; it does not stretch
            // every remaining sprite frame by one tick.
            const launches=Boolean(route?.cast&&castAt!==null&&castAt<=Math.min(120,releaseAt));
            const castDelay=launches&&(releaseAt===castAt||releaseAt===(castAt??0)+1)?1:0;
            const release=Math.min(releaseAt+castDelay,120+(launches?1:0));
            pose({actorId:record.actor.id,start:cursor+1,end:cursor+info.totalTicks+2,clip:'attack-physical',animation,direction:record.actor.direction,
              ...(record.moveId==='move-ember'&&animation===3?{idleAt:cursor+info.totalTicks+2}:{})});
            if(route?.cast&&castAt!==null&&launches)effect(route.cast,record.actor,cursor+castAt+1,route.attachmentSet);
            cursor+=release;
          }
        }
        continue;
      }
      if(record?.kind==='target'){
        flushWalk();patchActors([record.target],cursor);
        const route=moves.get(record.actorId);
        if(route?.travel&&route.travelSpeed>0){
          const caster=this.latestActor(record.actorId,cursor);
          if(caster)travel(record.moveId,route,caster,caster,record.target);
        }
        // Actual-target focus follows projectile travel, before its impact.
        requestCamera(record.target,'look');
        if(displayedActor(record.target)){
          cursor+=4;
          if(route?.target)cursor=effect(route.target,record.target,cursor,undefined,'s');
        }
        messageAt=cursor;continue;
      }
      if(record?.kind==='empty-target'){
        flushWalk();
        const caster=this.latestActor(record.actorId,cursor);
        const route=caster?assets.moveEffects(record.moveId,caster.speciesId):undefined;
        if(Math.max(Math.abs(record.to.x-record.from.x),Math.abs(record.to.y-record.from.y))!==1)throw new RangeError('An empty opening projectile endpoint must be adjacent.');
        if(caster&&route){
          travel(record.moveId,route,caster,record.from,record.to);
          if(visibleTile(record.to)){
            cursor++; // Empty adjacent impact uses one frame, not a target's4.
            if(route.target)emptyImpact(route.target,record.to);
          }
        }
        messageAt=cursor;continue;
      }
      if(record?.kind==='damage'){
        flushWalk();patchActors([record.before],cursor);
        const visible=displayedActor(record.before),reaction=visible&&(record.cause!=='hunger'||record.before.hp<=1);
        if(visible&&record.cause!=='hunger')number(record.before,record.amount,false);
        messageAt=cursor;cue(event,cursor,order,visible);
        const start=cursor;
        if(reaction){
          const id=[8,9,10,11][record.effectiveness]??10;
          cursor=effect(id,record.before,cursor,3,record.before.direction,100,true);
          const repeatTicks=(assets.animationInfo(record.before.speciesId,6,record.before.direction)?.totalTicks??10)+1;
          pose({actorId:record.before.id,start:start+1,end:cursor+10,clip:'hit-light',animation:6,repeatTicks,direction:record.before.direction});
        }
        patchActors([record.after],cursor);damageHpAt.set(record.after.id,cursor);
        if(reaction)cursor+=10;
        continue;
      }
      if(record?.kind==='survival'){
        // Native survival text follows the HP clamp, before the hit wait.
        cue(event,damageHpAt.get(record.actorId)??cursor,order);messageAt=cursor;continue;
      }
      if(record?.kind==='no-damage'){
        flushWalk();
        const visible=displayedActor(record.actor)&&displayedActor(record.target);
        // The raw-zero branch announces once, then either sounds its native
        // team/other cue or waits30 frames. It never enters the hit/MISS path.
        cue(event,cursor,order,visible);if(!visible)cursor+=30;
        messageAt=cursor;continue;
      }
      if(record?.kind==='miss'){
        flushWalk();const attacker=record.actorId?this.latestActor(record.actorId,cursor):undefined;
        const visible=displayedActor(record.target)&&(record.accuracy!==2||Boolean(attacker&&displayedActor(attacker)));
        if(visible)number(record.target,9999,true,true);messageAt=cursor;cue(event,cursor,order,visible);continue;
      }
      if(record?.kind==='heal'){
        flushWalk();patchActors([record.after],cursor);
        addPatch({at:cursor,ordinal:order,statusHp:{actorId:record.before.id,hp:record.before.hp}});
        const visible=displayedActor(record.after);
        // Native HP changes before the application helper drains old effects.
        // Its sound begins on the new effect's first frame, before result text.
        if(visible)drainEffects();
        const start=cursor;
        cursor=effect(7,record.after,cursor,undefined,record.after.direction,100,true,true,true);
        cue(event,cursor>start?start+1:start,order,visible&&cursor>start);
        messageAt=cursor;continue;
      }
      if(record?.kind==='heal-result'){
        // Native UpdateStatusIconFlags follows the helper, before result text.
        addPatch({at:cursor,ordinal:order,clearStatusHp:record.actor.id});
        // HealTargetHP reports the result before requesting the singleton
        // positive number. A prior number must not delay the message itself.
        cue(event,cursor,order);
        if(record.amount>0&&displayedActor(record.actor))number(record.actor,record.amount,true);
        messageAt=cursor;continue;
      }
      if(record?.kind==='effect'){
        flushWalk();patchActors([record.before],cursor);
        if(displayedActor(record.before))drainEffects();
        if(record.effectId!==undefined)cursor=effect(record.effectId,record.before,cursor,undefined,record.before.direction,100,true,record.effectId===15,record.effectId===15);
        if(Boolean(record.before.status.sleep)!==Boolean(record.after.status.sleep))retirePose(record.after.id,cursor);
        patchActors([record.after],cursor);messageAt=cursor;cue(event,cursor,order);continue;
      }
      if(record?.kind==='faint'){
        flushWalk();retirePose(record.actor.id,cursor);addPatch({at:cursor,ordinal:order,actors:[record.actor],hide:record.actor.id});
        messageAt=cursor;cue(event,cursor,order,displayedActor(record.actor));hiddenActors.add(record.actor.id);
        if(record.actor.id!=='hero'&&record.actor.id!=='partner'){
          // HandleFaint deletes an ordinary wild entity. The global number
          // slot stops occupying time when that entity becomes invalid.
          for(const track of this.numbers)if(track.actorId===record.actor.id)track.end=Math.min(track.end,cursor);
        }else if(record.actor.id==='hero'){
          // The native leader is hidden, then retained for60 frames before
          // the loss/message-log owner. The original partner returns earlier.
          cursor+=60;
        }
        continue;
      }
      if(event.type==='throw'&&event.from&&event.to&&(event.text==='oran-berry'||event.text==='pecha-berry'||event.text==='rawst-berry')){
        flushWalk();finishAttackTails();drainEffects();
        const duration=6*Math.max(Math.abs(event.to.x-event.from.x),Math.abs(event.to.y-event.from.y));
        this.projectiles.push({kind:event.text,start:cursor,end:cursor+duration,from:{x:event.from.x*24+12,y:event.from.y*24+12},to:{x:event.to.x*24+12,y:event.to.y*24+12}});
        cue(event,cursor,order);cursor+=duration;messageAt=cursor;continue;
      }
      if(record?.kind==='sync'){sync(event,order);continue;}
      if(event.type==='message'){cue(event,messageAt,order);continue;}
      cue(event,cursor,order);messageAt=cursor;
    }
    flushWalk();
    // Native attack motions1..4 finish their remaining tail before the next
    // actor. Other motions return to their source idle through sprite playback.
    finishAttackTails();
    this.sourceEndTick=cursor;
    this.endTick=options.reducedMotion||floorChanged?0:cursor+this.rawHolds.length;
    addPatch({at:cursor,ordinal:ordinal++,actors:this.after.actors,items:this.after.items,money:this.after.money,explored:this.after.explored});
    for(const actor of this.before.actors)if(!this.after.actors.some(candidate=>candidate.id===actor.id))addPatch({at:cursor,ordinal:ordinal++,hide:actor.id});
    this.patches.sort((left,right)=>left.at-right.at||left.ordinal-right.ordinal);
    // A source takeover follows its move-use message at the same boundary.
    this.cues.sort((left,right)=>left.at-right.at||Number('clearNotice' in left)-Number('clearNotice' in right)||left.ordinal-right.ordinal);
  }

  /** Canonical knowledge receipt; the app proves floor/transition ownership.
   * @returns {readonly number[]} */
  discovery(){return [...this.discoveredTiles];}

  /** Read a snapshot at compile time without replaying a gameplay operation.
   * @param {string} id @param {number} tick @returns {Actor|undefined} */
  latestActor(id,tick){
    let actor=this.before.actors.find(candidate=>candidate.id===id);
    let at=-Infinity,order=-1;
    for(const patch of this.patches)if(patch.at<=tick&&(patch.at>at||patch.at===at&&patch.ordinal>order)){
      const found=patch.actors?.find(candidate=>candidate.id===id);
      if(found){actor=found;at=patch.at;order=patch.ordinal;}
    }
    return actor;
  }

  /** Completion is explicit: a wall-clock deadline alone cannot release input
   * before the final patch/cues/settlement have been consumed. @returns {boolean} */
  busy(){return !this.completed;}

  /** Map foreground wall time to dungeon-frame time. Each recorded raw upload
   * holds the existing frame once; no gameplay RNG or timer is involved.
   * @param {number} now */
  sourceTime(now){
    const wall=Math.max(0,(now-this.startedAt)/TICK_MS);let held=0;
    for(const at of this.rawHolds){
      const start=at+held;if(wall<start)break;
      if(wall<start+1)return{tick:Math.floor(at),heldMs:(held+wall-start)*TICK_MS};
      held++;
    }
    return{tick:Math.floor(Math.max(0,wall-held)),heldMs:held*TICK_MS};
  }

  /** Finished evidence can be released after its nonblocking number/pose tail.
   * @param {number} now */
  hasTail(now){
    const tick=this.sourceTime(now).tick;
    return this.poses.some(track=>track.end>tick)||this.effects.some(track=>track.end>tick)||
      this.projectiles.some(track=>track.end>tick)||this.numbers.some(track=>track.end>tick);
  }

  /** @param {number} now @returns {BattleNumber|null} */
  carryNumber(now){
    const tick=this.sourceTime(now).tick;
    const number=lastMatching(this.numbers,track=>track.start<=tick&&tick<track.end);
    return number?{actorId:number.actorId,amount:number.amount,heal:number.heal,miss:number.miss,elapsedTicks:tick-number.start}:null;
  }

  /** Native input may be available while a nonblocking cast/pose/number tail
   * is still visible. Preserve those tails until the next action's source
   * drain, rather than either dropping them or delaying input artificially.
   * @param {number} now @returns {BattleCarry} */
  carry(now){
    const tick=this.sourceTime(now).tick;
    return {
      poses:this.poses.filter(track=>track.end>tick).map(track=>({...track,start:track.start-tick,end:track.end-tick,
        ...(track.moveEnd!==undefined?{moveEnd:track.moveEnd-tick}:{}),...(track.walkEpoch!==undefined?{walkEpoch:track.walkEpoch-tick}:{}),
        ...(track.idleAt!==undefined?{idleAt:track.idleAt-tick}:{})})),
      effects:this.effects.filter(track=>track.end>tick).map(track=>({...track,start:track.start-tick,end:track.end-tick,
        ...(track.waitEnd!==undefined?{waitEnd:track.waitEnd-tick}:{})})),
      number:this.carryNumber(now),
    };
  }

  /** Advances only bounded presentation records. Elapsed time is supplied by
   * app's foreground clock, never a timer or a gameplay catch-up loop.
   * @param {number} now @param {boolean} [finish]
   * @returns {{frame:BattleFrame,cues:PresentationCue[],completed:boolean,rawPauseMs:number}} */
  advance(now,finish=false){
    finish=finish||this.instant;
    const timing=this.sourceTime(now),rawPauseMs=this.finishedRawPauseMs??this.rawPauseBefore+timing.heldMs;
    if(finish)this.finishedRawPauseMs=rawPauseMs;
    const tick=finish?Infinity:Math.max(this.lastTick,timing.tick);
    this.lastTick=tick;
    while(this.patchIndex<this.patches.length){
      const patch=this.patches[this.patchIndex];if(!patch||patch.at>tick)break;this.patchIndex++;
      for(const actor of patch.actors??[]){
        if(this.hidden.has(actor.id)&&actor.id!=='hero'&&actor.id!=='partner')continue;
        this.actors.set(actor.id,actor);
      }
      if(patch.statusHp){
        if(!this.statusHp.has(patch.statusHp.actorId)&&this.statusHp.size>=MAX_ACTORS)throw new RangeError('Healing warning display exceeds the actor bound.');
        this.statusHp.set(patch.statusHp.actorId,patch.statusHp.hp);
      }
      if(patch.clearStatusHp)this.statusHp.delete(patch.clearStatusHp);
      if(patch.items)this.items=patch.items;if(patch.money!==undefined)this.money=patch.money;
      // Knowledge is monotonic within this bound floor. A later numerical walk
      // snapshot must not erase an earlier camera discovery patch.
      if(patch.explored)for(let index=0;index<patch.explored.length;index++)if(patch.explored[index])this.explored[index]=true;
      for(const index of patch.discovered??[])this.explored[index]=true;
      if(patch.camera){this.camera={...patch.camera};this.cameraTick=patch.at;}
      if(patch.hide){
        this.statusHp.delete(patch.hide);
        this.hidden.add(patch.hide);
        // A removed wild actor has no sprite or number left. Team failures
        // retain their hidden entity for the leader/partner loss routes.
        if(patch.hide!=='hero'&&patch.hide!=='partner')this.actors.delete(patch.hide);
      }
      if(patch.message){this.log.push(patch.message);if(this.log.length>80)this.log.shift();}
    }
    /** @type {PresentationCue[]} */const cues=[];
    while(this.cueIndex<this.cues.length){const cue=this.cues[this.cueIndex];if(!cue||cue.at>tick)break;this.cueIndex++;cues.push('clearNotice' in cue?{clearNotice:true}:'sound' in cue?{sound:cue.sound,audible:cue.audible}:{event:cue.event,audible:cue.audible});}
    const completed=!this.completed&&tick>=this.sourceEndTick;this.completed||=completed;
    if(finish){this.poses=[];this.effects=[];this.numbers=[];this.projectiles=[];this.backgrounds=[];this.statusHp.clear();}
    /** @type {BattleActor[]} */const actors=[];
    for(const actor of this.actors.values())actors.push({...sampledActor(actor,this.poses,tick,Math.floor((now-rawPauseMs)/TICK_MS),!this.hidden.has(actor.id)),statusHp:this.statusHp.get(actor.id)});
    /** @type {BattleEffect[]} */const effects=[];
    for(const track of this.effects)if(track.start<=tick&&tick<track.end){
      const fraction=(tick-track.start)/(track.end-track.start),position=track.samples?.[Math.floor(tick-track.start)];
      if(track.samples&&!position)throw new RangeError('A native travel sample is missing.');
      if(position&&!position.visible)continue;
      const age=tick-track.start+(track.elapsedOffset??0);
      const elapsedTicks=track.frameTicks===undefined?age:Math.min(age,track.frameTicks-1);
      effects.push({id:track.id,actorId:track.actorId,direction:track.direction,elapsedTicks,attachmentSet:track.attachmentSet,generic:track.generic,depthY:track.depthY,depthAdd:track.depthAdd,
        ...(position?{x:position.x,y:position.y,depthY:position.depthY,depthAdd:position.depthAdd}:track.from&&track.to?{x:track.from.x+(track.to.x-track.from.x)*fraction,y:track.from.y+(track.to.y-track.from.y)*fraction}:{})});
    }
    const hero=this.actors.get('hero')??this.dungeon.hero,partner=this.actors.get('partner')??this.dungeon.partner;
    const active=tick<this.sourceEndTick;
    // Once gameplay input is available, menu changes (e.g. tactics and camera
    // discovery) read canonical state while nonblocking visual tails continue.
    const dungeon=active?{...this.dungeon,hero,partner,enemies:actors.filter(entry=>entry.actor.id!=='hero'&&entry.actor.id!=='partner'&&entry.visible).map(entry=>entry.actor),items:this.items,money:this.money,log:this.log,explored:this.explored}:this.dungeon;
    const number=finish?null:this.carryNumber(now);
    const projectiles=this.projectiles.filter(track=>track.start<=tick&&tick<track.end).map(track=>{
      const fraction=(tick-track.start)/(track.end-track.start);
      return {kind:track.kind,x:track.from.x+(track.to.x-track.from.x)*fraction,y:track.from.y+(track.to.y-track.from.y)*fraction};
    });
    // finish uses Infinity only to consume records. The camera keeps finite
    // source age and is rebased by the app after reduced-motion completion.
    const camera={target:this.camera.target,counter:advanceCameraCounter(this.camera.counter,(finish?this.sourceEndTick:tick)-this.cameraTick)};
    const background=lastMatching(this.backgrounds,entry=>entry.takeover<=tick&&tick<entry.end+1);
    const hypnosis=background?{elapsedTicks:tick>=background.start&&tick<background.end?tick-background.start:null,hideHud:tick>background.takeover,hideMap:tick<background.end}:null;
    return {frame:{dungeon,actors,effects,projectiles,number,active,camera,hypnosis},cues,completed,rawPauseMs};
  }
}

/** One pose projection for both drawing and source attachment sampling.
 * @param {Actor} actor @param {PoseTrack[]} poses @param {number} tick
 * @param {number} globalTick @param {boolean} [visible] @returns {BattleActor} */
function sampledActor(actor,poses,tick,globalTick,visible=true){
  let x=actor.x,y=actor.y,direction=actor.direction,clip=actor.status.sleep?'rest-sleep':actor.status.bide?'bide-hold':'idle';
  /** @type {number|undefined} */let animation;
  // Untracked idle/sleep animations keep the app's shared foreground
  // clock; a completed turn must not freeze every actor on frame zero.
  let elapsedTicks=globalTick;
  const track=lastMatching(poses,candidate=>candidate.actorId===actor.id&&candidate.start<=tick&&tick<candidate.end);
  if(track){
    direction=/** @type {import('./mechanics-types.js').Direction} */(track.direction);clip=track.clip;animation=track.animation;elapsedTicks=tick-track.start;
    if(track.from&&track.to){const end=track.moveEnd??track.end,fraction=Math.min(1,(tick-track.start)/(end-track.start));x=track.from.x+(track.to.x-track.from.x)*fraction;y=track.from.y+(track.to.y-track.from.y)*fraction;}
    if(track.walkEpoch!==undefined&&track.walkCycle!==undefined)elapsedTicks=Math.max(0,tick-track.walkEpoch)%track.walkCycle;
    if(track.repeatTicks!==undefined)elapsedTicks%=track.repeatTicks;
    if(track.rotate){const step=Math.floor(elapsedTicks/2)+(track.rotate===99?1:0);direction=rotate(direction,track.rotate===99?-step:step);animation=0;elapsedTicks%=2;}
  }else if(clip==='idle'){
    const ended=lastMatching(poses,candidate=>candidate.actorId===actor.id&&candidate.start<=tick);
    // An Ember cast that actually reaches its native end starts fresh idle.
    // This source boundary is local to the retained presentation evidence;
    // untracked idle continuity still uses the shared foreground clock.
    if(ended?.idleAt!==undefined&&ended.end===ended.idleAt&&ended.idleAt<=tick&&ended.direction===direction)elapsedTicks=tick-ended.idleAt;
  }
  return{actor,x,y,direction,animation,clip,elapsedTicks,visible};
}

/** Closed adjacent Ember geometry: integer source attachment recurrence before
 * each of its eight visible frames. No target scan, clock or RNG is owned here.
 * @param {BattleAssets} assets @param {Actor} caster @param {PoseTrack[]} poses
 * @param {number} tick @param {number} globalTick @param {MoveEffects} route
 * @param {{x:number,y:number}} from @param {{x:number,y:number}} to
 * @returns {readonly TravelSample[]} */
function emberTrajectory(assets,caster,poses,tick,globalTick,route,from,to){
  if(route.travel!==137||route.travelSpeed!==3||Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y))!==1)throw new RangeError('Unsupported native Ember geometry.');
  const pose=sampledActor(caster,poses,tick,globalTick);
  const attachment=assets.attachmentOffset(caster.speciesId,{direction:pose.direction,animation:pose.animation,clip:pose.clip,ticks:pose.elapsedTicks},route.attachmentSet);
  if(!attachment||!Number.isInteger(attachment.x)||!Number.isInteger(attachment.y)||attachment.x< -32768||attachment.x>32767||attachment.y< -32768||attachment.y>32767)throw new RangeError('Native Ember attachment is unavailable.');
  const dx=Math.sign(to.x-from.x),dy=Math.sign(to.y-from.y),attached=route.attachmentSet!==-1;
  /** @type {0|1} */const depthAdd=['ne','n','nw'].includes(caster.direction)?0:1;
  const short=(/** @type {number} */value)=>(value<<16)>>16;
  let offsetX=attachment.x,offsetY=attachment.y;
  /** @type {TravelSample[]} */const samples=[];
  for(let frame=0;frame<8;frame++){
    // sub_800E3AC stores each compound assignment into signed 16-bit and C divides
    // toward zero. For a 24px endpoint its fixed divisor is 24/4=6.
    offsetX=short(Math.trunc(short(offsetX*5)/6));
    offsetY=short(offsetY+9);offsetY=short(offsetY*5);offsetY=short(Math.trunc(offsetY/6));offsetY=short(offsetY-9);
    const x=from.x*24+12+dx*3*frame,depthY=from.y*24+16+dy*3*frame;
    // A raw 99 pair is transformed before this guard. Set -1 ignores pos2;
    // no creation-time validity flag may suppress the whole trajectory.
    samples.push(Object.freeze({x:x+(attached?offsetX:0),y:depthY+(attached?offsetY:0),depthY,depthAdd,visible:!attached||offsetX!==99&&offsetY!==99}));
  }
  return Object.freeze(samples);
}

/** @param {number} dx @param {number} dy @returns {import('./mechanics-types.js').Direction} */
function directionFor(dx,dy){
  return dy>0?(dx<0?'sw':dx>0?'se':'s'):dy<0?(dx<0?'nw':dx>0?'ne':'n'):dx<0?'w':'e';
}
/** @param {import('./mechanics-types.js').Direction} direction @param {number} steps */
function rotate(direction,steps){
  const directions=/** @type {const} */(['s','se','e','ne','n','nw','w','sw']);
  return directions[(directions.indexOf(direction)+steps+80)%8]??direction;
}

/** @template T @param {T[]} values @param {(value:T)=>boolean} predicate @returns {T|undefined} */
function lastMatching(values,predicate){
  for(let index=values.length-1;index>=0;index--){const value=values[index];if(value!==undefined&&predicate(value))return value;}
  return undefined;
}
