// Four published Blue startup captures, checked against the original logo data.
// This authoring module reads individual assets, never a ROM or game module.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Raster } from '../pixel/raster.mjs';
import { decodePng, blueChannel } from './native-format.mjs';
import { renderGroundMap } from './native-ground-format.mjs';

const ROOT=new URL('./native-scenery/',import.meta.url);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function nativeBootAssets(){
  const sourceBytes=await readFile(new URL('boot-sources.json',ROOT));
  const source=JSON.parse(sourceBytes.toString()),files=new Map();
  for(const record of [...source.records,...source.comparativeMapInputs]){
    const bytes=await readFile(new URL(record.path,ROOT));
    if(bytes.length!==record.bytes||digest(bytes)!==record.sha256)throw Error(`Stale original boot asset: ${record.path}`);
    files.set(record.path,bytes);
  }
  if(source.records.map(record=>record.id).join(',')!=='pokemon-company,nintendo,chunsoft,copyright')throw Error('Original company-card sequence changed.');
  const rawLayout=files.get('boot/S04m.bma'),layout=Buffer.from(rawLayout);
  if(rawLayout[0]!==30||rawLayout[1]!==80||rawLayout[4]!==10||rawLayout[5]!==27)throw Error('Unexpected original company-strip extent.');
  // The final source chunk extends eight pixels past the declared640px height.
  // Decode complete chunks temporarily; proof samples only the original640px.
  layout[1]=81;
  const strip=renderGroundMap(files.get('boot/S04.bpl'),files.get('boot/S04c.bpc'),layout).image;
  const image=new Raster(256,768),cards=[];
  for(const [page,record] of source.records.entries()){
    const capture=decodePng(files.get(record.path));
    if(capture.width!==255||capture.height!==192)throw Error('Original Blue boot capture dimensions changed.');
    const [offsetX,offsetY]=record.comparativeOffset;
    const sourceBackground=(page*160*strip.width)*4;
    let matched=0;
    for(let y=0;y<192;y++)for(let x=0;x<255;x++){
      const from=(y*255+x)*4,inside=x>=offsetX&&x<offsetX+240&&y>=offsetY&&y<offsetY+160;
      const expected=inside?(((page*160+y-offsetY)*strip.width+x-offsetX)*4):sourceBackground;
      if(capture.data[from+3]!==255)throw Error('A company capture unexpectedly contains transparency.');
      for(let channel=0;channel<3;channel++)if((capture.data[from+channel]>>3)!==(strip.data[expected+channel]>>3))throw Error('Original Blue company pixels differ from the native logo data.');
      matched++;
      const target=((page*192+y)*256+x+1)*4;
      for(let channel=0;channel<3;channel++)image.data[target+channel]=blueChannel(capture.data[from+channel]);
      image.data[target+3]=255;
    }
    if(matched!==48960)throw Error('Incomplete company-card pixel comparison.');
    // Published captures omit the first blank column. Only that uniform source
    // background is restored; all255 captured columns remain at native size.
    for(let y=0;y<192;y++){
      const target=(page*192+y)*256*4;
      for(let channel=0;channel<3;channel++)image.data[target+channel]=blueChannel(capture.data[channel]);
      image.data[target+3]=255;
    }
    cards.push({id:record.id,rect:[0,page*192,256,192],matchedFiveBitPixels:matched,sourceSha256:record.sha256});
  }
  return{image,metadata:{sourceManifestSha256:digest(sourceBytes),cards,
    sourceEdition:'Original Blue captures with comparative native logo-data corroboration',
    reconstructedBlankColumn:source.corroboration.captureWidthQualification,
    timing:{cardStartTicks:[0,122,244,366],fadeInTicks:20,holdTicks:60,fadeOutTicks:20,totalTicks:534,nominalHz:60},
    timingQualification:'Source-derived cue/return/palette-exit schedule; Blue video establishes broad order and black exit but was not frame-counted.',
    directBlueVideo:source.directBlueVideo,
  }};
}
