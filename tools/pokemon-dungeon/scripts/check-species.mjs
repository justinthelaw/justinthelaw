import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildSpeciesExport, speciesAuthorRoot, speciesRuntimeRoot, speciesFiles, sha256 } from './export-species.mjs';

const canonical = value => JSON.stringify(value);
const unique = (rows, key = 'id') => {
  const values = new Map(rows.map(row => [row[key], row]));
  assert.equal(values.size, rows.length, `Duplicate ${key}`);
  return values;
};
const integer = (value, min, max) => assert(Number.isInteger(value) && value >= min && value <= max, `Invalid integer ${value}`);
const hash = value => assert.match(value, /^[a-f0-9]{64}$/);
const exactKeys = (value, keys) => {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected record object');
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort());
};
const load = async name => JSON.parse(await readFile(new URL(name, speciesAuthorRoot), 'utf8'));
const inventory = async name => JSON.parse(await readFile(new URL(`../${name}.json`, speciesAuthorRoot), 'utf8')).records;
const output = await buildSpeciesExport();
const documents = new Map();
for (const filename of speciesFiles) {
  assert.match(filename, /^[a-z]+(?:-[1-5])?\.json$/);
  for (const root of [speciesAuthorRoot, speciesRuntimeRoot]) {
    const target = new URL(filename, root);
    const relative = path.relative(await realpath(fileURLToPath(root)), await realpath(fileURLToPath(target)));
    assert(!relative.startsWith('..') && !path.isAbsolute(relative), 'Resource escaped local root');
    assert((await stat(target)).size < 1024 * 1024, 'Oversized resource');
  }
  const doc = await load(filename);
  assert.equal(doc.schemaVersion, 1);
  assert.equal(doc.catalogId, 'original-blue-species-profiles');
  assert.equal(doc.edition, 'blue-rescue-team-qualified-facts');
  const expectedKind = filename.replace(/-[1-5]/, '').replace('.json', '');
  assert.equal(doc.kind, expectedKind);
  documents.set(filename, doc);
}
assert.deepEqual((await readdir(speciesRuntimeRoot)).sort(), [...output.keys()].sort(), 'Unexpected runtime resource');
for (const [name, text] of output) assert.equal(await readFile(new URL(name, speciesRuntimeRoot), 'utf8'), text, `Stale export ${name}`);
const manifest = JSON.parse(output.get('manifest.json'));
for (const entry of manifest.resources) {
  assert.equal(entry.bytes, Buffer.byteLength(output.get(entry.file)));
  assert.equal(entry.sha256, sha256(output.get(entry.file)));
}
const species = documents.get('species.json').records;
const profiles = [1, 2, 3, 4, 5].flatMap(i => documents.get(`profiles-${i}.json`).records);
const levels = [1, 2, 3, 4].flatMap(i => documents.get(`levels-${i}.json`).records);
const learnsets = documents.get('learnsets.json').records;
const identities = documents.get('identities.json');
const provenance = documents.get('sources.json');
const profileMap = unique(profiles);
const internalMap = unique(profiles, 'internalId');
const speciesMap = unique(species);
const levelMap = unique(levels);
const learnMap = unique(learnsets);
assert.equal(species.length, 386);
assert.equal(profiles.length, 419);
assert.equal(levels.length, 384);
assert.equal(learnsets.length, 386);
assert.equal(profiles.filter(p => p.persistence === 'persistent').length, 413);
assert.equal(profiles.filter(p => p.persistence === 'temporary').length, 6);
const sourceMap = unique(provenance.sources);
assert.equal(provenance.blueBinaryBuildVerified, false);
assert.deepEqual(provenance.capabilities, { numericProfileLookup: true, rawLearnsetLookup: true, metadataLookup: true, gameplayRules: [] });
assert.deepEqual(provenance.statOrder, ['hp', 'attack', 'specialAttack', 'defense', 'specialDefense']);
assert.deepEqual(provenance.levelRowOrder, ['cumulativeExp', ...provenance.statOrder]);
assert.deepEqual(provenance.excluded.map(r => r.internalId), [420, 421, 422, 423]);
for (const s of sourceMap.values()) {
  assert.match(s.url, /^https:\/\//);
  assert(s.scope.length > 10);
  if (s.id.startsWith('red-')) assert(s.url.includes('6bcbec4f906938c0243aa2026bcbd41b577bab85'));
  if (s.id.startsWith('blue-')) assert(s.url.includes('f8890eb4ae9867c380381b3b95349092076fa4a6'));
  if (s.artifact) { hash(s.artifact.sha256); integer(s.artifact.bytes, 1, 100_000_000); }
}
for (const evidence of Object.values(provenance.evidence)) {
  assert(evidence.qualification.length > 10);
  for (const sid of evidence.sourceIds) assert(sourceMap.has(sid), `Missing source ${sid}`);
}
for (const artifact of provenance.researchArtifacts) { hash(artifact.sha256); integer(artifact.bytes, 1, 100_000_000); }
for (const [key, value] of Object.entries(provenance.reconciliation)) if (key.includes('Mismatch')) assert.equal(value, 0);
assert.equal(provenance.reconciliation.upcVersusRedNumericCells, 153600);
const canonicalSpecies = unique(await inventory('species'));
const canonicalForms = unique(await inventory('forms'));
const canonicalSystems = unique(await inventory('systems'));
for (let dex = 1; dex <= 386; dex += 1) {
  const id = `pokemon-${String(dex).padStart(3, '0')}`;
  const row = speciesMap.get(id);
  assert(row, `Missing species ${id}`);
  exactKeys(row, ['id', 'dexNo', 'name', 'profileIds', 'defaultProfileId']);
  assert.equal(row.dexNo, dex);
  assert.equal(row.name, canonicalSpecies.get(id).name);
  assert.deepEqual(row.profileIds, profiles.filter(p => p.speciesId === id).map(p => p.id));
  assert(row.profileIds.length > 0);
  assert.equal(row.defaultProfileId, dex === 201 ? null : dex === 351 ? 'castform-normal' : dex === 386 ? 'deoxys-normal' : id);
}
const expected = new Map();
for (let dex = 1; dex <= 386; dex += 1) {
  if (dex === 201) continue;
  const internal = dex <= 200 ? dex : dex <= 351 ? dex + 25 : dex + 28;
  expected.set(internal, { speciesId: `pokemon-${String(dex).padStart(3, '0')}`, formId: dex === 351 ? 'castform-normal' : dex === 386 ? 'deoxys-normal' : null });
}
for (let n = 0; n < 26; n += 1) expected.set(201 + n, { speciesId: 'pokemon-201', formId: `unown-${String.fromCharCode(97+n)}` });
for (const [internal, speciesId, formId] of [[377, 'pokemon-351', 'castform-snowy'], [378, 'pokemon-351', 'castform-sunny'], [379, 'pokemon-351', 'castform-rainy'], [415, 'pokemon-201', 'unown-exclamation'], [416, 'pokemon-201', 'unown-question'], [417, 'pokemon-386', 'deoxys-attack'], [418, 'pokemon-386', 'deoxys-defense'], [419, 'pokemon-386', 'deoxys-speed']]) expected.set(internal, { speciesId, formId });
const temporary = new Set([377, 378, 379, 417, 418, 419]);
const moves = unique(identities.moves, 'originalId');
const abilities = unique(identities.abilities, 'originalId');
const types = unique(identities.types, 'originalId');
const areas = unique(identities.friendAreas);
assert.equal(areas.size, 57);
assert.equal(types.size, 17);
for (const [kind, rows] of [['move', identities.moves], ['ability', identities.abilities], ['friend-area', identities.friendAreas]]) {
  unique(rows);
  unique(rows, 'originalId');
  for (const row of rows) {
    integer(row.originalId, 1, kind === 'move' ? 394 : kind === 'ability' ? 76 : 57);
    assert.equal(canonicalSystems.get(row.id)?.recordKind, kind);
    assert.equal(canonicalSystems.get(row.id)?.name, row.name);
  }
}
for (const resource of levels) {
  exactKeys(resource, ['id', 'baseStats', 'rows']);
  assert.equal(resource.baseStats.length, 5);
  resource.baseStats.forEach((v, i) => integer(v, 0, i === 0 ? 999 : 255));
  assert.equal(resource.rows.length, 100);
  assert.equal(resource.id, `level-${sha256(canonical({ baseStats: resource.baseStats, rows: resource.rows }))}`);
  let previous = -1;
  for (const [index, row] of resource.rows.entries()) {
    assert.equal(row.length, 6);
    row.forEach((v, i) => integer(v, 0, i === 0 ? 2_147_483_647 : i === 1 ? 65535 : 255));
    assert(row[0] > previous, 'EXP must increase strictly');
    previous = row[0];
    if (index === 0) assert.deepEqual(row, [0, 0, 0, 0, 0, 0]);
  }
}
for (const resource of learnsets) {
  exactKeys(resource, ['id', 'levelUp', 'auxiliary']);
  assert.equal(resource.id, `learn-${sha256(canonical({ levelUp: resource.levelUp, auxiliary: resource.auxiliary }))}`);
  let last = 0;
  for (const row of resource.levelUp) {
    assert.equal(row.length, 2);
    integer(row[0], 1, 100);
    assert(row[0] >= last, 'Level-up order changed');
    last = row[0];
    assert(moves.has(row[1]), `Missing move ${row[1]}`);
  }
  for (const id of resource.auxiliary) assert(moves.has(id), `Missing auxiliary move ${id}`);
}
for (let internal = 1; internal <= 419; internal += 1) {
  const p = internalMap.get(internal);
  assert(p, `Missing internal profile ${internal}`);
  exactKeys(p, ['id', 'speciesId', 'formId', 'persistence', 'internalId', 'resources', 'levelResourceId', 'learnsetResourceId', 'typeIds', 'abilityIds', 'bodySize', 'baseMovementSpeed', 'regenerationRate', 'experienceYield', 'friendAreaId', 'recruitment', 'evidence', 'levelEvidence']);
  assert.equal(p.id, p.formId ?? p.speciesId);
  assert.deepEqual({ speciesId: p.speciesId, formId: p.formId }, expected.get(internal));
  if (p.formId !== null) assert.equal(canonicalForms.get(p.formId)?.speciesId, p.speciesId);
  assert.equal(p.persistence, temporary.has(internal) ? 'temporary' : 'persistent');
  assert.deepEqual(p.resources, { blueGrowthResourceId: temporary.has(internal) ? null : p.speciesId === 'pokemon-201' ? 201 : internal, redGrowthResourceId: internal, blueLearnsetResourceId: internal, redLearnsetResourceId: internal });
  assert(levelMap.has(p.levelResourceId) && learnMap.has(p.learnsetResourceId));
  assert([1, 2, 4].includes(p.bodySize));
  integer(p.baseMovementSpeed, 1, 4);
  integer(p.regenerationRate, 0, 1000);
  integer(p.experienceYield, 0, 65535);
  exactKeys(p.recruitment, ['baseRateTenthsPercent', 'eligibility', 'scriptedAcquisition']);
  integer(p.recruitment.baseRateTenthsPercent, -999, 999);
  assert.equal(p.recruitment.eligibility, null);
  assert.equal(p.recruitment.scriptedAcquisition, null);
  assert(areas.has(p.friendAreaId));
  assert(p.typeIds.length >= 1 && p.typeIds.length <= 2);
  for (const id of p.typeIds) assert(types.has(id));
  assert.equal(p.abilityIds.length, 2);
  assert(abilities.has(p.abilityIds[0]));
  assert(p.abilityIds[1] === null || abilities.has(p.abilityIds[1]));
  exactKeys(p.evidence, ['identity', 'stats', 'experience', 'types', 'abilities', 'bodySize', 'friendArea', 'recruitment', 'mechanicalValues', 'learnset']);
  for (const evidence of Object.values(p.evidence)) {
    assert(typeof evidence === 'string' && evidence.length > 0, 'Expected evidence ID string');
    assert(Object.hasOwn(provenance.evidence, evidence));
  }
  exactKeys(p.levelEvidence, ['redResource', 'redNumericTableSha256', 'redDecodedPayloadSha256', 'upcUrl', 'upcNumericTableSha256']);
  assert(p.levelEvidence.upcUrl === null || typeof p.levelEvidence.upcUrl === 'string', 'Expected nullable UPC locator');
  hash(p.levelEvidence.redNumericTableSha256);
  if (p.levelEvidence.upcNumericTableSha256 !== null) hash(p.levelEvidence.upcNumericTableSha256);
  assert.equal(p.levelEvidence.redResource, `lvmp${String(internal).padStart(3, '0')}`);
  hash(p.levelEvidence.redDecodedPayloadSha256);
  const values = levelMap.get(p.levelResourceId);
  const cumulative = [...values.baseStats];
  const sourceRows = values.rows.map((r, i) => {
    for (let statIndex = 0; statIndex < 5; statIndex += 1) cumulative[statIndex] += r[statIndex+1];
    return [i + 1, ...cumulative, r[0]];
  });
  assert.equal(sha256(canonical(sourceRows)), p.levelEvidence.redNumericTableSha256, `Source numeric mismatch ${p.id}`);
  if (p.evidence.experience === 'upc-shared-original-corroborated-red') {
    assert.equal(p.levelEvidence.upcNumericTableSha256, p.levelEvidence.redNumericTableSha256);
    assert.equal(p.levelEvidence.upcUrl, `https://upcarchive.playker.info/0/upokecenter/games/dungeon/guides/stats.php%3Fid=${internal}.html`);
  } else {
    assert.equal(p.evidence.experience, 'red-comparative-only');
    assert.equal(p.levelEvidence.upcNumericTableSha256, null);
  }
}
assert.equal(new Set(profiles.map(p => p.levelResourceId)).size, levels.length, 'Unused level resources');
assert.equal(new Set(profiles.map(p => p.learnsetResourceId)).size, learnsets.length, 'Unused learnset resources');
assert.equal(profiles.filter(p => p.evidence.experience === 'upc-shared-original-corroborated-red').length, 256);
assert.equal(profileMap.get('pokemon-161').recruitment.baseRateTenthsPercent, 73);
assert.equal(profileMap.get('pokemon-289').friendAreaId, 'friend-area-energetic-forest');
assert.equal(profileMap.get('pokemon-020').friendAreaId, 'friend-area-wild-plains');
assert.equal(profileMap.get('pokemon-251').recruitment.baseRateTenthsPercent, 999);
assert.equal(profileMap.get('pokemon-380').recruitment.baseRateTenthsPercent, 1);
assert.equal(profileMap.get('pokemon-381').recruitment.baseRateTenthsPercent, 1);
assert.equal(profileMap.get('unown-exclamation').recruitment.baseRateTenthsPercent, 1);
assert.equal(profileMap.get('unown-question').recruitment.baseRateTenthsPercent, 1);
assert.equal(areas.get('friend-area-aged-chamber-o-question').sourceSymbol, 'FRIEND_AREA_AGED_CHAMBER_O_EXCLAIM');
const runtimeSource = await readFile(new URL('../../../games/pokemon-dungeon-reimagined/content/species.js', import.meta.url), 'utf8');
for (const name of ['manifest.json', ...speciesFiles]) assert(runtimeSource.includes(`'./species/${name}'`), `Runtime must explicitly name ${name}`);
assert(!/runtimeReady\s*[:=]/.test(runtimeSource), 'Do not conflate profile capability and gameplay readiness');
console.log(`Species facts checked: ${species.length} species, ${profiles.length} profiles, ${levels.length} numeric resources, ${learnsets.length} learnsets; ${256} shared-original / ${157} comparative persistent EXP profiles; JSON/source parsing only.`);
