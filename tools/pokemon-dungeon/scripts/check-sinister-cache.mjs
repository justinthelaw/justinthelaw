// Source/data inspection only: never import or evaluate game/native modules.
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url),game = 'games/pokemon-dungeon-reimagined/';
const factPath = 'games/pokemon-dungeon-reimagined/content/authored/sinister-cache-facts.js';
const helperPath = 'games/pokemon-dungeon-reimagined/src/domain/gameplay/sinister-floor-cache.js';
for (const path of [factPath,helperPath]) {
  assert.ok(await access(new URL(path,root)).then(() => true,() => false),`Missing unselected cache package: ${path}`);
}
const read = path => readFile(new URL(path,root),'utf8');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const ast = text => parse(text,{ecmaVersion:'latest',sourceType:'module'});
function nodes(node,predicate) {
  const found = [];
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.type === 'string' && predicate(value)) found.push(value);
    for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(walk); else walk(child);
  }
  walk(node); return found;
}
const exactKeys = (value,keys) => assert.deepEqual(Object.keys(value).sort(),keys.split(',').sort());
const integer = (value,min,max) => assert.ok(Number.isSafeInteger(value) && value >= min && value <= max,`Bounded integer: ${value}`);
const factSource = await read(factPath),factAst = ast(factSource);
assert.equal(factAst.body.length,2,'Facts contain one import and one literal-data export only.');
assert.deepEqual(factAst.body[0].specifiers.map(s => [s.imported.name,s.local.name]),[['freezeData','freezeData']]);
assert.equal(factAst.body[0].source.value,'../../src/domain/state/validate.js');
const factVariable = factAst.body[1].declaration.declarations[0];
assert.equal(factVariable.id.name,'SINISTER_CACHE_FACTS');
assert.equal(factVariable.init.callee.name,'freezeData'); assert.equal(factVariable.init.arguments.length,1);
const literal = factVariable.init.arguments[0]; assert.equal(literal.type,'ObjectExpression');
// JSON.parse accepts the literal data; it never executes the authored module.
const facts = JSON.parse(factSource.slice(literal.start,literal.end));
exactKeys(facts,'schemaVersion,id,commit,qualification,sourceFiles,catalogFiles,browserRandomMapping,maxNativeCacheRows,maxFloorRows,maxMoveSlots,nothingNativeMoveId,preCacheEmptyFallback,floorFacts,species,floor13FixedAllocationNativeSpeciesIds,limitations');
assert.equal(facts.schemaVersion,1); assert.equal(facts.id,'sinister-floor-cache-facts-v1');
assert.equal(facts.commit,'6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.qualification,'pinned-red-comparative-not-blue-binary-proof');
assert.equal(facts.browserRandomMapping,'browser-xoshiro128ss-v1-upper16-scale-one-transition-not-native-parity');
assert.deepEqual([facts.maxNativeCacheRows,facts.maxFloorRows,facts.maxMoveSlots,facts.nothingNativeMoveId],[64,32,4,0]);
const args = process.argv.slice(2);
assert.equal(args.length,2); assert.equal(args[0],'--native-source');
const nativeRoot = args[1];
assert.equal(execFileSync('git',['-C',nativeRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),facts.commit);
assert.equal(facts.sourceFiles.length,22); assert.equal(new Set(facts.sourceFiles.map(p => p.path)).size,22);
const blobs = new Map();
for (const pin of facts.sourceFiles) {
  exactKeys(pin,'path,sha256'); assert.match(pin.path,/^(?:src|include|data)\/[A-Za-z0-9_./-]+$/); assert.ok(!pin.path.includes('..'));
  const bytes = execFileSync('git',['-C',nativeRoot,'show',`${facts.commit}:${pin.path}`],{maxBuffer:16*1024*1024});
  assert.equal(digest(bytes),pin.sha256,`Native Git-blob byte pin ${pin.path}`); blobs.set(pin.path,bytes.toString('utf8'));
}
assert.equal(facts.catalogFiles.length,21); assert.equal(new Set(facts.catalogFiles.map(p => p.path)).size,21);
const catalogs = new Map();
for (const pin of facts.catalogFiles) {
  exactKeys(pin,'path,sha256'); assert.match(pin.path,/^games\/pokemon-dungeon-reimagined\/content\/(?:dungeons|species|effects)\/[a-z0-9-]+\.json$/);
  const bytes = await readFile(new URL(pin.path,root)); assert.equal(digest(bytes),pin.sha256,`Qualified catalog byte pin ${pin.path}`);
  catalogs.set(pin.path,JSON.parse(bytes));
}
const records = suffix => [...catalogs].filter(([path]) => path.includes(suffix)).flatMap(([,doc]) => doc.records);
const profiles = new Map(records('/profiles-').map(p => [p.internalId,p]));
const growths = new Map(records('/levels-').map(p => [p.id,p]));
const learns = new Map(catalogs.get(game+'content/species/learnsets.json').records.map(p => [p.id,p]));
const moves = new Map(catalogs.get(game+'content/species/identities.json').moves.map(p => [p.originalId,p]));
const actions = new Map(records('/actions-').map(p => [p.internalId,p]));
const floors = records('/floors-').filter(f => f.dungeonId === 'sinister-woods').sort((a,b) => a.localFloor-b.localFloor);
const pools = new Map(records('/encounters-').map(p => [p.id,p]));
const rawTables = JSON.parse(blobs.get('data/dungeon/SinisterWoods/pokemon_found.json')).tables;
const rawJoins = JSON.parse(blobs.get('data/dungeon/SinisterWoods/floor_id.json')).tables;
const rawMonsters = JSON.parse(blobs.get('data/monster/monster_data.json'));
const rawMoves = JSON.parse(blobs.get('data/move/move_data.json'));
const rawLearnsets = JSON.parse(blobs.get('data/monster/learnset/learnset_data.json'));
const monsterIds = new Map([...blobs.get('include/constants/monster.h').matchAll(/^#define (MONSTER_[A-Z0-9_]+) (0x[a-f\d]+|\d+)$/gim)].map(m => [m[1],Number(m[2])]));
const moveIds = new Map([...blobs.get('include/constants/move_id.h').matchAll(/^#define (MOVE_[A-Z0-9_]+) (0x[a-f\d]+|\d+)$/gim)].map(m => [m[1],Number(m[2])]));
assert.equal(rawMonsters.length,424); assert.equal(rawMoves.length,413);
assert.equal(rawTables.length,12); assert.equal(rawJoins.length,13); assert.equal(facts.floorFacts.length,13); assert.equal(floors.length,13);
const sourceIndexes = [10,11,12,13,14,15,16,17,17,18,19,20,21];
assert.deepEqual(rawJoins.map(f => f.Pokemon),sourceIndexes);
const requiredPairs = new Set();
for (const [index,floor] of facts.floorFacts.entries()) {
  exactKeys(floor,'floorId,localFloor,nativeTableIndex,encounterPoolId,rows');
  assert.equal(floor.localFloor,index+1); assert.equal(floor.floorId,`sinister-woods-floor-${String(index+1).padStart(2,'0')}`);
  assert.equal(floor.nativeTableIndex,sourceIndexes[index]); assert.equal(floor.encounterPoolId,floors[index].encounterPoolId);
  const table = rawTables[rawJoins[index].Pokemon-10],pool = pools.get(floor.encounterPoolId);
  assert.deepEqual(pool.sourceIndices,[floor.nativeTableIndex]); assert.deepEqual(pool.sourceSymbols,[table.name]);
  assert.equal(floor.rows.length,table.pokemon.length); integer(floor.rows.length,1,32);
  let weight = 0;
  for (const [order,row] of floor.rows.entries()) {
    exactKeys(row,'order,nativeSpeciesId,level,publishedWeight,cumulativeWeight');
    const native = table.pokemon[order],catalog = pool.rows[order]; weight += native.probability;
    assert.deepEqual(row,{order,nativeSpeciesId:monsterIds.get(native.species),level:native.level,publishedWeight:native.probability,cumulativeWeight:weight});
    assert.deepEqual([catalog.order,catalog.sourceMonsterIndex,catalog.level,catalog.publishedWeight,catalog.cumulativeWeight],[order,row.nativeSpeciesId,row.level,row.publishedWeight,row.cumulativeWeight]);
    assert.equal(catalog.entryRole,row.publishedWeight === 0 ? 'nonrandom-level-lookup' : 'weighted-candidate');
    requiredPairs.add(`${row.nativeSpeciesId}:${row.level}`);
  }
  assert.equal(weight,10000);
  assert.deepEqual(floor.rows.slice(-2).map(r => [r.nativeSpeciesId,r.level,r.publishedWeight]),[[380,90,0],[421,1,0]]);
}
assert.equal(facts.floorFacts[7].encounterPoolId,facts.floorFacts[8].encounterPoolId,'8F/9F share catalog, remain two actual floor facts.');
assert.deepEqual(facts.floorFacts[12].rows.map(r => r.nativeSpeciesId),[23,94,333,380,421]);
assert.equal(facts.species.length,20); assert.equal(new Set(facts.species.map(p => `${p.nativeSpeciesId}:${p.level}`)).size,20);
assert.deepEqual(new Set(facts.species.map(p => `${p.nativeSpeciesId}:${p.level}`)),requiredPairs);
const statKeys = ['hp','attack','specialAttack','defense','specialDefense'];
function checkMove(move) {
  const native = rawMoves[move.nativeMoveId],action = actions.get(move.nativeMoveId),canonical = moves.get(move.nativeMoveId);
  assert.equal(move.basePp,native.basePP); assert.equal(move.basePp,action.numeric.pp);
  assert.equal(move.moveId,canonical?.id ?? null); assert.equal(move.moveId,action.moveId);
  integer(move.nativeMoveId,1,394); integer(move.basePp,1,99);
}
exactKeys(facts.preCacheEmptyFallback,'nativeMoveId,moveId,basePp'); checkMove(facts.preCacheEmptyFallback);
assert.deepEqual(facts.preCacheEmptyFallback,{nativeMoveId:368,moveId:null,basePp:17});
for (const species of facts.species) {
  exactKeys(species,'nativeSpeciesId,level,speciesId,formId,identityClass,stats,bodySize,baseMovementSpeed,mobility,nativeChanceAsleep,nativeAbilities,nativeTypes,nativeWild,levelEvidence,evidence,candidates,replacementDrawCount');
  const native = rawMonsters[species.nativeSpeciesId],base = [native.baseHP,...native.baseAtkSpAtk,...native.baseDefSpDef],profile = profiles.get(species.nativeSpeciesId);
  integer(species.level,1,100); exactKeys(species.stats,'hp,attack,specialAttack,defense,specialDefense');
  assert.equal(species.bodySize,native.bodySize); assert.equal(species.baseMovementSpeed,native.movementSpeed);
  assert.equal(species.mobility,(native.movementType ?? 'MOVEMENT_TYPE_STANDARD').slice(14).toLowerCase());
  assert.equal(species.nativeChanceAsleep,native.chanceAsleep); assert.deepEqual(species.nativeAbilities,native.abilities); assert.deepEqual(species.nativeTypes,native.types);
  assert.deepEqual(species.nativeWild,{iqPoints:1,iqSkillIds:['iq-status-checker','iq-pp-checker','iq-item-catcher',...(species.level >= 16 ? ['iq-item-master'] : [])],tacticId:'tactic-go-after-foes',heldItem:null,bossFlag:false});
  assert.equal(species.replacementDrawCount,Math.max(0,species.candidates.length-4));
  if (species.nativeSpeciesId === 421) {
    assert.equal(profile,undefined); assert.equal(species.identityClass,'internal-decoy');
    assert.deepEqual([species.level,species.speciesId,species.formId,species.levelEvidence],[1,null,null,null]);
    assert.deepEqual(species.candidates,[]); assert.deepEqual(statKeys.map(k => species.stats[k]),base);
    assert.deepEqual(species.evidence,{stats:'pinned-red-dummy-base-only',learnset:'pinned-red-explicit-dummy'});
    continue;
  }
  assert.equal(species.identityClass,'pokemon'); assert.equal(species.speciesId,profile.speciesId); assert.equal(species.formId,profile.formId);
  assert.deepEqual(species.evidence,{stats:profile.evidence.stats,learnset:profile.evidence.learnset});
  assert.deepEqual(species.levelEvidence,{levelResourceId:profile.levelResourceId,learnsetResourceId:profile.learnsetResourceId,...profile.levelEvidence});
  const growth = growths.get(profile.levelResourceId),learn = learns.get(profile.learnsetResourceId);
  assert.equal(profile.evidence.stats,'blue-red-stats'); assert.equal(profile.evidence.learnset,'blue-red-learning');
  assert.equal(growth.id,`level-${digest(JSON.stringify({baseStats:growth.baseStats,rows:growth.rows}))}`);
  assert.equal(learn.id,`learn-${digest(JSON.stringify({levelUp:learn.levelUp,auxiliary:learn.auxiliary}))}`);
  assert.deepEqual(growth.baseStats,base); assert.equal(growth.rows.length,100);
  const stats = [...base];
  for (let level = 2; level <= species.level; level++) for (let stat = 0; stat < 5; stat++) stats[stat] += growth.rows[level-1][stat+1];
  assert.deepEqual(statKeys.map(k => species.stats[k]),stats);
  const rawLearn = rawLearnsets.find(r => r.pokemon === native.name.substring(11)).levelUpMoves;
  assert.deepEqual(rawLearn.map(r => [r.level,moveIds.get(r.move)]),learn.levelUp);
  const eligible = rawLearn.filter(r => r.level <= species.level); assert.equal(species.candidates.length,eligible.length);
  for (const [order,candidate] of species.candidates.entries()) {
    exactKeys(candidate,'order,learnedAt,nativeMoveId,moveId,basePp'); checkMove(candidate);
    assert.deepEqual([candidate.order,candidate.learnedAt,candidate.nativeMoveId],[order,eligible[order].level,moveIds.get(eligible[order].move)]);
  }
}
const profile = id => facts.species.find(p => p.nativeSpeciesId === id);
assert.deepEqual(profile(333).candidates.map(m => m.nativeMoveId),[61,65,234,292,305,333,344,333,234,305]);
assert.deepEqual(profile(94).candidates.map(m => m.nativeMoveId),[35,111,120,35,237]);
assert.deepEqual(profile(289).candidates.map(m => m.nativeMoveId),[122,139,154,217,122]);
assert.equal(profile(380).candidates.length,13); assert.equal(profile(380).replacementDrawCount,9);
assert.deepEqual(facts.floorFacts.map(f => f.rows.reduce((sum,r) => sum+facts.species.find(p => p.nativeSpeciesId === r.nativeSpeciesId && p.level === r.level).replacementDrawCount,0)),[9,9,9,9,9,9,10,10,10,9,9,9,16]);
// Parse only the compressed fixed-room facts; no geometry is exported or run.
const fixed = blobs.get('data/dungeon/fixedmap.inc');
const labels = [...fixed.slice(fixed.indexOf('gUnknown_84A03BC:')).matchAll(/\.4byte (gUnknown_[A-Fa-f\d]+)/g)].map(m => m[1]);
const fixedBlock = fixed.split(labels[2]+':')[1].split('.global')[0];
const bytes = [...fixedBlock.matchAll(/0x([a-f\d]{2})/gi)].map(m => parseInt(m[1],16));
const actionsInOrder = [];
for (let cursor = 3; cursor < bytes.length;) {
  const value = bytes[cursor++];
  if (value === 14) actionsInOrder.push(bytes[cursor++]); else for (let count = 0; count <= (value & 15); count++) actionsInOrder.push(value >>> 4);
}
assert.equal(actionsInOrder.length,bytes[0]*bytes[1]);
const spawnOrder = actionsInOrder.filter(action => [18,19,20].includes(action));
assert.deepEqual(spawnOrder,[20,18,19]);
const fixedEntitiesSource = blobs.get('src/dungeon_generation_fixed.c');
const entityRows = new Map([...fixedEntitiesSource.matchAll(/\[(\d+)\] = \{\s*\.speciesId = (MONSTER_[A-Z0-9_]+),/g)].map(m => [Number(m[1]),monsterIds.get(m[2])]));
assert.ok(fixedEntitiesSource.includes('sFixedRoomEntities[fixedRoomActionId - 16]'));
assert.deepEqual(facts.floor13FixedAllocationNativeSpeciesIds,spawnOrder.map(action => entityRows.get(action-16)));
const cacheSource = blobs.get('src/dungeon_mon_spawn.c'),learnSource = blobs.get('src/dungeon_leveling.c'),movesSource = blobs.get('src/moves.c');
for (const needle of ['s32 var_24 = SetMonsterSpawnsArray(sp, 0);','sub_8072AC8(structPtr->moves, structPtr->species, structPtr->level);','if (structPtr->moves[0] == MOVE_NOTHING)','structPtr->moves[0] = MOVE_BLOWBACK;','for (; i < 64; structPtr++, i++)']) assert.ok(cacheSource.includes(needle),needle);
for (const needle of ['param_1[index] = MOVE_NOTHING;','if (counter == MAX_MON_MOVES)','arrIndex = DungeonRandInt(MAX_MON_MOVES);','arrIndex = counter;','param_1[arrIndex] = moveIDs[0];']) assert.ok(learnSource.includes(needle),needle);
assert.ok(movesSource.includes('static const u8 gDummyMoves[] = {0};') && movesSource.includes('species == MONSTER_DECOY || species == MONSTER_NONE'));
assert.ok(blobs.get('src/dungeon_config.c').includes('gIqItemMasterMinWildLevel = 16;'));
for (const needle of ['entInfo->IQ = 1;','ZeroOutItem(&entInfo->heldItem);','entInfo->bossFlag = 0;']) assert.ok(cacheSource.includes(needle),needle);
const iqSource = blobs.get('src/dungeon_logic.c');
for (const needle of ['SetIQSkill(iqSkills, IQ_STATUS_CHECKER);','SetIQSkill(iqSkills, IQ_PP_CHECKER);','SetIQSkill(iqSkills, IQ_ITEM_CATCHER);','if (pokemonInfo->bossFlag)','if (pokemonInfo->level >= gIqItemMasterMinWildLevel)','pokemonInfo->tactic = TACTIC_GO_AFTER_FOES;']) assert.ok(iqSource.includes(needle),needle);
const cacheHit = cacheSource.slice(cacheSource.indexOf('static void sub_806AED8(Moves *moves',cacheSource.indexOf('void sub_806AD3C')),cacheSource.indexOf('if (i == 64)',cacheSource.indexOf('void sub_806AD3C')));
for (const needle of ['loopSpecies = SpeciesId(structPtr->species);','if (structPtr->species == 0)','loopSpecies == species && structPtr->level == level','InitPokemonMoveOrNullObject','moves->struggleMoveFlags = 0;']) assert.ok(cacheHit.includes(needle),needle);
assert.ok(!cacheHit.includes('DungeonRand') && !cacheHit.includes('sub_8072AC8('));
const run = blobs.get('src/run_dungeon.c'),serializer = blobs.get('src/dungeon_serializer.c');
assert.ok(run.indexOf('sub_806AD3C();') < run.indexOf('GenerateFloor('));
assert.ok(run.includes('sub_8082B40();') && run.includes('r6'));
assert.ok(!serializer.includes('unk2F3C') && serializer.includes('ReadDungeonState') && serializer.includes('SaveDungeonState'));
const dungeonStruct = blobs.get('include/structs/str_dungeon.h');
assert.ok(dungeonStruct.includes('#define MONSTER_SPAWNS_ARR_COUNT 32') && dungeonStruct.includes('fileMonsterSpawns[MONSTER_SPAWNS_ARR_COUNT]') && dungeonStruct.includes('unk2F3C[64]'));
assert.ok(facts.limitations.some(text => text.includes('r6 quicksave') && text.includes('Blue suspend parity')));
assert.ok(facts.limitations.some(text => text.includes('without rerolling') && text.includes('older cache/seed history')));
const source = await read(helperPath),tree = ast(source);
const fn = name => { const found = nodes(tree,n => n.type === 'FunctionDeclaration' && n.id.name === name); assert.equal(found.length,1); return found[0]; };
const body = name => source.slice(fn(name).start,fn(name).end);
const preflight = body('cacheInput'),prepare = body('prepareSinisterFloorCache');
for (const needle of ["copyPlainData(input,INPUT_LIMITS)","'owner,random,rows,source'","'createdRevision,floorId,generationTransactionId,mapId,sessionId'","instanceId('session',owner.sessionId)","instanceId('map',owner.mapId)","instanceId('transaction',owner.generationTransactionId)","'catalogFiles,commit,qualification,sourceFiles'",'supplied.commit !== FACTS.commit','supplied.qualification !== FACTS.qualification','sourcePins(supplied.sourceFiles,FACTS.sourceFiles)','sourcePins(supplied.catalogFiles,FACTS.catalogFiles)','raw.rows.length !== floor.rows.length','raw.rows.length > FACTS.maxFloorRows',"'cumulativeWeight,level,nativeSpeciesId,order,publishedWeight'",'actual.order !== index','actual.nativeSpeciesId !== expected.nativeSpeciesId','actual.level !== expected.level','actual.publishedWeight !== expected.publishedWeight','actual.cumulativeWeight !== expected.cumulativeWeight','qualifiedSpecies(expected)','validateRandomState(raw.random)','Number.MAX_SAFE_INTEGER-requiredDraws']) assert.ok(preflight.includes(needle),needle);
assert.equal(nodes(fn('cacheInput'),n => n.type === 'CallExpression' && ['draw','escortDungeonRandomInteger'].includes(n.callee.name)).length,0,'All facts/pins/rows/stream capacity preflight before sampling.');
assert.ok(prepare.indexOf('cacheInput(input)') < prepare.indexOf('draw(random,FACTS.maxMoveSlots)'));
assert.ok(prepare.indexOf('draw !== escortDungeonRandomInteger') < prepare.indexOf('draw(random,FACTS.maxMoveSlots)'));
assert.equal(nodes(fn('prepareSinisterFloorCache'),n => n.type === 'Identifier' && n.name === 'input').length,2,'Only parameter and detached preflight touch caller input.');
const calls = nodes(fn('prepareSinisterFloorCache'),n => n.type === 'CallExpression' && n.callee.name === 'draw'); assert.equal(calls.length,1);
assert.equal(calls[0].arguments[1].object.name,'FACTS'); assert.equal(calls[0].arguments[1].property.name,'maxMoveSlots');
const replacementBranch = nodes(fn('prepareSinisterFloorCache'),n => n.type === 'IfStatement' && n.test.type === 'BinaryExpression' && n.test.operator === '>=' && n.test.left.name === 'candidateIndex');
assert.equal(replacementBranch.length,1); assert.ok(nodes(replacementBranch[0].consequent,n => n === calls[0]).length === 1,'Sole sampler call belongs to later-candidate branch.');
for (const needle of ['const moves = [null,null,null,null]','fact.candidates.entries()','let slot = candidateIndex','candidateIndex >= FACTS.maxMoveSlots','boundedInteger(result.value,0,FACTS.maxMoveSlots-1)','validateRandomState(result.state)','random.draws !== prior.draws+1','moves[slot] = { nativeMoveId: candidate.nativeMoveId,moveId: candidate.moveId,basePp: candidate.basePp }','if (usedEmptyFallback) moves[0] = { ...FACTS.preCacheEmptyFallback }','candidates: fact.candidates.map(candidate => ({ ...candidate }))','stats: { ...fact.stats }','iqSkillIds: [...fact.nativeWild.iqSkillIds]','beforeRandom: prepared.random,afterRandom: random','source: prepared.source,owner: prepared.owner','return freezeData(']) assert.ok(prepare.includes(needle),needle);
const fallback = nodes(fn('prepareSinisterFloorCache'),n => n.type === 'IfStatement' && n.test.name === 'usedEmptyFallback')[0];
assert.equal(nodes(fallback,n => n.type === 'CallExpression').length,0,'Empty dummy fallback draws nothing.');
for (const forbidden of ['Math.random','Date.now','allocate(','state.random','state.roster','context.emit','HiddenPower','generateFloor(','randomInteger(','createActor(','seedNativeGeneralRandom(']) assert.ok(!source.includes(forbidden),forbidden);
assert.deepEqual(nodes(tree,n => n.type === 'ImportDeclaration').map(n => n.source.value),['../../../content/authored/sinister-cache-facts.js','../state/plain.js','../state/validate.js','../ids.js','../rng.js','../escort-dungeon-rng.js']);
const sampler = await read(game+'src/domain/escort-dungeon-rng.js');
assert.ok(sampler.includes('Math.floor((result.value >>> 16)*upper/65536)')); assert.ok(sampler.includes('const result = nextRandom(input)'));
async function jsFiles(directory) {
  const result = [];
  for (const entry of await readdir(new URL(directory,root),{withFileTypes:true})) {
    if (entry.isDirectory()) result.push(...await jsFiles(directory+'/'+entry.name)); else if (entry.name.endsWith('.js')) result.push(directory+'/'+entry.name);
  }
  return result;
}
for (const path of [...await jsFiles(game+'src'),...await jsFiles(game+'content')]) {
  if (path === helperPath || path === factPath) continue;
  const other = await read(path);
  assert.ok((path === game+'content/state/sinister-cache-proof.js' || [game+'src/contracts/sinister-cache64.js',game+'src/domain/gameplay/sinister-cache64.js',game+'content/state/sinister-cache64-proof.js'].includes(path) || !other.includes('sinister-floor-cache') && !other.includes('sinister-cache-facts')) && (path === game+'content/state/sinister-cache64-proof.js' || !other.includes('sinister-cache-proof')),'Unselected cache allows only its exact unselected receipt proof consumer: '+path);
}
console.log('Sinister cache source/data/AST audit:22 native Git-blob pins,21 qualified catalog pins,13 actual floors/20 profiles,zero Kecleon/Decoy,ordered duplicate candidates/PP,natural stats,9/10/16 replacement budgets,distinct fixed allocation order,cache-hit zero RNG/native reconstruction qualifications,detached exact whole-input preflight and sole explicit upper16 browser draw seam; no game/native execution.');
