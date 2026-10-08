// Text/AST inspection only. Never import/evaluate game/native modules.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url),game = 'games/pokemon-dungeon-reimagined/';
const read = name => readFile(new URL(game+name,root),'utf8');
function nodes(node,predicate) { const out = []; function walk(value) { if (!value || typeof value !== 'object') return; if (typeof value.type === 'string' && predicate(value)) out.push(value); for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(walk); else if (child && typeof child === 'object') walk(child); } walk(node); return out; }
const source = await read('src/domain/gameplay/escort-native-learning.js'),ast = parse(source,{ ecmaVersion: 'latest',sourceType: 'module' });
function fn(name) { const row = nodes(ast,node => node.type === 'FunctionDeclaration' && node.id.name === name); assert.equal(row.length,1); return row[0]; }
const text = name => source.slice(fn(name).start,fn(name).end);
assert.equal(nodes(fn('drainRecipient'),node => node.type === 'CallExpression' && node.callee.name === 'grow').length,1);
assert.ok(text('drainRecipient').includes('work.actorIndex++; break;'));
assert.ok(text('drainRecipient').includes("work.phase = 'return'") && text('drainRecipient').includes("kind: 'learning-continuing'"));
assert.ok(text('processLearning').includes('if (!needsGrowth) return false;') && text('processLearning').includes("prior.phase === 'return'") && text('processLearning').includes('delete s.learningWork'));
assert.equal(nodes(fn('grow'),node => node.type === 'WhileStatement').length,1);
assert.ok(text('grow').includes('actor.growth.level < 100') && text('grow').includes("messageId: 'level-up'"));
const handler = text('learningHandler');
assert.ok(handler.includes('learningProblem(context.state,catalogs)') && handler.includes('s.learningWork ??='));
assert.ok(!handler.includes('processLearning(') && !handler.includes('resume(') && !handler.includes('draw('),'A genuine choice ACK cannot run growth/suffix/normal turns or consume a candidate sample.');
assert.ok(handler.includes("kind: 'learning-continuing'") && handler.includes("resumeDungeon: false"));
assert.ok(text('advanceLearningWork').includes('drainRecipient(context,catalogs)') && text('advanceLearningWork').includes('return resume(context,work.origin)'));
const engine = await read('src/domain/turns/escort-engine.js'); parse(engine,{ ecmaVersion: 'latest',sourceType: 'module' });
assert.ok(engine.includes("result.kind === 'prompt' || result.kind === 'yield'") && engine.includes("frame.stage = 'after'; frame.step = 0;\n    sealLearningFrame(context);"));
assert.ok(engine.includes("if (session.scheduler.kind === 'learning-continuing' && session.learningWork) return { kind: 'yielded'"));
const hooks = await read('src/domain/gameplay/escort-turn-hooks.js');
const hooksAst = parse(hooks,{ ecmaVersion: 'latest',sourceType: 'module' });
const wind = nodes(hooksAst,node => node.type === 'Property' && node.key.name === 'wind');
assert.equal(wind.length,1);
const windText = hooks.slice(wind[0].start,wind[0].end);
assert.ok(windText.includes("settleExpedition(context, 'wind-expulsion'") && windText.includes("context.state.session?.learningWork ? { kind: 'yield' }"),'Wind settlement must return the real saved-work yield when no move choice opens.');
const proof = await read('src/domain/state/escort-learning-proof.js'); parse(proof,{ ecmaVersion: 'latest',sourceType: 'module' });
for (const obligation of ['learningPc(state,s,work)','fingerprint(order) !== fingerprint(work.actorOrder)',"(work.phase === 'return') !== (work.actorIndex === order.length)",'order.slice(0,work.actorIndex)','s.learning.actorIndex !== work.actorIndex','work.resumeFrameFingerprint','casualties.length > 4']) assert.ok(proof.includes(obligation),obligation);
assert.ok((await read('src/domain/state/escort-work-schema.js')).includes("kind: lit('learning-continuing')"));
// One eligible roster's99 levels emit <=198 growth notices; EXP+ACK <=2.
// Existing source same-dispatch ancestors: four deferred ends plus one normal
// end/flush recipient;133 tile notice bound. New floor/Pickup <=5; client loss1.
const growth = 198+1+1,ordinary = 3397+growth+5+1,flush = 1899+growth+5+1,empty = 1545+growth+5+1;
assert.deepEqual([growth,ordinary,flush,empty],[200,3603,2105,1751]); assert.ok(ordinary < 4096);
assert.ok(!(await read('content/authored/opening.js')).includes('ESCORT_WORK_REVISION'),'Full successor still unselected.');
console.log('Prospective saved learning cursor AST/source audit PASS: one eligible recipient, exclusive choice ACK, actual source PCs/return marker; candidate caps3603/2105/1751 under4096. Full caller/raw-factory activation still held; no game execution.');
