import {nativeBattleInitialInputs} from './native-battle-initial-inputs.mjs';
import {battleDigest} from './native-battle-inputs.mjs';
import {composeBattleEffects} from './native-effect-format.mjs';
import {verifyNativeBattleMetadata} from './native-battle-effects-export.mjs';

/** Static image/data export. Later-level effects and Hypnosis BG stay excluded. */
export async function exportNativeInitialBattleEffects({emit,output}){
  const {files,manifest,manifestBytes}=await nativeBattleInitialInputs();
  const {atlas,metadata,evidence}=composeBattleEffects(files,'initial');
  verifyNativeBattleMetadata(metadata,'initial');
  const imageBytes=atlas.png(),metadataBytes=Buffer.from(JSON.stringify(metadata)+'\n');
  if(imageBytes.length>256*1024||metadataBytes.length>128*1024)throw Error('Initial battle artwork exceeds its encoded byte budget.');
  await emit(new URL('battle-effects-initial.png',output),imageBytes);
  await emit(new URL('battle-effects-initial.json',output),metadataBytes);
  await emit(new URL('native-battle-initial-evidence.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');
  return{id:'initial',path:'battle-effects-initial.png',width:atlas.width,height:atlas.height,bytes:imageBytes.length,sha256:battleDigest(imageBytes),metadataPath:'battle-effects-initial.json',metadataBytes:metadataBytes.length,metadataSha256:battleDigest(metadataBytes),sourceManifestPath:'tools/pokemon-dungeon/art/blue/native-battle-initial-sources.json',sourceManifestSha256:battleDigest(manifestBytes),sourceEdition:manifest.sourceEdition,activation:'selected',archive:manifest.archive};
}
