import { nextRandom } from '../domain/rng.js';

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').Actor} Actor */
/** @typedef {import('./mechanics-types.js').Direction} Direction */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */
/** @typedef {import('./mechanics-types.js').Point} Point */
/** @type {readonly Direction[]} */
export const DIRECTIONS = ['s', 'sw', 'w', 'nw', 'n', 'ne', 'e', 'se'];
/** @type {Readonly<Record<Direction,readonly [number,number]>>} */
export const VECTORS = { s:[0,1], sw:[-1,1], w:[-1,0], nw:[-1,-1], n:[0,-1], ne:[1,-1], e:[1,0], se:[1,1] };
/** Source-style high-halfword scale. Browser PRNG sequence is explicitly adapted.
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
/** @param {DungeonState} state @param {Point} a @param {Point} b */
export function sameRoom(state,a,b) { const room=state.roomIds[index(state,a.x,a.y)]; return room!==undefined && room>=0 && room===state.roomIds[index(state,b.x,b.y)]; }
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
/** @param {DungeonState} state @param {GameEvent[]} events @param {string} text */
export function message(state,events,text) { state.log.push(text); if(state.log.length>80) state.log.splice(0,state.log.length-80); events.push({type:'message',text}); }
/** @param {DungeonState} state @param {Actor} actor @param {number} x @param {number} y @param {GameEvent[]} events */
export function moveActor(state,actor,x,y,events) { const from={x:actor.x,y:actor.y}; actor.direction=directionFor(x-actor.x,y-actor.y); actor.x=x;actor.y=y;events.push({type:'move',actorId:actor.id,from,to:{x,y}}); }
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
