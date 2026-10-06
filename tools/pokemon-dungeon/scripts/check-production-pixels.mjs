// Static JSON/PNG/source inspection. Never imports the art generator or game.
import { readFile, realpath, lstat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../art/production/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
const assert = (valid, message) => { if (!valid) throw new Error(message); };
const same = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function file(relative, sha256) {
  assert(/^(?:[a-z0-9][a-z0-9.-]*\/)*[a-z0-9][a-z0-9.-]*$/.test(relative), 'Non-local pixel resource');
  const target = path.join(root, relative);
  let component = root;
  for (const segment of relative.split('/')) { component = path.join(component, segment); assert(!(await lstat(component)).isSymbolicLink(), 'Symlink pixel resource'); }
  assert((await realpath(target)).startsWith(root), 'Pixel resource escaped root');
  const bytes = await readFile(target); assert(hash(bytes) === sha256, `Stale hash: ${relative}`); return bytes;
}
function png(bytes) {
  assert(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'Invalid PNG signature');
  const compressed = []; let width, height, ended = false;
  for (let offset = 8; offset < bytes.length;) {
    const size = bytes.readUInt32BE(offset), name = bytes.toString('ascii', offset + 4, offset + 8);
    assert(offset + size + 12 <= bytes.length, 'PNG chunk exceeds file');
    const data = bytes.subarray(offset + 8, offset + 8 + size);
    let crc = 0xffffffff;
    for (const byte of bytes.subarray(offset + 4, offset + 8 + size)) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
    assert(((crc ^ 0xffffffff) >>> 0) === bytes.readUInt32BE(offset + 8 + size), `PNG ${name} CRC mismatch`);
    if (name === 'IHDR') { assert(offset === 8 && size === 13, 'Malformed IHDR'); width = data.readUInt32BE(0); height = data.readUInt32BE(4); assert(data[8] === 8 && data[9] === 6 && data[10] === 0 && data[11] === 0 && data[12] === 0, 'Require non-interlaced 8-bit RGBA'); }
    else if (name === 'IDAT') compressed.push(data);
    else if (name === 'IEND') { assert(size === 0 && offset + 12 === bytes.length, 'Invalid PNG end'); ended = true; }
    else throw new Error(`Unsupported PNG chunk ${name}`);
    offset += size + 12;
  }
  assert(ended && width === 384 && height === 768, 'Wrong atlas dimensions or missing PNG end');
  const raw = inflateSync(Buffer.concat(compressed), { maxOutputLength: (384 * 4 + 1) * 768 });
  assert(raw.length === (width * 4 + 1) * height, 'PNG decoded byte count mismatch');
  for (let y = 0; y < height; y++) assert(raw[y * (width * 4 + 1)] === 0, 'Exporter requires PNG filter 0');
  return { raw, width };
}
const names = ['bulbasaur', 'charmander', 'squirtle', 'chikorita', 'cyndaquil', 'totodile', 'treecko', 'torchic', 'mudkip', 'pikachu', 'meowth', 'psyduck', 'machop', 'cubone', 'eevee', 'skitty'];
const numbers = [1, 4, 7, 152, 155, 158, 252, 255, 258, 25, 52, 54, 66, 104, 133, 300];
const requiredClips = ['idle', 'walk', 'turn', 'attack-physical', 'attack-special', 'cast-status', 'hit-light', 'hit-heavy', 'defeat', 'celebrate', 'rest-sleep', 'interact'];
try {
  assert(manifest.schemaVersion === 2 && manifest.profile === 'directional-pixel-clip-v2' && manifest.scope === 'starter-wave-art-only' && manifest.review === 'candidate-unaccepted', 'Contract/claim mismatch');
  assert(same(manifest.cell, { width: 96, height: 96, footAnchor: [48, 92], transparentBorder: 2 }), 'Cell contract changed');
  assert(same(manifest.page, { width: 384, height: 768, columns: 4, rows: 8, origin: 'top-left' }), 'Page layout changed');
  assert(same(manifest.directions, ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left']), 'Direction ordering mismatch');
  assert(manifest.directionConvention === 'nearest 45 degrees of actor heading minus camera bearing', 'Direction convention mismatch');
  assert(same(manifest.sampling, { min: 'nearest', mag: 'nearest', mipmaps: false, alpha: 'binary-straight', colorSpace: 'srgb' }), 'Sampling mismatch');
  assert(same(manifest.memory, { decodedRgbaBytesPerPage: 1179648, characterPageCeilingBytes: 25165824, maxResidentPages: 21, viewerVisiblePageLimit: 3, runtimeStreamingImplemented: false }), 'Memory accounting mismatch');
  assert(manifest.memory.maxResidentPages * manifest.memory.decodedRgbaBytesPerPage <= manifest.memory.characterPageCeilingBytes && (manifest.memory.maxResidentPages + 1) * manifest.memory.decodedRgbaBytesPerPage > manifest.memory.characterPageCeilingBytes, 'Page ceiling arithmetic');
  assert(same(manifest.clips.map(c => c.id), requiredClips), 'Clip vocabulary mismatch');
  for (const clip of manifest.clips) {
    assert(clip.frames === 4 && clip.durationsMs.length === 4 && clip.durationsMs.every(ms => Number.isInteger(ms) && ms >= 60 && ms <= 1000), 'Invalid clip durations');
    assert(clip.loop === ['idle', 'walk', 'rest-sleep'].includes(clip.id) && clip.restart === 'explicit-caller' && clip.end === (clip.loop ? 'repeat' : 'clamp-last'), 'Clip playback policy mismatch');
    assert(typeof clip.poseSequence === 'string' && clip.poseSequence.length > 6, 'Missing pose sequence');
  }
  assert(manifest.provenance.method === 'original-code-native-pixel-art' && manifest.provenance.commercialAssetsExtracted === false && manifest.provenance.rasterInputs === false, 'Provenance mismatch');
  const expectedSources = ['characters.mjs', 'painter.mjs', 'pose.mjs', 'export.mjs', ...names.map(name => `species/${name}.mjs`)];
  assert(same(manifest.provenance.sourceFiles.map(s => s.path), expectedSources), 'Missing authored source hash');
  for (const source of manifest.provenance.sourceFiles) {
    const text = (await file(source.path, source.sha256)).toString('utf8');
    assert(!/\bfetch\s*\(|\bhttps?:\/\/|games\/|readFile\([^)]*\.(?:png|jpg|gif)/.test(text), `Non-original/import boundary: ${source.path}`);
  }
  assert(manifest.provenance.sharedRaster.path === '../pixel/raster.mjs', 'Unexpected raster dependency');
  assert(hash(await readFile(new URL('../art/pixel/raster.mjs', import.meta.url))) === manifest.provenance.sharedRaster.sha256, 'Stale shared raster hash');
  const catalog = JSON.parse(await readFile(new URL('../content/species.json', import.meta.url), 'utf8'));
  const speciesIds = new Set(catalog.records.map(r => r.id));
  assert(same(manifest.characters.map(c => c.name), names), 'Exact starter roster mismatch');
  const index = JSON.parse(await file(manifest.pageIndex.path, manifest.pageIndex.sha256));
  assert(index.schemaVersion === 2 && index.pages.length === 192, 'Page index mismatch');
  const expectedIndex = [], globalPages = new Set(), silhouetteHashes = new Set(); let total = 0, max = 0;
  for (const [i, c] of manifest.characters.entries()) {
    assert(c.speciesId === `pokemon-${String(numbers[i]).padStart(3, '0')}` && speciesIds.has(c.speciesId), 'Canonical identity mismatch');
    assert(c.assetId === `character.${c.speciesId}.default.pixel-v2` && c.formId === 'default' && c.review === 'candidate-unaccepted' && c.runtimeIntegrated === false, 'Asset identity/review mismatch');
    assert(c.source === `species/${c.name}.mjs` && c.features.length >= 4 && new Set(c.features).size === c.features.length, 'Dedicated anatomy metadata missing');
    assert(Number.isFinite(c.worldHeight) && c.worldHeight >= 1 && c.worldHeight <= 3, 'Invalid authored scale');
    assert(same(c.pages.map(p => p.clip), requiredClips), 'Page clip coverage mismatch');
    const neutral = [], clipSignatures = new Set();
    for (const page of c.pages) {
      assert(page.path === `output/${c.name}-${page.clip}.png`, 'Incorrect page path');
      const bytes = await file(page.path, page.sha256); total += bytes.length; max = Math.max(max, bytes.length);
      assert(bytes.length === page.encodedBytes && bytes.length < 1048576 && page.decodedRgbaBytes === 1179648, 'Page size mismatch');
      assert(!globalPages.has(page.sha256), 'Duplicate species/clip page'); globalPages.add(page.sha256);
      expectedIndex.push({ speciesId: c.speciesId, assetId: c.assetId, clip: page.clip, path: page.path, sha256: page.sha256, encodedBytes: page.encodedBytes, decodedRgbaBytes: page.decodedRgbaBytes });
      const { raw, width } = png(bytes), stride = width * 4 + 1, hashes = [];
      for (let row = 0; row < 8; row++) {
        const rowHashes = [];
        for (let col = 0; col < 4; col++) {
          const frame = Buffer.alloc(96 * 96 * 4); let opaque = 0, bottom = 0;
          for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
            const offset = (row * 96 + y) * stride + 1 + (col * 96 + x) * 4, alpha = raw[offset + 3];
            raw.copy(frame, (y * 96 + x) * 4, offset, offset + 4);
            assert(alpha === 0 || alpha === 255, 'Binary alpha required');
            if (x < 2 || x > 93 || y < 2 || y > 93) assert(alpha === 0, `Gutter breach ${c.name}/${page.clip}/${row}/${col} at ${x},${y}`);
            if (alpha) { opaque++; bottom = Math.max(bottom, y); } else assert(raw[offset] === 0 && raw[offset + 1] === 0 && raw[offset + 2] === 0, 'Transparent RGB must be zero');
          }
          assert(opaque > 350 && opaque < 6800, `Empty/overfilled ${c.name}/${page.clip}/${row}/${col}`);
          if (page.clip === 'idle') assert(bottom >= 83 && bottom <= 93, 'Neutral ground anchor mismatch');
          const h = hash(frame); hashes.push(h); rowHashes.push(h);
          if (page.clip === 'idle' && col === 0) { neutral.push(h); if (row === 0) { const silhouette = Buffer.from(frame.filter((_, ix) => ix % 4 === 3)); const sh = hash(silhouette); assert(!silhouetteHashes.has(sh), 'Recolored shared silhouette'); silhouetteHashes.add(sh); } }
        }
        assert(new Set(rowHashes).size >= 2, `Static action row ${c.name}/${page.clip}/${row}`);
      }
      assert(same(hashes, page.frameHashes), 'Stale frame hashes');
      const signature = hash(Buffer.from(hashes.join(''))); assert(!clipSignatures.has(signature), 'Relabeled clip'); clipSignatures.add(signature);
    }
    assert(new Set(neutral).size === 8, `Duplicate neutral direction ${c.name}`);
  }
  assert(same(index.pages, expectedIndex), 'Index is stale relative to manifest');
  assert(same((await readdir(path.join(root, 'output'))).sort(), index.pages.map(p => path.basename(p.path)).sort()), 'Unindexed or stale output files');
  assert(same((await readdir(path.join(root, 'species'))).sort(), names.map(n => `${n}.mjs`).sort()), 'Unexpected or missing dedicated species source');
  assert(manifest.evidence.length === 32, 'Contact/clip evidence missing');
  for (const evidence of manifest.evidence) { const b = await file(evidence.path, evidence.sha256); assert(b.length === evidence.encodedBytes && b.length < 1048576, 'Evidence size mismatch'); }
  console.log(`Production pixel audit passed: 16 species / 192 unique pages / 6144 nonempty cells; PNG CRC, local paths, alpha, gutters, unique silhouettes/views/clips, frame/source/index hashes, timing and memory. ${total} encoded page bytes; largest ${max}; each decoded page 1.125 MiB. Art acceptance remains open.`);
} catch (error) { console.error(`Production pixel audit failed: ${error.message}`); process.exitCode = 1; }
