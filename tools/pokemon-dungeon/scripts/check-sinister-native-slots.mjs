// Static source/AST/native pin audit only. Never import or execute game code.
import assert from 'node:assert/strict';
import { readFile,access,readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url),game = 'games/pokemon-dungeon-reimagined/';
const read = path => readFile(new URL(path,root),'utf8');
const files = {facts:game+'content/authored/sinister-native-slot-facts.js',types:game+'src/contracts/sinister-native-slots.js',owner:game+'src/domain/gameplay/sinister-native-slots.js'};
for (const path of Object.values(files)) assert(await access(new URL(path,root)).then(() => true,() => false),'Source native slot prerequisite is missing: '+path);
const sources = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key,path]) => [key,await read(path)])));
const trees = Object.fromEntries(Object.entries(sources).map(([key,source]) => [key,parse(source,{ecmaVersion:'latest',sourceType:'module'})]));
const digest = text => createHash('sha256').update(text).digest('hex');
// Only the exact new unselected runtime consumer is added to the inherited
// parser gate. Its entire previous body and pure run owner remain authenticated.
const oldRunGate = "    for (const node of parseSource(await read(path)).body) assert.ok(!/sinister-run-preparation\\.js$/.test(node.source?.value ?? ''),`Unselected run preparation ${path}`);";
const newRunGate = "    for (const node of parseSource(await read(path)).body) assert.ok(!/sinister-run-preparation\\.js$/.test(node.source?.value ?? '') || path === 'src/domain/gameplay/sinister-native-slots.js' && node.type === 'ImportDeclaration' && node.source.value === './sinister-run-preparation.js',`Unselected run preparation ${path}`);";
function auditInheritedRun(text) {
  assert.equal(text.split(newRunGate).length,2,'Exactly one named native slot runtime consumer allowance required.');
  assert.equal(digest(text.replace(newRunGate,oldRunGate)),'16834e0074adb4e9ff749f59dece9d1d9d7685c74b9b5e81d41f7a7814b4a731','Every other inherited run-preparation checker byte remains unchanged.');
}
const inheritedRun=await read('tools/pokemon-dungeon/scripts/check-sinister-run-preparation.mjs');
auditInheritedRun(inheritedRun);
for (const [from,to] of [["path === 'src/domain/gameplay/sinister-native-slots.js'","true"],["node.source.value === './sinister-run-preparation.js'","true"]]) assert.throws(() => auditInheritedRun(inheritedRun.replace(from,to)),undefined,'A broad run consumer exception must fail authentication.');
assert.equal(digest(await read(game+'src/domain/gameplay/sinister-run-preparation.js')),'e34d70b6574c643a2e59143e863ce806dba093648244f7b094e2eb1827141519','Original pure run/preseed source owner remains unchanged.');
const oldRosterGate = "      if (node.source.value.endsWith('/sinister-ability-domain.js') || node.source.value.endsWith('/sinister-roster-mapping.js')) assert.fail('Unselected source-domain helper acquired an unaudited live consumer: '+path);";
const newRosterGate = "      if (node.source.value.endsWith('/sinister-ability-domain.js')) assert.fail('Unselected ability-domain helper acquired an unaudited live consumer: '+path);\n      if (node.source.value.endsWith('/sinister-roster-mapping.js')) assert(path === 'src/domain/gameplay/sinister-native-slots.js' && node.type === 'ImportDeclaration' && node.source.value === './sinister-roster-mapping.js','Only the exact unselected actual new-memory producer may consume the mapper: '+path);";
function auditInheritedRoster(text) {
  assert.equal(text.split(newRosterGate).length,2,'Exactly one named native slot mapper consumer allowance required.');
  assert.equal(digest(text.replace(newRosterGate,oldRosterGate)),'012ff59a31ad44c83f972e55ba40bd2a89b1ad5bc972fb671e55a0fb9a63f369','Every other prior roster-domain checker byte remains unchanged.');
}
const inheritedRoster=await read('tools/pokemon-dungeon/scripts/check-sinister-roster-domain.mjs');
auditInheritedRoster(inheritedRoster);
assert.throws(() => auditInheritedRoster(inheritedRoster.replace("path === 'src/domain/gameplay/sinister-native-slots.js'",'true')),undefined,'A broad mapper consumer exception must fail authentication.');
function nodes(tree,predicate) { const out=[]; function visit(node) { if (!node || typeof node !== 'object') return; if (predicate(node)) out.push(node); for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else visit(value); } visit(tree); return out; }
function body(source,name) { const tree=parse(source,{ecmaVersion:'latest',sourceType:'module'}),rows=nodes(tree,node => node.type === 'FunctionDeclaration' && node.id.name === name); assert.equal(rows.length,1,name); return source.slice(rows[0].start,rows[0].end); }
function literal(node) { if (node.type === 'Literal') return node.value; if (node.type === 'ArrayExpression') return node.elements.map(literal); if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(row => [row.key.name??row.key.value,literal(row.value)])); if (node.type === 'CallExpression' && node.callee.object?.name === 'Object' && node.callee.property?.name === 'freeze') return literal(node.arguments[0]); throw Error('Nonliteral factual source'); }
const declaration = trees.facts.body.find(row => row.type === 'ExportNamedDeclaration').declaration.declarations[0],facts=literal(declaration.init);
assert.deepEqual(facts.capacities,{teamSlots:4,wildSlots:16,activeSlots:20,teamBody:6,wildBody:16});
assert.deepEqual(facts.scalarSizes,{entity:116,info:520}); assert.equal(facts.pointerEncoding,'symbolic-source-pointers-with-zero-scalar-holes');
assert.equal(facts.floorGenerationStart,10); assert.equal(facts.floorSpriteStart,1024);
assert.equal(facts.maxOperations,13*(facts.capacities.teamSlots+facts.capacities.wildSlots+1),'The exact declared tranche includes13 resets plus at most20 first-free allocations per floor; later lifetime owners need a new variant.');
assert.deepEqual(facts.offsets.entity,{type:0,unk1C:28,unk22:34,slot:36,spawnGeneration:38,spritePointer:100,animTimer:104,anim1:106,anim2:107,direction:108,orientation:109,spriteFlag:111,infoPointer:112});
assert.deepEqual(facts.offsets.info,{species:2,apparentSpecies:4,isNotTeam:6,aiTargetPointer:128,bodyStart:359,bodySize:360});
function audit(source) {
  for (const name of ['prepareSinisterNativeSlotMemory','prepareSinisterNativeFloorReset','allocateSinisterNativeSlot','inspectSinisterNativeSlotMemory']) body(source,name);
  const create=body(source,'prepareSinisterNativeSlotMemory'),entry=body(source,'entryInput'),reset=body(source,'resetFloor'),allocate=body(source,'allocateNative'),inspect=body(source,'inspectSinisterNativeSlotMemory');
  assert(create.includes('entryInput(input)') && !create.includes('clone(input)'),'Complete predecessor retains its canonical plain-data budget before admission.');
  for (const part of ['Object.getPrototypeOf(input)','Reflect.ownKeys(input)','Object.getOwnPropertyDescriptor(input,key)',"Object.hasOwn(descriptor,'value')","key === 'predecessor' ? copyPlainData(descriptor.value) : copyPlainData(descriptor.value,LIMITS)"]) assert(entry.includes(part),part);
  for (const part of ['prepareSinisterRosterMapping(raw.predecessor,catalogs)','prepareSinisterRun','fingerprint(raw.mapping) !== fingerprint(mapping)','fingerprint(raw.run) !== fingerprint(run)','predecessor.idSequence','entryTransaction.id','sessionAllocation.id','entryRevision: operation.commitRevision']) assert(create.includes(part),part);
  assert(create.indexOf('prepareSinisterRosterMapping') < create.indexOf('initialMemory('));
  for (const part of ['runtime === undefined','runtime !== null && runtime.policyId !== ESCORT_GENERAL_POLICY','runtime === null ? createProspectiveNativeGeneralRandom() : clone(runtime.generalRandom)',"kind:runtime === null ? 'prospective-source-seed' : 'retained-escort'"]) assert(create.includes(part),part);
  assert(!create.includes('?.generalRandom') && !create.includes('?? createProspective'),'No missing general state silently becomes a source adoption.');
  assert(source.includes('Array(FACTS.scalarSizes.entity).fill(0)') && source.includes('Array(FACTS.scalarSizes.info).fill(0)'));
  for (const part of ['prepareSinisterFloorSeed(memory.preseed)','fingerprint(floorSeed) !== fingerprint(expected)','writeScalar(cell.entity,FACTS.offsets.entity.type,4,0)','FACTS.floorGenerationStart','FACTS.floorSpriteStart','next.leader = null','next.active = Array(FACTS.capacities.activeSlots).fill(null)']) assert(reset.includes(part),part);
  assert(!reset.includes('cell.info =') && !reset.includes('cell.entity =') && !reset.includes('initialMemory('),'Floor reset preserves all other real slot scalar bytes.');
  for (const part of ['start <= occupancy.length-bodySize','occupancy[start+offset] !== 0','cells.findIndex(cell => readScalar(cell.entity,FACTS.offsets.entity.type,4) === 0)','nativeGeneration = next.generation','(next.generation+1)&0xffff','rebuildActive(next)','allocateId(operation.beforeIdSequence,\'actor\'','cell.conversionSlot = request.side === \'team\' ? request.conversionSlot : null']) assert(allocate.includes(part),part);
  assert(allocate.indexOf("outcome: 'body-capacity'") < allocate.indexOf('allocateId(')); assert(allocate.indexOf("outcome: 'slots-full'") < allocate.indexOf('allocateId('));
  assert(allocate.indexOf('rebuildActive(next)') < allocate.indexOf('writeScalar(cell.entity,FACTS.offsets.entity.spawnGeneration'));
  for (const part of ['new Set(mapping.acquisitions.map(row => row.pokemonId)).size !== 3','expected = initialMemory','for (const saved of actual.operations)','fingerprint(actual) !== fingerprint(expected)']) assert(inspect.includes(part),part);
  const tree=parse(source,{ecmaVersion:'latest',sourceType:'module'});
  for (const node of nodes(tree,node => node.type === 'CallExpression')) { const callee=node.callee; const name=callee.type === 'Identifier' ? callee.name : callee.type === 'MemberExpression' && !callee.computed ? `${callee.object.name}.${callee.property.name}` : null; assert(!['Math.random','Date.now','draw','randomInteger','generateFloor','prepareSinisterAi','createActor'].includes(name),'No unowned actor/AI/geometry/RNG execution'); }
}
audit(sources.owner);
for (const [from,to] of [['start <= occupancy.length-bodySize','start < occupancy.length-bodySize'],['(next.generation+1)&0xffff','next.generation+1'],['fingerprint(raw.mapping) !== fingerprint(mapping)','false'],['cell.conversionSlot = request.side === \'team\' ? request.conversionSlot : null','cell.conversionSlot = slotIndex'],['writeScalar(cell.entity,FACTS.offsets.entity.type,4,0)','cell.info = []'],['fingerprint(actual) !== fingerprint(expected)','false'],['new Set(mapping.acquisitions.map(row => row.pokemonId)).size !== 3','false'],["key === 'predecessor' ? copyPlainData(descriptor.value) : copyPlainData(descriptor.value,LIMITS)",'copyPlainData(descriptor.value,LIMITS)']]) assert.throws(() => audit(sources.owner.replace(from,to)),undefined,from);
const index=process.argv.indexOf('--native-root');
assert(index>=0 && process.argv[index+1],'Pinned native source required.');
const nativeRoot=process.argv[index+1],native=path => execFileSync('git',['show',`${facts.commit}:${path}`],{cwd:nativeRoot,encoding:'utf8',maxBuffer:16*1024*1024});
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:nativeRoot,encoding:'utf8'}).trim(),facts.commit);
const pinned={}; for (const pin of facts.sourceFiles) { pinned[pin.path]=native(pin.path); assert.equal(createHash('sha256').update(pinned[pin.path]).digest('hex'),pin.sha256,pin.path); }
const run=pinned['src/run_dungeon.c'],util=pinned['src/dungeon_util.c'];
assert(run.includes('for (i = 0; i < sizeof(Dungeon); i++)') && run.includes('dungeonPtr[i] = 0;') && run.includes('gDungeon->unk644.unk24 = 10;'));
const floorLoop=run.slice(run.indexOf('while (TRUE)'));
for (const [first,second] of [['sub_804513C();','gDungeon->unk644.unk24 = 10;'],['gDungeon->unk644.unk24 = 10;','sub_80687AC();'],['sub_80687AC();','GenerateFloor();'],['GenerateFloor();','SpawnWildMonsOnFloor();']]) assert(floorLoop.indexOf(first)>=0 && floorLoop.indexOf(first)<floorLoop.indexOf(second),'Actual nonresume per-floor source order: '+first+'→'+second);
assert(pinned['src/dungeon_misc.c'].includes('gDungeon->unk37F0 = 0x400;'));
for (const part of ['gDungeon->teamPokemon[index]->type = ENTITY_NOTHING','gDungeon->wildPokemon[index]->type = ENTITY_NOTHING','gUnknown_202EE70[index] = 0','gUnknown_202EE76[index] = 0','entity->spawnGenID = gDungeon->unk644.unk24++','entity->axObj.info.monster->unk167 = validId','entity->axObj.info.monster->unk168 = bodySize']) assert(util.includes(part),part);
assert(pinned['include/structs/str_dungeon.h'].includes('#define DUNGEON_MAX_WILD_POKEMON 16') && pinned['include/structs/str_dungeon.h'].includes('#define DUNGEON_MAX_WILD_POKEMON_BODY_SIZE 16'));
assert(sources.owner.includes('prepareSinisterRosterMapping') && !sources.owner.includes('SINISTER_WORK_SHAPES'),'Actual new predecessor only; no save/schema activation');
const runImports=trees.owner.body.filter(node => node.type === 'ImportDeclaration' && node.source.value.endsWith('/sinister-run-preparation.js'));
assert.equal(runImports.length,1); assert.equal(runImports[0].source.value,'./sinister-run-preparation.js');
assert.deepEqual(runImports[0].specifiers.map(row => [row.type,row.imported.name,row.local.name]),[['ImportSpecifier','prepareSinisterRun','prepareSinisterRun'],['ImportSpecifier','prepareSinisterFloorSeed','prepareSinisterFloorSeed']]);
assert.equal((sources.types.match(/import\('\.\.\/domain\/gameplay\/sinister-run-preparation\.js'\)/g) ?? []).length,3,'Exactly the new creation, reset and preseed typedef joins are allowed.');
assert(!trees.types.body.some(node => node.type === 'ImportDeclaration'),'The new contract has no runtime run-preparation import.');
async function scanNative(directory) {
  for (const row of await readdir(new URL(game+directory,root),{withFileTypes:true})) {
    const path=game+directory+row.name;
    if (row.isDirectory()) { if (row.name !== 'vendor') await scanNative(directory+row.name+'/'); continue; }
    if (!path.endsWith('.js') || Object.values(files).includes(path)) continue;
    const text=await read(path);
    assert(!text.includes('sinister-native-slots') && !text.includes('sinister-native-slot-facts'),'Only the three exact new unselected slot package files may consume themselves: '+path);
  }
}
await scanNative('src/'); await scanNative('content/');
console.log('Sinister native slot source audit: original4/16/20 capacities, genuine new-run zeroing/run+mapping witness, retained floor reset, first-free body/slot allocation, source16-bit generation wrap, exact scalar/pointer qualification;8 negative source controls plus3 inherited consumer controls; exact previous run/roster checker and run owner authentication; no selected consumer or game/native execution, geometry/actor/Blue activation remains held.');
