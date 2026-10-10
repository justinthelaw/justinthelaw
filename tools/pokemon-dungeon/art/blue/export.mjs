// Reproduce the scoped browser artwork from pinned, offline image sources.
// This authoring command never loads a ROM or executes the browser game.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { exportNativeSprites } from './native-export.mjs';
import { exportNativeScenery } from './native-scenery-export.mjs';
import { exportNativeOrnaments } from './native-ornament-export.mjs';
import { exportNativeUi } from './native-ui-export.mjs';
import { exportNativeStatuses } from './native-status-export.mjs';

const output=new URL('../../../../games/pokemon-dungeon-reimagined/assets/blue/',import.meta.url);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const check=process.argv.includes('--check');
if(!check)await mkdir(output,{recursive:true});
async function emit(url,bytes){
  const expected=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
  if(check){if(!(await readFile(url)).equals(expected))throw Error(`Stale Blue artwork: ${url.pathname}`);}
  else await writeFile(url,expected);
}

const native=await exportNativeSprites({emit,output}),ornaments=await exportNativeOrnaments({emit,output}),nativeUi=await exportNativeUi({emit}),statusAtlas=await exportNativeStatuses({emit,output}),scenes=[];
const authoringSources=[];
for(const path of['export.mjs','native-export.mjs','native-format.mjs','native-ornament-export.mjs','native-ui-export.mjs','native-panel-export.mjs','native-status-export.mjs','native-scenery-export.mjs','native-ground-format.mjs','native-aura-format.mjs','native-boot-format.mjs','capture-native.mjs','capture-native-ui.mjs'])authoringSources.push({path:`tools/pokemon-dungeon/art/blue/${path}`,sha256:digest(await readFile(new URL(path,import.meta.url)))});
const manifest={
  schemaVersion:2,profile:'blue-opening-rescue-team-native-v2',
  provenance:'Original Rescue Team world sprites and portraits from explicitly identified public image sources, with recorded native frame composition and timing. Selected sprites and display colors corroborated against Blue screenshots; remaining Red-derived data is comparative. No rights-holder reuse grant asserted.',
  sourceManifestSha256:native.sourceManifestSha256,
  sourceManifestPath:'tools/pokemon-dungeon/art/blue/native-sources.json',
  sourceArchives:[...native.sourceArchives,ornaments.archive,nativeUi.archive].map(record=>({...record,path:`tools/pokemon-dungeon/art/blue/${record.path}`})),
  directions:['s','se','e','ne','n','nw','w','sw'],
  records:native.records,portraitAtlas:native.portraitAtlas,scenes,ornaments:ornaments.records,nativeUi,statusAtlas,authoringSources,
  sceneryManifest:'scenery/manifest.json',
};
await emit(new URL('manifest.json',output),JSON.stringify(manifest,null,2)+'\n');
await exportNativeScenery({check});
console.log(JSON.stringify({mode:check?'check':'export',species:manifest.records.length,portraits:manifest.portraitAtlas.records.length,scenePaintings:scenes.length,ornaments:ornaments.records.length,encodedBytes:[...manifest.records,...scenes,...ornaments.records].reduce((sum,record)=>sum+record.bytes,manifest.portraitAtlas.bytes),metadataBytes:[...manifest.records,...ornaments.records].reduce((sum,record)=>sum+record.metadataBytes,manifest.portraitAtlas.metadataBytes),maxDecodedSpeciesBytes:Math.max(...manifest.records.map(record=>record.width*record.height*4))}));
