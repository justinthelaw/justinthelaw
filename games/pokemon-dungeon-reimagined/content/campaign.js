import { CAMPAIGN_MANIFEST_SHA256 } from './campaign-integrity.js';

/** @typedef {import('./campaign-types.js').ModelDocument} ModelDocument */
/** @typedef {import('./campaign-types.js').PredicatesDocument} PredicatesDocument */
/** @typedef {import('./campaign-types.js').TransitionsDocument} TransitionsDocument */
/** @typedef {import('./campaign-types.js').RoutesDocument} RoutesDocument */
/** @typedef {import('./campaign-types.js').BossesDocument} BossesDocument */
/** @typedef {import('./campaign-types.js').ContractsDocument} ContractsDocument */
/** @typedef {import('./campaign-types.js').IdentitiesDocument} IdentitiesDocument */
/** @typedef {import('./campaign-types.js').SourcesDocument} SourcesDocument */
/** @typedef {Readonly<{isSpeciesForm:(speciesId:string,formId:string|null)=>boolean,isDungeonId:(id:string)=>boolean,isSection:(dungeonId:string,sectionId:string)=>boolean,isFixedRoomId:(id:string)=>boolean,isItemId:(id:string)=>boolean,isFriendAreaId:(id:string)=>boolean}>} CampaignCatalogDependencies */
/** @typedef {Readonly<{factsAvailable:true,evaluatesPredicates:false,mutatesCampaign:false,stagesScenes:false,blueBinaryParityClaimed:false}>} CampaignCapabilities */
/** @typedef {Readonly<{capabilities:CampaignCapabilities,getIdentities:()=>IdentitiesDocument['records'],getRoutes:()=>RoutesDocument['records'],getBosses:()=>BossesDocument['records'],getRecruitmentRules:()=>BossesDocument['recruitment'],getRematches:()=>BossesDocument['rematches'],getModel:()=>ModelDocument['model'],getContracts:()=>ContractsDocument['contracts'],getPredicate:(id:string)=>PredicatesDocument['records'][number],getTransition:(id:string)=>TransitionsDocument['records'][number],getTransitionsForHook:(id:string)=>TransitionsDocument['records'],getRoute:(id:string)=>RoutesDocument['records'][number],getRouteBySourceIndex:(index:number)=>RoutesDocument['records'][number],getReturn:(id:string)=>RoutesDocument['returns'][number],getBoss:(id:string)=>BossesDocument['records'][number],getRecruitment:(id:string)=>BossesDocument['recruitment'][number],getRematch:(id:string)=>BossesDocument['rematches'][number],getIdentity:(id:string)=>IdentitiesDocument['records'][number],getCallback:(id:string)=>IdentitiesDocument['callbacks'][number],getSource:(id:string)=>SourcesDocument['sources'][number],getEvidence:(id:string)=>SourcesDocument['evidence'][number],getRemainingCapabilities:()=>SourcesDocument['remainingCapabilities'],dispose:()=>void}>} CampaignCatalog */

const LIMIT = 1024 * 1024;
const CATALOG = 'original-blue-campaign-facts';
const MANIFEST = new URL('./campaign/manifest.json', import.meta.url);
const RESOURCES = Object.freeze([
  new URL('./campaign/schema.json', import.meta.url),
  new URL('./campaign/model.json', import.meta.url),
  new URL('./campaign/predicates.json', import.meta.url),
  new URL('./campaign/transitions.json', import.meta.url),
  new URL('./campaign/routes.json', import.meta.url),
  new URL('./campaign/bosses.json', import.meta.url),
  new URL('./campaign/contracts.json', import.meta.url),
  new URL('./campaign/identities.json', import.meta.url),
  new URL('./campaign/sources.json', import.meta.url),
]);
const KINDS = Object.freeze(['model', 'predicates', 'transitions', 'routes', 'bosses', 'contracts', 'identities', 'sources']);
const VOCABULARY = Object.freeze(['type', 'properties', 'required', 'additionalProperties', 'items', 'minItems', 'maxItems', 'minimum', 'maximum', 'enum', 'anyOf']);

/** @param {unknown} condition @param {string} message @returns {asserts condition} */
function requireValue(condition, message) { if (!condition) throw new TypeError(`Invalid campaign catalog: ${message}`); }
/** @param {unknown} value @returns {value is Record<string,unknown>} */
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
/** @param {unknown} value @returns {Record<string,unknown>} */
function object(value) { requireValue(isObject(value), 'object required'); return value; }
/** @param {unknown} value @returns {unknown[]} */
function array(value) { requireValue(Array.isArray(value), 'array required'); return value; }
/** @param {unknown} value @returns {string} */
function string(value) { requireValue(typeof value === 'string' && value.length > 0, 'string required'); return value; }
/** @param {Record<string,unknown>} value @param {readonly string[]} expected */
function keys(value, expected) { requireValue(Object.keys(value).sort().join('|') === [...expected].sort().join('|'), 'exact record fields'); }
/** @template T @param {T} value @returns {T} */
function freeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
/** @param {unknown} raw */
function validateSchema(raw) {
  const rule = object(raw);
  for (const key of Object.keys(rule)) requireValue(VOCABULARY.includes(key), 'unsupported schema keyword');
  if (rule.anyOf !== undefined) {
    keys(rule, ['anyOf']);
    const choices = array(rule.anyOf);
    requireValue(choices.length > 0, 'empty schema alternatives');
    choices.forEach(validateSchema);
    return;
  }
  requireValue(['null', 'boolean', 'integer', 'string', 'array', 'object'].includes(string(rule.type)), 'schema type');
  if (rule.enum !== undefined) requireValue(array(rule.enum).length > 0 && array(rule.enum).every(v => v === null || ['string', 'number', 'boolean'].includes(typeof v)), 'primitive schema enum');
  for (const name of ['minimum', 'maximum', 'minItems', 'maxItems']) {
    if (rule[name] !== undefined) requireValue(Number.isSafeInteger(rule[name]), 'schema bound');
  }
  if (rule.type === 'object') {
    requireValue(rule.additionalProperties === false, 'closed object schema');
    const props = object(rule.properties);
    const required = array(rule.required).map(string);
    requireValue(required.length === new Set(required).size, 'duplicate required field');
    keys(props, required);
    Object.values(props).forEach(validateSchema);
  }
  if (rule.type === 'array') validateSchema(rule.items);
}
/** Interpret only the fixed, hash-pinned schema vocabulary. No game predicates are evaluated.
 * @param {unknown} value @param {unknown} raw @param {string} location
 */
function validate(value, raw, location) {
  const rule = object(raw);
  if (rule.anyOf !== undefined) {
    for (const alternative of array(rule.anyOf)) {
      try { validate(value, alternative, location); return; } catch { /* Next declared shape. */ }
    }
    throw new TypeError(`Invalid campaign record shape: ${location}`);
  }
  if (rule.enum !== undefined) requireValue(array(rule.enum).includes(value), `enum at ${location}`);
  if (rule.type === 'null') requireValue(value === null, `null at ${location}`);
  else if (rule.type === 'boolean') requireValue(typeof value === 'boolean', `boolean at ${location}`);
  else if (rule.type === 'string') requireValue(typeof value === 'string', `string at ${location}`);
  else if (rule.type === 'integer') {
    requireValue(typeof value === 'number' && Number.isSafeInteger(value), `integer at ${location}`);
    requireValue(value >= Number(rule.minimum) && value <= Number(rule.maximum), `number bounds at ${location}`);
  } else if (rule.type === 'array') {
    const entries = array(value);
    requireValue(entries.length >= Number(rule.minItems) && entries.length <= Number(rule.maxItems), `array bounds at ${location}`);
    entries.forEach((entry, index) => validate(entry, rule.items, `${location}[${index}]`));
  } else if (rule.type === 'object') {
    const row = object(value);
    const props = object(rule.properties);
    keys(row, array(rule.required).map(string));
    for (const [key, nested] of Object.entries(props)) validate(row[key], nested, `${location}.${key}`);
  } else throw new TypeError('Unsupported campaign schema');
}
/** @param {Uint8Array<ArrayBuffer>} bytes */
async function digest(bytes) { return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join(''); }
/** @param {URL} url @param {AbortSignal} signal @returns {Promise<Uint8Array<ArrayBuffer>>} */
async function fetchBytes(url, signal) {
  const response = await fetch(url, { signal, redirect: 'error', credentials: 'same-origin' });
  requireValue(response.ok && response.body, `resource response ${url.pathname}`);
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      requireValue(total < LIMIT, 'resource size');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  requireValue(total > 0, 'empty resource');
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
/** @param {Uint8Array<ArrayBuffer>} bytes */
function decode(bytes) { return object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))); }

/** Load immutable factual definitions, with required reviewed-catalog membership adapters.
 * No source scripts, gameplay modules, evaluator, state mutation or UI dispatch is executed.
 * @param {CampaignCatalogDependencies} dependencies
 * @param {Readonly<{signal?:AbortSignal}>} [options]
 * @returns {Promise<CampaignCatalog>}
 */
export async function loadCampaignCatalog(dependencies, { signal } = {}) {
  for (const name of ['isSpeciesForm', 'isDungeonId', 'isSection', 'isFixedRoomId', 'isItemId', 'isFriendAreaId']) {
    const descriptor = Object.getOwnPropertyDescriptor(dependencies, name);
    requireValue(descriptor && Object.hasOwn(descriptor, 'value') && typeof descriptor.value === 'function', `required membership adapter ${name}`);
  }
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const manifestBytes = await fetchBytes(MANIFEST, controller.signal);
    requireValue(await digest(manifestBytes) === CAMPAIGN_MANIFEST_SHA256, 'pinned manifest digest');
    const manifest = decode(manifestBytes);
    keys(manifest, ['schemaVersion', 'catalogId', 'kind', 'resources']);
    requireValue(manifest.schemaVersion === 1 && manifest.catalogId === CATALOG && manifest.kind === 'manifest', 'manifest header');
    const entries = array(manifest.resources);
    requireValue(entries.length === RESOURCES.length, 'resource count');
    const documents = await Promise.all(RESOURCES.map(async (url, index) => {
      const entry = object(entries[index]);
      keys(entry, ['file', 'bytes', 'sha256']);
      requireValue(entry.file === url.pathname.split('/').at(-1), 'fixed resource order');
      requireValue(typeof entry.bytes === 'number' && Number.isSafeInteger(entry.bytes) && entry.bytes > 0 && entry.bytes < LIMIT, 'byte declaration');
      requireValue(/^[a-f0-9]{64}$/.test(string(entry.sha256)), 'digest declaration');
      const bytes = await fetchBytes(url, controller.signal);
      requireValue(bytes.byteLength === entry.bytes && await digest(bytes) === entry.sha256, 'resource digest');
      return decode(bytes);
    }));
    const schema = object(documents[0]);
    keys(schema, ['schemaVersion', 'catalogId', 'kind', 'vocabulary', 'documents']);
    requireValue(schema.schemaVersion === 1 && schema.catalogId === CATALOG && schema.kind === 'schema', 'schema header');
    requireValue(JSON.stringify(schema.vocabulary) === JSON.stringify(VOCABULARY), 'schema dialect');
    const rules = object(schema.documents);
    keys(rules, KINDS);
    /** @type {Map<string,Record<string,unknown>>} */ const checked = new Map();
    KINDS.forEach((kind, index) => {
      const document = object(documents[index + 1]);
      requireValue(document.schemaVersion === 1 && document.catalogId === CATALOG && document.edition === 'blue-rescue-team-qualified-facts' && document.kind === kind, 'document header');
      validateSchema(rules[kind]);
      validate(document, rules[kind], kind);
      checked.set(kind, freeze(document));
    });
    controller.signal.throwIfAborted();
    return createCatalog(checked, dependencies);
  } catch (error) { controller.abort(); throw error; }
  finally { signal?.removeEventListener('abort', abort); }
}

/** @template T @param {Map<string,T>} map @param {string} id @returns {T} */
function lookup(map, id) {
  const value = map.get(id);
  if (value === undefined) throw new RangeError(`Unknown campaign catalog identity: ${id}`);
  return value;
}
/** @template {{id:string}} T @param {readonly T[]} records */
function index(records) {
  const map = new Map(records.map(row => [row.id, row]));
  requireValue(map.size === records.length, 'duplicate identity');
  return map;
}
/** @param {Map<string,Record<string,unknown>>} checked @param {CampaignCatalogDependencies} dependencies @returns {CampaignCatalog} */
function createCatalog(checked, dependencies) {
  const model = /** @type {ModelDocument} */ (/** @type {unknown} */ (lookup(checked, 'model')));
  const predicates = /** @type {PredicatesDocument} */ (/** @type {unknown} */ (lookup(checked, 'predicates')));
  const transitions = /** @type {TransitionsDocument} */ (/** @type {unknown} */ (lookup(checked, 'transitions')));
  const routes = /** @type {RoutesDocument} */ (/** @type {unknown} */ (lookup(checked, 'routes')));
  const bosses = /** @type {BossesDocument} */ (/** @type {unknown} */ (lookup(checked, 'bosses')));
  const contracts = /** @type {ContractsDocument} */ (/** @type {unknown} */ (lookup(checked, 'contracts')));
  const identities = /** @type {IdentitiesDocument} */ (/** @type {unknown} */ (lookup(checked, 'identities')));
  const sources = /** @type {SourcesDocument} */ (/** @type {unknown} */ (lookup(checked, 'sources')));
  const p = index(predicates.records), t = index(transitions.records), r = index(routes.records), b = index(bosses.records);
  const i = index(identities.records), c = index(identities.callbacks), s = index(sources.sources), e = index(sources.evidence);
  const returns = index(routes.returns), recruits = index(bosses.recruitment), rematches = index(bosses.rematches);
  /** @type {Map<string,TransitionsDocument['records']>} */ const hooks = new Map();
  for (const entry of identities.records.filter(row => row.kind === 'hook')) {
    const rows = transitions.records.filter(row => row.hookId === entry.id).sort((a, z) => a.order - z.order);
    requireValue(rows.every((row, n) => row.order === n), `hook order ${entry.id}`);
    hooks.set(entry.id, Object.freeze(rows));
  }
  requireValue(r.size === 83 && b.size === 26 && recruits.size === 18 && p.size === 1011 && t.size === 586 && i.size === 410 && c.size === 20 && s.size === 64, 'sourced coverage counts');
  requireValue(contracts.contracts.returnHookCount === 41 && contracts.contracts.returnDecisionCount === 488 && transitions.records.filter(row => row.id.startsWith('return-decision-')).length === 488, 'return decision coverage');
  requireValue(transitions.records.filter(row => row.hookId === 'main-job-dispatch').length === 6 && transitions.records.filter(row => row.hookId === 'unlock-refresh').length === 21, 'progression gate counts');
  const nativeRoutes = new Map(routes.records.map(row => [row.sourceScriptDungeonIndex, row]));
  requireValue(nativeRoutes.size === 83 && routes.records.every((row, n) => row.sourceScriptDungeonIndex === n), 'native route identities');
  /** @param {string} id @param {string} kind */
  const identity = (id, kind) => requireValue(lookup(i, id).kind === kind, `identity kind ${id}`);
  /** Crosswalk all nested foreign keys, including policies and callback evidence.
   * @param {unknown} value
   */
  function joins(value) {
    if (Array.isArray(value)) { value.forEach(joins); return; }
    if (!isObject(value)) return;
    for (const [key, child] of Object.entries(value)) {
      if (child === null) continue;
      if (key === 'evidenceIds') array(child).forEach(id => lookup(e, string(id)));
      else if (key === 'sourceId') lookup(s, string(child));
      else if (key === 'predicateIds') array(child).forEach(id => lookup(p, string(id)));
      else if (key.endsWith('PredicateId') || key === 'predicateId') lookup(p, string(child));
      else if ((key.endsWith('CallbackId') && key !== 'nativeCallbackId') || key === 'callbackId') lookup(c, string(child));
      else if (key === 'hookId' || key.endsWith('HookId')) identity(string(child), 'hook');
      else if (key === 'scenarioId') identity(string(child), 'scenario');
      else if (key === 'variableId' || key.endsWith('VariableId') || key === 'resetCounterId' || key === 'wrapperResolvesField') identity(string(child), 'variable');
      else if (key === 'flagId' || key.endsWith('FlagId')) identity(string(child), 'flag');
      else if (key === 'sceneId' || key.endsWith('SceneId')) identity(string(child), 'scene');
      else if (key === 'milestoneId') identity(string(child), 'milestone');
      else if (key.endsWith('MapIds')) array(child).forEach(id => identity(string(id), 'map'));
      else if (key.endsWith('MapId')) identity(string(child), 'map');
      else if (key.endsWith('RouteId')) lookup(r, string(child));
      else if (key === 'fixedRoomId') requireValue(dependencies.isFixedRoomId(string(child)) === true, 'fixed room membership');
      else if (key === 'friendAreaId') requireValue(dependencies.isFriendAreaId(string(child)) === true, 'Friend Area membership');
      else if (key === 'itemId' || key.endsWith('ItemId')) requireValue(dependencies.isItemId(string(child)) === true, 'item membership');
      else if (key.endsWith('SpeciesIds')) array(child).forEach(id => requireValue(dependencies.isSpeciesForm(string(id), null) === true, 'species membership'));
      else if (key === 'speciesId') requireValue(dependencies.isSpeciesForm(string(child), value.formId === undefined ? null : /** @type {string|null} */ (value.formId)) === true, 'species/form membership');
      else if (key === 'dungeonId') requireValue(dependencies.isDungeonId(string(child)) === true, 'dungeon membership');
      else if (key === 'sectionId') requireValue(dependencies.isSection(string(value.dungeonId), string(child)) === true, 'dungeon/section membership');
      joins(child);
    }
  }
  checked.forEach(joins);
  // Predicate graphs are acyclic references, never arbitrary executable strings.
  const visiting = new Set(), visited = new Set();
  /** @param {string} id */
  function visit(id) {
    if (visited.has(id)) return;
    requireValue(!visiting.has(id), 'cyclic predicate graph');
    visiting.add(id);
    const row = lookup(p, id);
    if (row.kind === 'all' || row.kind === 'any') row.predicateIds.forEach(visit);
    else if (row.kind === 'not') visit(row.predicateId);
    visiting.delete(id); visited.add(id);
  }
  p.forEach(row => visit(row.id));
  let disposed = false;
  const active = () => { if (disposed) throw new Error('Campaign catalog disposed'); };
  /** @template T @param {Map<string,T>} map @returns {(id:string)=>T} */
  const get = map => id => { active(); return lookup(map, id); };
  return Object.freeze({
    capabilities: Object.freeze({ factsAvailable: true, evaluatesPredicates: false, mutatesCampaign: false, stagesScenes: false, blueBinaryParityClaimed: false }),
    getIdentities: () => { active(); return identities.records; },
    getRoutes: () => { active(); return routes.records; },
    getBosses: () => { active(); return bosses.records; },
    getRecruitmentRules: () => { active(); return bosses.recruitment; },
    getRematches: () => { active(); return bosses.rematches; },
    getModel: () => { active(); return model.model; },
    getContracts: () => { active(); return contracts.contracts; },
    getPredicate: get(p), getTransition: get(t), getTransitionsForHook: get(hooks), getRoute: get(r),
    getRouteBySourceIndex: sourceIndex => { active(); const row = nativeRoutes.get(sourceIndex); if (!row) throw new RangeError('Unknown native script dungeon index'); return row; },
    getReturn: get(returns), getBoss: get(b), getRecruitment: get(recruits), getRematch: get(rematches),
    getIdentity: get(i), getCallback: get(c), getSource: get(s), getEvidence: get(e),
    getRemainingCapabilities: () => { active(); return sources.remainingCapabilities; },
    dispose: () => { disposed = true; for (const map of [checked, p, t, r, b, i, c, s, e, returns, recruits, rematches, hooks, nativeRoutes]) map.clear(); },
  });
}
