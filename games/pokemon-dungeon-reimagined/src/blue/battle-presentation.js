import { advanceCameraCounter, cameraChangeFrames } from './dungeon-camera.js';
import { cameraDiscovery } from './mechanics-visibility.js';
/** Playback of committed battle evidence. The comparative native sources are
 * dungeon_entity_movement.c, code_8040094_1.c, dungeon_damage.c and
 * dungeon_vram.c at the pinned Rescue Team reference. No gameplay is replayed.
 * Native cosmetic animation-start jitter is deliberately zero here; Blue binary
 * timing and effect routes without exported artwork remain qualified. */
import {captureWorld} from './battle-events.js';
import {pokeFlightSamples,pokeDropSamples,pokeLossPosition} from './battle-item-flight.js';
import {nativeSin4096} from './battle-native-sine-data.js';

/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */
/** @typedef {import('./mechanics-types.js').ActionResult} ActionResult */
/** @typedef {import('./battle-events.js').BattleWorld} BattleWorld */
/** @typedef {[number,number,number,number,number,number,number]} NativeFrame */
/** @typedef {{animation:number,preparation:number,cast:number,target:number,travel:number,attachmentSet:number,travelSpeed:number}} MoveEffects */
/** @typedef {{animationInfo:(speciesId:string,animation:number,direction:string)=>{frames:readonly NativeFrame[],totalTicks:number}|undefined,effectInfo:(id:number,direction:string)=>{ticks:number,attachmentSet:number,loop:boolean,blocksWait:boolean}|undefined,moveEffects:(moveId:string,speciesId:string)=>MoveEffects|undefined,attachmentOffset:(speciesId:string,pose:import('./render-native-sprites.js').PoseOptions,setId:number)=>{x:number,y:number,valid:boolean}|undefined}} BattleAssets */
/** @typedef {{actor:Actor,x:number,y:number,direction:string,animation?:number,clip:string,elapsedTicks:number,visible:boolean,statusHp?:number,bodyVisible?:boolean,shadowVisible?:boolean}} BattleActor */
/** @typedef {{id:number,actorId?:string,x?:number,y?:number,direction:string,elapsedTicks:number,attachmentSet?:number,generic?:boolean,depthY?:number,depthAdd?:0|1}} BattleEffect */
/** @typedef {{actorId:string,amount:number,heal:boolean,miss:boolean,elapsedTicks:number}} BattleNumber */
/** @typedef {{kind:import('./mechanics-types.js').ItemKind,x:number,y:number,native?:true,visible?:boolean,shadow?:{x:number,y:number},depthY?:number,fixedDepth?:1}} BattleProjectile */
/** @typedef {{kind:import('./mechanics-types.js').ItemKind,start:number,end:number}&({from:{x:number,y:number},to:{x:number,y:number}}|{samples:readonly import('./battle-item-flight.js').PokeSample[]})} ProjectileTrack */
/** @typedef {import('./dungeon-camera.js').CameraSnapshot} CameraSnapshot */
/** @typedef {{dungeon:DungeonState,actors:BattleActor[],effects:BattleEffect[],projectiles:BattleProjectile[],number:BattleNumber|null,active:boolean,camera:CameraSnapshot,hypnosis:{elapsedTicks:number|null,hideHud:boolean,hideMap:boolean}|null}} BattleFrame */
/** @typedef {{at:number,ordinal:number,actors?:Actor[],items?:import('./mechanics-types.js').GroundItem[],explored?:boolean[],discovered?:readonly number[],camera?:CameraSnapshot,money?:number,hide?:string,message?:string,statusHp?:{actorId:string,hp:number},clearStatusHp?:string}} Patch */
/** @typedef {{actorId:string,start:number,end:number,idleAt?:number,animation?:number,clip:string,direction:string,from?:{x:number,y:number},to?:{x:number,y:number},moveEnd?:number,walkEpoch?:number,walkCycle?:number,repeatTicks?:number,rotate?:98|99,faintAt?:number}} PoseTrack */
/** @typedef {{x:number,y:number,depthY:number,depthAdd:0|1,visible:boolean}} TravelSample */
/** @typedef {{id:number,actorId?:string,start:number,end:number,waitEnd?:number,direction:string,attachmentSet?:number,generic?:boolean,depthY?:number,depthAdd?:0|1,frameTicks?:number,elapsedOffset?:number,from?:{x:number,y:number},to?:{x:number,y:number},samples?:readonly TravelSample[],hidden?:boolean}} EffectTrack */
/** @typedef {{actorId:string,amount:number,heal:boolean,miss:boolean,start:number,end:number}} NumberTrack */
/** @typedef {{event:GameEvent,audible:boolean}|{sound:'heal'|'heart'|'se330'|'se331'|'se332'|'se342'|'se343'|'se356'|'se711'|'se678'|'se809'|'se621'|'se413'|'se407'|'se745'|'se825'|'se807'|'se628'|'se717'|'se680'|'se774'|'se927'|'se938'|'se906',audible:boolean,moveOwned?:true}|{clearNotice:true}} PresentationCue */
/** @typedef {PresentationCue & {at:number,ordinal:number}} BattleCue */
/** @typedef {{poses:PoseTrack[],effects:EffectTrack[],number:BattleNumber|null}} BattleCarry */
/** @typedef {{start:number,end:number}} EndTrack */
/** Compact source recipe; no actor/world copies and no save/carry ownership.
 * @typedef {{at:number,actorId:string,pose:PoseTrack,poses:number,effects:number,projectiles:number,numbers:number,backgrounds:number,rawHolds:number,patchEnd:number,cueEnd:number,ends?:Map<EndTrack,number>}} FaintCheckpoint */
/** @typedef {{index:number,renderTime:number}} FaintPublication */

const TICK_MS=1000/60;
// These admitted effect22 routes have STOP direct-cast sounds for every learner.
// Cross Chop keeps its qualified authored cast fallback for351; other cues stay live.
const EFFECT22_SILENT_CASTS=new Set([
  'move-absorb','move-bite','move-body-slam',
  'move-bone-club','move-bone-rush','move-bonemerang',
  'move-confusion','move-double-edge','move-double-slap',
  'move-double-team','move-dynamic-punch','move-fury-swipes',
  'move-giga-drain','move-growl','move-helping-hand',
  'move-mega-drain','move-metal-claw','move-poison-powder',
  'move-quick-attack','move-rage','move-rapid-spin',
  'move-reflect','move-seismic-toss','move-sleep-powder',
  'move-smokescreen','move-submission','move-swagger',
  'move-sweet-scent','move-swift','move-thunder',
  'move-thunder-shock','move-thunder-wave','move-thunderbolt',
  'move-withdraw',
]);

// Conservative current producer bound:74 target/hit pieces*32 +198 levels*6
// +13 opportunity wrappers*32 +37 residual calls*16 +12 item actions*16
// +12 admitted initial-sleep wakes*8 +64 setup =4916. A conservative365
// camera-boundary allowance gives5281, still below8192. Native wild admission is
// narrower. The leader-only money route adds at most64 pieces, including its
// one direct-damage call and wake receipts:5345. Seed-source faint unlink and
// two party Rapid Spin cleanups add at most 16 receipts:5361 <8192. Geometry uses
// at most 60 flight +25 landing samples, without creating an event per frame.
// This rejection boundary never truncates an admitted event stream.
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
    /** @type {ProjectileTrack[]} */this.projectiles=[];
    /** @type {BattleCue[]} */this.cues=[];
    this.patchIndex=0;this.cueIndex=0;this.completed=false;this.endTick=0;this.lastTick=0;
    /** @type {FaintCheckpoint[]} */this.faintCheckpoints=[];
    this.faintCheckpointIndex=0;
    /** @type {{frame:BattleFrame,publication:FaintPublication,rawPauseMs:number,dungeonTime:number}|null} */this.faintPublication=null;
    this.instant=Boolean(options.reducedMotion||before.tiles!==dungeon.tiles||before.floor!==dungeon.floor);
    const floorChanged=before.tiles!==dungeon.tiles||before.floor!==dungeon.floor;
    /** @type {Map<string,Actor>} */this.actors=new Map((floorChanged?this.after.actors:before.actors).map(actor=>[actor.id,actor]));
    this.items=floorChanged?this.after.items:before.items;this.money=before.money;this.log=[...before.log];
    this.explored=[...(floorChanged?this.after.explored:before.explored)];
    /** Display HP retains native status flags through healing and visible KO waits. */
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
    let patchFrontier=-Infinity,cueFrontier=-Infinity;
    /** @type {FaintCheckpoint|null} */let unmatchedFaint=null;
    let camera={...this.initialCamera},cameraTick=0;
    const discovered=[...this.after.explored];
    /** @type {Map<string,{actor:Actor,segments:{from:{x:number,y:number},to:{x:number,y:number}}[]}>} */const walking=new Map();
    /** @type {{event:GameEvent,ordinal:number}[]} */let afterWalk=[];
    /** @type {Map<string,MoveEffects>} */const moves=new Map();
    /** @type {Map<string,number>} */const damageHpAt=new Map();
    const hiddenActors=new Set(this.before.actors.filter(actor=>actor.hp<=0).map(actor=>actor.id));
    /** @type {string|null} */let pokeActorId=null;
    /** @type {PoseTrack[]} */let pokePoses=[];
    const floorChanged=this.before.tiles!==this.dungeon.tiles||this.before.floor!==this.dungeon.floor;
    // Source-event ordinals order semantic cues. Emission ordinals order
    // visual patches: a flushed walk must apply before its deferred pickup,
    // even though that pickup was recorded earlier than the flush itself.
    /** @param {Patch} patch */const addPatch=patch=>{
      patchFrontier=Math.max(patchFrontier,patch.at);
      this.patches.push({...patch,ordinal:patchSequence++});
    };
    /** Retire normally, but preserve a preexisting track's last-draw lifetime.
     * Interpolation uses walk moveEnd, fixed points or already-drained travel.
     * @param {EndTrack} track @param {number} at @param {EndTrack[]} tracks
     * @param {'poses'|'effects'|'numbers'} kind */
    const clipEnd=(track,at,tracks,kind)=>{
      const checkpoint=this.faintCheckpoints.at(-1),next=Math.min(track.end,at);
      if(checkpoint&&next<=checkpoint.at&&checkpoint.at<track.end){
        const index=tracks.indexOf(track);
        if(index>=0&&index<checkpoint[kind]){
          checkpoint.ends??=new Map();
          if(!checkpoint.ends.has(track))checkpoint.ends.set(track,track.end);
        }
      }
      track.end=next;
    };
    /** @param {GameEvent} event @param {number} at @param {number} order @param {boolean} [audible] */
    const cue=(event,at,order,audible=true)=>{
      if(event.type==='presentation'&&event.presentation?.kind!=='miss')return;
      cueFrontier=Math.max(cueFrontier,at);
      this.cues.push({event,at,ordinal:order,audible});
      if(event.type==='message'&&event.text)addPatch({at,ordinal:order,message:event.text});
    };
    /** Native sound receipts are private presentation evidence, never saves.
     * @param {'heal'|'heart'|'se330'|'se331'|'se332'|'se342'|'se343'|'se356'|'se711'|'se678'|'se809'|'se621'|'se413'|'se407'|'se745'|'se825'|'se807'|'se628'|'se717'|'se680'|'se774'|'se927'|'se938'|'se906'} name @param {number} at @param {number} [order] @param {boolean} [moveOwned] */
    const sound=(name,at,order=ordinal++,moveOwned=false)=>{
      if(++soundCount>MAX_EVENTS)throw new RangeError('Native sound receipts exceed the opening bound.');
      cueFrontier=Math.max(cueFrontier,at);
      this.cues.push({sound:name,at,ordinal:order,audible:true,...(moveOwned?{moveOwned:true}:{})});
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
        // Capture the current attachment and unoffset depth once. Each
        // caller owns its distinct preload/drain; this capture adds no wait.
        const pose=sampledActor(actor,this.poses,at,Math.floor((this.startedAt-this.rawPauseBefore+at*TICK_MS)/TICK_MS));
        const offset=assets.attachmentOffset(actor.speciesId,{direction:pose.direction,animation:pose.animation,clip:pose.clip,ticks:pose.elapsedTicks},track.attachmentSet??-1);
        if(!offset||!Number.isInteger(offset.x)||!Number.isInteger(offset.y))throw new RangeError('Native application attachment is unavailable.');
        const valid=offset.x!==99&&offset.y!==99,feetX=pose.x*24+12,feetY=pose.y*24+16;
        const position={x:feetX+(valid?offset.x:0),y:feetY+(valid?offset.y:0)};
        track.from=position;track.to=position;track.depthY=feetY;track.depthAdd=1;
        // Thrown item impact keeps the native 99 attachment suppression.
        // Generic HP effects instead retain their source feet fallback.
        if(!valid&&!generic)track.hidden=true;
      }
      this.effects.push(track);
      // The native effect owner requests sound once on its first source frame.
      // Carried tracks and repeated draws never enter this creation path.
      if(id===7||id===15)sound(id===7?'heal':'heart',start);
      else if(id===83||id===271)sound(id===83?'se678':'se809',start);
      else if(id===22)sound('se621',start);
      // The selected motion table routes144 only from Ember's cast.
      else if(id===144)sound('se711',start,undefined,true);
      else if(id===194)sound('se745',start,undefined,true);
      else if(id===29||id===150)sound(id===29?'se628':'se717',start,undefined,true);
      else if(id===85||id===236)sound(id===85?'se680':'se774',start);
      else if(id===423||id===434)sound(id===423?'se927':'se938',start);
      else if(id===399)sound('se906',start,undefined,true);
      return info.blocksWait===false?at:Math.min(end,at+waitLimit);
    };
    const drainEffects=()=>{
      const end=this.effects.reduce((maximum,track)=>Math.max(maximum,track.waitEnd??track.end),cursor);
      if(end>cursor)cursor=Math.min(end,cursor+1000)+2;
      // The TRUE native drain clears remaining effects after its bounded wait.
      // A removed projectile may retain the screen drawn on that source tick;
      // its separate waitEnd never occupies a later effect drain.
      for(const track of this.effects)if(track.waitEnd===undefined||track.waitEnd>cursor)clipEnd(track,cursor,this.effects,'effects');
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
    const retirePose=(actorId,at)=>{for(const track of this.poses)if(track.actorId===actorId&&track.start<=at&&track.end>at)clipEnd(track,at,this.poses,'poses');};
    /** @param {PoseTrack} track */
    const pose=track=>{retirePose(track.actorId,track.start);this.poses.push(track);};
    /** @param {GameEvent} event @param {number} order */
    const sync=(event,order)=>{
      const record=event.presentation;
      // Native pickup sound precedes its result message, without a display gate.
      if(record?.kind==='pickup'){sound(record.sequence===332?'se332':record.sequence===330?'se330':'se331',cursor,order);return;}
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
     * @param {{x:number,y:number}} from @param {{x:number,y:number}} to @param {boolean} singleTile */
    const travel=(moveId,route,caster,from,to,singleTile)=>{
      if(!route.travel||route.travelSpeed<=0)return;
      const distance=Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y));
      if(!Number.isInteger(distance)||distance<1||distance>10)throw new RangeError('A move projectile endpoint exceeds its recorded one-to-ten-cell range.');
      // sub_8056564 advances once before creating a nonzero travel effect,
      // independently of the later per-cell camera visibility checks.
      cursor++;
      const info=assets.effectInfo(route.travel,caster.direction);
      const samples=info?nativeTravelSamples(assets,caster,this.poses,cursor,Math.floor((this.startedAt-this.rawPauseBefore+cursor*TICK_MS)/TICK_MS),moveId,route,from,to,singleTile,visibleTile):undefined;
      const dx=Math.sign(to.x-from.x),dy=Math.sign(to.y-from.y),duration=24/route.travelSpeed;
      let elapsedOffset=0;
      for(let step=1;step<=distance;step++){
        const next={x:from.x+dx*step,y:from.y+dy*step};if(!visibleTile(next))continue;
        const previous={x:next.x-dx,y:next.y-dy};
        // The first loop RunFrame loads the new pose. Its last draw is at
        // +21px for these 3px projectiles; deletion follows that eighth frame.
        // One native handle spans every cell; invisible cells do not update it.
        if(info&&(route.travel===288||route.travel===269)&&elapsedOffset===0)sound(route.travel===288?'se825':'se807',cursor+1,undefined,true);
        if(info)this.effects.push({id:route.travel,start:cursor+1,end:cursor+duration+1,waitEnd:cursor+duration,direction:caster.direction,elapsedOffset,from:{x:previous.x*24+12,y:previous.y*24+16},to:{x:next.x*24+12,y:next.y*24+16},...(samples?{samples:samples[step-1]}:{})});
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
      // Attract's empty-adjacent impact owns one fresh handle, even with no actor.
      if(id===15)sound('heart',start,undefined,true);
      // sub_8041168 always runs one frame after effect creation, even for a
      // nonblocking effect. The selected Ember effect317 then waits to finish.
      cursor=info.blocksWait?end:start;
    };

    /** The actor camera is sampled once; money never requests target focus. */
    const itemCamera=()=>{const focus=focusAtCursor();return{x:Math.round(focus.x*24+12-128),y:Math.round(focus.y*24+16-108)};};
    /** Preserve every source-visible frame, including the final drawn frame
     * before the next ordinary update removes the manually queued OBJ.
     * @param {readonly import('./battle-item-flight.js').PokeSample[]} samples */
    const itemTrack=samples=>{
      if(samples.length>60)throw new RangeError('Money geometry exceeds its frame bound.');
      if(samples.length)this.projectiles.push({kind:'poke',start:cursor+1,end:cursor+samples.length+1,samples});
      cursor+=samples.length;messageAt=cursor;
    };

    for(const event of result.events){
      const order=ordinal++,record=event.presentation;
      if(floorChanged){cue(event,0,order);continue;}
      if(record?.kind==='flush'){flushWalk();messageAt=cursor;continue;}
      if((record?.kind==='sync'||record?.kind==='pickup')&&record.afterWalk&&walking.size){afterWalk.push({event,ordinal:order});continue;}
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
      if(record?.kind==='poke-spin'){
        if(pokeActorId!==null)throw new RangeError('Overlapping money throw receipts.');
        pokeActorId=record.actor.id;patchActors([record.actor],cursor);
        const visible=displayedActor(record.actor);
        if(visible){
          sound('se356',cursor);
          /** @type {PoseTrack} */const spin={actorId:record.actor.id,start:cursor+1,end:cursor+17,animation:0,clip:'walk',direction:record.actor.direction,rotate:99};
          /** @type {PoseTrack} */const original={actorId:record.actor.id,start:cursor+15,end:cursor+18,animation:0,clip:'walk',direction:record.actor.direction};
          // unk166=4 requests action.direction−1 on the second ordinary
          // source frame after the spin. Message waits share that clock.
          /** @type {PoseTrack} */const tail={actorId:record.actor.id,start:cursor+18,end:Infinity,animation:0,clip:'walk',direction:rotate(record.actor.direction,-1)};
          pokePoses=[spin,original,tail];for(const track of pokePoses)pose(track);cursor+=16;
        }
        // Native category sound336 is held; no authored throw substitute.
        messageAt=cursor;cue(event,cursor,order,visible);continue;
      }
      if(record?.kind==='poke-flight'){
        if(pokeActorId===null)throw new RangeError('A money flight lacks its action receipt.');
        itemTrack(pokeFlightSamples(record.from,record.to,itemCamera()));continue;
      }
      if(record?.kind==='poke-impact'){
        patchActors([record.target],cursor);
        if(displayedActor(record.target)){
          cursor+=4;
          // Native impact8 owns SE607, still held without a noise-player join.
          cursor=effect(8,record.target,cursor,3,record.target.direction,1000,false,true,true);
        }
        messageAt=cursor;continue;
      }
      if(record?.kind==='poke-catch'){
        // SE333 is held. Catch returns without an impact, damage or extra wait.
        messageAt=cursor;cue(event,cursor,order);continue;
      }
      if(record?.kind==='poke-drop'){
        itemTrack(pokeDropSamples(record.from,record.landing,itemCamera(),visibleTile(record.origin)));
        if(!record.placed){
          const info=assets.effectInfo(144,'s');if(!info)throw new RangeError('Money loss artwork is unavailable.');
          const position=pokeLossPosition(record.origin,record.landing,record.direction),start=cursor+1,end=start+info.ticks+1;
          this.effects.push({id:144,start,end,direction:'s',frameTicks:info.ticks,from:position,to:position});
          // Pixel-loss effects have no actor-display gate or four-frame preload.
          sound('se711',start);cursor=Math.min(end,cursor+100);
        }
        messageAt=cursor;continue;
      }
      if(record?.kind==='poke-end'){
        if(record.actor.id!==pokeActorId)throw new RangeError('A money throw lost its actor owner.');
        // Restore requested normal facing on the next native draw. Future
        // tail requests must also retire when no visible flight frame elapsed.
        for(const track of pokePoses)clipEnd(track,cursor+1,this.poses,'poses');
        patchActors([record.actor],cursor);pokePoses=[];pokeActorId=null;messageAt=cursor;continue;
      }
      if(record?.kind==='cast'){
        flushWalk();finishAttackTails();drainEffects();patchActors([record.actor],cursor);
        const selectedRoute=assets.moveEffects(record.moveId,record.actor.speciesId);
        const route=record.moveId==='move-skull-bash'&&record.phase==='release'&&selectedRoute?{...selectedRoute,animation:1,cast:0,target:0,travel:0}:selectedRoute;
        if(route)moves.set(record.actor.id,route);
        const start=cursor;messageAt=start;
        const visible=displayedActor(record.actor);
        // Selected native effect sounds replace only the STOP direct-cast cue.
        cue(event,start,order,visible&&!EFFECT22_SILENT_CASTS.has(record.moveId)&&record.moveId!=='move-synthesis'&&record.moveId!=='move-ember'&&record.moveId!=='move-attract'&&record.moveId!=='move-leech-seed'&&record.moveId!=='move-bubble'&&record.moveId!=='move-water-sport'&&record.moveId!=='move-disable');
        if(!visible)continue;
        if(route?.preparation&&record.first){
          if(record.moveId==='move-hypnosis'){
            // BG upload owns one raw VBlank before the ordinary preparation
            // frame. It advances no actor/effect/camera dungeon-frame age.
            this.rawHolds.push(cursor);
            cueFrontier=Math.max(cueFrontier,cursor);
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
              ...((record.moveId==='move-ember'||record.moveId==='move-hypnosis'&&record.actor.speciesId==='pokemon-102'||record.moveId==='move-screech')&&animation===3?{idleAt:cursor+info.totalTicks+2}:{})});
            // Synthesis retains its terminator draw before the healing TRUE drain.
            if(route?.cast&&castAt!==null&&launches)effect(route.cast,record.actor,cursor+castAt+1,route.attachmentSet,record.actor.direction,Infinity,false,false,record.moveId==='move-synthesis'&&route.cast===271);
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
          if(caster)travel(record.moveId,route,caster,caster,record.target,record.singleTile??true);
        }
        // Actual-target focus follows projectile travel, before its impact.
        requestCamera(record.target,'look');
        if(displayedActor(record.target)){
          cursor+=4;
          // Rapid Spin retains the terminator draw before its target wait returns.
          if(route?.target)cursor=effect(route.target,record.target,cursor,undefined,'s',Infinity,false,true,record.moveId==='move-rapid-spin'&&route.target===83||record.moveId==='move-psych-up'&&route.target===205);
        }
        messageAt=cursor;continue;
      }
      if(record?.kind==='empty-target'){
        flushWalk();
        const caster=this.latestActor(record.actorId,cursor);
        const route=caster?assets.moveEffects(record.moveId,caster.speciesId):undefined;
        const distance=Math.max(Math.abs(record.to.x-record.from.x),Math.abs(record.to.y-record.from.y));
        if(!Number.isInteger(distance)||distance<1||distance>10||record.singleTile&&distance!==1)throw new RangeError('An empty opening projectile endpoint exceeds its requested range.');
        if(caster&&route){
          travel(record.moveId,route,caster,record.from,record.to,record.singleTile);
          if(record.singleTile&&visibleTile(record.to)){
            cursor++; // Empty adjacent impact uses one frame, not a target's4.
            if(route.target)emptyImpact(route.target,record.to);
          }
        }
        messageAt=cursor;continue;
      }
      if(record?.kind==='damage'){
        flushWalk();patchActors([record.before],cursor);
        const visible=displayedActor(record.before),reaction=visible&&(record.cause!=='hunger'||record.before.hp<=1);
        const knockout=reaction&&record.after.hp===0;
        /** @type {PoseTrack|undefined} */let faintPose;
        if(visible&&record.cause!=='hunger')number(record.before,record.amount,false);
        messageAt=cursor;cue(event,cursor,order,visible&&record.cause!=='item');
        const start=cursor;
        if(reaction){
          const id=[8,9,10,11][record.effectiveness]??10;
          cursor=effect(id,record.before,cursor,3,record.before.direction,100,true,record.cause==='item',record.cause==='item');
          const repeatTicks=(assets.animationInfo(record.before.speciesId,6,record.before.direction)?.totalTicks??10)+1;
          const hit={actorId:record.before.id,start:start+1,end:cursor+10+(knockout?30:0),clip:'hit-light',animation:6,repeatTicks,direction:record.before.direction,...(knockout?{faintAt:cursor+11}:{})};
          pose(hit);if(knockout)faintPose=hit;
        }
        if(knockout)addPatch({at:cursor,ordinal:ordinal++,statusHp:{actorId:record.before.id,hp:record.before.hp}});
        patchActors([record.after],cursor);damageHpAt.set(record.after.id,cursor);
        if(reaction)cursor+=10;
        if(knockout){
          cursor+=30;
          if(!this.instant){
            if(unmatchedFaint||!faintPose||faintPose.end!==cursor||patchFrontier>=cursor||cueFrontier>=cursor||this.faintCheckpoints.length>=MAX_EVENTS)throw new RangeError('Invalid faint publication frontier.');
            const previous=this.faintCheckpoints.at(-1);
            if(previous&&cursor-previous.at<40)throw new RangeError('Faint checkpoints lost their source wait.');
            if((this.rawHolds.at(-1)??-1)>=cursor)throw new RangeError('A faint checkpoint crossed an unconsumed raw hold.');
            unmatchedFaint={at:cursor,actorId:record.after.id,pose:faintPose,poses:this.poses.length,effects:this.effects.length,projectiles:this.projectiles.length,numbers:this.numbers.length,backgrounds:this.backgrounds.length,rawHolds:this.rawHolds.length,patchEnd:0,cueEnd:0};
            this.faintCheckpoints.push(unmatchedFaint);
          }
        }
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
        const attackerVisible=Boolean(attacker&&displayedActor(attacker)),targetVisible=displayedActor(record.target);
        if(record.accuracy===2){
          const visible=attackerVisible&&targetVisible;
          if(visible)number(record.target,9999,true,true);
          cue(event,cursor,order,false);
          if(visible)sound(record.target.id==='hero'||record.target.id==='partner'?'se342':'se343',cursor);
        }else{
          // Accuracy1 sounds by the attacker, then announces before waiting
          // for the target's singleton MISS number. The partner uses343 here.
          if(attackerVisible)sound(attacker?.id==='hero'?'se342':'se343',cursor,order);
          cue(event,cursor,ordinal++,false);
          if(targetVisible)number(record.target,9999,true,true);
        }
        messageAt=cursor;continue;
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
      if(record?.kind==='whiffer-sound'){
        // Native sound-only helper precedes result text/icon sync; no drain/wait.
        if(displayedActor(record.target))sound('se413',cursor,order);
        continue;
      }
      if(record?.kind==='effect'){
        flushWalk();patchActors([record.before],cursor);
        if(displayedActor(record.before))drainEffects();
        if(record.effectId!==undefined){
          cursor=effect(record.effectId,record.before,cursor,record.effectId===21?3:undefined,record.before.direction,100,true,true,record.effectId===15||record.effectId===14);
        }
        // Sleep's nonblocking effect 37 helper returns before its first draw. The
        // separate 407 request follows creation, before result text/status sync.
        if(record.effectId===37&&displayedActor(record.before))sound('se407',cursor);
        if(Boolean(record.before.status.sleep)!==Boolean(record.after.status.sleep))retirePose(record.after.id,cursor);
        patchActors([record.after],cursor);messageAt=cursor;cue(event,cursor,order);continue;
      }
      if(record?.kind==='faint'){
        if(unmatchedFaint){
          if(unmatchedFaint.actorId!==record.actor.id||unmatchedFaint.at!==cursor)throw new RangeError('A faint checkpoint lost its retirement.');
          unmatchedFaint=null;
        }
        flushWalk();retirePose(record.actor.id,cursor);addPatch({at:cursor,ordinal:order,actors:[record.actor],hide:record.actor.id});
        messageAt=cursor;cue(event,cursor,order,displayedActor(record.actor));hiddenActors.add(record.actor.id);
        if(record.actor.id!=='hero'&&record.actor.id!=='partner'){
          // HandleFaint deletes an ordinary wild entity. The global number
          // slot stops occupying time when that entity becomes invalid.
          for(const track of this.numbers)if(track.actorId===record.actor.id)clipEnd(track,cursor,this.numbers,'numbers');
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
      if(record?.kind==='sync'||record?.kind==='pickup'){sync(event,order);continue;}
      if(event.type==='message'){cue(event,messageAt,order);continue;}
      cue(event,cursor,order);messageAt=cursor;
    }
    if(unmatchedFaint)throw new RangeError('An unmatched faint checkpoint reached settlement.');
    if(pokeActorId!==null)throw new RangeError('An unfinished money throw reached presentation settlement.');
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
    // Final strict-time prefixes include later-emitted, backdated damage text.
    // Patch sequence and cue ordinals are separate; neither is a shared fence.
    let patchEnd=0,cueEnd=0;
    for(const checkpoint of this.faintCheckpoints){
      while(patchEnd<this.patches.length&&(this.patches[patchEnd]?.at??Infinity)<checkpoint.at)patchEnd++;
      while(cueEnd<this.cues.length&&(this.cues[cueEnd]?.at??Infinity)<checkpoint.at)cueEnd++;
      checkpoint.patchEnd=patchEnd;checkpoint.cueEnd=cueEnd;
      if((checkpoint.ends?.size??0)>checkpoint.poses+checkpoint.effects+checkpoint.numbers)throw new RangeError('Faint endpoint preservation exceeds its source records.');
    }
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
    if(this.faintPublication)throw new RangeError('A faint publication cannot enter carry.');
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

  /** Release one submitted or explicitly cancelled checkpoint, never its cues.
   * The app owns eligibility/RAF/identity validation. @param {number} index */
  releaseFaintPublication(index){
    if(this.faintPublication?.publication.index!==index||this.faintCheckpointIndex!==index)return false;
    this.faintCheckpointIndex++;this.faintPublication=null;return true;
  }

  /** Advances only bounded presentation records. Elapsed time is supplied by
   * app's foreground clock, never a timer or a gameplay catch-up loop.
   * @param {number} now @param {boolean} [finish] @param {number} [minimumDungeonTime]
   * @returns {{frame:BattleFrame,cues:PresentationCue[],completed:boolean,rawPauseMs:number,dungeonTime:number,publication?:FaintPublication}} */
  advance(now,finish=false,minimumDungeonTime=-Infinity){
    finish=finish||this.instant;
    if(finish){this.faintPublication=null;this.faintCheckpointIndex=this.faintCheckpoints.length;}
    else if(this.faintPublication)return{...this.faintPublication,cues:[],completed:false};
    const timing=this.sourceTime(now),requested=finish?Infinity:Math.max(this.lastTick,timing.tick);
    const next=finish?undefined:this.faintCheckpoints[this.faintCheckpointIndex];
    const checkpoint=next&&next.at<=requested?next:undefined;
    const tick=checkpoint?.at??requested;
    const rawPauseMs=checkpoint?this.rawPauseBefore+checkpoint.rawHolds*TICK_MS:this.finishedRawPauseMs??this.rawPauseBefore+timing.heldMs;
    // Share this exact value with the renderer: an equivalent subtraction can
    // round one binary64 step backward during a same-tick raw upload hold.
    const dungeonTime=Math.max(minimumDungeonTime,checkpoint?this.startedAt-this.rawPauseBefore+tick*TICK_MS:now-rawPauseMs);
    if(finish)this.finishedRawPauseMs=rawPauseMs;
    this.lastTick=tick;
    while(this.patchIndex<(checkpoint?.patchEnd??this.patches.length)){
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
    while(this.cueIndex<(checkpoint?.cueEnd??this.cues.length)){const cue=this.cues[this.cueIndex];if(!cue||cue.at>tick)break;this.cueIndex++;cues.push('clearNotice' in cue?{clearNotice:true}:'sound' in cue?{sound:cue.sound,audible:cue.audible,...(cue.moveOwned?{moveOwned:true}:{})}:{event:cue.event,audible:cue.audible});}
    const completed=!checkpoint&&!this.completed&&tick>=this.sourceEndTick;this.completed||=completed;
    if(finish){this.poses=[];this.effects=[];this.numbers=[];this.projectiles=[];this.backgrounds=[];this.statusHp.clear();}
    // A recipe fences creation as well as mutations. Only one frame is materialized.
    const poses=checkpoint?checkpointTracks(this.poses,checkpoint.poses,checkpoint):this.poses;
    const effectTracks=checkpoint?checkpointTracks(this.effects,checkpoint.effects,checkpoint):this.effects;
    const numberTracks=checkpoint?checkpointTracks(this.numbers,checkpoint.numbers,checkpoint):this.numbers;
    const projectileTracks=checkpoint?this.projectiles.slice(0,checkpoint.projectiles):this.projectiles;
    const backgrounds=checkpoint?this.backgrounds.slice(0,checkpoint.backgrounds):this.backgrounds;
    const terminalPose=checkpoint?poses[this.poses.indexOf(checkpoint.pose)]:undefined;
    /** @type {BattleActor[]} */const actors=[];
    for(const actor of this.actors.values())actors.push({...sampledActor(actor,poses,tick,Math.floor(dungeonTime/TICK_MS),!this.hidden.has(actor.id),terminalPose),statusHp:this.statusHp.get(actor.id)});
    /** @type {BattleEffect[]} */const effects=[];
    for(const track of effectTracks)if(!track.hidden&&track.start<=tick&&tick<track.end){
      const fraction=(tick-track.start)/(track.end-track.start),position=track.samples?.[Math.floor(tick-track.start)];
      if(track.samples&&!position)throw new RangeError('A native travel sample is missing.');
      if(position&&!position.visible)continue;
      const age=tick-track.start+(track.elapsedOffset??0);
      const elapsedTicks=track.frameTicks===undefined?age:Math.min(age,track.frameTicks-1);
      effects.push({id:track.id,actorId:track.actorId,direction:track.direction,elapsedTicks,attachmentSet:track.attachmentSet,generic:track.generic,depthY:track.depthY,depthAdd:track.depthAdd,
        ...(position?{x:position.x,y:position.y,depthY:position.depthY,depthAdd:position.depthAdd}:track.from&&track.to?{x:track.from.x+(track.to.x-track.from.x)*fraction,y:track.from.y+(track.to.y-track.from.y)*fraction}:{})});
    }
    const hero=this.actors.get('hero')??this.dungeon.hero,partner=this.actors.get('partner')??this.dungeon.partner;
    const active=Boolean(checkpoint)||tick<this.sourceEndTick;
    // Once gameplay input is available, menu changes (e.g. tactics and camera
    // discovery) read canonical state while nonblocking visual tails continue.
    const dungeon=active?{...this.dungeon,hero,partner,enemies:actors.filter(entry=>entry.actor.id!=='hero'&&entry.actor.id!=='partner'&&entry.visible).map(entry=>entry.actor),items:this.items,money:this.money,log:this.log,explored:this.explored}:this.dungeon;
    const heldNumber=checkpoint?lastMatching(numberTracks,track=>track.start<=tick&&tick<track.end):undefined;
    const number=finish?null:checkpoint?(heldNumber?{actorId:heldNumber.actorId,amount:heldNumber.amount,heal:heldNumber.heal,miss:heldNumber.miss,elapsedTicks:tick-heldNumber.start}:null):this.carryNumber(now);
    /** @type {BattleProjectile[]} */const projectiles=projectileTracks.filter(track=>track.start<=tick&&tick<track.end).map(track=>{
      if('samples' in track){
        const sample=track.samples[Math.floor(tick-track.start)];if(!sample)throw new RangeError('A money projectile sample is missing.');
        return {kind:track.kind,native:true,...sample};
      }
      const fraction=(tick-track.start)/(track.end-track.start);
      return {kind:track.kind,x:track.from.x+(track.to.x-track.from.x)*fraction,y:track.from.y+(track.to.y-track.from.y)*fraction};
    });
    // finish uses Infinity only to consume records. The camera keeps finite
    // source age and is rebased by the app after reduced-motion completion.
    const camera={target:this.camera.target,counter:advanceCameraCounter(this.camera.counter,(finish?this.sourceEndTick:tick)-this.cameraTick)};
    const background=lastMatching(backgrounds,entry=>entry.takeover<=tick&&tick<entry.end+1);
    const hypnosis=background?{elapsedTicks:tick>=background.start&&tick<background.end?tick-background.start:null,hideHud:tick>background.takeover,hideMap:tick<background.end}:null;
    const frame={dungeon,actors,effects,projectiles,number,active,camera,hypnosis};
    if(checkpoint){
      if(actors.length>MAX_ACTORS||effects.length>24||dungeon.items.length>MAX_ITEMS)throw new RangeError('Faint publication exceeds the drawing bound.');
      const publication=Object.freeze({index:this.faintCheckpointIndex,renderTime:this.startedAt+(checkpoint.at+checkpoint.rawHolds)*TICK_MS});
      this.faintPublication={frame:freezeFaintFrame(frame),publication,rawPauseMs,dungeonTime};
      return{...this.faintPublication,cues,completed:false};
    }
    return {frame,cues,completed,rawPauseMs,dungeonTime};
  }
}

/** @template {EndTrack} T @param {T[]} tracks @param {number} limit @param {FaintCheckpoint} checkpoint @returns {T[]} */
function checkpointTracks(tracks,limit,checkpoint){return tracks.slice(0,limit).map(track=>{const end=checkpoint.ends?.get(track);return end===undefined?track:{...track,end};});}

/** Freeze only one publication's owned projections; terrain identity stays shared.
 * Captured actors/items already own frozen numerical records. @param {BattleFrame} frame */
function freezeFaintFrame(frame){
  const dungeon={...frame.dungeon,enemies:[...frame.dungeon.enemies],items:[...frame.dungeon.items],log:[...frame.dungeon.log],explored:[...frame.dungeon.explored],visible:[...frame.dungeon.visible]};
  for(const values of [dungeon.enemies,dungeon.items,dungeon.log,dungeon.explored,dungeon.visible])Object.freeze(values);
  for(const values of [frame.actors,frame.effects,frame.projectiles]){for(const value of values)Object.freeze(value);Object.freeze(values);}
  if(frame.number)Object.freeze(frame.number);if(frame.hypnosis)Object.freeze(frame.hypnosis);Object.freeze(frame.camera);
  frame.dungeon=Object.freeze(dungeon);return Object.freeze(frame);
}

/** One pose projection for both drawing and source attachment sampling.
 * @param {Actor} actor @param {PoseTrack[]} poses @param {number} tick
 * @param {number} globalTick @param {boolean} [visible] @param {PoseTrack} [terminalPose] @returns {BattleActor} */
function sampledActor(actor,poses,tick,globalTick,visible=true,terminalPose){
  let x=actor.x,y=actor.y,direction=actor.direction,clip=actor.status.sleep?'rest-sleep':actor.status.bide?'bide-hold':'idle';
  /** @type {number|undefined} */let animation;
  // Untracked idle/sleep animations keep the app's shared foreground
  // clock; a completed turn must not freeze every actor on frame zero.
  let elapsedTicks=globalTick;
  const track=lastMatching(poses,candidate=>candidate.actorId===actor.id&&candidate.start<=tick&&(tick<candidate.end||candidate===terminalPose&&tick===candidate.end));
  if(track){
    direction=/** @type {import('./mechanics-types.js').Direction} */(track.direction);clip=track.clip;animation=track.animation;elapsedTicks=tick-track.start;
    if(track.from&&track.to){const end=track.moveEnd??track.end,fraction=Math.min(1,(tick-track.start)/(end-track.start));x=track.from.x+(track.to.x-track.from.x)*fraction;y=track.from.y+(track.to.y-track.from.y)*fraction;}
    if(track.walkEpoch!==undefined&&track.walkCycle!==undefined)elapsedTicks=Math.max(0,tick-track.walkEpoch)%track.walkCycle;
    if(track.repeatTicks!==undefined)elapsedTicks%=track.repeatTicks;
    if(track.rotate){const step=Math.floor(elapsedTicks/2)+(track.rotate===99?1:0);direction=rotate(direction,track.rotate===99?-step:step);animation=0;elapsedTicks%=2;}
  }else if(clip==='idle'){
    const ended=lastMatching(poses,candidate=>candidate.actorId===actor.id&&candidate.start<=tick);
    // An admitted cast that reaches its native end starts fresh idle.
    // This source boundary is local to the retained presentation evidence;
    // untracked idle continuity still uses the shared foreground clock.
    if(ended?.idleAt!==undefined&&ended.end===ended.idleAt&&ended.idleAt<=tick&&ended.direction===direction)elapsedTicks=tick-ended.idleAt;
  }
  // Native body blink uses the shared dungeon clock. Shadow suppression is
  // independent, and status sprites keep their pre-HP-change display snapshot.
  const fainting=track?.faintAt!==undefined&&tick>=track.faintAt;
  return{actor,x,y,direction,animation,clip,elapsedTicks,visible,...(fainting?{bodyVisible:(globalTick&1)!==0,shadowVisible:false}:{})};
}

/** Native projectile attachment recurrence and optional move wobble before
 * every visible travel frame. Invisible cells advance wobble phase only.
 * @param {BattleAssets} assets @param {Actor} caster @param {PoseTrack[]} poses
 * @param {number} tick @param {number} globalTick @param {string} moveId @param {MoveEffects} route
 * @param {{x:number,y:number}} from @param {{x:number,y:number}} to @param {boolean} singleTile
 * @param {(point:{x:number,y:number})=>boolean} visible
 * @returns {readonly (readonly TravelSample[])[]} */
function nativeTravelSamples(assets,caster,poses,tick,globalTick,moveId,route,from,to,singleTile,visible){
  const distance=Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y));
  if(![2,3,6].includes(route.travelSpeed)||!Number.isInteger(distance)||distance<1||distance>10)throw new RangeError('Unsupported native projectile geometry.');
  const pose=sampledActor(caster,poses,tick,globalTick);
  const attachment=assets.attachmentOffset(caster.speciesId,{direction:pose.direction,animation:pose.animation,clip:pose.clip,ticks:pose.elapsedTicks},route.attachmentSet);
  if(!attachment||!Number.isInteger(attachment.x)||!Number.isInteger(attachment.y)||attachment.x< -32768||attachment.x>32767||attachment.y< -32768||attachment.y>32767)throw new RangeError('Native projectile launch attachment is unavailable.');
  const dx=Math.sign(to.x-from.x),dy=Math.sign(to.y-from.y),attached=route.attachmentSet!==-1;
  /** @type {0|1} */const depthAdd=['ne','n','nw'].includes(caster.direction)?0:1;
  const short=(/** @type {number} */value)=>(value<<16)>>16;
  let offsetX=attachment.x,offsetY=attachment.y,phase=0;
  /** @type {TravelSample[][]} */const samples=[];
  const frames=24/route.travelSpeed,totalFrames=distance*frames,phaseStep=Math.trunc(0x80000/totalFrames);
  const amplitude=singleTile?32:Math.min(totalFrames+8,64),divisor=distance*6;
  for(let step=1;step<=distance;step++){
    /** @type {TravelSample[]} */const tileSamples=[];samples.push(tileSamples);
    const tile={x:from.x+dx*step,y:from.y+dy*step};
    if(!visible(tile)){phase+=frames*phaseStep;continue;}
    for(let frame=0;frame<frames;frame++){
      // sub_800E3AC stores every compound assignment into signed 16-bit;
      // the pre-scanned endpoint makes its divisor six times the tile distance.
      offsetX=short(Math.trunc(short(offsetX*(divisor-1))/divisor));
      offsetY=short(offsetY+9);offsetY=short(offsetY*(divisor-1));offsetY=short(Math.trunc(offsetY/divisor));offsetY=short(offsetY-9);
      const baseX=(step-1)*24+route.travelSpeed*frame;
      const baseY=from.y*24+16+dy*((step-1)*24+route.travelSpeed*frame);
      const arc=moveId==='move-attract'?nativeSin4096(Math.trunc(phase/256))*amplitude:0;
      const x=from.x*24+12+dx*baseX,depthY=baseY;
      // A raw 99 pair is transformed before this guard. Set -1 ignores pos2;
      // no creation-time validity flag may suppress the whole trajectory.
      tileSamples.push(Object.freeze({x:x+(attached?offsetX:0),y:Math.trunc((baseY*256-arc)/256)+(attached?offsetY:0),depthY,depthAdd,visible:!attached||offsetX!==99&&offsetY!==99}));
      phase+=phaseStep;
    }
  }
  return Object.freeze(samples.map(group=>Object.freeze(group)));
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
