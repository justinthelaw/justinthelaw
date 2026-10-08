// Documentation/literal corpus verification only. Never import or evaluate game modules.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'acorn';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const game = path.join(root, 'games/pokemon-dungeon-reimagined');
const research = path.join(game, 'plan/research');
const readJson = async filename => JSON.parse(await readFile(filename, 'utf8'));
const ledger = await readJson(path.join(research, 'blue-rules-v3.json'));
function requireFact(predicate, message) {
  if (!predicate) throw new Error(message);
}
function same(actual, expected, message) {
  requireFact(JSON.stringify(actual) === JSON.stringify(expected), message);
}
const bases = [];
for (const base of ledger.baseFiles) {
  requireFact(/^blue-rules-v[12]\.json$/.test(base.file), 'Unsupported historical base.');
  const bytes = await readFile(path.join(research, base.file));
  requireFact(createHash('sha256').update(bytes).digest('hex') === base.sha256, `Historical hash changed: ${base.file}`);
  const parsed = JSON.parse(bytes);
  requireFact(parsed.rulesRevision === base.revision, `Historical identity changed: ${base.file}`);
  bases.push(parsed);
}
same(bases.map(base => base.rulesRevision), ['blue-rules-v1', 'blue-rules-v2'], 'Expected ordered v1/v2 bases.');
const prior = new Map([...bases[0].rules, ...bases[1].addedRules].map(rule => [rule.id, structuredClone(rule)]));
for (const update of bases[1].ruleUpdates) Object.assign(prior.get(update.targetId), update.set);
const allowed = ledger.compositionContract.allowedRuleReplacementIds;
const ids = ledger.ruleUpdates.map(update => update.targetId);
requireFact(new Set(ids).size === ids.length, 'Duplicate replacement target.');
same(ids, allowed, 'Every replacement must be explicitly allowlisted.');
const sources = new Set(ledger.addedSources.map(source => source.id));
requireFact(sources.size === ledger.addedSources.length, 'Duplicate source ID.');
for (const update of ledger.ruleUpdates) {
  const old = prior.get(update.targetId);
  requireFact(old !== undefined, `Missing inherited record: ${update.targetId}`);
  same(update.historicalPreviousEffective.status, old.status, `Historical status mismatch: ${update.targetId}`);
  same(update.historicalPreviousEffective.value, old.value, `Historical value mismatch: ${update.targetId}`);
  requireFact(['blocked', 'verified'].includes(update.set.status), `Invalid rule status: ${update.targetId}`);
  requireFact((update.set.status === 'blocked') === (update.set.value === null), `Blocked/null mismatch: ${update.targetId}`);
  requireFact(update.set.evidenceClasses.every(value => ledger.evidenceClasses.includes(value)), 'Unknown evidence class.');
  for (const evidence of update.evidence) requireFact(sources.has(evidence.sourceId) && evidence.locator.length > 0, 'Unresolved evidence locator.');
}
for (const id of ['P01-MECH-ABILITY-02', 'P01B-RED-BLUE-EQUIVALENCE']) {
  requireFact(ledger.ruleUpdates.find(update => update.targetId === id)?.set.status === 'blocked', `${id} must retain its full-scope blocker.`);
}
requireFact(ledger.runtimeReady === false && ledger.packageComplete === false, 'Core cannot claim campaign/package readiness.');
requireFact(ledger.runtimeCapabilities.completeCampaignRules.runtimeReady === false, 'Campaign remains incomplete.');
requireFact(ledger.compositionContract.runtimeImportAllowed === false, 'Research profiles cannot be runtime imports.');
const contract = await readFile(path.resolve(research, ledger.contractFile), 'utf8');
for (const update of ledger.ruleUpdates) {
  for (const section of update.set.contractSections) requireFact(contract.includes(`## ${section}.`), `Missing contract section ${section}.`);
}
requireFact(ledger.supportingMoveCorrections.length === 6, 'Six supporting numerical corrections required.');
const phases = ledger.numericalTables.phaseOpportunities;
requireFact(phases.length === 5, 'Five speed stages required.');
for (const row of phases) requireFact(new Set(row).size === row.length && row.every(n => Number.isInteger(n) && n >= 0 && n < 24), 'Invalid phase corpus.');

// Extract literal arrays/objects from syntax trees. Calls are recognized only as the
// Object.freeze wrapper and never invoked. Function bodies are not interpreted.
function literal(node) {
  if (node?.type === 'Literal') return node.value;
  if (node?.type === 'ArrayExpression') return node.elements.map(literal);
  if (node?.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(property => {
    requireFact(property.type === 'Property' && !property.computed && property.kind === 'init', 'Expected plain literal property.');
    return [property.key.name ?? property.key.value, literal(property.value)];
  }));
  if (node?.type === 'CallExpression' && node.callee.type === 'MemberExpression'
    && node.callee.object.name === 'Object' && node.callee.property.name === 'freeze'
    && node.arguments.length === 1) return literal(node.arguments[0]);
  throw new Error('Only literal corpus nodes may be read.');
}
async function declarations(filename) {
  const ast = parse(await readFile(path.join(game, 'src/domain/rules', filename), 'utf8'), { ecmaVersion: 'latest', sourceType: 'module' });
  return new Map(ast.body.flatMap(statement => {
    const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    return declaration?.type === 'VariableDeclaration' ? declaration.declarations.map(item => [item.id.name, item.init]) : [];
  }));
}
const damage = await declarations('damage.js');
same(literal(damage.get('ATTACK_STAGE_Q8')), ledger.numericalTables.attackStageQ8, 'Attack literal table differs from source ledger.');
same(literal(damage.get('DEFENSE_STAGE_Q8')), ledger.numericalTables.defenseStageQ8, 'Defense literal table differs from source ledger.');
const type = await declarations('type-context.js');
same(literal(type.get('TYPE_FACTORS_Q16')), ledger.numericalTables.typeFactorsQ16, 'Type factor literals differ from ledger.');
const order = ledger.numericalTables.symbolicOrder;
const composition = literal(type.get('COMPOSITION'));
same(order.map(first => order.map(second => composition[first][second])), ledger.numericalTables.symbolicComposition, 'Symbolic type table differs from ledger.');
const types = literal(type.get('ELEMENT_TYPES'));
const rows = literal(type.get('ROWS'));
same(Object.keys(rows), types, 'Sparse type rows must cover exactly the original types.');
requireFact(types.length === 18 && !types.includes('Fairy'), 'Expected original 18-entry type corpus including None.');
for (const [name, row] of Object.entries(rows)) {
  requireFact(row.length === 3, `Expected super/resist/little lists: ${name}`);
  const defenders = row.flat();
  requireFact(new Set(defenders).size === defenders.length && defenders.every(value => types.includes(value) && value !== 'None'), `Invalid sparse type row: ${name}`);
}

// Compare every sparse source literal against an independently extracted factual
// chart. This reads syntax/data only, including neutral cells absent from ROWS;
// it never calls lookupTypeMatchup or interprets a game function body.
const matchupFacts = await readJson(path.join(root, 'tools/pokemon-dungeon/content/rule-runtime/type-matchups.json'));
same(Object.keys(matchupFacts).sort(), ['boundary', 'cells', 'classes', 'evidenceClass', 'schemaVersion', 'scope', 'source', 'types'], 'Unexpected matchup fact shape.');
requireFact(matchupFacts.schemaVersion === 1 && matchupFacts.scope === 'original-rescue-team-type-table-facts'
  && matchupFacts.evidenceClass === 'original-red-engine-comparative', 'Unsupported matchup fact contract.');
requireFact(matchupFacts.source.repository === 'pret/pmd-red'
  && matchupFacts.source.commit === '6bcbec4f906938c0243aa2026bcbd41b577bab85'
  && matchupFacts.source.path === 'src/dungeon_config.c'
  && matchupFacts.source.symbol === 'gTypeEffectivenessChart', 'Unexpected matchup evidence source.');
same(Object.keys(matchupFacts.source).sort(), ['commit', 'path', 'repository', 'sha256', 'symbol', 'url'], 'Unexpected matchup source shape.');
requireFact(matchupFacts.source.sha256 === 'f4ef6e42a0df5182c4b8eba90ea53481550d90e44cc089bdeddc0e60c8cf44d5'
  && matchupFacts.source.url === `https://github.com/pret/pmd-red/blob/${matchupFacts.source.commit}/src/dungeon_config.c#L382`
  && typeof matchupFacts.boundary === 'string' && matchupFacts.boundary.length > 0, 'Matchup source fingerprint or boundary changed.');
same(matchupFacts.types, types, 'Matchup fact type order differs.');
same(matchupFacts.classes, order, 'Matchup fact classes differ.');
requireFact(matchupFacts.cells.length === 18, 'Matchup facts require eighteen attacker rows.');
for (const [attackerIndex, attacker] of types.entries()) {
  const expected = matchupFacts.cells[attackerIndex];
  requireFact(Array.isArray(expected) && expected.length === 18
    && expected.every(value => order.includes(value)), `Invalid matchup fact row: ${attacker}`);
  const [superTypes, resistTypes, littleTypes] = rows[attacker];
  const actual = types.map(defender => superTypes.includes(defender) ? 'super'
    : resistTypes.includes(defender) ? 'resist' : littleTypes.includes(defender) ? 'little' : 'neutral');
  same(actual, expected, `Type matchup literals differ from independent facts: ${attacker}`);
}
console.log(`Rules corpus checked (${ids.length} scoped updates, 6 move corrections, 324 exact matchup cells, exact literal tables, historical hashes; no game execution).`);
