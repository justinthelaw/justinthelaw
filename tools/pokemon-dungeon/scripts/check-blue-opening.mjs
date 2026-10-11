import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyNativeBattleMetadata } from '../art/blue/native-battle-effects-export.mjs';

const root = fileURLToPath(new URL('../../../games/pokemon-dungeon-reimagined/', import.meta.url));
const readJson = async filename => JSON.parse(await readFile(path.join(root, filename), 'utf8'));
const distribution = await readJson('distribution.json');
const assets = await readJson('assets/blue/manifest.json');
const data = await readJson('content/blue-opening.json');
const profiles = JSON.parse(await readFile(new URL('../content/blue-source.json', import.meta.url), 'utf8')).starterProfiles;
const expectedStarters = profiles.records.map(record => record.speciesId).sort();
const excludedStatDropGuards = new Set(['Clear Body', 'White Smoke', 'Hyper Cutter']);
assert.deepEqual([...data.starterIds].sort(), expectedStarters, 'All 16 original starter profiles must be retained');
assert.equal(data.floors.length, 3, 'The playable dungeon has exactly three ordinary floors');
const wildIds = ['pokemon-016', 'pokemon-102', 'pokemon-191', 'pokemon-265'];
assert.deepEqual(Object.keys(data.species).sort(), [...expectedStarters, ...wildIds].sort());
assert(Object.values(data.species).every(species=>species.abilities.every(ability=>!excludedStatDropGuards.has(ability))),
  'Charm/Screech omit ability guards that must remain unreachable in the selected roster');
assert(Object.values(data.species).every(species=>!species.types.includes('Ghost')),
  'Foresight requires exposed-state support before admitting Ghost targets');
for (const profile of profiles.records) {
  const species = data.species[profile.speciesId], start = profile.firstPlayable;
  assert.equal(species.growth.length, 100);
  const values = species.baseStats.map((base, stat) => base + species.growth.slice(0, 5).reduce((sum, row) => sum + row[stat + 1], 0));
  assert.deepEqual(values, ['hp', 'attack', 'specialAttack', 'defense', 'specialDefense'].map(key => start.stats[key]),
    `Opening stat facts differ: ${profile.speciesId}`);
  assert.equal(species.growth[4][0], start.cumulativeExp);
  assert.deepEqual(species.learnset.filter(([level]) => level <= 5).slice(0, 4).map(([, id]) => [id, data.moves[id].pp]),
    start.moves.map(move => [move.moveId, move.currentPP]), `Opening move facts differ: ${profile.speciesId}`);
}
for (const id of wildIds) {
  assert.equal(data.species[id].growth.length, 2, 'Retain the level2 EXP validation boundary');
  assert(data.species[id].learnset.every(([level]) => level === 1));
}
const admittedMoves = new Set(['regular-attack', 'move-struggle', 'bide-release', ...Object.values(data.species).flatMap(species => species.learnset.map(([, id]) => id))]);
assert.equal(admittedMoves.size, 101); assert.deepEqual(Object.keys(data.moves).sort(), [...admittedMoves].sort());
assert.deepEqual(data.moves['move-charm'], {id:'move-charm',name:'Charm',type:'normal',power:2,pp:22,accuracyBeforeEffect:75,accuracyAfterDamage:100,criticalPercent:12,chainedHitsRaw:1,range:0,target:0,cutsCorners:false,effects:[{op:'stat-multiplier',stat:'attack',factor:[1,2],minimum:[2,256],recipient:'target'}],aiWeight:15});
assert.deepEqual(data.moves['move-screech'], {id:'move-screech',name:'Screech',type:'normal',power:2,pp:22,accuracyBeforeEffect:100,accuracyAfterDamage:88,criticalPercent:12,chainedHitsRaw:1,range:8,target:0,cutsCorners:true,effects:[{op:'stat-multiplier',stat:'defense',factor:[1,4],minimum:[2,256],recipient:'target'}],aiWeight:15});
assert.deepEqual(data.moves['move-heal-bell'], {id:'move-heal-bell',name:'Heal Bell',type:'normal',power:2,pp:12,accuracyBeforeEffect:125,accuracyAfterDamage:125,criticalPercent:12,chainedHitsRaw:1,range:3,target:1,cutsCorners:false,effects:[{op:'cure-negative-statuses'}],aiWeight:15});
assert.deepEqual(data.moves['move-mud-sport'], {id:'move-mud-sport',name:'Mud Sport',type:'ground',power:2,pp:17,accuracyBeforeEffect:125,accuracyAfterDamage:100,criticalPercent:12,chainedHitsRaw:1,range:7,target:3,cutsCorners:false,effects:[{op:'floor-sport',sport:'move-dependent-mud-or-water',durationBounds:[10,12],damageMultiplier:[1,2],affectedType:'electric-for-mud-fire-for-water'}],aiWeight:10});
const expectedSprites = new Set([...data.starterIds, ...data.floors.flatMap(floor => floor.encounters.map(row => row.speciesId)),
  'pokemon-010', 'pokemon-012', 'pokemon-279']);
assert.deepEqual(new Set(assets.records.map(record => record.speciesId)), expectedSprites, 'Opening sprite coverage must match the selected roster');
assert.equal(assets.schemaVersion, 2);
assert.equal(assets.profile, 'blue-opening-rescue-team-native-v2');
const directions = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
const requiredClips = ['idle', 'walk', 'fly', 'attack-physical', 'hit-light', 'rest-sleep', 'bide-hold', 'story-sleep'];
const integer = (value, minimum, maximum) => Number.isInteger(value) && value >= minimum && value <= maximum;
async function verifiedBytes(filename, size, hash) {
  assert(distribution.files.includes(filename), `Missing runtime resource: ${filename}`);
  const bytes = await readFile(path.join(root, filename));
  assert.equal(bytes.length, size, `Resource size: ${filename}`);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `Resource hash: ${filename}`);
  return bytes;
}
async function verifiedPng(prefix, record) {
  assert(/^[a-z][a-z0-9-]*\.png$/.test(record.path), 'Invalid image path');
  const bytes = await verifiedBytes(`${prefix}/${record.path}`, record.bytes, record.sha256);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert(integer(record.width, 1, 4096) && integer(record.height, 1, 4096));
  assert.equal(bytes.readUInt32BE(16), record.width); assert.equal(bytes.readUInt32BE(20), record.height);
}
async function verifiedMetadata(record) {
  assert(/^[a-z][a-z0-9-]*\.json$/.test(record.metadataPath), 'Invalid metadata path');
  return JSON.parse(await verifiedBytes(`assets/blue/${record.metadataPath}`, record.metadataBytes, record.metadataSha256));
}
function verifyAnimationTables(metadata, record, frameSize = 7) {
  assert(Array.isArray(metadata.poses) && integer(metadata.poses.length, 1, 1024));
  for (const pose of metadata.poses) {
    assert(Array.isArray(pose) && pose.length === 6 && pose.every(Number.isInteger));
    const [x, y, width, height] = pose;
    assert(x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= record.width && y + height <= record.height,
      `Native pose escapes atlas: ${record.speciesId ?? record.id}`);
  }
  assert(Array.isArray(metadata.animations) && integer(metadata.animations.length, 1, 64));
  for (const animation of metadata.animations) {
    assert.equal(animation.length, 8, 'Native animation must retain every direction');
    for (const sequence of animation) {
      assert(Array.isArray(sequence) && integer(sequence.length, 1, 256));
      for (const frame of sequence) {
        assert(Array.isArray(frame) && frame.length === frameSize && frame.every(Number.isInteger));
        assert(integer(frame[0], 0, metadata.poses.length - 1) && integer(frame[1], 1, 65535));
        assert(frame.slice(2, frameSize === 4 ? 4 : 6).every(value => integer(value, -32768, 32767)) && (frameSize === 4 || integer(frame[6], 0, 65535)));
      }
    }
  }
}
for (const record of assets.records) {
  assert.equal(record.path, `${record.speciesId}.png`);
  assert.equal(record.metadataPath, `${record.speciesId}.json`);
  await verifiedPng('assets/blue', record);
  assert(record.width * record.height * 4 <= 1024 * 1024, 'Species atlas exceeds its decoded-memory budget');
  const metadata = await verifiedMetadata(record);
  assert.equal(metadata.schemaVersion, 3); assert.equal(metadata.speciesId, record.speciesId);
  assert.equal(metadata.width, record.width); assert.equal(metadata.height, record.height);
  assert(integer(metadata.dungeonOffsetY, 1, record.height - 1));
  for (const [, y, , height] of metadata.poses) assert(y + height <= metadata.dungeonOffsetY && y + height + metadata.dungeonOffsetY <= record.height,
    `Native field/dungeon palette copies overlap or escape atlas: ${record.speciesId}`);
  assert(Array.isArray(metadata.statusOffsets) && metadata.statusOffsets.length === metadata.poses.length);
  assert(metadata.statusOffsets.every(offset => Array.isArray(offset) && offset.length === 2 && offset.every(value => integer(value, -32767, 32767))));
  assert(Array.isArray(metadata.effectOffsetSets) && integer(metadata.effectOffsetSets.length, 1, metadata.poses.length));
  for (const sets of metadata.effectOffsetSets) {
    assert(Array.isArray(sets) && sets.length === 3);
    assert(sets.every(offset => Array.isArray(offset) && offset.length === 2 && offset.every(value => integer(value, -32768, 32767))));
  }
  assert(Array.isArray(metadata.effectOffsetIndices) && metadata.effectOffsetIndices.length === metadata.poses.length);
  assert(metadata.effectOffsetIndices.every(index => integer(index, 0, metadata.effectOffsetSets.length - 1)));
  verifyAnimationTables(metadata, record);
  assert.deepEqual(Object.keys(metadata.clips).sort(), [...requiredClips].sort(), `Unexpected native animation aliases: ${record.speciesId}`);
  for (const clip of Object.values(metadata.clips)) assert(integer(clip.animation, 0, metadata.animations.length - 1) && typeof clip.loop === 'boolean');
}
for (const scene of assets.scenes ?? []) {
  await verifiedPng('assets/blue', scene);
  assert(scene.width <= 1024 && scene.height <= 1024, 'Intro painting exceeds its texture budget');
  assert(distribution.files.includes(`assets/blue/${scene.path}`), `Missing intro resource: ${scene.path}`);
}
assert.deepEqual(new Set((assets.ornaments ?? []).map(record => record.id)), new Set(['title-bird', 'title-letter']));
for (const record of assets.ornaments) {
  await verifiedPng('assets/blue', record);
  const metadata = await verifiedMetadata(record);
  assert.equal(metadata.schemaVersion, 3); assert.equal(metadata.id, record.id);
  assert.equal(metadata.width, record.width); assert.equal(metadata.height, record.height);
  verifyAnimationTables(metadata, record, 4);
  assert(Array.isArray(metadata.scriptAnimationMap) && metadata.scriptAnimationMap.every(value => integer(value, -1, 65535)));
}
if (assets.portraitAtlas) {
  const portrait = assets.portraitAtlas;
  await verifiedPng('assets/blue', portrait);
  assert(portrait.width * portrait.height * 4 <= 2 * 1024 * 1024, 'Portrait atlas exceeds its decoded-memory budget');
  const metadata = await verifiedMetadata(portrait);
  assert.equal(metadata.schemaVersion, 2); assert.equal(metadata.cell, 40);
  assert.equal(metadata.width, portrait.width); assert.equal(metadata.height, portrait.height);
  assert.deepEqual(metadata.records, portrait.records);
  const seen = new Set();
  for (const record of metadata.records) {
    const id = `${record.speciesId}:${record.emotion}`;
    assert(!seen.has(id)); seen.add(id);
    assert.equal(record.width, 40); assert.equal(record.height, 40);
    assert(integer(record.x, 0, portrait.width - 40) && integer(record.y, 0, portrait.height - 40));
  }
  for (const species of [...data.starterIds, 'pokemon-010', 'pokemon-012', 'pokemon-279']) assert(seen.has(`${species}:normal`));
  // Independent native opening/retry/rescue bound; source-only emotions stay
  // in the full authoring archive. Keep every existing normal fallback.
  const openingPortraits = new Set(data.starterIds.flatMap(species =>
    ['normal', 'happy', 'worried', 'shocked'].map(emotion => `${species}:${emotion}`)));
  for (const dex of [1, 4, 7, 25, 152, 155, 158, 252, 255, 258]) {
    const species = `pokemon-${String(dex).padStart(3, '0')}`;
    for (const emotion of ['joyous', 'special']) openingPortraits.add(`${species}:${emotion}`);
  }
  for (const id of ['pokemon-010:normal', 'pokemon-010:inspired', 'pokemon-010:teary-eyed', 'pokemon-012:normal', 'pokemon-279:normal']) openingPortraits.add(id);
  assert.equal(openingPortraits.size, 89); assert.deepEqual(seen, openingPortraits, 'Opening portrait scope differs from the native source bound');
  assert.equal(portrait.width, 320); assert.equal(portrait.height, 480);
}
const sceneryRuntime = await readJson('assets/blue/scenery/manifest.json');
const sceneryProof = JSON.parse(await readFile(new URL('../art/blue/native-scenery-metadata.json', import.meta.url), 'utf8'));
assert.deepEqual(Object.keys(sceneryRuntime).sort(), ['aura', 'profile', 'schemaVersion', 'terrain']);
assert.equal(sceneryRuntime.schemaVersion, sceneryProof.schemaVersion); assert.equal(sceneryRuntime.profile, sceneryProof.profile);
assert.deepEqual(Object.keys(sceneryRuntime.terrain), ['lookup']);
assert.deepEqual(Object.keys(sceneryRuntime.aura).sort(), ['blendCoefficients', 'camera', 'displayCenter', 'height', 'layers', 'paletteFrameTicks', 'palettes', 'scrollPixelsPerTick', 'width']);
const scenery = {...sceneryProof, terrain: {...sceneryProof.terrain, ...sceneryRuntime.terrain}, aura: {...sceneryProof.aura, ...sceneryRuntime.aura}};
assert.equal(scenery.schemaVersion, 2); assert.equal(scenery.profile, 'blue-native-scenery-v2');
assert.equal(scenery.terrain.tileSize, 24);
assert.equal(scenery.terrain.columns, 25); assert.equal(scenery.terrain.cellCount, 250);
assert.deepEqual(scenery.terrain.maskDirections, directions);
assert.equal(scenery.terrain.lookup.length, 2352);
assert(scenery.terrain.lookup.every(value => integer(value, 0, scenery.terrain.cellCount - 1)));
assert.equal(scenery.aura.width, 480); assert.equal(scenery.aura.height, 384); assert.equal(scenery.aura.layers, 2);
assert.deepEqual(scenery.aura.blendCoefficients, [8, 8]);
assert.equal(scenery.aura.paletteFrameTicks, 8); assert.equal(scenery.aura.scrollPixelsPerTick, .5);
for (const [mode, palettes] of Object.entries(scenery.aura.palettes)) {
  assert(['cycle', 'cyan', 'purple'].includes(mode)); assert.equal(palettes.length, mode === 'cycle' ? 63 : 1);
  for (const palette of palettes) {
    assert.equal(palette.length, 16);
    for (const color of palette) assert(Array.isArray(color) && color.length === 3 && color.every(value => integer(value, 0, 31)));
  }
}
assert.deepEqual(scenery.mapLabel.bounds, [56, 152, 184, 32]);
assert.deepEqual(scenery.mapLabel.textOrigin, [121, 162]); assert.equal(scenery.mapLabel.text, 'Tiny Woods');
for (const record of scenery.records) await verifiedPng('assets/blue/scenery', record);
const bootRecord = scenery.records.find(record => record.id === 'boot-cards');
assert(bootRecord, 'The original company cards must be in the opening distribution.');
assert.deepEqual([bootRecord.width, bootRecord.height], [256, 768]);
assert.deepEqual(scenery.boot.cards.map(card => card.id), ['pokemon-company', 'nintendo', 'chunsoft', 'copyright']);
for (const [index, card] of scenery.boot.cards.entries()) {
  assert.deepEqual(card.rect, [0, index * 192, 256, 192]);
  assert.equal(card.matchedFiveBitPixels, 255 * 192);
  assert(/^[0-9a-f]{64}$/.test(card.sourceSha256));
}
assert.equal(assets.nativeUi.modulePath, 'src/blue/render-native-ui-data.js');
await verifiedBytes(assets.nativeUi.modulePath, assets.nativeUi.bytes, assets.nativeUi.sha256);
for (const record of assets.nativeUi.images ?? []) await verifiedPng('assets/blue', record);
assert.equal(assets.nativeMotions.modulePath, 'src/blue/render-move-motion-data.js');
assert.equal(assets.nativeMotions.moveCount, Object.keys(data.moves).length);
assert.equal(assets.nativeMotions.openingFactsSha256,
  createHash('sha256').update(await readFile(path.join(root, 'content/blue-opening.json'))).digest('hex'));
await verifiedBytes(assets.nativeMotions.modulePath, assets.nativeMotions.bytes, assets.nativeMotions.sha256);
assert.equal(assets.battleEffects.activation, 'selected');
assert.equal(assets.battleEffects.maxDecodedBytes, 4 * 1024 * 1024);
assert.deepEqual(assets.battleEffects.banks.map(bank => bank.id), ['basic', 'initial']);
let battleDecodedBytes = 0;
const battleIds = new Set();
for (const bank of assets.battleEffects.banks) {
  const stem = bank.id === 'basic' ? 'battle-effects' : 'battle-effects-initial';
  assert.equal(bank.activation, 'selected');
  assert.equal(bank.path, `${stem}.png`); assert.equal(bank.metadataPath, `${stem}.json`);
  await verifiedPng('assets/blue', bank);
  assert(bank.bytes <= 256 * 1024 && bank.metadataBytes <= 128 * 1024, 'Battle bank exceeds its encoded byte budget');
  assert(bank.width * bank.height * 4 <= 2 * 1024 * 1024, 'Battle effect atlas exceeds its decoded-memory budget');
  battleDecodedBytes += bank.width * bank.height * 4;
  const battleMetadata = await verifiedMetadata(bank);
  assert.equal(battleMetadata.width, bank.width); assert.equal(battleMetadata.height, bank.height);
  verifyNativeBattleMetadata(battleMetadata, bank.id, 'runtime');
  for (const effect of battleMetadata.effects) {
    assert(!battleIds.has(effect.id), 'Native effect ID occurs in multiple banks'); battleIds.add(effect.id);
  }
}
assert.equal(battleIds.size, 33);
const hypnosis = assets.battleEffects.hypnosis;
assert.equal(hypnosis.activation, 'selected-hypnosis-only'); assert.equal(hypnosis.effectId, 222);
assert.equal(hypnosis.path, 'hypnosis-background.png'); assert.equal(hypnosis.width, 416); assert.equal(hypnosis.height, 32);
assert.equal(hypnosis.modulePath, 'src/blue/render-hypnosis-data.js'); assert.equal(hypnosis.guard.column, 0);
assert(hypnosis.bytes <= 4096); await verifiedPng('assets/blue', hypnosis);
await verifiedBytes(hypnosis.modulePath, hypnosis.moduleBytes, hypnosis.moduleSha256);
battleDecodedBytes += hypnosis.width * hypnosis.height * 4;
assert(battleDecodedBytes <= assets.battleEffects.maxDecodedBytes, 'Battle effects exceed the aggregate decoded budget');
if (assets.statusAtlas) {
  await verifiedPng('assets/blue', assets.statusAtlas);
  const metadata = await verifiedMetadata(assets.statusAtlas);
  assert.equal(metadata.schemaVersion, 1); assert.equal(metadata.records.length, 9);
  assert.equal(metadata.selectionFrames, 61); assert.equal(metadata.animationFrameTicks, 4);
  const ids = new Set();
  for (const record of metadata.records) {
    assert(!ids.has(record.id)); ids.add(record.id);
    assert(integer(record.width, 8, 32) && record.height === 16 && integer(record.frames, 1, 16));
    assert(integer(record.bit, 0, 27) && integer(record.phase, 0, 3));
    assert(record.x >= 0 && record.y >= 0 && record.x + record.width * record.frames <= metadata.width && record.y + record.height <= metadata.height);
  }
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
