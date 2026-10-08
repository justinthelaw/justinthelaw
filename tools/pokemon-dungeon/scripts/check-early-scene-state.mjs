// Source-only prospective canonical scene joins; no game execution.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const game = new URL('../../../games/pokemon-dungeon-reimagined/',import.meta.url);
const read = path => readFile(new URL(path,game),'utf8');
const ast = text => parse(text,{ecmaVersion:'latest',sourceType:'module'});
const hash = text => createHash('sha256').update(text).digest('hex');
const file = 'src/domain/gameplay/early-campaign-scene-state.js';
const source = await read(file).catch(error => error.code === 'ENOENT' ? '' : Promise.reject(error));
assert.ok(source,'Canonical early scene owner must exist.');
const provenanceText = await readFile(new URL('../content/early-scene-state/sources.json',import.meta.url),'utf8');
assert.equal(hash(provenanceText),'78013d4b387226409f0f2abf81670d45bedda8dd813a5fa85521b1c3c3b58b71');
const provenance = JSON.parse(provenanceText);
assert.equal(provenance.scope,'unselected-early-scene-fixed-meanies-binding-correction');
assert.equal(provenance.qualification,'canonical-browser-boss-binding-not-native-boss-flag-behavior-or-construction-proof');
assert.equal(provenance.originalRecoveredHelperSha256,'7a3099e792ad23cfa859b05d09c9ca5cf16a1a0ec646269761d36d4ec006750a');
assert.equal(hash(source),provenance.qualifiedHelperSha256,'Exact corrected scene mechanics source');
assert.deepEqual(provenance.scenes,['browser-sinister-first-battle','browser-sinister-retry-battle']);
assert.deepEqual(provenance.roles,[{role:'gengar',speciesId:'pokemon-094'},{role:'ekans',speciesId:'pokemon-023'},{role:'medicham',speciesId:'pokemon-308'}]);
for (const pin of provenance.catalogPins) assert.equal(hash(await read(pin.path)),pin.sha256,pin.path);
const boss = JSON.parse(await read('content/campaign/bosses.json')).records.find(row => row.id === 'campaign-boss-sinister-woods-team-meanies');
assert.ok(boss); assert.equal(boss.id,provenance.encounterId); assert.equal(boss.fixedRoomId,provenance.fixedRoomId);
const floor = JSON.parse(await read('content/dungeons/floors-02.json')).records.find(row => row.id === 'sinister-woods-floor-13');
assert.ok(floor); assert.equal(floor.id,provenance.floorId); assert.equal(floor.dungeonId,'sinister-woods'); assert.equal(floor.sectionId,'sinister-woods'); assert.equal(floor.fixedRoomId,boss.fixedRoomId);
const fixed = JSON.parse(await read('content/dungeons/fixed-rooms-01.json')).records.find(row => row.id === boss.fixedRoomId);
assert.ok(fixed); assert.equal(fixed.sourceIndex,2); assert.deepEqual(fixed.sourceFloorReferences,['SinisterWoods:13']);
function body(text,name) {
  const node = ast(text).body.map(row => row.type === 'ExportNamedDeclaration' ? row.declaration : row).find(row => row?.type === 'FunctionDeclaration' && row.id.name === name);
  assert.ok(node,name); return text.slice(node.start,node.end);
}
function audit(text) {
  assert.equal((text.match(/state\.contentRevision !== SINISTER_WORK_REVISION/g) ?? []).length,2);
  const qualify = body(text,'qualifyActors'),readState = body(text,'readEarlyPendingScene'),request = body(text,'requestEarlyCampaignScene'),advance = body(text,'prepareEarlySceneAcknowledgment');
  for (const part of ['copyPlainData(input,LIMITS)','actorAt(session,ref)','actor.placement.mapId !== session.floor.mapId','actor.resources.hp <= 0','new Set(Object.values(refs).map(ref => ref.actorId))','Object.keys(refs).sort()','actualRoles.sort()']) assert.ok(qualify.includes(part),part);
  for (const part of ["['gengar','ekans','medicham'].includes(role)","['browser-sinister-first-battle','browser-sinister-retry-battle'].includes(script.id)","session.dungeonId !== 'sinister-woods'","session.floor.location.kind !== 'boss'",'session.floor.location.encounterId !== SINISTER_MEANIES_ENCOUNTER',"session.floor.location.address.dungeonId !== 'sinister-woods'","session.floor.location.address.sectionId !== 'sinister-woods'","session.floor.location.address.floorId !== 'sinister-woods-floor-13'","ref.side !== 'wild'","actor.binding.kind !== 'boss'",'actor.binding.encounterId !== SINISTER_MEANIES_ENCOUNTER',"actor.affiliation !== 'hostile'",'actor.identity.speciesId !== definition.speciesId','actor.identity.formId !== null']) assert.ok(qualify.includes(part),part);
  assert.ok(text.includes("const SINISTER_MEANIES_ENCOUNTER = 'campaign-boss-sinister-woods-team-meanies';"));
  assert.ok(!qualify.includes("actor.binding.kind !== 'wild'") && !qualify.includes('bossFlag') && !qualify.includes('BEHAVIOR_'),'Canonical fixed encounter is separate from ordinary wild binding and native flags/behavior.');
  for (const part of ["scene.continuation.kind !== 'early-campaign'",'readEarlyCampaignSceneCursor(scene.continuation.cursor,state.revision)','cursor.day !== state.town.day','fingerprint(scene) !== fingerprint(expected)','state.mode !== \'scene\'']) assert.ok(readState.includes(part),part);
  assert.ok(request.indexOf('qualifyActors(') < request.indexOf("allocate(state,'scene-instance')"));
  assert.ok(request.includes('state.pendingScene = prepared') && request.includes('kind: \'scene-paused\''));
  for (const part of ['intent.revision !== state.revision','intent.sceneInstanceId !== scene.sceneInstanceId','intent.sceneId !== scene.sceneId','intent.cursor !== scene.cursor','advanceEarlyCampaignSceneCursor','earlyCampaignSceneReturn',"('return')"]) assert.ok(advance.includes(part),part);
  for (const part of ['context.emit','state.pendingScene =','state.mode =','state.progress','state.random']) assert.ok(!advance.includes(part),'ACK preparation must leave the actual caller to commit the advance or return');
  assert.ok(!text.includes('settleExpedition(') && !text.includes('processLearning(') && !text.includes('state.progress.native'));
}
audit(source);
for (const [from,to] of [['actor.resources.hp <= 0','false'],['cursor.day !== state.town.day','false'],['fingerprint(scene) !== fingerprint(expected)','false'],['intent.revision !== state.revision','false'],['intent.sceneInstanceId !== scene.sceneInstanceId','false'],['intent.cursor !== scene.cursor','false'],["actor.binding.kind !== 'boss'","actor.binding.kind !== 'wild'"],['actor.binding.encounterId !== SINISTER_MEANIES_ENCOUNTER','false'],["session.floor.location.kind !== 'boss'",'false'],["session.floor.location.address.floorId !== 'sinister-woods-floor-13'",'false'],["['gengar','ekans','medicham'].includes(role)",'true'],["['browser-sinister-first-battle','browser-sinister-retry-battle'].includes(script.id)",'true']]) assert.throws(() => audit(source.replace(from,to)),undefined,from);
const schema = await read('src/domain/state/early-campaign-scene-schema.js');
ast(schema);
for (const part of ["from './sinister-work-schema.js'",'EARLY_SCENE_SHAPES','...PRIOR','Continuation: union([...continuation.members','early-campaign','EarlyCampaignSceneCursor',"ref('ActorSlotRef')"]) assert.ok(schema.includes(part),part);
const contract = await read('src/contracts/campaign.js'); assert.ok(contract.includes("kind: 'early-campaign';"));
async function scan(dir) {
  for (const row of await readdir(new URL(dir,game),{withFileTypes:true})) {
    const path = dir+row.name;
    if (row.isDirectory()) { if (row.name !== 'vendor') await scan(path+'/'); continue; }
    if (!path.endsWith('.js')) continue;
    for (const node of ast(await read(path)).body) assert.ok(!/early-campaign-scene-(?:state|schema)\.js$/.test(node.source?.value ?? ''),`Unselected canonical owner ${path}`);
  }
}
await scan('src/'); await scan('content/');
console.log('Early canonical scene source audit: separate prospective continuation/schema; exact stable/numeric cursor, choices, day and live generation bindings; canonical fixed Meanies BossBinding/first-retry/boss-floor joins over three catalog pins; allocation after checks; twelve stale/ownership/binding source regressions; native construction remains with the full raw owner; no selected consumer or game execution.');
