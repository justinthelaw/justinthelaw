import { NAVIGATION_MANIFEST_SHA256 } from './navigation-integrity.js';

/** Bounded local factual catalog, with no upstream/runtime network dependency. */
/** @typedef {import('./navigation-types.js').NavigationData} NavigationData */
/** @typedef {import('./navigation-types.js').NavigationCatalog} NavigationCatalog */
const LIMIT = 1024 * 1024;
const CATALOG = 'original-blue-navigation';
const SOURCE_COMMIT = '6bcbec4f906938c0243aa2026bcbd41b577bab85';
const SOURCE_CORPUS = 'b074413fce5840f7159c2a34cb89ebe9814caf64128312cf824aadfa07989882';
const SOURCE_QUALIFICATION = 'original-red-engine-comparative; independent browser fixed geometry';
const MANIFEST = new URL('./navigation/manifest.json', import.meta.url);
const FACTS = new URL('./navigation/facts.json', import.meta.url);
/** @template T @param {T} value @returns {import('./navigation-types.js').ReadonlyData<T>} */
export function freezeNavigationData(value) {
    if (value && typeof value === 'object') {
        for (const child of Object.values(value)) freezeNavigationData(child);
        Object.freeze(value);
    }
    return /** @type {import('./navigation-types.js').ReadonlyData<T>} */ (value);
}
/** Detach public proposals before freezing: callers retain ownership of their inputs.
 * @template T @param {T} value @returns {import('./navigation-types.js').ReadonlyData<T>}
 */
export function snapshotNavigationData(value) { return freezeNavigationData(structuredClone(value)); }
/** @param {unknown} condition @param {string} label @returns {asserts condition} */
function requireFact(condition, label) { if (!condition) throw new TypeError(`Navigation catalog: ${label}`); }
/** @param {unknown} value @param {string} names @returns {asserts value is Record<string,unknown>} */
function closedRecord(value, names) {
    requireFact(value !== null && typeof value === 'object' && !Array.isArray(value), 'record');
    requireFact(Object.keys(value).sort().join(',') === names.split(',').sort().join(','), 'closed record fields');
}
/** @param {unknown} value @param {number} min @param {number} max */
function integer(value, min, max) { return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max; }
/** @param {unknown} value */
function identity(value) { return typeof value === 'string' && /^[a-z][a-z0-9-]{0,95}$/.test(value); }
/** @template K,T @param {Map<K,T>} map @param {K} key @returns {T} */
function get(map, key) { const value = map.get(key); if (value === undefined) throw new RangeError(`Unknown navigation identity: ${key}`); return value; }
/** @param {Uint8Array<ArrayBuffer>} bytes */
async function digest(bytes) { return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join(''); }
/** Abort promptly even when a supplied adapter does not honor fetch's signal.
 * @param {Promise<Response>} pending @param {AbortSignal} signal @returns {Promise<Response>}
 */
function responseOrAbort(pending, signal) {
    return new Promise((resolve, reject) => {
        const abort = () => reject(signal.reason);
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
        pending.then(response => {
            signal.removeEventListener('abort', abort);
            if (signal.aborted) { void response.body?.cancel().catch(() => {}); reject(signal.reason); }
            else resolve(response);
        }, error => { signal.removeEventListener('abort', abort); reject(error); });
    });
}
/** Fixed local URL; bounded bytes before decoding or parsing. No redirects are accepted.
 * @param {URL} url @param {AbortSignal} signal @param {typeof fetch} fetchResource @param {number} [expectedBytes]
 * @returns {Promise<Uint8Array<ArrayBuffer>>}
 */
async function fetchBytes(url, signal, fetchResource, expectedBytes) {
    signal.throwIfAborted();
    const response = await responseOrAbort(fetchResource(url, { signal, redirect: 'error', credentials: 'same-origin' }), signal);
    if (!response.ok || response.redirected || !response.body || (response.url && response.url !== url.href)) {
        void response.body?.cancel().catch(() => {});
        throw new TypeError('Navigation catalog: local resource response');
    }
    const reader = response.body.getReader();
    const abort = () => { void reader.cancel(signal.reason).catch(() => {}); };
    signal.addEventListener('abort', abort, { once: true });
    /** @type {Uint8Array<ArrayBufferLike>[]} */ const chunks = [];
    let total = 0;
    try {
        while (true) {
            signal.throwIfAborted();
            const { done, value } = await reader.read();
            signal.throwIfAborted();
            if (done) break;
            total += value.byteLength;
            requireFact(total < LIMIT && (expectedBytes === undefined || total <= expectedBytes), 'resource byte size');
            chunks.push(value);
        }
        requireFact(total > 0 && (expectedBytes === undefined || total === expectedBytes), 'resource byte count');
        const bytes = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        return bytes;
    } catch (error) { void reader.cancel().catch(() => {}); throw error; }
    finally { signal.removeEventListener('abort', abort); reader.releaseLock(); }
}
/** @param {Uint8Array<ArrayBuffer>} bytes @returns {unknown} */
function decode(bytes) { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
/** @param {NavigationData} data @param {import('./navigation-types.js').NavigationDependencies} dependencies */
function validate(data, dependencies) {
    closedRecord(data, 'schemaVersion,catalogId,mobility,terrain,fixed,tilesetLiquid,shopChances,source');
    closedRecord(data.source, 'commit,qualification,corpusSha256');
    requireFact(data.source.commit === SOURCE_COMMIT && data.source.qualification === SOURCE_QUALIFICATION && data.source.corpusSha256 === SOURCE_CORPUS, 'source pins');
    requireFact([data.mobility, data.fixed, data.tilesetLiquid, data.shopChances, data.terrain].every(Array.isArray), 'array tables');
    requireFact(data.schemaVersion === 1 && data.catalogId === CATALOG, 'version');
    requireFact(data.mobility.length === 424 && data.fixed.length === 140 && data.tilesetLiquid.length === 76 && data.shopChances.length === 16 && data.terrain.length === 16, 'coverage');
    const mobilityIds = new Set();
    data.mobility.forEach((row, index) => {
        closedRecord(row, 'internalId,speciesId,formId,movementType,canMove,baseMovementSpeed');
        requireFact(row.internalId === index && [0, 2, 3, 4, 5].includes(row.movementType) && typeof row.canMove === 'boolean' && integer(row.baseMovementSpeed, 0, 4), 'mobility');
        requireFact((row.speciesId === null) === (index === 0 || index >= 420), 'sentinel species crosswalk');
        requireFact(row.formId === null || identity(row.formId), 'form identity');
        if (row.speciesId === null) requireFact(row.formId === null, 'sentinel form');
        else {
            requireFact(typeof row.speciesId === 'string' && /^pokemon-\d{3}$/.test(row.speciesId) && dependencies.isSpeciesForm(row.speciesId, row.formId) === true, 'species membership');
            const key = `${row.speciesId}/${row.formId ?? ''}`;
            requireFact(!mobilityIds.has(key), 'unique species form'); mobilityIds.add(key);
        }
    });
    requireFact(mobilityIds.size === 419, 'canonical species forms');
    const fixedIds = new Set();
    data.fixed.forEach((row, index) => {
        closedRecord(row, 'index,id,width,height,kind,canonical,playerAnchors,stairs,doors,access,rewardItemId,roles,sceneOnly,hasLiquid,hasVoid,sourceSymbol');
        requireFact(identity(row.id) && !fixedIds.has(row.id), 'fixed identity'); fixedIds.add(row.id);
        requireFact(row.kind === (index === 0 ? 'sentinel' : index < 50 ? 'floorwide' : index <= 66 ? 'embedded' : 'unused') && row.canonical === (index > 0 && index <= 66 && index !== 48) && row.sceneOnly === (index === 6), 'fixed activation');
        requireFact(row.index === index && integer(row.width, 1, 46) && integer(row.height, 1, 22), 'fixed bounds');
        requireFact(integer(row.playerAnchors, 0, 1) && integer(row.stairs, 0, 1) && integer(row.doors, 0, 1), 'fixed anchors/stairs/doors');
        requireFact(typeof row.hasLiquid === 'boolean' && typeof row.hasVoid === 'boolean' && ['floor', 'liquid', 'wall'].includes(row.access) && (row.access !== 'liquid' || row.hasLiquid), 'fixed terrain/access');
        requireFact(index <= 66 ? typeof row.sourceSymbol === 'string' && /^[A-Z][A-Z0-9_]{0,95}$/.test(row.sourceSymbol) : row.sourceSymbol === null, 'fixed source symbol');
        if (index === 48 || index >= 67) requireFact(row.id === `unused-fixed-room-${String(index).padStart(3, '0')}`, 'unused fixed identity');
        if (index === 0) requireFact(row.id === 'fixed-room-none', 'fixed sentinel identity');
        requireFact(Array.isArray(row.roles) && row.roles.length <= 124, 'fixed roles');
        if (index >= 50 && index <= 66) requireFact(identity(row.rewardItemId) && dependencies.isItemId(/** @type {string} */ (row.rewardItemId)) === true && row.roles.length === 0, 'reward membership');
        else requireFact(row.rewardItemId === null, 'no invented reward');
        const roleIds = new Set();
        for (const actor of row.roles) {
            closedRecord(actor, 'speciesId,formId,internalId,behavior,count');
            requireFact(integer(actor.internalId, 0, 423) && integer(actor.count, 1, 124) && typeof actor.behavior === 'string' && /^BEHAVIOR_[A-Z0-9_]{1,64}$/.test(actor.behavior), 'fixed role');
            const mon = data.mobility[actor.internalId];
            requireFact(mon && mon.speciesId !== null && actor.speciesId === mon.speciesId && actor.formId === mon.formId, 'fixed role internal species/form crosswalk');
            const key = `${actor.internalId}/${actor.behavior}`;
            requireFact(!roleIds.has(key), 'duplicate fixed role'); roleIds.add(key);
        }
    });
    requireFact(data.tilesetLiquid.every(kind => ['none', 'water', 'lava'].includes(kind)), 'liquid kinds');
    requireFact(data.shopChances.every(rows => Array.isArray(rows) && rows.length === 3 && rows.every(row => Array.isArray(row) && row.length === 3 && row.every(n => integer(n, 0, 100)))), 'shop tables');
    const kinds = /** @type {const} */ (['wall', 'floor', 'water', 'lava', 'void']);
    for (const [index, row] of data.terrain.entries()) {
        closedRecord(row, 'id,kind,impassable,door,revealedTerrainId');
        const kind = kinds[Math.floor(index / 3)];
        const variant = index % 3;
        requireFact(index === 15
            ? row.id === 'terrain-key-door' && row.kind === 'floor' && row.impassable === true && row.door === true && row.revealedTerrainId === 'terrain-floor'
            : row.id === `terrain-${variant === 1 ? 'impassable-' : variant === 2 ? 'sealed-' : ''}${kind}` && row.kind === (variant === 2 ? 'wall' : kind) && row.impassable === (variant !== 0) && row.door === false && row.revealedTerrainId === (variant === 2 ? `terrain-${kind}` : null), 'exact terrain semantics');
    }
}
/** Load immutable, digest-pinned local facts. Options and disposal are additive.
 * @param {import('./navigation-types.js').NavigationDependencies} dependencies
 * @param {Readonly<{signal?:AbortSignal}>} [options] @returns {Promise<NavigationCatalog>}
 */
export async function loadNavigationCatalog(dependencies, { signal } = {}) {
    requireFact(dependencies !== null && typeof dependencies === 'object', 'membership dependencies');
    requireFact(typeof dependencies.isSpeciesForm === 'function' && typeof dependencies.isItemId === 'function', 'membership adapters');
    const fetchResource = dependencies.fetchResource ?? fetch;
    requireFact(typeof fetchResource === 'function', 'fetch adapter');
    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    try {
        const manifestBytes = await fetchBytes(MANIFEST, controller.signal, fetchResource);
        requireFact(await digest(manifestBytes) === NAVIGATION_MANIFEST_SHA256, 'pinned manifest digest');
        const manifest = decode(manifestBytes);
        closedRecord(manifest, 'schemaVersion,catalogId,bytes,sha256');
        requireFact(manifest.schemaVersion === 1 && manifest.catalogId === CATALOG && integer(manifest.bytes, 1, LIMIT - 1) && typeof manifest.sha256 === 'string' && /^[a-f0-9]{64}$/.test(manifest.sha256), 'manifest declarations');
        const bytes = await fetchBytes(FACTS, controller.signal, fetchResource, /** @type {number} */ (manifest.bytes));
        requireFact(await digest(bytes) === manifest.sha256, 'facts digest');
        const data = /** @type {NavigationData} */ (decode(bytes));
        validate(data, dependencies);
        controller.signal.throwIfAborted();
        return createCatalog(freezeNavigationData(data));
    } catch (error) { controller.abort(); throw error; }
    finally { signal?.removeEventListener('abort', abort); }
}
/** @param {import('./navigation-types.js').ReadonlyData<NavigationData>} data @returns {NavigationCatalog} */
function createCatalog(data) {
    const mobility = new Map(data.mobility.filter(row => row.speciesId !== null).map(row => [`${row.speciesId}/${row.formId ?? ''}`, row]));
    const terrains = new Map(data.terrain.map(row => [row.id, row]));
    const fixed = new Map(data.fixed.map(row => [row.index, row]));
    const liquids = new Map(data.tilesetLiquid.map((kind, index) => [index, kind]));
    const shops = new Map(data.shopChances.map((rows, index) => [index, rows]));
    let disposed = false;
    const active = () => { if (disposed) throw new Error('Navigation catalog disposed'); };
    /** @template K,T @param {Map<K,T>} map @returns {(key:K)=>T} */
    const lookup = map => key => { active(); return get(map, key); };
    const lookupMobility = lookup(mobility);
    return Object.freeze({
        mobility: (/** @type {string} */ speciesId, /** @type {string|null} */ formId) => lookupMobility(`${speciesId}/${formId ?? ''}`),
        terrain: lookup(terrains), fixed: lookup(fixed), liquid: lookup(liquids), shopChances: lookup(shops),
        terrainIds: Object.freeze([...terrains.keys()]), definitionIds: Object.freeze(['navigation-procedural', ...data.fixed.filter(row => row.canonical).map(row => `navigation-fixed-${row.index}`)]), source: data.source,
        dispose: () => { if (disposed) return; disposed = true; mobility.clear(); terrains.clear(); fixed.clear(); liquids.clear(); shops.clear(); },
    });
}
