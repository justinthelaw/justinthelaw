import { beginDungeonFloor, createDungeonRandomState, validateRandomState } from '../domain/rng.js';
import { buildLayout, isTinyWoodsParameters } from '../domain/generation/layouts.js';
import { addTinyWoodsHallways } from '../domain/generation/features.js';
import { Draws, finalizeGeometry, positions, ordinary, reachable } from '../domain/generation/support.js';
import { openingSpawns, spawnScanOrder, arrivalPosition } from './mechanics-generation.js';
import { cameraSight } from './mechanics-visibility.js';
import { dropItem, ITEM_NAMES, moneyPile } from './mechanics-items.js';
import { captureActor } from './battle-events.js';
import { DEFAULT_IQ, IQ_SKILLS, TACTICS, hasIq, tacticFor, considersLineMove, considersLineTarget, canTalk, talkToPartner } from './mechanics-policy.js';
import { attack, damage, beginTurn, finishTurn, heal, moveSlot, moveTargets, resetSecondaryGates, supportsMove, STATUS_KEYS, ABILITY_VISUAL_FLAGS } from './mechanics-combat.js';
import { actors, actorAt, canStep, clearQueuedMovement, directionFor, distance, draw, flushQueuedMovement, index, inSight, message, moveActor, nextStep, open, pickup, recordAction, recordCamera, recordSync, team, wakeInitialSleep, wakeNearbyWild, DIRECTIONS, VECTORS } from './mechanics-common.js';

export { resetSecondaryGates } from './mechanics-combat.js';

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').OpeningData} OpeningData */
/** @typedef {import('./mechanics-types.js').DungeonOptions} DungeonOptions */
/** @typedef {import('./mechanics-types.js').DungeonAction} DungeonAction */
/** @typedef {import('./mechanics-types.js').ActionResult} ActionResult */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */
/** @typedef {import('./mechanics-types.js').Point} Point */
/** @typedef {import('./mechanics-types.js').HeldItem} HeldItem */

const DATA_URL = new URL('../../content/blue-opening.json', import.meta.url);
const WIDTH=56, HEIGHT=32;

/** One compact, local factual resource; no full-campaign catalogs are loaded.
 * @param {AbortSignal} [signal] @returns {Promise<OpeningData>} */
export async function loadOpeningData(signal) {
  const response=await fetch(DATA_URL,{credentials:'same-origin',signal});
  if(!response.ok)throw new Error(`Opening data could not load (${response.status}).`);
  const text=await response.text();if(text.length>500000)throw new Error('Opening data is too large.');
  const data=/** @type {OpeningData} */(JSON.parse(text));
  if(data.version!==1||data.starterIds.length!==16||data.floors.length!==3||!data.moves['regular-attack']||data.wildSpawn?.randomMovementChance!==0)throw new Error('Unsupported opening data.');
  for(const [index,floor] of data.floors.entries())if(floor.number!==index+1||!isTinyWoodsParameters(floor.generation,index+1))throw new Error('Unsupported Tiny Woods floor profile.');
  for(const floor of data.floors)for(const row of floor.encounters){const chance=data.species[row.speciesId]?.chanceAsleep;if(typeof chance!=='number'||!Number.isInteger(chance)||chance<0||chance>100)throw new Error('Missing opening wild sleep facts.');}
  return data;
}
/** @param {OpeningData} data @param {string} speciesId @param {string} id @param {string} name @param {number} level @returns {Actor} */
function createActor(data,speciesId,id,name,level) {
  const p=data.species[speciesId];if(!p)throw new Error(`Unknown opening species ${speciesId}.`);
  const sums=[...p.baseStats];for(const row of p.growth.slice(0,level))for(let i=0;i<5;i++)sums[i]=(sums[i]??0)+(row[i+1]??0);
  const stats={hp:sums[0]??1,attack:sums[1]??1,specialAttack:sums[2]??1,defense:sums[3]??1,specialDefense:sums[4]??1};
  const learned=p.learnset.filter(([at])=>at<=level).slice(0,4).map(([,move])=>moveSlot(data,move));
  return {id,speciesId,name:Array.from(name).slice(0,10).join('')||p.name,x:0,y:0,direction:'s',level,hp:stats.hp,maxHp:stats.hp,belly:100,maxBelly:100,exp:p.growth[level-1]?.[0]??0,stats,moves:learned,status:{},periodic:{poison:0,burn:0,leechSeed:0},stages:{attack:10,specialAttack:10,defense:10,specialDefense:10,accuracy:10,evasion:10},heldItem:null,regen:0,usedMove:false,experienceMarked:false,goal:null,leechSource:null,bideDamage:0,skipAction:false,physicalOffenseMultiplierQ8:256,specialOffenseMultiplierQ8:256,physicalDefenseMultiplierQ8:256,specialDefenseMultiplierQ8:256,useHeldItem:false,tactic:'together',enabledIq:[...DEFAULT_IQ],abilityVisualFlags:0};
}
/** One browser-owned initial word, not Blue's frame/input global RNG.
 * Four-word callers retain the historical tuple admission checks before using
 * their documented first word. @param {number|[number,number,number,number]|undefined} seed */
function dungeonPreseed(seed){
  if(!Array.isArray(seed))return (seed??Date.now())>>>0;
  const admitted=validateRandomState({algorithm:'xoshiro128ss-v1',words:seed,draws:0});
  if(admitted.algorithm!=='xoshiro128ss-v1')throw new TypeError('Invalid or unsupported random state.');
  return admitted.words[0];
}
/** @param {DungeonOptions} options @param {OpeningData} data @returns {DungeonState} */
export function createDungeon(options,data) {
  if(!data.starterIds.includes(options.heroSpeciesId)||!data.starterIds.includes(options.partnerSpeciesId))throw new Error('Choose an original starter pair.');
  const heroData=data.species[options.heroSpeciesId],partnerData=data.species[options.partnerSpeciesId];
  if(!heroData||!partnerData||!['pokemon-001','pokemon-004','pokemon-007','pokemon-025','pokemon-152','pokemon-155','pokemon-158','pokemon-252','pokemon-255','pokemon-258'].includes(options.partnerSpeciesId)||heroData.types.some(t=>t!=='None'&&partnerData.types.includes(t)))throw new Error("This partner shares the hero's type.");
  /** @type {DungeonState} */
  const state={version:1,floor:1,width:WIDTH,height:HEIGHT,tiles:[],roomIds:[],explored:[],visible:[],rooms:[],stairs:{x:0,y:0},hero:createActor(data,options.heroSpeciesId,'hero',options.heroName??heroData.name,5),partner:createActor(data,options.partnerSpeciesId,'partner',options.partnerName??partnerData.name,5),enemies:[],items:[],money:0,turn:0,floorTurn:0,baseBeat:0,leaderPrepared:false,log:[],status:'playing',rng:createDungeonRandomState(dungeonPreseed(options.seed)),mudSport:0,waterSport:0,nextId:1,pendingLearning:[],tutorials:[],fidelityNotes:['Qualified original-game numerical facts; Blue binary parity is unverified.','Native-family dungeon LCG core; browser initial seeding, bounded generation repair, call schedule, autonomous movement and timing remain adapted; cartridge replay parity is not claimed.']};
  generateFloor(state,data,[]);return state;
}
/** @param {DungeonState} state @param {OpeningData} data @param {GameEvent[]} events */
function generateFloor(state,data,events) {
  const floor=data.floors[state.floor-1];if(!floor)throw new Error('Tiny Woods ends after B3F.');
  if(floor.number!==state.floor||!isTinyWoodsParameters(floor.generation,state.floor))throw new Error('Unsupported Tiny Woods floor profile.');
  clearQueuedMovement(state);resetSecondaryGates(state);
  state.rng=beginDungeonFloor(state.rng);
  const rng=new Draws(state.rng);let geometry=buildLayout(floor.generation,rng);
  for(let attempt=0;attempt<12;attempt++) {
    if(attempt)geometry=buildLayout(floor.generation,rng);
    addTinyWoodsHallways(geometry,rng);finalizeGeometry(geometry);
    const candidates=positions(geometry,t=>ordinary(t)&&t.room!==null),first=candidates[0];
    const reached=first?reachable(geometry,first):new Set();
    if(first&&candidates.length>=30&&new Set(candidates.map(p=>geometry.cells[p.z]?.[p.x]?.room)).size>=2&&candidates.every(p=>reached.has(p.z*WIDTH+p.x)))break;
    if(attempt===11)throw new Error('Unable to create connected Tiny Woods rooms.');
  }
  const spawns=openingSpawns(geometry,floor.generation,rng);
  state.rng=rng.state;state.tiles=geometry.cells.flat().map(t=>ordinary(t)?1:0);state.roomIds=geometry.cells.flat().map(t=>t.room??-1);state.rooms=geometry.rooms.map(r=>({x:r.bounds.x,y:r.bounds.z,width:r.bounds.width,height:r.bounds.height}));
  state.explored=Array(WIDTH*HEIGHT).fill(false);state.visible=Array(WIDTH*HEIGHT).fill(false);state.enemies=[];state.items=[];state.floorTurn=0;state.baseBeat=0;state.leaderPrepared=false;state.mudSport=0;state.waterSport=0;state.status='playing';
  state.hero.x=spawns.hero.x;state.hero.y=spawns.hero.y;state.partner.x=spawns.partner.x;state.partner.y=spawns.partner.y;
  state.hero.direction=state.partner.direction='s';
  for(const actor of [state.hero,state.partner]){actor.status={};actor.periodic={poison:0,burn:0,leechSeed:0};actor.stages={attack:10,specialAttack:10,defense:10,specialDefense:10,accuracy:10,evasion:10};actor.physicalOffenseMultiplierQ8=256;actor.specialOffenseMultiplierQ8=256;actor.physicalDefenseMultiplierQ8=256;actor.specialDefenseMultiplierQ8=256;actor.goal=null;actor.leechSource=null;actor.bideDamage=0;actor.skipAction=false;actor.useHeldItem=false;actor.regen=0;actor.abilityVisualFlags=0;}
  state.stairs=spawns.stairs;
  // Native realization places the team, then wild actors, then actual items.
  // An enemy flag covered by the partner does not relocate to a different tile.
  for(const point of spawnScanOrder(state,spawns.enemies))spawnEnemy(state,data,point,events);
  for(const point of spawnScanOrder(state,spawns.items)){
    draw(state,10000); // Item category selection, including a single-category pool.
    const itemRoll=draw(state,10000),kind=state.floor<3?'poke':itemRoll<=7500?'oran-berry':'pecha-berry';
    if(kind!=='poke')draw(state,100); // Zero sticky chance still consumes its draw.
    state.items.push({id:`item-${state.nextId++}`,kind,x:point.x,y:point.y,amount:kind==='poke'?moneyPile(state):1});
  }
  updateVisibility(state);events.push({type:'floor',amount:state.floor});message(state,events,`Tiny Woods B${state.floor}F`);
}
/** @param {DungeonState} state @param {OpeningData} data @param {Point|null} [initialPosition] @param {GameEvent[]} [events] */
function spawnEnemy(state,data,initialPosition=null,events=[]) {
  if(state.enemies.filter(a=>a.hp>0).length>=10)return;
  const floor=data.floors[state.floor-1];if(!floor)return;const roll=draw(state,10000),row=floor.encounters.find(e=>roll<=e.threshold);if(!row)return;
  const p=initialPosition??arrivalPosition(state);if(!p||actorAt(state,p.x,p.y))return;
  // Only ordinary arrivals execute the zero-percent movement-chance call.
  // Initial floor materialization supplies moveRandomly=false without a draw.
  if(initialPosition===null)draw(state,100);
  const species=data.species[row.speciesId],chance=species?.chanceAsleep;
  if(!species||typeof chance!=='number')throw new Error('Missing native wild sleep chance.');
  const actor=createActor(data,row.speciesId,`enemy-${state.nextId++}`,species.name,row.level);
  actor.x=p.x;actor.y=p.y;actor.direction=DIRECTIONS[draw(state,8)]??'s';
  // SpawnWildMon samples after initialization, even for a zero chance. The
  // preceding compact facing/AI and browser PRNG remain qualified adaptations.
  if(draw(state,100)<chance)actor.status.sleep=127;
  const vacant=state.enemies.findIndex(candidate=>candidate.hp<=0);
  if(vacant<0)state.enemies.push(actor);else state.enemies[vacant]=actor;
  recordSync(state,events,[actor]);
}
/** @param {DungeonState} state */
export function updateVisibility(state) {
  cameraSight(state,state.hero,state.visible);
  for(let index=0;index<state.visible.length;index++)if(state.visible[index])state.explored[index]=true;
}
/** @param {DungeonState} state */
export function getGroundItem(state) { return state.items.find(i=>i.x===state.hero.x&&i.y===state.hero.y)??null; }
/** @param {HeldItem['kind']} kind */
export function itemName(kind) { return ITEM_NAMES[kind]; }
/** @param {DungeonState} state @param {Actor} actor @param {HeldItem} item @param {GameEvent[]} events */
function eat(state,actor,item,events) {
  if(item.kind==='poke')return false;
  recordAction(events,actor.id,'other',actor);
  flushQueuedMovement(state,events);
  message(state,events,`${actor.name} ate the ${ITEM_NAMES[item.kind]}.`);
  berryEffect(state,actor,item,events);return true;
}
/** Berries apply their recipient effect and five Belly points whether eaten
 * or hit by an uncaught projectile. They cannot be caught into a held slot.
 * @param {DungeonState} state @param {Actor} actor @param {HeldItem} item @param {GameEvent[]} events */
function berryEffect(state,actor,item,events) {
  if(item.kind==='oran-berry')heal(state,actor,100,events);
  if(item.kind==='pecha-berry'){delete actor.status.poison;message(state,events,`${actor.name} is free of poison.`);}
  if(item.kind==='rawst-berry'){delete actor.status.burn;message(state,events,`${actor.name} is free of burns.`);}
  actor.belly=Math.min(actor.maxBelly,actor.belly+5);events.push({type:'item',actorId:actor.id,text:item.kind,presentation:{kind:'sync',actors:[captureActor(actor)],berryResult:true}});
}
/** Ordinary ground Poké keeps its complete value. The comparative native
 * category6 route catches or deals one direct HP; it never uses berryEffect.
 * Mechanics owns every scan, roll, catch and placement; receipts are detached.
 * @param {DungeonState} state @param {import('./mechanics-types.js').GroundItem} item
 * @param {OpeningData} data @param {GameEvent[]} events */
function throwGroundPoke(state,item,data,events){
  const actor=state.hero,origin={x:actor.x,y:actor.y},[dx,dy]=VECTORS[actor.direction];
  recordAction(events,actor.id,'other',actor);flushQueuedMovement(state,events);
  state.items=state.items.filter(candidate=>candidate.id!==item.id);recordSync(state,events,[],true);
  message(state,events,`${actor.name} threw ${item.amount} Poké.`,{kind:'poke-spin',actor:captureActor(actor)});
  let endpoint={...origin},visualEndpoint={...origin};
  /** @type {'range'|'wall'|'target'|'outside'} */let stop='range';
  /** @type {Actor|undefined} */let target;
  for(let step=1;step<=10;step++){
    const next={x:origin.x+dx*step,y:origin.y+dy*step};
    if(next.x<0||next.y<0||next.x>=WIDTH||next.y>=HEIGHT){stop='outside';break;}
    visualEndpoint=next;
    if(!open(state,next.x,next.y)){stop='wall';break;}
    endpoint=next;target=actorAt(state,next.x,next.y);if(target){stop='target';break;}
  }
  events.push({type:'presentation',presentation:{kind:'poke-flight',from:Object.freeze(origin),to:Object.freeze(visualEndpoint)}});
  try{
    if(stop==='outside'){message(state,events,'The item flew out of reach.');return;}
    if(target){
      if(draw(state,100)<90){
        message(state,events,`${item.amount} Poké hit ${target.name}.`);
        wakeInitialSleep(state,target,events);
        const catches=!target.heldItem&&(!team(target)||hasIq(target,'item-catcher'))&&!['sleep','infatuated','bide'].some(status=>!!target.status[status]);
        if(catches){
          // Native SE333 is held pending its separate noise-player admission.
          message(state,events,`${target.name} caught ${item.amount} Poké.`,{kind:'poke-catch'});
          target.heldItem={kind:'poke',amount:item.amount};recordSync(state,events,[target]);
          wakeNearbyWild(state,events);return;
        }
        events.push({type:'presentation',presentation:{kind:'poke-impact',target:captureActor(target)}});
        // A successful uncaught hit consumes the whole pile. Preserve prior
        // experienceMarked/usedMove: giving EXP does not mark an item as a move.
        damage(state,target,1,data,events,actor,{cause:'item',giveExp:true});return;
      }
      message(state,events,`${item.amount} Poké missed ${target.name}.`);
    }
    dropItem(state,item,endpoint,events,item.id,result=>{
      events.push({type:'presentation',presentation:{kind:'poke-drop',from:Object.freeze({...visualEndpoint}),origin:Object.freeze({...endpoint}),direction:actor.direction,landing:result.landing,placed:result.placed}});
    });
    recordSync(state,events,[],true);
  }finally{
    events.push({type:'presentation',presentation:{kind:'poke-end',actor:captureActor(actor)}});
  }
}
/** Ordinary Tiny Woods berry projectile: all sixteen original starters can
 * throw. No trajectory equipment or special airborne targets occur here.
 * @param {DungeonState} state @param {import('./mechanics-types.js').GroundItem} item @param {GameEvent[]} events */
function throwGroundBerry(state,item,events) {
  recordAction(events,state.hero.id,'other',state.hero);
  flushQueuedMovement(state,events);
  state.items=state.items.filter(candidate=>candidate.id!==item.id);recordSync(state,events,[],true);throwBerry(state,state.hero,item,events);
}
/** @param {DungeonState} state @param {Actor} actor @param {import('./mechanics-types.js').GroundItem} item @param {GameEvent[]} events */
function throwBerry(state,actor,item,events){
  flushQueuedMovement(state,events);
  const origin={x:actor.x,y:actor.y},[dx,dy]=VECTORS[actor.direction];
  let endpoint={...origin};/** @type {Actor|undefined} */let target;
  message(state,events,`${actor.name} threw the ${ITEM_NAMES[item.kind]}.`);
  for(let step=1;step<=10;step++){
    const next={x:origin.x+dx*step,y:origin.y+dy*step};
    if(next.x<0||next.y<0||next.x>=WIDTH||next.y>=HEIGHT){message(state,events,'The item flew out of reach.');return;}
    if(!open(state,next.x,next.y))break;
    endpoint=next;target=actorAt(state,next.x,next.y);if(target)break;
  }
  events.push({type:'throw',actorId:actor.id,text:item.kind,from:origin,to:endpoint});
  if(target){
    if(draw(state,100)<90){
      message(state,events,`${ITEM_NAMES[item.kind]} hit ${target.name}.`);
      wakeInitialSleep(state,target,events);
      berryEffect(state,target,item,events);return;
    }
    message(state,events,`${ITEM_NAMES[item.kind]} missed ${target.name}.`);
  }
  // A miss stops at its first actor instead of passing through.
  dropItem(state,item,endpoint,events,item.id);recordSync(state,events,[],true);
}
/** @param {DungeonState} state @param {Actor} actor @param {OpeningData} data @param {GameEvent[]} events */
function actAI(state,actor,data,events) {
  const eventStart=events.length;
  try {
    if(actor.useHeldItem){
      actor.useHeldItem=false;
      if(actor.heldItem&&actor.heldItem.kind!=='poke'){eat(state,actor,actor.heldItem,events);actor.heldItem=null;}
      else {recordAction(events,actor.id,'other',actor);message(state,events,`${actor.name} had second thoughts.`);}
      return;
    }
    if(tryAiItem(state,actor,events))return;
    const foes=actors(state).filter(a=>team(a)!==team(actor)&&inSight(state,actor,a)).sort((a,b)=>distance(actor,a)-distance(actor,b));
    const target=foes[0];
    const travelFirst=hasIq(actor,'dedicated-traveler');
    if(travelFirst&&tryAiMovement(state,actor,target,events))return;
    const closedNoFoe=!target&&canChooseWithoutVisibleFoe(actor);
    if((target||closedNoFoe)&&tryAiAttack(state,actor,target,data,events))return;
    if(!travelFirst)tryAiMovement(state,actor,target,events);
  } finally {
    if(!events.slice(eventStart).some(event=>event.presentation?.kind==='action'&&event.presentation.actorId===actor.id))recordAction(events,actor.id,'wait');
    recordSync(state,events,[actor]);
  }
}
/** Native berry weights distinguish self-use from helping an ally and still
 * make the probability draw at 100 percent. Explicit Use bypasses these checks.
 * @param {DungeonState} state @param {Actor} actor @param {GameEvent[]} events */
function tryAiItem(state,actor,events){
  const item=actor.heldItem;if(!item||item.kind==='poke'||!hasIq(actor,'item-master'))return false;
  const weight=/** @param {Actor} recipient @param {boolean} other */(recipient,other)=>{
    const adjacent=actors(state).some(foe=>team(foe)!==team(recipient)&&distance(foe,recipient)<=1);
    if(item.kind==='oran-berry')return recipient.hp<recipient.maxHp&&recipient.hp<=Math.floor(recipient.maxHp/4)?!other&&adjacent?100:50:0;
    if(item.kind==='pecha-berry')return recipient.status.poison?adjacent?100:50:0;
    return item.kind==='rawst-berry'&&recipient.status.burn?50:0;
  };
  const self=weight(actor,false);
  if(self&&draw(state,100)<self){eat(state,actor,item,events);actor.heldItem=null;return true;}
  const directions=new Set();
  for(const ally of actors(state)){
    if(ally.id===actor.id||team(ally)!==team(actor)||!considersLineTarget(state,actor,ally,10))continue;
    const direction=directionFor(ally.x-actor.x,ally.y-actor.y);if(directions.has(direction))continue;directions.add(direction);
    if(draw(state,100)>=weight(ally,true))continue;
    recordAction(events,actor.id,'other',actor);actor.direction=direction;flushQueuedMovement(state,events);actor.heldItem=null;recordSync(state,events,[actor]);
    throwBerry(state,actor,{...item,id:`item-${state.nextId++}`,x:actor.x,y:actor.y},events);return true;
  }
  return false;
}
/** Default opening actors lack Exp. Go-Getter and Efficiency Expert, so
 * TargetRegularAttack returns the first attackable enemy from current facing
 * in native increasing-direction order without a target-choice draw.
 * @param {DungeonState} state @param {Actor} actor @returns {import('./mechanics-types.js').Direction|undefined} */
function aiRegularDirection(state,actor){
  const start=DIRECTIONS.indexOf(actor.direction);
  for(let offset=0;offset<DIRECTIONS.length;offset++){
    // Browser indices run opposite to native South, Southeast, East, ... .
    const direction=DIRECTIONS[(start-offset+DIRECTIONS.length)%DIRECTIONS.length]??'s',[dx,dy]=VECTORS[direction];
    const candidate=actorAt(state,actor.x+dx,actor.y+dy);
    if(candidate&&team(candidate)!==team(actor)&&canStep(state,actor,dx,dy)&&(team(actor)||!candidate.status.freeze))return direction;
  }
  return undefined;
}
/** Native AI tuple 0x80 scans active actor slots after a move wins the
 * opportunity draw, keeps at most one eligible adjacent target per direction,
 * and consumes a target-choice draw even when there is only one candidate.
 * Opening team actors lack Status Checker; Tiny Woods wild actors have it.
 * @type {ReadonlySet<string>} */
const AI_ADJACENT_MOVE_IDS=new Set(['move-ember','move-hypnosis','move-leech-seed','move-mud-slap','move-sand-attack','move-smokescreen','move-water-gun']);
/** Native AI tuple zero uses adjacent enemy targeting even when the player
 * range later applies Focus Energy, Rage or Withdraw to the user.
 * @type {ReadonlySet<string>} */
const AI_FRONT_MOVE_IDS=new Set(['move-tackle','move-vine-whip','move-scratch','move-tail-whip','move-thunder-shock','move-thunder-wave','move-bite','move-leer','move-pound','move-absorb','move-focus-energy','move-rage','move-withdraw']);
/** @type {ReadonlySet<string>} */
const AI_TWO_TILE_MOVE_IDS=new Set(['move-growl','move-quick-attack']);
/** @type {ReadonlySet<string>} */
const AI_LINE_MOVE_IDS=new Set(['move-bubble','move-razor-leaf']);
/** A no-visible-foe chooser call is closed only when every enabled slot uses
 * one of the source-matched opening resolvers below. Empty enabled sets are
 * intentional: native can still weight the regular attack opportunity.
 * Confusion and Dedicated Traveler retain their current scheduling boundary.
 * @param {Actor} actor */
function canChooseWithoutVisibleFoe(actor){
  if(actor.status.confusion||hasIq(actor,'dedicated-traveler'))return false;
  return actor.moves.filter(move=>move.enabled).every(move=>AI_ADJACENT_MOVE_IDS.has(move.id)||AI_FRONT_MOVE_IDS.has(move.id)||AI_TWO_TILE_MOVE_IDS.has(move.id)||AI_LINE_MOVE_IDS.has(move.id));
}
/** @type {readonly import('./mechanics-types.js').Direction[]} */
const AI_NATIVE_DIRECTIONS=['s','se','e','ne','n','nw','w','sw'];
/** Opening-represented CanUseOnTargetWithStatusChecker cases for these tuples.
 * @param {Actor} target @param {string} moveId */
function aiStatusCheckerRejects(target,moveId){
  if(target.status.freeze&&moveId!=='move-ember')return true;
  if(moveId==='move-hypnosis')return !!target.status.sleep;
  if(moveId==='move-leech-seed')return !!target.status.leechSeed;
  if(moveId==='move-sand-attack')return (target.stages.accuracy??10)<=0;
  if(moveId==='move-thunder-wave')return !!target.status.paralysis;
  if(moveId==='move-leer'||moveId==='move-tail-whip')return (target.stages.defense??10)<=0;
  return moveId==='move-smokescreen'&&!!target.status.whiffer;
}
/** @param {DungeonState} state @param {Actor} actor @param {string} moveId @returns {Actor|undefined} */
function aiAdjacentMoveTarget(state,actor,moveId){
  /** @type {Actor[]} */const candidates=[];const directions=new Set();
  for(const candidate of actors(state)){
    if(team(candidate)===team(actor)||distance(actor,candidate)!==1||!inSight(state,actor,candidate))continue;
    const direction=directionFor(candidate.x-actor.x,candidate.y-actor.y);
    if(directions.has(direction))continue;
    // Status Checker belongs to every opening wild profile, but not to the
    // default-IQ team. Ember is the sole scoped move that can hit Freeze.
    if(!team(actor)&&aiStatusCheckerRejects(candidate,moveId))continue;
    directions.add(direction);candidates.push(candidate);
  }
  return candidates.length?candidates[draw(state,candidates.length)]:undefined;
}
/** Tuple zero scans fixed native direction order rather than actor-slot order.
 * @param {DungeonState} state @param {Actor} actor @param {string} moveId
 * @returns {Actor|undefined} */
function aiFrontMoveTarget(state,actor,moveId){
  /** @type {Actor[]} */const candidates=[];
  for(const direction of AI_NATIVE_DIRECTIONS){
    const [dx,dy]=VECTORS[direction],candidate=actorAt(state,actor.x+dx,actor.y+dy);
    if(!candidate||team(candidate)===team(actor)||!canStep(state,actor,dx,dy))continue;
    if(!team(actor)&&aiStatusCheckerRejects(candidate,moveId))continue;
    candidates.push(candidate);
  }
  return candidates.length?candidates[draw(state,candidates.length)]:undefined;
}
/** Native AI tuple 0x40 checks the adjacent tile before distance two in each
 * fixed-order direction. The first-step attack gate is not repeated at two.
 * Both opening owners are partners and therefore lack Status Checker.
 * @param {DungeonState} state @param {Actor} actor @returns {Actor|undefined} */
function aiTwoTileMoveTarget(state,actor){
  /** @type {Actor[]} */const candidates=[];
  for(const direction of AI_NATIVE_DIRECTIONS){
    const [dx,dy]=VECTORS[direction];if(!canStep(state,actor,dx,dy))continue;
    const adjacent=actorAt(state,actor.x+dx,actor.y+dy);
    if(adjacent&&team(adjacent)!==team(actor)){candidates.push(adjacent);continue;}
    const distant=actorAt(state,actor.x+dx*2,actor.y+dy*2);
    if(distant&&team(distant)!==team(actor))candidates.push(distant);
  }
  return candidates.length?candidates[draw(state,candidates.length)]:undefined;
}
/** Native AI tuple 0x50 scans active slots and retains the first eligible
 * target in each aligned direction. Both opening owners are partners.
 * @param {DungeonState} state @param {Actor} actor @returns {Actor|undefined} */
function aiLineMoveTarget(state,actor){
  /** @type {Actor[]} */const candidates=[];
  /** @type {Set<import('./mechanics-types.js').Direction>} */const directions=new Set();
  for(const candidate of actors(state)){
    if(candidate.id===actor.id||team(candidate)===team(actor)||!considersLineTarget(state,actor,candidate,10))continue;
    const direction=directionFor(candidate.x-actor.x,candidate.y-actor.y);
    if(directions.has(direction))continue;
    directions.add(direction);candidates.push(candidate);
  }
  return candidates.length?candidates[draw(state,candidates.length)]:undefined;
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor|undefined} target @param {OpeningData} data @param {GameEvent[]} events */
function tryAiAttack(state,actor,target,data,events){
  const regularDirection=aiRegularDirection(state,actor);
  if(target)actor.direction=directionFor(target.x-actor.x,target.y-actor.y);
  const struggle=data.moves['move-struggle'];
  const exhausted=actor.moves.every(m=>m.pp===0);
  if(exhausted&&struggle&&moveTargets(state,actor,struggle).some(a=>team(a)!==team(actor))){attack(state,actor,'struggle',data,events);return true;}
  // Default party IQ has no PP Checker and may select an exhausted slot.
  // Wild Tiny Woods profiles do have it, along with Status Checker.
  const eligible=exhausted?[]:actor.moves.map((m,slot)=>({m,slot,data:data.moves[m.id]})).filter(x=>x.data&&supportsMove(x.data)&&x.m.enabled&&(team(actor)||x.m.pp>0)&&(AI_ADJACENT_MOVE_IDS.has(x.m.id)||AI_FRONT_MOVE_IDS.has(x.m.id)||AI_TWO_TILE_MOVE_IDS.has(x.m.id)||AI_LINE_MOVE_IDS.has(x.m.id)||(target&&((x.data.range===5||x.data.range===8)?considersLineMove(state,actor,target,x.data):moveTargets(state,actor,x.data).some(a=>team(a)!==team(actor)||x.data?.range===7&&distance(actor,target)<=2)))));
  const regular=data.moves['regular-attack'],regularEligible=!hasIq(actor,'exclusive-move-user')&&!!regular;
  const useRegular=()=>{if(!regularEligible||!regularDirection)return false;actor.direction=regularDirection;attack(state,actor,null,data,events);return true;};
  let total=!exhausted&&regularEligible?([100,20,30,40,50][actor.moves.filter(m=>m.enabled).length]??50):0;
  for(const candidate of eligible)total+=candidate.data?.aiWeight??0;
  if(total<=0)return false;
  // Native ChooseAIMove uses cumulativeWeight >= draw, including roll zero.
  // Preserve its inclusive endpoint; target-choice pools use a different bound.
  let selected=draw(state,total);
  for(const candidate of eligible){
    selected-=candidate.data?.aiWeight??0;
    if(selected<=0){
      if(AI_ADJACENT_MOVE_IDS.has(candidate.m.id)){
        const moveTarget=aiAdjacentMoveTarget(state,actor,candidate.m.id);
        if(!moveTarget)return useRegular();
        actor.direction=directionFor(moveTarget.x-actor.x,moveTarget.y-actor.y);
      }
      if(AI_FRONT_MOVE_IDS.has(candidate.m.id)){
        const moveTarget=aiFrontMoveTarget(state,actor,candidate.m.id);
        if(!moveTarget)return useRegular();
        actor.direction=directionFor(moveTarget.x-actor.x,moveTarget.y-actor.y);
      }
      if(AI_TWO_TILE_MOVE_IDS.has(candidate.m.id)){
        const moveTarget=aiTwoTileMoveTarget(state,actor);
        if(!moveTarget)return useRegular();
        actor.direction=directionFor(moveTarget.x-actor.x,moveTarget.y-actor.y);
      }
      if(AI_LINE_MOVE_IDS.has(candidate.m.id)){
        const moveTarget=aiLineMoveTarget(state,actor);
        if(!moveTarget)return useRegular();
        actor.direction=directionFor(moveTarget.x-actor.x,moveTarget.y-actor.y);
      }
      attack(state,actor,candidate.slot,data,events);return true;
    }
  }
  return useRegular();
}
/** Source-qualified subset of native corridor-junction wandering. Enter only
 * when a legal unoccupied non-opposite branch proves the first native scan must
 * walk; fallback waiting/ally-skip owners remain outside this partial repair.
 * Browser direction indices rotate opposite native indices.
 * @param {DungeonState} state @param {Actor} actor @param {GameEvent[]} events
 * @returns {boolean|null} true when a junction walk was handled, otherwise null */
function tryJunctionWander(state,actor,events){
  if((state.roomIds[index(state,actor.x,actor.y)]??-1)>=0)return null;
  const nativeIndex=/** @param {number} browserIndex */browserIndex=>(8-browserIndex)&7;
  let mask=0;
  for(let browserIndex=0;browserIndex<DIRECTIONS.length;browserIndex++){
    const [dx,dy]=VECTORS[DIRECTIONS[browserIndex]??'s'];
    if(canStep(state,actor,dx,dy))mask|=1<<nativeIndex(browserIndex);
  }
  if(![0x54,0x51,0x45,0x15,0x55].includes(mask))return null;
  const prior=DIRECTIONS.indexOf(actor.direction),opposite=(prior+4)&7;
  const available=/** @param {number} browserIndex */browserIndex=>{
    const [dx,dy]=VECTORS[DIRECTIONS[browserIndex]??'s'];
    return browserIndex!==opposite&&canStep(state,actor,dx,dy)&&!actorAt(state,actor.x+dx,actor.y+dy);
  };
  if(!DIRECTIONS.some((_,browserIndex)=>available(browserIndex)))return null;
  const origin=nativeIndex(draw(state,8));
  for(const increment of [0,-1,1,-2,2,-3,3,4]){
    const browserIndex=(origin+increment+8)&7;if(!available(browserIndex))continue;
    const [dx,dy]=VECTORS[DIRECTIONS[browserIndex]??'s'];
    moveActor(state,actor,actor.x+dx,actor.y+dy,events);return true;
  }
  throw new Error('A proven corridor-junction branch was not selected.');
}
/** Tactics determine the actual movement target and distance policy. The
 * existing bounded path search/wandering is still not native route replay.
 * @param {DungeonState} state @param {Actor} actor @param {Actor|undefined} target @param {GameEvent[]} events */
function tryAiMovement(state,actor,target,events){
  if(actor.status.confusion){const [dx,dy]=VECTORS[DIRECTIONS[draw(state,8)]??'s'];if(canStep(state,actor,dx,dy)&&!actorAt(state,actor.x+dx,actor.y+dy)){moveActor(state,actor,actor.x+dx,actor.y+dy,events);return true;}return false;}
  if(Math.floor(actor.belly)===0)return false;
  // Standing AI pickup requires an empty held slot before movement selection.
  // Moved nonleaders separately interact when their queued walking flushes.
  if(!actor.heldItem&&state.items.some(item=>item.x===actor.x&&item.y===actor.y)&&pickup(state,actor,events))return true;
  const tactic=team(actor)?tacticFor(actor):'after-foes';
  const leader=team(actor)&&inSight(state,actor,state.hero)?state.hero:undefined;
  const current=tactic==='together'?leader:target??leader;
  if(current){actor.goal={x:current.x,y:current.y};
    if(tactic==='avoid-first-hit'&&current===target){
      if(distance(actor,current)===2)return false;
      if(distance(actor,current)<2){
        const away=directionFor(actor.x-current.x,actor.y-current.y),start=DIRECTIONS.indexOf(away);
        const [ax,ay]=VECTORS[away];if(canStep(state,actor,ax,ay)&&actorAt(state,actor.x+ax,actor.y+ay))return false;
        // Native ordinary movement only tries the two 45-degree alternatives.
        // Browser direction indices run opposite to the native enum.
        for(const offset of [0,-1,1]){const [dx,dy]=VECTORS[DIRECTIONS[(start+offset+8)%8]??away];if(canStep(state,actor,dx,dy)&&!actorAt(state,actor.x+dx,actor.y+dy)){moveActor(state,actor,actor.x+dx,actor.y+dy,events);return true;}}
        return false;
      }
    }
  }
  // Together's visible-leader target takes the native direct direction before
  // the adapted route finder when that first step is ordinary, empty terrain.
  if(tactic==='together'&&current===leader&&leader&&distance(actor,leader)>0){
    const direct=directionFor(leader.x-actor.x,leader.y-actor.y),[dx,dy]=VECTORS[direct];
    if(canStep(state,actor,dx,dy)&&!actorAt(state,actor.x+dx,actor.y+dy)){moveActor(state,actor,actor.x+dx,actor.y+dy,events);return true;}
  }
  const goal=current??actor.goal;
  if(goal&&distance(actor,goal)>0){const p=nextStep(state,actor,goal);if(p&&!actorAt(state,p.x,p.y)){moveActor(state,actor,p.x,p.y,events);return true;}return false;}
  actor.goal=null;
  if(tryJunctionWander(state,actor,events))return true;
  const possible=DIRECTIONS.map(d=>VECTORS[d]).filter(([dx,dy])=>canStep(state,actor,dx,dy)&&!actorAt(state,actor.x+dx,actor.y+dy));
  const forward=VECTORS[actor.direction],direction=possible.find(([dx,dy])=>dx===forward[0]&&dy===forward[1])??possible[draw(state,possible.length)];
  if(direction){moveActor(state,actor,actor.x+direction[0],actor.y+direction[1],events);return true;}
  return false;
}
/** Supported subset of the leader's native swap admission. Bide is not one
 * of IsChargingAnyTwoTurnMove's statuses and is not excluded here.
 * @param {Actor} actor @param {Actor} target */
function canSwapOpening(actor,target){return team(target)&&!actor.status.sleep&&!target.status.sleep&&!actor.status.confusion&&!target.status.confusion;}
/** All twenty admitted species have native base movement speed one. The only
 * implemented changes lower it: slow or paralysis clamps the stage to zero.
 * gSpeedTurns gives stage one every base beat, stage zero every second beat.
 * @param {DungeonState} state @param {Actor} actor */
function scheduledOnBeat(state,actor){return !(actor.status.slow||actor.status.paralysis)||(state.baseBeat??0)%2===0;}
/** Pure admission for app/input ownership, including a restored prepared save.
 * Forced classes are checked AFTER upkeep, never from their old timer values.
 * @param {DungeonState} state @returns {import('./mechanics-types.js').DungeonTurnPhase} */
export function getDungeonTurnPhase(state){
  if(state.status==='rescued'||state.status==='defeated'||state.hero.hp<=0||state.pendingLearning.length)return 'blocked';
  if(!state.leaderPrepared)return 'unprepared';
  return state.hero.status.sleep||state.hero.status.infatuated||state.hero.status.bide?'forced':'input';
}
/** Start at most one normal-speed base beat. A skipped leader has no upkeep,
 * input, hunger or wind; the other scheduled actors still receive their turn.
 * Preparation itself is persisted, so save/reload does not tick a timer twice.
 * @param {DungeonState} state @param {OpeningData} data @returns {import('./mechanics-types.js').PreparationResult} */
export function prepareDungeonTurn(state,data){
  /** @type {GameEvent[]} */const events=[];
  try {
    const phase=getDungeonTurnPhase(state);
    if(phase!=='unprepared')return {phase,changed:false,consumedTurn:false,events,status:state.status};
    // Legacy floorTurn counted completed browser base passes. Preserve that
    // known arrival countdown; no cartridge fractional-history is inferred.
    state.baseBeat=((state.baseBeat??state.floorTurn%36)+1)%36;state.leaderPrepared=false;
    if(state.baseBeat===0)spawnEnemy(state,data,null,events);
    if(!scheduledOnBeat(state,state.hero)){
      advanceOtherActors(state,data,events);finishBaseBeat(state,events);updateVisibility(state);
      return {phase:getDungeonTurnPhase(state)==='blocked'?'blocked':'advanced',changed:true,consumedTurn:true,events,status:state.status};
    }
    state.leaderPrepared=true;beginTurn(state,state.hero,data,events);updateVisibility(state);
    const ready=getDungeonTurnPhase(state);
    if(ready==='input'||ready==='forced')recordCamera(events,state.hero,'input');
    return {phase:ready==='unprepared'?'blocked':ready,changed:true,consumedTurn:false,events,status:state.status};
  } finally {
    flushQueuedMovement(state,events);
  }
}
/** Complete exactly one automatically blocked leader opportunity. The app
 * supplies the native 60-frame presentation delay; this owner has no clock.
 * @param {DungeonState} state @param {OpeningData} data @returns {ActionResult} */
export function completeForcedTurn(state,data){
  /** @type {GameEvent[]} */const events=[];
  try {
    if(getDungeonTurnPhase(state)!=='forced')return {consumedTurn:false,events,status:state.status};
    state.turn++;state.floorTurn++;recordAction(events,state.hero.id,'wait');finishLeaderTurn(state,data,events);
    return {consumedTurn:true,events,status:state.status};
  } finally {
    flushQueuedMovement(state,events);
  }
}
/** @param {DungeonState} state @param {OpeningData} data @param {GameEvent[]} events */
function advanceOtherActors(state,data,events){
  for(const actor of [state.partner,...state.enemies]){
    if(defeated(state))break;if(actor.hp<=0||!scheduledOnBeat(state,actor))continue;
    // A swapped teammate's scheduled opportunity is already spent. Native
    // clears that flag without a second upkeep/end-effect pass.
    if(actor.skipAction){actor.skipAction=false;continue;}
    const canAct=beginTurn(state,actor,data,events);
    if(!canAct&&actor.useHeldItem){actor.useHeldItem=false;message(state,events,`${actor.name} could not use the held item.`);}
    if(canAct&&!defeated(state))actAI(state,actor,data,events);else recordAction(events,actor.id,'wait');
    finishTurn(state,actor,data,events);
  }
}
/** @param {DungeonState} state @param {GameEvent[]} events */
function finishBaseBeat(state,events){
  // Array positions are native wild slots. Keep fainted vacancies for reuse;
  // existing saves retain their recorded order without inventing lost slots.
  flushQueuedMovement(state,events);
  if(!defeated(state)){
    if((state.mudSport??0)>0){state.mudSport=(state.mudSport??0)-1;if(state.mudSport===0)message(state,events,"Mud Sport's effect faded.");}
    if(state.waterSport>0&&!--state.waterSport)message(state,events,"Water Sport's effect faded.");
    if(state.hero.x===state.stairs.x&&state.hero.y===state.stairs.y)state.status='stairs';
  }
}
/** Leader end effects (including Bide release), wind, any deferred swap end
 * effects, companions, then foes. The swapped actor was already ticked while
 * executing the leader's turn and retains its next-scheduled-slot skip flag.
 * @param {DungeonState} state @param {OpeningData} data @param {GameEvent[]} events @param {Actor|null} [swappedActor] */
function finishLeaderTurn(state,data,events,swappedActor=null){
  state.leaderPrepared=false;finishTurn(state,state.hero,data,events);
  if(!defeated(state)){
    if([751,851,951].includes(state.floorTurn)||state.floorTurn>=1000)recordCamera(events,state.hero,'leader');
    if(state.floorTurn===751)message(state,events,'Something is approaching...');
    if(state.floorTurn===851)message(state,events,'Something is getting closer!');
    if(state.floorTurn===951)message(state,events,'It is right nearby!');
    if(state.floorTurn>=1000){state.status='defeated';message(state,events,'A mysterious force carried the team out of the dungeon.');}
  }
  if(swappedActor&&!defeated(state))finishTurn(state,swappedActor,data,events);
  advanceOtherActors(state,data,events);finishBaseBeat(state,events);updateVisibility(state);
}
/** Menus/facing consume no dungeon time. Invalid commands do not consume RNG or
 * allow foes to act. Accepted actions form a single bounded synchronous turn.
 * @param {DungeonState} state @param {DungeonAction} action @param {OpeningData} data @returns {ActionResult} */
export function performAction(state,action,data) {
  /** @type {GameEvent[]} */const events=[];
  try {const result=/** @param {boolean} consumedTurn */consumedTurn=>({consumedTurn,events,status:state.status});
    if(!action||!['move','face','moveSlot','attack','regularAttack','struggle','wait','stairs','cancelStairs','eatGround','eatHeld','usePartnerItem','throwGround','pickup','learnMove'].includes(action.type))return result(false);
    if(state.status==='rescued')return result(false);
    if(action.type==='learnMove'){
      const request=state.pendingLearning[0],actor=actors(state).find(a=>a.id===action.actorId);
      if(!request||request.actorId!==action.actorId||!actor||action.slot!==null&&(!Number.isInteger(action.slot)||action.slot<0||action.slot>3))return result(false);
      if(action.slot!==null){actor.moves[action.slot]=moveSlot(data,request.moveId);message(state,events,`${actor.name} learned ${data.moves[request.moveId]?.name}!`);recordSync(state,events,[actor]);}state.pendingLearning.shift();return result(false);
    }
    // A surviving partner can finish native queued EXP/learning after a later
    // hit removes the leader. Only the existing live first request is accepted.
    if(state.status==='defeated')return result(false);
    if(state.pendingLearning.length)return result(false);
    if(getDungeonTurnPhase(state)!=='input')return result(false);
    if(action.type==='cancelStairs'){state.status='playing';return result(false);}
    if(action.type==='stairs'){
      if(state.hero.x!==state.stairs.x||state.hero.y!==state.stairs.y)return result(false);
      if(state.floor===3){state.status='rescued';events.push({type:'rescue'});return result(false);}state.floor++;generateFloor(state,data,events);return result(false);
    }
    if(action.type==='move'||action.type==='face'){
      if(!Number.isInteger(action.dx)||!Number.isInteger(action.dy)||Math.abs(action.dx)>1||Math.abs(action.dy)>1||action.dx===0&&action.dy===0)return result(false);
      if(action.type==='face'){state.hero.direction=directionFor(action.dx,action.dy);events.push({type:'presentation',presentation:{kind:'face',actor:captureActor(state.hero)}});return result(false);}
      const target=actorAt(state,state.hero.x+action.dx,state.hero.y+action.dy);
      if(!state.hero.status.confusion&&(!canStep(state,state.hero,action.dx,action.dy)||target&&!canSwapOpening(state.hero,target))){
        const direction=directionFor(action.dx,action.dy),changed=state.hero.direction!==direction;state.hero.direction=direction;
        if(changed)events.push({type:'presentation',presentation:{kind:'face',actor:captureActor(state.hero)}});
        return result(false);
      }
    }
    if(action.type==='moveSlot'&&(!Number.isInteger(action.slot)||!state.hero.moves[action.slot]))return result(false);
    if(action.type==='struggle'&&(state.hero.moves.some(move=>move.pp>0)||!data.moves['move-struggle']))return result(false);
    if(action.type==='moveSlot'){const move=data.moves[state.hero.moves[action.slot]?.id??''];if(!move||!supportsMove(move)){message(state,events,`${move?.name??'This move'} is not yet available in this browser remake.`);return result(false);}}
    // The leader's shortcut rejects an exhausted selection while still inside
    // its input loop. AI without PP Checker may spend its action on such a slot.
    if(action.type==='moveSlot'){const move=state.hero.moves[action.slot];if(move&&move.pp<=0){message(state,events,`${move.name} has no PP left!`);return result(false);}}
    const ground=getGroundItem(state);
    if(action.type==='throwGround'&&!ground||action.type==='eatGround'&&(!ground||ground.kind==='poke')||action.type==='eatHeld'&&(!state.hero.heldItem||state.hero.heldItem.kind==='poke')||action.type==='usePartnerItem'&&(!state.partner.heldItem||state.partner.hp<=0)||action.type==='pickup'&&(!ground||ground.kind!=='poke'&&state.hero.heldItem))return result(false);
    const [frontX,frontY]=VECTORS[state.hero.direction];
    const fieldTalk=action.type==='attack'&&canTalk(state.hero)&&canStep(state,state.hero,frontX,frontY)&&actorAt(state,state.hero.x+frontX,state.hero.y+frontY)?.id==='partner';
    // Native leader input intercepts ACTION_TALK_FIELD and resets ACTION_NOTHING
    // without leaving its input loop: no arrival, upkeep or other actor acts.
    if(fieldTalk){events.push({type:'talk',actorId:'partner',text:talkToPartner(state,true,false)});return result(false);}
    state.status='playing';state.turn++;state.floorTurn++;
    /** @type {Actor|null} */let swappedActor=null;
    if(!defeated(state)){
      if(action.type==='move'){
        const old={x:state.hero.x,y:state.hero.y};let dx=action.dx,dy=action.dy;
        if(state.hero.status.confusion){const v=VECTORS[DIRECTIONS[draw(state,8)]??'s'];dx=v[0];dy=v[1];}
        const target=actorAt(state,state.hero.x+dx,state.hero.y+dy);
        if(canStep(state,state.hero,dx,dy)&&(!target||canSwapOpening(state.hero,target))){
          moveActor(state,state.hero,state.hero.x+dx,state.hero.y+dy,events);
          if(target){
            moveActor(state,target,old.x,old.y,events);target.skipAction=true;
            // Native sub_8044454 ticks the partner immediately even if it is
            // unscheduled at its current speed. Its Walk is already selected.
            beginTurn(state,target,data,events,false);target.useHeldItem=false;swappedActor=target;
          }
          if(action.skipPickup||action.runRequested&&target?.id==='partner'){const item=getGroundItem(state);if(item)message(state,events,`${state.hero.name} stepped on ${ITEM_NAMES[item.kind]}.`,{kind:'sync',actors:[],afterWalk:true});}
          else pickup(state,state.hero,events,true);
        }
      }else if(action.type==='attack'||action.type==='regularAttack')attack(state,state.hero,null,data,events);
      else if(action.type==='struggle')attack(state,state.hero,'struggle',data,events);
      else if(action.type==='moveSlot')attack(state,state.hero,action.slot,data,events);
      else if(action.type==='eatGround'&&ground){eat(state,state.hero,ground,events);state.items=state.items.filter(i=>i.id!==ground.id);recordSync(state,events,[],true);}
      else if(action.type==='eatHeld'&&state.hero.heldItem){eat(state,state.hero,state.hero.heldItem,events);state.hero.heldItem=null;recordSync(state,events,[state.hero]);}
      else if(action.type==='usePartnerItem'){recordAction(events,state.hero.id,'other',state.hero);state.partner.useHeldItem=true;recordSync(state,events,[state.partner]);}
      else if(action.type==='throwGround'&&ground){if(ground.kind==='poke')throwGroundPoke(state,ground,data,events);else throwGroundBerry(state,ground,events);}
      else if(action.type==='pickup')pickup(state,state.hero,events);
    }
    if(action.type==='wait'||action.type==='move'&&!events.some(event=>event.type==='move'&&event.actorId===state.hero.id))recordAction(events,state.hero.id,'wait');
    finishLeaderTurn(state,data,events,swappedActor);return result(true);
  } finally {
    flushQueuedMovement(state,events);
  }
}
/** @param {DungeonState} state */
function defeated(state) { return state.status==='defeated'; }
/** @param {DungeonState} state @param {string} actorId @param {number} slot @param {boolean} enabled */
export function setMoveEnabled(state,actorId,slot,enabled) { const actor=[state.hero,state.partner].find(a=>a.id===actorId);if(actor&&Number.isInteger(slot)&&actor.moves[slot])actor.moves[slot].enabled=enabled; }
/** @param {DungeonState} state @param {number} slot */
export function setShortcut(state,slot) { if(!Number.isInteger(slot)||!state.hero.moves[slot])return;for(let i=0;i<state.hero.moves.length;i++){const move=state.hero.moves[i];if(move)move.set=i===slot;} }
/** Failure keeps earned EXP and levels. The initial level-five boost is never
 * repeated. The retry resumes Butterfree's still-unfinished rescue.
 * @param {DungeonState} state @param {OpeningData} data */
export function retryDungeon(state,data) { if(state.status!=='defeated')return;state.floor=1;state.money=0;state.pendingLearning=[];for(const actor of [state.hero,state.partner]){actor.hp=actor.maxHp;actor.belly=100;actor.heldItem=null;for(const move of actor.moves)move.pp=move.maxPp;}generateFloor(state,data,[]); }

/** Strict bounded admission at persistence boundaries, never on a frame/draw.
 * It rejects old campaign envelopes and malformed coordinates/identities.
 * @param {unknown} value @param {OpeningData} data @returns {value is DungeonState} */
export function validateDungeon(value,data) {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const s=/** @type {DungeonState} */(value);
  const integer=/** @param {unknown} n @param {number} lo @param {number} hi */(n,lo,hi)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=lo&&n<=hi;
  const finite=/** @param {unknown} n @param {number} lo @param {number} hi */(n,lo,hi)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi;
  const exactKeys=/** @param {object} object @param {string} keys */(object,keys)=>Object.keys(object).sort().join(',')===keys.split(',').sort().join(',');
  const stateKeys='version,floor,width,height,tiles,roomIds,explored,visible,rooms,stairs,hero,partner,enemies,items,money,turn,floorTurn,log,status,rng,waterSport,nextId,pendingLearning,tutorials,fidelityNotes';
  const hasBeat=Object.hasOwn(s,'baseBeat'),hasPrepared=Object.hasOwn(s,'leaderPrepared'),hasMudSport=Object.hasOwn(s,'mudSport');
  const optionalStateKeys=[...(hasBeat?['baseBeat','leaderPrepared']:[]),...(hasMudSport?['mudSport']:[])];
  if(hasBeat!==hasPrepared||!exactKeys(s,[stateKeys,...optionalStateKeys].join(','))||hasBeat&&(!integer(s.baseBeat,0,35)||typeof s.leaderPrepared!=='boolean'))return false;
  if(s.version!==1||s.width!==WIDTH||s.height!==HEIGHT||!integer(s.floor,1,3)||!['playing','stairs','rescued','defeated'].includes(s.status)||!integer(s.turn,0,10000000)||!integer(s.floorTurn,0,1000)||!integer(s.money,0,9999999)||!integer(s.nextId,1,10000000)||hasMudSport&&!integer(s.mudSport,0,128)||!integer(s.waterSport,0,128))return false;
  const size=WIDTH*HEIGHT;
  if(!Array.isArray(s.tiles)||s.tiles.length!==size||s.tiles.some(n=>n!==0&&n!==1)||!Array.isArray(s.roomIds)||s.roomIds.length!==size||s.roomIds.some(n=>!integer(n,-1,63)))return false;
  if(!Array.isArray(s.explored)||!Array.isArray(s.visible)||s.explored.length!==size||s.visible.length!==size||s.explored.some(v=>typeof v!=='boolean')||s.visible.some(v=>typeof v!=='boolean'))return false;
  const point=/** @param {unknown} p */p=>!!p&&typeof p==='object'&&integer(/** @type {Point} */(p).x,0,WIDTH-1)&&integer(/** @type {Point} */(p).y,0,HEIGHT-1)&&open(s,/** @type {Point} */(p).x,/** @type {Point} */(p).y);
  if(!point(s.stairs)||!Array.isArray(s.rooms)||s.rooms.length<2||s.rooms.length>32||s.rooms.some(r=>!r||!integer(r.x,0,WIDTH-1)||!integer(r.y,0,HEIGHT-1)||!integer(r.width,1,WIDTH-r.x)||!integer(r.height,1,HEIGHT-r.y)))return false;
  if(!Array.isArray(s.enemies)||s.enemies.length>10||!Array.isArray(s.items)||s.items.length>64||!Array.isArray(s.log)||s.log.length>80||s.log.some(v=>typeof v!=='string'||v.length>300)||!Array.isArray(s.tutorials)||s.tutorials.length>30||s.tutorials.some(v=>typeof v!=='string'||v.length>60)||!Array.isArray(s.fidelityNotes)||s.fidelityNotes.length>10||s.fidelityNotes.some(v=>typeof v!=='string'||v.length>300))return false;
  const held=/** @param {unknown} item */item=>item===null||!!item&&typeof item==='object'&&Object.hasOwn(ITEM_NAMES,/** @type {HeldItem} */(item).kind)&&integer(/** @type {HeldItem} */(item).amount,1,99999);
  const occupied=new Set(),ids=new Set();
  const statusKeys=new Set(STATUS_KEYS);
  for(const a of [s.hero,s.partner,...s.enemies]){
    if(!a||typeof a!=='object'||!point(a)||typeof a.id!=='string'||a.id.length>40||ids.has(a.id)||typeof a.speciesId!=='string'||!Object.hasOwn(data.species,a.speciesId)||typeof a.name!=='string'||a.name.length<1||Array.from(a.name).length>10||!DIRECTIONS.includes(a.direction)||!integer(a.level,1,100)||!integer(a.maxHp,1,999)||!integer(a.hp,0,a.maxHp)||!integer(a.exp,0,9999999)||!finite(a.belly,0,100)||a.maxBelly!==100||!integer(a.regen,0,500)||!integer(a.bideDamage,0,999999)||typeof a.usedMove!=='boolean'||typeof a.experienceMarked!=='boolean'||typeof a.skipAction!=='boolean'||!held(a.heldItem)||a.goal!==null&&!point(a.goal)||a.leechSource!==null&&(typeof a.leechSource!=='string'||a.leechSource.length>40))return false;
    const actorKeys='id,speciesId,name,x,y,direction,level,hp,maxHp,belly,maxBelly,exp,stats,moves,status,periodic,stages,heldItem,regen,usedMove,experienceMarked,goal,leechSource,bideDamage,skipAction';
    const multiplierKeys=['physicalOffenseMultiplierQ8','specialOffenseMultiplierQ8','physicalDefenseMultiplierQ8','specialDefenseMultiplierQ8'];
    const multiplierCount=multiplierKeys.filter(key=>Object.hasOwn(a,key)).length;
    const optionalKeys=['useHeldItem','tactic','enabledIq','abilityVisualFlags',...multiplierKeys].filter(key=>Object.hasOwn(a,key));
    if(!exactKeys(a,[actorKeys,...optionalKeys].join(','))||Object.hasOwn(a,'useHeldItem')&&typeof a.useHeldItem!=='boolean')return false;
    if(multiplierCount!==0&&multiplierCount!==4)return false;
    if(multiplierCount===4&&(!integer(a.physicalOffenseMultiplierQ8,2,25597)||!integer(a.specialOffenseMultiplierQ8,2,25597)||!integer(a.physicalDefenseMultiplierQ8,2,25597)||!integer(a.specialDefenseMultiplierQ8,2,25597)))return false;
    if(Object.hasOwn(a,'tactic')&&!TACTICS.some(tactic=>tactic.id===a.tactic))return false;
    if(Object.hasOwn(a,'enabledIq')&&(!Array.isArray(a.enabledIq)||a.enabledIq.length>IQ_SKILLS.length||new Set(a.enabledIq).size!==a.enabledIq.length||a.enabledIq.some(id=>!IQ_SKILLS.some(skill=>skill.id===id))))return false;
    if(Object.hasOwn(a,'abilityVisualFlags')){
      const flags=a.abilityVisualFlags,allowed=data.species[a.speciesId]?.abilities.reduce((bits,name)=>bits|(ABILITY_VISUAL_FLAGS[name]??0),0)??0;
      if(typeof flags!=='number'||!integer(flags,0,0xa3)||(flags&~allowed)!==0)return false;
    }
    ids.add(a.id);const k=index(s,a.x,a.y);if(a.hp>0&&occupied.has(k))return false;if(a.hp>0)occupied.add(k);
    if(!a.stats||Object.keys(a.stats).sort().join(',')!=='attack,defense,hp,specialAttack,specialDefense'||!Object.values(a.stats).every(n=>integer(n,0,999))||a.stats.hp!==a.maxHp)return false;
    const p=data.species[a.speciesId];if(!p||a.exp<(p.growth[a.level-1]?.[0]??Infinity)||a.level<100&&a.exp>=(p.growth[a.level]?.[0]??Infinity))return false;
    const learned=new Set(p.learnset.filter(([level])=>level<=a.level).map(([,id])=>id));
    const expected=[...p.baseStats];for(const row of p.growth.slice(0,a.level))for(let i=0;i<5;i++)expected[i]=Math.min(i===0?999:255,(expected[i]??0)+(row[i+1]??0));
    if([a.stats.hp,a.stats.attack,a.stats.specialAttack,a.stats.defense,a.stats.specialDefense].some((n,i)=>n!==expected[i]))return false;
    if(!a.status||typeof a.status!=='object'||Array.isArray(a.status)||Object.keys(a.status).length>STATUS_KEYS.length||!Object.entries(a.status).every(([k,n])=>statusKeys.has(k)&&integer(n,0,128)))return false;
    if(!a.periodic||Object.keys(a.periodic).sort().join(',')!=='burn,leechSeed,poison'||!Object.values(a.periodic).every(n=>integer(n,0,20)))return false;
    if(!a.stages||Object.keys(a.stages).sort().join(',')!=='accuracy,attack,defense,evasion,specialAttack,specialDefense'||!Object.values(a.stages).every(n=>integer(n,0,20)))return false;
    if(!Array.isArray(a.moves)||a.moves.length<1||a.moves.length>4||new Set(a.moves.map(m=>m?.id)).size!==a.moves.length||a.moves.filter(m=>m?.set).length>1||a.moves.some(m=>!m||!learned.has(m.id)||!data.moves[m.id]||m.name!==data.moves[m.id]?.name||m.maxPp!==data.moves[m.id]?.pp||!integer(m.pp,0,m.maxPp)||typeof m.enabled!=='boolean'||typeof m.set!=='boolean'))return false;
  }
  if(s.hero.id!=='hero'||s.partner.id!=='partner'||s.enemies.some(a=>!/^enemy-\d+$/.test(a.id)||a.level!==1||!['pokemon-016','pokemon-102','pokemon-191','pokemon-265'].includes(a.speciesId))||!data.starterIds.includes(s.hero.speciesId)||!['pokemon-001','pokemon-004','pokemon-007','pokemon-025','pokemon-152','pokemon-155','pokemon-158','pokemon-252','pokemon-255','pokemon-258'].includes(s.partner.speciesId))return false;
  if(data.species[s.hero.speciesId]?.types.some(type=>type!=='None'&&data.species[s.partner.speciesId]?.types.includes(type)))return false;
  const itemIds=new Set();for(const item of s.items){if(!point(item)||!held(item)||typeof item.id!=='string'||itemIds.has(item.id))return false;itemIds.add(item.id);}
  if(!Array.isArray(s.pendingLearning)||s.pendingLearning.length>8||s.pendingLearning.some(r=>{
    if(!r||typeof r!=='object'||!exactKeys(r,'actorId,moveId')||!['hero','partner'].includes(r.actorId)||typeof r.moveId!=='string')return true;
    const actor=r.actorId==='hero'?s.hero:s.partner;
    return !data.species[actor.speciesId]?.learnset.some(([level,id])=>id===r.moveId&&level<=actor.level)||actor.moves.some(move=>move.id===r.moveId);
  }))return false;
  try{validateRandomState(s.rng);}catch{return false;}
  const route=nextStep(s,s.hero,s.stairs);if(s.hero.x!==s.stairs.x||s.hero.y!==s.stairs.y){if(!route){const openRoute={...s,enemies:[],partner:{...s.partner,hp:0}};if(!nextStep(openRoute,s.hero,s.stairs))return false;}}
  return true;
}
