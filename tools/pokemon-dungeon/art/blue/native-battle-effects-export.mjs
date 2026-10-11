import {nativeBattleInputs,battleDigest} from './native-battle-inputs.mjs';
import {composeBattleEffects} from './native-effect-format.mjs';

const integer=(value,min,max)=>Number.isInteger(value)&&value>=min&&value<=max;
/** Validate the closed selected artwork inventory, not game behavior. */
export function verifyNativeBattleMetadata(data,bank='basic',format='source'){
  if(format!=='source'&&format!=='runtime')throw Error('Unknown native battle metadata format.');
  const source=format==='source';
  if(bank!=='basic'&&bank!=='initial')throw Error('Unknown native battle bank.');
  const ids=bank==='basic'?[8,9,10,11,22,37,138,144,236,274,317,137,399,404,423,83]:[7,15,21,128,150,225,287,312,402,425,271];
  const files=bank==='basic'?['efob000','efob053','efob054','efob119','efob121','efob135']:['efob000','efob020','efob023','efob051','efob073','efob081','efob113','efob125'];
  if(data.schemaVersion!==(source?2:3)||data.width!==512||!integer(data.height,1,1024)||data.width*data.height*4>2*1024*1024||data.directions?.join(',')!=='s,se,e,ne,n,nw,w,sw'||!Array.isArray(data.poses)||!integer(data.poses.length,1,512)||!Array.isArray(data.effects)||data.effects.length!==ids.length)throw Error('Invalid selected native battle inventory.');
  for(const pose of data.poses){
    if(!Array.isArray(pose.layers)||!integer(pose.layers.length,1,4))throw Error('Native battle pose bounds are invalid.');
    let previous=-129,left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const layer of pose.layers){
      const rect=layer.rect;
      if(!integer(layer.depthOffset,-128,127)||layer.depthOffset<=previous||!Array.isArray(rect)||rect.length!==6||!rect.every(Number.isInteger)||rect[0]<0||rect[1]<0||rect[2]<1||rect[2]>256||rect[3]<1||rect[3]>256||rect[0]+rect[2]>data.width||rect[1]+rect[3]>data.height||!rect.slice(4).every(value=>integer(value,-256,256)))throw Error('Native battle layer escapes its atlas or anchor bounds.');
      previous=layer.depthOffset;
      left=Math.min(left,rect[4]);top=Math.min(top,rect[5]);
      right=Math.max(right,rect[4]+rect[2]);bottom=Math.max(bottom,rect[5]+rect[3]);
    }
    if(!integer(left,-256,256)||!integer(top,-256,256)||!integer(right-left,1,256)||!integer(bottom-top,1,256))throw Error('Native battle pose bounds are invalid.');
  }
  const expected=new Set(ids);
  for(const effect of data.effects){
    if(!expected.delete(effect.id)||typeof effect.directional!=='boolean'||!integer(effect.attachmentSet,-1,3)||typeof effect.loop!=='boolean'||typeof effect.blocksWait!=='boolean'||effect.blocksWait!==(effect.id!==37)||!Array.isArray(effect.sequences)||effect.sequences.length!==(effect.directional?8:1))throw Error('Invalid native battle effect selection.');
    if(source&&(typeof effect.name!=='string'||!/^[a-z-]+$/.test(effect.name)||!files.includes(effect.file)||!integer(effect.sourceAnimation,0,63)||!integer(effect.palette,0,14)||effect.sourceWaitFlag!==(effect.id===37?1:0)))throw Error('Invalid native battle source selection.');
    for(const[direction,sequence]of effect.sequences.entries()){
      if((source&&sequence.sourceAnimation!==effect.sourceAnimation+(effect.directional?direction:0))||!Array.isArray(sequence.frames)||!integer(sequence.frames.length,1,128)||!integer(sequence.ticks,1,32640))throw Error('Native battle sequence bounds are invalid.');
      for(const frame of sequence.frames)if(!Array.isArray(frame)||frame.length!==4||!frame.every(Number.isInteger)||!integer(frame[0],0,data.poses.length-1)||!integer(frame[1],1,255)||!frame.slice(2).every(value=>integer(value,-32768,32767)))throw Error('Native battle frame is outside its admitted domain.');
      if(sequence.ticks!==sequence.frames.reduce((sum,frame)=>sum+frame[1],0))throw Error('Native battle sequence duration differs from its frames.');
    }
  }
  if(expected.size)throw Error('Native battle effect coverage is incomplete.');
}

/** Project only after full source validation; the pinned inputs and pose/wait
 * evidence retain authoring facts that the browser does not consume. */
export function projectNativeBattleMetadata(data){
  return{...data,schemaVersion:3,effects:data.effects.map(({id,directional,attachmentSet,loop,blocksWait,sequences})=>({id,directional,attachmentSet,loop,blocksWait,sequences:sequences.map(({ticks,frames})=>({ticks,frames}))}))};
}

/** Static image/data export for the selected battle presentation owner. */
export async function exportNativeBattleEffects({emit,output}){
  const {files,manifest,manifestBytes}=await nativeBattleInputs(),{atlas,metadata,evidence}=composeBattleEffects(files);
  verifyNativeBattleMetadata(metadata);
  const imageBytes=atlas.png(),metadataBytes=Buffer.from(JSON.stringify(projectNativeBattleMetadata(metadata))+'\n');
  if(imageBytes.length>256*1024||metadataBytes.length>128*1024)throw Error('Selected native battle artwork exceeds its encoded byte budget.');
  await emit(new URL('battle-effects.png',output),imageBytes);
  await emit(new URL('battle-effects.json',output),metadataBytes);
  await emit(new URL('native-battle-pose-evidence.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
  return{path:'battle-effects.png',width:atlas.width,height:atlas.height,bytes:imageBytes.length,sha256:battleDigest(imageBytes),metadataPath:'battle-effects.json',metadataBytes:metadataBytes.length,metadataSha256:battleDigest(metadataBytes),sourceManifestPath:'tools/pokemon-dungeon/art/blue/native-battle-sources.json',sourceManifestSha256:battleDigest(manifestBytes),sourceEdition:manifest.sourceEdition,activation:'selected'};
}
