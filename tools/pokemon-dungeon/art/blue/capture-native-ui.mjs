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
const paths=['data/system_sbin.s','data/dungeon/etcfont.inc','data/dungeon/hp5font.inc','charmap.txt','src/text_1.c','src/text_2.c','src/text_3.c','src/string_format.c','src/graphics_memory.c','src/pokemon.c','src/dungeon_tilemap.c','src/dungeon_vram.c','src/dungeon_mon_sprite_render.c','src/bg_palette_buffer.c','src/game_options.c','src/naming_screen.c','src/confirm_name_menu.c','src/dungeon_menu_moves.c','src/moves.c','src/main_loops.c','src/main_menu2.c','src/data/main_menu2.h'];
for(let index=0;index<14;index++)paths.push(`graphics/ax/pal/${index}.pal`);
paths.push('src/dungeon_menu_team.c','src/dungeon_misc.c','src/dungeon_logic.c','src/menu_input.c','include/constants/colors.h');
paths.push('data/dungeon/zmappat.inc','src/dungeon_map.c','src/dungeon_main.c','src/dungeon_message.c','src/bg_control.c','include/game_options.h');
const referenceHeader='src/data/ax/magnemite.h',header=await readFile(resolve(sourceDirectory,referenceHeader));
paths.push(referenceHeader);for(const match of header.toString().matchAll(/INCBIN_U8\("([^"]+)\.4bpp"\)/g))paths.push(`${match[1]}.png`);
for(const path of [...new Set(paths)]){
  const bytes=await readFile(resolve(sourceDirectory,path));
  files.set(path,bytes);records.push({path,bytes:bytes.length,sha256:digest(bytes),url:`https://raw.githubusercontent.com/pret/pmd-red/${commit}/${path}`});
}
const bytes=writeTarGzip(files),archive={path:'native-ui-source.tar.gz',bytes:bytes.length,sha256:digest(bytes)};
await writeFile(new URL(archive.path,import.meta.url),bytes);
const blueManifest=JSON.parse(await readFile(new URL('native-reference/manifest.json',import.meta.url),'utf8'));
const toolbarReference=blueManifest.records.find(record=>record.path==='ss01.png');
if(!toolbarReference)throw Error('Native Blue toolbar reference is missing.');
const references=[{path:`native-reference/${toolbarReference.path}`,sha256:toolbarReference.sha256,url:toolbarReference.url,sourcePage:toolbarReference.descriptionurl,use:'Original five-button Blue dungeon touch toolbar; only its native UI pixels are exported.'}];
for(const[path,url,use]of[
  ['dungeon-blue-moby.png','https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287134/','Original Blue capture; team row geometry, male palette, world sprites and native minimap marker corroboration.'],
  ['team-blue-manual.png','https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf#page=13','Team display from the official English Blue manual, printed page25. A128x95 CMYK/JPEG image extracted asPNG; layout corroboration only, not a native-color or pixel-byte proof.'],
  ['menu-delivery-source.png','https://projectpokemon.org/home/uploads/monthly_2017_12/large.title_01.png.55429e636800eb8e3f904d2d3006e633.png','Original Rescue Team illustration, published as unused art retained in Explorers of Sky; corroborated against localized Blue.'],
  ['menu-mailbox-source.png','https://projectpokemon.org/home/uploads/monthly_2017_12/large.title_00.png.a369ad5616579399a92f53f8a1fd6489.png','Original Rescue Team illustration, published as unused art retained in Explorers of Sky; English Blue scene identity corroborated at 0:05 of https://www.youtube.com/watch?v=RrglH3dOqrg, not a compressed-video pixel proof.'],
  ['menu-blue-localized.png','https://mysterydungeonwiki.com/images/6/64/Rescue_Team_-_Main_Menu_Comparison_Korean.png','Blue Korean-localization screenshot; background pixel evidence only, not English-retail UI proof.'],
])references.push({path:`native-reference/${path}`,url,use,sha256:digest(await readFile(new URL(`native-reference/${path}`,import.meta.url)))});
const manifest={schemaVersion:1,repository,commit,sourceEdition:'Red Rescue Team literal UI data, with directly captured Blue toolbar and team-panel imagery; public Rescue Team menu illustrations retained in Explorers of Sky',blueStatus:'Selected native font, window, HUD, toolbar and team-row pixels are corroborated against Blue captures. Menu-background and layout proof levels are recorded separately; source-derived comparative data is not silently promoted to Blue pixel parity.',rights:'Original Pokémon / Chunsoft / Nintendo artwork and public decompilation data. Provenance is retained; no rights-holder reuse grant is asserted.',archive,files:records,references};
await writeFile(new URL('native-ui-sources.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({archiveBytes:bytes.length,sourceFiles:files.size}));
