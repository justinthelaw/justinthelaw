// Compact the repository's original authored character art for the DS-size view.
// This reads no ROM, remote image, or commercial game asset.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { Raster } from '../pixel/raster.mjs';
import { createIntroPaintings } from './intro.mjs';

const input = new URL('../roster/', import.meta.url);
const output = new URL('../../../../games/pokemon-dungeon-reimagined/assets/blue/', import.meta.url);
const species = [1, 4, 7, 10, 12, 16, 25, 52, 54, 66, 102, 104, 133, 152, 155, 158, 191, 252, 255, 258, 265, 279, 300];
const clips = ['idle', 'walk', 'attack-physical', 'hit-light', 'defeat', 'rest-sleep', 'celebrate', 'interact'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await readFile(new URL('manifest.json', input), 'utf8'));
const characters = (await Promise.all(manifest.shards.map(async shard => {
  const bytes = await readFile(new URL(shard.path, input));
  if (digest(bytes) !== shard.sha256) throw Error(`Stale authoring manifest: ${shard.path}`);
  return JSON.parse(bytes.toString()).characters;
}))).flat();
const records = [];
const contact = new Raster(species.length * 36, 4 * 36);
const portraits = new Raster(288,192);
const portraitRecords=[];
const portraitCrops={10:[29,25,38,42],12:[32,20,32,40],52:[23,14,50,50],104:[25,15,48,48],133:[22,10,52,52]};
const check = process.argv.includes('--check');
if (!check) await mkdir(output, { recursive: true });

async function emit(url, bytes) {
  if (check) {
    const existing = await readFile(url);
    if (!existing.equals(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes))) throw Error(`Stale Blue artwork: ${url.pathname}`);
  } else await writeFile(url, bytes);
}

function decode(bytes) {
  if (!bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw Error('Invalid source PNG');
  const compressed = [];
  let width = 0, height = 0;
  for (let offset = 8; offset < bytes.length;) {
    const size = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + size);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      if (data[8] !== 8 || data[9] !== 6 || data[12] !== 0) throw Error('Expected source RGBA PNG');
    } else if (type === 'IDAT') compressed.push(data);
    offset += size + 12;
  }
  if (width !== 384 || height !== 768) throw Error('Unexpected original atlas size');
  const raw = inflateSync(Buffer.concat(compressed), { maxOutputLength: (width * 4 + 1) * height });
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    if (raw[y * (width * 4 + 1)] !== 0) throw Error('Expected original filter-zero export');
    raw.copy(pixels, y * width * 4, y * (width * 4 + 1) + 1, (y + 1) * (width * 4 + 1));
  }
  return pixels;
}

for (const number of species) {
  const id = `pokemon-${String(number).padStart(3, '0')}`;
  const character = characters.find(candidate => candidate.speciesId === id && candidate.formId === 'default');
  if (!character) throw Error(`Missing original art: ${id}`);
  const atlas = new Raster(128, 256 * clips.length);
  const sources = [];
  for (const [clipIndex, clip] of clips.entries()) {
    const page = character.pages.find(candidate => candidate.clip === clip);
    if (!page) throw Error(`Missing original clip: ${id}/${clip}`);
    const bytes = await readFile(new URL(page.path, input));
    if (digest(bytes) !== page.sha256) throw Error(`Stale original art: ${id}/${clip}`);
    const pixels = decode(bytes);
    if(clipIndex===0){
      let left=96,top=96,right=0,bottom=0;
      for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(pixels[(y*384+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
      const extent=Math.max(32,Math.round(Math.max((right-left+1)*.82,(bottom-top+1)*.64)));
      const crop=portraitCrops[number]??[Math.round((left+right-extent)/2),Math.round(top+(bottom-top)*.34-extent/2),extent,extent];
      const index=species.indexOf(number),targetX=index%6*48+4,targetY=Math.floor(index/6)*48+4;
      for(let y=0;y<40;y++)for(let x=0;x<40;x++){
        const sx=Math.max(0,Math.min(95,Math.floor(crop[0]+(x+.5)*crop[2]/40))),sy=Math.max(0,Math.min(95,Math.floor(crop[1]+(y+.5)*crop[3]/40)));
        const source=(sy*384+sx)*4;pixels.copy(portraits.data,((targetY+y)*288+targetX+x)*4,source,source+4);
      }
      portraitRecords.push({speciesId:id,x:targetX,y:targetY,width:40,height:40,originalCrop:crop,originalSha256:page.sha256});
    }
    for (let y = 0; y < 256; y++) for (let x = 0; x < 128; x++) {
      const source = ((y * 3 + 1) * 384 + x * 3 + 1) * 4;
      pixels.copy(atlas.data, ((clipIndex * 256 + y) * 128 + x) * 4, source, source + 4);
    }
    sources.push({ clip, originalPath: page.path, originalSha256: page.sha256 });
  }
  const bytes = atlas.png(), path = `${id}.png`;
  await emit(new URL(path, output), bytes);
  const column = species.indexOf(number);
  [0, 2, 4, 6].forEach((direction, row) => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const source = ((direction * 32 + y) * 128 + x) * 4;
      atlas.data.copy(contact.data, ((row * 36 + y + 2) * contact.width + column * 36 + x + 2) * 4, source, source + 4);
    }
  });
  records.push({ speciesId: id, path, bytes: bytes.length, sha256: digest(bytes), sources });
}

const scenes=[];
for(const painting of createIntroPaintings()){
  const bytes=painting.art.png();await emit(new URL(painting.path,output),bytes);
  scenes.push({id:painting.id,path:painting.path,width:painting.art.width,height:painting.art.height,bytes:bytes.length,sha256:digest(bytes),provenance:'original-source-native-pixel-painting'});
}
const portraitBytes=portraits.png();await emit(new URL('portraits.png',output),portraitBytes);
await emit(new URL('manifest.json', output), `${JSON.stringify({
  schemaVersion: 1, profile: 'blue-opening-original-art-v1',
  provenance: 'Deterministic nearest-neighbor reduction of original source-native art already authored in this repository. Not Nintendo DS art; no commercial assets were extracted.',
  sourceManifestSha256: digest(await readFile(new URL('manifest.json', input))),
  cell: 32, footAnchor: [16, 31], width: 128, height: 256 * clips.length,
  directions: ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'], clips, records,scenes,
  portraitAtlas:{path:'portraits.png',width:288,height:192,cell:48,columns:6,bytes:portraitBytes.length,sha256:digest(portraitBytes),records:portraitRecords,provenance:'Face crops of the original authored96px front poses; no commercial portraits.'},
  authoringSources:[{path:'tools/pokemon-dungeon/art/blue/intro.mjs',sha256:digest(await readFile(new URL('intro.mjs',import.meta.url)))}],
}, null, 2)}\n`);
await emit(new URL('contact.png', import.meta.url), contact.png());
console.log(JSON.stringify({ mode: check ? 'check' : 'export', species: records.length, scenePaintings:scenes.length, encodedBytes: [...records,...scenes].reduce((total, record) => total + record.bytes, portraitBytes.length), decodedBytesPerSpecies: 128 * 256 * clips.length * 4 }));
