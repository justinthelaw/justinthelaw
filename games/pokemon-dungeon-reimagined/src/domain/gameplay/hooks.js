import { OPENING_SLEEP_CHANCES } from '../../../content/state/opening-facts.js';
import { useBerry } from './items.js';
import { applyExperience } from './growth.js';
import { movementPlan } from './movement.js';
import { canStep, canMeleeAttack } from '../navigation/geometry.js';
import { findPath } from '../navigation/path.js';
import { isActuallyInSight, visibleTiles } from '../navigation/sight.js';
import { actorAt, sessionOf } from '../turns/support.js';
import { attack } from './combat.js';
import { createActor } from './actors.js';
import { takeStairs, settleExpedition } from './expedition.js';
import { draw, value, quantity, maxHp, profile, blocked, navActor, navigationContext, occupants, facing, FACINGS } from './support.js';

/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @type {import('../turns/types.js').HookResult} */ const CONTINUE = Object.freeze({ kind: 'continue' });
/** @param {boolean} [movement] @returns {import('../turns/types.js').EffectResult} */
const done = (movement = false) => ({ kind: 'done', movement, leaderChanged: false, stop: 'none' });
/** @param {import('../turns/types.js').MutationContext} context @param {import('../turns/types.js').ActorRef} ref */
function actor(context, ref) { const result = actorAt(sessionOf(context), ref); if (!result) return blocked('actor-reference'); return result; }

/** All fifteen hooks are synchronous, using the single canonical draft. AI is
 * an explicit deterministic browser choice policy: adjacent regular attack,
 * otherwise a legal sight-limited path; no unavailable move is substituted.
 * @param {Catalogs} catalogs @param {import('../../../content/authored/opening.js').AuthoredOpening} authored
 * @returns {import('../turns/types.js').TurnHooks} */
export function createTurnHooks(catalogs, authored) {
  /** @type {import('../turns/types.js').TurnHooks} */ const hooks = {
    speed(context, ref) {
      const a = actor(context, ref); const p = profile(a.identity, catalogs);
      return { baseMovementSpeed: p.baseMovementSpeed, positiveTimers: a.speed.positiveTimers, negativeTimers: a.speed.negativeTimers, paralyzed: a.conditions.burn?.statusId === 'paralysis', iceType: p.typeIds.includes(6), snow: false, deoxysSpeedForm: false, wildKecleonInTheftMode: false };
    },
    spawn(context) {
      const s = sessionOf(context); s.floor.arrivalCounter++;
      if (s.floor.arrivalCounter < 36) return CONTINUE;
      s.floor.arrivalCounter = 0;
      if (s.scheduler.wildSlots.filter(Boolean).length >= 10 || !('address' in s.floor.location)) return CONTINUE;
      const floor = catalogs.dungeons.getFloorById(s.floor.location.address.floorId); const pool = catalogs.dungeons.getEncounterPool(floor.encounterPoolId);
      const roll = draw(context.state, 10000, 'encountersItems');
      const choice = pool.rows.find(row => row.entryRole === 'weighted-candidate' && row.selectionThreshold >= roll);
      if (!choice?.speciesId) return blocked('arrival-species');
      const leader = s.actors[s.leaderActorId]; if (leader?.placement.kind !== 'map') return blocked('arrival-leader');
      const occupied = occupants(s); const objects = Object.values(context.state.containers).flatMap(c => c.owner.kind === 'floor' ? [c.owner.position] : []);
      /** @type {import('../../contracts.js').GridPosition[]} */ const positions = [];
      for (let pass = 0; pass < 3 && positions.length === 0; pass++) {
        const startX = draw(context.state, s.floor.width, 'encountersItems'); const startZ = draw(context.state, s.floor.height, 'encountersItems');
        for (let dx = 0; dx < s.floor.width; dx++) for (let dz = 0; dz < s.floor.height; dz++) {
          const x = (startX + dx) % s.floor.width; const z = (startZ + dz) % s.floor.height; const tile = s.floor.tiles[z]?.[x];
          if (!tile || catalogs.navigation.terrain(tile.terrainId).kind !== 'floor' || pass < 2 && tile.roomId === null || pass === 0 && Math.abs(x - leader.placement.position.x) < 6 && Math.abs(z - leader.placement.position.z) < 6 || [...occupied.map(a => a.position), ...objects, ...Object.values(s.floor.exits).map(e => e.position)].some(p => p.x === x && p.z === z)) continue;
          positions.push({ x, z });
        }
      }
      if (!positions.length) return CONTINUE;
      const position = positions[draw(context.state, positions.length, 'encountersItems')]; if (!position) return blocked('arrival-position');
      draw(context.state, 100, 'encountersItems'); // source random-movement check, Tiny Woods chance zero
      const identity = /** @type {import('../../contracts/campaign.js').SpeciesForm} */ ({ speciesId: choice.speciesId, formId: choice.formId });
      const a = createActor(context.state, catalogs, { kind: 'wild', encounterId: /** @type {import('../../contracts/campaign.js').EncounterId} */ (`tiny-woods-${identity.speciesId}`), spawnedAt: { ...s.floor.location.address } }, identity, choice.level, s.floor.mapId, position, s.sessionId);
      const chance = OPENING_SLEEP_CHANCES[identity.speciesId]; if (chance === undefined) return blocked('spawn-sleep-chance');
      if (draw(context.state, 100, 'encountersItems') < chance) a.conditions.sleep = { statusId: 'sleep', source: { kind: 'actor', actor: { sessionId: s.sessionId, mapId: s.floor.mapId, actorId: a.actorId, identity: a.identity }, moveId: null }, duration: { kind: 'indefinite', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-spawn-sleep') }, periodicCountdown: null, payload: { kind: 'none' } };
      s.actors[a.actorId] = a; s.scheduler.wildSlots[s.scheduler.wildSlots.indexOf(null)] = a.actorId;
      return CONTINUE;
    },
    refreshSides(context) {
      const s = sessionOf(context);
      for (const id of s.scheduler.teamSlots) if (id && s.actors[id]?.affiliation !== 'team') return blocked('team-affiliation');
      return CONTINUE;
    },
    forcedLoss(context) {
      const s = context.state.session;
      if (s && s.teamOrder.some(id => s.actors[id]?.resources.hp === 0)) settleExpedition(context, 'fainting', catalogs);
      return CONTINUE;
    },
    begin(context, ref) {
      const a = actor(context, ref); const p = profile(a.identity, catalogs);
      if (a.affiliation === 'team' && value(a.resources.belly) >= 1 && p.regenerationRate !== 0) {
        const rate = Math.max(30, Math.min(500, p.regenerationRate)); const total = value(a.resources.hpRegenerationAccumulator) + maxHp(a);
        a.resources.hp = Math.min(maxHp(a), a.resources.hp + Math.trunc(total / rate)); a.resources.hpRegenerationAccumulator = quantity(total % rate);
      }
      for (const group of /** @type {const} */ (['burn', 'cringe'])) {
        const condition = a.conditions[group];
        if (condition?.duration.kind === 'counter') {
          condition.duration.remaining--;
          if (condition.duration.remaining === 0) { a.conditions[group] = null; context.emit({ type: 'conditionChanged', actorId: a.actorId }); }
        }
      }
      a.speed.cachedStage = Math.max(0, Math.min(4, p.baseMovementSpeed + a.speed.positiveTimers.filter(Boolean).length - a.speed.negativeTimers.filter(Boolean).length - Number(a.conditions.burn?.statusId === 'paralysis')));
      return { kind: 'continue', canAct: a.conditions.sleep === null && a.conditions.cringe?.statusId !== 'infatuated' };
    },
    experience(context, ref) { if (ref) applyExperience(context, actor(context, ref), catalogs); return CONTINUE; },
    ai(context, ref) {
      const s = sessionOf(context); const a = actor(context, ref); if (a.placement.kind !== 'map') return blocked('ai-placement');
      if (a.speed.petrifiedSwap) {
        const angle = FACINGS.indexOf(a.facing) * Math.PI / 4;
        return { kind: 'action', action: { kind: 'move', actorId: a.actorId, destination: { x: a.placement.position.x + Math.round(Math.sin(angle)), z: a.placement.position.z - Math.round(Math.cos(angle)) } } };
      }
      const nav = navigationContext(s, catalogs); const enemies = Object.values(s.actors).filter(other => other.placement.kind === 'map' && other.affiliation !== a.affiliation && other.affiliation !== 'neutral');
      const adjacent = enemies.find(other => other.placement.kind === 'map' && canMeleeAttack(navActor(a), s.floor, other.placement.position, nav));
      if (adjacent && a.conditions.burn?.statusId !== 'paralysis') return { kind: 'action', action: { kind: 'attack', actorId: a.actorId, target: { kind: 'actor', actorId: adjacent.actorId } } };
      const target = a.affiliation === 'team' ? s.actors[s.leaderActorId] : enemies.find(other => other.placement.kind === 'map' && isActuallyInSight(s.floor, navActor(a).position, other.placement.position, nav.visibilityRange));
      if (target?.placement.kind === 'map') {
        const path = findPath(navActor(a), s.floor, target.placement.position, occupants(s), nav, { allowOccupiedGoal: true, maxSteps: 4096 }); const step = path.path[0];
        if (step && path.path.length > (a.affiliation === 'team' ? 1 : 0) && canStep(navActor(a), s.floor, a.placement.position, step, occupants(s), nav)) return { kind: 'action', action: { kind: 'move', actorId: a.actorId, destination: { ...step } } };
      }
      return { kind: 'action', action: { kind: 'wait', actorId: a.actorId } };
    },
    startAction(context, ref, action) {
      const s = sessionOf(context); const a = actor(context, ref);
      if (action.kind === 'wait') return done();
      if (action.kind === 'item') { useBerry(context, action); return done(); }
      if (action.kind === 'move') {
        const plan = movementPlan(s, a, action.destination, catalogs);
        if (a.placement.kind !== 'map' || plan.kind === 'blocked') return { kind: 'rejected', reason: 'unavailable' };
        const from = { ...a.placement.position }; a.facing = facing(action.destination.x - from.x, action.destination.z - from.z);
        if (plan.kind === 'swap') {
          const other = s.actors[plan.other]; if (!other) return blocked('swap-participant');
          // R dungeon_main.c:sub_805EC4C sets both 0x8000 flags and reverse
          // walk direction. Engine's special pass ticks/moves the counterpart,
          // then consumes 0x4000 in the ordinary team pass exactly once.
          a.speed.petrifiedSwap = true; other.speed.petrifiedSwap = true;
          other.facing = facing(from.x - action.destination.x, from.z - action.destination.z);
          s.scheduler.continuation.petrifiedSwapPending = true;
        }
        a.placement.position = { ...action.destination };
        context.emit({ type: 'actorMoved', actorId: a.actorId, from, to: { ...action.destination } }); return done(true);
      }
      if (action.kind === 'attack' || action.kind === 'move-use') { attack(context, a, action, catalogs); return done(); }
      if (action.kind === 'exit') { takeStairs(context, catalogs, authored, action.exitId); return done(); }
      if (action.kind === 'give-up') { settleExpedition(context, 'give-up', catalogs); return done(); }
      return blocked('action-effect');
    },
    effect() { return blocked('unsupported-effect-cursor'); },
    effectAllowed() { return blocked('unsupported-effect-cursor'); },
    invalidReference() { return blocked('unsupported-effect-reference'); },
    end(context, ref) {
      const a = actor(context, ref); const s = sessionOf(context);
      if (a.actorId === s.leaderActorId) {
        const belly = Math.trunc(value(a.resources.belly) * 65536) - 6554;
        a.resources.belly = belly < 65536 ? quantity(0) : quantity(belly, 65536);
        if (!a.resources.belly.numerator) { a.resources.hp = Math.max(0, a.resources.hp - 1); context.emit({ type: 'message', messageId: 'hunger-damage' }); }
      }
      draw(context.state, 100); // Shed Skin sample precedes ability check on every end call.
      return hooks.forcedLoss(context);
    },
    tile(context, ref) {
      const a = actor(context, ref); const s = sessionOf(context); if (a.actorId !== s.leaderActorId || a.placement.kind !== 'map') return CONTINUE;
      const position = a.placement.position;
      for (const c of Object.values(context.state.containers)) if (c.owner.kind === 'floor' && c.owner.mapId === s.floor.mapId && c.owner.position.x === position.x && c.owner.position.z === position.z) {
        const bag = context.state.containers[s.inventory]; if (!bag) return blocked('toolbox');
        for (const id of [...c.itemIds]) { const item = context.state.items[id]; if (!item) continue;
          if (item.template.itemId === 'item-poke') { s.carriedMoney = Math.min(99999, s.carriedMoney + item.quantity); delete context.state.items[id]; }
          else { if (bag.itemIds.length >= 20) continue; bag.itemIds.push(id); }
          c.itemIds.splice(c.itemIds.indexOf(id), 1); context.emit({ type: 'itemChanged', itemInstanceId: id });
        }
        if (!c.itemIds.length) delete context.state.containers[c.containerId];
      }
      return CONTINUE;
    },
    room(context, ref) {
      const s = sessionOf(context); const a = actor(context, ref); if (a.actorId === s.leaderActorId && a.placement.kind === 'map') {
        const visible = visibleTiles(s.floor, a.placement.position, navigationContext(s, catalogs).visibilityRange);
        s.floor.knowledge.explored = visible.map((row, z) => row.map((cell, x) => cell || s.floor.knowledge.explored[z]?.[x] === true));
      }
      return CONTINUE;
    },
    wind(context) {
      const s = sessionOf(context); s.floor.turnCounter++; s.floor.windCounter = Math.max(0, s.floor.windCounter - 1);
      if ([249, 149, 49].includes(s.floor.windCounter)) context.emit({ type: 'message', messageId: `wind-${s.floor.windCounter}` });
      if (s.floor.windCounter === 0) settleExpedition(context, 'wind-expulsion', catalogs);
      return CONTINUE;
    },
  };
  return hooks;
}
