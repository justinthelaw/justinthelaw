import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../games/pokemon-dungeon-reimagined/', import.meta.url));
const readJson = async filename => JSON.parse(await readFile(path.join(root, filename), 'utf8'));
const distribution = await readJson('distribution.json');
const assets = await readJson('assets/blue/manifest.json');
const data = await readJson('content/blue-opening.json');
const profiles = await readJson('content/onboarding/profiles.json');
const expectedStarters = profiles.records.map(record => record.speciesId).sort();
assert.deepEqual([...data.starterIds].sort(), expectedStarters, 'All 16 original starter profiles must be retained');
assert.equal(data.floors.length, 3, 'The playable dungeon has exactly three ordinary floors');
for (const profile of profiles.records) {
  assert.deepEqual(data.species[profile.speciesId].starting, profile.firstPlayable,
    `Opening stats and moves differ: ${profile.speciesId}`);
}
const expectedSprites = new Set([...data.starterIds, ...data.floors.flatMap(floor => floor.encounters.map(row => row.speciesId)),
  'pokemon-010', 'pokemon-012', 'pokemon-279']);
assert.deepEqual(new Set(assets.records.map(record => record.speciesId)), expectedSprites, 'Opening sprite coverage must match the selected roster');
assert.equal(assets.cell, 32); assert.equal(assets.width, 128); assert.equal(assets.height, 2048);
for (const record of assets.records) {
  const bytes = await readFile(path.join(root, 'assets/blue', record.path));
  assert.equal(bytes.length, record.bytes, `Sprite size: ${record.path}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256, `Sprite hash: ${record.path}`);
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG');
  assert.equal(bytes.readUInt32BE(16), 128); assert.equal(bytes.readUInt32BE(20), 2048);
  assert.equal(record.sources.length, 8, `Directional animation clips: ${record.path}`);
}
for (const scene of assets.scenes ?? []) {
  const bytes = await readFile(path.join(root, 'assets/blue', scene.path));
  assert.equal(bytes.length, scene.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), scene.sha256);
  assert.equal(bytes.readUInt32BE(16), scene.width); assert.equal(bytes.readUInt32BE(20), scene.height);
  assert(scene.width <= 1024 && scene.height <= 1024, 'Intro painting exceeds its texture budget');
  assert(distribution.files.includes(`assets/blue/${scene.path}`), `Missing intro resource: ${scene.path}`);
}
if (assets.portraitAtlas) {
  const portrait = assets.portraitAtlas;
  const bytes = await readFile(path.join(root, 'assets/blue', portrait.path));
  assert.equal(bytes.length, portrait.bytes); assert.equal(createHash('sha256').update(bytes).digest('hex'), portrait.sha256);
  assert.equal(bytes.readUInt32BE(16), portrait.width); assert.equal(bytes.readUInt32BE(20), portrait.height);
  assert(distribution.files.includes('assets/blue/portraits.png'));
}
assert.equal(distribution.entry, 'src/blue/app.js');
assert(!distribution.files.some(filename => /^(?:plan|vendor)\//.test(filename)), 'Historical plans/vendor bundles must not ship');
assert(!distribution.files.some(filename => /sinister|escort|steel|thunderwave|campaign/.test(filename)), 'Later chapters must not ship');
let bytes = 0;
for (const filename of distribution.files) {
  const size = (await stat(path.join(root, filename))).size;
  assert(size <= 1024 * 1024, `Individual file exceeds contribution limit: ${filename}`);
  bytes += size;
}
assert.equal(bytes, distribution.totalBytes, 'Regenerate the distribution after changing resources');
assert(bytes < 3 * 1024 * 1024, 'The opening distribution must remain under 3 MiB');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
assert(html.includes('src="./src/blue/app.js"'));
assert(!html.includes('./src/bootstrap.js'), 'The full campaign bootstrap must not load');
for (const id of ['top-screen', 'bottom-screen']) assert(html.includes(`id="${id}" width="256" height="192"`));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'DOM IDs must be unique');
console.log(`Blue opening: ${data.starterIds.length} starters, ${assets.records.length} sprite atlases, ${distribution.files.length} files, ${bytes} bytes. Static facts, geometry, provenance and distribution only; no game execution.`);
