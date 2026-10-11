import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readTarGzip} from './native-format.mjs';
import {composeNativeAsset} from './native-export.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
// ground_object.c gUnknown_81183A0: low byte selects an eight-entry AX variant;
// bit0x800 loops it, whereas0x1000 plays it once.
const SCRIPT_ANIMATION_MAP=[-1,0x800,0x801,0x1000,0x1001,0x1002,0x1003,0x800,0x801,0x802,0x803,0x804,0x805,0x806,0x807,0x808,0x809,0x80a,0x80b,0x80c,0x80d,0x80e,0x80f,0];

export async function exportNativeOrnaments({emit,output}){
  const manifest=JSON.parse(await readFile(new URL('native-sources.json',import.meta.url),'utf8')),section=manifest.ornamentSource;
  const bytes=await readFile(new URL(section.archive.path,import.meta.url));if(digest(bytes)!==section.archive.sha256)throw Error('Native ornament archive hash changed.');
  const files=readTarGzip(bytes);if(files.size!==section.files.length)throw Error('Native ornament inventory changed.');
  for(const record of section.files){const data=files.get(record.path);if(!data||digest(data)!==record.sha256)throw Error(`Native ornament input changed: ${record.path}`);}
  const records=[];
  for(const[id,name]of[['title-bird','titleop1'],['title-letter','titleop2']]){
    const result=composeNativeAsset(files,{id,name},[],{ornament:true,headerPath:`src/data/ornament/${name}.h`,palettePath:'graphics/ornament/pal/titleop.pal'});
    result.metadata.scriptAnimationMap=SCRIPT_ANIMATION_MAP;
    const path=`${id}.png`,metadataPath=`${id}.json`,png=result.atlas.png(),json=JSON.stringify(result.metadata)+'\n';
    await emit(new URL(path,output),png);await emit(new URL(metadataPath,output),json);
    records.push({id,path,width:result.atlas.width,height:result.atlas.height,bytes:png.length,sha256:digest(png),metadataPath,metadataBytes:Buffer.byteLength(json),metadataSha256:digest(json),sourceEdition:'Red Rescue Team',sourceHeader:`src/data/ornament/${name}.h`});
  }
  return{records,archive:section.archive};
}
