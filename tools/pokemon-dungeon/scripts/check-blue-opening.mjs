import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as acorn from 'acorn';
import { verifyNativeBattleMetadata } from '../art/blue/native-battle-effects-export.mjs';
import { readTarGzip } from '../art/blue/native-format.mjs';

const root = fileURLToPath(new URL('../../../games/pokemon-dungeon-reimagined/', import.meta.url));
const readJson = async filename => JSON.parse(await readFile(path.join(root, filename), 'utf8'));
const distribution = await readJson('distribution.json');
const assets = await readJson('assets/blue/manifest.json');
const data = await readJson('content/blue-opening.json');
const blueSource = JSON.parse(await readFile(new URL('../content/blue-source.json', import.meta.url), 'utf8'));
const profiles = blueSource.starterProfiles;
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
assert.deepEqual(data.moves['move-fire-spin'], {id:'move-fire-spin',name:'Fire Spin',type:'fire',power:4,pp:19,accuracyBeforeEffect:125,accuracyAfterDamage:73,criticalPercent:12,chainedHitsRaw:1,range:0,target:0,cutsCorners:false,effects:[{op:'normal-damage'},{op:'secondary',chancePercent:10,requires:'successful-nonzero-damage',effect:{op:'apply-status',status:'constriction',recipient:'target'},gate:'secondary-effect-common'}],aiWeight:15});
assert.deepEqual(data.moves['move-whirlpool'], {id:'move-whirlpool',name:'Whirlpool',type:'water',power:2,pp:17,accuracyBeforeEffect:125,accuracyAfterDamage:78,criticalPercent:12,chainedHitsRaw:1,range:0,target:0,cutsCorners:false,effects:[{op:'normal-damage',multiplierByTargetStatus:{diving:2,otherwise:1}},{op:'secondary',chancePercent:10,requires:'successful-nonzero-damage',effect:{op:'apply-status',status:'constriction',recipient:'target'},gate:'secondary-effect-common'}],aiWeight:30});
assert.deepEqual(Object.entries(data.species).flatMap(([id,species])=>species.learnset.filter(([,move])=>move==='move-fire-spin'||move==='move-whirlpool').map(([level,move])=>[id,level,move])), [['pokemon-004',49,'move-fire-spin'],['pokemon-255',25,'move-fire-spin'],['pokemon-258',33,'move-whirlpool']]);
assert.deepEqual(data.moves['move-solar-beam'], {id:'move-solar-beam',name:'Solarbeam',type:'grass',power:24,pp:9,accuracyBeforeEffect:125,accuracyAfterDamage:100,criticalPercent:12,chainedHitsRaw:1,range:7,target:4,cutsCorners:false,effects:[{op:'charge',status:'solarbeam',turns:1,skipWeather:'sunny'},{op:'normal-damage',multiplier:2,weatherMultiplier:{hail:.5,rain:.5,sandstorm:.5,otherwise:1}}],aiWeight:15});
assert.deepEqual(Object.entries(data.species).flatMap(([id,species])=>species.learnset.filter(([,move])=>move==='move-solar-beam').map(([level])=>[id,level])), [['pokemon-001',46],['pokemon-152',50]]);
assert.deepEqual(data.moves['move-pursuit'], {id:'move-pursuit',name:'Pursuit',type:'dark',power:8,pp:17,accuracyBeforeEffect:125,accuracyAfterDamage:100,criticalPercent:12,chainedHitsRaw:1,range:7,target:3,cutsCorners:false,effects:[{op:'apply-status',status:'counter',recipient:'resolved-target'}],aiWeight:30});
assert.deepEqual(Object.entries(data.species).flatMap(([id,species])=>species.learnset.filter(([,move])=>move==='move-pursuit').map(([level])=>[id,level])), [['pokemon-252',16]]);
assert.deepEqual(data.moves['move-thrash'], {id:'move-thrash',name:'Thrash',type:'normal',power:18,pp:12,accuracyBeforeEffect:125,accuracyAfterDamage:78,criticalPercent:12,chainedHitsRaw:3,range:0,target:2,cutsCorners:false,effects:[{op:'choose-random-facing',phase:'before-each-hit'},{op:'normal-damage'}],aiWeight:15});
assert.deepEqual(Object.entries(data.species).flatMap(([id,species])=>species.learnset.filter(([,move])=>move==='move-thrash').map(([level])=>[id,level])), [['pokemon-104',37]]);
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
  return bytes;
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
const motionBytes = await verifiedBytes(assets.nativeMotions.modulePath, assets.nativeMotions.bytes, assets.nativeMotions.sha256);
const motionSource = motionBytes.toString();
const motionMatch = motionSource.match(/export const MOVE_MOTION_FACTS=(\{[^\n]+\});/);
assert(motionMatch, 'Generated native move facts must remain a static JSON literal');
const motionFacts = JSON.parse(motionMatch[1]);
const firstAttemptMoves = [
  'move-absorb','move-attract','move-bite','move-bone-club','move-bubble','move-disable','move-ember','move-focus-energy','move-growl','move-helping-hand',
  'move-hypnosis','move-leech-seed','move-leer','move-low-kick','move-mud-slap','move-pound','move-quick-attack','move-rage','move-razor-leaf','move-sand-attack',
  'move-scratch','move-smokescreen','move-tackle','move-tail-whip','move-thunder-shock','move-thunder-wave','move-vine-whip','move-water-gun','move-water-sport','move-withdraw',
];
assert.equal(firstAttemptMoves.length, 30); assert.equal(new Set(firstAttemptMoves).size, 30);
for (const moveId of firstAttemptMoves) assert(motionFacts[moveId], `Missing first-attempt native route: ${moveId}`);
const sine = assets.nativeSine;
assert.equal(sine.modulePath, 'src/blue/battle-native-sine-data.js');
assert.deepEqual({entries:sine.entries,min:sine.min,max:sine.max,sourcePaths:sine.sourcePaths},
  {entries:1024,min:0,max:255,sourcePaths:['src/data/math.h','src/math.c']});
assert(/^[0-9a-f]{64}$/.test(sine.quarterWaveSha256) && /^[0-9a-f]{64}$/.test(sine.quadrantBodySha256));
const sineBytes = await verifiedBytes(sine.modulePath, sine.bytes, sine.sha256), sineSource = sineBytes.toString();
const sineBody = sineSource.match(/export const NATIVE_FAST_SINE=Object\.freeze\(\[([\s\S]*?)\n\]\);/)?.[1];
assert(sineBody, 'Generated native sine table must remain a bounded literal array');
const sineValues = [...sineBody.matchAll(/\b\d+\b/g)].map(match => Number(match[0]));
assert.equal(sineValues.length, 1024); assert(sineValues.every((value,index) => value >= 0 && value <= 255 && (index === 0 || value >= sineValues[index - 1])));
assert.equal(createHash('sha256').update(JSON.stringify(sineValues)).digest('hex'), sine.quarterWaveSha256);
assert(sineSource.includes('switch(x&0xc00)') && !sineSource.includes('Math.sin'), 'Native sine must retain the source quadrant lookup without approximation');
assert.equal(assets.battleEffects.activation, 'selected');
assert.equal(assets.battleEffects.maxDecodedBytes, 4 * 1024 * 1024);
assert.deepEqual(assets.battleEffects.banks.map(bank => bank.id), ['basic', 'initial', 'extra']);
// Check generated PNG headers against the loader's declared formats without
// importing or executing the game. The banks are loaded only on dungeon entry.
const battleLoaderAst=acorn.parse(await readFile(path.join(root,'src/blue/render-battle-effects.js'),'utf8'),{ecmaVersion:'latest',sourceType:'module'});
const formatsNode=battleLoaderAst.body.filter(node=>node.type==='VariableDeclaration').flatMap(node=>node.declarations).find(node=>node.id.type==='Identifier'&&node.id.name==='PNG_FORMATS')?.init;
assert.equal(formatsNode?.type,'CallExpression');assert.equal(formatsNode.arguments[0]?.type,'ArrayExpression');
const battlePngFormats=formatsNode.arguments[0].elements.map(pair=>{
  assert.equal(pair?.type,'ArrayExpression');assert.equal(pair.elements.length,2);
  return pair.elements.map(value=>{assert.equal(value?.type,'Literal');assert(Number.isInteger(value.value));return value.value;});
});
let battleDecodedBytes = 0;
const battleIds = new Set();
const battleMetadataByBank = new Map();
for (const bank of assets.battleEffects.banks) {
  const stem = bank.id === 'basic' ? 'battle-effects' : `battle-effects-${bank.id}`;
  assert.equal(bank.activation, 'selected');
  assert.equal(bank.path, `${stem}.png`); assert.equal(bank.metadataPath, `${stem}.json`);
  const png=await verifiedPng('assets/blue', bank);
  assert(battlePngFormats.some(([color,depth])=>png[25]===color&&png[24]===depth),`Battle loader rejects generated PNG format: ${bank.path}`);
  assert(bank.bytes <= 256 * 1024 && bank.metadataBytes <= 128 * 1024, 'Battle bank exceeds its encoded byte budget');
  assert(bank.width * bank.height * 4 <= 2 * 1024 * 1024, 'Battle effect atlas exceeds its decoded-memory budget');
  battleDecodedBytes += bank.width * bank.height * 4;
  const battleMetadata = await verifiedMetadata(bank);
  battleMetadataByBank.set(bank.id,battleMetadata);
  assert.equal(battleMetadata.width, bank.width); assert.equal(battleMetadata.height, bank.height);
  verifyNativeBattleMetadata(battleMetadata, bank.id, 'runtime');
  for (const effect of battleMetadata.effects) {
    assert(!battleIds.has(effect.id), 'Native effect ID occurs in multiple banks'); battleIds.add(effect.id);
  }
}
assert.equal(battleIds.size, 66);
const routeEffects = new Map();
for (const moveId of firstAttemptMoves) {
  const route = motionFacts[moveId], required = ['preparation','cast','target','travel'].map(key => route[key]).filter(Boolean);
  routeEffects.set(moveId, required);
  for (const effectId of required) assert(effectId === 222 || battleIds.has(effectId), `Missing first-attempt route effect ${effectId} for ${moveId}`);
}
assert.deepEqual([...routeEffects.entries()].filter(([,ids]) => ids.includes(222)).map(([id]) => id), ['move-hypnosis'],
  'Hypnosis must be the sole first-attempt route using the dedicated background effect');
assert(!battleIds.has(222), 'Hypnosis background effect 222 must remain outside the indexed EFO banks');
for (const effectId of [15,37,76,323,423]) assert(battleIds.has(effectId), `Missing first-attempt status helper effect ${effectId}`);
assert(battleIds.has(321), 'Missing admitted reflect-class effect 321');
assert(battleIds.has(140), 'Missing proposed Protect effect 140');
assert(battleIds.has(238), 'Missing proposed Safeguard effect 238');
for (const effectId of [59,316]) assert(battleIds.has(effectId), `Missing admitted constriction effect ${effectId}`);
for (const effectId of [221,246,247]) assert(battleIds.has(effectId), `Missing admitted Solar Beam effect ${effectId}`);
for (const effectId of [394,397,398]) assert(battleIds.has(effectId), `Missing first-attempt stat effect ${effectId}`);
const hypnosis = assets.battleEffects.hypnosis;
assert.equal(hypnosis.activation, 'selected-hypnosis-only'); assert.equal(hypnosis.effectId, 222);
assert.equal(hypnosis.path, 'hypnosis-background.png'); assert.equal(hypnosis.width, 416); assert.equal(hypnosis.height, 32);
assert.equal(hypnosis.modulePath, 'src/blue/render-hypnosis-data.js'); assert.equal(hypnosis.guard.column, 0);
assert(hypnosis.bytes <= 4096); await verifiedPng('assets/blue', hypnosis);
await verifiedBytes(hypnosis.modulePath, hypnosis.moduleBytes, hypnosis.moduleSha256);
battleDecodedBytes += hypnosis.width * hypnosis.height * 4;
assert(battleDecodedBytes <= assets.battleEffects.maxDecodedBytes, 'Battle effects exceed the aggregate decoded budget');
const battleSourceManifest = JSON.parse(await readFile(new URL('../art/blue/native-battle-sources.json', import.meta.url), 'utf8'));
assert.equal(battleSourceManifest.files.length, 125);
for (const sourcePath of sine.sourcePaths) assert(battleSourceManifest.files.some(record => record.path === sourcePath && /^[0-9a-f]{64}$/.test(record.sha256)), `Missing pinned sine owner: ${sourcePath}`);
assert(assets.battleEffects.banks.every(bank => bank.sourceManifestSha256 === assets.nativeMotions.sourceManifestSha256));
const battleArchiveBytes = await readFile(new URL(`../art/blue/${battleSourceManifest.archive.path}`, import.meta.url));
assert.equal(battleArchiveBytes.length, battleSourceManifest.archive.bytes);
assert.equal(createHash('sha256').update(battleArchiveBytes).digest('hex'), battleSourceManifest.archive.sha256);
const battleSources = readTarGzip(battleArchiveBytes), effectData = battleSources.get('src/effect_data.c')?.toString();
const pursuitPalette=battleSources.get('data/effects/efob006.pal');
assert(pursuitPalette&&pursuitPalette.length===194&&createHash('sha256').update(pursuitPalette).digest('hex')==='e914426642db070758846e130be2290840b3cab8eca64e20e072e8a5bf6e52a2');
const pursuitRgb=pursuitPalette.toString().trim().split(/\r?\n/).slice(3).map(row=>row.split(/\s+/).map(Number).map(value=>{const five=Math.floor(value*31/256);return(five<<3)|(five>>3);}));
assert.equal(createHash('sha256').update(JSON.stringify(pursuitRgb)).digest('hex'),'4a7017c17b31a18948604bcc37e206ce92114f23b38b2b2adbf3787435d4ee0c','Pursuit parsed RGB palette changed');
const effectFormatSource=await readFile(new URL('../art/blue/native-effect-format.mjs',import.meta.url),'utf8');
assert(effectFormatSource.includes("flags!==0&&!(file.id===6&&sourceAnimation===0&&flags===1)"),'Only efob006 animation zero may admit source flag one');
const moveConstants = battleSources.get('include/constants/move_id.h')?.toString();
assert(effectData && moveConstants, 'Pinned native move routes are absent');
const sourceMoveIds = new Map([...moveConstants.matchAll(/^#define (MOVE_\w+) (0x[0-9A-Fa-f]+|\d+)/gm)].map(match => [Number(match[2]),match[1]]));
const sourceRoutes = new Map([...effectData.matchAll(/^\s{4}\[(MOVE_\w+)\] = \{([^\n]+)\}/gm)].map(match => [match[1],match[2]]));
const originalMoveIds = new Map(blueSource.identities.moves.map(record => [record.id,record.originalId]));
const wobbleMoves = [];
for (const moveId of firstAttemptMoves) {
  const symbol = sourceMoveIds.get(originalMoveIds.get(moveId)), route = symbol && sourceRoutes.get(symbol);
  assert(route, `Pinned native route is absent for ${moveId}`);
  if (/\.useSineWobble = TRUE\b/.test(route)) wobbleMoves.push(moveId);
  else assert(/\.useSineWobble = FALSE\b/.test(route), `Pinned sine-wobble flag is absent for ${moveId}`);
}
assert.deepEqual(wobbleMoves, ['move-attract'], 'Attract must be the sole first-attempt native sine-wobble route');
const presentationSource = await readFile(path.join(root, 'src/blue/battle-presentation.js'), 'utf8');
const effectLoaderSource = await readFile(path.join(root, 'src/blue/render-battle-effects.js'), 'utf8');
const loaderBankMatch = effectLoaderSource.match(/const BANKS=Object\.freeze\(\[([\s\S]*?)\n\]\);/);
assert(loaderBankMatch, 'Runtime battle-effect bank contract is absent');
const loaderBanks = [...loaderBankMatch[1].matchAll(/\{id:'([^']+)',path:'([^']+)',ids:\[([^\]]*)\]\}/g)].map(match => ({id:match[1],path:match[2],ids:match[3].split(',').map(Number)}));
assert.deepEqual(loaderBanks.map(bank=>bank.id), ['basic','initial','extra'], 'Runtime battle-effect bank order changed');
const loaderIds = loaderBanks.flatMap(bank=>bank.ids);
assert.equal(loaderIds.length,new Set(loaderIds).size,'Runtime battle-effect bank IDs overlap');
for(const bank of loaderBanks){
  const expectedPath=bank.id==='basic'?'battle-effects':`battle-effects-${bank.id}`;
  assert.equal(bank.path,expectedPath,`Runtime path changed for ${bank.id}`);
  assert.deepEqual(bank.ids,battleMetadataByBank.get(bank.id)?.effects.map(effect=>effect.id),`Runtime IDs or order differ for ${bank.id}`);
}
assert.deepEqual([...loaderIds].sort((a,b)=>a-b), [...battleIds].sort((a,b)=>a-b), 'Runtime battle-effect bank IDs differ from generated metadata');
const metadataNonblocking=[...battleMetadataByBank.values()].flatMap(bank=>bank.effects).filter(effect=>!effect.blocksWait).map(effect=>effect.id).sort((a,b)=>a-b);
assert.deepEqual(metadataNonblocking,[37,247],'Generated nonblocking battle-effect set changed');
assert(effectLoaderSource.includes("record.blocksWait!==(![37,247].includes(record.id))"), 'Runtime loader must admit the exact nonblocking effects');
assert(presentationSource.includes("import {nativeSin4096} from './battle-native-sine-data.js'"));
assert.equal((presentationSource.match(/nativeSin4096\(/g) ?? []).length, 1, 'Attract must have exactly one native sine call');
assert(presentationSource.includes("moveId==='move-attract'?nativeSin4096(Math.trunc(phase/256))*amplitude:0"),
  'Native sine wobble must remain source-qualified to Attract');
for (const binding of ["id===221)sound('se768',start)","id===247)sound('se785',start)","route.travel===246&&!solarStarted){sound('se784',cursor+1)"])
  assert(presentationSource.includes(binding), `Missing Solar presentation sound owner: ${binding}`);
assert(presentationSource.includes("record.moveId!=='move-solar-beam'"), 'Solar Beam must suppress the authored direct-cast fallback');
const appSource = await readFile(path.join(root, 'src/blue/app.js'), 'utf8');
assert(appSource.includes("cue.sound==='se768'||cue.sound==='se784'||cue.sound==='se785'"));
assert(appSource.includes('if(solarSounds++<2)'), 'Solar Beam must retain its two-receipt result bound');
assert(presentationSource.includes("id===321)sound('se853',start)"), 'Effect 321 must own one se853 request at handle creation');
assert(appSource.includes("cue.sound==='se853'"));
const pcmFacts=JSON.parse(await readFile(new URL('../audio/blue-pcm-effects.json',import.meta.url),'utf8'));
const counterCue=pcmFacts.cues.find(cue=>cue.sequence===853);
assert.deepEqual(counterCue&&{id:counterCue.id,player:counterCue.player,bank:counterCue.bank,fineTick:counterCue.fineTick,notes:counterCue.notes},
  {id:'effect-counter',player:'SE5',bank:26,fineTick:45,notes:[
    {tick:0,gate:42,key:42,velocity:88,voice:16},{tick:0,gate:42,key:63,velocity:88,voice:16}
  ]},'Pinned Counter cue route changed');
assert.deepEqual(pcmFacts.voices['026:16'],{bank:26,wave:110,envelope:[255,249,0,0]});
assert(pcmFacts.sources.some(source=>source.path==='sound/songs/seq_853.s'&&source.sha256==='e1a4e8c2f81051c9d54c34c27ad870b6e597adadcdd8c68c8ed94171bda089cb'));
const protectCue=pcmFacts.cues.find(cue=>cue.sequence===708);
assert(protectCue&&protectCue.id==='effect-protect'&&protectCue.player==='SE5'&&protectCue.bank===26&&protectCue.fineTick===178&&protectCue.notes.length===12);
assert.deepEqual(pcmFacts.voices['026:4'],{bank:26,wave:99,envelope:[255,249,0,0]});
assert(pcmFacts.sources.some(source=>source.path==='sound/songs/seq_708.s'&&source.sha256==='1dd00c00bc07cdf3b0f1557ce768b8348220037360bbc56134c11fc32830886a'));
const safeguardCue=pcmFacts.cues.find(cue=>cue.sequence===776);
assert.deepEqual(safeguardCue&&{id:safeguardCue.id,player:safeguardCue.player,bank:safeguardCue.bank,fineTick:safeguardCue.fineTick,notes:safeguardCue.notes},
  {id:'effect-safeguard',player:'SE5',bank:26,fineTick:72,notes:[
    {tick:2,gate:4,key:37,velocity:127,voice:34},{tick:6,gate:66,key:33,velocity:127,voice:34},{tick:6,gate:66,key:34,velocity:127,voice:34}
  ]},'Pinned Safeguard cue route changed');
assert.deepEqual(pcmFacts.voices['026:34'],{bank:26,wave:125,envelope:[255,249,0,0]});
const safeguardSample=pcmFacts.samples.find(sample=>sample.id===125);
assert(safeguardSample&&safeguardSample.status===0&&safeguardSample.sampleCount===17648&&safeguardSample.literalBytes===17648&&safeguardSample.interpolationGuardBytes===0&&safeguardSample.float32Bytes===70592);
assert(pcmFacts.sources.some(source=>source.path==='sound/songs/seq_776.s'&&source.sha256==='666f4c704cbea66afe91e55af1f6c4b86a261be9e9e7181c02803e7d123bd143'));
assert(pcmFacts.sources.some(source=>source.path==='sound/wave/wave_125.s'&&source.sha256==='eecafcf2b7f14a7603f865d0f5f110eb179120257ec22d90473be994e23d4f4c'));
const audioSource=await readFile(path.join(root,'src/blue/audio.js'),'utf8');
const audioTypesSource=await readFile(path.join(root,'src/blue/audio-types.js'),'utf8');
assert(audioSource.includes("se853: 'effect-counter'"));assert(audioTypesSource.includes("|'se853'"));
if (assets.statusAtlas) {
  await verifiedPng('assets/blue', assets.statusAtlas);
  const metadata = await verifiedMetadata(assets.statusAtlas);
  // Parse the loader's curated factual table without importing game code.
  // Each generated strip must match what the browser will actually admit.
  const statusAst = acorn.parse(await readFile(path.join(root,'src/blue/render-status.js'),'utf8'),{ecmaVersion:'latest',sourceType:'module'});
  const expectedNode = statusAst.body.filter(node=>node.type==='VariableDeclaration').flatMap(node=>node.declarations).find(node=>node.id.type==='Identifier'&&node.id.name==='EXPECTED')?.init;
  assert.equal(expectedNode?.type,'CallExpression');
  const expectedObject=expectedNode.arguments[0];assert.equal(expectedObject?.type,'ObjectExpression');
  const expected = Object.fromEntries(expectedObject.properties.map(property=>{
    assert.equal(property.type,'Property');assert.equal(property.value.type,'ArrayExpression');
    const id=property.key.type==='Identifier'?property.key.name:property.key.value;
    const values=property.value.elements.map(element=>{assert.equal(element?.type,'Literal');assert(Number.isInteger(element.value));return element.value;});
    assert.equal(typeof id,'string');assert.equal(values.length,5);return [id,values];
  }));
  assert.equal(metadata.schemaVersion, 1); assert.equal(metadata.records.length, Object.keys(expected).length);
  assert.equal(metadata.width,256);assert.equal(metadata.height,metadata.records.length*16);
  assert.equal(metadata.selectionFrames, 61); assert.equal(metadata.animationFrameTicks, 4);
  const ids = new Set();
  for (const record of metadata.records) {
    assert(!ids.has(record.id)); ids.add(record.id);
    assert.deepEqual([record.bit,record.width,record.frames,record.phase,record.xShift],expected[record.id],`Status loader disagrees with generated artwork: ${record.id}`);
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
