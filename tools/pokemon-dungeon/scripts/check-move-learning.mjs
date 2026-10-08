// Parser/data audit only: never import, evaluate or execute any game/native module.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url),game = 'games/pokemon-dungeon-reimagined/';
const read = path => readFile(new URL(path,root),'utf8');
const precedes = (source,left,right) => { const a = source.indexOf(left),b = source.indexOf(right); assert.ok(a >= 0 && b >= 0 && a < b,`${left} precedes ${right}`); };
const paths = ['content/authored/move-learning-facts.js','content/state/move-learning-campaign.js','content/state/move-learning.js','src/contracts/move-learning.js','src/domain/gameplay/native-learning.js','src/domain/gameplay/growth.js','src/domain/gameplay/hooks.js','src/domain/gameplay/damage-resolution.js','src/domain/gameplay/expedition.js','src/domain/gameplay/scenes.js','src/domain/gameplay/commands.js','src/domain/state/move-learning-schema.js','src/domain/state/move-learning-proof.js','src/domain/state/move-learning-prefix.js','src/domain/state/move-learning-revision.js','src/application/move-learning.js','src/shell/application.js','src/persistence/opening-compatibility.js','src/domain/state/validate.js','src/domain/turns/engine.js','src/domain/turns/support.js','src/domain/turns/types.js','src/domain/gameplay/actors.js','src/domain/state/structure.js'];
const files = Object.fromEntries(await Promise.all(paths.map(async path => { const source = await read(game+path); parse(source,{ ecmaVersion: 'latest',sourceType: 'module' }); return [path,source]; })));
const factsText = files[paths[0]],facts = JSON.parse(factsText.slice(factsText.indexOf('freezeData(')+11,factsText.lastIndexOf(');')));
assert.equal(facts.commit,'6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(facts.qualification,'pinned-red-comparative-not-blue-binary-proof');
assert.equal(facts.maxCandidates,16); assert.equal(facts.ultimateIq,333);
assert.deepEqual(facts.sourceFiles.map(row => row.path),['src/dungeon_leveling.c','src/pokemon.c','src/moves.c','src/dungeon_menu_moves.c','src/dungeon_data.c']);
for (const row of facts.sourceFiles) { assert.match(row.sha256,/^[a-f0-9]{64}$/); assert.ok(row.locators); }
const digest = createHash('sha256').update(factsText).digest('hex');
assert.ok(files['src/domain/state/move-learning-revision.js'].includes(`:${digest}'`));
assert.ok(files['content/state/move-learning-campaign.js'].includes(`':${digest}'`));
const learned = JSON.parse(await read('tools/pokemon-dungeon/content/species-runtime/learnsets.json'));
const ids = JSON.parse(await read('tools/pokemon-dungeon/content/species-runtime/identities.json'));
const moveIds = new Set(ids.moves.map(row => row.originalId)); let max = 0,duplicateLevels = 0;
for (const row of learned.records) {
  const counts = new Map(); let previous = 0;
  for (const [level,id] of row.levelUp) { assert.ok(Number.isInteger(level) && level >= previous && level <= 100); assert.ok(moveIds.has(id)); previous = level; counts.set(level,(counts.get(level) ?? 0)+1); }
  for (const count of counts.values()) { max = Math.max(max,count); if (count > 1) duplicateLevels++; }
}
assert.ok(duplicateLevels > 0 && max <= facts.maxCandidates,'Complete source-ordered candidate lists fit the native cap.');
const native = files['src/domain/gameplay/native-learning.js'];
assert.ok(!native.includes('supportedMove') && !native.includes('move-learning-declined-full-slots') && !native.includes('Math.random'));
precedes(native,'actor.growth.level = next.level','const candidates = learningCandidates');
precedes(native,'if (value(actor.growth.totalExperience) < next.cumulativeExperience) break','if (!compactMoves(actor))');
precedes(native,'if (!compactMoves(actor))','const beforeGrowth = clone(actor.growth)');
assert.ok(native.includes('actor.moves.slots.slice(empty).every(slot => slot === null)'));
assert.equal((native.match(/draw\(context\.state,candidates\.length\)/g) ?? []).length,1);
assert.ok(native.includes('link.slice(link.indexOf(id))') && native.includes('currentPp: catalogs.effects.getMove(moveId).numeric.pp'));
assert.ok(native.includes('context.state.pendingResult = {') && native.includes("kind: 'choice-paused'"));
assert.ok(files['src/domain/gameplay/growth.js'].includes("{ kind: 'turn',sourceActorId: actor.actorId }") && !files['src/domain/gameplay/growth.js'].includes('[actor.actorId]'));
assert.ok(files['src/domain/gameplay/hooks.js'].includes("sourceActorId: null") && files['src/domain/gameplay/hooks.js'].includes("kind: 'prompt'"));
const settlement = files['src/domain/gameplay/expedition.js'].slice(files['src/domain/gameplay/expedition.js'].indexOf('export function settleExpedition'));
precedes(settlement,'processLearning(','pokemon.growth = clone(actor.growth)');
const award = files['src/domain/gameplay/damage-resolution.js'];
assert.ok(award.includes('sourceFrame: clone(session.scheduler.continuation)') && award.includes('experienceBefore: clone(actor.growth.totalExperience)'));
assert.ok(native.includes('actor.growth.totalExperience = clone(pending.experienceBefore)') && native.includes("else context.emit({ type: 'message',messageId: 'experience-gained' })"));
const proof = files['src/domain/state/move-learning-proof.js'];
for (const field of ['beforeGrowth','candidateRng','movesFingerprint','resumeFrameFingerprint','actorOrder','actorIndex','schedulerTag','casualties','sourceActorId','pendingExperience','awards','sourceFrame','sourceRound','experienceBefore','gainsBefore']) assert.ok(proof.includes(field),field);
assert.ok(proof.includes('randomInteger(l.candidateRng,candidates.length)') && proof.includes('sampled.state') && proof.includes('fingerprint(f.action) !== fingerprint(c.action)'));
assert.ok(files['content/state/move-learning.js'].includes('forgottenProblem(session,catalogs,state.revision,state.roster)') && files['content/state/move-learning.js'].includes('learningProblem(state,catalogs)'));
// Inspect real producer/consumer ASTs. No predicates/modules are evaluated.
const ast = path => parse(files[path],{ ecmaVersion: 'latest',sourceType: 'module' });
function nodes(node,predicate) {
  const found = [];
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.type === 'string' && predicate(value)) found.push(value);
    for (const child of Object.values(value)) if (Array.isArray(child)) child.forEach(walk); else if (child && typeof child === 'object') walk(child);
  }
  walk(node); return found;
}
const fn = (tree,name) => { const matches = nodes(tree,node => node.type === 'FunctionDeclaration' && node.id.name === name); assert.equal(matches.length,1,name); return matches[0]; };
const sourceOf = (path,node) => files[path].slice(node.start,node.end);
const call = (node,name) => nodes(node,item => item.type === 'CallExpression' && (item.callee.name === name || item.callee.type === 'MemberExpression' && item.callee.property.name === name));
const literalJoin = (node,left,right) => node.type === 'BinaryExpression' && node.operator === '===' && sourceOf('src/domain/state/move-learning-proof.js',node.left) === left && node.right.type === 'Literal' && node.right.value === right;
const conjuncts = node => node.type === 'LogicalExpression' && node.operator === '&&' ? [...conjuncts(node.left),...conjuncts(node.right)] : [node];
const hooksPath = 'src/domain/gameplay/hooks.js',hooksAst = ast(hooksPath);
for (const [kind,producer] of [['exit','takeStairs'],['give-up','settleExpedition']]) {
  const branches = nodes(hooksAst,node => node.type === 'IfStatement' && sourceOf(hooksPath,node.test) === `action.kind === '${kind}'`);
  assert.equal(branches.length,1,`Actual ${kind} action branch`);
  const body = branches[0].consequent;
  assert.equal(call(body,producer).length,1); assert.equal(call(body,'terminalCompletion').length,1);
  assert.ok(call(body,producer)[0].end < call(body,'terminalCompletion')[0].start,`${kind} finishes its genuine producer before returning the owned completed prompt`);
}
const terminal = nodes(hooksAst,node => node.type === 'VariableDeclarator' && node.id.name === 'terminalCompletion')[0].init;
assert.equal(terminal.body.type,'ConditionalExpression'); assert.equal(call(terminal.body.test,'pendingLearning').length,1);
assert.ok(sourceOf(hooksPath,terminal.body.test).includes("learning?.origin.kind === 'settlement'"));
assert.deepEqual(terminal.body.consequent.properties.map(row => [row.key.name,row.value.value]),[['kind','prompt'],['completed',true],['movement',false],['leaderChanged',false],['stop','none']]);
const enginePath = 'src/domain/turns/engine.js',engineAst = ast(enginePath),effect = fn(engineAst,'applyEffectResult');
const completed = nodes(effect,node => node.type === 'IfStatement' && sourceOf(enginePath,node.test).includes('result.completed === true'))[0];
assert.ok(completed); const completedSource = sourceOf(enginePath,completed.consequent);
for (const guard of ['context.state.contentRevision !== MOVE_LEARNING_REVISION',"frame.stage !== 'decision'",'frame.step !== 0','frame.replanCount !== 0',"learning.origin.kind !== 'settlement'","frame.active?.side !== 'team'","actor?.actorId !== session.leaderActorId","frame.special","frame.flushing","terminal-learning-result"]) assert.ok(completedSource.includes(guard),guard);
precedes(completedSource,"frame.stage = 'after'; frame.step = 0",'sealLearningFrame(context)');
precedes(completedSource,'sealLearningFrame(context)','checkPrompt(result.kind, context)');
assert.equal(call(completed.consequent,'checkPrompt').length,1);
const ordinaryGuard = effect.body.body.find(node => node.type === 'ExpressionStatement' && call(node,'checkPrompt').length);
assert.ok(ordinaryGuard && ordinaryGuard.start > completed.end,'Normal cursor/done checks still use checkPrompt');
const begin = fn(engineAst,'beginAction'),settle = fn(engineAst,'settleEffect');
assert.equal(call(begin,'startAction').length,1); assert.equal(call(begin,'settleEffect').length,1);
assert.equal(call(settle,'applyEffectResult').length,1); assert.equal(call(settle,'forcedLoss').length,1);
assert.ok(files['src/domain/turns/support.js'].includes("if (kind !== 'prompt' && context.state.session && paused") && files['src/domain/turns/support.js'].includes('turn-prompt-result'));
const validatePath = 'src/domain/state/validate.js',validateAst = ast(validatePath),validate = fn(validateAst,'validateCampaign');
const ownerProof = nodes(validate,node => node.type === 'IfStatement' && sourceOf(validatePath,node.test).includes('state.session?.forgottenMoves'))[0];
assert.ok(ownerProof && sourceOf(validatePath,ownerProof.test).includes('state.contentRevision === MOVE_LEARNING_REVISION'));
assert.ok(call(validate,'inspectShape')[0].end < ownerProof.start,'Complete shape preflight precedes raw callbacks');
precedes(sourceOf(validatePath,ownerProof),'freezeData(state)','content.policies.profile(state)');
assert.ok(sourceOf(validatePath,ownerProof).includes('if (issues.length || requirements.size) return failure'));
const ownerSource = files[validatePath].slice(files[validatePath].indexOf("if (name === 'MoveSlot'"));
assert.ok(ownerProof.end < files[validatePath].indexOf("if (name === 'MoveSlot'"));
assert.ok(ownerSource.includes('^\\/session\\/forgottenMoves\\/(0|[1-9]\\d*)\\/moveSlot$'));
for (const join of ['retired?.moveSlot === value','state.session?.actors[retired.actorId]',"retiredActor?.binding.kind === 'roster' ? retiredActor.binding.pokemonId : null",'rosterOwner ?? retiredOwner ??','previous && previous !== owner','moveOwners.set(fields.moveSlotId, owner)']) assert.ok(ownerSource.includes(join),join);
assert.ok(files['src/domain/state/move-learning-schema.js'].includes("moveSlot: ref('MoveSlot')") && files['src/domain/state/structure.js'].includes('visitor(shape.name, value, path)'));
assert.ok(files['src/domain/gameplay/actors.js'].includes('permanent ? clone(permanent.moves)'));
assert.ok(native.includes('for (const slot of actor.moves.slots) if (slot && removed.has(slot.moveSlotId))') && native.includes('moveSlot: clone(slot)'));
assert.ok(proof.includes('fingerprint(pokemon) !== fingerprint(entrant)') && proof.includes('original && original.moveId !== slot.moveId'));
// The exact retired actor owns both original-entry and newly allocated tail slots:
// original existence only rejects a mismatched move, and is not an alias gate.
assert.ok(!ownerSource.includes('original') && proof.includes("pokemon.pokemonId).length !== 1"));
const proofPath = 'src/domain/state/move-learning-proof.js',proofAst = ast(proofPath),pass = fn(proofAst,'learningPass');
for (const [passName,side] of [['team','team'],['wild','wild']]) {
  const arm = nodes(pass,node => node.type === 'IfStatement' && literalJoin(node.test,'c.pass',passName))[0];
  assert.equal(arm.consequent.type,'ReturnStatement');
  assert.ok(conjuncts(arm.consequent.argument).some(node => literalJoin(node,'ref.side',side)),`Foreign ${side === 'team' ? 'wild' : 'team'} side cannot satisfy the actual ${passName} return: mandatory AST conjunct`);
  assert.ok(sourceOf(proofPath,arm).includes('c.slotIndex === ref.slot+1'));
}
const leaderArm = nodes(pass,node => node.type === 'IfStatement' && sourceOf(proofPath,node.test) === '!c.special')[0];
assert.ok(conjuncts(leaderArm.consequent.argument).some(node => literalJoin(node,'ref.side','team')));
const followerArm = nodes(pass,node => node.type === 'IfStatement' && literalJoin(node.test,'c.pass','followers'))[0];
const followerReturn = nodes(followerArm,node => node.type === 'ReturnStatement')[0];
assert.ok(conjuncts(followerReturn.argument).some(node => literalJoin(node,'ref.side','team')));
for (const join of ['captured.slot === ref.slot','captured.actorId === ref.actorId','c.slotIndex === 0','c.followerIndex <= c.followerOrder.length',"parent.side === 'team'",'learningRef(s,parent)','c.special.index === ref.slot']) assert.ok(sourceOf(proofPath,pass).includes(join),join);
const reference = sourceOf(proofPath,fn(proofAst,'learningRef'));
for (const join of ['ids[ref.slot] === ref.actorId',"a.affiliation !== 'team' : a.affiliation === 'team'","a.placement.mapId === s.floor.mapId","ids[ref.slot] === null","a.resources.hp === 0"]) assert.ok(reference.includes(join),join);
const flushProof = sourceOf(proofPath,fn(proofAst,'learningFlush'));
for (const join of ["c.active?.side === 'team'",'learningRef(s,c.active)','c.slotIndex === 0','next <= rank','index < flush.index','index > flush.index','!a.speed.movementPending','!a.speed.endEffectsPending']) assert.ok(flushProof.includes(join),join);
const producerSource = files[enginePath];
for (const join of ["const side = frame.pass; const slots = side === 'team' ? scheduler.teamSlots : scheduler.wildSlots",'slotAt(session, side, frame.slotIndex++)','frame.followerOrder[frame.followerIndex++]','select(frame, ref, true)',"slotAt(session, 'wild', index - scheduler.teamSlots.length)",'actorAt(session, ref)?.speed.petrifiedSwap','frame.special = { leader: ref, leaderChanged: frame.leaderChanged, index: 0 }']) assert.ok(producerSource.includes(join),join);
const pc = sourceOf(proofPath,fn(proofAst,'learningPc'));
for (const join of ['learningPass(s)','learningPass(s,true)','learningFlush(s)',"c.active?.side === 'team'",'c.action.actorId === s.leaderActorId','c.slotIndex <= s.scheduler.teamSlots.length','!follower.speed.endEffectsPending','c.active?.actorId !== sourceId','!c.special || !!a?.speed.petrifiedSwap']) assert.ok(pc.includes(join),join);
const conversion = files['src/persistence/opening-compatibility.js'];
assert.ok(conversion.includes('validateCampaign(snapshot, predecessor)'));
precedes(conversion,'validateCampaign(snapshot, predecessor)','recordLegacyUnpaidPrefix(draft');
assert.ok(files['src/domain/state/move-learning-prefix.js'].includes('sourceContentRevision === BRONZE_JOBS_REVISION'));
assert.ok(files['src/application/move-learning.js'].includes('forgottenSlots(actor,slot.moveSlotId)') && files['src/application/move-learning.js'].includes('view.ownsPanel(token)'));
precedes(files['src/shell/application.js'],"snapshot.pendingResult?.kind === 'move-learn-choice'",'snapshot.steel?.rewardChoice');
const budget = { opportunity: 1500+1700+12+48+133+401+0+2+2,flush: 1700+12+48+133+401+2+2+2,empty: 1360+48+133+401+2+2 };
assert.deepEqual(budget,{ opportunity: 3798,flush: 2300,empty: 1946 });
assert.ok(budget.opportunity <= 3800 && budget.flush <= 2300 && budget.empty <= 1950 && 3800 < 4096);
console.log(`Move-learning source/AST audit: ${learned.records.length} complete learnsets, ${duplicateLevels} multiple-candidate levels (max ${max}); exact source pin, native producer/completed-terminal-prompt/retired-roster-owner/foreign-side-negative/pass-obligation AST joins, rollback/PC/UI and 3798/2300/1946 whole-chunk bounds. No game execution.`);
