// D05: source/AST/Git only. Never import or execute game or native code.
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { parse } from 'acorn';

const root=new URL('../../../',import.meta.url),game='games/pokemon-dungeon-reimagined/';
const read=path => readFile(new URL(path,root),'utf8');
const digest=text => createHash('sha256').update(text).digest('hex');
const ownerPath=game+'src/domain/gameplay/sinister-native-geometry.js';
const contractPath=game+'src/contracts/sinister-native-geometry.js';
const provenance=JSON.parse(await read('tools/pokemon-dungeon/content/sinister-native-geometry/sources.json'));
const source=await read(ownerPath),contract=await read(contractPath);
function body(source,name) {
  const tree=parse(source,{ecmaVersion:'latest',sourceType:'module'});
  const rows=tree.body.flatMap(node => node.type === 'ExportNamedDeclaration' ? [node.declaration] : [node]).filter(node => node?.type === 'FunctionDeclaration' && node.id.name === name);
  assert.equal(rows.length,1,name); return source.slice(rows[0].start,rows[0].end);
}
function contains(text,parts) { for (const part of parts) assert(text.includes(part),part); }
function audit(source) {
  const reset=body(source,'resetFloorTiles'),finalize=body(source,'finalizeJunctions');
  const rooms=body(source,'rebuildRoomBounds'),masks=body(source,'rebuildNeighborMasks');
  const prepare=body(source,'prepareSinisterNativeGeometry'),validate=body(source,'validateGeometry');
  contains(source,['const WIDTH = 56, HEIGHT = 32, ROOMS = 32;','[[0,-1],[1,-1],[1,-1],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]','outside(x,z) ? 0 : tileAt(geometry,x,z).terrainFlags & 3']);
  contains(validate,['geometry.width === WIDTH && geometry.height === HEIGHT','junction.positions.length === ROOMS','integer(point.x,-32768,32767)','integer(value,0,4294967295)']);
  contains(reset,['for (let x=0;x<WIDTH;x++) for (let z=0;z<HEIGHT;z++)','RESET_NEIGHBORS.some','? 16 : 0','tile.spawnOrVisibilityFlags=0; tile.room=255; tile.unk8=0; tile.unkE=0','tile.walkableNeighborFlags=[0,0,0,0]; tile.monster=null; tile.object=null']);
  assert(!/roomData|junctions|roomCount/.test(reset),'ResetFloor does not reset retained room/junction storage.');
  contains(finalize,['for (let x=0;x<WIDTH;x++) for (let z=0;z<HEIGHT;z++)','if ((tile.terrainFlags&3) !== 1) continue','[[x-1,z],[x,z-1],[x,z+1],[x+1,z]]','neighbor.terrainFlags |= 8','(neighbor.terrainFlags&~3)|1','else if (tile.room === 254) tile.room=255','junction.count=0','tile.room >= ROOMS','junction.count < ROOMS','junction.positions[junction.count++]={x,z}']);
  assert(!/\.positions\s*=|\.sort\(|new Set/.test(finalize),'Actual column-major junction order, duplicates and unused tail remain retained.');
  assert(finalize.indexOf('tile.room=255') < finalize.indexOf('junction.count=0'),'Anchor conversion precedes list reconstruction.');
  contains(rooms,['room.active=0; room.explored=0','room.bottomRightX=9999','room.topLeftX=-9999','for (let z=0;z<HEIGHT;z++) for (let x=0;x<WIDTH;x++)','index === 255','index < ROOMS','Math.min(room.bottomRightX,x)','Math.max(room.topLeftX,x+1)','if (room.active !== 0) room.pixelBounds=','*24>>>0','geometry.roomCount=maximumRoom+1']);
  contains(masks,['OFFSETS.map','(direction&1) && (!at(neighbors,(direction+7)&7) || !at(neighbors,(direction+1)&7))','terrain === 1','terrain === 1 || terrain === 2','terrain !== 0','if (x <= 1) flags[3]=0x1f','if (z <= 1) flags[3]=at(flags,3)&~0x38','if (x > 53) flags[3]=at(flags,3)&~0x0e','if (z > 29) flags[3]=at(flags,3)&~0x83']);
  assert(!/monster|object|room|Math\.random/.test(masks),'Native mask reconstruction ignores actors, rooms and RNG.');
  contains(prepare,['clone(input)','clone(authority)','fingerprint(value.owner) === fingerprint(actual)','validateGeometry(value.before)','const after=clone(value.before)','validateGeometry(after)','before:value.before,after','freezeData(result)']);
  assert(prepare.indexOf('validateGeometry(value.before)') < prepare.indexOf('const after='),'Validate before detached mutation.');
  assert(!/resetFloorTiles\(value\.before\)|finalizeJunctions\(value\.before\)|rebuildRoomBounds\(value\.before\)|rebuildNeighborMasks\(value\.before\)/.test(prepare),'Never mutate input receipt.');
  const tree=parse(source,{ecmaVersion:'latest',sourceType:'module'});
  assert.deepEqual(tree.body.filter(node => node.type === 'ImportDeclaration').map(node => node.source.value),['../state/plain.js','../state/validate.js','../state/relations.js','../ids.js']);
  assert.deepEqual(tree.body.filter(node => node.type === 'ExportNamedDeclaration').map(node => node.declaration.id.name),['prepareSinisterNativeGeometry']);
}
audit(source); parse(contract,{ecmaVersion:'latest',sourceType:'module'});
const negatives=[
  ['geometry.width === WIDTH && geometry.height === HEIGHT','true'],
  ['junction.positions.length === ROOMS','junction.positions.length === junction.count'],
  ['tile.walkableNeighborFlags=[0,0,0,0]','tile.walkableNeighborFlags=[255,255,255,255]'],
  ['[[x-1,z],[x,z-1],[x,z+1],[x+1,z]]','[[x+1,z],[x,z+1],[x,z-1],[x-1,z]]'],
  ['junction.count < ROOMS','junction.count <= ROOMS'],
  ['junction.count=0','junction.count=0; junction.positions=[]'],
  ['room.topLeftX=-9999','room.topLeftX=55537'],
  ['if (room.active !== 0) room.pixelBounds=','room.pixelBounds='],
  ['(direction+7)&7','(direction+6)&7'],
  ['if (x > 53)','if (x > 54)'],
  ['fingerprint(value.owner) === fingerprint(actual)','true'],
  ['const after=clone(value.before)','const after=value.before'],
];
for (const [from,to] of negatives) { assert(source.includes(from),from); assert.throws(() => audit(source.replace(from,to)),undefined,from); }
for (const pin of provenance.dependencies) assert.equal(digest(await read(game+pin.path)),pin.sha256,pin.path);
assert.equal(provenance.scope,'unselected-sinister-native-geometry-proposal');
assert.equal(provenance.commit,'6bcbec4f906938c0243aa2026bcbd41b577bab85');
const option=process.argv.indexOf('--native-root');
assert(option >= 0 && process.argv[option+1],'Pinned comparative native source is required.');
const nativeRoot=process.argv[option+1];
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:nativeRoot,encoding:'utf8'}).trim(),provenance.commit);
const native={};
for (const pin of provenance.nativeFiles) {
  native[pin.path]=execFileSync('git',['show',`${provenance.commit}:${pin.path}`],{cwd:nativeRoot,encoding:'utf8',maxBuffer:4*1024*1024});
  assert.equal(digest(native[pin.path]),pin.sha256,pin.path);
}
contains(native['include/structs/str_dungeon.h'],['#define DUNGEON_MAX_SIZE_X 56','#define DUNGEON_MAX_SIZE_Y 32','naturalJunctionList[MAX_ROOM_COUNT][MAX_ROOM_COUNT]']);
contains(native['include/structs/map.h'],['#define MAX_ROOM_COUNT 32','size: 0x18 Red, 0x14 Blue','u32 unkC','s16 topLeftCornerX']);
const generation=native['src/dungeon_generation.c'],access=native['src/dungeon_map_access.c'];
contains(generation,['tile->room = -1;','tile->walkableNeighborFlags[CROSSABLE_TERRAIN_WALL] = 0;','tile->monster = NULL;','tile->object = NULL;','GetTileMut(x,y)->terrainFlags |= TERRAIN_TYPE_IMPASSABLE_WALL;','dungeon->naturalJunctionListCounts[i] = 0;','dungeon->naturalJunctionListCounts[roomIndex] < MAX_ROOM_COUNT','GetTileMut(x, y)->room = CORRIDOR_ROOM;']);
const resetNative=generation.slice(generation.indexOf('static void ResetFloor(void)\n{'),generation.indexOf('static void ShuffleSpawnPositions(',generation.indexOf('static void ResetFloor(void)\n{')));
assert(!/roomData|naturalJunctionList/.test(resetNative),'The pinned ResetFloor retains room/junction memory.');
contains(access,['bottomRightCornerX = 9999;','topLeftCornerX = 0xd8f1;','if(room2 ->unk0 != 0)','gDungeon->unk104C0 = maxRooms + 1;','var_4C[0] != 0 && var_4C[1] == TERRAIN_TYPE_NORMAL && var_4C[2] != 0','if (x > 53)','if (y > 29)']);
const run=native['src/run_dungeon.c'];
assert(run.indexOf('GenerateFloor();') < run.indexOf('sub_804AAD4();'));
assert(run.indexOf('sub_804AAD4();') < run.indexOf('sub_8049B8C();'));
assert(run.indexOf('sub_8049B8C();') < run.indexOf('SpawnWildMonsOnFloor();'));
async function noConsumers(directory) {
  for (const entry of await readdir(new URL(game+directory,root),{withFileTypes:true})) {
    const path=game+directory+entry.name;
    if (entry.isDirectory()) { if (entry.name !== 'vendor') await noConsumers(directory+entry.name+'/'); }
    else if (entry.name.endsWith('.js') && path !== ownerPath && path !== contractPath && ![game+'src/domain/gameplay/sinister-construction.js',game+'src/contracts/sinister-construction.js'].includes(path)) assert(!(await read(path)).includes('sinister-native-geometry'),'Unselected geometry has a new unaudited consumer: '+path);
  }
}
await noConsumers('src/'); await noConsumers('content/');
console.log('Sinister native geometry source audit PASS:5 native/4 dependency pins; exact56x32 reset, source-ordered anchor/junction writes, retained32-entry tails, signed room sentinels/u32 pixels and four native masks;12 negative source controls; no game/native execution or selected consumer. Construction history and browser crosswalk remain open.');
