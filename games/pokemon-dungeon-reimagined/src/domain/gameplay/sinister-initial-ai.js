import { copyPlainData } from '../state/plain.js';
import { validateRandomState } from '../rng.js';
import { escortDungeonRandomInteger } from '../escort-dungeon-rng.js';

/** Pinned comparative Red branch logic over a caller-authenticated observer.
 * Geometry and the upper16 browser xoshiro stream are qualified adaptations.
 * No allocation, source-history fabrication, move selection or live mutation.
 * @typedef {import('../../contracts/sinister-ai.js').SinisterAiInput} Input
 * @typedef {import('../../contracts/sinister-ai.js').AiActor} Actor
 * @typedef {import('../../contracts/sinister-ai.js').AiRecord} Ai
 * @typedef {import('../../contracts/sinister-ai.js').AiPosition} Position
 * @typedef {import('../../contracts/sinister-ai.js').AiSlot} Slot
 * @typedef {import('../../contracts/sinister-ai.js').AiTile} Tile
 * @typedef {import('./support.js').Catalogs} Catalogs
 */
const OFFSETS = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
const TURNS = [0, 1, -1, 2, -2, 3, -3, 4];
const FACINGS = /** @type {const} */ (['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw']);
const LEADER_TACTICS = [0, 4, 5, 6, 7, 8, 10];
/** @param {unknown} condition @param {string} label @returns {asserts condition} */
function requireInput(condition, label) { if (!condition) throw new TypeError(`Sinister AI: ${label}`); }
/** @param {number} n @param {number} lo @param {number} hi */
function int(n, lo, hi) { return Number.isSafeInteger(n) && n >= lo && n <= hi; }
/** @param {object} value @param {string} keys */
function record(value, keys) { requireInput(value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join(',') === keys.split(',').sort().join(','), `record ${keys}`); }
/** @template T @param {readonly T[]} array @param {number} index @returns {T} */
function at(array, index) { const value = array[index]; requireInput(value !== undefined, 'validated source index'); return value; }
/** @param {Position} p */
function position(p) { record(p, 'x,z'); requireInput(int(p.x, -32768, 32767) && int(p.z, -32768, 32767), 's16 position'); }
/** @param {Slot|null} s */
function slot(s) { if (s === null) return; record(s, 'side,slotIndex'); requireInput((s.side === 'team' || s.side === 'wild') && int(s.slotIndex, 0, s.side === 'team' ? 3 : 127), 'slot'); }
/** @param {Ai} ai */
function aiRecord(ai) {
  record(ai, 'target,targetPos,action,allySkip,waiting,moveRandomly,mobileTurnTimer,visualFlags,previousVisualFlags,decoyAITracker');
  record(ai.target, 'objective,notNextToTarget,targetingEnemy,turningAround,targetGeneration,target,unkC,position');
  requireInput(int(ai.target.objective, 0, 7) && int(ai.target.targetGeneration, 0, 65535) && int(ai.target.unkC, 0, 4294967295), 'target bytes');
  slot(ai.target.target); position(ai.target.position); position(ai.targetPos);
  for (const b of [ai.target.notNextToTarget, ai.target.targetingEnemy, ai.target.turningAround, ai.allySkip, ai.waiting]) requireInput(typeof b === 'boolean', 'AI bool');
  requireInput(int(ai.moveRandomly, 0, 255) && int(ai.mobileTurnTimer, -32768, 32767) && int(ai.visualFlags, 0, 65535) && int(ai.previousVisualFlags, 0, 65535) && int(ai.decoyAITracker, 0, 255), 'retained AI fields');
  record(ai.action, 'action,direction,unk3,parameters,itemTargetPosition');
  requireInput(int(ai.action.action, 0, 65535) && int(ai.action.direction, 0, 7) && int(ai.action.unk3, 0, 255) && Array.isArray(ai.action.parameters) && ai.action.parameters.length === 2, 'action bytes');
  position(ai.action.itemTargetPosition);
  for (const parameter of ai.action.parameters) { record(parameter, 'useIndex,itemPos'); requireInput(int(parameter.useIndex, 0, 255), 'action use index'); position(parameter.itemPos); }
}
/** @param {Actor} actor @param {Catalogs} catalogs */
function actorRecord(actor, catalogs) {
  record(actor, 'actorId,generation,identity,type,position,room,visible,facing,hp,maxHp,belly,isTeamLeader,isNotTeamMember,tactic,behavior,shopkeeper,joinedAt,activeIq,abilities,held,status,prevPos,recalculateFollow,ai');
  requireInput(typeof actor.actorId === 'string' && actor.actorId.length > 0 && actor.actorId.length <= 128 && int(actor.generation, 0, 65535) && [0, 1].includes(actor.type), 'entity identity');
  record(actor.identity, 'speciesId,formId');
  const mobility = catalogs.navigation.mobility(actor.identity.speciesId, actor.identity.formId);
  requireInput(mobility.internalId === catalogs.species.getProfile(actor.identity.speciesId, actor.identity.formId).internalId, 'catalog species join');
  position(actor.position); requireInput(actor.room === 255 || int(actor.room, 0, 31), 'Entity.room');
  requireInput(FACINGS.includes(actor.facing) && int(actor.hp, 0, 999) && int(actor.maxHp, 1, 999) && int(actor.tactic, 0, 11) && int(actor.behavior, 0, 255) && int(actor.shopkeeper, 0, 3) && int(actor.joinedAt, 0, 255) && int(actor.activeIq, 0, 4294967295), 'source actor fields');
  record(actor.belly, 'numerator,denominator'); requireInput(int(actor.belly.numerator, 0, 2147483647) && int(actor.belly.denominator, 1, 2147483647), 'source Belly');
  for (const b of [actor.visible, actor.isTeamLeader, actor.isNotTeamMember, actor.recalculateFollow]) requireInput(typeof b === 'boolean', 'actor bool');
  requireInput(Array.isArray(actor.abilities) && actor.abilities.length === 2 && actor.abilities.every(id => id === 0 || catalogs.species.identities.abilities.some(row => row.originalId === id)), 'actual two ability bytes');
  record(actor.held, 'itemId,exists,sticky'); requireInput(typeof actor.held.exists === 'boolean' && typeof actor.held.sticky === 'boolean' && (actor.held.itemId === null || catalogs.effects.getItem(actor.held.itemId).id === actor.held.itemId), 'held fields');
  requireInput(!actor.held.exists || actor.held.itemId !== null, 'held existence');
  record(actor.status, 'sleep,frozen,cringe,bide,curse,invisible,blinker,terrifiedTurns');
  for (const [key, max] of /** @type {[keyof Actor['status'],number][]} */ ([['sleep', 5], ['frozen', 7], ['cringe', 7], ['bide', 12], ['curse', 3], ['invisible', 3], ['blinker', 3], ['terrifiedTurns', 255]])) requireInput(int(actor.status[key], 0, max), `status ${key}`);
  requireInput(Array.isArray(actor.prevPos) && actor.prevPos.length === 4, 'ordered prevPos'); actor.prevPos.forEach(position); aiRecord(actor.ai);
}
/** @param {Input} input @param {Catalogs} catalogs */
function validate(input, catalogs) {
  record(input, 'kind,phase,owner,beforeRandom,actorSlot,slots,leaderSlot,geometry');
  requireInput(input.kind === 'sinister-ai-input' && ['initial', 'floor-refresh'].includes(input.phase), 'phase');
  record(input.owner, 'sessionId,mapId,actorId,generation,revision');
  for (const s of [input.owner.sessionId, input.owner.mapId, input.owner.actorId]) requireInput(typeof s === 'string' && s.length > 0 && s.length <= 128, 'owner identity');
  requireInput(int(input.owner.generation, 0, 65535) && int(input.owner.revision, 0, Number.MAX_SAFE_INTEGER), 'owner generation/revision');
  slot(input.actorSlot); slot(input.leaderSlot); record(input.slots, 'team,wild,active');
  requireInput(Array.isArray(input.slots.team) && input.slots.team.length === 4 && Array.isArray(input.slots.wild) && input.slots.wild.length === 128 && Array.isArray(input.slots.active) && input.slots.active.length === 132, 'browser slot envelope');
  const ids = new Set();
  for (const actor of [...input.slots.team, ...input.slots.wild]) if (actor !== null) { actorRecord(actor, catalogs); requireInput(!ids.has(actor.actorId), 'unique actual slot identity'); ids.add(actor.actorId); }
  const refs = new Set(); let tail = false;
  for (const ref of input.slots.active) { slot(ref); if (ref === null) { tail = true; continue; } requireInput(!tail && entity(input, ref)?.type === 1, 'actual active prefix'); const key = `${ref.side}/${ref.slotIndex}`; requireInput(!refs.has(key), 'unique active slot'); refs.add(key); }
  requireInput(input.actorSlot !== null, 'acting slot');
  const actor = entity(input, input.actorSlot); requireInput(actor?.type === 1 && actor.actorId === input.owner.actorId && actor.generation === input.owner.generation, 'actual acting entity');
  for (const other of [...input.slots.team, ...input.slots.wild]) if (other !== null && other.ai.target.target !== null) requireInput(entity(input, other.ai.target.target) !== null, 'retained target slot bytes');
  requireInput(input.leaderSlot === null || entity(input, input.leaderSlot) !== null, 'retained leader cache bytes');
  const g = input.geometry; record(g, 'width,height,tiles,oob,roomData,junctions,tileset,visibilityRange,monsterHouseTriggered,decoyIsActive');
  requireInput(int(g.width, 1, 128) && int(g.height, 1, 128) && Array.isArray(g.tiles) && g.tiles.length === g.height && g.tiles.every(row => Array.isArray(row) && row.length === g.width), 'bounded observer tile grid');
  requireInput(int(g.tileset, 0, 75) && int(g.visibilityRange, 0, 255) && typeof g.monsterHouseTriggered === 'boolean' && typeof g.decoyIsActive === 'boolean', 'actual globals');
  const tileRecord = /** @param {Tile} t */ t => {
    record(t, 'terrainFlags,room,walkableNeighborFlags,monster,object');
    requireInput(int(t.terrainFlags, 0, 65535) && int(t.room, 0, 255) && Array.isArray(t.walkableNeighborFlags) && t.walkableNeighborFlags.length === 4 && t.walkableNeighborFlags.every(n => int(n, 0, 255)), 'tile observer'); slot(t.monster);
    if (t.object !== null) { record(t.object, 'type,visible,inShop'); requireInput(int(t.object.type, 0, 5) && typeof t.object.visible === 'boolean' && typeof t.object.inShop === 'boolean', 'object observer'); }
  };
  for (const row of g.tiles) row.forEach(tileRecord); tileRecord(g.oob);
  requireInput(g.oob.terrainFlags === 0 && g.oob.room === 255 && g.oob.walkableNeighborFlags.every(n => n === 0) && g.oob.monster === null && g.oob.object === null, 'actual GetTile OOB sentinel');
  requireInput(Array.isArray(g.roomData) && g.roomData.length === 32 && Array.isArray(g.junctions) && g.junctions.length === 32, 'retained room inventory');
  for (const room of g.roomData) { record(room, 'bottomRightX,bottomRightZ,topLeftX,topLeftZ'); for (const n of Object.values(room)) requireInput(int(n, -32768, 32767), 'retained room bound'); }
  for (const junction of g.junctions) { record(junction, 'count,activePrefix'); requireInput(int(junction.count, 0, 32) && Array.isArray(junction.activePrefix) && junction.activePrefix.length === junction.count, 'actual junction count/prefix'); junction.activePrefix.forEach(position); }
  requireInput(g.tiles[actor.position.z]?.[actor.position.x]?.room === 255 || int(g.tiles[actor.position.z]?.[actor.position.x]?.room ?? -1, 0, 31), 'source current-room access');
  requireInput(actor.position.x >= 0 && actor.position.z >= 0 && actor.position.x < g.width && actor.position.z < g.height, 'acting entity on observed floor');
}
/** @param {Input} input @param {Slot|null} ref */
function entity(input, ref) { return ref === null ? null : input.slots[ref.side][ref.slotIndex] ?? null; }
/** @param {Position} p @param {number} direction */
function adjacent(p, direction) { const offset = at(OFFSETS, direction); return { x: p.x + at(offset, 0), z: p.z + at(offset, 1) }; }
/** @param {Position} a @param {Position} b */
function distance(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.z - b.z)); }
/** @param {Position} a @param {Position} b */
function directionTowards(a, b) { const dx = Math.sign(b.x - a.x), dz = Math.sign(b.z - a.z); return at(at([[5, 4, 3], [6, 0, 2], [7, 0, 1]], dz + 1), dx + 1); }
/** @param {Actor} a @param {number} tactic */
function tacticIs(a, tactic) { return a.isTeamLeader ? tactic === 1 : a.tactic === tactic; }
/** @param {Actor} a @param {string} id */
function held(a, id) { return a.held.exists && !a.held.sticky && a.held.itemId === id; }
/** @param {Actor} a @param {number} flag */
function iq(a, flag) { return (a.activeIq & (1 << flag)) !== 0; }
/** @param {Actor} a */
function status2(a) { return [1, 3, 5].includes(a.status.sleep) || [3, 7].includes(a.status.cringe) || a.status.frozen === 6 || a.status.terrifiedTurns !== 0; }
/** @param {Actor} a */
function status1(a) { return ![0, 2].includes(a.status.sleep) || [1, 6].includes(a.status.frozen) || a.status.bide === 1; }
/** @param {Actor} a */
function runaway(a) { return a.status.terrifiedTurns !== 0 || (!a.isTeamLeader && ((a.abilities.includes(43) && a.hp < Math.floor(a.maxHp / 2)) || tacticIs(a, 10) || (tacticIs(a, 6) && a.hp <= Math.floor(a.maxHp / 2)))); }
/** @param {Actor} a */
function canSeeInvisible(a) { return a.status.blinker === 3 || held(a, 'item-goggle-specs'); }
/** @param {Actor} a @param {Actor} b @param {boolean} petrified */
function treatment(a, b, petrified) {
  if (a === b) return 0;
  if (a.shopkeeper === 1 || b.shopkeeper === 1 || [1, 4].includes(a.behavior) || [1, 4].includes(b.behavior) || (petrified && !a.isNotTeamMember && b.status.frozen === 6) || (b.status.invisible === 1 && !canSeeInvisible(a))) return 2;
  const sideA = a.shopkeeper !== 0 ? a.shopkeeper === 3 : a.isNotTeamMember;
  const sideB = b.shopkeeper !== 0 ? b.shopkeeper === 3 : b.isNotTeamMember;
  // decoyAITracker is retained in the AI observer, not inferred from curse.
  const tracker = a.ai.decoyAITracker;
  const group = tracker === 0 ? 0 : tracker === 1 ? 1 : 2;
  const decoy = b.status.curse === 2;
  if ((group === 1 && sideA) || (group === 2 && !sideA)) return decoy ? 1 : 2;
  return decoy ? 2 : sideA === sideB ? 0 : 1;
}

/** Pure bounded proposal. The exact draw adapter is required, not an opaque RNG.
 * @param {unknown} input @param {Catalogs} catalogs
 * @param {typeof escortDungeonRandomInteger} draw
 * @returns {import('../../contracts/sinister-ai.js').SinisterAiPrepared}
 */
export function prepareSinisterAi(input, catalogs, draw) {
  requireInput(draw === escortDungeonRandomInteger, 'qualified Dungeon draw owner');
  const value = /** @type {Input} */ (/** @type {unknown} */ (copyPlainData(input, {maxDepth:16,maxNodes:400000,maxArrayLength:16384,maxObjectKeys:64,maxStringLength:128,maxTextLength:1048576})));
  validate(value, catalogs);
  const beforeRandom = validateRandomState(value.beforeRandom); let random = beforeRandom;
  const actor = /** @type {Actor} */ (entity(value, value.actorSlot));
  const beforeAi = /** @type {Ai} */ (/** @type {unknown} */ (copyPlainData(actor.ai)));
  const ai = actor.ai, g = value.geometry;
  const mobility = catalogs.navigation.mobility(actor.identity.speciesId, actor.identity.formId);
  const liquid = catalogs.navigation.liquid(g.tileset);
  let leader = value.leaderSlot;
  /** @type {import('../../contracts/sinister-ai.js').AiDraw[]} */ const draws = [];
  /** @type {{direction:number,canMove:boolean,pokemonInFront:boolean}[]} */ const probes = [];
  /** @type {string[]} */ const branches = [];
  /** @param {number} cap */
  function sample(cap) { const before = random, result = draw(random, cap); random = result.state; draws.push({ cap, value: result.value, beforeRandom: before, afterRandom: random }); return result.value; }
  /** @param {Position} p @returns {Tile} */
  function tile(p) { return p.x < 0 || p.z < 0 || p.x >= g.width || p.z >= g.height ? g.oob : at(at(g.tiles, p.z), p.x); }
  /** @param {Position} p */
  function roomSight(p) { const room = tile(actor.position).room; if (room === 255) return false; const r = at(g.roomData, room); return r.bottomRightX - 1 <= p.x && r.bottomRightZ - 1 <= p.z && r.topLeftX + 1 > p.x && r.topLeftZ + 1 > p.z; }
  /** @param {Position} a @param {Position} b */
  function withinTwo(a, b) {
    if (distance(a, b) < 2) return true;
    if (distance(a, b) !== 2) return false;
    for (const [from, to] of /** @type {[Position,Position][]} */ ([[a, b], [b, a]])) { let p = { ...from }; for (let i = 0; i < 2; i++) { p = { x: p.x + Math.sign(to.x - p.x), z: p.z + Math.sign(to.z - p.z) }; if ((tile(p).terrainFlags & 3) === 0) return false; } }
    return true;
  }
  /** @param {Position} p @param {boolean} actual */
  function inSight(p, actual) { if (actual) return tile(actor.position).room === 255 ? distance(actor.position, p) <= (g.visibilityRange === 0 ? 2 : g.visibilityRange) : roomSight(p); return roomSight(p) || withinTwo(actor.position, p); }
  /** @param {Actor|null} other @param {boolean} actual */
  function visible(other, actual) { return other !== null && other.type !== 0 && other.visible && !(other.status.invisible === 1 && !canSeeInvisible(actor)) && actor.status.blinker !== 1 && inSight(other.position, actual); }
  function crossable() { const type = mobility.movementType; return type < 4 ? type : type === 4 ? (liquid === 'lava' ? 1 : 0) : (liquid === 'lava' ? 0 : 1); }
  /** @param {number|null} direction */
  function effectiveCrossable(direction) {
    let type = crossable();
    if (g.tileset <= 63) { if (actor.status.invisible === 3 || held(actor, 'item-mobile-scarf')) type = 3; else if (iq(actor, 12)) type = 2; else if (iq(actor, 13)) type = direction === null || !(direction & 1) ? 3 : 2; }
    return type;
  }
  /** @param {number} direction */
  function canMove(direction) {
    const front = tile(adjacent(actor.position, direction)); let can = false, pokemonInFront = false;
    if (!(front.terrainFlags & 16) && !((front.terrainFlags & 64) && !g.monsterHouseTriggered && iq(actor, 15)) && !(front.object?.type === 2 && iq(actor, 14) && (front.object.visible || actor.status.blinker === 3)) && !((front.terrainFlags & 3) === 2 && liquid === 'lava' && iq(actor, 20))) {
      if (at(tile(actor.position).walkableNeighborFlags, effectiveCrossable(direction)) & (1 << direction)) { can = front.monster === null; pokemonInFront = !can; }
    }
    const result = { direction, canMove: can, pokemonInFront }; probes.push(result); return result;
  }
  function junction() {
    let type = effectiveCrossable(null);
    if (type === 3) { branches.push('wall-timer'); const sum = ai.mobileTurnTimer + sample(100); ai.mobileTurnTimer = ((sum + 32768) & 65535) - 32768; if (ai.mobileTurnTimer < 200) return false; ai.mobileTurnTimer = 0; return true; }
    if (liquid === 'lava' && type === 1 && iq(actor, 20)) type = 0;
    return [0x54, 0x51, 0x45, 0x15, 0x55].includes(at(tile(actor.position).walkableNeighborFlags, type));
  }
  /** @param {number} objective @param {Position} p */
  function target(objective, p) { ai.target.objective = objective; ai.target.position = { x: ((p.x + 32768) & 65535) - 32768, z: ((p.z + 32768) & 65535) - 32768 }; }
  function wander() {
    branches.push('wander');
    if (actor.room === 255) {
      branches.push('corridor');
      const opposite = (ai.action.direction + 4) & 7, atJunction = junction();
      branches.push(atJunction ? 'junction' : 'straight');
      if (atJunction) ai.action.direction = sample(8);
      for (const turn of TURNS) { const dir = (ai.action.direction + turn) & 7; if (atJunction && dir === opposite) continue; if (canMove(dir).canMove) { branches.push('corridor-step'); target(3, adjacent(actor.position, dir)); return; } }
      branches.push('corridor-fallback'); target(6, adjacent(actor.position, sample(8))); return;
    }
    branches.push('room');
    const exits = at(g.junctions, actor.room);
    if (ai.moveRandomly !== 0) { branches.push('random-room'); target(6, adjacent(actor.position, sample(8))); return; }
    if (ai.target.objective !== 4) {
      if (exits.count === 0) { branches.push('no-exits'); target(6, adjacent(actor.position, sample(8))); return; }
      for (let i = 0; i < 10; i++) { const p = at(exits.activePrefix, sample(exits.count)); if (distance(actor.position, p) !== 0) { branches.push('exit-chosen'); target(4, p); return; } }
    }
    branches.push(ai.target.objective === 4 ? 'retained-exit' : 'ten-self-exits');
    if (tile(actor.position).terrainFlags & 8) { branches.push('room-junction'); const start = sample(8); for (let i = 0; i < 8; i++) { const dir = (start + i) & 7, p = adjacent(actor.position, dir); if (tile(p).room === 255 && canMove(dir).canMove) { branches.push('room-step'); target(3, p); return; } } }
    branches.push('room-fallthrough');
    // Native TRUE fallthrough preserves objective and target, including stale ones.
  }
  function candidates() { return g.decoyIsActive ? value.slots.active : actor.isNotTeamMember ? value.slots.team.map((_, slotIndex) => ({ side: /** @type {const} */ ('team'), slotIndex })) : value.slots.wild.map((_, slotIndex) => ({ side: /** @type {const} */ ('wild'), slotIndex })); }
  function seeTeammate() { return !actor.isNotTeamMember && value.slots.team.some(other => other !== actor && visible(other, true)); }
  function getLeader() { if (leader === null) { const index = value.slots.team.findIndex(other => other?.type === 1 && other.isTeamLeader); if (index >= 0) leader = { side: 'team', slotIndex: index }; } return entity(value, leader); }
  /** @param {Actor} other @param {Slot} ref @param {boolean} enemy */
  function chase(other, ref, enemy) { target(1, other.position); ai.target.target = { ...ref }; ai.target.targetGeneration = other.generation; if (enemy) ai.target.targetingEnemy = true; ai.moveRandomly = 0; }
  function choose() {
    branches.push('choose');
    if (actor.isNotTeamMember || !LEADER_TACTICS.includes(actor.tactic)) {
      let closest = 999; /** @type {Slot|null} */ let selected = null;
      const walls = actor.status.invisible === 3 || held(actor, 'item-mobile-scarf') || crossable() === 3;
      for (const ref of candidates()) {
        const other = entity(value, ref); if (other === null || other.type === 0 || other.behavior !== 0) continue;
        if (g.decoyIsActive ? treatment(actor, other, true) !== 1 : !actor.isNotTeamMember && other.status.frozen === 6) continue;
        if (other.shopkeeper === 1 || ((!walls || Math.abs(actor.position.x - other.position.x) > 5 || Math.abs(actor.position.z - other.position.z) > 5) && !visible(other, false))) continue;
        const d = distance(actor.position, other.position); if (d < closest) { closest = d; selected = ref; if (d < 2) break; }
      }
      if (selected !== null) { const other = /** @type {Actor} */ (entity(value, selected)); chase(other, selected, true); if (tacticIs(actor, 8) && !seeTeammate() && distance(actor.position, other.position) <= 1) ai.target.turningAround = true; branches.push('enemy'); return; }
    }
    if (!tacticIs(actor, 1)) {
      if (!actor.isNotTeamMember) { const other = getLeader(); if (other !== null && other.status.curse !== 2 && treatment(actor, other, false) === 0 && visible(other, false)) { chase(other, /** @type {Slot} */ (leader), false); branches.push('leader-target'); return; } }
    } else if (actor.isTeamLeader) {
      const room = tile(actor.position).room, r = room === 255 ? null : at(g.roomData, room);
      const minX = r === null ? actor.position.x - 2 : r.bottomRightX - 1, maxX = r === null ? actor.position.x + 2 : r.topLeftX + 1;
      const minZ = r === null ? actor.position.z - 2 : r.bottomRightZ - 1, maxZ = r === null ? actor.position.z + 2 : r.topLeftZ + 1;
      for (let z = minZ; z <= maxZ; z++) for (let x = minX; x <= maxX; x++) if (tile({ x, z }).object?.type === 3) { target(7, { x, z }); ai.target.target = null; ai.target.targetGeneration = 0; ai.moveRandomly = 0; return; }
    }
    if ([1, 2].includes(ai.target.objective) && ai.target.target !== null) {
      const remembered = entity(value, ai.target.target); requireInput(remembered !== null, 'remembered native slot bytes');
      if (remembered.generation === ai.target.targetGeneration) { for (const p of remembered.prevPos) if (inSight(p, false)) { target(2, p); ai.moveRandomly = 0; branches.push('remembered'); return; } }
      else { branches.push('stale-generation'); ai.target.objective = 6; ai.target.target = null; ai.target.targetGeneration = 0; }
    }
    wander();
  }
  function avoid() {
    branches.push('avoid'); let closest = 999999; /** @type {Actor|null} */ let selected = null;
    for (const ref of candidates()) { const other = entity(value, ref); if (!visible(other, true) || (g.decoyIsActive && treatment(actor, /** @type {Actor} */ (other), true) !== 1)) continue; const d = distance(actor.position, /** @type {Actor} */ (other).position); if (d < closest) { selected = other; closest = d; ai.target.position = { .../** @type {Actor} */ (other).position }; ai.targetPos = { ...ai.target.position }; } }
    if (selected === null) { wander(); return; }
    if (actor.room !== 255 && actor.room === selected.room) {
      if (tile(actor.position).terrainFlags & 8) { branches.push('escape-junction'); for (let dir = 0; dir < 8; dir++) { const p = adjacent(actor.position, dir); if (tile(p).room !== actor.room && canMove(dir).canMove) { branches.push('escape-step'); target(5, p); return; } } branches.push('escape-fallback'); target(6, adjacent(actor.position, sample(8))); return; }
      let furthest = -999999; /** @type {Position|null} */ let exit = null;
      for (const p of at(g.junctions, actor.room).activePrefix) { const step = { x: actor.position.x + Math.sign(p.x - actor.position.x), z: actor.position.z + Math.sign(p.z - actor.position.z) }, d = distance(selected.position, p); if (distance(selected.position, step) >= closest && d > furthest) { furthest = d; exit = p; } }
      if (exit !== null) { branches.push('flee-exit'); target(5, exit); return; }
    }
    branches.push('mirrored-flee'); target(5, { x: 2 * actor.position.x - selected.position.x, z: 2 * actor.position.z - selected.position.z });
  }
  /** @param {number} id */
  function action(id) { ai.action.action = id; for (const p of ai.action.parameters) p.useIndex = 0; }
  /** @param {number} dir */
  function walk(dir) { action(mobility.canMove ? 2 : 1); ai.action.direction = dir & 7; }
  function runAwayWithFlags() {
    if (!runaway(actor)) return false;
    if (!actor.isTeamLeader && actor.abilities.includes(43)) { ai.previousVisualFlags = ai.visualFlags & 4 ? ai.previousVisualFlags | 4 : ai.previousVisualFlags & ~4; ai.visualFlags = actor.hp <= Math.floor(actor.maxHp / 2) ? ai.visualFlags | 4 : ai.visualFlags & ~4; }
    return true;
  }
  function decide() {
    ai.targetPos = { ...ai.target.position };
    if (distance(actor.position, ai.target.position) === 0) { action(1); return; }
    let dir = directionTowards(actor.position, ai.target.position);
    if (tacticIs(actor, 3) && ai.target.targetingEnemy) { if (ai.target.objective === 1 && withinTwo(actor.position, ai.target.position)) { const d = distance(actor.position, ai.target.position); if (d === 2) { action(1); return; } if (d < 2) dir = (dir + 4) & 7; } }
    else if (ai.target.turningAround) dir = (dir + 4) & 7;
    const first = canMove(dir);
    if (first.canMove) { walk(dir); return; }
    if (first.pokemonInFront) { if (!actor.isNotTeamMember && !actor.recalculateFollow) { ai.target.notNextToTarget = true; ai.allySkip = true; action(1); ai.waiting = true; return; } if (distance(adjacent(actor.position, dir), ai.target.position) === 0) { action(1); ai.waiting = true; return; } ai.target.notNextToTarget = true; }
    const tries = [false, true, true, true, true];
    if (!actor.isNotTeamMember && (dir & 1)) { const dx = Math.abs(actor.position.x - ai.target.position.x), dz = Math.abs(actor.position.z - ai.target.position.z); if (dx <= 2 && dz <= 2 && dx !== dz) { if (dir & 2) tries[dx < dz ? 2 : 1] = false; else tries[dx < dz ? 1 : 2] = false; } }
    const limit = runAwayWithFlags() || ai.target.turningAround ? 5 : 3;
    const choices = [];
    for (let i = 1; i < limit; i++) { const result = canMove((dir + at(TURNS, i)) & 7); choices.push({ ...result, i }); if (!result.canMove && !result.pokemonInFront) tries[1] = tries[2] = true; }
    for (const result of choices) { if (result.canMove && tries[result.i]) { walk(result.direction); return; } if (result.pokemonInFront) ai.target.notNextToTarget = true; }
    action(1); ai.waiting = true;
    if (actor.isTeamLeader) { ai.target.notNextToTarget = false; ai.allySkip = false; } else if (ai.target.notNextToTarget) ai.allySkip = true;
  }
  function takeItem() {
    const object = tile(actor.position).object;
    if (actor.behavior === 1 || [71, 74].includes(actor.joinedAt) || (!actor.isTeamLeader && runaway(actor)) || status2(actor) || status1(actor) || (actor.status.bide >= 2 && actor.status.bide <= 10)) return false;
    return object?.type === 3 && !actor.isTeamLeader && !actor.held.exists && (((tile(actor.position).terrainFlags & 3) !== 0) || !actor.isNotTeamMember) && !object.inShop;
  }
  if (actor.isTeamLeader) { branches.push('leader'); ai.targetPos = { x: actor.position.x, z: actor.position.z + 1 }; }
  else {
    ai.target.notNextToTarget = false; ai.target.targetingEnemy = false; ai.target.turningAround = false;
    if (tacticIs(actor, 7) && actor.hp <= Math.floor(actor.maxHp / 2)) { branches.push('patient'); ai.action.action = 0; }
    else if (tacticIs(actor, 9)) { branches.push('wait'); ai.action.action = 0; }
    else if (Math.floor(actor.belly.numerator / actor.belly.denominator) === 0) { branches.push('empty-belly'); ai.action.action = 0; }
    else if (actor.behavior === 1) { branches.push('rescue'); action(mobility.canMove ? 2 : 1); ai.action.direction = sample(8); ai.targetPos = { x: actor.position.x, z: actor.position.z - 1 }; }
    else if (runAwayWithFlags()) { avoid(); decide(); }
    else if (takeItem()) { branches.push('pickup'); ai.action.action = 63; }
    else { choose(); decide(); }
  }
  let orientationRequest = null;
  if ((ai.targetPos.x !== 0 || ai.targetPos.z !== 0) && (!(status2(actor) || actor.status.blinker === 1) || !status1(actor))) { ai.action.direction = directionTowards(actor.position, ai.targetPos) & 7; if (value.phase === 'floor-refresh') orientationRequest = ai.action.direction; }
  requireInput(draws.length <= 11 && probes.length <= 13, 'source branch bounds');
  const result = { kind: /** @type {const} */ ('sinister-ai-prepared'), phase: value.phase, owner: value.owner, beforeRandom, afterRandom: random, source: { branch: branches.join('/'), draws, movementProbes: probes }, beforeAi, afterAi: ai, beforeLeaderSlot: value.leaderSlot, afterLeaderSlot: leader, facing: orientationRequest === null ? actor.facing : at(FACINGS, orientationRequest), orientationRequest, action: ai.action, allySkip: ai.allySkip, waiting: ai.waiting };
  /** @param {unknown} object */
  function freeze(object) { if (object !== null && typeof object === 'object') { for (const child of Object.values(object)) freeze(child); Object.freeze(object); } }
  freeze(result); return result;
}
