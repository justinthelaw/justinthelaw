// Source/JSON/AST inspection only. Never import, evaluate or compile game/native code.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url),game = 'games/pokemon-dungeon-reimagined/';
const paths = {
  facts:game+'content/authored/sinister-cache64-facts.js',
  contracts:game+'src/contracts/sinister-cache64.js',
  owner:game+'src/domain/gameplay/sinister-cache64.js',
  proof:game+'content/state/sinister-cache64-proof.js',
};
const read = path => readFile(new URL(path,root),'utf8');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const ast = source => parse(source,{ecmaVersion:'latest',sourceType:'module'});
function nodes(root,predicate) {
  const found = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) found.push(node);
    for (const child of Object.values(node)) if (Array.isArray(child)) child.forEach(visit); else visit(child);
  }
  visit(root); return found;
}
const member = node => node?.type === 'Identifier' ? node.name : node?.type === 'MemberExpression' && !node.computed ? `${member(node.object)}.${node.property.name}` : null;
const calls = (tree,name) => nodes(tree,node => node.type === 'CallExpression' && member(node.callee) === name);
const named = (tree,name) => {
  const found = nodes(tree,node => node.type === 'FunctionDeclaration' && node.id.name === name);
  assert.equal(found.length,1,name); return found[0];
};
const args = process.argv.slice(2);
assert(args.length === 0 || args.length === 2 && args[0] === '--native-source','Use portable no-argument inspection or --native-source /path/to/exact-Git-pin.');
const nativeRoot = args[1],commit = '6bcbec4f906938c0243aa2026bcbd41b577bab85';
if (nativeRoot) assert.equal(execFileSync('git',['-C',nativeRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),commit);
const native = path => execFileSync('git',['-C',nativeRoot,'show',`${commit}:${path}`],{maxBuffer:16*1024*1024});
const sources = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([name,path]) => [name,await read(path)])));
const trees = Object.fromEntries(Object.entries(sources).map(([name,source]) => [name,ast(source)]));
const acceptedConsumers = {
  facts:'737ce49556268ff7895136f8c3d4802adaa3decd2078f534098cbb0bfe26ca6e',
  contracts:'ebc8ad5df30d24431d01d36f1d61e698fcbd4cbe58e83d44cae833e0bf2ab85d',
  owner:'6ff4753a573bba0e103405f1bd318d3e92b4cd4974dcbb6c70e335ba116f106f',
  proof:'5a5e3927b86eaaa1c024dfa8c953f0a3d50b5c5a209fa80d8137c29e9b9e465a',
};
for (const [name,sha] of Object.entries(acceptedConsumers)) assert.equal(digest(sources[name]),sha,'Exact new unselected consumer changed: '+paths[name]);
assert.deepEqual(trees.owner.body.filter(node => node.type === 'ImportDeclaration').map(node => node.source.value),['../../../content/authored/sinister-cache-facts.js','../../../content/authored/sinister-cache64-facts.js','./sinister-floor-cache.js','../escort-dungeon-rng.js','../rng.js','../ids.js','../state/plain.js','../state/validate.js','../state/relations.js']);
assert.deepEqual(trees.proof.body.filter(node => node.type === 'ImportDeclaration').map(node => node.source.value),['./sinister-cache-proof.js','../../src/domain/gameplay/sinister-cache64.js','../../src/domain/escort-dungeon-rng.js','../../src/domain/state/plain.js','../../src/domain/state/relations.js','../../src/domain/rng.js','../../src/domain/ids.js','./pokemon-rules.js']);
assert.deepEqual(trees.owner.body.filter(node => node.type === 'ExportNamedDeclaration').flatMap(node => node.declaration.type === 'VariableDeclaration' ? node.declaration.declarations.map(row => row.id.name) : [node.declaration.id.name]),['SINISTER_CACHE64_LIMITS','inspectSinisterCache64','prepareSinisterCache64','lookupSinisterCache64']);
assert.deepEqual(trees.proof.body.filter(node => node.type === 'ExportNamedDeclaration').map(node => node.declaration.id.name),['checkSinisterCache64','checkSinisterCache64Lookup']);
for (const tree of [trees.owner,trees.proof]) assert(tree.body.every(node => ['ImportDeclaration','FunctionDeclaration','ExportNamedDeclaration'].includes(node.type)),'Only declarations join the unselected package.');
const limits = nodes(trees.owner,node => node.type === 'VariableDeclarator' && node.id.name === 'SINISTER_CACHE64_LIMITS')[0].init.arguments[0];
assert.deepEqual(Object.fromEntries(limits.properties.map(row => [row.key.name,row.value.value])),{maxDepth:12,maxNodes:65536,maxArrayLength:424,maxObjectKeys:32,maxStringLength:160,maxTextLength:524288});
const declaration = trees.facts.body.find(node => node.type === 'ExportNamedDeclaration').declaration.declarations[0];
const literal = declaration.init.arguments[0],facts = JSON.parse(sources.facts.slice(literal.start,literal.end));
assert.equal(facts.commit,commit); assert.equal(facts.maxNativeCacheRows,64); assert.equal(facts.nativeMonsterMax,424);
if (nativeRoot) for (const pin of facts.sourceFiles) assert.equal(digest(native(pin.path)),pin.sha256,pin.path);
const acceptedMonsterBytes = await readFile(new URL('tools/pokemon-dungeon/content/throw-capability/native-monster-data.json',root));
assert.equal(digest(acceptedMonsterBytes),'024f8d2b42582e4d017e3d408b1229b369396d9321ab11c1b7737d19b52bce2e','The previously accepted full424 native numerical source snapshot must remain exact.');
const monsterData = JSON.parse(acceptedMonsterBytes.toString());
if (nativeRoot) assert.equal(digest(native('data/monster/monster_data.json')),digest(acceptedMonsterBytes));
assert.deepEqual(facts.baseExperienceYields,monsterData.map(row => row.expYield));
assert.equal(facts.speciesIdMapping,'pinned-red-s16-identity-not-base-species-or-form-collapse');
if (nativeRoot) {
  assert.match(native('include/pokemon.h').toString(),/static inline s16 SpeciesId\(s32 id\)\s*\{\s*return id;\s*\}/);
  assert.match(native('src/pokemon.c').toString(),/return expYield \+ \(expYield \* \(level - 1\)\) \/ 10;/);
  assert.match(native('include/constants/monster.h').toString(),/#define MONSTER_MAX \(MONSTER_RAYQUAZA_CUTSCENE \+ 1\)/);
  assert.match(native('include/constants/monster.h').toString(),/#define MONSTER_RAYQUAZA_CUTSCENE 423/);
  const spawn = native('src/dungeon_mon_spawn.c').toString();
  for (const text of ['entInfo->bellyEmpty = FALSE;','entInfo->usedLinkedMovesCounter = 0;','entInfo->turnsSinceWarpScarfActivation = 0;','unkDungeon2F3C *structPtr = gDungeon->unk2F3C;','SpawnPokemonData sp[64];','if (expGain < exp)','r10 += 2;','if (i == 64)','if (structPtr->species == 0)','loopSpecies == species && structPtr->level == level']) assert(spawn.includes(text));
  const lazy = spawn.slice(spawn.indexOf('static void sub_806AED8'),spawn.indexOf('UNUSED static s32 sub_806B09C'));
  assert(!lazy.includes('MOVE_BLOWBACK'),'Native lazy/full miss has no pre-cache empty fallback.');
  const moves = native('src/moves.c').toString();
  for (const text of ['move->moveFlags = MOVE_FLAG_ENABLED_FOR_AI | MOVE_FLAG_EXISTS;','move->moveFlags2 = 0;','move->PP = GetMoveBasePP(move);','move->ginseng = 0;']) assert(moves.includes(text));
}
assert.deepEqual(facts.recipientCounters,{bellyEmpty:false,usedLinkedMovesCounter:0,turnsSinceWarpScarfActivation:0});
assert.equal(digest(await read(game+'content/authored/sinister-cache-facts.js')),'29c52b7c3e3506211e683f75483444e9a489723969a5c156b41dd3c4493ff1ff');
assert.equal(digest(await read(game+'src/domain/gameplay/sinister-floor-cache.js')),'0366765e31203ebd435dbad934bb7ce1b75cb3a412c1cc95b2e7cc56509beeac');
assert.equal(digest(await read(game+'content/state/sinister-cache-proof.js')),'48d296f08201126ce9ef1fca884c6e3ad7140294aa3d847b5612e089fd024fed');
assert.equal(calls(trees.owner,'prepareSinisterFloorCache').length,2);
for (const name of ['prepareSinisterCache64','lookupSinisterCache64','inspectSinisterCache64']) named(trees.owner,name);
named(trees.proof,'checkSinisterCache64');
assert.equal(calls(trees.proof,'copyPlainData').length,2);
assert.equal(calls(trees.proof,'inspectSinisterCache64').length,1);
assert.equal(calls(trees.owner,'draw').length,1);
for (const tree of [trees.owner,trees.proof]) {
  assert.equal(nodes(tree,node => ['ImportExpression','AwaitExpression'].includes(node.type)).length,0);
  for (const name of ['Math.random','Date.now','allocate','allocateId','seedRandom','nextRandom','generateFloor']) assert.equal(calls(tree,name).length,0,name);
}
assert.equal(calls(trees.proof,'draw').length,0);
const profiles = (await Promise.all([1,2,3,4,5].map(index => read(game+`content/species/profiles-${index}.json`)))).flatMap(text => JSON.parse(text).records);
const learns = JSON.parse(await read(game+'content/species/learnsets.json')).records;
const levels = (await Promise.all([1,2,3,4].map(index => read(game+`content/species/levels-${index}.json`)))).flatMap(text => JSON.parse(text).records);
assert.equal(profiles.length,419);
assert(profiles.every(row => ['blue-red-stats','red-only-levels'].includes(row.evidence.stats) && row.evidence.learnset === 'blue-red-learning' && row.experienceYield === monsterData[row.internalId].expYield));
const growthById = new Map(levels.map(row => [row.id,row])),learnById = new Map(learns.map(row => [row.id,row]));
for (const profile of profiles) {
  const growth = growthById.get(profile.levelResourceId),monster = monsterData[profile.internalId];
  assert.deepEqual(growth.baseStats,[monster.baseHP,...monster.baseAtkSpAtk,...monster.baseDefSpDef]);
  const totals = [...growth.baseStats];
  for (const row of growth.rows) for (let index = 0; index < 5; index++) { totals[index] += row[index+1]; assert(totals[index] >= 0 && totals[index] <= (index === 0 ? 999 : 255)); }
}
if (nativeRoot) {
  const nativeLearn = JSON.parse(native('data/monster/learnset/learnset_data.json'));
  const moveIds = new Map([...native('include/constants/move_id.h').toString().matchAll(/^#define (MOVE_[A-Z0-9_]+) (0x[0-9A-Fa-f]+|[0-9]+)$/gm)].map(match => [match[1],Number(match[2])]));
  for (const profile of profiles) assert.deepEqual(learnById.get(profile.learnsetResourceId).levelUp,nativeLearn[profile.internalId-1].levelUpMoves.map(row => [row.level,moveIds.get(row.move)]));
}
assert.equal(Math.max(...learns.map(row => row.levelUp.length)),18,'All admitted miss learnsets fit the explicit32-candidate preflight bound.');
function auditOwner(source) {
  const tree = ast(source),sample = named(tree,'sampleMiss'),lookup = named(tree,'lookupSinisterCache64'),creation = named(tree,'prepareSinisterCache64'),rank = named(tree,'rankings'),inspect = named(tree,'inspectSinisterCache64'),scan = named(tree,'scan');
  const draw = calls(sample,'draw'); assert.equal(draw.length,1);
  assert.equal(draw[0].arguments[1].value,4);
  const replacement = nodes(sample,node => node.type === 'IfStatement' && node.test.type === 'BinaryExpression' && node.test.operator === '>=' && member(node.test.left) === 'candidateIndex' && node.test.right.value === 4);
  assert.equal(replacement.length,1); assert.equal(calls(replacement[0].consequent,'draw').length,1,'The sole actual sampler is inside later-candidate replacement.');
  assert.equal(calls(sample,'missFacts').length,1); assert(calls(sample,'missFacts')[0].end < draw[0].start);
  assert(!source.slice(sample.start,sample.end).includes('preCacheEmptyFallback'),'Lazy/full misses cannot install Blowback.');
  assert(nodes(sample,node => node.type === 'BinaryExpression' && node.operator === '!==' && member(node.left) === 'random.draws' && node.right.type === 'BinaryExpression' && node.right.operator === '+' && member(node.right.left) === 'prior.draws' && node.right.right.value === 1).length === 1);
  const hit = nodes(lookup,node => node.type === 'IfStatement' && node.test.type === 'BinaryExpression' && node.test.operator === '===' && member(node.test.left) === 'found.mode' && node.test.right.value === 'hit');
  assert.equal(hit.length,1); assert.equal(calls(hit[0].consequent,'sampleMiss').length,0); assert.equal(calls(hit[0].consequent,'draw').length,0); assert.equal(calls(hit[0].alternate,'sampleMiss').length,1);
  const append = nodes(lookup,node => node.type === 'IfStatement' && node.test.type === 'BinaryExpression' && node.test.operator === '===' && member(node.test.left) === 'found.mode' && node.test.right.value === 'append');
  assert.equal(append.length,1);
  const entries = nodes(lookup,node => node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && member(node.left.object) === 'next.entries');
  assert.equal(entries.length,1); assert(entries[0].start > append[0].start && entries[0].end <= append[0].end,'Only first-free append may write cache entries; full result remains uncached.');
  assert.equal(calls(lookup,'lookupAuthority').length,1); assert(calls(lookup,'lookupAuthority')[0].end < calls(lookup,'sampleMiss')[0].start);
  const prepared = calls(creation,'prepareSinisterFloorCache'); assert.equal(prepared.length,1);
  assert(calls(creation,'copyPlainData')[0].end < calls(creation,'generationAuthority')[0].start && calls(creation,'generationAuthority')[0].end < prepared[0].start);
  assert.equal(member(prepared[0].arguments[1]),'draw');
  assert.equal(nodes(rank,node => node.type === 'BinaryExpression' && node.operator === '<' && member(node.left) === 'bestExperience' && member(node.right) === 'experience').length,1,'Strict greater native EXP selection preserves first-row ties.');
  assert.equal(nodes(rank,node => node.type === 'AssignmentExpression' && node.operator === '+=' && member(node.left) === 'rank' && node.right.value === 2).length,1);
  assert.equal(nodes(rank,node => node.type === 'ConditionalExpression' && node.test.type === 'BinaryExpression' && node.test.operator === '===' && member(node.test.left) === 'rank' && node.test.right.value === 0 && node.consequent.value === 1).length,1);
  assert.equal(calls(rank,'draw').length,0);
  assert.equal(nodes(scan,node => node.type === 'BinaryExpression' && node.operator === '<' && member(node.left) === 'index' && member(node.right) === 'FACTS.maxNativeCacheRows').length,1);
  assert.equal(nodes(scan,node => node.type === 'IfStatement' && node.test.type === 'BinaryExpression' && node.test.operator === '===' && member(node.test.left) === 'row.nativeSpeciesId' && node.test.right.value === 0).length,1);
  assert.equal(nodes(scan,node => node.type === 'BinaryExpression' && node.operator === '===' && member(node.left) === 'row.nativeSpeciesId' && member(node.right) === 'wanted.nativeSpeciesId').length,1);
  assert.equal(nodes(scan,node => node.type === 'BinaryExpression' && node.operator === '===' && member(node.left) === 'row.level' && member(node.right) === 'wanted.level').length,1);
  assert.equal(calls(inspect,'copyPlainData').length,1); assert(calls(inspect,'copyPlainData')[0].end < calls(inspect,'acceptedGeneration')[0].start);
  for (const text of ["raw.entries.length !== FACTS.maxNativeCacheRows","fingerprint(raw.expYieldRankings) !== fingerprint(expected.expYieldRankings)","if (ended) throw","scan(expected.entries,wanted).mode !== 'append'","lookup.revision < priorRevision","fingerprint(receipt) !== fingerprint(replayed)","fingerprint({...sampled.row,origin:{kind:'miss',receipt:replayed}}) !== fingerprint(row)","draw !== escortDungeonRandomInteger","'cache,operation,random,request'","'lifecycleSource,owner,random,rows,source'","currentPp:move.basePp","ginseng:0,moveFlags2:0","struggleMoveFlags:0","counters:{bellyEmpty:false,usedLinkedMovesCounter:0,turnsSinceWarpScarfActivation:0}","['blue-red-stats','red-only-levels']","profile.evidence.learnset !== 'blue-red-learning'"]) assert(source.includes(text),text);
  const recipient = named(tree,'recipient');
  assert.equal(calls(recipient,'row.moves.map').length,1,'Every lookup produces independent mutable move records.');
  assert.equal(calls(recipient,'freezeData').length,0,'Fresh PP/counters remain independently mutable.');
  assert.equal(nodes(tree,node => node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && /^(state|input|authority|raw)\./.test(member(node.left) ?? '')).length,0);
}
auditOwner(sources.owner);
// Negative source mutations exercise the parser auditor, never the game module.
for (const [from,to] of [
  ['candidateIndex >= 4','candidateIndex >= 5'],
  ['draw(prior,4)','draw(prior,3)'],
  ["found.mode === 'append'","found.mode === 'full'"],
  ['bestExperience < experience','bestExperience <= experience'],
  ['rank += 2','rank += 1'],
  ["scan(expected.entries,wanted).mode !== 'append'","scan(expected.entries,wanted).mode !== 'hit'"],
  ['currentPp:move.basePp','currentPp:0'],
  ['usedLinkedMovesCounter:0','usedLinkedMovesCounter:1'],
  ["profile.evidence.learnset !== 'blue-red-learning'","profile.evidence.learnset !== 'blue-red-learnset'"],
]) {
  assert(sources.owner.includes(from),from); assert.throws(() => auditOwner(sources.owner.replace(from,to)),undefined,`Parser audit must reject ${from}`);
}
const freshProof = named(trees.proof,'checkSinisterCache64Lookup');
assert.equal(calls(freshProof,'lookupSinisterCache64').length,1);
assert.equal(calls(freshProof,'checkSinisterCache64').length,1);
assert.equal(calls(named(trees.proof,'checkSinisterCache64'),'checkSinisterCacheReceipt').length,1);
assert.equal(nodes(trees.proof,node => node.type === 'MemberExpression' && member(node) === 'state.random').length,0);
assert.equal(nodes(trees.proof,node => node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression').length,0);
assert.equal(nodes(trees.proof,node => node.type === 'UpdateExpression').length,0);
// Requalify only the named narrow consumer gate; authenticate both older tools
// after removing those exact additions. All other original parser bodies remain.
const inheritedSource = await read('tools/pokemon-dungeon/scripts/check-sinister-cache.mjs');
const oldGuard = "  assert.ok((path === game+'content/state/sinister-cache-proof.js' || !other.includes('sinister-floor-cache') && !other.includes('sinister-cache-facts')) && !other.includes('sinister-cache-proof'),'Unselected cache allows only its exact unselected receipt proof consumer: '+path);";
const newGuard = "  assert.ok((path === game+'content/state/sinister-cache-proof.js' || [game+'src/contracts/sinister-cache64.js',game+'src/domain/gameplay/sinister-cache64.js',game+'content/state/sinister-cache64-proof.js'].includes(path) || !other.includes('sinister-floor-cache') && !other.includes('sinister-cache-facts')) && (path === game+'content/state/sinister-cache64-proof.js' || !other.includes('sinister-cache-proof')),'Unselected cache allows only its exact unselected receipt proof consumer: '+path);";
assert.equal(inheritedSource.split(newGuard).length,2);
assert.equal(digest(inheritedSource.replace(newGuard,oldGuard)),'ae837e14c329a3179d6775e4f115f02985da9aadc9b0b26e61745254cf5e720c');
let inheritedProof = await read('tools/pokemon-dungeon/scripts/check-sinister-cache-proof.mjs');
const namedChanges = [
  [inheritedProof.split('\n').find(line => line.startsWith('const cache64Guard = '))+'\n',''],
  ["assert.equal(inheritedAudit.split(cache64Guard).length,2,'The narrow unselected cache64 exception must appear exactly once.');","assert.equal(inheritedAudit.split(newGuard).length,2,'The narrow unselected proof exception must appear exactly once.');"],
  ["assert.equal(sha(inheritedAudit.replace(cache64Guard,newGuard).replace(newGuard,oldGuard)),'1c63d0064a2bab2ab1a6748bbe718a2e45630ed085d84de74bfb88c5c4716c8e','Only the reviewed a75 no-consumer assertion and named cache64 whitelist hunk may change.');","assert.equal(sha(inheritedAudit.replace(newGuard,oldGuard)),'1c63d0064a2bab2ab1a6748bbe718a2e45630ed085d84de74bfb88c5c4716c8e','Only the reviewed a75 no-consumer assertion may change.');"],
  ["  if (node.type === 'ArrayExpression') return node.elements.map(item => gate(item,path,other));\n",''],
  ["for (const path of [game+'src/contracts/sinister-cache64.js',game+'src/domain/gameplay/sinister-cache64.js']) {\n  assert.equal(gate(guardCall.arguments[0],path,\"import 'sinister-floor-cache'; import 'sinister-cache-facts';\"),true);\n  assert.equal(gate(guardCall.arguments[0],path,\"import 'sinister-cache-proof';\"),false);\n}\nassert.equal(gate(guardCall.arguments[0],game+'content/state/sinister-cache64-proof.js',\"import 'sinister-cache-proof';\"),true);\n",''],
];
for (const [from,to] of namedChanges) { assert.equal(inheritedProof.split(from).length,2,'Exactly one named inherited proof addition required.'); inheritedProof = inheritedProof.replace(from,to); }
assert.equal(digest(inheritedProof),'229529099e8f5da0362f3b3a9714746c1edf86ded1012585cde9b18dcf89a66c');
async function jsFiles(directory) {
  const files = [];
  for (const entry of await readdir(new URL(directory,root),{withFileTypes:true})) {
    if (entry.isDirectory()) files.push(...await jsFiles(directory+'/'+entry.name));
    else if (entry.name.endsWith('.js')) files.push(directory+'/'+entry.name);
  }
  return files;
}
for (const path of [...await jsFiles(game+'src'),...await jsFiles(game+'content')]) {
  if (Object.values(paths).includes(path)) continue;
  assert(!(await read(path)).includes('sinister-cache64'),'Only the exact new unselected cache64 package may consume itself: '+path);
}
console.log(`Sinister cache64 ${nativeRoot ? 'fresh pinned Git source/AST' : 'portable recorded-source/AST/finite-data'} audit: 64 entries/424 EXP ranks, independent full424 numerical snapshot and419 profile/level domains, exact SpeciesId identity, retained preparation/miss receipts, native full-PP mutable counters, nine negative parser controls, narrow original-tool body authentication, no selected consumer. ${nativeRoot ? 'Native Git bytes freshly verified.' : 'Native Git/source pins are recorded, not freshly verified.'} No game/native execution.`);
