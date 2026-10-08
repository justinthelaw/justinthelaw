// Parser/source only: never import, execute, simulate or replay game modules.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { parse } from 'acorn';
const game = new URL('../../../games/pokemon-dungeon-reimagined/',import.meta.url);
const path = 'content/state/sinister-heritage.js';
const read = name => readFile(new URL(name,game),'utf8');
const text = await read(path),prior = await read('content/state/escort-heritage.js');
const parseSource = source => parse(source,{ecmaVersion:'latest',sourceType:'module'});
function body(source,name) {
  const node = parseSource(source).body.map(row => row.type === 'ExportNamedDeclaration' ? row.declaration : row).find(row => row?.type === 'FunctionDeclaration' && row.id.name === name);
  assert.ok(node,name); return source.slice(node.start,node.end);
}
for (const name of ['checkAreas','sceneChain','grantAt','checkSteel']) assert.equal(body(text,name),body(prior,name),`Exact actual-state historical ${name}`);
function audit(source) {
  const tree = parseSource(source),fn = body(source,'checkCompletedWork');
  for (const part of ["f.phase !== 'sinister-ready'",'same(p.recruitedHistory.slice(0,3),',"tiny?.clearCount === 1",'bounded(work.startedRevision,1,state.revision)','f.priorExpeditions === steel.priorExpeditions+steel.attempts','checkCompletedWork(r,state)']) assert.ok(source.includes(part),part);
  for (const part of ['claimRevision(job) < request.lastRevision','claimRevision(job) < morning.firstRevision','claimRevision(job) > encounter.lastRevision','claimRevision(job) < secondMorning.firstRevision','old.length === f.priorJobs','old.length+first.length+second.length === past.length','finalBatch(r,first,3,4)','finalBatch(r,second,2,5)','morning.firstDay-f.startedDay-1','request.lastDay-f.startedDay-1','p.statistics.expeditions-f.priorExpeditions','secondRuns*5','sum+job.reward.rankPoints','job.phase.failedRevision < request.lastRevision','receipt.revision,morning.lastRevision+POSTING_CURSOR+1,encounter.lastRevision-1','unlock.acquiredRevision === request.lastRevision','unlock.acquiredDay === request.lastDay']) assert.ok(fn.includes(part),part);
  assert.ok(!/checkEscortHeritage\(|checkEscortWorkHistory\(|contentRevision\s*=|\.contentRevision:/.test(source),'No predecessor composite or retagged view');
  assert.ok(!source.includes('tiny.firstClearRevision ==='),'Preserve inherited weak Tiny clear join');
  assert.ok(!source.includes('work.startedRevision <= p.seenScenes'),'Preserve late authenticated work initialization');
  const visit = node => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
      const target = node.left ?? node.argument;
      assert.equal(target.type,'Identifier','Historical proof never assigns through an input owner');
    }
    if (node.type === 'ImportDeclaration') assert.ok(!/campaign\.js$|work-history\.js$/.test(node.source.value),'No full prior policy import');
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
  };
  visit(tree);
}
audit(text);
for (const [from,to] of [['finalBatch(r,second,2,5)','finalBatch(r,second,2,4)'],['claimRevision(job) < request.lastRevision','claimRevision(job) <= state.revision'],['request.lastDay-f.startedDay-1','state.town.day-f.startedDay-1'],['same(p.recruitedHistory.slice(0,3),','same(p.recruitedHistory,'],['unlock.acquiredRevision === request.lastRevision','unlock.acquiredRevision <= state.revision']]) {
  assert.notEqual(text.replace(from,to),text);
  assert.throws(() => audit(text.replace(from,to)),undefined,`Reject source regression ${from}`);
}
async function scan(dir) {
  for (const row of await readdir(new URL(dir,game),{withFileTypes:true})) {
    const name = dir+row.name;
    if (row.isDirectory()) { if (row.name !== 'vendor') await scan(name+'/'); continue; }
    if (!name.endsWith('.js')) continue;
    for (const node of parseSource(await read(name)).body) assert.ok(!/sinister-heritage\.js$/.test(node.source?.value ?? ''),`Unselected historical owner has a consumer: ${name}`);
  }
}
await scan('src/'); await scan('content/');
console.log('Sinister heritage source audit: exact four retained receipt bodies; genuine historical claim/day/request joins; weak legacy qualification; five static negative cases; no mutation, projected predecessor, selected consumer or game execution. Whole successor factory remains separate.');
