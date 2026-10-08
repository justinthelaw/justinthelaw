import { advanceEscortTurns } from './escort-engine.js';
import { advanceLearningWork } from '../gameplay/escort-native-learning.js';
import { learningProblem } from '../state/escort-learning-proof.js';
import { TurnFault } from './support.js';
/** Actual successor engine composition: saved EXP advance drains one recipient
 * before any parent scheduler, terminal copyback or scene acknowledgment. The
 * concrete successor supplies the same source-owned resume callback used by its
 * command handlers; no direct scene/user input or synthetic action is emitted.
 * @param {import('../gameplay/support.js').Catalogs} catalogs
 * @param {(context:import('./types.js').MutationContext,origin:import('../../contracts/move-learning.js').LearningOrigin)=>import('./types.js').MutationResult} resume */
export function createEscortTurnAdvance(catalogs,resume) {
  /** @param {import('./types.js').MutationContext} context @param {import('./types.js').TurnHooks} hooks @param {import('./types.js').Action|null} [action] @returns {import('./types.js').TurnOutcome} */
  return (context,hooks,action = null) => {
    if (!context.state.session?.learningWork) return advanceEscortTurns(context,hooks,action);
    if (action || learningProblem(context.state,catalogs)) throw new TurnFault('content-blocked','escort-learning-raw-advance');
    const result = advanceLearningWork(context,catalogs,resume);
    if (result.kind !== 'changed') throw new TurnFault('content-blocked','escort-learning-parent-result');
    if (result.resumeDungeon) return advanceEscortTurns(context,hooks);
    if (!context.state.session) return { kind: 'terminal',consumedTurn: false };
    return { kind: context.state.pendingResult || context.state.pendingScene && !context.state.session.learningWork ? 'prompt' : 'yielded',consumedTurn: false };
  };
}
