import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildNavigationExport,navigationAuthorRoot,navigationRuntimeRoot} from './export-navigation.mjs';
import * as acorn from 'acorn';
const gameRoot=new URL('../../../games/pokemon-dungeon-reimagined/',import.meta.url);
const read=async url=>JSON.parse(await readFile(url,'utf8'));
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const keys=(row,expected)=>{assert(row!==null&&typeof row==='object'&&!Array.isArray(row),'Navigation record required.');assert(Object.keys(row).sort().join(',')===expected.split(',').sort().join(','),'Closed navigation record shape differs.');};
const integer=(value,min,max)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=min&&value<=max;
const same=(actual,expected,label)=>assert(JSON.stringify(actual)===JSON.stringify(expected),label);
const corpusBytes=await readFile(new URL('../content/research/pokemon-navigation-generation-corpus.json',import.meta.url));
const corpus=JSON.parse(corpusBytes.toString('utf8'));
const corpusHash=createHash('sha256').update(corpusBytes).digest('hex');
assert(corpusHash==='b074413fce5840f7159c2a34cb89ebe9814caf64128312cf824aadfa07989882'&&corpus.provenance.commit==='6bcbec4f906938c0243aa2026bcbd41b577bab85','Reviewed navigation corpus source pins');
const d=await read(new URL('facts.json',navigationAuthorRoot));
keys(d,'schemaVersion,catalogId,mobility,terrain,fixed,tilesetLiquid,shopChances,source');
keys(d.source,'commit,qualification,corpusSha256');
same(d.source,{commit:corpus.provenance.commit,qualification:'original-red-engine-comparative; independent browser fixed geometry',corpusSha256:corpusHash},'Exact navigation source pins');
assert([d.mobility,d.fixed,d.terrain,d.tilesetLiquid,d.shopChances].every(Array.isArray),'Navigation array tables');
assert(d.schemaVersion===1&&d.catalogId==='original-blue-navigation','Navigation header');
assert(d.mobility.length===424&&d.fixed.length===140&&d.terrain.length===16&&d.tilesetLiquid.length===76&&d.shopChances.length===16,'Complete navigation table counts');
const speciesParameters=await read(new URL('content/effects/species-parameters-01.json',gameRoot));
const mobilityKeys=new Set();
for(const [index,row] of d.mobility.entries()){
  keys(row,'internalId,speciesId,formId,movementType,canMove,baseMovementSpeed');
  const cross=speciesParameters.records[index];
  const sourced=corpus.speciesMobility[index];
  same(row,{internalId:sourced.internalId,speciesId:sourced.speciesId,formId:sourced.formId,movementType:sourced.movementType,canMove:sourced.canMoveFlag,baseMovementSpeed:sourced.baseMovementSpeed},'Exact sourced mobility values');
  assert(row.internalId===index&&cross?.internalId===index&&row.speciesId===cross.speciesId&&row.formId===cross.formId,'Exact original form crosswalk');
  assert([0,2,3,4,5].includes(row.movementType)&&typeof row.canMove==='boolean'&&Number.isInteger(row.baseMovementSpeed)&&row.baseMovementSpeed>=0&&row.baseMovementSpeed<=4,'Mobility value');
  if(row.speciesId!==null){const key=`${row.speciesId}/${row.formId??''}`;assert(!mobilityKeys.has(key),'Duplicate canonical mobility');mobilityKeys.add(key);}
}
assert(mobilityKeys.size===419,'419 canonical forms including six temporary');
const effects=[];for(const filename of await readdir(new URL('content/effects/',gameRoot)))if(/^items-\d+\.json$/.test(filename))effects.push(...(await read(new URL(`content/effects/${filename}`,gameRoot))).records);
const itemIds=new Set(effects.map(row=>row.id));
const fixedCatalog=(await read(new URL('content/dungeons/fixed-rooms-01.json',gameRoot))).records;
const fixedIds=new Set();
for(const [index,row] of d.fixed.entries()){
  keys(row,'index,id,width,height,kind,canonical,playerAnchors,stairs,doors,access,rewardItemId,roles,sceneOnly,hasLiquid,hasVoid,sourceSymbol');
  assert(typeof row.id==='string'&&/^[a-z][a-z0-9-]{0,95}$/.test(row.id)&&!fixedIds.has(row.id),'Unique fixed identity');fixedIds.add(row.id);
  const sourced=corpus.fixedRooms[index];
  assert(sourced.sourceIndex===index&&row.id===sourced.catalogId&&row.sourceSymbol===sourced.sourceSymbol&&row.width===sourced.width&&row.height===sourced.height,'Exact sourced fixed identity/dimensions');
  assert(integer(row.width,1,46)&&integer(row.height,1,22)&&integer(row.playerAnchors,0,1)&&integer(row.stairs,0,1)&&integer(row.doors,0,1),'Fixed integer counts/dimensions');
  assert(row.playerAnchors===sourced.playerAnchorCount&&row.stairs===sourced.stairsCount&&row.doors===sourced.doorCount,'Exact sourced fixed anchors/stairs/doors');
  assert(typeof row.hasLiquid==='boolean'&&typeof row.hasVoid==='boolean'&&row.hasLiquid===(sourced.terrainCounts.secondaryLiquid>0)&&row.hasVoid===(sourced.terrainCounts.chasm>0),'Exact sourced fixed liquid/void');
  assert(Array.isArray(row.roles)&&row.roles.length<=124,'Bounded fixed roles');
  same(row.roles,sourced.actorRoles.map(actor=>({speciesId:actor.speciesId,formId:actor.formId,internalId:actor.internalId,behavior:actor.behaviorSymbol,count:actor.count})),'Exact fixed actor source crosswalk/behavior/count');
  const access=sourced.accessContract?.afterDoorAccess;
  assert(row.access===(access?.startsWith('water-compatible')?'liquid':access?.startsWith('wall traversal')?'wall':'floor'),'Exact fixed access source');
  assert(row.rewardItemId===(sourced.rewardItems[0]?.itemId??null),'Exact sourced reward');
  const source=fixedCatalog.find(f=>f.sourceIndex===index);assert(source&&row.index===index&&row.id===source.id&&row.width===source.width&&row.height===source.height,'Fixed identity/dimensions');
  assert(row.kind===(index===0?'sentinel':index<50?'floorwide':index<=66?'embedded':'unused'),'Fixed activation class');
  assert(row.canonical===(index>0&&index<=66&&index!==48),'Fixed canonical membership');
  assert(row.sceneOnly===(index===6),'Ninetales scene separation');
  assert(['floor','liquid','wall'].includes(row.access)&&integer(row.doors,0,1),'Fixed gate bounds');
  if(index>=50&&index<=66)assert(itemIds.has(row.rewardItemId)&&row.roles.length===0,'Reward identity');else assert(row.rewardItemId===null,'No invented fixed reward');
  for(const actor of row.roles){keys(actor,'speciesId,formId,internalId,behavior,count');const mon=d.mobility[actor.internalId];assert(integer(actor.internalId,0,423)&&typeof actor.behavior==='string'&&/^BEHAVIOR_[A-Z0-9_]{1,64}$/.test(actor.behavior)&&mon&&mon.speciesId!==null&&actor.speciesId===mon.speciesId&&actor.formId===mon.formId&&integer(actor.count,1,124),'Fixed actor crosswalk');}
}
for(const [id,access,keyRequired] of [[51,'liquid',true],[53,'liquid',false],[60,'wall',true],[61,'wall',false],[66,'liquid',false]])assert(d.fixed[id].access===access&&Boolean(d.fixed[id].doors)===keyRequired,'Protected reward access invariant');
same(d.tilesetLiquid,corpus.tilesetSecondaryKinds.map((row,index)=>{assert(row.tileset===index,'Exact tileset source index');return row.kind;}),'Exact sourced tileset liquids');
const kinds=['wall','floor','water','lava','void'];
const expectedTerrain=kinds.flatMap(kind=>[{id:`terrain-${kind}`,kind,impassable:false,door:false,revealedTerrainId:null},{id:`terrain-impassable-${kind}`,kind,impassable:true,door:false,revealedTerrainId:null},{id:`terrain-sealed-${kind}`,kind:'wall',impassable:true,door:false,revealedTerrainId:`terrain-${kind}`}]);
expectedTerrain.push({id:'terrain-key-door',kind:'floor',impassable:true,door:true,revealedTerrainId:'terrain-floor'});
same(d.terrain,expectedTerrain,'Exact independent terrain semantics');
const terrainIds=new Set(d.terrain.map(row=>row.id));for(const row of d.terrain){keys(row,'id,kind,impassable,door,revealedTerrainId');assert(['wall','floor','water','lava','void'].includes(row.kind)&&typeof row.impassable==='boolean'&&typeof row.door==='boolean'&&(row.revealedTerrainId===null||terrainIds.has(row.revealedTerrainId)),'Terrain semantic registry');}
assert(terrainIds.size===16&&d.tilesetLiquid.every(kind=>['none','water','lava'].includes(kind)),'Terrain/table identity');
assert(d.shopChances.every(rows=>Array.isArray(rows)&&rows.length===3&&rows.every(row=>Array.isArray(row)&&row.length===3&&row.every(n=>Number.isInteger(n)&&n>=0&&n<=100))),'16 shop probability matrices');
const floors=[],profiles=new Map();for(const filename of await readdir(new URL('content/dungeons/',gameRoot))){if(/^floors-\d+\.json$/.test(filename))floors.push(...(await read(new URL(`content/dungeons/${filename}`,gameRoot))).records);if(/^generation-\d+\.json$/.test(filename))for(const row of (await read(new URL(`content/dungeons/${filename}`,gameRoot))).records)profiles.set(row.id,row);}
const raw=new Map();for(const floor of floors){const p=profiles.get(floor.generationId)?.parameters;assert(p,'Floor generation relation');assert(p.tileset<76&&p.kecleonShopLayout<16,'Complete tileset/shop table reference');if(!p.fixedRoomNumber)raw.set(p.layout,(raw.get(p.layout)??0)+1);}
assert(raw.get(13)===7&&raw.get(15)===20,'Raw13/15 default dispatch coverage');
const expected=await buildNavigationExport();for(const [file,bytes]of expected)assert((await readFile(new URL(file,navigationRuntimeRoot))).equals(Buffer.from(bytes,'utf8')),`Stale runtime ${file}`);
same((await readdir(navigationRuntimeRoot)).sort(),['facts.json','manifest.json'],'Exact exported navigation resources');
const sources=await read(new URL('sources.json',navigationAuthorRoot));keys(sources,'sources,contracts,commercialTilesIncluded');
same(sources.sources,corpus.provenance,'Exact authoring source provenance');
same(sources.contracts,{navigationContracts:corpus.navigationContracts,layoutFamilies:corpus.layoutFamilies,generationContracts:corpus.generationContracts,fixedRoomContracts:corpus.fixedRoomContracts},'Exact source contract export');
assert(sources.commercialTilesIncluded===false&&sources.contracts.layoutFamilies.length===12,'Source qualification/full family coverage');
for(const file of ['navigation.js','navigation-types.js','navigation-integrity.js'])acorn.parse(await readFile(new URL(`content/${file}`,gameRoot),'utf8'),{ecmaVersion:'latest',sourceType:'module'});
const fileNames=['generation.js','navigation.js'];for(const dir of ['generation','navigation'])for(const file of await readdir(new URL(`src/domain/${dir}/`,gameRoot)))if(file.endsWith('.js'))fileNames.push(`${dir}/${file}`);
for(const file of fileNames){const text=await readFile(new URL(`src/domain/${file}`,gameRoot),'utf8');acorn.parse(text,{ecmaVersion:'latest',sourceType:'module'});assert(!/Math\.random|Date\.now|new Date|\beval\(|\bFunction\(/.test(text),`Hidden randomness/execution ${file}`);}
console.log(`Static navigation:424 mobility/419 canonical forms;140 pointers/65 campaign identities;1497 floor joins;raw13/15=7/20;12 families;16 semantic terrain IDs. ${fileNames.length} modules parsed without execution.`);
console.log(`Facts SHA256 ${createHash('sha256').update(expected.get('facts.json')).digest('hex')}`);
