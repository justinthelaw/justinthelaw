/**
 * Original-Blue factual dungeon catalog; no generation/spawning or campaign selection.
 * @template T
 * @typedef {T extends (infer U)[] ? ReadonlyArray<DeepReadonly<U>> : T extends object ? {readonly [K in keyof T]: DeepReadonly<T[K]>} : T} DeepReadonly
 */
/** @typedef {{id: string, sourceIndex: number, sourceSymbol: string}} ItemCategory */
/** @typedef {{id: string, qualification: string}} SourceConfidence */
/** @typedef {{campaignStatus: string, canonicalFloorCount: number, confidenceId: string, id: string, kind: string, name: string, populationRoute: string, sceneIds: Array<string>, sectionIds: Array<string>}} DungeonIdentity */
/** @typedef {{confidenceId: string, id: string, publishedTotal: number, rows: Array<{applicabilityPredicate: string, blueGate: string, blueVersionExclusive: boolean, cumulativeWeight: number, selectionThreshold: number, effectiveDrawCount: number, entryRole: string, formId: (null|string), identityClass: string, level: number, order: number, publishedWeight: number, sourceMonsterIndex: number, speciesId: (null|string), speciesSymbol: string}>, sourceIndices: Array<number>, sourceSymbols: Array<string>}} EncounterPool */
/** @typedef {{campaignPredicateId: null, classification: string, confidenceId: string, cumulativeOrdinal: (number|null), display: null, dungeonId: null, encounterPoolId: string, fixedRoomId: string, generationId: string, id: string, itemPoolIds: {buried: string, floor: string, monsterHouse: string, shop: string}, localFloor: number, populationRoute: string, restrictionId: string, sectionId: null, sourceDungeonIndex: number, sourceFloorKey: string, sourceLocalFloor: number, sourceRestrictionIndex: number, trapPoolId: string, variantId: string}} ExcludedFloor */
/** @typedef {{classification: string, confidenceId: string, deferredRoomReveal: boolean, geometryStatus: string, headerFlags: number, height: number, id: string, sourceFloorReferences: Array<string>, sourceIndex: number, sourceSymbol: (null|string), width: number}} FixedRoom */
/** @typedef {{campaignPredicateId: null, classification: string, confidenceId: string, cumulativeOrdinal: number, display: {direction: string, number: number, prefix: string, suffix: string}, dungeonId: string, encounterPoolId: string, fixedRoomId: string, generationId: string, id: string, itemPoolIds: {buried: string, floor: string, monsterHouse: string, shop: string}, localFloor: number, populationRoute: string, restrictionId: string, sectionId: string, sourceDungeonIndex: number, sourceFloorKey: string, sourceLocalFloor: number, sourceRestrictionIndex: number, trapPoolId: string, variantId: string}} DungeonFloor */
/** @typedef {{confidenceId: string, id: string, layoutFamily: string, parameters: {allowDeadEnds: number, bgMusic: number, buriedItemDensity: number, enemyDensity: number, fixedRoomNumber: number, floorConnectivity: number, itemDensity: number, itemStickyChance: number, itemlessMonsterHouseChance: number, kecleonShopChance: number, kecleonShopLayout: number, layout: number, mazeRoomChance: number, moneyUpperBound: number, monsterHouseChance: number, numExtraHallways: number, roomDensity: number, roomFlags: number, secondaryStructuresBudget: number, standaloneLakeDensity: number, storedFloorNumber: number, tileset: number, trapDensity: number, unused0E: number, unused1A: number, unused1B: number, visibilityRange: number, weather: number}, roomFlags: {imperfections: boolean, secondaryTerrain: boolean}, sourceIndices: Array<number>}} GenerationProfile */
/** @typedef {{effectStatus: string, id: string, sourceIndex: number, sourceSymbol: string}} ItemIdentity */
/** @typedef {{categories: Array<{categoryId: string, cumulativeWeight: number, selectionThreshold: number, effectiveDrawCount: number, items: Array<{cumulativeWeight: number, selectionThreshold: number, effectiveDrawCount: number, itemId: string, order: number, publishedWeight: number}>, order: number, publishedTotal: number, publishedWeight: number}>, confidenceId: string, id: string, publishedTotal: number, sourceIndices: Array<number>}} ItemPool */
/** @typedef {{confidenceId: string, converterDefaultedFields: Array<string>, fields: {HMMask: number, enemiesEvolveWhenKOed: boolean, enterWithoutGameSave: boolean, hasCheckpoint: boolean, keepMoney: boolean, leaderCanSwitch: boolean, levelResetTo1: boolean, maxItemsAllowed: number, maxPartyMembers: number, randomMovementChance: number, recruitingEnabled: boolean, rescuesAllowed: number, stairDirectionUp: boolean, turnLimit: number}, id: string, sourceDungeonIndex: number, sourceSymbol: string}} DungeonRestrictions */
/** @typedef {{campaignPredicateId: null, classification: string, confidenceId: string, cumulativeOrdinal: null, display: null, dungeonId: string, encounterPoolId: string, fixedRoomId: string, generationId: string, id: string, itemPoolIds: {buried: string, floor: string, monsterHouse: string, shop: string}, localFloor: null, populationRoute: string, restrictionId: string, sectionId: string, sourceDungeonIndex: number, sourceFloorKey: string, sourceLocalFloor: number, sourceRestrictionIndex: number, trapPoolId: string, variantId: string}} DungeonScene */
/** @typedef {{dungeonId: string, id: string, variants: Array<{campaignPredicateId: null, floorIds: Array<string>, id: string}>}} DungeonSection */
/** @typedef {{id: string, sourceName: string, sourceOrder: number}} TrapIdentity */
/** @typedef {{confidenceId: string, id: string, publishedTotal: number, rows: Array<{cumulativeWeight: number, selectionThreshold: number, effectiveDrawCount: number, order: number, publishedWeight: number, trapId: string}>, sourceIndices: Array<number>}} TrapPool */

/** @typedef {{[key: string]: unknown}} ObjectValue */
/** @typedef {{isSpeciesForm: (speciesId: string, formId: string|null) => boolean, isItemId: (itemId: string) => boolean, fetchResource?: typeof fetch}} CatalogDependencies */

const CATALOG_ID = 'original-blue-dungeon-facts';
const EXPECTED_COUNTS = Object.freeze({ generation: 1764, encounters: 839, items: 133, traps: 142, 'item-identities': 202, categories: 10, 'trap-identities': 20, restrictions: 98, 'fixed-rooms': 140, floors: 1497, scenes: 1, 'excluded-floors': 269, dungeons: 67, sections: 73, confidence: 9 });
const RESOURCE_FILES = Object.freeze(['categories-01.json', 'confidence-01.json', 'dungeons-01.json', 'encounters-01.json', 'encounters-02.json', 'encounters-03.json', 'encounters-04.json', 'excluded-floors-01.json', 'fixed-rooms-01.json', 'floors-01.json', 'floors-02.json', 'floors-03.json', 'generation-01.json', 'generation-02.json', 'generation-03.json', 'item-identities-01.json', 'items-01.json', 'items-02.json', 'restrictions-01.json', 'scenes-01.json', 'sections-01.json', 'trap-identities-01.json', 'traps-01.json']);

/** @param {unknown} value @param {string} label @returns {ObjectValue} */
function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label}: expected object`);
  return /** @type {ObjectValue} */ (value);
}
/** @param {unknown} value @param {string} label @returns {unknown[]} */
function array(value, label) {
  if (!Array.isArray(value)) throw new TypeError(`${label}: expected array`);
  return value;
}
/** @param {unknown} value @param {string} label @returns {string} */
function string(value, label) {
  if (typeof value !== 'string') throw new TypeError(`${label}: expected string`);
  return value;
}
/** @param {boolean} condition @param {string} message @returns {asserts condition} */
function requireCondition(condition, message) { if (!condition) throw new TypeError(message); }

/** Validate the intentionally small, closed schema dialect shipped locally.
 * @param {unknown} value @param {unknown} rawSchema @param {string} label
 */
function validate(value, rawSchema, label) {
  const schema = object(rawSchema, `${label} schema`);
  if (schema.anyOf) {
    const options = array(schema.anyOf, 'schema alternatives');
    for (const option of options) {
      try { validate(value, option, label); return; } catch { /* Try the next declared type. */ }
    }
    throw new TypeError(`${label}: no permitted type`);
  }
  if (schema.enum) requireCondition(array(schema.enum, 'schema enum').includes(value), `${label}: unknown value`);
  if (schema.type === 'null') requireCondition(value === null, `${label}: expected null`);
  else if (schema.type === 'boolean') requireCondition(typeof value === 'boolean', `${label}: expected boolean`);
  else if (schema.type === 'integer') {
    requireCondition(typeof value === 'number' && Number.isSafeInteger(value), `${label}: expected integer`);
    requireCondition(value >= Number(schema.minimum) && value <= Number(schema.maximum), `${label}: outside numeric bounds`);
  } else if (schema.type === 'string') string(value, label);
  else if (schema.type === 'array') {
    const values = array(value, label);
    requireCondition(values.length >= Number(schema.minItems) && values.length <= Number(schema.maxItems), `${label}: array length`);
    values.forEach((entry, i) => validate(entry, schema.items, `${label}[${i}]`));
  } else if (schema.type === 'object') {
    const record = object(value, label);
    const properties = object(schema.properties, 'schema properties');
    const required = array(schema.required, 'schema required');
    requireCondition(Object.keys(record).length === required.length && required.every(key => Object.hasOwn(record, string(key, 'property'))), `${label}: exact properties required`);
    for (const [key, nested] of Object.entries(properties)) validate(record[key], nested, `${label}.${key}`);
  } else requireCondition(Object.keys(schema).length === 0, `${label}: unsupported schema`);
}

/** @template T @param {T} value @returns {DeepReadonly<T>} */
function freeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return /** @type {DeepReadonly<T>} */ (value);
}

/** @template {{id: string}} T @param {T[]} values */
function lookup(values) {
  const index = new Map(values.map(value => [value.id, freeze(value)]));
  requireCondition(index.size === values.length, 'Duplicate catalog identity');
  return /** @param {string} id */ (id) => {
    const value = index.get(id);
    if (!value) throw new RangeError(`Unknown catalog identity: ${id}`);
    return value;
  };
}

/** @param {unknown[]} rows @param {unknown} total @param {string} label */
function validateWeights(rows, total, label) {
  let cumulative = 0;
  let end = 0;
  rows.forEach((raw, order) => {
    const row = object(raw, label);
    const weight = Number(row.publishedWeight);
    cumulative += weight;
    const next = weight ? Math.min(10000, cumulative + 1) : end;
    requireCondition(row.order === order && row.cumulativeWeight === cumulative && row.selectionThreshold === (weight ? cumulative : 0) && row.effectiveDrawCount === next - end, `${label}: cumulative/draw weights`);
    end = next;
  });
  requireCondition(cumulative === total && (total === 0 || total === 10000) && end === (total ? 10000 : 0), `${label}: distribution denominator`);
}

/**
 * Load exactly the local resources beside this module. The two membership callbacks
 * are required: they attest species/form and external item identity, not effects.
 * No campaign variant is selected and no random candidate is drawn by this API.
 * @param {CatalogDependencies} dependencies
 */
export async function loadDungeonCatalog(dependencies) {
  requireCondition(typeof dependencies?.isSpeciesForm === 'function' && typeof dependencies?.isItemId === 'function', 'Species/form and item membership validators are required');
  const fetchResource = dependencies.fetchResource ?? fetch;
  /** @param {string} filename @returns {Promise<unknown>} */
  const read = async filename => {
    const response = await fetchResource(new URL(`./dungeons/${filename}`, import.meta.url));
    if (!response.ok) throw new Error(`Cannot load dungeon resource ${filename}: ${response.status}`);
    return response.json();
  };
  const [rawIndex, rawSchemas] = await Promise.all([read('index.json'), read('schemas.json')]);
  const manifest = object(rawIndex, 'dungeon index');
  const schemaDocument = object(rawSchemas, 'dungeon schemas');
  requireCondition(manifest.schemaVersion === 1 && manifest.catalogId === CATALOG_ID && schemaDocument.schemaVersion === 1, 'Unsupported dungeon catalog header');
  const resources = array(manifest.resources, 'resource list').map(r => object(r, 'resource'));
  requireCondition(resources.map(r => r.file).join('|') === RESOURCE_FILES.join('|'), 'Exact local dungeon resource list required');
  const schemas = object(schemaDocument.families, 'family schemas');
  const expectedNames = Object.keys(EXPECTED_COUNTS).sort();
  requireCondition(Object.keys(schemas).sort().join('|') === expectedNames.join('|'), 'Exact dungeon schema families required');
  /** @type {Record<string, ObjectValue[]>} */
  const families = Object.fromEntries(expectedNames.map(name => [name, []]));
  const documents = await Promise.all(RESOURCE_FILES.map(read));
  documents.forEach((raw, i) => {
    const doc = object(raw, 'resource document');
    const resource = resources[i];
    requireCondition(resource !== undefined, 'Missing resource descriptor');
    const family = string(doc.family, 'family');
    requireCondition(doc.schemaVersion === 1 && doc.catalogId === CATALOG_ID && family === resource.family && expectedNames.includes(family), 'Invalid dungeon resource header');
    const rows = array(doc.records, `${family} records`);
    requireCondition(rows.length === resource.count, `${family}: truncated resource`);
    const target = families[family];
    requireCondition(target !== undefined, `Unknown family ${family}`);
    rows.forEach(rawRow => {
      validate(rawRow, schemas[family], family);
      target.push(object(rawRow, family));
    });
  });
  /** @type {Record<string, Set<string>>} */
  const ids = {};
  for (const [family, expected] of Object.entries(EXPECTED_COUNTS)) {
    const rows = families[family];
    requireCondition(rows !== undefined && rows.length === expected, `${family}: incomplete coverage`);
    ids[family] = new Set(rows.map(r => string(r.id, 'id')));
    requireCondition(ids[family]?.size === expected, `${family}: duplicate IDs`);
  }
  /** @param {string} family @param {unknown} id */
  const reference = (family, id) => requireCondition(typeof id === 'string' && ids[family]?.has(id) === true, `Unknown ${family} reference: ${String(id)}`);
  for (const rows of Object.values(families)) for (const row of rows) if (row.confidenceId) reference('confidence', row.confidenceId);
  for (const family of ['floors', 'scenes', 'excluded-floors']) for (const row of families[family] ?? []) {
    reference('generation', row.generationId); reference('encounters', row.encounterPoolId);
    reference('traps', row.trapPoolId); reference('fixed-rooms', row.fixedRoomId); reference('restrictions', row.restrictionId);
    for (const id of Object.values(object(row.itemPoolIds, 'item contexts'))) reference('items', id);
    if (row.dungeonId !== null) reference('dungeons', row.dungeonId);
    if (row.sectionId !== null) reference('sections', row.sectionId);
  }
  for (const row of families.dungeons ?? []) {
    for (const id of array(row.sectionIds, 'sections')) reference('sections', id);
    for (const id of array(row.sceneIds, 'scenes')) reference('scenes', id);
  }
  for (const row of families.sections ?? []) {
    reference('dungeons', row.dungeonId);
    for (const variant of array(row.variants, 'variants')) for (const id of array(object(variant, 'variant').floorIds, 'variant floors')) reference('floors', id);
  }
  for (const pool of families.encounters ?? []) {
    const rows = array(pool.rows, 'encounter rows'); validateWeights(rows, pool.publishedTotal, String(pool.id));
    for (const raw of rows) {
      const r = object(raw, 'encounter');
      if (r.identityClass === 'internal-decoy') requireCondition(r.speciesId === null && r.formId === null && r.publishedWeight === 0 && r.speciesSymbol === 'DECOY', 'Invalid Decoy identity');
      else requireCondition(dependencies.isSpeciesForm(string(r.speciesId, 'speciesId'), r.formId === null ? null : string(r.formId, 'formId')), `Unknown species/form ${String(r.speciesId)}/${String(r.formId)}`);
      requireCondition((r.publishedWeight === 0) === (r.entryRole === 'nonrandom-level-lookup'), 'Encounter lookup role mismatch');
    }
  }
  for (const pool of families.items ?? []) {
    const categories = array(pool.categories, 'item categories'); validateWeights(categories, pool.publishedTotal, String(pool.id));
    for (const raw of categories) {
      const category = object(raw, 'category'); reference('categories', category.categoryId);
      const items = array(category.items, 'items'); validateWeights(items, category.publishedTotal, String(category.categoryId));
      for (const item of items) {
        const id = string(object(item, 'item').itemId, 'item id'); reference('item-identities', id);
        requireCondition(dependencies.isItemId(id), `Unknown external item reference ${id}`);
      }
    }
  }
  for (const pool of families.traps ?? []) {
    const rows = array(pool.rows, 'traps'); validateWeights(rows, pool.publishedTotal, String(pool.id));
    for (const raw of rows) reference('trap-identities', object(raw, 'trap').trapId);
  }
  // The schema validated every nested field before these typed, immutable views.
  const getDungeon = lookup(/** @type {DungeonIdentity[]} */ (/** @type {unknown} */ (families['dungeons'])));
  const getSection = lookup(/** @type {DungeonSection[]} */ (/** @type {unknown} */ (families['sections'])));
  const getFloorById = lookup(/** @type {DungeonFloor[]} */ (/** @type {unknown} */ (families['floors'])));
  const getScene = lookup(/** @type {DungeonScene[]} */ (/** @type {unknown} */ (families['scenes'])));
  const getGeneration = lookup(/** @type {GenerationProfile[]} */ (/** @type {unknown} */ (families['generation'])));
  const getEncounterPool = lookup(/** @type {EncounterPool[]} */ (/** @type {unknown} */ (families['encounters'])));
  const getItemPool = lookup(/** @type {ItemPool[]} */ (/** @type {unknown} */ (families['items'])));
  const getTrapPool = lookup(/** @type {TrapPool[]} */ (/** @type {unknown} */ (families['traps'])));
  const getFixedRoom = lookup(/** @type {FixedRoom[]} */ (/** @type {unknown} */ (families['fixed-rooms'])));
  const getRestrictions = lookup(/** @type {DungeonRestrictions[]} */ (/** @type {unknown} */ (families['restrictions'])));
  const getItemIdentity = lookup(/** @type {ItemIdentity[]} */ (/** @type {unknown} */ (families['item-identities'])));
  const getConfidence = lookup(/** @type {SourceConfidence[]} */ (/** @type {unknown} */ (families['confidence'])));
  // Every floor-like profile shares these joins, including unnumbered scenes and
  // excluded source records. Numbering/display validation applies only to floors.
  const profiles = /** @type {Array<DungeonFloor|DungeonScene|ExcludedFloor>} */ (/** @type {unknown} */ ([...(families.floors ?? []), ...(families.scenes ?? []), ...(families['excluded-floors'] ?? [])]));
  for (const profile of profiles) {
    const generation = getGeneration(profile.generationId);
    const fixed = getFixedRoom(profile.fixedRoomId);
    const rules = getRestrictions(profile.restrictionId);
    requireCondition(fixed.sourceIndex === generation.parameters.fixedRoomNumber && rules.sourceDungeonIndex === profile.sourceRestrictionIndex, `${profile.id}: generation/rule join`);
    if (profile.sectionId !== null) requireCondition(getSection(profile.sectionId).dungeonId === profile.dungeonId, `${profile.id}: source section parent`);
    if (profile.sourceFloorKey.startsWith('DojoRegistration:')) requireCondition(profile.sourceRestrictionIndex === 75 + Math.floor((profile.sourceLocalFloor - 1) / 3), `${profile.id}: maze rule slot`);
    if (profile.display !== null) requireCondition(profile.display.number === profile.localFloor && profile.display.direction === (rules.fields.stairDirectionUp ? 'ascent' : 'descent'), `${profile.id}: displayed floor`);
  }
  const sectionFloorIds = new Set();
  for (const raw of families.sections ?? []) {
    const section = getSection(string(raw.id, 'section id'));
    for (const variant of section.variants) for (const [i, id] of variant.floorIds.entries()) {
      const floor = getFloorById(id);
      requireCondition(!sectionFloorIds.has(id) && floor.dungeonId === section.dungeonId && floor.sectionId === section.id && floor.variantId === variant.id && floor.localFloor === i + 1, `${section.id}: section/variant coverage`);
      sectionFloorIds.add(id);
    }
  }
  requireCondition(sectionFloorIds.size === EXPECTED_COUNTS.floors, 'Incomplete section floor coverage');
  const ownedSectionIds = new Set();
  const ownedSceneIds = new Set();
  for (const raw of families.dungeons ?? []) {
    const dungeon = getDungeon(string(raw.id, 'dungeon id'));
    const primary = (families.floors ?? []).filter(f => f.dungeonId === dungeon.id && f.variantId === 'source-primary').sort((a, b) => Number(a.cumulativeOrdinal) - Number(b.cumulativeOrdinal));
    requireCondition(primary.length === dungeon.canonicalFloorCount && primary.every((f, i) => f.cumulativeOrdinal === i + 1), `${dungeon.id}: canonical floor ordinals`);
    for (const id of dungeon.sectionIds) {
      requireCondition(getSection(id).dungeonId === dungeon.id && !ownedSectionIds.has(id), `${dungeon.id}: unique section parent`);
      ownedSectionIds.add(id);
    }
    for (const id of dungeon.sceneIds) {
      requireCondition(getScene(id).dungeonId === dungeon.id && !ownedSceneIds.has(id), `${dungeon.id}: unique scene parent`);
      ownedSceneIds.add(id);
    }
  }
  requireCondition(ownedSectionIds.size === EXPECTED_COUNTS.sections && ownedSceneIds.size === EXPECTED_COUNTS.scenes, 'Incomplete dungeon child ownership');
  return Object.freeze({
    getDungeon,
    getSection,
    getFloorById,
    getScene,
    getGeneration,
    getEncounterPool,
    getItemPool,
    getTrapPool,
    getFixedRoom,
    getRestrictions,
    getItemIdentity,
    getConfidence,
    dungeonIds: Object.freeze((families.dungeons ?? []).map(r => string(r.id, 'id'))),
    coverage: freeze(structuredClone(object(manifest.coverage, 'coverage'))),
    /** Explicit variant is required; campaign consumers own the predicate. */
    getFloor(/** @type {string} */ sectionId, /** @type {number} */ localFloor, /** @type {string} */ variantId) {
      if (!Number.isSafeInteger(localFloor) || localFloor < 1) throw new RangeError('Floor number must be a positive integer');
      const section = getSection(sectionId);
      const variant = section.variants.find(v => v.id === variantId);
      if (!variant) throw new RangeError(`Unknown floor variant ${variantId}`);
      const floorId = variant.floorIds[localFloor - 1];
      if (!floorId) throw new RangeError(`Floor outside section ${sectionId}: ${localFloor}`);
      return getFloorById(floorId);
    },
    getDistribution(/** @type {'encounters'|'items'|'traps'} */ kind, /** @type {string} */ id) {
      if (kind === 'encounters') return getEncounterPool(id);
      if (kind === 'items') return getItemPool(id);
      if (kind === 'traps') return getTrapPool(id);
      throw new RangeError(`Unknown distribution family: ${kind}`);
    },
  });
}
