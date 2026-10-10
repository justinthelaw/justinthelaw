// Assemble only published image assets, with recorded provenance and pixel proof.
// This authoring tool never reads a ROM or imports the browser game.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Raster } from '../pixel/raster.mjs';
import { decodePng } from './native-format.mjs';
import { decodeAt4px, renderGroundMap, nativeDungeonAtlas, renderFixedDungeon } from './native-ground-format.mjs';
import { nativeAuraAssets } from './native-aura-format.mjs';
import { nativeBootAssets } from './native-boot-format.mjs';

const sourceRoot = new URL('./native-scenery/', import.meta.url);
const referenceRoot = new URL('./native-reference/', import.meta.url);
const outputRoot = new URL('../../../../games/pokemon-dungeon-reimagined/assets/blue/scenery/', import.meta.url);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const mapping = [0x89,0x9b,0x13,0x09,0x0a,0x03,0xcd,0xff,0x37,0x05,0x00,0x06,0x4c,0x6e,0x26,0x0c,0x01,-1,0x3f,0xcf,0x0b,0x08,0x0f,0x02,0x9f,0x6f,0x0e,0x0d,0x04,0x07,0x7f,0xef,0x4d,0x27,0x1b,0x8b,0xbf,0xdf,0x8d,0x17,0x2e,0x4e,0x8f,0x1f,0x4f,0x2f,0x5f,0xaf];

function crop(image, x, y, width, height) {
  if (x < 0 || y < 0 || x + width > image.width || y + height > image.height) throw Error('A native scenery crop exceeds its source.');
  const result = new Raster(width, height);
  for (let row = 0; row < height; row++) image.data.copy(result.data, row * width * 4, ((y + row) * image.width + x) * 4, ((y + row) * image.width + x + width) * 4);
  return result;
}

function nativeBlue(image) {
  const result = crop(image, 0, 0, image.width, image.height);
  for (let index = 0; index < result.data.length; index += 4) {
    if (!result.data[index + 3]) { result.data.fill(0, index, index + 4); continue; }
    for (let channel = 0; channel < 3; channel++) {
      const value = result.data[index + channel] >> 3;
      result.data[index + channel] = (value << 3) | (value >> 3);
    }
  }
  return result;
}

function exactMatches(left, right) {
  if (left.width !== right.width || left.height !== right.height) throw Error('Pixel evidence dimensions differ.');
  let count = 0;
  for (let index = 0; index < left.data.length; index += 4) if (left.data.subarray(index, index + 4).equals(right.data.subarray(index, index + 4))) count++;
  return count;
}

function nativeTitlePrompt(reference) {
  const source = crop(reference, 93, 143, 77, 13), visited = new Uint8Array(77 * 13), pending = [];
  const outline = index => source.data[index * 4] === 24 && source.data[index * 4 + 1] === 24 && source.data[index * 4 + 2] === 24;
  for (let y = 0; y < 13; y++) for (let x = 0; x < 77; x++) if (x === 0 || x === 76 || y === 0 || y === 12) pending.push(y * 77 + x);
  while (pending.length) {
    const index = pending.pop();
    if (visited[index] || outline(index)) continue;
    visited[index] = 1;
    const x = index % 77, y = Math.floor(index / 77);
    if (x > 0) pending.push(index - 1); if (x < 76) pending.push(index + 1);
    if (y > 0) pending.push(index - 77); if (y < 12) pending.push(index + 77);
  }
  for (let index = 0; index < visited.length; index++) {
    if (visited[index]) source.data.fill(0, index * 4, index * 4 + 4);
    else if (!outline(index) && !source.data.subarray(index * 4, index * 4 + 3).every(value => value === 248)) source.data.fill(0, index * 4, index * 4 + 4);
  }
  return nativeBlue(crop(source, 1, 1, 75, 11));
}

export async function exportNativeScenery({ check = false } = {}) {
  const sourceBytes = await readFile(new URL('sources.json', sourceRoot));
  const sources = JSON.parse(sourceBytes.toString());
  const paletteBytes = await readFile(new URL('blue-palette.json', sourceRoot));
  const palette = JSON.parse(paletteBytes.toString());
  const images = new Map();
  for (const record of sources.records) {
    const bytes = await readFile(new URL(record.path, sourceRoot));
    if (digest(bytes) !== record.sha256 || bytes.length !== record.bytes) throw Error(`Stale native scenery source: ${record.path}`);
    const image = decodePng(bytes);
    if (image.width !== record.width || image.height !== record.height) throw Error(`Wrong native scenery extent: ${record.path}`);
    images.set(record.path.slice('sources/'.length), image);
  }
  const mapSourceBytes = await readFile(new URL('map-sources.json', sourceRoot));
  const mapSources = JSON.parse(mapSourceBytes.toString()), mapFiles = new Map();
  for (const record of mapSources.records) {
    const bytes = await readFile(new URL(record.path, sourceRoot));
    if (digest(bytes) !== record.sha256 || bytes.length !== record.bytes) throw Error(`Stale native map source: ${record.path}`);
    mapFiles.set(record.path.slice('maps/'.length), record.path.endsWith('.at4px') ? decodeAt4px(bytes) : bytes);
  }
  const groundMaps = new Map();
  for (const record of mapSources.groundMaps) groundMaps.set(record.id, renderGroundMap(mapFiles.get(`${record.stem}.bpl`), mapFiles.get(`${record.stem}c.bpc`), mapFiles.get(`${record.stem}m.bma`)).image);
  const nativeTiles = nativeDungeonAtlas(mapFiles.get('b14fon.at4px'), mapFiles.get('b14cel.at4px'), mapFiles.get('b14pal.rgb'));
  const groundTiles = nativeDungeonAtlas(mapFiles.get('b14fon.at4px'), mapFiles.get('b14cel.at4px'), mapFiles.get('b14pal.rgb'), true);
  const nativeLookup = mapFiles.get('b14cex.at4px');
  const rescueEnd = renderFixedDungeon(mapFiles.get('D01P02m.bma'), groundTiles, nativeLookup).image;
  const aura = nativeAuraAssets(mapFiles, mapSources.aura);
  const boot = await nativeBootAssets();
  const itemPalettes = new Map();
  for (const record of sources.palettes) {
    const bytes = await readFile(new URL(record.path, sourceRoot));
    if (digest(bytes) !== record.sha256 || bytes.length !== record.bytes) throw Error('Stale native item palette.');
    const lines = bytes.toString().trim().split(/\r?\n/);
    if (lines[0] !== 'JASC-PAL' || lines[2] !== '16' || lines.length !== 19) throw Error('Unsupported native item palette.');
    itemPalettes.set(record.id, lines.slice(3).map(line => line.trim().split(/\s+/).map(value => {
      const channel = Number(value);
      if (!Number.isInteger(channel) || channel < 0 || channel > 255) throw Error('Invalid native item palette channel.');
      const native = Math.floor(channel * 31 / 256); return (native << 3) | (native >> 3);
    })));
  }
  const items = new Raster(64, 16);
  for (const [column, record] of sources.items.records.entries()) {
    const source = images.get(record.sourcePng), colors = itemPalettes.get(record.paletteId);
    if (!source.indices || source.width !== 16 || source.height !== 16 || !colors) throw Error('Incomplete native item source.');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const index = source.indices[y * 16 + x]; if (index === 0) continue;
      const color = colors[index]; if (!color || color.length !== 3) throw Error('Invalid native item pixel.');
      items.data.set([...color, 255], (y * 64 + column * 16 + x) * 4);
    }
  }
  const referenceBytes = await readFile(new URL('ss02.png', referenceRoot));
  const reference = decodePng(referenceBytes);
  const originalEntry = nativeBlue(images.get('tiny-woods-exterior.png'));
  if (exactMatches(groundMaps.get('tiny-woods-entry'), originalEntry) !== 155520) throw Error('The decoded ground map differs from the published entry image.');
  const entry = crop(groundMaps.get('tiny-woods-entry'), 87, 80, 256, 192);
  if (exactMatches(entry, crop(reference, 8, 208, 256, 192)) !== 36684) throw Error('Tiny Woods entry no longer matches the original Blue screenshot.');
  const worldMap = crop(nativeBlue(images.get('Rescue_Team_-_World_Map.png')), 63, 80, 256, 192);
  if (exactMatches(worldMap, crop(reference, 8, 8, 256, 192)) !== 38427) throw Error('Tiny Woods world map no longer matches the original Blue screenshot.');
  const worldDisplay = crop(reference, 8, 8, 256, 192);
  // Preserve the original marker. Restore only the label's underlying map so
  // the UI renderer can draw the player's selected native window palette.
  worldDisplay.paste(crop(worldMap, 56, 152, 184, 32), 56, 152);
  const postOfficeReference = images.get('Rescue_Team_-_Startup_Cutscene.png');
  const postOfficeComparison = crop(images.get('Tile-24x24-PostOffice.png'), 76, 78, 255, 192);
  for (let index = 0; index < postOfficeComparison.data.length; index += 4) for (let channel = 0; channel < 3; channel++) postOfficeComparison.data[index + channel] &= 248;
  if (exactMatches(postOfficeComparison, postOfficeReference) !== 47952) throw Error('Post Office pixels no longer match the original startup capture.');
  const title = crop(images.get('blue-title-public-preview.png'), 0, 192, 256, 192);
  const siblingTitle = images.get('Rescue_Team_-_Blue_Startup_NA_English_logo.png');
  // The two original captures align at full-display x1 = cropped-display x0.
  // Replace only the captured moving letter with the other frame's unoccluded
  // sky/upper-logo pixels. No pixel is painted or interpolated.
  title.paste(crop(siblingTitle, 177, 0, 36, 18), 178, 0);

  const terrain = new Raster(288, 576);
  const variants = [Array.from({ length: 48 }, () => []), Array.from({ length: 48 }, () => [])];
  for (let variant = 0; variant < 3; variant++) {
    const source = images.get(`TileDtef-TinyWoods-tileset_${variant}.png`);
    for (let type = 0; type < 2; type++) for (let index = 0; index < 48; index++) {
      if (mapping[index] < 0) continue;
      const sourceX = (index % 6 + (type ? 12 : 0)) * 24, sourceY = Math.floor(index / 6) * 24;
      let opaque = 0;
      for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
        const offset = ((sourceY + y) * source.width + sourceX + x) * 4;
        if (!source.data[offset + 3]) continue;
        const color = palette[Array.from(source.data.subarray(offset, offset + 4)).join(',')];
        if (!color) throw Error('A terrain color lacks original Blue screenshot evidence.');
        const targetX = (index % 6 + type * 6) * 24 + x, targetY = variant * 192 + Math.floor(index / 6) * 24 + y;
        terrain.data.set(color, (targetY * terrain.width + targetX) * 4); opaque++;
      }
      if (opaque !== 0 && opaque !== 576) throw Error('A native terrain variant is partly transparent.');
      if (opaque) variants[type][index].push(variant);
    }
  }
  for (let type = 0; type < 2; type++) for (let index = 0; index < 48; index++) if (mapping[index] >= 0 && variants[type][index].length === 0) throw Error('A native terrain adjacency has no complete tile.');

  const proof = JSON.parse(await readFile(new URL('tiny-woods-palette-corroboration.json', sourceRoot), 'utf8'));
  const dungeonReference = decodePng(await readFile(new URL('ss01.png', referenceRoot)));
  for (const match of [...proof.completeTileMatches, ...proof.additionalPatternMatches]) {
    const [x, y] = match.sourceTile, [referenceX, referenceY] = match.referenceLowerScreen;
    const type = x >= 12 ? 1 : 0, targetX = (x % 6 + type * 6) * 24;
    const actual = crop(terrain, targetX, match.variant * 192 + y * 24, 24, 24);
    const expected = crop(dungeonReference, referenceX + 8, referenceY + 208, 24, 24);
    if (exactMatches(actual, expected) !== 576) throw Error('A native Tiny Woods tile differs from the original Blue screenshot.');
  }
  let corroboratedNativeCells = 0;
  for (let type = 0; type < 2; type++) for (const [index, mask] of mapping.entries()) {
    if (mask < 0) continue;
    const nativeMask = (mask & 1) | (mask & 128) >> 6 | (mask & 8) >> 1 | (mask & 64) >> 3 | (mask & 4) << 2 | (mask & 32) | (mask & 2) << 5 | (mask & 16) << 3;
    for (const variant of variants[type][index]) {
      const cell = nativeLookup[((type ? 512 : 0) + nativeMask) * 3 + variant];
      const expected = crop(terrain, (index % 6 + type * 6) * 24, variant * 192 + Math.floor(index / 6) * 24, 24, 24);
      const actual = crop(nativeTiles, cell % 25 * 24, Math.floor(cell / 25) * 24, 24, 24);
      if (exactMatches(actual, expected) !== 576) throw Error('Original Tiny Woods cell lookup differs from the independent image archive.');
      corroboratedNativeCells++;
    }
  }
  if (corroboratedNativeCells !== 206) throw Error('Original Tiny Woods cell coverage changed.');

  if (!check) await mkdir(outputRoot, { recursive: true });
  async function emit(path, bytes) {
    const target = new URL(path, outputRoot);
    if (check) {
      if (!(await readFile(target)).equals(bytes)) throw Error(`Stale native scenery export: ${path}`);
    } else await writeFile(target, bytes);
  }
  const records = [];
  for (const [id, art, provenance] of [
    ['tiny-woods-entry', entry, 'Original scenery crop(87,80,256,192), native Blue channel expansion; corroborated against the original Blue press screenshot.'],
    ['tiny-woods-map', worldDisplay, 'Original Blue upper location map and marker. Label rectangle(56,152,184,32) restored from the independently proven underlying world map so native blue/pink UI can be drawn dynamically.'],
    ['tiny-woods-tiles', nativeTiles, 'Original FON pixels, CEL24px composition and CEX256-neighbor lookup from public source data; all206 archived wall/floor variants match, plus600complete Blue screenshot tile comparisons.'],
    ['tiny-woods-end', crop(rescueEnd, 51, 60, 256, 192), 'Original D01P02 fixed terrain layout with native tileset14 CEX variant0 and full ground-scene palette. Camera(180,168), native Blue displaycenter(129,108).'],
    ['stairs-down', nativeBlue(images.get('Object-Stairs_Down.None.png')), 'Original published stairs image with native Blue channel expansion.'],
    ['post-interior', crop(groundMaps.get('post-interior'), 72, 90, 384, 312), 'Original T01P04 BMA/BPC/BPL image, cropped without scaling; source-world origin(72,90), DS displaycenter(129,108) proven by independent backdrop and exact Pelipper anchors.'],
    ['post-exterior', nativeBlue(crop(images.get('intro-scenes-mirror.png'), 285, 114, 256, 192)), 'Lossless native-size crop from the credited mega_leo introductory scene sheet, then native Blue channel expansion; comparative Rescue Team scene, Blue camera still requires frame corroboration.'],
    ['town-aerial', groundMaps.get('town-aerial'), 'Complete original288x312 S03 ground map decoded from public BMA/BPC/BPL files, including native margins. Daytime palette retained: original Blue video4iTyZkVX9DI at0:24/0:25/0:27 shows no Red sunset transition. Compressed footage is qualitative evidence, not pixel proof.'],
    ['title', nativeBlue(title), 'Original complete256x192 Blue title frame. Captured letter rectangle(178,0,36,18) replaced by unoccluded pixels from the second original title capture at(177,0). No scaling or painted pixels; cloud/ocean phase is one observed frame.'],
    ['title-prompt', nativeTitlePrompt(siblingTitle), 'Original PRESS START pixels at full-display(95,144), isolated by its black outline and enclosed white glyphs; no font substitution.'],
    ['items', items, 'Original16x16 item pixels match public dungeon/itempat data byte-for-byte. Palettes0/3/4/10 and brightness31 follow the comparative source; Blue item palette still requires direct screenshot corroboration.'],
    ['aura-indices', aura.image, 'Two original480x384 personality background index layers, packed without resampling. Grayscale encodes the4-bit palette index; runtime uses original palette data and native integer blending.'],
    ['boot-cards', boot.image, 'Four original Blue company/copyright captures; all48960 pixels per card match native logo data at five-bit precision. Blue copyright is9px lower than Red. Only the omitted blank first column is restored from the proven background.'],
  ]) {
    const path = `${id}.png`, bytes = art.png(); await emit(path, bytes);
    records.push({ id, path, width: art.width, height: art.height, bytes: bytes.length, sha256: digest(bytes), provenance });
  }
  const manifest = {
    schemaVersion: 2, profile: 'blue-native-scenery-v2', rights: sources.rights,
    sources: sources.records, palettes: sources.palettes, sourceManifestSha256: digest(sourceBytes),
    reference: { path: 'tools/pokemon-dungeon/art/blue/native-reference/ss02.png', sha256: digest(referenceBytes) },
    maps: { sourceManifestSha256: digest(mapSourceBytes), records: mapSources.records },
    terrain: { tileSize: 24, sheetWidth: 600, sheetHeight: 240, columns: 25, cellCount: 250, lookup: Array.from(nativeLookup), maskDirections: ['s','se','e','ne','n','nw','w','sw'], paletteSha256: digest(paletteBytes), corroboratedNativeCells, variantSelection: 'Native0/1/2 weighting2:1:1 from an isolated deterministic coordinate hash; original cartridge cosmetic RNG ordering is not yet reproduced.' },
    items: { ...sources.items, cell: 16, anchor: [8, 8] },
    aura: aura.metadata,
    boot: boot.metadata,
    mapLabel: { bounds: [56,152,184,32], textOrigin: [121,162], text: 'Tiny Woods' },
    records,
  };
  await emit('manifest.json', Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = await exportNativeScenery({ check: process.argv.includes('--check') });
  console.log(JSON.stringify({ nativeScenery: manifest.records.length, bytes: manifest.records.reduce((sum, record) => sum + record.bytes, 0) }));
}
