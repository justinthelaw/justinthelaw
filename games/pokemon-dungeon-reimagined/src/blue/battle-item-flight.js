/** Money-only native projectile geometry. Red viewport margins are translated
 * to the existing Blue 256×192 display; exact Blue clipping remains qualified.
 * These functions read recorded positions only: no actors, terrain, RNG or saves. */

/** @typedef {import('./mechanics-types.js').Point} Point */
/** @typedef {{x:number,y:number,depthY:number,visible:boolean,shadow?:Point,fixedDepth?:1}} PokeSample */
/** Native sin_4096(i*85)*12, i=0..23, in signed 8.8 pixel units.
 * Pinned math.c/data/math.h; retain table rounding rather than Math.sin. */
const DROP_LIFT_Q8=Object.freeze([0,396,792,1164,1524,1860,2160,2424,2652,2832,2952,3036,3060,3036,2964,2844,2664,2448,2184,1884,1548,1200,816,432]);
/** @type {Readonly<Record<import('./mechanics-types.js').Direction,readonly [number,number]>>} */
const DIRECTIONS={s:[0,1],sw:[-1,1],w:[-1,0],nw:[-1,-1],n:[0,-1],ne:[1,-1],e:[1,0],se:[1,1]};

/** Flight bypasses ordinary item sight; the source keeps a 32px OBJ margin.
 * @param {number} x @param {number} y @param {Point} camera */
function itemVisible(x,y,camera){return x-camera.x>=-32&&x-camera.x<=288&&y-camera.y>=-32&&y-camera.y<=224;}

/** Six four-pixel updates per recorded tile, including a wall entry. Source
 * frames advance only when the item or its independent small shadow draws.
 * @param {Point} from @param {Point} to @param {Point} camera
 * @returns {readonly PokeSample[]} */
export function pokeFlightSamples(from,to,camera){
  const dx=Math.sign(to.x-from.x),dy=Math.sign(to.y-from.y),steps=Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y));
  if(!Number.isInteger(steps)||steps>10||dx&&dy&&Math.abs(to.x-from.x)!==Math.abs(to.y-from.y))throw new RangeError('Invalid money flight receipt.');
  /** @type {PokeSample[]} */const samples=[];
  for(let substep=1;substep<=steps*6;substep++){
    const x=from.x*24+4+dx*4*substep,y=from.y*24+dy*4*substep;
    const visible=itemVisible(x,y,camera),shadowX=x+8,shadowY=y+16;
    const shadowVisible=shadowX-camera.x>=-16&&shadowX-camera.x<=271&&shadowY-camera.y>=-16&&shadowY-camera.y<=207;
    if(visible||shadowVisible)samples.push(Object.freeze({x:x+8,y:y+8,depthY:y+8,visible,...(shadowVisible?{shadow:Object.freeze({x:shadowX,y:shadowY})}:{})}));
  }
  return Object.freeze(samples);
}

/** Native landing uses 24 fixed-point interpolation/sine updates and one
 * settle frame, even when offscreen or the chosen tile cannot spawn an item.
 * The flight Y offset0 versus landing offset4 always exceeds threshold11 in
 * fixed-point units, so this money-only route always enters the 24-step hop.
 * @param {Point} from @param {Point|null} landing @param {Point} camera
 * @param {boolean} settleInSight @returns {readonly PokeSample[]} */
export function pokeDropSamples(from,landing,camera,settleInSight){
  if(!landing)return Object.freeze([]);
  if(Math.max(Math.abs(from.x-landing.x),Math.abs(from.y-landing.y))>3)throw new RangeError('Invalid money landing receipt.');
  let x=(from.x*24+4)*256,y=from.y*24*256;
  const finalX=(landing.x*24+4)*256,finalY=(landing.y*24+4)*256;
  const dx=Math.trunc((finalX-x)/24),dy=Math.trunc((finalY-y)/24);
  /** @type {PokeSample[]} */const samples=[];
  for(const lift of DROP_LIFT_Q8){
    x+=dx;y+=dy;const px=Math.trunc(x/256),py=Math.trunc((y-lift)/256);
    samples.push(Object.freeze({x:px+8,y:py+8,depthY:Math.trunc(y/256)+8,fixedDepth:1,visible:itemVisible(px,py,camera)}));
  }
  const px=finalX/256,py=finalY/256;
  samples.push(Object.freeze({x:px+8,y:py+8,depthY:py+8,fixedDepth:1,visible:settleInSight&&itemVisible(px,py,camera)}));
  return Object.freeze(samples);
}

/** SpawnDroppedItem deliberately uses X_POS_TO_PIXELPOS for both axes.
 * @param {Point} origin @param {Point|null} landing
 * @param {import('./mechanics-types.js').Direction} direction @returns {Point} */
export function pokeLossPosition(origin,landing,direction){
  const point=landing??origin,[dx,dy]=DIRECTIONS[direction];
  return {x:point.x*24+12+dx*8,y:point.y*24+12+dy*8};
}
