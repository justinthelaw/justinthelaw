// Source text/Acorn/Git/JSON only. Never import or execute a game/native leaf.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
const root = new URL('../../../', import.meta.url), rootPath = fileURLToPath(root);
const read = path => readFile(new URL(path, root), 'utf8');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const modulePath = 'games/pokemon-dungeon-reimagined/src/domain/gameplay/sinister-initial-ai.js';
const contractPath = 'games/pokemon-dungeon-reimagined/src/contracts/sinister-ai.js';
const factsText = await read('tools/pokemon-dungeon/content/sinister-initial-ai/sources.json');
assert.equal(sha(factsText), '2d12eb182fbe5823a961cd174a623d49c37af114cbbbfc1ff61db1595f4d2205');
const facts = JSON.parse(factsText);
// Preserve the entire historical provenance body. Its original Git checkpoint
// is unavailable; the available integration base contains the same exact blobs.
const { recovery, ...originalFacts } = facts;
assert.equal(recovery.originalSourcesSha256, 'fcf07dcf4da9abbe95f76a555c72b914a81948adf10efc94d05970f31ca99ae2');
assert.equal(sha(JSON.stringify(originalFacts, null, 2) + '\n'), recovery.originalSourcesSha256);
assert.equal(recovery.integrationBaseCommit, 'efe20598c424cb09873dbc1def9aad9f7fe97d44');
assert.equal(recovery.campaignContract.path, 'games/pokemon-dungeon-reimagined/src/contracts/campaign.js');
assert.equal(recovery.leafPins.length, 2);
assert.equal(facts.scope, 'unselected-sinister-native-ai-proposal');
assert.equal(facts.baseCommit, '2bc25c0e0c5916aa105d08ed9a27065d6baaba33');
assert.equal(facts.nativeCommit, '6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.nativeTree, '3a0dcb371062a672e6c291e6e0bda4314499e985');
assert.equal(facts.qualification, 'pinned-red-comparative-qualified-browser-RNG-and-geometry-not-blue-binary-or-native-instruction-parity');
assert.equal(facts.sourceFiles.length, 36); assert.equal(facts.dependencies.length, 10); assert.equal(facts.catalogs.length, 3);
function inspect(text) {
  const ast = parse(text, { ecmaVersion: 'latest', sourceType: 'module' });
  assert.deepEqual(ast.body.filter(n => n.type === 'ImportDeclaration').map(n => n.source.value), ['../state/plain.js', '../rng.js', '../escort-dungeon-rng.js']);
  assert.deepEqual(ast.body.filter(n => n.type === 'ExportNamedDeclaration').map(n => n.declaration?.id?.name), ['prepareSinisterAi']);
  const functions = new Map();
  const visit = node => {
    assert.notEqual(node.type, 'ImportExpression');
    if (node.type === 'CallExpression' && node.callee.type === 'Identifier') assert.ok(!['eval', 'Function', 'randomInteger', 'nextRandom'].includes(node.callee.name));
    if (node.type === 'NewExpression' && node.callee.type === 'Identifier') assert.notEqual(node.callee.name, 'Function');
    if (node.type === 'FunctionDeclaration') functions.set(node.id.name, text.slice(node.body.start, node.body.end));
    for (const value of Object.values(node)) { if (Array.isArray(value)) { for (const child of value) if (child?.type) visit(child); } else if (value?.type) visit(value); }
  };
  visit(ast);
  const body = name => { assert.ok(functions.has(name), name); return functions.get(name); };
  const sequence = (owner, tokens) => { let cursor = -1; for (const token of tokens) { const at = owner.indexOf(token, cursor + 1); assert.ok(at > cursor, `Missing/out-of-order ${token}`); cursor = at; } };
  const main = body('prepareSinisterAi');
  sequence(main, ['draw === escortDungeonRandomInteger', 'copyPlainData(input,', 'validate(value, catalogs)', 'validateRandomState(value.beforeRandom)', 'copyPlainData(actor.ai)', 'if (actor.isTeamLeader)', "branches.push('leader')", 'ai.target.notNextToTarget = false', 'tacticIs(actor, 7)', 'tacticIs(actor, 9)', 'Math.floor(actor.belly.numerator / actor.belly.denominator) === 0', 'actor.behavior === 1', 'ai.action.direction = sample(8)', 'runAwayWithFlags()', 'takeItem()', 'choose(); decide()', '!(status2(actor) || actor.status.blinker === 1) || !status1(actor)', "value.phase === 'floor-refresh'", 'draws.length <= 11 && probes.length <= 13', 'freeze(result); return result']);
  const guard = body('validate');
  for (const token of ['input.slots.wild.length === 128', 'input.slots.active.length === 132', 'actor.actorId === input.owner.actorId', 'actor.generation === input.owner.generation', 'retained target slot bytes', 'retained leader cache bytes', 'junction.activePrefix.length === junction.count']) assert.ok(guard.includes(token), token);
  const probe = body('canMove');
  for (const token of ['front.terrainFlags & 16', 'front.terrainFlags & 64', 'front.object?.type === 2', 'actor.status.blinker === 3', "liquid === 'lava'", 'walkableNeighborFlags, effectiveCrossable(direction)', 'front.monster === null', 'probes.push(result)']) assert.ok(probe.includes(token), token);
  sequence(body('junction'), ['effectiveCrossable(null)', 'sample(100)', 'ai.mobileTurnTimer = ((sum + 32768) & 65535) - 32768', 'ai.mobileTurnTimer < 200', 'ai.mobileTurnTimer = 0', '0x54, 0x51, 0x45, 0x15, 0x55']);
  const wander = body('wander');
  sequence(wander, ['const opposite', 'junction()', 'sample(8)', 'dir === opposite', 'canMove(dir)', 'target(6, adjacent(actor.position, sample(8)))', 'exits.count === 0', 'i < 10', 'sample(exits.count)', 'tile(actor.position).terrainFlags & 8', 'const start = sample(8)', '(start + i) & 7']);
  assert.equal((wander.match(/target\(6/g) ?? []).length, 3, 'No invented room-exit fallthrough reset.');
  const choose = body('choose');
  sequence(choose, ['LEADER_TACTICS.includes(actor.tactic)', 'other.behavior !== 0', 'treatment(actor, other, true)', 'other.shopkeeper === 1', '> 5', '!visible(other, false)', 'd < closest', 'd < 2', 'chase(other, selected, true)', 'getLeader()', 'ai.target.objective', 'remembered.generation === ai.target.targetGeneration', 'remembered.prevPos', 'inSight(p, false)', 'wander()']);
  assert.ok(!choose.includes('remembered.type'), 'Native remembered pointer does not first EntityIsValid.');
  sequence(body('avoid'), ['visible(other, true)', 'treatment(actor,', 'd < closest', 'ai.targetPos =', 'actor.room === selected.room', 'dir = 0; dir < 8', 'sample(8)', 'distance(selected.position, step) >= closest', 'd > furthest', '2 * actor.position.x - selected.position.x']);
  assert.ok(!body('avoid').includes('other.behavior') && !body('avoid').includes('other.shopkeeper'));
  assert.ok(body('treatment').includes('a.ai.decoyAITracker') && !body('treatment').includes('target.unkC'));
  sequence(body('decide'), ['ai.targetPos =', 'distance(actor.position, ai.target.position) === 0', 'tacticIs(actor, 3)', 'withinTwo(', 'ai.target.turningAround', 'canMove(dir)', '!actor.recalculateFollow', 'const tries', 'const limit', 'i = 1; i < limit', 'tries[1] = tries[2] = true', 'for (const result of choices)', 'ai.waiting = true']);
  assert.ok(body('runAwayWithFlags').includes('ai.previousVisualFlags = ai.visualFlags & 4'));
  assert.ok(body('takeItem').includes('[71, 74]') && body('takeItem').includes('actor.status.bide >= 2 && actor.status.bide <= 10'));
  assert.ok(body('action').includes('p.useIndex = 0') && body('walk').includes('mobility.canMove ? 2 : 1'));
  for (const token of ['context.state', 'session.actors', 'session.scheduler', 'floorRevision', 'allocateId(', 'applyExperience(', 'calculateHiddenPower', 'Date.now', 'Math.random', 'fetch(', 'localStorage']) assert.ok(!text.includes(token), token);
}
const source = await read(modulePath); inspect(source);
parse(await read(contractPath), { ecmaVersion: 'latest', sourceType: 'module' });
assert.deepEqual(recovery.leafPins.map(row => row.path).sort(), [modulePath, contractPath].sort());
for (const row of recovery.leafPins) assert.equal(sha(await read(row.path)), row.sha256, `Exact recovered AI leaf ${row.path}`);
if (process.argv.includes('--negative-controls')) for (const mutate of [
  s => s.replace('draw === escortDungeonRandomInteger', 'typeof draw === "function"'),
  s => s.replace('const sum = ai.mobileTurnTimer + sample(100)', 'const sum = ai.mobileTurnTimer + 0'),
  s => s.replace('junction.activePrefix.length === junction.count', 'true'),
  s => s.replace('walkableNeighborFlags, effectiveCrossable(direction)', 'walkableNeighborFlags, 0'),
  s => s.replace('remembered.generation === ai.target.targetGeneration', 'remembered.type === 1'),
  s => s.replace('!(status2(actor) || actor.status.blinker === 1) || !status1(actor)', '!(status2(actor) || actor.status.blinker === 1) && !status1(actor)'),
  s => s.replace('a.ai.decoyAITracker', 'a.ai.target.unkC'),
  s => s.replace('ai.previousVisualFlags = ai.visualFlags & 4', 'ai.previousVisualFlags = 0 & 4'),
]) { const altered = mutate(source); assert.notEqual(altered, source); assert.throws(() => inspect(altered)); }
/** Only the recorded additive scene typedef differs from the historical
 * dependency. No implementation, resource or historical schema rewrite passes.
 * This inspects source strings and never evaluates the contract. */
function originalDependency(path, text) {
  if (path !== recovery.campaignContract.path) return text;
  assert.equal(sha(text), recovery.campaignContract.sha256, 'Exact current additive campaign contract');
  assert.equal(text.split(recovery.campaignContract.additiveSource).length, 2, 'One exact early-scene typedef addition');
  return text.replace(recovery.campaignContract.additiveSource, '');
}
if (process.argv.includes('--negative-controls')) {
  const current = await read(recovery.campaignContract.path);
  for (const altered of [current.replace("kind: 'early-campaign';", "kind: 'invented-campaign';"), current.replace(recovery.campaignContract.additiveSource, ''), current + recovery.campaignContract.additiveSource]) assert.throws(() => originalDependency(recovery.campaignContract.path, altered));
}
for (const row of [...facts.dependencies, ...facts.catalogs]) {
  assert.equal(sha(originalDependency(row.path, await read(row.path))), row.sha256, row.path);
  assert.equal(execFileSync('git', ['rev-parse', `${recovery.integrationBaseCommit}:${row.path}`], { cwd: rootPath, encoding: 'utf8' }).trim(), row.blob);
  const original = execFileSync('git', ['show', `${recovery.integrationBaseCommit}:${row.path}`], { cwd: rootPath, maxBuffer: 16 * 1024 * 1024 });
  assert.equal(sha(original), row.sha256, `Available base preserves original dependency ${row.path}`);
}
const index = process.argv.indexOf('--native-root'); assert.ok(index >= 0 && process.argv[index + 1], 'Supply --native-root.');
const nativeRoot = process.argv[index + 1], native = new Map();
assert.equal(execFileSync('git', ['rev-parse', `${facts.nativeCommit}^{tree}`], { cwd: nativeRoot, encoding: 'utf8' }).trim(), facts.nativeTree);
for (const row of facts.sourceFiles) { const bytes = execFileSync('git', ['show', `${facts.nativeCommit}:${row.path}`], { cwd: nativeRoot, maxBuffer: 16 * 1024 * 1024 }); assert.equal(sha(bytes), row.sha256, row.path); assert.equal(execFileSync('git', ['rev-parse', `${facts.nativeCommit}:${row.path}`], { cwd: nativeRoot, encoding: 'utf8' }).trim(), row.blob); native.set(row.path, bytes.toString('utf8')); }
for (const [path, tokens] of [
  ['src/dungeon_ai_movement.c', ['HP <= pokemonInfo->maxHPStat / 2', 'FixedPointToInt(pokemonInfo->belly) == 0', 'DungeonRandInt(naturalJunctionListCounts)', 'for (i = 0; i < 10; i++)', 'nowhere near close to matching in Blue', 'adjacentToTargetDistance >= pokemonToTargetDistance']],
  ['src/dungeon_logic.c', ['mobileTurnTimer += DungeonRandInt(100)', 'mobileTurnTimer < 200', 'walkableNeighborFlags[crossableTerrain]', 'pokemonInfo->decoyAITracker', 'SetVisualFlags(iVar2,4', 'previousVisualFlags', 'IQ_ALL_TERRAIN_HIKER']],
  ['src/dungeon_misc.c', ['if (info->isTeamLeader)', '(!CheckVariousStatuses2(entity, TRUE) || !CheckVariousStatuses(entity))', 'sub_806CE68(entity, newDirection)']],
  ['src/dungeon_mon_spawn.c', ['entInfo->mobileTurnTimer = 0', 'InitEntityFromSpawnInfo', 'sub_806A898(entity, FALSE, FALSE)']],
  ['src/dungeon_range.c', ['gLeaderPointer', 'bottomRightCornerX - 1', 'topLeftCornerX + 1', 'IsPositionWithinTwoTiles']],
  ['src/dungeon_generation.c', ['walkableNeighborFlags[CROSSABLE_TERRAIN_REGULAR] = 0', 'naturalJunctionListCounts', 'ResetFloor']],
]) for (const token of tokens) assert.ok(native.get(path).includes(token), `${path}: ${token}`);
assert.ok(native.get('include/constants/ability.h').includes('#define ABILITY_RUN_AWAY 0x2B'));
assert.ok(native.get('include/structs/str_position.h').includes('s16 x;') && native.get('include/structs/str_position.h').includes('s16 y;'));
const mobility = JSON.parse(await read(facts.catalogs.find(row => row.path.endsWith('/navigation/facts.json')).path)).mobility;
const monsters = JSON.parse(native.get('data/monster/monster_data.json'));
assert.equal(mobility.length, 424); assert.equal(monsters.length, 424);
for (const row of mobility) assert.equal(row.canMove, monsters[row.internalId].canMove, `native canMove ${row.internalId}`);
assert.deepEqual(facts.bounds, { teamSlots:4,wildSlots:128,activeSlots:132,roomSlots:32,junctionPrefix:32,roomExitAttempts:10,maxDraws:11,maxMovementProbes:13,clearBranchOutputEvents:0,maxGridWidth:128,maxGridHeight:128,maxPlainNodes:400000,maxProposalNodes:402 });
assert.equal(facts.bounds.maxProposalNodes, 2 * 42 + 6 + 2 * 8 + (1 + 1 + 1 + 11 * 19 + 1 + 13 * 4) + 2 * 3 + 18 + 7);
async function references(directory) { for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) { const path = directory + entry.name; if (entry.isDirectory()) await references(path + '/'); else if (entry.name.endsWith('.js') && path !== modulePath && path !== contractPath) assert.ok(!(await read(path)).includes('sinister-initial-ai.js') && !(await read(path)).includes('contracts/sinister-ai.js'), `Live reference ${path}`); } }
await references('games/pokemon-dungeon-reimagined/src/'); await references('games/pokemon-dungeon-reimagined/content/');
console.log(`Sinister AI source proof PASS:36 native/10 dependencies/3 catalogs; exact original provenance, available efe2059 blobs and sole additive scene typedef;424 canMove rows;<=11 qualified draws/13 movement probes;unselected.${process.argv.includes('--negative-controls') ? ' Eight behavior and three recovery text negative controls rejected.' : ''}`);
