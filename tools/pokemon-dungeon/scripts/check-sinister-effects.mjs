// Text/AST/data audit only: no game/native imports or evaluation.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'acorn';
const root = new URL('../../../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const factSource = await read('tools/pokemon-dungeon/content/sinister-effects-facts.json');
assert.equal(createHash('sha256').update(factSource).digest('hex'), '4a1f295fca0c1c6502f9e16a2ec088b22efe19ddc5c9fb09d45c5b1a2d0a6015');
const facts = JSON.parse(factSource);
assert.equal(facts.commit, '6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.qualification, 'pinned-red-comparative-not-blue-binary-proof');
assert.equal(facts.scope, 'prospective-sinister-effects-not-route-admission');
assert.equal(facts.moves.length, 17);
assert.equal(new Set(facts.moves.map(row => row.moveId)).size, 17);
const game = 'games/pokemon-dungeon-reimagined/';
const base = game + 'src/domain/gameplay/';
const moduleNames = ['sinister-combat', 'sinister-move-effects', 'sinister-damage-status', 'sinister-condition-lifecycle'];
const sources = new Map();
for (const name of moduleNames) { const source = await read(base + name + '.js'); parse(source, { ecmaVersion: 'latest', sourceType: 'module' }); sources.set(name, source); }
const primary = sources.get('sinister-move-effects'), secondary = sources.get('sinister-damage-status'), lifecycle = sources.get('sinister-condition-lifecycle'), combat = sources.get('sinister-combat');
// SINISTER-POISON-R001: native PoisonedStatusTarget replaces Paralysis without
// CalcSpeedStage. Preserve the actual stale cache until its later source owner.
function poisonCacheTiming(source) {
  const ast = parse(source,{ecmaVersion:'latest',sourceType:'module'});
  const node = ast.body.find(row => row.type === 'ExportNamedDeclaration' && row.declaration?.type === 'FunctionDeclaration' && row.declaration.id.name === 'inflictSinisterPoison')?.declaration;
  assert.ok(node);
  const body = source.slice(node.start,node.end);
  assert.ok(body.includes("target.conditions.burn = { statusId: 'poisoned'"));
  assert.ok(!/refreshSpeed|CalcSpeedStage|target\.speed/.test(body),'Poison does not refresh or rewrite the cached speed');
}
poisonCacheTiming(secondary);
assert.throws(() => poisonCacheTiming(secondary.replace("  target.conditions.burn = { statusId: 'poisoned'", "  refreshSpeed(target, catalogs);\n  target.conditions.burn = { statusId: 'poisoned'")));
const priorPoison = secondary.replace('inflictParalysis, statusTurns','inflictParalysis, refreshSpeed, statusTurns').replace("  context.emit({ type: 'conditionChanged', actorId: target.actorId }); context.emit({ type: 'message', messageId: 'poisoned-status' });", "  refreshSpeed(target, catalogs); context.emit({ type: 'conditionChanged', actorId: target.actorId }); context.emit({ type: 'message', messageId: 'poisoned-status' });");
assert.equal(createHash('sha256').update(priorPoison).digest('hex'),'cfd5f3dbbcbf70e9ca488d27c35d6c6b9ad1aaaa12dcc6f6f0d66ed86689a285','Only poison cache refresh/import differ from accepted3fc leaf');
for (const row of facts.moves) {
  const source = row.consumer === 'damage-secondary' ? secondary : row.consumer === 'multi-hit' ? combat : primary;
  assert.ok(source.includes(`'${row.moveId}'`), `Missing consumer ${row.moveId}`);
  const files = ['actions-01', 'actions-02'];
  let action;
  for (const file of files) action ??= JSON.parse(await read(`tools/pokemon-dungeon/content/effects-runtime/${file}.json`)).records.find(record => record.moveId === row.moveId);
  assert.equal(action?.internalId, row.nativeId, row.moveId);
  if (row.secondaryPercent !== null) assert.ok(action.effects.some(effect => effect.op === 'secondary' && effect.chancePercent === row.secondaryPercent), row.moveId);
}
assert.ok(primary.includes('Math.max(1, Math.trunc(user.resources.hp / 2))'));
assert.ok(primary.includes("flags.slots.includes(slot.moveSlotId)"));
assert.ok(primary.includes('counter(3 + draw(context.state, 4))'));
assert.ok(lifecycle.includes("c.duration.remaining === 127"));
assert.ok(lifecycle.includes('statusTurns(context, actor, 4, 8, catalogs) + 1'));
assert.ok(lifecycle.includes('releaseSinisterWrap(context, actor, true)'));
assert.ok(combat.includes('2 + draw(context.state, 4)'));
assert.ok(combat.indexOf('markSinisterLastUsed(state, actor, action)') < combat.indexOf('2 + draw(context.state, 4)'));
assert.ok(combat.indexOf("if (!mayContinue(context)) return 'paused'") < combat.indexOf('resolveAttackImpact(context, actor'));
assert.ok(combat.includes('sequence.nextHit++'));
assert.ok(combat.includes("moveId !== 'move-detect'"));
assert.ok(combat.includes('flags.slots.length > 0 || flags.struggle'));
assert.ok(combat.includes("if (moveId === 'move-stun-spore') return target.conditions.burn?.statusId !== 'paralysis'"));
assert.ok(primary.includes("messageId: 'exposure-reset-evasion'"));
assert.ok(primary.indexOf("messageId: 'exposure-reset-evasion'") < primary.indexOf("notify('exposed-status')"));
const residual = lifecycle.slice(lifecycle.indexOf('export function pulseSinisterResidual('));
assert.ok(residual.indexOf("c.periodicCountdown = status === 'wrapped' ? 2 : 10") < residual.indexOf("messageId: 'frozen-prevented-damage'"));
assert.ok(residual.indexOf("messageId: 'frozen-prevented-damage'") < residual.indexOf('dealDamage(context, actor'));
const shared = await read(base + 'combat.js');
parse(shared, { ecmaVersion: 'latest', sourceType: 'module' });
assert.ok(shared.includes('if (prepared) resolveAttackImpact(context, attacker, prepared, catalogs)'));
assert.ok(shared.indexOf('const impactDamage = extension?.damageAmount') > shared.indexOf('move.numeric.accuracyAfterDamage'));
assert.ok(shared.indexOf('const resolution = hit.resolution') < shared.indexOf('extension?.secondary('));
for (const name of ['hooks', 'expedition', 'conditions']) assert.ok(!(await read(base + name + '.js')).includes('sinister-'), `Current owner activated ${name}`);
assert.ok(!(await read(base + 'combat.js')).includes("from './sinister-"));
const nativeIndex = process.argv.indexOf('--native-root');
if (nativeIndex !== -1) {
  const nativeRoot = process.argv[nativeIndex + 1]; assert.ok(nativeRoot, 'Supply native checkout path.');
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: nativeRoot, encoding: 'utf8' }).trim(), facts.commit);
  const poisonNative = execFileSync('git',['show',`${facts.commit}:src/move_orb_effects_1.c`],{cwd:nativeRoot,encoding:'utf8'}).split('void PoisonedStatusTarget(')[1]?.split('\nvoid ')[0];
  assert.ok(poisonNative && poisonNative.includes('STATUS_POISONED') && !poisonNative.includes('CalcSpeedStage'), 'Pinned native poison owner has no immediate speed refresh');
  for (const record of facts.sourceFiles) {
    const bytes = execFileSync('git', ['show', `${facts.commit}:${record.path}`], { cwd: nativeRoot, maxBuffer: 16 * 1024 * 1024 });
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256, record.path);
  }
}
console.log(`Sinister effect text/AST/data audit: ${facts.moves.length} qualified move joins; cursor/draw/protection/reciprocal obligations; no current activation or game/native execution.`);
