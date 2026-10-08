import { diagnostics } from './pokemon-rules.js';
import { INITIAL_SCHEDULE_POLICY_ID } from './expedition.js';
import { continuingSession } from '../../src/domain/state/continuation.js';
import { pendingSpecialSwap } from '../../src/domain/gameplay/swap-continuation.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** Only the new work checkpoints are owned here. Every old ready, real prompt
 * and terminal scheduler still goes through the exact published v18 policy,
 * including its ready-Petrified rejection.
 * @param {Policies} prior @param {import('./campaign.js').CampaignCatalogs} catalogs
 * @returns {Pick<Policies,'scheduler'|'floor'>} */
export function continuationPolicies(prior, catalogs) { return {
  floor(floor, session, state, scope) {
    if (session.scheduler.kind !== 'continuing') return prior.floor(floor, session, state, scope);
    const swap = pendingSpecialSwap(session, /** @type {import('../../src/domain/gameplay/support.js').Catalogs} */ (catalogs));
    // Only the proved pending pair is projected to its original distinct
    // occupancy for the frozen floor policy. Actual state, all other actors,
    // terrain/items/traps/roles and every unrelated collision remain checked.
    return prior.floor(floor, swap?.original ?? session, state, scope);
  },
  scheduler(session, state, scope) {
    if (session.scheduler.kind !== 'continuing') return prior.scheduler(session, state, scope);
    const r = diagnostics();
    r.check(scope.kind === 'live' && continuingSession(session, state), '/continuation', 'Automatic work requires an exact live completed-unit checkpoint without an input owner.');
    r.check(session.scheduler.schedulePolicyId === INITIAL_SCHEDULE_POLICY_ID, '/schedulePolicyId', 'Continuation retains the original native turn schedule.');
    return r.result();
  },
}; }
