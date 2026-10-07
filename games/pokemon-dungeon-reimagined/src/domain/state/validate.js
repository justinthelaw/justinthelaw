import { recordsEarlyWork } from './early-work.js';
import { copyPlainData, snapshotPlainData } from './plain.js';
import { inspectShape, issue } from './structure.js';
import { SHAPES } from './schema.js';
import { recordsSpeciesSeen } from './species-seen.js';
import { checkGraph } from './graph.js';
import { contentInterface, checkPolicies, runPolicy } from './policies.js';
import { checkNativeProgress } from '../progression/validation.js';
import { validateCampaignStreams } from '../rng.js';

/** @typedef {import('../../contracts/campaign.js').CampaignState} CampaignState */
/** @typedef {import('../../contracts/campaign.js').CampaignSnapshot} CampaignSnapshot */
/** @typedef {import('../../contracts/campaign.js').CampaignContent} CampaignContent */
/** @typedef {import('../../contracts/campaign.js').CampaignValidation} CampaignValidation */
/** @typedef {import('../../contracts/campaign.js').StateIssue} StateIssue */
/** @typedef {import('../../contracts.js').JsonValue} JsonValue */

/** @template T @param {T} value @returns {T} */
export function freezeData(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeData(child);
    Object.freeze(value);
  }
  return value;
}
/** @param {StateIssue[]} issues @param {Set<string>} requirements @returns {CampaignValidation} */
export function failure(issues, requirements) {
  return freezeData({ ok: false, kind: issues.length ? 'invalid' : 'blocked', issues, requirementIds: [...requirements].slice(0, 100) });
}
/** @param {number} left @param {number} right */
function gcd(left, right) {
  while (right !== 0) { const remainder = left % right; left = right; right = remainder; }
  return left;
}

/** Exact structural and graph validation precedes all trusted catalog callbacks.
 * Returns only detached, deeply frozen state or bounded diagnostics.
 * @param {unknown} input @param {CampaignContent} content @returns {CampaignValidation}
 */
export function validateCampaign(input, content) {
  /** @type {StateIssue[]} */ const issues = [];
  const requirements = new Set();
  /** @type {JsonValue} */ let data;
  try { data = copyPlainData(input); } catch {
    issue(issues, 'shape', '', 'Campaign exceeds the plain-data boundary or contains unsupported values.'); return failure(issues, requirements);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.schemaVersion !== 1) {
    issue(issues, 'unsupported-version', '/schemaVersion', 'Unsupported campaign schema.'); return failure(issues, requirements);
  }
  const campaignShape = typeof data.contentRevision === 'string' && recordsEarlyWork(data.contentRevision) ? 'CampaignStateWithWork' : typeof data.contentRevision === 'string' && recordsSpeciesSeen(data.contentRevision) ? 'CampaignStateWithSeen' : 'CampaignState';
  if (!inspectShape(data, campaignShape, issues)) return failure(issues, requirements);
  const state = /** @type {CampaignState} */ (/** @type {unknown} */ (data));
  checkNativeProgress(state.progress.native, issues, '/progress/native');
  if (issues.length) return failure(issues, requirements);
  if (!contentInterface(content, requirements)) return failure(issues, requirements);
  if (state.contentRevision !== content.contentRevision) {
    issue(issues, 'content-mismatch', '/contentRevision', 'Campaign and catalog revisions differ.'); return failure(issues, requirements);
  }
  const allocated = new Map();
  const declarations = new Map();
  const moveOwners = new Map();
  // All references, including immutable history, count toward the global mark.
  inspectShape(data, campaignShape, issues, (name, value, path) => {
    const shape = SHAPES[name];
    if (shape?.kind === 'instance' && typeof value === 'string') {
      const number = Number(value.slice(value.lastIndexOf(':') + 1));
      if (number >= state.idSequence.next || state.idSequence.next < 1) issue(issues, 'range', path, 'Identity is at or above the global allocation mark.');
      const previous = allocated.get(number);
      if (previous && previous !== value) issue(issues, 'ownership', path, 'Global allocation number is reused for another identity kind.');
      allocated.set(number, value);
    }
    if (value && typeof value === 'object' && !Array.isArray(value) && !path.includes('/entry/')) {
      const fields = /** @type {Record<string,JsonValue>} */ (value);
      const primary = {
        PokemonRecord: 'pokemonId', SessionActor: 'actorId', ItemInstance: 'itemInstanceId',
        ItemContainer: 'containerId', ExpeditionState: 'sessionId', FloorState: 'mapId',
        RoomState: 'roomId', TrapState: 'trapId', ExitState: 'exitId', ShopState: 'shopId',
        ShopLot: 'shopLotId', JobRecord: 'jobId', PendingScene: 'sceneInstanceId',
        PendingResult: 'resultId', RescueRecord: 'requestId', ImportedTeam: 'teamId',
      };
      const key = /** @type {Record<string,string>} */ (primary)[name];
      const id = key ? fields[key] : undefined;
      if (typeof id === 'string') {
        if (declarations.has(id)) issue(issues, 'ownership', path, 'Instance is declared by more than one current owner.');
        declarations.set(id, path);
      }
      if (name === 'MoveSlot' && !path.includes('/projection/')) {
        const rosterOwner = /^\/roster\/([^/]+)/.exec(path)?.[1];
        const actorMatch = /\/actors\/([^/]+)/.exec(path);
        const session = path.startsWith('/rescue/suspended/') ? state.rescue.suspended?.session : state.session;
        const actor = actorMatch?.[1] ? session?.actors[actorMatch[1]] : null;
        const owner = rosterOwner ?? (actor?.binding.kind === 'roster' ? actor.binding.pokemonId : actor?.actorId) ?? path.split('/moves/')[0];
        const previous = moveOwners.get(fields.moveSlotId);
        if (previous && previous !== owner) issue(issues, 'ownership', path, 'Move slot identity is shared by different owners.');
        moveOwners.set(fields.moveSlotId, owner);
      }
    }
    if (name === 'Int' && typeof value === 'number') {
      if (value < 0 && !/\/stages\/|\/moneyChange$|\/numerator$/.test(path)) issue(issues, 'range', path, 'Unsigned state counter is negative.');
      if (/(?:Revision|\/revision)$/.test(path) && value > state.revision) issue(issues, 'range', path, 'Historical revision is in the future.');
      if (/(?:Day|\/day)$/.test(path) && !path.endsWith('/expiryDay') && value > state.town.day) issue(issues, 'range', path, 'Historical day is in the future.');
    }
    if (name === 'Quantity') {
      const quantity = /** @type {import('../../contracts/campaign.js').Quantity} */ (value);
      if (quantity.denominator <= 0 || gcd(Math.abs(quantity.numerator), quantity.denominator) !== 1) issue(issues, 'range', path, 'Quantity must be a reduced rational with positive denominator.');
    }
  });
  if (state.revision < 0 || state.idSequence.next < 1) issue(issues, 'range', '', 'Invalid canonical revision or allocator.');
  try { validateCampaignStreams(state.random); } catch { issue(issues, 'range', '/random', 'Invalid campaign random streams.'); }
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(state.profile.createdAt) || !Number.isFinite(Date.parse(state.profile.createdAt)) || new Date(state.profile.createdAt).toISOString() !== state.profile.createdAt) issue(issues, 'shape', '/profile/createdAt', 'Creation time must be canonical UTC metadata.');
  checkGraph(state, issues);
  if (issues.length) return failure(issues, requirements);
  // Policies receive frozen inputs; they cannot repair or mutate a rejected save.
  freezeData(state);
  inspectShape(data, campaignShape, issues, (name, value, path) => {
    const shape = SHAPES[name];
    if (shape?.kind === 'catalog' && typeof value === 'string') {
      try { if (content.identities.has(shape.name, value) !== true) issue(issues, 'unknown-id', path, 'Identity is absent from the accepted catalog.'); }
      catch { requirements.add(`campaign-identity-lookup:${shape.name}`); }
    }
    if (name === 'SpeciesForm') {
      const identity = /** @type {import('../../contracts/campaign.js').SpeciesForm} */ (value);
      const persistent = /^\/roster\//.test(path) || /\/entry\/entrants\/[^/]+\/pokemon\//.test(path) || /^\/profile\//.test(path);
      runPolicy(() => content.identities.permitsForm(identity, persistent ? 'persistent' : 'session'), 'identity-form', issues, requirements, path);
    }
    if (name === 'FloorAddress') {
      const address = /** @type {import('../../contracts/campaign.js').FloorAddress} */ (value);
      runPolicy(() => content.identities.permitsFloor(address), 'identity-floor', issues, requirements, path);
    }
    if ((name === 'FloorLocation' || name === 'Destination') && value && typeof value === 'object' && !Array.isArray(value) && value.kind === 'rest') {
      const location = /** @type {{dungeonId:import('../../contracts.js').DungeonId,sectionId:import('../../contracts.js').SectionId}} */ (value);
      runPolicy(() => content.identities.permitsSection(location.dungeonId, location.sectionId), 'identity-section', issues, requirements, path);
    }
  });
  if (issues.length || requirements.size) return failure(issues, requirements);
  checkPolicies(state, content, issues, requirements);
  if (issues.length || requirements.size) return failure(issues, requirements);
  return Object.freeze({ ok: true, snapshot: /** @type {CampaignSnapshot} */ (/** @type {unknown} */ (snapshotPlainData(state))) });
}

/** Private mutable copy from an already validated snapshot. Never validates or
 * repairs untrusted data; callers must use validateCampaign for that boundary.
 * @param {CampaignSnapshot} snapshot @returns {CampaignState}
 */
export function copyCampaignDraft(snapshot) {
  return /** @type {CampaignState} */ (/** @type {unknown} */ (copyPlainData(snapshot)));
}
