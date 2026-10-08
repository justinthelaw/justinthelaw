// Source/AST/data only. No game module import, evaluation, simulation or replay.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const game = new URL('../../../games/pokemon-dungeon-reimagined/',import.meta.url);
const read = path => readFile(new URL(path,game),'utf8');
const names = ['domain/gameplay/sinister-experience','domain/gameplay/sinister-native-learning','domain/state/sinister-award-proof','domain/state/sinister-learning-proof','domain/state/sinister-work-schema','domain/gameplay/damage-resolution','domain/gameplay/escort-native-learning','domain/turns/sinister-advance'];
const files = new Map();
for (const name of names) { const text = await read(`src/${name}.js`); files.set(name.split('/').at(-1),{text,ast:parse(text,{ecmaVersion:'latest',sourceType:'module'})}); }
const text = name => files.get(name).text;
function fn(name,id) {
  const {text,ast} = files.get(name),node = ast.body.map(row => row.type === 'ExportNamedDeclaration' ? row.declaration : row).find(row => row?.type === 'FunctionDeclaration' && row.id.name === id);
  assert.ok(node,id); return text.slice(node.start,node.end);
}
function has(source,parts) { for (const part of parts) assert.ok(source.includes(part),part); }
function before(source,a,b) { assert.ok(source.includes(a) && source.includes(b) && source.indexOf(a)<source.indexOf(b),`${a} before ${b}`); }
const damage = text('damage-resolution');
// Remove only the three exact prospective additions, then authenticate every
// remaining byte against the accepted original shared damage owner.
const beforeImport = "import { SINISTER_WORK_REVISION } from '../state/sinister-work-revision.js';\nimport { creditSinisterDefeat } from './sinister-experience.js';\n";
const branch = "    if (context.state.contentRevision === SINISTER_WORK_REVISION && giveExperience && attacker?.affiliation === 'team' && target.affiliation === 'hostile') creditSinisterDefeat(context,target,attacker,catalogs);\n";
has(damage,[beforeImport,branch,'for (const id of context.state.contentRevision === SINISTER_WORK_REVISION ? [] : giveExperience']);
const legacy = damage.replace(beforeImport,'').replace(branch,'').replace('for (const id of context.state.contentRevision === SINISTER_WORK_REVISION ? [] : giveExperience','for (const id of giveExperience');
assert.equal(createHash('sha256').update(legacy).digest('hex'),'b5bd948a819885f8d42b15874159d449447993360ad2857b96f53b4a9e306274','Retain exact original shared damage defaults');
before(damage,'tryRevive(context, target, catalogs)','creditSinisterDefeat(context,target,attacker,catalogs)');
before(damage,'creditSinisterDefeat(context,target,attacker,catalogs)',"target.placement = { kind: 'off-map'");
const producer = text('sinister-experience'),source = fn('sinister-experience','awardSource');
has(producer,['context.state.contentRevision !== SINISTER_WORK_REVISION','s.escortGuest',"target.binding.kind !== 'wild'","target.resources.hp !== 0","target.placement.kind !== 'map'",'Math.min(9999999-value(actor.growth.totalExperience),xp)','sourceFrame: clone(s.scheduler.continuation)','sinisterSource: clone(source)']);
has(source,['fingerprint(c.action) !== fingerprint(move.selectedAction)','sequence.nextHit !== move.completedHits',"disposition !== 'active'","c.flushing?.step === 3","c.stage === 'after' && c.step === 3","c.pass === 'follower-end'","kind: 'impact',actor: clone(actor),move: clone(move),sequence: clone(sequence)"]);
assert.ok(!/grow\(|processLearning|\.emit\(/.test(producer),'Award producer never performs growth/output');
const proof = text('sinister-award-proof');
has(proof,['sinisterShapeProblem(state)','sourceValid(s,award,revision)','impactValid(s,award,revision)','fingerprint(f.action) !== fingerprint(m.selectedAction)','q.nextHit !== m.completedHits','DIRECTIONS[direction.value]','facing(step.x,step.z)','randomInteger(random,4)','m.afterPp !== m.beforePp-1','live.completedHits <= m.completedHits','pending.experienceBefore.numerator+pending.amount','pending.gainsBefore.numerator+pending.amount','seen.has(target.actorId)','award.sourceRound','>= 24','Math.min(9999999-total,xp)']);
const schema = text('sinister-work-schema');
has(schema,["kind: lit('impact')",'sinisterSource: sourceWork','SessionActor: union([...actors.members,...sourceActors])']);
// The existing native level/candidate algorithm remains exact. Only a genuine
// forget mutates v25's extra LAST_USED owner; no resource is reconstructed.
assert.equal(fn('sinister-native-learning','grow'),fn('escort-native-learning','grow'));
const flags = "  const flags = s.sinisterTurn?.combat.lastUsed[actor.actorId];\n  if (!flags) return blocked('sinister-learning-last-used');\n  flags.slots = flags.slots.filter(id => !removed.has(id));\n";
assert.equal(fn('sinister-native-learning','learnMove').replace(flags,''),fn('escort-native-learning','learnMove'));
const process = fn('sinister-native-learning','processSinisterLearning');
has(process,['sinisterLearningProblem(context.state,catalogs,context.state.revision+1)','w.checkpoint || w.combat.sequence || w.move && !w.terminal','fingerprint(origin) !== fingerprint(w.terminal.origin)','sinisterLearningOriginProblem(context.state,origin,schedulerTag)','s.scheduler.teamSlots.flatMap']);
before(process,'sinisterLearningOriginProblem','drainRecipient(context,catalogs)');
const drain = fn('sinister-native-learning','drainRecipient');
assert.equal((drain.match(/grow\(/g) ?? []).length,1);
assert.ok(!/while\s*\(|for\s*\(/.test(drain));
has(drain,['work.actorIndex++',"work.phase = 'return'","kind: 'learning-continuing'"]);
const advance = fn('sinister-native-learning','advanceSinisterLearning');
before(advance,'delete s.learningWork',"if (work.origin.kind === 'turn') return resumeTurn(context)");
has(advance,['markSinisterTerminalReturn(context,catalogs)',"return { kind: 'yielded',consumedTurn: false }"]);
const handler = fn('sinister-native-learning','sinisterLearningHandler');
assert.ok(!/drainRecipient|grow\(|draw\(|\?\?=/.test(handler));
has(handler,['sinisterLearningProblem(context.state,catalogs)','work.actorIndex !== owner.actorIndex',"kind: 'learning-continuing'"]);
const learning = text('sinister-learning-proof');
has(learning,['sinisterTurnProblem(state,catalogs,revision)','sinisterAwardProblem(state,catalogs,revision)','turnLearningPc(state,s,l)','fingerprint(l.origin) === fingerprint(w.terminal.origin)','sinisterTerminalPc(state,s,w.terminal)','fingerprint(sampled.state) !== fingerprint(state.random.combatRecruitment)','a.resources.hp !== a.growth.naturalStats.hp-atFaint.stats.hp','origin = l.origin','fingerprint(work.actorOrder)']);
const allowed = new Set(names.map(name => `src/${name}.js`));
async function scan(dir) {
  for (const row of await readdir(new URL(dir,game),{withFileTypes:true})) {
    const path = dir+row.name;
    if (row.isDirectory()) { if (row.name !== 'vendor') await scan(path+'/'); continue; }
    if (!row.name.endsWith('.js')) continue;
    const ast = parse(await read(path),{ecmaVersion:'latest',sourceType:'module'});
    for (const node of ast.body) if (node.source && /sinister-(?:experience|native-learning|award-proof|learning-proof)\.js$/.test(node.source.value)) assert.ok(allowed.has(path),`Unselected learning consumer ${path}`);
  }
}
await scan('src/'); await scan('content/');
console.log('Sinister learning source audit: actual paid-impact/end awards, exact inherited default damage and native growth bodies, one recipient, no ACK growth, genuine terminal marker, no selected caller or game execution. Full raw factory/route admission remains held.');
