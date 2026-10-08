import { tickLeechSeed, pulseLeechSeed, tickWaterSport } from './field-moves.js';
import { currentSpeedContext } from './speed-context.js';
import { clearPetrified } from './status-interruptions.js';
import { refreshFieldAbilities } from './field-abilities.js';
import { transferHeldItem } from './held-items.js';
import { STEEL } from '../../../content/authored/mt-steel.js';
import { STEEL_SLEEP_CHANCES } from '../../../content/state/steel-facts.js';
import { finishSteelBattle } from './steel.js';
import { chooseNativeWildMove } from './native-wild-moves.js';
import { confusedAction } from './confused-action.js';
import { tickBattleStatus, endBide } from './battle-status.js';
import { endRage } from './damage-status.js';
import { SPAWN_SLEEP_CHANCES, eligibleEncounter } from '../../../content/state/expedition-facts.js';
import { selectEncounter } from '../generation/encounters.js';
import { tickConditions, periodicStatusDamage, resetStatChanges } from './conditions.js';
import { useDungeonItem, pickup } from './items.js';
import { applyExperience } from './growth.js';
import { movementPlan } from './movement.js';
import { pendingSpecialSwap } from './swap-continuation.js';
import { canStep, canMeleeAttack } from '../navigation/geometry.js';
import { findPath } from '../navigation/path.js';
import { isActuallyInSight, visibleTiles } from '../navigation/sight.js';
import { actorAt, sessionOf } from '../turns/support.js';
import { attack, releaseBide } from './combat.js';
import { dealDamage } from './damage-resolution.js';
import { tryRevive } from './revival.js';
import { createActor } from './actors.js';
import { takeStairs, settleExpedition } from './expedition.js';
import { draw, value, quantity, maxHp, profile, ability, blocked, navActor, navigationContext, occupants, facing, FACINGS } from './support.js';

/** @typedef {import('./support.js').Catalogs} Catalogs */
/** @type {import('../turns/types.js').HookResult} */ const CONTINUE = Object.freeze({ kind: 'continue' });
/** @param {boolean} [movement] @returns {import('../turns/types.js').EffectResult} */
const done = (movement = false) => ({ kind: 'done', movement, leaderChanged: false, stop: 'none' });
/** @param {import('../turns/types.js').MutationContext} context @param {import('../turns/types.js').ActorRef} ref */
function actor(context, ref) { const result = actorAt(sessionOf(context), ref); if (!result) return blocked('actor-reference'); return result; }

/** All sixteen hooks are synchronous, using the single canonical draft. AI is
 * earlier/Steel wild move selection uses the source kernel. Partner move/item
 * selection and native movement remain explicit implementation obligations.
 * @param {Catalogs} catalogs @param {import('../../../content/authored/opening.js').AuthoredOpening} authored
 * @returns {import('../turns/types.js').TurnHooks} */
export function createTurnHooks(catalogs, authored) {
  /** @type {import('../turns/types.js').TurnHooks} */ const hooks = {
    speed(context, ref) {
      return currentSpeedContext(actor(context, ref), catalogs);
    },
    spawn(context) {
      const s = sessionOf(context);
      if (!('address' in s.floor.location)) return CONTINUE;
      const sourceFloor = catalogs.dungeons.getFloorById(s.floor.location.address.floorId);
      if (catalogs.dungeons.getGeneration(sourceFloor.generationId).parameters.enemyDensity === 0) return CONTINUE;
      s.floor.arrivalCounter++;
      if (s.floor.arrivalCounter < 36) return CONTINUE;
      s.floor.arrivalCounter = 0;
      if (s.scheduler.wildSlots.filter(Boolean).length >= 10 || !('address' in s.floor.location)) return CONTINUE;
      const floor = catalogs.dungeons.getFloorById(s.floor.location.address.floorId); const pool = catalogs.dungeons.getEncounterPool(floor.encounterPoolId);
      const choice = selectEncounter(pool.rows, eligibleEncounter, cap => draw(context.state, cap, 'encountersItems'));
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
      if (catalogs.dungeons.getRestrictions(floor.restrictionId).fields.randomMovementChance !== 0) return blocked('random-movement-policy');
      draw(context.state, 100, 'encountersItems'); // both admitted routes have zero random movement
      const identity = /** @type {import('../../contracts/campaign.js').SpeciesForm} */ ({ speciesId: choice.speciesId, formId: choice.formId });
      const a = createActor(context.state, catalogs, { kind: 'wild', encounterId: /** @type {import('../../contracts/campaign.js').EncounterId} */ (`${s.dungeonId}-${identity.speciesId}`), spawnedAt: { ...s.floor.location.address } }, identity, choice.level, s.floor.mapId, position, s.sessionId);
      const chance = SPAWN_SLEEP_CHANCES[identity.speciesId] ?? STEEL_SLEEP_CHANCES[identity.speciesId]; if (chance === undefined) return blocked('spawn-sleep-chance');
      if (draw(context.state, 100, 'encountersItems') < chance) a.conditions.sleep = { statusId: 'sleep', source: { kind: 'actor', actor: { sessionId: s.sessionId, mapId: s.floor.mapId, actorId: a.actorId, identity: a.identity }, moveId: null }, duration: { kind: 'indefinite', policyId: /** @type {import('../../contracts/campaign.js').PolicyId} */ ('native-spawn-sleep') }, periodicCountdown: null, payload: { kind: 'none' } };
      s.actors[a.actorId] = a; s.scheduler.wildSlots[s.scheduler.wildSlots.indexOf(null)] = a.actorId;
      return CONTINUE;
    },
    refreshSides(context) {
      const s = sessionOf(context);
      refreshFieldAbilities(context.state, catalogs);
      for (const id of s.scheduler.teamSlots) if (id && s.actors[id]?.affiliation !== 'team') return blocked('team-affiliation');
      return CONTINUE;
    },
    forcedLoss(context) {
      const s = context.state.session;
      if (s) for (const id of s.teamOrder) { const member = s.actors[id]; if (member) tryRevive(context, member, catalogs); }
      if (s && s.teamOrder.some(id => s.actors[id]?.resources.hp === 0)) settleExpedition(context, 'fainting', catalogs, authored);
      else if (s) finishSteelBattle(context, authored);
      return CONTINUE;
    },
    begin(context, ref) {
      const a = actor(context, ref); const p = profile(a.identity, catalogs);
      if (a.affiliation === 'team' && !['poisoned', 'badly-poisoned'].includes(a.conditions.burn?.statusId ?? '') && value(a.resources.belly) >= 1 && p.regenerationRate !== 0) {
        const rate = Math.max(30, Math.min(500, p.regenerationRate)); const total = value(a.resources.hpRegenerationAccumulator) + maxHp(a);
        a.resources.hp = Math.min(maxHp(a), a.resources.hp + Math.trunc(total / rate)); a.resources.hpRegenerationAccumulator = quantity(total % rate);
      }
      tickConditions(context, a, catalogs);
      tickLeechSeed(context, a);
      tickBattleStatus(context, a);
      if (a.conditions.bide?.statusId === 'charging' && (a.conditions.sleep || a.conditions.cringe?.statusId === 'infatuated')) { a.conditions.bide = null; context.emit({ type: 'conditionChanged', actorId: a.actorId }); }
      // The flagged counterpart's native special pass ticks first, then AI
      // releases only Petrified before its forced walk. Ordinary actors pass.
      const swap = a.speed.petrifiedSwap && sessionOf(context).scheduler.continuation.special !== null;
      // R dungeon_engine.c:151–175 and dungeon_ai.c:34–64: the real
      // flagged opportunity retains its queued WALK after all ticks and bypasses
      // the entire ordinary AI status gate; it only clears Petrified in AI.
      return { kind: 'continue', canAct: swap || a.conditions.frozen?.statusId !== 'petrified' && a.conditions.sleep === null && a.conditions.cringe?.statusId !== 'infatuated' && a.conditions.bide?.statusId !== 'bide' };
    },
    fieldUpkeep(context) { tickWaterSport(context); return CONTINUE; },
    experience(context, ref) { if (ref) applyExperience(context, actor(context, ref), catalogs); return CONTINUE; },
    ai(context, ref) {
      const s = sessionOf(context); const a = actor(context, ref); if (a.placement.kind !== 'map') return blocked('ai-placement');
      if (a.binding.kind === 'guest' && a.binding.storyActorId === STEEL.clientRole) return { kind: 'action', action: { kind: 'wait', actorId: a.actorId } };
      if (a.binding.kind === 'job-client') {
        // Rescue-target AI passes/walks with a random facing. Native role
        // treatment suppresses pursuit/attacks, not eaten Blast Seed damage.
        const direction = draw(context.state, 8), angle = direction * Math.PI / 4;
        a.facing = FACINGS[direction] ?? 'n';
        const destination = { x: a.placement.position.x + Math.round(Math.sin(angle)), z: a.placement.position.z - Math.round(Math.cos(angle)) };
        const walk = catalogs.navigation.mobility(a.identity.speciesId, a.identity.formId).canMove && movementPlan(s, a, destination, catalogs).kind === 'walk';
        return { kind: 'action', action: walk ? { kind: 'move', actorId: a.actorId, destination } : { kind: 'wait', actorId: a.actorId } };
      }
      // Deferred opportunities skip begin. Only the actual flagged special
      // pass may release Petrified; retain old flag behavior for other actors.
      const specialSwap = a.speed.petrifiedSwap && s.scheduler.continuation.special !== null;
      if (a.conditions.frozen?.statusId === 'petrified' && !specialSwap) return { kind: 'action', action: { kind: 'wait', actorId: a.actorId } };
      if (a.speed.petrifiedSwap) {
        clearPetrified(context, a);
        const angle = FACINGS.indexOf(a.facing) * Math.PI / 4;
        return { kind: 'action', action: { kind: 'move', actorId: a.actorId, destination: { x: a.placement.position.x + Math.round(Math.sin(angle)), z: a.placement.position.z - Math.round(Math.cos(angle)) } } };
      }
      const nav = navigationContext(s, catalogs); const enemies = Object.values(s.actors).filter(other => other.placement.kind === 'map' && other.affiliation !== a.affiliation && other.affiliation !== 'neutral');
      const confused = a.conditions.cringe?.statusId === 'confused';
      const runningAway = a.actorId !== s.leaderActorId && ability(a, catalogs, 'Run Away') && a.resources.hp < Math.trunc(maxHp(a) / 2);
      // ChooseAIMove exits for Run Away before its confusion chance. Confused
      // actors then use pass/walk directly, without entering flee pathfinding.
      if (runningAway && !confused) {
        const origin = a.placement.position;
        const threats = enemies.filter(other => other.placement.kind === 'map' && isActuallyInSight(s.floor, origin, other.placement.position, nav.visibilityRange));
        const distance = (/** @type {import('../../contracts.js').GridPosition} */ pos) => Math.min(...threats.map(other => other.placement.kind === 'map' ? Math.max(Math.abs(pos.x - other.placement.position.x), Math.abs(pos.z - other.placement.position.z)) : Infinity));
        const moves = FACINGS.map((_, i) => ({ x: origin.x + Math.round(Math.sin(i * Math.PI / 4)), z: origin.z - Math.round(Math.cos(i * Math.PI / 4)) })).filter(pos => canStep(navActor(a), s.floor, origin, pos, occupants(s), nav)).sort((left, right) => distance(right) - distance(left));
        const destination = threats.length ? moves.find(pos => distance(pos) > distance(origin)) : null;
        return { kind: 'action', action: destination ? { kind: 'move', actorId: a.actorId, destination } : { kind: 'wait', actorId: a.actorId } };
      }
      const skipAttack = a.conditions.cringe?.statusId === 'cringe' || a.conditions.burn?.statusId === 'paralysis' || runningAway || confused && draw(context.state, 100) < 70;
      const nativeWild = ['tiny-woods', 'thunderwave-cave', 'mt-steel'].includes(s.dungeonId) && a.affiliation === 'hostile';
      if (nativeWild && !skipAttack) {
        const chosen = chooseNativeWildMove(context, a, catalogs);
        if (chosen) return { kind: 'action', action: chosen };
      }
      // GetTreatment(..., checkPetrified=TRUE) excludes Petrified opponents
      // for team AI. Keep manual attacks and flee threat scanning unchanged.
      const adjacent = enemies.find(other => !(a.affiliation === 'team' && other.conditions.frozen?.statusId === 'petrified') && other.placement.kind === 'map' && canMeleeAttack(navActor(a), s.floor, other.placement.position, nav));
      if (!nativeWild && adjacent && !skipAttack) return { kind: 'action', action: { kind: 'attack', actorId: a.actorId, target: { kind: 'actor', actorId: adjacent.actorId } } };
      if (confused) {
        if (!catalogs.navigation.mobility(a.identity.speciesId, a.identity.formId).canMove) return { kind: 'action', action: { kind: 'wait', actorId: a.actorId } };
        const angle = FACINGS.indexOf(a.facing) * Math.PI / 4;
        return { kind: 'action', action: { kind: 'move', actorId: a.actorId, destination: { x: a.placement.position.x + Math.round(Math.sin(angle)), z: a.placement.position.z - Math.round(Math.cos(angle)) } } };
      }
      const target = a.affiliation === 'team' ? s.actors[s.leaderActorId] : enemies.find(other => other.placement.kind === 'map' && isActuallyInSight(s.floor, navActor(a).position, other.placement.position, nav.visibilityRange));
      if (target?.placement.kind === 'map') {
        const path = findPath(navActor(a), s.floor, target.placement.position, occupants(s), nav, { allowOccupiedGoal: true, maxSteps: 4096 }); const step = path.path[0];
        if (step && path.path.length > (a.affiliation === 'team' ? 1 : 0) && canStep(navActor(a), s.floor, a.placement.position, step, occupants(s), nav)) return { kind: 'action', action: { kind: 'move', actorId: a.actorId, destination: { ...step } } };
      }
      return { kind: 'action', action: { kind: 'wait', actorId: a.actorId } };
    },
    startAction(context, ref, action) {
      const s = sessionOf(context); const a = actor(context, ref);
      const charging = a.conditions.bide?.statusId === 'charging' ? a.conditions.bide : null;
      try {
        action = confusedAction(context, a, action, catalogs);
        if (action.kind === 'wait') return done();
        if (action.kind === 'item') { if (action.operation === 'equip') transferHeldItem(context, action); else useDungeonItem(context, action, catalogs); return done(); }
        if (action.kind === 'move') {
          const swap = pendingSpecialSwap(s, catalogs);
          // Native flagged WALK bypasses the second ordinary direction check
          // (dungeon_action_execution.c:143–144). Complete only this proved pair
          // into its safe vacant origin; never infer an arbitrary forced move.
          const forced = swap?.other.actorId === a.actorId && s.scheduler.continuation.active?.actorId === a.actorId && action.destination.x === swap.origin.x && action.destination.z === swap.origin.z;
          const plan = forced ? { kind: /** @type {const} */ ('walk') } : movementPlan(s, a, action.destination, catalogs);
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
        if (action.kind === 'attack' || action.kind === 'struggle' || action.kind === 'move-use') { attack(context, a, action, catalogs); return done(); }
        if (action.kind === 'exit') { takeStairs(context, catalogs, authored, action.exitId); return done(); }
        if (action.kind === 'give-up') { settleExpedition(context, 'give-up', catalogs, authored); return done(); }
        return blocked('action-effect');
      } finally {
        // Native action completion clears an old Charge after any action, even
        // a pass, item or non-electric move. A newly applied Charge survives.
        if (charging && a.conditions.bide === charging) { a.conditions.bide = null; context.emit({ type: 'conditionChanged', actorId: a.actorId }); }
      }
    },
    effect() { return blocked('unsupported-effect-cursor'); },
    effectAllowed() { return blocked('unsupported-effect-cursor'); },
    invalidReference() { return blocked('unsupported-effect-reference'); },
    end(context, ref) {
      const a = actor(context, ref); const s = sessionOf(context);
      if (a.actorId === s.leaderActorId) {
        const belly = Math.trunc(value(a.resources.belly) * 65536) - 6554;
        a.resources.belly = belly < 65536 ? quantity(0) : quantity(belly, 65536);
        if (!a.resources.belly.numerator) { dealDamage(context, a, catalogs, { attacker: null, amount: 1, contact: false, physical: false, giveExperience: false }); context.emit({ type: 'message', messageId: 'hunger-damage' }); }
      }
      if (a.resources.hp === 0) return hooks.forcedLoss(context);
      draw(context.state, 100); // Native Shed Skin sample precedes periodic poison.
      const periodicDamage = periodicStatusDamage(context, a);
      if (periodicDamage) dealDamage(context, a, catalogs, { attacker: null, amount: periodicDamage, contact: false, physical: false, giveExperience: false });
      if (a.resources.hp > 0 && !s.teamOrder.some(id => s.actors[id]?.resources.hp === 0) && !(context.state.steel?.bossDefeated && context.state.steel.phase === 'battle')) pulseLeechSeed(context, a, catalogs);
      if (a.resources.hp > 0 && !s.teamOrder.some(id => s.actors[id]?.resources.hp === 0) && !(context.state.steel?.bossDefeated && context.state.steel.phase === 'battle')) { const stored = endBide(context, a, catalogs); if (stored !== null) releaseBide(context, a, stored, catalogs); }
      if (a.resources.hp > 0 && !s.teamOrder.some(id => s.actors[id]?.resources.hp === 0) && !(context.state.steel?.bossDefeated && context.state.steel.phase === 'battle')) endRage(context, a);
      return hooks.forcedLoss(context);
    },
    tile(context, ref) {
      const a = actor(context, ref); const s = sessionOf(context); if (a.placement.kind !== 'map') return CONTINUE;
      const position = a.placement.position;
      for (const trap of Object.values(s.floor.traps)) if (trap.position.x === position.x && trap.position.z === position.z) {
        if (trap.trapKindId !== 'trap-wonder-tile') return blocked('trap-action');
        trap.revealed = true;
        resetStatChanges(a);
        context.emit({ type: 'message', messageId: 'wonder-tile' });
      }
      pickup(context, a, catalogs);
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
      if (s.floor.windCounter === 0) settleExpedition(context, 'wind-expulsion', catalogs, authored);
      return CONTINUE;
    },
  };
  return hooks;
}
