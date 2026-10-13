// Offline texture packing only. Never imports or executes browser/game modules.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { decodePng } from '../blue/native-format.mjs';
import { Raster } from '../pixel/raster.mjs';
const output = new URL('../../../../games/pokemon-dungeon-reimagined/assets/roux/', import.meta.url);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sourceManifestBytes = await readFile(new URL('source.json', import.meta.url));
const sourceManifest = JSON.parse(sourceManifestBytes);
const source = new Raster(1448, 1086);
assert.equal(sourceManifest.strips.length, 6);
for (const [row, record] of sourceManifest.strips.entries()) {
  assert.equal(record.path, `roux-pose-${row}.png`);
  const bytes = await readFile(new URL(record.path, import.meta.url)); assert.equal(hash(bytes), record.sha256);
  const strip = decodePng(bytes); assert.equal(strip.width, 1448); assert.equal(strip.height, 181);
  source.paste(strip, 0, row * 181);
}
assert.equal(hash(source.data), sourceManifest.decodedSha256);
const check = process.argv.includes('--check');
if (!check) await mkdir(output, { recursive: true });
async function emit(name, bytes) {
  if (check) assert((await readFile(new URL(name, output))).equals(bytes), `Stale authored Roux texture: ${name}`);
  else await writeFile(new URL(name, output), bytes);
  return { path: name, bytes: bytes.length, sha256: hash(bytes) };
}
// Nearest-neighbour downsampling and a binary alpha mask keep subpixel edge
// coverage out of the tiny pixel-art texture. RGB under transparent pixels is
// intentionally discarded; those pixels are not part of the character.
function sample(x, y) {
  const at = (Math.floor(y) * source.width + Math.floor(x)) * 4;
  if (source.data[at + 3] < 128) return [0, 0, 0, 0];
  return [...source.data.subarray(at, at + 3), 255];
}
const atlas = new Raster(256, 232), poses = [];
for (let row = 0; row < 6; row++) for (let direction = 0; direction < 8; direction++) {
  const x = direction * 32, y = row * 32;
  for (let py = 0; py < 32; py++) for (let px = 0; px < 32; px++) {
    atlas.data.set(sample(direction * 181 + (px + .5) * 181 / 32, row * 181 + (py + .5) * 181 / 32), ((y + py) * atlas.width + x + px) * 4);
  }
  poses.push([x, y, 32, 32, -16, -28]);
}
const emotions = ['normal', 'happy'];
const portraits = {};
for (const [index, emotion] of emotions.entries()) {
  // Existing directional source expressions supply a compact authored portrait;
  // unsupported emotions deliberately fall back to normal in the renderer.
  const row = emotion === 'happy' ? 1 : 0;
  const x = index * 40, y = 192;
  for (let py = 0; py < 40; py++) for (let px = 0; px < 40; px++) atlas.data.set(sample(28 + (px + .5) * 126 / 40, row * 181 + 18 + (py + .5) * 126 / 40), ((y + py) * atlas.width + x + px) * 4);
  portraits[emotion] = [x, y, 40, 40];
}
const frame = (row, direction, ticks) => [row * 8 + direction, ticks, 0, 0, 0, 0, 0];
// Preserve the existing renderer's numeric selector interface. These are
// authored clips, not native animation/timing facts.
const animations = Array.from({ length: 28 }, (_, animation) => Array.from({ length: 8 }, (_, direction) => {
  if (animation === 0) return [frame(2, direction, 8), frame(3, direction, 8)];
  if (animation === 1) return [frame(0, direction, 4), frame(4, direction, 8), frame(0, direction, 4)];
  if (animation === 5 || animation === 13) return [frame(5, direction, 24)];
  return [frame(0, direction, 18), frame(1, direction, 18)];
}));
const alias = (animation, loop) => ({ animation, loop });
const metadata = { schemaVersion: 3, speciesId: 'pokemon-roux', width: atlas.width, height: atlas.height, poses,
  statusOffsets: poses.map(() => [0, -30]), effectOffsetSets: [[[0, -14], [0, -22], [0, -8]]], effectOffsetIndices: poses.map(() => 0),
  animations, clips: { idle: alias(7, true), walk: alias(0, true), fly: alias(0, true), 'attack-physical': alias(1, false), 'hit-light': alias(6, false), 'rest-sleep': alias(5, true), 'bide-hold': alias(11, true), 'story-sleep': alias(13, true) }, shadowSize: 0, portraits };
const records = [await emit('pokemon-roux.png', atlas.png()), await emit('pokemon-roux.json', Buffer.from(JSON.stringify(metadata) + '\n'))];
const manifest = { schemaVersion: 1, speciesId: 'pokemon-roux', qualification: 'Owner-authored fan addition. Generated from Roux pet reference, then deterministically packed; no original Blue sprite or timing parity claimed.',
  reference: { petId: 'pet_6acc6b6df5e48191b8f7acf7533d6f15', name: 'Roux', description: 'Chocolate-and-white Pomeranian', sha256: 'ba2467027070cef0e9153bd11943c380c2dfcbe5262e4f664828613ef3389da5' },
  source: { path: 'tools/pokemon-dungeon/art/roux/source.json', sha256: hash(sourceManifestBytes), originalGeneratedSha256: sourceManifest.originalGeneratedSha256, decodedSha256: sourceManifest.decodedSha256, width: source.width, height: source.height, creation: 'image_gen, 2026-10-13; transparent 8-direction, 6-pose character sheet' },
  directions: ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'], decodedBytes: atlas.width * atlas.height * 4, records };
await emit('manifest.json', Buffer.from(JSON.stringify(manifest) + '\n'));
await emit('NOTICE.txt', Buffer.from("Roux is an owner-authored fan character based on Justin Law's Roux Work Pet. Art generated with image_gen from the owner's pet reference. Original Blue asset attribution is recorded separately in assets/blue/NOTICE.txt. Rebranding does not establish franchise rights or a rights-holder reuse grant.\n"));
console.log(`Roux authored atlas ${check ? 'verified' : 'exported'}; ${atlas.width}x${atlas.height}, ${manifest.decodedBytes} decoded bytes.`);
