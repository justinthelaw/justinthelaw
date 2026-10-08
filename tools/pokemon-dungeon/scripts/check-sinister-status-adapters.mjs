// Source/text/Acorn/Git audit only. Never import/evaluate a game/native adapter.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';

const root = new URL('../../../', import.meta.url);
const rootPath = fileURLToPath(root);
const read = path => readFile(new URL(path, root), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const game = 'games/pokemon-dungeon-reimagined/';
const modulePath = game + 'src/domain/gameplay/sinister-status-adapters.js';
const factsText = await read('tools/pokemon-dungeon/content/sinister-status-adapters/sources.json');
assert.equal(sha(factsText), '11060a598cd1d12299c561f609e69cc45954083a16176b0a83f68833b0c5a300');
const facts = JSON.parse(factsText);
assert.equal(facts.baseCommit, 'd1ffc1f3d7f5014f1dc1b59f8cee7dd73cdc288c');
assert.equal(facts.nativeCommit, '6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.nativeTree, '3a0dcb371062a672e6c291e6e0bda4314499e985');
assert.equal(facts.acceptedEffects, '3fc0834a560a8481901b3e554e6db6a25f8e04bb');
assert.equal(facts.acceptedItems, 'b23f0237835148481f2763775ccd88ab42893a4c');
assert.equal(facts.qualification, 'pinned-red-comparative-qualified-browser-RNG-not-blue-binary-or-native-instruction-parity');
assert.equal(facts.scope, 'unselected-sinister-self-status-and-cure-only');
assert.equal(facts.sourceFiles.length, 13);
assert.equal(facts.dependencies.length, 10);
assert.equal(facts.integrationTypeOverlays.length, 1);
assert.equal(facts.itemInterfaces.length, 3);
for (const rows of [facts.sourceFiles, facts.dependencies, facts.itemInterfaces]) assert.equal(new Set(rows.map(row => row.path)).size, rows.length);

const source = await read(modulePath);
function inspect(text) {
  const tree = parse(text, { ecmaVersion: 'latest', sourceType: 'module' });
  const exported = tree.body.filter(node => node.type === 'ExportNamedDeclaration').map(node => node.declaration?.id?.name);
  assert.deepEqual(exported, ['sinisterSelfStatus', 'cureSinisterStatuses']);
  const imports = tree.body.filter(node => node.type === 'ImportDeclaration').map(node => node.source.value);
  assert.deepEqual(imports, ['../navigation/geometry.js', './move-targets.js', './conditions.js', './held-effects.js', './sinister-condition-lifecycle.js', './support.js']);
  const body = name => {
    const node = tree.body.map(node => node.type === 'ExportNamedDeclaration' ? node.declaration : node).find(node => node.type === 'FunctionDeclaration' && node.id.name === name);
    assert.ok(node, name); return text.slice(node.body.start, node.body.end);
  };
  const sequence = (owner, tokens) => {
    let at = -1;
    for (const token of tokens) { const next = owner.indexOf(token, at + 1); assert.ok(next > at, `Missing/out-of-order ${token}`); at = next; }
  };
  const self = body('sinisterSelfStatus'), burn = body('afflict'), cure = body('cureSinisterStatuses'), sleep = body('endSleep');
  assert.ok(self.includes("source.kind !== 'ability' || source.abilityId !== 'ability-effect-spore'"));
  assert.ok(self.includes('let remaining = turns;'));
  assert.ok(!self.includes('statusTurns(') && !self.includes('draw(') && !self.includes('remaining + 1'));
  sequence(self, ["safeguard(context, actor)", "'iq-nonsleeper'", "'Insomnia'", "'Vital Spirit'", "'item-insomniscope'", "previous === 'sleepless'", "previous === 'napping'", "previous === 'sleep'", "previous === 'nightmare'", 'let remaining = turns;', "remaining !== 127 && ability(actor, catalogs, 'Early Bird')", 'actor.conditions.sleep =', "notify(context, 'sleep-status')"]);
  assert.ok(self.includes("statusId: 'sleep', source, duration:"));
  sequence(burn, ['safeguard(context, actor)', "'Limber'", "statusId === 'paralysis'", "'item-pecha-scarf'", "'Immunity'", 'id === 8 || id === 17', "statusId === 'badly-poisoned'", "statusId === 'poisoned'", 'statusTurns(context, actor, 1, 2, catalogs) + 1', 'statusTurns(context, actor, 127, 127, catalogs) + 1', 'actor.conditions.burn =', "notify(context, status === 'paralysis'", "if (status === 'paralysis') refreshSpeed(actor, catalogs)", "'Synchronize'", 'for (const direction of DIRECTIONS)', "if (!printed)", 'if (enemyTreatment(actor, neighbor)) afflict(context, neighbor, status, source, catalogs)']);
  assert.equal((burn.match(/refreshSpeed\(/g) ?? []).length, 1);
  assert.ok(burn.includes('let printed = false;'));
  assert.ok(!burn.includes('actor.conditions.burn = null') && !burn.includes('endCondition('));
  sequence(cure, ['const negative = hasNegativeStatus(actor)', "['snatch', 'decoy']", 'requireReciprocalWrap(context, actor)', 'endSleep(context, actor, catalogs)', 'if (!validRecipient(context, actor)) return', "endCondition(context, actor, 'burn')", 'endFrozen(context, actor)', "endCondition(context, actor, 'cringe')", 'refreshSpeed(actor, catalogs)', "endCondition(context, actor, 'curse')", "endCondition(context, actor, 'leechSeed')", "endCondition(context, actor, 'sureShot')", "endCondition(context, actor, 'blinker')", "endAuxiliary(context, actor, 'muzzled')", "endAuxiliary(context, actor, 'perishSong')", "endAuxiliary(context, actor, 'exposed')", 'refreshSpeed(actor, catalogs)', 'const before = actor.speed.cachedStage', 'actor.speed.negativeTimers.fill(0)', 'refreshSpeed(actor, catalogs)', "if (speedChanged) notify(context, 'speed-restored')", 'for (const slot of actor.battleMoves.slots)', "notify(context, 'moves-unsealed')", "if (!negative && !speedChanged && !unsealed)"]);
  assert.ok(cure.includes('if (slot.sealed) { slot.sealed = false; unsealed = true; }'));
  for (const forbidden of ['positiveTimers.fill', 'resetFloorConditions', 'resetStatChanges', 'currentPp =', 'speedRaisedThisAction =', 'attackLocked =', 'movementPending =', "'reflect'", "'bide'"]) assert.ok(!cure.includes(forbidden), forbidden);
  sequence(sleep, ["notify(context, sleep.statusId + '-ended')", "sleep.statusId === 'napping'", 'Math.min(maxHp(actor), hp + 999)', 'actor.conditions.sleep = null', "if (sleep.statusId === 'napping') cureSinisterStatuses(context, actor, catalogs)"]);
  assert.ok(!sleep.includes('dealDamage') && !sleep.includes('statusTurns') && !sleep.includes('draw('));
  sequence(body('endFrozen'), ['notify(context,', 'releaseSinisterWrap(context, actor)']);
  sequence(body('endCondition'), ['notify(context,', 'actor.conditions[group] = null']);
  sequence(body('endAuxiliary'), ["if (group === 'muzzled') notify(context, 'muzzled-ended')", 'actor.auxiliaryConditions[group] = null', "if (group !== 'muzzled') notify(context,"]);
  for (const token of ['condition.payload.actorId', 'other.conditions.frozen.payload.actorId !== actor.actorId', "'sinister-wrap-reciprocity'"]) assert.ok(body('requireReciprocalWrap').includes(token));
  for (const token of ['actor.overrides.types !== null', 'actor.overrides.abilities !== null', 'actor.overrides.form !== null', "statusId === 'transformed'"]) assert.ok(body('requireConcreteDomain').includes(token));
  assert.ok(body('enemyTreatment').includes("first.binding.kind === 'guest' || second.binding.kind === 'guest'"));
  assert.ok(body('enemyTreatment').includes("['job-client', 'escort-guest']"));
  assert.ok(body('validRecipient').includes('session.actors[actor.actorId] === actor'));
  assert.ok(body('validRecipient').includes('actor.placement.mapId === session.floor.mapId'));
  function checkNodes(node) {
    assert.notEqual(node.type, 'ImportExpression');
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') assert.notEqual(node.callee.name, 'eval');
    if (node.type === 'NewExpression' && node.callee.type === 'Identifier') assert.notEqual(node.callee.name, 'Function');
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) { for (const child of value) if (child && typeof child.type === 'string') checkNodes(child); }
      else if (value && typeof value.type === 'string') checkNodes(value);
    }
  }
  checkNodes(tree);
}
inspect(source);

const negativeControls = [
  text => text.replace('let remaining = turns;', 'let remaining = statusTurns(context, actor, 3, 7, catalogs);'),
  text => text.replace("if (status === 'paralysis') refreshSpeed(actor, catalogs)", 'refreshSpeed(actor, catalogs)'),
  text => text.replace('requireReciprocalWrap(context, actor);', '/* omitted reciprocal proof */'),
  text => text.replace("endCondition(context, actor, 'burn');\n    endFrozen(context, actor);", "endFrozen(context, actor);\n    endCondition(context, actor, 'burn');"),
  text => text.replace('actor.speed.negativeTimers.fill(0);', 'actor.speed.positiveTimers.fill(0);'),
];
if (process.argv.includes('--negative-controls')) {
  for (const mutate of negativeControls) { const altered = mutate(source); assert.notEqual(altered, source); assert.throws(() => inspect(altered)); }
}

// Immutable dependency comparisons use Git/text only; no module is selected.
for (const row of facts.dependencies) {
  const bytes = await read(row.path), overlay = facts.integrationTypeOverlays.find(item => item.path === row.path);
  if (overlay) {
    assert.equal(overlay.path, 'games/pokemon-dungeon-reimagined/src/domain/turns/types.js');
    assert.equal(overlay.currentCommit, 'de34e78747f94f23f680304ec4020869b3aa34d4');
    assert.equal(overlay.insertedText, " | {type:'setAudioPreferences',audio:import('../../audio/types.js').AudioPreferences}");
    assert.equal(bytes.split(overlay.insertedText).length, 2, 'Exactly one accepted current audio typedef alternative');
    assert.equal(sha(bytes), overlay.currentSha256, row.path);
    assert.equal(sha(bytes.replace(overlay.insertedText, '')), row.sha256, 'Exact original dependency reconstructed');
    assert.equal(execFileSync('git', ['rev-parse', `${overlay.currentCommit}:${row.path}`], { cwd: rootPath, encoding: 'utf8' }).trim(), overlay.currentBlob);
    assert.equal(sha(execFileSync('git', ['show', `${overlay.currentCommit}:${row.path}`], { cwd: rootPath })), overlay.currentSha256);
    const executable = text => JSON.stringify(parse(text, {ecmaVersion:'latest',sourceType:'module'}).body, (key, value) => key === 'start' || key === 'end' ? undefined : value);
    assert.equal(executable(bytes), executable(bytes.replace(overlay.insertedText, '')), 'Exact executable AST after removing locations');
  } else assert.equal(sha(bytes), row.sha256, row.path);
  assert.equal(execFileSync('git', ['rev-parse', `${facts.baseCommit}:${row.path}`], { cwd: rootPath, encoding: 'utf8' }).trim(), row.blob, row.path);
  if (row.path.endsWith('sinister-condition-lifecycle.js')) assert.equal(sha(execFileSync('git', ['show', `${facts.acceptedEffects}:${row.path}`], { cwd: rootPath })), row.sha256);
}
for (const row of facts.itemInterfaces) {
  const bytes = execFileSync('git', ['show', `${facts.acceptedItems}:${row.path}`], { cwd: rootPath, maxBuffer: 16 * 1024 * 1024 });
  assert.equal(sha(bytes), row.sha256, row.path);
  assert.equal(execFileSync('git', ['rev-parse', `${facts.acceptedItems}:${row.path}`], { cwd: rootPath, encoding: 'utf8' }).trim(), row.blob, row.path);
}
const nativeIndex = process.argv.indexOf('--native-root');
assert.ok(nativeIndex !== -1 && process.argv[nativeIndex + 1], 'Supply --native-root for exact native text/Git proof.');
const nativeRoot = process.argv[nativeIndex + 1];
assert.equal(execFileSync('git', ['rev-parse', `${facts.nativeCommit}^{tree}`], { cwd: nativeRoot, encoding: 'utf8' }).trim(), facts.nativeTree);
const nativeText = new Map();
for (const row of facts.sourceFiles) {
  const bytes = execFileSync('git', ['show', `${facts.nativeCommit}:${row.path}`], { cwd: nativeRoot, maxBuffer: 16 * 1024 * 1024 });
  assert.equal(sha(bytes), row.sha256, row.path);
  assert.equal(execFileSync('git', ['rev-parse', `${facts.nativeCommit}:${row.path}`], { cwd: nativeRoot, encoding: 'utf8' }).trim(), row.blob, row.path);
  nativeText.set(row.path, bytes.toString('utf8'));
}
for (const [path, tokens] of [
  ['src/dungeon_move_util.c', ['TryInflictParalysisStatus(attacker, attacker, TRUE)', 'PoisonedStatusTarget(attacker, attacker, TRUE)', 'SleepStatusTarget(attacker, attacker, CalculateStatusTurns(attacker, gSleepTurnRange, TRUE), TRUE)']],
  ['src/move_orb_effects_5.c', ['EndSleepClassStatus(pokemon,target,0,0)', 'EndFrozenClassStatus(pokemon,target)', 'EndCringeClassStatus(pokemon,target)', 'EndCurseClassStatus(pokemon,target,0)', 'SendMoveEndMessage(pokemon,target)', 'speedDownCounters[index] = 0', 'MOVE_FLAG_EXISTS', 'gPtrSealedMoveReleasedMessage']],
  ['src/dungeon_random.c', ['DungeonRandInt(high - low) + low', 'numTurns /= 2', 'numTurns = 5']],
  ['src/dungeon_config.c', ['gPoisonTurnRange[2] = {0x7F, 0x7F}', 'gParalysisTurnRange[2] = {1, 2}', 'gSleepTurnRange[2] = {3, 7}', 'gNappingHpHealValue = 999']],
]) for (const token of tokens) assert.ok(nativeText.get(path).includes(token), token);

const { liveActors: N, adjacentDirections: D, affliction, sleep, cure, allRecipientCures } = facts.bounds;
assert.equal(N, 132); assert.equal(D, 8);
assert.equal(affliction.calls, 1 + D * N);
assert.equal(affliction.C, N); assert.equal(affliction.K, affliction.calls + N);
assert.equal(affliction.total, affliction.C + affliction.K);
assert.equal(affliction.paralysisDurationDraws, N); assert.equal(affliction.poisonDurationDraws, 0);
assert.deepEqual(sleep, { C: 1, K: 1, additionalDraws: 0 });
assert.deepEqual(cure, { recipientC: 14, reciprocalC: 1, K: 14, total: 29, draws: 0 });
assert.equal(allRecipientCures.C, N * (cure.recipientC + cure.reciprocalC));
assert.equal(allRecipientCures.K, N * cure.K);
assert.equal(allRecipientCures.total, allRecipientCures.C + allRecipientCures.K);
assert.ok(allRecipientCures.total < 4096);

async function gameSources(directory) {
  const rows = await readdir(new URL(directory, root), { withFileTypes: true });
  const files = await Promise.all(rows.map(row => row.isDirectory() ? gameSources(directory + '/' + row.name) : row.isFile() && row.name.endsWith('.js') ? [directory + '/' + row.name] : []));
  return files.flat();
}
for (const path of await gameSources(game.slice(0, -1) + '/src')) {
  if (path === modulePath) continue;
  assert.ok(!(await read(path)).includes('sinister-status-adapters'), `Activation outside leaf: ${path}`);
}
console.log(`Sinister status source audit PASS: 13 native +10 dependency +3 interface pins; supplied sleep; exact class/guard order; C/K leaf bounds1321/2/29; unselected; ${process.argv.includes('--negative-controls') ? '5 text-only negative controls rejected;' : ''} no game/native execution.`);
