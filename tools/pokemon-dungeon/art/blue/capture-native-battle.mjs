// Retain published source/image bytes only; never load a ROM or game module.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {writeTarGzip} from './native-format.mjs';

const repository='https://github.com/pret/pmd-red',commit='013475aa04f5be3191e5527c186d9bfceae7cae0';
const source=process.argv[2];if(!source)throw Error('Usage: node capture-native-battle.mjs <pinned-source-checkout>');
if(execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim()!==commit)throw Error('Native battle source is not the pinned commit.');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const paths=['src/effect_data.c','src/effect_main.c','src/effect_sub_1.c','src/effect_anim_file.c','src/code_8040094_1.c','src/sprite.c','src/bg_palette_buffer.c','src/dungeon_8041AD0.c','src/dungeon_move.c','src/dungeon_move_util.c','src/dungeon_damage.c','src/move_orb_effects_1.c','src/math.c','src/data/math.h','include/structs/axdata.h','include/structs/sprite_oam.h','include/constants/direction.h','include/constants/move_id.h'];
for(let index=0;index<14;index++)paths.push(`graphics/ax/pal/${index}.pal`);
for(const id of [0,7,8,13,20,22,23,29,51,53,54,56,58,59,73,81,102,108,113,114,119,121,122,125,131,135,137]){const name=`efob${String(id).padStart(3,'0')}`;paths.push(`src/data/effects/${name}.c`,`data/effects/${name}.png`,`data/effects/${name}.pal`);}
const files=new Map(),records=[];
for(const path of paths){
  // Git's exact blob avoids checkout-specific CRLF conversion in palette files.
  const bytes=execFileSync('git',['-C',source,'show',`${commit}:${path}`],{maxBuffer:4*1024*1024});
  files.set(path,bytes);records.push({path,bytes:bytes.length,sha256:digest(bytes),url:`${repository.replace('github.com','raw.githubusercontent.com')}/${commit}/${path}`});
}
const archiveBytes=writeTarGzip(files),archive={path:'native-battle-source.tar.gz',bytes:archiveBytes.length,sha256:digest(archiveBytes)};
await writeFile(new URL(archive.path,import.meta.url),archiveBytes);
const spriteManifest=await readFile(new URL('native-sources.json',import.meta.url));
const manifest={schemaVersion:1,repository,commit,sourceEdition:'Red Rescue Team comparative',qualification:'Published literal move-animation facts and indexed effect images. Blue effect pixels, complete choreography and driver timing remain unverified. No ROM or game code execution is used.',rights:'Original Pokémon / Chunsoft / Nintendo imagery and data. Provenance does not assert a rights-holder reuse grant.',archive,files:records,speciesSource:{manifestPath:'native-sources.json',manifestSha256:digest(spriteManifest)}};
await writeFile(new URL('native-battle-sources.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({sourceFiles:files.size,archiveBytes:archiveBytes.length}));
