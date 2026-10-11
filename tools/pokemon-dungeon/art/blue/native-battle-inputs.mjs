import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readTarGzip} from './native-format.mjs';

export const battleDigest=bytes=>createHash('sha256').update(bytes).digest('hex');

/** Offline, bounded source/data loading. No game module is imported. */
export async function nativeBattleInputs(){
  const manifestBytes=await readFile(new URL('native-battle-sources.json',import.meta.url));
  if(manifestBytes.length>64*1024)throw Error('Native battle source manifest exceeds its byte budget.');
  const manifest=JSON.parse(manifestBytes),hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
  if(manifest.schemaVersion!==1||manifest.repository!=='https://github.com/pret/pmd-red'||manifest.commit!=='013475aa04f5be3191e5527c186d9bfceae7cae0'||manifest.archive?.path!=='native-battle-source.tar.gz'||!Number.isInteger(manifest.archive.bytes)||manifest.archive.bytes<1||manifest.archive.bytes>512*1024||!hash(manifest.archive.sha256)||!Array.isArray(manifest.files)||manifest.files.length!==57||manifest.speciesSource?.manifestPath!=='native-sources.json'||!hash(manifest.speciesSource.manifestSha256))throw Error('Unsupported native battle source manifest.');
  const archiveBytes=await readFile(new URL(manifest.archive.path,import.meta.url));
  if(archiveBytes.length!==manifest.archive.bytes||battleDigest(archiveBytes)!==manifest.archive.sha256)throw Error('Native battle source archive changed.');
  const files=readTarGzip(archiveBytes);
  if(files.size!==manifest.files.length)throw Error('Native battle source inventory changed.');
  const seen=new Set();let total=0;
  for(const record of manifest.files){
    if(typeof record.path!=='string'||!/^[A-Za-z0-9_/-]+\.(c|h|png|pal)$/.test(record.path)||record.path.split('/').includes('..')||seen.has(record.path)||!Number.isInteger(record.bytes)||record.bytes<1||record.bytes>1024*1024||!hash(record.sha256)||record.url!==`https://raw.githubusercontent.com/pret/pmd-red/${manifest.commit}/${record.path}`)throw Error('Native battle source record is invalid.');
    seen.add(record.path);total+=record.bytes;
    const bytes=files.get(record.path);if(!bytes||bytes.length!==record.bytes||battleDigest(bytes)!==record.sha256)throw Error(`Unpinned native battle input: ${record.path}`);
  }
  if(total>4*1024*1024)throw Error('Native battle decoded source exceeds its byte budget.');
  const speciesBytes=await readFile(new URL(manifest.speciesSource.manifestPath,import.meta.url));
  if(battleDigest(speciesBytes)!==manifest.speciesSource.manifestSha256)throw Error('Native battle species source changed.');
  return{files,manifest,manifestBytes,species:JSON.parse(speciesBytes).spriteSource.species};
}

export function nativeFields(body){return Object.fromEntries([...body.matchAll(/\.(\w+) = ([^,}]+)/g)].map(match=>[match[1],/^-?\d+$/.test(match[2])?Number(match[2]):match[2]]));}
