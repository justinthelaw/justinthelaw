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
/** @typedef {{animationInfo:(speciesId:string,animation:number,direction:string)=>{frames:readonly NativeFrame[],totalTicks:number}|undefined,effectInfo:(id:number,direction:string)=>{ticks:number,attachmentSet:number,loop:boolean,blocksWait:boolean}|undefined,moveEffects:(moveId:string,speciesId:string)=>MoveEffects|undefined}} BattleAssets */
/** @typedef {{actor:Actor,x:number,y:number,direction:string,animation?:number,clip:string,elapsedTicks:number,visible:boolean}} BattleActor */
/** @typedef {{id:number,actorId?:string,x?:number,y?:number,direction:string,elapsedTicks:number,attachmentSet?:number}} BattleEffect */
/** @typedef {{actorId:string,amount:number,heal:boolean,miss:boolean,elapsedTicks:number}} BattleNumber */
/** @typedef {{kind:import('./mechanics-types.js').ItemKind,x:number,y:number}} BattleProjectile */
/** @typedef {{dungeon:DungeonState,actors:BattleActor[],effects:BattleEffect[],projectiles:BattleProjectile[],number:BattleNumber|null,active:boolean}} BattleFrame */
/** @typedef {{at:number,ordinal:number,actors?:Actor[],items?:import('./mechanics-types.js').GroundItem[],explored?:boolean[],money?:number,hide?:string,message?:string}} Patch */
/** @typedef {{actorId:string,start:number,end:number,animation?:number,clip:string,direction:string,from?:{x:number,y:number},to?:{x:number,y:number},moveEnd?:number,walkEpoch?:number,walkCycle?:number,repeatTicks?:number,rotate?:98|99}} PoseTrack */
/** @typedef {{id:number,actorId?:string,start:number,end:number,waitEnd?:number,direction:string,attachmentSet?:number,elapsedOffset?:number,from?:{x:number,y:number},to?:{x:number,y:number}}} EffectTrack */
/** @typedef {{actorId:string,amount:number,heal:boolean,miss:boolean,start:number,end:number}} NumberTrack */
/** @typedef {{event:GameEvent,audible:boolean}} PresentationCue */
/** @typedef {PresentationCue & {at:number,ordinal:number}} BattleCue */
/** @typedef {{poses:PoseTrack[],effects:EffectTrack[],number:BattleNumber|null}} BattleCarry */

const TICK_MS=1000/60;
// Conservative current producer bound:74 target/hit pieces*32 +198 levels*6
// +13 opportunity wrappers*32 +37 residual calls*16 +12 item actions*16
// +12 admitted initial-sleep wakes*8 +64 setup =4916. Native wild admission is
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
   * @param {{now:number,fast?:boolean,running?:boolean,reducedMotion?:boolean,carry?:BattleCarry}} options */
  constructor(before,result,dungeon,assets,options){
    if(result.events.length>MAX_EVENTS||before.actors.length>MAX_ACTORS||before.items.length>MAX_ITEMS)throw new RangeError('Battle presentation evidence exceeds the opening bound.');
    this.dungeon=dungeon;this.before=before;this.after=captureWorld(dungeon);this.startedAt=options.now;
    /** @type {Patch[]} */this.patches=[];
    const sameFloor=before.tiles===dungeon.tiles&&before.floor===dungeon.floor;
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
    this.explored=floorChanged?this.after.explored:before.explored;
    // A new menu/learning receipt can follow a fainted team member. Native
    // HandleFaint's visibility survives that result boundary.
    /** @type {Set<string>} */this.hidden=new Set([...this.actors.values()].filter(actor=>actor.hp<=0).map(actor=>actor.id));
    if(carry?.number&&carry.number.elapsedTicks<60)this.numbers.push({...carry.number,start:-carry.number.elapsedTicks,end:60-carry.number.elapsedTicks});
    this.compile(result,assets,options);
    if(options.reducedMotion)this.endTick=0;
  }

  /** @param {ActionResult} result @param {BattleAssets} assets
   * @param {{fast?:boolean,running?:boolean,reducedMotion?:boolean}} options */
  compile(result,assets,options){
    let cursor=0,ordinal=0,patchSequence=0,messageAt=0;
    /** @type {Map<string,{actor:Actor,segments:{from:{x:number,y:number},to:{x:number,y:number}}[]}>} */const walking=new Map();
    /** @type {{event:GameEvent,ordinal:number}[]} */let afterWalk=[];
    /** @type {Map<string,MoveEffects>} */const moves=new Map();
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
     * not AI sight or a replay of gameplay geometry. @param {{x:number,y:number}} point */
    const visibleTile=point=>{
      const focus=this.latestActor('hero',cursor)??this.dungeon.hero;
      return Math.abs(point.x-focus.x)<=6&&Math.abs(point.y-focus.y)<=5;
    };
    /** The comparative source adds a32px sprite margin. The viewport itself
     * is Blue's256x192; its exact binary margin remains unverified.
     * @param {{x:number,y:number}} point */
    const displayed=point=>{
      if(!visibleTile(point))return false;
      const focus=this.latestActor('hero',cursor)??this.dungeon.hero;
      const x=(point.x-focus.x)*24+128,y=(point.y-focus.y)*24+108;
      return x>=-32&&x<=288&&y>=-32&&y<=224;
    };
    /** sub_8042768 checks native isVisible before viewport admission.
     * @param {Actor} actor */
    const displayedActor=actor=>!hiddenActors.has(actor.id)&&displayed(actor);
    /** @param {number} id @param {Actor} actor @param {number} at @param {number|undefined} [attachmentSet] @param {string} [direction] @param {number} [waitLimit] */
    const effect=(id,actor,at,attachmentSet,direction=actor.direction,waitLimit=Infinity)=>{
      if(!displayedActor(actor))return at;
      const info=assets.effectInfo(id,direction);if(!info)return at;
      // Effect creation initializes an unloaded pose. Its first source frame
      // loads on the next tick; the terminator is visited after its last tick.
      const start=at+1,end=start+info.ticks;
      this.effects.push({id,actorId:actor.id,start,end,direction,attachmentSet:attachmentSet??info.attachmentSet});
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
     * or recipient scan occurs here. @param {MoveEffects} route @param {Actor} caster
     * @param {{x:number,y:number}} from @param {{x:number,y:number}} to */
    const travel=(route,caster,from,to)=>{
      if(!route.travel||route.travelSpeed<=0)return;
      const distance=Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y));
      if(!Number.isInteger(distance)||distance>10)throw new RangeError('A move projectile exceeds its recorded range.');
      // sub_8056564 advances once before creating a nonzero travel effect,
      // independently of the later per-cell camera visibility checks.
      cursor++;
      const info=assets.effectInfo(route.travel,caster.direction);
      const dx=Math.sign(to.x-from.x),dy=Math.sign(to.y-from.y),duration=24/route.travelSpeed;
      let elapsedOffset=0;
      for(let step=1;step<=distance;step++){
        const next={x:from.x+dx*step,y:from.y+dy*step};if(!visibleTile(next))continue;
        const previous={x:next.x-dx,y:next.y-dy};
        // The first loop RunFrame loads the new pose. Its last draw is at
        // +21px for Ember; deletion follows that eighth frame, before drain.
        if(info)this.effects.push({id:route.travel,start:cursor+1,end:cursor+duration+1,waitEnd:cursor+duration,direction:caster.direction,elapsedOffset,from:{x:previous.x*24+12,y:previous.y*24+16},to:{x:next.x*24+12,y:next.y*24+16}});
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
        if(record.action==='other'){flushWalk();cursor++;}
        messageAt=cursor;continue;
      }
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
        if(route?.preparation&&record.first){cursor++;effect(route.preparation,record.actor,cursor);}
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
            pose({actorId:record.actor.id,start:cursor+1,end:cursor+info.totalTicks+2,clip:'attack-physical',animation,direction:record.actor.direction});
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
          if(caster)travel(route,caster,caster,record.target);
        }
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
        if(Math.max(Math.abs(record.to.x-record.from.x),Math.abs(record.to.y-record.from.y))!==1)throw new RangeError('An empty Ember endpoint must be adjacent.');
        if(caster&&route){
          travel(route,caster,record.from,record.to);
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
          cursor=effect(id,record.before,cursor,3,record.before.direction,100);
          const repeatTicks=(assets.animationInfo(record.before.speciesId,6,record.before.direction)?.totalTicks??10)+1;
          pose({actorId:record.before.id,start:start+1,end:cursor+10,clip:'hit-light',animation:6,repeatTicks,direction:record.before.direction});
        }
        patchActors([record.after],cursor);
        if(reaction)cursor+=10;
        continue;
      }
      if(record?.kind==='miss'){
        flushWalk();const attacker=record.actorId?this.latestActor(record.actorId,cursor):undefined;
        const visible=displayedActor(record.target)&&(record.accuracy!==2||Boolean(attacker&&displayedActor(attacker)));
        if(visible)number(record.target,9999,true,true);messageAt=cursor;cue(event,cursor,order,visible);continue;
      }
      if(record?.kind==='heal'){
        flushWalk();const visible=displayedActor(record.before);
        if(visible)number(record.before,event.amount??Math.max(0,record.after.hp-record.before.hp),true);
        messageAt=cursor;cue(event,cursor,order,visible);patchActors([record.after],cursor);continue;
      }
      if(record?.kind==='effect'){
        flushWalk();patchActors([record.before],cursor);
        if(displayedActor(record.before))drainEffects();
        if(record.effectId!==undefined)cursor=effect(record.effectId,record.before,cursor,undefined,record.before.direction,100);
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
    this.endTick=options.reducedMotion||floorChanged?0:cursor;
    addPatch({at:cursor,ordinal:ordinal++,actors:this.after.actors,items:this.after.items,money:this.after.money,explored:this.after.explored});
    for(const actor of this.before.actors)if(!this.after.actors.some(candidate=>candidate.id===actor.id))addPatch({at:cursor,ordinal:ordinal++,hide:actor.id});
    this.patches.sort((left,right)=>left.at-right.at||left.ordinal-right.ordinal);
    this.cues.sort((left,right)=>left.at-right.at||left.ordinal-right.ordinal);
  }

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

  /** Finished evidence can be released after its nonblocking number/pose tail.
   * @param {number} now */
  hasTail(now){
    const tick=Math.floor(Math.max(0,(now-this.startedAt)/TICK_MS));
    return this.poses.some(track=>track.end>tick)||this.effects.some(track=>track.end>tick)||
      this.projectiles.some(track=>track.end>tick)||this.numbers.some(track=>track.end>tick);
  }

  /** @param {number} now @returns {BattleNumber|null} */
  carryNumber(now){
    const tick=Math.floor(Math.max(0,(now-this.startedAt)/TICK_MS));
    const number=lastMatching(this.numbers,track=>track.start<=tick&&tick<track.end);
    return number?{actorId:number.actorId,amount:number.amount,heal:number.heal,miss:number.miss,elapsedTicks:tick-number.start}:null;
  }

  /** Native input may be available while a nonblocking cast/pose/number tail
   * is still visible. Preserve those tails until the next action's source
   * drain, rather than either dropping them or delaying input artificially.
   * @param {number} now @returns {BattleCarry} */
  carry(now){
    const tick=Math.floor(Math.max(0,(now-this.startedAt)/TICK_MS));
    return {
      poses:this.poses.filter(track=>track.end>tick).map(track=>({...track,start:track.start-tick,end:track.end-tick,
        ...(track.moveEnd!==undefined?{moveEnd:track.moveEnd-tick}:{}),...(track.walkEpoch!==undefined?{walkEpoch:track.walkEpoch-tick}:{})})),
      effects:this.effects.filter(track=>track.end>tick).map(track=>({...track,start:track.start-tick,end:track.end-tick,
        ...(track.waitEnd!==undefined?{waitEnd:track.waitEnd-tick}:{})})),
      number:this.carryNumber(now),
    };
  }

  /** Advances only bounded presentation records. Elapsed time is supplied by
   * app's foreground clock, never a timer or a gameplay catch-up loop.
   * @param {number} now @param {boolean} [finish]
   * @returns {{frame:BattleFrame,cues:PresentationCue[],completed:boolean}} */
  advance(now,finish=false){
    finish=finish||this.instant;
    const tick=finish?Infinity:Math.max(this.lastTick,Math.floor(Math.max(0,(now-this.startedAt)/TICK_MS)));
    this.lastTick=tick;
    while(this.patchIndex<this.patches.length){
      const patch=this.patches[this.patchIndex];if(!patch||patch.at>tick)break;this.patchIndex++;
      for(const actor of patch.actors??[]){
        if(this.hidden.has(actor.id)&&actor.id!=='hero'&&actor.id!=='partner')continue;
        this.actors.set(actor.id,actor);
      }
      if(patch.items)this.items=patch.items;if(patch.money!==undefined)this.money=patch.money;
      if(patch.explored)this.explored=patch.explored;
      if(patch.hide){
        this.hidden.add(patch.hide);
        // A removed wild actor has no sprite or number left. Team failures
        // retain their hidden entity for the leader/partner loss routes.
        if(patch.hide!=='hero'&&patch.hide!=='partner')this.actors.delete(patch.hide);
      }
      if(patch.message){this.log.push(patch.message);if(this.log.length>80)this.log.shift();}
    }
    /** @type {PresentationCue[]} */const cues=[];
    while(this.cueIndex<this.cues.length){const cue=this.cues[this.cueIndex];if(!cue||cue.at>tick)break;this.cueIndex++;cues.push({event:cue.event,audible:cue.audible});}
    const completed=!this.completed&&tick>=this.endTick;this.completed||=completed;
    if(finish){this.poses=[];this.effects=[];this.numbers=[];this.projectiles=[];}
    /** @type {BattleActor[]} */const actors=[];
    for(const actor of this.actors.values()){
      let x=actor.x,y=actor.y,direction=actor.direction,clip=actor.status.sleep?'rest-sleep':actor.status.bide?'bide-hold':'idle';
      /** @type {number|undefined} */let animation;
      // Untracked idle/sleep animations keep the app's shared foreground
      // clock; a completed turn must not freeze every actor on frame zero.
      let elapsedTicks=Math.floor(now/TICK_MS);
      const track=lastMatching(this.poses,candidate=>candidate.actorId===actor.id&&candidate.start<=tick&&tick<candidate.end);
      if(track){
        direction=/** @type {import('./mechanics-types.js').Direction} */(track.direction);clip=track.clip;animation=track.animation;elapsedTicks=tick-track.start;
        if(track.from&&track.to){const end=track.moveEnd??track.end,fraction=Math.min(1,(tick-track.start)/(end-track.start));x=track.from.x+(track.to.x-track.from.x)*fraction;y=track.from.y+(track.to.y-track.from.y)*fraction;}
        if(track.walkEpoch!==undefined&&track.walkCycle!==undefined)elapsedTicks=Math.max(0,tick-track.walkEpoch)%track.walkCycle;
        if(track.repeatTicks!==undefined)elapsedTicks%=track.repeatTicks;
        if(track.rotate){const step=Math.floor(elapsedTicks/2)+(track.rotate===99?1:0);direction=rotate(direction,track.rotate===99?-step:step);animation=0;elapsedTicks%=2;}
      }
      actors.push({actor,x,y,direction,animation,clip,elapsedTicks,visible:!this.hidden.has(actor.id)});
    }
    /** @type {BattleEffect[]} */const effects=[];
    for(const track of this.effects)if(track.start<=tick&&tick<track.end){
      const fraction=(tick-track.start)/(track.end-track.start);
      effects.push({id:track.id,actorId:track.actorId,direction:track.direction,elapsedTicks:tick-track.start+(track.elapsedOffset??0),attachmentSet:track.attachmentSet,
        ...(track.from&&track.to?{x:track.from.x+(track.to.x-track.from.x)*fraction,y:track.from.y+(track.to.y-track.from.y)*fraction}:{})});
    }
    const hero=this.actors.get('hero')??this.dungeon.hero,partner=this.actors.get('partner')??this.dungeon.partner;
    const active=tick<this.endTick;
    // Once gameplay input is available, menu changes (e.g. tactics and camera
    // discovery) read canonical state while nonblocking visual tails continue.
    const dungeon=active?{...this.dungeon,hero,partner,enemies:actors.filter(entry=>entry.actor.id!=='hero'&&entry.actor.id!=='partner'&&entry.visible).map(entry=>entry.actor),items:this.items,money:this.money,log:this.log,explored:this.explored}:this.dungeon;
    const number=finish?null:this.carryNumber(now);
    const projectiles=this.projectiles.filter(track=>track.start<=tick&&tick<track.end).map(track=>{
      const fraction=(tick-track.start)/(track.end-track.start);
      return {kind:track.kind,x:track.from.x+(track.to.x-track.from.x)*fraction,y:track.from.y+(track.to.y-track.from.y)*fraction};
    });
    return {frame:{dungeon,actors,effects,projectiles,number,active},cues,completed};
  }
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
