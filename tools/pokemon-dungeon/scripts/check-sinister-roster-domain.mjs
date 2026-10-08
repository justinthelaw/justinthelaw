// Static source and factual catalog audit; never import or execute game code.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'acorn';
const root = new URL('../../../',import.meta.url),game = 'games/pokemon-dungeon-reimagined/';
const read = path => readFile(new URL(path,root),'utf8');
const json = async path => JSON.parse(await read(path));
const ast = text => parse(text,{ecmaVersion:'latest',sourceType:'module'});
const sha = text => createHash('sha256').update(text).digest('hex');
/** Inspect only static literal/object/array/Object.freeze AST data. */
function literal(node) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(row => { assert.equal(row.type,'Property'); assert.equal(row.computed,false); return [row.key.name ?? row.key.value,literal(row.value)]; }));
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && node.callee.object.name === 'Object' && node.callee.property.name === 'freeze' && node.arguments.length === 1) return literal(node.arguments[0]);
  throw new TypeError('Factual declaration is not finite static data.');
}
function constant(text,name) {
  const row = ast(text).body.find(row => row.type === 'ExportNamedDeclaration' && row.declaration?.type === 'VariableDeclaration' && row.declaration.declarations[0].id.name === name);
  assert(row,name); return literal(row.declaration.declarations[0].init);
}
function functionBody(text,name) {
  const row = ast(text).body.map(row => row.type === 'ExportNamedDeclaration' ? row.declaration : row).find(row => row?.type === 'FunctionDeclaration' && row.id.name === name);
  assert(row,name); return text.slice(row.start,row.end);
}
const mappingPath = game+'src/domain/gameplay/sinister-roster-mapping.js';
const rosterPath = game+'content/state/sinister-roster-domain.js';
const abilityPath = game+'content/state/sinister-ability-domain.js';
const mapping = await read(mappingPath),roster = await read(rosterPath),ability = await read(abilityPath);
// Newly reviewed unselected bodies have exact pins. A future live consumer or
// changed producer must separately qualify its source/ownership change.
const ownerPins = {
  [game+'content/authored/sinister-roster-facts.js']:'80537c5a778e209944e4d13497eb41d4a760419487a9a0c7905f5663b400de3e',
  [rosterPath]:'80f0202e88c03ca2e65f798f3a0fc366e38ea28e5d9bb7490f9aa685cf8d68bd',
  [mappingPath]:'4894c4860eaaa464445dd18c0a3d40ab61005f0bd448c5bd4a157b66e4c02435',
  [game+'content/authored/sinister-ability-domain-facts.js']:'6e86e48b86361d70799963a4a8264cb2b2bcce4ff1ebffee5066cd0027fd8a6f',
  [abilityPath]:'132bd207e1ffd23dcf9447a1b1a38610851bc3c3d97ef9b48b501a515654c596',
};
for (const [path,pin] of Object.entries(ownerPins)) assert.equal(sha(await read(path)),pin,path);
function originalWorkChecker(source) {
  const sceneConsumers = "const allowed = new Set([...names.map(name => `src/${name}.js`),'src/domain/state/early-campaign-scene-schema.js','src/domain/gameplay/early-campaign-scene-state.js']);";
  const abilityConsumer = " || path === 'content/state/sinister-ability-domain.js' && node.source.value === '../../src/domain/state/sinister-work-revision.js'";
  assert.equal(source.split(sceneConsumers).length,2);
  assert.equal(source.split(abilityConsumer).length,2);
  return source.replace(sceneConsumers,'const allowed = new Set(names.map(name => `src/${name}.js`));').replace(abilityConsumer,'');
}
const workChecker = await read('tools/pokemon-dungeon/scripts/check-sinister-work.mjs');
assert.equal(sha(originalWorkChecker(workChecker)),'e42d53fe6e54e14cafc0ef54ad4291546b235eb93402f289a01dcb51acfab7bd','The complete inherited work checker differs only by exact named unselected consumer allowances.');
assert.throws(() => originalWorkChecker(workChecker.replace("path === 'content/state/sinister-ability-domain.js'","path.startsWith('content/state/')")),undefined,'A broad state consumer allowance is rejected.');
async function inspectNewConsumers(directory) {
  for (const row of await readdir(new URL(game+directory,root),{withFileTypes:true})) {
    const path = directory+row.name;
    if (row.isDirectory()) { if (row.name !== 'vendor') await inspectNewConsumers(path+'/'); continue; }
    if (!row.name.endsWith('.js')) continue;
    const source = await read(game+path);
    for (const node of ast(source).body) {
      if (!['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration'].includes(node.type) || typeof node.source?.value !== 'string') continue;
      if (node.source.value.endsWith('/sinister-roster-domain.js')) assert(['src/domain/gameplay/sinister-roster-mapping.js','content/state/sinister-ability-domain.js'].includes(path),'Only the two exact new source-domain owners consume roster admission: '+path);
      if (node.source.value.endsWith('/sinister-ability-domain.js') || node.source.value.endsWith('/sinister-roster-mapping.js')) assert.fail('Unselected source-domain helper acquired an unaudited live consumer: '+path);
    }
  }
}
await inspectNewConsumers('src/'); await inspectNewConsumers('content/');
const mappingFacts = constant(await read(game+'content/authored/sinister-roster-facts.js'),'SINISTER_ROSTER_MAPPING_FACTS');
const domain = constant(await read(game+'content/authored/sinister-ability-domain-facts.js'),'SINISTER_ABILITY_DOMAIN_FACTS');
const areas = (await json('tools/pokemon-dungeon/content/friends/areas.json')).records;
const pairs = (await json(game+'content/onboarding/partners.json')).pairs;
const starters = (await json(game+'content/onboarding/profiles.json')).records;
const identities = await json(game+'content/species/identities.json');
const profiles = new Map();
for (const name of await readdir(new URL(game+'content/species/',root))) if (/^profiles-\d+\.json$/.test(name)) for (const profile of (await json(game+'content/species/'+name)).records) if (profile.formId === null) profiles.set(profile.speciesId,profile);
assert.equal(areas.length,58); assert.deepEqual(areas.map(row => row.nativeId),Array.from({length:58},(_,index) => index));
assert.equal(areas.reduce((sum,row) => sum+row.capacity,0),mappingFacts.capacity);
assert.equal(mappingFacts.capacity,413); assert.equal(pairs.length,129); assert.equal(starters.length,16);
assert.equal(new Set(pairs.map(row => `${row.heroSpeciesId}:${row.partnerSpeciesId}`)).size,129);
const starts = new Map(); let next = 0;
for (const area of areas) { starts.set(area.id,next); next += area.capacity; }
/** Independently compute the source first-free address for all original pairs.
 * This protects the two real shared-area cases and nonleader native slot zero. */
const shared = [];
for (const pair of pairs) {
  const hero = profiles.get(pair.heroSpeciesId),partner = profiles.get(pair.partnerSpeciesId),gift = profiles.get('pokemon-081');
  assert(hero && partner && gift); assert.notEqual(gift.friendAreaId,hero.friendAreaId); assert.notEqual(gift.friendAreaId,partner.friendAreaId);
  const heroAddress = starts.get(hero.friendAreaId),partnerAddress = starts.get(partner.friendAreaId)+(hero.friendAreaId === partner.friendAreaId ? 1 : 0);
  const giftAddress = starts.get(gift.friendAreaId);
  assert.equal(new Set([heroAddress,partnerAddress,giftAddress]).size,3);
  for (const [profile,address] of [[hero,heroAddress],[partner,partnerAddress],[gift,giftAddress]]) {
    const area = areas.find(row => row.id === profile.friendAreaId); assert(area && address >= starts.get(area.id) && address < starts.get(area.id)+area.capacity);
  }
  if (hero.friendAreaId === partner.friendAreaId) shared.push([pair.heroSpeciesId,pair.partnerSpeciesId]);
}
assert.deepEqual(shared,[['pokemon-052','pokemon-025'],['pokemon-300','pokemon-025']]);
assert(pairs.some(pair => starts.get(profiles.get(pair.heroSpeciesId).friendAreaId) > starts.get(profiles.get(pair.partnerSpeciesId).friendAreaId)),'Native team slot zero is not a reliable hero identity.');

const cacheSource = await read(game+'content/authored/sinister-cache-facts.js');
const cacheNode = ast(cacheSource).body.find(row => row.type === 'ExportNamedDeclaration').declaration.declarations[0].init.arguments[0];
const cache = literal(cacheNode),wild = new Set(),boss = new Set();
assert.equal(cache.floorFacts.length,13);
for (const floor of cache.floorFacts) for (const row of floor.rows) {
  if (row.publishedWeight === 0) { assert(domain.excludedZeroWeightNativeSpeciesIds.includes(row.nativeSpeciesId)); continue; }
  assert(row.publishedWeight > 0);
  const fact = cache.species.find(fact => fact.nativeSpeciesId === row.nativeSpeciesId && fact.level === row.level);
  assert(fact && fact.formId === null && fact.speciesId);
  (floor.localFloor === 13 ? boss : wild).add(fact.speciesId);
}
assert.deepEqual(domain.starterProfiles,[...new Set(starters.map(row => row.speciesId))].sort());
assert.deepEqual(domain.wildProfiles,[...wild].sort()); assert.deepEqual(domain.bossProfiles,[...boss].sort());
const bossMetadata = (await json(game+'content/campaign/bosses.json')).records.find(row => row.id === domain.boss.id);
assert(bossMetadata); assert.equal(domain.boss.floorId,'sinister-woods-floor-13');
for (const key of ['id','fixedRoomId','firstSceneId','retrySceneId','revisitSceneId','reachedFlagId','completeFlagId']) assert.equal(domain.boss[key],bossMetadata[key],key);
const floors = [];
for (const name of await readdir(new URL(game+'content/dungeons/',root))) if (/^floors-\d+\.json$/.test(name)) floors.push(...(await json(game+'content/dungeons/'+name)).records);
const bossFloor = floors.find(row => row.id === domain.boss.floorId);
assert(bossFloor && bossFloor.localFloor === 13 && bossFloor.dungeonId === 'sinister-woods' && bossFloor.fixedRoomId === domain.boss.fixedRoomId);
assert.equal(domain.giftProfile,'pokemon-081');
const all = new Set([...domain.starterProfiles,domain.giftProfile,...domain.wildProfiles,...domain.bossProfiles]);
assert.equal(all.size,35);
const abilityIds = [...new Set([...all].flatMap(id => profiles.get(id).abilityIds.filter(id => id !== null)))].sort((a,b) => a-b);
assert.deepEqual(domain.nativeAbilityIds,abilityIds); assert.equal(abilityIds.length,27);
const sync = identities.abilities.find(row => row.name === 'Synchronize');
assert.equal(domain.synchronizeNativeAbilityId,sync.originalId); assert(!abilityIds.includes(sync.originalId));
for (const name of ['Static','Cute Charm','Effect Spore']) assert(abilityIds.includes(identities.abilities.find(row => row.name === name).originalId),'Contact effects must remain in the domain: '+name);

function auditMapping(text) {
  const body = functionBody(text,'prepareSinisterRosterMapping');
  for (const part of ['validateCampaign(input,createEscortContent(catalogs))','if (!admitted.ok)','state.contentRevision !== ESCORT_WORK_REVISION','state.session','state.pendingScene','state.pendingResult','state.town.mapDefinitionId !== TEAM.map','main.chapter !== 5 || main.step !== 9','!checkSinisterRosterDomain(state,catalogs).ok','nativeOrdinaryRosterCapacity(catalogs,\'sinister-woods\')','start !== FACTS.capacity','row.nativeId !== index','while (nativeRecruitedId < area.end && occupied.has(nativeRecruitedId))','occupied.add(nativeRecruitedId)','a.nativeRecruitedId-b.nativeRecruitedId','members.findIndex(row => row.pokemonId === state.profile.heroId)','mappingRevision: state.revision+1','predecessorRevision: state.revision']) assert(body.includes(part),part);
  assert(body.indexOf('if (!admitted.ok)') < body.indexOf('FRIEND_AREA_FACTS.map'));
  assert(body.indexOf('checkSinisterRosterDomain') < body.indexOf('FRIEND_AREA_FACTS.map'));
  assert(body.includes('!Number.isSafeInteger(state.revision) || state.revision >= Number.MAX_SAFE_INTEGER'));
  assert(body.indexOf('state.revision >= Number.MAX_SAFE_INTEGER') < body.indexOf('FRIEND_AREA_FACTS.map'));
  assert(body.indexOf("role: 'hero'") < body.indexOf("role: 'partner'")); assert(body.indexOf("role: 'partner'") < body.indexOf("role: 'story-gift'"));
  assert(!/nativeRecruitedId:\s*(?:0|1|2)\b|Math\.random|\.emit\(|allocate\(|generalRandom|randomInteger|state\.[\w.]+\s*=(?!=)/.test(body),'No arbitrary address, RNG, allocation or canonical mutation.');
}
function auditDomains(rosterText,abilityText) {
  const r = functionBody(rosterText,'checkSinisterRosterDomain'),a = functionBody(abilityText,'checkSinisterAbilityDomain');
  for (const part of ['catalogs.onboarding.getPair','record.origin.kind === \'starter\'','record.origin.role === role','record.origin.selectionOutcomeId === state.profile.selection.outcomeId','gift.origin.grantId === FRIENDS.grant','same(Object.keys(state.roster).sort(),[...members].sort())','same(state.progress.recruitedHistory,[...originals','state.selectedPartyIds.includes(state.profile.partnerId)']) assert(r.includes(part),part);
  for (const part of ['checkSinisterRosterDomain(state,catalogs)','state.contentRevision === SINISTER_WORK_REVISION','session.dungeonId === \'sinister-woods\'','session.purpose.kind === \'story\'','!session.escortGuest','actor.overrides.types === null && actor.overrides.abilities === null && actor.overrides.form === null',"condition?.statusId === 'transformed'",'!profile.abilityIds.includes(FACTS.synchronizeNativeAbilityId)','FACTS.wildProfiles.includes(profile.id)','FACTS.bossProfiles.includes(profile.id)','sameForm(actor.identity,record.identity)']) assert(a.includes(part),part);
  for (const part of ['catalogs.campaign.getBoss(FACTS.boss.id)','catalogs.dungeons.getFloorById(FACTS.boss.floorId)','bossFloor.fixedRoomId === boss.fixedRoomId','boss[key] === FACTS.boss[key]','actor.binding.encounterId === boss.id']) assert(a.includes(part),part);
  assert(!/state\.[\w.]+\s*=(?!=)|actor\.[\w.]+\s*=(?!=)|\.emit\(|randomInteger|allocate\(/.test(r+a),'Domain admission never repairs or mutates actual input.');
}
auditMapping(mapping); auditDomains(roster,ability);
for (const [from,to] of [['validateCampaign(input,createEscortContent(catalogs))','input'],['while (nativeRecruitedId < area.end && occupied.has(nativeRecruitedId))','while (false)'],['a.nativeRecruitedId-b.nativeRecruitedId','a.pokemonId-b.pokemonId'],['members.findIndex(row => row.pokemonId === state.profile.heroId)','0']]) assert.throws(() => auditMapping(mapping.replace(from,to)),undefined,from);
assert.throws(() => auditMapping(mapping.replace('!Number.isSafeInteger(state.revision) || state.revision >= Number.MAX_SAFE_INTEGER','false')),undefined,'No exhausted revision receipt may be prepared.');
for (const [from,to] of [['same(state.progress.recruitedHistory,[...originals','same(state.progress.recruitedHistory.slice(0,3),[...originals'],['state.selectedPartyIds.includes(state.profile.partnerId)','true']]) assert.throws(() => auditDomains(roster.replace(from,to),ability),undefined,from);
for (const [from,to] of [['actor.overrides.types === null && actor.overrides.abilities === null && actor.overrides.form === null','true'],['!profile.abilityIds.includes(FACTS.synchronizeNativeAbilityId)','true'],['FACTS.wildProfiles.includes(profile.id)','true']]) assert.throws(() => auditDomains(roster,ability.replace(from,to)),undefined,from);
assert.throws(() => auditDomains(roster,ability.replace('actor.binding.encounterId === boss.id','true')),undefined,'Boss profiles alone cannot replace the canonical encounter binding.');

const nativeIndex = process.argv.indexOf('--native-root');
if (nativeIndex >= 0) {
  const nativeRoot = process.argv[nativeIndex+1]; assert(nativeRoot);
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:nativeRoot,encoding:'utf8'}).trim(),mappingFacts.commit);
  const source = {};
  for (const pin of mappingFacts.sourceFiles) { const text = execFileSync('git',['show',`${mappingFacts.commit}:${pin.path}`],{cwd:nativeRoot,encoding:'utf8',maxBuffer:16*1024*1024}); assert.equal(sha(text),pin.sha256,pin.path); source[pin.path] = text; }
  const init = source['src/main_loops.c'].split('void sub_8001064(void)')[1].split('\nvoid ')[0];
  assert(init.indexOf('StarterID, TRUE') < init.indexOf('PartnerID, FALSE'));
  for (const name of ['CreateLeaderPartnerData','TryAddPokemonToRecruited']) {
    const body = source['src/pokemon.c'].split(name+'(')[1].split('\n}')[0];
    for (const part of ['i = 0; i < NUM_MONSTERS; i++','!PokemonExists(&gRecruitedPokemonRef->pokemon[i])','sub_80923D4(i)','speciesFriendArea == friendArea']) assert(body.includes(part),name+': '+part);
  }
  const area = source['src/friend_area.c'].split('u8 sub_80923D4(')[1].split('\n}')[0];
  assert(area.includes('sum += gFriendAreaSettings[i].num_pokemon') && area.includes('sum > target'));
  const team = source['src/dungeon_misc.c'].split('void SetDungeonMonsFromTeam(void)')[1].split('\n}')[0];
  assert(team.includes('recruitedId = 0; recruitedId < NUM_MONSTERS; recruitedId++') && team.includes('PokemonExists(pokeStruct) && PokemonIsOnTeam(pokeStruct)') && team.includes('if (++index == MAX_TEAM_MEMBERS)'));
}
console.log('Sinister roster/source-domain audit:413 native capacity partitions;129 actual pairs with two shared-area cases;35 profiles/27 dual abilities with real contact effects and no Synchronize;canonical Team Meanies boss metadata;5 new owner pins;exact inherited work-checker body/consumer preservation;12 negative source mutations; optional4 native pins; no game imports/execution or complete factory/burst claim.');
