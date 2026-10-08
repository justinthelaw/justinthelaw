import { WILD_ACTIVE_IQ } from '../ai-facts.js';
import { DEFAULT_IQ } from './opening-facts.js';
import { diagnostics } from './pokemon-rules.js';
import { steelSame, steelAppend } from './steel-progress.js';
/** @typedef {import('../../src/contracts/campaign.js').CampaignStatePolicies} Policies */
/** Earlier wild actors use the native wild IQ initialization, not the default
 * friendly menu flags. Validate the actual profile before projecting only its
 * IQ to the immutable predecessor; all encounter/move/stat owners still run.
 * @param {Policies} prior @returns {Partial<Policies>} */
export function nativeWildPolicies(prior) { return {
  actor(actor, session, state, scope) {
    if (actor.binding.kind !== 'wild' || !['tiny-woods', 'thunderwave-cave'].includes(session.dungeonId)) return prior.actor(actor, session, state, scope);
    const r = diagnostics();
    r.check(steelSame(actor.enabledIqSkillIds, WILD_ACTIVE_IQ) && actor.tacticId === 'tactic-go-after-foes', '/enabledIqSkillIds', 'Earlier wild actors retain their exact native active IQ and pursuit tactic.');
    steelAppend(r, prior.actor({ ...actor, enabledIqSkillIds: [...DEFAULT_IQ] }, session, state, scope));
    return r.result();
  },
}; }
