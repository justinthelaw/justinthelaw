import { draw, message, open } from './mechanics-common.js';

/** @typedef {import('./mechanics-types.js').DungeonState} DungeonState */
/** @typedef {import('./mechanics-types.js').HeldItem} HeldItem */
/** @typedef {import('./mechanics-types.js').Point} Point */
/** @typedef {import('./mechanics-types.js').GameEvent} GameEvent */

export const ITEM_NAMES={poke:'Poké','oran-berry':'Oran Berry','pecha-berry':'Pecha Berry','rawst-berry':'Rawst Berry'};
const DROP_OFFSETS=[[0,0],[0,-1],[1,0],[0,1],[-1,0],[-1,-1],[1,-1],[-1,1],[1,1],[-2,-2],[-1,-2],[0,-2],[1,-2],[2,-2],[-2,-1],[2,-1],[-2,0],[2,0],[-2,1],[2,1],[-2,2],[-1,2],[0,2],[1,2],[2,2]];

/** Tiny Woods uses the native money lookup with a 40-Poké upper bound. Drawing
 * an index in 0..99 and repeatedly halving it makes the eight outcomes nonuniform.
 * @param {DungeonState} state */
export function moneyPile(state) { let ordinal=draw(state,100);while(ordinal>7)ordinal=Math.floor(ordinal/2);return [4,6,10,14,22,26,34,38][ordinal]??4; }

/** SpawnDroppedItem's first 25-offset segment ignores actor occupancy. The
 * opening has ordinary terrain, walls and stairs, with no traps/water/shops.
 * A full item pool fails at the first eligible tile rather than searching on.
 * An existing projectile keeps its ID; new drops allocate one only on success.
 * @param {DungeonState} state @param {HeldItem} item @param {Point} origin @param {GameEvent[]} events @param {string} [existingId] */
export function dropItem(state,item,origin,events,existingId) {
  const name=item.kind==='poke'?`${item.amount} Poké`:ITEM_NAMES[item.kind];
  for(const [ox=0,oy=0] of DROP_OFFSETS){
    const x=origin.x+ox,y=origin.y+oy;
    if(!open(state,x,y)||state.stairs.x===x&&state.stairs.y===y||state.items.some(candidate=>candidate.x===x&&candidate.y===y))continue;
    if(state.items.length>=64)break;
    state.items.push({id:existingId??`item-${state.nextId++}`,kind:item.kind,amount:item.amount,x,y});
    message(state,events,`${name} fell on the ground.`);return true;
  }
  message(state,events,`${name} was lost.`);return false;
}
