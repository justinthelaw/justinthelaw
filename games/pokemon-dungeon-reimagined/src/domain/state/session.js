import { ESCORT_WORK_REVISION } from './escort-work-revision.js';
import { forgottenMove } from './move-learning-proof.js';
import { requireRelation as check, unique, keyed, checkMoves, checkPp, inBounds, actorHasMoveReference } from './relations.js';
import { checkInventory } from './inventory.js';
import { pointer } from './structure.js';
import { checkParticipants } from './participants.js';
import { continuingSession } from './continuation.js';

/** @typedef {import('./relations.js').GraphContext} GraphContext */
/** @typedef {import('../../contracts/campaign.js').ExpeditionState} ExpeditionState */
/** @typedef {import('../../contracts/campaign.js').SessionActor} SessionActor */
/** @typedef {import('../../contracts/campaign.js').TargetSelector} TargetSelector */
/** @typedef {import('../../contracts/campaign.js').ResolvedAction} ResolvedAction */

const GROUPS = Object.freeze({
  sleep: ['sleep', 'sleepless', 'nightmare', 'yawning', 'napping'],
  burn: ['burn', 'poisoned', 'badly-poisoned', 'paralysis'],
  frozen: ['frozen', 'shadow-hold', 'wrap', 'wrapped', 'ingrain', 'petrified', 'constriction'],
  cringe: ['cringe', 'confused', 'paused', 'cowering', 'taunted', 'encore', 'infatuated'],
  bide: ['bide', 'solarbeam', 'sky-attack', 'razor-wind', 'focus-punch', 'skull-bash', 'flying', 'bouncing', 'diving', 'digging', 'charging', 'enraged'],
  reflect: ['reflect', 'safeguard', 'light-screen', 'counter', 'magic-coat', 'wish', 'protect', 'mirror-coat', 'enduring', 'mini-counter', 'mirror-move', 'conversion2', 'vital-throw', 'mist'],
  curse: ['cursed', 'decoy', 'snatch'],
  leechSeed: ['leech-seed', 'destiny-bond'],
  sureShot: ['sure-shot', 'whiffer', 'set-damage', 'focus-energy'],
  longToss: ['long-toss', 'pierce'],
  invisible: ['invisible', 'transformed', 'mobile'],
  blinker: ['blinker', 'cross-eyed', 'eyedrops'],
});

/** @param {GraphContext} context @param {TargetSelector} target @param {ExpeditionState} session @param {string} path */
function targetCheck(context, target, session, path) {
  if (target.kind === 'actor') check(context, !!session.actors[target.actorId], path, 'Live target actor is absent.');
  if (target.kind === 'room') check(context, !!session.floor.rooms[target.roomId], path, 'Live target room is absent.');
  if (target.kind === 'tile') {
    check(context, target.mapId === session.floor.mapId, path, 'Target map is absent.'); inBounds(context, target.position, session.floor, path);
  }
}
/** @param {GraphContext} context @param {ResolvedAction} action @param {ExpeditionState} session @param {string} path */
function actionCheck(context, action, session, path) {
  if ('actorId' in action) check(context, !!session.actors[action.actorId], path, 'Action actor is absent.');
  if ('target' in action) targetCheck(context, action.target, session, path);
  if (action.kind === 'move') inBounds(context, action.destination, session.floor, path);
  if (action.kind === 'exit') check(context, !!session.floor.exits[action.exitId], path, 'Action exit is absent.');
  if (action.kind === 'move-use') check(context, (actorHasMoveReference(session.actors[action.actorId], action.moveSlotId, action.moveId) || forgottenMove(session,action.actorId,action.moveSlotId,action.moveId)), path, 'Action move slot is absent or mismatched.');
  // An item may already have been consumed at a paused effect; its historical
  // reference is validated by the exact effect-PC policy rather than resurrected.
}
/** @param {GraphContext} context @param {SessionActor} actor @param {ExpeditionState} session @param {string} path */
function actorCheck(context, actor, session, path) {
  checkMoves(context, actor.moves, `${path}/moves`); checkPp(context, actor.battleMoves, actor.moves, `${path}/battleMoves`);
  unique(context, actor.enabledIqSkillIds, path);
  unique(context, actor.memory.experienceContributors, path);
  for (const id of actor.memory.experienceContributors) check(context, !!session.actors[id], path, 'Experience contributor is absent.');
  if (actor.placement.kind === 'map') {
    check(context, actor.placement.mapId === session.floor.mapId, path, 'Actor map is absent.'); inBounds(context, actor.placement.position, session.floor, path);
  }
  const lastMove = actor.memory.lastUsedMove;
  if (lastMove && lastMove.moveSlotId !== null) check(context, actorHasMoveReference(actor, lastMove.moveSlotId, lastMove.moveId), path, 'Last-used move slot is absent or mismatched.');
  for (const gain of actor.gains.moveBoosts) check(context, actorHasMoveReference(actor, gain.moveSlotId), path, 'Move gain slot is absent.');
  unique(context, actor.gains.moveBoosts.map(gain => gain.moveSlotId), path);
  if (actor.ai.target) targetCheck(context, actor.ai.target, session, path);
  if (actor.ai.destination) inBounds(context, actor.ai.destination, session.floor, path);
  for (const group of /** @type {(keyof typeof GROUPS)[]} */ (Object.keys(GROUPS))) {
    const condition = actor.conditions[group];
    if (!condition) continue;
    check(context, GROUPS[group].includes(condition.statusId), `${path}/conditions/${group}`, 'Status belongs to another mutually exclusive group.');
    const payload = condition.payload;
    if (payload.kind === 'actor-link' && payload.actorId !== null) check(context, !!session.actors[payload.actorId], path, 'Condition actor link is absent.');
    if (payload.kind === 'bide' && payload.lastAttackerId !== null) check(context, !!session.actors[payload.lastAttackerId], path, 'Bide attacker link is absent.');
    if (payload.kind === 'move-lock' || payload.kind === 'charge') {
      check(context, (actorHasMoveReference(actor, payload.moveSlotId, payload.moveId) || forgottenMove(session,actor.actorId,payload.moveSlotId,payload.moveId)), path, 'Condition move slot is absent or mismatched.');
      if (payload.kind === 'charge') targetCheck(context, payload.target, session, path);
    }
    if (payload.kind === 'copied-combat') {
      const projection = payload.projection;
      if (projection.moves) checkMoves(context, projection.moves, path);
      check(context, (projection.moves === null) === (projection.movePp === null), path, 'Copied moves and PP must share their projection.');
      if (projection.moves && projection.movePp) checkPp(context, projection.movePp, projection.moves, path);
    }
  }
  const binding = actor.binding;
  if (binding.kind === 'escort-guest') check(context, context.state.contentRevision === ESCORT_WORK_REVISION && session.escortGuest?.entry.actorId === actor.actorId && !!context.state.progress.jobs[binding.jobId], path, 'Temporary guest requires its exact actual entry and job owner.');
  if (binding.kind === 'job-client') check(context, !!context.state.progress.jobs[binding.jobId], path, 'Job client record is absent.');
  if (binding.kind === 'imported-team') check(context, context.state.rescue.importedTeams[binding.teamId]?.members.some(member => member.memberKey === binding.memberKey), path, 'Imported team member is absent.');
}

/** @param {GraphContext} context @param {ExpeditionState} session @param {boolean} suspended @param {string} path */
export function checkSession(context, session, suspended, path) {
  keyed(context, session.actors, actor => actor.actorId, `${path}/actors`);
  const floor = session.floor;
  check(context, floor.width > 0 && floor.height > 0 && floor.tiles.length === floor.height && floor.knowledge.explored.length === floor.height, `${path}/floor`, 'Invalid rectangular map dimensions.');
  check(context, floor.tiles.every(row => row.length === floor.width) && floor.knowledge.explored.every(row => row.length === floor.width), `${path}/floor`, 'Map rows or knowledge rows differ from width.');
  keyed(context, floor.rooms, room => room.roomId, `${path}/floor/rooms`);
  keyed(context, floor.traps, trap => trap.trapId, `${path}/floor/traps`);
  keyed(context, floor.exits, exit => exit.exitId, `${path}/floor/exits`);
  for (const room of Object.values(floor.rooms)) {
    const { x, z, width, height } = room.bounds;
    check(context, x >= 0 && z >= 0 && width > 0 && height > 0 && width <= floor.width - x && height <= floor.height - z, path, 'Room bounds exceed floor bounds.');
  }
  for (const row of floor.tiles) for (const tile of row) {
    check(context, tile.roomId === null || !!floor.rooms[tile.roomId], path, 'Tile room is absent.');
    check(context, tile.shopId === null || session.shops[tile.shopId]?.lifecycle === 'active', path, 'Tile shop is absent or closed.');
  }
  for (const trap of Object.values(floor.traps)) inBounds(context, trap.position, floor, path);
  for (const exit of Object.values(floor.exits)) inBounds(context, exit.position, floor, path);
  const location = floor.location;
  check(context, ('address' in location ? location.address.dungeonId : location.dungeonId) === session.dungeonId, path, 'Floor belongs to a different dungeon.');
  unique(context, session.teamOrder, `${path}/teamOrder`);
  check(context, session.teamOrder.includes(session.leaderActorId), path, 'Leader must belong to team order.');
  for (const actor of Object.values(session.actors)) {
    actorCheck(context, actor, session, pointer(`${path}/actors`, actor.actorId));
    if (actor.affiliation === 'team' && actor.placement.kind === 'map') check(context, session.teamOrder.includes(actor.actorId), path, 'Active team actor is missing from team order.');
  }
  for (const id of session.teamOrder) check(context, session.actors[id]?.affiliation === 'team', path, 'Team order names a missing or non-team actor.');
  unique(context, session.visitedFloorIds, path); unique(context, session.completedEventIds, path);
  keyed(context, session.shops, shop => shop.shopId, `${path}/shops`);
  for (const shop of Object.values(session.shops)) {
    keyed(context, shop.lotById, lot => lot.shopLotId, path); unique(context, shop.keeperActorIds, path);
    if (shop.lifecycle === 'active') check(context, shop.mapId === floor.mapId && shop.keeperActorIds.every(id => !!session.actors[id]), path, 'Active shop does not resolve to this floor and keepers.');
    else check(context, shop.keeperActorIds.length === 0, path, 'Closed shop retains live keepers.');
  }
  const entry = session.entry;
  const entryRoster = checkParticipants(context, session, path);
  checkInventory(context, entry.itemArchive, null, entryRoster, 'entry-history', `${path}/entry/itemArchive`, entry.toolboxContainerId);
  for (const [index, objective] of session.objectives.entries()) {
    if (objective.jobId) {
      const phase = context.state.progress.jobs[objective.jobId]?.phase;
      check(context, phase?.kind === 'active' && phase.sessionId === session.sessionId && phase.objectiveIndex === index || phase?.kind === 'objective-complete' && phase.sessionId === session.sessionId, path, 'Objective job phase does not join its session.');
    }
    if (objective.state.kind === 'actor-target') check(context, !!session.actors[objective.state.actorId], path, 'Objective actor is absent.');
  }
  if (suspended) check(context, session.status === 'suspended', path, 'Rescue escrow must contain a suspended run.');
  checkScheduler(context, session, path);
  const scheduler = session.scheduler;
  if (scheduler.kind === 'continuing') {
    check(context, !suspended && continuingSession(session, context.state), path, 'Continuing scheduler is not an exact live work checkpoint.');
  } else if (scheduler.kind === 'learning-continuing') {
    check(context, !suspended && context.state.contentRevision === ESCORT_WORK_REVISION && context.state.session === session && !!session.learningWork && !session.learning && !context.state.pendingResult, path, 'Saved learning work requires its independently proved actual live owner.');
  } else if (scheduler.kind !== 'ready') {
    const frame = scheduler.continuation;
    if (frame.action) actionCheck(context, frame.action, session, path);
    if (frame.activeEffect) {
      const effect = frame.activeEffect;
      actionCheck(context, effect.action, session, path); unique(context, effect.targetOrder.map(ref => ref.actorId), path);
      check(context, effect.targetIndex >= 0 && effect.targetIndex <= effect.targetOrder.length && effect.hitIndex >= 0 && effect.hitIndex <= effect.hitCount, path, 'Effect target or hit index is invalid.');
    }
    // Suspended runs retain their own continuation; rescue policy validates the
    // saved gate. The active namespace must point to its current pending owner.
    if (!suspended) {
      if (scheduler.kind === 'choice-paused') check(context, context.state.pendingResult?.resultId === scheduler.resultId, path, 'Paused turn has no matching result.');
      else check(context, scheduler.kind === 'scene-paused' && context.state.pendingScene?.sceneInstanceId === scheduler.sceneInstanceId, path, 'Paused turn has no matching scene.');
    }
  }
}

/** Shape-independent numeric/ownership rules. Content policies additionally check
 * the exact saved effect PC, timer source, prompt and terminal outcome semantics.
 * @param {GraphContext} context @param {ExpeditionState} session @param {string} path */
function checkScheduler(context, session, path) {
  const scheduler = session.scheduler; const frame = scheduler.continuation;
  const slots = [...scheduler.teamSlots, ...scheduler.wildSlots].filter(id => id !== null);
  unique(context, slots, path);
  check(context, scheduler.teamSlots.length === 4 && scheduler.wildSlots.length > 0 && scheduler.wildSlots.length <= 128, path, 'Invalid scheduler native slot capacities.');
  for (const [side, ids] of /** @type {const} */ ([['team', scheduler.teamSlots], ['wild', scheduler.wildSlots]])) {
    for (const id of ids) {
      if (id === null) continue;
      const actor = session.actors[id];
      check(context, !!actor && actor.placement.kind === 'map' && actor.placement.mapId === session.floor.mapId && (side === 'team' ? actor.affiliation === 'team' && session.teamOrder.includes(id) : actor.affiliation !== 'team'), path, 'Scheduler slot does not own its active actor.');
    }
  }
  for (const id of session.teamOrder) check(context, scheduler.teamSlots.includes(id), path, 'Team member is absent from native slots.');
  for (const actor of Object.values(session.actors)) {
    check(context, actor.placement.kind !== 'map' || slots.includes(actor.actorId), path, 'Active actor is missing from native slots.');
    const speed = actor.speed;
    check(context, speed.positiveTimers.length === 5 && speed.negativeTimers.length === 5 && [...speed.positiveTimers, ...speed.negativeTimers].every(timer => timer >= 0 && timer <= 127), path, 'Speed requires five bounded counters per sign.');
    check(context, speed.cachedStage >= 0 && speed.cachedStage <= 4 && speed.speedBoostCounter >= 0 && speed.speedBoostCounter < 250, path, 'Invalid speed stage or ability counter.');
    check(context, !speed.movementPending || speed.endEffectsPending, path, 'Pending movement lost its single end-effects obligation.');
    check(context, !speed.deferred || speed.endEffectsPending && actor.affiliation === 'team' && actor.actorId !== session.leaderActorId, path, 'Deferred follower has no end-effects obligation.');
    check(context, actor.placement.kind === 'map' || !speed.movementPending && !speed.endEffectsPending && !speed.deferred, path, 'Off-map actor retains pending movement or effects.');
  }
  check(context, frame.phase >= 0 && frame.phase < 24 && frame.step >= 0 && frame.step <= 5 && frame.slotIndex >= 0 && frame.slotIndex <= 128 && frame.followerRound >= 0 && frame.followerRound <= 3 && frame.followerIndex >= 0 && frame.followerIndex <= frame.followerOrder.length && frame.replanCount >= 0 && frame.replanCount <= 2, path, 'Invalid scheduler cursor range.');
  /** @param {import('../../contracts/campaign.js').ActorSlotRef} ref */
  const refCheck = ref => {
    const ids = ref.side === 'team' ? scheduler.teamSlots : scheduler.wildSlots;
    check(context, ref.slot >= 0 && ref.slot < ids.length, path, 'Continuation slot is out of range.');
    // A removed generation may remain in a consumed/deferred cursor; it never
    // resolves to the new actor occupying this slot. Semantic PC policy qualifies it.
  };
  frame.followerOrder.forEach(refCheck);
  unique(context, frame.followerOrder.map(ref => ref.actorId), path);
  check(context, frame.followerOrder.length <= 4 && frame.followerOrder.every(ref => ref.side === 'team'), path, 'Invalid deferred follower traversal.');
  if (frame.active) refCheck(frame.active);
  check(context, frame.active !== null || frame.stage === 'select', path, 'Opportunity stage lacks its actor generation.');
  check(context, frame.activeEffect === null || frame.stage === 'effect' && frame.action !== null, path, 'Effect cursor has no active action.');
  if (frame.activeEffect) {
    const effect = frame.activeEffect;
    effect.targetOrder.forEach(refCheck);
    for (const reaction of effect.reactionStack) { refCheck(reaction.source); if (reaction.target) refCheck(reaction.target); }
    unique(context, effect.linkedMoves.map(move => move.moveSlotId), path);
    check(context, effect.linkedMoves.length <= 4 && effect.linkIndex >= 0 && effect.linkIndex <= effect.linkedMoves.length && effect.reactionStack.length <= 32 && effect.targetOrder.length <= 132 && effect.hitCount >= 1 && effect.hitCount <= 256, path, 'Effect chain exceeds its structural cursor limits.');
    for (const move of effect.linkedMoves) check(context, !frame.active || actorHasMoveReference(session.actors[frame.active.actorId], move.moveSlotId, move.moveId), path, 'Linked move identity is absent or mismatched.');
  }
  if (frame.special) {
    refCheck(frame.special.leader);
    check(context, frame.pass === 'leader' && frame.special.index >= 0 && frame.special.index <= scheduler.teamSlots.length + scheduler.wildSlots.length, path, 'Invalid petrified swap continuation.');
  }
  if (frame.flushing) {
    const flush = frame.flushing;
    flush.order.forEach(refCheck); unique(context, flush.order.map(ref => ref.actorId), path);
    check(context, flush.index >= 0 && flush.index <= flush.order.length && flush.step >= 0 && flush.step <= 5 && flush.order.length <= 132, path, 'Invalid movement completion cursor.');
  }
  if (scheduler.kind === 'ready' && frame.terminal === 'none') {
    const initial = frame.pass === 'prephase' && frame.phase === 0 && frame.step === 0 && frame.active === null && scheduler.roundNumber === 0;
    const input = frame.pass === 'leader' && frame.stage === 'decision' && frame.active?.actorId === session.leaderActorId && frame.beginningRan;
    check(context, (initial || input) && frame.activeEffect === null && frame.flushing === null && frame.special === null && frame.action === null, path, 'Ready scheduler is not at a complete command boundary.');
  }
}
