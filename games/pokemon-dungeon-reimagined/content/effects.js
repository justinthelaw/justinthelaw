/** Immutable qualified factual catalog. This module does not execute effects. */
import { EFFECT_INDEX_SHA256 } from './effects-integrity.js';

/** @typedef {Record<string, unknown>} ObjectValue */
/** @template T @typedef {T extends (infer U)[] ? ReadonlyArray<DeepReadonly<U>> : T extends object ? {readonly [K in keyof T]: DeepReadonly<T[K]>} : T} DeepReadonly */
/** @typedef {{isMoveId: (id: string) => boolean, isItemId: (id: string) => boolean, isSpeciesForm: (speciesId: string, formId: string|null) => boolean, fetchResource?: typeof fetch, signal?: AbortSignal}} EffectDependencies */
const CATALOG_ID = 'original-blue-qualified-effect-facts';
const LIMIT = 1048576;
/** @param {boolean} condition @param {string} message @returns {asserts condition} */
function check(condition, message) { if (!condition) throw new TypeError(message); }
/** @param {unknown} value @param {string} label @returns {ObjectValue} */
function object(value, label) {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), `${label}: object required`);
  return /** @type {ObjectValue} */ (value);
}
/** @param {unknown} value @returns {unknown[]} */
function array(value) { check(Array.isArray(value), 'Array required'); return value; }
/** @param {unknown} value @returns {string} */
function string(value) { check(typeof value === 'string', 'String required'); return value; }
/** @param {ObjectValue} value @param {string[]} keys */
function exact(value, keys) { check(Object.keys(value).sort().join('|') === keys.sort().join('|'), 'Exact object keys required'); }
/** @template T @param {T} value @returns {DeepReadonly<T>} */
function freeze(value) {
  if (value !== null && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return /** @type {DeepReadonly<T>} */ (value);
}
/** @param {Uint8Array<ArrayBuffer>} bytes */
async function hash(bytes) {
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
}
/** Closed local schema dialect; schemas are authenticated before validation.
 * @param {unknown} value @param {unknown} rawSchema @param {string} label
 */
function validate(value, rawSchema, label) {
  const schema = object(rawSchema, 'schema');
  if (schema.anyOf) {
    for (const alternative of array(schema.anyOf)) {
      try { validate(value, alternative, label); return; } catch { /* Next declared alternative. */ }
    }
    throw new TypeError(`${label}: no schema alternative`);
  }
  if (schema.enum) check(array(schema.enum).includes(value), `${label}: unknown discriminant`);
  switch (schema.type) {
    case 'null': check(value === null, `${label}: null required`); break;
    case 'boolean': check(typeof value === 'boolean', `${label}: boolean required`); break;
    case 'integer': case 'number':
      check(typeof value === 'number' && Number.isFinite(value) && (schema.type !== 'integer' || Number.isSafeInteger(value)), `${label}: finite number required`);
      check(value >= Number(schema.minimum) && value <= Number(schema.maximum), `${label}: numeric range`); break;
    case 'string': check(string(value).length >= Number(schema.minLength ?? 0) && string(value).length <= Number(schema.maxLength), `${label}: string length`); break;
    case 'array': {
      const rows = array(value);
      check(rows.length >= Number(schema.minItems) && rows.length <= Number(schema.maxItems), `${label}: array length`);
      rows.forEach((r,i) => validate(r, schema.items, `${label}[${i}]`)); break;
    }
    case 'object': {
      const record = object(value,label); const properties = object(schema.properties,'properties');
      check(Object.keys(record).every(k => Object.hasOwn(properties,k)), `${label}: unknown key`);
      check(array(schema.required).every(k => Object.hasOwn(record,string(k))), `${label}: missing required key`);
      for (const [key,child] of Object.entries(record)) validate(child,properties[key],`${label}.${key}`);
      break;
    }
    default: throw new TypeError(`${label}: unsupported schema`);
  }
}

/** Load local authenticated records with required external membership validation.
 * Cancellation also invalidates returned accessors; dispose aborts outstanding work.
 * @param {EffectDependencies} dependencies
 */
export async function loadEffectCatalog(dependencies) {
  check(typeof dependencies?.isMoveId === 'function' && typeof dependencies?.isItemId === 'function' && typeof dependencies?.isSpeciesForm === 'function', 'Move, item and species/form membership validators required');
  const controller = new AbortController();
  const abort = () => controller.abort();
  dependencies.signal?.addEventListener('abort', abort, {once:true});
  if (dependencies.signal?.aborted) abort();
  const active = () => { if (controller.signal.aborted) throw new DOMException('Effect catalog disposed or canceled', 'AbortError'); };
  const dispose = () => { controller.abort(); dependencies.signal?.removeEventListener('abort',abort); };
  const fetchResource = dependencies.fetchResource ?? fetch;
  /** @param {string} file @param {string} expectedHash @returns {Promise<unknown>} */
  const read = async (file, expectedHash) => {
    active();
    check(/^[a-z][a-z0-9-]*\.json$/.test(file), 'Unsafe resource path');
    const response = await fetchResource(new URL(`./effects/${file}`,import.meta.url), {signal:controller.signal});
    check(response.ok && response.body !== null, `Cannot load effect resource ${file}`);
    const reader = response.body.getReader(); const buffer = new Uint8Array(LIMIT); let size = 0;
    try {
      while (true) {
        active(); const {done,value} = await reader.read(); if (done) break;
        check(size + value.byteLength < LIMIT, `Oversize effect resource ${file}`);
        buffer.set(value,size); size += value.byteLength;
      }
    } finally { await reader.cancel(); reader.releaseLock(); }
    const bytes = buffer.slice(0,size);
    check(await hash(bytes) === expectedHash, `Effect resource hash mismatch ${file}`); active();
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  };
  try {
    const index = object(await read('index.json',EFFECT_INDEX_SHA256),'index');
    exact(index,['schemaVersion','catalogId','resources','coverage','schemaSha256']);
    check(index.schemaVersion === 1 && index.catalogId === CATALOG_ID,'Unsupported effect catalog');
    const coverage = object(index.coverage,'coverage');
    exact(coverage,['counts','keys','qualification','blueInstructionParity','domainHandlersImplemented']);
    check(coverage.blueInstructionParity === false && coverage.domainHandlersImplemented === false,'Unsupported capability claim');
    const counts = object(coverage.counts,'counts'); const keys = object(coverage.keys,'keys');
    const names = Object.keys(counts).sort(); exact(keys,names.slice());
    const schemaDocument = object(await read('schemas.json',string(index.schemaSha256)),'schemas');
    exact(schemaDocument,['schemaVersion','catalogId','families']);
    check(schemaDocument.schemaVersion === 1 && schemaDocument.catalogId === CATALOG_ID,'Unsupported schemas');
    const schemas = object(schemaDocument.families,'schemas'); exact(schemas,names.slice());
    /** @type {Record<string,ObjectValue[]>} */
    const families = Object.fromEntries(names.map(n => [n,[]]));
    const resources = array(index.resources).map(r => object(r,'resource'));
    check(new Set(resources.map(r => r.file)).size === resources.length,'Duplicate resource file');
    const documents = await Promise.all(resources.map(r => {
      exact(r,['file','family','count','sha256']);
      check(names.includes(string(r.family)) && /^[a-f0-9]{64}$/.test(string(r.sha256)),'Invalid descriptor');
      return read(string(r.file),string(r.sha256));
    }));
    documents.forEach((raw,i) => {
      const doc=object(raw,'document');const descriptor=resources[i];check(descriptor !== undefined,'Missing descriptor');
      exact(doc,['schemaVersion','catalogId','family','records']);
      check(doc.schemaVersion===1 && doc.catalogId===CATALOG_ID && doc.family===descriptor.family,'Invalid effect resource header');
      const name=string(doc.family); const rows=array(doc.records);check(rows.length===descriptor.count,'Truncated resource');
      const target=families[name];check(target!==undefined,'Unknown family');
      for (const row of rows) { validate(row,schemas[name],name); target.push(object(row,name)); }
    });
    /** @type {Record<string,Map<string,ObjectValue>>} */
    const maps = {};
    for (const name of names) {
      const rows=families[name];check(rows!==undefined && rows.length===counts[name],`${name}: coverage`);
      check(rows.map(r => r.id).join('|')===array(keys[name]).join('|'),`${name}: exact ordered keys`);
      maps[name]=new Map(rows.map(r => [string(r.id),r]));check(maps[name]?.size===rows.length,'Duplicate identity');
    }
    /** @param {string} family @param {unknown} id */
    const ref = (family,id) => check(typeof id==='string' && maps[family]?.has(id)===true,`Unknown ${family} reference: ${String(id)}`);
    for (const row of families.actions ?? []) {
      if (row.moveId !== null) ref('moves',row.moveId);
      array(row.familyIds).forEach(id => ref('families',id));
      const target=object(row.target,'target');ref('geometries',target.geometryRef);ref('categories',target.relationRef);
    }
    for (const row of families.moves ?? []) {
      ref('actions',row.actionId);check(dependencies.isMoveId(string(row.id)),`External move ${String(row.id)}`);
      check(maps.actions?.get(string(row.actionId))?.moveId===row.id,'Bidirectional move join');
    }
    for (const row of families.items ?? []) {
      check(dependencies.isItemId(string(row.id)),`External item ${String(row.id)}`);
      if (row.actionId !== null) ref('actions',row.actionId);
      for (const id of Object.values(object(row.failureConsumption,'consumption'))) if(id!=='action-specific;see-use-effects-and-special-item-contracts') check(maps.rules?.has(string(id))===true || maps.contracts?.has(string(id))===true,'Unknown consumption contract');
      for (const raw of array(object(row.availabilityEvidence,'availability').randomPoolReferences)) {
        const pool=string(object(raw,'pool').pool);ref('availability-routes',`pool-${String(Number(pool.replace('items_found_out',''))).padStart(3,'0')}`);
      }
    }
    for (const row of families.statuses ?? []) if(row.timerRef!==null) ref('timers',row.timerRef);
    for (const row of families.treasures ?? []) ref('items',row.itemId);
    for (const row of families['species-parameters'] ?? []) if(row.speciesId!==null) check(dependencies.isSpeciesForm(string(row.speciesId),row.formId===null?null:string(row.formId)),`External species/form ${String(row.id)}`);
    /** @type {Record<string,string>} */
    const referenceFamilies = {geometryRef:'geometries',relationRef:'categories',timerRef:'timers',timerSemanticsRef:'rules',applicationGuardRef:'guards',guardRef:'guards',reactionGuardRef:'guards',lookupRef:'contracts',duplicatePolicyRef:'rules',duplicateRouteRef:'rules',tableRef:'terrain',parameterRef:'parameters'};
    /** @param {unknown} value */
    const inspectReferences = value => {
      if (Array.isArray(value)) { value.forEach(inspectReferences); return; }
      if (value === null || typeof value !== 'object') return;
      const record = object(value,'reference record');
      if(record.op === 'revival-state-contract') { check(typeof record.contractRef==='string' && !Object.hasOwn(record,'ref'),'Revival operation requires canonical contractRef');ref('contracts',record.contractRef); }
      check(!(typeof record.ref==='string' || typeof record.table==='string'),'Unnormalized relationship field');
      if(record.op === 'apply-status') check(maps.statuses?.has(string(record.status))===true || maps['auxiliary-statuses']?.has(string(record.status))===true,'Unknown applied status');
      for (const [key,child] of Object.entries(value)) {
        const family = referenceFamilies[key];
        if (typeof child === 'string' && family !== undefined) ref(family,child);
        if (['contractRef','stateContractRef','callingContractRef'].includes(key) && child !== null) check(maps.contracts?.has(string(child))===true || maps.rules?.has(string(child))===true, `Unknown contract ${String(child)}`);
        inspectReferences(child);
      }
    };
    Object.values(families).forEach(inspectReferences);
    for (const rows of Object.values(families)) rows.forEach(freeze);
    /** @param {string} family @param {string} id */
    const get = (family,id) => {
      active(); const row=maps[family]?.get(id);if(!row) throw new RangeError(`Unknown ${family} identity: ${id}`); return row;
    };
    const moveViews = new Map((families.moves ?? []).map(move => [string(move.id), freeze({...get('actions',string(move.actionId)),id:move.id,actionId:move.actionId})]));
    /** @param {number} id @param {number} maximum @param {string} prefix */
    const internalKey=(id,maximum,prefix) => { check(Number.isSafeInteger(id)&&id>=0&&id<=maximum,'Internal identity range');return `${prefix}-${String(id).padStart(3,'0')}`; };
    active();
    return Object.freeze({
      capabilities: freeze({factualCatalog:true,qualifiedOriginalRules:true,blueInstructionParity:false,domainHandlersImplemented:false}),
      ids: freeze(Object.fromEntries(names.map(n => [n,array(keys[n])]))),
      /** @param {string} id */
      getMove(id) { active();const move=moveViews.get(id);if(!move) throw new RangeError(`Unknown move identity: ${id}`);return /** @type {DeepReadonly<import('./effects-types.js').Move>} */ (/** @type {unknown} */ (move)); },
      /** @param {number} id */
      getAction(id) { return /** @type {DeepReadonly<import('./effects-types.js').Action>} */ (/** @type {unknown} */ (get('actions',internalKey(id,412,'action')))); },
      /** @param {string} id */
      getItem(id) { return /** @type {DeepReadonly<import('./effects-types.js').Item>} */ (/** @type {unknown} */ (get('items',id))); },
      /** @param {number} id */
      getItemByInternalId(id) { check(Number.isSafeInteger(id)&&id>=0&&id<240,'Item identity range');const row=families.items?.[id];check(row!==undefined,'Missing item');return /** @type {DeepReadonly<import('./effects-types.js').Item>} */ (/** @type {unknown} */ (get('items',string(row.id)))); },
      /** @param {string} id */
      getStatus(id) { return /** @type {DeepReadonly<import('./effects-types.js').Status>} */ (/** @type {unknown} */ (get('statuses',id))); },
      /** @param {string} id */
      getTimer(id) { return /** @type {DeepReadonly<import('./effects-types.js').Timer>} */ (/** @type {unknown} */ (get('timers',id))); },
      /** @param {string} id */
      getFamily(id) { return /** @type {DeepReadonly<import('./effects-types.js').Family>} */ (/** @type {unknown} */ (get('families',id))); },
      /** @param {string} id */
      getGeometry(id) { return /** @type {DeepReadonly<import('./effects-types.js').Geometry>} */ (/** @type {unknown} */ (get('geometries',id))); },
      /** @param {string} id */
      getCategory(id) { return /** @type {DeepReadonly<import('./effects-types.js').Category>} */ (/** @type {unknown} */ (get('categories',id))); },
      /** @param {string} id */
      getRule(id) { return /** @type {DeepReadonly<import('./effects-types.js').Rule>} */ (/** @type {unknown} */ (get('rules',id))); },
      /** @param {string} id */
      getGuard(id) { return /** @type {DeepReadonly<import('./effects-types.js').Guard>} */ (/** @type {unknown} */ (get('guards',id))); },
      /** @param {string} id */
      getContract(id) { return /** @type {DeepReadonly<import('./effects-types.js').Contract>} */ (/** @type {unknown} */ (get('contracts',id))); },
      /** @param {string} id */
      getTerrain(id) { return /** @type {DeepReadonly<import('./effects-types.js').Terrain>} */ (/** @type {unknown} */ (get('terrain',id))); },
      /** @param {string} id */
      getSpeciesParameters(id) { return /** @type {DeepReadonly<import('./effects-types.js').SpeciesParameters>} */ (/** @type {unknown} */ (get('species-parameters',id))); },
      /** @param {string} id */
      getAuxiliaryEffect(id) { return /** @type {DeepReadonly<import('./effects-types.js').AuxiliaryEffect>} */ (/** @type {unknown} */ (get('auxiliary-effects',id))); },
      /** @param {string} id */
      getConflict(id) { return /** @type {DeepReadonly<import('./effects-types.js').Conflict>} */ (/** @type {unknown} */ (get('conflicts',id))); },
      /** @param {string} id */
      getAvailabilityRoute(id) { return /** @type {DeepReadonly<import('./effects-types.js').AvailabilityRoute>} */ (/** @type {unknown} */ (get('availability-routes',id))); },
      /** @param {string} id */
      getTreasure(id) { return /** @type {DeepReadonly<import('./effects-types.js').Treasure>} */ (/** @type {unknown} */ (get('treasures',id))); },
      /** @param {string} id */
      getParameter(id) { return /** @type {DeepReadonly<import('./effects-types.js').Parameter>} */ (/** @type {unknown} */ (get('parameters',id))); },
      /** @param {string} id */
      getAuxiliaryStatus(id) { return /** @type {DeepReadonly<import('./effects-types.js').AuxiliaryStatus>} */ (/** @type {unknown} */ (get('auxiliary-statuses',id))); },
      /** @param {string} family @param {string} id */
      getFact(family,id) { return freeze(get(family,id)); },
      dispose,
    });
  } catch(error) { dispose(); throw error; }
}
