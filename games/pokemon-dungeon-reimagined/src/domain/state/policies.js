import { copyPlainData } from './plain.js';
import { inspectShape, issue } from './structure.js';

/** @typedef {import('../../contracts/campaign.js').CampaignState} CampaignState */
/** @typedef {import('../../contracts/campaign.js').CampaignContent} CampaignContent */
/** @typedef {import('../../contracts/campaign.js').StateIssue} StateIssue */
/** @typedef {import('../../contracts/campaign.js').RuleCheck} RuleCheck */
/** @typedef {import('../../contracts/campaign.js').ValidationScope} ValidationScope */
/** @typedef {import('../../contracts/campaign.js').ExpeditionState} ExpeditionState */

export const REQUIRED_POLICIES = Object.freeze([
  'profile', 'pokemon', 'actor', 'item', 'economy', 'floor', 'conditions',
  'scheduler', 'expeditionEntry', 'progress', 'job', 'scene', 'result',
  'rescue', 'town', 'options',
]);

/** Read only own data fields; an interface accessor cannot execute at validation.
 * @param {unknown} object @param {string} key @returns {unknown}
 */
function field(object, key) {
  if (!object || typeof object !== 'object') return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  return descriptor && Object.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
}
/** Validate all required runtime entry points before invoking even one predicate.
 * @param {CampaignContent} content @param {Set<string>} requirements @returns {boolean}
 */
export function contentInterface(content, requirements) {
  const policies = field(content, 'policies');
  const identities = field(content, 'identities');
  let valid = field(content, 'referenceEdition') === 'blue-rescue-team' && field(content, 'campaignSchemaVersion') === 1 && typeof field(content, 'contentRevision') === 'string' && field(content, 'contentRevision') !== '';
  for (const name of REQUIRED_POLICIES) if (typeof field(policies, name) !== 'function') {
    requirements.add(`campaign-policy:${name}`); valid = false;
  }
  for (const name of ['has', 'permitsForm', 'permitsFloor', 'permitsSection']) if (typeof field(identities, name) !== 'function') {
    requirements.add(`campaign-identities:${name}`); valid = false;
  }
  if (typeof field(content, 'initialCampaign') !== 'function') { requirements.add('campaign-initial-profile-lookup'); valid = false; }
  if (!valid && requirements.size === 0) requirements.add('campaign-content-interface-version');
  return valid;
}

/** Validate policy results rather than trusting truthiness, missing dependencies,
 * promises or an imported runtimeReady flag. No error text from callbacks escapes.
 * @param {()=>RuleCheck} callback @param {string} name @param {StateIssue[]} issues
 * @param {Set<string>} requirements @param {string} path
 */
export function runPolicy(callback, name, issues, requirements, path) {
  try {
    const result = copyPlainData(callback(), { maxDepth: 8, maxNodes: 4096, maxArrayLength: 100, maxObjectKeys: 4, maxStringLength: 2048, maxTextLength: 65536 });
    if (!inspectShape(result, 'RuleCheck', [])) { requirements.add(`campaign-policy-result:${name}`); return; }
    const check = /** @type {RuleCheck} */ (result);
    if (check.ok) return;
    if (check.kind === 'unresolved') {
      if (check.requirementIds.length === 0) requirements.add(`campaign-policy-unresolved:${name}`);
      for (const requirement of check.requirementIds) {
        if (!requirement || requirement.length > 256) requirements.add(`campaign-policy-result:${name}`);
        else if (requirements.size < 100) requirements.add(requirement);
      }
    } else {
      if (check.issues.length === 0) issue(issues, 'relationship', path, `Policy ${name} rejected this state.`);
      for (const problem of check.issues) issue(issues, problem.code, path, problem.message);
    }
  } catch { requirements.add(`campaign-policy-unavailable:${name}`); }
}

/** @param {CampaignState} state @param {CampaignContent} content @param {StateIssue[]} issues @param {Set<string>} requirements */
export function checkPolicies(state, content, issues, requirements) {
  const policies = content.policies;
  /** @param {()=>RuleCheck} callback @param {string} name @param {string} [path] */
  const run = (callback, name, path = '') => runPolicy(callback, name, issues, requirements, path);
  run(() => policies.profile(state), 'profile', '/profile');
  run(() => policies.economy(state), 'economy', '/economy');
  run(() => policies.progress(state), 'progress', '/progress');
  run(() => policies.rescue(state), 'rescue', '/rescue');
  run(() => policies.town(state.town, state), 'town', '/town');
  run(() => policies.options(state.options), 'options', '/options');
  /** @type {ValidationScope} */
  const live = Object.freeze({ kind: 'live' });
  for (const pokemon of Object.values(state.roster)) run(() => policies.pokemon(pokemon, state, live), 'pokemon', `/roster/${pokemon.pokemonId}`);
  for (const job of Object.values(state.progress.jobs)) run(() => policies.job(job, state), 'job', `/progress/jobs/${job.jobId}`);
  const scene = state.pendingScene;
  if (scene) run(() => policies.scene(scene, state), 'scene', '/pendingScene');
  const result = state.pendingResult;
  if (result) run(() => policies.result(result, state), 'result', '/pendingResult');
  /** @param {import('../../contracts/campaign.js').ItemArchive} archive @param {ValidationScope} scope @param {string} path */
  function items(archive, scope, path) {
    for (const container of Object.values(archive.containers)) for (const id of container.itemIds) {
      const item = archive.items[id];
      if (item) run(() => policies.item(item, container, state, scope), 'item', `${path}/items/${id}`);
    }
  }
  items(state, live, '');
  /** @param {ExpeditionState} session @param {ValidationScope} scope @param {string} path @param {'active-session'|'suspended-rescue'} owner */
  function sessionPolicies(session, scope, path, owner) {
    run(() => policies.floor(session.floor, session, state, scope), 'floor', `${path}/floor`);
    run(() => policies.scheduler(session, state, scope), 'scheduler', `${path}/scheduler`);
    run(() => policies.expeditionEntry(session, state, scope), 'expeditionEntry', `${path}/entry`);
    for (const actor of Object.values(session.actors)) {
      run(() => policies.actor(actor, session, state, scope), 'actor', `${path}/actors/${actor.actorId}`);
      run(() => policies.conditions(actor, session, scope, state), 'conditions', `${path}/actors/${actor.actorId}/conditions`);
    }
    /** @type {ValidationScope} */
    const history = Object.freeze({ kind: 'entry-history', sessionId: session.sessionId, owner });
    for (const entrant of Object.values(session.entry.entrants)) run(() => policies.pokemon(entrant.pokemon, state, history), 'pokemon', `${path}/entry/entrants/${entrant.pokemon.pokemonId}`);
    items(session.entry.itemArchive, history, `${path}/entry/itemArchive`);
  }
  if (state.session) sessionPolicies(state.session, live, '/session', 'active-session');
  const suspended = state.rescue.suspended;
  if (suspended) {
    /** @type {ValidationScope} */
    const scope = Object.freeze({ kind: 'rescue-suspended', requestId: suspended.requestId });
    sessionPolicies(suspended.session, scope, '/rescue/suspended/session', 'suspended-rescue');
    items(suspended.itemArchive, scope, '/rescue/suspended/itemArchive');
  }
}
