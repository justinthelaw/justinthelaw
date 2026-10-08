import { blocked, clone } from './support.js';
/** @typedef {import('../../contracts/campaign.js').ExpeditionState} Session
 * @typedef {import('../../contracts/campaign.js').SessionActor} Actor
 * @typedef {import('../../contracts/escort-work.js').EscortPositionHistory} History */
/** Source mode1 placement resets actual four-position histories and guest AI.
 * Only prospective entries create these fields; old saves are never backfilled
 * with invented old movement. Every real new floor starts a fresh map epoch.
 * @param {Session} session */
export function initializeEscortTeamHistory(session) {
  if (!session.entry.nativeEscort) return;
  /** @type {Record<import('../../contracts.js').ActorId,History>} */ const members = {};
  for (const id of session.scheduler.teamSlots) {
    const actor = id ? session.actors[id] : null; if (!actor || actor.placement.kind !== 'map' || actor.placement.mapId !== session.floor.mapId) continue;
    const p = actor.placement.position; members[actor.actorId] = { positions: [{ ...p },{ ...p },{ ...p },{ ...p }],lastWalk: null };
  }
  session.nativeTeamHistory = { mapId: session.floor.mapId,members };
  const guest = session.escortGuest,actor = guest ? session.actors[guest.entry.actorId] : null;
  if (guest && guest.lifecycle.kind === 'live') {
    if (!actor || actor.placement.kind !== 'map') return blocked('escort-history-fresh-guest');
    guest.ai = { mapId: session.floor.mapId,objective: 'stand',target: null,targetPosition: { ...actor.placement.position },notNextToTarget: false,targetingEnemy: false,turningAround: false,allySkip: false,recalculateFollow: false,waiting: false,moveRandomly: false,mobileTurnTimer: 0 };
  }
}
/** Source ordinary walk mode0 shifts even when Invisible; Invisible suppresses
 * only insertion of the previous actual position into slot0.
 * @param {Session} session @param {Actor} actor @param {import('../../contracts.js').GridPosition} from @param {number} revision */
export function recordEscortTeamWalk(session,actor,from,revision) {
  if (!session.entry.nativeEscort || actor.affiliation !== 'team') return;
  const history = session.nativeTeamHistory?.members[actor.actorId];
  if (!history || session.nativeTeamHistory?.mapId !== session.floor.mapId || actor.placement.kind !== 'map' || actor.placement.mapId !== session.floor.mapId) return blocked('escort-history-walk-owner');
  if (from.x === actor.placement.position.x && from.z === actor.placement.position.z) return;
  const before = clone(history.positions),invisible = actor.conditions.invisible?.statusId === 'invisible';
  history.positions = [invisible ? { ...before[0] } : { ...from },{ ...before[0] },{ ...before[1] },{ ...before[2] }];
  history.lastWalk = { before,from: { ...from },to: { ...actor.placement.position },invisible,revision };
}
