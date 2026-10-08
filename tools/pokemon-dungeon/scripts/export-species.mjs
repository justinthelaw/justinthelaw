import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const speciesAuthorRoot = new URL('../content/species-runtime/', import.meta.url);
export const speciesRuntimeRoot = new URL('../../../games/pokemon-dungeon-reimagined/content/species/', import.meta.url);
export const speciesFiles = Object.freeze([
  'species.json', 'profiles-1.json', 'profiles-2.json', 'profiles-3.json', 'profiles-4.json', 'profiles-5.json',
  'levels-1.json', 'levels-2.json', 'levels-3.json', 'levels-4.json', 'learnsets.json', 'identities.json', 'sources.json',
]);
export const sha256 = value => createHash('sha256').update(value).digest('hex');

/** Build only from committed normalized factual records; never import game code. */
export async function buildSpeciesExport() {
  const output = new Map();
  for (const name of speciesFiles) {
    const text = await readFile(new URL(name, speciesAuthorRoot), 'utf8');
    JSON.parse(text);
    if (Buffer.byteLength(text) >= 1024 * 1024) throw new Error(`Species file exceeds size limit: ${name}`);
    output.set(name, text);
  }
  const manifest = {
    schemaVersion: 1,
    catalogId: 'original-blue-species-profiles',
    edition: 'blue-rescue-team-qualified-facts',
    kind: 'manifest',
    counts: { species: 386, profiles: 419, persistent: 413, temporary: 6, levels: 384, learnsets: 386 },
    resources: [...output].map(([file, text]) => ({ file, bytes: Buffer.byteLength(text), sha256: sha256(text) })),
  };
  output.set('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  return output;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const output = await buildSpeciesExport();
  const checking = process.argv.includes('--check');
  if (!checking) await mkdir(speciesRuntimeRoot, { recursive: true });
  for (const [name, text] of output) {
    const target = new URL(name, speciesRuntimeRoot);
    if (checking) {
      if (await readFile(target, 'utf8') !== text) throw new Error(`Stale species export: ${fileURLToPath(target)}`);
    } else await writeFile(target, text);
  }
  console.log(`Species ${checking ? 'export equality checked' : 'exported'}: ${output.size} local JSON files; no game execution.`);
}
