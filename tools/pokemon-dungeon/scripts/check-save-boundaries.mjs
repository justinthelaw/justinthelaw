// Independent source/body SHA-256 audit. Parse only; never import game modules.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const root = new URL('../../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('../content/save-boundaries.json', import.meta.url), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(manifest.schemaVersion === 1 && manifest.baselineCommit === '98a37cf' && manifest.successorBaselineCommit === 'be2fe0926eabd5a7706f12939e9b49f5b0640b73' && manifest.townPredecessorBaselineCommit === '1b71c26fcc1d5c51decf243eb98f5be89052d7e9' && manifest.seenPredecessorBaselineCommit === '1991d70ecf1b9b004d4366b3b4ea8da7cdc40b76' && manifest.workPredecessorBaselineCommit === 'e1b97cc1c4dda6e216aa896bcf815a8008cb8440' && manifest.battlePredecessorBaselineCommit === 'e59a35dba62b144294d0eb730438060797862831' && manifest.steelPredecessorBaselineCommit === '2348abcc555e5a53f6f63d11c0a8ba47d8d1dff3' && manifest.friendAreaPredecessorBaselineCommit === '2b828c0a6b984cb60a161014884a6693c86ae287' && manifest.modules.length === 50 && manifest.catalogManifests.length === 2 && manifest.functionBodies.length === 14, 'Exact save source pin inventory.');
for (const row of manifest.modules) {
  assert(/^games\/pokemon-dungeon-reimagined\/(content\/[a-z0-9/-]+|src\/domain\/gameplay\/(job-interaction|job-records|reward-items))\.js$/.test(row.path), 'Local source pin path.');
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
// New root shape must not broaden structural admission of older revisions.
assert(manifest.legacyRootShape.path === 'games/pokemon-dungeon-reimagined/src/domain/state/schema.js', 'Legacy root shape path.');
const schemaSource = await readFile(new URL(manifest.legacyRootShape.path, root), 'utf8');
const schemaNodes = parse(schemaSource, { ecmaVersion: 'latest', sourceType: 'module' }).body.map(node => node.declaration ?? node);
const shapes = schemaNodes.find(node => node.type === 'VariableDeclaration' && node.declarations[0]?.id.name === 'SHAPES')?.declarations[0]?.init;
const legacyRoot = shapes?.properties.find(property => property.key.value === 'CampaignState')?.value;
assert(legacyRoot && hash(schemaSource.slice(legacyRoot.start, legacyRoot.end)) === manifest.legacyRootShape.sha256, 'Reviewed legacy root shape changed.');
const seenRoot = shapes?.properties.find(property => property.key.value === 'CampaignStateWithSeen')?.value;
assert(manifest.seenRootShape.path === manifest.legacyRootShape.path && seenRoot && hash(schemaSource.slice(seenRoot.start, seenRoot.end)) === manifest.seenRootShape.sha256, 'Reviewed v7 seen root shape changed.');
const workRoot = shapes?.properties.find(property => property.key.value === 'CampaignStateWithWork')?.value;
assert(manifest.workRootShape.path === manifest.legacyRootShape.path && workRoot && hash(schemaSource.slice(workRoot.start, workRoot.end)) === manifest.workRootShape.sha256, 'Reviewed v8 work root shape changed.');
console.log(`Save admission source pins: ${manifest.modules.length} unchanged dependencies / ${manifest.functionBodies.length} exact predecessor bodies / 2 factual manifests and their resources; no game code executed.`);
