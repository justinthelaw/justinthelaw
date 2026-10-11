// Static source/data inspection only; no game or native module evaluation.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url);
const game = 'games/pokemon-dungeon-reimagined/';
const proofPath = game+'content/state/sinister-cache-proof.js';
const read = relative => readFile(new URL(relative,root),'utf8');
const sha = text => createHash('sha256').update(text).digest('hex');
const ast = text => parse(text,{ecmaVersion:'latest',sourceType:'module'});
function nodes(root,predicate) {
  const result = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) result.push(node);
    for (const child of Object.values(node)) if (Array.isArray(child)) child.forEach(visit); else visit(child);
  }
  visit(root); return result;
}
const key = node => node?.name ?? node?.value;
function member(node) {
  if (node?.type === 'Identifier') return node.name;
  if (node?.type === 'ChainExpression') return member(node.expression);
  if (node?.type === 'MemberExpression' && !node.computed) return `${member(node.object)}.${key(node.property)}`;
  return null;
}
const calls = (root,id) => nodes(root,node => node.type === 'CallExpression' && member(node.callee) === id);
const named = (root,id) => {
  const found = nodes(root,node => node.type === 'FunctionDeclaration' && node.id.name === id);
  assert.equal(found.length,1,id); return found[0];
};
const addedSource = await read(proofPath),proof = ast(addedSource);
const accepted = {
  [game+'content/authored/sinister-cache-facts.js']:'29c52b7c3e3506211e683f75483444e9a489723969a5c156b41dd3c4493ff1ff',
  [game+'src/domain/gameplay/sinister-floor-cache.js']:'0366765e31203ebd435dbad934bb7ce1b75cb3a412c1cc95b2e7cc56509beeac',
  'tools/pokemon-dungeon/content/sinister-cache/CONTRACT.md':'e64492f000c511611ccf221575fb9dcc13316914d513e4422522a3a44c275912',
  'tools/pokemon-dungeon/scripts/export-sinister-cache.mjs':'2ae96685b59f240fde0892727a8ed9f3e13fd99cc8176abcee5e8d58e59e672e',
};
for (const [path,digest] of Object.entries(accepted)) assert.equal(sha(await read(path)),digest,`Accepted a75 leaf changed: ${path}`);
const oldGuard = "  assert.ok(!other.includes('sinister-floor-cache') && !other.includes('sinister-cache-facts'),'Unselected cache has no existing consumer: '+path);";
const newGuard = "  assert.ok((path === game+'content/state/sinister-cache-proof.js' || !other.includes('sinister-floor-cache') && !other.includes('sinister-cache-facts')) && !other.includes('sinister-cache-proof'),'Unselected cache allows only its exact unselected receipt proof consumer: '+path);";
const cache64Guard = "  assert.ok((path === game+'content/state/sinister-cache-proof.js' || [game+'src/contracts/sinister-cache64.js',game+'src/domain/gameplay/sinister-cache64.js',game+'content/state/sinister-cache64-proof.js'].includes(path) || !other.includes('sinister-floor-cache') && !other.includes('sinister-cache-facts')) && (path === game+'content/state/sinister-cache64-proof.js' || !other.includes('sinister-cache-proof')),'Unselected cache allows only its exact unselected receipt proof consumer: '+path);";
const inheritedAudit = await read('tools/pokemon-dungeon/scripts/check-sinister-cache.mjs');
assert.equal(inheritedAudit.split(cache64Guard).length,2,'The narrow unselected cache64 exception must appear exactly once.');
assert.equal(sha(inheritedAudit.replace(cache64Guard,newGuard).replace(newGuard,oldGuard)),'1c63d0064a2bab2ab1a6748bbe718a2e45630ed085d84de74bfb88c5c4716c8e','Only the reviewed a75 no-consumer assertion and named cache64 whitelist hunk may change.');
const guardCall = nodes(ast(inheritedAudit),node => node.type === 'CallExpression' && member(node.callee) === 'assert.ok' && node.arguments[1]?.type === 'BinaryExpression' && node.arguments[1].left.value === 'Unselected cache allows only its exact unselected receipt proof consumer: ')[0];
assert(guardCall,'Missing actual inherited consumer gate.');
// Interpret only this tool's finite string/Boolean AST, never game source.
function gate(node,path,other) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'Identifier') return {path,other,game}[node.name];
  if (node.type === 'UnaryExpression' && node.operator === '!') return !gate(node.argument,path,other);
  if (node.type === 'LogicalExpression' && node.operator === '&&') return gate(node.left,path,other) && gate(node.right,path,other);
  if (node.type === 'LogicalExpression' && node.operator === '||') return gate(node.left,path,other) || gate(node.right,path,other);
  if (node.type === 'BinaryExpression' && node.operator === '===') return gate(node.left,path,other) === gate(node.right,path,other);
  if (node.type === 'BinaryExpression' && node.operator === '+') return gate(node.left,path,other)+gate(node.right,path,other);
  if (node.type === 'CallExpression' && key(node.callee.property) === 'includes') return gate(node.callee.object,path,other).includes(gate(node.arguments[0],path,other));
  if (node.type === 'ArrayExpression') return node.elements.map(item => gate(item,path,other));
  throw new TypeError('Consumer gate exceeds its reviewed finite string/Boolean AST.');
}
const proofConsumer = game+'content/state/sinister-cache-proof.js';
assert.equal(gate(guardCall.arguments[0],proofConsumer,"import 'sinister-floor-cache'; import 'sinister-cache-facts';"),true);
for (const path of [game+'content/state/campaign.js',game+'src/domain/gameplay/other.js']) {
  for (const text of ["import 'sinister-floor-cache';","import 'sinister-cache-facts';","import 'sinister-cache-proof';"]) assert.equal(gate(guardCall.arguments[0],path,text),false,'Retain rejection of every other cache/proof consumer.');
  assert.equal(gate(guardCall.arguments[0],path,'export const unrelated = true;'),true);
}
assert.equal(gate(guardCall.arguments[0],proofConsumer,"import 'sinister-cache-proof';"),false);
for (const path of [game+'src/contracts/sinister-cache64.js',game+'src/domain/gameplay/sinister-cache64.js']) {
  assert.equal(gate(guardCall.arguments[0],path,"import 'sinister-floor-cache'; import 'sinister-cache-facts';"),true);
  assert.equal(gate(guardCall.arguments[0],path,"import 'sinister-cache-proof';"),false);
}
assert.equal(gate(guardCall.arguments[0],game+'content/state/sinister-cache64-proof.js',"import 'sinister-cache-proof';"),true);
const factSource = await read(game+'content/authored/sinister-cache-facts.js');
const factLiteral = ast(factSource).body[1].declaration.declarations[0].init.arguments[0];
const facts = JSON.parse(factSource.slice(factLiteral.start,factLiteral.end));
assert.equal(facts.floorFacts.length,13);
assert.deepEqual(facts.floorFacts[12].rows.map(row => row.nativeSpeciesId),[23,94,333,380,421]);
assert.deepEqual(facts.floorFacts.map(floor => floor.rows.reduce((sum,row) => sum+facts.species.find(fact => fact.nativeSpeciesId === row.nativeSpeciesId && fact.level === row.level).replacementDrawCount,0)),[9,9,9,9,9,9,10,10,10,9,9,9,16]);

const exported = proof.body.filter(node => node.type === 'ExportNamedDeclaration');
assert.equal(exported.length,1); assert.equal(exported[0].declaration.id.name,'checkSinisterCacheReceipt');
assert.deepEqual(proof.body.filter(node => node.type === 'ImportDeclaration').map(node => node.source.value),['../authored/sinister-cache-facts.js','../../src/domain/gameplay/sinister-floor-cache.js','../../src/domain/escort-dungeon-rng.js','../../src/domain/state/plain.js','../../src/domain/state/relations.js','../../src/domain/ids.js','./pokemon-rules.js']);
assert(proof.body.every(node => ['ImportDeclaration','VariableDeclaration','FunctionDeclaration','ExportNamedDeclaration'].includes(node.type)),'No activation/module-level work may join this unselected proof.');
assert.deepEqual(proof.body.filter(node => node.type === 'VariableDeclaration').flatMap(node => node.declarations.map(item => item.id.name)),['RECEIPT_LIMITS']);
assert.equal(nodes(proof,node => ['ImportExpression','AwaitExpression'].includes(node.type)).length,0);
assert(nodes(proof,node => node.type === 'NewExpression').every(node => member(node.callee) === 'TypeError'),'Only detached diagnostic errors may be constructed.');
const check = named(proof,'checkSinisterCacheReceipt');
assert.deepEqual(check.params.map(node => node.name),['state','receipt','catalogs']);
assert(addedSource.includes('@param {import(\'../../src/contracts/campaign.js\').CampaignState} state'));
assert(addedSource.includes('@param {unknown} receipt'));
assert(addedSource.includes('@param {import(\'./campaign.js\').CampaignCatalogs} catalogs'));
assert(addedSource.includes('@returns {import(\'../../src/contracts/campaign.js\').RuleCheck}'));
const copied = calls(check,'copyPlainData'); assert.equal(copied.length,1);
assert.deepEqual(copied[0].arguments.map(member),['receipt','RECEIPT_LIMITS']);
const limits = nodes(proof,node => node.type === 'VariableDeclarator' && node.id.name === 'RECEIPT_LIMITS')[0].init.arguments[0];
assert.deepEqual(Object.fromEntries(limits.properties.map(row => [key(row.key),row.value.value])),{maxDepth:8,maxNodes:8192,maxArrayLength:32,maxObjectKeys:32,maxStringLength:160,maxTextLength:131072});
const replay = calls(check,'prepareSinisterFloorCache'); assert.equal(replay.length,1);
assert.equal(member(replay[0].arguments[1]),'escortDungeonRandomInteger');
assert(copied[0].end < replay[0].start);
const input = replay[0].arguments[0]; assert.equal(input.type,'ObjectExpression');
assert.deepEqual(input.properties.map(row => key(row.key)).sort(),['owner','random','rows','source']);
assert.equal(member(input.properties.find(row => key(row.key) === 'random').value),'raw.beforeRandom');
const rows = input.properties.find(row => key(row.key) === 'rows').value;
assert.equal(member(rows.callee),'pool.rows.map');
assert.equal(rows.arguments[0].type,'ArrowFunctionExpression');
const rowObject = rows.arguments[0].body;
assert.deepEqual(rowObject.properties.map(row => key(row.key)).sort(),['cumulativeWeight','level','nativeSpeciesId','order','publishedWeight']);
assert.equal(member(rowObject.properties.find(row => key(row.key) === 'nativeSpeciesId').value),'row.sourceMonsterIndex');
for (const field of ['order','level','publishedWeight','cumulativeWeight']) assert.equal(member(rowObject.properties.find(row => key(row.key) === field).value),`row.${field}`);
assert.equal(calls(check,'catalogs.dungeons.getFloorById').length,1);
assert.equal(calls(check,'catalogs.dungeons.getEncounterPool').length,1);
const exact = calls(check,'exactRecord');
const exactStrings = exact.map(call => call.arguments[1].value);
assert(exactStrings.includes('afterRandom,beforeRandom,browserRandomMapping,encounterPoolId,factsId,kind,nativeTableIndex,owner,replacements,rows,source'));
assert(exactStrings.includes('createdRevision,floorId,generationTransactionId,mapId,sessionId'));
const preparation = ast(await read(game+'src/domain/gameplay/sinister-floor-cache.js'));
const prepared = named(preparation,'prepareSinisterFloorCache');
const rowReturn = nodes(prepared,node => node.type === 'ReturnStatement' && node.argument?.type === 'ObjectExpression')[0].argument;
assert(exactStrings.includes(rowReturn.properties.map(property => key(property.key)).sort().join(',')),'Every row must independently reject extra or missing fields.');
assert(exactStrings.includes('afterRandom,beforeRandom,candidateIndex,rowIndex,slot'));
assert.equal(calls(check,'fingerprint').length,2);
const equality = nodes(check,node => node.type === 'BinaryExpression' && node.operator === '===' && node.left.type === 'CallExpression' && member(node.left.callee) === 'fingerprint');
assert.equal(equality.length,1); assert.deepEqual([member(equality[0].left.arguments[0]),member(equality[0].right.arguments[0])],['raw','replayed']);
const comparisons = nodes(check,node => node.type === 'BinaryExpression');
for (const [left,right] of [['owner.sessionId','session.sessionId'],['owner.mapId','floor.mapId'],['owner.floorId','address.floorId']]) assert(comparisons.some(node => node.operator === '===' && member(node.left) === left && member(node.right) === right),`Actual owner join missing: ${left}`);
for (const [left,op,right] of [['createdRevision','>=','session.entry.entryRevision'],['createdRevision','<=','state.revision']]) assert(comparisons.some(node => node.operator === op && member(node.left) === left && member(node.right) === right),`Real revision range missing: ${left}`);
const allocation = named(proof,'allocatedId');
assert(calls(allocation,'instanceId').length === 1);
assert(nodes(allocation,node => node.type === 'BinaryExpression' && node.operator === '<' && member(node.left) === 'sequence' && member(node.right) === 'next').length === 1);
assert.deepEqual(calls(check,'allocatedId').map(call => call.arguments[1].value).sort(),['map','session','transaction']);
assert.equal(nodes(proof,node => node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression').length,0,'Proof cannot write state, receipt, catalogs or RNG.');
assert.equal(nodes(proof,node => node.type === 'UpdateExpression').length,0);
assert.equal(calls(proof,'allocateId').length,0);
assert.equal(calls(proof,'nextRandom').length,0);
assert.equal(calls(proof,'seedRandom').length,0);
assert.equal(calls(proof,'escortDungeonRandomInteger').length,0,'Only accepted preparation consumes detached replay samples.');
assert.equal(nodes(check,node => node.type === 'MemberExpression' && member(node) === 'state.random').length,0,'Never claim current-stream equality or inferred past draw history.');
assert(calls(check,'r.result').length >= 2 && calls(check,'r.check').length >= 6,'Return bounded diagnostics for invalid input and every raw join.');
console.log('Sinister cache receipt static audit: four exact accepted a75 leaves plus sole narrow unselected-proof consumer assertion; 13 floors / 20 species-level facts / full zero-weight ordered pools; independent bounded exact receipt, actual session/map/floor/pool and revision/allocation ranges, whole detached replacement replay, no current RNG equality/history/allocation/spawn claim. No game/native execution.');
