import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readTarGzip,decodePng} from './native-format.mjs';

const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const rgba=value=>{const five=value>>3;return(five<<3)|(five>>3);};
const hexColor=values=>'#'+values.map(value=>rgba(value).toString(16).padStart(2,'0')).join('');
function sections(source){return new Map([...source.matchAll(/^(\w+):\n([\s\S]*?)(?=^\.global |$(?![\s\S]))/gm)].map(match=>[match[1],match[2]]));}
function literalBytes(source){return Buffer.from([...source.matchAll(/^\.byte ([^\n]+)/gm)].flatMap(match=>[...match[1].matchAll(/0x([0-9a-fA-F]{2})/g)].map(value=>parseInt(value[1],16))));}
function tile(bytes,index){const result=[];for(let y=0;y<8;y++){let row='';for(let x=0;x<8;x++)row+=((bytes[index*32+y*4+(x>>1)]>>(4*(x&1)))&15).toString(16);result.push(row);}return result.join('');}

export async function exportNativeUi({emit}){
  const manifestBytes=await readFile(new URL('native-ui-sources.json',import.meta.url)),manifest=JSON.parse(manifestBytes);
  const archiveBytes=await readFile(new URL(manifest.archive.path,import.meta.url));if(digest(archiveBytes)!==manifest.archive.sha256)throw Error('Native UI source archive changed.');
  const files=readTarGzip(archiveBytes);
  for(const record of manifest.files){const bytes=files.get(record.path);if(!bytes||digest(bytes)!==record.sha256)throw Error(`Native UI source changed: ${record.path}`);}
  for(const record of manifest.references??[]){const bytes=await readFile(new URL(record.path,import.meta.url));if(digest(bytes)!==record.sha256)throw Error(`Native UI reference changed: ${record.path}`);}
  const source=sections(files.get('data/system_sbin.s').toString());
  const characters=new Map();
  for(const match of source.get('gUnknown_8317B84').matchAll(/\.4byte (\w+)\n([\s\S]*?)(?=\.4byte |$)/g)){
    const record=literalBytes(match[2]);if(record.length!==8)throw Error('Native font character record changed.');
    characters.set(record.readUInt16LE(0),{label:match[1],advance:record.readInt16LE(2),flags:record[6]});
  }
  const codepoints=[...Array.from({length:95},(_,index)=>index+32),201,233,189,190],glyphs={};
  for(const code of codepoints){
    const record=characters.get(code);if(!record)throw Error(`Native font lacks character ${code}.`);
    const bytes=literalBytes(source.get(record.label));if(bytes.length!==72)throw Error('Native glyph dimensions changed.');
    const rows=[],shadow=[];
    for(let y=0;y<11;y++){
      let row=0;for(let x=0;x<12;x++)if(((bytes[y*6+(x>>1)]>>(4*(x&1)))&15)!==0)row|=1<<x;
      rows.push(row);shadow.push(record.flags&2?(((row<<1)|((rows[y-1]??0)<<1))&~row)&4095:0);
    }
    const character=code===189?'♂':code===190?'♀':String.fromCharCode(code);
    glyphs[character]={advance:record.advance,rows,shadow};
  }
  const font=literalBytes(source.get('gUnknown_8302024')),fontPalette=literalBytes(source.get('gUnknown_830612C')),sprite=literalBytes(source.get('gUnknown_830632C')),spritePalette=literalBytes(source.get('gUnknown_8306530'));
  if(font.readUInt32LE(0)!==136||sprite.readUInt32LE(0)!==16||fontPalette.length!==512||spritePalette.length!==64)throw Error('Native UI table dimensions changed.');
  const tiles=Array.from({length:136},(_,index)=>tile(font.subarray(4),index));
  const spriteTiles=Array.from({length:16},(_,index)=>tile(sprite.subarray(4),index));
  const palettes=Array.from({length:8},(_,bank)=>Array.from({length:16},(_,index)=>hexColor([...fontPalette.subarray(bank*64+index*4,bank*64+index*4+3)])));
  // SetFontsBaseColor replaces palette index1 with the default blue window color.
  for(const palette of palettes)palette[1]=hexColor([32,72,104]);
  const cursorPalette=Array.from({length:16},(_,index)=>hexColor([...spritePalette.subarray(index*4,index*4+3)]));
  const shadowBytes=literalBytes(sections(files.get('data/dungeon/etcfont.inc').toString()).get('etcfont')).subarray(4);
  const shadows=[{start:0,width:8},{start:1,width:16},{start:3,width:32}].map(({start,width})=>({width,rows:Array.from({length:8},(_,y)=>{let bits=0;for(let x=0;x<width;x++){const value=(shadowBytes[(start+(x>>3))*32+y*4+((x&7)>>1)]>>(4*(x&1)))&15;if(value)bits|=1<<x;}return bits>>>0;})}));
  const teamShadows=[{start:7,width:8,height:8},{start:8,width:16,height:8},{start:10,width:32,height:16}].map(({start,width,height})=>{
    let pixels='';for(let y=0;y<height;y++)for(let x=0;x<width;x++)pixels+=((shadowBytes[(start+Math.floor(y/8)*(width/8)+Math.floor(x/8))*32+(y%8)*4+Math.floor(x%8/2)]>>(4*(x&1)))&15).toString(16);
    return{width,height,pixels};
  });
  const damageBytes=literalBytes(sections(files.get('data/dungeon/hp5font.inc').toString()).get('hp5font'));
  const damageTiles=Array.from({length:damageBytes.readUInt32LE(0)},(_,index)=>tile(damageBytes.subarray(4),index));
  const damagePalettes=[3,10].map(index=>files.get(`graphics/ax/pal/${index}.pal`).toString().trim().split(/\r?\n/).slice(3).map(row=>hexColor(row.split(/\s+/).map(value=>Math.floor(Number(value)*31/256)*8))));
  const shadowPalette=files.get('graphics/ax/pal/0.pal').toString().trim().split(/\r?\n/).slice(3).map(row=>hexColor(row.split(/\s+/).map(value=>Math.floor(Number(value)*31/256)*8)));
  // A short name already present in a Blue screenshot proves native masks,
  // advances, shadow rule, and selected palette without storing game dialogue.
  const screenshot=decodePng(await readFile(new URL('native-reference/ss02.png',import.meta.url)));
  let x=28,matched=0;
  for(const character of 'Butterfree:'){
    const glyph=glyphs[character];
    for(let y=0;y<11;y++)for(let column=0;column<12;column++){
      const ink=(glyph.rows[y]>>column)&1,shade=(glyph.shadow[y]>>column)&1;if(!ink&&!shade)continue;
      const expected=ink?[251,251,character===':'?251:0]:[0,0,0],offset=((208+140+y)*screenshot.width+8+x+column)*4;
      if(expected.some((channel,index)=>screenshot.data[offset+index]!==channel))throw Error(`Native font Blue pixel mismatch: ${character} (${column},${y}).`);
      matched++;
    }
    x+=glyph.advance;
  }
  const projected=new Map();
  function put(tileIndex,left,top,flipX=false,flipY=false){
    const pixels=tiles[tileIndex];for(let py=0;py<8;py++)for(let px=0;px<8;px++){
      const value=parseInt(pixels[py*8+px],16);if(value)projected.set(`${left+(flipX?7-px:px)},${top+(flipY?7-py:py)}`,value);
    }
  }
  function prove(image,pixels,colors,label,filter=()=>true){
    let count=0;for(const[key,value]of pixels){if(!filter(value))continue;const[px,py]=key.split(',').map(Number),offset=((208+py)*image.width+8+px)*4,color=colors[value];
      const rgb=[1,3,5].map(start=>parseInt(color.slice(start,start+2),16));if(rgb.some((channel,index)=>image.data[offset+index]!==channel))throw Error(`Native ${label} Blue pixel mismatch at${key}.`);count++;
    }return count;
  }
  for(const[left,flipX]of[[16,false],[232,true]]){
    put(31,left,136,flipX);put(31,left,168,flipX,true);for(let y=144;y<168;y+=8)put(98,left,y,flipX);
  }
  for(let px=24;px<232;px++)for(let row=0;row<3;row++){projected.set(`${px},${136+row}`,15-row);projected.set(`${px},${175-row}`,15-row);}
  const borderPixels=prove(screenshot,projected,palettes[4],'dialogue border');projected.clear();
  for(const[left,flipX]of[[56,false],[104,true]]){put(100,left,16,flipX);put(100,left,64,flipX,true);for(let y=24;y<64;y+=8)put(102,left,y,flipX);}
  for(let px=64;px<104;px+=8){put(101,px,16);put(101,px,64,false,true);}
  const portraitBorderPixels=prove(screenshot,projected,palettes[4],'portrait border');projected.clear();
  for(const[left,index]of[[8,70],[16,19],[24,64],[40,65],[48,66],[64,21],[72,67],[80,68],[96,18],[104,21],[112,69],[128,18],[136,21]])put(index,left,0);
  const hudEvidence=decodePng(await readFile(new URL('native-reference/ss01.png',import.meta.url)));
  // Palette8 is changed each frame by the dungeon brightness ramp; verify the
  // remaining fixed HUD colors and retain that exception in the evidence record.
  const hudPixels=prove(hudEvidence,projected,palettes[4],'HUD',value=>value!==8);
  projected.clear();
  // Read only the already-generated PNG/JSON data to exclude opaque Pikachu
  // pixels covering the native team marker. No runtime module is imported.
  const pokemonRoot=new URL('../../../../games/pokemon-dungeon-reimagined/assets/blue/',import.meta.url);
  const pikachu=JSON.parse(await readFile(new URL('pokemon-025.json',pokemonRoot))),pikachuPng=decodePng(await readFile(new URL('pokemon-025.png',pokemonRoot))),pose=pikachu.poses[18];
  const marker=teamShadows[1];
  for(let py=0;py<marker.height;py++)for(let px=0;px<marker.width;px++){
    const value=parseInt(marker.pixels[py*marker.width+px],16);if(!value)continue;
    const screenX=120+px,screenY=104+py,bodyX=screenX-(128+pose[4]),bodyY=screenY-(108+pose[5]);
    if(bodyX>=0&&bodyY>=0&&bodyX<pose[2]&&bodyY<pose[3]&&pikachuPng.data[((pose[1]+bodyY)*pikachuPng.width+pose[0]+bodyX)*4+3])continue;
    projected.set(`${screenX},${screenY}`,value);
  }
  const markerPixels=prove(hudEvidence,projected,shadowPalette,'team marker');
  let toolbarPixels=0;
  const toolbar=[['throw','Throw'],['moves','Moves'],['items','Items'],['team','Team'],['menu','Menu']].map(([id,label],index)=>{
    const x=8+48*index,y=176,width=40,height=16;let pixels='';
    for(let py=0;py<height;py++)for(let px=0;px<width;px++){
      if((px===0||px===width-1)&&(py===0||py===height-1)){pixels+='0';continue;}
      const offset=((208+y+py)*hudEvidence.width+8+x+px)*4;
      const color='#'+[...hudEvidence.data.subarray(offset,offset+3)].map(value=>value.toString(16).padStart(2,'0')).join('');
      const paletteIndex=[7,8,13,14,15].find(value=>palettes[4][value]===color);
      if(paletteIndex===undefined)throw Error(`Blue touch toolbar has an unexpected pixel at${x+px},${y+py}.`);
      pixels+=paletteIndex.toString(16);toolbarPixels++;
    }
    return{id,label,x,y,width,height,pixels};
  });
  if(toolbarPixels!==3180)throw Error('Native Blue touch toolbar pixel inventory changed.');
  const corroboration={schemaVersion:1,font:{reference:'ss02.png',origin:[28,140],lineAdvance:11,availableWidth:204,exactPixels:matched},dialogueBorder:{reference:'ss02.png',bounds:[16,136,224,40],exactPixels:borderPixels},portraitBorder:{reference:'ss02.png',imageBounds:[64,24,40,40],visibleBorderBounds:[60,20,48,48],exactPixels:portraitBorderPixels},hud:{reference:'ss01.png',exactPixels:hudPixels,excluded:'Dynamic palette index8 brightness is not asserted.'},teamMarker:{reference:'ss01.png',actorAnchor:[128,108],exactVisiblePixels:markerPixels},touchToolbar:{reference:'ss01.png',exactPixels:toolbarPixels,buttons:toolbar.map(({id,x,y,width,height})=>({id,bounds:[x,y,width,height]})),paletteNote:'Female pixels are directly captured; male border colors use the corresponding source font-palette bank. Four transparent corners per button expose the dungeon.'}};
  await emit(new URL('native-reference/ui-pixel-corroboration.json',import.meta.url),JSON.stringify(corroboration,null,2)+'\n');
  const data='/** Generated from pinned native image data by native-ui-export.mjs. */\n'+
    '/** @type {Record<string,{advance:number,rows:number[],shadow:number[]}>} */\nexport const NATIVE_GLYPHS='+JSON.stringify(glyphs)+';\n'+
    '/** @type {string[]} */\nexport const NATIVE_UI_TILES='+JSON.stringify(tiles)+';\n'+
    '/** @type {string[][]} */\nexport const NATIVE_UI_PALETTES='+JSON.stringify(palettes)+';\n'+
    '/** @type {string[]} */\nexport const NATIVE_CURSOR_TILES='+JSON.stringify(spriteTiles)+';\n'+
    '/** @type {string[]} */\nexport const NATIVE_CURSOR_PALETTE='+JSON.stringify(cursorPalette)+';\n'+
    '/** @type {{width:number,rows:number[]}[]} */\nexport const NATIVE_SHADOWS='+JSON.stringify(shadows)+';\n'+
    '/** @type {{width:number,height:number,pixels:string}[]} */\nexport const NATIVE_TEAM_SHADOWS='+JSON.stringify(teamShadows)+';\n'+
    '/** @type {string[]} */\nexport const NATIVE_SHADOW_PALETTE='+JSON.stringify(shadowPalette)+';\n'+
    '/** @type {string[]} */\nexport const NATIVE_DAMAGE_TILES='+JSON.stringify(damageTiles)+';\n'+
    '/** @type {string[][]} */\nexport const NATIVE_DAMAGE_PALETTES='+JSON.stringify(damagePalettes)+';\n'+
    '/** @type {{id:string,label:string,x:number,y:number,width:number,height:number,pixels:string}[]} */\nexport const NATIVE_TOUCH_BUTTONS='+JSON.stringify(toolbar)+';\n';
  const modulePath='src/blue/render-native-ui-data.js';
  await emit(new URL(`../../../../games/pokemon-dungeon-reimagined/${modulePath}`,import.meta.url),data);
  return{modulePath,bytes:Buffer.byteLength(data),sha256:digest(data),sourceManifestPath:'tools/pokemon-dungeon/art/blue/native-ui-sources.json',sourceManifestSha256:digest(manifestBytes),archive:manifest.archive,corroboratedFontPixels:matched};
}
