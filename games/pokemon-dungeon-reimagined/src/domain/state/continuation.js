/** @typedef {NonNullable<import('../../contracts/campaign.js').CampaignSnapshot['session']>} Session */
/** @typedef {import('../../contracts/campaign.js').ActorSlotRef} Ref */

/** Resolve a generation, never a new occupant of a recycled slot.
 * @param {Session} session @param {Ref|null} ref */
function live(session, ref) {
  if (!ref) return null;
  const ids = ref.side === 'team' ? session.scheduler.teamSlots : session.scheduler.wildSlots;
  const actor = session.actors[ref.actorId];
  return ids[ref.slot] === ref.actorId && actor?.placement.kind === 'map' && actor.placement.mapId === session.floor.mapId ? actor : null;
}

/** Exact first-unit checkpoints produced by the native engine. Generic numeric,
 * slot-capacity, identity, generation-range and speed-obligation checks still run
 * in session.js. Dead predecessor frame fields stay untouched; they are never
 * used to fabricate a fresh scheduler or player decision.
 * @param {Session} session
 * @returns {'opportunity'|'special-start'|'flush'|'phase'|null} */
export function continuationBoundary(session) {
  const s = session.scheduler, c = s.continuation;
  if (s.kind !== 'continuing' || c.terminal !== 'none' || c.action !== null || c.activeEffect !== null || c.beginningRan || c.petrifiedSwapPending) return null;
  const flush = c.flushing;
  if (flush) {
    if (c.special || flush.step !== 0 || flush.index < 1 || flush.index > flush.order.length) return null;
    // Every captured generation remains historical even if its slot was cleared.
    // A completed live recipient has discharged both movement/end obligations;
    // each still-live remaining recipient must retain its original movement.
    if (flush.order.some((ref, index) => {
      if (!session.actors[ref.actorId]) return true;
      const actor = live(session, ref);
      return actor !== null && (index < flush.index ? actor.speed.movementPending || actor.speed.endEffectsPending : !actor.speed.movementPending);
    })) return null;
    // startFlush is leader-first, then ascending team and wild slots. Compare
    // only resolving captured generations: removed refs remain historical and
    // cannot impose the rank of a different actor now occupying their slot.
    let previousRank = -2;
    for (const ref of flush.order) {
      if (!live(session, ref)) continue;
      const rank = ref.actorId === session.leaderActorId ? -1 : ref.side === 'team' ? ref.slot : s.teamSlots.length + ref.slot;
      if (rank <= previousRank) return null;
      previousRank = rank;
    }
    // startFlush captures every live pending mover. Validate the reverse join
    // too: deleting a saved suffix must not let tile/end work be overtaken by
    // leader input or phase upkeep. Preserve order and stale captured generations;
    // a replacement slot occupant must match its own exact generation.
    for (const [side, ids] of /** @type {const} */ ([['team', s.teamSlots], ['wild', s.wildSlots]])) {
      for (const [slot, actorId] of ids.entries()) {
        if (actorId === null) continue;
        const ref = { side, slot, actorId };
        if (live(session, ref)?.speed.movementPending && !flush.order.some((captured, index) => index >= flush.index && captured.side === side && captured.slot === slot && captured.actorId === actorId)) return null;
      }
    }
    const leaderBegin = c.pass === 'leader' && c.step === 0 && c.stage === 'begin' && c.active?.side === 'team' && c.active.actorId === session.leaderActorId && live(session, c.active) !== null && c.replanCount === 0 && c.actionStop === 'none' && !c.leaderChanged;
    const boundary = c.pass === 'boundary' && c.step === 1 && c.slotIndex === 0 && c.active === null && c.stage === 'select';
    return leaderBegin || boundary ? 'flush' : null;
  }
  if (c.active !== null || c.stage !== 'select') return null;
  if (c.special) {
    const special = c.special;
    if (c.pass !== 'leader' || c.step !== 0 || special.leader.side !== 'team' || !session.actors[special.leader.actorId] || special.index < 0 || special.index > s.teamSlots.length + s.wildSlots.length) return null;
    return special.index === 0 ? 'special-start' : 'opportunity';
  }
  if (c.pass === 'leader') return c.step === 1 || c.step === 2 ? 'opportunity' : null;
  if (c.pass === 'team' || c.pass === 'wild') {
    const count = c.pass === 'team' ? s.teamSlots.length : s.wildSlots.length;
    return c.step === 0 && c.slotIndex >= 1 && c.slotIndex <= count ? 'opportunity' : null;
  }
  if (c.pass === 'followers') return c.step === 0 && c.slotIndex === 0 && c.followerRound < 3 && c.followerIndex >= 1 && c.followerIndex <= c.followerOrder.length ? 'opportunity' : null;
  return c.pass === 'prephase' && c.step === 0 && c.slotIndex === 0 ? 'phase' : null;
}

/** Continuing is live work only; no story/result/client choice owns this PC.
 * @param {Session} session @param {import('../../contracts/campaign.js').CampaignState|import('../../contracts/campaign.js').CampaignSnapshot} state */
export function continuingSession(session, state) {
  return state.mode === 'dungeon' && state.session === session && session.status === 'active' && !state.pendingScene && !state.pendingResult && !state.earlyWork?.clientPrompt && continuationBoundary(session) !== null;
}
