// Static data/AST inspection only. Never import or execute a game module.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const game = new URL('../../../games/pokemon-dungeon-reimagined/',import.meta.url);
const read = path => readFile(new URL(path,game),'utf8');
const ast = text => parse(text,{ecmaVersion:'latest',sourceType:'module'});
const path = 'src/domain/gameplay/early-campaign-scene-cursor.js';
const source = await read(path).catch(error => error.code === 'ENOENT' ? '' : Promise.reject(error));
assert.ok(source,'The bounded original scene cursor owner must exist.');
function body(text,name) {
  const node = ast(text).body.map(row => row.type === 'ExportNamedDeclaration' ? row.declaration : row).find(row => row?.type === 'FunctionDeclaration' && row.id.name === name);
  assert.ok(node,name); return text.slice(node.start,node.end);
}
function audit(text) {
  const readCursor = body(text,'readEarlyCampaignSceneCursor'),advance = body(text,'advanceEarlyCampaignSceneCursor'),begin = body(text,'beginEarlyCampaignSceneCursor');
  for (const part of ['copyPlainData(input,LIMITS)',"'acknowledgments,day,entryRevision,kind,sceneId,sceneInstanceId,stageId'",'cursor.acknowledgments.length > script.stages.length','let stageId = script.firstStage','ack.stageId !== stageId','ack.revision <= lastRevision','ack.revision > currentRevision','stageId = nextStage(script,stageId,ack.optionId)','cursor.stageId !== stageId']) assert.ok(readCursor.includes(part),part);
  for (const part of ['readEarlyCampaignSceneCursor(input,currentRevision)','currentRevision >= Number.MAX_SAFE_INTEGER','cursor.stageId === null','revision: currentRevision+1','nextStage(script,cursor.stageId,optionId)','freezeData']) assert.ok(advance.includes(part),part);
  for (const part of ["'day,entryRevision,sceneId,sceneInstanceId'",'instanceId(\'scene-instance\'','stageId: script.firstStage','acknowledgments: []']) assert.ok(begin.includes(part),part);
  assert.ok(text.includes('freezeData(copyPlainData([...SINISTER_SCENES.scenes,...SILENT_CHASM_SCENES.scenes]'));
  assert.ok(text.includes('stage.choices.length') && text.includes('optionId !== null') && text.includes('option => option.id === optionId'));
  for (const forbidden of ['context.emit','state.progress','state.session','allocate(','settleExpedition(','processLearning(','Math.random','Date.']) assert.ok(!text.includes(forbidden),forbidden);
  assert.ok(body(text,'earlyCampaignSceneReturn').includes('cursor.stageId !== null'));
  assert.ok(body(text,'earlyCampaignSceneReturn').includes('returnOwner: script.returnOwner'));
}
audit(source);
for (const [from,to] of [['ack.stageId !== stageId','false'],['ack.revision <= lastRevision','ack.revision < lastRevision'],['cursor.stageId !== stageId','false'],['optionId !== null','false'],['cursor.stageId === null','false'],['currentRevision >= Number.MAX_SAFE_INTEGER','false']]) assert.throws(() => audit(source.replace(from,to)),undefined,from);
// These are the exact accepted original authoring bodies, including all options.
const pins = {
  "content/authored/campaign-scene-package.js": "2e85e9c9149cbe4ae0952f769ad444159627b3bd9c42dace92b15bb5010faaeb",
  "content/authored/sinister-scenes.js": "bd51763d5f6410444176b747e2c54eed8c2c15773e7d90bdeb66f9d67efcf70f",
  "content/authored/silent-chasm-scenes.js": "945be7a501cc0569b76fca3ae009d041fa99d40f273161b28305e002fa60f027"
};
const packages = [];
for (const [path,pin] of Object.entries(pins)) {
  const text = await read(path); assert.equal(createHash('sha256').update(text).digest('hex'),pin,path);
  const declaration = ast(text).body.find(row => row.type === 'ExportNamedDeclaration' && row.declaration?.type === 'VariableDeclaration');
  assert.ok(declaration); const value = declaration.declaration.declarations[0].init;
  const literal = JSON.parse(text.slice(value.start,value.end));
  if (literal.scenes) packages.push(literal);
}
const scenes = packages.flatMap(row => row.scenes);
assert.equal(scenes.length,16); assert.equal(scenes.flatMap(row => row.stages).length,55);
let paths = 0,maxPath = 0;
for (const scene of scenes) {
  const stages = new Map(scene.stages.map(row => [row.id,row]));
  assert.equal(stages.size,scene.stages.length);
  function visit(id,trail,options) {
    if (id === null) { paths++; maxPath = Math.max(maxPath,trail.length); return; }
    assert.ok(stages.has(id)); assert.ok(!trail.includes(id),'Only the authored acyclic graph is accepted');
    const stage = stages.get(id),next = [...trail,id];
    if (stage.choices.length) { assert.equal(stage.next,null); for (const option of stage.choices) { assert.ok(!options.includes(option.id)); visit(option.next,next,[...options,option.id]); } }
    else visit(stage.next,next,options);
  }
  visit(scene.firstStage,[],[]);
}
assert.equal(paths,20); assert.equal(maxPath,9);
async function scan(dir) {
  for (const row of await readdir(new URL(dir,game),{withFileTypes:true})) {
    const file = dir+row.name;
    if (row.isDirectory()) { if (row.name !== 'vendor') await scan(file+'/'); continue; }
    if (!file.endsWith('.js')) continue;
    for (const node of ast(await read(file)).body) assert.ok(!/early-campaign-scene-cursor\.js$/.test(node.source?.value ?? '') || file === 'src/domain/gameplay/early-campaign-scene-state.js',`Unselected cursor ${file}`);
  }
}
await scan('src/'); await scan('content/');
console.log('Early scene cursor: exact three authored pins;16 scenes/55 stages/20 terminal paths; stable-ID bounded acknowledgments, strict revisions and exact choice branches; six rejected source mutations; no caller/return effects or game execution.');
