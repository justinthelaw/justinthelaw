// Parse/read-only ownership audit. Never import/evaluate the game or native code.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url),game = new URL('games/pokemon-dungeon-reimagined/',root);
const read = path => readFile(new URL(path,game),'utf8');
const pins = {
  'combat':'a9493333c804cda942c1710d0113d8442ae65d5a04e4f354fba67fb2f9d465c0',
  'damage-status':'67cd92f28082b2b224d910257e81eff2af84ece48c6c03dbe5341f7c5def5ed3',
  'sinister-combat':'b8922cc86630255c32f686ab747c16cacddcf2e329c68b0825d31db770893536',
  'sinister-condition-lifecycle':'a68e989698963354669ee1bd981f0836dff536dd44239883773f0dd4f3e95933',
  'sinister-damage-status':'ab849a0b33e2ff155c8d3a4dae5cdf26bd48239e9b23c2cb643af1b8286e2533',
  'sinister-move-effects':'677aac33c974117a537d4ac7a0cf0cd46d88763477a0c6bec0c81c19c481bc73',
};
for (const [name,hash] of Object.entries(pins)) assert.equal(createHash('sha256').update(await read(`src/domain/gameplay/${name}.js`)).digest('hex'),hash,`Accepted 3fc0834 leaf plus reviewed poison speed-timing correction ${name}`);
const names = ['domain/state/sinister-work-schema','domain/state/sinister-work-revision','domain/state/sinister-turn-proof','domain/gameplay/sinister-turn-work','domain/turns/sinister-engine','domain/turns/sinister-advance','domain/gameplay/sinister-experience','domain/gameplay/sinister-native-learning','domain/state/sinister-award-proof','domain/state/sinister-learning-proof','domain/sinister-adventure','persistence/sinister-codec'];
const files = new Map();
for (const name of names) { const source = await read(`src/${name}.js`),ast = parse(source,{ecmaVersion:'latest',sourceType:'module'}); files.set(name.split('/').at(-1),{source,ast}); }
const source = name => files.get(name).source;
function body(name,id) {
  const {source,ast} = files.get(name);
  const node = ast.body.map(row => row.type === 'ExportNamedDeclaration' ? row.declaration : row).find(row => row?.type === 'FunctionDeclaration' && row.id.name === id);
  assert.ok(node,`Actual declared ${id}`); return source.slice(node.start,node.end);
}
function has(text,parts) { for (const part of parts) assert.ok(text.includes(part),`Missing source ownership: ${part}`); }
function before(text,first,second) { assert.ok(text.includes(first) && text.includes(second) && text.indexOf(first) < text.indexOf(second),`${first} must precede ${second}`); }
const schema = source('sinister-work-schema'),proof = source('sinister-turn-proof'),engine = source('sinister-engine'),advance = source('sinister-advance');
const kinds = ['prepared-move','impact','move-complete','opportunity-end','flush-end','follower-end','terminal'];
for (const kind of kinds) { has(schema,[`'${kind}'`]); has(engine,[`'${kind}'`]); }
has(schema,["from './escort-work-schema.js'",'...PRIOR','...scheduler.members','...expedition.members','...ready.fields',"kind: lit('sinister-continuing')",'selectedAction: attack','directionRandom:', 'chargeOwned:', 'sourceFrame:', 'casualties:']);
has(proof,['copyPlainData(input)',"inspectShape(data,'CampaignStateWithFieldMoves'",'SINISTER_WORK_SHAPES','fingerprint(c.action) !== fingerprint(m.selectedAction)','randomInteger(random,8)','randomInteger(random,4)','fingerprint(m.directionRandom)','m.beforePp-1','wTerminalForgotten','sinisterImmobilized(a)','moveTargets(s,a,','m.chargeOwned','m.disposition','f.index','c.slotIndex === p.actor.slot+1','fingerprint(t.origin.casualties)']);
// R001: replay the producer's geometry direction index, not FACINGS' different
// north-first index. Only parse literal table data; never execute its module.
const confusion = await read('src/domain/gameplay/confused-action.js');
const geometry = parse(await read('src/domain/navigation/geometry.js'),{ecmaVersion:'latest',sourceType:'module'});
const directions = geometry.body.find(row => row.type === 'ExportNamedDeclaration' && row.declaration?.declarations?.[0]?.id.name === 'DIRECTIONS').declaration.declarations[0].init.arguments[0].callee.object;
assert.equal(directions.type,'ArrayExpression');
const scalar = node => node.type === 'Literal' ? node.value : (assert.equal(node.type,'UnaryExpression'),assert.equal(node.operator,'-'),-node.argument.value);
const vectors = directions.elements.map(row => Object.fromEntries(row.properties.map(prop => [prop.key.name,scalar(prop.value)])));
assert.deepEqual(vectors,[{x:0,z:1},{x:1,z:1},{x:1,z:0},{x:1,z:-1},{x:0,z:-1},{x:-1,z:-1},{x:-1,z:0},{x:-1,z:1}]);
has(confusion,['direction = DIRECTIONS[first]','facing(direction.x, direction.z)']);
function sameDirectionOwner(text) { return text.includes('const step = DIRECTIONS[direction.value]') && text.includes('facing(step.x,step.z)') && !text.includes('FACINGS[direction.value]'); }
assert.ok(sameDirectionOwner(proof));
assert.ok(!sameDirectionOwner(proof.replace('const step = DIRECTIONS[direction.value]; expectedFacing = step ? facing(step.x,step.z) : m.facingBefore','expectedFacing = FACINGS[direction.value] ?? m.facingBefore')),'R001 source mutation must fail direction-owner assertion');
const prepare = body('sinister-turn-work','prepareSinisterMove');
before(prepare,'confusedAction(context,a,selected,catalogs)','beginSinisterAttack(context,a,action,catalogs,w.combat)');
has(prepare,['selectedAction: clone(selected)','action: clone(action)','beforeRandom,directionRandom,afterRandom','chargeOwned: chargeBefore !== null',"saveSinisterCheckpoint(context,'prepared-move',ref,catalogs)"]);
assert.ok(!prepare.includes('finally'));
const impact = body('sinister-turn-work','advanceSinisterImpact');
assert.equal((impact.match(/continueSinisterAttack\(/g) ?? []).length,1);
has(impact,["s.scheduler.kind !== 'ready'","c.stage !== 'effect'",'m.completedHits = q.nextHit','charge !== a.conditions.bide',"'actor-removed'","'cannot-attack'","'targets-empty'"]);
assert.ok(!/processLearning|\.experience\(/.test(impact));
const loop = body('sinister-engine','advanceSinisterTurns');
assert.equal((loop.match(/advanceSinisterImpact\(/g) ?? []).length,1);
const dispatch = loop.slice(loop.indexOf("if (checkpoint.kind === 'prepared-move'"),loop.indexOf("if (checkpoint.kind === 'move-complete')"));
before(dispatch,'advanceSinisterImpact(context,catalogs)','hooks.forcedLoss(context)');
before(dispatch,'hooks.forcedLoss(context)','finishSinisterMove(context)');
has(dispatch,['sinister-inline-terminal-copyback',"saveSinisterCheckpoint(context,'terminal',null,catalogs)","return { kind: 'yielded',consumedTurn: false }"]);
assert.ok(!/hooks\.experience|for\s*\(|while\s*\(/.test(dispatch));
for (const kind of ['opportunity-end','flush-end','follower-end']) has(engine,[`saveSinisterCheckpoint(context,'${kind}',ref,catalogs)`]);
assert.ok(!engine.includes('escort-native-learning'));
has(engine,['sinister-terminal-capture-required',"steps: 16384, effects: 4096"]);
const capture = body('sinister-turn-work','captureSinisterTerminal');
has(capture,["phase: 'captured'",'requestedRevision: context.state.revision+1','casualties','sourceFrame: clone(c)','sinisterTerminalPc']);
assert.ok(!/pendingExperience|processLearning|getGrowthAtLevel/.test(capture),'No-growth terminal capture must not depend on growth');
has(advance,['Actual Sinister learning/terminal owners are required.','sinister-learning-return-marker','sinister-inline-terminal-return','sinister-terminal-marker-unconsumed']);
before(advance,'const priorTerminal = w.terminal','owners.advanceLearning(context)');
has(advance,["if (priorTerminal && !s.learningWork && (w.terminal !== priorTerminal || priorTerminal.phase !== 'return'"]);
before(advance,'owners.drain(context,terminal)','markSinisterTerminalReturn(context,catalogs)');
before(advance,'markSinisterTerminalReturn(context,catalogs)','owners.resume(context,terminal)');
has(body('sinister-turn-work','markSinisterTerminalReturn'),['a.pendingExperience','getGrowthAtLevel',"t.phase = 'return'", "saveSinisterCheckpoint(context,'terminal',null,catalogs)"]);
has(body('sinister-advance','consumeSinisterTerminal'),["t.phase !== 'return'",'t.frameFingerprint !== fingerprint(s.scheduler.continuation)','w.terminal = null']);
// Only the new unselected responsibility may consume its prospective sources.
const allowed = new Set([...names.map(name => `src/${name}.js`),'src/domain/state/early-campaign-scene-schema.js','src/domain/gameplay/early-campaign-scene-state.js']);
async function scan(dir) {
  for (const row of await readdir(new URL(dir,game),{withFileTypes:true})) {
    const path = `${dir}${row.name}`;
    if (row.isDirectory()) { if (row.name !== 'vendor') await scan(path+'/'); continue; }
    if (!row.name.endsWith('.js')) continue;
    const text = await read(path),ast = parse(text,{ecmaVersion:'latest',sourceType:'module'});
    for (const node of ast.body) if (node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') {
      if (/sinister-(?:turn-work|turn-proof|work-schema|work-revision|engine|advance)\.js$/.test(node.source?.value ?? '')) assert.ok(allowed.has(path) || path === 'src/domain/gameplay/damage-resolution.js' && node.source.value === '../state/sinister-work-revision.js' || path === 'content/state/sinister-ability-domain.js' && node.source.value === '../../src/domain/state/sinister-work-revision.js',`Selected/foreign consumer ${path}`);
    }
  }
}
await scan('src/');
await scan('content/');
// These arithmetic terms are a conditional source ledger, NOT actual caller proof.
assert.equal(3510+133+134+12+200+17+2+5+1+2+2,4018);
assert.equal(2400+133+134+12+200+17+2+5+1+2+2,2908);
assert.ok(4018+264>4096);
console.log('Sinister work static audit: seven PCs, one-impact dispatch, three saved end owners, unconditional terminal/return split, exact accepted effect leaves, unselected-only imports; no execution. Caller/factory/burst acceptance remains held.');
