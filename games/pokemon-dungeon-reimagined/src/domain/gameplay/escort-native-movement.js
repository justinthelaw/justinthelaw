import { ESCORT_SPATIAL_FACTS as FACTS } from '../../../content/authored/escort-spatial-facts.js';
import { DIRECTIONS } from '../navigation/geometry.js';
import { canSeeActor, isExtendedTargetInSight } from '../navigation/sight.js';
import { escortDungeonRandomInteger } from '../escort-dungeon-rng.js';
import { slotAt, actorAt } from '../turns/support.js';
import { blocked, facing, navigationContext, ability, maxHp, value } from './support.js';
import { chooseNativeEscortMove } from './escort-native-moves.js';
/** @typedef {import('../../contracts/campaign.js').SessionActor} Actor
 * @typedef {import('../../contracts/campaign.js').ExpeditionState} Session
 * @typedef {import('../../contracts/campaign.js').ResolvedAction} Action
 * @typedef {import('../../contracts/escort-work.js').EscortNativeAi} NativeAi
 * @typedef {import('../../contracts/escort-work.js').EscortTargetPosition} Position
 * @typedef {import('../turns/types.js').MutationContext} Context
 * @typedef {import('./support.js').Catalogs} Catalogs */
/** @param {Context} context @param {number} cap */
function sample(context,cap) { const result = escortDungeonRandomInteger(context.state.random.combatRecruitment,cap); context.state.random.combatRecruitment = result.state; return result.value; }
/** @param {Position} a @param {Position} b */ const distance = (a,b) => Math.max(Math.abs(a.x-b.x),Math.abs(a.z-b.z));
/** Native same-position direction is South; DecideMovement handles equality first.
 * @param {Position} from @param {Position} to */
function directionTo(from,to) { const x = Math.sign(to.x-from.x),z = Math.sign(to.z-from.z); return DIRECTIONS.findIndex(d => d.x === x && d.z === z) < 0 ? 0 : DIRECTIONS.findIndex(d => d.x === x && d.z === z); }
/** @param {Actor} actor */
function position(actor) { return actor.placement.kind === 'map' ? actor.placement.position : blocked('escort-movement-placement'); }
/** @param {Actor} actor */ const currentDirection = actor => DIRECTIONS.findIndex(d => facing(d.x,d.z) === actor.facing);
/** @param {Position} origin @param {number} direction */
function adjacent(origin,direction) { const d = DIRECTIONS[direction]; if (!d) return blocked('escort-native-direction'); return { x: origin.x+d.x,z: origin.z+d.z }; }
/** @param {Actor} actor @param {number} direction @param {Catalogs} catalogs @returns {Action} */
function walk(actor,direction,catalogs) { actor.facing = facing(DIRECTIONS[direction]?.x ?? 0,DIRECTIONS[direction]?.z ?? 1); return catalogs.navigation.mobility(actor.identity.speciesId,actor.identity.formId).canMove ? { kind: 'move',actorId: actor.actorId,destination: adjacent(position(actor),direction) } : { kind: 'wait',actorId: actor.actorId }; }
/** Terrain mask is distinct from natural-room junction and occupancy. The
 * current nineteen guests have no wall-mobility skill/scarf. Their actual
 * floor Pickup lots have no held effect. Broader mobility requires a new owner.
 * @param {Session} session @param {Actor} actor @param {Catalogs} catalogs */
export function escortNeighbourMask(session,actor,catalogs) {
  const nav = navigationContext(session,catalogs),native = catalogs.navigation.mobility(actor.identity.speciesId,actor.identity.formId).movementType;
  const liquid = catalogs.navigation.liquid(nav.tileset),mobility = native === 4 ? liquid === 'lava' ? 1 : 0 : native === 5 ? liquid === 'lava' ? 0 : 1 : native;
  if (![0,1,2].includes(mobility)) return blocked('escort-finite-mobility');
  const origin = position(actor);
  const kind = (/** @type {Position} */ p) => { const tile = session.floor.tiles[p.z]?.[p.x]; return tile ? catalogs.navigation.terrain(tile.terrainId).kind : 'wall'; };
  const nonwall = (/** @type {Position} */ p) => kind(p) !== 'wall';
  let mask = 0;
  for (let i = 0; i < 8; i++) {
    const p = adjacent(origin,i),destination = kind(p);
    if (destination === 'wall' || mobility === 0 && destination !== 'floor') continue;
    if (i % 2 && (!nonwall({ x: origin.x,z: p.z }) || !nonwall({ x: p.x,z: origin.z }))) continue;
    mask |= 1 << i;
  }
  return mask;
}
/** @param {Session} session @param {Actor} actor @param {number} direction @param {Catalogs} catalogs */
function canMove(session,actor,direction,catalogs) {
  const p = adjacent(position(actor),direction),tile = session.floor.tiles[p.z]?.[p.x];
  if (!tile || catalogs.navigation.terrain(tile.terrainId).impassable || !(escortNeighbourMask(session,actor,catalogs) & (1 << direction))) return { legal: false,monster: false };
  const monster = Object.values(session.actors).some(other => other.actorId !== actor.actorId && other.placement.kind === 'map' && other.placement.mapId === session.floor.mapId && other.placement.position.x === p.x && other.placement.position.z === p.z);
  return { legal: !monster,monster };
}
/** Native room lists use x outer, z inner and cap32, preserving source ties.
 * @param {Session} session @param {string|null} room */
function exits(session,room) {
  /** @type {Position[]} */ const result = [];
  if (room === null) return result;
  for (let x = 0; x < session.floor.width && result.length < FACTS.roomExitLimit; x++) for (let z = 0; z < session.floor.height && result.length < FACTS.roomExitLimit; z++) {
    const tile = session.floor.tiles[z]?.[x]; if (tile?.roomId === room && tile.junction) result.push({ x,z });
  }
  return result;
}
/** @param {Session} session @param {Actor} actor @param {Actor} target @param {Catalogs} catalogs */
function visible(session,actor,target,catalogs,policy = /** @type {'actual'|'extended'} */ ('extended')) {
  return target.placement.kind === 'map' && target.placement.mapId === session.floor.mapId && canSeeActor(session.floor,{ position: position(actor),blinded: actor.conditions.blinker?.statusId === 'blinker',seesInvisible: actor.conditions.blinker?.statusId === 'eyedrops' },{ actorId: target.actorId,position: target.placement.position,present: target.resources.hp > 0,invisible: target.conditions.invisible?.statusId === 'invisible' },navigationContext(session,catalogs),policy);
}
/** @param {Context} context @param {Session} session @param {Actor} actor @param {NativeAi} ai @param {Catalogs} catalogs */
function wander(context,session,actor,ai,catalogs) {
  const origin = position(actor),tile = session.floor.tiles[origin.z]?.[origin.x]; if (!tile) return blocked('escort-wander-tile');
  const setAdjacent = (/** @type {number} */ direction,/** @type {NativeAi['objective']} */ objective) => { ai.objective = objective; ai.targetPosition = adjacent(origin,direction); };
  if (tile.roomId === null) {
    const opposite = (currentDirection(actor)+4)%8,junction = FACTS.corridorJunctionMasks.includes(escortNeighbourMask(session,actor,catalogs));
    if (junction) { const d = DIRECTIONS[sample(context,8)]; if (!d) return blocked('escort-wander-direction'); actor.facing = facing(d.x,d.z); }
    for (let i = 0; i < 8; i++) { const direction = (currentDirection(actor)+(FACTS.faceIncrements[i] ?? 0)+8)%8; if (junction && direction === opposite || !canMove(session,actor,direction,catalogs).legal) continue; setAdjacent(direction,'roam'); return; }
  } else {
    const list = exits(session,tile.roomId);
    if (ai.moveRandomly || ai.objective !== 'leave-room' && list.length === 0) { setAdjacent(sample(context,8),'stand'); return; }
    if (ai.objective !== 'leave-room') for (let i = 0; i < FACTS.wanderExitAttempts; i++) {
      const exit = list[sample(context,list.length)]; if (!exit) return blocked('escort-wander-exit');
      if (distance(exit,origin) !== 0) { ai.objective = 'leave-room'; ai.targetPosition = { ...exit }; return; }
    }
    if (tile.junction) { const start = sample(context,8); for (let i = 0; i < 8; i++) { const direction = (start+i)%8,p = adjacent(origin,direction); if (session.floor.tiles[p.z]?.[p.x]?.roomId === null && canMove(session,actor,direction,catalogs).legal) { setAdjacent(direction,'roam'); return; } } }
    return;
  }
  setAdjacent(sample(context,8),'stand');
}
/** Run Away nearest threat preserves native wild-slot ties and the source
 * exit first-step >= distance bug. Mirrored target may legitimately be off map.
 * @param {Context} context @param {Session} session @param {Actor} actor @param {NativeAi} ai @param {Catalogs} catalogs */
function avoidEnemies(context,session,actor,ai,catalogs) {
  const origin = position(actor); let nearest = null,best = Infinity;
  for (const id of session.scheduler.wildSlots) { const other = id ? session.actors[id] : null; if (!other || other.affiliation !== 'hostile' || !visible(session,actor,other,catalogs,'actual')) continue; const d = distance(origin,position(other)); if (d < best) { best = d; nearest = other; } }
  if (!nearest) { wander(context,session,actor,ai,catalogs); return; }
  const threat = position(nearest),tile = session.floor.tiles[origin.z]?.[origin.x],threatTile = session.floor.tiles[threat.z]?.[threat.x];
  if (tile?.roomId !== null && tile?.roomId === threatTile?.roomId) {
    if (tile?.junction) {
      for (let direction = 0; direction < 8; direction++) { const p = adjacent(origin,direction); if (session.floor.tiles[p.z]?.[p.x]?.roomId !== tile.roomId && canMove(session,actor,direction,catalogs).legal) { ai.objective = 'run-away'; ai.targetPosition = p; return; } }
      ai.objective = 'stand'; ai.targetPosition = adjacent(origin,sample(context,8)); return;
    }
    let choice = null,farthest = -1;
    for (const exit of exits(session,tile?.roomId ?? null)) { const step = adjacent(origin,directionTo(origin,exit)); if (distance(step,threat) < best) continue; const d = distance(exit,threat); if (d > farthest) { farthest = d; choice = exit; } }
    if (choice) { ai.objective = 'run-away'; ai.targetPosition = { ...choice }; return; }
  }
  ai.objective = 'run-away'; ai.targetPosition = { x: 2*origin.x-threat.x,z: 2*origin.z-threat.z };
}
/** @param {Context} context @param {Session} session @param {Actor} actor @param {NativeAi} ai @param {Catalogs} catalogs */
function chooseTarget(context,session,actor,ai,catalogs) {
  const leader = session.actors[session.leaderActorId],slot = session.scheduler.teamSlots.indexOf(session.leaderActorId),ref = slotAt(session,'team',slot);
  if (leader && leader.affiliation === 'team' && leader.conditions.curse?.statusId !== 'decoy' && ref && visible(session,actor,leader,catalogs)) {
    ai.objective = 'chase'; ai.targetPosition = { ...position(leader) }; ai.target = { ref,mapId: session.floor.mapId }; ai.moveRandomly = false; return;
  }
  if (['chase','remembered'].includes(ai.objective) && ai.target) {
    const target = ai.target.mapId === session.floor.mapId ? actorAt(session,ai.target.ref) : null;
    if (!target) { ai.objective = 'stand'; ai.target = null; }
    else for (const p of session.nativeTeamHistory?.members[target.actorId]?.positions ?? []) if (isExtendedTargetInSight(session.floor,position(actor),p,navigationContext(session,catalogs))) { ai.objective = 'remembered'; ai.targetPosition = { ...p }; ai.moveRandomly = false; return; }
  }
  wander(context,session,actor,ai,catalogs);
}
/** Direct, then native ±45/±90 source turns. Compute all alternatives before
 * choosing because terrain blockage can restore a suppressed diagonal turn.
 * @param {Session} session @param {Actor} actor @param {NativeAi} ai @param {Catalogs} catalogs @param {boolean} runaway @returns {Action} */
function decide(session,actor,ai,catalogs,runaway) {
  const origin = position(actor),wait = /** @type {Action} */ ({ kind: 'wait',actorId: actor.actorId });
  if (distance(origin,ai.targetPosition) === 0) return wait;
  let direction = directionTo(origin,ai.targetPosition); if (ai.turningAround) direction = (direction+4)%8;
  const direct = canMove(session,actor,direction,catalogs); if (direct.legal) return walk(actor,direction,catalogs);
  if (direct.monster) {
    if (!ai.recalculateFollow) { ai.notNextToTarget = true; ai.allySkip = true; ai.waiting = true; return wait; }
    if (distance(adjacent(origin,direction),ai.targetPosition) === 0) { ai.waiting = true; return wait; }
    ai.notNextToTarget = true;
  }
  const allowed = [true,true,true,true,true];
  const dx = Math.abs(origin.x-ai.targetPosition.x),dz = Math.abs(origin.z-ai.targetPosition.z);
  if (direction%2 && dx <= 2 && dz <= 2 && dx !== dz) allowed[(direction & 2) ? dx < dz ? 2 : 1 : dx < dz ? 1 : 2] = false;
  const limit = runaway || ai.turningAround ? 5 : 3;
  const choices = Array.from({ length: limit-1 },(_,index) => { const i = index+1,d = (direction+(FACTS.faceIncrements[i] ?? 0)+8)%8; return { i,d,...canMove(session,actor,d,catalogs) }; });
  if (choices.some(row => !row.legal && !row.monster)) { allowed[1] = true; allowed[2] = true; }
  for (const row of choices) { if (row.legal && allowed[row.i]) return walk(actor,row.d,catalogs); if (row.monster) ai.notNextToTarget = true; }
  ai.waiting = true; if (ai.notNextToTarget) ai.allySkip = true; return wait;
}
/** Native status gate, move choice and movement use the actual guest resources,
 * dense slots, source-facing order and saved browser RNG mapping. No pathfinder,
 * reroll of exhausted move, ground-item AI or permanent party edit is involved.
 * @param {Context} context @param {Actor} actor @param {Catalogs} catalogs @returns {Action} */
export function chooseNativeEscortAction(context,actor,catalogs) {
  const session = context.state.session,guest = session?.escortGuest,ai = guest?.ai;
  if (!session || !guest || guest.lifecycle.kind !== 'live' || guest.entry.actorId !== actor.actorId || actor.binding.kind !== 'escort-guest' || !ai || ai.mapId !== session.floor.mapId || session.nativeTeamHistory?.mapId !== session.floor.mapId) return blocked('escort-ai-current-owner');
  const wait = /** @type {Action} */ ({ kind: 'wait',actorId: actor.actorId }),c = actor.conditions;
  ai.allySkip = false; ai.waiting = false; ai.recalculateFollow = actor.speed.replan;
  if (['nightmare','sleep','napping'].includes(c.sleep?.statusId ?? '') || ['frozen','wrap','wrapped','petrified'].includes(c.frozen?.statusId ?? '') || ['paused','infatuated'].includes(c.cringe?.statusId ?? '') || c.bide?.statusId === 'bide') return wait;
  const runaway = ability(actor,catalogs,'Run Away') && actor.resources.hp < Math.trunc(maxHp(actor)/2);
  const chooseAttack = () => {
    const blockedAttack = c.cringe?.statusId === 'cringe' || c.burn?.statusId === 'paralysis' || runaway;
    if (blockedAttack || c.cringe?.statusId === 'confused' && sample(context,100) < 70) return null;
    return chooseNativeEscortMove(context,actor,catalogs);
  };
  if (c.curse?.statusId === 'decoy' || c.blinker?.statusId === 'cross-eyed') return walk(actor,sample(context,8),catalogs);
  if (c.blinker?.statusId === 'blinker') { const direction = currentDirection(actor); if (canMove(session,actor,direction,catalogs).legal) return walk(actor,direction,catalogs); if (sample(context,2) !== 0) return walk(actor,sample(context,8),catalogs); return chooseAttack() ?? wait; }
  const attack = chooseAttack(); if (attack) return attack;
  if (c.cringe?.statusId === 'confused') return walk(actor,currentDirection(actor),catalogs);
  if (!catalogs.navigation.mobility(actor.identity.speciesId,actor.identity.formId).canMove || Math.trunc(value(actor.resources.belly)) === 0) return wait;
  ai.notNextToTarget = false; ai.targetingEnemy = false; ai.turningAround = false;
  if (runaway) avoidEnemies(context,session,actor,ai,catalogs); else chooseTarget(context,session,actor,ai,catalogs);
  return decide(session,actor,ai,catalogs,runaway);
}
