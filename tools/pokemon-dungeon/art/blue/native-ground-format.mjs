// Bounded image-format authoring decoder for public Rescue Team asset files.
// It does not import game code, execute scripts, or accept a ROM image.
import { Raster } from '../pixel/raster.mjs';

const blue = value => { const native = value >> 3; return (native << 3) | (native >> 3); };
const dungeonBlue = value => { const native = Math.floor(value * 31 / 256); return (native << 3) | (native >> 3); };

export function decodeAt4px(source) {
  if (source.subarray(0, 5).toString() !== 'AT4PX' || source.length < 18) throw Error('Expected a published AT4PX asset.');
  const compressed = source.readUInt16LE(5), expanded = source.readUInt16LE(16);
  if (compressed > source.length || source.length - compressed > 3 || source.subarray(compressed).some(value => value !== 0) || expanded > 65535 || expanded === 0) throw Error('Invalid AT4PX extent.');
  const flags = Array.from(source.subarray(7, 16));
  if (new Set(flags).size !== 9) throw Error('AT4PX control codes must be distinct.');
  const output = Buffer.alloc(expanded); let read = 18, written = 0;
  const append = value => { if (written >= expanded) throw Error('AT4PX output exceeds its declared size.'); output[written++] = value; };
  while (read < compressed) {
    const control = source[read++];
    for (let bit = 7; bit >= 0 && read < compressed; bit--) {
      const command = source[read++];
      if (control & (1 << bit)) { append(command); continue; }
      const high = command >> 4, low = command & 15, special = flags.indexOf(high);
      if (special >= 0) {
        const patterns = [[0,0,0,0],[1,0,1,1],[-1,0,0,0],[0,0,0,-1],[0,0,-1,0],[-1,0,-1,-1],[1,0,0,0],[0,0,0,1],[0,0,1,0]];
        const nibbles = patterns[special].map(delta => (low + delta) & 15);
        append(nibbles[0] | nibbles[1] << 4); append(nibbles[2] | nibbles[3] << 4);
      } else {
        if (read >= compressed) throw Error('AT4PX back-reference is truncated.');
        let cursor = written - 4096 + (low << 8) + source[read++];
        if (cursor < 0 || cursor >= written) throw Error('AT4PX back-reference exceeds its decoded prefix.');
        for (let length = high + 3; length > 0; length--) append(output[cursor++]);
      }
    }
  }
  if (written !== expanded) throw Error('AT4PX output is incomplete.');
  return output;
}

export function decodeGroundLayout(source) {
  if (source.length < 12) throw Error('BMA header is missing.');
  const width = source[0] * 8, height = source[1] * 8, chunkWidth = source[2], chunkHeight = source[3];
  const columns = source[4], rows = source[5], layerCount = source.readUInt16LE(6);
  if (!width || !height || width > 1024 || height > 1024 || chunkWidth !== 3 || chunkHeight !== 3 || !columns || columns > 64 || !rows || rows > 64 || layerCount < 1 || layerCount > 2) throw Error('Unsupported BMA dimensions.');
  if (columns * 24 !== width || rows * 24 !== height) throw Error('BMA logical and pixel dimensions disagree.');
  let offset = 12; const layers = [];
  const byte = () => { if (offset >= source.length) throw Error('BMA row data is truncated.'); return source[offset++]; };
  const pair = () => { const value = byte() | byte() << 8 | byte() << 16; return [value & 4095, value >>> 12]; };
  for (let layer = 0; layer < layerCount; layer++) {
    const padded = new Uint16Array(rows * 64);
    for (let row = 0; row < rows; row++) {
      let column = 0;
      while (column < columns) {
        const command = byte(), count = command >= 192 ? command - 191 : command >= 128 ? command - 127 : command + 1;
        const repeated = command >= 128 && command < 192 ? pair() : [0, 0];
        if (column + count * 2 > 64) throw Error('BMA run exceeds its row stride.');
        for (let run = 0; run < count; run++) for (const delta of command >= 192 ? pair() : repeated) {
          padded[row * 64 + column] = delta ^ (row ? padded[(row - 1) * 64 + column] : 0); column++;
        }
      }
    }
    const cells = new Uint16Array(rows * columns);
    for (let row = 0; row < rows; row++) cells.set(padded.subarray(row * 64, row * 64 + columns), row * columns);
    layers.push(cells);
  }
  return { width, height, columns, rows, layers, bytesConsumed: offset };
}

function tilePixels(bytes, count, offset = 0) {
  if (offset < 0 || count < 1 || count > 1024 || offset + count * 32 > bytes.length) throw Error('Invalid native tile pixel extent.');
  const pixels = new Uint8Array(count * 64);
  for (let index = 0; index < count * 32; index++) { const value = bytes[offset + index]; pixels[index * 2] = value & 15; pixels[index * 2 + 1] = value >> 4; }
  return pixels;
}

function paintTile(target, x, y, mapping, pixels, palette, tileCount, indexOutput) {
  const tile = mapping & 1023, paletteOffset = (mapping >>> 12) * 64;
  if (tile >= tileCount || paletteOffset + 64 > palette.length) throw Error('Native map refers to an absent tile or palette.');
  for (let row = 0; row < 8; row++) for (let column = 0; column < 8; column++) {
    const sourceX = mapping & 1024 ? 7 - column : column, sourceY = mapping & 2048 ? 7 - row : row;
    const colorIndex = pixels[tile * 64 + sourceY * 8 + sourceX], color = paletteOffset + colorIndex * 4;
    if (!palette[color + 3]) continue;
    if (indexOutput) indexOutput[(y + row) * target.width + x + column] = (mapping >>> 12) * 16 + colorIndex;
    palette.copy(target.data, ((y + row) * target.width + x + column) * 4, color, color + 4);
  }
}

export function renderGroundMap(paletteBytes, tileBytes, layoutBytes, { includeIndices = false } = {}) {
  const layout = decodeGroundLayout(layoutBytes), palettes = paletteBytes.readUInt16LE(0);
  const tileCount = tileBytes.readUInt16LE(4), chunks = tileBytes.readUInt16LE(14);
  if (palettes < 1 || palettes > 14 || paletteBytes.length < 4 + palettes * 60 || tileBytes.readUInt16LE(0) !== 3 || tileBytes.readUInt16LE(2) !== 3 || tileCount < 2 || tileCount > 1024 || chunks < 2) throw Error('Unsupported native ground palette or tile header.');
  for (let index = 6; index < 14; index += 2) if (tileBytes.readUInt16LE(index)) throw Error('This ground map requires an animated tile source.');
  const palette = Buffer.alloc(palettes * 64);
  for (let index = 0; index < palettes * 15; index++) {
    const target = (Math.floor(index / 15) * 16 + index % 15 + 1) * 4;
    for (let channel = 0; channel < 3; channel++) palette[target + channel] = blue(paletteBytes[4 + index * 4 + channel]);
    palette[target + 3] = 255;
  }
  const pixels = new Uint8Array(tileCount * 64); pixels.set(tilePixels(tileBytes, tileCount - 1, 16), 64);
  const chunkOffset = 16 + (tileCount - 1) * 32;
  if (chunkOffset + (chunks - 1) * 18 > tileBytes.length) throw Error('Native chunk table is truncated.');
  const result = new Raster(layout.width, layout.height), indexLayers = [];
  // BG2 is the foreground; the later BMA layer is rendered behind it.
  for (let layerIndex = layout.layers.length - 1; layerIndex >= 0; layerIndex--) {
    const layer = layout.layers[layerIndex], indices = includeIndices ? new Uint8Array(layout.width * layout.height) : undefined;
    for (let row = 0; row < layout.rows; row++) for (let column = 0; column < layout.columns; column++) {
      const chunk = layer[row * layout.columns + column]; if (!chunk) continue;
      if (chunk >= chunks) throw Error('Native map chunk index exceeds its table.');
      for (let index = 0; index < 9; index++) {
        const mapping = tileBytes.readUInt16LE(chunkOffset + (chunk - 1) * 18 + index * 2);
        paintTile(result, column * 24 + index % 3 * 8, row * 24 + Math.floor(index / 3) * 8, mapping, pixels, palette, tileCount, indices);
      }
    }
    if (indices) indexLayers[layerIndex] = indices;
  }
  return { image: result, layout, indexLayers };
}

export function nativeDungeonAtlas(fontBytes, cellBytes, paletteBytes, ground = false) {
  const tileCount = fontBytes.length / 32, cellCount = cellBytes.length / 18;
  if (!Number.isInteger(tileCount) || !Number.isInteger(cellCount) || cellCount !== 250 || paletteBytes.length !== 768) throw Error('Unexpected Tiny Woods image table extent.');
  const palette = Buffer.alloc(768), expand = ground ? blue : dungeonBlue;
  for (let index = 0; index < 192; index++) {
    for (let channel = 0; channel < 3; channel++) palette[index * 4 + channel] = expand(paletteBytes[index * 4 + channel]);
    palette[index * 4 + 3] = index % 16 ? 255 : 0;
  }
  const pixels = tilePixels(fontBytes, tileCount), image = new Raster(600, 240);
  for (let cell = 0; cell < cellCount; cell++) for (let index = 0; index < 9; index++) {
    paintTile(image, cell % 25 * 24 + index % 3 * 8, Math.floor(cell / 25) * 24 + Math.floor(index / 3) * 8, cellBytes.readUInt16LE(cell * 18 + index * 2), pixels, palette, tileCount);
  }
  return image;
}

export function renderFixedDungeon(layoutBytes, atlas, lookup) {
  const layout = decodeGroundLayout(layoutBytes);
  if (layout.layers.length !== 1 || lookup.length !== 2352) throw Error('Unexpected fixed Tiny Woods layout.');
  const cells = layout.layers[0], image = new Raster(layout.width, layout.height);
  const at = (x, y) => x < 0 || y < 0 || x >= layout.columns || y >= layout.rows ? 0 : cells[y * layout.columns + x];
  const directions = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
  for (let row = 0; row < layout.rows; row++) for (let column = 0; column < layout.columns; column++) {
    const type = at(column, row); if (type !== 0 && type !== 1) throw Error('Unexpected fixed Tiny Woods terrain type.');
    let mask = 0;
    for (const [bit, [dx, dy]] of directions.entries()) if (at(column + dx, row + dy) === type) mask |= 1 << bit;
    const cell = lookup[((type ? 512 : 0) + mask) * 3];
    for (let y = 0; y < 24; y++) {
      const start = ((Math.floor(cell / 25) * 24 + y) * atlas.width + cell % 25 * 24) * 4;
      atlas.data.copy(image.data, ((row * 24 + y) * image.width + column * 24) * 4, start, start + 96);
    }
  }
  return { image, layout };
}
