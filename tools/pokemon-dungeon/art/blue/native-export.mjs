import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Raster } from '../pixel/raster.mjs';
import { blueChannel, decodePng, readTarGzip } from './native-format.mjs';

const DIRECTIONS=['s','se','e','ne','n','nw','w','sw'];
const SHAPES={ST_OAM_SQUARE:[[8,8],[16,16],[32,32],[64,64]],ST_OAM_H_RECTANGLE:[[16,8],[32,8],[32,16],[64,32]],ST_OAM_V_RECTANGLE:[[8,16],[8,32],[16,32],[32,64]]};
const POSE=/AX_POSE\(\s*(-?\d+),\s*OAM1\(\s*(\d+),\s*(ST_OAM_\w+)\s*,\s*(\d+)\),\s*OAM2\(\s*(\d+),\s*ST_OAM_SIZE_(\d),\s*FLIP\((\d),\s*(\d)\),\s*(\d+),\s*(\d+)\),\s*OAM3\((\d+),\s*(\d+),\s*(\d+)\)\)/g;
const ANIM=/\{\s*\.frames\s*=\s*(\d+),\s*\.unkFlags\s*=\s*(\d+),\s*\.poseId\s*=\s*(\d+),\s*\.offset\s*=\s*\{(-?\d+),\s*(-?\d+)\},\s*\.shadow\s*=\s*\{(-?\d+),\s*(-?\d+)\}\s*\}/g;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const names=body=>body.match(/\bs[A-Za-z0-9_]+\b/g)??[];
const arrays=(source,kind)=>new Map([...source.matchAll(new RegExp(`static const ${kind}\\s+(\\w+)\\[\\]\\s*=\\s*\\{(.*?)\\};`,'gs'))].map(match=>[match[1],match[2]]));
function get(map,key){const value=map.get(key);if(value===undefined)throw Error(`Native source entry missing: ${key}`);return value;}
function namedTable(map,prefix){const entry=[...map].find(([key])=>key.startsWith(prefix));if(!entry)throw Error(`Native table missing: ${prefix}`);return names(entry[1]);}

function nativeClips(count){
  const alias=(animation,loop)=>({animation:animation<count?animation:7,loop});
  return{idle:alias(7,true),walk:alias(0,true),fly:alias(0,true),'attack-physical':alias(1,false),'hit-light':alias(6,false),defeat:alias(6,false),'rest-sleep':alias(5,true),celebrate:alias(16,false),interact:alias(17,false),'story-sleep':alias(count>13?13:5,true),wake:alias(count>14?14:7,false)};
}

export function composeNativeAsset(files,species,monsterData,options={}){
  const headerPath=options.headerPath??`src/data/ax/${species.name}.h`,source=get(files,headerPath).toString();
  const gfx=new Map([...source.matchAll(/static const u8 (\w+)\[\] = INCBIN_U8\("([^"]+)"\);/g)].map(match=>[match[1],match[2].replace(/\.4bpp$/,'.png')]));
  const spriteBodies=arrays(source,'ax_sprite'),spriteTable=namedTable(arrays(source,'ax_sprite \\*const'),'sAxSprites');
  const poseBodies=arrays(source,'ax_pose'),poseTable=namedTable(arrays(source,'ax_pose \\*const'),'sAxPoses');
  const animationBodies=arrays(source,'ax_anim'),animationTables=arrays(source,'ax_anim \\*const');
  const animationTable=namedTable(arrays(source,'ax_anim \\*const \\*const'),'sAxAnimations');
  const animations=animationTable.map(name=>{
    const directions=names(get(animationTables,name)).map(sequence=>[...get(animationBodies,sequence).matchAll(ANIM)].map(match=>{
      const[ticks,flags,pose,x,y,sx,sy]=match.slice(1).map(Number);
      if(ticks<1||pose>=poseTable.length)throw Error('Invalid native animation frame.');
      return[pose,ticks,x,y,sx,sy,flags];
    }));
    if(directions.length!==8||directions.some(sequence=>sequence.length===0))throw Error('Native animation must cover all eight directions.');
    return directions;
  });
  const channel=value=>options.dungeon?blueChannel(Math.floor(value*31/256)*8):blueChannel(value);
  const readPalette=path=>get(files,path).toString().trim().split(/\r?\n/).slice(3).map(row=>row.trim().split(/\s+/).map(value=>channel(Number(value))));
  const palettes=options.palettePath?Array(16).fill(readPalette(options.palettePath)):Array.from({length:14},(_,index)=>readPalette(`graphics/ax/pal/${index}.pal`));
  const streams=new Map();
  function stream(index){
    if(streams.has(index))return streams.get(index);
    const result=[];
    for(const match of get(spriteBodies,spriteTable[index]).matchAll(/\{\s*(\w+),\s*(ARRAY_COUNT\(\w+\)|\d+)\s*\}/g)){
      if(match[1]==='NULL'){result.push(...Array(Number(match[2])*2).fill(0));continue;}
      const image=decodePng(get(files,get(gfx,match[1])));
      if(!image.indices||image.width%8||image.height%8)throw Error('Native sprite fragment must contain indexed 8-pixel tiles.');
      for(let ty=0;ty<image.height;ty+=8)for(let tx=0;tx<image.width;tx+=8)for(let y=0;y<8;y++)for(let x=0;x<8;x++)result.push(image.indices[(ty+y)*image.width+tx+x]);
    }
    streams.set(index,result);return result;
  }
  const composed=poseTable.map(name=>{
    const body=get(poseBodies,name),parts=[...body.matchAll(POSE)];
    if(parts.length!==(body.match(/AX_POSE\(/g)??[]).length||parts.length===0)throw Error(`Unparsed native pose: ${name}`);
    const memory=[],draws=[];
    for(const match of parts){
      const sprite=Number(match[1]),rawY=Number(match[2]),shape=match[3],highY=Number(match[4]),rawX=Number(match[5]),size=Number(match[6]),flipX=Number(match[7]),flipY=Number(match[8]),highX=Number(match[10]),tile=Number(match[11]),palette=Number(match[13]);
      if(sprite>=0)memory.push(...stream(sprite));
      const[width,height]=SHAPES[shape][size],art=new Raster(width,height),colors=palettes[palette];
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const tileIndex=tile*64+(Math.floor(y/8)*(width/8)+Math.floor(x/8))*64+(y%8)*8+x%8;
        if(tileIndex>=memory.length)throw Error(`Native pose reads outside its tile fragments: ${name}`);
        const colorIndex=memory[tileIndex];if(!colorIndex)continue;
        const color=colors[colorIndex];if(!color)throw Error('Invalid native sprite palette index.');
        const dx=flipX?width-x-1:x,dy=flipY?height-y-1:y,target=(dy*width+dx)*4;
        art.data[target]=color[0];art.data[target+1]=color[1];art.data[target+2]=color[2];art.data[target+3]=255;
      }
      draws.push({art,x:((rawX&511)|(highX<<8))-256,y:rawY+highY*256-512});
    }
    const left=Math.min(...draws.map(part=>part.x)),top=Math.min(...draws.map(part=>part.y));
    const right=Math.max(...draws.map(part=>part.x+part.art.width)),bottom=Math.max(...draws.map(part=>part.y+part.art.height));
    const combined=new Raster(right-left,bottom-top);
    // Source OAM is emitted backwards; the first pose piece is foremost.
    for(const part of draws.toReversed())blit(combined,part.art,part.x-left,part.y-top);
    let minX=combined.width,minY=combined.height,maxX=-1,maxY=-1;
    for(let y=0;y<combined.height;y++)for(let x=0;x<combined.width;x++)if(combined.data[(y*combined.width+x)*4+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
    if(maxX<0)return{art:new Raster(1,1),dx:0,dy:0};
    const art=new Raster(maxX-minX+1,maxY-minY+1);
    for(let y=0;y<art.height;y++)combined.data.copy(art.data,y*art.width*4,((y+minY)*combined.width+minX)*4,((y+minY)*combined.width+maxX+1)*4);
    return{art,dx:left+minX,dy:top+minY};
  });
  const unique=new Map(),rectangles=[];let x=0,y=0,rowHeight=0;
  for(const pose of composed){
    const key=`${pose.art.width},${pose.art.height}:${digest(pose.art.data)}`;let rectangle=unique.get(key);
    if(!rectangle){
      if(x+pose.art.width+1>512){x=0;y+=rowHeight+1;rowHeight=0;}
      rectangle={x,y,art:pose.art};unique.set(key,rectangle);x+=pose.art.width+1;rowHeight=Math.max(rowHeight,pose.art.height);
    }
    rectangles.push([rectangle.x,rectangle.y,pose.art.width,pose.art.height,pose.dx,pose.dy]);
  }
  const atlas=new Raster(512,y+rowHeight);
  for(const rectangle of unique.values())blit(atlas,rectangle.art,rectangle.x,rectangle.y);
  const monster=monsterData.find(record=>record.name.toLowerCase()===`MonsterName${species.name}`.toLowerCase());
  if(!monster&&!options.ornament)throw Error(`Missing native monster display metadata: ${species.name}`);
  const metadata=options.ornament?{schemaVersion:2,id:species.id,width:atlas.width,height:atlas.height,poses:rectangles,animations,sourceEdition:'Red Rescue Team'}:{schemaVersion:2,speciesId:species.speciesId,width:atlas.width,height:atlas.height,directions:DIRECTIONS,poses:rectangles,animations,clips:nativeClips(animations.length),shadowSize:monster.shadowSize,sourceEdition:'Red Rescue Team'};
  return{atlas,metadata,composed};
}

function blit(target,source,x,y){
  for(let row=0;row<source.height;row++)for(let column=0;column<source.width;column++){
    if(x+column<0||y+row<0||x+column>=target.width||y+row>=target.height)continue;
    const sourceIndex=(row*source.width+column)*4;if(!source.data[sourceIndex+3])continue;
    source.data.copy(target.data,((y+row)*target.width+x+column)*4,sourceIndex,sourceIndex+4);
  }
}

async function loadArchive(section){
  const archive=await readFile(new URL(section.archive.path,import.meta.url));
  if(digest(archive)!==section.archive.sha256)throw Error('Native source archive hash changed.');
  const files=readTarGzip(archive);
  if(files.size!==section.files.length)throw Error('Native source archive inventory mismatch.');
  for(const file of section.files){const data=get(files,file.path);if(data.length!==file.bytes||digest(data)!==file.sha256)throw Error(`Native source checksum failed: ${file.path}`);}
  return files;
}

/** @param {{emit:(url:URL,bytes:Buffer|string)=>Promise<void>,output:URL}} options */
export async function exportNativeSprites({emit,output}){
  const sourceBytes=await readFile(new URL('native-sources.json',import.meta.url)),manifest=JSON.parse(sourceBytes);
  const referenceBytes=await readFile(new URL(manifest.blueEvidence.manifestPath,import.meta.url));
  if(digest(referenceBytes)!==manifest.blueEvidence.manifestSha256)throw Error('Blue reference manifest hash changed.');
  for(const reference of JSON.parse(referenceBytes).records){const bytes=await readFile(new URL(`native-reference/${reference.path}`,import.meta.url));if(digest(bytes)!==reference.sha256)throw Error(`Blue reference image changed: ${reference.path}`);}
  const[files,portraitFiles]=await Promise.all([loadArchive(manifest.spriteSource),loadArchive(manifest.portraitSource)]);
  const monsters=JSON.parse(get(files,'data/monster/monster_data.json').toString()),records=[],contact=new Raster(manifest.spriteSource.species.length*36,4*36);
  const evidence=decodePng(await readFile(new URL('native-reference/ss02.png',import.meta.url)));
  const dungeonEvidence=decodePng(await readFile(new URL('native-reference/ss01.png',import.meta.url)));
  for(const[speciesIndex,species]of manifest.spriteSource.species.entries()){
    const field=composeNativeAsset(files,species,monsters),dungeon=composeNativeAsset(files,species,monsters,{dungeon:true});
    const{metadata,composed}=field,atlas=new Raster(field.atlas.width,field.atlas.height*2),packed=new Map();
    blit(atlas,field.atlas,0,0);
    for(const[index,rectangle]of metadata.poses.entries()){
      const image=dungeon.composed[index].art,key=`${rectangle[0]},${rectangle[1]}`,hash=digest(image.data);
      if(packed.has(key)&&packed.get(key)!==hash)throw Error('Native dungeon palette cannot share a field pose rectangle.');
      packed.set(key,hash);blit(atlas,image,rectangle[0],rectangle[1]+field.atlas.height);
    }
    metadata.dungeonOffsetY=field.atlas.height;metadata.height=atlas.height;
    const bytes=atlas.png(),metadataText=JSON.stringify(metadata)+'\n',path=`${species.speciesId}.png`,metadataPath=`${species.speciesId}.json`;
    // Direct image evidence: complete opaque poses in the original Blue press capture.
    const matched={ 'pokemon-004':{pose:12,left:137,top:98},'pokemon-012':{pose:0,left:117,top:66},'pokemon-025':{pose:12,left:100,top:95} }[species.speciesId];
    if(matched){
      const image=composed[matched.pose].art;
      for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
        const index=(y*image.width+x)*4;if(!image.data[index+3])continue;
        const target=((matched.top+208+y)*evidence.width+matched.left+8+x)*4;
        if(!image.data.subarray(index,index+3).equals(evidence.data.subarray(target,target+3)))throw Error(`Native Blue pixel corroboration failed: ${species.speciesId}`);
      }
    }
    const dungeonMatch={'pokemon-004':{pose:18,left:143,top:87},'pokemon-025':{pose:18,left:120,top:86}}[species.speciesId];
    if(dungeonMatch){
      const image=dungeon.composed[dungeonMatch.pose].art;
      for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
        const index=(y*image.width+x)*4;if(!image.data[index+3])continue;
        const target=((dungeonMatch.top+208+y)*dungeonEvidence.width+dungeonMatch.left+8+x)*4;
        if(!image.data.subarray(index,index+3).equals(dungeonEvidence.data.subarray(target,target+3)))throw Error(`Native Blue battle pixel corroboration failed: ${species.speciesId}`);
      }
    }
    await emit(new URL(path,output),bytes);await emit(new URL(metadataPath,output),metadataText);
    for(const[contactRow,direction]of[0,2,4,6].entries()){
      const frame=metadata.animations[7][direction][0],pose=composed[frame[0]];
      blit(contact,pose.art,speciesIndex*36+18+pose.dx,contactRow*36+31+pose.dy);
    }
    records.push({speciesId:species.speciesId,path,width:atlas.width,height:atlas.height,bytes:bytes.length,sha256:digest(bytes),metadataPath,metadataBytes:Buffer.byteLength(metadataText),metadataSha256:digest(metadataText),sourceEdition:'Red Rescue Team',sourceHeader:`src/data/ax/${species.name}.h`});
  }
  const cell=40,columns=8,portraitRecords=[],portraitAtlas=new Raster(cell*columns,Math.ceil(manifest.portraitSource.files.length/columns)*cell);
  for(const[index,record]of manifest.portraitSource.files.entries()){
    const original=decodePng(get(portraitFiles,record.path));
    if(original.width!==40||original.height!==40)throw Error('Native portraits must be 40 by 40 pixels.');
    for(let offset=0;offset<original.data.length;offset+=4)for(let channel=0;channel<3;channel++)original.data[offset+channel]=blueChannel(original.data[offset+channel]);
    const x=index%columns*cell,y=Math.floor(index/columns)*cell;blit(portraitAtlas,original,x,y);
    if(record.speciesId==='pokemon-012'&&record.emotion==='normal')for(let py=0;py<40;py++)for(let px=0;px<40;px++){
      const sourceIndex=(py*40+px)*4,targetIndex=((208+24+py)*evidence.width+8+64+px)*4;
      if(!original.data.subarray(sourceIndex,sourceIndex+4).equals(evidence.data.subarray(targetIndex,targetIndex+4)))throw Error('Native Blue Butterfree portrait corroboration failed.');
    }
    portraitRecords.push({speciesId:record.speciesId,emotion:record.emotion,x,y,width:40,height:40});
  }
  const portraitBytes=portraitAtlas.png(),portraitText=JSON.stringify({schemaVersion:2,width:portraitAtlas.width,height:portraitAtlas.height,cell,records:portraitRecords})+'\n';
  await emit(new URL('portraits.png',output),portraitBytes);await emit(new URL('portraits.json',output),portraitText);
  await emit(new URL('contact.png',import.meta.url),contact.png());
  return{records,portraitAtlas:{path:'portraits.png',width:portraitAtlas.width,height:portraitAtlas.height,cell,columns,bytes:portraitBytes.length,sha256:digest(portraitBytes),metadataPath:'portraits.json',metadataBytes:Buffer.byteLength(portraitText),metadataSha256:digest(portraitText),records:portraitRecords,provenance:'Original 40x40 Rescue Team portraits, with source display color conversion; see authoring native-sources.json.'},sourceManifestSha256:digest(sourceBytes),sourceArchives:[manifest.spriteSource.archive,manifest.portraitSource.archive]};
}
