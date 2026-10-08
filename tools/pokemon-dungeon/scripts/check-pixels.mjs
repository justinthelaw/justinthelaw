// Static JSON/PNG/source inspection. Never imports the art generator or game.
import { readFile, realpath, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../art/pixel/', import.meta.url));
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
  assert(ended && width === 1152 && height === 768, 'Wrong atlas dimensions or missing PNG end');
  const raw = inflateSync(Buffer.concat(compressed), { maxOutputLength: (1152 * 4 + 1) * 768 });
  assert(raw.length === (width * 4 + 1) * height, 'PNG decoded byte count mismatch');
  for (let y = 0; y < height; y++) assert(raw[y * (width * 4 + 1)] === 0, 'Exporter requires PNG filter 0');
  return { raw, width };
}
try {
  assert(manifest.schemaVersion === 1 && manifest.profile === 'directional-pixel-v1' && manifest.scope === 'art-only-candidate', 'Unsupported pixel contract');
  assert(same(manifest.cell, { width: 96, height: 96, footAnchor: [48, 92], transparentBorder: 2 }), 'Cell contract changed');
  assert(same(manifest.atlas, { width: 1152, height: 768, columns: 12, rows: 8, origin: 'top-left' }), 'Atlas contract changed');
  assert(same(manifest.directions, ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left']), 'Direction order changed');
  assert(manifest.directionConvention === 'row 0 faces camera; row 2 faces screen-right; row 6 faces screen-left; select nearest 45 degrees of actor heading minus camera bearing', 'Facing convention changed');
  assert(same(manifest.sampling, { min: 'nearest', mag: 'nearest', mipmaps: false, alpha: 'binary-straight', colorSpace: 'srgb' }), 'Sampling contract changed');
  assert(same(manifest.clips, [{ id: 'idle', firstColumn: 0, frames: 4, frameMs: 180, loop: true }, { id: 'walk', firstColumn: 4, frames: 4, frameMs: 110, loop: true }, { id: 'attack-physical', firstColumn: 8, frames: 4, frameMs: 100, loop: false }]), 'Clip layout changed');
  assert(manifest.provenance.method === 'original-code-native-pixel-art' && manifest.provenance.commercialAssetsExtracted === false, 'Missing original-art provenance');
  assert(same(manifest.provenance.sourceFiles.map(source => source.path), ['characters.mjs', 'raster.mjs', 'export.mjs']), 'Source coverage mismatch');
  for (const source of manifest.provenance.sourceFiles) await file(source.path, source.sha256);
  const species = JSON.parse(await readFile(new URL('../content/species.json', import.meta.url), 'utf8'));
  const speciesIds = new Set(species.records.map(record => record.id));
  assert(manifest.characters.length === 3, 'Expected three scoped candidates');
  assert(same(manifest.memory, { decodedRgbaBytesPerAtlas: 3538944, proofCharacterBytes: 10616832, proposedCharacterCacheBytes: 25165824, proposedResidentAtlasLimit: 6, runtimeStreamingImplemented: false }), 'Decoded memory accounting changed');
  const identities = new Set();
  for (const character of manifest.characters) {
    assert(speciesIds.has(character.speciesId) && character.formId === 'default' && ({ pikachu: 'pokemon-025', charmander: 'pokemon-004', groudon: 'pokemon-383' })[character.name] === character.speciesId, 'Unknown species/form or candidate mapping');
    assert(character.assetId === `character.${character.speciesId}.default.pixel-v1` && !identities.has(character.assetId), 'Invalid or duplicate asset identity'); identities.add(character.assetId);
    assert(character.review === 'candidate-unaccepted' && character.coverage.runtimeIntegrated === false, 'Unsupported acceptance claim');
    assert(character.coverage.directions === 8 && same(character.coverage.clips, manifest.clips.map(clip => clip.id)) && same(character.coverage.missingClips, ['turn', 'attack-special', 'cast-status', 'hit-light', 'hit-heavy', 'defeat', 'celebrate', 'rest-sleep', 'interact']), 'Coverage metadata mismatch');
    assert(Number.isFinite(character.worldHeight) && character.worldHeight > 0 && character.worldHeight <= 6, 'Invalid world height');
    const bytes = await file(character.atlas, character.sha256);
    assert(bytes.length === character.encodedBytes && bytes.length <= 1_048_576 && character.decodedRgbaBytes === 1152 * 768 * 4, 'Atlas encoded/decoded size mismatch or budget exceeded');
    const { raw, width } = png(bytes); const stride = width * 4 + 1;
    const directionHashes = [];
    for (let row = 0; row < 8; row++) for (let col = 0; col < 12; col++) {
      let opaque = 0; const frame = Buffer.alloc(96 * 96 * 4);
      for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
        const offset = (row * 96 + y) * stride + 1 + (col * 96 + x) * 4, alpha = raw[offset + 3];
        raw.copy(frame, (y * 96 + x) * 4, offset, offset + 4);
        assert(alpha === 0 || alpha === 255, 'Pixel alpha must be binary');
        if (x < 2 || x > 93 || y < 2 || y > 93) assert(alpha === 0, `Clipped cell border ${character.name}/${row}/${col}`);
        if (alpha) opaque++; else assert(raw[offset] === 0 && raw[offset + 1] === 0 && raw[offset + 2] === 0, 'Transparent RGB must be zero');
      }
      assert(opaque > 400 && opaque < 7500, 'Empty/overfilled character frame');
      if (col === 0) directionHashes.push(hash(frame));
    }
    assert(new Set(directionHashes).size === 8, 'Directions must have distinct rendered frames');
  }
  console.log('Pixel audit passed: 3 species, 288 frames, source/atlas hashes, local paths, PNG CRC/size/alpha/gutters, identities, directions, coverage and timing. Art acceptance remains open.');
} catch (error) { console.error(`Pixel audit failed: ${error.message}`); process.exitCode = 1; }
