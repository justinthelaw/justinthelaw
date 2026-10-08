import { advanceSinisterTurns } from './sinister-engine.js';
import { sinisterTurnProblem } from '../state/sinister-turn-proof.js';
import { markSinisterTerminalReturn, sinisterSchedulerFields } from '../gameplay/sinister-turn-work.js';
import { fingerprint } from '../state/relations.js';
import { TurnFault } from './support.js';
/** Required future source callers, not default callbacks. Each must use the
 * actual v25 raw learning/scene/settlement owner, never a retagged v24 state.
 * This unselected composition does not widen original save admission.
 * @typedef {import('./types.js').MutationContext} Context
 * @typedef {import('../../contracts/sinister-work.js').SinisterTerminalReceipt} Terminal
 * @typedef {{
 * drain(context:Context,terminal:Terminal):'pending'|'drained';
 * resume(context:Context,terminal:Terminal):void;
 * advanceLearning(context:Context):import('./types.js').TurnOutcome;
 * }} SinisterTerminalOwners */
/** Called by the exact return parent immediately before its own cleanup and
 * copyback. The marker remains visible until this real parent consumes it.
 * @param {Context} context @param {Terminal['origin']} origin */
export function consumeSinisterTerminal(context,origin) {
  const s = context.state.session,w = s?.sinisterTurn,t = w?.terminal;
  if (!s || !w || !t || t.phase !== 'return' || w.checkpoint || s.learning || s.learningWork || context.state.pendingResult || fingerprint(t.origin) !== fingerprint(origin) || t.frameFingerprint !== fingerprint(s.scheduler.continuation)) throw new TurnFault('content-blocked','sinister-terminal-parent');
  s.scheduler = { ...sinisterSchedulerFields(s.scheduler),...t.schedulerTag };
  w.terminal = null; w.move = null; w.combat.sequence = null;
}
/** Explicit dispatch service order: real learning first; then terminal work;
 * then one native impact/end/ordinary unit. No-growth terminals still save the
 * return boundary and cannot copy back in the triggering heavy dispatch.
 * @param {import('../gameplay/support.js').Catalogs} catalogs
 * @param {SinisterTerminalOwners} owners */
export function createSinisterTurnAdvance(catalogs,owners) {
  if (typeof owners.drain !== 'function' || typeof owners.resume !== 'function' || typeof owners.advanceLearning !== 'function') throw new TypeError('Actual Sinister learning/terminal owners are required.');
  /** @param {Context} context @param {import('./sinister-engine.js').Hooks} hooks @param {import('./types.js').Action|null} [action] @returns {import('./types.js').TurnOutcome} */
  return (context,hooks,action = null) => {
    const s = context.state.session,w = s?.sinisterTurn;
    if (!s || !w) throw new TurnFault('content-blocked','sinister-advance-session');
    if (s.learningWork) {
      if (action || w.checkpoint || w.terminal && fingerprint(s.learningWork.origin) !== fingerprint(w.terminal.origin)) throw new TurnFault('content-blocked','sinister-learning-parent');
      // The direct v25 learning owner independently proves actual source PCs,
      // awards, recipient prefixes and choice before invoking this callback.
      const priorTerminal = w.terminal;
      const result = owners.advanceLearning(context);
      const checkpoint = /** @type {import('../../contracts/sinister-work.js').SinisterCheckpoint|null} */ (w.checkpoint);
      if (priorTerminal && !s.learningWork && (w.terminal !== priorTerminal || priorTerminal.phase !== 'return' || checkpoint?.kind !== 'terminal')) throw new TurnFault('content-blocked','sinister-learning-return-marker');
      return result;
    }
    if (!w.terminal) return advanceSinisterTurns(context,hooks,catalogs,action);
    if (action || sinisterTurnProblem(context.state,catalogs) || w.checkpoint?.kind !== 'terminal') throw new TurnFault('content-blocked','sinister-terminal-raw');
    const terminal = w.terminal;
    w.checkpoint = null;
    s.scheduler = { ...sinisterSchedulerFields(s.scheduler),...terminal.schedulerTag };
    if (terminal.phase === 'captured') {
      const result = owners.drain(context,terminal);
      if (context.state.session !== s || w.terminal !== terminal) throw new TurnFault('content-blocked','sinister-inline-terminal-return');
      if (result === 'pending') {
        const learningWork = /** @type {import('../../contracts/campaign.js').ExpeditionState['learningWork']} */ (s.learningWork);
        if (!learningWork || fingerprint(learningWork.origin) !== fingerprint(terminal.origin) || !['learning-continuing','choice-paused'].includes(s.scheduler.kind)) throw new TurnFault('content-blocked','sinister-terminal-learning-cursor');
        return { kind: s.learning ? 'prompt' : 'yielded',consumedTurn: false };
      }
      if (result !== 'drained') throw new TurnFault('content-blocked','sinister-terminal-drain-result');
      markSinisterTerminalReturn(context,catalogs);
      return { kind: 'yielded',consumedTurn: false };
    }
    owners.resume(context,terminal);
    if (context.state.session === s && w.terminal !== null) throw new TurnFault('content-blocked','sinister-terminal-marker-unconsumed');
    return { kind: !context.state.session ? 'terminal' : context.state.pendingScene || context.state.pendingResult ? 'prompt' : 'yielded',consumedTurn: false };
  };
}
