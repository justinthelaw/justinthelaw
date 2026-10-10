import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Authoring facts only. Never import or execute browser game modules.
const input = new URL('../audio/blue-menu-effects.json', import.meta.url);
const output = new URL('../../../games/pokemon-dungeon-reimagined/src/blue/audio-menu-data.js', import.meta.url);
const bytes = await readFile(input), data = JSON.parse(bytes);
assert.equal(data.schemaVersion, 1);
assert.equal(data.sourceCommit, '013475aa04f5be3191e5527c186d9bfceae7cae0');
assert.equal(data.edition, 'Red Rescue Team comparative');
assert.equal(data.clock.cpuHz, 16777216); assert.equal(data.clock.cyclesPerFrame, 280896);
assert.equal(data.frequencyBase.length, 12); assert(data.frequencyBase.every(value => Number.isInteger(value) && value < 0));
assert.equal(data.cues.length, 4); assert.equal(data.generalMenuThrottleFrames, 4);
assert(data.browserGain > 0 && data.browserGain <= .3);
const sourceArgument = process.argv.indexOf('--source-root');
if (sourceArgument >= 0) {
  const sourceRoot = process.argv[sourceArgument + 1]; assert(sourceRoot, 'Provide --source-root PATH');
  for (const record of data.sources) {
    assert(!record.path.startsWith('/') && !record.path.split('/').includes('..'));
    assert.equal(createHash('sha256').update(await readFile(path.join(sourceRoot, record.path))).digest('hex'), record.sha256, record.path);
  }
}
const cues = {};
for (const cue of data.cues) {
  assert(/^effect-ui-(cursor|confirm|cancel|open)$/.test(cue.id));
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
    const octave = Math.floor((key - 36) / 12), semitone = (key - 36) % 12;
    const register = (data.frequencyBase[semitone] >> octave) + 2048;
    // Center pan, track volume scale64 and native channel/envelope truncation.
    const right = (velocity * cue.volume) >> 7;
    const left = (127 * velocity * Math.floor(cue.volume * 127 / 128)) >> 14;
    const envelope = Math.min(15, Math.floor((right + left) / 16));
    const nextTick = notes[index + 1]?.[0] ?? Infinity;
    return [tick, Math.min(gate, nextTick - tick), 2048 - register, envelope];
  }) };
}
for (const [alias, target] of Object.entries(data.aliases)) { assert(cues[target]); cues[alias] = cues[target]; }
const generated = `/** Generated from pinned comparative Rescue Team menu-effect facts; no music or PCM samples. */\n` +
  `export const MENU_EFFECT_SOURCE_SHA256 = '${createHash('sha256').update(bytes).digest('hex')}';\n` +
  `export const MENU_EFFECT_GAIN = ${data.browserGain};\n` +
  `export const MENU_EFFECT_TICK_SECONDS = ${data.clock.cyclesPerFrame} / ${data.clock.cpuHz};\n` +
  `export const MENU_EFFECT_THROTTLE_SECONDS = ${data.generalMenuThrottleFrames} * MENU_EFFECT_TICK_SECONDS;\n` +
  `/** Each note is [start tick, gate ticks, frequency divisor, four-bit envelope]. */\n` +
  `/** @type {Readonly<Record<string,{duty:number,notes:[number,number,number,number][]}>>} */\n` +
  `export const MENU_EFFECTS = ${JSON.stringify(cues)};\n`;
if (process.argv.includes('--check')) assert.equal(await readFile(output, 'utf8'), generated, 'Regenerate the menu-effect data.');
else await writeFile(output, generated);
console.log(`Comparative menu effects: four sequences, five roles, at most four bounded pulse notes; static source/data only${sourceArgument >= 0 ? ', source hashes verified' : ''}.`);
