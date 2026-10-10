// Capture only public, literal image/font data; no ROM or game execution.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {writeTarGzip} from './native-format.mjs';

const commit='013475aa04f5be3191e5527c186d9bfceae7cae0',repository='https://github.com/pret/pmd-red';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceDirectory=process.argv[2];
if(!sourceDirectory)throw Error('Usage: node capture-native-ui.mjs <pinned-pmd-red-checkout>');
if(execFileSync('git',['-C',sourceDirectory,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==commit)throw Error('Native UI checkout is not the pinned commit.');
const files=new Map(),records=[];
for(const path of['data/system_sbin.s','data/dungeon/etcfont.inc','data/dungeon/hp5font.inc','graphics/ax/pal/0.pal','graphics/ax/pal/3.pal','graphics/ax/pal/10.pal','charmap.txt','src/text_1.c','src/text_2.c','src/text_3.c','src/string_format.c','src/graphics_memory.c','src/pokemon.c','src/dungeon_tilemap.c','src/dungeon_vram.c','src/dungeon_mon_sprite_render.c','src/bg_palette_buffer.c','src/game_options.c']){
  const bytes=await readFile(resolve(sourceDirectory,path));
  files.set(path,bytes);records.push({path,bytes:bytes.length,sha256:digest(bytes),url:`https://raw.githubusercontent.com/pret/pmd-red/${commit}/${path}`});
}
const bytes=writeTarGzip(files),archive={path:'native-ui-source.tar.gz',bytes:bytes.length,sha256:digest(bytes)};
await writeFile(new URL(archive.path,import.meta.url),bytes);
const blueManifest=JSON.parse(await readFile(new URL('native-reference/manifest.json',import.meta.url),'utf8'));
const toolbarReference=blueManifest.records.find(record=>record.path==='ss01.png');
if(!toolbarReference)throw Error('Native Blue toolbar reference is missing.');
const references=[{path:`native-reference/${toolbarReference.path}`,sha256:toolbarReference.sha256,url:toolbarReference.url,sourcePage:toolbarReference.descriptionurl,use:'Original five-button Blue dungeon touch toolbar; only its native UI pixels are exported.'}];
const manifest={schemaVersion:1,repository,commit,sourceEdition:'Red Rescue Team, with directly captured Blue touch-toolbar imagery',blueStatus:'Native font glyphs, dialogue geometry and selected UI palette pixels corroborated against original Blue press captures. HUD layout and remaining glyphs are source-derived comparative Rescue Team data.',rights:'Original Pokémon / Chunsoft / Nintendo artwork and public decompilation data. Provenance is retained; no rights-holder reuse grant is asserted.',archive,files:records,references};
await writeFile(new URL('native-ui-sources.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({archiveBytes:bytes.length,sourceFiles:files.size}));
