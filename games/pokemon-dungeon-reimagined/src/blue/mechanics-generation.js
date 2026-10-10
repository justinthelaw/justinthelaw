import { cell, ordinary, positions } from '../domain/generation/support.js';
import { actors, draw, index, open } from './mechanics-common.js';

/** @typedef {import('../domain/generation/types.js').Geometry} Geometry */
/** @typedef {import('../domain/generation/support.js').Draws} Draws */
/** @typedef {import('./mechanics-types.js').Point} Point */
/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */

// First sentinel-delimited segment of native gUnknown_80F4598. Preserve its
// repeated entries: it is an ordered placement search, not a distance sort.
/** @type {readonly (readonly [number,number])[]} */
const ENTRY_OFFSETS = [
  [0,0],[-1,0],[1,0],[0,1],[0,-1],[-1,-1],[-1,1],[-2,0],[0,-2],[0,2],
  [1,-1],[1,1],[2,0],[-1,-2],[-1,2],[-2,-1],[-2,1],[-3,0],[0,-3],[0,3],
  [1,-2],[1,2],[2,-1],[2,1],[3,0],[-1,-3],[-1,3],[-2,-2],[-2,2],[-3,-1],
  [-3,1],[1,-3],[1,3],[2,-2],[2,2],[3,-1],[3,1],[-2,-3],[-2,3],[-3,-2],
  [-3,2],[2,-3],[2,3],[3,-2],[3,2],[-3,-3],[-3,3],[3,-3],[3,3],[-4,0],
  [4,0],[0,-4],[0,4],[-4,1],[4,1],[-1,-4],[-1,4],[-4,-1],[4,-1],[1,-4],
  [1,4],[-4,2],[4,2],[-2,-4],[-2,4],[-4,-2],[4,-2],[2,-4],[2,4],[-4,3],
  [4,3],[-3,-4],[-3,4],[-4,-3],[4,-3],[3,-4],[3,4],[-4,4],[4,4],[-4,-4],
  [-4,4],[-5,0],[5,0],[0,-5],[0,5],[-5,-1],[5,-1],[-1,-5],[-1,5],[-5,1],
  [5,1],[1,-5],[1,5],[-5,-2],[5,-2],[-2,-5],[-2,5],[-5,2],[5,2],[2,-5],
  [2,5],[-5,-3],[5,-3],[-3,-5],[-3,5],[-5,3],[5,3],[3,-5],[3,5],[-5,-4],
  [5,-4],[-4,-5],[-4,5],[-5,4],[5,4],[4,-5],[4,5],[-5,-5],[5,-5],[-5,-5],[-5,5],
];
/** @param {Point} p */
const key = p => p.y * 56 + p.x;
/** Native ShuffleSpawnPositions makes two random swaps per candidate, then
 * chooses consecutive flags from one random starting point, wrapping around.
 * @param {Point[]} candidates @param {number} count @param {Draws} rng */
function flags(candidates,count,rng) {
  if(!candidates.length||count<=0)return [];
  rng.swaps(candidates,candidates.length*2);
  const start=rng.int(candidates.length);
  return Array.from({length:Math.min(count,candidates.length)},(_,i)=>candidates[(start+i)%candidates.length]).filter(/** @returns {p is Point} */p=>p!==undefined);
}
/** Tiny Woods has no shops, traps, secondary structures or forced house.
 * Native order is stairs, item flags, leader, enemy flags. Item flags can
 * coincide with stairs; CreateFloorItems later suppresses that actual item.
 * A leader may start on unoccupied stairs. The locked partner searches the
 * source offsets in the same room first and never uses a random neighbor.
 * @param {Geometry} map @param {import('../domain/generation/types.js').Parameters} p @param {Draws} rng */
export function openingSpawns(map,p,rng) {
  const candidates=positions(map,t=>ordinary(t)&&t.room!==null&&!t.shop&&!t.junction&&!t.unbreakable).map(t=>({x:t.x,y:t.z}));
  rng.int(100); // Native itemless-Monster-House draw exists even at chance zero.
  const stairs=candidates[rng.int(candidates.length)];
  if(!stairs)throw new Error('No Tiny Woods stair spawn.');
  const itemCount=p.itemDensity===0?0:Math.max(1,rng.range(p.itemDensity-2,p.itemDensity+2));
  const itemFlags=flags([...candidates],itemCount,rng),itemKeys=new Set(itemFlags.map(key));
  const heroCandidates=candidates.filter(point=>!itemKeys.has(key(point)));
  const hero=heroCandidates[rng.int(heroCandidates.length)];
  if(!hero)throw new Error('No Tiny Woods player spawn.');
  const enemyCount=p.enemyDensity>0?Math.max(1,rng.range(Math.floor(p.enemyDensity/2),p.enemyDensity)):Math.abs(p.enemyDensity);
  const enemies=flags(candidates.filter(point=>key(point)!==key(hero)&&key(point)!==key(stairs)&&!itemKeys.has(key(point))),enemyCount,rng);
  const room=cell(map,hero.x,hero.y)?.room;
  let partner=null;
  for(let pass=0;pass<2&&partner===null;pass++)for(const [dx,dy] of ENTRY_OFFSETS){
    const point={x:hero.x+dx,y:hero.y+dy},tile=cell(map,point.x,point.y);
    if(key(point)===key(hero)||!tile||!ordinary(tile)||pass===0&&tile.room!==room)continue;
    partner=point;break;
  }
  if(!partner)throw new Error('No Tiny Woods partner spawn.');
  return {stairs,hero,partner,items:itemFlags.filter(point=>key(point)!==key(stairs)),enemies};
}
/** Item/wild-mon materialization scans rows from independently drawn offsets,
 * advancing each coordinate before visiting it. It is not flag-pick order.
 * @param {DungeonState} state @param {Point[]} points */
export function spawnScanOrder(state,points) {
  const x=draw(state,state.width),y=draw(state,state.height);
  const ordinal=/** @param {Point} p */p=>((p.y-y-1+state.height)%state.height)*state.width+(p.x-x-1+state.width)%state.width;
  return [...points].sort((a,b)=>ordinal(a)-ordinal(b));
}
/** Native sub_8083660: distant room, any room, then any open floor. The first
 * nonempty pass wins. It depends on leader distance, not team visibility.
 * Each pass visits at most 56*32 cells and adds each tile only once.
 * @param {DungeonState} state @returns {Point|null} */
export function arrivalPosition(state) {
  const occupied=new Set(actors(state).map(actor=>index(state,actor.x,actor.y)));
  for(const item of state.items)occupied.add(index(state,item.x,item.y));
  for(let pass=0;pass<3;pass++){
    const startX=draw(state,state.width),startY=draw(state,state.height);
    /** @type {Point[]} */const candidates=[];
    for(let dx=0;dx<state.width;dx++)for(let dy=0;dy<state.height;dy++){
      const x=(startX+dx)%state.width,y=(startY+dy)%state.height;
      if(!open(state,x,y)||occupied.has(index(state,x,y)))continue;
      if(pass<2&&(state.roomIds[index(state,x,y)]??-1)<0)continue;
      if(pass===0&&Math.abs(state.hero.x-x)<6&&Math.abs(state.hero.y-y)<6)continue;
      candidates.push({x,y});
    }
    if(candidates.length)return candidates[draw(state,candidates.length)]??null;
  }
  return null;
}
