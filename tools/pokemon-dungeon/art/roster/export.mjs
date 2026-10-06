// Deterministic tools-only production of original geometry into frozen v2 pages.
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Raster } from '../pixel/raster.mjs';
import { clips } from '../production/pose.mjs';
import { characters } from './characters.mjs';
import { render } from './characters.mjs';
const root=new URL('./',import.meta.url),check=process.argv.includes('--check'),materialize=process.argv.includes('--materialize'),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
if(check&&materialize)throw Error('Choose --check or --materialize, not both');
const sourcePaths=['characters.mjs','campaign.mjs','refinements.mjs','anatomy.mjs','forms.mjs','rig.mjs','records-kanto.mjs','records-johto.mjs','records-hoenn.mjs','export.mjs','../production/manifest.json','../production/characters.mjs','../production/painter.mjs','../production/pose.mjs','../pixel/raster.mjs'];
const starterManifest=JSON.parse(await readFile(new URL('../production/manifest.json',root),'utf8'));
sourcePaths.push(...starterManifest.provenance.sourceFiles.filter(s=>s.path.startsWith('species/')).map(s=>'../production/'+s.path));
const sources=await Promise.all(sourcePaths.map(async path=>({path,sha256:sha(await readFile(new URL(path,root)))})));
// The canonical catalog is consumed as JSON only; no game modules execute.
const catalogInputs=await Promise.all(['species.json',...Array.from({length:5},(_,i)=>`profiles-${i+1}.json`)].map(async name=>{const path=`../../content/species-runtime/${name}`;return{path,sha256:sha(await readFile(new URL(path,root)))};}));
const manifest={schemaVersion:2,profile:'directional-pixel-clip-v2',scope:'original-blue-whole-roster-art-only',review:'candidate-unaccepted',runtimeIntegrated:false,identities:419,species:386,preservedStarterIdentities:16,newIdentities:403,cell:{width:96,height:96,footAnchor:[48,92],transparentBorder:2},page:{width:384,height:768,columns:4,rows:8},directions:['front','front-right','right','back-right','back','back-left','left','front-left'],directionConvention:'nearest 45 degrees of actor heading minus camera bearing',sampling:{min:'nearest',mag:'nearest',mipmaps:false,alpha:'binary-straight',colorSpace:'srgb'},memory:{decodedRgbaBytesPerPage:1179648,characterPageCeilingBytes:25165824,maxResidentPages:21,viewerVisiblePageLimit:3,runtimeStreamingImplemented:false},clips,provenance:{method:'original-code-native-pixel-art',commercialAssetsExtracted:false,rasterInputs:false,sourceFiles:sources},shards:[],pageIndexes:[],contactBoards:[],totals:{newPages:0,reusedPages:0,encodedPageBytes:0,frames:0}};
manifest.provenance.catalogInputs=catalogInputs;
async function save(path,bytes){
 if(bytes.length>=1048576)throw Error(`File budget ${path}: ${bytes.length}`);
 const target=new URL(path,root);
 if(check||materialize){
  let existing;
  try{existing=await readFile(target);}catch(error){
   if(!materialize||!path.endsWith('.png')||error.code!=='ENOENT')throw error;
  }
  if(existing){if(!existing.equals(bytes))throw Error(`Determinism mismatch ${path}`);}
  else{
   await mkdir(new URL(path.slice(0,path.lastIndexOf('/')+1)||'./',root),{recursive:true});
   // Exclusive creation never overwrites an artifact that appeared meanwhile.
   await writeFile(target,bytes,{flag:'wx'});
  }
 }else{
  await mkdir(new URL(path.slice(0,path.lastIndexOf('/')+1)||'./',root),{recursive:true});
  await writeFile(target,bytes);
 }
 return{path,sha256:sha(bytes),encodedBytes:bytes.length};
}
async function json(path,value){return save(path,Buffer.from(JSON.stringify(value)+'\n'));}
const viewer={characters:[],clips,directions:manifest.directions};
for(let start=0;start<characters.length;start+=16){
 const batch=characters.slice(start,start+16),entries=[],pageEntries=[],board=new Raster(8*96,Math.ceil(batch.length/4)*96);
 for(const[index,c]of batch.entries()){
  const identity=c.identity;let entry={...identity,assetId:`character.${identity.speciesId}.${identity.formId}.pixel-v2`,review:'candidate-unaccepted',runtimeIntegrated:false,authoringScale:c.starter?1:.92,contactAnchor:[48,92],source:c.starter?'preserved-starter':identity.anatomyRecord?'declarative-species-anatomy':'dedicated-campaign-or-form',pages:[],evidence:[]};
  if(c.starter){const preserved=starterManifest.characters.find(s=>s.speciesId===identity.speciesId);entry={...entry,pages:preserved.pages.map(p=>({...p,path:'../production/'+p.path})),evidence:starterManifest.evidence.filter(e=>e.species===identity.name).map(e=>({...e,path:'../production/'+e.path})),preserved:true};manifest.totals.reusedPages+=entry.pages.length;}
  else{
   const directions=new Raster(768,96),motions=new Raster(384,1152);
   for(const clip of clips){const page=new Raster(384,768),frameHashes=[];for(let d=0;d<8;d++)for(let f=0;f<4;f++){const cell=render(c,d,clip.id,f);page.paste(cell,f*96,d*96);frameHashes.push(sha(cell.data));if(clip.id==='idle'&&f===0)directions.paste(cell,d*96,0);if(d===1)motions.paste(cell,f*96,clips.indexOf(clip)*96);}entry.pages.push({clip:clip.id,...await save(`output/${c.profileId}-${clip.id}.png`,page.png()),decodedRgbaBytes:1179648,frameHashes});}
   entry.evidence.push({kind:'all-eight-directions',...await save(`evidence/${c.profileId}-directions.png`,directions.png())},{kind:'all-twelve-clips-front-right',...await save(`evidence/${c.profileId}-clips.png`,motions.png())});manifest.totals.newPages+=entry.pages.length;
  }
  for(const p of entry.pages){pageEntries.push({profileId:entry.profileId,speciesId:entry.speciesId,formId:entry.formId,assetId:entry.assetId,clip:p.clip,path:p.path,sha256:p.sha256,encodedBytes:p.encodedBytes,decodedRgbaBytes:p.decodedRgbaBytes});manifest.totals.encodedPageBytes+=p.encodedBytes;manifest.totals.frames+=32;}
  for(const[d,offset]of[[0,0],[1,1]])board.paste(render(c,d,'idle',0),(index%4)*192+offset*96,Math.floor(index/4)*96);
  viewer.characters.push({name:identity.name,profileId:c.profileId,speciesId:identity.speciesId,worldHeight:identity.worldHeight,features:identity.features,pages:entry.pages.map(p=>({clip:p.clip,path:p.path}))});entries.push(entry);
 }
 const n=String(start/16+1).padStart(2,'0');manifest.shards.push(await json(`manifests/characters-${n}.json`,{schemaVersion:2,characters:entries}));manifest.pageIndexes.push(await json(`indexes/pages-${n}.json`,{schemaVersion:2,pages:pageEntries}));manifest.contactBoards.push({identities:entries.map(e=>({profileId:e.profileId,name:e.name})),...await save(`evidence/roster-${n}.png`,board.png())});
 console.log(`${check?'Compared':materialize?'Materialized/compared':'Exported'} ${Math.min(start+16,characters.length)}/419 profiles`);
}
manifest.viewerIndex=await json('viewer-index.json',viewer);await json('manifest.json',manifest);console.log(JSON.stringify(manifest.totals));
