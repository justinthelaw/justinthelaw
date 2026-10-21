// Offline, authored title/menu composition. Never imports or executes a game.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { blueChannel, decodePng } from '../blue/native-format.mjs';
import { Raster } from '../pixel/raster.mjs';

const output = new URL('../../../../games/pokemon-dungeon-reimagined/assets/roux/', import.meta.url);
const check = process.argv.includes('--check');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = [
  {
    path: 'games/pokemon-dungeon-reimagined/assets/blue/menu-logo.png',
    url: new URL('../../../../games/pokemon-dungeon-reimagined/assets/blue/menu-logo.png', import.meta.url),
    bytes: 11202, sha256: '9b17b2a15b2728a9748f0fcf7688da30fa155aed32cd296f91ee288f72c1fc27',
    role: 'Reproducible native menu export; only the two upper logo tiers are composited.',
  },
  {
    path: 'tools/pokemon-dungeon/art/blue/native-reference/menu-blue-na.png',
    url: new URL('../blue/native-reference/menu-blue-na.png', import.meta.url),
    bytes: 30953, sha256: '39265e9904f19ab2239ce9382a160ec6f73f383b35cd9338a47882629147dad8',
    sourceUrl: 'https://mysterydungeonwiki.com/images/2/26/Rescue_Team_-_Blue_NA_Menu_%26_Controls.png',
    sourcePage: 'https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Blue_NA_Menu_%26_Controls.png',
    role: 'North American English Blue menu mask/palette evidence; original capture provenance is missing on the hosting wiki.',
  },
  {
    path: 'tools/pokemon-dungeon/art/blue/native-scenery/sources/Rescue_Team_-_Blue_Startup_NA_English_logo.png',
    url: new URL('../blue/native-scenery/sources/Rescue_Team_-_Blue_Startup_NA_English_logo.png', import.meta.url),
    bytes: 12122, sha256: '0b91d5437ff548fe51e9f51ef92544277baa91ce893494f315b286dea40e35b3',
    sourceUrl: 'https://mysterydungeonwiki.com/images/4/45/Rescue_Team_-_Blue_Startup_NA_English_logo.png',
    role: 'North American English Blue title supplies native logo pixels through the observed menu palette mapping.',
  },
  {
    path: 'tools/pokemon-dungeon/art/blue/native-reference/panel-pixel-corroboration.json',
    url: new URL('../blue/native-reference/panel-pixel-corroboration.json', import.meta.url),
    bytes: 8705, sha256: '2d58c11cd54ea29bfad29e2e7568dba9c5081a5c3953f9585f0c38fb6f7be335',
    role: 'Existing native menu/logo pixel evidence; does not establish parity of these authored compositions.',
  },
  {
    path: 'tools/pokemon-dungeon/art/roux/source.json',
    url: new URL('source.json', import.meta.url),
    bytes: 4148, sha256: '4c58376cc7194ddeb8a91cb9e8a294343fcda34f38f0d3cdce3063a50aaa00ac',
    role: 'Approved concept A source manifest; unchanged gameplay authoring inputs and original image_gen provenance.',
  },
  {
    path: 'tools/pokemon-dungeon/art/roux/concept-a-body-0.png',
    url: new URL('concept-a-body-0.png', import.meta.url),
    bytes: 410698, sha256: '4f5d74d33178d48558e9b0594ea8e5d694b0cc0780bb321654e917ece81ff0b3',
    role: 'Approved concept A high-resolution rest row. Dedicated title avatar derives directly from the first front-facing cell, not the gameplay atlas.',
  },
];
const inputs = [];
for (const source of sources) {
  const bytes = await readFile(source.url);
  assert.equal(bytes.length, source.bytes, `Changed source length: ${source.path}`);
  assert.equal(digest(bytes), source.sha256, `Changed source hash: ${source.path}`);
  inputs.push(bytes);
}
const nativeLogo = decodePng(inputs[0]), menuCapture = decodePng(inputs[1]);
assert.deepEqual([nativeLogo.width, nativeLogo.height], [256, 192]);
// Corroborate the cropped export against the independent menu capture, using
// the same documented RGB555 display expansion as the native-art exporter.
for (let y = 0; y < 109; y++) for (let x = 0; x < 256; x++) {
  const at = (y * 256 + x) * 4;
  for (let channel = 0; channel < 3; channel++)
    assert.equal(nativeLogo.data[at + channel], blueChannel(menuCapture.data[at + channel]));
}

// Flat runs, stepped contours, clustered foliage and a fixed 5-bit-style
// palette deliberately retain visible single-pixel decisions at DS size.
function rect(image, x, y, width, height, color) {
  for (let row = y; row < y + height; row++) for (let column = x; column < x + width; column++) image.pixel(column, row, color);
}
function noise(x, y, salt = 0) {
  let value = Math.imul(x + 913 + salt, 374761393) ^ Math.imul(y + 739, 668265263);
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return (value ^ value >>> 16) >>> 0;
}
function sky(image, pale = false) {
  const colors = pale ?
    ['#398cce','#4294ce','#4a9cd6','#52a5d6','#5aadd6','#6bb5de','#73bdde','#84c6de','#94cede','#a5d6de','#addee7','#b5e7de'] :
    ['#2984de','#318cde','#3994e7','#429ce7','#4aa5e7','#52ade7','#63b5e7','#6bbde7','#7bc6e7','#8ccee7','#9cd6e7','#addeef'];
  for (let y = 0; y < 192; y++) rect(image, 0, y, 256, 1, colors[Math.min(colors.length-1, Math.floor(y / 13))]);
}
function cloud(image, x, y, size = 1) {
  const shape = [[0,8],[7,8],[7,4],[13,4],[13,1],[23,1],[23,4],[29,4],[29,0],[39,0],[39,3],[44,3],[44,7],[51,7],[51,10],[60,10],[60,14],[65,14],[65,18],[0,18]];
  const points = shape.map(([dx,dy]) => [x + dx * size, y + dy * size]);
  image.polygon(points, '#94c6e7');
  image.polygon(shape.map(([dx,dy]) => [x + dx * size, y + (dy - 3) * size]), '#d6eff7');
  image.polygon([[x,y+9*size],[x+7*size,y+9*size],[x+7*size,y+4*size],[x+16*size,y+4*size],[x+16*size,y],[x+23*size,y],[x+23*size,y+5*size],[x+31*size,y+5*size],[x+31*size,y+3*size],[x+39*size,y+3*size],[x+39*size,y+9*size],[x+46*size,y+9*size],[x+46*size,y+12*size],[x,y+12*size]], '#f7ffff');
}
function grassTuft(image, x, y, color, height = 4) {
  image.polygon([[x-3,y],[x-4,y-height],[x-1,y-2],[x,y-height-2],[x+1,y-2],[x+4,y-height],[x+3,y]], color);
}
function flower(image, x, y, color) {
  rect(image,x,y+2,1,3,'#397339');
  image.pixel(x-1,y,color);image.pixel(x+1,y,color);image.pixel(x,y-1,color);image.pixel(x,y+1,color);image.pixel(x,y,'#ffef9c');
}
function sea(image, top, bottom) {
  rect(image,0,top,256,bottom-top,'#429cce');
  rect(image,0,top,256,2,'#b5e7ef');
  rect(image,0,top+2,256,3,'#7bceda');
  for(let y=top+7;y<bottom;y+=5) {
    rect(image,0,y,256,1,y%2?'#63bdd6':'#73cede');
    for(let x=-18;x<256;x+=27) {
      const shift=noise(x,y)%14;
      rect(image,x+shift,y-1,8+noise(y,x)%13,1,'#b5e7ef');
    }
  }
}
function distantHills(image, y, colors = ['#73b5ad','#528c94','#427b84']) {
  image.polygon([[0,y+23],[0,y+8],[13,y+8],[13,y+4],[28,y+4],[36,y],[49,y+2],[61,y+8],[75,y+11],[89,y+6],[102,y+6],[111,y+12],[128,y+15],[146,y+25]],colors[0]);
  image.polygon([[128,y+28],[147,y+11],[157,y+11],[166,y+6],[177,y+6],[184,y+2],[191,y+2],[199,y+7],[207,y+12],[223,y+14],[236,y+24],[256,y+27]],colors[1]);
  image.polygon([[0,y+27],[9,y+17],[21,y+17],[29,y+12],[40,y+12],[48,y+19],[65,y+20],[77,y+16],[87,y+19],[103,y+22],[118,y+29]],colors[2]);
}
function leafyClump(image, x, y, width, height, dark, middle, light, seed) {
  // Hand-stepped crown silhouette; each clump has a broad shaded underside.
  const points=[[-.5,.1],[-.48,-.16],[-.33,-.16],[-.33,-.34],[-.13,-.34],[-.13,-.48],[.1,-.48],[.1,-.37],[.31,-.37],[.31,-.23],[.45,-.23],[.45,0],[.52,0],[.52,.22],[.35,.22],[.35,.36],[.15,.36],[.15,.43],[-.13,.43],[-.13,.32],[-.37,.32],[-.37,.16],[-.5,.16]];
  image.polygon(points.map(([dx,dy])=>[x+Math.round(dx*width),y+Math.round(dy*height)]),dark);
  image.polygon([[-.46,.03],[-.43,-.16],[-.27,-.16],[-.27,-.32],[-.07,-.32],[-.07,-.44],[.1,-.44],[.1,-.32],[.27,-.32],[.27,-.2],[.4,-.2],[.4,.03],[.24,.03],[.24,.16],[.05,.16],[.05,.24],[-.2,.24],[-.2,.12]].map(([dx,dy])=>[x+Math.round(dx*width),y+Math.round(dy*height)]),middle);
  for(let row=-Math.floor(height*.33);row<height*.16;row+=3)for(let column=-Math.floor(width*.36);column<width*.32;column+=4) {
    if(noise(column+seed,row,seed)%7>2)continue;
    const px=x+column,py=y+row,at=(py*image.width+px)*4;
    if(px<0||px>=256||py<0||py>=192)continue;
    const rgb=parseInt(middle.slice(1),16);
    if(image.data[at]!==rgb>>16||image.data[at+1]!==((rgb>>8)&255)||image.data[at+2]!==(rgb&255))continue;
    rect(image,px,py,3+noise(row,column)%3,1,light);
    if(noise(column,row)%3===0)rect(image,px-1,py+1,3,1,light);
  }
}
function tree(image, x, foot, scale, seed = 0) {
  const s=value=>Math.round(value*scale), top=foot-s(73);
  image.polygon([[x-s(6),foot],[x-s(3),top+s(35)],[x+s(4),top+s(34)],[x+s(7),foot],[x+s(14),foot+s(2)],[x-s(14),foot+s(2)]],'#395231');
  image.polygon([[x-s(3),foot],[x-s(2),top+s(34)],[x+s(1),top+s(34)],[x+s(2),foot]],'#94734a');
  image.line(x,top+s(45),x-s(13),top+s(33),'#526339',s(3));
  image.line(x+s(2),top+s(47),x+s(15),top+s(30),'#526339',s(3));
  const colors=['#295a42','#3a7b42','#6ba54a'];
  leafyClump(image,x-s(15),top+s(25),s(43),s(37),...colors,seed+3);
  leafyClump(image,x+s(16),top+s(24),s(44),s(37),...colors,seed+5);
  leafyClump(image,x,top+s(7),s(45),s(37),...colors,seed+11);
  leafyClump(image,x-s(8),top+s(34),s(42),s(28),...colors,seed+16);
  leafyClump(image,x+s(18),top+s(36),s(37),s(26),...colors,seed+19);
  rect(image,x-s(2),foot-s(12),s(2),s(7),'#b5945a');
}
function shrub(image,x,y,size,seed) {
  leafyClump(image,x,y,size,Math.round(size*.61),'#315a39','#528c42','#8cb552',seed);
}

// Authored compact block lettering; separate from the native in-game font.
const alphabet = {
  A:['01110','11011','11011','11111','11011','11011','11011'],
  D:['11110','11011','11011','11011','11011','11011','11110'],
  E:['11111','11000','11000','11110','11000','11000','11111'],
  N:['11011','11011','11111','11111','11111','11011','11011'],
  O:['01110','11011','11011','11011','11011','11011','01110'],
  R:['11110','11011','11011','11110','11110','11011','11011'],
  S:['01111','11000','11000','01110','00011','00011','11110'],
  T:['11111','01110','00100','00100','00100','00100','00100'],
  U:['11011','11011','11011','11011','11011','11011','01110'],
  V:['11011','11011','11011','11011','11011','01010','00100'],
  X:['11011','11011','01010','00100','01010','11011','11011'],
  "'":['11','11','10','00','00','00','00'],
  ' ':['000','000','000','000','000','000','000'],
};
function banner(image) {
  image.polygon([[10,112],[32,109],[224,109],[246,112],[241,123],[246,134],[222,132],[34,132],[10,135],[15,123]],'#4a291d');
  image.polygon([[13,114],[33,112],[223,112],[242,114],[237,123],[242,131],[223,129],[33,129],[14,132],[18,123]],'#b57b42');
  image.polygon([[22,109],[234,109],[234,134],[230,138],[26,138],[22,134]],'#4a291d');
  image.polygon([[24,109],[232,109],[232,133],[229,136],[27,136],[24,133]],'#f7d694');
  rect(image,26,111,204,2,'#fff7ce');
  rect(image,26,132,204,2,'#c69452');
  rect(image,28,134,200,1,'#a56b39');
  const text="ROUX'S ADVENTURE", scale=2;
  const total=[...text].reduce((sum,char)=>sum+alphabet[char][0].length*scale+1,0)-1;
  let x=Math.floor((256-total)/2);
  for(const character of text) {
    const glyph=alphabet[character];
    for(let y=0;y<glyph.length;y++)for(let column=0;column<glyph[y].length;column++)if(glyph[y][column]==='1')rect(image,x+column*scale+1,116+y*scale+1,scale,scale,'#d6a563');
    for(let y=0;y<glyph.length;y++)for(let column=0;column<glyph[y].length;column++)if(glyph[y][column]==='1')rect(image,x+column*scale,115+y*scale,scale,scale,y<2?'#734229':'#4a291d');
    x+=glyph[0].length*scale+1;
  }
}

// Use the approved, larger front/rest source directly. Enlarging the gameplay
// atlas would repeat its 24px facial detail rather than recover this source.
const avatarPalette = ['1c1210','382017','572c18','713a1d','8c4822','a86231','c4874b','dca366',
  'eab983','f8d4a3','ffebc6','fff8e3','ffffff','ac4444','eb8b83','f5b09a']
  .map(hex => [...Buffer.from(hex, 'hex'), 255]);
const avatarSourceManifest = JSON.parse(inputs[4]);
assert.equal(avatarSourceManifest.body.records[0].sha256, sources[5].sha256);
assert.equal(avatarSourceManifest.body.records[0].path, 'concept-a-body-0.png');
assert.equal(avatarSourceManifest.bodyRows[0], 'rest');
assert.equal(avatarSourceManifest.directions[0], 's');
const avatarSource = decodePng(inputs[5]);
assert.deepEqual([avatarSource.width,avatarSource.height],[1586,222]);
const avatarCell = [0,0,Math.floor(avatarSource.width/8),avatarSource.height];
function isolateAvatar(image, rect = [0,0,image.width,image.height]) {
  const [left,top,width,height]=rect,seen=new Uint8Array(width*height);
  const opaque=index=>image.data[((top+Math.floor(index/width))*image.width+left+index%width)*4+3]>=192;
  let largest=[];
  for(let start=0;start<seen.length;start++) {
    if(seen[start]||!opaque(start))continue;
    const pending=[start],component=[];seen[start]=1;
    while(pending.length) {
      const index=pending.pop(),x=index%width,y=Math.floor(index/width);component.push(index);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
        const nx=x+dx,ny=y+dy,next=ny*width+nx;
        if(nx<0||ny<0||nx>=width||ny>=height||seen[next]||!opaque(next))continue;
        seen[next]=1;pending.push(next);
      }
    }
    if(component.length>largest.length)largest=component;
  }
  assert(largest.length>0,'Empty title avatar source.');
  const xs=largest.map(index=>index%width),ys=largest.map(index=>Math.floor(index/width));
  const minX=Math.min(...xs),minY=Math.min(...ys),maxX=Math.max(...xs),maxY=Math.max(...ys);
  const result=new Raster(maxX-minX+1,maxY-minY+1);
  for(const index of largest) {
    const x=index%width,y=Math.floor(index/width),at=((top+y)*image.width+left+x)*4;
    result.data.set([...image.data.subarray(at,at+3),255],((y-minY)*result.width+x-minX)*4);
  }
  return {image:result,bounds:[left+minX,top+minY,maxX-minX+1,maxY-minY+1]};
}
const avatarSubject=isolateAvatar(avatarSource,avatarCell);
const avatarScale=Math.min(50/avatarSubject.image.width,50/avatarSubject.image.height);
function avatarColor(rgb) {
  let selected=avatarPalette[0],distance=Infinity;
  for(const color of avatarPalette) {
    const delta=color.slice(0,3).reduce((sum,value,index)=>sum+(value-rgb[index])**2,0);
    if(delta<distance){selected=color;distance=delta;}
  }
  return selected;
}
function titleAvatar(method='nearest') {
  const subject=avatarSubject.image;
  const scaled=new Raster(Math.ceil(subject.width*avatarScale),Math.ceil(subject.height*avatarScale));
  for(let y=0;y<scaled.height;y++)for(let x=0;x<scaled.width;x++) {
    if(method==='nearest') {
      const sx=Math.floor((x+.5)/avatarScale),sy=Math.floor((y+.5)/avatarScale);
      if(sx>=subject.width||sy>=subject.height)continue;
      const at=(sy*subject.width+sx)*4;
      if(subject.data[at+3])scaled.data.set(avatarColor(subject.data.subarray(at,at+3)),(y*scaled.width+x)*4);
      continue;
    }
    // Both axes project through exactly one scale. Average only the isolated
    // subject's covered source area, then quantize once to the existing palette.
    const left=x/avatarScale,right=(x+1)/avatarScale,top=y/avatarScale,bottom=(y+1)/avatarScale;
    const rgb=[0,0,0];let covered=0;
    for(let sy=Math.floor(top);sy<Math.min(subject.height,Math.ceil(bottom));sy++)for(let sx=Math.floor(left);sx<Math.min(subject.width,Math.ceil(right));sx++) {
      const at=(sy*subject.width+sx)*4;if(!subject.data[at+3])continue;
      const weight=(Math.min(right,sx+1)-Math.max(left,sx))*(Math.min(bottom,sy+1)-Math.max(top,sy));
      covered+=weight;for(let channel=0;channel<3;channel++)rgb[channel]+=subject.data[at+channel]*weight;
    }
    if(covered<(right-left)*(bottom-top)*.42)continue;
    scaled.data.set(avatarColor(rgb.map(value=>value/covered)),(y*scaled.width+x)*4);
  }
  const fitted=isolateAvatar(scaled).image,result=new Raster(64,56);
  assert(fitted.width<=50&&fitted.height<=50);
  result.ellipse(32,52,17,2,'#572c18');result.ellipse(32,51,13,2,'#713a1d');
  const left=Math.floor((64-fitted.width)/2),top=52-fitted.height;
  for(let y=0;y<fitted.height;y++)for(let x=0;x<fitted.width;x++) {
    const at=(y*fitted.width+x)*4;
    if(fitted.data[at+3])fitted.data.copy(result.data,((top+y)*64+left+x)*4,at,at+4);
  }
  return {image:result,bodyBounds:[left,top,fitted.width,fitted.height]};
}
const avatar=titleAvatar();

function titleArt() {
  const image=new Raster(256,192);sky(image);
  cloud(image,-31,35,1);cloud(image,207,47,1);cloud(image,-18,111,1);
  cloud(image,215,105,1);cloud(image,51,139,1);cloud(image,151,137,.75);
  distantHills(image,145,['#94c6b5','#7badb5','#6ba5ad']);
  sea(image,155,192);
  // Sunlit headland. The upper sprite silhouette sits against sea and sky;
  // A separate native-size title avatar lands on this calm grass patch.
  image.polygon([[125,192],[134,184],[145,184],[156,174],[174,172],[186,167],[214,168],[225,165],[243,168],[256,166],[256,192]],'#527b42');
  image.polygon([[139,192],[148,184],[161,180],[181,178],[195,174],[220,174],[231,171],[256,173],[256,192]],'#7ba54a');
  image.polygon([[154,192],[165,185],[191,184],[203,180],[230,179],[256,182],[256,192]],'#94b55a');
  image.polygon([[124,192],[132,184],[140,182],[151,175],[158,174],[154,178],[142,187],[140,192]],'#d6c68c');
  image.polygon([[132,192],[144,183],[157,177],[166,175],[174,175],[164,178],[149,184],[141,192]],'#a59c6b');
  for(let x=151;x<256;x+=7) {
    const y=179+noise(x,0)%12;
    if(x>175&&x<229&&y>183)continue;
    grassTuft(image,x,y,'#638c42',2);
  }
  for(const[x,y]of [[159,184],[238,183],[246,190]])flower(image,x,y,'#fff7ce');
  for(const[x,y]of [[167,190],[250,179]])flower(image,x,y,'#e7a573');
  // Remove the single solid native backdrop color. This crops before the
  // original Blue ribbon first appears at y109; our banner covers y109+.
  let logoPixels=0;
  for(let y=0;y<109;y++)for(let x=0;x<256;x++) {
    const at=(y*256+x)*4;
    if(nativeLogo.data[at]===0&&nativeLogo.data[at+1]===105&&nativeLogo.data[at+2]===219)continue;
    nativeLogo.data.copy(image.data,at,at,at+4);logoPixels++;
  }
  assert.equal(logoPixels,16850);
  banner(image);
  return image;
}
function landscapeArt() {
  const image=new Raster(256,192);sky(image,true);
  cloud(image,30,10,.75);cloud(image,128,25,.75);cloud(image,202,3,1);
  distantHills(image,63,['#94bdad','#7ba5a5','#6b9c94']);
  sea(image,93,139);
  // Gentle valley wall slopes into a distant coastal rescue trail.
  image.polygon([[0,83],[27,83],[43,88],[63,87],[80,94],[105,93],[128,100],[153,98],[172,105],[189,109],[200,117],[213,124],[256,131],[256,192],[0,192]],'#73945a');
  image.polygon([[0,102],[35,103],[57,108],[86,107],[103,114],[131,110],[152,114],[169,117],[182,126],[207,130],[226,134],[256,135],[256,192],[0,192]],'#8cad63');
  image.polygon([[0,127],[31,124],[52,130],[73,127],[92,132],[122,126],[142,133],[164,131],[182,139],[208,139],[235,147],[256,145],[256,192],[0,192]],'#a5bd6b');
  // Native-size stepped bends, not a smoothed vector path.
  const path=[[177,108],[183,108],[183,113],[195,116],[195,120],[209,124],[221,127],[230,134],[227,141],[217,145],[213,152],[201,158],[198,166],[184,173],[177,183],[173,192],[124,192],[132,182],[145,174],[155,166],[166,160],[177,153],[185,146],[191,140],[196,137],[197,132],[192,128],[190,124],[183,120],[181,115]];
  image.polygon(path,'#8c9463');
  image.polygon(path.map(([x,y])=>[x,y-2]),'#d6bd84');
  image.polygon([[181,111],[182,115],[188,119],[194,122],[196,126],[208,130],[215,134],[214,139],[204,145],[200,151],[187,159],[181,167],[166,177],[158,188],[156,192],[135,192],[143,182],[159,171],[168,164],[184,153],[190,146],[200,138],[201,132],[196,127],[191,123],[185,119]],'#e7ce94');
  for(let y=121;y<192;y+=6)for(let x=137;x<230;x+=8) {
    const at=(y*256+x)*4;
    if(image.data[at]===231&&noise(x,y)%3===0)rect(image,x,y,3+noise(y,x)%3,1,'#c6b584');
  }
  // Distant forest clusters frame open sky; quieter left center supports UI.
  for(const[x,y,s,seed]of [[5,94,27,1],[25,100,24,3],[47,105,20,5],[74,110,21,7],[104,114,18,11],[137,117,20,13],[165,119,18,17],[239,121,32,19],[259,117,34,23]])shrub(image,x,y,s,seed);
  tree(image,-4,137,1.1,27);
  tree(image,234,125,1.17,41);
  tree(image,266,144,1.1,53);
  // Small trail marker with a cream rescue pennant, intentionally no text.
  rect(image,205,105,3,23,'#6b5231');rect(image,206,105,1,21,'#bd9c63');
  image.polygon([[199,108],[218,108],[222,112],[218,116],[199,116]],'#6b5231');
  image.polygon([[200,109],[217,109],[220,112],[217,114],[200,114]],'#efdeae');
  rect(image,203,110,7,1,'#c6ad7b');rect(image,203,112,9,1,'#c6ad7b');
  image.polygon([[207,96],[220,99],[219,107],[207,104]],'#b5634a');
  image.polygon([[208,97],[218,100],[217,103],[208,102]],'#e7b573');
  // Seeded clusters sit along the path and front border, leaving the helper
  // window zone free of baked text, ornaments or fake UI frames.
  for(let y=122;y<192;y+=6)for(let x=3;x<256;x+=8) {
    const at=(y*256+x)*4;
    if(image.data[at]!==165&&image.data[at]!==140)continue;
    if(noise(x,y)%3===0)grassTuft(image,x+noise(y,x)%4,y,'#7b9c52',2);
    else if(noise(x,y)%7===0)rect(image,x,y,3,1,'#b5c67b');
  }
  for(const[x,y]of [[10,145],[24,154],[36,179],[56,186],[112,187],[233,153],[244,168],[233,187]])flower(image,x,y,'#fff7ce');
  for(const[x,y]of [[17,173],[47,185],[94,184],[228,158],[248,183]])flower(image,x,y,'#deb584');
  for(const[x,y]of [[7,160],[29,182],[103,189],[242,158]])flower(image,x,y,'#ce8c8c');
  image.polygon([[0,187],[10,181],[23,184],[36,180],[49,183],[60,179],[72,184],[89,181],[104,185],[119,183],[126,192],[0,192]],'#638442');
  for(let x=2;x<127;x+=6)grassTuft(image,x,188+noise(x,3)%5,'#395f39',5+noise(x,4)%3);
  for(let x=2;x<119;x+=9)grassTuft(image,x,186+noise(x,5)%5,'#94b55a',3);
  shrub(image,252,189,43,83);shrub(image,229,199,34,89);
  for(const[x,y]of [[23,184],[74,188],[112,189],[248,181]])flower(image,x,y,'#fff7ce');
  return image;
}

if(!check)await mkdir(output,{recursive:true});
async function emit(path,bytes) {
  if(check)assert((await readFile(new URL(path,output))).equals(bytes),`Stale authored menu asset: ${path}`);
  else await writeFile(new URL(path,output),bytes);
  return {path,bytes:bytes.length,sha256:digest(bytes)};
}
const records=[];
const images=[['menu-title.png',titleArt()],['menu-landscape.png',landscapeArt()],['menu-roux.png',avatar.image]];
for(const[path,image]of images) {
  const bytes=image.png(),decoded=decodePng(bytes);
  const transparent=path==='menu-roux.png';
  assert.deepEqual([decoded.width,decoded.height],transparent?[64,56]:[256,192]);
  assert(decoded.data.equals(image.data),'PNG roundtrip changed authored pixels.');
  if(transparent) {
    assert(image.data.some((value,index)=>index%4===3&&value===0),'Title avatar must retain transparency.');
    assert(image.data.every((value,index)=>index%4!==3||value===0||value===255),'Title avatar must use binary alpha.');
  } else assert(image.data.every((value,index)=>index%4!==3||value===255),'Menu backgrounds must be opaque.');
  assert(bytes.length<32768,'Authored menu PNG exceeds its per-image budget.');
  records.push({...await emit(path,bytes),width:image.width,height:image.height,decodedSha256:digest(image.data)});
}
const manifest={
  schemaVersion:1,profile:'roux-authored-menu-v1',
  qualification:'Authored fan adaptation inspired by Blue Rescue Team. Only the documented native logo crop retains source pixels; neither complete scene claims native pixel parity.',
  authoring:'Original integer-grid Raster scenery and banner composition, plus a dedicated uniformly reduced title avatar from approved concept A artwork. No game modules are loaded.',
  sources:sources.map(source=>Object.fromEntries(Object.entries(source).filter(([key])=>key!=='url'))),
  logo:{crop:[0,0,256,109],backdropRemoved:[0,105,219],destination:[0,0],bannerBounds:[10,109,236,29],text:"ROUX'S ADVENTURE",
    qualification:'The original Blue ribbon begins at y109 and is excluded. The authored banner covers the lowest Mystery Dungeon tips; this overlap is an adaptation, not an original logo reconstruction.'},
  titleAvatar:{sourceCell:avatarCell,isolatedSourceBounds:avatarSubject.bounds,alphaThreshold:192,connectedSubject:'Largest 8-connected component before and after reduction.',uniformScale:avatarScale,
    resampling:'Direct nearest sampling through one uniform scale, then nearest existing chocolate/cream palette color. Compared with covered-area averaging; nearest preserves clearer eyes, nose, cream blaze and paws.',palette:avatarPalette.map(color=>`#${Buffer.from(color.slice(0,3)).toString('hex')}`),bodyBounds:avatar.bodyBounds,
    shadow:'Authored chocolate ellipses within y49..54, behind paws; no gameplay sprite or native shadow is enlarged.',qualification:'Dedicated title presentation asset derived directly from approved source artwork, separate from the gameplay atlas.'},
  composition:{titleHero:{x:170,y:136,width:64,height:56,scale:1,clearRegion:[170,138,64,54]},menuChoiceWindow:{x:12,y:27,width:184,rowHeight:22,verticalPadding:16},menuHelperWindow:[12,137,232,38],menuFooter:[0,178,256,14],
    qualification:'Window bounds and separate native-size Roux asset placement guide the runtime; UI and avatar are not baked into the backgrounds.'},
  records,
};
await emit('menu-manifest.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
await emit('menu-NOTICE.txt',Buffer.from('Roux menu/title scenery, cream-and-chocolate banner and lettering are authored fan adaptations created with the offline tools/pokemon-dungeon/art/roux/menu.mjs pipeline. The dedicated title avatar is a uniformly reduced cutout of the owner-approved concept A artwork generated with image_gen from the owner\'s Roux reference, separate from the gameplay atlas. The upper Pokemon / Mystery Dungeon logo tiers use a documented crop of the North American English Blue Rescue Team menu export. Original game artwork: Nintendo / The Pokemon Company / Chunsoft. Source captures are credited to Mystery Dungeon Wiki; original menu-capture provenance is incomplete on the hosting wiki. Source URLs, hashes, crop and qualifications are recorded in the authoring manifest. These custom compositions do not claim original native scene or pixel parity. Public artwork and attribution do not establish a publisher reuse grant. Roux character attribution is recorded separately in NOTICE.txt.\n'));
if(process.argv.includes('--preview')) {
  const preview=new Raster(768,1152);
  images.slice(0,2).forEach(([,image],index)=>{
    for(let y=0;y<192;y++)for(let x=0;x<256;x++)for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++) {
      const source=(y*256+x)*4,target=(((index*192+y)*3+dy)*preview.width+x*3+dx)*4;
      image.data.copy(preview.data,target,source,source+4);
    }
  });
  const previewDirectory=new URL('../../.work/roux-menu/',import.meta.url);
  await mkdir(previewDirectory,{recursive:true});
  await writeFile(new URL('authored-scenes-3x.png',previewDirectory),preview.png());
  for(const method of ['nearest','area']) {
    const candidate=titleAvatar(method).image,enlarged=new Raster(256,224);
    for(let y=0;y<56;y++)for(let x=0;x<64;x++)for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++)candidate.data.copy(enlarged.data,((y*4+dy)*256+x*4+dx)*4,(y*64+x)*4,(y*64+x)*4+4);
    await writeFile(new URL(`title-avatar-${method}-4x.png`,previewDirectory),enlarged.png());
  }
}
console.log(`Roux authored menu ${check?'verified':'exported'}: ${records.map(record=>`${record.path} ${record.bytes} bytes`).join(', ')}.`);
