// Independent source/body SHA-256 audit. Parse only; never import game modules.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const root = new URL('../../../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('../content/save-boundaries.json', import.meta.url), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
assert(manifest.schemaVersion === 1 && manifest.baselineCommit === '98a37cf' && manifest.successorBaselineCommit === 'be2fe0926eabd5a7706f12939e9b49f5b0640b73' && manifest.townPredecessorBaselineCommit === '1b71c26fcc1d5c51decf243eb98f5be89052d7e9' && manifest.seenPredecessorBaselineCommit === '1991d70ecf1b9b004d4366b3b4ea8da7cdc40b76' && manifest.workPredecessorBaselineCommit === 'e1b97cc1c4dda6e216aa896bcf815a8008cb8440' && manifest.battlePredecessorBaselineCommit === 'e59a35dba62b144294d0eb730438060797862831' && manifest.steelPredecessorBaselineCommit === '2348abcc555e5a53f6f63d11c0a8ba47d8d1dff3' && manifest.friendAreaPredecessorBaselineCommit === '2b828c0a6b984cb60a161014884a6693c86ae287' && manifest.areaPredecessorBaselineCommit === 'ca714483d402cbb7e6e94cdd6e5c21fecd3a51b7' && manifest.nativeAiPredecessorBaselineCommit === '91733e1b6ffa4794437b1b270eb760a3507040c0' && manifest.partyStatusPredecessorBaselineCommit === 'b38fdfa44cd98f9aefc427cda2473d7ec67a2075' && manifest.damageStatusPredecessorBaselineCommit === 'ac3c02cab4779be597a0496bdb89cc70869e577c' && manifest.linkedStatusPredecessorBaselineCommit === '97d7d90023ebb7fa2f01d84ef4f5fff90e31d490' && manifest.itemImpactPredecessorBaselineCommit === '20b0a7f7382e2fb5edb9afd0797b55f122a7ac0e' && manifest.stunSeedPredecessorBaselineCommit === '500a705d38fea989c81b8c1f66d4f7343d32c33e' && manifest.continuationPredecessorBaselineCommit === '1b9eb5fc1d03a8f20dcf53ea182121a5b5112ef2' && manifest.chapterWorkPredecessorBaselineCommit === '659bfe78ecb9708b775573af3501d4f68f6c0c51' && manifest.steelMeaniesPredecessorBaselineCommit === 'c98a8152088875ab7d412ba75c493295ab66e103' && manifest.modules.length === 105 && manifest.catalogManifests.length === 2 && manifest.functionBodies.length === 14 && manifest.bronzeJobsPredecessorBaselineCommit === '77ee7640810d20974e707c67f477206e1edae1b6' && manifest.moveLearningPredecessorBaselineCommit === '961cb987ef18bb6715f4f54a4711fbf8a04cf282', 'Exact save source pin inventory.');
for (const row of manifest.modules) {
  assert(/^games\/pokemon-dungeon-reimagined\/(content\/[a-z0-9/-]+|src\/domain\/state\/(field-moves-v(?:1[6789]|20|21|22)|continuation-revision|continuation-schema|chapter-work-revision|steel-meanies-revision|bronze-jobs-revision|bronze-jobs-schema|bronze-reward-prefix|continuation-registry-v(?:20|21|22))|src\/domain\/gameplay\/(bronze-job-generation|bronze-job-records|friend-job-generation|friend-job-records|job-generation|job-interaction|job-records|reward-items))\.js$/.test(row.path), 'Local source pin path.');
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
assert(manifest.continuationPredecessorSchema.path === manifest.legacyRootShape.path && hash(schemaSource) === manifest.continuationPredecessorSchema.sha256, 'Whole published v18 schema must remain byte-identical.');
const schemaNodes = parse(schemaSource, { ecmaVersion: 'latest', sourceType: 'module' }).body.map(node => node.declaration ?? node);
const shapes = schemaNodes.find(node => node.type === 'VariableDeclaration' && node.declarations[0]?.id.name === 'SHAPES')?.declarations[0]?.init;
const legacyRoot = shapes?.properties.find(property => property.key.value === 'CampaignState')?.value;
assert(legacyRoot && hash(schemaSource.slice(legacyRoot.start, legacyRoot.end)) === manifest.legacyRootShape.sha256, 'Reviewed legacy root shape changed.');
const seenRoot = shapes?.properties.find(property => property.key.value === 'CampaignStateWithSeen')?.value;
assert(manifest.seenRootShape.path === manifest.legacyRootShape.path && seenRoot && hash(schemaSource.slice(seenRoot.start, seenRoot.end)) === manifest.seenRootShape.sha256, 'Reviewed v7 seen root shape changed.');
const workRoot = shapes?.properties.find(property => property.key.value === 'CampaignStateWithWork')?.value;
assert(manifest.workRootShape.path === manifest.legacyRootShape.path && workRoot && hash(schemaSource.slice(workRoot.start, workRoot.end)) === manifest.workRootShape.sha256, 'Reviewed v8 work root shape changed.');
const movesRoot = shapes?.properties.find(property => property.key.value === 'CampaignStateWithMoves')?.value;
assert(manifest.movesRootShape.path === manifest.legacyRootShape.path && movesRoot && hash(schemaSource.slice(movesRoot.start, movesRoot.end)) === manifest.movesRootShape.sha256, 'Reviewed v11 move root shape changed.');
const steelRoot = shapes?.properties.find(property => property.key.value === 'CampaignStateWithSteel')?.value;
assert(manifest.steelRootShape.path === manifest.legacyRootShape.path && steelRoot && hash(schemaSource.slice(steelRoot.start, steelRoot.end)) === manifest.steelRootShape.sha256, 'Reviewed v10 Steel root shape changed.');
for (const [name, pin] of [['CampaignStateWithFriends', manifest.friendsRootShape], ['FriendsState', manifest.friendsOwnerShape], ['CampaignStateWithFieldMoves', manifest.fieldMovesRootShape]]) {
  const node = shapes?.properties.find(property => property.key.value === name)?.value;
  assert(pin.path === manifest.legacyRootShape.path && node && hash(schemaSource.slice(node.start, node.end)) === pin.sha256, `Reviewed predecessor ${name} shape changed.`);
}
console.log(`Save admission source pins: ${manifest.modules.length} unchanged dependencies / ${manifest.functionBodies.length} exact predecessor bodies / 2 factual manifests and their resources; no game code executed.`);
