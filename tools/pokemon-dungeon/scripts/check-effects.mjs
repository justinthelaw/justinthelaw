// Independent static data inspection. Never imports or executes game modules.
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';
import { authoringRoot, buildEffectResources, exportEffectResources } from './export-effects.mjs';
import path from 'node:path';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const read = async name => JSON.parse(await readFile(path.join(authoringRoot, name), 'utf8'));
const { families, coverage, schemas } = await buildEffectResources();
const expectedCounts = {actions:413,moves:356,items:240,families:266,statuses:66,timers:60,'auxiliary-statuses':4,geometries:10,categories:8,rules:18,guards:12,'species-parameters':424,terrain:4,contracts:22,treasures:20,'availability-routes':178,conflicts:22,parameters:208,'auxiliary-effects':72};
assert(JSON.stringify(Object.keys(families).sort()) === JSON.stringify(Object.keys(expectedCounts).sort()), 'Complete factual family set');
for (const [name,count] of Object.entries(expectedCounts)) assert(families[name].length === count, `${name}: required complete count`);
const ajv = new Ajv({ allErrors: true, strict: true });
const contractRequirements = await read('contract-requirements.json');
assert(JSON.stringify(schemas.families.contracts) === JSON.stringify(contractRequirements.schema), 'Contract schema must equal reviewed structural requirements');
const validateContract = ajv.compile(contractRequirements.schema);
const names = Object.keys(coverage.counts).sort();
assert(names.join('|') === Object.keys(families).sort().join('|'), 'Exact family membership');
assert(names.join('|') === Object.keys(schemas.families).sort().join('|'), 'Exact schema membership');
const ids = {};
for (const name of names) {
  const rows = families[name];
  const validate = ajv.compile(schemas.families[name]);
  assert(rows.length === coverage.counts[name], `${name}: count`);
  ids[name] = new Set(rows.map(r => r.id));
  assert(ids[name].size === rows.length, `${name}: duplicate IDs`);
  assert(rows.map(r => r.id).join('|') === coverage.keys[name].join('|'), `${name}: exact ordered keys`);
  for (const row of rows) assert(validate(row), `${name}/${row.id}: ${ajv.errorsText(validate.errors)}`);
}
const ref = (family, id) => assert(ids[family]?.has(id), `Unknown ${family}: ${id}`);
const identities = JSON.parse(await readFile(new URL('../content/species-runtime/identities.json', import.meta.url), 'utf8'));
const systems = JSON.parse(await readFile(new URL('../content/systems.json', import.meta.url), 'utf8'));
const moves = systems.records.filter(r => r.recordKind === 'move').map(r => r.id).sort();
assert(moves.join('|') === [...ids.moves].sort().join('|'), 'Original 356 move exact canonical membership');
for (const move of identities.moves) assert(families.moves.some(r => r.internalId === move.originalId && r.id === move.id), `Learnset move crosswalk ${move.id}`);
for (const [i, r] of families.actions.entries()) {
  assert(r.internalId === i && r.id === `action-${String(i).padStart(3, '0')}`, 'Action contiguous identity');
  if (r.moveId !== null) ref('moves', r.moveId);
  r.familyIds.forEach(id => ref('families', id));
  ref('geometries', r.target.geometryRef); ref('categories', r.target.relationRef);
  assert(r.target.rangeCode === Number(r.target.geometryRef.slice(9)), `${r.id}: geometry join`);
  assert(r.target.categoryCode === Number(r.target.relationRef.slice(9)), `${r.id}: category join`);
  for (const key of ['power','pp','accuracyBeforeEffect','accuracyAfterDamage','criticalPercent','chainedHitsRaw','ginsengCap']) assert(Number.isInteger(r.numeric[key]) && r.numeric[key] >= 0 && r.numeric[key] <= 65535, `${r.id}: ${key}`);
  assert(r.moveId === null || r.effects.length > 0, `${r.id}: original move lacks factual effects`);
}
for (const r of families.moves) assert(families.actions[r.internalId]?.moveId === r.id && families.actions[r.internalId]?.id === r.actionId, `${r.id}: reverse action join`);
for (const [i,r] of families.items.entries()) {
  assert(r.internalId === i, 'Item contiguous identity');
  if (r.actionId !== null) ref('actions', r.actionId);
  for (const branch of ['useEffects','heldEffects','throwEffects']) assert(Array.isArray(r[branch]) && r[branch].length, `${r.id}: ${branch}`);
  for (const id of Object.values(r.failureConsumption)) if (id !== 'action-specific;see-use-effects-and-special-item-contracts') assert(ids.rules.has(id) || ids.contracts.has(id), `Unknown consumption contract ${id}`);
  assert(r.buyPrice >= 0 && r.sellPrice >= 0 && r.sellPrice <= r.buyPrice, `${r.id}: prices`);
  for (const pool of r.availabilityEvidence.randomPoolReferences) ref('availability-routes', `pool-${String(Number(pool.pool.replace('items_found_out',''))).padStart(3,'0')}`);
}
for (const r of families.statuses) {
  if (r.timerRef !== null) ref('timers', r.timerRef);
  assert(r.behavior.length > 0 && r.groupValue > 0, `${r.id}: grouped status behavior`);
}
for (const r of families.timers) {
  assert(r.rawBounds.length === 2 && r.rawBounds[0] <= r.rawBounds[1], `${r.id}: timer bounds`);
  assert(r.drawDomain.minInclusive <= r.drawDomain.maxInclusive && r.rawIndefiniteSentinel === 127, `${r.id}: timer draw`);
}
for (const r of families.families) assert(r.effects.length > 0 && Number.isInteger(r.internalId), `${r.id}: effects`);
for (const r of families.treasures) ref('items', r.itemId);
for (const r of families.terrain.filter(r => r.id !== 'secretPowerEffectByCode')) assert(r.values.length === 76, `${r.id}: tilesets`);
const referenceFamilies = {geometryRef:'geometries',relationRef:'categories',timerRef:'timers',timerSemanticsRef:'rules',applicationGuardRef:'guards',guardRef:'guards',reactionGuardRef:'guards',lookupRef:'contracts',duplicatePolicyRef:'rules',duplicateRouteRef:'rules',tableRef:'terrain',parameterRef:'parameters'};
function inspect(value) {
  if (Array.isArray(value)) { value.forEach(inspect); return; }
  if (!value || typeof value !== 'object') return;
  if (value.op === 'revival-state-contract') { assert(typeof value.contractRef === 'string' && !Object.hasOwn(value,'ref'), 'Revival operation requires canonical contractRef'); ref('contracts',value.contractRef); }
  assert(!(typeof value.ref === 'string' || typeof value.table === 'string'), 'Unnormalized relationship field');
  if(value.op === 'apply-status') assert(ids.statuses.has(value.status) || ids['auxiliary-statuses'].has(value.status), `Unknown applied status ${value.status}`);
  for (const [key,child] of Object.entries(value)) {
    if (typeof child === 'string' && referenceFamilies[key]) ref(referenceFamilies[key],child);
    if (['contractRef','stateContractRef','callingContractRef'].includes(key) && child !== null) assert(ids.contracts.has(child) || ids.rules.has(child), `Unknown contract ${child}`);
    if (key === 'chancePercent') assert(Number.isFinite(child) && child >= 0 && child <= 100, 'Effect probability bounds');
    if (key === 'fraction') assert(Array.isArray(child) && child.length === 2 && child.every(Number.isFinite) && child[1] > 0, 'Rational effect denominator');
    inspect(child);
  }
}
Object.values(families).forEach(inspect);
const profileFiles = (await readdir(new URL('../content/species-runtime/',import.meta.url))).filter(n => /^profiles-\d+\.json$/.test(n));
const profiles = (await Promise.all(profileFiles.map(async file => JSON.parse(await readFile(new URL(`../content/species-runtime/${file}`,import.meta.url),'utf8')).records))).flat();
for (const r of families['species-parameters']) {
  assert(r.lowKickMultiplier.length === 2 && r.lowKickMultiplier[1] === 256 && r.lowKickMultiplier[0] > 0 && r.bodySlots >= 1 && r.bodySlots <= 4, `${r.id}: body arithmetic`);
  if(r.speciesId !== null) assert(profiles.some(p => p.internalId === r.internalId && p.speciesId === r.speciesId && p.formId === r.formId && p.bodySize === r.bodySlots), `${r.id}: species/form crosswalk`);
}
const manifest = await read('research-manifest.json');
for (const entry of manifest.files) {
  assert(/^research-[A-Za-z0-9]+-\d{2}\.json$/.test(entry.file), 'Unsafe research filename');
  const bytes = await readFile(path.join(authoringRoot, entry.file));
  assert(bytes.byteLength < 1048576 && createHash('sha256').update(bytes).digest('hex') === entry.sha256, `Research integrity ${entry.file}`);
}
const sourceSection = async key => {
  const chunks = await Promise.all(manifest.files.filter(r => r.file.startsWith(`research-${key}-`)).map(r => read(r.file)));
  return Array.isArray(chunks[0]) ? chunks.flat() : chunks[0];
};
const originalConflicts = await sourceSection('conflicts');
for (const [i,row] of families.conflicts.entries()) {
  const source=originalConflicts[i];
  const selected = ['selected','selectedRed','selectedOriginalResearch'].find(k => Object.hasOwn(source,k));
  assert(selected && JSON.stringify(row.selection.value) === JSON.stringify(source[selected]) && row.selection.reason === source.evidence, `${row.id}: selected conflict parity`);
}
const originalActions = await sourceSection('moves');
const originalItems = await sourceSection('items');
const originalFamilies = await sourceSection('effectFamilies');
const omit = new Set(['evidence','handlerEvidence','handlerConstantFacts','handlerConditionReferences','semanticVerification','researchHandler','behaviorEvidence','provenance','poolEvidence','rewardBlacklistEvidence','buyAndSellEvidence','selectionEvidence','ordinaryRewardEvidence','figuresDeliveryEvidence','evidenceLocator']);
function normalizedFact(v) {
  if(Array.isArray(v)) return v.map(normalizedFact);
  if(v && typeof v === 'object') {
    if(v.op === 'revival-state-contract' && Object.hasOwn(v,'ref')) { const {ref,...rest}=v;v={...rest,contractRef:ref.split('.').at(-1)}; }
    if(typeof v.table === 'string') { const {table,...rest}=v;v={...rest,[table.startsWith('g')?'parameterRef':'tableRef']:table}; }
    return Object.fromEntries(Object.entries(v).filter(([k]) => !omit.has(k) && (!k.endsWith('Evidence') || k === 'availabilityEvidence')).map(([k,child]) => [k, ['contractRef','tableRef'].includes(k) && typeof child === 'string' ? child.split('.').at(-1) : k === 'lookupRef' && child === 'decoy-treatment-table' ? 'decoyTreatmentTable' : normalizedFact(child)]));
  }
  return v;
}
// Contract coverage and nested fact parity are independent of the export/schema generator.
const contractBindings = [
  ...['decoyTreatmentTable','turnEffectContracts','randomItemSetContract','itemAvailabilitySummary','shopOwnershipContract','gummiTables','statusGroupTimerHookCorrections'].map(id => [id,id,null]),
  ...['volatile-reset','reviver-seed','hidden-power','transfer-orb'].map(id => [id,'stateContracts',id]),
  ...['recycle','used-tm-payload','town-tm-hm-use','friend-area-gummi'].map(id => [id,'itemLifecycleContracts',id]),
  ...['metronome','assist','mimic','sketch','sleep-talk','nature-power'].map(id => [id,'moveCallingContracts',id]),
  ['move-calling-common','moveCallingContracts',null],
];
assert(contractBindings.map(r => r[0]).sort().join('|') === [...ids.contracts].sort().join('|'), 'Exact independently named contracts');
for (const [id,section,key] of contractBindings) {
  const original = await sourceSection(section);
  const raw = id === 'move-calling-common' ? Object.fromEntries(['confidence','chargeExclusionMoveIds','chargeWeatherException'].map(k => [k,original[k]])) : key === null ? original : original[key];
  const row=families.contracts.find(r => r.id===id);
  assert(row && JSON.stringify(row.facts) === JSON.stringify(normalizedFact(raw)), `${id}: complete nested research contract parity`);
  // Authoring-schema regression guards; only JSON data is examined, no game module.
  assert(!validateContract({...row,facts:{}}), `${id}: empty facts must reject`);
  for (const [field,value] of Object.entries(row.facts)) if (Array.isArray(value) && value.length) {
    const damaged=structuredClone(row);damaged.facts[field]=[];
    assert(!validateContract(damaged), `${id}: required nonempty fact sequence ${field}`);
  }
  for (const field of Object.keys(row.facts)) {
    const damaged=structuredClone(row);delete damaged.facts[field];
    assert(!validateContract(damaged), `${id}: required fact field ${field}`);
  }
}
for (const [id,path,empty] of [
  ['volatile-reset',['scalarAssignments','sleepClassStatus.status'],false],
  ['gummiTables',['gummiIqByType','normal'],true],
  ['metronome',['table','0','moveId'],false],
]) {
  const damaged=structuredClone(families.contracts.find(r => r.id===id));
  let target=damaged.facts;
  for (const key of path.slice(0,-1)) target=target[key];
  const key=path.at(-1);
  assert(Object.hasOwn(target,key), `${id}: nested completeness probe must name an existing field`);
  if(empty) target[key]=[];else delete target[key];
  assert(!validateContract(damaged), `${id}: nested required structure ${path.join('.')}`);
}
const iqTables = await sourceSection('iqDamageTables');
for (const id of ['gReturnDmgData','gFrustrationDmgData']) {
  const parameter=families.parameters.find(r => r.id===id);
  assert(parameter && JSON.stringify(parameter.value)===JSON.stringify(normalizedFact(iqTables[id])), `${id}: complete threshold table parity`);
  assert(parameter.value.rows.length===11 && parameter.value.sentinel.iqBound===-1 && parameter.value.fallbackDamage===1, `${id}: table structure`);
  for (const [i,row] of parameter.value.rows.entries()) assert(Number.isSafeInteger(row.damage) && row.damage>0 && (i===0 || row.iqExclusiveUpperBound>parameter.value.rows[i-1].iqExclusiveUpperBound), `${id}: ordered integer bounds`);
}
for (const [i,row] of families.families.entries()) assert(row.internalId === i && JSON.stringify(row.effects) === JSON.stringify(normalizedFact(originalFamilies[String(i)].effects)), `${row.id}: family operation parity`);
for (const action of families.actions) for (const key of ['effects','numeric','flags','hitCountContract','unresolved']) assert(JSON.stringify(action[key]) === JSON.stringify(normalizedFact(originalActions[action.internalId][key])), `${action.id}: source fact parity ${key}`);
for (const item of families.items) for (const key of ['useEffects','heldEffects','throwEffects','failureConsumption','availabilityEvidence']) assert(JSON.stringify(item[key]) === JSON.stringify(normalizedFact(originalItems[item.internalId][key])), `${item.id}: source fact parity ${key}`);
assert(/^[a-f0-9]{40}$/.test(manifest.sourcePins.red) && /^[a-f0-9]{40}$/.test(manifest.sourcePins.blueReported), 'Source revision pins');
const sourceArtifacts = await read('research-sourceArtifacts-01.json');
for (const table of Object.values(iqTables)) assert(sourceArtifacts.some(source => source.url === table.evidence.url && source.sha256 === table.evidence.sha256) && table.evidence.commit === manifest.sourcePins.red, 'IQ table pinned source integrity');
for (const source of sourceArtifacts) assert(/^[a-f0-9]{64}$/.test(source.sha256) && /^https:\/\//.test(source.url), 'Source artifact integrity');
for (const file of await readdir(authoringRoot)) if (file.endsWith('.json')) assert((await readFile(path.join(authoringRoot,file))).length < 1048576, `Bounded JSON ${file}`);
await exportEffectResources(true);
console.log(`Validated ${families.moves.length} moves, ${families.actions.length} actions, ${families.items.length} items, ${families.families.length} operation families and ${families.statuses.length} statuses (static facts only).`);
