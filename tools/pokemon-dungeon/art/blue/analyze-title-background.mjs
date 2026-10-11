// Offline limits of reconstructing an upper background from flattened captures.
// This script reads only pinned image evidence, never browser or native code.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {decodePng} from './native-format.mjs';

const root=new URL('./native-scenery/',import.meta.url);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceBytes=await readFile(new URL('title-sources.json',root));
const source=JSON.parse(sourceBytes.toString());
const captures=[];
for(const record of source.records){
  const bytes=await readFile(new URL(record.path,root));
  if(bytes.length!==record.bytes||digest(bytes)!==record.sha256)throw Error(`Stale title evidence: ${record.path}`);
  captures.push({record,image:decodePng(bytes)});
}

// Visually inspected bounds deliberately exclude whole rectangles around each
// logo, prompt and captured ornament. These are conservative masks, not alpha.
const masks=Object.fromEntries(captures.map(({record})=>[record.id,
  record.id.startsWith('EU_')?[[16,16,230,136],[0,142,255,24]]:
  record.id==='Japanese'?[[0,20,255,140]]:
  record.id==='Korean'?[[0,24,255,136]]:[[0,0,255,156]],
]));
const masked=(id,x,y)=>masks[id].some(([left,top,width,height])=>x>=left&&x<left+width&&y>=top&&y<top+height);
function colorAt(capture,x,y){
  const {record,image}=capture,offset=((record.crop[1]+y)*image.width+record.crop[0]+x)*4;
  if(image.data[offset+3]!==255)throw Error('Title evidence unexpectedly contains alpha.');
  return [image.data[offset]>>3,image.data[offset+1]>>3,image.data[offset+2]>>3];
}
function sample(worldX,y,useMasks){
  const samples=[];
  for(const capture of captures){
    const {record}=capture,x=((worldX-record.relativePhase)%312+312)%312;
    if(x>=255||useMasks&&masked(record.id,x,y))continue;
    samples.push({capture:record.id,screen:[x,y],rgb5:colorAt(capture,x,y)});
  }
  return samples;
}
function summarize(useMasks){
  const result={pixels:312*164,observations:0,agreeingPixels:0,conflictingPixels:0,
    unobservedPixels:0,singleObservationPixels:0,multipleAgreeingObservationPixels:0,coverageHistogram:{}};
  for(let y=0;y<164;y++)for(let worldX=0;worldX<312;worldX++){
    const samples=sample(worldX,y,useMasks),count=samples.length;
    const colors=new Set(samples.map(entry=>entry.rgb5.join(',')));
    result.observations+=count;
    result.coverageHistogram[count]=(result.coverageHistogram[count]??0)+1;
    if(!count)result.unobservedPixels++;
    else if(colors.size>1)result.conflictingPixels++;
    else{result.agreeingPixels++;if(count===1)result.singleObservationPixels++;else result.multipleAgreeingObservationPixels++;}
  }
  return result;
}
const northAmerica=captures.find(({record})=>record.id==='NA_English');
const moby=captures.find(({record})=>record.id==='Moby');
const fixedComparison={pixels:255*164,equalPixels:0,differentPixels:0,equalSkyBluePixels:0,equalWhitePixels:0};
for(let y=0;y<164;y++)for(let x=0;x<255;x++){
  const a=colorAt(northAmerica,x,y).join(','),b=colorAt(moby,x,y).join(',');
  if(a===b){fixedComparison.equalPixels++;if(a==='3,16,31')fixedComparison.equalSkyBluePixels++;if(a==='31,31,31')fixedComparison.equalWhitePixels++;}
  else fixedComparison.differentPixels++;
}
const report={
  schemaVersion:1,sourceManifestSha256:digest(sourceBytes),region:[0,0,312,164],
  method:'Align the nine original Blue captures with their proven horizontal phases at five-bit precision. Count all raw samples, then repeat outside deliberately conservative foreground rectangles.',
  raw:summarize(false),conservativeMasks:masks,masked:summarize(true),
  maskQualification:'Masked counts are a conservative coverage bound, not an exact alpha matte or a claim that all excluded pixels are irrecoverable. Single observations are reported separately; no missing pixels are filled.',
  obscuredWitness:{texture:[74,40],observations:sample(74,40,false),
    qualification:'All seven available samples lie on visually identifiable regional logo artwork. Korean and Moby crops do not cover this texture coordinate. The flattened images provide no exposed background value here.'},
  fixedLogoComparison:fixedComparison,
  separationLimit:'Screen-space equality cannot define logo alpha: the two North American captures share both fixed logo pixels and unchanged background colors, including white used by the logo outline and clouds. The PNGs contain opaque flattened displays, not layer masks.',
  outcome:'Do not add runtime upper-cloud motion from these inputs. A complete original Blue background layer and foreground alpha, or additional unobscured phases sufficient to prove both, are still needed.',
};
const bytes=Buffer.from(`${JSON.stringify(report,null,2)}\n`),target=new URL('title-background-analysis.json',root);
if(process.argv.includes('--check')){
  if(!(await readFile(target)).equals(bytes))throw Error('Stale title-background analysis.');
}else await writeFile(target,bytes);
console.log(JSON.stringify({raw:report.raw,masked:report.masked,fixedLogoComparison:fixedComparison}));
