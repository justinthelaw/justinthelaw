import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Authoring facts only. Never import or execute browser game modules.
const input = new URL('../audio/blue-menu-effects.json', import.meta.url);
const battleInput = new URL('../audio/blue-battle-effects.json', import.meta.url);
const output = new URL('../../../games/pokemon-dungeon-reimagined/src/blue/audio-menu-data.js', import.meta.url);
const bytes = await readFile(input), data = JSON.parse(bytes);
const battleBytes = await readFile(battleInput), battle = JSON.parse(battleBytes);
assert.equal(data.schemaVersion, 1);
assert.equal(data.sourceCommit, '013475aa04f5be3191e5527c186d9bfceae7cae0');
assert.equal(data.edition, 'Red Rescue Team comparative');
assert.equal(data.clock.cpuHz, 16777216); assert.equal(data.clock.cyclesPerFrame, 280896);
assert.equal(data.frequencyBase.length, 12); assert(data.frequencyBase.every(value => Number.isInteger(value) && value < 0));
assert.equal(data.cues.length, 4); assert.equal(data.generalMenuThrottleFrames, 4);
assert.deepEqual(data.pulseHardware, {directSoundBits:8,soundBiasHighBits:64,fixedTypeMask:8,fixedRegisterAdd:1,fixedRegisterMask:2046});
assert.deepEqual(data.voices, [
  {id:60,type:9,duty:.5,envelope:[0,0,15,0]},
  {id:61,type:1,duty:.125,envelope:[0,0,15,0]},
  {id:64,type:9,duty:.25,envelope:[0,0,15,0]},
]);
assert(data.browserGain > 0 && data.browserGain <= .3);
assert.equal(battle.schemaVersion, 1); assert.equal(battle.sourceCommit, data.sourceCommit);
assert.equal(battle.edition, data.edition); assert.deepEqual(battle.clock, data.clock);
assert.equal(battle.tempo.initialIncrement, 150); assert.equal(battle.tempo.threshold, 150);
assert.equal(battle.cues.length, 2);
const sourceArgument = process.argv.indexOf('--source-root');
if (sourceArgument >= 0) {
  const sourceRoot = process.argv[sourceArgument + 1]; assert(sourceRoot, 'Provide --source-root PATH');
  for (const record of [...data.sources, ...battle.sources]) {
    assert(!record.path.startsWith('/') && !record.path.split('/').includes('..'));
    assert.equal(createHash('sha256').update(await readFile(path.join(sourceRoot, record.path))).digest('hex'), record.sha256, record.path);
  }
}
// Center pan, track volume scale64 and native channel/envelope truncation.
function pulseFacts(key, velocity, volume, voiceId) {
  const voice = data.voices.find(record => record.id === voiceId); assert(voice);
  const octave = Math.floor((key - 36) / 12), semitone = (key - 36) % 12;
  let register = (data.frequencyBase[semitone] >> octave) + 2048;
  // CgbSound rounds fixed-type square channels for the initialized 8-bit PWM.
  // Ordinary voice61 must retain its unrounded no-damage divisors.
  if (voice.type & data.pulseHardware.fixedTypeMask) register = (register + data.pulseHardware.fixedRegisterAdd) & data.pulseHardware.fixedRegisterMask;
  const right = (velocity * volume) >> 7;
  const left = (127 * velocity * Math.floor(volume * 127 / 128)) >> 14;
  return [2048 - register, Math.min(15, Math.floor((right + left) / 16))];
}
const cues = {};
for (const cue of data.cues) {
  assert(/^effect-ui-(cursor|confirm|cancel|open)$/.test(cue.id));
  assert.equal(cue.voice, cue.sequence === 303 ? 64 : 60);
  assert([.25, .5].includes(cue.duty));
  assert(Number.isInteger(cue.volume) && cue.volume > 0 && cue.volume <= 127);
  assert(cue.notes.length >= 1 && cue.notes.length <= 4);
  // SE2 owns one square channel: a later same-tick note replaces its predecessor.
  const starts = new Map();
  for (const note of cue.notes) {
    assert(note.length === 4 && note.every(Number.isInteger));
    const [tick, key, gate, velocity] = note;
    assert(tick >= 0 && tick <= 6 && key >= 36 && key <= 96 && gate >= 1 && gate <= 2 && velocity >= 1 && velocity <= 127);
    starts.set(tick, note);
  }
  const notes = [...starts.values()].sort((left, right) => left[0] - right[0]);
  cues[cue.id] = { duty: cue.duty, notes: notes.map(([tick, key, gate, velocity], index) => {
    const nextTick = notes[index + 1]?.[0] ?? Infinity;
    return [tick, Math.min(gate, nextTick - tick), ...pulseFacts(key, velocity, cue.volume, cue.voice)];
  }) };
}
for (const [alias, target] of Object.entries(data.aliases)) { assert(cues[target]); cues[alias] = cues[target]; }
const battleCues = {};
const expectedBattle = [
  ['effect-no-damage-team', 342, 'MISS_PLAYER_M', [74, 70, 66, 62]],
  ['effect-no-damage-other', 343, 'MISS_ENEMY_M', [65, 61, 57, 53]],
];
for (const [index, cue] of battle.cues.entries()) {
  const [id, sequence, sourceName, keys] = expectedBattle[index];
  assert.equal(cue.id, id); assert.equal(cue.sequence, sequence); assert.equal(cue.sourceName, sourceName);
  assert.equal(cue.player, 'SE2'); assert.equal(cue.voice, 61); assert.equal(cue.duty, .125);
  assert.equal(cue.volume, 78); assert.equal(cue.pan, 0); assert.deepEqual(cue.envelope, [0, 0, 15, 0]);
  assert.equal(cue.tempoIncrement, 140); assert.equal(cue.trackTicks, 384); assert.equal(cue.notes.length, 4);
  assert.deepEqual(cue.notes.map(note => note[0]), [1, 4, 7, 10]);
  assert.deepEqual(cue.notes.map(note => note[1]), keys);
  // MPlayStart's initial150 tick installs140. The next source tick lands at
  // ceil(150/140) frames, not a fractional tick or the menu's one-frame rate.
  const frame = tick => Math.floor((tick * battle.tempo.threshold + cue.tempoIncrement - 1) / cue.tempoIncrement);
  battleCues[id] = { duty: cue.duty, notes: cue.notes.map(note => {
    assert(note.length === 4 && note.every(Number.isInteger));
    const [tick, key, gate, velocity] = note;
    assert.equal(gate, 3); assert.equal(velocity, 120);
    const start = frame(tick), end = frame(tick + gate);
    assert(start >= 2 && end <= 14 && end > start);
    return [start, end - start, ...pulseFacts(key, velocity, cue.volume, cue.voice)];
  }) };
}
const regular = battle.regularAttack;
assert.equal(regular.id, 'effect-regular-attack'); assert.equal(regular.sequence, 351); assert.equal(regular.sourceName, 'EFF_ANIM_2');
assert.equal(regular.player, 'SE2'); assert.equal(regular.voice, 60); assert.equal(regular.duty, .5);
assert.equal(regular.pan, 0); assert.deepEqual(regular.envelope, [0, 0, 15, 0]);
assert.equal(regular.tempoIncrement, 280); assert.equal(regular.trackTicks, 16);
assert.deepEqual(regular.volumeChanges, [[0,52],[0,56],[3,69],[4,73],[6,80],[9,66],[10,62],[11,52],[12,34],[13,7]]);
assert.deepEqual(regular.notes, [[1,82,1,4],[2,82,1,112],[3,80,1,116],[4,78,1,116],[5,75,1,120],[6,70,1,127],[7,66,1,127],[9,69,1,127],[10,71,1,127],[11,74,1,127],[11,76,1,127],[12,78,1,127],[14,80,1,127],[15,83,1,127]]);
const regularFrame = tick => Math.floor((tick * battle.tempo.threshold + regular.tempoIncrement - 1) / regular.tempoIncrement);
const regularNotes = [];
for (const [index, note] of regular.notes.entries()) {
  const [tick, key, gate, velocity] = note;
  const start = regularFrame(tick), next = regular.notes[index + 1];
  const end = Math.min(regularFrame(tick + gate), regularFrame(next?.[0] ?? regular.trackTicks), regularFrame(regular.trackTicks));
  // All source ticks in a frame finish before CgbSound. A later same-frame
  // note replaces this one; a gate ending in its start frame never sounds.
  if (end <= start) continue;
  let volume = 0;
  for (const [at, value] of regular.volumeChanges) if (regularFrame(at) <= start) volume = value;
  const [divisor, envelope] = pulseFacts(key, velocity, volume, regular.voice);
  if (envelope > 0) regularNotes.push([start, end - start, divisor, envelope]);
}
assert.deepEqual(regularNotes, [[2,1,158,7],[3,1,210,8],[4,1,354,9],[5,1,298,8],[6,1,198,6]]);
battleCues[regular.id] = { duty: regular.duty, notes: regularNotes };

assert.equal(createHash('sha256').update(JSON.stringify(battle.pickups)).digest('hex'), '6c41873b9588c90ca3c47832cde60a966730effdece2ed20cb52e3965ac79708', 'Selected pickup controls changed; review and repin them.');
const pickupExpected = [
  [[2,3,334,5],[5,2,224,5],[7,3,178,2],[10,2,148,8],[12,2,112,13],[15,1,112,3],[20,1,112,1]],
  [[3,3,210,5],[6,3,266,8],[9,3,298,2],[12,3,334,7],[15,3,316,14],[19,2,316,4]],
];
for (const [index, cue] of battle.pickups.entries()) {
  const frame = tick => Math.ceil(tick * battle.tempo.threshold / cue.tempoIncrement);
  const controls = new Map();
  let volume = 0, depth = 0, phase = 0, modType = 0;
  for (let tick = 0; tick < cue.trackTicks; tick++) {
    for (const control of cue.controls) if (control.tick === tick) {
      if (control.command === 'VOL') volume = control.value;
      if (control.command === 'MOD') depth = control.value;
      if (control.command === 'MODT') modType = control.value;
    }
    let mod = 0;
    if (depth) {
      // MPlayStart initializes LFOS22/phase0; these tracks do not reset LFO at notes.
      phase = (phase + 22) & 255;
      const triangle = phase < 64 ? phase : phase < 192 ? 128 - phase : phase - 256;
      mod = Math.floor(triangle * depth / 64);
    }
    const scaled = modType === 1 ? volume * 2 * (mod + 128) >> 7 : volume * 2;
    // Later source ticks in the same frame own the final TrkVolPit values.
    controls.set(frame(tick), {right: scaled >> 1, left: 127 * scaled >> 8});
  }
  const notes = [];
  for (const [noteIndex, note] of cue.notes.entries()) {
    const start = frame(note.tick), next = cue.notes[noteIndex + 1];
    const end = Math.min(frame(note.tick + note.gate), frame(next?.tick ?? cue.trackTicks));
    const control = controls.get(start); assert(control);
    const right = 128 * note.velocity * control.right >> 14;
    const left = 127 * note.velocity * control.left >> 14;
    const envelope = Math.min(15, (left + right) >> 4);
    const [divisor] = pulseFacts(note.key, note.velocity, 1, cue.voice);
    // Native sustain counter7 cannot expire within these <=3-frame gates,
    // even with one extra global c15 step. The initial envelope remains held.
    assert(end > start && end - start <= 3 && 7 - (end - start) - 1 >= 3);
    if (envelope > 0) notes.push([start, end - start, divisor, envelope]);
  }
  assert.deepEqual(notes, pickupExpected[index]);
  battleCues[cue.id] = {duty: cue.duty, notes};
}

const generated = `/** Generated from pinned comparative Rescue Team SE2 facts; no music or PCM samples. */\n` +
  `export const MENU_EFFECT_SOURCE_SHA256 = '${createHash('sha256').update(bytes).digest('hex')}';\n` +
  `export const MENU_EFFECT_GAIN = ${data.browserGain};\n` +
  `export const MENU_EFFECT_TICK_SECONDS = ${data.clock.cyclesPerFrame} / ${data.clock.cpuHz};\n` +
  `export const MENU_EFFECT_THROTTLE_SECONDS = ${data.generalMenuThrottleFrames} * MENU_EFFECT_TICK_SECONDS;\n` +
  `/** Each note is [start tick, gate ticks, frequency divisor, four-bit envelope]. */\n` +
  `/** @type {Readonly<Record<string,{duty:number,notes:[number,number,number,number][]}>>} */\n` +
  `export const MENU_EFFECTS = ${JSON.stringify(cues)};\n` +
  `export const BATTLE_EFFECT_SOURCE_SHA256 = '${createHash('sha256').update(battleBytes).digest('hex')}';\n` +
  `/** Native SE2 battle/pickup notes are [start frame, gate frames, frequency divisor, envelope]. */\n` +
  `/** @type {Readonly<Record<string,{duty:number,notes:[number,number,number,number][]}>>} */\n` +
  `export const BATTLE_EFFECTS = ${JSON.stringify(battleCues)};\n`;
if (process.argv.includes('--check')) assert.equal(await readFile(output, 'utf8'), generated, 'Regenerate the menu-effect data.');
else await writeFile(output, generated);
console.log(`Comparative SE2 effects: four menu sequences, two miss/zero sequences, regular351 and pickups330/331, ten data IDs, at most seven bounded pulse notes; static source/data only${sourceArgument >= 0 ? ', source hashes verified' : ''}.`);
