import { recordsSteel } from './steel.js';
import { recordsEarlyWork } from './early-work.js';
import { allocateId } from '../ids.js';
import { recordsSpeciesSeen, initializeSpeciesSeen } from './species-seen.js';
import { createCampaignStreams } from '../rng.js';
import { copyPlainData } from './plain.js';
import { inspectShape, issue } from './structure.js';
import { contentInterface } from './policies.js';
import { failure, freezeData, validateCampaign } from './validate.js';

/** @typedef {import('../../contracts/campaign.js').CampaignState} CampaignState */
/** @typedef {import('../../contracts/campaign.js').InitialPokemonDefinition} InitialPokemonDefinition */
/** @typedef {import('../../contracts/campaign.js').MoveSet} MoveSet */

/** Pure catalog-injected initialization; no fallback starter, town or game facts.
 * @param {import('../../contracts/campaign.js').ConfirmedNewGameInput} input
 * @param {import('../../contracts/campaign.js').CampaignContent} content
 * @returns {import('../../contracts/campaign.js').CampaignValidation}
 */
export function createCampaign(input, content) {
  /** @type {import('../../contracts/campaign.js').StateIssue[]} */ const issues = [];
  const requirements = new Set();
  if (!contentInterface(content, requirements)) return failure(issues, requirements);
  let copied;
  try { copied = copyPlainData(input); } catch {
    issue(issues, 'shape', '', 'New-game input is not safe plain data.'); return failure(issues, requirements);
  }
  if (!inspectShape(copied, 'ConfirmedNewGameInput', issues)) return failure(issues, requirements);
  const confirmed = /** @type {import('../../contracts/campaign.js').ConfirmedNewGameInput} */ (/** @type {unknown} */ (copied));
  freezeData(confirmed);
  let lookup;
  try { lookup = copyPlainData(content.initialCampaign(confirmed.initialProfileId, confirmed.selection)); }
  catch { requirements.add('initial-campaign-profile-unavailable'); return failure(issues, requirements); }
  if (!inspectShape(lookup, 'InitialCampaignLookup', issues)) return failure(issues, requirements);
  const result = /** @type {import('../../contracts/campaign.js').InitialCampaignLookup} */ (/** @type {unknown} */ (lookup));
  if (result.status === 'blocked') {
    for (const requirement of result.requirementIds.slice(0, 100)) requirements.add(requirement.slice(0, 256));
    if (!requirements.size) requirements.add('initial-campaign-profile-unresolved');
    return failure(issues, requirements);
  }
  const definition = result.value;
  if (definition.profileId !== confirmed.initialProfileId ||
      definition.hero.identity.speciesId !== confirmed.selection.hero.speciesId || definition.hero.identity.formId !== confirmed.selection.hero.formId ||
      definition.partner.identity.speciesId !== confirmed.selection.partner.speciesId || definition.partner.identity.formId !== confirmed.selection.partner.formId) {
    issue(issues, 'relationship', '/selection', 'Initial profile does not match the confirmed selection.'); return failure(issues, requirements);
  }
  /** @type {import('../../contracts.js').IdSequence} */ let sequence = { next: 1 };
  /** @template {import('../../contracts.js').InstanceKind} K @param {K} kind @returns {import('../../contracts.js').Id<K>} */
  function next(kind) { const allocated = allocateId(sequence, kind, new Set()); sequence = allocated.sequence; return allocated.id; }
  const heroId = next('pokemon'); const partnerId = next('pokemon');
  const roles = { hero: heroId, partner: partnerId };
  /** @type {CampaignState['items']} */ const items = {};
  /** @type {CampaignState['containers']} */ const containers = {};
  /** @param {import('../../contracts/campaign.js').ContainerOwner} owner @param {import('../../contracts/campaign.js').ItemGrant[]} grants */
  function container(owner, grants) {
    const containerId = next('container');
    const itemIds = grants.map(grant => {
      const itemInstanceId = next('item-instance');
      items[itemInstanceId] = { itemInstanceId, template: grant.template, quantity: grant.quantity, shopLotId: null };
      return itemInstanceId;
    });
    containers[containerId] = { containerId, owner, itemIds }; return containerId;
  }
  /** @param {InitialPokemonDefinition} definition @returns {MoveSet} */
  function moves(definition) {
    if (definition.moves.length > 4) throw new RangeError('Initial move count exceeds four positions.');
    /** @type {MoveSet} */ const result = { slots: [null, null, null, null], links: [], setMoveSlotId: null };
    definition.moves.forEach((move, position) => { result.slots[position] = { moveSlotId: next('move-slot'), ...move }; });
    /** @param {number} position */
    function slot(position) {
      const value = result.slots[position];
      if (!Number.isSafeInteger(position) || position < 0 || !value) throw new RangeError('Initial move reference is absent.');
      return value.moveSlotId;
    }
    result.links = definition.linkedPositionGroups.map(group => group.map(slot));
    result.setMoveSlotId = definition.setMovePosition === null ? null : slot(definition.setMovePosition);
    return result;
  }
  /** @param {'hero'|'partner'} role @param {InitialPokemonDefinition} definition @param {string} nickname @returns {import('../../contracts/campaign.js').PokemonRecord} */
  function pokemon(role, definition, nickname) {
    const pokemonId = roles[role];
    return {
      pokemonId, identity: definition.identity, nickname, growth: definition.growth,
      moves: moves(definition), enabledIqSkillIds: definition.enabledIqSkillIds,
      tacticId: definition.tacticId, friendAreaId: definition.friendAreaId,
      heldContainerId: container({ kind: 'pokemon-held', pokemonId }, definition.heldItems),
      origin: { kind: 'starter', role, selectionOutcomeId: confirmed.selection.outcomeId }, evolutionHistory: [],
    };
  }
  try {
    const hero = pokemon('hero', definition.hero, confirmed.heroName);
    const partner = pokemon('partner', definition.partner, confirmed.partnerName);
    const toolbox = container({ kind: 'campaign-toolbox' }, definition.toolboxItems);
    const sceneInstanceId = next('scene-instance'); const day = definition.town.day;
    /** @type {CampaignState} */ const state = {
      schemaVersion: 1, contentRevision: content.contentRevision, revision: 0, idSequence: sequence,
      random: createCampaignStreams(confirmed.seed),
      profile: { referenceEdition: 'blue-rescue-team', heroId, partnerId,
        originalHeroIdentity: confirmed.selection.hero, originalPartnerIdentity: confirmed.selection.partner,
        teamName: confirmed.teamName, createdAt: confirmed.createdAt,
        selection: { quizRevision: confirmed.selection.quizRevision, outcomeId: confirmed.selection.outcomeId } },
      roster: { [heroId]: hero, [partnerId]: partner }, selectedPartyIds: definition.selectedRoles.map(role => roles[role]), items, containers,
      economy: { carriedMoney: definition.carriedMoney, bankedMoney: definition.bankedMoney, toolbox, storedItems: definition.storedItems, ownedFriendAreaIds: definition.friendAreaIds },
      progress: { storyNodeId: definition.storyNodeId, native: definition.nativeProgress,
        branches: Object.fromEntries(definition.initialBranches.map(branch => [branch.branchId, { ...branch, enteredRevision: 0, enteredDay: day }])),
        milestones: Object.fromEntries(definition.milestones.map(milestoneId => [milestoneId, { milestoneId, acquiredRevision: 0, acquiredDay: day }])),
        clears: {}, recruitedHistory: definition.recruitedHistory, seenScenes: {}, rankPoints: definition.rankPoints,
        jobs: {}, acceptedJobIds: [], appliedGrants: [], consumedMail: [], statistics: { jobsCompleted: 0, rescuesCompleted: 0, expeditions: 0 } },
      town: { mapDefinitionId: definition.town.mapDefinitionId, day, serviceStock: definition.town.serviceStock,
        placements: definition.town.placements.map(placement => ({ ...placement, reference: placement.reference.kind === 'starter' ? { kind: 'pokemon', pokemonId: roles[placement.reference.role] } : placement.reference })) },
      mode: 'scene', session: null, pendingResult: null,
      pendingScene: { sceneInstanceId, sceneId: definition.initialScene.sceneId, cursor: definition.initialScene.cursor, entryRevision: 0,
        bindings: definition.initialScene.bindings.map(binding => binding.reference.kind === 'starter' ? { roleId: binding.roleId, kind: 'pokemon', pokemonId: roles[binding.reference.role] } : { roleId: binding.roleId, ...binding.reference }),
        choices: [], awaiting: definition.initialScene.awaiting, continuation: definition.initialScene.continuation },
      rescue: { suspended: null, records: {}, importedTeams: {} }, options: confirmed.options,
    };
    if (new Set(definition.milestones).size !== definition.milestones.length || new Set(definition.initialBranches.map(branch => branch.branchId)).size !== definition.initialBranches.length) {
      issue(issues, 'relationship', '', 'Initial profile contains duplicate milestone or branch identities.'); return failure(issues, requirements);
    }
    if (recordsSpeciesSeen(content.contentRevision)) initializeSpeciesSeen(state, false);
    if (recordsEarlyWork(content.contentRevision)) state.earlyWork = null;
    if (recordsSteel(content.contentRevision)) state.steel = null;
    if (/^blue-campaign-state-v(?:11-moves|12-friends|13-wild-ai|14-party-moves)-opening:/.test(content.contentRevision)) state.moveState = null;
    if (['blue-campaign-state-v12-friends-opening:', 'blue-campaign-state-v13-wild-ai-opening:', 'blue-campaign-state-v14-party-moves-opening:'].some(prefix => content.contentRevision.startsWith(prefix))) state.friends = null;
    return validateCampaign(state, content);
  } catch { issue(issues, 'shape', '', 'Initial profile contains an invalid allocation, move projection or random seed.'); return failure(issues, requirements); }
}
