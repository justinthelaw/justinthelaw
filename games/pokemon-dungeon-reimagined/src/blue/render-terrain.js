/** Original hand-authored pixel terrain, rendered at a fixed 24-pixel grid. */
export const TILE = 24;
const LEAVES = /** @type {const} */ (['#154f36', '#216c3e', '#328b43', '#50a849', '#79c655', '#acdd77']);

/** Stable decoration must not consume the mechanics random stream.
 * @param {number} x @param {number} y @param {number} [salt] */
export function terrainHash(x, y, salt = 0) {
  let value = Math.imul(x + 37, 374761393) ^ Math.imul(y + 71, 668265263) ^ Math.imul(salt + 1, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

/** @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {number} width @param {number} height @param {string|undefined} color */
function block(context, x, y, width, height, color) { context.fillStyle = color ?? '#4f8e40'; context.fillRect(Math.round(x), Math.round(y), width, height); }

/** @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {number} seed */
export function flower(context, x, y, seed) {
  const color = ['#efb4bf', '#eedca1', '#b9d5e4', '#d89cba'][seed % 4];
  block(context, x, y + 3, 1, 3, '#3f7336'); block(context, x - 2, y + 4, 2, 1, '#85a954');
  block(context, x - 1, y, 3, 3, color); block(context, x - 2, y + 1, 5, 1, color); block(context, x, y + 1, 1, 1, '#fff1ba');
}

/** @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {number} seed @param {number} [scale] */
export function tree(context, x, y, seed, scale = 1) {
  /** @param {number} left @param {number} top @param {number} width @param {number} height @param {string} color */
  const paint=(left,top,width,height,color)=>block(context,x+Math.round(left*scale),y+Math.round(top*scale),Math.ceil(width*scale),Math.ceil(height*scale),color);
  paint(-13,6,29,5,'#39846a');paint(-17,2,35,5,'#3f8e6a');
  paint(-4,-8,10,17,'#6b5031');paint(-3,-7,4,16,'#a08049');
  paint(-7,7,6,3,'#7a5e36');paint(3,6,8,3,'#7a5e36');
  const lobes = /** @type {[number,number,number,number][]} */ ([[-13,-23,14,13],[-4,-35,16,14],[7,-27,14,15],[-17,-14,17,13],[-2,-20,17,17],[9,-13,14,12],[-9,-6,18,8]]);
  for (const [lx, ly, width, height] of lobes) {
    paint(lx+2,ly,width-4,height,LEAVES[0]);paint(lx,ly+3,width,height-6,LEAVES[0]);
    paint(lx+2,ly+1,width-4,height-4,LEAVES[2]);paint(lx+1,ly+4,width-3,height-7,LEAVES[3]);
    paint(lx+4,ly+2,width-7,2,LEAVES[4]);paint(lx+3,ly+4,3,2,LEAVES[5]);
    const hash = terrainHash(lx,ly,seed);paint(lx+width-6,ly+height-7,4,3,LEAVES[1]);
    if(hash%2)paint(lx+7,ly+7,3,2,LEAVES[4]);
  }
}

export class Terrain {
  constructor() {
    this.atlas = document.createElement('canvas'); this.atlas.width = 24 * 16; this.atlas.height = 48;
    const context = this.atlas.getContext('2d'); if (!context) throw Error('A 2D canvas is required for terrain.');
    for (let variant = 0; variant < 16; variant++) {
      context.save(); context.translate(variant * 24, 0);
      block(context,0,0,24,24,'#d7d29b');
      for(let n=0;n<12;n++) { const hash=terrainHash(variant,n); const x=hash%24,y=(hash>>>8)%24; block(context,x,y,2+(hash%3),1,['#c9c48b','#e3dda7','#cec994','#e4dda9'][n%4]); }
      if(variant%3===0){block(context,3,8,1,2,'#bfb984');block(context,4,9,2,1,'#eae2af');}
      context.translate(0,24); block(context,0,0,24,24,'#356731');
      for(let n=0;n<11;n++) { const hash=terrainHash(variant,n,4),x=hash%25-3,y=(hash>>>8)%25-3; const shade=LEAVES[2+(hash%3)]; block(context,x+1,y,7,6,LEAVES[1]);block(context,x,y+1,9,4,shade);block(context,x+2,y,4,2,LEAVES[4]);block(context,x+2,y+1,2,1,LEAVES[5]); }
      context.restore();
    }
  }

  /** @param {CanvasRenderingContext2D} context @param {import('./mechanics-types.js').DungeonState} state @param {number} cameraX @param {number} cameraY */
  dungeon(context, state, cameraX, cameraY) {
    block(context,0,0,256,192,'#203b24');
    const left=Math.floor(cameraX/TILE),top=Math.floor(cameraY/TILE);
    for(let y=top;y<=top+9;y++)for(let x=left;x<=left+11;x++) {
      const screenX=x*TILE-cameraX,screenY=y*TILE-cameraY,index=y*state.width+x;
      const inside=x>=0&&y>=0&&x<state.width&&y<state.height;
      const floor=inside&&state.tiles[index]===1;
      const variant=terrainHash(x,y,state.floor)%16;
      context.drawImage(this.atlas,variant*TILE,floor?0:TILE,TILE,TILE,Math.round(screenX),Math.round(screenY),TILE,TILE);
      if(floor) {
        if(y>0&&state.tiles[index-state.width]!==1) { block(context,screenX,screenY,24,3,'#6b9150');block(context,screenX,screenY+3,24,2,'#bec18a'); }
        if(x>0&&state.tiles[index-1]!==1) { block(context,screenX,screenY,3,24,'#759a51'); }
        if(x<state.width-1&&state.tiles[index+1]!==1) { block(context,screenX+22,screenY,2,24,'#81a35a'); }
        if(y<state.height-1&&state.tiles[index+state.width]!==1) { block(context,screenX,screenY+22,24,2,'#8ba962'); if(variant%3===0)flower(context,screenX+8,screenY+16,variant); }
      }
      if(!inside||!state.visible[index]) { context.fillStyle=inside&&state.explored[index]?'#112b2373':'#10221ee6';context.fillRect(Math.round(screenX),Math.round(screenY),TILE,TILE); }
    }
  }

  /** @param {CanvasRenderingContext2D} context @param {number} time @param {{clearing?:boolean,reducedMotion?:boolean}} [options] */
  clearing(context, time, options = {}) {
    block(context,0,0,256,192,options.clearing?'#9dc967':'#b6e97b');
    for(let n=0;n<58;n++){const h=terrainHash(n,4,2),x=h%256,y=(h>>>8)%192;
      block(context,x,y,1,3,'#a2d66a');block(context,x+3,y-1,1,4,'#caed94');
      if(n%4===0)block(context,x+6,y+1,1,2,'#eff6bd');
    }
    // The source entry is a meadow, with a stump north of the pair, not a path.
    block(context,142,13,16,17,'#9d8e59');block(context,140,17,20,10,'#a79862');
    block(context,144,13,3,15,'#c2b478');block(context,153,13,2,14,'#c2b478');
    context.fillStyle='#e5d398';context.fillRect(143,9,14,7);context.fillRect(141,11,18,4);
    context.fillStyle='#b6a367';context.fillRect(146,11,8,3);context.fillStyle='#f2e0a4';context.fillRect(148,12,4,1);
    for(const [x,y]of /** @type {[number,number][]} */([[244,62],[17,111],[84,172]])){block(context,x-4,y,8,5,'#c9e691');block(context,x-2,y-2,5,2,'#dff1a6');}
    const trees = /** @type {[number,number][]} */ ([[-28,-12],[37,45],[110,-18],[202,45],[287,24],[-35,96],[278,108],[20,187],[143,200],[249,211],[-29,227],[80,233],[194,242]]);
    for(const [x,y]of trees)tree(context,x,y,terrainHash(x,y),1.55);
    if(options.clearing){tree(context,20,67,7,1.55);tree(context,237,69,5,1.55);}
    // A few drifting leaves provide movement without shifting the grid or camera.
    if(!options.reducedMotion)for(let n=0;n<4;n++){const x=(n*69+Math.floor(time/140))%288-16;const y=(n*41+Math.floor(time/280))%120+23;block(context,x,y,3,1,'#b9cd6e');block(context,x+1,y+1,2,1,'#94ae50');}
  }

  dispose(){this.atlas.width=1;this.atlas.height=1;}
}
