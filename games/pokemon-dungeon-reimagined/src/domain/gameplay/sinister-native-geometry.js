import { copyPlainData } from '../state/plain.js';
import { freezeData } from '../state/validate.js';
import { fingerprint } from '../state/relations.js';
import { instanceId } from '../ids.js';

/** One explicit comparative Red geometry operation on an authenticated observer.
 * This pure proposal never supplies layout, actor, RNG or source-call history.
 * Exact native dimensions deliberately require a separate browser crosswalk.
 * @typedef {import('../../contracts/sinister-native-geometry.js').NativeGeometryObserver} Geometry
 * @typedef {import('../../contracts/sinister-native-geometry.js').NativeGeometryTile} Tile
 * @typedef {import('../../contracts/sinister-native-geometry.js').NativeGeometryOwner} Owner
 * @typedef {import('../../contracts/sinister-native-geometry.js').NativeGeometryInput} Input
 */
const WIDTH = 56, HEIGHT = 32, ROOMS = 32;
const LIMITS = Object.freeze({maxDepth:12,maxNodes:100000,maxArrayLength:56,maxObjectKeys:16,maxStringLength:128,maxTextLength:1048576});
const OFFSETS = /** @type {[number,number][]} */ ([[0,1],[1,1],[1,0],[1,-1],[0,-1],[-1,-1],[-1,0],[-1,1]]);
// Keep the source's duplicate northeast check; it still marks every border.
const RESET_NEIGHBORS = /** @type {[number,number][]} */ ([[0,-1],[1,-1],[1,-1],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]);
/** @template T @param {T} value @returns {T} */
const clone = value => /** @type {T} */ (/** @type {unknown} */ (copyPlainData(value,LIMITS)));
/** @param {unknown} condition @param {string} message @returns {asserts condition} */
function requireGeometry(condition,message) { if (!condition) throw new TypeError(`Sinister native geometry: ${message}`); }
/** @param {object} value @param {string} keys */
function exact(value,keys) { requireGeometry(value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === keys,'exact source observer shape'); }
/** @param {number} value @param {number} min @param {number} max */
function integer(value,min,max) { requireGeometry(Number.isSafeInteger(value) && value >= min && value <= max,'source integer domain'); }
/** @template T @param {T[]} values @param {number} index @returns {T} */
function at(values,index) { const value=values[index]; requireGeometry(value !== undefined,'source index'); return value; }
/** @param {Owner} owner */
function validateOwner(owner) {
  exact(owner,'mapId,ordinal,revision,sessionId,transactionId');
  instanceId('session',owner.sessionId); instanceId('map',owner.mapId); instanceId('transaction',owner.transactionId);
  integer(owner.revision,1,Number.MAX_SAFE_INTEGER); integer(owner.ordinal,0,65535);
}
/** @param {Geometry} geometry */
function validateGeometry(geometry) {
  exact(geometry,'height,junctions,roomCount,roomData,tiles,width');
  requireGeometry(geometry.width === WIDTH && geometry.height === HEIGHT,'native56 by32 dimensions');
  requireGeometry(Array.isArray(geometry.tiles) && geometry.tiles.length === HEIGHT,'native tile rows');
  for (const row of geometry.tiles) {
    requireGeometry(Array.isArray(row) && row.length === WIDTH,'native tile columns');
    for (const tile of row) {
      exact(tile,'monster,object,room,spawnOrVisibilityFlags,terrainFlags,unk8,unkE,walkableNeighborFlags');
      integer(tile.terrainFlags,0,65535); integer(tile.spawnOrVisibilityFlags,0,65535);
      for (const value of [tile.room,tile.unk8,tile.unkE]) integer(value,0,255);
      requireGeometry(Array.isArray(tile.walkableNeighborFlags) && tile.walkableNeighborFlags.length === 4,'four retained masks');
      for (const value of tile.walkableNeighborFlags) integer(value,0,255);
      for (const pointer of [tile.monster,tile.object]) requireGeometry(pointer === null || typeof pointer === 'string' && pointer.length > 0 && pointer.length <= 128,'explicit native pointer token');
    }
  }
  integer(geometry.roomCount,0,ROOMS);
  requireGeometry(Array.isArray(geometry.roomData) && geometry.roomData.length === ROOMS,'32 retained rooms');
  for (const room of geometry.roomData) {
    exact(room,'active,bottomRightX,bottomRightZ,explored,pixelBounds,topLeftX,topLeftZ');
    integer(room.active,0,255); integer(room.explored,0,255);
    for (const value of [room.bottomRightX,room.bottomRightZ,room.topLeftX,room.topLeftZ]) integer(value,-32768,32767);
    requireGeometry(Array.isArray(room.pixelBounds) && room.pixelBounds.length === 4,'four retained u32 room bounds');
    for (const value of room.pixelBounds) integer(value,0,4294967295);
  }
  requireGeometry(Array.isArray(geometry.junctions) && geometry.junctions.length === ROOMS,'32 retained junction arrays');
  for (const junction of geometry.junctions) {
    exact(junction,'count,positions'); integer(junction.count,0,ROOMS);
    requireGeometry(Array.isArray(junction.positions) && junction.positions.length === ROOMS,'retain the complete native junction tail');
    for (const point of junction.positions) { exact(point,'x,z'); integer(point.x,-32768,32767); integer(point.z,-32768,32767); }
  }
}
/** @param {number} x @param {number} z */
function outside(x,z) { return x < 0 || z < 0 || x >= WIDTH || z >= HEIGHT; }
/** @param {Geometry} geometry @param {number} x @param {number} z @returns {Tile} */
function tileAt(geometry,x,z) { return at(at(geometry.tiles,z),x); }
/** Exact GetTile OOB terrain projection; both native tileset sentinels are0.
 * @param {Geometry} geometry @param {number} x @param {number} z */
function terrainAt(geometry,x,z) { return outside(x,z) ? 0 : tileAt(geometry,x,z).terrainFlags & 3; }
/** Only ResetFloor's main-tile projection. Other reset writes (fixed tiles,
 * stairs, traps and item count) remain their actual constructor's obligation.
 * @param {Geometry} geometry */
function resetFloorTiles(geometry) {
  for (let x=0;x<WIDTH;x++) for (let z=0;z<HEIGHT;z++) {
    const tile=tileAt(geometry,x,z);
    tile.terrainFlags=RESET_NEIGHBORS.some(([dx,dz]) => outside(x+dx,z+dz)) ? 16 : 0;
    tile.spawnOrVisibilityFlags=0; tile.room=255; tile.unk8=0; tile.unkE=0;
    tile.walkableNeighborFlags=[0,0,0,0]; tile.monster=null; tile.object=null;
  }
}
/** Source order is column-major. Room254 anchor conversion happens in this
 * same traversal, so earlier neighbor writes must remain visible to later tiles.
 * @param {Geometry} geometry */
function finalizeJunctions(geometry) {
  for (let x=0;x<WIDTH;x++) for (let z=0;z<HEIGHT;z++) {
    const tile=tileAt(geometry,x,z);
    if ((tile.terrainFlags&3) !== 1) continue;
    if (tile.room === 255) {
      for (const [px,pz] of /** @type {[number,number][]} */ ([[x-1,z],[x,z-1],[x,z+1],[x+1,z]])) {
        if (outside(px,pz)) continue;
        const neighbor=tileAt(geometry,px,pz);
        if (neighbor.room === 255) continue;
        neighbor.terrainFlags |= 8;
        if ((neighbor.terrainFlags&3) === 2) neighbor.terrainFlags=(neighbor.terrainFlags&~3)|1;
      }
    } else if (tile.room === 254) tile.room=255;
  }
  for (const junction of geometry.junctions) junction.count=0;
  for (let x=0;x<WIDTH;x++) for (let z=0;z<HEIGHT;z++) {
    const tile=tileAt(geometry,x,z);
    if (!(tile.terrainFlags&8) || tile.room >= ROOMS) continue;
    const junction=at(geometry.junctions,tile.room);
    if (junction.count < ROOMS) junction.positions[junction.count++]={x,z};
  }
}
/** The native names are reversed: bottomRight stores minima, topLeft exclusive
 * maxima. Empty rooms keep previous pixel-bound bytes after sentinel resets.
 * @param {Geometry} geometry */
function rebuildRoomBounds(geometry) {
  for (const room of geometry.roomData) { room.active=0; room.explored=0; room.bottomRightX=9999; room.bottomRightZ=9999; room.topLeftX=-9999; room.topLeftZ=-9999; }
  let maximumRoom=0;
  for (let z=0;z<HEIGHT;z++) for (let x=0;x<WIDTH;x++) {
    const index=tileAt(geometry,x,z).room;
    if (index === 255) continue;
    requireGeometry(index < ROOMS,'room rebuild requires resolved source room indices');
    const room=at(geometry.roomData,index); room.active=1;
    room.bottomRightX=Math.min(room.bottomRightX,x); room.bottomRightZ=Math.min(room.bottomRightZ,z);
    room.topLeftX=Math.max(room.topLeftX,x+1); room.topLeftZ=Math.max(room.topLeftZ,z+1);
    maximumRoom=Math.max(maximumRoom,index);
  }
  for (const room of geometry.roomData) if (room.active !== 0) room.pixelBounds=[(room.bottomRightX-1)*24>>>0,(room.bottomRightZ-1)*24>>>0,(room.topLeftX+1)*24>>>0,(room.topLeftZ+1)*24>>>0];
  geometry.roomCount=maximumRoom+1;
}
/** Corner side tiles need any nonzero terrain, even when the destination needs
 * regular terrain. No occupancy, room or current-tile terrain predicate applies.
 * @param {Geometry} geometry */
function rebuildNeighborMasks(geometry) {
  for (let z=0;z<HEIGHT;z++) for (let x=0;x<WIDTH;x++) {
    const neighbors=OFFSETS.map(([dx,dz]) => terrainAt(geometry,x+dx,z+dz));
    const flags=[0,0,0,255];
    for (let direction=0;direction<8;direction++) {
      const terrain=at(neighbors,direction);
      if ((direction&1) && (!at(neighbors,(direction+7)&7) || !at(neighbors,(direction+1)&7))) continue;
      if (terrain === 1) flags[0]=at(flags,0)|(1<<direction);
      if (terrain === 1 || terrain === 2) flags[1]=at(flags,1)|(1<<direction);
      if (terrain !== 0) flags[2]=at(flags,2)|(1<<direction);
    }
    if (x <= 1) flags[3]=0x1f;
    if (z <= 1) flags[3]=at(flags,3)&~0x38;
    if (x > 53) flags[3]=at(flags,3)&~0x0e;
    if (z > 29) flags[3]=at(flags,3)&~0x83;
    tileAt(geometry,x,z).walkableNeighborFlags=flags;
  }
}
/** Equality binds a detached proposal to the supplied private call authority;
 * it does not authenticate either record's history. A future commit owner must
 * independently prove the actual current input and source PC before applying.
 * @param {unknown} input @param {unknown} authority
 * @returns {import('../../contracts/sinister-native-geometry.js').NativeGeometryPrepared} */
export function prepareSinisterNativeGeometry(input,authority) {
  const value=/** @type {Input} */ (/** @type {unknown} */ (clone(input)));
  exact(value,'before,kind,operation,owner');
  requireGeometry(value.kind === 'sinister-native-geometry-input','explicit unselected input');
  validateOwner(value.owner);
  const actual=/** @type {Owner} */ (/** @type {unknown} */ (clone(authority))); validateOwner(actual);
  requireGeometry(fingerprint(value.owner) === fingerprint(actual),'matching actual private call authority');
  validateGeometry(value.before);
  const after=clone(value.before);
  switch (value.operation) {
    case 'reset-floor-tiles': resetFloorTiles(after); break;
    case 'finalize-junctions': finalizeJunctions(after); break;
    case 'rebuild-room-bounds': rebuildRoomBounds(after); break;
    case 'rebuild-neighbor-masks': rebuildNeighborMasks(after); break;
    default: throw new TypeError('Unowned native geometry operation.');
  }
  validateGeometry(after);
  const result={kind:/** @type {const} */ ('sinister-native-geometry-prepared'),owner:value.owner,operation:value.operation,before:value.before,after};
  freezeData(result); return result;
}
