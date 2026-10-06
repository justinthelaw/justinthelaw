/**
 * Immutable sourced onboarding facts. This module does not score a quiz, draw
 * random numbers, create a campaign, grant items or advance an opening scene.
 * @typedef {Readonly<Record<string,number>>} NatureScores
 * @typedef {Readonly<{index:number, originalAnswerId:string, originalMenuValue:number, scores:NatureScores, followUp:string|null, optionId:string, text:string}>} QuizOption
 * @typedef {Readonly<{sourceId:string,line:number}>} RedLocator
 * @typedef {Readonly<{id:string, originalIndex:number, sourceSymbol:string, originalQuestionId:string, categoryId:string, selectable:boolean, options:readonly QuizOption[], prompt:string, redLocator:RedLocator, sharedLocator:Readonly<{sourceId:string,renderedLine:number}>, factsSha256:string, evidenceId:string, textProvenanceId:string}>} QuizQuestion
 * @typedef {Readonly<{id:string, originalCategoryIndex:number, selectableQuestionIds:readonly string[], questionCount:number, firstDrawIdealWeightNumerator:number, firstDrawIdealWeightDenominator:number, firstDrawUint16Weight:number, uint16Denominator:number}>} QuizCategory
 * @typedef {Readonly<{sourceId:string,functionName:string,line:number}>} FunctionLocator
 * @typedef {Readonly<{kind:string,selectableIndices:readonly number[],mainQuestionCount:number,maximumFollowUps:number,rejectUsedCategory:boolean,markEntireCategoryBeforePresentation:boolean,uniformCategoryDraw:boolean,rejectionConsumesMainSlot:boolean,followUpConsumesMainSlot:boolean,followUpConsumesCategory:boolean,followUpQuestionId:string,followUpTriggerOptionId:string,followUpSourceMenuValue:number,applyTriggerScores:boolean,genderAfterMainQuestions:boolean,evidenceId:string}>} SamplingFacts
 * @typedef {Readonly<{nativeDrawSourceSymbol:string,nativeInputMask:number,useLowBits:boolean,inputBits:number,inputMinimum:number,inputMaximum:number,denominator:number,operation:string,questionMaximumExclusive:number,tieMaximumExclusive:number,questionBucketSizes:readonly number[],tieBucketSizes:readonly number[],browserStreamCanonicalId:null,nativeSequenceParityClaimed:false,evidenceId:string}>} MapperFacts
 * @typedef {Readonly<{kind:string,randomStart:boolean,visitCountAfterStart:number,ascendingOrder:boolean,wrapModulus:number,replaceOnlyIfStrictlyGreater:boolean,uniformAmongMaxima:boolean,exampleTiedIds:readonly string[],exampleIdealWeights:readonly number[],exampleIdealDenominator:number,exampleUint16Weights:readonly number[],exampleUint16Denominator:number,evidenceId:string}>} TieFacts
 * @typedef {Readonly<{schemaVersion:number,catalogId:string,edition:string,kind:string,natureOrder:readonly string[],initialScores:NatureScores,categories:readonly QuizCategory[],sampling:SamplingFacts,integerMapper:MapperFacts,tieBreak:TieFacts,sourceLocators:readonly FunctionLocator[]}>} QuizAlgorithm
 * @typedef {Readonly<{natureId:string,description:string,maleSpeciesId:string,femaleSpeciesId:string,formId:null,evidenceId:string,textProvenanceId:string}>} NatureResult
 * @typedef {Readonly<{natureId:string,column:'male'|'female',speciesId:string,formId:null}>} GenderOutcome
 * @typedef {Readonly<{prompt:string,labels:Readonly<{male:string,female:string}>,sourceValues:Readonly<{male:number,female:number}>,changesScores:false,changesResultColumn:true,directSpeciesOverride:false,evidenceId:string}>} GenderFacts
 * @typedef {Readonly<{heroSpeciesId:string,partnerSpeciesId:string,heroFormId:null,partnerFormId:null,ownedFriendAreaIds:readonly string[]}>} StarterPair
 * @typedef {Readonly<{hp:number,attack:number,specialAttack:number,defense:number,specialDefense:number}>} StarterStats
 * @typedef {Readonly<{slot:number,moveId:string,originalMoveId:number,learnedAtLevel:number,storedPP:number}>} RosterMove
 * @typedef {Readonly<{slot:number,moveId:string,originalMoveId:number,learnedAtLevel:number,currentPP:number,maximumPP:number,enabledForAI:boolean,linkedToPrevious:boolean,setForShortcut:boolean,ginsengBoost:number}>} PlayableMove
 * @typedef {Readonly<{speciesId:string,profileId:string,formId:null,originalInternalId:number,friendAreaId:string,typeIds:readonly number[],catalogResources:Readonly<{levelResourceId:string,learnsetResourceId:string}>,rosterCreation:Readonly<{level:number,cumulativeExp:number,stats:StarterStats,moves:readonly RosterMove[]}>,firstPlayable:Readonly<{level:number,cumulativeExp:number,stats:StarterStats,currentHP:number,emptyMoveSlots:number,moves:readonly PlayableMove[]}>,evidence:Readonly<Record<string,string>>}>} StartingProfile
 * @typedef {Readonly<{freshEntryOnly:boolean,initialConsumedFlag:boolean,setConsumedBeforeDungeonCheck:boolean,dungeonId:string,levelsApplied:readonly number[],repeatOnRetry:boolean,repeatOnResume:boolean,applyToAllExistingOnTeamMembers:boolean,hpCap:number,otherStatCap:number,sourcePredicate:string,canonicalGuardId:null,evidenceId:string}>} BoostFacts
 * @typedef {Readonly<{iq:number,tacticSourceSymbol:string,canonicalTacticId:null,enabledIqSourceSymbols:readonly string[],canonicalEnabledIqIds:null,selfCurerEnabled:boolean,exists:boolean,onTeam:boolean,speciesSeen:boolean,heroIsLeader:boolean,partnerIsLeader:boolean,heldItemId:null,belly:number,maximumBelly:number,heroOriginSourceSymbol:string,partnerOriginSourceSymbol:string,canonicalHeroOriginId:null,canonicalPartnerOriginId:null,evidenceId:string}>} MemberFacts
 * @typedef {Readonly<{maximumSlots:number,initialEntriesAtLevel:number,appendLevels:readonly number[],preserveSourceOrder:boolean,appendToFirstFreeSlot:boolean,replaceWhenFull:boolean,rosterStoredPP:number,dungeonFullPP:boolean,dungeonFullHP:boolean,ginsengBoost:number,linkedToPrevious:boolean,setForShortcut:boolean,enabledForAI:boolean,evidenceId:string}>} MoveInitializationFacts
 * @typedef {Readonly<{carriedItems:readonly never[],storedItems:readonly never[],carriedMoney:number,bankSavings:number,friendAreaOwnershipCost:number,friendAreasFromSelectedPairOnly:boolean,friendAreaServiceAvailable:boolean,inventoryMenuAvailable:boolean,inventoryUnlockSourcePredicate:string,canonicalInventoryUnlockId:null,evidenceId:string}>} EconomyFacts
 * @typedef {Readonly<{memberCount:number,escortCount:number,roles:readonly string[],leaderRole:string,inferLeaderFromArrayIndex:boolean,recruitmentEnabled:boolean,leaderChangeEnabled:boolean,evolutionEnabled:boolean,clientJoinsParty:boolean}>} PartyFacts
 * @typedef {Readonly<{heroNamePlanSceneId:string,heroCustomNameRequired:boolean,partnerCustomNicknameRequired:boolean,partnerDefaultName:string,nicknameChangesScores:boolean,teamNamedBeforeRescue:boolean,teamNamePlanSceneId:string,inputRulesCanonicalId:null,evidenceId:string}>} NamingFacts
 * @typedef {Readonly<{planSceneOrder:readonly string[],runtimeSceneIds:null,dungeonId:string,floorIds:readonly string[],initialFloorId:string,targetSpeciesId:string,requesterSpeciesId:string,bossSpeciesId:null,terminalMapSourceSymbol:string,terminalMapSourceIndex:number,terminalMapCanonicalId:null,terminalIsExplorationFloor:boolean,terminalDisplayedFloorLabel:null,completionOnFloorThreeEntry:boolean,completionRequiresRescueAcknowledgement:boolean,failureCompletesObjective:boolean,reunionRewardBeforeTeamNaming:boolean,firstMailKitAfterTeamNaming:boolean,rewardGrantCanonicalId:null,firstMailKitGrantCanonicalId:null,evidenceId:string}>} OpeningFacts
 * @typedef {Readonly<{field:string,canonicalId:null,owner:string,requirement:string}>} IntegrationJoin
 * @typedef {Readonly<{schemaVersion:number,catalogId:string,edition:string,kind:string,selectionOrder:readonly string[],stageOrder:readonly string[],boost:BoostFacts,members:MemberFacts,moves:MoveInitializationFacts,economy:EconomyFacts,party:PartyFacts,naming:NamingFacts,opening:OpeningFacts,integrationJoins:readonly IntegrationJoin[],evidenceId:string}>} InitializationFacts
 * @typedef {Readonly<{id:string,url:string,scope:string,path:string|null,gitBlob:string|null}>} OnboardingSource
 * @typedef {Readonly<{id:string,qualification:string,sourceIds:readonly string[]}>} OnboardingEvidence
 * @typedef {Readonly<{questionLookup:true,scoringFacts:true,resultLookup:true,partnerPairLookup:true,startingLoadoutLookup:true,quizExecution:false,campaignCreation:false}>} OnboardingCapabilities
 * @typedef {Readonly<{capabilities:OnboardingCapabilities,natureIds:readonly string[],partnerPool:readonly string[],getQuestion:(id:string)=>QuizQuestion,getSelectableQuestion:(index:number)=>QuizQuestion,getOption:(id:string)=>QuizOption,getCategory:(id:string)=>QuizCategory,getAlgorithm:()=>QuizAlgorithm,getNatureResult:(id:string)=>NatureResult,getGenderFacts:()=>GenderFacts,getGenderOutcome:(id:string,column:'male'|'female')=>GenderOutcome,getPartners:(heroId:string)=>readonly StarterPair[],getPair:(heroId:string,partnerId:string)=>StarterPair,getStartingProfile:(id:string)=>StartingProfile,getInitialization:()=>InitializationFacts,getEvidence:(id:string)=>OnboardingEvidence,getSource:(id:string)=>OnboardingSource,dispose:()=>void}>} OnboardingCatalog
 */

const LIMIT = 1024 * 1024;
const CATALOG = 'original-blue-onboarding';
const MANIFEST = new URL('./onboarding/manifest.json', import.meta.url);
const RESOURCES = Object.freeze([
  new URL('./onboarding/schema.json', import.meta.url),
  new URL('./onboarding/questions.json', import.meta.url),
  new URL('./onboarding/algorithm.json', import.meta.url),
  new URL('./onboarding/results.json', import.meta.url),
  new URL('./onboarding/partners.json', import.meta.url),
  new URL('./onboarding/profiles.json', import.meta.url),
  new URL('./onboarding/initialization.json', import.meta.url),
  new URL('./onboarding/sources.json', import.meta.url),
]);
const KINDS = Object.freeze(['questions', 'algorithm', 'results', 'partners', 'profiles', 'initialization', 'sources']);
const VOCABULARY = Object.freeze(['type', 'properties', 'required', 'additionalProperties', 'items', 'minItems', 'maxItems', 'minimum', 'maximum', 'minLength', 'maxLength', 'const']);

/** @param {unknown} value @param {string} message @returns {asserts value} */
function requireValue(value, message) {
  if (!value) throw new Error(`Invalid onboarding catalog: ${message}`);
}
/** @param {unknown} value @returns {value is Record<string,unknown>} */
function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
/** @param {unknown} value @returns {Record<string,unknown>} */
function object(value) { requireValue(isObject(value), 'record object required'); return value; }
/** @param {unknown} value @returns {unknown[]} */
function array(value) { requireValue(Array.isArray(value), 'array required'); return value; }
/** @param {unknown} value @returns {string} */
function string(value) { requireValue(typeof value === 'string' && value.length > 0, 'string required'); return value; }
/** @param {unknown} value @param {number} minimum @param {number} maximum @returns {number} */
function integer(value, minimum, maximum) {
  requireValue(typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum, 'integer bounds');
  return value;
}
/** @param {Record<string,unknown>} value @param {readonly string[]} expected */
function keys(value, expected) { requireValue(Object.keys(value).sort().join('|') === [...expected].sort().join('|'), 'unexpected/missing fields'); }
/** @template T @param {T} value @returns {T} */
function freeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const nested of Object.values(value)) freeze(nested);
    Object.freeze(value);
  }
  return value;
}
/** @template T @param {Map<string,T>} map @param {string} id @param {T} value */
function insert(map, id, value) { requireValue(!map.has(id), `duplicate ${id}`); map.set(id, value); }
/** @template T @param {Map<string,T>} map @param {string} id @returns {T} */
function lookup(map, id) {
  const value = map.get(id);
  if (value === undefined) throw new RangeError(`Unknown onboarding identity: ${id}`);
  return value;
}

/** Join every declared source, evidence and manuscript reference before publishing.
 * Closed schemas reserve these property names, including the profile evidence map.
 * @param {unknown} value @param {Map<string,OnboardingSource>} sources
 * @param {Map<string,OnboardingEvidence>} evidence @param {string} manuscriptId
 */
function checkReferences(value, sources, evidence, manuscriptId) {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach(row => checkReferences(row, sources, evidence, manuscriptId));
    return;
  }
  for (const [key, nested] of Object.entries(object(value))) {
    if (key === 'evidenceId' || key.endsWith('EvidenceId')) lookup(evidence, string(nested));
    if (key === 'sourceId') lookup(sources, string(nested));
    if (key === 'sourceIds') for (const id of array(nested)) lookup(sources, string(id));
    if (key === 'textProvenanceId') requireValue(nested === manuscriptId, 'manuscript reference');
    if (key === 'evidence' && !Array.isArray(nested)) {
      for (const id of Object.values(object(nested))) lookup(evidence, string(id));
    }
    checkReferences(nested, sources, evidence, manuscriptId);
  }
}

/** Validate the small, closed schema vocabulary; no expressions, references or executable schema content.
 * @param {Record<string,unknown>} rule @param {string} location
 */
function schemaRule(rule, location) {
  for (const keyword of Object.keys(rule)) requireValue(VOCABULARY.includes(keyword), `unsupported schema keyword ${keyword}`);
  const types = typeof rule.type === 'string' ? [rule.type] : array(rule.type).map(string);
  requireValue(types.length > 0 && types.every(type => ['null', 'boolean', 'integer', 'string', 'array', 'object'].includes(type)), 'schema type');
  for (const keyword of ['minItems', 'maxItems', 'minimum', 'maximum', 'minLength', 'maxLength']) {
    if (rule[keyword] !== undefined) integer(rule[keyword], 0, 2147483647);
  }
  if (types.includes('object')) {
    const properties = object(rule.properties);
    const required = array(rule.required).map(string);
    requireValue(rule.additionalProperties === false, 'closed object schema required');
    requireValue(required.every(key => Object.hasOwn(properties, key)), 'required schema key');
    if (!location.endsWith('.scores')) requireValue([...required].sort().join('|') === Object.keys(properties).sort().join('|'), 'all record fields required');
    for (const [key, nested] of Object.entries(properties)) schemaRule(object(nested), `${location}.${key}`);
  }
  if (types.includes('array')) schemaRule(object(rule.items), `${location}.*`);
}

/** Interpret only the declared JSON Schema vocabulary shared with the static Ajv gate.
 * @param {unknown} value @param {Record<string,unknown>} rule @param {string} location
 */
function validate(value, rule, location) {
  const types = typeof rule.type === 'string' ? [rule.type] : array(rule.type).map(string);
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value === 'number' && Number.isInteger(value) ? 'integer' : typeof value;
  requireValue(types.includes(actual), `type at ${location}`);
  if (Object.hasOwn(rule, 'const')) requireValue(value === rule.const, `constant at ${location}`);
  if (typeof value === 'string') {
    const length = [...value].length;
    if (typeof rule.minLength === 'number') requireValue(length >= rule.minLength, `text minimum at ${location}`);
    if (typeof rule.maxLength === 'number') requireValue(length <= rule.maxLength, `text maximum at ${location}`);
  } else if (typeof value === 'number') {
    if (typeof rule.minimum === 'number') requireValue(value >= rule.minimum, `minimum at ${location}`);
    if (typeof rule.maximum === 'number') requireValue(value <= rule.maximum, `maximum at ${location}`);
  } else if (Array.isArray(value)) {
    if (typeof rule.minItems === 'number') requireValue(value.length >= rule.minItems, `array minimum at ${location}`);
    if (typeof rule.maxItems === 'number') requireValue(value.length <= rule.maxItems, `array maximum at ${location}`);
    value.forEach((item, index) => validate(item, object(rule.items), `${location}[${index}]`));
  } else if (isObject(value)) {
    const properties = object(rule.properties);
    for (const key of array(rule.required).map(string)) requireValue(Object.hasOwn(value, key), `required ${location}.${key}`);
    for (const [key, nested] of Object.entries(value)) {
      requireValue(Object.hasOwn(properties, key), `unknown ${location}.${key}`);
      validate(nested, object(properties[key]), `${location}.${key}`);
    }
  }
}

/** @param {Uint8Array<ArrayBuffer>} bytes @returns {Promise<string>} */
async function digest(bytes) {
  return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');
}
/** @param {URL} url @param {AbortSignal} signal @returns {Promise<Uint8Array<ArrayBuffer>>} */
async function fetchBytes(url, signal) {
  const response = await fetch(url, { signal, redirect: 'error', credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Onboarding resource ${url.pathname}: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  requireValue(bytes.byteLength > 0 && bytes.byteLength < LIMIT, 'resource size');
  return bytes;
}
/** @param {Uint8Array<ArrayBuffer>} bytes @returns {Record<string,unknown>} */
function decode(bytes) { return object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))); }

/** Atomic fixed-resource load. No URL supplied by content is fetched; no game state is touched.
 * @param {Readonly<{signal?:AbortSignal}>} [options] @returns {Promise<OnboardingCatalog>}
 */
export async function loadOnboardingCatalog({ signal } = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  try {
    const manifest = decode(await fetchBytes(MANIFEST, controller.signal));
    keys(manifest, ['schemaVersion', 'catalogId', 'kind', 'resources']);
    requireValue(manifest.schemaVersion === 1 && manifest.catalogId === CATALOG && manifest.kind === 'manifest', 'manifest header');
    const entries = array(manifest.resources);
    requireValue(entries.length === RESOURCES.length, 'resource membership');
    const documents = await Promise.all(RESOURCES.map(async (url, index) => {
      const entry = object(entries[index]);
      keys(entry, ['file', 'bytes', 'sha256']);
      requireValue(entry.file === url.pathname.split('/').at(-1), 'explicit file order');
      const size = integer(entry.bytes, 1, LIMIT - 1);
      const hash = string(entry.sha256);
      requireValue(/^[a-f0-9]{64}$/.test(hash), 'resource digest');
      const bytes = await fetchBytes(url, controller.signal);
      requireValue(bytes.byteLength === size && await digest(bytes) === hash, 'resource integrity');
      return decode(bytes);
    }));
    const schema = object(documents[0]);
    keys(schema, ['schemaVersion', 'catalogId', 'kind', 'vocabulary', 'documents']);
    requireValue(schema.schemaVersion === 1 && schema.catalogId === CATALOG && schema.kind === 'schema', 'schema header');
    requireValue(JSON.stringify(schema.vocabulary) === JSON.stringify(VOCABULARY), 'schema vocabulary');
    const definitions = object(schema.documents);
    keys(definitions, KINDS);
    /** @type {Map<string,Record<string,unknown>>} */ const checked = new Map();
    KINDS.forEach((kind, index) => {
      const definition = object(definitions[kind]);
      schemaRule(definition, kind);
      const document = object(documents[index + 1]);
      requireValue(document.schemaVersion === 1 && document.catalogId === CATALOG && document.edition === 'blue-rescue-team-qualified-facts' && document.kind === kind, 'document header');
      validate(document, definition, kind);
      checked.set(kind, freeze(document));
    });
    controller.signal.throwIfAborted();
    return createCatalog(checked);
  } catch (cause) {
    controller.abort();
    throw new Error('Unable to load the sourced onboarding catalog.', { cause });
  } finally {
    signal?.removeEventListener('abort', abort);
  }
}

/** Schema validation precedes these typed immutable projections and relational checks.
 * @param {Map<string,Record<string,unknown>>} documents @returns {OnboardingCatalog}
 */
function createCatalog(documents) {
  /** @type {Map<string,QuizQuestion>} */ const questions = new Map();
  /** @type {Map<string,QuizQuestion>} */ const indices = new Map();
  /** @type {Map<string,QuizOption>} */ const options = new Map();
  /** @type {Map<string,QuizCategory>} */ const categories = new Map();
  /** @type {Map<string,NatureResult>} */ const results = new Map();
  /** @type {Map<string,StartingProfile>} */ const profiles = new Map();
  /** @type {Map<string,StarterPair>} */ const pairs = new Map();
  /** @type {Map<string,readonly StarterPair[]>} */ const partners = new Map();
  /** @type {Map<string,OnboardingSource>} */ const sources = new Map();
  /** @type {Map<string,OnboardingEvidence>} */ const evidence = new Map();
  const algorithm = /** @type {QuizAlgorithm} */ (/** @type {unknown} */ (lookup(documents, 'algorithm')));
  const initialization = /** @type {InitializationFacts} */ (/** @type {unknown} */ (lookup(documents, 'initialization')));
  const resultDocument = lookup(documents, 'results');
  const gender = /** @type {GenderFacts} */ (/** @type {unknown} */ (resultDocument.gender));
  const partnerDocument = lookup(documents, 'partners');
  const partnerPool = /** @type {readonly string[]} */ (partnerDocument.orderedPool);
  const sourceDocument = lookup(documents, 'sources');
  requireValue(sourceDocument.blueBinaryBuildVerified === false, 'source qualification');
  const capabilities = /** @type {OnboardingCapabilities} */ (/** @type {unknown} */ (sourceDocument.capabilities));
  requireValue(capabilities.questionLookup === true && capabilities.scoringFacts === true && capabilities.resultLookup === true && capabilities.partnerPairLookup === true && capabilities.startingLoadoutLookup === true && capabilities.quizExecution === false && capabilities.campaignCreation === false, 'capability boundary');
  for (const value of array(sourceDocument.sources)) {
    const row = /** @type {OnboardingSource} */ (value);
    requireValue(/^https:\/\//.test(row.url), 'source URL');
    insert(sources, row.id, row);
  }
  for (const value of array(sourceDocument.evidence)) {
    const row = /** @type {OnboardingEvidence} */ (value);
    row.sourceIds.forEach(id => lookup(sources, id));
    insert(evidence, row.id, row);
  }
  const manuscriptId = string(object(sourceDocument.textProvenance).id);
  for (const document of documents.values()) checkReferences(document, sources, evidence, manuscriptId);
  requireValue(gender.sourceValues.male === 0 && gender.sourceValues.female === 1 && gender.changesScores === false && gender.changesResultColumn === true && gender.directSpeciesOverride === false && gender.evidenceId === 'shared-results', 'gender result contract');
  for (const value of array(lookup(documents, 'questions').records)) {
    const row = /** @type {QuizQuestion} */ (value);
    insert(questions, row.id, row);
    insert(indices, String(row.originalIndex), row);
    lookup(evidence, row.evidenceId);
    lookup(sources, row.redLocator.sourceId);
    lookup(sources, row.sharedLocator.sourceId);
    requireValue(row.selectable === (row.originalIndex < 55), 'selectable question index');
    row.options.forEach((option, index) => {
      requireValue(option.index === index && option.optionId === `${row.id}-a${index}`, 'option identity/order');
      for (const id of Object.keys(option.scores)) requireValue(algorithm.natureOrder.includes(id), 'nature score reference');
      insert(options, option.optionId, option);
    });
  }
  for (const category of algorithm.categories) {
    insert(categories, category.id, category);
    for (const id of category.selectableQuestionIds) {
      const question = lookup(questions, id);
      requireValue(question.selectable && question.categoryId === category.id, 'category membership');
    }
    requireValue(category.selectableQuestionIds.length === category.questionCount, 'category count');
  }
  for (const question of questions.values()) {
    lookup(categories, question.categoryId);
    for (const option of question.options) if (option.followUp !== null) requireValue(!lookup(questions, option.followUp).selectable, 'conditional reference');
  }
  for (const value of array(lookup(documents, 'profiles').records)) {
    const row = /** @type {StartingProfile} */ (value);
    requireValue(/^pokemon-\d{3}$/.test(row.speciesId) && row.profileId === row.speciesId && row.formId === null, 'starter canonical identity');
    requireValue(/^friend-area-[a-z0-9-]+$/.test(row.friendAreaId), 'Friend Area identity');
    requireValue(/^level-[a-f0-9]{64}$/.test(row.catalogResources.levelResourceId) && /^learn-[a-f0-9]{64}$/.test(row.catalogResources.learnsetResourceId), 'species resource identity');
    requireValue(row.rosterCreation.level === 1 && row.rosterCreation.cumulativeExp === 0 && row.firstPlayable.level === 5, 'creation/first-entry separation');
    requireValue(row.firstPlayable.currentHP === row.firstPlayable.stats.hp && row.firstPlayable.moves.length + row.firstPlayable.emptyMoveSlots === 4, 'first-entry resources');
    for (const [slot, move] of row.firstPlayable.moves.entries()) {
      requireValue(move.slot === slot && /^move-[a-z0-9-]+$/.test(move.moveId) && move.currentPP === move.maximumPP, 'playable move reference/resources');
    }
    for (const id of Object.values(row.evidence)) lookup(evidence, id);
    insert(profiles, row.speciesId, row);
  }
  for (const value of array(resultDocument.records)) {
    const row = /** @type {NatureResult} */ (value);
    requireValue(algorithm.natureOrder.includes(row.natureId), 'nature identity');
    lookup(profiles, row.maleSpeciesId); lookup(profiles, row.femaleSpeciesId); lookup(evidence, row.evidenceId);
    insert(results, row.natureId, row);
  }
  partnerPool.forEach(id => lookup(profiles, id));
  /** @type {Map<string,StarterPair[]>} */ const grouped = new Map();
  for (const value of array(partnerDocument.pairs)) {
    const row = /** @type {StarterPair} */ (value);
    const hero = lookup(profiles, row.heroSpeciesId);
    const partner = lookup(profiles, row.partnerSpeciesId);
    requireValue(partnerPool.includes(row.partnerSpeciesId), 'partner pool membership');
    requireValue(!hero.typeIds.some(id => partner.typeIds.includes(id)), 'partner type exclusion');
    requireValue(JSON.stringify(row.ownedFriendAreaIds) === JSON.stringify([...new Set([hero.friendAreaId, partner.friendAreaId])]), 'starting area union');
    insert(pairs, `${row.heroSpeciesId}/${row.partnerSpeciesId}`, row);
    const group = grouped.get(row.heroSpeciesId) ?? [];
    group.push(row);
    grouped.set(row.heroSpeciesId, group);
  }
  for (const hero of profiles.values()) {
    const group = grouped.get(hero.speciesId);
    requireValue(group !== undefined, 'missing hero partner choices');
    const expected = partnerPool.filter(id => !lookup(profiles, id).typeIds.some(type => hero.typeIds.includes(type)));
    requireValue(JSON.stringify(group.map(pair => pair.partnerSpeciesId)) === JSON.stringify(expected), 'partner menu order/completeness');
    partners.set(hero.speciesId, freeze(group));
  }
  requireValue(questions.size === 56 && options.size === 140 && categories.size === 14 && results.size === 13 && profiles.size === 16 && pairs.size === 129, 'exact membership');
  for (let index = 0; index < 56; index += 1) lookup(indices, String(index));
  requireValue(initialization.naming.teamNamedBeforeRescue === false && initialization.boost.repeatOnResume === false && initialization.boost.repeatOnRetry === false, 'initialization boundary');
  documents.clear();
  let disposed = false;
  const active = () => { if (disposed) throw new Error('Onboarding catalog has been disposed.'); };
  return Object.freeze({
    capabilities, natureIds: algorithm.natureOrder, partnerPool,
    /** @param {string} id */ getQuestion(id) { active(); return lookup(questions, id); },
    /** @param {number} index */ getSelectableQuestion(index) { active(); integer(index, 0, 54); return lookup(indices, String(index)); },
    /** @param {string} id */ getOption(id) { active(); return lookup(options, id); },
    /** @param {string} id */ getCategory(id) { active(); return lookup(categories, id); },
    getAlgorithm() { active(); return algorithm; },
    /** @param {string} id */ getNatureResult(id) { active(); return lookup(results, id); },
    getGenderFacts() { active(); return gender; },
    /** @param {string} id @param {'male'|'female'} column @returns {GenderOutcome} */
    getGenderOutcome(id, column) {
      active();
      requireValue(column === 'male' || column === 'female', 'result column');
      const result = lookup(results, id);
      return Object.freeze({ natureId: id, column, speciesId: column === 'male' ? result.maleSpeciesId : result.femaleSpeciesId, formId: null });
    },
    /** @param {string} heroId */ getPartners(heroId) { active(); return lookup(partners, heroId); },
    /** @param {string} heroId @param {string} partnerId */ getPair(heroId, partnerId) { active(); string(heroId); string(partnerId); return lookup(pairs, `${heroId}/${partnerId}`); },
    /** @param {string} id */ getStartingProfile(id) { active(); return lookup(profiles, id); },
    getInitialization() { active(); return initialization; },
    /** @param {string} id */ getEvidence(id) { active(); return lookup(evidence, id); },
    /** @param {string} id */ getSource(id) { active(); return lookup(sources, id); },
    dispose() {
      disposed = true;
      questions.clear(); indices.clear(); options.clear(); categories.clear(); results.clear(); profiles.clear(); pairs.clear(); partners.clear(); sources.clear(); evidence.clear();
    },
  });
}
