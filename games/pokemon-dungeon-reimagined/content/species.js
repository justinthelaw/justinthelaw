/**
 * Qualified original Rescue Team numerical facts. This catalog owns no actors,
 * learning decisions, form transitions, recruitment decisions or gameplay state.
 * @typedef {Readonly<{id:string, dexNo:number, name:string, profileIds:readonly string[], defaultProfileId:string|null}>} SpeciesRecord
 * @typedef {Readonly<{blueGrowthResourceId:number|null, redGrowthResourceId:number, blueLearnsetResourceId:number, redLearnsetResourceId:number}>} ProfileResources
 * @typedef {Readonly<{redResource:string, redNumericTableSha256:string, redDecodedPayloadSha256:string, upcUrl:string|null, upcNumericTableSha256:string|null}>} LevelEvidence
 * @typedef {Readonly<{id:string, speciesId:string, formId:string|null, persistence:'persistent'|'temporary', internalId:number, resources:ProfileResources, levelResourceId:string, learnsetResourceId:string, typeIds:readonly number[], abilityIds:readonly (number|null)[], bodySize:number, baseMovementSpeed:number, regenerationRate:number, experienceYield:number, friendAreaId:string, recruitment:Readonly<{baseRateTenthsPercent:number, eligibility:null, scriptedAcquisition:null}>, evidence:Readonly<Record<string,string>>, levelEvidence:LevelEvidence}>} SpeciesProfile
 * @typedef {Readonly<{id:string, baseStats:readonly number[], rows:readonly (readonly number[])[]}>} LevelResource
 * @typedef {Readonly<{id:string, levelUp:readonly (readonly number[])[], auxiliary:readonly number[]}>} LearnsetResource
 * @typedef {Readonly<{originalId:number, id:string, name:string}>} NamedIdentity
 * @typedef {Readonly<{originalId:number, name:string}>} TypeIdentity
 * @typedef {Readonly<{originalId:number, id:string, name:string, sourceSymbol:string}>} AreaIdentity
 * @typedef {Readonly<{moves:readonly NamedIdentity[], abilities:readonly NamedIdentity[], types:readonly TypeIdentity[], friendAreas:readonly AreaIdentity[]}>} CatalogIdentities
 * @typedef {Readonly<{hp:number, attack:number, specialAttack:number, defense:number, specialDefense:number}>} ProfileStats
 * @typedef {Readonly<{profileId:string, level:number, cumulativeExperience:number, growth:ProfileStats, stats:ProfileStats, experienceEvidence:string}>} GrowthAtLevel
 * @typedef {Readonly<{qualification:string, sourceIds:readonly string[]}>} ProfileEvidence
 * @typedef {Readonly<{id:string, url:string, scope:string, artifact?:Readonly<{filename:string, sha256:string, bytes:number}>}>} ProfileSource
 * @typedef {Readonly<{numericProfileLookup:true, rawLearnsetLookup:true, metadataLookup:true, gameplayRules:readonly string[]}>} ProfileCapabilities
 * @typedef {Readonly<{capabilities:ProfileCapabilities, identities:CatalogIdentities, getEvidence:(id:string)=>ProfileEvidence, getSource:(id:string)=>ProfileSource, getSpecies:(id:string)=>SpeciesRecord, getProfile:(speciesId:string,formId?:string|null)=>SpeciesProfile, getProfileById:(id:string)=>SpeciesProfile, getProfileByInternalId:(id:number)=>SpeciesProfile, getGrowthAtLevel:(profileId:string,level:number)=>GrowthAtLevel, getLearnset:(profileId:string)=>LearnsetResource, dispose:()=>void}>} SpeciesCatalog
 */

const CATALOG_ID = 'original-blue-species-profiles';
const EDITION = 'blue-rescue-team-qualified-facts';
const LIMIT = 1024 * 1024;
// No path, URL or module name from a JSON record is ever fetched.
const MANIFEST_URL = new URL('./species/manifest.json', import.meta.url);
const RESOURCE_URLS = Object.freeze([
  new URL('./species/species.json', import.meta.url),
  new URL('./species/profiles-1.json', import.meta.url),
  new URL('./species/profiles-2.json', import.meta.url),
  new URL('./species/profiles-3.json', import.meta.url),
  new URL('./species/profiles-4.json', import.meta.url),
  new URL('./species/profiles-5.json', import.meta.url),
  new URL('./species/levels-1.json', import.meta.url),
  new URL('./species/levels-2.json', import.meta.url),
  new URL('./species/levels-3.json', import.meta.url),
  new URL('./species/levels-4.json', import.meta.url),
  new URL('./species/learnsets.json', import.meta.url),
  new URL('./species/identities.json', import.meta.url),
  new URL('./species/sources.json', import.meta.url),
]);

/** @param {unknown} condition @param {string} message @returns {asserts condition} */
function requireValue(condition, message) {
  if (!condition) throw new Error(`Invalid species catalog: ${message}`);
}
/** @param {unknown} value @returns {Record<string,unknown>} */
function object(value) {
  requireValue(typeof value === 'object' && value !== null && !Array.isArray(value), 'object expected');
  return /** @type {Record<string,unknown>} */ (value);
}
/** @param {unknown} value @returns {unknown[]} */
function array(value) {
  requireValue(Array.isArray(value), 'array expected');
  return value;
}
/** @param {unknown} value @returns {string} */
function string(value) {
  requireValue(typeof value === 'string' && value.length > 0, 'nonempty string expected');
  return value;
}
/** @param {unknown} value @param {number} min @param {number} max @returns {number} */
function integer(value, min, max) {
  requireValue(typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max, 'integer out of range');
  return value;
}
/** @param {Record<string,unknown>} value @param {string[]} expected */
function keys(value, expected) {
  requireValue(Object.keys(value).sort().join('|') === [...expected].sort().join('|'), 'unexpected fields');
}
/** @param {Record<string,unknown>} value @param {string} kind */
function header(value, kind) {
  requireValue(value.schemaVersion === 1 && value.catalogId === CATALOG_ID && value.edition === EDITION && value.kind === kind, 'header/version mismatch');
}
/** @template T @param {T} value @returns {T} */
function immutable(value) {
  if (value !== null && typeof value === 'object') {
    for (const entry of Object.values(value)) immutable(entry);
    Object.freeze(value);
  }
  return value;
}
/** @template T @param {Map<string,T>} map @param {string} id @returns {T} */
function lookup(map, id) {
  const found = map.get(id);
  if (found === undefined) throw new RangeError(`Unknown species catalog identity: ${id}`);
  return found;
}
/** @template T @param {Map<string,T>} map @param {string} id @param {T} record */
function insert(map, id, record) {
  requireValue(!map.has(id), `duplicate identity ${id}`);
  map.set(id, record);
}
/** @param {readonly number[]} values @param {number} index @returns {number} */
function numberAt(values, index) {
  const value = values[index];
  requireValue(value !== undefined, 'missing numeric cell');
  return value;
}
/** @param {readonly number[]} values @returns {ProfileStats} */
function stats(values) {
  return Object.freeze({ hp: numberAt(values, 0), attack: numberAt(values, 1), specialAttack: numberAt(values, 2), defense: numberAt(values, 3), specialDefense: numberAt(values, 4) });
}
/** @param {unknown} value @returns {SpeciesRecord} */
function speciesRecord(value) {
  const row = object(value);
  keys(row, ['id', 'dexNo', 'name', 'profileIds', 'defaultProfileId']);
  requireValue(/^pokemon-\d{3}$/.test(string(row.id)), 'species ID');
  integer(row.dexNo, 1, 386);
  string(row.name);
  const ids = array(row.profileIds).map(string);
  requireValue(ids.length > 0 && new Set(ids).size === ids.length, 'species profiles');
  requireValue(row.defaultProfileId === null || ids.includes(string(row.defaultProfileId)), 'default profile');
  return immutable(/** @type {SpeciesRecord} */ (/** @type {unknown} */ (row)));
}
/** @param {unknown} value @returns {SpeciesProfile} */
function profileRecord(value) {
  const row = object(value);
  keys(row, ['id', 'speciesId', 'formId', 'persistence', 'internalId', 'resources', 'levelResourceId', 'learnsetResourceId', 'typeIds', 'abilityIds', 'bodySize', 'baseMovementSpeed', 'regenerationRate', 'experienceYield', 'friendAreaId', 'recruitment', 'evidence', 'levelEvidence']);
  for (const key of ['id', 'speciesId', 'levelResourceId', 'learnsetResourceId', 'friendAreaId']) string(row[key]);
  requireValue(row.formId === null || typeof row.formId === 'string', 'form ID');
  requireValue(row.id === (row.formId ?? row.speciesId), 'profile identity');
  requireValue(row.persistence === 'persistent' || row.persistence === 'temporary', 'persistence');
  integer(row.internalId, 1, 419);
  const refs = object(row.resources);
  keys(refs, ['blueGrowthResourceId', 'redGrowthResourceId', 'blueLearnsetResourceId', 'redLearnsetResourceId']);
  for (const key of ['redGrowthResourceId', 'blueLearnsetResourceId', 'redLearnsetResourceId']) requireValue(refs[key] === row.internalId, 'resource identity');
  if (refs.blueGrowthResourceId !== null) integer(refs.blueGrowthResourceId, 1, 419);
  const typeIds = array(row.typeIds);
  requireValue(typeIds.length >= 1 && typeIds.length <= 2, 'type slots');
  typeIds.forEach(id => integer(id, 1, 17));
  const abilityIds = array(row.abilityIds);
  requireValue(abilityIds.length === 2, 'ability slots');
  integer(abilityIds[0], 1, 76);
  if (abilityIds[1] !== null) integer(abilityIds[1], 1, 76);
  requireValue([1, 2, 4].includes(integer(row.bodySize, 1, 4)), 'body size');
  integer(row.baseMovementSpeed, 1, 4);
  integer(row.regenerationRate, 0, 1000);
  integer(row.experienceYield, 0, 65535);
  const recruitment = object(row.recruitment);
  keys(recruitment, ['baseRateTenthsPercent', 'eligibility', 'scriptedAcquisition']);
  integer(recruitment.baseRateTenthsPercent, -999, 999);
  requireValue(recruitment.eligibility === null && recruitment.scriptedAcquisition === null, 'unimplemented acquisition fields');
  const evidence = object(row.evidence);
  keys(evidence, ['identity', 'stats', 'experience', 'types', 'abilities', 'bodySize', 'friendArea', 'recruitment', 'mechanicalValues', 'learnset']);
  Object.values(evidence).forEach(string);
  const levelEvidence = object(row.levelEvidence);
  keys(levelEvidence, ['redResource', 'redNumericTableSha256', 'redDecodedPayloadSha256', 'upcUrl', 'upcNumericTableSha256']);
  requireValue(levelEvidence.redResource === `lvmp${String(row.internalId).padStart(3, '0')}`, 'level resource evidence');
  for (const key of ['redNumericTableSha256', 'redDecodedPayloadSha256']) requireValue(/^[a-f0-9]{64}$/.test(string(levelEvidence[key])), 'source numeric hash');
  requireValue(levelEvidence.upcUrl === null || typeof levelEvidence.upcUrl === 'string', 'UPC locator');
  requireValue(levelEvidence.upcNumericTableSha256 === null || /^[a-f0-9]{64}$/.test(string(levelEvidence.upcNumericTableSha256)), 'UPC numeric hash');
  return immutable(/** @type {SpeciesProfile} */ (/** @type {unknown} */ (row)));
}
/** @param {unknown} value @returns {LevelResource} */
function levelRecord(value) {
  const row = object(value);
  keys(row, ['id', 'baseStats', 'rows']);
  requireValue(/^level-[a-f0-9]{64}$/.test(string(row.id)), 'level ID');
  const base = array(row.baseStats);
  requireValue(base.length === 5, 'base stat columns');
  base.forEach((v, i) => integer(v, 0, i === 0 ? 999 : 255));
  const rows = array(row.rows);
  requireValue(rows.length === 100, '100 levels required');
  let previous = -1;
  rows.forEach((value, index) => {
    const cells = array(value);
    requireValue(cells.length === 6, 'level columns');
    cells.forEach((v, i) => integer(v, 0, i === 0 ? 2147483647 : i === 1 ? 65535 : 255));
    const exp = integer(cells[0], 0, 2147483647);
    requireValue(exp > previous, 'EXP order');
    previous = exp;
    if (index === 0) requireValue(cells.every(v => v === 0), 'level 1 zero gains/EXP');
  });
  return immutable(/** @type {LevelResource} */ (/** @type {unknown} */ (row)));
}
/** @param {unknown} value @returns {LearnsetResource} */
function learnsetRecord(value) {
  const row = object(value);
  keys(row, ['id', 'levelUp', 'auxiliary']);
  requireValue(/^learn-[a-f0-9]{64}$/.test(string(row.id)), 'learnset ID');
  let previous = 0;
  for (const value of array(row.levelUp)) {
    const cells = array(value);
    requireValue(cells.length === 2, 'level-up columns');
    const level = integer(cells[0], 1, 100);
    requireValue(level >= previous, 'learning order');
    previous = level;
    integer(cells[1], 1, 394);
  }
  array(row.auxiliary).forEach(v => integer(v, 1, 394));
  return immutable(/** @type {LearnsetResource} */ (/** @type {unknown} */ (row)));
}
/** @param {Record<string,unknown>} doc @returns {CatalogIdentities} */
function identityRecords(doc) {
  header(doc, 'identities');
  for (const kind of ['moves', 'abilities', 'types', 'friendAreas']) {
    const originals = new Set();
    const ids = new Set();
    for (const value of array(doc[kind])) {
      const row = object(value);
      keys(row, kind === 'types' ? ['originalId', 'name'] : kind === 'friendAreas' ? ['originalId', 'id', 'name', 'sourceSymbol'] : ['originalId', 'id', 'name']);
      const originalId = integer(row.originalId, 1, kind === 'moves' ? 394 : kind === 'abilities' ? 76 : kind === 'types' ? 17 : 57);
      string(row.name);
      requireValue(!originals.has(originalId), 'duplicate original identity');
      originals.add(originalId);
      if (kind !== 'types') {
        const id = string(row.id);
        requireValue(!ids.has(id), 'duplicate canonical identity');
        ids.add(id);
      }
      if (kind === 'friendAreas') string(row.sourceSymbol);
    }
  }
  return immutable(/** @type {CatalogIdentities} */ (/** @type {unknown} */ ({ moves: doc.moves, abilities: doc.abilities, types: doc.types, friendAreas: doc.friendAreas })));
}

/** @param {URL} url @param {AbortSignal} signal @returns {Promise<Uint8Array<ArrayBuffer>>} */
async function fetchBytes(url, signal) {
  const response = await fetch(url, { signal, redirect: 'error', credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Species resource ${url.pathname}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  requireValue(bytes.byteLength > 0 && bytes.byteLength < LIMIT, 'resource size');
  return bytes;
}
/** @param {Uint8Array<ArrayBuffer>} bytes @returns {Record<string,unknown>} */
function decode(bytes) {
  return object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
}
/** @param {Uint8Array<ArrayBuffer>} bytes @returns {Promise<string>} */
async function digest(bytes) {
  const result = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(result)].map(n => n.toString(16).padStart(2, '0')).join('');
}

/**
 * Load the fixed local catalog atomically. Rejection exposes no partial catalog;
 * the optional signal cancels in-flight requests. Each call owns private maps.
 * All HTTP/JSON/schema/reference/integrity failures reject the returned promise.
 * @param {Readonly<{signal?:AbortSignal}>} [options]
 * @returns {Promise<SpeciesCatalog>}
 */
export async function loadSpeciesCatalog({ signal } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const manifest = decode(await fetchBytes(MANIFEST_URL, controller.signal));
    header(manifest, 'manifest');
    keys(manifest, ['schemaVersion', 'catalogId', 'edition', 'kind', 'counts', 'resources']);
    requireValue(JSON.stringify(manifest.counts) === JSON.stringify({ species: 386, profiles: 419, persistent: 413, temporary: 6, levels: 384, learnsets: 386 }), 'membership counts');
    const entries = array(manifest.resources);
    requireValue(entries.length === RESOURCE_URLS.length, 'resource membership');
    const documents = await Promise.all(RESOURCE_URLS.map(async (url, index) => {
      const entry = object(entries[index]);
      keys(entry, ['file', 'bytes', 'sha256']);
      requireValue(entry.file === url.pathname.split('/').at(-1), 'resource name/order');
      const expectedBytes = integer(entry.bytes, 1, LIMIT - 1);
      const expectedHash = string(entry.sha256);
      requireValue(/^[a-f0-9]{64}$/.test(expectedHash), 'resource hash');
      const bytes = await fetchBytes(url, controller.signal);
      requireValue(bytes.byteLength === expectedBytes && await digest(bytes) === expectedHash, 'resource integrity');
      return decode(bytes);
    }));
    controller.signal.throwIfAborted();
    return createCatalog(documents);
  } catch (cause) {
    controller.abort();
    throw new Error('Unable to load the sourced species profile catalog.', { cause });
  } finally {
    signal?.removeEventListener('abort', abort);
  }
}

/** @param {Record<string,unknown>[]} documents @returns {SpeciesCatalog} */
function createCatalog(documents) {
  /** @type {Map<string,SpeciesRecord>} */ const species = new Map();
  /** @type {Map<string,SpeciesProfile>} */ const profiles = new Map();
  /** @type {Map<string,SpeciesProfile>} */ const internal = new Map();
  /** @type {Map<string,LevelResource>} */ const levels = new Map();
  /** @type {Map<string,LearnsetResource>} */ const learnsets = new Map();
  /** @type {CatalogIdentities|null} */ let identities = null;
  /** @type {Record<string,unknown>|null} */ let sources = null;
  for (const doc of documents) {
    const kind = string(doc.kind);
    header(doc, kind);
    if (kind === 'sources') { sources = doc; continue; }
    if (kind === 'identities') { identities = identityRecords(doc); continue; }
    keys(doc, ['schemaVersion', 'catalogId', 'edition', 'kind', 'records']);
    for (const value of array(doc.records)) {
      if (kind === 'species') { const row = speciesRecord(value); insert(species, row.id, row); }
      else if (kind === 'profiles') {
        const row = profileRecord(value);
        insert(profiles, row.id, row);
        insert(internal, String(row.internalId), row);
      } else if (kind === 'levels') { const row = levelRecord(value); insert(levels, row.id, row); }
      else if (kind === 'learnsets') { const row = learnsetRecord(value); insert(learnsets, row.id, row); }
      else throw new Error(`Unknown species document kind: ${kind}`);
    }
  }
  requireValue(identities !== null && sources !== null, 'missing identity/evidence documents');
  requireValue(species.size === 386 && profiles.size === 419 && levels.size === 384 && learnsets.size === 386, 'membership');
  requireValue(sources.blueBinaryBuildVerified === false, 'source qualification');
  const evidence = object(sources.evidence);
  /** @type {Map<string,ProfileEvidence>} */ const evidenceMap = new Map();
  /** @type {Map<string,ProfileSource>} */ const sourceMap = new Map();
  for (const value of array(sources.sources)) {
    const row = object(value);
    const id = string(row.id);
    requireValue(string(row.url).startsWith('https://'), 'source URL');
    string(row.scope);
    if (row.artifact !== undefined) {
      const artifact = object(row.artifact);
      string(artifact.filename);
      requireValue(/^[a-f0-9]{64}$/.test(string(artifact.sha256)), 'source artifact hash');
      integer(artifact.bytes, 1, 100000000);
    }
    insert(sourceMap, id, immutable(/** @type {ProfileSource} */ (/** @type {unknown} */ (row))));
  }
  for (const [id, value] of Object.entries(evidence)) {
    const entry = object(value);
    string(entry.qualification);
    for (const sourceId of array(entry.sourceIds)) lookup(sourceMap, string(sourceId));
    insert(evidenceMap, id, immutable(/** @type {ProfileEvidence} */ (/** @type {unknown} */ (entry))));
  }
  const moves = new Set(identities.moves.map(r => r.originalId));
  const abilityIds = new Set(identities.abilities.map(r => r.originalId));
  const typeIds = new Set(identities.types.map(r => r.originalId));
  const areas = new Set(identities.friendAreas.map(r => r.id));
  for (const row of species.values()) {
    requireValue(row.id === `pokemon-${String(row.dexNo).padStart(3, '0')}`, 'dex crosswalk');
    for (const id of row.profileIds) requireValue(lookup(profiles, id).speciesId === row.id, 'species profile reference');
  }
  for (const row of profiles.values()) {
    requireValue(lookup(species, row.speciesId).profileIds.includes(row.id), 'profile species reference');
    lookup(levels, row.levelResourceId);
    lookup(learnsets, row.learnsetResourceId);
    requireValue(areas.has(row.friendAreaId), 'Friend Area reference');
    for (const id of row.typeIds) requireValue(typeIds.has(id), 'type reference');
    for (const id of row.abilityIds) requireValue(id === null || abilityIds.has(id), 'ability reference');
    for (const id of Object.values(row.evidence)) requireValue(Object.hasOwn(evidence, id), 'evidence reference');
  }
  for (const row of learnsets.values()) {
    for (const pair of row.levelUp) requireValue(moves.has(numberAt(pair, 1)), 'level-up move reference');
    for (const id of row.auxiliary) requireValue(moves.has(id), 'auxiliary move reference');
  }
  const capabilities = /** @type {ProfileCapabilities} */ (immutable({ numericProfileLookup: true, rawLearnsetLookup: true, metadataLookup: true, gameplayRules: [] }));
  let disposed = false;
  const active = () => { if (disposed) throw new Error('Species catalog has been disposed.'); };
  /** @param {string} id @returns {SpeciesProfile} */
  const getProfileById = id => { active(); return lookup(profiles, id); };
  /** @param {string} id @returns {SpeciesRecord} */
  const getSpecies = id => { active(); return lookup(species, id); };
  return Object.freeze({
    capabilities,
    identities,
    getSpecies,
    /** @param {string} id @returns {ProfileEvidence} */
    getEvidence(id) { active(); return lookup(evidenceMap, id); },
    /** @param {string} id @returns {ProfileSource} */
    getSource(id) { active(); return lookup(sourceMap, id); },
    /** @param {string} speciesId @param {string|null} [formId] @returns {SpeciesProfile} */
    getProfile(speciesId, formId = null) {
      const row = getSpecies(speciesId);
      const id = formId ?? row.defaultProfileId;
      if (id === null) throw new RangeError(`Species ${speciesId} requires an explicit form.`);
      const profile = getProfileById(id);
      if (profile.speciesId !== speciesId || (formId !== null && profile.formId !== formId)) throw new RangeError('Invalid form for this species.');
      return profile;
    },
    getProfileById,
    /** Red-comparative internal identity; not a Blue ROM address or shared resource. @param {number} id */
    getProfileByInternalId(id) { active(); integer(id, 1, 419); return lookup(internal, String(id)); },
    /** @param {string} profileId @param {number} level @returns {GrowthAtLevel} */
    getGrowthAtLevel(profileId, level) {
      const profile = getProfileById(profileId);
      integer(level, 1, 100);
      const resource = lookup(levels, profile.levelResourceId);
      const row = resource.rows[level - 1];
      requireValue(row !== undefined, 'missing level');
      const totals = [...resource.baseStats];
      for (const gains of resource.rows.slice(0, level)) {
        for (let index = 0; index < 5; index += 1) totals[index] = numberAt(totals, index) + numberAt(gains, index + 1);
      }
      return Object.freeze({ profileId, level, cumulativeExperience: numberAt(row, 0), growth: stats(row.slice(1)), stats: stats(totals), experienceEvidence: string(profile.evidence.experience) });
    },
    /** @param {string} profileId @returns {LearnsetResource} */
    getLearnset(profileId) { return lookup(learnsets, getProfileById(profileId).learnsetResourceId); },
    dispose() {
      disposed = true;
      species.clear(); profiles.clear(); internal.clear(); levels.clear(); learnsets.clear(); evidenceMap.clear(); sourceMap.clear();
    },
  });
}
