// Static AST/Git/text audit only; D05 forbids game/native execution.
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'acorn';
const root=new URL('../../../',import.meta.url),game='games/pokemon-dungeon-reimagined/';
const read=path => readFile(new URL(path,root),'utf8');
const hash=text => createHash('sha256').update(text).digest('hex');
const runtime=game+'src/domain/gameplay/sinister-construction.js',contract=game+'src/contracts/sinister-construction.js';
const source=await read(runtime),facts=JSON.parse(await read('tools/pokemon-dungeon/content/sinister-construction/sources.json'));
function nodes(value,predicate,result=[]) { if (!value || typeof value !== 'object') return result; if (predicate(value)) result.push(value); for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(row => nodes(row,predicate,result)); else nodes(child,predicate,result); return result; }
function body(source,name) { const ast=parse(source,{ecmaVersion:'latest',sourceType:'module'}),matches=nodes(ast,node => node.type === 'FunctionDeclaration' && node.id.name === name); assert.equal(matches.length,1,name); return source.slice(matches[0].start,matches[0].end); }
function needs(source,parts) { for (const part of parts) assert(source.includes(part),part); }
function audit(source) {
  const tree=parse(source,{ecmaVersion:'latest',sourceType:'module'}),create=body(source,'createSinisterConstruction'),zero=body(source,'zeroGeometry'),authority=body(source,'entryOperation');
  const expectedImports={
    './sinister-roster-mapping.js':['prepareSinisterRosterMapping'],
    './sinister-run-preparation.js':['prepareSinisterRun','prepareSinisterFloorSeed'],
    './sinister-native-slots.js':['prepareSinisterNativeSlotMemory','prepareSinisterNativeFloorReset'],
    './native-escort-entry.js':['createProspectiveNativeGeneralRandom'],
    './escort-entry-owner.js':['ESCORT_GENERAL_POLICY'],
    '../state/plain.js':['copyPlainData'],'../state/validate.js':['freezeData'],'../state/relations.js':['fingerprint'],'../ids.js':['allocateId','instanceId'],
  };
  assert.deepEqual(Object.fromEntries(tree.body.filter(node => node.type === 'ImportDeclaration').map(node => [node.source.value,node.specifiers.map(row => row.imported.name)])),expectedImports);
  assert.deepEqual(tree.body.filter(node => node.type === 'ExportNamedDeclaration').map(node => node.declaration.id.name),['createSinisterConstruction']);
  needs(zero,['width:56,height:32,roomCount:0','terrainFlags:0,spawnOrVisibilityFlags:0,room:0','walkableNeighborFlags:[0,0,0,0],monster:null,object:null','bottomRightX:0,bottomRightZ:0,topLeftX:0,topLeftZ:0,pixelBounds:[0,0,0,0]','count:0,positions:Array.from({length:32}']);
  needs(authority,['copyPlainData(authority,AUTHORITY_LIMITS)','raw.commitRevision !== predecessor.revision+1','fingerprint(raw.beforeIdSequence) !== fingerprint(predecessor.idSequence)',"instanceId('transaction',raw.transactionId)"]);
  needs(create,['copyPlainData(predecessor)','prepareSinisterRosterMapping(before,catalogs)','entryOperation(authority,before)',"allocateId(before.idSequence,'transaction',new Set())","allocateId(transaction.sequence,'session',new Set())",'transaction.id !== operation.transactionId','runtime === undefined','runtime === null ? createProspectiveNativeGeneralRandom() : runtime.generalRandom','prepareSinisterRun','prepareSinisterNativeSlotMemory({predecessor:before,mapping,run,operation},catalogs,operation)','geometry:zeroGeometry(),journal:[]','disposed || expected !== current || current.phase !== \'new-run\'','prepareSinisterFloorSeed(current.memory.preseed)',"allocateId(current.memory.idSequence,'map',new Set())",'beforeIdSequence:map.sequence','prepareSinisterNativeFloorReset','geometry:current.geometry,journal:[receipt]','current=next; return current;','dispose() { disposed=true; }']);
  assert(create.indexOf('prepareSinisterRosterMapping') < create.indexOf('const runtime='));
  assert(create.indexOf('prepareSinisterNativeSlotMemory') < create.indexOf('geometry:zeroGeometry()'));
  assert(create.indexOf('prepareSinisterNativeFloorReset') < create.indexOf('current=next'));
  const returned=nodes(tree,node => node.type === 'Property' && node.method).map(node => node.key.name);
  assert.deepEqual(returned,['getSnapshot','beginFirstFloor','dispose'],'Only private fresh continuation is exposed; no raw restore/setter.');
  assert.equal((source.match(/zeroGeometry\(\)/g) ?? []).length,2,'Only declaration and actual new-run initialization zero geometry.');
  assert(!/Math\.random|seedRandom|randomInteger|generateNativeHiddenPower\(|prepareSinisterAi\(|prepareSinisterNativeGeometry\(|allocateSinisterNativeSlot\(/.test(source),'Unqualified downstream construction remains unselected.');
}
audit(source); parse(await read(contract),{ecmaVersion:'latest',sourceType:'module'});
for (const [from,to] of [
  ['copyPlainData(predecessor)','predecessor'],
  ['raw.commitRevision !== predecessor.revision+1','false'],
  ['transaction.id !== operation.transactionId','false'],
  ['runtime === null ? createProspectiveNativeGeneralRandom() : runtime.generalRandom','createProspectiveNativeGeneralRandom()'],
  ['room:0,unk8:0','room:255,unk8:0'],
  ['expected !== current','false'],
  ["current.phase !== 'new-run'",'false'],
  ['beforeIdSequence:map.sequence','beforeIdSequence:current.memory.idSequence'],
  ['geometry:current.geometry,journal:[receipt]','geometry:zeroGeometry(),journal:[receipt]'],
]) { assert(source.includes(from),from); assert.throws(() => audit(source.replace(from,to)),undefined,from); }
for (const pin of facts.dependencies) assert.equal(hash(await read(game+pin.path)),pin.sha256,pin.path);
// Exact named consumer additions are removed before comparison to each original
// complete audit. Their original provenance/negative controls stay unchanged.
const inherited=JSON.parse(await read('tools/pokemon-dungeon/content/sinister-construction/inherited-audits.json'));
for (const pin of inherited) {
  let text=await read(pin.path);
  text=text.replaceAll("['src/domain/gameplay/sinister-native-slots.js','src/domain/gameplay/sinister-construction.js'].includes(path)","path === 'src/domain/gameplay/sinister-native-slots.js'");
  text=text.replace(" || [game+'src/domain/gameplay/sinister-construction.js',game+'src/contracts/sinister-construction.js'].includes(path)",'');
  text=text.replace(" && ![game+'src/domain/gameplay/sinister-construction.js',game+'src/contracts/sinister-construction.js'].includes(path)",'');
  assert.equal(hash(text),pin.sha256,'Exact inherited audit outside named construction consumers: '+pin.path);
}
const option=process.argv.indexOf('--native-root'); assert(option >= 0 && process.argv[option+1],'Pinned native source required.');
const nativeRoot=process.argv[option+1]; assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:nativeRoot,encoding:'utf8'}).trim(),facts.nativeCommit);
for (const pin of facts.nativeFiles) {
  const native=execFileSync('git',['show',`${facts.nativeCommit}:${pin.path}`],{cwd:nativeRoot,encoding:'utf8',maxBuffer:4*1024*1024}); assert.equal(hash(native),pin.sha256,pin.path);
  needs(native,['for (i = 0; i < sizeof(Dungeon); i++)','dungeonPtr[i] = 0;','gDungeon->unk644.unk3C = GenerateDungeonRNGSeed();']);
  assert(native.indexOf('dungeonPtr[i] = 0;') < native.indexOf('while (TRUE)'),'Whole-Dungeon zeroes belong only to actual new-run initialization.');
}
async function noConsumers(directory) { for (const row of await readdir(new URL(game+directory,root),{withFileTypes:true})) { const path=game+directory+row.name; if (row.isDirectory()) { if (row.name !== 'vendor') await noConsumers(directory+row.name+'/'); } else if (path.endsWith('.js') && path !== runtime && path !== contract) assert(!(await read(path)).includes('sinister-construction'),'Unaudited selected constructor consumer: '+path); } }
await noConsumers('src/'); await noConsumers('content/');
console.log('Sinister private construction prefix PASS: actual admitted predecessor, source roster/run/zero memory, private immutable identity token, one real map+seed+floor slot projection,9 negative controls,10 unchanged runtime dependencies and4 exact inherited audits; no raw journal adoption or game/native execution. Actor/layout/AI/route composition remains open.');
