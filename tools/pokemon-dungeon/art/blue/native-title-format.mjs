// Reconstruct only the unobscured ocean band shared by original Blue captures.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Raster } from '../pixel/raster.mjs';
import { decodePng } from './native-format.mjs';

const ROOT=new URL('./native-scenery/',import.meta.url);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function nativeTitleWaterAssets(referenceTitle){
  const sourceBytes=await readFile(new URL('title-sources.json',ROOT)),source=JSON.parse(sourceBytes.toString());
  const captures=[];
  for(const record of source.records){
    const bytes=await readFile(new URL(record.path,ROOT));
    if(bytes.length!==record.bytes||digest(bytes)!==record.sha256)throw Error(`Stale original Blue title capture: ${record.path}`);
    const image=decodePng(bytes);
    if(image.width!==record.width||image.height!==record.height)throw Error('Original Blue title capture extent changed.');
    captures.push({record,image});
  }
  const image=new Raster(312,28),coverage={};let observations=0;
  for(let y=164;y<192;y++)for(let worldX=0;worldX<312;worldX++){
    let expected=null,count=0;
    for(const{record,image:capture}of captures){
      const x=((worldX-record.relativePhase)%312+312)%312;
      if(x>=255||record.excludedRects.some(([left,top,width,height])=>x>=left&&x<left+width&&y>=top&&y<top+height))continue;
      const offset=((record.crop[1]+y)*capture.width+record.crop[0]+x)*4;
      const color=[capture.data[offset]>>3,capture.data[offset+1]>>3,capture.data[offset+2]>>3];
      if(capture.data[offset+3]!==255)throw Error('Original Blue ocean unexpectedly contains transparency.');
      if(expected&&expected.some((value,channel)=>value!==color[channel]))throw Error('Original Blue ocean captures disagree after phase alignment.');
      expected=color;count++;
    }
    if(!expected||count<4)throw Error('An ocean pixel lacks sufficient direct Blue coverage.');
    image.data.set([...expected.map(value=>(value<<3)|(value>>3)),255],((y-164)*312+worldX)*4);
    observations+=count;coverage[count]=(coverage[count]??0)+1;
  }
  if(observations!==64080)throw Error('Original Blue ocean observation coverage changed.');
  let matching=0;
  for(let y=164;y<192;y++)for(let x=0;x<255;x++){
    const from=((y-164)*312+(x+127)%312)*4,to=(y*256+x+1)*4;
    if(!image.data.subarray(from,from+4).equals(referenceTitle.data.subarray(to,to+4)))throw Error('The reconstructed ocean differs from the existing Blue title phase.');
    matching++;
  }
  return{image,metadata:{...source.water,sourceManifestSha256:digest(sourceBytes),
    observationCoverageHistogram:coverage,conflictingPixels:0,unobservedPixels:0,
    existingTitlePhaseMatchingPixels:matching,existingTitlePhaseBounds:[1,164,255,28],captures:source.records,
  }};
}
