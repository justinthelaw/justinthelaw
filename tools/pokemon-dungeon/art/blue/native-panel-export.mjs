import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Raster} from '../pixel/raster.mjs';
import {blueChannel,decodePng} from './native-format.mjs';
import {composeNativeAsset} from './native-export.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const output=new URL('../../../../games/pokemon-dungeon-reimagined/assets/blue/',import.meta.url);
const color=(image,x,y)=>[...image.data.subarray((y*image.width+x)*4,(y*image.width+x)*4+3)].map(blueChannel);
function put(image,x,y,rgb){const index=(y*image.width+x)*4;image.data.set([...rgb,255],index);}
function crop(image,x,y,width,height){const result=new Raster(width,height);for(let row=0;row<height;row++)for(let column=0;column<width;column++)put(result,column,row,color(image,x+column,y+row));return result;}

/** Static PNG/source composition only. No game modules are imported or run. */
export async function exportNativePanels({emit,files,glyphs}){
  const press=decodePng(await readFile(new URL('native-reference/ss01.png',import.meta.url)));
  const capture=decodePng(await readFile(new URL('native-reference/dungeon-blue-moby.png',import.meta.url)));
  const empty=crop(press,8,104,256,48),references=[];
  const retailText=[];
  for(const[label,value,left,top,ink]of[
    ['name','Pikachu',56,56,[251,251,0]],['level','Level 12',60,19,[251,251,251]],
    ['currentHP','46',122,19,[251,251,251]],['slash','/',134,19,[251,251,251]],
    ['maximumHP','46',145,19,[251,251,251]],['leaderTactic','Leader',148,30,[251,251,251]],
    ['partnerTactic',"Let's go together",148,78,[251,251,251]],
  ]){
    const pixels=new Map();let x=left;
    for(const character of value){
      const glyph=glyphs[character];
      for(let y=0;y<11;y++)for(let column=0;column<12;column++)if((glyph.shadow[y]>>column)&1)pixels.set(`${x+column},${top+y}`,[0,0,0]);
      for(let y=0;y<11;y++)for(let column=0;column<12;column++)if((glyph.rows[y]>>column)&1)pixels.set(`${x+column},${top+y}`,ink);
      x+=glyph.advance;
    }
    for(const[position,rgb]of pixels){const[px,py]=position.split(',').map(Number);if(rgb.join(',')!==color(capture,px,py).join(','))throw Error(`Native retail team text differs: ${label}.`);}
    retailText.push({label,origin:[left,top],exactPixels:pixels.size});
  }
  for(const[image,ox,oy,id,poseIndex,left,top,gender]of[
    [press,8,8,'025',21,16,17,'female'],[press,8,56,'004',21,16,22,'female'],
    [capture,0,0,'054',22,14,19,'male'],[capture,0,48,'025',21,16,17,'male'],
  ]){
    const metadata=JSON.parse(await readFile(new URL(`pokemon-${id}.json`,output))),atlas=decodePng(await readFile(new URL(`pokemon-${id}.png`,output))),pose=metadata.poses[poseIndex];
    const mask=new Set();let matched=0;
    for(let y=0;y<pose[3];y++)for(let x=0;x<pose[2];x++){
      const source=((pose[1]+metadata.dungeonOffsetY+y)*atlas.width+pose[0]+x)*4;if(!atlas.data[source+3])continue;
      if(color(image,ox+left+x,oy+top+y).join(',')!==[...atlas.data.subarray(source,source+3)].join(','))throw Error(`Native team-row sprite differs: pokemon-${id}.`);
      mask.add((y+top)*48+x+left);matched++;
    }
    references.push({image,ox,oy,mask,gender,speciesId:`pokemon-${id}`,poseIndex,matched,anchor:[24,40]});
  }
  // Magnemite is an image-evidence mask only. It is not added to the playable
  // opening roster, runtime atlas inventory, or initial browser requests.
  const magnemite=composeNativeAsset(files,{name:'magnemite',id:'reference-magnemite'},[],{ornament:true,dungeon:true}).composed[23].art;
  const mask=new Set();let matched=0;
  for(let y=0;y<magnemite.height;y++)for(let x=0;x<magnemite.width;x++){
    const source=(y*magnemite.width+x)*4;if(!magnemite.data[source+3])continue;
    if(color(capture,17+x,118+y).join(',')!==[...magnemite.data.subarray(source,source+3)].join(','))throw Error('Native team-row Magnemite evidence differs.');
    mask.add((y+22)*48+x+17);matched++;
  }
  references.push({image:capture,ox:0,oy:96,mask,gender:'male',speciesId:'reference-magnemite',poseIndex:23,matched,anchor:[24,39]});
  let inferred=0;for(let index=0;index<48*48;index++)if(references.every(reference=>reference.mask.has(index)))inferred++;
  if(inferred!==134)throw Error('Native pedestal occlusion inventory changed.');
  const mappings={},rows=new Raster(256,144);
  for(const[gender,rowIndex,source]of[['female',0,references[1]],['male',1,references[4]]]){
    const mapping=new Map();
    for(const reference of references.filter(reference=>reference.gender===gender))for(let y=0;y<48;y++)for(let x=0;x<48;x++){
      if(reference.mask.has(y*48+x))continue;
      const key=color(empty,x,y).join(','),value=color(reference.image,reference.ox+x,reference.oy+y).join(',');
      if(mapping.has(key)&&mapping.get(key)!==value)throw Error(`Native pedestal palette is ambiguous: ${gender}/${key}: ${mapping.get(key)} vs ${value}.`);
      mapping.set(key,value);
    }
    mappings[gender]=Object.fromEntries(mapping);
    for(let y=0;y<48;y++)for(let x=0;x<256;x++){
      let rgb;
      if(x<48){const mapped=mapping.get(color(empty,x,y).join(','));if(!mapped)throw Error('Native pedestal has an unobserved color.');rgb=mapped.split(',').map(Number);}
      // The panel center is a horizontal stripe. Its original left and right
      // rounded edges are exposed in both captures; dynamic text is excluded.
      else rgb=color(source.image,source.ox+(x>=56&&x<248?240:x),source.oy+y);
      put(rows,x,rowIndex*48+y,rgb);
    }
  }
  for(let y=0;y<48;y++)for(let x=0;x<256;x++)put(rows,x,y+96,color(empty,x,y));
  for(const[image,ox,oy]of[[press,8,152],[capture,0,144]])for(let y=0;y<48;y++)for(let x=0;x<256;x++)if(color(empty,x,y).join(',')!==color(image,ox+x,oy+y).join(','))throw Error('Native empty team-row captures differ.');
  const original=decodePng(await readFile(new URL('native-reference/menu-delivery-source.png',import.meta.url)));
  const localized=decodePng(await readFile(new URL('native-reference/menu-blue-localized.png',import.meta.url)));
  const menu=new Raster(256,192);let backgroundPixels=0;
  for(let y=0;y<192;y++)for(let x=0;x<256;x++){
    const index=(y*original.width+x)*4,rgb=x===0?[0,0,0]:[...original.data.subarray(index,index+3)].map(value=>blueChannel(Math.floor(value*31/256)*8));
    put(menu,x,y,rgb);
    if(x>=16&&x<120&&y>=16&&y<104||x>=16&&x<240&&y>=128&&y<168)continue;
    if(rgb.join(',')!==color(localized,x,y+192).join(','))throw Error(`Localized Blue file-menu background differs at ${x},${y}.`);
    backgroundPixels++;
  }
  const mailboxSource=decodePng(await readFile(new URL('native-reference/menu-mailbox-source.png',import.meta.url))),mailbox=new Raster(256,192);
  if(mailboxSource.width!==256||mailboxSource.height!==192)throw Error('Native mailbox illustration dimensions changed.');
  for(let y=0;y<192;y++)for(let x=0;x<256;x++){
    const index=(y*256+x)*4;put(mailbox,x,y,x===0?[0,0,0]:[...mailboxSource.data.subarray(index,index+3)].map(value=>blueChannel(Math.floor(value*31/256)*8)));
  }
  const records=[];
  for(const[id,path,image,provenance]of[
    ['team-panels','team-panels.png',rows,'Original Blue team-row captures; 2170/2304 occupied pedestal positions exposed across five native sprite masks; the remaining 134 positions use the observed gray-to-gold palette correspondence. Center panel stripes reconstructed from unobscured pixels.'],
    ['menu-delivery','menu-delivery.png',menu,'Public Rescue Team illustration retained in Explorers of Sky; 31040 background pixels corroborated against a Blue Korean-localization capture after source brightness conversion. This does not establish English-retail menu text or all three random illustrations.'],
    ['menu-mailbox','menu-mailbox.png',mailbox,'Public Rescue Team illustration retained in Explorers of Sky; scene identity corroborated by original English Blue gameplay video RrglH3dOqrg at0:05. Palette uses the source brightness conversion proven on Delivery; compressed video does not establish pixel-byte parity.'],
  ]){
    const bytes=image.png();await emit(new URL(path,output),bytes);records.push({id,path,width:image.width,height:image.height,bytes:bytes.length,sha256:digest(bytes),provenance});
  }
  const proof={schemaVersion:1,normalization:'RGB555 capture channels are expanded through the native Blue 5-to-6-bit display mapping; this also removes sub-quantum press-capture noise.',teamRows:{width:256,height:48,emptyExactPixels:12288,occupiedPedestal:{width:48,height:48,exposedPositions:2304-inferred,inferredPositions:inferred,paletteMappings:mappings},spriteMasks:references.map(({speciesId,poseIndex,matched,anchor})=>({speciesId,poseIndex,opaquePixels:matched,anchor})),panelCenter:'Horizontal stripe inferred between x56 and x247 from unobscured x240; rounded edges x48..55 and248..255 are direct source pixels.',retailText,layoutQualification:'The selected English retail layout follows Moby287134 name x56 and level/item x60, also corroborated at half size by the official English manual p25. Press ss01 uses x72/x76 instead. A pre-release/build difference is a possibility, not an established explanation.'},fileMenu:{reference:'menu-blue-localized.png',original:'menu-delivery-source.png',editionQualification:'Korean localization of Blue; background only. Source illustration is publicly retained in Explorers of Sky.',exactUnobscuredPixels:backgroundPixels,clippedColumn:0,excludedUiRectangles:[[16,16,104,88],[16,128,224,40]],mailbox:{original:'menu-mailbox-source.png',video:'https://www.youtube.com/watch?v=RrglH3dOqrg&t=5s',proofLevel:'English Blue scene identity; pixel bytes and palette are source-qualified, not measured from compressed video.'}}};
  await emit(new URL('native-reference/panel-pixel-corroboration.json',import.meta.url),JSON.stringify(proof,null,2)+'\n');
  return records;
}
