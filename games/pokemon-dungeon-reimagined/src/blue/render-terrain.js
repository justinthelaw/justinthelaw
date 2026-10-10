/** Published Rescue Team terrain, kept on its native 24-pixel grid.
 * Palette and scene crops are corroborated by original Blue press screenshots.
 */
export const TILE = 24;

/** Stable decoration must not consume the mechanics random stream.
 * @param {number} x @param {number} y @param {number} [salt] */
export function terrainHash(x, y, salt = 0) {
  let value = Math.imul(x + 37, 374761393) ^ Math.imul(y + 71, 668265263) ^ Math.imul(salt + 1, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return (value ^ (value >>> 16)) >>> 0;
}

/** @param {CanvasRenderingContext2D} context @param {number} x @param {number} y @param {number} width @param {number} height @param {string|undefined} color */
function block(context, x, y, width, height, color) { context.fillStyle = color ?? '#4f8e40'; context.fillRect(Math.round(x), Math.round(y), width, height); }

export class Terrain {
  constructor() {
    /** @type {Map<string,ImageBitmap>} */this.images=new Map();
    /** @type {number[]} */this.lookup=[];
    this.controller=new AbortController();this.disposed=false;
  }

  async load(){
    const base=new URL('../../assets/blue/scenery/',import.meta.url);
    const response=await fetch(new URL('manifest.json',base),{signal:this.controller.signal});
    if(!response.ok)throw Error(`Could not load terrain metadata (${response.status}).`);
    /** @type {{profile:string,terrain:{lookup:number[]}}} */
    const manifest=await response.json();
    if(manifest.profile!=='blue-native-scenery-v2'||!Array.isArray(manifest.terrain.lookup)||manifest.terrain.lookup.length!==2352||manifest.terrain.lookup.some(value=>!Number.isInteger(value)||value<0||value>=250))throw Error('Unsupported terrain metadata.');
    this.lookup=manifest.terrain.lookup;
    const descriptions=/** @type {[string,number,number][]} */([
      ['tiny-woods-entry',256,192],['tiny-woods-end',256,192],['tiny-woods-map',256,192],['tiny-woods-tiles',600,240],['stairs-down',24,24],['items',64,16],
    ]);
    try{await Promise.all(descriptions.map(async([id,width,height])=>{
      const result=await fetch(new URL(`${id}.png`,base),{signal:this.controller.signal});
      if(!result.ok)throw Error(`Could not load terrain image (${result.status}).`);
      const image=await window.createImageBitmap(await result.blob());
      if(this.disposed){image.close();return;}
      if(image.width!==width||image.height!==height){image.close();throw Error('Terrain image has unexpected dimensions.');}
      this.images.set(id,image);
    }));}catch(error){this.dispose();throw error;}
  }

  /** @param {CanvasRenderingContext2D} context */
  regionMap(context){
    const image=this.images.get('tiny-woods-map');
    if(image)context.drawImage(image,0,0);
  }

  /** Native stair tile; x/y are the cell's upper-left display coordinates.
   * @param {CanvasRenderingContext2D} context @param {number} x @param {number} y */
  stairs(context,x,y){
    const image=this.images.get('stairs-down');
    if(image)context.drawImage(image,Math.round(x),Math.round(y));
  }

  /** x/y are the native16px icon's center, normally the24px dungeon cell center.
   * @param {CanvasRenderingContext2D} context @param {import('./mechanics-types.js').ItemKind} kind @param {number} x @param {number} y */
  item(context,kind,x,y){
    const image=this.images.get('items');if(!image)return;
    const column=['poke','oran-berry','pecha-berry','rawst-berry'].indexOf(kind);if(column<0)return;
    context.drawImage(image,column*16,0,16,16,Math.round(x-8),Math.round(y-8),16,16);
  }

  /** Original eight-neighbor order: south, southeast, east, northeast, north,
   * northwest, west, southwest. The source CEX table resolves every mask.
   * @param {import('./mechanics-types.js').DungeonState} state @param {number} x @param {number} y @param {boolean} floor */
  adjacency(state,x,y,floor){
    /** @param {number} dx @param {number} dy */
    const matching=(dx,dy)=>{
      const xx=x+dx,yy=y+dy,inside=xx>=0&&yy>=0&&xx<state.width&&yy<state.height;
      return (inside&&state.tiles[yy*state.width+xx]===1)===floor;
    };
    return Number(matching(0,1))|Number(matching(1,1))<<1|Number(matching(1,0))<<2|Number(matching(1,-1))<<3|
      Number(matching(0,-1))<<4|Number(matching(-1,-1))<<5|Number(matching(-1,0))<<6|Number(matching(-1,1))<<7;
  }

  /** @param {CanvasRenderingContext2D} context @param {import('./mechanics-types.js').DungeonState} state @param {number} cameraX @param {number} cameraY */
  dungeon(context, state, cameraX, cameraY) {
    const atlas=this.images.get('tiny-woods-tiles');if(!atlas)return;
    block(context,0,0,256,192,'#619e00');
    const left=Math.floor(cameraX/TILE),top=Math.floor(cameraY/TILE);
    for(let y=top;y<=top+9;y++)for(let x=left;x<=left+11;x++) {
      const screenX=x*TILE-cameraX,screenY=y*TILE-cameraY,index=y*state.width+x;
      const inside=x>=0&&y>=0&&x<state.width&&y<state.height;
      const floor=inside&&state.tiles[index]===1;
      const mask=this.adjacency(state,x,y,floor);
      // Comparative sub_80498A8 chooses0/1/2 with2:1:1 weighting. The
      // coordinate hash is still an isolated cosmetic adaptation of its RNG.
      const sample=terrainHash(x,y,state.floor)%4,requested=sample===3?0:sample;
      const cell=this.lookup[((floor?512:0)+mask)*3+requested]??0;
      context.drawImage(atlas,cell%25*TILE,Math.floor(cell/25)*TILE,TILE,TILE,Math.round(screenX),Math.round(screenY),TILE,TILE);
      if(!inside||!state.visible[index]) { context.fillStyle=inside&&state.explored[index]?'#112b2373':'#10221ee6';context.fillRect(Math.round(screenX),Math.round(screenY),TILE,TILE); }
    }
  }

  /** @param {CanvasRenderingContext2D} context @param {number} _time @param {{clearing?:boolean,reducedMotion?:boolean}} [options] */
  clearing(context, _time, options = {}) {
    const image=this.images.get(options.clearing?'tiny-woods-end':'tiny-woods-entry');
    if(image)context.drawImage(image,0,0);
  }

  dispose(){if(this.disposed)return;this.disposed=true;this.controller.abort();for(const image of this.images.values())image.close();this.images.clear();this.lookup=[];}
}
