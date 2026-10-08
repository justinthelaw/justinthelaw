import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const authoringRoot = fileURLToPath(new URL('../content/dungeon-runtime/', import.meta.url));
export const runtimeRoot = fileURLToPath(new URL('../../../games/pokemon-dungeon-reimagined/content/dungeons/', import.meta.url));
export const catalogId = 'original-blue-dungeon-facts';
export const encode = value => `${JSON.stringify(value)}\n`;
export const sha256 = value => createHash('sha256').update(value).digest('hex');

/** Read data only. Neither the exporter nor the checker imports game modules. */
export async function buildDungeonResources() {
  const names = (await readdir(authoringRoot)).filter(name => /-\d{2}\.json$/.test(name)).sort();
  const families = {};
  const files = new Map();
  const resources = [];
  for (const name of names) {
    const data = JSON.parse(await readFile(path.join(authoringRoot, name), 'utf8'));
    if (data.schemaVersion !== 1 || data.catalogId !== catalogId || name !== `${data.family}-${name.slice(-7)}` || !Array.isArray(data.records)) throw new Error(`Invalid authoring header ${name}`);
    const text = encode(data);
    if (Buffer.byteLength(text) >= 1024 * 1024) throw new Error(`Oversize resource ${name}`);
    files.set(name, text);
    (families[data.family] ??= []).push(...data.records);
    resources.push({ file: name, family: data.family, count: data.records.length, sha256: sha256(text) });
  }
  const coverage = JSON.parse(await readFile(path.join(authoringRoot, 'coverage.json'), 'utf8'));
  const schemas = JSON.parse(await readFile(path.join(authoringRoot, 'schemas.json'), 'utf8'));
  files.set('schemas.json', encode(schemas));
  files.set('index.json', encode({ schemaVersion: 1, catalogId, resources, coverage, schemaSha256: sha256(encode(schemas)) }));
  return { families, coverage, schemas, files };
}

export async function exportDungeonResources(check = false) {
  const { files } = await buildDungeonResources();
  if (!check) await mkdir(runtimeRoot, { recursive: true });
  for (const [name, expected] of files) {
    const filename = path.join(runtimeRoot, name);
    if (check) {
      const actual = await readFile(filename, 'utf8').catch(() => null);
      if (actual !== expected) throw new Error(`Stale dungeon export: ${name}`);
    } else await writeFile(filename, expected);
  }
  const fingerprintPath = path.join(runtimeRoot, '../dungeons-integrity.js');
  const fingerprint = `/** Generated fingerprint of the reviewed dungeon manifest bytes. */\nexport const DUNGEON_INDEX_SHA256 = '${sha256(files.get('index.json'))}';\n`;
  if (check) {
    if (await readFile(fingerprintPath, 'utf8').catch(() => null) !== fingerprint) throw new Error('Stale dungeon manifest fingerprint');
  } else await writeFile(fingerprintPath, fingerprint);
  const present = (await readdir(runtimeRoot)).sort();
  if (present.join('|') !== [...files.keys()].sort().join('|')) throw new Error('Unexpected dungeon runtime resource; remove stale files explicitly.');
  console.log(`${check ? 'Verified' : 'Exported'} ${files.size} deterministic dungeon resources.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await exportDungeonResources(process.argv.includes('--check'));
}
