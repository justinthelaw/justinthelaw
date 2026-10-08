// Original integer-grid authoring primitives; no downloaded/raster source assets.
import { deflateSync } from 'node:zlib';
export const SIZE = 96;
export class Raster {
  constructor(width = SIZE, height = SIZE) { this.width = width; this.height = height; this.data = Buffer.alloc(width * height * 4); }
  pixel(x, y, color) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    const value = parseInt(color.slice(1), 16);
    this.data[i] = value >> 16; this.data[i + 1] = value >> 8 & 255; this.data[i + 2] = value & 255; this.data[i + 3] = 255;
  }
  polygon(points, color) {
    const low = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
    const high = Math.min(this.height - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
    for (let y = low; y <= high; y++) {
      const edges = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if ((a[1] > y + .5) !== (b[1] > y + .5)) edges.push(a[0] + (y + .5 - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      edges.sort((a, b) => a - b);
      for (let i = 0; i < edges.length; i += 2) for (let x = Math.ceil(edges[i]); x < edges[i + 1]; x++) this.pixel(x, y, color);
    }
  }
  ellipse(x, y, rx, ry, color) {
    for (let j = Math.floor(y - ry); j <= y + ry; j++) for (let i = Math.floor(x - rx); i <= x + rx; i++) if (((i - x) / rx) ** 2 + ((j - y) / ry) ** 2 <= 1) this.pixel(i, j, color);
  }
  line(x, y, endX, endY, color, width = 1) {
    const n = Math.max(Math.abs(endX - x), Math.abs(endY - y), 1);
    for (let i = 0; i <= n; i++) this.ellipse(x + (endX - x) * i / n, y + (endY - y) * i / n, width / 2, width / 2, color);
  }
  paste(source, x, y) { for (let row = 0; row < source.height; row++) source.data.copy(this.data, ((y + row) * this.width + x) * 4, row * source.width * 4, (row + 1) * source.width * 4); }
  png() {
    const header = Buffer.alloc(13); header.writeUInt32BE(this.width); header.writeUInt32BE(this.height, 4); header[8] = 8; header[9] = 6;
    const raw = Buffer.alloc((this.width * 4 + 1) * this.height);
    for (let y = 0; y < this.height; y++) this.data.copy(raw, y * (this.width * 4 + 1) + 1, y * this.width * 4, (y + 1) * this.width * 4);
    return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
  }
}
function chunk(name, bytes) {
  const type = Buffer.from(name); const input = Buffer.concat([type, bytes]); let crc = 0xffffffff;
  for (const byte of input) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  const result = Buffer.alloc(bytes.length + 12); result.writeUInt32BE(bytes.length); input.copy(result, 4); result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4); return result;
}
