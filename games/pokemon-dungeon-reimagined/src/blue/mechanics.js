import { createRandomState, validateRandomState } from '../domain/rng.js';
import { buildLayout } from '../domain/generation/layouts.js';
import { applyRoomFeatures } from '../domain/generation/features.js';
import { Draws, finalizeGeometry, positions, ordinary, reachable } from '../domain/generation/support.js';
import { openingSpawns, spawnScanOrder, arrivalPosition } from './mechanics-generation.js';
import { DEFAULT_IQ, IQ_SKILLS, TACTICS, hasIq, tacticFor, considersLineMove, considersLineTarget, canTalk, talkToPartner } from './mechanics-policy.js';
import { attack, beginTurn, finishTurn, heal, moveSlot, moveTargets, supportsMove, STATUS_KEYS } from './mechanics-combat.js';
import { actors, actorAt, canStep, directionFor, distance, draw, index, inSight, message, moveActor, nextStep, open, team, DIRECTIONS, VECTORS } from './mechanics-common.js';

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
const ITEM_NAMES={poke:'Poké','oran-berry':'Oran Berry','pecha-berry':'Pecha Berry','rawst-berry':'Rawst Berry'};
const DROP_OFFSETS=[[0,0],[0,-1],[1,0],[0,1],[-1,0],[-1,-1],[1,-1],[-1,1],[1,1],[-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],[-2,-1],[2,-1],[-2,0],[2,0],[-2,1],[2,1],[-2,2],[-1,2],[0,2],[1,2],[2,2]];
const GENERATION_CONTEXT=Object.freeze({floorType:/** @type {const} */('normal'),missionSuppressesHouse:true,missionAddsEnemy:false,canChangeLeader:false,teamSize:2,enemyLimit:10,required:[],fixedEncounter:null,receivedTeam:null,specialPopulation:null,ownedRewardItemIds:[]});

/** One compact, local factual resource; no full-campaign catalogs are loaded.
 * @param {AbortSignal} [signal] @returns {Promise<OpeningData>} */
export async function loadOpeningData(signal) {
  const response=await fetch(DATA_URL,{credentials:'same-origin',signal});
  if(!response.ok)throw new Error(`Opening data could not load (${response.status}).`);
  const text=await response.text();if(text.length>500000)throw new Error('Opening data is too large.');
  const data=/** @type {OpeningData} */(JSON.parse(text));
  if(data.version!==1||data.starterIds.length!==16||data.floors.length!==3||!data.moves['regular-attack'])throw new Error('Unsupported opening data.');
  return data;
}
/** @param {OpeningData} data @param {string} speciesId @param {string} id @param {string} name @param {number} level @returns {Actor} */
function createActor(data,speciesId,id,name,level) {
  const p=data.species[speciesId];if(!p)throw new Error(`Unknown opening species ${speciesId}.`);
  const sums=[...p.baseStats];for(const row of p.growth.slice(0,level))for(let i=0;i<5;i++)sums[i]=(sums[i]??0)+(row[i+1]??0);
  const stats={hp:sums[0]??1,attack:sums[1]??1,specialAttack:sums[2]??1,defense:sums[3]??1,specialDefense:sums[4]??1};
  const learned=p.learnset.filter(([at])=>at<=level).slice(0,4).map(([,move])=>moveSlot(data,move));
  return {id,speciesId,name:Array.from(name).slice(0,10).join('')||p.name,x:0,y:0,direction:'s',level,hp:stats.hp,maxHp:stats.hp,belly:100,maxBelly:100,exp:p.growth[level-1]?.[0]??0,stats,moves:learned,status:{},periodic:{poison:0,burn:0,leechSeed:0},stages:{attack:10,specialAttack:10,defense:10,specialDefense:10,accuracy:10,evasion:10},heldItem:null,regen:0,usedMove:false,experienceMarked:false,goal:null,leechSource:null,bideDamage:0,skipAction:false,useHeldItem:false,tactic:'together',enabledIq:[...DEFAULT_IQ]};
}
/** @param {number|[number,number,number,number]|undefined} seed @returns {[number,number,number,number]} */
function seedWords(seed) {
  if(Array.isArray(seed))return seed;
  let value=(seed??Date.now())>>>0;
  const next=()=>{value=(value+0x9e3779b9)>>>0;let z=value;z=Math.imul(z^(z>>>16),0x21f0aaad);z=Math.imul(z^(z>>>15),0x735a2d97);return(z^(z>>>15))>>>0;};
  return [next(),next(),next(),next()];
}
/** @param {DungeonOptions} options @param {OpeningData} data @returns {DungeonState} */
export function createDungeon(options,data) {
  if(!data.starterIds.includes(options.heroSpeciesId)||!data.starterIds.includes(options.partnerSpeciesId))throw new Error('Choose an original starter pair.');
  const heroData=data.species[options.heroSpeciesId],partnerData=data.species[options.partnerSpeciesId];
  if(!heroData||!partnerData||!['pokemon-001','pokemon-004','pokemon-007','pokemon-025','pokemon-152','pokemon-155','pokemon-158','pokemon-252','pokemon-255','pokemon-258'].includes(options.partnerSpeciesId)||heroData.types.some(t=>t!=='None'&&partnerData.types.includes(t)))throw new Error("This partner shares the hero's type.");
  /** @type {DungeonState} */
  const state={version:1,floor:1,width:WIDTH,height:HEIGHT,tiles:[],roomIds:[],explored:[],visible:[],rooms:[],stairs:{x:0,y:0},hero:createActor(data,options.heroSpeciesId,'hero',options.heroName??heroData.name,5),partner:createActor(data,options.partnerSpeciesId,'partner',options.partnerName??partnerData.name,5),enemies:[],items:[],money:0,turn:0,floorTurn:0,baseBeat:0,leaderPrepared:false,log:[],status:'playing',rng:createRandomState(seedWords(options.seed)),waterSport:0,nextId:1,pendingLearning:[],tutorials:[],fidelityNotes:['Qualified original-game numerical facts; Blue binary parity is unverified.','Browser PRNG, bounded generation repair, autonomous movement and timing are adapted; cartridge replay parity is not claimed.']};
  generateFloor(state,data,[]);return state;
}
/** @param {DungeonState} state @param {OpeningData} data @param {GameEvent[]} events */
function generateFloor(state,data,events) {
  const floor=data.floors[state.floor-1];if(!floor)throw new Error('Tiny Woods ends after B3F.');
  const rng=new Draws(state.rng);let geometry=buildLayout(floor.generation,rng,0);
  for(let attempt=0;attempt<12;attempt++) {
    if(attempt)geometry=buildLayout(floor.generation,rng,0);
    applyRoomFeatures(geometry,floor.generation,GENERATION_CONTEXT,rng,'water',0,1);finalizeGeometry(geometry);
    const candidates=positions(geometry,t=>ordinary(t)&&t.room!==null),first=candidates[0];
    const reached=first?reachable(geometry,first):new Set();
    if(first&&candidates.length>=30&&new Set(candidates.map(p=>geometry.cells[p.z]?.[p.x]?.room)).size>=2&&candidates.every(p=>reached.has(p.z*WIDTH+p.x)))break;
    if(attempt===11)throw new Error('Unable to create connected Tiny Woods rooms.');
  }
  const spawns=openingSpawns(geometry,floor.generation,rng);
  state.rng=rng.state;state.tiles=geometry.cells.flat().map(t=>ordinary(t)?1:0);state.roomIds=geometry.cells.flat().map(t=>t.room??-1);state.rooms=geometry.rooms.map(r=>({x:r.bounds.x,y:r.bounds.z,width:r.bounds.width,height:r.bounds.height}));
  state.explored=Array(WIDTH*HEIGHT).fill(false);state.visible=Array(WIDTH*HEIGHT).fill(false);state.enemies=[];state.items=[];state.floorTurn=0;state.baseBeat=0;state.leaderPrepared=false;state.waterSport=0;state.status='playing';
  state.hero.x=spawns.hero.x;state.hero.y=spawns.hero.y;state.partner.x=spawns.partner.x;state.partner.y=spawns.partner.y;
  state.hero.direction=state.partner.direction='s';
  for(const actor of [state.hero,state.partner]){actor.status={};actor.periodic={poison:0,burn:0,leechSeed:0};actor.stages={attack:10,specialAttack:10,defense:10,specialDefense:10,accuracy:10,evasion:10};actor.goal=null;actor.leechSource=null;actor.bideDamage=0;actor.skipAction=false;actor.useHeldItem=false;actor.regen=0;}
  state.stairs=spawns.stairs;
  // Native realization places the team, then wild actors, then actual items.
  // An enemy flag covered by the partner does not relocate to a different tile.
  for(const point of spawnScanOrder(state,spawns.enemies))spawnEnemy(state,data,point);
  for(const point of spawnScanOrder(state,spawns.items)){
    draw(state,10000); // Item category selection, including a single-category pool.
    const itemRoll=draw(state,10000),kind=state.floor<3?'poke':itemRoll<=7500?'oran-berry':'pecha-berry';
    if(kind!=='poke')draw(state,100); // Zero sticky chance still consumes its draw.
    state.items.push({id:`item-${state.nextId++}`,kind,x:point.x,y:point.y,amount:kind==='poke'?moneyPile(state):1});
  }
  updateVisibility(state);events.push({type:'floor',amount:state.floor});message(state,events,`Tiny Woods B${state.floor}F`);
}
/** Tiny Woods uses the native money lookup with a 40-Poké upper bound. Drawing
 * an index in 0..99 and repeatedly halving it makes the eight outcomes nonuniform.
 * @param {DungeonState} state */
function moneyPile(state) { let ordinal=draw(state,100);while(ordinal>7)ordinal=Math.floor(ordinal/2);return [4,6,10,14,22,26,34,38][ordinal]??4; }
/** @param {DungeonState} state @param {OpeningData} data @param {Point|null} [initialPosition] */
function spawnEnemy(state,data,initialPosition=null) {
  if(state.enemies.filter(a=>a.hp>0).length>=10)return;
  const floor=data.floors[state.floor-1];if(!floor)return;const roll=draw(state,10000),row=floor.encounters.find(e=>roll<=e.threshold);if(!row)return;
  const p=initialPosition??arrivalPosition(state);if(!p||actorAt(state,p.x,p.y))return;
  const actor=createActor(data,row.speciesId,`enemy-${state.nextId++}`,data.species[row.speciesId]?.name??'',row.level);actor.x=p.x;actor.y=p.y;actor.direction=DIRECTIONS[draw(state,8)]??'s';state.enemies.push(actor);
}
/** @param {DungeonState} state */
export function updateVisibility(state) {
  state.visible.fill(false);
  for(const member of [state.hero,state.partner]) {
    if(member.hp<=0)continue;
    for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)if(inSight(state,member,{x,y})){const k=index(state,x,y);state.visible[k]=true;state.explored[k]=true;}
  }
}
/** @param {DungeonState} state */
export function getVisibleActors(state) { return actors(state).filter(a=>team(a)||state.visible[index(state,a.x,a.y)]); }
/** @param {DungeonState} state */
export function getGroundItem(state) { return state.items.find(i=>i.x===state.hero.x&&i.y===state.hero.y)??null; }
/** @param {HeldItem['kind']} kind */
export function itemName(kind) { return ITEM_NAMES[kind]; }
/** @param {DungeonState} state @param {Actor} actor @param {GameEvent[]} events */
function pickup(state,actor,events) {
  const item=state.items.find(i=>i.x===actor.x&&i.y===actor.y);if(!item)return false;
  if(item.kind==='poke'&&team(actor)){state.money+=item.amount;message(state,events,`${actor.name} picked up ${item.amount} Poké.`);}
  else if(!actor.heldItem){actor.heldItem={kind:item.kind,amount:item.amount};message(state,events,`${actor.name} picked up ${ITEM_NAMES[item.kind]}.`);}
  else {if(actor.id==='hero')message(state,events,`${actor.name} stepped on ${ITEM_NAMES[item.kind]}.`);return false;}
  state.items=state.items.filter(i=>i.id!==item.id);events.push({type:'item',actorId:actor.id,text:item.kind});
  const tutorial=`item-${item.kind}`;
  if(actor.id==='hero'&&['poke','oran-berry','pecha-berry'].includes(item.kind)&&!state.tutorials.includes(tutorial)){
    state.tutorials.push(tutorial);events.push({type:'tutorial',actorId:actor.id,text:item.kind});
  }
  return true;
}
/** @param {DungeonState} state @param {Actor} actor @param {HeldItem} item @param {GameEvent[]} events */
function eat(state,actor,item,events) {
  if(item.kind==='poke')return false;
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
  actor.belly=Math.min(actor.maxBelly,actor.belly+5);events.push({type:'item',actorId:actor.id,text:item.kind});
}
/** Ordinary Tiny Woods berry projectile: all sixteen original starters can
 * throw. No trajectory equipment or special airborne targets occur here.
 * @param {DungeonState} state @param {import('./mechanics-types.js').GroundItem} item @param {GameEvent[]} events */
function throwGroundBerry(state,item,events) {
  state.items=state.items.filter(candidate=>candidate.id!==item.id);throwBerry(state,state.hero,item,events);
}
/** @param {DungeonState} state @param {Actor} actor @param {import('./mechanics-types.js').GroundItem} item @param {GameEvent[]} events */
function throwBerry(state,actor,item,events){
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
      if(target.status.sleep===127){delete target.status.sleep;message(state,events,`${target.name} woke up!`);}
      berryEffect(state,target,item,events);return;
    }
    message(state,events,`${ITEM_NAMES[item.kind]} missed ${target.name}.`);
  }
  // SpawnDroppedItem ignores actor occupancy and searches this exact 25-tile
  // first-sentinel segment. A miss stops at its first actor instead of passing.
  for(const [ox=0,oy=0] of DROP_OFFSETS){
    const x=endpoint.x+ox,y=endpoint.y+oy;
    if(!open(state,x,y)||state.stairs.x===x&&state.stairs.y===y||state.items.some(candidate=>candidate.x===x&&candidate.y===y))continue;
    if(state.items.length>=64)break;
    state.items.push({...item,x,y});message(state,events,`${ITEM_NAMES[item.kind]} fell on the ground.`);return;
  }
  message(state,events,`${ITEM_NAMES[item.kind]} was lost.`);
}
/** @param {DungeonState} state @param {Actor} actor @param {OpeningData} data @param {GameEvent[]} events */
function actAI(state,actor,data,events) {
  if(actor.useHeldItem){
    actor.useHeldItem=false;
    if(actor.heldItem&&actor.heldItem.kind!=='poke'){eat(state,actor,actor.heldItem,events);actor.heldItem=null;}
    else message(state,events,`${actor.name} had second thoughts.`);
    return;
  }
  if(tryAiItem(state,actor,events))return;
  const foes=actors(state).filter(a=>team(a)!==team(actor)&&inSight(state,actor,a)).sort((a,b)=>distance(actor,a)-distance(actor,b));
  const target=foes[0];
  const travelFirst=hasIq(actor,'dedicated-traveler');
  if(travelFirst&&tryAiMovement(state,actor,target,events))return;
  if(target&&tryAiAttack(state,actor,target,data,events))return;
  if(!travelFirst)tryAiMovement(state,actor,target,events);
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
    actor.direction=direction;actor.heldItem=null;
    throwBerry(state,actor,{...item,id:`item-${state.nextId++}`,x:actor.x,y:actor.y},events);return true;
  }
  return false;
}
/** @param {DungeonState} state @param {Actor} actor @param {Actor} target @param {OpeningData} data @param {GameEvent[]} events */
function tryAiAttack(state,actor,target,data,events){
  actor.direction=directionFor(target.x-actor.x,target.y-actor.y);
    const struggle=data.moves['move-struggle'];
    const exhausted=actor.moves.every(m=>m.pp===0);
    if(exhausted&&struggle&&moveTargets(state,actor,struggle).some(a=>team(a)!==team(actor))){attack(state,actor,'struggle',data,events);return true;}
    // Default party IQ has no PP Checker and may select an exhausted slot.
    // Wild Tiny Woods profiles do have it, along with Status Checker.
    const eligible=exhausted?[]:actor.moves.map((m,slot)=>({m,slot,data:data.moves[m.id]})).filter(x=>x.data&&supportsMove(x.data)&&x.m.enabled&&(team(actor)||x.m.pp>0)&&(team(actor)||x.m.id!=='move-hypnosis'||!target.status.sleep)&&((x.data.range===5||x.data.range===8)?considersLineMove(state,actor,target,x.data):moveTargets(state,actor,x.data).some(a=>team(a)!==team(actor)||x.data?.range===7&&distance(actor,target)<=2||x.data?.target===6)));
    const regular=data.moves['regular-attack'];const regularEligible=!hasIq(actor,'exclusive-move-user')&&regular&&moveTargets(state,actor,regular).length>0;
    let total=!exhausted&&regularEligible?([100,20,30,40,50][actor.moves.filter(m=>m.enabled).length]??50):0;
    for(const candidate of eligible)total+=candidate.data?.aiWeight??0;
    if(total>0){let selected=draw(state,total);for(const candidate of eligible){selected-=candidate.data?.aiWeight??0;if(selected<=0){attack(state,actor,candidate.slot,data,events);return true;}}attack(state,actor,null,data,events);return true;}
  return false;
}
/** Tactics determine the actual movement target and distance policy. The
 * existing bounded path search/wandering is still not native route replay.
 * @param {DungeonState} state @param {Actor} actor @param {Actor|undefined} target @param {GameEvent[]} events */
function tryAiMovement(state,actor,target,events){
  if(actor.status.confusion){const [dx,dy]=VECTORS[DIRECTIONS[draw(state,8)]??'s'];if(canStep(state,actor,dx,dy)&&!actorAt(state,actor.x+dx,actor.y+dy)){moveActor(state,actor,actor.x+dx,actor.y+dy,events);return true;}return false;}
  if(Math.floor(actor.belly)===0)return false;
  // Native AI pickup is its own movement-phase action, not a side effect of
  // moving onto a tile. This also preserves attack-before-pickup by default.
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
  const goal=current??actor.goal;
  if(goal&&distance(actor,goal)>0){const p=nextStep(state,actor,goal);if(p&&!actorAt(state,p.x,p.y)){moveActor(state,actor,p.x,p.y,events);return true;}return false;}
  actor.goal=null;
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
  const phase=getDungeonTurnPhase(state);
  if(phase!=='unprepared')return {phase,changed:false,consumedTurn:false,events,status:state.status};
  // Legacy floorTurn counted completed browser base passes. Preserve that
  // known arrival countdown; no cartridge fractional-history is inferred.
  state.baseBeat=((state.baseBeat??state.floorTurn%36)+1)%36;state.leaderPrepared=false;
  if(state.baseBeat===0)spawnEnemy(state,data);
  if(!scheduledOnBeat(state,state.hero)){
    advanceOtherActors(state,data,events);finishBaseBeat(state);updateVisibility(state);
    return {phase:getDungeonTurnPhase(state)==='blocked'?'blocked':'advanced',changed:true,consumedTurn:true,events,status:state.status};
  }
  state.leaderPrepared=true;beginTurn(state,state.hero,data,events);updateVisibility(state);
  const ready=getDungeonTurnPhase(state);
  return {phase:ready==='unprepared'?'blocked':ready,changed:true,consumedTurn:false,events,status:state.status};
}
/** Complete exactly one automatically blocked leader opportunity. The app
 * supplies the native 60-frame presentation delay; this owner has no clock.
 * @param {DungeonState} state @param {OpeningData} data @returns {ActionResult} */
export function completeForcedTurn(state,data){
  /** @type {GameEvent[]} */const events=[];
  if(getDungeonTurnPhase(state)!=='forced')return {consumedTurn:false,events,status:state.status};
  state.turn++;state.floorTurn++;finishLeaderTurn(state,data,events);
  return {consumedTurn:true,events,status:state.status};
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
    if(canAct&&!defeated(state))actAI(state,actor,data,events);
    finishTurn(state,actor,data,events);
  }
}
/** @param {DungeonState} state */
function finishBaseBeat(state){
  state.enemies=state.enemies.filter(actor=>actor.hp>0);
  if(!defeated(state)){
    if(state.waterSport>0)state.waterSport--;
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
    if(state.floorTurn===751)message(state,events,'Something is approaching...');
    if(state.floorTurn===851)message(state,events,'Something is getting closer!');
    if(state.floorTurn===951)message(state,events,'It is right nearby!');
    if(state.floorTurn>=1000){state.status='defeated';message(state,events,'A mysterious force carried the team out of the dungeon.');}
  }
  if(swappedActor&&!defeated(state))finishTurn(state,swappedActor,data,events);
  advanceOtherActors(state,data,events);finishBaseBeat(state);updateVisibility(state);
}
/** Menus/facing consume no dungeon time. Invalid commands do not consume RNG or
 * allow foes to act. Accepted actions form a single bounded synchronous turn.
 * @param {DungeonState} state @param {DungeonAction} action @param {OpeningData} data @returns {ActionResult} */
export function performAction(state,action,data) {
  /** @type {GameEvent[]} */const events=[];const result=/** @param {boolean} consumedTurn */consumedTurn=>({consumedTurn,events,status:state.status});
  if(!action||!['move','face','moveSlot','attack','struggle','wait','stairs','cancelStairs','eatGround','eatHeld','usePartnerItem','throwGround','pickup','learnMove'].includes(action.type))return result(false);
  if(state.status==='rescued'||state.status==='defeated')return result(false);
  if(action.type==='learnMove'){
    const request=state.pendingLearning[0],actor=actors(state).find(a=>a.id===action.actorId);
    if(!request||request.actorId!==action.actorId||!actor||action.slot!==null&&(!Number.isInteger(action.slot)||action.slot<0||action.slot>3))return result(false);
    if(action.slot!==null){actor.moves[action.slot]=moveSlot(data,request.moveId);message(state,events,`${actor.name} learned ${data.moves[request.moveId]?.name}!`);}state.pendingLearning.shift();return result(false);
  }
  if(state.pendingLearning.length)return result(false);
  if(getDungeonTurnPhase(state)!=='input')return result(false);
  if(action.type==='cancelStairs'){state.status='playing';return result(false);}
  if(action.type==='stairs'){
    if(state.hero.x!==state.stairs.x||state.hero.y!==state.stairs.y)return result(false);
    if(state.floor===3){state.status='rescued';events.push({type:'rescue'});return result(false);}state.floor++;generateFloor(state,data,events);return result(false);
  }
  if(action.type==='move'||action.type==='face'){
    if(!Number.isInteger(action.dx)||!Number.isInteger(action.dy)||Math.abs(action.dx)>1||Math.abs(action.dy)>1||action.dx===0&&action.dy===0)return result(false);
    if(action.type==='face'){state.hero.direction=directionFor(action.dx,action.dy);return result(false);}
    const target=actorAt(state,state.hero.x+action.dx,state.hero.y+action.dy);
    if(!state.hero.status.confusion&&(!canStep(state,state.hero,action.dx,action.dy)||target&&!canSwapOpening(state.hero,target))){state.hero.direction=directionFor(action.dx,action.dy);return result(false);}
  }
  if(action.type==='moveSlot'&&(!Number.isInteger(action.slot)||!state.hero.moves[action.slot]))return result(false);
  if(action.type==='struggle'&&(state.hero.moves.some(move=>move.pp>0)||!data.moves['move-struggle']))return result(false);
  if(action.type==='moveSlot'){const move=data.moves[state.hero.moves[action.slot]?.id??''];if(!move||!supportsMove(move)){message(state,events,`${move?.name??'This move'} is not yet available in this browser remake.`);return result(false);}}
  // The leader's shortcut rejects an exhausted selection while still inside
  // its input loop. AI without PP Checker may spend its action on such a slot.
  if(action.type==='moveSlot'){const move=state.hero.moves[action.slot];if(move&&move.pp<=0){message(state,events,`${move.name} has no PP left!`);return result(false);}}
  const ground=getGroundItem(state);
  if((action.type==='eatGround'||action.type==='throwGround')&&(!ground||ground.kind==='poke')||action.type==='eatHeld'&&(!state.hero.heldItem||state.hero.heldItem.kind==='poke')||action.type==='usePartnerItem'&&(!state.partner.heldItem||state.partner.heldItem.kind==='poke'||state.partner.hp<=0)||action.type==='pickup'&&(!ground||ground.kind!=='poke'&&state.hero.heldItem))return result(false);
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
        if(action.skipPickup||action.runRequested&&target?.id==='partner'){const item=getGroundItem(state);if(item)message(state,events,`${state.hero.name} stepped on ${ITEM_NAMES[item.kind]}.`);}
        else pickup(state,state.hero,events);
      }
    }else if(action.type==='attack')attack(state,state.hero,null,data,events);
    else if(action.type==='struggle')attack(state,state.hero,'struggle',data,events);
    else if(action.type==='moveSlot')attack(state,state.hero,action.slot,data,events);
    else if(action.type==='eatGround'&&ground){eat(state,state.hero,ground,events);state.items=state.items.filter(i=>i.id!==ground.id);}
    else if(action.type==='eatHeld'&&state.hero.heldItem){eat(state,state.hero,state.hero.heldItem,events);state.hero.heldItem=null;}
    else if(action.type==='usePartnerItem')state.partner.useHeldItem=true;
    else if(action.type==='throwGround'&&ground)throwGroundBerry(state,ground,events);
    else if(action.type==='pickup')pickup(state,state.hero,events);
  }
  finishLeaderTurn(state,data,events,swappedActor);return result(true);
}
/** @param {DungeonState} state */
function defeated(state) { return state.status==='defeated'; }
/** @param {DungeonState} state @param {string} actorId @param {number} slot @param {boolean} enabled */
export function setMoveEnabled(state,actorId,slot,enabled) { const actor=[state.hero,state.partner].find(a=>a.id===actorId);if(actor&&Number.isInteger(slot)&&actor.moves[slot])actor.moves[slot].enabled=enabled; }
/** @param {DungeonState} state @param {number} slot */
export function setShortcut(state,slot) { if(!Number.isInteger(slot)||!state.hero.moves[slot])return;for(let i=0;i<state.hero.moves.length;i++){const move=state.hero.moves[i];if(move)move.set=i===slot;} }
/** @param {OpeningData} data @param {string} moveId */
export function isMoveSupported(data,moveId) { const move=data.moves[moveId];return !!move&&supportsMove(move); }
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
  const hasBeat=Object.hasOwn(s,'baseBeat'),hasPrepared=Object.hasOwn(s,'leaderPrepared');
  if(hasBeat!==hasPrepared||!exactKeys(s,hasBeat?`${stateKeys},baseBeat,leaderPrepared`:stateKeys)||hasBeat&&(!integer(s.baseBeat,0,35)||typeof s.leaderPrepared!=='boolean'))return false;
  if(s.version!==1||s.width!==WIDTH||s.height!==HEIGHT||!integer(s.floor,1,3)||!['playing','stairs','rescued','defeated'].includes(s.status)||!integer(s.turn,0,10000000)||!integer(s.floorTurn,0,1000)||!integer(s.money,0,9999999)||!integer(s.nextId,1,10000000)||!integer(s.waterSport,0,128))return false;
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
    const optionalKeys=['useHeldItem','tactic','enabledIq'].filter(key=>Object.hasOwn(a,key));
    if(!exactKeys(a,[actorKeys,...optionalKeys].join(','))||Object.hasOwn(a,'useHeldItem')&&typeof a.useHeldItem!=='boolean')return false;
    if(Object.hasOwn(a,'tactic')&&!TACTICS.some(tactic=>tactic.id===a.tactic))return false;
    if(Object.hasOwn(a,'enabledIq')&&(!Array.isArray(a.enabledIq)||a.enabledIq.length>IQ_SKILLS.length||new Set(a.enabledIq).size!==a.enabledIq.length||a.enabledIq.some(id=>!IQ_SKILLS.some(skill=>skill.id===id))))return false;
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
