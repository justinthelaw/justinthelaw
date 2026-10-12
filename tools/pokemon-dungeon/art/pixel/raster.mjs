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
  /** Lossless PNG; indexed output is selected only when it is smaller.
   * @param {{indexed?:boolean}} [options] */
  png(options = {}) {
    const rgba = rgbaPng(this);
    if (options.indexed === false) return rgba;
    const indexed = indexedPng(this);
    return indexed && indexed.length < rgba.length ? indexed : rgba;
  }
}
function chunk(name, bytes) {
  const type = Buffer.from(name); const input = Buffer.concat([type, bytes]); let crc = 0xffffffff;
  for (const byte of input) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  const result = Buffer.alloc(bytes.length + 12); result.writeUInt32BE(bytes.length); input.copy(result, 4); result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4); return result;
}

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function rgbaPng(image) {
  const header = Buffer.alloc(13); header.writeUInt32BE(image.width); header.writeUInt32BE(image.height, 4); header[8] = 8; header[9] = 6;
  const raw = Buffer.alloc((image.width * 4 + 1) * image.height);
  for (let y = 0; y < image.height; y++) image.data.copy(raw, y * (image.width * 4 + 1) + 1, y * image.width * 4, (y + 1) * image.width * 4);
  return Buffer.concat([signature, chunk('IHDR', header), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function paeth(a,b,c){const value=a+b-c,da=Math.abs(value-a),db=Math.abs(value-b),dc=Math.abs(value-c);return da<=db&&da<=dc?a:db<=dc?b:c;}
function indexedPng(image) {
  const colors=[],lookup=new Map(),indices=Buffer.alloc(image.width*image.height);
  for(let index=0;index<indices.length;index++){
    const rgba=image.data.readUInt32BE(index*4),key=String(rgba);let selected=lookup.get(key);
    if(selected===undefined){selected=colors.length;if(selected===256)return null;lookup.set(key,selected);colors.push([...image.data.subarray(index*4,index*4+4)]);}
    indices[index]=selected;
  }
  const depth=colors.length<=2?1:colors.length<=4?2:colors.length<=16?4:8,stride=Math.ceil(image.width*depth/8),packed=Buffer.alloc(stride*image.height);
  for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const bit=x*depth;packed[y*stride+(bit>>3)]|=indices[y*image.width+x]<<(8-depth-bit%8);}
  const raw=Buffer.alloc((stride+1)*image.height);
  for(let y=0;y<image.height;y++){
    const row=packed.subarray(y*stride,(y+1)*stride),prior=y?packed.subarray((y-1)*stride,y*stride):null;let best,bestFilter=0,bestScore=Infinity;
    for(let filter=0;filter<5;filter++){
      const candidate=Buffer.alloc(stride);let score=0;
      for(let x=0;x<stride;x++){const value=row[x],left=x?row[x-1]:0,above=prior?prior[x]:0,corner=x&&prior?prior[x-1]:0;candidate[x]=filter===0?value:filter===1?value-left:filter===2?value-above:filter===3?value-Math.floor((left+above)/2):value-paeth(left,above,corner);score+=Math.min(candidate[x],256-candidate[x]);}
      if(score<bestScore){best=candidate;bestFilter=filter;bestScore=score;}
    }
    raw[y*(stride+1)]=bestFilter;best.copy(raw,y*(stride+1)+1);
  }
  const header=Buffer.alloc(13);header.writeUInt32BE(image.width);header.writeUInt32BE(image.height,4);header[8]=depth;header[9]=3;
  const parts=[signature,chunk('IHDR',header),chunk('PLTE',Buffer.from(colors.flatMap(color=>color.slice(0,3))))];let lastAlpha=-1;
  for(let index=0;index<colors.length;index++)if(colors[index][3]!==255)lastAlpha=index;
  if(lastAlpha>=0)parts.push(chunk('tRNS',Buffer.from(colors.slice(0,lastAlpha+1).map(color=>color[3]))));
  parts.push(chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0)));return Buffer.concat(parts);
}
