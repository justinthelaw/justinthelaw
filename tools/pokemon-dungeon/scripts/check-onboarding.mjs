import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { buildOnboardingExport, onboardingAuthorRoot, onboardingRuntimeRoot, onboardingFiles, hashBytes, hashFacts } from './export-onboarding.mjs';

const root = new URL('../../../', import.meta.url);
const read = async url => JSON.parse(await readFile(url, 'utf8'));
const inventory = async relative => read(new URL(relative, root));
const unique = (records, key) => {
  const result = new Map(records.map(r => [r[key], r]));
  assert.equal(result.size, records.length, `Duplicate ${key}`);
  return result;
};
const pick = (row, keys) => Object.fromEntries(keys.map(k => [k, row[k]]));
const hash = value => assert.match(value, /^[a-f0-9]{64}$/);
const output = await buildOnboardingExport();
assert.deepEqual((await readdir(onboardingRuntimeRoot)).sort(), [...output.keys()].sort());
for (const [file, bytes] of output) {
  assert.equal(await readFile(new URL(file, onboardingRuntimeRoot), 'utf8'), bytes, `Stale export ${file}`);
  for (const folder of [onboardingAuthorRoot, onboardingRuntimeRoot]) {
    if (file === 'manifest.json' && folder === onboardingAuthorRoot) continue;
    const target = new URL(file, folder);
    assert((await stat(target)).size < 1024 * 1024);
    const relative = path.relative(await realpath(fileURLToPath(folder)), await realpath(fileURLToPath(target)));
    assert(!relative.startsWith('..') && !path.isAbsolute(relative));
  }
}
const docs = Object.fromEntries(onboardingFiles.map(file => [file.replace('.json', ''), JSON.parse(output.get(file))]));
const { schema, questions, algorithm, results, partners, profiles, initialization, sources } = docs;
assert.deepEqual(Object.keys(schema).sort(), ['schemaVersion', 'catalogId', 'kind', 'vocabulary', 'documents'].sort());
assert.equal(schema.schemaVersion, 1);
assert.equal(schema.catalogId, 'original-blue-onboarding');
assert.equal(schema.kind, 'schema');
const vocabulary = ['type', 'properties', 'required', 'additionalProperties', 'items', 'minItems', 'maxItems', 'minimum', 'maximum', 'minLength', 'maxLength', 'const'];
assert.deepEqual(schema.vocabulary, vocabulary);
assert.deepEqual(Object.keys(schema.documents), ['questions', 'algorithm', 'results', 'partners', 'profiles', 'initialization', 'sources']);
function checkVocabulary(rule, location) {
  for (const key of Object.keys(rule)) assert(vocabulary.includes(key), `Unsupported schema keyword ${key}`);
  if (rule.properties) {
    assert.equal(rule.additionalProperties, false);
    assert(Array.isArray(rule.required));
    assert(rule.required.every(key => Object.hasOwn(rule.properties, key)));
    if (!location.endsWith('.scores')) assert.deepEqual([...rule.required].sort(), Object.keys(rule.properties).sort(), `Unrequired field at ${location}`);
    for (const [key, nested] of Object.entries(rule.properties)) checkVocabulary(nested, `${location}.${key}`);
  }
  if (rule.items) checkVocabulary(rule.items, `${location}.*`);
}
const ajv = new Ajv({ allErrors: true, strict: true, allowUnionTypes: true });
for (const [kind, rule] of Object.entries(schema.documents)) {
  assert.equal(docs[kind].schemaVersion, 1);
  assert.equal(docs[kind].catalogId, 'original-blue-onboarding');
  assert.equal(docs[kind].edition, 'blue-rescue-team-qualified-facts');
  assert.equal(docs[kind].kind, kind);
  checkVocabulary(rule, kind);
  const validate = ajv.compile(rule);
  assert(validate(docs[kind]), `${kind}: ${ajv.errorsText(validate.errors)}`);
}
assert.deepEqual(sources.validationCounts, { questions: 56, selectable: 55, options: 140, categories: 14, natures: 13, genderOutcomes: 26, partners: 10, orderedPairs: 129, startingProfiles: 16 });
assert.equal(sources.blueBinaryBuildVerified, false);
assert.deepEqual(sources.capabilities, { questionLookup: true, scoringFacts: true, resultLookup: true, partnerPairLookup: true, startingLoadoutLookup: true, quizExecution: false, campaignCreation: false });
const sourceMap = unique(sources.sources, 'id');
const evidenceMap = unique(sources.evidence, 'id');
for (const source of sources.sources) {
  assert.match(source.url, /^https:\/\//);
  if (source.gitBlob !== null) assert.match(source.gitBlob, /^[a-f0-9]{40}$/);
  if (source.id.startsWith('red:')) assert(source.url.includes('6bcbec4f906938c0243aa2026bcbd41b577bab85'));
}
// The closed schema reserves these names for references, including nested policies.
// Profile evidence uses a named map rather than an evidenceId property.
function checkReferences(value, location) {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((row, index) => checkReferences(row, `${location}.${index}`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    const at = `${location}.${key}`;
    if (key === 'evidenceId' || key.endsWith('EvidenceId')) assert(evidenceMap.has(nested), `Unknown evidence at ${at}`);
    if (key === 'sourceId') assert(sourceMap.has(nested), `Unknown source at ${at}`);
    if (key === 'sourceIds') for (const id of nested) assert(sourceMap.has(id), `Unknown source at ${at}`);
    if (key === 'textProvenanceId') assert.equal(nested, sources.textProvenance.id, `Unknown manuscript at ${at}`);
    if (key === 'evidence' && !Array.isArray(nested)) {
      for (const id of Object.values(nested)) assert(evidenceMap.has(id), `Unknown evidence at ${at}`);
    }
    checkReferences(nested, at);
  }
}
for (const kind of Object.keys(schema.documents)) checkReferences(docs[kind], kind);
for (const value of Object.values(sources.factualHashes)) hash(value);
for (const value of Object.values(sources.blueprintHashes)) hash(value);
hash(sources.researchInput.sha256);
for (const row of sources.catalogInputHashes) {
  assert.match(row.path, /^games\/pokemon-dungeon-reimagined\/content\/species\/[a-z0-9-]+\.json$/);
  assert.equal(hashBytes(await readFile(new URL(row.path, root))), row.sha256, `Changed source catalog ${row.path}`);
}
const authored = await read(new URL('text.json', onboardingAuthorRoot));
assert.equal(authored.language, 'en');
const natureIds = ['hardy', 'docile', 'brave', 'jolly', 'impish', 'naive', 'timid', 'hasty', 'sassy', 'calm', 'relaxed', 'lonely', 'quirky'];
assert.deepEqual(algorithm.natureOrder, natureIds);
assert.deepEqual(algorithm.initialScores, Object.fromEntries(natureIds.map(id => [id, 0])));
unique(questions.records, 'id');
unique(questions.records, 'originalIndex');
assert.equal(questions.records.length, 56);
assert.equal(questions.records.reduce((n, q) => n + q.options.length, 0), 140);
const allOptions = unique(questions.records.flatMap(q => q.options), 'optionId');
const questionFacts = questions.records.map((q, index) => {
  assert.equal(q.originalIndex, index);
  assert.equal(q.id, q.originalQuestionId.toLowerCase().replaceAll('_', '-'));
  assert.equal(q.selectable, index < 55);
  assert.equal(q.categoryId, index === 55 ? 'brave' : [...natureIds, 'misc'][Math.floor(index / 4)]);
  assert(sourceMap.has(q.redLocator.sourceId) && sourceMap.has(q.sharedLocator.sourceId));
  assert.equal(q.evidenceId, 'shared-quiz');
  assert.equal(q.textProvenanceId, sources.textProvenance.id);
  assert.deepEqual([q.prompt, ...q.options.map(o => o.text)], authored.questions[q.id]);
  for (const [optionIndex, option] of q.options.entries()) {
    assert.equal(option.index, optionIndex);
    assert.equal(option.optionId, `${q.id}-a${optionIndex}`);
    assert.equal(option.originalAnswerId, `${q.originalQuestionId}_A${optionIndex}`);
    const trigger = option.optionId === 'brave-q2a-a0';
    assert.equal(option.originalMenuValue, trigger ? 99 : optionIndex);
    assert.equal(option.followUp, trigger ? 'brave-q2b' : null);
    if (trigger) assert.deepEqual(option.scores, {});
    else assert(Object.keys(option.scores).length > 0);
  }
  const facts = { ...pick(q, ['id', 'originalIndex', 'sourceSymbol', 'originalQuestionId', 'categoryId', 'selectable']), options: q.options.map(o => pick(o, ['index', 'originalAnswerId', 'originalMenuValue', 'scores', 'followUp', 'optionId'])) };
  assert.equal(hashFacts(facts), q.factsSha256);
  return facts;
});
assert.equal(hashFacts(questionFacts), sources.factualHashes.questions);
assert.equal(hashFacts(algorithm), sources.blueprintHashes.algorithm);
const bucketSizes = n => Array.from({ length: n }, (_, i) => Math.ceil((i + 1) * 65536 / n) - Math.ceil(i * 65536 / n));
assert.deepEqual(algorithm.integerMapper.questionBucketSizes, bucketSizes(55));
assert.deepEqual(algorithm.integerMapper.tieBucketSizes, bucketSizes(13));
assert.equal(algorithm.sampling.mainQuestionCount, 8);
assert.deepEqual(algorithm.sampling.selectableIndices, Array.from({ length: 55 }, (_, i) => i));
assert.equal(algorithm.sampling.followUpQuestionId, 'brave-q2b');
assert.equal(allOptions.get(algorithm.sampling.followUpTriggerOptionId).followUp, algorithm.sampling.followUpQuestionId);
assert.equal(algorithm.sampling.uniformCategoryDraw, false);
assert.equal(algorithm.sampling.markEntireCategoryBeforePresentation, true);
assert.equal(algorithm.tieBreak.replaceOnlyIfStrictlyGreater, true);
assert.equal(algorithm.tieBreak.uniformAmongMaxima, false);
assert.deepEqual(algorithm.tieBreak.exampleUint16Weights, [65536 - bucketSizes(13)[1], bucketSizes(13)[1]]);
for (const [index, category] of algorithm.categories.entries()) {
  assert.equal(category.id, [...natureIds, 'misc'][index]);
  assert.equal(category.originalCategoryIndex, index);
  const members = questions.records.filter(q => q.selectable && q.categoryId === category.id);
  assert.deepEqual(category.selectableQuestionIds, members.map(q => q.id));
  assert.equal(category.questionCount, index === 13 ? 3 : 4);
  assert.equal(category.firstDrawIdealWeightNumerator, members.length);
  assert.equal(category.firstDrawIdealWeightDenominator, 55);
  assert.equal(category.firstDrawUint16Weight, members.reduce((sum, q) => sum + bucketSizes(55)[q.originalIndex], 0));
  assert.equal(category.uint16Denominator, 65536);
}
assert.deepEqual(results.records.map(r => r.natureId), natureIds);
const resultFacts = results.records.map(r => {
  assert.equal(r.description, authored.results[r.natureId]);
  assert.equal(r.evidenceId, 'shared-results');
  assert.equal(r.textProvenanceId, sources.textProvenance.id);
  return pick(r, ['natureId', 'maleSpeciesId', 'femaleSpeciesId']);
});
assert.equal(hashFacts(resultFacts), sources.factualHashes.genderResults);
assert.deepEqual(results.gender.sourceValues, { male: 0, female: 1 });
assert.equal(results.gender.changesScores, false);
assert.equal(results.gender.changesResultColumn, true);
assert.equal(results.gender.evidenceId, 'shared-results');
assert.equal(results.gender.prompt, authored.genderPrompt);
assert.deepEqual(results.gender.labels, authored.genderLabels);
assert.equal(results.gender.directSpeciesOverride, false);
const speciesBase = 'games/pokemon-dungeon-reimagined/content/species/';
const catalogProfiles = new Map((await Promise.all([1, 2, 3, 4, 5].map(n => inventory(`${speciesBase}profiles-${n}.json`)))).flatMap(d => d.records).map(r => [r.id, r]));
const levelMap = new Map((await Promise.all([1, 2, 3, 4].map(n => inventory(`${speciesBase}levels-${n}.json`)))).flatMap(d => d.records).map(r => [r.id, r]));
const learningMap = unique((await inventory(`${speciesBase}learnsets.json`)).records, 'id');
const moveIds = unique((await inventory(`${speciesBase}identities.json`)).moves, 'originalId');
const effectsFolder = new URL('tools/pokemon-dungeon/content/effects-runtime/', root);
const actions = new Map((await Promise.all((await readdir(effectsFolder)).filter(f => /^actions-\d+\.json$/.test(f)).map(file => read(new URL(file, effectsFolder))))).flatMap(d => d.records).map(r => [r.internalId, r]));
const startMap = unique(profiles.records, 'speciesId');
const heroIds = [...new Set(resultFacts.flatMap(r => [r.maleSpeciesId, r.femaleSpeciesId]))].sort();
assert.deepEqual([...startMap.keys()].sort(), heroIds);
assert.equal(startMap.size, 16);
assert.equal(hashFacts(partners.orderedPool), sources.factualHashes.partnerPool);
assert.equal(new Set(partners.orderedPool).size, 10);
const profileFacts = [];
for (const p of profiles.records) {
  const canonical = catalogProfiles.get(p.profileId);
  assert(canonical && canonical.speciesId === p.speciesId && canonical.formId === p.formId);
  assert.equal(canonical.internalId, p.originalInternalId);
  assert.equal(canonical.friendAreaId, p.friendAreaId);
  assert.deepEqual(canonical.typeIds, p.typeIds);
  assert.deepEqual(p.catalogResources, pick(canonical, ['levelResourceId', 'learnsetResourceId']));
  const level = levelMap.get(canonical.levelResourceId);
  const learn = learningMap.get(canonical.learnsetResourceId);
  const statKeys = ['hp', 'attack', 'specialAttack', 'defense', 'specialDefense'];
  assert.equal(p.rosterCreation.level, 1);
  assert.equal(p.rosterCreation.cumulativeExp, 0);
  assert.deepEqual(p.rosterCreation.stats, Object.fromEntries(statKeys.map((k, i) => [k, level.baseStats[i]])));
  assert.deepEqual(p.rosterCreation.moves, learn.levelUp.filter(r => r[0] === 1).slice(0, 4).map(([lv, id], slot) => ({ slot, moveId: moveIds.get(id).id, originalMoveId: id, learnedAtLevel: lv, storedPP: 0 })));
  const playable = p.firstPlayable;
  assert.equal(playable.level, 5);
  assert.equal(playable.cumulativeExp, level.rows[4][0]);
  assert.deepEqual(playable.stats, Object.fromEntries(statKeys.map((k, i) => [k, Math.min(i === 0 ? 999 : 255, level.baseStats[i] + level.rows.slice(0, 5).reduce((sum, row) => sum + row[i + 1], 0))])));
  assert.equal(playable.currentHP, playable.stats.hp);
  const moves = learn.levelUp.filter(r => r[0] <= 5).slice(0, 4);
  assert.equal(playable.moves.length, moves.length);
  assert.equal(playable.emptyMoveSlots, 4 - moves.length);
  for (const [slot, m] of playable.moves.entries()) {
    assert.equal(m.slot, slot);
    assert.deepEqual([m.learnedAtLevel, m.originalMoveId], moves[slot]);
    assert.equal(m.moveId, moveIds.get(m.originalMoveId).id);
    assert.equal(m.maximumPP, actions.get(m.originalMoveId).numeric.pp);
    assert.equal(m.currentPP, m.maximumPP);
    assert.equal(m.enabledForAI, true);
    assert.equal(m.linkedToPrevious, false);
    assert.equal(m.setForShortcut, false);
    assert.equal(m.ginsengBoost, 0);
  }
  for (const id of Object.values(p.evidence)) assert(evidenceMap.has(id));
  assert.equal(p.evidence.experience, canonical.evidence.experience);
  profileFacts.push({ ...pick(p, ['speciesId', 'profileId', 'formId', 'originalInternalId', 'friendAreaId', 'typeIds', 'catalogResources']), ...playable });
  const expectedPartners = partners.orderedPool.filter(id => !startMap.get(id).typeIds.some(type => p.typeIds.includes(type)));
  const actual = partners.pairs.filter(pair => pair.heroSpeciesId === p.speciesId);
  assert.deepEqual(actual.map(pair => pair.partnerSpeciesId), expectedPartners);
  for (const pair of actual) {
    assert.equal(pair.heroFormId, null);
    assert.equal(pair.partnerFormId, null);
    assert.deepEqual(pair.ownedFriendAreaIds, [...new Set([p.friendAreaId, startMap.get(pair.partnerSpeciesId).friendAreaId])]);
  }
}
assert.equal(hashFacts(profileFacts), sources.factualHashes.startingProfiles);
assert.equal(partners.pairs.length, 129);
assert.equal(new Set(partners.pairs.map(p => `${p.heroSpeciesId}/${p.partnerSpeciesId}`)).size, 129);
assert.equal(hashFacts(initialization), sources.blueprintHashes.initialization);
assert.deepEqual(initialization.boost.levelsApplied, [2, 3, 4, 5]);
assert.equal(initialization.boost.repeatOnRetry, false);
assert.equal(initialization.boost.repeatOnResume, false);
assert.equal(initialization.boost.setConsumedBeforeDungeonCheck, true);
assert.equal(initialization.party.leaderRole, 'hero');
assert.equal(initialization.party.inferLeaderFromArrayIndex, false);
assert.deepEqual(initialization.economy.carriedItems, []);
assert.deepEqual(initialization.economy.storedItems, []);
assert.equal(initialization.economy.carriedMoney, 0);
assert.equal(initialization.economy.bankSavings, 0);
assert.equal(initialization.naming.teamNamedBeforeRescue, false);
assert.equal(initialization.opening.terminalIsExplorationFloor, false);
assert.equal(initialization.opening.completionOnFloorThreeEntry, false);
const plan = await readFile(new URL('games/pokemon-dungeon-reimagined/plan/CAMPAIGN.md', root), 'utf8');
for (const scene of initialization.opening.planSceneOrder) assert(plan.includes(`\`${scene}\``), `Missing plan scene ${scene}`);
const dungeonRoot = new URL('games/pokemon-dungeon-reimagined/content/dungeons/', root);
const floors = new Set((await Promise.all((await readdir(dungeonRoot)).filter(f => /^floors-\d+\.json$/.test(f)).map(f => read(new URL(f, dungeonRoot))))).flatMap(d => d.records).map(r => r.id));
for (const id of initialization.opening.floorIds) assert(floors.has(id), `Missing canonical floor ${id}`);
assert(initialization.opening.floorIds.includes(initialization.opening.initialFloorId));
for (const join of initialization.integrationJoins) assert.equal(join.canonicalId, null);
const runtime = await readFile(new URL('games/pokemon-dungeon-reimagined/content/onboarding.js', root), 'utf8');
for (const file of ['manifest.json', ...onboardingFiles]) assert(runtime.includes(`'./onboarding/${file}'`), `Runtime must explicitly name ${file}`);
console.log('Onboarding facts checked: 56 questions / 140 score maps, 55 selectable / 14 categories, 13 natures / 26 outcomes, 129 ordered pairs and 16 level1/level5 loadouts; closed schema, source fingerprints and independent catalog joins. No game execution.');
