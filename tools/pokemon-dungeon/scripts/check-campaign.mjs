import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { buildCampaignExport, campaignAuthorRoot, campaignRuntimeRoot, campaignFiles, hashBytes } from './export-campaign.mjs';

const root = new URL('../../../', import.meta.url);
const json = async url => JSON.parse(await readFile(url, 'utf8'));
const inventory = async file => json(new URL(`tools/pokemon-dungeon/content/${file}`, root));
const unique = rows => {
  const map = new Map(rows.map(row => [row.id, row]));
  assert.equal(map.size, rows.length, 'duplicate identity');
  return map;
};
const { resources, integrity } = await buildCampaignExport();
assert.deepEqual((await readdir(campaignRuntimeRoot)).sort(), [...resources.keys()].sort());
for (const [file, bytes] of resources) {
  assert.equal(await readFile(new URL(file, campaignRuntimeRoot), 'utf8'), bytes, `stale resource ${file}`);
  for (const folder of [campaignAuthorRoot, campaignRuntimeRoot]) {
    if (folder === campaignAuthorRoot && file === 'manifest.json') continue;
    const target = new URL(file, folder);
    assert((await stat(target)).size < 1024 * 1024);
    const relative = path.relative(await realpath(fileURLToPath(folder)), await realpath(fileURLToPath(target)));
    assert(!relative.startsWith('..') && !path.isAbsolute(relative));
  }
}
assert.equal(await readFile(new URL('../campaign-integrity.js', campaignRuntimeRoot), 'utf8'), integrity);
const docs = Object.fromEntries(campaignFiles.map(file => [file.slice(0, -5), JSON.parse(resources.get(file))]));
const { schema, model: { model }, predicates, transitions, routes, bosses, contracts: { contracts }, identities, sources } = docs;
assert.deepEqual(schema.vocabulary, ['type', 'properties', 'required', 'additionalProperties', 'items', 'minItems', 'maxItems', 'minimum', 'maximum', 'enum', 'anyOf']);
function vocabulary(rule) {
  assert(Object.keys(rule).every(key => schema.vocabulary.includes(key)));
  if (rule.anyOf) { assert.deepEqual(Object.keys(rule), ['anyOf']); rule.anyOf.forEach(vocabulary); return; }
  assert(['object', 'array', 'integer', 'boolean', 'string', 'null'].includes(rule.type));
  if (rule.type === 'object') {
    assert.equal(rule.additionalProperties, false);
    assert.deepEqual([...rule.required].sort(), Object.keys(rule.properties).sort());
    Object.values(rule.properties).forEach(vocabulary);
  }
  if (rule.type === 'array') vocabulary(rule.items);
  if (rule.enum) assert(rule.enum.length && rule.enum.every(v => ['string', 'number', 'boolean'].includes(typeof v)));
}
const ajv = new Ajv({ allErrors: true, strict: true });
assert.deepEqual(Object.keys(schema.documents), campaignFiles.slice(1).map(file => file.slice(0, -5)));
for (const [kind, definition] of Object.entries(schema.documents)) {
  assert.equal(docs[kind].schemaVersion, 1);
  assert.equal(docs[kind].catalogId, 'original-blue-campaign-facts');
  assert.equal(docs[kind].edition, 'blue-rescue-team-qualified-facts');
  assert.equal(docs[kind].kind, kind);
  vocabulary(definition);
  const validate = ajv.compile(definition);
  assert(validate(docs[kind]), `${kind}: ${ajv.errorsText(validate.errors)}`);
}
const p = unique(predicates.records), t = unique(transitions.records), r = unique(routes.records), b = unique(bosses.records);
const ids = unique(identities.records), callbacks = unique(identities.callbacks), evidence = unique(sources.evidence), source = unique(sources.sources);
unique(routes.returns); unique(bosses.recruitment); unique(bosses.rematches);
const species = unique((await inventory('species-runtime/species.json')).records);
const profiles = (await Promise.all([1, 2, 3, 4, 5].map(n => inventory(`species-runtime/profiles-${n}.json`)))).flatMap(doc => doc.records);
const speciesForm = (id, form) => species.has(id) && (form === null || profiles.some(row => row.speciesId === id && row.formId === form));
const dungeons = unique((await inventory('dungeon-runtime/dungeons-01.json')).records);
const sections = unique((await inventory('dungeon-runtime/sections-01.json')).records);
const fixed = unique((await inventory('dungeon-runtime/fixed-rooms-01.json')).records);
const areas = unique((await inventory('species-runtime/identities.json')).friendAreas);
const itemRows = (await Promise.all([1, 2, 3, 4].map(n => inventory(`effects-runtime/items-0${n}.json`)))).flatMap(doc => doc.records);
const items = unique(itemRows);
const identity = (id, kind) => assert.equal(ids.get(id)?.kind, kind, `missing ${kind}: ${id}`);
function joins(value) {
  if (Array.isArray(value)) { value.forEach(joins); return; }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (child === null) continue;
    if (key === 'evidenceIds') child.forEach(id => assert(evidence.has(id), `evidence ${id}`));
    else if (key === 'sourceId') assert(source.has(child));
    else if (key === 'predicateIds') child.forEach(id => assert(p.has(id)));
    else if (key === 'predicateId' || key.endsWith('PredicateId')) assert(p.has(child), `predicate ${child}`);
    else if (key === 'callbackId' || (key.endsWith('CallbackId') && key !== 'nativeCallbackId')) assert(callbacks.has(child));
    else if (key === 'hookId' || key.endsWith('HookId')) identity(child, 'hook');
    else if (key === 'scenarioId') identity(child, 'scenario');
    else if (key === 'variableId' || key.endsWith('VariableId') || key === 'resetCounterId' || key === 'wrapperResolvesField') identity(child, 'variable');
    else if (key === 'flagId' || key.endsWith('FlagId')) identity(child, 'flag');
    else if (key === 'sceneId' || key.endsWith('SceneId')) identity(child, 'scene');
    else if (key === 'milestoneId') identity(child, 'milestone');
    else if (key.endsWith('MapIds')) child.forEach(id => identity(id, 'map'));
    else if (key.endsWith('MapId')) identity(child, 'map');
    else if (key.endsWith('RouteId')) assert(r.has(child));
    else if (key === 'fixedRoomId') assert(fixed.has(child), `fixed room ${child}`);
    else if (key === 'friendAreaId') assert(areas.has(child));
    else if (key === 'itemId' || key.endsWith('ItemId')) assert(items.has(child));
    else if (key === 'speciesId') assert(speciesForm(child, value.formId ?? null), `species/form ${child}`);
    else if (key.endsWith('SpeciesIds')) child.forEach(id => assert(speciesForm(id, null)));
    else if (key === 'dungeonId') assert(dungeons.has(child));
    else if (key === 'sectionId') assert.equal(sections.get(child)?.dungeonId, value.dungeonId);
    joins(child);
  }
}
Object.values(docs).filter(doc => doc !== schema).forEach(joins);
const visiting = new Set(), visited = new Set();
function graph(id) {
  if (visited.has(id)) return;
  assert(!visiting.has(id), 'predicate cycle');
  visiting.add(id);
  const row = p.get(id);
  if (row.kind === 'all' || row.kind === 'any') row.predicateIds.forEach(graph);
  else if (row.kind === 'not') graph(row.predicateId);
  visiting.delete(id); visited.add(id);
}
p.forEach(row => graph(row.id));
for (const hook of identities.records.filter(row => row.kind === 'hook')) {
  const rows = transitions.records.filter(row => row.hookId === hook.id).sort((a, z) => a.order - z.order);
  assert.deepEqual(rows.map(row => row.order), rows.map((_, n) => n), `ordered hook ${hook.id}`);
}
assert.equal(contracts.returnHookCount, 41);
assert.equal(contracts.returnDecisionCount, 488);
const returnDecisions = transitions.records.filter(row => row.id.startsWith('return-decision-'));
assert.equal(returnDecisions.length, 488);
assert.equal(new Set(returnDecisions.map(row => row.hookId)).size, 41);
for (const route of routes.records) {
  assert(returnDecisions.some(row => row.hookId === route.returnHookId), 'missing normalized return dispatch');
}
assert.equal(p.size, 1011);
assert.equal(t.size, 586);
assert.equal(identities.records.length, 410);
assert.equal(identities.callbacks.length, 20);
assert.equal(sources.sources.length, 64);
assert.equal(r.size, 83); assert.equal(b.size, 26); assert.equal(bosses.recruitment.length, 18);
assert.deepEqual(routes.records.map(row => row.sourceScriptDungeonIndex), Array.from({ length: 83 }, (_, n) => n));
assert.equal(routes.records[0].sourceScriptDungeonSymbol, 'SCRIPT_DUNGEON_TINY_WOODS');
assert.equal(routes.records[76].purpose, 'excluded-source-slot');
assert.equal(routes.records[76].dungeonId, null);
assert.deepEqual(routes.records.filter(row => row.resolvesThroughEnterIndex).map(row => row.id), ['campaign-route-81']);
for (const row of routes.records) {
  if (row.sectionId !== null) assert(sections.get(row.sectionId).variants.some(v => v.id === row.variantId));
  else assert(['rescue-wrapper', 'excluded-source-slot'].includes(row.purpose));
}
// Compare curated source facts independently from the normalizer; never import game code.
const ref = await json(new URL('source-reference.json', campaignAuthorRoot));
const expand = id => {
  const row = p.get(id); assert(row);
  if (row.kind === 'all' || row.kind === 'any') return { [row.kind]: row.predicateIds.map(expand) };
  const { id: ignored, ...rest } = row; void ignored; return rest;
};
const vId = name => `campaign-variable-${name.toLowerCase().replaceAll('_', '-')}`;
const symbol = id => id === null ? -1 : ids.get(id).sourceSymbol;
const speciesByName = new Map([...species.values()].map(row => [row.name, row.id]));
const areaByName = new Map([...areas.values()].map(row => [row.name, row.id]));
function condition(text) {
  if (typeof text === 'object') return Object.fromEntries(Object.entries(text).map(([key, values]) => [key, values.map(condition)]));
  if (text.startsWith('MAIN chapter')) return { all: [{ kind: 'scenario-chapter', scenarioId: 'MAIN', comparison: 'ge', chapter: text.includes('in1') ? 1 : 18 }, { kind: 'scenario-chapter', scenarioId: 'MAIN', comparison: 'le', chapter: 27 }] };
  const pair = /^(MAIN|SUB\d)(>=|<=|>|<|=)\(?([0-9]+),([0-9]+)\)?$/.exec(text);
  if (pair) return { kind: 'scenario', scenarioId: pair[1], comparison: { '=': 'eq', '>': 'gt', '<': 'lt', '>=': 'ge', '<=': 'le' }[pair[2]], chapter: Number(pair[3]), step: Number(pair[4]) };
  if (text.startsWith('owns ')) return { kind: 'friend-area-ownership', friendAreaId: areaByName.get(text.slice(5)) };
  if (text.startsWith('recruited ')) return { kind: 'roster-ownership', speciesId: speciesByName.get(text.slice(10)), present: true };
  const item = /^(Dive|Surf) HM in (toolbox|storage)$/.exec(text);
  assert(item, `unrecognized source predicate ${text}`);
  return { kind: 'item-possession', itemId: `item-hm-${item[1].toLowerCase()}`, scope: item[2] };
}
const unlocks = transitions.records.filter(row => row.hookId === 'unlock-refresh');
assert.equal(unlocks.length, 21);
for (const raw of ref.postgameUnlockRules) assert.deepEqual(expand(t.get(`unlock-${raw.id}`).predicateId), condition(raw.when));
const jobGates = transitions.records.filter(row => row.hookId === 'main-job-dispatch');
assert.equal(jobGates.length, 6);
assert.deepEqual(ref.mainStoryJobIntervals.map(row => row.counterAtLeast), [2, 3, 2, 3, 4, 2]);
for (const raw of ref.mainStoryJobIntervals) {
  const row = t.get(`main-job-${raw.id}`), pred = expand(row.predicateId);
  assert(pred.all.some(x => x.kind === 'scalar' && x.variableId === vId('CLEAR_COUNT') && x.comparison === 'ge' && x.value === raw.counterAtLeast));
  assert.deepEqual(row.actions[0], { kind: 'set-scenario', scenarioId: 'MAIN', chapter: raw.resultState[0], step: raw.resultState[1] });
  assert.equal(symbol(row.actions[1].sceneId), raw.dispatch);
}
for (const [n, raw] of ref.scriptDungeonRoutes.entries()) {
  const row = routes.records[n];
  assert.equal(row.sourceScriptDungeonSymbol, raw.id);
  assert.equal(row.sourceProceduralDungeonSymbol, raw.dungeonID);
  assert.equal(row.sourceRescueDungeonSymbol ?? -1, raw.rescueDungeonID);
  assert.deepEqual(['departureMapId', 'successMapId', 'failureMapId'].map(key => symbol(row[key])), [raw.mapID1, raw.mapID2, raw.mapID3]);
  assert.deepEqual(['firstEntrySceneId', 'repeatEntrySceneId', 'returnSceneId'].map(key => symbol(row[key])), [raw.scriptID1, raw.scriptID2, raw.scriptID3]);
}
for (const [n, raw] of ref.bossSceneDispatch.entries()) {
  const row = bosses.records[n];
  assert.equal(fixed.get(row.fixedRoomId).sourceSymbol, raw.fixedRoom);
  assert.deepEqual([symbol(row.firstSceneId), symbol(row.retrySceneId), symbol(row.revisitSceneId)], [raw.first, raw.retry, raw.revisit]);
  assert.equal(row.reachedFlagId === null ? 'NUM_CUTSCENE_FLAGS' : symbol(row.reachedFlagId), raw.reachedFlag);
  assert.equal(row.completeFlagId === null ? 'NUM_CUTSCENE_FLAGS' : symbol(row.completeFlagId), raw.completeFlag);
}
for (const [n, raw] of ref.recruitmentStoryFlags.entries()) assert.equal(symbol(bosses.recruitment[n].requiredFlagId), raw.requiredPersistentFlag);
assert.equal(model.mainPairAssignment.when, 'either-component-changes');
assert.equal(model.mainPairAssignment.samePairPreservesCounter, true);
assert.equal(model.rewardCounter.maximum, 100);
assert.equal(model.rewardCounter.unit, 'eligible-completed-job-reward');
assert.equal(model.rewardCounter.multipleRewardsCountSeparately, true);
assert.equal(model.rewardCounter.failedOrEmptyOutingIncrement, 0);
assert.equal(model.rosterOwnership, 'current-existing-roster-species');
assert.deepEqual(model.dispatchOrder, ['nonstory-mission-revisit', 'persistent-complete-revisit', 'persistent-reached-retry', 'first-and-set-pending-reached']);
assert.deepEqual(transitions.records.filter(row => row.hookId === 'next-day').map(row => row.id), ['next-day-base-ready', 'next-day-base-wait', 'next-day-postgame', 'next-day-wish-2', 'next-day-wish-4', 'next-day-wish-6', 'next-day-gengar-2', 'next-day-gengar-4', 'next-day-sub3', 'next-day-sub5', 'next-day-sub6']);
assert.equal(t.get('next-day-base-wait').onMatch, 'stop');
assert.equal(t.get('town-square-clear-local').order, 4);
assert.equal(t.get('town-square-buried').order, 3);
assert.deepEqual(bosses.rematches.filter(row => row.levelIncrement > 0).map(row => row.levelIncrement), [20, 20, 20, 10, 10]);
assert.equal(contracts.retryPolicies[0].minimumAttemptStep, null);
assert.equal(contracts.retryPolicies[1].minimumAttemptStep, 4);
assert.equal(contracts.bossSpecials.magmaPitSecondMap.fixedRoomId, 'magma-cavern-pit-fallen-allies-floor');
assert.equal(contracts.bossSpecials.jirachi.faintCompletionFlagId, 'campaign-flag-cutscene-flag-jirachi-complete');
for (const row of identities.callbacks) assert.equal(row.missingBehavior, 'block-operation');
for (const row of sources.sources) {
  assert.equal(row.commit, '6bcbec4f906938c0243aa2026bcbd41b577bab85');
  assert.match(row.sha256, /^[a-f0-9]{64}$/);
  assert.equal(row.url, `https://github.com/pret/pmd-red/blob/${row.commit}/${row.path}`);
}
assert.match(sources.researchInputSha256, /^[a-f0-9]{64}$/);
assert.equal(model.executionProvided, false); assert.equal(model.dialogueProvided, false); assert.equal(model.blueBinaryParityClaimed, false);
for (const [file, text] of resources) {
  assert(!text.includes('scriptControlGraph') && !text.includes('struct ScriptCommand') && !text.includes('MSG_NPC('), `commercial script content in ${file}`);
}
const runtime = await readFile(new URL('../campaign.js', campaignRuntimeRoot), 'utf8');
for (const file of resources.keys()) assert(runtime.includes(`'./campaign/${file}'`));
assert(integrity.includes(hashBytes(resources.get('manifest.json'))));
console.log(`Campaign facts checked: ${p.size} closed predicates, ${t.size} ordered transitions, 6 job gates, 21 unlock rules, 83 routes, 26 boss dispatches and 18 recruitment flags. Nested Ajv schemas, frozen-loader source checks, source references, hashes and catalog joins verified; no game execution.`);
