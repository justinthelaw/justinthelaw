// One-time capture from a pinned public source checkout and previously fetched
// image files. CI uses the resulting offline archives, never a ROM or network.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { writeTarGzip } from './native-format.mjs';

export const NATIVE_SPECIES = [[1,'bulbasaur'],[4,'charmander'],[7,'squirtle'],[10,'caterpie'],[12,'butterfree'],[16,'pidgey'],[25,'pikachu'],[52,'meowth'],[54,'psyduck'],[66,'machop'],[102,'exeggcute'],[104,'cubone'],[133,'eevee'],[152,'chikorita'],[155,'cyndaquil'],[158,'totodile'],[191,'sunkern'],[252,'treecko'],[255,'torchic'],[258,'mudkip'],[265,'wurmple'],[279,'pelipper'],[300,'skitty']];
const commit='013475aa04f5be3191e5527c186d9bfceae7cae0',repository='https://github.com/pret/pmd-red';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const [sourceDirectory,portraitDirectory]=process.argv.slice(2);
if(!sourceDirectory||!portraitDirectory)throw Error('Usage: node capture-native.mjs <pinned-pmd-red-checkout> <downloaded-portrait-directory>');
if(execFileSync('git',['-C',sourceDirectory,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==commit)throw Error('Native source checkout is not the pinned commit.');
const spriteFiles=new Map(),spriteRecords=[];
async function capture(path){
  if(spriteFiles.has(path))return;
  const bytes=await readFile(resolve(sourceDirectory,path));spriteFiles.set(path,bytes);
  spriteRecords.push({path,bytes:bytes.length,sha256:digest(bytes),url:`https://raw.githubusercontent.com/pret/pmd-red/${commit}/${path}`});
}
for(const[,name]of NATIVE_SPECIES){
  const path=`src/data/ax/${name}.h`;await capture(path);
  const header=spriteFiles.get(path).toString();
  for(const match of header.matchAll(/INCBIN_U8\("(graphics\/ax\/mon\/[^"]+)\.4bpp"\)/g))await capture(`${match[1]}.png`);
}
for(let index=0;index<14;index++)await capture(`graphics/ax/pal/${index}.pal`);
await capture('data/monster/monster_data.json');
const spriteArchive=writeTarGzip(spriteFiles);await writeFile(new URL('native-sprite-source.tar.gz',import.meta.url),spriteArchive);

const originalPortraits=JSON.parse(await readFile(resolve(portraitDirectory,'manifest.json'),'utf8'));
const portraitFiles=new Map(),portraitRecords=[];
for(const record of originalPortraits.records){
  const bytes=await readFile(resolve(portraitDirectory,record.path));
  if(digest(bytes)!==record.sha256)throw Error(`Changed portrait input: ${record.path}`);
  portraitFiles.set(record.path,bytes);
  portraitRecords.push({path:record.path,speciesId:record.speciesId,emotion:record.emotion,bytes:bytes.length,sha256:record.sha256,url:record.url,descriptionurl:record.descriptionurl,title:record.title,sourceTimestamp:record.timestamp,sourceSha1:record.sha1,width:record.width,height:record.height});
}
const portraitArchive=writeTarGzip(portraitFiles);await writeFile(new URL('native-portrait-source.tar.gz',import.meta.url),portraitArchive);
const ornamentFiles=new Map(),ornamentRecords=[];
async function captureOrnament(path){
  if(ornamentFiles.has(path))return;
  const bytes=await readFile(resolve(sourceDirectory,path));ornamentFiles.set(path,bytes);
  ornamentRecords.push({path,bytes:bytes.length,sha256:digest(bytes),url:`https://raw.githubusercontent.com/pret/pmd-red/${commit}/${path}`});
}
for(const name of['titleop1','titleop2']){
  const path=`src/data/ornament/${name}.h`;await captureOrnament(path);
  for(const match of ornamentFiles.get(path).toString().matchAll(/INCBIN_U8\("(graphics\/ornament\/[^"]+)\.4bpp"\)/g))await captureOrnament(`${match[1]}.png`);
}
await captureOrnament('graphics/ornament/pal/titleop.pal');
const ornamentArchive=writeTarGzip(ornamentFiles);await writeFile(new URL('native-ornament-source.tar.gz',import.meta.url),ornamentArchive);
const manifest={
  schemaVersion:1,
  rights:'Original Pokémon / Chunsoft / Nintendo artwork. Public image sources and decompilation data are preserved with provenance; no rights-holder reuse grant is asserted. Not licensed as original repository artwork.',
  spriteSource:{repository,commit,edition:'Red Rescue Team',blueStatus:'Selected Pikachu, Charmander and Butterfree poses corroborated against Blue press PNGs. Remaining poses/species and timing are comparative Rescue Team data.',archive:{path:'native-sprite-source.tar.gz',bytes:spriteArchive.length,sha256:digest(spriteArchive)},species:NATIVE_SPECIES.map(([number,name])=>({speciesId:`pokemon-${String(number).padStart(3,'0')}`,name})),files:spriteRecords.sort((left,right)=>left.path.localeCompare(right.path))},
  portraitSource:{site:'https://mysterydungeonwiki.com',edition:'Rescue Team (explicit file classification)',archive:{path:'native-portrait-source.tar.gz',bytes:portraitArchive.length,sha256:digest(portraitArchive)},files:portraitRecords.sort((left,right)=>left.path.localeCompare(right.path))},
  ornamentSource:{repository,commit,edition:'Red Rescue Team',blueStatus:'Original Rescue Team Pelipper and letter cutscene art; Blue frame-by-frame identity not yet established.',archive:{path:'native-ornament-source.tar.gz',bytes:ornamentArchive.length,sha256:digest(ornamentArchive)},files:ornamentRecords.sort((left,right)=>left.path.localeCompare(right.path))},
  blueEvidence:{manifestPath:'native-reference/manifest.json',manifestSha256:digest(await readFile(new URL('native-reference/manifest.json',import.meta.url)))},
};
await writeFile(new URL('native-sources.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({spriteFiles:spriteRecords.length,spriteArchiveBytes:spriteArchive.length,portraits:portraitRecords.length,portraitArchiveBytes:portraitArchive.length,ornamentFiles:ornamentRecords.length,ornamentArchiveBytes:ornamentArchive.length}));
