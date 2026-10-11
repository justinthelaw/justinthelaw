import {readFile} from 'node:fs/promises';
import {readTarGzip} from './native-format.mjs';
import {battleDigest} from './native-battle-inputs.mjs';

/** Offline source admission for the closed initial-move image bank only. */
export async function nativeBattleInitialInputs(){
  const manifestBytes=await readFile(new URL('native-battle-initial-sources.json',import.meta.url));
  if(manifestBytes.length>64*1024)throw Error('Initial battle source manifest exceeds its byte budget.');
  const manifest=JSON.parse(manifestBytes),hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
  if(manifest.schemaVersion!==1||manifest.repository!=='https://github.com/pret/pmd-red'||manifest.commit!=='013475aa04f5be3191e5527c186d9bfceae7cae0'||manifest.bank!=='initial'||manifest.effectIds?.join(',')!=='7,15,21,128,150,225,287,312,402,425'||manifest.archive?.path!=='native-battle-initial-source.tar.gz'||!Number.isInteger(manifest.archive.bytes)||manifest.archive.bytes<1||manifest.archive.bytes>512*1024||!hash(manifest.archive.sha256)||!Array.isArray(manifest.files)||manifest.files.length!==36)throw Error('Unsupported initial battle source manifest.');
  const archiveBytes=await readFile(new URL(manifest.archive.path,import.meta.url));
  if(archiveBytes.length!==manifest.archive.bytes||battleDigest(archiveBytes)!==manifest.archive.sha256)throw Error('Initial battle source archive changed.');
  const files=readTarGzip(archiveBytes);
  if(files.size!==manifest.files.length)throw Error('Initial battle source inventory changed.');
  const expected=new Set(['src/effect_data.c',...Array.from({length:14},(_,index)=>`graphics/ax/pal/${index}.pal`),...[0,20,23,51,73,81,113].flatMap(id=>{const name=`efob${String(id).padStart(3,'0')}`;return[`src/data/effects/${name}.c`,`data/effects/${name}.png`,`data/effects/${name}.pal`];})]);
  let total=0;
  for(const record of manifest.files){
    if(!expected.delete(record.path)||!Number.isInteger(record.bytes)||record.bytes<1||record.bytes>1024*1024||!hash(record.sha256)||record.url!==`https://raw.githubusercontent.com/pret/pmd-red/${manifest.commit}/${record.path}`)throw Error('Initial battle source record is invalid.');
    const bytes=files.get(record.path);if(!bytes||bytes.length!==record.bytes||battleDigest(bytes)!==record.sha256)throw Error(`Unpinned initial battle input: ${record.path}`);
    total+=bytes.length;
  }
  if(expected.size||total>4*1024*1024)throw Error('Initial battle source coverage or decoded size is invalid.');
  return{files,manifest,manifestBytes};
}
