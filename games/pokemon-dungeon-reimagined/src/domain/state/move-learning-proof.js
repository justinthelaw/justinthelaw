import { createSteelMeaniesContent, ORDINARY_SUMMIT } from '../../../content/authored/steel-meanies.js';
import { STEEL } from '../../../content/authored/mt-steel.js';
import { THUNDERWAVE as T } from '../../../content/authored/thunderwave.js';
import { OPENING_EXPEDITION as O } from '../../../content/authored/expedition.js';
import { randomInteger } from '../rng.js';
import { fingerprint } from './relations.js';
import { learningCandidates } from '../gameplay/native-learning.js';
import { MOVE_LEARNING_REVISION } from './move-learning-revision.js';
import { maxHp, value } from '../gameplay/support.js';
/** @typedef {import('../../contracts/campaign.js').CampaignState} State
 * @typedef {import('../../contracts/campaign.js').ExpeditionState} Session
 * @typedef {import('../../contracts/campaign.js').SessionActor} Actor
 * @typedef {import('../gameplay/support.js').Catalogs} Catalogs */
/** Authentic retained old source slot, never an executable active move.
 * @param {Session} session @param {import('../../contracts.js').ActorId} actorId
 * @param {import('../../contracts.js').MoveSlotId} slotId @param {import('../../contracts.js').MoveId} moveId */
export function forgottenMove(session,actorId,slotId,moveId) {
  return session.forgottenMoves?.some(row => row.actorId === actorId && row.moveSlot.moveSlotId === slotId && row.moveSlot.moveId === moveId) ?? false;
}
/** Exact captured generation, including a newly removed hostile at loss PCs.
 * @param {Session} s @param {import('../../contracts/campaign.js').ActorSlotRef|null} ref @param {boolean} [removed] */
function learningRef(s,ref,removed = false) {
  if (!ref) return false;
  const ids = ref.side === 'team' ? s.scheduler.teamSlots : s.scheduler.wildSlots,a = s.actors[ref.actorId];
  if (!a || ref.slot < 0 || ref.slot >= ids.length || (ref.side === 'team' ? a.affiliation !== 'team' : a.affiliation === 'team')) return false;
  return ids[ref.slot] === ref.actorId && a.placement.kind === 'map' && a.placement.mapId === s.floor.mapId || removed && ref.side === 'wild' && a.binding.kind === 'wild' && a.affiliation === 'hostile' && ids[ref.slot] === null && a.resources.hp === 0 && a.placement.kind === 'off-map' && a.placement.reason === 'fainted';
}
/** Side, cursor and captured generation are inseparable in every opportunity.
 * @param {Session} s @param {boolean} [removed] */
function learningPass(s,removed = false) {
  const c = s.scheduler.continuation,ref = c.active;
  if (!ref || !learningRef(s,ref,removed) || c.flushing) return false;
  if (c.pass === 'leader') {
    if (c.slotIndex !== 0) return false;
    if (!c.special) return ref.side === 'team' && ref.actorId === s.leaderActorId;
    const parent = c.special.leader;
    return parent.side === 'team' && parent.actorId === s.leaderActorId && learningRef(s,parent) && ref.actorId !== s.leaderActorId && c.special.index === ref.slot+(ref.side === 'wild' ? s.scheduler.teamSlots.length : 0)+1 && c.special.index <= s.scheduler.teamSlots.length+s.scheduler.wildSlots.length;
  }
  if (c.special) return false;
  if (c.pass === 'team') return ref.side === 'team' && ref.actorId !== s.leaderActorId && c.slotIndex === ref.slot+1 && c.slotIndex <= s.scheduler.teamSlots.length;
  if (c.pass === 'wild') return ref.side === 'wild' && ref.actorId !== s.leaderActorId && c.slotIndex === ref.slot+1 && c.slotIndex <= s.scheduler.wildSlots.length;
  if (c.pass === 'followers') {
    const captured = c.followerOrder[c.followerIndex-1];
    return ref.side === 'team' && ref.actorId !== s.leaderActorId && c.slotIndex === 0 && c.followerRound < 3 && c.followerIndex >= 1 && c.followerIndex <= c.followerOrder.length && captured?.side === ref.side && captured.slot === ref.slot && captured.actorId === ref.actorId && c.followerOrder.every(row => row.side === 'team' && learningRef(s,row));
  }
  return false;
}
/** The flush parent remains leader-begin or boundary/select; prefix work is
 * discharged and the still-live suffix retains the captured movement obligation.
 * @param {Session} s */
function learningFlush(s) {
  const c = s.scheduler.continuation,flush = c.flushing;
  if (!flush || c.special || c.action !== null || c.beginningRan || flush.index < 0 || flush.index >= flush.order.length) return false;
  const leaderBegin = c.pass === 'leader' && c.step === 0 && c.slotIndex === 0 && c.stage === 'begin' && c.active?.side === 'team' && c.active.actorId === s.leaderActorId && learningRef(s,c.active) && c.replanCount === 0 && c.actionStop === 'none' && !c.leaderChanged;
  const boundary = c.pass === 'boundary' && c.step === 1 && c.slotIndex === 0 && c.stage === 'select' && c.active === null;
  if (!leaderBegin && !boundary) return false;
  let rank = -2;
  for (const [index,ref] of flush.order.entries()) {
    if (!learningRef(s,ref,true)) return false;
    if (!learningRef(s,ref)) continue;
    const a = s.actors[ref.actorId],next = ref.actorId === s.leaderActorId ? -1 : ref.side === 'team' ? ref.slot : s.scheduler.teamSlots.length+ref.slot;
    if (!a || next <= rank || index < flush.index && (a.speed.movementPending || a.speed.endEffectsPending) || index > flush.index && !a.speed.movementPending) return false;
    rank = next;
  }
  for (const a of Object.values(s.actors)) if (a.speed.movementPending && !flush.order.some((ref,index) => index > flush.index && ref.actorId === a.actorId && learningRef(s,ref))) return false;
  const owner = flush.order[flush.index],a = owner && s.actors[owner.actorId];
  return !!a && !a.speed.movementPending && (flush.step < 3 || !a.speed.endEffectsPending);
}
/** Independently classify actual hook/terminal input pauses, never yields.
 * Generic graph additionally checks all ranges/actions/resources. No fingerprint
 * can authorize a foreign pass or replace a real generation/cursor/obligation.
 * @param {Session} s */
function learningPc(s) {
  const l = s.learning,c = s.scheduler.continuation;
  if (!l || c.activeEffect || c.replanCount < 0 || c.replanCount > 2) return false;
  if (l.origin.kind === 'scene') return l.schedulerTag.kind === 'scene-paused' && c.terminal === 'dungeon-exit';
  if (l.schedulerTag.kind !== 'ready' || c.terminal !== 'none') return false;
  const a = c.active && s.actors[c.active.actorId];
  if (l.origin.kind === 'settlement') {
    const leader = c.pass === 'leader' && !c.special && !c.flushing && c.active?.side === 'team' && c.active.actorId === s.leaderActorId && learningPass(s);
    const completed = leader && c.stage === 'after' && c.step === 0 && c.beginningRan && !c.skipBeginning && c.replanCount === 0 && c.actionStop === 'none' && !c.leaderChanged && !!a?.speed.endEffectsPending && !a.speed.movementPending;
    if (l.origin.outcome === 'success') return completed && c.action?.kind === 'exit' && c.action.actorId === s.leaderActorId || leader && c.stage === 'decision' && c.step === 0 && c.beginningRan && c.replanCount === 0 && c.action === null && s.purpose.kind === 'ordinary' && s.objectives.some(objective => objective.state.kind === 'complete');
    if (l.origin.outcome === 'give-up') return completed && c.action?.kind === 'give-up';
    const select = c.stage === 'select' && c.active === null && c.action === null && !c.beginningRan && !c.special && !c.flushing;
    if (l.origin.outcome === 'wind-expulsion') return select && c.pass === 'leader' && c.step === 3 && c.slotIndex === 0 && s.floor.windCounter === 0;
    const afterLoss = learningPass(s,true) && c.stage === 'after' && [0,1,3].includes(c.step) && (c.step !== 3 || !!a && !a.speed.movementPending && !a.speed.endEffectsPending);
    const flushLoss = learningFlush(s) && !!c.flushing && [2,3].includes(c.flushing.step);
    const priorFollower = s.scheduler.teamSlots[c.slotIndex-1],follower = priorFollower && s.actors[priorFollower];
    const selectLoss = select && (c.pass === 'prephase' && c.step === 4 && c.slotIndex === 0 || c.pass === 'boundary' && c.step === 3 && c.slotIndex === 0 || c.pass === 'follower-end' && c.step === 0 && c.slotIndex >= 1 && c.slotIndex <= s.scheduler.teamSlots.length && !!follower && !follower.speed.deferred && !follower.speed.endEffectsPending);
    return !!l.origin.casualties?.length && (afterLoss || flushLoss || selectLoss);
  }
  const sourceId = l.origin.sourceActorId;
  if (sourceId === null) return !c.flushing && c.pass === 'boundary' && c.stage === 'select' && c.step === 2 && c.slotIndex === 0 && c.active === null && c.action === null && !c.beginningRan && !c.special;
  if (c.flushing) {
    const owner = c.flushing.order[c.flushing.index];
    return learningFlush(s) && c.flushing.step === 4 && owner?.actorId === sourceId && learningRef(s,owner);
  }
  if (!learningPass(s) || c.active?.actorId !== sourceId) return false;
  return c.stage === 'decision' && c.step === 0 && c.pass !== 'followers' && c.replanCount === 0 && c.beginningRan && !c.skipBeginning && c.action === null && c.actionStop === 'none' && !c.leaderChanged && (!c.special || !!a?.speed.petrifiedSwap) || c.stage === 'after' && c.step === 4 && !!a && !a.speed.movementPending && !a.speed.endEffectsPending;
}
/** Each condition callback proves its actual canonical historical slots; no callback
 * order or earlier validation side effect can authorize this projection.
 * @param {Session} s @param {Catalogs} catalogs @param {number} revision @param {State['roster']} roster
 * @returns {string|null} */
export function forgottenProblem(s,catalogs,revision,roster) {
  if (s.forgottenMoves) {
    if (!s.forgottenMoves.length || s.forgottenMoves.length > 1584) return 'Forgotten slots exceed the four-team/99-level/four-slot source bound.';
    const seen = new Set();
    for (const row of s.forgottenMoves) {
      const a = s.actors[row.actorId],slot = row.moveSlot;
      if (!a || a.binding.kind !== 'roster' || seen.has(slot.moveSlotId) || a.moves.slots.some(move => move?.moveSlotId === slot.moveSlotId) || row.forgottenRevision <= s.entry.entryRevision || row.forgottenRevision > revision || slot.ppCapacityBonus !== 0 || slot.powerBoost < 0 || slot.powerBoost > catalogs.effects.getMove(slot.moveId).numeric.ginsengCap) return 'Forgotten move requires its own real roster actor, bounded source slot and committed choice revision.';
      const pokemon = roster[a.binding.pokemonId],entrant = s.entry.entrants[a.binding.pokemonId]?.pokemon;
      const original = pokemon?.moves.slots.find(move => move?.moveSlotId === slot.moveSlotId);
      if (a.actorId !== row.actorId || a.affiliation !== 'team' || !s.teamOrder.includes(a.actorId) || !s.scheduler.teamSlots.includes(a.actorId) || !pokemon || pokemon.pokemonId !== a.binding.pokemonId || !entrant || entrant.pokemonId !== pokemon.pokemonId || fingerprint(pokemon) !== fingerprint(entrant) || Object.values(s.actors).filter(actor => actor.binding.kind === 'roster' && actor.binding.pokemonId === pokemon.pokemonId).length !== 1 || original && original.moveId !== slot.moveId) return 'Retired slot must resolve its unique actual unsettled entry actor and permanent roster owner.';
      seen.add(slot.moveSlotId);
      const p = catalogs.species.getProfile(a.identity.speciesId,a.identity.formId),native = catalogs.effects.getMove(slot.moveId).internalId;
      if (!catalogs.species.getLearnset(p.id).levelUp.some(pair => pair[1] === native && (pair[0] ?? 101) <= a.growth.level) && !catalogs.species.getLearnset(p.id).auxiliary.includes(native)) return 'Forgotten move has no source acquisition.';
    }
  }
  return null;
}
/** Saved producer frames have the same explicit finite ranges and generation
 * references as the actual turn graph, with removed wild generations retained.
 * @param {Session} s @param {import('../../contracts/campaign.js').TurnContinuation} f */
function sourceFrameValid(s,f) {
  if (f.phase < 0 || f.phase >= 24 || f.step < 0 || f.step > 5 || f.slotIndex < 0 || f.slotIndex > 128 || f.followerRound < 0 || f.followerRound > 3 || f.followerOrder.length > 4 || f.followerIndex < 0 || f.followerIndex > f.followerOrder.length || f.replanCount < 0 || f.replanCount > 2 || f.activeEffect || f.terminal !== 'none') return false;
  /** @param {import('../../contracts/campaign.js').ActorSlotRef} ref */
  const real = ref => { const a = s.actors[ref.actorId],ids = ref.side === 'team' ? s.scheduler.teamSlots : s.scheduler.wildSlots; return !!a && ref.slot >= 0 && ref.slot < ids.length && (ids[ref.slot] === ref.actorId || ref.side === 'wild' && a.binding.kind === 'wild' && a.placement.kind === 'off-map' && a.placement.reason === 'fainted'); };
  if (f.active && !real(f.active) || !f.followerOrder.every(ref => ref.side === 'team' && real(ref)) || new Set(f.followerOrder.map(ref => ref.actorId)).size !== f.followerOrder.length) return false;
  if (f.special && (f.pass !== 'leader' || f.special.leader.actorId !== s.leaderActorId || f.special.leader.side !== 'team' || !real(f.special.leader) || f.special.index < 0 || f.special.index > 132)) return false;
  if (f.flushing && (f.flushing.order.length > 132 || f.flushing.index < 0 || f.flushing.index >= f.flushing.order.length || f.flushing.step < 0 || f.flushing.step > 5 || !f.flushing.order.every(real) || new Set(f.flushing.order.map(ref => ref.actorId)).size !== f.flushing.order.length)) return false;
  const a = f.action;
  if (a && 'actorId' in a && !s.actors[a.actorId]) return false;
  if (a?.kind === 'move-use' && !s.actors[a.actorId]?.moves.slots.some(slot => slot?.moveSlotId === a.moveSlotId && slot.moveId === a.moveId) && !forgottenMove(s,a.actorId,a.moveSlotId,a.moveId)) return false;
  return !a || !('target' in a) || a.target.kind !== 'actor' || !!s.actors[a.target.actorId];
}
/** Exact new award provenance, prior EXP and producer PC. No inference from a
 * converted legacy actor. Defeated actors stay in this floor's actor registry.
 * @param {Session} s @param {State} state @param {Catalogs} catalogs */
function pendingExperienceProblem(s,state,catalogs) {
  for (const actor of Object.values(s.actors)) {
    const pending = actor.pendingExperience; if (!pending) continue;
    if (actor.binding.kind !== 'roster' || actor.affiliation !== 'team' || !s.teamOrder.includes(actor.actorId) || pending.level !== actor.growth.level || pending.level >= 100 || pending.amount < 1 || pending.amount > 9999999 || pending.experienceBefore.denominator !== 1 || pending.gainsBefore.denominator !== 1 || pending.experienceBefore.numerator < 0 || pending.gainsBefore.numerator < 0 || pending.experienceBefore.numerator+pending.amount !== value(actor.growth.totalExperience) || pending.gainsBefore.numerator+pending.amount !== value(actor.gains.experience) || !pending.awards.length || pending.awards.length > 128) return 'Pending EXP requires exact newly awarded credit and unchanged pre-award growth.';
    let total = pending.experienceBefore.numerator; const seen = new Set();
    for (const award of pending.awards) {
      const target = s.actors[award.defeatedActorId],attacker = s.actors[award.attackerActorId],f = award.sourceFrame,c = s.scheduler.continuation;
      if (!target || !attacker || seen.has(target.actorId) || target.affiliation !== 'hostile' || target.binding.kind !== 'wild' || target.resources.hp !== 0 || target.placement.kind !== 'off-map' || target.placement.reason !== 'fainted' || attacker.affiliation !== 'team' || attacker.binding.kind !== 'roster' || !s.teamOrder.includes(attacker.actorId) || award.awardedRevision <= s.entry.entryRevision || award.awardedRevision > state.revision || !sourceFrameValid(s,f) || award.sourceRound < 0 || (s.scheduler.roundNumber-award.sourceRound)*24+c.phase-f.phase < 0 || (s.scheduler.roundNumber-award.sourceRound)*24+c.phase-f.phase >= 24 || f.activeEffect || f.terminal !== 'none') return 'New EXP needs the actual defeated hostile, team source, committed revision and interrupted native frame.';
      const active = f.active,flush = f.flushing,sourceRef = flush ? flush.order[flush.index] : active;
      const actionPc = !flush && f.stage === 'decision' && f.step === 0 && f.action && (f.action.kind === 'attack' || f.action.kind === 'struggle' || f.action.kind === 'move-use' || f.action.kind === 'item' && ['use','throw'].includes(f.action.operation)) && f.action.actorId === attacker.actorId;
      const endPc = flush ? flush.step === 3 : f.stage === 'after' && f.step === 3;
      const followerEnd = !flush && f.pass === 'follower-end' && f.stage === 'select' && f.active === null && f.step === 0 && s.scheduler.teamSlots[f.slotIndex-1] === attacker.actorId;
      if (!followerEnd && (!(actionPc || endPc) || sourceRef?.side !== 'team' || sourceRef.actorId !== attacker.actorId || s.scheduler.teamSlots[sourceRef.slot] !== attacker.actorId) || f.replanCount < 0 || f.replanCount > 2 || f.stage === 'decision' && f.action && c.action && fingerprint(f.action) !== fingerprint(c.action)) return 'New EXP cannot manufacture a damage/end-action source PC or overtake its saved action.';
      const p = catalogs.species.getProfile(target.identity.speciesId,target.identity.formId),base = p.experienceYield+Math.trunc(p.experienceYield*(target.growth.level-1)/10),xp = Math.max(1,target.memory.experienceContributors.length ? base : Math.trunc(base/2));
      if (award.amount !== Math.min(9999999-total,xp) || award.amount < 1) return 'Each newly credited award must equal its actual native defeated-species EXP and cap.';
      total += award.amount; seen.add(target.actorId);
    }
    if (total !== value(actor.growth.totalExperience)) return 'New EXP award sum differs from its unchanged producer ledger.';
  }
  return null;
}
/** Full proof of every new field before predecessor metadata validation. Old
 * resources/history and all unmodified source/state owners still run independently.
 * @param {State} state @param {Catalogs} catalogs @returns {string|null} */
export function learningProblem(state,catalogs) {
  const s = state.session,l = s?.learning,result = state.pendingResult;
  if (state.contentRevision !== MOVE_LEARNING_REVISION) return 'Unknown exact learning identity.';
  if (s) { const problem = pendingExperienceProblem(s,state,catalogs) ?? forgottenProblem(s,catalogs,state.revision,state.roster); if (problem) return problem; }
  if (Object.values(state.rescue.suspended?.session.actors ?? {}).some(actor => actor.pendingExperience)) return 'Live EXP producer cannot invent suspended rescue credit.';
  if (state.rescue.suspended?.session.learning || state.rescue.suspended?.session.forgottenMoves) return 'This live learning producer cannot invent suspended rescue history.';
  if (!l) return result?.kind === 'move-learn-choice' || s?.scheduler.kind === 'choice-paused' && !state.earlyWork?.clientPrompt ? 'A learning prompt requires its actual producer.' : null;
  if (!s || s.status !== 'active' || state.earlyWork?.clientPrompt || !result || result.kind !== 'move-learn-choice' || s.scheduler.kind !== 'choice-paused' || result.resultId !== s.scheduler.resultId || result.sessionId !== s.sessionId || result.owner.kind !== 'actor' || result.owner.actorId !== l.actorId || result.moveId !== l.moveId || result.createdRevision !== l.selectionRevision || result.cursor !== 0 || !result.canDecline || l.selectionRevision <= s.entry.entryRevision || l.selectionRevision > state.revision) return 'Learning result/actor/session/revision has no exclusive live producer.';
  const actor = s.actors[l.actorId]; if (!actor || actor.binding.kind !== 'roster' || actor.affiliation !== 'team' || actor.pendingExperience || actor.moves.slots.some(slot => slot === null) || actor.growth.level !== l.level || l.beforeGrowth.level+1 !== l.level || l.beforeGrowth.totalExperience.denominator !== 1 || fingerprint(l.beforeGrowth.totalExperience) !== fingerprint(actor.growth.totalExperience) || fingerprint(l.beforeGrowth.permanentStatBonuses) !== fingerprint(actor.growth.permanentStatBonuses) || l.beforeGrowth.iqPoints !== actor.growth.iqPoints) return 'Source level/experience/unchanged four slots require their native prior growth.';
  const p = catalogs.species.getProfile(actor.identity.speciesId,actor.identity.formId),old = catalogs.species.getGrowthAtLevel(p.id,l.beforeGrowth.level),next = catalogs.species.getGrowthAtLevel(p.id,l.level);
  if (fingerprint(l.beforeGrowth.naturalStats) !== fingerprint(old.stats) || fingerprint(actor.growth.naturalStats) !== fingerprint(next.stats) || value(actor.growth.totalExperience) < next.cumulativeExperience || l.beforeHp < 0 || l.beforeHp > old.stats.hp+l.beforeGrowth.permanentStatBonuses.hp || actor.resources.hp !== Math.min(maxHp(actor),l.beforeHp+next.stats.hp-old.stats.hp)) return 'Stats/HP must be the one actual sourced level increment before the candidate.';
  const candidates = learningCandidates(actor,l.level,catalogs); if (!candidates.length) return 'This level has no source candidate.';
  let sampled; try { sampled = randomInteger(l.candidateRng,candidates.length); } catch { return 'Invalid pre-candidate browser RNG.'; }
  if (candidates[sampled.value] !== l.moveId || fingerprint(sampled.state) !== fingerprint(state.random.combatRecruitment)) return 'The exact source-selected candidate must own the sole saved browser sample.';
  if (fingerprint({ moves: actor.moves,pp: actor.battleMoves }) !== l.movesFingerprint || fingerprint(s.scheduler.continuation) !== l.resumeFrameFingerprint || fingerprint(result.replaceableSlotIds) !== fingerprint(actor.moves.slots.flatMap(slot => slot ? [slot.moveSlotId] : [])) || fingerprint(result.continuation) !== fingerprint({ kind: 'resume-turn',sessionId: s.sessionId,gate: { kind: 'result',resultId: result.resultId } })) return 'Saved unchanged slots/PP/result gate and exact native PC differ from the producer.';
  if (l.origin.kind === 'settlement') {
    const casualties = l.origin.casualties;
    if (!casualties || new Set(casualties.map(row => row.actorId)).size !== casualties.length || casualties.length > 4 || (l.origin.outcome === 'fainting') !== (casualties.length > 0)) return 'Only actual unrecovered source casualties own a pending defeat.';
    for (const row of casualties) {
      const a = s.actors[row.actorId]; if (!a || a.binding.kind !== 'roster' || !s.teamOrder.includes(a.actorId) || row.level < 1 || row.level > a.growth.level) return 'Pending defeat lost its original casualty.';
      const profile = catalogs.species.getProfile(a.identity.speciesId,a.identity.formId),atFaint = catalogs.species.getGrowthAtLevel(profile.id,row.level);
      if (a.resources.hp !== a.growth.naturalStats.hp-atFaint.stats.hp) return 'Pending casualty HP only reflects its preserved pre-copyback growth increment.';
    }
  }
  const order = s.scheduler.teamSlots.flatMap(id => id ? [id] : []);
  if (fingerprint(order) !== fingerprint(l.actorOrder) || l.actorIndex < 0 || l.actorIndex >= order.length || order[l.actorIndex] !== l.actorId || !learningPc(s)) return 'Learning cannot overtake its actual native recipient/settlement traversal or saved PC.';
  for (const id of order.slice(0,l.actorIndex)) {
    const prior = s.actors[id]; if (!prior || prior.pendingExperience || prior.growth.level < 100 && value(prior.growth.totalExperience) >= catalogs.species.getGrowthAtLevel(catalogs.species.getProfile(prior.identity.speciesId,prior.identity.formId).id,prior.growth.level+1).cumulativeExperience) return 'A later recipient cannot overtake unresolved earlier team growth.';
  }
  if (l.origin.kind === 'scene') {
    const scene = state.pendingScene,origin = l.origin,script = createSteelMeaniesContent().scenes.find(row => row.id === origin.sceneId);
    if (!script || ![O.rescueScene,T.rescue,STEEL.scenes[5],STEEL.scenes[10],ORDINARY_SUMMIT].includes(origin.sceneId) || origin.cursor+1 !== script.lines.length) return 'Only an actual terminal scene cursor defers settlement learning.';
    if (state.mode !== 'scene' || !scene || scene.sceneId !== l.origin.sceneId || scene.sceneInstanceId !== l.origin.sceneInstanceId || scene.cursor !== l.origin.cursor || scene.awaiting.kind !== 'advance' || l.schedulerTag.kind !== 'scene-paused' || l.schedulerTag.sceneInstanceId !== scene.sceneInstanceId) return 'Only the unchanged real terminal scene acknowledgment owns this deferred continuation.';
  } else if (state.pendingScene || state.mode !== 'dungeon') return 'Native turn/settlement input requires the actual dungeon owner.';
  return null;
}
