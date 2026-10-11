// D05 text/Acorn/Git/JSON audit only. No game/native imports or evaluation.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
const root = new URL('../../../', import.meta.url), rootPath = fileURLToPath(root);
const read = path => readFile(new URL(path, root), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const gitBlob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const modulePath = 'games/pokemon-dungeon-reimagined/src/domain/gameplay/sinister-end-effects.js';
const contractPath = 'games/pokemon-dungeon-reimagined/src/contracts/sinister-end.js';
const factsText = await read('tools/pokemon-dungeon/content/sinister-end-effects/sources.json');
assert.equal(sha(factsText), 'dc63a7ff8824d097c8d63902cdd04d066e952025839d26cf1b556cdbab3c9ff5');
const facts = JSON.parse(factsText);
// Preserve the unavailable historical checkpoint's complete provenance; qualify
// only exact current-base additions before reconstructing the original SHA256
// and Git blob digests. No donor checkpoint/object cache is needed by CI.
const { recovery, ...originalFacts } = facts;
assert.equal(recovery.originalSourcesSha256, '084029f38daf60d12a90be2746effa07584647cd9dcd6af40f3bd8d56574fa21');
assert.equal(sha(JSON.stringify(originalFacts, null, 2) + '\n'), recovery.originalSourcesSha256);
assert.equal(recovery.integrationBaseCommit, 'efe20598c424cb09873dbc1def9aad9f7fe97d44');
assert.deepEqual(recovery.leafPins.map(row => row.path).sort(), [modulePath, contractPath].sort());
const adaptations = new Map(recovery.dependencyAdaptations.map(row => [row.path, row]));
assert.equal(adaptations.size, 3);
assert.deepEqual([...adaptations.keys()], [
  'games/pokemon-dungeon-reimagined/src/contracts/campaign.js',
  'games/pokemon-dungeon-reimagined/src/domain/turns/types.js',
  'games/pokemon-dungeon-reimagined/src/domain/gameplay/damage-resolution.js',
]);
assert.equal(facts.scope, 'unselected-sinister-atomic-end-owner');
assert.equal(facts.baseCommit, '2a40962388682092aca64af33cccdb5e47892956');
assert.equal(facts.nativeCommit, '6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.nativeTree, '3a0dcb371062a672e6c291e6e0bda4314499e985');
assert.equal(facts.qualification, 'pinned-red-comparative-qualified-browser-RNG-not-blue-binary-or-native-instruction-parity');
assert.equal(facts.sourceFiles.length, 22); assert.equal(facts.dependencies.length, 21); assert.equal(facts.catalogs.length, 6);
const source = await read(modulePath);
function inspect(text) {
  const ast = parse(text, { ecmaVersion: 'latest', sourceType: 'module' });
  assert.deepEqual(ast.body.filter(n => n.type === 'ExportNamedDeclaration').map(n => n.declaration?.id?.name), ['completeSinisterEnd']);
  assert.deepEqual(ast.body.filter(n => n.type === 'ImportDeclaration').map(n => n.source.value), ['../turns/support.js', './conditions.js', './held-effects.js', './sinister-status-adapters.js', './sinister-condition-lifecycle.js', './status-interruptions.js', './hp-damage.js', './damage-resolution.js', './battle-status.js', './damage-status.js', '../rules/speed.js', './speed-context.js', './sinister-combat.js', './move-targets.js', './support.js']);
  const body = name => { const n = ast.body.map(n => n.type === 'ExportNamedDeclaration' ? n.declaration : n).find(n => n.type === 'FunctionDeclaration' && n.id.name === name); assert.ok(n, name); return text.slice(n.body.start, n.body.end); };
  const sequence = (owner, tokens) => { let cursor = -1; for (const token of tokens) { const at = owner.indexOf(token, cursor + 1); assert.ok(at > cursor, `Missing/out-of-order ${token}`); cursor = at; } };
  const end = body('completeSinisterEnd');
  sequence(end, ['actorAt(session, ref)', 'owners.valid(actor)', 'requireEndDomain(', 'history.bellyEmpty = false', 'refreshSpeed(', 'decreaseBelly(', 'dummyDamage(', 'history.bellyEmpty = true', 'settle(', 'const shedRoll = draw(context.state, 100)', 'cureSinisterStatuses(', 'speedBoost(', 'periodicBurn(', 'periodicFrozen(', 'periodicCurse(', 'periodicLeech(', 'periodicPerish(', 'endBide(', 'releaseSinisterBide(', 'endRage(']);
  assert.equal((end.match(/draw\(/g) ?? []).length, 1);
  assert.equal((end.match(/settle\(/g) ?? []).length, 7);
  for (const token of ['processLearning', 'applyExperience', 'saveSinisterCheckpoint', 'slotIndex =', 'scheduler =', 'scheduler.continuation', 'randomInteger(']) assert.ok(!text.includes(token), token);
  const domain = body('requireEndDomain');
  for (const token of ['generation.parameters.weather !== 0', 'weather.natural.length', 'weather.contributions.length', '!end ||', '!h ||', 'h.usedLinkedMovesCounter > 4', 'h.turnsSinceWarpScarfActivation > 19', 'validSinisterWrap(other, session)', '!current && other.conditions.leechSeed !== null', 'other.overrides.types !== null', 'other.overrides.abilities !== null', 'other.overrides.form !== null', "'Forecast'", "'conversion2'", "'snatch', 'decoy'", "'badly-poisoned'", "'item-warp-scarf'", "'sinister-end-bide-contact-exp-owner'"]) assert.ok(domain.includes(token), token);
  assert.ok(!domain.includes('?? 0') && !domain.includes('??='));
  sequence(body('decreaseBelly'), ['item-tight-belt', 'item-stamina-band', 'iq-energy-saver', 'item-diet-ribbon', '6554 * factor + 32768', 'history.usedLinkedMovesCounter > 1', 'linked * 65536', 'history.usedLinkedMovesCounter = 0', '1000 * (decrement % 65536)', 'if (after < 1000) after = 0', 'quantity(after, 1000)']);
  sequence(body('dummyDamage'), ['interruptPetrifiedSleep(', "statusId === 'frozen'", "['napping', 'nightmare']", 'damageHp(', 'notify(context, message)', 'releaseSinisterWrap(', 'finishDamage(context, actor, catalogs, null, false)', "resolution === 'revived'", 'end.emptyBellyAlert = 0']);
  sequence(body('periodicCurse'), ['const amount', 'condition.periodicCountdown = 10', 'display(', 'dummyDamage(']);
  const leech = body('periodicLeech');
  sequence(leech, ['condition.periodicCountdown = 2', 'const source', "'Liquid Ooze'", 'display(', 'owners.valid(source)', "statusId === 'frozen'", "dummyDamage(context, actor, 10", 'if (ooze) dummyDamage(context, source, 10', 'else healTen(context, source)']);
  const transfer = leech.slice(leech.indexOf('dummyDamage(context, actor, 10'));
  assert.ok(!transfer.includes('isFloorOver') && !transfer.includes('settle(') && !transfer.includes('owners.valid('), 'No invented intervening Leech transfer guard.');
  sequence(body('speedBoost'), ['advanceSpeedBoostCounter(', 'actor.speed.speedBoostCounter = tick.counter', "'raise', [127], false", 'installSpeedChange(', 'change.before !== 4', "'speed-raised' : 'speed-unchanged'"]);
  assert.ok(!body('speedBoost').includes('draw('));
  sequence(body('settle'), ['owners.forcedLoss(context)', "result.kind !== 'continue'", '!owners.isFloorOver()', 'valid(context, actor, ref, owners)']);
  sequence(body('display'), ['owners.displayCheckpoint(context)', 'valid(context, actor, ref, owners)']);
  const visit = node => { assert.notEqual(node.type, 'ImportExpression'); if (node.type === 'CallExpression' && node.callee.type === 'Identifier') assert.notEqual(node.callee.name, 'eval'); if (node.type === 'NewExpression' && node.callee.type === 'Identifier') assert.notEqual(node.callee.name, 'Function'); for (const value of Object.values(node)) { if (Array.isArray(value)) { for (const child of value) if (child?.type) visit(child); } else if (value?.type) visit(value); } };
  visit(ast);
}
inspect(source);
parse(await read(contractPath), { ecmaVersion: 'latest', sourceType: 'module' });
for (const row of recovery.leafPins) assert.equal(sha(await read(row.path)), row.sha256, `Exact recovered end leaf ${row.path}`);
if (process.argv.includes('--negative-controls')) for (const mutate of [
  s => s.replace('!h ||', 'false ||'),
  s => s.replace('const shedRoll = draw(context.state, 100);', "const shedRoll = ability(actor, catalogs, 'Shed Skin') ? draw(context.state, 100) : 99;"),
  s => s.replace('if (ooze) dummyDamage', 'if (owners.isFloorOver()) return;\n  if (ooze) dummyDamage'),
  s => s.replace('releaseSinisterWrap(context, actor);', '/* omitted reciprocal release */'),
  s => s.replace("if (change.before !== 4) notify(context,", 'if (false) notify(context,'),
  s => s.replace('history.bellyEmpty = false;', 'history.bellyEmpty = false; session.scheduler.continuation.slotIndex = 0;'),
]) { const altered = mutate(source); assert.notEqual(altered, source); assert.throws(() => inspect(altered)); }
/** Reconstruct an old body only from reviewed literal one-occurrence deltas.
 * The complete current/base hash is mandatory before reconstruction; unknown
 * code, behavior or historical schema changes cannot enter this proof. */
function originalDependency(path, text, phase) {
  const row = adaptations.get(path);
  if (!row) return text;
  assert.equal(sha(text), phase === 'current' ? row.currentSha256 : row.integrationSha256, `Exact ${phase} dependency ${path}`);
  for (const delta of phase === 'current' ? row.currentReplacements : row.integrationReplacements) {
    assert.equal(typeof delta.currentSource, 'string'); assert.ok(delta.currentSource.length);
    assert.equal(typeof delta.originalSource, 'string');
    assert.equal(text.split(delta.currentSource).length, 2, `One exact ${phase} addition ${path}`);
    text = text.replace(delta.currentSource, delta.originalSource);
  }
  return text;
}
let recoveryNegatives = 0;
if (process.argv.includes('--negative-controls')) for (const row of adaptations.values()) {
  const current = await read(row.path);
  for (const delta of row.currentReplacements) for (const altered of [
    current.replace(delta.currentSource, delta.currentSource + '/* unqualified addition */'),
    current.replace(delta.currentSource, ''),
    current + delta.currentSource,
  ]) { assert.notEqual(altered, current); assert.throws(() => originalDependency(row.path, altered, 'current')); recoveryNegatives++; }
}
for (const row of [...facts.dependencies, ...facts.catalogs]) {
  const original = Buffer.from(originalDependency(row.path, await read(row.path), 'current'), 'utf8');
  assert.equal(sha(original), row.sha256, `Original dependency SHA256 ${row.path}`);
  assert.equal(gitBlob(original), row.blob, `Original dependency Git blob ${row.path}`);
  const integration = execFileSync('git', ['show', `${recovery.integrationBaseCommit}:${row.path}`], { cwd: rootPath, maxBuffer: 16 * 1024 * 1024 });
  assert.equal(execFileSync('git', ['rev-parse', `${recovery.integrationBaseCommit}:${row.path}`], { cwd: rootPath, encoding: 'utf8' }).trim(), adaptations.get(row.path)?.integrationBlob ?? row.blob);
  const reconstructed = Buffer.from(originalDependency(row.path, integration.toString('utf8'), 'integration'), 'utf8');
  assert.equal(sha(reconstructed), row.sha256, `Current base preserves original SHA256 ${row.path}`);
  assert.equal(gitBlob(reconstructed), row.blob, `Current base preserves original Git blob ${row.path}`);
}
const nativeIndex = process.argv.indexOf('--native-root');
assert.ok(nativeIndex >= 0 && process.argv[nativeIndex + 1], 'Supply --native-root for immutable native Git/text proof.');
const nativeRoot = process.argv[nativeIndex + 1], native = new Map();
assert.equal(execFileSync('git', ['rev-parse', `${facts.nativeCommit}^{tree}`], { cwd: nativeRoot, encoding: 'utf8' }).trim(), facts.nativeTree);
for (const row of facts.sourceFiles) {
  const bytes = execFileSync('git', ['show', `${facts.nativeCommit}:${row.path}`], { cwd: nativeRoot, maxBuffer: 16 * 1024 * 1024 });
  assert.equal(sha(bytes), row.sha256, row.path);
  assert.equal(execFileSync('git', ['rev-parse', `${facts.nativeCommit}:${row.path}`], { cwd: nativeRoot, encoding: 'utf8' }).trim(), row.blob);
  native.set(row.path, bytes.toString('utf8'));
}
for (const [path, tokens] of [
  ['src/dungeon_turn_effects.c', ['entityInfo->bellyEmpty = FALSE', 'entityInfo->usedLinkedMovesCounter = 0', 'entityInfo->bellyEmpty = TRUE', 'rand = DungeonRandInt(100)', 'sub_8079F20(entity, entity, 1, 0)', 'STATUS_INGRAIN', 'STATUS_CURSED', 'STATUS_LEECH_SEED', 'STATUS_BIDE', 'STATUS_ENRAGED']],
  ['src/dungeon_serializer.c', ['WriteBytes(seri, &gDungeon->unk644, sizeof(unkDungeon644))', 'ReadBytes(seri, &gDungeon->unk644, sizeof(unkDungeon644))', 'info->bellyEmpty', 'info->usedLinkedMovesCounter', 'info->turnsSinceWarpScarfActivation']],
  ['src/dungeon_mon_spawn.c', ['InitEntityFromSpawnInfo(TRUE, entity,', 'static void InitEntityFromSpawnInfo', 'entInfo->bellyEmpty = FALSE', 'entInfo->usedLinkedMovesCounter = 0', 'entInfo->turnsSinceWarpScarfActivation = 0']],
  ['src/dungeon_config.c', ['gShedSkinActivateChance = 50', 'gSpeedBoostActivationFrame = 250', 'gLinkedMovesBellyGoDownValues[5]', 'gIngrainHealValue = 10', 'gLeechSeedHealValue = 10']],
  ['src/number_util.c', ['s.unk0 = param_1->lo >> 0x10', 's.unk2 = (1000 * (param_1->lo & 0xffff)) >> 0x10']],
  ['src/move_orb_effects_1.c', ['void BoostSpeed', 'if (displayMessage)', 'if (speedBefore == speedAfter)', 'entityInfo->speedStageChanged = TRUE', 'entityInfo->attacking = FALSE']],
]) for (const token of tokens) assert.ok(native.get(path).includes(token), token);
const weatherRows = native.get('data/dungeon/SinisterWoods/main_data.inc').split('\n').filter(line => line.startsWith('.byte')).map(line => [...line.matchAll(/0x([0-9a-f]+)/g)].map(m => parseInt(m[1], 16)));
assert.equal(weatherRows.length, 13); assert.ok(weatherRows.every(row => row.length === 28 && row[4] === 0));
const floors = [], generations = new Map();
for (const row of facts.catalogs) { const data = JSON.parse(await read(row.path)); if (row.path.includes('/generation-')) for (const record of data.records) generations.set(record.id, record); else floors.push(...data.records.filter(record => record.dungeonId === 'sinister-woods')); }
floors.sort((a, b) => a.localFloor - b.localFloor);
assert.deepEqual(floors.map(floor => ({ floorId: floor.id, sourceFloorKey: floor.sourceFloorKey, generationId: floor.generationId, weather: generations.get(floor.generationId).parameters.weather })), facts.clearFloorProof);
assert.equal(facts.clearFloorProof.length, 13); assert.ok(facts.clearFloorProof.every(row => row.weather === 0));
const b = facts.bounds; assert.equal(b.liveActors, 132); assert.equal(b.dummyDamageCalls, 7); assert.equal(b.sharedLeechClears, 132);
assert.equal(b.intrinsic.C, 1 + 15 + 1 + 7 * 5 + 2 + 1 + 1 + 3 + 1 + 132);
assert.equal(b.intrinsic.K, 1 + 14 + 1 + 7 * 6 + 2 + 2 + 3 + 1);
assert.equal(b.intrinsic.I, 7); assert.equal(b.intrinsic.A, 1);
assert.equal(b.intrinsic.total, b.intrinsic.C + b.intrinsic.K + b.intrinsic.I + b.intrinsic.A);
assert.equal(b.displayCalls, 9); assert.equal(b.forcedLossCalls, 7);
// Prospective leaf and typedef remain unselected by every other game module.
async function references(directory) { for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) { const path = directory + entry.name; if (entry.isDirectory()) await references(path + '/'); else if (entry.name.endsWith('.js') && path !== modulePath && path !== 'games/pokemon-dungeon-reimagined/src/contracts/sinister-end.js') assert.ok(!(await read(path)).includes('sinister-end-effects.js') && !(await read(path)).includes('contracts/sinister-end.js'), `Live reference ${path}`); } }
await references('games/pokemon-dungeon-reimagined/src/');
await references('games/pokemon-dungeon-reimagined/content/');
console.log(`Sinister end static source proof PASS:22 native/21 original dependency blobs/6 catalogs/13 clear floors; exact recovered leaves, original provenance and current efe2059 additions;266+9D+7F events; no game/native execution.${process.argv.includes('--negative-controls') ? ` Six behavior and ${recoveryNegatives} recovery text negative controls rejected.` : ''}`);
