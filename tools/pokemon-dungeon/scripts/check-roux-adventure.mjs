// Independent static acceptance for the owner's Roux brief; no game execution.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import * as acorn from 'acorn';
const game = new URL('../../../games/pokemon-dungeon-reimagined/', import.meta.url);
const json = async (file, root = game) => JSON.parse(await readFile(new URL(file, root), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const data = await json('content/blue-opening.json');
const authored = await json('../content/roux-adventure.json', import.meta.url);
const roux = data.species['pokemon-roux'];
assert.deepEqual(data.starterIds.slice(-1), ['pokemon-roux']); assert.equal(data.starterIds.length, 17);
assert.deepEqual(roux.types, ['Normal', 'Ground']); assert.deepEqual(roux.abilities, ['Pickup', 'Keen Eye']);
assert.equal(authored.evolves, false); assert.deepEqual(roux, authored.species);
// Low Kick's body coefficient is Q8, not a unitless body-size ordinal.
assert.equal(roux.lowKickMultiplier, data.species['pokemon-133'].lowKickMultiplier, 'Roux must use the admitted small-body Q8 coefficient');
assert.deepEqual(roux.learnset.filter(([level]) => level <= 5), [[1,'move-bite'],[1,'move-growl']]);
assert.deepEqual(roux.learnset[2], [6,'move-dig']);
for (const id of ['move-sand-attack','move-mud-slap','move-mud-sport','move-earth-power','move-howl','move-quick-attack','move-headbutt','move-crunch','move-take-down','move-double-edge']) assert(roux.learnset.some(([,move]) => move === id), `Missing requested Ground/canine move: ${id}`);
assert.equal(roux.growth.length, 100);
for (const [level, expected] of [[5,[30,10,8,9,9]],[30,[85,40,38,37,37]],[50,[105,50,44,47,43]],[100,[155,75,61,72,60]]]) {
  assert.deepEqual(roux.baseStats.map((base, stat) => base + roux.growth.slice(0,level).reduce((sum,row) => sum + row[stat+1],0)), expected, `Non-evolving growth at ${level}`);
}
let priorExperience = -1, priorLevel = 0;
for (const row of roux.growth) { assert.equal(row.length,6); assert(row.every(Number.isInteger)); assert(row[0] > priorExperience); assert(row.slice(1).every(increment => increment >= 0 && increment <= 3)); priorExperience = row[0]; }
for (const [level,id] of roux.learnset) { assert(level >= priorLevel && level <= 100); priorLevel = level; assert(data.moves[id], `Missing Roux move: ${id}`); }
assert.deepEqual(data.moves['move-dig'].effects,[{op:'charge',status:'dig',turns:1},{op:'normal-damage',multiplier:2}]);
assert.deepEqual(data.moves['move-howl'].effects,[{op:'stat-stage',stat:'attack',delta:1,recipient:'user'}]);
assert.equal(data.moves['move-earth-power'].type,'ground');
// This pin is the complete selected runtime rule payload at merged main e82182f,
// not a fingerprint regenerated from the new exporter. Only authored additions
// are stripped: every original species, move, floor and timer must still match.
const original = Object.fromEntries(['version','wildSpawn','starterIds','species','moves','floors','timers'].map(key => [key,data[key]]));
original.starterIds = data.starterIds.filter(id => id !== 'pokemon-roux');
original.species = Object.fromEntries(Object.entries(data.species).filter(([id]) => id !== 'pokemon-roux'));
original.moves = Object.fromEntries(Object.entries(data.moves).filter(([id]) => !['move-dig','move-howl','move-crunch','move-earth-power'].includes(id)));
assert.equal(hash(JSON.stringify(canonical(original))), '83666159c1c6666ff307960cbf019438a713cdcc8c9dc43a4ebc80b5a9665e63', 'Original selected rules changed beyond the Roux addition');
const algorithm = await json('content/onboarding/algorithm.json'), questions = await json('content/onboarding/questions.json'), results = await json('content/onboarding/results.json'), partners = await json('content/onboarding/partners.json');
assert.equal(questions.records.length,59); assert.equal(results.records.length,14); assert.equal(algorithm.natureOrder.length,14);
assert.equal(algorithm.finalQuestionId,'roux-treats');
const food = questions.records.find(question => question.id === algorithm.finalQuestionId);
assert(food.prompt.includes('treats')); assert.match(food.options[0].text,/Blueberries, chicken, and bananas/);
assert.equal(food.options[0].scores.playful,40);
// Seven other answers cannot overtake the explicit treat unlock: every original
// option grants at most four to any nature, and Roux question alternatives three.
const competitors = questions.records.filter(question => question.id !== food.id).flatMap(question => question.options.flatMap(option => Object.entries(option.scores).filter(([nature]) => nature !== 'playful').map(([,score]) => score)));
assert(Math.max(...competitors)*7 < food.options[0].scores.playful);
for (const id of ['roux-mischief','roux-energy']) assert(questions.records.find(question => question.id === id)?.options.some(option => option.scores.playful > 0));
assert.deepEqual(results.records.at(-1),authored.quiz.result);
assert.deepEqual(partners.pairs.filter(pair => pair.heroSpeciesId === 'pokemon-roux').map(pair => pair.partnerSpeciesId),partners.orderedPool);
const app = await readFile(new URL('src/blue/app.js',game),'utf8'), render = await readFile(new URL('src/blue/renderer.js',game),'utf8');
const ast = acorn.parse(app,{ecmaVersion:'latest',sourceType:'module'});
function variables(node) { if(!node || typeof node !== 'object')return [];return [...(node.type === 'VariableDeclarator' ? [node] : []),...Object.values(node).flatMap(value => Array.isArray(value) ? value.flatMap(variables) : value && typeof value === 'object' ? variables(value) : [])]; }
// Inspect the actual damage consumer rather than accepting a declared effect
// that never reaches fixed-point damage. This parses ASTs without execution.
const combat = acorn.parse(await readFile(new URL('src/blue/mechanics-combat.js',game),'utf8'),{ecmaVersion:'latest',sourceType:'module'});
const damageOwner = combat.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'damageAmount');
const multiplier = variables(damageOwner).find(node => node.id.name === 'multiplier')?.init;
function moveIds(node) {
  if(!node || typeof node !== 'object')return [];
  if(node.type === 'BinaryExpression' && node.operator === '===' && node.left.type === 'MemberExpression' && node.left.object.name === 'move' && node.left.property.name === 'id' && node.right.type === 'Literal')return [node.right.value];
  return Object.values(node).flatMap(value => Array.isArray(value) ? value.flatMap(moveIds) : value && typeof value === 'object' ? moveIds(value) : []);
}
function doubledMoves(node) {
  if(!node || node.type !== 'ConditionalExpression')return [];
  return [...(node.consequent.type === 'Literal' && node.consequent.value === 512 ? moveIds(node.test) : []),...doubledMoves(node.consequent),...doubledMoves(node.alternate)];
}
const doubled = new Set(doubledMoves(multiplier));
for(const move of Object.values(data.moves).filter(move => move.effects.some(effect => effect.op === 'charge') && move.effects.some(effect => effect.op === 'normal-damage' && effect.multiplier === 2))) assert(doubled.has(move.id), `Declared charge multiplier is missing from damage consumer: ${move.id}`);
const statTable = variables(combat).find(node => node.id.name === 'STAT_EFFECTS')?.init;
assert.equal(statTable?.type, 'ObjectExpression');
const statEffects = Object.fromEntries(statTable.properties.map(property => [property.key.name, property.value.elements.map(element => element.value)]));
const effectIds = new Set();
for(const stem of ['battle-effects','battle-effects-initial','battle-effects-extra']) for(const effect of (await json(`assets/blue/${stem}.json`)).effects) effectIds.add(effect.id);
for(const move of authored.moves) for(const effect of move.effects.flatMap(effect => effect.op === 'secondary' ? [effect.effect] : [effect])) {
  if(effect.op !== 'stat-stage')continue;
  const id = statEffects[effect.stat]?.[effect.delta > 0 ? 1 : 0];
  assert(effectIds.has(id), `Authored stat change lacks a shipped presentation: ${move.id}/${effect.stat}`);
}
// Floor-entry messages must reach the shared narration/message owner only on
// the unobscured foreground dungeon surface, and be retired with that scene.
const appFunctions = ast.body.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'main').body.body.filter(node => node.type === 'FunctionDeclaration');
const appFunction = name => appFunctions.find(node => node.id.name === name);
const publisher = appFunction('publishEntryPickup');
assert(publisher, 'Floor-entry Pickup must have a deferred message owner');
const publishGuard = app.slice(publisher.body.body[0].start, publisher.body.body[0].end);
assert(publishGuard.includes('!isDungeonSurface()') && publishGuard.includes('!foregroundEligible()'), 'Floor-entry Pickup must wait for the visible, unobscured dungeon');
assert(app.slice(publisher.start,publisher.end).includes('presentBattleCues('), 'Floor-entry Pickup must use shared live-message narration');
assert(app.slice(appFunction('clearLiveMessages').start,appFunction('clearLiveMessages').end).includes('entryPickupNotice = null'), 'Retiring live messages must retire pending floor-entry Pickup');
assert(app.slice(appFunction('isDungeonSurface').start,appFunction('isDungeonSurface').end).includes('!tutorials.length'), 'Tutorials must block floor-entry notice publication');
assert.equal(variables(ast).find(node => node.id.name === 'mode')?.init.value,'menu');
assert(!/mode\s*=\s*['"](?:title|opening)['"]/.test(app)); assert(!app.includes('beginOpening'));
assert(!render.includes('render-intro')); assert(!render.includes('INTRO_CLIENT')); assert(app.includes('Play as Roux'));
const html = await readFile(new URL('index.html',game),'utf8'); assert(html.includes("Pokémon Mystery Dungeon: Roux's Adventure")); assert(!html.includes('start-prompt'));
const distribution = await json('distribution.json');
for (const path of distribution.files) assert(!/(?:boot-cards|title(?:-bird|-letter|-prompt|-water)?\.(?:png|json)|post-interior|post-exterior|town-aerial|menu-(?:logo|delivery|mailbox)|render-intro)/.test(path), `Pre-menu resource still shipped: ${path}`);
assert(distribution.files.includes('assets/roux/pokemon-roux.png')); assert(distribution.totalBytes < 3*1024*1024);
const art = await json('assets/roux/manifest.json'), sprite = await json('assets/roux/pokemon-roux.json');
assert.equal(art.reference.petId,'pet_6acc6b6df5e48191b8f7acf7533d6f15'); assert.deepEqual(art.directions,['s','se','e','ne','n','nw','w','sw']);
assert.equal(sprite.schemaVersion,3); assert.equal(sprite.speciesId,'pokemon-roux'); assert.equal(sprite.poses.length,48);
assert(sprite.animations.length >= 28); assert(sprite.width*sprite.height*4 < 1024*1024);
for (const record of art.records) { const bytes=await readFile(new URL(`assets/roux/${record.path}`,game)); assert.equal(bytes.length,record.bytes); assert.equal(hash(bytes),record.sha256); }
for (const [x,y,width,height] of sprite.poses) assert(x>=0 && y>=0 && x+width<=sprite.width && y+height<=sprite.height);
for (const animation of sprite.animations) { assert.equal(animation.length,8); for (const sequence of animation) for (const frame of sequence) { assert.equal(frame.length,7); assert(frame.every(Number.isInteger)); assert(frame[0]>=0 && frame[0]<48 && frame[1]>0 && frame[1]<=255); } }
for (const [x,y,width,height] of Object.values(sprite.portraits)) assert(x>=0 && y>=0 && width===40 && height===40 && x+width<=sprite.width && y+height<=sprite.height);
const source = await readFile(new URL(art.source.path,new URL('../../../',import.meta.url))); assert.equal(hash(source),art.source.sha256);
console.log('Roux brief verified: starter/quiz unlock, non-evolving growth, canine/Ground moves, original rule preservation, menu-first closure, directional art and budgets. Static only.');
