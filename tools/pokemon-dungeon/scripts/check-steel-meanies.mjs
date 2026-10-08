// Source/data inspection only. Never import, evaluate or execute a game module.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url);
const read = path => readFile(new URL(path,root),'utf8');
const inspect = async path => parse(await read(`games/pokemon-dungeon-reimagined/${path}`),{ ecmaVersion: 'latest',sourceType: 'module' });
const nodes = ast => ast.body.map(node => node.declaration ?? node);
const binding = (ast,name) => nodes(ast).flatMap(node => node.declarations ?? []).find(node => node.id.name === name)?.init;
const property = (node,name) => node?.properties.find(row => row.key.name === name)?.value;
const literals = node => {
  if (!node || typeof node !== 'object') return [];
  return [ ...(node.type === 'Literal' ? [node.value] : []),...Object.values(node).flatMap(value => Array.isArray(value) ? value.flatMap(literals) : literals(value)) ];
};
const facts = JSON.parse(await read('tools/pokemon-dungeon/content/friends/jobs.json'));
assert.equal(facts.commit,'6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.qualification,'pinned-red-comparative-not-blue-binary-proof');
assert.equal(facts.steelTargetItems.length,13);
const authored = await inspect('content/authored/steel-meanies.js');
assert.equal(binding(authored,'MEANIES_POLICY').value,'browser-meanies-scripted-pidgey-v1');
assert.equal(binding(authored,'POSTING_CURSOR').value,9);
const actorRows = binding(authored,'MEANIES_ACTORS').arguments[0].callee.object.elements;
assert.deepEqual(actorRows.map(row => property(row,'speciesId').value),['pokemon-094','pokemon-023','pokemon-308','pokemon-279']);
// Inspect the literal courtyard and complete maximum four-member staging
// superset. This parses source/data, without calling any authored function.
const team = binding(await inspect('content/authored/team-formation.js'),'TEAM').arguments[0];
const ground = property(team,'ground').elements.map(row => row.value);
const pair = ['hero','partner'].map(name => property(property(team,name),'position'));
const positions = [...pair.map(row => ({ x: property(row,'x').value,z: property(row,'z').value })),
  ...actorRows.map(row => ({ x: property(row,'x').value,z: property(row,'z').value }))];
const friendsSource = await read('games/pokemon-dungeon-reimagined/content/authored/friends.js');
assert.ok(friendsSource.includes('state.selectedPartyIds.slice(2).entries()'));
assert.ok(friendsSource.includes('position: { x: 8 - i, z: 9 }'));
positions.push({ x: 8,z: 9 },{ x: 7,z: 9 });
assert.equal(new Set(positions.map(row => `${row.x}:${row.z}`)).size,positions.length,'Complete party/rival/Pelipper staging positions are unique.');
assert.ok(positions.every(row => ground[row.z]?.[row.x] === '.'),'All staged positions use valid courtyard floor tiles.');
const workSource = await read('games/pokemon-dungeon-reimagined/content/state/steel-meanies-work.js');
const actualUniqueness = workSource.indexOf('new Set(town.placements.map(row => `${row.position.x}:${row.position.z}`)).size === town.placements.length');
assert.ok(actualUniqueness >= 0 && actualUniqueness < workSource.indexOf('const actualTown ='),'Complete actual staging uniqueness precedes stripping story actors.');
const mail = await inspect('src/domain/gameplay/steel-meanies-mail.js');
const posting = nodes(mail).find(node => node.type === 'FunctionDeclaration' && node.id.name === 'postMeaniesMail');
const declarations = posting.body.body.flatMap(node => node.declarations ?? []);
const seed = declarations.find(node => node.id.name === 'seed')?.init;
assert.equal(seed.operator,'&'); assert.equal(seed.right.value,0xffffff);
assert.equal(seed.left.callee.name,'draw');
assert.deepEqual(seed.left.arguments.slice(1).map(node => node.value),[0x100000000,'jobsRewards']);
const source = declarations.find(node => node.id.name === 'source')?.init;
for (const [name,value] of [['kind','generated'],['posting','mailbox'],['missionType',0],['rewardType',4]]) assert.equal(property(source,name).value,value);
assert.equal(property(source,'seed').name,'seed');
assert.equal(property(source,'targetItem').name,'targetItem');
assert.equal(property(source,'itemReward').name,'itemReward');
assert.ok(declarations.findIndex(node => node.id.name === 'seed') < declarations.findIndex(node => node.id.name === 'targetItem'));
assert.ok(declarations.findIndex(node => node.id.name === 'targetItem') < declarations.findIndex(node => node.id.name === 'itemReward'));
const postingFacts = literals(posting);
for (const fact of ['pokemon-016','mt-steel','mt-steel-floor-03','native-mission-difficulty-1']) assert.ok(postingFacts.includes(fact));
// Optional exact comparative source audit; no native implementation is shipped.
const index = process.argv.indexOf('--source');
if (index >= 0) {
  const base = process.argv[index+1]; assert.ok(base);
  for (const [path,sha256] of [
    ['src/code_80958E8.c','00669bfa30bdd675360b2134063ed1528f63f62e06291a4d331c3a12f46a8c9a'],
    ['src/code_803C1B4.c','03f622b11bb45539b0713ef3b2a9756d69f61721cfc47a129a1b86006704805f'],
    ['src/dungeon_cutscene_skarmory.c','0aa469f6a3b258cbdc8fde22cbc4d87c1e247dc1c6699bd755ba8031ffdd0fe6'],
    ['src/data/ground/ground_event_data.h','fbc968f4d9c23c836f5047dd6e894515508d17eeec2c61b9a5e6ba7a9b56af62'],
    ['src/data/ground/ground_data_b01p01a_station.h','ff76c6663176eec864165e6d8c933f4de144f5415c1262535e2842d15632897f'],
  ]) assert.equal(createHash('sha256').update(await readFile(`${base}/${path}`)).digest('hex'),sha256,`Comparative source ${path}`);
}
console.log('Steel/Meanies source facts: distinct valid complete party/rival/Pelipper staging before projection,13-item mask,24-bit seed before target/reward,MONEY1 rescue0/Pidgey/Steel3F and posting cursor; parser/data only, no game execution.');
