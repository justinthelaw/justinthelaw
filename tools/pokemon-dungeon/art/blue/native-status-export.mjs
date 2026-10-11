import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Raster } from '../pixel/raster.mjs';
import { blueChannel, decodePng, readTarGzip } from './native-format.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

/** Original image data only; never imports game code or reads a ROM.
 * @param {{emit:(url:URL,bytes:Buffer|string)=>Promise<void>,output:URL}} options */
export async function exportNativeStatuses({emit,output}){
  const sourceBytes=await readFile(new URL('native-status/sources.json',import.meta.url));
  const source=JSON.parse(sourceBytes),native=JSON.parse(await readFile(new URL('native-sources.json',import.meta.url)));
  if(source.schemaVersion!==1||source.records.length!==9||source.selectionFrames!==61||source.animationFrameTicks!==4)throw Error('Invalid status source inventory.');
  const archive=await readFile(new URL(native.spriteSource.archive.path,import.meta.url));
  if(digest(archive)!==native.spriteSource.archive.sha256)throw Error('Native palette source archive changed.');
  const files=readTarGzip(archive),atlas=new Raster(256,source.records.length*16),records=[];
  for(const [row,record] of source.records.entries()){
    const input=await readFile(new URL(`native-status/${record.path}`,import.meta.url));
    if(input.length!==record.bytes||digest(input)!==record.sha256)throw Error(`Native status input changed: ${record.id}`);
    const image=decodePng(input);
    if(!image.indices||image.width!==record.width||image.height!==record.height||record.frameHeight!==16||record.frames*16!==image.height||record.frames*image.width>256)throw Error('Invalid native status frame geometry.');
    const palettePath=`graphics/ax/pal/${record.palette}.pal`,paletteBytes=files.get(palettePath),pin=native.spriteSource.files.find(file=>file.path===palettePath);
    if(!paletteBytes||!pin||digest(paletteBytes)!==pin.sha256)throw Error('Native status palette is not pinned.');
    const palette=paletteBytes.toString().trim().split(/\r?\n/).slice(3).map(line=>line.trim().split(/\s+/).map(value=>blueChannel(Math.floor(Number(value)*31/256)*8)));
    if(palette.length!==16||palette.some(color=>color.length!==3||color.some(value=>!Number.isInteger(value)||value<0||value>255)))throw Error('Invalid status palette.');
    for(let frame=0;frame<record.frames;frame++)for(let y=0;y<16;y++)for(let x=0;x<record.width;x++){
      const index=image.indices[(frame*16+y)*image.width+x];if(index===0)continue;
      const color=palette[index];if(!color)throw Error('Status pixel exceeds its palette.');
      atlas.data.set([...color,255],((row*16+y)*atlas.width+frame*record.width+x)*4);
    }
    records.push({id:record.id,x:0,y:row*16,width:record.width,height:16,frames:record.frames,bit:record.bit,phase:record.phase,xShift:record.xShift});
  }
  const imageBytes=atlas.png(),metadata={schemaVersion:1,width:atlas.width,height:atlas.height,selectionFrames:61,animationFrameTicks:4,records,sourceEdition:source.sourceEdition};
  const metadataBytes=Buffer.from(JSON.stringify(metadata)+'\n');
  await emit(new URL('status-icons.png',output),imageBytes);
  await emit(new URL('status-icons.json',output),metadataBytes);
  return{path:'status-icons.png',width:atlas.width,height:atlas.height,bytes:imageBytes.length,sha256:digest(imageBytes),metadataPath:'status-icons.json',metadataBytes:metadataBytes.length,metadataSha256:digest(metadataBytes),sourceManifestPath:'tools/pokemon-dungeon/art/blue/native-status/sources.json',sourceManifestSha256:digest(sourceBytes),sourceEdition:source.sourceEdition};
}
