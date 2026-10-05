#!/usr/bin/env node
// Inspect authoring JSON and evidence documents only. Never import game modules.
import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const toolRoot = fileURLToPath(new URL('../', import.meta.url));
const repositoryRoot = path.resolve(toolRoot, '../..');
const maximumBytes = 1_048_576;
const catalogs = {
  'species.json': ['species'],
  'forms.json': ['form', 'storyActor'],
  'locations.json': ['dungeon', 'dungeonSegment', 'dojoMaze', 'fixedFloor', 'restStop', 'terminalMap', 'supportLocation', 'specialMode'],
  'systems.json': ['move', 'system-action', 'ability', 'item-class', 'status', 'condition-flag', 'trap', 'weather', 'iq-skill', 'friend-area'],
};
const documents = new Map();

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function within(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
}

async function boundedText(filename) {
  requireCondition(within(repositoryRoot, filename), `path escapes repository: ${filename}`);
  let component = repositoryRoot;
  for (const part of path.relative(repositoryRoot, filename).split(path.sep)) {
    component = path.join(component, part);
    requireCondition(!(await lstat(component)).isSymbolicLink(), `symlink input is unsupported: ${component}`);
  }
  requireCondition(within(await realpath(repositoryRoot), await realpath(filename)), `resolved path escapes repository: ${filename}`);
  const file = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await file.stat();
    requireCondition(info.isFile() && info.size > 0 && info.size <= maximumBytes, `input must be a regular file of 1..${maximumBytes} bytes: ${filename}`);
    // Bound allocation and reading even if another process changes the file.
    const bytes = Buffer.alloc(maximumBytes + 1);
    let length = 0;
    while (length < bytes.length) {
      const result = await file.read(bytes, length, bytes.length - length, length);
      if (result.bytesRead === 0) break;
      length += result.bytesRead;
    }
    requireCondition(length === info.size && length <= maximumBytes, `input changed or exceeded byte limit: ${filename}`);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length));
  } finally {
    await file.close();
  }
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`, { cause: error });
  }
}

async function document(relative) {
  if (!documents.has(relative)) {
    const text = await boundedText(path.resolve(repositoryRoot, relative));
    documents.set(relative, { text, data: relative.endsWith('.json') ? parseJson(text, relative) : null });
  }
  return documents.get(relative);
}

function pointerValue(data, locator) {
  let current = data;
  for (const encoded of locator.slice(1).split('/')) {
    requireCondition(!/~(?:[^01]|$)/.test(encoded), `invalid JSON pointer escape: ${locator}`);
    const key = encoded.replaceAll('~1', '/').replaceAll('~0', '~');
    requireCondition(current !== null && typeof current === 'object' && Object.hasOwn(current, key), `missing JSON pointer: ${locator}`);
    current = current[key];
  }
  return current;
}

async function inspectSource(source, label) {
  const evidence = await document(source.document);
  if (source.locator.startsWith('/')) {
    requireCondition(evidence.data !== null, `${label}: JSON pointer requires a JSON document`);
    return pointerValue(evidence.data, source.locator);
  }
  requireCondition(source.document.endsWith('.md'), `${label}: section/record locator requires Markdown`);
  if (source.locator.startsWith('section:')) {
    const heading = source.locator.slice('section:'.length);
    const headings = evidence.text.split(/\r?\n/).map(line => line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/)?.[1]);
    requireCondition(headings.includes(heading), `${label}: missing Markdown section ${heading}`);
  } else {
    const id = source.locator.slice('record:'.length);
    const found = evidence.text.split(/\r?\n/).some(line => {
      const cells = line.split('|');
      return cells.length > 2 && cells[0].trim() === '' && cells[1].trim().replace(/^`|`$/g, '') === id && cells[2].trim() !== '';
    });
    requireCondition(found, `${label}: missing Markdown table record ${id}`);
  }
  return null;
}

function unique(values, label) {
  requireCondition(new Set(values).size === values.length, `duplicate ${label}`);
}

function expectedMembers(actual, expected, label) {
  unique(actual, label);
  requireCondition(actual.length === expected.length && expected.every(value => actual.includes(value)), `${label}: expected ${expected.length} exact identities`);
}

function inspectRecord(record, inventory, records, sourceValues) {
  const label = record.id;
  for (const id of record.provenanceIds) requireCondition(Object.hasOwn(inventory.provenanceSources, id), `${label}: missing provenance ${id}`);
  for (const id of record.blockerIds) requireCondition(Object.hasOwn(inventory.blockerDefinitions, id), `${label}: missing blocker definition ${id}`);
  const blockedFields = new Set(record.blockerIds.flatMap(id => inventory.blockerDefinitions[id].fields));
  for (const [field, value] of Object.entries(record)) {
    if (value !== null) continue;
    // These identity nulls mean no separate form / NPC is not a collectible species.
    if (field === 'formId' || (record.recordKind === 'storyActor' && field === 'speciesId' && record.id === 'square-munchlax')) continue;
    requireCondition(blockedFields.has(field), `${label}: null ${field} needs a field-specific blocker`);
  }
  if (record.recordKind === 'species') {
    requireCondition(label === `pokemon-${String(record.dexNo).padStart(3, '0')}`, `${label}: ID disagrees with National Dex number`);
    requireCondition(record.generation === (record.dexNo <= 151 ? 1 : record.dexNo <= 251 ? 2 : 3), `${label}: generation disagrees with National Dex range`);
    requireCondition(record.formIds.length ? !Object.hasOwn(record, 'formId') : record.formId === null, `${label}: explicit forms must not use a default formId`);
    for (const id of record.formIds) requireCondition(records.get(id)?.recordKind === 'form' && records.get(id).speciesId === label, `${label}: unresolved or mismatched form ${id}`);
  }
  if (record.speciesId !== undefined && record.speciesId !== null) {
    requireCondition(records.get(record.speciesId)?.recordKind === 'species', `${label}: missing species ${record.speciesId}`);
    if (record.recordKind === 'form') requireCondition(records.get(record.speciesId).formIds.includes(label), `${label}: missing species form backlink`);
  }
  if (record.identityEvidence) {
    requireCondition((record.identityEvidence === 'original-edition') === (record.dataClass === 'original-confirmed'), `${label}: identityEvidence/dataClass disagree`);
    requireCondition(record.dataClass !== 'reference-main-series' || record.sourceStatus === 'blocked', `${label}: reference candidates must remain source-blocked`);
  }
  if (record.parentId) {
    const parentKinds = {
      dungeonSegment: ['dungeon'], dojoMaze: ['supportLocation'], fixedFloor: ['dungeon', 'dungeonSegment', 'dojoMaze'], restStop: ['dungeon'], terminalMap: ['dungeon'],
    };
    const parent = records.get(record.parentId);
    requireCondition(parentKinds[record.recordKind]?.includes(parent?.recordKind), `${label}: invalid parent ${record.parentId}`);
    const visited = new Set([label]);
    let ancestor = parent;
    while (ancestor) {
      requireCondition(!visited.has(ancestor.id), `${label}: parent cycle`);
      visited.add(ancestor.id);
      ancestor = records.get(ancestor.parentId);
    }
    if (record.recordKind === 'fixedFloor') {
      const floorCount = parent.localFloorCount ?? parent.reportedFloorCount;
      requireCondition(Number.isInteger(floorCount) && record.localFloorNumber <= floorCount, `${label}: floor exceeds parent count`);
      requireCondition(record.globalFloorOrdinal === record.localFloorNumber + (parent.globalStartOrdinal ?? 1) - 1, `${label}: inconsistent local/global floor ordinals`);
    }
  }
  const relationKinds = {
    hasSegment: [['dungeon'], 'dungeonSegment'], hasRestStop: [['dungeon'], 'restStop'],
    afterSegment: [['restStop'], 'dungeonSegment'], beforeSegment: [['restStop'], 'dungeonSegment'],
    routeEntry: [['supportLocation'], 'dungeon'], detourEntry: [['supportLocation'], 'dungeon'],
    returnsToOriginatingJunction: [['dungeon'], 'supportLocation'], hasTerminalMap: [['dungeon'], 'terminalMap'],
    hasNumberedMap: [['dungeon', 'dungeonSegment', 'dojoMaze'], 'fixedFloor'], containsMaze: [['supportLocation'], 'dojoMaze'],
  };
  for (const relation of record.relationships ?? []) {
    const target = records.get(relation.targetId);
    const [originKinds, targetKind] = relationKinds[relation.type];
    requireCondition(originKinds.includes(record.recordKind) && target?.recordKind === targetKind, `${label}: invalid ${relation.type} target ${relation.targetId}`);
    if (relation.type.startsWith('has') || relation.type === 'containsMaze') requireCondition(target.parentId === label, `${label}: child relationship disagrees with parentId`);
    if (['afterSegment', 'beforeSegment'].includes(relation.type)) requireCondition(target.parentId === record.parentId, `${label}: rest-stop segments must share their dungeon`);
  }
  for (const id of record.sourceRuleIds ?? []) {
    const rules = record.provenanceIds.flatMap(sourceId => {
      const value = sourceValues.get(sourceId);
      return Array.isArray(value) ? value : [];
    });
    requireCondition(rules.some(rule => rule.id === id || rule.ruleId === id), `${label}: unresolved source rule ${id}`);
  }
}

function inspectCoverage(records) {
  const all = [...records.values()];
  const byKind = kind => all.filter(record => record.recordKind === kind);
  // Read the checked-in factual ledgers, rather than accepting any same-sized
  // replacement set. These are documentation inputs, never executable data.
  const data = documents.get('games/pokemon-dungeon-reimagined/plan/DATA.md')?.text;
  requireCondition(data, 'DATA.md source ledger is required');
  const rosterLedger = data.split('## Appendix A. Exact 386-species identity ledger')[1]?.split('\n## ')[0];
  requireCondition(rosterLedger, 'missing exact species identity ledger');
  const rosterNames = new Map();
  for (const line of rosterLedger.split(/\r?\n/)) {
    const cells = line.split('|').map(cell => cell.trim());
    for (let index = 1; index + 1 < cells.length; index += 2) {
      if (/^[0-9]{3}$/.test(cells[index])) rosterNames.set(Number(cells[index]), cells[index + 1]);
    }
  }
  requireCondition(rosterNames.size === 386, 'source ledger must enumerate 386 distinct species');
  expectedMembers(byKind('species').map(record => record.dexNo), Array.from({ length: 386 }, (_, i) => i + 1), 'National Dex roster');
  for (const record of byKind('species')) requireCondition(record.name === rosterNames.get(record.dexNo), `${record.id}: species name differs from DATA.md Appendix A`);
  const expectedForms = {
    'pokemon-201': [...'abcdefghijklmnopqrstuvwxyz'].map(letter => `unown-${letter}`).concat(['unown-exclamation', 'unown-question']),
    'pokemon-351': ['castform-normal', 'castform-sunny', 'castform-rainy', 'castform-snowy'],
    'pokemon-386': ['deoxys-normal', 'deoxys-attack', 'deoxys-defense', 'deoxys-speed'],
  };
  expectedMembers(byKind('form').map(record => record.id), Object.values(expectedForms).flat(), 'original form roster');
  for (const [speciesId, forms] of Object.entries(expectedForms)) {
    expectedMembers(records.get(speciesId).formIds, forms, `${speciesId} forms`);
    for (const id of forms) requireCondition(records.get(id).classification === (speciesId === 'pokemon-201' ? 'persistent' : 'temporary'), `${id}: incorrect persistent/temporary classification`);
  }
  expectedMembers(byKind('storyActor').map(record => record.id), ['square-munchlax', 'square-kecleon-purple'], 'NPC exceptions');
  requireCondition(records.get('square-munchlax').speciesId === null && records.get('square-kecleon-purple').speciesId === 'pokemon-352', 'NPC exceptions must not add collectible species/forms');
  const locationLedger = data.split('## 4. Dungeon and special-mode inventory')[1]?.split('\n## ')[0];
  requireCondition(locationLedger, 'missing dungeon/Dojo source ledger');
  const fieldNames = locationLedger.split(/\r?\n/).filter(line => /^\| (?:Main story,|Fugitive paths \||Postgame and optional,|Wonder Mail \|)/.test(line)).flatMap(line => line.split('|')[2].split(';').map(name => name.trim()));
  requireCondition(fieldNames.length === 45, 'source ledger must enumerate 45 field dungeon names');
  const slug = name => name.toLowerCase().replaceAll('.', '').replaceAll(' ', '-');
  expectedMembers(byKind('dungeon').map(record => record.id), fieldNames.map(slug), 'field dungeon identity roster');
  for (const record of byKind('dungeon')) {
    // The ledger capitalizes "Far-Off"; the source title uses "Far-off".
    requireCondition(fieldNames.some(name => name.toLowerCase() === record.name.toLowerCase() && slug(name) === record.id), `${record.id}: dungeon name differs from its source identity`);
  }
  const dojoLists = locationLedger.match(/has 17 type mazes: (.+?)\. Four team mazes add (.+?), for 21 standard mazes\./);
  requireCondition(dojoLists, 'missing original Dojo identity list');
  const listNames = text => text.replace(/ and /g, ', ').split(', ').filter(Boolean);
  const dojoNames = [...listNames(dojoLists[1]), ...listNames(dojoLists[2])].map(name => `${name} Maze`).concat('Rescue Team Maze');
  expectedMembers(byKind('dojoMaze').map(record => record.id), dojoNames.map(name => `dojo-${slug(name)}`), 'original Dojo identity roster');
  for (const record of byKind('dojoMaze')) requireCondition(dojoNames.includes(record.name) && record.id === `dojo-${slug(record.name)}`, `${record.id}: Dojo name differs from source identity`);
  requireCondition(byKind('dojoMaze').filter(record => record.inventoryGroup === 'standard-dojo').length === 21 && byKind('dojoMaze').filter(record => record.inventoryGroup === 'blue-linked-maze').length === 1, 'expected 21 standard Dojo mazes plus the Blue linked maze');
  requireCondition(records.get('dojo-rescue-team-maze').inventoryGroup === 'blue-linked-maze' && records.get('dojo-rescue-team-maze').mazeKind === 'linkedTeam', 'Rescue Team Maze must retain its Blue linked-team classification');
  requireCondition(byKind('specialMode').length === 1 && records.get('unknown-dungeon')?.recordKind === 'specialMode', 'Unknown Dungeon must be a separate off-screen mode');
  const moves = byKind('move');
  expectedMembers(moves.filter(record => record.coreMoveId !== undefined).map(record => record.coreMoveId), Array.from({ length: 354 }, (_, i) => i + 1), 'Generation I–III core move identity candidates');
  expectedMembers(moves.filter(record => record.coreMoveId === undefined).map(record => record.id), ['move-wide-slash', 'move-vacuum-cut'], 'PMD-only move identities');
  const abilities = byKind('ability');
  expectedMembers(abilities.filter(record => record.coreAbilityId !== undefined).map(record => record.coreAbilityId), Array.from({ length: 76 }, (_, i) => i + 1), 'Generation I–III ability identity candidates');
  expectedMembers(abilities.filter(record => record.coreAbilityId === undefined).map(record => record.id), ['ability-cacophony'], 'unresolved unused ability identity');
  requireCondition(records.get('ability-cacophony').sourceStatus === 'blocked' && records.get('ability-cacophony').dataClass === 'reference-main-series', 'Cacophony must remain a blocked reference identity');
  requireCondition(records.get('trap-trip-trap')?.sourceStatus === 'blocked' && records.get('trap-trip-trap').blockerIds.includes('P02-SYS-TRIP-AVAILABILITY'), 'Trip Trap availability must remain explicitly blocked');
  for (const kind of catalogs['systems.json']) requireCondition(byKind(kind).length > 0, `missing system identity family ${kind}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/check-content.mjs [--inventory-dir DIRECTORY]\nReads species/forms/locations/systems.json. Alternate inventories must be under tools/pokemon-dungeon/fixtures/ or .work/. Evidence paths resolve from the repository root. Reads data only; never executes game source.');
    return;
  }
  requireCondition(args.length === 0 || (args.length === 2 && args[0] === '--inventory-dir'), 'expected --inventory-dir DIRECTORY or --help');
  const directory = args.length ? path.resolve(args[1]) : path.join(toolRoot, 'content');
  requireCondition(directory === path.join(toolRoot, 'content') || ['fixtures', '.work'].some(name => within(path.join(toolRoot, name), directory)), 'inventory directory must be tool content, fixtures, or .work');
  const schema = parseJson(await boundedText(path.join(toolRoot, 'schemas/content-inventory.schema.json')), 'content schema');
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const inventories = new Map();
  const records = new Map();
  for (const [filename, kinds] of Object.entries(catalogs)) {
    const inventory = parseJson(await boundedText(path.join(directory, filename)), filename);
    if (!validate(inventory)) {
      const useful = validate.errors.filter(error => error.keyword !== 'if');
      throw new Error(`${filename}: ${ajv.errorsText(useful.slice(0, 8), { separator: '\n' })}`);
    }
    inventories.set(filename, inventory);
    for (const record of inventory.records) {
      requireCondition(kinds.includes(record.recordKind), `${filename}: wrong record kind ${record.recordKind}`);
      requireCondition(!records.has(record.id), `duplicate cross-catalog record ID ${record.id}`);
      records.set(record.id, record);
    }
  }
  unique([...inventories.values()].map(inventory => inventory.catalogId), 'catalog IDs');
  for (const [filename, inventory] of inventories) {
    const sourceValues = new Map();
    for (const [id, source] of Object.entries(inventory.provenanceSources)) sourceValues.set(id, await inspectSource(source, `${filename}/${id}`));
    for (const record of inventory.records) inspectRecord(record, inventory, records, sourceValues);
    const referencedBlockers = new Set(inventory.records.flatMap(record => record.blockerIds));
    for (const id of Object.keys(inventory.blockerDefinitions)) requireCondition(referencedBlockers.has(id), `${filename}: unused blocker definition ${id}`);
  }
  inspectCoverage(records);
  console.log(`Static content audit: ${inventories.size} authoring catalogs; ${records.size} unique identities; ${documents.size} local evidence documents; 0 errors.`);
  for (const [filename, inventory] of inventories) {
    const supported = inventory.records.filter(record => record.sourceStatus === 'supported').length;
    const kinds = Object.entries(inventory.records.reduce((counts, record) => ({ ...counts, [record.recordKind]: (counts[record.recordKind] ?? 0) + 1 }), {})).map(([kind, count]) => `${kind}=${count}`).join(', ');
    console.log(`${filename}: ${kinds}; source-supported=${supported}, source-blocked=${inventory.records.length - supported}; implementation-unstarted=${inventory.records.length}, acceptance-pending=${inventory.records.length}.`);
  }
  console.log('Identity/source traceability only: no runtime readiness, original-mechanics completeness, asset acceptance or gameplay verification. Source presence is checked, not independent factual authentication.');
}

main().catch(error => {
  console.error(`Static content audit failed: ${error.message}`);
  process.exitCode = 1;
});
