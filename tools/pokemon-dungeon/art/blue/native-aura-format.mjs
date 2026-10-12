// Recover the original two indexed background layers and their palette cycle.
import { Raster } from '../pixel/raster.mjs';
import { renderGroundMap } from './native-ground-format.mjs';

function paletteFrame(bytes, offset) {
  if (offset < 0 || offset + 60 > bytes.length) throw Error('Native aura palette is truncated.');
  const colors = [[0, 0, 0]];
  for (let color = 0; color < 15; color++) colors.push([bytes[offset + color * 4] >> 3, bytes[offset + color * 4 + 1] >> 3, bytes[offset + color * 4 + 2] >> 3]);
  return colors;
}

export function nativeAuraAssets(files, source) {
  const palette = files.get(source.cyan), cycle = files.get(source.cycle), purple = files.get(source.purple);
  const decoded = renderGroundMap(palette, files.get(source.tiles), files.get(source.layout), { includeIndices: true });
  const { width, height } = decoded.layout;
  if (width !== 480 || height !== 384 || decoded.indexLayers.length !== 2) throw Error('Unexpected personality background extent.');
  const indexImage = new Raster(width, height * 2);
  for (let layer = 0; layer < 2; layer++) for (let index = 0; index < width * height; index++) {
    const value = decoded.indexLayers[layer][index];
    if (value > 14) throw Error('The personality background refers to an unexpected palette.');
    const offset = (layer * width * height + index) * 4;
    indexImage.data[offset] = indexImage.data[offset + 1] = indexImage.data[offset + 2] = value * 17;
    indexImage.data[offset + 3] = 255;
  }
  if (cycle.readUInt16LE(0) !== 1 || cycle.readUInt16LE(2) !== 1 || cycle.readUInt16LE(64) !== 8 || cycle.readUInt16LE(66) !== 63 || cycle.length !== 3848) throw Error('Unexpected personality palette cycle.');
  const metadata = {
    width, height, layers: 2, camera: source.camera, displayCenter: source.displayCenter,
    blendCoefficients: source.blendCoefficients, paletteFrameTicks: 8, scrollPixelsPerTick: .5,
    palettes: {
      cycle: Array.from({ length: 63 }, (_, frame) => paletteFrame(cycle, 68 + frame * 60)),
      cyan: [paletteFrame(palette, 4)], purple: [paletteFrame(purple, 4)],
    },
    provenance: 'Original indexed A01P01 BMA/BPC layers and A01P01/A01P02/S01 BPL palettes. Native8:8 blend, opposite half-pixel-per-tick vertical scroll and63 eight-tick palette frames; comparison to Blue timing remains qualified.',
  };
  return { image: indexImage, metadata };
}
