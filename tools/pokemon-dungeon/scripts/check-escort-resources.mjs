// Source/AST inspection only; no game or native module is imported/evaluated.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'acorn';
const root = new URL('../../../games/pokemon-dungeon-reimagined/',import.meta.url);
const read = name => readFile(new URL(name,root),'utf8');
function nodes(value,predicate,out = []) {
  if (!value || typeof value !== 'object') return out;
  if (typeof value.type === 'string' && predicate(value)) out.push(value);
  for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(row => nodes(row,predicate,out)); else nodes(child,predicate,out);
  return out;
}
const source = await read('content/state/escort-resources.js');
const ast = parse(source,{ ecmaVersion: 'latest',sourceType: 'module' });
const functions = name => nodes(ast,node => node.type === 'FunctionDeclaration' && node.id.name === name);
assert.equal(functions('createEscortResourcePolicies').length,1);
assert.deepEqual(functions('createEscortResourcePolicies')[0].params.map(row => row.name),['catalogs','identities','completeRawProof']);
const proven = functions('proven')[0],body = source.slice(proven.start,proven.end);
assert.ok(body.indexOf('escortResourceProof(state,catalogs)') < body.indexOf('completeRawProof(state)'));
assert.ok(body.includes('if (!raw.ok) return raw;') && body.includes('complete.ok ? run() : complete'));
const factory = functions('createEscortResourcePolicies')[0];
const returned = factory.body.body.find(node => node.type === 'ReturnStatement').argument;
assert.equal(returned.type,'ObjectExpression');
for (const field of returned.properties) {
  const name = field.key.name;
  if (name === 'options') { assert.equal(field.value.name,'validateCampaignOptions'); continue; }
  assert.equal(nodes(field.value,node => node.type === 'CallExpression' && node.callee.name === 'proven').length,1,`${name} independently repeats raw proof`);
}
for (const forbidden of ['learningPrerequisite(',"contentRevision: BRONZE_JOBS_REVISION",'createBronzeContent(','createMoveLearningContent(']) assert.ok(!source.includes(forbidden),forbidden);
for (const required of ['pendingSpecialSwap(session,catalogs)?.original',"origin.outcome === 'fainting'",'session.learningWork?.origin','state.session !== session','session.actors[actor.actorId] !== actor','forgottenProblem(session,catalogs,state.revision,state.roster)','createProfilePolicy(catalogs)','createEconomyPolicy(catalogs)','createItemPolicy(catalogs)',"job.goal.recipient.identity",'baseline.projectedHiddenPower === null']) assert.ok(source.includes(required),required);
const floor = await read('content/state/escort-floor.js'); parse(floor,{ ecmaVersion: 'latest',sourceType: 'module' });
assert.ok(floor.includes("session.purpose.kind === 'ordinary' && destination.kind === 'town'"));
for (const required of ['factual.id === floors.at(-1)','destination.mapDefinitionId === TOWN.post',"destination.entryId === 'ordinary-return'",'canEnter(navActor, floor, position, context)','!occupied.has(key)','floor.weather.contributions']) assert.ok(floor.includes(required),required);
const stun = await read('content/state/escort-stun-seed.js'); parse(stun,{ ecmaVersion: 'latest',sourceType: 'module' });
assert.ok(stun.includes('state.session?.sessionId !== session.sessionId') && stun.includes('ownsEscortSourceRef(state,') && stun.includes('ref.mapId === session.floor.mapId'));
assert.ok(!stun.includes('state.session !== session'),'Retired-source session views retain canonical guest generation ownership.');
assert.ok((await read('content/state/escort-campaign.js')).includes('createEscortResourcePolicies(runtimeCatalogs,identities,complete)'),'Live factory composes the required complete raw proof.');
console.log('Direct escort resource AST audit PASS: ten state callbacks independently preflight raw and complete ownership; actual resource/floor/condition/casualty/swap owners; no game execution.');
