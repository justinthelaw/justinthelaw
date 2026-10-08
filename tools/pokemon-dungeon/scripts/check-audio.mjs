import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as acorn from 'acorn';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = path.resolve(root, '../../games/pokemon-dungeon-reimagined/src/audio/catalog-data.js');
const authoring = path.join(root, 'audio/original-score.json');
const raw = await readFile(authoring, 'utf8');
const data = JSON.parse(raw);
function assert(value, message) { if (!value) throw new Error(message); }
const finite = value => typeof value === 'number' && Number.isFinite(value);
assert(data.revision === 'original-audio-v1' && data.authorship.humanAudition === 'pending', 'Revision/audition evidence changed.');
assert(data.sourceQualification.edition === 'red-comparative' && data.sourceQualification.blueParity === 'unverified', 'Do not infer Blue parity.');
assert(data.sourceQualification.commit === '6bcbec4f906938c0243aa2026bcbd41b577bab85', 'Unexpected source commit.');
assert(data.music.length === 85 && data.effects.length === 28 && data.nativeMusic.length === 75 && data.dungeonMusicIds.length === 76, 'Incomplete declared audio coverage.');
assert(Object.keys(data.patches).length === 9, 'Unexpected patch inventory.');
for (const patch of Object.values(data.patches)) {
  assert(['sine','triangle','square','sawtooth'].includes(patch.wave), 'Invalid waveform.');
  assert(finite(patch.gain) && patch.gain > 0 && patch.gain <= .12 && finite(patch.attack) && patch.attack > 0 && patch.attack <= .1 && finite(patch.release) && patch.release > 0 && patch.release <= .25 && finite(patch.glide) && patch.glide > -1 && patch.glide <= 0, 'Unbounded patch.');
}
const cues = new Map();
let totalNotes = 0, maxMusicVoices = 0, shortest = Infinity, longest = 0;
for (const [bus, entries] of [['music',data.music],['effect',data.effects]]) for (const cue of entries) {
  assert(!cues.has(cue.id) && cue.id.startsWith(`${bus}-`) && cue.title && cue.role, 'Duplicate/malformed cue identity.');
  assert(finite(cue.bpm) && cue.bpm >= 54 && cue.bpm <= 180 && finite(cue.beats) && cue.beats > 0 && cue.beats <= 32 && typeof cue.loop === 'boolean', 'Invalid cue duration.');
  assert(cue.notes.length >= 1 && cue.notes.length <= 128 && (bus !== 'effect' || cue.notes.length <= 8 && !cue.loop), 'Unbounded note bank.');
  let previous = -1;
  const spans = [];
  for (const note of cue.notes) {
    const patch = data.patches[note.patch];
    assert(patch && finite(note.beat) && note.beat >= previous && note.beat >= 0 && finite(note.length) && note.length > 0 && note.beat + note.length < cue.beats, 'Invalid score timing/order.');
    assert(Number.isInteger(note.pitch) && note.pitch >= 12 && note.pitch <= 107 && finite(note.velocity) && note.velocity > 0 && note.velocity <= 1, 'Invalid pitch/velocity.');
    const length = note.length * 60 / cue.bpm + patch.release + .01;
    assert(length <= 4, 'Voice exceeds duration budget.');
    previous = note.beat;
    for (let loop = 0; loop < (cue.loop ? 3 : 1); loop++) {
      const start = (loop * cue.beats + note.beat) * 60 / cue.bpm;
      // Reservation includes the scheduler's 250ms future horizon, not only audible notes.
      spans.push([start - .25, 1], [start + length, -1]);
    }
  }
  spans.sort((a,b) => a[0] - b[0] || a[1] - b[1]);
  let voices = 0, peak = 0;
  for (const [,delta] of spans) { voices += delta; peak = Math.max(peak, voices); }
  if (bus === 'music') { assert(peak <= 16, `Music voice budget exceeded: ${cue.id}`); maxMusicVoices = Math.max(maxMusicVoices, peak); }
  totalNotes += cue.notes.length; cues.set(cue.id, cue);
  const duration = cue.beats * 60 / cue.bpm;
  if (cue.loop) { shortest = Math.min(shortest, duration); longest = Math.max(longest, duration); }
}
const ids = new Set();
for (const row of data.nativeMusic) {
  assert(Number.isInteger(row.nativeId) && !ids.has(row.nativeId) && row.symbol.startsWith('MUS_') && row.qualification === 'red-comparative-blue-parity-unverified' && cues.has(row.cueId), 'Invalid comparative music join.');
  ids.add(row.nativeId);
}
assert(data.dungeonMusicIds.every(id => ids.has(id)), 'Unassigned comparative dungeon index.');
assert(data.nativeEffects.length === 4 && data.nativeEffects.every(row => [301,302,303,304].includes(row.nativeId) && cues.get(row.cueId)?.id.startsWith('effect-')), 'Invalid SFX join.');
assert(data.unassignedNativeMusic.length === 3 && data.unassignedNativeMusic.every(row => !ids.has(row.nativeId)), 'Unused source IDs received invented roles.');
const sourceArgument = process.argv.indexOf('--source-root');
let sourceVerified = false;
if (sourceArgument >= 0) {
  const sourceRoot = process.argv[sourceArgument + 1];
  assert(sourceRoot && !sourceRoot.startsWith('--'), 'Supply a pinned native source directory.');
  const contents = new Map();
  for (const row of data.sourceQualification.files) {
    const bytes = await readFile(path.join(sourceRoot, row.path));
    assert(createHash('sha256').update(bytes).digest('hex') === row.sha256, `Pinned native source changed: ${row.path}`);
    contents.set(row.path, bytes.toString('utf8'));
  }
  const musicIds = new Map();
  let nativeId = 0;
  const header = contents.get('include/constants/bg_music.h').split('enum DungeonMusicID')[0];
  for (const match of header.matchAll(/^\s*(MUS_[A-Z0-9_]+)(?:\s*=\s*(\d+))?/gm)) {
    nativeId = match[2] ? Number(match[2]) : nativeId + 1;
    musicIds.set(match[1], nativeId);
  }
  for (const row of data.nativeMusic) assert(musicIds.get(row.symbol) === row.nativeId, `Source music join mismatch: ${row.symbol}`);
  for (const row of data.unassignedNativeMusic) assert(musicIds.get(row.symbol) === row.nativeId, 'Unassigned native slot mismatch.');
  const table = contents.get('src/dungeon_config.c').match(/const s16 gDungeonMusic\[76\] = \{([\s\S]*?)\};/)[1];
  const sourceIndices = [...table.matchAll(/MUS_[A-Z0-9_]+/g)].map(match => musicIds.get(match[0]));
  assert(JSON.stringify(sourceIndices) === JSON.stringify(data.dungeonMusicIds), 'Source dungeon music index order mismatch.');
  const menu = contents.get('src/dungeon_music.c');
  for (const [functionName,nativeId] of [['PlayDungeonCursorSE',301],['PlayDungeonConfirmationSE',302],['PlayDungeonCancelSE',303],['PlayDungeonStartButtonSE',304]]) {
    const body = menu.match(new RegExp(`void ${functionName}\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\}`))[1];
    const literal = body.match(/PlayFanfareSE\(0x([0-9a-f]+)/i)[1];
    assert(Number(`0x${literal}`) === nativeId, 'Source menu SFX join mismatch.');
  }
  assert(contents.get('src/run_dungeon.c').includes('DungeonStartNewBGM(gDungeonMusic[gDungeon->unk3A10])'), 'Native dungeon music indirection changed.');
  sourceVerified = true;
}
const expected = "/** Original authored note/patch data. Generated from tools/pokemon-dungeon/audio/original-score.json; no audio samples. */\n/** @type {import('./types.js').AudioCatalog} */\nexport const ORIGINAL_AUDIO = " + JSON.stringify(data) + ';\n';
if (process.argv.includes('--write')) await writeFile(runtime, expected);
const emitted = await readFile(runtime, 'utf8');
assert(emitted === expected, 'Runtime score differs from original authoring JSON. Run check-audio.mjs --write.');
// Parse only: no game import, module evaluation, AudioContext, native compilation or audition.
const ast = acorn.parse(emitted, { ecmaVersion:'latest', sourceType:'module' });
assert(ast.body.length === 1 && ast.body[0].type === 'ExportNamedDeclaration' && ast.body[0].declaration?.type === 'VariableDeclaration', 'Runtime bank contains executable source.');
function plain(node) {
  if (node.type === 'Literal') return typeof node.value === 'string' || typeof node.value === 'number' || typeof node.value === 'boolean' || node.value === null;
  if (node.type === 'UnaryExpression') return node.operator === '-' && node.argument.type === 'Literal' && typeof node.argument.value === 'number';
  if (node.type === 'ArrayExpression') return node.elements.every(child => child && plain(child));
  if (node.type === 'ObjectExpression') return node.properties.every(property => property.type === 'Property' && property.kind === 'init' && !property.computed && !property.method && plain(property.value));
  return false;
}
assert(plain(ast.body[0].declaration.declarations[0].init), 'Runtime score is not literal data.');
const bytes = Buffer.byteLength(emitted);
assert(bytes < 1024 * 1024, 'Runtime score exceeds 1MiB.');
console.log(`Original audio static audit: 85 music / 28 effects / 75 qualified music IDs / 76 dungeon indices / 4 menu SFX; ${totalNotes} notes, music reservation peak ${maxMusicVoices}/16, ${shortest.toFixed(2)}–${longest.toFixed(2)}s loops; ${bytes} runtime bytes; SHA-256 ${createHash('sha256').update(emitted).digest('hex')}. ${sourceVerified ? 'Pinned comparative source bytes and numeric joins verified.' : 'Comparative joins declared; use --source-root to recheck pinned source bytes.'} No game execution or audition.`);
