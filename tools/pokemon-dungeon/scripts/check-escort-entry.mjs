// Parser/data/AST inspection only; no game or native module import/evaluation.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url),game = 'games/pokemon-dungeon-reimagined/';
const read = path => readFile(new URL(path,root),'utf8');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const factSource = await read(game+'content/authored/escort-entry-facts.js');
assert.equal(digest(factSource),'d6f2f29876de6443fde66f60f3d3172e5b799827558d003473f286287625ac26');
const facts = JSON.parse(factSource.slice(factSource.indexOf('freezeData(')+11,factSource.lastIndexOf(');')));
assert.equal(facts.commit,'6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.qualification,'pinned-red-comparative-not-blue-binary-proof');
assert.equal(facts.sourceFiles.length,10); assert.equal(facts.catalogFiles.length,13);
for (const row of facts.catalogFiles) assert.equal(digest(await readFile(new URL(row.path,root))),row.sha256,`Actual qualified source catalog: ${row.path}`);
assert.deepEqual(facts.prospectiveSeedBytes,[0x36,0x27,0x46,0x01,0xb9,0x48]);
assert.equal(54021+0x36*0x27+0x46*0x01+0xb9*0x48,69517);
assert.deepEqual(facts.hiddenPowerPowers,[2,4,6,7,8,9,10,13,15,17]);
assert.deepEqual([facts.typeCount,facts.hiddenPowerTypeAttempts,facts.fallbackType,facts.joinLocation,facts.joinFloor,facts.temporaryRecruitedId,facts.minimumDungeonIq,facts.maxTeamSlots,facts.maximumBodySize],[18,100,2,74,1,0x55aa,26,4,6]);
assert.equal(facts.clients.length,19);
assert.equal(new Set(facts.clients.map(row => row.nativeSpeciesId)).size,19);
for (const row of facts.clients) {
  assert.equal(row.bodySize,1); assert.equal(row.formId,null);
  assert.equal(row.evidence.stats,'blue-red-stats'); assert.equal(row.evidence.learnset,'blue-red-learning');
  assert.ok(row.moves.length >= 1 && row.moves.length <= 4);
  assert.ok(Object.values(row.stats).every(value => Number.isInteger(value) && value > 0));
  for (const move of row.moves) assert.ok(typeof move.moveId === 'string' && move.basePp > 0);
}
assert.deepEqual(facts.clients.find(row => row.speciesId === 'pokemon-100').moves.map(row => row.nativeMoveId),[128,154]);
assert.equal(facts.clients.find(row => row.speciesId === 'pokemon-100').moves[0].moveId,'move-charge');
const source = await read(game+'src/domain/gameplay/native-escort-entry.js');
const tree = parse(source,{ ecmaVersion: 'latest',sourceType: 'module' });
parse(factSource,{ ecmaVersion: 'latest',sourceType: 'module' });
function nodes(node,predicate) {
  const found = [];
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.type === 'string' && predicate(value)) found.push(value);
    for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(walk); else if (child && typeof child === 'object') walk(child);
  }
  walk(node); return found;
}
const functionNode = name => { const found = nodes(tree,node => node.type === 'FunctionDeclaration' && node.id.name === name); assert.equal(found.length,1); return found[0]; };
const body = name => { const node = functionNode(name); return source.slice(node.start,node.end); };
const hp = body('generateNativeHiddenPower');
assert.ok(hp.indexOf('FACTS.hiddenPowerPowers.length') < hp.indexOf('FACTS.typeCount'));
assert.equal(nodes(functionNode('generateNativeHiddenPower'),node => node.type === 'CallExpression' && node.callee.name === 'nativeGeneralRandomInteger').length,2);
assert.ok(hp.includes('attempt < FACTS.hiddenPowerTypeAttempts') && hp.includes('if (typeDraw.value !== 0)'));
assert.ok(hp.includes('generalRandom = typeDraw.state') && hp.includes('let nativeTypeId = FACTS.fallbackType'));
const entry = body('prepareNativeEscortEntry');
for (const expression of ['validateNativeEscortEntryInput(input)','member === null ? []','rosterConversions = members.map','prepared.takenEscorts.find(job => job.dungeonId === prepared.dungeonId)','row.speciesId === job.client.speciesId','prepared.teamSlots.indexOf(null)','bodySize > FACTS.maximumBodySize','level: 1,totalExperience: 0','currentPp: move.basePp','iqPoints: FACTS.minimumDungeonIq','iqSkillIds: [...DEFAULT_IQ]','heldItem: null','client: { speciesId: job.client.speciesId,formId: job.client.formId },recipient: { speciesId: job.recipient.speciesId,formId: job.recipient.formId }']) assert.ok(entry.includes(expression),expression);
assert.ok(entry.indexOf('validateNativeEscortEntryInput(input)') < entry.indexOf('rosterConversions = members.map'));
assert.ok(entry.indexOf('rosterConversions = members.map') < entry.indexOf('prepared.takenEscorts.find'));
const inputReferences = nodes(functionNode('prepareNativeEscortEntry'),node => node.type === 'Identifier' && node.name === 'input');
assert.equal(inputReferences.length,2,'Only the parameter and whole-graph preflight may touch caller input.');
const preflight = body('validateNativeEscortEntryInput');
for (const expression of ['copyPlainData(input,ENTRY_LIMITS)',"'dungeonId,generalRandom,takenEscorts,teamSlots'",'record.teamSlots.length !== FACTS.maxTeamSlots','record.takenEscorts.length > 8','if (value === null) return null',"entryRecord(value,'bodySize,pokemonId')","instanceId('pokemon',member.pokemonId)","entryRecord(value,'client,dungeonId,jobId,recipient')","instanceId('job',job.jobId)",'entryIdentity(job.client)','entryIdentity(job.recipient)','validateNativeGeneralRandomState(record.generalRandom)']) assert.ok(preflight.includes(expression),expression);
assert.equal(nodes(functionNode('validateNativeEscortEntryInput'),node => node.type === 'CallExpression' && ['generateNativeHiddenPower','nativeGeneralRandomInteger','freezeData'].includes(node.callee.name)).length,0,'Preflight draws/freezes no caller data.');
assert.equal(nodes(functionNode('entryIdentity'),node => node.type === 'SpreadElement').length,0,'Identity output consists of validated scalar fields only.');
assert.ok(body('entryRecord').includes('Object.keys(value).sort().join(\',\') !== keys'));
const plainTree = parse(await read(game+'src/domain/state/plain.js'),{ ecmaVersion: 'latest',sourceType: 'module' });
assert.ok(nodes(plainTree,node => node.type === 'CallExpression' && node.callee.object?.name === 'Object' && node.callee.property?.name === 'getOwnPropertyDescriptor').length > 0,'Detached copier inspects descriptors before values.');
assert.ok(nodes(plainTree,node => node.type === 'ThrowStatement').length >= 10,'Detached copier explicitly rejects unsupported/sparse/accessor/overbudget data.');
assert.ok(entry.indexOf("reason: 'body-size'") < entry.indexOf('hiddenPower = generateNativeHiddenPower(guestBefore)'));
assert.ok(entry.indexOf("reason: 'team-slots-full'") < entry.indexOf('hiddenPower = generateNativeHiddenPower(guestBefore)'));
assert.ok(!entry.includes('supportedMove') && !entry.includes('Math.random') && !entry.includes('allocate('));
assert.ok(!source.includes('context.emit') && !source.includes('state.roster') && !source.includes('state.random'));
assert.ok(!entry.includes('createProspectiveNativeGeneralRandom('),'Entry receives an explicit stream; never implicitly initializes or reseeds it.');
assert.ok(body('createProspectiveNativeGeneralRandom').includes('seedNativeGeneralRandom([a,b,c,d,e,f])'));
console.log('Escort preparation source/catalog/AST audit:10 native pins/13 qualified catalog pins/19 client stats/moves/PP; source-order power/type draws, real first-free4/body6 admission and roster-before-guest conversion. Live guest/save/AI/lifecycle activation remains held; no game execution.');
