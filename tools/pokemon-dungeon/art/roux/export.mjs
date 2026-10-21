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
assert.equal(sourceManifest.schemaVersion, 2);
async function readSheet(record) {
  const sheet = new Raster(record.width, record.height);
  for (const part of record.records) {
    const bytes = await readFile(new URL(part.path, import.meta.url));
    assert.equal(hash(bytes), part.sha256); assert.equal(bytes.length, part.bytes);
    const strip = decodePng(bytes), [x, y, width, height] = part.rect;
    assert.deepEqual([strip.width, strip.height], [width, height]);
    sheet.paste(strip, x, y);
  }
  assert.equal(hash(sheet.data), record.decodedSha256);
  return sheet;
}
const source = await readSheet(sourceManifest.body);
const portraitSource = await readSheet(sourceManifest.portraits);
const check = process.argv.includes('--check');
if (!check) await mkdir(output, { recursive: true });
async function emit(name, bytes) {
  if (check) assert((await readFile(new URL(name, output))).equals(bytes), `Stale authored Roux texture: ${name}`);
  else await writeFile(new URL(name, output), bytes);
  return { path: name, bytes: bytes.length, sha256: hash(bytes) };
}
// A single shared palette retains concept A's chocolate/cream shading without
// carrying illustration-sized color noise into a 32px game sprite.
const palette = ['1c1210','382017','572c18','713a1d','8c4822','a86231','c4874b','dca366',
  'eab983','f8d4a3','ffebc6','fff8e3','ffffff','ac4444','eb8b83','f5b09a']
  .map(hex => [...Buffer.from(hex, 'hex'), 255]);
function nearestColor(rgba) {
  let best = palette[0], distance = Infinity;
  for (const color of palette) {
    const delta = color.slice(0, 3).reduce((sum, channel, index) => sum + (channel - rgba[index]) ** 2, 0);
    if (delta < distance) { distance = delta; best = color; }
  }
  return best;
}

// Isolate the subject before measuring/scaling. Fixed whole-row sampling used
// to admit fragments from a neighboring pose. Repeat after downsampling so a
// thin fur tip cannot become an independent floating pixel at game resolution.
function connectedSubject(image, rect = [0, 0, image.width, image.height]) {
  const [left, top, width, height] = rect, seen = new Uint8Array(width * height);
  const opaque = index => image.data[((top + Math.floor(index / width)) * image.width + left + index % width) * 4 + 3] >= 192;
  let largest = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || !opaque(start)) continue;
    const pending = [start], component = []; seen[start] = 1;
    while (pending.length) {
      const current = pending.pop(), x = current % width, y = Math.floor(current / width); component.push(current);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, next = ny * width + nx;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || seen[next] || !opaque(next)) continue;
        seen[next] = 1; pending.push(next);
      }
    }
    if (component.length > largest.length) largest = component;
  }
  assert(largest.length > 0, 'Empty Roux source cell');
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (const index of largest) { const x = index % width, y = Math.floor(index / width); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  const result = new Raster(maxX - minX + 1, maxY - minY + 1);
  for (const index of largest) {
    const x = index % width, y = Math.floor(index / width), at = ((top + y) * image.width + left + x) * 4;
    result.data.set([...image.data.subarray(at, at + 3), 255], ((y - minY) * result.width + x - minX) * 4);
  }
  return result;
}
function resizeSubject(subject, scale) {
  const width = Math.max(1, Math.round(subject.width * scale)), height = Math.max(1, Math.round(subject.height * scale));
  const result = new Raster(width, height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sx = Math.floor((x + .5) * subject.width / width), sy = Math.floor((y + .5) * subject.height / height), at = (sy * subject.width + sx) * 4;
    if (subject.data[at + 3]) result.data.set(nearestColor(subject.data.subarray(at, at + 4)), (y * width + x) * 4);
  }
  return connectedSubject(result);
}
const bodySubjects = sourceManifest.body.records.map(record => Array.from({ length: 8 }, (_, direction) => {
  const left = Math.floor(direction * source.width / 8), right = Math.floor((direction + 1) * source.width / 8);
  return connectedSubject(source, [left, record.rect[1], right - left, record.rect[3]]);
}));
// Use one scale per direction across rest/walk/attack/sleep, so a crouch stays
// shorter instead of being enlarged to the standing height.
const scales = Array.from({ length: 8 }, (_, direction) => Math.min(
  26 / Math.max(...bodySubjects.map(row => row[direction].width)),
  25 / Math.max(...bodySubjects.map(row => row[direction].height))));
const bodyFrames = bodySubjects.map(row => row.map((subject, direction) => {
  const fitted = resizeSubject(subject, scales[direction]), cell = new Raster(32, 32);
  cell.paste(fitted, Math.floor((32 - fitted.width) / 2), 28 - fitted.height);
  return cell;
}));
// A local one-pixel lift in the middle of the coat suggests breathing while
// keeping head, feet, silhouette and anchor identical to the resting pose.
// Both frames come from the same artwork, not independently generated poses.
function breathingFrame(rest) {
  const result = new Raster(32, 32); rest.data.copy(result.data);
  for (let y = 17; y <= 21; y++) for (let x = 8; x <= 23; x++) {
    const at = (y * 32 + x) * 4, below = at + 32 * 4;
    if (rest.data[at + 3] && rest.data[below + 3]) rest.data.copy(result.data, at, below, below + 4);
  }
  return result;
}
const rows = [bodyFrames[0], bodyFrames[0].map(breathingFrame), ...bodyFrames.slice(1)];
const atlas = new Raster(256, 232), poses = [];
for (let row = 0; row < 6; row++) for (let direction = 0; direction < 8; direction++) {
  const x = direction * 32, y = row * 32;
  atlas.paste(rows[row][direction], x, y);
  poses.push([x, y, 32, 32, -16, -28]);
}
const portraits = {};
for (const [index, emotion] of sourceManifest.portraitEmotions.entries()) {
  const subject = connectedSubject(portraitSource, sourceManifest.portraits.records[index].rect);
  const fitted = resizeSubject(subject, Math.min(36 / subject.width, 38 / subject.height));
  const x = index * 40, y = 192;
  atlas.paste(fitted, x + Math.floor((40 - fitted.width) / 2), y + 2);
  portraits[emotion] = [x, y, 40, 40];
}
const directions = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
const directionOffsets = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
// Each tuple is [art row, ticks, forward displacement, flags]. Body and shadow
// move together on the ground. Flag2 launches a cast effect; flag1 releases the
// presentation wait before displaying an already-decided result.
// Separate marker frames let the existing presentation owner retain recovery.
const actionFrames = {
  1: [[0,4,-1,0],[4,4,1,2],[4,6,4,1],[4,4,2,0],[0,6,0,0]], // physical lunge
  2: [[0,4,-1,0],[4,4,2,2],[4,6,3,1],[0,6,0,0]], // Bite
  3: [[0,4,0,0],[4,6,0,2],[4,6,0,1],[0,8,0,0]], // Growl
  6: [[0,2,-2,0],[0,6,-3,0],[0,2,0,0]], // recoil and settle
  12: [[0,4,-1,0],[4,4,0,2],[4,6,1,1],[0,6,0,0]], // Ground actions
};
const frame = (row, direction, ticks, forward = 0, flags = 0) => {
  const [dx,dy] = directionOffsets[direction], x = dx * forward, y = dy * forward;
  return [row * 8 + direction, ticks, x, y, x, y, flags];
};
// Preserve the existing renderer's numeric selector interface. These are
// authored clips, not native animation/timing facts. The contact poses slow
// walking to a 24-tick cycle without repainting the approved two stride frames.
const animations = Array.from({ length: 28 }, (_, animation) => Array.from({ length: 8 }, (_, direction) => {
  if (animation === 0) return [frame(0, direction, 4), frame(2, direction, 8), frame(0, direction, 4), frame(3, direction, 8)];
  if (actionFrames[animation]) return actionFrames[animation].map(([row,ticks,forward,flags]) => frame(row,direction,ticks,forward,flags));
  if (animation === 5 || animation === 13) return [frame(5, direction, 24)];
  return animation === 7 ? [frame(0, direction, 48), frame(1, direction, 24)] : [frame(0, direction, 18), frame(1, direction, 18)];
}));
const alias = (animation, loop) => ({ animation, loop });
const metadata = { schemaVersion: 3, speciesId: 'pokemon-roux', width: atlas.width, height: atlas.height, poses,
  statusOffsets: poses.map(() => [0, -30]), effectOffsetSets: [[[0, -14], [0, -22], [0, -8]]], effectOffsetIndices: poses.map(() => 0),
  animations, clips: { idle: alias(7, true), walk: alias(0, true), fly: alias(0, true), 'attack-physical': alias(1, false), 'hit-light': alias(6, false), 'rest-sleep': alias(5, true), 'bide-hold': alias(11, true), 'story-sleep': alias(13, true) }, shadowSize: 1, portraits };
const records = [await emit('pokemon-roux.png', atlas.png()), await emit('pokemon-roux.json', Buffer.from(JSON.stringify(metadata) + '\n'))];
const manifest = { schemaVersion: 1, speciesId: 'pokemon-roux', qualification: 'Owner-authored fan addition. User-selected concept A, generated from Roux pet reference, then deterministically isolated, palette-reduced and packed; no original Blue sprite or timing parity claimed.',
  reference: { petId: 'pet_6acc6b6df5e48191b8f7acf7533d6f15', name: 'Roux', description: 'Chocolate-and-white Pomeranian', sha256: 'ba2467027070cef0e9153bd11943c380c2dfcbe5262e4f664828613ef3389da5' },
  source: { path: 'tools/pokemon-dungeon/art/roux/source.json', sha256: hash(sourceManifestBytes), originalGeneratedSha256: sourceManifest.body.originalGeneratedSha256, decodedSha256: sourceManifest.body.decodedSha256, width: source.width, height: source.height, creation: 'image_gen, 2026-10-13; selected concept A, 8 directions and 5 source poses plus dedicated normal/happy/shocked portraits; breathing derived from rest' },
  directions, decodedBytes: atlas.width * atlas.height * 4, records };
await emit('manifest.json', Buffer.from(JSON.stringify(manifest) + '\n'));
await emit('NOTICE.txt', Buffer.from("Roux is an owner-authored fan character based on Justin Law's Roux Work Pet. Art generated with image_gen from the owner's pet reference. Original Blue asset attribution is recorded separately in assets/blue/NOTICE.txt. Rebranding does not establish franchise rights or a rights-holder reuse grant.\n"));
console.log(`Roux authored atlas ${check ? 'verified' : 'exported'}; ${atlas.width}x${atlas.height}, ${manifest.decodedBytes} decoded bytes.`);
