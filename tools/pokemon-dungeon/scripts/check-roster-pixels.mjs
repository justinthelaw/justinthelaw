// Static bounded-file/identity/raster audit. Never imports generator or game modules.
import {readFile,readdir,realpath,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../art/roster/',import.meta.url));
const artRoot=path.resolve(root,'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
async function file(relative,sha){assert(/^(?:\.\.\/(?:production|pixel)\/)?[a-z0-9][a-z0-9./-]*$/.test(relative)&&!relative.includes('\\'),'Nonlocal art path');const target=path.resolve(root,relative);assert(target.startsWith(artRoot+path.sep),'Art path escape');assert(!(await lstat(target)).isSymbolicLink()&&(await realpath(target))===target,'Symlink art path');const bytes=await readFile(target);assert(bytes.length<1048576,`File budget ${relative}`);if(sha)assert(hash(bytes)===sha,`Stale file ${relative}`);return bytes;}
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

const m=JSON.parse(await file('manifest.json'));
assert(m.schemaVersion===2&&m.profile==='directional-pixel-clip-v2'&&m.review==='candidate-unaccepted'&&m.runtimeIntegrated===false,'Contract/review claim');
assert(same(m.cell,{width:96,height:96,footAnchor:[48,92],transparentBorder:2}),'Frozen anchor/cell');
assert(same(m.page,{width:384,height:768,columns:4,rows:8}),'Frozen page');
assert(same(m.directions,['front','front-right','right','back-right','back','back-left','left','front-left']),'Direction order');
assert(m.directionConvention==='nearest 45 degrees of actor heading minus camera bearing','Heading/camera convention');
assert(m.memory.decodedRgbaBytesPerPage===1179648&&m.memory.characterPageCeilingBytes===25165824&&m.memory.viewerVisiblePageLimit===3&&m.memory.maxResidentPages===21,'Memory contract');
assert(m.provenance.method==='original-code-native-pixel-art'&&m.provenance.rasterInputs===false&&m.provenance.commercialAssetsExtracted===false,'Originality declaration');
for(const source of m.provenance.sourceFiles){const code=(await file(source.path,source.sha256)).toString();assert(!/(?:from|import)\s*['"][^'"]*games\//.test(code),'Forbidden game import');}
const expectedProfiles=(await Promise.all([1,2,3,4,5].map(async n=>JSON.parse(await readFile(new URL(`../content/species-runtime/profiles-${n}.json`,import.meta.url),'utf8')).records))).flat();
const chars=(await Promise.all(m.shards.map(async s=>JSON.parse(await file(s.path,s.sha256)).characters))).flat();
const indexes=(await Promise.all(m.pageIndexes.map(async s=>JSON.parse(await file(s.path,s.sha256)).pages))).flat();
assert(chars.length===419&&new Set(chars.map(c=>c.profileId)).size===419&&new Set(chars.map(c=>c.speciesId)).size===386,'Exact profile/species coverage');
const map=new Map(expectedProfiles.map(p=>[p.id,p]));
const required=['idle','walk','turn','attack-physical','attack-special','cast-status','hit-light','hit-heavy','defeat','celebrate','rest-sleep','interact'];
assert(same(m.clips.map(c=>c.id),required),'Clip families');
for(const c of m.clips)assert(c.frames===4&&c.durationsMs.length===4&&c.durationsMs.every(t=>t>=60&&t<=1000)&&c.restart==='explicit-caller'&&c.end===(c.loop?'repeat':'clamp-last'),'Timing/restart policy');
let cells=0,total=0,largest=0,newPages=0,reusedPages=0;const expectedIndex=[],anatomy=new Set(),symmetries=[],holds=[],silhouetteCollisions=[],silhouettes=new Map();
for(const c of chars){const p=map.get(c.profileId);assert(p&&p.speciesId===c.speciesId&&(p.formId??'default')===c.formId,`Identity crosswalk ${c.profileId}`);assert(c.assetId===`character.${c.speciesId}.${c.formId}.pixel-v2`&&c.review==='candidate-unaccepted'&&c.runtimeIntegrated===false,'Identity/review');assert(c.worldHeight>=1&&c.worldHeight<=5&&c.features.length,'World scale/anatomy metadata');if(c.anatomyRecord){const a={...c.anatomyRecord};delete a.dex;const k=JSON.stringify(a);assert(!anatomy.has(k),`Duplicate anatomy record ${c.name}`);anatomy.add(k);}assert(same(c.pages.map(p=>p.clip),required),`Twelve clips ${c.name}`);
 const neutral=[],clipSignatures=new Set();
 for(const page of c.pages){const bytes=await file(page.path,page.sha256);assert(bytes.length===page.encodedBytes&&page.decodedRgbaBytes===1179648,'Encoded/decoded budget');total+=bytes.length;largest=Math.max(largest,bytes.length);c.preserved?reusedPages++:newPages++;const{raw,width}=png(bytes),stride=width*4+1,frameHashes=[];
 for(let row=0;row<8;row++){const rowHashes=[];for(let col=0;col<4;col++){const frame=Buffer.alloc(96*96*4);let opacity=0;for(let y=0;y<96;y++){const rowOffset=(row*96+y)*stride+1+col*384;raw.copy(frame,y*384,rowOffset,rowOffset+384);for(let x=0;x<96;x++){const off=rowOffset+x*4,alpha=raw[off+3];assert(alpha===0||alpha===255,`Alpha ${c.name}`);if(x<2||x>93||y<2||y>93)assert(alpha===0,`Gutter ${c.name}/${page.clip}/${row}/${col} at ${x},${y}`);if(alpha)opacity++;else assert(raw[off]===0&&raw[off+1]===0&&raw[off+2]===0,'Transparent RGB');}}assert(opacity>20&&opacity<7000,`Empty/overfilled ${c.name}/${page.clip}/${row}/${col}`);const h=hash(frame);frameHashes.push(h);rowHashes.push(h);cells++;if(page.clip==='idle'&&col===0){neutral.push(h);if(row===0){const alpha=Buffer.from(frame.filter((_,i)=>i%4===3)),sh=hash(alpha);if(silhouettes.has(sh))silhouetteCollisions.push([silhouettes.get(sh),c.profileId]);else silhouettes.set(sh,c.profileId);}}}if(new Set(rowHashes).size<2)holds.push(`${c.profileId}/${page.clip}/${row}`);}
 assert(same(page.frameHashes,frameHashes),`Frame hashes ${c.name}`);const signature=hash(Buffer.from(frameHashes.join('')));assert(!clipSignatures.has(signature),`Relabeled clip ${c.name}/${page.clip}`);clipSignatures.add(signature);
 expectedIndex.push({profileId:c.profileId,speciesId:c.speciesId,formId:c.formId,assetId:c.assetId,clip:page.clip,path:page.path,sha256:page.sha256,encodedBytes:page.encodedBytes,decodedRgbaBytes:page.decodedRgbaBytes});}
 if(new Set(neutral).size<8)symmetries.push({profileId:c.profileId,distinctNeutralViews:new Set(neutral).size});
 for(const evidence of c.evidence)await file(evidence.path,evidence.sha256);
}
assert(same(indexes,expectedIndex),'Shard indexes match manifests');assert(newPages===4836&&reusedPages===192&&cells===160896,'Exact raster coverage');assert(same((await readdir(path.join(root,'output'))).sort(),expectedIndex.filter(p=>p.path.startsWith('output/')).map(p=>path.basename(p.path)).sort()),'Unindexed output');for(const b of m.contactBoards)await file(b.path,b.sha256);await file(m.viewerIndex.path,m.viewerIndex.sha256);
console.log(JSON.stringify({status:'structural-pass-not-visual-acceptance',profiles:419,species:386,newPages,reusedPages,cells,encodedPageBytes:total,largestPageBytes:largest,decodedPageBytes:1179648,symmetries,staticDirectionalRows:holds,silhouetteCollisions},null,2));
