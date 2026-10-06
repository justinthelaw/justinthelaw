import { hasSpeedOpportunity } from '../rules/speed.js';
import { TurnFault, resultShape, hookResult, checkPrompt, sessionOf, actorAt, slotAt, leaderRef, activeOrder, refreshSpeed, requireTurnHooks } from './support.js';
/** @typedef {import('./types.js').MutationContext} Context */
/** @typedef {import('./types.js').TurnHooks} Hooks */
/** @typedef {import('./types.js').ActorRef} Ref */
/** @typedef {import('./types.js').Action} Action */
/** @typedef {import('../../contracts/campaign.js').ExpeditionState} Session */
/** @typedef {import('../../contracts/campaign.js').TurnContinuation} Frame */

export const TURN_BUDGET = Object.freeze({ steps: 16384, effects: 4096 });

/** Create only scheduler engineering state. The caller supplies sourced policy and
 * native slot capacity; actor initializers must supply actual species/status facts.
 * @param {import('../../contracts/campaign.js').PolicyId} schedulePolicyId
 * @param {(import('../../contracts.js').ActorId|null)[]} teamSlots
 * @param {(import('../../contracts.js').ActorId|null)[]} wildSlots
 * @returns {import('../../contracts/campaign.js').SchedulerState}
 */
export function createScheduler(schedulePolicyId, teamSlots, wildSlots) {
  if (teamSlots.length !== 4 || wildSlots.length < 1 || wildSlots.length > 128) throw new RangeError('Invalid native slot capacities.');
  return { kind: 'ready', roundNumber: 0, schedulePolicyId, teamSlots: [...teamSlots], wildSlots: [...wildSlots], continuation: {
    phase: 0, pass: 'prephase', step: 0, slotIndex: 0, followerRound: 0, followerOrder: [], followerIndex: 0,
    active: null, stage: 'select', beginningRan: false, skipBeginning: false, replanCount: 0, action: null,
    activeEffect: null, actionStop: 'none', leaderChanged: false, terminal: 'none', petrifiedSwapPending: false, special: null, flushing: null,
  } };
}
/** @param {Frame} frame @param {import('../../contracts/campaign.js').TurnPass} pass */
function nextPass(frame, pass) {
  frame.pass = pass; frame.step = 0; frame.slotIndex = 0; frame.active = null; frame.stage = 'select';
  frame.action = null; frame.activeEffect = null; frame.beginningRan = false;
}
/** @param {Frame} frame @param {Ref} ref @param {boolean} repeated */
function select(frame, ref, repeated) {
  frame.active = ref; frame.stage = repeated ? 'decision' : 'begin'; frame.step = 0;
  frame.beginningRan = repeated; frame.replanCount = 0; frame.action = null; frame.activeEffect = null;
  frame.actionStop = 'none'; frame.leaderChanged = false;
}
/** @param {Context} context @param {Hooks} hooks @param {Session} session @param {Ref} ref */
function eligible(context, hooks, session, ref) {
  const actor = actorAt(session, ref);
  if (!actor) return false;
  if (ref.actorId === session.leaderActorId) return !actor.speed.attackLocked && hasSpeedOpportunity(refreshSpeed(context, hooks, ref, false), session.scheduler.continuation.phase);
  if (actor.speed.petrifiedSwap) return false;
  // R dungeon_engine.c:344–354: wild consumes the skip before querying speed.
  if (ref.side === 'wild' && actor.speed.swapSkip) { actor.speed.swapSkip = false; return false; }
  if (actor.speed.attackLocked || !hasSpeedOpportunity(refreshSpeed(context, hooks, ref, false), session.scheduler.continuation.phase)) return false;
  // R :230–241: team consumes it only after admission by speed/lock/0x8000.
  if (actor.speed.swapSkip) { actor.speed.swapSkip = false; return false; }
  return true;
}
/** @param {Session} session */
function startFlush(session) {
  const frame = session.scheduler.continuation;
  const refs = activeOrder(session).filter(ref => actorAt(session, ref)?.speed.movementPending);
  const leader = refs.findIndex(ref => ref.actorId === session.leaderActorId);
  if (leader > 0) { const ref = refs.splice(leader, 1)[0]; if (ref) refs.unshift(ref); }
  frame.flushing = { order: refs, index: 0, step: 0 };
}
/** One step at a time: a prompt resumes after the completed hook, never replays it.
 * @param {Context} context @param {Hooks} hooks @param {Session} session */
function flushStep(context, hooks, session) {
  const frame = session.scheduler.continuation;
  const flush = frame.flushing;
  if (!flush) return;
  const ref = flush.order[flush.index];
  if (!ref) { frame.flushing = null; return; }
  const actor = actorAt(session, ref);
  if (!actor) { flush.index++; flush.step = 0; return; }
  const step = flush.step++;
  switch (step) {
    case 0: actor.speed.movementPending = false; hookResult(hooks.tile(context, ref), context); break;
    case 1: hookResult(hooks.forcedLoss(context), context); break;
    case 2:
      if (actor.speed.endEffectsPending) { actor.speed.endEffectsPending = false; hookResult(hooks.end(context, ref), context); }
      break;
    case 3: hookResult(hooks.experience(context, ref), context); break;
    case 4: hookResult(hooks.room(context, ref), context); break;
    default: flush.index++; flush.step = 0;
  }
}
/** @param {Session} session @returns {Ref[]} */
function followers(session) {
  const leader = actorAt(session, leaderRef(session));
  if (leader?.placement.kind !== 'map') return [];
  const origin = leader.placement.position;
  /** @type {Ref[]} */ const order = [];
  for (let bucket = 0; bucket < 3; bucket++) {
    for (let slot = 3; slot >= 0; slot--) {
      const ref = slotAt(session, 'team', slot); const actor = actorAt(session, ref);
      if (!ref || !actor?.speed.deferred || actor.actorId === session.leaderActorId || actor.placement.kind !== 'map') continue;
      const point = actor.placement.position;
      if (Math.min(2, Math.max(Math.abs(point.x - origin.x), Math.abs(point.z - origin.z))) === bucket) order.push(ref);
    }
  }
  return order;
}
/** @param {Context} context @param {Session} session @param {import('./types.js').EffectResult} result */
function applyEffectResult(context, session, result) {
  resultShape(result); checkPrompt(result.kind, context);
  const frame = session.scheduler.continuation;
  const actor = actorAt(session, frame.active);
  if (result.kind === 'continue' || result.kind === 'prompt') {
    if (!result.cursor || typeof result.cursor !== 'object') throw new TurnFault('content-blocked', 'effect-cursor');
    frame.activeEffect = result.cursor; frame.stage = 'effect'; return;
  }
  if (result.kind !== 'done' || typeof result.movement !== 'boolean' || typeof result.leaderChanged !== 'boolean' || !['none', 'recruited', 'effect-stop'].includes(result.stop)) throw new TurnFault('content-blocked', 'effect-result');
  frame.activeEffect = null; frame.actionStop = result.stop; frame.leaderChanged = result.leaderChanged;
  if (actor) actor.speed.movementPending = result.movement;
  frame.stage = 'after'; frame.step = 0;
}
/** Resolve forced loss after every hit/reaction step, including a step that
 * opened a choice. No other actor or link can overtake this boundary.
 * @param {Context} context @param {Hooks} hooks @param {Session} session
 * @param {import('./types.js').EffectResult} result */
function settleEffect(context, hooks, session, result) {
  applyEffectResult(context, session, result);
  if (context.state.session === session && session.scheduler.continuation.terminal === 'none') {
    const paused = session.scheduler.kind !== 'ready';
    hookResult(hooks.forcedLoss(context), context, paused);
  }
}
/** @param {Context} context @param {Hooks} hooks @param {Session} session @param {Action} action */
function beginAction(context, hooks, session, action) {
  const frame = session.scheduler.continuation; const ref = frame.active; const actor = actorAt(session, ref);
  if (!ref || !actor || ('actorId' in action && action.actorId !== ref.actorId) || action.kind === 'face') throw new TurnFault('rejected', 'invalid-command');
  frame.action = action; frame.actionStop = 'none'; frame.leaderChanged = false;
  actor.speed.endEffectsPending = true;
  if (action.kind !== 'move' && action.kind !== 'wait') actor.speed.attackLocked = true;
  settleEffect(context, hooks, session, hooks.startAction(context, ref, action));
}

/** Runs synchronously until the next leader command, an explicit canonical prompt,
 * or terminal outcome. Every call works on Adventure's private transaction draft.
 * Missing concrete hooks block before any mutation. No animation or clock enters.
 * @param {Context} context @param {Hooks} hooks @param {Action|null} [action]
 * @returns {{kind:'input'|'prompt'|'terminal',consumedTurn:boolean}}
 */
export function advanceTurns(context, hooks, action = null) {
  requireTurnHooks(hooks);
  const session = sessionOf(context); let scheduler = session.scheduler; const frame = scheduler.continuation;
  const mapId = session.floor.mapId;
  if (scheduler.kind !== 'ready' || frame.terminal !== 'none') throw new TurnFault('rejected', 'unavailable');
  let consumedTurn = false; let effects = 0;
  if (action) {
    if (frame.pass !== 'leader' || frame.stage !== 'decision' || frame.active?.actorId !== session.leaderActorId) throw new TurnFault('rejected', 'unavailable');
    beginAction(context, hooks, session, action); consumedTurn = true; effects++;
  }
  for (let step = 0; step < TURN_BUDGET.steps; step++) {
    if (effects > TURN_BUDGET.effects) throw new TurnFault('content-blocked', 'effect-budget');
    if (context.state.session !== session || session.floor.mapId !== mapId || frame.terminal !== 'none') return { kind: 'terminal', consumedTurn };
    scheduler = session.scheduler;
    if (scheduler.continuation !== frame) throw new TurnFault('content-blocked', 'turn-continuation-authority');
    if (session.scheduler.kind !== 'ready') return { kind: 'prompt', consumedTurn };
    if (context.state.pendingResult || context.state.pendingScene) throw new TurnFault('content-blocked', 'unowned-turn-prompt');
    if (frame.flushing) { flushStep(context, hooks, session); continue; }
    if (frame.active) {
      const ref = frame.active; const actor = actorAt(session, ref);
      if (!actor) { frame.stage = 'refresh'; frame.activeEffect = null; }
      switch (frame.stage) {
        case 'begin': {
          if (!actor) break;
          actor.speed.speedRaisedThisAction = false;
          frame.stage = 'experience'; frame.beginningRan = true;
          if (frame.skipBeginning) { frame.skipBeginning = false; break; }
          refreshSpeed(context, hooks, ref, true);
          const result = hooks.begin(context, ref); resultShape(result); checkPrompt(result.kind, context);
          if ((result.kind !== 'continue' && result.kind !== 'prompt') || typeof result.canAct !== 'boolean') throw new TurnFault('content-blocked', 'begin-result');
          if (!result.canAct) { actor.speed.endEffectsPending = true; frame.stage = 'after'; frame.step = 0; consumedTurn = true; }
          break;
        }
        case 'experience': frame.stage = 'decision'; hookResult(hooks.experience(context, ref), context); break;
        case 'decision': {
          if (!actor) break;
          if (frame.pass === 'leader' && !frame.special) return { kind: 'input', consumedTurn };
          const decision = hooks.ai(context, ref, actor.speed.replan); resultShape(decision);
          if (decision.kind === 'action') {
            actor.speed.deferred = false; beginAction(context, hooks, session, decision.action); effects++;
          } else if (decision.kind === 'replan' && frame.replanCount < 2) {
            actor.speed.replan = true; frame.replanCount++;
          } else if (decision.kind === 'defer' || decision.kind === 'replan') {
            actor.speed.endEffectsPending = true;
            actor.speed.deferred = ref.side === 'team';
            frame.stage = ref.side === 'team' ? 'refresh' : 'after'; frame.step = 0;
          } else throw new TurnFault('content-blocked', 'ai-result');
          break;
        }
        case 'effect': {
          const cursor = frame.activeEffect;
          if (!actor || !cursor || frame.actionStop !== 'none') { frame.activeEffect = null; frame.stage = 'after'; frame.step = 0; break; }
          const allowed = hooks.effectAllowed(context, ref, cursor);
          if (typeof allowed !== 'boolean') throw new TurnFault('content-blocked', 'effect-predicate');
          if (!allowed) { frame.activeEffect = null; frame.actionStop = 'effect-stop'; frame.stage = 'after'; frame.step = 0; break; }
          if (++effects > TURN_BUDGET.effects) throw new TurnFault('content-blocked', 'effect-budget');
          const target = cursor.targetOrder[cursor.targetIndex];
          const reaction = cursor.reactionStack.at(-1);
          const invalid = reaction && !actorAt(session, reaction.source) ? 'reaction-source' : reaction?.target && !actorAt(session, reaction.target) ? 'reaction-target' : target && !actorAt(session, target) ? 'target' : null;
          settleEffect(context, hooks, session, invalid ? hooks.invalidReference(context, ref, cursor, invalid) : hooks.effect(context, ref, cursor));
          break;
        }
        case 'after': {
          const after = frame.step++;
          if (after === 0) hookResult(hooks.forcedLoss(context), context);
          else if (after === 1 && frame.pass === 'leader' && actor?.speed.petrifiedSwap) { actor.speed.petrifiedSwap = false; actor.speed.swapSkip = true; }
          else if (after === 2 && actor?.speed.endEffectsPending && !actor.speed.movementPending && !actor.speed.deferred) { actor.speed.endEffectsPending = false; hookResult(hooks.end(context, ref), context); }
          else if (after === 3 && !actor?.speed.movementPending) hookResult(hooks.experience(context, ref), context);
          else if (after > 3) {
            frame.stage = 'refresh'; frame.step = 0;
            if (frame.pass === 'leader' && !frame.special && frame.petrifiedSwapPending) {
              frame.petrifiedSwapPending = false;
              frame.special = { leader: ref, leaderChanged: frame.leaderChanged, index: 0 };
              frame.active = null; frame.stage = 'select';
            }
          }
          break;
        }
        case 'refresh': {
          const raised = actor?.speed.speedRaisedThisAction;
          if (actor) actor.speed.replan = false;
          frame.active = null; frame.stage = 'select'; frame.activeEffect = null; frame.action = null; frame.beginningRan = false;
          if (frame.special) { frame.leaderChanged = false; break; }
          if (frame.pass === 'leader') {
            if (frame.leaderChanged || session.leaderActorId !== ref.actorId) {
              frame.skipBeginning = true; frame.step = 1;
            } else if (raised) { frame.phase = 0; frame.step = 1; }
            else { frame.step = 2; }
          }
          break;
        }
        default: throw new TurnFault('content-blocked', 'opportunity-cursor');
      }
      continue;
    }
    if (frame.special) {
      const special = frame.special; const index = special.index++;
      const finished = index >= scheduler.teamSlots.length + scheduler.wildSlots.length;
      const ref = index < scheduler.teamSlots.length ? slotAt(session, 'team', index) : slotAt(session, 'wild', index - scheduler.teamSlots.length);
      if (finished) {
        frame.active = special.leader; frame.leaderChanged = special.leaderChanged;
        frame.special = null; frame.stage = 'refresh';
      } else if (ref && actorAt(session, ref)?.speed.petrifiedSwap) select(frame, ref, false);
      continue;
    }
    switch (frame.pass) {
      case 'prephase': {
        if (!hasSpeedOpportunity(1, frame.phase)) { nextPass(frame, 'leader'); break; }
        const phaseStep = frame.step++;
        if (phaseStep === 0) hookResult(hooks.spawn(context), context);
        else if (phaseStep === 1) hookResult(hooks.refreshSides(context), context);
        else if (phaseStep === 2) { for (const ref of activeOrder(session)) { const actor = actorAt(session, ref); if (actor) actor.speed.attackLocked = false; } }
        else if (phaseStep === 3) hookResult(hooks.forcedLoss(context), context);
        else nextPass(frame, 'leader');
        break;
      }
      case 'leader': {
        const ref = leaderRef(session);
        if (frame.step === 2) { frame.step = 3; hookResult(hooks.wind(context), context); break; }
        if (frame.step === 3) { nextPass(frame, 'team'); break; }
        if (!ref || (frame.step === 0 && !eligible(context, hooks, session, ref))) { nextPass(frame, 'team'); break; }
        select(frame, ref, false); startFlush(session); break;
      }
      case 'team': case 'wild': {
        const side = frame.pass; const slots = side === 'team' ? scheduler.teamSlots : scheduler.wildSlots;
        if (frame.slotIndex >= slots.length) {
          nextPass(frame, side === 'team' ? 'followers' : 'boundary');
          frame.followerRound = 0; frame.followerOrder = []; frame.followerIndex = 0; break;
        }
        const ref = slotAt(session, side, frame.slotIndex++);
        if (!ref || ref.actorId === session.leaderActorId || !eligible(context, hooks, session, ref)) break;
        select(frame, ref, false); break;
      }
      case 'followers': {
        if (frame.followerRound >= 3) { nextPass(frame, 'follower-end'); break; }
        if (!frame.followerOrder.length && frame.followerIndex === 0) frame.followerOrder = followers(session);
        const ref = frame.followerOrder[frame.followerIndex++];
        if (!ref) { frame.followerRound++; frame.followerOrder = []; frame.followerIndex = 0; break; }
        const actor = actorAt(session, ref);
        if (!actor?.speed.deferred || ref.actorId === session.leaderActorId) break;
        actor.speed.replan = true; actor.speed.deferred = false; select(frame, ref, true); break;
      }
      case 'follower-end': {
        if (frame.slotIndex >= scheduler.teamSlots.length) { nextPass(frame, 'wild'); break; }
        const ref = slotAt(session, 'team', frame.slotIndex++); const actor = actorAt(session, ref);
        if (ref && actor?.speed.deferred) {
          actor.speed.deferred = false;
          if (actor.speed.endEffectsPending) { actor.speed.endEffectsPending = false; hookResult(hooks.end(context, ref), context); }
        }
        break;
      }
      case 'boundary': {
        if (!hasSpeedOpportunity(1, (frame.phase + 1) % 24)) { nextPass(frame, 'phase-end'); break; }
        const boundaryStep = frame.step++;
        if (boundaryStep === 0) startFlush(session);
        else if (boundaryStep === 1) hookResult(hooks.experience(context, null), context);
        else if (boundaryStep === 2) hookResult(hooks.forcedLoss(context), context);
        else nextPass(frame, 'phase-end');
        break;
      }
      case 'phase-end':
        frame.phase = (frame.phase + 1) % 24;
        if (frame.phase === 0) scheduler.roundNumber++;
        nextPass(frame, 'prephase'); break;
      default: throw new TurnFault('content-blocked', 'turn-pass');
    }
  }
  throw new TurnFault('content-blocked', 'turn-step-budget');
}
