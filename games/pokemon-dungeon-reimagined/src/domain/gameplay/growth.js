import { MOVE_LEARNING_REVISION } from '../state/move-learning-revision.js';
import { processLearning } from './native-learning.js';
import { allocate, blocked, draw, profile, value, maxHp } from './support.js';

/** Native growth/first-free-slot path. Once four slots are occupied this browser
 * checkpoint explicitly chooses the legal decline option and emits a message;
 * it never rolls back an otherwise valid KO or silently replaces a learned move.
 * @param {import('../turns/types.js').MutationContext} context @param {import('../../contracts/campaign.js').SessionActor} actor @param {import('./support.js').Catalogs} catalogs */
export function applyExperience(context, actor, catalogs) {
  if (context.state.contentRevision === MOVE_LEARNING_REVISION) return processLearning(context,catalogs,{ kind: 'turn',sourceActorId: actor.actorId });
  if (actor.affiliation !== 'team') return false;
  const p = profile(actor.identity, catalogs);
  while (actor.growth.level < 100) {
    const next = catalogs.species.getGrowthAtLevel(p.id, actor.growth.level + 1);
    if (value(actor.growth.totalExperience) < next.cumulativeExperience) break;
    // R dungeon_leveling.c:sub_8072778 chooses one candidate per level;
    // pokemon.c:GetMovesLearnedAtLevel applies the four ultimate-move IQ gates.
    const learned = catalogs.species.getLearnset(p.id).levelUp.filter(row => row[0] === next.level).map(row => {
      const id = catalogs.species.identities.moves.find(move => move.originalId === row[1])?.id;
      if (!id) return blocked('level-move-identity'); return id;
    }).filter(id => actor.growth.iqPoints >= 333 || !['move-frenzy-plant', 'move-hydro-cannon', 'move-blast-burn', 'move-volt-tackle'].includes(id));
    const id = learned.length ? learned[draw(context.state, learned.length)] : null;
    if (id) {
      const index = actor.moves.slots.indexOf(null);
      if (index < 0) context.emit({ type: 'message', messageId: 'move-learning-declined-full-slots' });
      else {
      const moveSlotId = allocate(context.state, 'move-slot'); const moveId = /** @type {import('../../contracts.js').MoveId} */ (id);
      actor.moves.slots[index] = { moveSlotId, moveId, enabled: true, powerBoost: 0, ppCapacityBonus: 0 };
      actor.battleMoves.slots.push({ moveSlotId, currentPp: catalogs.effects.getMove(id).numeric.pp, sealed: false, usedForExperience: false });
      }
    }
    const oldHp = maxHp(actor); actor.growth.level = next.level; actor.growth.naturalStats = { ...next.stats }; actor.resources.hp += maxHp(actor) - oldHp;
    context.emit({ type: 'message', messageId: 'level-up' });
  }
  return false;
}
