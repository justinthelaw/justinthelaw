/** The opening loads individual original-art atlases, never the old roster pack. */
const SPECIES_IDS = [1, 4, 7, 10, 12, 16, 25, 52, 54, 66, 102, 104, 133, 152, 155, 158, 191, 252, 255, 258, 265, 279, 300].map(value => `pokemon-${String(value).padStart(3, '0')}`);
const SPECIES = new Set(SPECIES_IDS);
const CLIPS = ['idle', 'walk', 'attack-physical', 'hit-light', 'defeat', 'rest-sleep', 'celebrate', 'interact'];
const DIRECTIONS = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
const DURATIONS = [[240,200,240,200],[110,110,110,110],[140,90,110,180],[90,100,130,160],[150,200,240,800],[320,500,640,500],[130,160,170,170],[180,150,190,190]];
const ASSET_ROOT = new URL('../../assets/blue/', import.meta.url);
const MAX_ATLASES = 12;

export class SpriteBank {
  constructor() {
    /** @type {Map<string,{image:ImageBitmap,used:number}>} */ this.images = new Map();
    /** @type {Map<string,Promise<void>>} */ this.pending = new Map();
    /** @type {ImageBitmap|null} */ this.portraits = null;
    /** @type {Promise<void>|null} */ this.portraitsPending = null;
    this.controller = new AbortController(); this.disposed = false; this.clock = 0;
  }

  /** @param {string[]} ids */
  async loadSpecies(ids) {
    const unique = [...new Set(ids)];
    if (unique.length > MAX_ATLASES) throw Error('A scene exceeds the opening character cache.');
    await Promise.all([...unique.map(id => this.load(id)),this.loadPortraits()]);
    const protectedIds = new Set(unique);
    while (this.images.size > MAX_ATLASES) {
      const oldest = [...this.images.entries()].filter(([id]) => !protectedIds.has(id)).sort((left, right) => left[1].used - right[1].used)[0];
      if (!oldest) break;
      oldest[1].image.close(); this.images.delete(oldest[0]);
    }
  }

  async loadPortraits(){
    if(this.portraits)return;
    if(this.portraitsPending)return this.portraitsPending;
    const promise=(async()=>{
      const response=await fetch(new URL('portraits.png',ASSET_ROOT),{signal:this.controller.signal});
      if(!response.ok)throw Error(`Could not load character portraits (${response.status}).`);
      const image=await window.createImageBitmap(await response.blob());
      if(this.disposed){image.close();throw new DOMException('Renderer was disposed.','AbortError');}
      if(image.width!==288||image.height!==192){image.close();throw Error('Portrait artwork has unexpected dimensions.');}
      this.portraits=image;
    })();
    this.portraitsPending=promise;
    try{await promise;}finally{this.portraitsPending=null;}
  }

  /** @param {string} id */
  async load(id) {
    if (this.disposed) throw new DOMException('Renderer was disposed.', 'AbortError');
    if (!SPECIES.has(id)) throw Error(`Character is outside the opening: ${id}`);
    const existing = this.images.get(id);
    if (existing) { existing.used = ++this.clock; return; }
    const pending = this.pending.get(id);
    if (pending) return pending;
    const promise = (async () => {
      const response = await fetch(new URL(`${id}.png`, ASSET_ROOT), { signal: this.controller.signal });
      if (!response.ok) throw Error(`Could not load character art (${response.status}).`);
      const image = await window.createImageBitmap(await response.blob());
      if (this.disposed) { image.close(); throw new DOMException('Renderer was disposed.', 'AbortError'); }
      if (image.width !== 128 || image.height !== 2048) { image.close(); throw Error('Character art has unexpected dimensions.'); }
      this.images.set(id, { image, used: ++this.clock });
    })();
    this.pending.set(id, promise);
    try { await promise; } finally { this.pending.delete(id); }
  }

  /** @param {CanvasRenderingContext2D} context @param {string} id @param {number} x @param {number} y
   * @param {{direction?:string,clip?:string,time?:number,scale?:number,frame?:number,shadow?:boolean,alpha?:number}} [options] */
  draw(context, id, x, y, options = {}) {
    const entry = this.images.get(id);
    const scale = options.scale ?? 1;
    if (!entry) return;
    entry.used = ++this.clock;
    const clip = Math.max(0, CLIPS.indexOf(options.clip ?? 'idle'));
    const direction = Math.max(0, DIRECTIONS.indexOf(options.direction ?? 's'));
    const durations = DURATIONS[clip] ?? [240,200,240,200];
    const total = durations.reduce((sum, duration) => sum + duration, 0);
    let clock = Math.max(0,options.time ?? 0);
    if(clip===0||clip===1||clip===5)clock%=total;
    let timedFrame=0;
    while(timedFrame<3&&clock>=(durations[timedFrame]??240)){clock-=durations[timedFrame]??240;timedFrame++;}
    const frame = Math.max(0, Math.min(3, options.frame ?? timedFrame));
    context.save(); context.globalAlpha = options.alpha ?? 1;
    if (options.shadow !== false) {
      context.fillStyle = '#23382355'; context.fillRect(Math.round(x - 7 * scale), Math.round(y - scale), Math.round(14 * scale), Math.round(3 * scale));
      context.fillRect(Math.round(x - 5 * scale), Math.round(y - 2 * scale), Math.round(10 * scale), Math.round(5 * scale));
    }
    context.drawImage(entry.image, frame * 32, clip * 256 + direction * 32, 32, 32, Math.round(x - 16 * scale), Math.round(y - 31 * scale), 32 * scale, 32 * scale);
    context.restore();
  }

  /** An original-art face crop, not a claim to reproduce Chunsoft portraits.
   * @param {CanvasRenderingContext2D} context @param {string} id @param {number} x @param {number} y @param {number} [size]
   * @param {{flip?:boolean,face?:boolean}} [options] */
  portrait(context, id, x, y, size = 36, options = {}) {
    context.fillStyle = '#d2ac53'; context.fillRect(x, y, size, size);
    context.fillStyle = '#fae6a3'; context.fillRect(x + 1, y + 1, size - 2, size - 2);
    context.fillStyle = '#bd9139'; context.fillRect(x + 1, y + size - 6, size - 2, 5);
    const entry = this.images.get(id),index=SPECIES_IDS.indexOf(id);
    if(options.face!==false&&this.portraits&&index>=0){
      context.save();context.translate(x+2+(options.flip?size-4:0),y+2);if(options.flip)context.scale(-1,1);
      context.drawImage(this.portraits,index%6*48+4,Math.floor(index/6)*48+4,40,40,0,0,size-4,size-4);context.restore();
    }else if (entry) context.drawImage(entry.image, 3, 4, 26, 25, x + 2, y + 2, size - 4, size - 4);
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.controller.abort();
    for (const entry of this.images.values()) entry.image.close();
    this.portraits?.close();this.portraits=null;
    this.images.clear(); this.pending.clear();
  }
}
