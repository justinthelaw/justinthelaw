// Parse source and deliberate source mutations only. Never import/evaluate game code.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'acorn';

const game = new URL('../../../games/pokemon-dungeon-reimagined/',import.meta.url);
const read = path => readFile(new URL(path,game),'utf8');
const ast = source => parse(source,{ ecmaVersion: 'latest',sourceType: 'module' });
function nodes(value,predicate,result = []) {
  if (!value || typeof value !== 'object') return result;
  if (typeof value.type === 'string' && predicate(value)) result.push(value);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach(row => nodes(row,predicate,result));
    else nodes(child,predicate,result);
  }
  return result;
}
function fn(tree,name) {
  const found = nodes(tree,node => node.type === 'FunctionDeclaration' && node.id.name === name);
  assert.equal(found.length,1,`One ${name} owner.`);
  return found[0];
}
function plain(node) {
  if (Array.isArray(node)) return node.map(plain);
  if (!node || typeof node !== 'object') return node;
  return Object.fromEntries(Object.entries(node).filter(([key]) => !['start','end','raw'].includes(key)).map(([key,value]) => [key,plain(value)]));
}
function sameStatement(node,source,message) {
  const statement = ast(`function scope() { while (true) { ${source} } }`).body[0].body.body[0].body.body[0];
  assert.deepEqual(plain(node),plain(statement),message);
}
const calls = (node,name) => nodes(node,row => row.type === 'CallExpression' && row.callee.type === 'Identifier' && row.callee.name === name).length;

function audit(source) {
  const tree = ast(source);
  const declared = tree.body.filter(node => node.type === 'VariableDeclaration').flatMap(node => node.declarations);
  assert.equal(declared.length,1,'Only the private successful-shape identity set has module lifetime.');
  assert.equal(declared[0].id.name,'frozenShapeInputs','A private positive shape proof cache is required.');
  assert.equal(declared[0].init.type,'NewExpression');
  assert.equal(declared[0].init.callee.name,'WeakSet');
  assert.equal(declared[0].init.arguments.length,0);
  assert.deepEqual(tree.body.filter(node => node.type.startsWith('Export')).map(node => node.declaration?.id?.name),['escortShapeProblem'],'The receipt and eligibility helper are never exported.');
  assert.deepEqual(tree.body.filter(node => node.type === 'ImportDeclaration').map(node => node.source.value),['./plain.js','./structure.js','./escort-work-schema.js']);

  const owner = fn(tree,'escortShapeProblem'),body = owner.body.body;
  assert.equal(body.length,7,'The public boundary has only cache hit, original preflight and positive insertion paths.');
  sameStatement(body[0],"if (input && typeof input === 'object' && frozenShapeInputs.has(input)) return null;",'Only an exact previously proved object identity skips structural work.');
  assert.equal(body[1].kind,'let'); assert.equal(body[1].declarations[0].id.name,'data');
  assert.equal(body[2].type,'TryStatement');
  sameStatement(body[2].block.body[0],'data = copyPlainData(input);','Every cache miss retains bounded detached plain-data admission.');
  assert.equal(body[2].block.body.length,1);
  assert.equal(body[2].handler.body.body.length,1);
  assert.equal(body[2].handler.body.body[0].type,'ReturnStatement');
  assert.equal(typeof body[2].handler.body.body[0].argument.value,'string','Copy failures stay failures and never become cache entries.');
  sameStatement(body[3],'const issues = [];','Diagnostics are per call.');
  sameStatement(body[4],"if (!inspectShape(data,'CampaignStateWithFieldMoves',issues,undefined,'',ESCORT_WORK_SHAPES)) return 'Prospective escort owner requires its exact complete raw shape.';",'Exact full-shape failure returns before any receipt is recorded.');
  sameStatement(body[5],"if (input && typeof input === 'object' && deeplyFrozen(input)) frozenShapeInputs.add(input);",'Only complete deep immutability can record the exact input after shape success.');
  sameStatement(body[6],'return null;','Successful uncached mutable inputs retain ordinary admission.');

  const helper = fn(tree,'deeplyFrozen'),steps = helper.body.body;
  assert.equal(steps.length,4,'Deep immutability requires a worklist, visited set, exhaustive loop and success exit.');
  sameStatement(steps[0],'const pending = [input];');
  sameStatement(steps[1],'const visited = new WeakSet();');
  assert.equal(steps[2].type,'WhileStatement');
  assert.deepEqual(plain(steps[2].test),plain(ast('pending.length;').body[0].expression));
  const loop = steps[2].body.body;
  assert.equal(loop.length,5);
  sameStatement(loop[0],'const value = pending.pop();');
  sameStatement(loop[1],"if (!value || typeof value !== 'object' || visited.has(value)) continue;");
  sameStatement(loop[2],'if (!Object.isFrozen(value)) return false;','A mutable descendant cannot produce a receipt.');
  sameStatement(loop[3],'visited.add(value);');
  sameStatement(loop[4],"for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) { if (!Object.hasOwn(descriptor,'value')) return false; if (descriptor.value && typeof descriptor.value === 'object') pending.push(descriptor.value); }",'Inspect only descriptors, reject accessors and visit every object child.');
  sameStatement(steps[3],'return true;','Success requires exhausting all reachable objects.');
  assert.equal(nodes(tree,node => node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.object.name === 'frozenShapeInputs').length,2,'No alternate receipt writer, clearing path or alias API exists.');
  assert.equal(nodes(tree,node => node.type === 'Identifier' && node.name === 'frozenShapeInputs').length,3,'The private receipt set is not exposed or aliased.');
  assert.equal(nodes(tree,node => node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression').length,0,'The proof never mutates input objects.');
  assert.equal(nodes(tree,node => node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && ['freeze','seal','preventExtensions'].includes(node.callee.property.name)).length,0,'Eligibility must observe immutability, never manufacture it.');
}

const source = await read('src/domain/state/escort-shape-proof.js');
audit(source);
const mutations = [
  ['shallow root only','deeplyFrozen(input))','Object.isFrozen(input))'],
  ['revision alias','frozenShapeInputs.has(input)','frozenShapeInputs.has(input.revision)'],
  ['failed shape accepted','if (!inspectShape(','if (inspectShape('],
  ['mutable descendant accepted','if (!Object.isFrozen(value)) return false;','if (!Object.isFrozen(value)) return true;'],
  ['child traversal omitted','pending.push(descriptor.value)','pending.push(null)'],
  ['accessor accepted',"if (!Object.hasOwn(descriptor,'value')) return false;", "if (!Object.hasOwn(descriptor,'value')) continue;"],
  ['value access executes getters','Object.getOwnPropertyDescriptors(value)','Object.values(value)'],
  ['receipt exposed','const frozenShapeInputs','export const frozenShapeInputs'],
  ['caller frozen','deeplyFrozen(input))','Object.freeze(input))'],
  ['receipt key replaced','frozenShapeInputs.add(input)','frozenShapeInputs.add(data)'],
];
for (const [label,before,after] of mutations) {
  assert(source.includes(before),`Mutation target exists: ${label}`);
  assert.throws(() => audit(source.replace(before,after)),undefined,`Audit rejects ${label}.`);
}

// The cache is structural only: every independent semantic owner still executes.
const resources = ast(await read('content/state/escort-resources.js'));
const campaign = ast(await read('content/state/escort-campaign.js'));
const learning = ast(await read('src/domain/state/escort-learning-proof.js'));
const entry = ast(await read('src/domain/state/escort-entry-proof.js'));
assert.equal(calls(fn(entry,'escortEntryProblem'),'escortShapeProblem'),1);
assert.equal(calls(fn(learning,'learningWorkProblem'),'escortEntryProblem'),1);
assert.equal(calls(fn(learning,'learningProblem'),'escortEntryProblem'),1);
assert.equal(calls(fn(learning,'learningProblem'),'learningWorkProblem'),1);
assert.equal(calls(fn(resources,'escortResourceProof'),'escortEntryProblem'),1);
assert.equal(calls(fn(resources,'escortResourceProof'),'learningProblem'),1);
assert.equal(calls(fn(resources,'proven'),'escortResourceProof'),1);
assert.equal(calls(fn(resources,'proven'),'completeRawProof'),1);
assert.equal(calls(fn(campaign,'complete'),'escortResourceProof'),1);

// The imported structural contract is recursively frozen at initialization.
const registry = await read('src/domain/state/escort-work-schema.js');
const registryTree = ast(registry),freeze = fn(registryTree,'freeze');
assert(registry.includes('export const ESCORT_WORK_SHAPES = Object.freeze('));
assert.equal(calls(freeze,'freeze'),1);
assert(registry.slice(freeze.start,freeze.end).includes('Object.freeze(value)'));
sameStatement(registryTree.body.at(-1),'Object.values(ESCORT_WORK_SHAPES).forEach(freeze);');
console.log(`Escort shape cache source audit PASS: private positive exact identity, all-descendant immutability, unchanged semantic proof calls and ${mutations.length} rejected source mutations. Per resource callback: six shape requests retain one successful frozen-input preflight per identity; no game execution or timing claim.`);
