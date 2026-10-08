import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import Ajv from 'ajv';
import { authoringRoot, runtimeRoot, buildDungeonResources, exportDungeonResources } from './export-dungeons.mjs';

const { families: data, schemas, coverage } = await buildDungeonResources();
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const ajv = new Ajv({ allErrors: true, strict: true });
const indexes = {};
for (const [family, records] of Object.entries(data)) {
  assert(records.length === coverage.expectedRecords[family], `${family}: count`);
  const validate = ajv.compile(schemas.families[family]);
  indexes[family] = new Map();
  for (const record of records) {
    assert(validate(record), `${family}/${record.id}: ${JSON.stringify(validate.errors)}`);
    assert(!indexes[family].has(record.id), `${family}: duplicate ${record.id}`);
    indexes[family].set(record.id, record);
  }
  assert(records.length === schemas.families[family].properties.id.enum.length, `${family}: identity coverage`);
}
assert(Object.keys(data).sort().join() === Object.keys(coverage.expectedRecords).sort().join(), 'Family coverage');
const ref = (family, id) => { assert(indexes[family]?.has(id), `Unknown ${family} reference ${id}`); return indexes[family].get(id); };
for (const records of Object.values(data)) for (const r of records) if (r.confidenceId) ref('confidence', r.confidenceId);
const species = JSON.parse(await readFile(new URL('../content/species.json', import.meta.url), 'utf8')).records;
const forms = JSON.parse(await readFile(new URL('../content/forms.json', import.meta.url), 'utf8')).records;
const members = new Map(species.map(r => [r.id, new Set(r.formIds)]));
const formOwners = new Map(forms.map(r => [r.id, r.speciesId]));
function weighted(rows, total, label) {
  let sum = 0;
  let end = 0;
  for (const [i, r] of rows.entries()) {
    sum += r.publishedWeight;
    const nextEnd = r.publishedWeight ? Math.min(10000, sum + 1) : end;
    assert(r.order === i && r.cumulativeWeight === sum && r.selectionThreshold === (r.publishedWeight ? sum : 0) && r.effectiveDrawCount === nextEnd - end, `${label}: ordered probability ${i}`);
    end = nextEnd;
  }
  assert(total === sum && (sum === 0 || sum === 10000), `${label}: denominator`);
  assert(end === (total ? 10000 : 0), `${label}: draw coverage`);
}
for (const p of data.encounters) {
  weighted(p.rows, p.publishedTotal, p.id);
  for (const r of p.rows) {
    assert((r.publishedWeight === 0) === (r.entryRole === 'nonrandom-level-lookup'), `${p.id}: lookup role`);
    if (r.identityClass === 'internal-decoy') assert(r.speciesId === null && r.formId === null && r.speciesSymbol === 'DECOY' && r.publishedWeight === 0, 'Decoy must not become a random/recruitable species');
    else {
      assert(members.has(r.speciesId), `${p.id}: species membership`);
      const allowed = members.get(r.speciesId);
      assert(allowed.size ? allowed.has(r.formId) && formOwners.get(r.formId) === r.speciesId : r.formId === null, `${p.id}: form membership`);
    }
    assert((r.speciesSymbol === 'MEW') === (r.applicabilityPredicate === 'initial-mew-eligibility'), `${p.id}: Mew path`);
    const gated = ['PORYGON', 'FEEBAS', 'MILOTIC', 'PLUSLE', 'MANTINE', 'ROSELIA'].includes(r.speciesSymbol);
    assert(gated === (r.blueGate === 'wonder-mail-exclusive-unlocked'), `${p.id}: Blue availability`);
  }
}
for (const p of data.items) {
  weighted(p.categories, p.publishedTotal, p.id);
  for (const c of p.categories) {
    ref('categories', c.categoryId);
    weighted(c.items, c.publishedTotal, p.id);
    for (const r of c.items) ref('item-identities', r.itemId);
  }
}
for (const p of data.traps) { weighted(p.rows, p.publishedTotal, p.id); for (const r of p.rows) ref('trap-identities', r.trapId); }
for (const g of data.generation) {
  assert(Object.keys(g.parameters).length === 28, `${g.id}: 28 generation fields`);
  assert(g.roomFlags.secondaryTerrain === Boolean(g.parameters.roomFlags & 1) && g.roomFlags.imperfections === Boolean(g.parameters.roomFlags & 4), `${g.id}: room flag masks`);
}
for (const family of ['generation', 'encounters', 'items', 'traps']) {
  const indices = data[family].flatMap(r => r.sourceIndices).sort((a, b) => a - b);
  assert(indices.length === coverage.sourceRecordCounts[family] && indices.every((v, i) => v === i), `${family}: complete source crosswalk`);
}
for (const f of [...data.floors, ...data.scenes, ...data['excluded-floors']]) {
  const g = ref('generation', f.generationId);
  ref('encounters', f.encounterPoolId); ref('traps', f.trapPoolId);
  for (const p of Object.values(f.itemPoolIds)) ref('items', p);
  const fixed = ref('fixed-rooms', f.fixedRoomId);
  const rules = ref('restrictions', f.restrictionId);
  assert(fixed.sourceIndex === g.parameters.fixedRoomNumber, `${f.id}: fixed room join`);
  assert(rules.sourceDungeonIndex === f.sourceRestrictionIndex, `${f.id}: rule identity`);
  if (f.sourceFloorKey.startsWith('DojoRegistration:')) assert(f.sourceRestrictionIndex === 75 + Math.floor((f.sourceLocalFloor - 1) / 3), `${f.id}: maze slot`);
  if (f.dungeonId !== null) ref('dungeons', f.dungeonId);
  if (f.sectionId !== null) assert(ref('sections', f.sectionId).dungeonId === f.dungeonId, `${f.id}: source section parent`);
  if (f.classification === 'field' || f.classification === 'dojo' || f.classification === 'alternate-visit-unresolved') {
    assert(f.display.number === f.localFloor && f.display.direction === (rules.fields.stairDirectionUp ? 'ascent' : 'descent'), `${f.id}: displayed floor`);
  }
  assert((f.dungeonId === 'dojo-rescue-team-maze') === (f.populationRoute === 'imported-team-data'), `${f.id}: imported team route`);
}
const primary = data.floors.filter(f => f.variantId === 'source-primary');
assert(primary.filter(f => f.classification === 'field').length === 1427 && primary.filter(f => f.classification === 'dojo').length === 66, 'Full floor coverage');
assert(data.floors.filter(f => f.variantId === 'alternate-visit').length === 4 && data.scenes.length === 1 && data.scenes[0].id === 'mt-freeze-ninetales-summit', 'Scene/variant coverage');
assert(data.dungeons.filter(d => d.kind === 'field').length === 45 && data.dungeons.filter(d => d.kind === 'dojo').length === 22, 'Dungeon scope');
const ownedSectionIds = new Set();
const ownedSceneIds = new Set();
for (const d of data.dungeons) {
  const fs = primary.filter(f => f.dungeonId === d.id).sort((a, b) => a.cumulativeOrdinal - b.cumulativeOrdinal);
  assert(fs.length === d.canonicalFloorCount && fs.every((f, i) => f.cumulativeOrdinal === i + 1), `${d.id}: cumulative floors`);
  for (const s of d.sectionIds) {
    assert(ref('sections', s).dungeonId === d.id && !ownedSectionIds.has(s), `${d.id}: unique section parent`);
    ownedSectionIds.add(s);
  }
  for (const s of d.sceneIds) {
    assert(ref('scenes', s).dungeonId === d.id && !ownedSceneIds.has(s), `${d.id}: unique scene parent`);
    ownedSceneIds.add(s);
  }
}
assert(ownedSectionIds.size === data.sections.length && ownedSceneIds.size === data.scenes.length, 'Complete dungeon child ownership');
const sectionFloors = [];
for (const s of data.sections) for (const v of s.variants) for (const [i, id] of v.floorIds.entries()) {
  const f = ref('floors', id); sectionFloors.push(id);
  assert(f.sectionId === s.id && f.dungeonId === s.dungeonId && f.variantId === v.id && f.localFloor === i + 1, `${s.id}: local floors/variant`);
}
assert(sectionFloors.length === data.floors.length && new Set(sectionFloors).size === data.floors.length, 'Exactly one section/variant per floor');
assert(data['fixed-rooms'].length === 140 && data['fixed-rooms'].filter(r => r.classification === 'embedded-reward').length === 17, 'Fixed room coverage');
const fixedIndices = data['fixed-rooms'].map(r => r.sourceIndex).sort((a, b) => a - b);
assert(fixedIndices.every((v, i) => v === i), 'Fixed-room source index coverage');
for (const rules of data.restrictions) for (const field of rules.converterDefaultedFields) assert(rules.fields[field] === false, `${rules.id}: converter default`);
const manifest = JSON.parse(await readFile(path.join(authoringRoot, 'source-manifest.json'), 'utf8'));
assert(manifest.commit === '6bcbec4f906938c0243aa2026bcbd41b577bab85' && manifest.files.every(f => /^[a-f0-9]{64}$/.test(f.sha256) && f.gitBlobVerified), 'Pinned source manifest');
const summary = JSON.parse(await readFile(path.join(authoringRoot, 'research-summary.json'), 'utf8'));
assert(summary.upcEncounterPoolsCorroborated === 839 && summary.accessibleOrdinaryItemPoolsCorroborated === 136 && summary.upcFloorComparisons === 1763, 'Source comparison counts');
// Recompare independent published numerical facts, not just cached audit totals.
const research = async name => JSON.parse(await readFile(path.join(authoringRoot, `research-${name}.json`), 'utf8'));
const bySource = family => new Map(data[family].flatMap(r => r.sourceIndices.map(i => [i, r])));
const encounterSources = bySource('encounters');
const speciesToken = value => value.replaceAll('♀', 'F').replaceAll('♂', 'M').replaceAll('!', 'EMARK').replaceAll('?', 'QMARK').replace(/ \(Attack Form\)/, 'ATTACK').replace(/ \(Defense Form\)/, 'DEFENSE').replace(/ \(Speed Form\)/, 'SPEED').replace(/^Deoxys$/, 'DEOXYSNORMAL').toUpperCase().replace(/[^A-Z0-9]/g, '');
const encounterEvidence = await research('upc-encounter-facts');
const corroborated = new Set();
for (const fact of encounterEvidence) for (const sourceIndex of fact.matchingRedPoolIds) {
  const pool = encounterSources.get(sourceIndex);
  const observed = pool.rows.filter(r => r.publishedWeight > 0).map(r => [speciesToken(r.speciesSymbol), r.level, r.publishedWeight]);
  const published = fact.rows.map(r => [speciesToken(r.speciesName), r.level, r.weight]);
  assert(JSON.stringify(observed) === JSON.stringify(published), `UPC encounter mismatch at source line ${fact.upcLine}`);
  corroborated.add(sourceIndex);
}
assert(encounterEvidence.length === 870 && corroborated.size === 839, 'Complete UPC encounter comparisons');
const itemSources = bySource('items');
const itemToken = value => value.replace(/^ITEM_/, '').replace(/^(TM|HM)_/, '').replace(/^POK$/, 'POKE').toUpperCase().replace(/[^A-Z0-9]/g, '');
const itemEvidence = await research('upc-item-facts');
const matchedItemSources = new Set();
for (const fact of itemEvidence) for (const sourceIndex of fact.matchingRedPoolIds) {
  const pool = itemSources.get(sourceIndex);
  const observed = pool.categories.flatMap(c => c.items.map(r => [itemToken(ref('item-identities', r.itemId).sourceSymbol), ref('categories', c.categoryId).sourceIndex, c.publishedWeight, r.publishedWeight])).sort();
  const published = fact.rows.map(r => [itemToken(r.name), r.categoryIndex, r.categoryWeight, r.itemWeight]).sort();
  assert(JSON.stringify(observed) === JSON.stringify(published), `UPC item mismatch at source line ${fact.upcLine}`);
  matchedItemSources.add(sourceIndex);
}
assert(itemEvidence.filter(r => r.matchingRedPoolIds.length).length === 150, 'Complete UPC item range comparisons');
for (const floor of [...data.floors, ...data.scenes]) assert(ref('items', floor.itemPoolIds.floor).sourceIndices.some(i => matchedItemSources.has(i)), `${floor.id}: ordinary item corroboration`);
const floorEvidence = new Map((await research('upc-floor-facts')).map(r => [r.sourceLine, r]));
const floorSources = new Map([...data.floors, ...data.scenes, ...data['excluded-floors']].map(r => [r.sourceFloorKey, r]));
const floorComparisons = await research('upc-floor-comparison');
for (const comparison of floorComparisons) {
  const fact = floorEvidence.get(comparison.upcLine);
  const floor = floorSources.get(comparison.floorKey);
  const parameters = ref('generation', floor.generationId).parameters;
  assert(parameters.moneyUpperBound === fact.baseMoney && parameters.tileset === fact.terrain, `UPC money/terrain mismatch ${comparison.floorKey}`);
}
assert(floorComparisons.length === 1763, 'Complete UPC money/terrain comparisons');
const disabledShop = itemSources.get(83);
const disabledFloors = data.floors.filter(f => f.itemPoolIds.shop === disabledShop.id);
assert(disabledFloors.length === 2 && disabledFloors.every(f => ref('generation', f.generationId).parameters.kecleonShopChance === 0), 'Unused TM pool is not an enabled shop route');
for (const root of [authoringRoot, runtimeRoot]) for (const name of await readdir(root)) assert((await stat(path.join(root, name))).size < 1024 * 1024, `Size limit: ${name}`);
await exportDungeonResources(true);
console.log(`Dungeon static catalog: 45 field + 22 maze identities; 1427 + 66 primary floors, 1 scene, 4 variant floors; ${data.encounters.length} encounter pools; 140 fixed records. No game code executed.`);
