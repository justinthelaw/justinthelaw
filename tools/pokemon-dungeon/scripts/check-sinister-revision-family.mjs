// AST/source only. Never import or evaluate a game module or saved state.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'acorn';
const game = new URL('../../../games/pokemon-dungeon-reimagined/',import.meta.url);
const read = path => readFile(new URL(path,game),'utf8');
const parseSource = source => parse(source,{ecmaVersion:'latest',sourceType:'module'});
const original = await read('src/domain/adventure.js'),codec = await read('src/persistence/codec.js');
assert.equal(createHash('sha256').update(original).digest('hex'),'f974e72541c90b59e57e28b698110e8f063bffb20e8de29f2f4bf16ffa067ab5','Exact accepted6ec Adventure owner');
assert.equal(createHash('sha256').update(codec).digest('hex'),'dcf16b090934e1baabee03b8054c415ef5493e60004e9b2aca2277ffac7f6852','Exact original codec and hash-before-conversion owner');
const adventure = await read('src/domain/sinister-adventure.js'),family = await read('src/persistence/sinister-codec.js');
function fn(source,name) {
  const node = parseSource(source).body.map(row => row.type === 'ExportNamedDeclaration' ? row.declaration : row).find(row => row?.type === 'FunctionDeclaration' && row.id.name === name);
  assert.ok(node,name); return source.slice(node.start,node.end);
}
for (const name of ['commandResultShape','sealDraft']) assert.equal(fn(adventure,name),fn(original,name));
function auditAdventure(source) {
  const body = fn(source,'createSinisterAdventure');
  for (const part of ['options.escort.content.contentRevision !== ESCORT_WORK_REVISION','options.sinister.content.contentRevision !== SINISTER_WORK_REVISION',"Object.getOwnPropertyDescriptor(value,'contentRevision')",'validateCampaign(options.initial, initialOwner.content)',"snapshot.session?.scheduler.kind === 'sinister-continuing'",'draft.contentRevision !== snapshot.contentRevision',"'revision-transition-yield'",'nextOwner !== owner','owner !== options.escort','nextOwner !== options.sinister',"intent.type !== 'enterDungeon'","intent.dungeonId !== 'sinister-woods'",'snapshot.session || snapshot.pendingScene || snapshot.pendingResult','snapshot.earlyWork?.returned','snapshot.earlyWork?.reward','snapshot.earlyWork?.clientPrompt',"snapshot.friends?.phase !== 'sinister-ready'",'MAIN.chapter !== 5','MAIN.step !== 9','validateCampaign(draft, nextOwner.content)']) assert.ok(body.includes(part),part);
  // Remove only the reviewed routing/one-way adoption additions; all original
  // epoch, transaction, callback validation, cap and atomic publish code is exact.
  let restored = body.replace('createSinisterAdventure','createAdventure');
  const start = restored.indexOf('\n  if (options.escort.content.contentRevision'),end = restored.indexOf('\n  if (!checked.ok)',start);
  assert.ok(start>0 && end>start);
  restored = restored.slice(0,start)+'\n  const checked = validateCampaign(options.initial, options.content);'+restored.slice(end);
  restored = restored.replace("      const owner = ownerFor(snapshot);\n      if (!owner) return failure('content-blocked','campaign-owner');\n",'');
  restored = restored.replace(" || snapshot.session?.scheduler.kind === 'sinister-continuing'",'');
  restored = restored.replace("        if (applied.resumeDungeon && draft.contentRevision !== snapshot.contentRevision) throw new TurnFault('content-blocked','revision-transition-yield');\n",'');
  const nextStart = restored.indexOf('      const nextOwner = ownerFor(draft);'),nextEnd = restored.indexOf('\n      if (!validated.ok)',nextStart);
  assert.ok(nextStart>0 && nextEnd>nextStart);
  restored = restored.slice(0,nextStart)+'      const validated = validateCampaign(draft, options.content);'+restored.slice(nextEnd);
  restored = restored.replaceAll('owner.handlers','options.handlers').replaceAll('owner.turns','options.turns').replaceAll('owner.advanceTurns','(options.advanceTurns ?? advanceTurns)');
  assert.equal(restored,fn(original,'createAdventure'),'Every non-routing Adventure statement remains exact');
}
function auditCodec(source) {
  parseSource(source);
  for (const part of ['escort.contentRevision !== ESCORT_WORK_REVISION','sinister.contentRevision !== SINISTER_WORK_REVISION','Object.freeze([...earlier])',"Object.getOwnPropertyDescriptor(state,'contentRevision')", "Object.hasOwn(descriptor,'value')",'validateSave(state,content)','encodeSave(state,content,savedAt)','if (!withinSaveLimit(text))', 'JSON.parse(text)','migrateSave(parsed)','decodeSave(text,sinister) : decodeSave(text,escort,compatibility)']) assert.ok(source.includes(part),part);
  assert.ok(source.indexOf('if (!withinSaveLimit(text))') < source.indexOf('JSON.parse(text)'));
  assert.ok(!/\.contentRevision\s*=(?!=)|\.convert\(|prepareTransaction\(|localStorage|indexedDB|\.dispatch\(/.test(source),'Family does not rewrite, convert early, dispatch or persist');
}
auditAdventure(adventure); auditCodec(family);
for (const [from,to] of [[" || snapshot.session?.scheduler.kind === 'sinister-continuing'",''],['snapshot.session || snapshot.pendingScene || snapshot.pendingResult','false'],["intent.dungeonId !== 'sinister-woods'",'false'],["'revision-transition-yield'","'unowned-inline-transition'"]]) assert.throws(() => auditAdventure(adventure.replace(from,to)),undefined,from);
for (const [from,to] of [['decodeSave(text,sinister) : decodeSave(text,escort,compatibility)','decodeSave(text,sinister,compatibility)'],['if (!withinSaveLimit(text))','if (false)']]) assert.throws(() => auditCodec(family.replace(from,to)),undefined,from);
async function scan(dir) {
  for (const row of await readdir(new URL(dir,game),{withFileTypes:true})) {
    const path = dir+row.name;
    if (row.isDirectory()) { if (row.name !== 'vendor') await scan(path+'/'); continue; }
    if (!path.endsWith('.js')) continue;
    for (const node of parseSource(await read(path)).body) assert.ok(!/sinister-(?:adventure|codec)\.js$/.test(node.source?.value ?? ''),`Revision family remains unselected: ${path}`);
  }
}
await scan('src/'); await scan('content/');
console.log('Sinister revision family source audit: original6ec codec/Adventure bytes, exact non-routing transaction body, descriptor-only bounded routing, original-envelope codec delegation, one-way real-ground transition/yield, six negative source cases; no selected caller or game execution.');
