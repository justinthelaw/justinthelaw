// Static C/header/RLE/PNG conversion only. No game/native module is executed.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readTarGzip,decodePng,blueChannel} from './native-format.mjs';
import {Raster} from '../pixel/raster.mjs';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const PIN='013475aa04f5be3191e5527c186d9bfceae7cae0';

/** Reuse existing pinned UI evidence for the non-blending BG0 guard. Normal
 * Blue screenshots corroborate the crop edge, not Hypnosis layer parity. */
async function guardEvidence(){
  const uiBytes=await readFile(new URL('native-ui-sources.json',import.meta.url)),ui=JSON.parse(uiBytes);
  if(ui.commit!==PIN||ui.archive?.path!=='native-ui-source.tar.gz')throw Error('Unsupported Hypnosis guard UI source.');
  const archive=await readFile(new URL(ui.archive.path,import.meta.url));if(digest(archive)!==ui.archive.sha256)throw Error('Hypnosis guard UI archive changed.');
  const files=readTarGzip(archive),source=files.get('data/system_sbin.s'),record=ui.files.find(entry=>entry.path==='data/system_sbin.s');
  if(!source||digest(source)!==record?.sha256)throw Error('Hypnosis guard font source changed.');
  const literal=source.toString().split('gUnknown_8302024:\n')[1]?.split('.global ')[0];if(!literal)throw Error('Hypnosis guard font table is missing.');
  const bytes=Buffer.from([...literal.matchAll(/^\.byte ([^\n]+)/gm)].flatMap(match=>[...match[1].matchAll(/0x([0-9a-fA-F]{2})/g)].map(value=>parseInt(value[1],16))));
  if(bytes.length!==4356||bytes.readUInt32LE(0)!==136||[...bytes.subarray(36,68)].some((value,index)=>value!==(index%4===0?3:0)))throw Error('Hypnosis BG0 guard pixels changed.');
  const references=JSON.parse(await readFile(new URL('native-reference/manifest.json',import.meta.url))),captures=[];
  for(const name of ['ss01.png','ss02.png']){
    const record=references.records.find(entry=>entry.path===name),png=await readFile(new URL(`native-reference/${name}`,import.meta.url));
    if(digest(png)!==record?.sha256)throw Error('Hypnosis guard Blue reference changed.');
    const image=decodePng(png);if(image.width!==272||image.height!==408)throw Error('Hypnosis guard screenshot framing changed.');
    let coloredRight=0;
    for(let y=208;y<400;y++){
      const left=(y*272+8)*4,right=(y*272+263)*4;
      if(image.data[left]||image.data[left+1]||image.data[left+2]||image.data[left+3]!==255)throw Error('Hypnosis guard crop column changed.');
      if(image.data[right]||image.data[right+1]||image.data[right+2])coloredRight++;
    }
    if(coloredRight!==192)throw Error('Hypnosis guard opposite display edge changed.');
    for(const y of [207,208,399,400]){
      let black=0;for(let x=8;x<264;x++){const at=(y*272+x)*4;if(!image.data[at]&&!image.data[at+1]&&!image.data[at+2]&&image.data[at+3]===255)black++;}
      if(black!==(y===207||y===400?256:1))throw Error('Hypnosis guard display/frame boundary changed.');
    }
    captures.push({path:`native-reference/${name}`,sha256:record.sha256,crop:[8,208,256,192],blackLeftPixels:192,coloredRightPixels:coloredRight});
  }
  return{column:0,sourceUiManifestPath:'tools/pokemon-dungeon/art/blue/native-ui-sources.json',sourceUiManifestSha256:digest(uiBytes),captures,qualification:'Comparative BG0 guard; normal Blue crop evidence does not establish Hypnosis priority/framing.'};
}

/** Reproduce only the reviewed Hypnosis BG2 pattern source and phase table. */
export async function exportNativeHypnosis({emit,output}){
  const guard=await guardEvidence();
  const manifestBytes=await readFile(new URL('native-hypnosis-sources.json',import.meta.url));
  if(manifestBytes.length>64*1024)throw Error('Hypnosis source manifest exceeds its bound.');
  const manifest=JSON.parse(manifestBytes),archive=manifest.archive;
  if(manifest.schemaVersion!==1||manifest.repository!=='https://github.com/pret/pmd-red'||manifest.commit!==PIN||manifest.effectId!==222||manifest.activation!=='selected-hypnosis-only'||archive?.path!=='native-hypnosis-source.tar.gz'||!Number.isInteger(archive.bytes)||archive.bytes<1||archive.bytes>512*1024||!Array.isArray(manifest.files)||manifest.files.length!==54)throw Error('Unsupported Hypnosis source manifest.');
  const archiveBytes=await readFile(new URL(archive.path,import.meta.url));
  if(archiveBytes.length!==archive.bytes||digest(archiveBytes)!==archive.sha256)throw Error('Hypnosis source archive changed.');
  const files=readTarGzip(archiveBytes),seen=new Set();let total=0;
  if(files.size!==manifest.files.length)throw Error('Hypnosis source inventory changed.');
  for(const record of manifest.files){
    const bytes=files.get(record.path);
    if(seen.has(record.path)||!bytes||bytes.length!==record.bytes||digest(bytes)!==record.sha256||record.url!==`https://raw.githubusercontent.com/pret/pmd-red/${PIN}/${record.path}`)throw Error(`Unpinned Hypnosis input: ${record.path}`);
    seen.add(record.path);total+=bytes.length;
  }
  if(total>4*1024*1024)throw Error('Hypnosis decoded sources exceed their bound.');
  const required=path=>{const bytes=files.get(path);if(!bytes)throw Error(`Missing Hypnosis input: ${path}`);return bytes;};
  const source=required('src/data/effects/efbg005.c').toString(),tiles=decodePng(required('data/effects/efbg005.png'));
  const lines=required('data/effects/efbg005.pal').toString().trim().split(/\r?\n/);
  if(lines[0]!=='JASC-PAL'||Number(lines[2])!==256||lines.length!==259)throw Error('Unexpected Hypnosis palette.');
  const palette=lines.slice(3).map(line=>line.split(/\s+/).map(Number));
  if(palette.some(rgb=>rgb.length!==3||rgb.some(value=>!Number.isInteger(value)||value<0||value>255)))throw Error('Invalid Hypnosis palette channel.');
  if(tiles.width!==8||tiles.height!==712||!tiles.indices||tiles.indices.length!==89*64||tiles.indices.some(index=>index>15))throw Error('Unexpected Hypnosis indexed tiles.');
  const headers=new Map([...source.matchAll(/const u16 (gUnknown_\w+)\[\] = \{([^}]+)\};/g)].map(match=>[match[1],match[2].match(/\d+/g).map(Number)]));
  const maps=new Map([...source.matchAll(/const u16 (gUnknown_\w+)_tilemap\[\] = INCBIN_U16\("([^"]+)"\);/g)].map(match=>[match[1],match[2]]));
  const table=source.match(/const u16 \*const gUnknown_\w+\[\] = \{([\s\S]*?)\n\};/),order=table?.[1].match(/gUnknown_\w+/g)??[];
  if(order.length!==22||new Set(order).size!==22||headers.size!==22||maps.size!==22)throw Error('Hypnosis frame inventory changed.');
  const patterns=[],lookup=new Map(),phases=[],rawMaps=new Set();let brightness=0,step=0;
  for(const symbol of order){
    const header=headers.get(symbol),path=maps.get(symbol);
    if(!header||header.length!==10||header[2]!==33||header[3]!==27||header[4]!==2||!path)throw Error('Hypnosis frame geometry or duration changed.');
    const bytes=required(path);if(bytes.length!==1782)throw Error('Hypnosis tilemap size changed.');
    rawMaps.add(digest(bytes));
    if(header[5])brightness=step=0;
    const request=header[6]&0x8000?header[6]-65536:header[6];
    if(request){if(request===99){brightness=3100;step=0;}else if(request>0)brightness=step=Math.trunc(3100/request);else{brightness=3100;step=Math.trunc(3100/request);}}
    const b=Math.trunc(brightness/100),colors=palette.slice(224,240).map(rgb=>rgb.map(channel=>blueChannel((Math.trunc(channel*b/256)&31)*8)));
    const frame=new Raster(264,216);let position=0,run=0;
    for(let y=0;y<27;y++)for(let x=0;x<33;x++){
      let value=0;
      if(run===0){if(position*2>=bytes.length)throw Error('Truncated Hypnosis tilemap.');value=bytes.readUInt16LE(position++*2);if(!(value&0xf000)){run=value&1023;value=0;}}
      if(run)run--;if(!value)continue;
      const tile=(value&1023)-120;if(value>>>12!==14||tile<0||tile>=89)throw Error('Hypnosis tile/palette address changed.');
      for(let py=0;py<8;py++)for(let px=0;px<8;px++){
        const index=tiles.indices[tile*64+py*8+px];if(!index)continue;
        const dx=x*8+(value&1024?7-px:px),dy=y*8+(value&2048?7-py:py);
        frame.data.set([...colors[index],255],(dy*264+dx)*4);
      }
    }
    if(position*2!==bytes.length||run!==0)throw Error('Hypnosis tilemap consumption changed.');
    const pattern=new Raster(32,32);
    for(let y=0;y<32;y++)frame.data.copy(pattern.data,y*128,y*264*4,(y*264+32)*4);
    for(let y=0;y<216;y++)for(let x=0;x<264;x++)for(let channel=0;channel<4;channel++)if(frame.data[(y*264+x)*4+channel]!==pattern.data[((y&31)*32+(x&31))*4+channel])throw Error('Hypnosis periodicity changed.');
    for(let at=3;at<pattern.data.length;at+=4)if(pattern.data[at]!==255)throw Error('Hypnosis plane is no longer opaque.');
    const key=digest(pattern.data);let index=lookup.get(key);
    if(index===undefined){index=patterns.length;lookup.set(key,index);patterns.push(pattern);}
    phases.push(index);brightness=Math.max(0,Math.min(3100,brightness+step));
  }
  const expected=[0,1,2,3,4,5,6,7,8,9,10,11,1,2,3,4,5,6,7,8,9,12];
  if(patterns.length!==13||rawMaps.size!==11||phases.join(',')!==expected.join(','))throw Error('Hypnosis phase inventory changed.');
  const atlas=new Raster(416,32);patterns.forEach((pattern,index)=>atlas.paste(pattern,index*32,0));
  const image=atlas.png();if(image.length>4096||digest(image)!=='768b3720331f0a9d3d884856ee329e4a0ed27a9a687f8531487c2fd957ffec9d')throw Error('Reviewed Hypnosis image bytes changed.');
  const modulePath='src/blue/render-hypnosis-data.js',moduleBytes=Buffer.from(`// Generated from pinned efbg005 headers/palette;22 phases, two source ticks each.\nexport const HYPNOSIS_PATTERNS=Object.freeze(${JSON.stringify(phases)});\n`);
  await emit(new URL('hypnosis-background.png',output),image);
  await emit(new URL(`../../${modulePath}`,output),moduleBytes);
  return{effectId:222,activation:'selected-hypnosis-only',path:'hypnosis-background.png',width:416,height:32,bytes:image.length,sha256:digest(image),modulePath,moduleBytes:moduleBytes.length,moduleSha256:digest(moduleBytes),sourceManifestPath:'tools/pokemon-dungeon/art/blue/native-hypnosis-sources.json',sourceManifestSha256:digest(manifestBytes),sourceEdition:manifest.sourceEdition,guard,framing:'Comparative top-left256x192 periodic coverage; direct Blue framing unverified',archive};
}
