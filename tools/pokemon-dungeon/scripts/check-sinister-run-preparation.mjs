// Parse/read/source only. No game/native import, evaluation, simulation or replay.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'acorn';
const game = new URL('../../../games/pokemon-dungeon-reimagined/',import.meta.url);
const read = name => readFile(new URL(name,game),'utf8');
const parseSource = text => parse(text,{ecmaVersion:'latest',sourceType:'module'});
const hash = text => createHash('sha256').update(text).digest('hex');
for (const [path,pin] of [['src/domain/native-general-rng.js','782f92614df00b10f74652d12e6a1e84eb9b06a4eef139230f627549fba21e14'],['src/domain/gameplay/native-escort-entry.js','4a8fd9553925c61ff9746da9d2330617a5a14c9fc364457b493de3f61955422e']]) assert.equal(hash(await read(path)),pin,path);
const source = await read('src/domain/gameplay/sinister-run-preparation.js');
function body(text,name) {
  const node = parseSource(text).body.map(row => row.type === 'ExportNamedDeclaration' ? row.declaration : row).find(row => row?.type === 'FunctionDeclaration' && row.id.name === name);
  assert.ok(node,name); return text.slice(node.start,node.end);
}
function audit(text) {
  const run = body(text,'prepareSinisterRun'),floor = body(text,'prepareSinisterFloorSeed');
  for (const part of ["record(copyPlainData(input,LIMITS),'generalRandom,owner,teamSlots')","'entryRevision,sessionId,transactionId'",'raw.teamSlots.length !== 4',"'bodySize,nativeRecruitedId,pokemonId'",'integer(row.nativeRecruitedId,0,412)','row.slot !== index','row.nativeRecruitedId <=','sum+row.bodySize,0) > 6','new Set(members.map(row => row.pokemonId))','validateNativeGeneralRandomState(raw.generalRandom)','nativeGeneralRandom32(beforeGeneralRandom)','rawPreseed = sampled.value & 0xffffff','word: (rawPreseed|1)&0xffffff,floors: 0','generateNativeHiddenPower(before)','beforeGeneralRandom: before,afterGeneralRandom: generalRandom']) assert.ok(run.includes(part),part);
  assert.ok(run.indexOf('validateNativeGeneralRandomState(raw.generalRandom)') < run.indexOf('nativeGeneralRandom32(beforeGeneralRandom)'));
  assert.ok(run.indexOf('nativeGeneralRandom32(beforeGeneralRandom)') < run.indexOf('members.map(member =>'));
  assert.ok(run.indexOf('row.nativeRecruitedId <=') < run.indexOf('nativeGeneralRandom32(beforeGeneralRandom)'));
  assert.equal((run.match(/nativeGeneralRandom32\(/g) ?? []).length,1);
  assert.equal((run.match(/generateNativeHiddenPower\(/g) ?? []).length,1);
  for (const part of ["record(copyPlainData(input,LIMITS),'floors,kind,word')",'integer(raw.word,0,0xffffffff)','integer(raw.floors,0,Number.MAX_SAFE_INTEGER-1)','(word&1) !== 1','floors === 0 && word > 0xffffff','(Math.imul(word,0x5d588b65)+1)>>>0','(Math.imul(first,0x5d588b65)+1)>>>0','((((first>>>16)|(second&0xffff0000))&0xffffff)|1)>>>0','word: second,floors: floors+1']) assert.ok(floor.includes(part),part);
  assert.equal((floor.match(/Math\.imul\(/g) ?? []).length,2);
  assert.ok(!/Math\.random|Date\.|allocate\(|\.emit\(|seedNativeGeneralRandom\(|createProspectiveNativeGeneralRandom\(|state\.random|state\.roster|state\.session/.test(text),'Pure explicit source inputs, no canonical producer/seed fallback');
}
audit(source);
for (const [from,to] of [['rawPreseed = sampled.value & 0xffffff','rawPreseed = sampled.value >>> 0'],['word: (rawPreseed|1)&0xffffff,floors: 0','word: rawPreseed,floors: 0'],['row.slot !== index','false'],['row.nativeRecruitedId <=','row.nativeRecruitedId <'],['second&0xffff0000','second&0xffff'],['word: second,floors: floors+1','word: first,floors: floors+1']]) assert.throws(() => audit(source.replace(from,to)),undefined,from);
const nativePins = {
  'src/run_dungeon.c':'6cc792aa349add7f72cd04694d703c1612cacef8681ef7fae840f392908a5d90',
  'src/dungeon_random.c':'6f272ba5b0546774c1276b9ace5818e31e67a40eac492c38df34205a9a1ee8f9',
  'src/dungeon_misc.c':'9f5de68c48737bb3b9aadd0b92a9ae2069a53349383d125174e7b2aeca04d90d',
  'src/pokemon.c':'ca46804becf408ad3a3a8cad21d7ac16309b2e43fd80bf4945a29951b66aa58b',
  'include/constants/monster.h':'e7c8795acd4d98f29ef50c7e1af9bb250a3e4bb07b6070b5a6d866c8da8265f9',
};
const index = process.argv.indexOf('--native-root');
if (index >= 0) {
  const nativeRoot = process.argv[index+1],commit = '6bcbec4f906938c0243aa2026bcbd41b577bab85'; assert.ok(nativeRoot);
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:nativeRoot,encoding:'utf8'}).trim(),commit);
  const native = {};
  for (const [path,pin] of Object.entries(nativePins)) { const text = execFileSync('git',['show',`${commit}:${path}`],{cwd:nativeRoot,encoding:'utf8',maxBuffer:16*1024*1024}); assert.equal(hash(text),pin,path); native[path] = text; }
  const run = native['src/run_dungeon.c'];
  assert.ok(run.indexOf('Rand32Bit() & 0xFFFFFF') < run.indexOf('SetDungeonMonsFromTeam()'));
  const team = native['src/dungeon_misc.c'].split('void SetDungeonMonsFromTeam(void)')[1].split('\nvoid ')[0];
  for (const part of ['recruitedId = 0; recruitedId < NUM_MONSTERS; recruitedId++','PokemonExists(pokeStruct) && PokemonIsOnTeam(pokeStruct)','RecruitedPokemonToDungeonMon','if (++index == MAX_TEAM_MEMBERS)']) assert.ok(team.includes(part),part);
  assert.ok(native['include/constants/monster.h'].includes('#define MONSTER_JIRACHI 413') && native['include/constants/monster.h'].includes('#define NUM_MONSTERS MONSTER_JIRACHI'));
  const seed = native['src/dungeon_random.c'].split('u32 GenerateDungeonRNGSeed(void)')[1].split('\nvoid InitDungeonRNG')[0];
  for (const part of ['gDungeonRngPreseedState * 0x5d588b65','r0 = r1 >> 16','r1 *= 0x5d588b65','gDungeonRngPreseedState = r1','r1 &= 0xffff0000','r0 |= r1','r0 &= 0x0ffffff','r0 |= 1']) assert.ok(seed.includes(part),part);
  const convert = native['src/pokemon.c'].split('void PokemonToDungeonMon(')[1].split('\nvoid ')[0]; assert.ok(convert.includes('GenerateHiddenPower(&dst->hiddenPower)'));
}
async function scan(dir) {
  for (const row of await readdir(new URL(dir,game),{withFileTypes:true})) {
    const path = dir+row.name;
    if (row.isDirectory()) { if (row.name !== 'vendor') await scan(path+'/'); continue; }
    if (!path.endsWith('.js')) continue;
    for (const node of parseSource(await read(path)).body) assert.ok(!/sinister-run-preparation\.js$/.test(node.source?.value ?? ''),`Unselected run preparation ${path}`);
  }
}
await scan('src/'); await scan('content/');
console.log('Sinister run preparation source audit: exact general/HiddenPower kernels; preseed before source-ordered compact party conversions; separate two-step retained native floor preseed; six negative source mutations;5 optional native Git pins; no canonical producer, old history inference, browser reseed, selected caller or game execution.');
