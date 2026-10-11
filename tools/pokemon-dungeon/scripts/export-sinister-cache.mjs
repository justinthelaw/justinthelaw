// Text/JSON authoring only. No game/native module import, evaluation or compilation.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = new URL('../../../',import.meta.url),game = 'games/pokemon-dungeon-reimagined/';
const commit = '6bcbec4f906938c0243aa2026bcbd41b577bab85';
const sourceFiles = [
  {
    "path": "src/dungeon_mon_spawn.c",
    "sha256": "96f868db765eecfca6730929bee5c00debb913d5f4ec0699b74000f589922ab3"
  },
  {
    "path": "src/dungeon_floor_spawns.c",
    "sha256": "24b3fc7534d24429dbf6b208376106611960d8a36a9e5b48313863756ed4e124"
  },
  {
    "path": "src/dungeon_leveling.c",
    "sha256": "d7cab87c271db8bcc9f83a53625ba6cb5a860d717510f21eebd596fbcd581476"
  },
  {
    "path": "src/moves.c",
    "sha256": "bc1ed7fe1cbdeb2fd294c1329913b158b9c1365538f547f177877968dd345916"
  },
  {
    "path": "src/pokemon.c",
    "sha256": "ca46804becf408ad3a3a8cad21d7ac16309b2e43fd80bf4945a29951b66aa58b"
  },
  {
    "path": "src/dungeon_logic.c",
    "sha256": "662b79a226f4e76a5b7c4e84553477e1e310c28e2483c80b702f4bbe35d9ced9"
  },
  {
    "path": "src/dungeon_config.c",
    "sha256": "e1d24abb5eab54a2223449c9e5b7e98aba55244e87fadb13c1dd1811b496c21b"
  },
  {
    "path": "src/run_dungeon.c",
    "sha256": "6cc792aa349add7f72cd04694d703c1612cacef8681ef7fae840f392908a5d90"
  },
  {
    "path": "src/dungeon_random.c",
    "sha256": "6f272ba5b0546774c1276b9ace5818e31e67a40eac492c38df34205a9a1ee8f9"
  },
  {
    "path": "src/dungeon_generation.c",
    "sha256": "62b3f027fdcc44431fe2aa71a77a4e5b95a9cc5da3e36d8c5bc39664f304055c"
  },
  {
    "path": "src/dungeon_generation_fixed.c",
    "sha256": "4cd206a3f8f4ef8903ba9d61849b02b9949f8db568ff4e456da73c057f2e6948"
  },
  {
    "path": "data/dungeon/fixedmap.inc",
    "sha256": "af694adec35af12e5382dd42669ab65de7965f7c6454bf8c73e970e7059e9921"
  },
  {
    "path": "data/dungeon/SinisterWoods/pokemon_found.json",
    "sha256": "73c9b828f114b5f47eaf312dbd0148236c1999a6ea5c83a7ca6ff801d8fb499d"
  },
  {
    "path": "data/dungeon/SinisterWoods/floor_id.json",
    "sha256": "eda015601b93b676ddb6e5076527f1d5a3430e6861dcf555ea7fc675481f0429"
  },
  {
    "path": "data/monster/monster_data.json",
    "sha256": "024f8d2b42582e4d017e3d408b1229b369396d9321ab11c1b7737d19b52bce2e"
  },
  {
    "path": "data/monster/learnset/learnset_data.json",
    "sha256": "eba6180764f6f74b2267ab32ed266331e6606a52a3d3ae377be33ea8b2c82501"
  },
  {
    "path": "data/move/move_data.json",
    "sha256": "fd5777d6514ed6fc5b2fb28c24e6e04654b4b1a17e157775e4d05c48b46131d8"
  },
  {
    "path": "include/constants/monster.h",
    "sha256": "e7c8795acd4d98f29ef50c7e1af9bb250a3e4bb07b6070b5a6d866c8da8265f9"
  },
  {
    "path": "include/constants/move_id.h",
    "sha256": "0ed607d167ac42bafd4c47e26f8fcacc22038be5f2781f0e8603f4d7a8033f72"
  },
  {
    "path": "include/constants/walkable_tile.h",
    "sha256": "b9e76b366720183d9247609653cc0302a231d926f80c1d16215fbf0b60336a6d"
  },
  {
    "path": "src/dungeon_serializer.c",
    "sha256": "66f6cb6089931740f4e197da6feb257022c13f0563477bda07576083addd2d40"
  },
  {
    "path": "include/structs/str_dungeon.h",
    "sha256": "aabd46208d12aa63947556e52cad423d76d52ba821887ef34707803497ac887c"
  }
];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const args = process.argv.slice(2),checking = args.includes('--check');
const index = args.indexOf('--native-source');
assert.ok(index >= 0 && typeof args[index+1] === 'string','Supply --native-source /path/to/pinned/red/source.');
const nativeRoot = args[index+1];
assert.deepEqual(args.filter((_,i) => i !== index && i !== index+1),checking ? ['--check'] : []);
assert.equal(execFileSync('git',['-C',nativeRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),commit,'Exact native pin required.');
const blobs = new Map();
for (const row of sourceFiles) {
  const bytes = execFileSync('git',['-C',nativeRoot,'show',`${commit}:${row.path}`],{maxBuffer:16*1024*1024});
  assert.equal(digest(bytes),row.sha256,row.path); blobs.set(row.path,bytes.toString('utf8'));
}
const native = path => JSON.parse(blobs.get(path));
const defines = (path,prefix) => new Map([...blobs.get(path).matchAll(new RegExp(`^#define (${prefix}[A-Z0-9_]+) (0x[0-9A-Fa-f]+|[0-9]+)$`,'gm'))].map(m => [m[1],Number(m[2])]));
const monsterIds = defines('include/constants/monster.h','MONSTER_'),moveIds = defines('include/constants/move_id.h','MOVE_');
assert.equal(monsterIds.get('MONSTER_DECOY'),421); assert.equal(moveIds.get('MOVE_BLOWBACK'),368); assert.equal(moveIds.get('MOVE_NOTHING'),0);
const files = [
  ...[1,2,3].map(i => game+`content/dungeons/floors-0${i}.json`),
  ...[1,2,3,4].map(i => game+`content/dungeons/encounters-0${i}.json`),
  ...[1,2,3,4,5].map(i => game+`content/species/profiles-${i}.json`),
  ...[1,2,3,4].map(i => game+`content/species/levels-${i}.json`),
  game+'content/species/learnsets.json',game+'content/species/identities.json',game+'content/species/sources.json',
  game+'content/effects/actions-01.json',game+'content/effects/actions-02.json',
];
const catalogFiles = [],documents = new Map();
for (const path of files) { const bytes = await readFile(new URL(path,root)); catalogFiles.push({path,sha256:digest(bytes)}); documents.set(path,JSON.parse(bytes)); }
const records = pattern => files.filter(p => pattern.test(p)).flatMap(p => documents.get(p).records);
const floors = records(/\/floors-/).filter(f => f.dungeonId === 'sinister-woods').sort((a,b) => a.localFloor-b.localFloor);
const pools = new Map(records(/\/encounters-/).map(p => [p.id,p]));
const profiles = new Map(records(/\/profiles-/).map(p => [p.internalId,p]));
const levels = new Map(records(/\/levels-/).map(p => [p.id,p]));
const learns = new Map(records(/\/learnsets\.json/).map(p => [p.id,p]));
const moves = new Map(documents.get(game+'content/species/identities.json').moves.map(p => [p.originalId,p]));
const actions = new Map(records(/\/actions-/).map(p => [p.internalId,p]));
const monsterData = native('data/monster/monster_data.json'),moveData = native('data/move/move_data.json');
const nativeLearns = new Map(native('data/monster/learnset/learnset_data.json').map(p => [p.pokemon,p.levelUpMoves]));
const nativeTables = native('data/dungeon/SinisterWoods/pokemon_found.json').tables;
const nativeJoins = native('data/dungeon/SinisterWoods/floor_id.json').tables;
assert.equal(floors.length,13); assert.equal(nativeJoins.length,13); assert.equal(nativeTables.length,12);
assert.deepEqual(nativeJoins.map(f => f.Pokemon),[10,11,12,13,14,15,16,17,17,18,19,20,21]);
const floorFacts = [],pairs = new Map();
for (const [i,floor] of floors.entries()) {
  assert.equal(floor.id,`sinister-woods-floor-${String(i+1).padStart(2,'0')}`);
  const tableIndex = nativeJoins[i].Pokemon,table = nativeTables[tableIndex-10],pool = pools.get(floor.encounterPoolId);
  assert.ok(pool.sourceIndices.includes(tableIndex)); assert.ok(pool.sourceSymbols.includes(table.name));
  assert.equal(table.pokemon.length,pool.rows.length);
  let cumulativeWeight = 0;
  const rows = table.pokemon.map((row,order) => {
    const nativeSpeciesId = monsterIds.get(row.species),publishedWeight = row.probability;
    assert.ok(Number.isInteger(nativeSpeciesId)); cumulativeWeight += publishedWeight;
    const actual = pool.rows[order];
    assert.deepEqual([actual.order,actual.sourceMonsterIndex,actual.level,actual.publishedWeight,actual.cumulativeWeight],[order,nativeSpeciesId,row.level,publishedWeight,cumulativeWeight]);
    assert.equal(actual.speciesSymbol,row.species.slice(8));
    assert.equal(actual.entryRole,publishedWeight ? 'weighted-candidate' : 'nonrandom-level-lookup');
    assert.equal(actual.identityClass,nativeSpeciesId === 421 ? 'internal-decoy' : 'pokemon');
    pairs.set(`${nativeSpeciesId}:${row.level}`,{nativeSpeciesId,level:row.level,speciesId:actual.speciesId,formId:actual.formId});
    return {order,nativeSpeciesId,level:row.level,publishedWeight,cumulativeWeight};
  });
  assert.equal(cumulativeWeight,10000);
  assert.deepEqual(rows.slice(-2).map(r => [r.nativeSpeciesId,r.level,r.publishedWeight]),[[380,90,0],[421,1,0]]);
  floorFacts.push({floorId:floor.id,localFloor:i+1,nativeTableIndex:tableIndex,encounterPoolId:pool.id,rows});
}
const moveFact = nativeMoveId => {
  const action = actions.get(nativeMoveId),id = moves.get(nativeMoveId)?.id ?? null;
  assert.ok(action && Number.isInteger(moveData[nativeMoveId].basePP));
  assert.equal(action.numeric.pp,moveData[nativeMoveId].basePP); assert.equal(action.moveId,id);
  return {nativeMoveId,moveId:id,basePp:moveData[nativeMoveId].basePP};
};
const statKeys = ['hp','attack','specialAttack','defense','specialDefense'];
const species = [...pairs.values()].map(pair => {
  const data = monsterData[pair.nativeSpeciesId],profile = profiles.get(pair.nativeSpeciesId);
  const base = [data.baseHP,...data.baseAtkSpAtk,...data.baseDefSpDef];
  let stats,levelEvidence,candidates,evidence;
  if (pair.nativeSpeciesId === 421) {
    assert.equal(profile,undefined); assert.equal(pair.speciesId,null); assert.equal(pair.level,1);
    stats = Object.fromEntries(statKeys.map((key,i) => [key,base[i]]));
    levelEvidence = null; candidates = []; evidence = {stats:'pinned-red-dummy-base-only',learnset:'pinned-red-explicit-dummy'};
  } else {
    assert.deepEqual([profile.speciesId,profile.formId],[pair.speciesId,pair.formId]);
    assert.equal(profile.bodySize,data.bodySize); assert.equal(profile.baseMovementSpeed,data.movementSpeed);
    const growth = levels.get(profile.levelResourceId),learn = learns.get(profile.learnsetResourceId);
    assert.deepEqual(growth.baseStats,base); assert.equal(growth.rows.length,100);
    assert.equal(growth.id,`level-${digest(JSON.stringify({baseStats:growth.baseStats,rows:growth.rows}))}`);
    assert.equal(learn.id,`learn-${digest(JSON.stringify({levelUp:learn.levelUp,auxiliary:learn.auxiliary}))}`);
    const sourceLearn = nativeLearns.get(data.name.slice('MonsterName'.length)); assert.ok(sourceLearn);
    assert.deepEqual(sourceLearn.map(r => [r.level,moveIds.get(r.move)]),learn.levelUp);
    stats = Object.fromEntries(statKeys.map((key,j) => [key,growth.baseStats[j]+growth.rows.slice(1,pair.level).reduce((sum,r) => sum+r[j+1],0)]));
    candidates = sourceLearn.filter(r => r.level <= pair.level).map((r,order) => ({order,learnedAt:r.level,...moveFact(moveIds.get(r.move))}));
    levelEvidence = {levelResourceId:profile.levelResourceId,learnsetResourceId:profile.learnsetResourceId,...profile.levelEvidence};
    evidence = {stats:profile.evidence.stats,learnset:profile.evidence.learnset};
  }
  const mobility = (data.movementType ?? 'MOVEMENT_TYPE_STANDARD').slice('MOVEMENT_TYPE_'.length).toLowerCase();
  assert.ok(['standard','water','chasm','wall'].includes(mobility));
  return {...pair,identityClass:pair.nativeSpeciesId === 421 ? 'internal-decoy' : 'pokemon',stats,bodySize:data.bodySize,baseMovementSpeed:data.movementSpeed,mobility,
    nativeChanceAsleep:data.chanceAsleep,nativeAbilities:[...data.abilities],nativeTypes:[...data.types],
    nativeWild:{iqPoints:1,iqSkillIds:['iq-status-checker','iq-pp-checker','iq-item-catcher',...(pair.level >= 16 ? ['iq-item-master'] : [])],tacticId:'tactic-go-after-foes',heldItem:null,bossFlag:false},
    levelEvidence,evidence,candidates,replacementDrawCount:Math.max(0,candidates.length-4)};
});
assert.equal(species.length,20);
const facts = {schemaVersion:1,id:'sinister-floor-cache-facts-v1',commit,qualification:'pinned-red-comparative-not-blue-binary-proof',sourceFiles,catalogFiles,
  browserRandomMapping:'browser-xoshiro128ss-v1-upper16-scale-one-transition-not-native-parity',maxNativeCacheRows:64,maxFloorRows:32,maxMoveSlots:4,nothingNativeMoveId:0,
  preCacheEmptyFallback:moveFact(368),floorFacts,species,
  floor13FixedAllocationNativeSpeciesIds:[333,94,23],
  limitations:['Unselected preparation; no canonical/saved cache admission.','Growth is arithmetic over byte-pinned qualified catalog gains and existing levelEvidence, not a freshly decoded native binary.','Floor13 cache order is distinct from fixed actor allocation order.','Native cache hit matches SpeciesId and level and spends no move RNG; actor slots/PP remain independently allocated.','Fresh native floor-loop pre-cache invalidates prior cache; native r6 quicksave branch also reconstructs cache, which is absent from serializer. Exact reboot/global RNG and Blue suspend parity remain unproved.','Future browser cache admission must bind an actual prospective floor generation without rerolling on validation/load or inventing older cache/seed history.','Cache miss/full/lifetime, general Hidden Power, AI, sleep, placement, respawn and saves belong to the later caller.']};
const output = "import { freezeData } from '../../src/domain/state/validate.js';\n/** Generated by tools/pokemon-dungeon/scripts/export-sinister-cache.mjs; qualified factual preparation only. */\nexport const SINISTER_CACHE_FACTS = freezeData("+JSON.stringify(facts,null,2)+');\n';
assert.ok(Buffer.byteLength(output) < 1024*1024);
const target = new URL(game+'content/authored/sinister-cache-facts.js',root);
if (checking) assert.equal(await readFile(target,'utf8'),output,'Stale Sinister cache facts.'); else await writeFile(target,output);
console.log(`Sinister cache facts ${checking ? 'equality checked' : 'exported'}:${sourceFiles.length} native pins,${catalogFiles.length} catalog pins,13 actual floors,20 species/level profiles; text/JSON only.`);
