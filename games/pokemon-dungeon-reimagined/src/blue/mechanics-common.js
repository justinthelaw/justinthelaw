import { nextRandom } from '../domain/rng.js';
import { captureActor, captureItems } from './battle-events.js';

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').Direction} Direction */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */
/** @typedef {import('./mechanics-types.js').Point} Point */
/** @type {readonly Direction[]} */
export const DIRECTIONS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];
/** @type {Readonly<Record<Direction,readonly [number,number]>>} */
export const VECTORS = { s:[0,1], sw:[-1,1], w:[-1,0], nw:[-1,-1], n:[0,-1], ne:[1,-1], e:[1,0], se:[1,1] };
export const ITEM_NAMES={poke:'Poké','oran-berry':'Oran Berry','pecha-berry':'Pecha Berry','rawst-berry':'Rawst Berry'};
/** Synchronous move groups never survive a public action/save boundary.
 * @type {WeakSet<DungeonState>} */
const queuedMovement = new WeakSet();
/** Source-style high-halfword scale. Algorithm and call schedule are separate contracts.
 * @param {DungeonState} state @param {number} cap */
export function draw(state, cap) {
  const next = nextRandom(state.rng); state.rng = next.state;
  return Math.floor((next.value >>> 16) * cap / 65536);
}
/** @param {number} n @param {number} low @param {number} high */
export function clamp(n, low, high) { return Math.max(low, Math.min(high, n)); }
/** @param {number} dx @param {number} dy @returns {Direction} */
export function directionFor(dx, dy) { return DIRECTIONS.find(d => VECTORS[d][0] === Math.sign(dx) && VECTORS[d][1] === Math.sign(dy)) ?? 's'; }
/** @param {Point} a @param {Point} b */
export function distance(a, b) { return Math.max(Math.abs(a.x-b.x), Math.abs(a.y-b.y)); }
/** @param {DungeonState} state @param {number} x @param {number} y */
export function index(state, x, y) { return y * state.width + x; }
/** @param {DungeonState} state @param {number} x @param {number} y */
export function open(state, x, y) { return x >= 0 && y >= 0 && x < state.width && y < state.height && state.tiles[index(state,x,y)] === 1; }
/** @param {DungeonState} state @returns {Actor[]} */
export function actors(state) { return [state.hero,state.partner,...state.enemies].filter(a=>a.hp>0); }
/** @param {DungeonState} state @param {number} x @param {number} y */
export function actorAt(state,x,y) {
  if(state.hero.hp>0&&state.hero.x===x&&state.hero.y===y)return state.hero;
  if(state.partner.hp>0&&state.partner.x===x&&state.partner.y===y)return state.partner;
  return state.enemies.find(a=>a.hp>0&&a.x===x&&a.y===y);
}
/** @param {Actor} actor */
export function team(actor) { return actor.id === 'hero' || actor.id === 'partner'; }
/** Original room effects include the room's one-tile border. A corridor uses
 * the floor's default two-tile sight radius, independently of melee geometry.
 * @param {DungeonState} state @param {Point} origin @param {Point} target */
export function inSight(state,origin,target) {
  const id=state.roomIds[index(state,origin.x,origin.y)]??-1;
  if(id<0)return distance(origin,target)<=2;
  const room=state.rooms[id];
  return !!room&&target.x>=room.x-1&&target.y>=room.y-1&&target.x<room.x+room.width+1&&target.y<room.y+room.height+1;
}
/** @param {DungeonState} state @param {Point} actor @param {number} dx @param {number} dy */
export function canStep(state,actor,dx,dy) { return open(state,actor.x+dx,actor.y+dy) && (!(dx&&dy) || open(state,actor.x+dx,actor.y)&&open(state,actor.x,actor.y+dy)); }
/** @param {DungeonState} state @param {GameEvent[]} events @param {string} text @param {import('./battle-events.js').BattleEvent} [presentation] */
export function message(state,events,text,presentation) { state.log.push(text); if(state.log.length>80) state.log.splice(0,state.log.length-80); events.push({type:'message',text,...(presentation?{presentation}:{})}); }
/** Presentation-only boundaries never change the simulation.
 * cameraActor marks the ordinary action-wrapper hook; Bide end effects omit it.
 * @param {GameEvent[]} events @param {string} actorId @param {'walk'|'wait'|'other'} action @param {Actor} [cameraActor] */
export function recordAction(events,actorId,action,cameraActor) { events.push({type:'presentation',presentation:{kind:'action',actorId,action,...(cameraActor&&team(cameraActor)?{cameraActor:captureActor(cameraActor)}:{})}}); }
/** Explicit native camera boundary; no automatic request belongs to a wild actor.
 * @param {GameEvent[]} events @param {Actor} actor @param {'look'|'leader'|'input'} mode */
export function recordCamera(events,actor,mode){if(team(actor))events.push({type:'presentation',presentation:{kind:'camera',actor:captureActor(actor),mode}});}
/** Upkeep on an unmoved actor is visible before the pending walk group. A
 * moved/swapped actor's full snapshot includes its destination and must wait.
 * @param {GameEvent[]} events @param {Actor[]} members */
function snapshotsAfterWalk(events,members) {
  for(let index=events.length-1;index>=0;index--){
    const event=events[index];
    if(event?.presentation?.kind==='flush')return false;
    if(event?.type==='move'&&members.some(actor=>actor.id===event.actorId))return true;
  }
  return false;
}
/** Copy only the actors/items changed at this producer point. No RNG or saves.
 * @param {DungeonState} state @param {GameEvent[]} events @param {Actor[]} members @param {boolean} [includeItems] @param {boolean} [afterWalk] */
export function recordSync(state,events,members,includeItems=false,afterWalk=snapshotsAfterWalk(events,members)) {
  events.push({type:'presentation',presentation:{kind:'sync',actors:members.map(captureActor),...(includeItems?{items:captureItems(state),money:state.money}:{}),...(afterWalk?{afterWalk:true}:{})}});
}
/** @param {DungeonState} state @param {Actor} actor @param {number} x @param {number} y @param {GameEvent[]} events */
export function moveActor(state,actor,x,y,events) { recordAction(events,actor.id,'walk');const from={x:actor.x,y:actor.y}; actor.direction=directionFor(x-actor.x,y-actor.y); actor.x=x;actor.y=y;queuedMovement.add(state);events.push({type:'move',actorId:actor.id,from,to:{x,y},presentation:{kind:'move',actor:captureActor(actor)}}); }
/** Native initial sleep is the 127 sentinel, independent of ordinary sleep.
 * Targeted moves wake it before accuracy 1; successful item impacts also wake it.
 * @param {DungeonState} state @param {Actor} actor @param {GameEvent[]} events @param {boolean} [announce] */
export function wakeInitialSleep(state,actor,events,announce=true) {
  if(actor.hp<=0||actor.status.sleep!==127)return false;
  delete actor.status.sleep;
  if(announce)message(state,events,`${actor.name} woke up!`);
  events.push({type:'status',actorId:actor.id,text:'wake',presentation:{kind:'sync',actors:[captureActor(actor)]}});return true;
}
/** TryWakeSleepingWildPokemon uses adjacency even around blocked corners. The
 * opening has no Sneak Scarf/Racket Band. Refresh facing through the existing
 * compact team-target policy; this is not native AI/PRNG replay.
 * @param {DungeonState} state @param {GameEvent[]} events */
export function wakeNearbyWild(state,events) {
  const members=[state.hero,state.partner].filter(actor=>actor.hp>0);
  for(const actor of state.enemies){
    if(actor.hp<=0||actor.status.sleep!==127||!members.some(member=>distance(actor,member)<=1))continue;
    wakeInitialSleep(state,actor,events,false);
    const target=members.filter(member=>inSight(state,actor,member)).sort((a,b)=>distance(actor,a)-distance(actor,b))[0];
    if(target){actor.goal={x:target.x,y:target.y};actor.direction=directionFor(target.x-actor.x,target.y-actor.y);recordSync(state,events,[actor]);}
  }
}
/** DisplayActions returns without a wake pass when no walking is queued. Walk
 * and wait actions can accumulate; attacks/items/residual effects flush first.
 * Terminal turns discard pending visual walking without further gameplay work.
 * @param {DungeonState} state @param {GameEvent[]} events */
export function flushQueuedMovement(state,events) {
  if(!queuedMovement.delete(state))return;
  // Native moved flags are local to this walk group. The previous marker
  // bounds the scan; slot order below is independent of reverse scan order.
  /** @type {Set<string>} */const moved=new Set();
  for(let index=events.length-1;index>=0;index--){
    const event=events[index];if(event?.presentation?.kind==='flush')break;
    if(event?.type==='move'&&event.actorId)moved.add(event.actorId);
  }
  events.push({type:'presentation',presentation:{kind:'flush'}});
  if(state.status!=='defeated'&&state.status!=='rescued'){
    wakeNearbyWild(state,events);
    // DisplayActions' late nonleader pass follows waking, including held-slot
    // team money. Hero pickup retains its existing deferred presentation.
    for(const actor of [state.partner,...state.enemies])if(actor.hp>0&&moved.has(actor.id))pickup(state,actor,events,true);
  }
}
/** Floor creation has no inherited pending movement. @param {DungeonState} state */
export function clearQueuedMovement(state) { queuedMovement.delete(state); }
/** @param {DungeonState} state @param {Actor} actor @param {GameEvent[]} events @param {boolean} [fromMovement] */
export function pickup(state,actor,events,fromMovement=false) {
  const item=state.items.find(i=>i.x===actor.x&&i.y===actor.y);if(!item)return false;
  if(item.kind==='poke'&&team(actor)){if(!fromMovement){recordAction(events,actor.id,'other',actor);flushQueuedMovement(state,events);}events.push({type:'presentation',presentation:{kind:'pickup',sequence:332,afterWalk:fromMovement}});state.money+=item.amount;message(state,events,`${actor.name} picked up ${item.amount} Poké.`,fromMovement?{kind:'sync',actors:[],afterWalk:true}:undefined);}
  else if(!actor.heldItem){if(!fromMovement){recordAction(events,actor.id,'other',actor);flushQueuedMovement(state,events);}events.push({type:'presentation',presentation:{kind:'pickup',sequence:team(actor)?330:331,afterWalk:fromMovement}});actor.heldItem={kind:item.kind,amount:item.amount};message(state,events,`${actor.name} picked up ${ITEM_NAMES[item.kind]}.`,fromMovement?{kind:'sync',actors:[],afterWalk:true}:undefined);}
  else {if(actor.id==='hero'||fromMovement)message(state,events,`${actor.name} stepped on ${ITEM_NAMES[item.kind]}.`,fromMovement?{kind:'sync',actors:[],afterWalk:true}:undefined);return false;}
  state.items=state.items.filter(i=>i.id!==item.id);events.push({type:'item',actorId:actor.id,text:item.kind,presentation:{kind:'sync',actors:[captureActor(actor)],items:captureItems(state),money:state.money,...(fromMovement?{afterWalk:true}:{})}});
  const tutorial=`item-${item.kind}`;
  if(actor.id==='hero'&&['poke','oran-berry','pecha-berry'].includes(item.kind)&&!state.tutorials.includes(tutorial)){
    state.tutorials.push(tutorial);events.push({type:'tutorial',actorId:actor.id,text:item.kind});
  }
  return true;
}
/** @param {DungeonState} state @param {Actor} actor @param {Point} goal @returns {Point|null} */
export function nextStep(state,actor,goal) {
  const start=index(state,actor.x,actor.y), end=index(state,goal.x,goal.y);
  const size=state.width*state.height;
  const queue=new Int32Array(size),parent=new Int32Array(size).fill(-2);queue[0]=start;parent[start]=-1;let tail=1;
  const occupied=new Set(actors(state).filter(a=>a.id!==actor.id).map(a=>index(state,a.x,a.y)));
  // BFS needs one deterministic neighbor order, not a new array and sort for
  // every visited tile. Each cell enters the fixed-size queue at most once.
  const neighbors=DIRECTIONS.map(d=>VECTORS[d]).sort((a,b)=>distance({x:actor.x+a[0],y:actor.y+a[1]},goal)-distance({x:actor.x+b[0],y:actor.y+b[1]},goal));
  for(let cursor=0;cursor<tail;cursor++) {
    const key=queue[cursor]; if(key===undefined) break; if(key===end) break;
    const p={x:key%state.width,y:Math.floor(key/state.width)};
    for(const [dx,dy] of neighbors) { const x=p.x+dx,y=p.y+dy,k=index(state,x,y); if(!canStep(state,p,dx,dy)||parent[k]!==-2||occupied.has(k)&&k!==end)continue;parent[k]=key;queue[tail++]=k; }
  }
  if(parent[end]===-2)return null; let cursor=end;
  for(let count=0;count<state.tiles.length;count++){const previous=parent[cursor];if(previous===start)return {x:cursor%state.width,y:Math.floor(cursor/state.width)};if(previous===undefined||previous<0)return null;cursor=previous;}
  return null;
}
