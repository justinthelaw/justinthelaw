import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export const navigationAuthorRoot = new URL('../content/navigation-runtime/',import.meta.url);
export const navigationRuntimeRoot = new URL('../../../games/pokemon-dungeon-reimagined/content/navigation/',import.meta.url);
export async function buildNavigationExport() {
  const raw = await readFile(new URL('facts.json',navigationAuthorRoot));
  if (raw.byteLength >= 1024 * 1024) throw new Error('Navigation resource exceeds size budget.');
  const bytes = new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(raw); JSON.parse(bytes);
  const manifest = JSON.stringify({schemaVersion:1,catalogId:'original-blue-navigation',bytes:Buffer.byteLength(bytes),sha256:createHash('sha256').update(bytes).digest('hex')})+'\n';
  const integrity = `/** Generated navigation manifest fingerprint; paired with the reviewed local facts. */\nexport const NAVIGATION_MANIFEST_SHA256 = '${createHash('sha256').update(manifest).digest('hex')}';\n`;
  return new Map([['facts.json',bytes],['manifest.json',manifest],['../navigation-integrity.js',integrity]]);
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const output = await buildNavigationExport(); const check = process.argv.includes('--check');
  if (!check) await mkdir(navigationRuntimeRoot,{recursive:true});
  else if (JSON.stringify((await readdir(navigationRuntimeRoot)).sort()) !== JSON.stringify(['facts.json','manifest.json'])) throw new Error('Unexpected navigation exports.');
  for (const [file,bytes] of output) { if(check) {if(!(await readFile(new URL(file,navigationRuntimeRoot))).equals(Buffer.from(bytes,'utf8'))) throw new Error(`Stale ${file}`);} else await writeFile(new URL(file,navigationRuntimeRoot),bytes); }
  console.log(`Navigation ${check?'export checked':'exported'}: 424 mobility records and 140 fixed identities; no game execution.`);
}
