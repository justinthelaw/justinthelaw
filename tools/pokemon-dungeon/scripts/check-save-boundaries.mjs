// Independent source/body SHA-256 audit. Parse only; never import game modules.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const root = new URL('../../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('../content/save-boundaries.json', import.meta.url), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(manifest.schemaVersion === 1 && manifest.baselineCommit === '98a37cf' && manifest.modules.length === 22 && manifest.catalogManifests.length === 2 && manifest.functionBodies.length === 6, 'Exact save source pin inventory.');
for (const row of manifest.modules) {
  assert(/^games\/pokemon-dungeon-reimagined\/content\/[a-z0-9/-]+\.js$/.test(row.path), 'Local source pin path.');
  assert(hash(await readFile(new URL(row.path, root))) === row.sha256, `Reviewed predecessor dependency changed: ${row.path}`);
}
for (const row of manifest.catalogManifests) {
  assert(/^games\/pokemon-dungeon-reimagined\/content\/(species|onboarding)\/manifest\.json$/.test(row.path), 'Exact predecessor manifest path.');
  const bytes = await readFile(new URL(row.path, root));
  assert(hash(bytes) === row.sha256, `Predecessor factual manifest changed: ${row.path}`);
  const catalog = JSON.parse(bytes);
  for (const resource of catalog.resources) {
    assert(/^[a-z0-9-]+\.json$/.test(resource.file), 'Local pinned factual resource.');
    assert(hash(await readFile(new URL(resource.file, new URL(row.path, root)))) === resource.sha256, `Predecessor factual resource changed: ${resource.file}`);
  }
}
for (const row of manifest.functionBodies) {
  assert(/^games\/pokemon-dungeon-reimagined\/content\/[a-z0-9/-]+\.js$/.test(row.path), 'Local body pin path.');
  const source = await readFile(new URL(row.path, root), 'utf8');
  const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  const declarations = ast.body.map(statement => statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement);
  const fn = declarations.find(statement => statement?.type === 'FunctionDeclaration' && statement.id?.name === row.functionName);
  assert(fn && hash(source.slice(fn.body.start, fn.body.end)) === row.sha256, `Reviewed predecessor body changed: ${row.path}/${row.functionName}`);
}
console.log(`Save admission source pins: ${manifest.modules.length} unchanged dependencies / ${manifest.functionBodies.length} exact predecessor bodies / 2 factual manifests and their resources; no game code executed.`);
