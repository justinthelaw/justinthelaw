// Independent static acceptance for the owner's Roux brief; no game execution.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import * as acorn from 'acorn';
import { decodePng } from '../art/blue/native-format.mjs';
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
// Read move routes as inert JSON. A valid atlas is not enough: the caller uses
// flag2 to launch cast effects and flag1 to release the presentation wait.
const motionSource = await readFile(new URL('src/blue/render-move-motion-data.js',game),'utf8');
const motionMatch = motionSource.match(/export const MOVE_MOTION_FACTS=(\{[^\n]+\});/);
assert(motionMatch,'Move routes must remain a static JSON literal');
const motionFacts = JSON.parse(motionMatch[1]);
const directions = [[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]];
const authoredActions = new Set([1,2,3,12]);
for(const moveId of new Set(['regular-attack','move-struggle','bide-release',...roux.learnset.map(([,id])=>id)])) {
  const route=motionFacts[moveId];assert(route,`Roux move ${moveId}: missing presentation route`);
  const animation=route.overrides['pokemon-roux']??route.animation;
  // These selectors rotate the walking pose in the presentation owner. They
  // do not select a sprite animation or require a frame-triggered cast flag.
  if(animation===98 || animation===99)continue;
  assert(authoredActions.has(animation),`Roux move ${moveId}: unauthored action selector ${animation}`);
  for(const [direction,sequence] of sprite.animations[animation].entries()) {
    const label=`Roux ${moveId} direction ${direction}`;
    assert(sequence.some(frame=>frame[0]===32+direction),`${label}: action never uses the attack artwork`);
    let elapsed=1,castAt=null,releaseAt=null;
    for(const frame of sequence) {
      if(frame[6]&2 && castAt===null)castAt=elapsed;
      if(frame[6]&1 && releaseAt===null)releaseAt=elapsed;
      elapsed+=frame[1];
    }
    assert(releaseAt!==null && releaseAt<elapsed,`${label}: missing release marker before recovery`);
    if(route.cast)assert(castAt!==null && castAt<releaseAt,`${label}: cast must launch before release`);
  }
}
for(const animation of [...authoredActions,6])for(const [direction,sequence] of sprite.animations[animation].entries()) {
  const label=`Roux animation ${animation} direction ${direction}`,[dx,dy]=directions[direction];
  assert(sequence.reduce((sum,frame)=>sum+frame[1],0)<=36,`${label}: action is too slow`);
  assert.deepEqual(sequence.at(-1).slice(2),[0,0,0,0,0],`${label}: recovery must restore the ground anchor without action flags`);
  for(const frame of sequence) {
    assert.equal(frame[0]%8,direction,`${label}: pose faces another direction`);
    assert(frame.slice(2,6).every(offset=>Math.abs(offset)<=4),`${label}: body or shadow escapes its bounded action`);
    assert(frame[2]*dy===frame[3]*dx,`${label}: body moves across its facing`);
    assert.deepEqual(frame.slice(2,4),frame.slice(4,6),`${label}: shadow detaches from ground contact`);
    assert(frame[6]>=0 && frame[6]<=3,`${label}: unsupported frame flags`);
  }
}
for(const [direction,sequence] of sprite.animations[sprite.clips.walk.animation].entries()) {
  const label=`Roux walk direction ${direction}`,rows=sequence.map(frame=>Math.floor(frame[0]/8));
  assert(rows.includes(0) && rows.includes(2) && rows.includes(3),`${label}: missing contact or opposite stride`);
  assert(sequence.every(frame=>frame[0]%8===direction && frame.slice(2).every(value=>value===0)),`${label}: ungrounded or misdirected walking frame`);
  const ticks=sequence.reduce((sum,frame)=>sum+frame[1],0);
  assert(ticks>=24 && ticks<=36,`${label}: cadence falls outside reviewed small-body references`);
}
for(const [direction,sequence] of sprite.animations[sprite.clips['hit-light'].animation].entries()) {
  const [dx,dy]=directions[direction],label=`Roux recoil direction ${direction}`;
  assert.equal(sequence.reduce((sum,frame)=>sum+frame[1],0),10,`${label}: hit reaction must remain brief`);
  assert(sequence.some(frame=>frame[2]*dx+frame[3]*dy<0),`${label}: missing recoil away from facing`);
  assert(sequence.every(frame=>frame[6]===0),`${label}: a hit reaction must not cast or release an action`);
}
assert.equal(sprite.shadowSize,1,'Roux uses the same small-body shadow as Eevee and Skitty');
// Inspect the shipped pixels independently of the packing algorithm. Hash and
// rectangle checks alone admitted the detached feet and cropped face regression.
const texture = decodePng(await readFile(new URL('assets/roux/pokemon-roux.png',game)));
assert.deepEqual([texture.width,texture.height],[256,232]);
assert.deepEqual([sprite.width,sprite.height],[texture.width,texture.height]);
const palette = new Set();
function pixelGeometry([left,top,width,height],label) {
  const mask = new Uint8Array(width*height);
  let count=0,minX=width,minY=height,maxX=-1,maxY=-1,sumX=0,sumY=0;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const at=((top+y)*texture.width+left+x)*4,alpha=texture.data[at+3];
    assert(alpha===0 || alpha===255,`${label}: partial alpha blurs the pixel edge`);
    if(!alpha)continue;
    palette.add(texture.data[at]*65536+texture.data[at+1]*256+texture.data[at+2]);
    mask[y*width+x]=1;count++;sumX+=x;sumY+=y;
    minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  }
  assert(count>0,`${label}: empty artwork`);
  const visited = new Uint8Array(mask.length);
  let components=0;
  for(let start=0;start<mask.length;start++) {
    if(!mask[start] || visited[start])continue;
    components++;visited[start]=1;
    const pending=[start];
    while(pending.length) {
      const index=pending.pop(),x=index%width,y=Math.floor(index/width);
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
        const nextX=x+dx,nextY=y+dy,next=nextY*width+nextX;
        if(nextX<0 || nextY<0 || nextX>=width || nextY>=height || !mask[next] || visited[next])continue;
        visited[next]=1;pending.push(next);
      }
    }
  }
  return {mask,count,components,minX,minY,maxX,maxY,width:maxX-minX+1,height:maxY-minY+1,centerX:sumX/count,centerY:sumY/count};
}
const bodyGeometry = sprite.poses.map((pose,index) => {
  const label=`Roux body pose ${index}`;
  assert.equal(pose.length,6);assert(pose.every(Number.isInteger));
  assert.deepEqual(pose.slice(2,4),[32,32],`${label}: body cell dimensions changed`);
  const geometry=pixelGeometry(pose,label);
  assert.equal(geometry.components,1,`${label}: detached opaque pixel cluster`);
  return geometry;
});
for(const [index,geometry] of bodyGeometry.entries()) {
  const label=`Roux body pose ${index}`,pose=sprite.poses[index];
  assert(geometry.minX>=1 && geometry.minY>=1 && geometry.maxX<=30 && geometry.maxY<=30,`${label}: artwork touches the cell edge`);
  assert(Math.abs(geometry.maxY+pose[5])<=1,`${label}: feet drift from the ground anchor`);
}
for(const [direction,sequence] of sprite.animations[sprite.clips.idle.animation].entries()) {
  assert(sequence.length>=2,`Roux idle direction ${direction}: missing breathing frame`);
  const firstFrame=sequence[0],firstPose=sprite.poses[firstFrame[0]],first=bodyGeometry[firstFrame[0]];
  for(const frame of sequence.slice(1)) {
    const label=`Roux idle direction ${direction}`,pose=sprite.poses[frame[0]],next=bodyGeometry[frame[0]];
    assert.deepEqual([pose[4]+frame[2],pose[5]+frame[3]],[firstPose[4]+firstFrame[2],firstPose[5]+firstFrame[3]],`${label}: frame anchor changes`);
    assert(Math.abs(next.width-first.width)<=2 && Math.abs(next.height-first.height)<=2,`${label}: silhouette size jumps`);
    assert(Math.abs(next.centerX-first.centerX)<=1.25 && Math.abs(next.centerY-first.centerY)<=1.25,`${label}: body center jumps`);
    assert(next.count/first.count>=0.85 && next.count/first.count<=1.15,`${label}: body area jumps`);
    let changed=0,union=0;
    for(let index=0;index<first.mask.length;index++) { if(first.mask[index]!==next.mask[index])changed++;if(first.mask[index] || next.mask[index])union++; }
    assert(changed/union<=0.2,`${label}: too much silhouette motion for a calm idle`);
  }
}
assert(sprite.portraits.normal && sprite.portraits.happy && sprite.portraits.shocked,'Roux requires normal, happy and awakening shocked portrait expressions');
for(const [emotion,rect] of Object.entries(sprite.portraits)) {
  const label=`Roux ${emotion} portrait`,geometry=pixelGeometry(rect,label);
  assert(geometry.minX>=2 && geometry.maxX<=37 && geometry.minY>=2,`${label}: ears or cheeks lack breathing room`);
  assert(geometry.width>=28 && geometry.width<=36 && geometry.height>=32,`${label}: face scale does not match the portrait window`);
  assert(Math.abs((geometry.minX+geometry.maxX)/2-19.5)<=1,`${label}: face is not horizontally centered`);
}
assert(palette.size<=16,`Roux artwork exceeds its compact 16-color palette: ${palette.size}`);
const source = await readFile(new URL(art.source.path,new URL('../../../',import.meta.url))); assert.equal(hash(source),art.source.sha256);
console.log('Roux brief verified: starter/quiz unlock, non-evolving growth, canine/Ground moves, original rule preservation, menu-first closure, connected sprites, stable idle, centered portraits, palette and budgets. Static only.');
