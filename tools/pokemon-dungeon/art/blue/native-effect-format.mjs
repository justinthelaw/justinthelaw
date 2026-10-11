// Static decoding of public EFO image/pose data. No game module or ROM is read.
import {Raster} from '../pixel/raster.mjs';
import {decodePng,blueChannel} from './native-format.mjs';
import {nativeFields,battleDigest} from './native-battle-inputs.mjs';

const DIRECTIONS=['s','se','e','ne','n','nw','w','sw'];
const SHAPES=[[[8,8],[16,16],[32,32],[64,64]],[[16,8],[32,8],[32,16],[64,32]],[[8,16],[8,32],[16,32],[32,64]]];
const FILE_IDS=[0,7,53,54,58,119,121,135];
const EFFECTS=[[8,'impact-immune'],[9,'impact-resist'],[10,'impact-neutral'],[11,'impact-super'],[22,'preparation'],[37,'sleep-entry'],[138,'scratch-impact'],[144,'ember-launch'],[236,'thundershock-impact'],[274,'growl'],[317,'ember-impact'],[137,'ember-travel'],[399,'defense-down'],[404,'attack-down'],[423,'paralysis-entry'],[83,'rapid-spin-target'],[14,'foresight-non-ghost'],[205,'psych-up'],[50,'heal-bell-cast']];
const INITIAL_FILES=[0,20,23,51,73,81,113,125];
const INITIAL_EFFECTS=[[7,'hp-heal'],[15,'infatuation-entry'],[21,'shared-cast'],[128,'absorb-cast'],[150,'water-sport-cast'],[225,'hypnosis-travel'],[287,'leer-cast'],[312,'helping-hand-target'],[402,'special-attack-up'],[425,'attack-up'],[271,'synthesis-cast'],[52,'screech-travel']];
const arrays=(source,kind)=>new Map([...source.matchAll(new RegExp(`(?:static )?const ${kind} (\\w+)\\[\\] = \\{([\\s\\S]*?)\\n\\};`,'g'))].map(match=>[match[1],match[2]]));
const names=body=>body.match(/\bgUnknown_[A-Za-z0-9_]+\b/g)??[];
function get(map,key){const value=map.get(key);if(value===undefined)throw Error(`Missing native effect input: ${key}`);return value;}
function palette(bytes){
  const rows=bytes.toString().trim().split(/\r?\n/);
  if(rows[0]!=='JASC-PAL'||Number(rows[2])!==16||rows.length!==19)throw Error('Native effect palette has an unsupported size.');
  return rows.slice(3).map(row=>{
    const rgb=row.split(/\s+/).map(Number);
    if(rgb.length!==3||rgb.some(value=>!Number.isInteger(value)||value<0||value>255))throw Error('Invalid native effect palette channel.');
    return rgb.map(value=>blueChannel(Math.floor(value*31/256)*8));
  });
}

function decodeFile(inputs,id){
  const name=`efob${String(id).padStart(3,'0')}`,source=get(inputs,`src/data/effects/${name}.c`).toString();
  const image=decodePng(get(inputs,`data/effects/${name}.png`)),ownPalette=palette(get(inputs,`data/effects/${name}.pal`));
  if(image.width!==8||image.height%8||image.height>8192||!image.indices)throw Error('Native EFO tiles must be indexed 8-pixel rows.');
  const poses=arrays(source,'ax_pose'),poseTables=arrays(source,'ax_pose \\*const'),sequences=arrays(source,'ax_anim'),directions=arrays(source,'ax_anim \\*const'),animationTables=arrays(source,'ax_anim \\*const \\*const');
  const root=source.match(/const EfoFileData \w+ = \{([\s\S]*?)\n\};/)?.[1];if(!root)throw Error('Native EFO header is absent.');
  const rootNames=names(root),poseNames=names(get(poseTables,rootNames[0])),animationNames=names(get(animationTables,rootNames[1]));
  const tileCount=Number(root.match(/sizeof\([^\n]+\/ 32, \/\/ (\d+)/)?.[1]);
  if(tileCount*64!==image.indices.length||poseNames.length<1||poseNames.length>1024||animationNames.length<1||animationNames.length>64)throw Error('Native EFO table inventory changed.');
  const poseData=poseNames.map(label=>{
    const parts=[...get(poses,label).matchAll(/\{\s*(-?\d+),\s*\{\s*(-?\d+),\s*(-?\d+)\s*\},\s*(\d+),\s*(\d+),\s*(\d+)\s*\}/g)].map(match=>match.slice(1).map(Number));
    const last=parts.pop();
    if(!last||last.join(',')!=='-1,255,-1,65535,65535,65535'||parts.length<1||parts.length>128)throw Error('Native EFO pose terminator or count changed.');
    for(const[sprite,bank,depth,f1,f2,f3]of parts)if(sprite!==-1||bank!==0||depth< -128||depth>127||(f1&0x3C00)||((f1>>>14)&3)>2||((f2>>>14)&3)>3||((f3>>>10)&3)!==3)throw Error('Unsupported native EFO OAM feature.');
    return parts;
  });
  const animations=animationNames.map(label=>{
    const refs=names(get(directions,label));if(refs.length!==8)throw Error('Native EFO animation lacks eight pointers.');
    return refs.map(ref=>{
      const frames=[...get(sequences,ref).matchAll(/\{\s*(\d+),\s*(\d+),\s*(-?\d+),\s*\{\s*(-?\d+),\s*(-?\d+)\s*\},\s*\{\s*(-?\d+),\s*(-?\d+)\s*\}\s*\}/g)].map(match=>match.slice(1).map(Number));
      const last=frames.pop();
      if(!last||last.some(value=>value!==0)||frames.length<1||frames.length>128||frames.some(frame=>frame[0]<1||frame[0]>255||frame[2]<0||frame[2]>=poseData.length))throw Error('Invalid native EFO frame sequence.');
      return frames;
    });
  });
  return{id,name,image,ownPalette,poseData,animations};
}

function blit(target,source,left,top){
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
    const dx=x+left,dy=y+top;if(dx<0||dy<0||dx>=target.width||dy>=target.height)throw Error('Native effect composition exceeds its bounds.');
    const from=(y*source.width+x)*4;if(source.data[from+3])source.data.copy(target.data,(dy*target.width+dx)*4,from,from+4);
  }
}
function trim(raw,left,top){
  let minX=raw.width,minY=raw.height,maxX=-1,maxY=-1;
  for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(raw.data[(y*raw.width+x)*4+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
  if(maxX<0)return{art:new Raster(1,1),dx:0,dy:0};
  const art=new Raster(maxX-minX+1,maxY-minY+1);
  for(let y=0;y<art.height;y++)raw.data.copy(art.data,y*art.width*4,((y+minY)*raw.width+minX)*4,((y+minY)*raw.width+maxX+1)*4);
  return{art,dx:left+minX,dy:top+minY};
}

/** Produce only the admitted effect images; full source tables stay pinned. */
export function composeBattleEffects(inputs,bank='basic'){
  if(bank!=='basic'&&bank!=='initial')throw Error('Unknown native battle bank.');
  const selectedFiles=bank==='basic'?FILE_IDS:INITIAL_FILES,selectedEffects=bank==='basic'?EFFECTS:INITIAL_EFFECTS;
  const paletteBanks=Array.from({length:14},(_,index)=>palette(get(inputs,`graphics/ax/pal/${index}.pal`)));
  const source=get(inputs,'src/effect_data.c').toString(),body=source.match(/gUnknown_80B9CC4\[448\] = \{([\s\S]*?)\n\};/)?.[1];
  if(!body)throw Error('Native effect-selection table is absent.');
  const facts=new Map([...body.matchAll(/\[(\d+)\] = \{([^\n]+)\}/g)].map(match=>[Number(match[1]),nativeFields(match[2])]));
  const files=new Map(selectedFiles.map(id=>[id,decodeFile(inputs,id)])),variants=[],lookup=new Map();
  function compose(file,index,selectedPalette){
    const key=`${file.id}:${index}:${selectedPalette}`;if(lookup.has(key))return lookup.get(key);
    const draws=[];
    for(const[, ,depthOffset,f1,f2,f3]of file.poseData[index]){
      const[width,height]=SHAPES[(f1>>>14)&3][(f2>>>14)&3],left=(f2&511)-256,top=(f1&1023)-512,tile=f3&1023;
      // AddAxSprite preserves encoded palette only for working flag bit1.
      const paletteIndex=f2&1024?f3>>>12:selectedPalette,colors=paletteIndex===14?file.ownPalette:paletteBanks[paletteIndex];
      if(!colors)throw Error(`Native effect palette bank${paletteIndex} is unavailable.`);
      const art=new Raster(width,height),flipX=Boolean(f2&4096),flipY=Boolean(f2&8192);
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const address=tile*64+(Math.floor(y/8)*(width/8)+Math.floor(x/8))*64+(y%8)*8+x%8;
        if(address>=file.image.indices.length)throw Error('Native effect reads beyond its indexed tile image.');
        const value=file.image.indices[address];if(!value)continue;
        const dx=flipX?width-x-1:x,dy=flipY?height-y-1:y;art.data.set([...colors[value],255],(dy*width+dx)*4);
      }
      draws.push({art,left,top,paletteIndex,tile,flipX,flipY,depthOffset,sourceOrder:draws.length});
    }
    const left=Math.min(...draws.map(part=>part.left)),top=Math.min(...draws.map(part=>part.top)),right=Math.max(...draws.map(part=>part.left+part.art.width)),bottom=Math.max(...draws.map(part=>part.top+part.art.height));
    if(right-left>256||bottom-top>256)throw Error('Native effect pose exceeds the admitted geometry.');
    // Source visits depth bins in increasing order and writes OAM backwards,
    // making higher depth foreground. First equal-depth
    // source piece is foremost. Preserve separate depth layers for playback.
    const ordered=[...draws].sort((a,b)=>a.depthOffset-b.depthOffset||b.sourceOrder-a.sourceOrder);
    const flatten=list=>{const raw=new Raster(right-left,bottom-top);for(const part of list)blit(raw,part.art,part.left-left,part.top-top);return trim(raw,left,top);};
    const combined=flatten(ordered),layers=[...new Set(ordered.map(part=>part.depthOffset))].map(depthOffset=>({depthOffset,...flatten(ordered.filter(part=>part.depthOffset===depthOffset))}));
    const record={sourceFile:file.name,sourcePose:index,palette:selectedPalette,...combined,layers,parts:draws.map(({left,top,paletteIndex,tile,flipX,flipY,depthOffset,sourceOrder,art})=>({x:left,y:top,width:art.width,height:art.height,paletteIndex,tile,flipX,flipY,depthOffset,sourceOrder}))};
    lookup.set(key,variants.length);variants.push(record);return variants.length-1;
  }
  const effects=selectedEffects.map(([id,name])=>{
    const fact=get(facts,id);if(![1,3].includes(fact.animType)||![0,1].includes(fact.unk20))throw Error('Unsupported selected effect family or wait flag.');
    const file=get(files,fact.effectId),directional=file.animations.length%8===0;
    const sequences=Array.from({length:directional?8:1},(_,direction)=>{
      const sourceAnimation=fact.animId+(directional?direction:0),raw=file.animations[sourceAnimation]?.[0];if(!raw)throw Error('Selected native effect animation is missing.');
      // The compact runtime keeps only displayed fields. Never discard a new
      // native secondary offset or flag without an explicit source admission.
      const frames=raw.map(([ticks,flags,pose,x,y,sx,sy])=>{
        if(flags!==0||sx!==0||sy!==0)throw Error('Unsupported compact EFO frame tail.');
        return[compose(file,pose,fact.unk8),ticks,x,y];
      });
      return{sourceAnimation,ticks:frames.reduce((sum,frame)=>sum+frame[1],0),frames};
    });
    return{id,name,file:file.name,sourceAnimation:fact.animId,directional,palette:fact.unk8,attachmentSet:fact.unk1c,loop:Boolean(fact.loop),sourceWaitFlag:fact.unk20,blocksWait:fact.unk20===0,sequences};
  });
  const unique=new Map();let x=0,y=0,rowHeight=0;
  const poses=variants.map(pose=>({layers:pose.layers.map(layer=>{
    const key=`${layer.art.width}:${layer.art.height}:${battleDigest(layer.art.data)}`;let rectangle=unique.get(key);
    if(!rectangle){if(x+layer.art.width+1>512){x=0;y+=rowHeight+1;rowHeight=0;}rectangle={x,y,art:layer.art};unique.set(key,rectangle);x+=layer.art.width+1;rowHeight=Math.max(rowHeight,layer.art.height);}
    return{depthOffset:layer.depthOffset,rect:[rectangle.x,rectangle.y,layer.art.width,layer.art.height,layer.dx,layer.dy]};
  })}));
  const atlas=new Raster(512,y+rowHeight);if(atlas.height>1024)throw Error('Native battle atlas exceeds its decoded-image budget.');
  for(const record of unique.values())blit(atlas,record.art,record.x,record.y);
  const metadata={schemaVersion:2,width:atlas.width,height:atlas.height,sourceEdition:'Red Rescue Team comparative',qualification:bank==='basic'?'Selected native artwork for the source-derived battle timeline. Blue effect pixels and complete driver timing remain unverified.':'Selected opening-move native artwork. Blue effect pixels and complete driver timing remain unverified; the Hypnosis background plane is not included.',directions:DIRECTIONS,poses,effects};
  const evidence={schemaVersion:1,sourceEdition:metadata.sourceEdition,uniqueImages:unique.size,paletteRule:'Brightness31 before Blue channel expansion; encoded OAM palette when flags2 bit0x400 is set, otherwise the selected effect palette. Bank14 is effect-owned, banks0–13 use native AX palettes.',layerRule:'Separate source depth offsets, with first source piece foremost within equal depth. The battle renderer interleaves each layer with actor depth.',waitFlags:effects.map(({id,sourceWaitFlag,blocksWait})=>({id,sourceWaitFlag,blocksWait})),waitRule:'Literal effect_data.unk20 becomes effect_main.unk54. A nonzero flag makes sub_800E9A8 return false immediately; TRUE global drains still include the artwork tail.',poses:variants.map(({art,layers,...rest})=>({...rest,width:art.width,height:art.height,rgbaSha256:battleDigest(art.data),layers:layers.map(({art,...layer})=>({...layer,width:art.width,height:art.height,rgbaSha256:battleDigest(art.data)}))}))};
  return{atlas,metadata,evidence};
}
