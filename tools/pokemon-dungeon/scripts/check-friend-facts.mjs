// Static source/data join only: never import or evaluate a game module.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { parse } from 'acorn';
const root = new URL('../../../', import.meta.url);
const read = path => readFile(new URL(path,root),'utf8');
const areas = JSON.parse(await read('tools/pokemon-dungeon/content/friends/areas.json'));
const jobs = JSON.parse(await read('tools/pokemon-dungeon/content/friends/jobs.json'));
for (const facts of [areas,jobs]) {
  assert.equal(facts.commit,'6bcbec4f906938c0243aa2026bcbd41b577bab85');
  assert.equal(facts.qualification,'pinned-red-comparative-not-blue-binary-proof');
  for (const source of facts.sourceFiles) assert.match(source.sha256,/^[a-f0-9]{64}$/);
}
const gameAreas = await read('games/pokemon-dungeon-reimagined/content/authored/friend-area-facts.js');
assert.deepEqual(JSON.parse(gameAreas.slice(gameAreas.indexOf('Object.freeze(')+14,gameAreas.indexOf('].map(')+1)),areas.records);
assert.equal(areas.records.length,58);
assert.equal(areas.records[0].id,null);
assert.equal(areas.records.reduce((sum,row) => sum+row.capacity,0),413);
assert.equal(new Set(areas.records.map(row => row.id)).size,58);
areas.records.forEach((row,index) => { assert.equal(row.nativeId,index); assert.ok(Number.isInteger(row.price) && row.price >= 0); assert.ok(Number.isInteger(row.capacity) && row.capacity >= 0); });
const source = await read('games/pokemon-dungeon-reimagined/content/authored/friend-job-facts.js');
const ast = parse(source,{ecmaVersion:'latest',sourceType:'module'});
const declaration = ast.body.find(row => row.type === 'ExportNamedDeclaration')?.declaration?.declarations[0]?.init.arguments[0];
const property = name => declaration.properties.find(row => row.key?.name === name)?.value;
const literal = node => JSON.parse(source.slice(node.start,node.end).replaceAll("'",'"'));
const steel = literal(property('routes').elements.at(-1));
assert.deepEqual(steel,{nativeDungeonId:2,dungeonId:'mt-steel',floorNumbers:[5,6,7,8,9],excludedFloorNumbers:[9],targetItemIds:jobs.steelTargetItems});
assert.deepEqual(literal(property('eligibleSeenSpecies')),jobs.eligibleSeenCandidates.map(row => row.speciesId));
const symbols = new Map(jobs.eligibleSeenCandidates.map(row => [row.symbol,row.speciesId]));
assert.deepEqual(literal(property('favoriteItems')),jobs.favoriteItemCandidates.map(([species,item]) => [symbols.get(species),item.toLowerCase().replaceAll('_','-')]));
assert.ok(Object.values(jobs.pairCandidates).every(rows => rows.length === 0));
console.log('Friend Area facts: 57 areas + sentinel / capacity413 / Steel5..9 reject9 / 19 seen candidates / six ordered favorite rewrites; static data only.');
