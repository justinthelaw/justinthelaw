// Independent JSON/source-fact checks. Never import exporters or game modules.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const digest = value => createHash('sha256').update(value).digest('hex');
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
  : value !== null && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const hashFacts = value => digest(canonical(value));
const pick = (value, keys) => Object.fromEntries(keys.map(key => [key, value[key]]));
const integer = (value, min, max) => assert(Number.isInteger(value) && value >= min && value <= max, `Out-of-range fact: ${value}`);
const hash = value => assert.match(value, /^[a-f0-9]{64}$/);
const unique = (rows, key = 'id') => {
  assert(Array.isArray(rows));
  const map = new Map(rows.map(row => [row[key], row]));
  assert.equal(map.size, rows.length, `Duplicate factual ${key}`);
  return map;
};
async function read(file) {
  const bytes = await readFile(new URL(file, root));
  assert(bytes.length < 1024 * 1024, `Oversized factual resource: ${file}`);
  return { bytes, data: JSON.parse(bytes.toString('utf8')) };
}
const names = ['algorithm', 'questions', 'results', 'partners', 'sources'];
const documents = Object.fromEntries(await Promise.all(names.map(async name => {
  const input = await read(`content/blue-onboarding/${name}.json`);
  assert.deepEqual(pick(input.data, ['schemaVersion', 'catalogId', 'edition', 'kind']),
    { schemaVersion: 1, catalogId: 'original-blue-onboarding', edition: 'blue-rescue-team-qualified-facts', kind: name });
  if (name !== 'sources') assert((await readFile(new URL(`../../games/pokemon-dungeon-reimagined/content/onboarding/${name}.json`, root))).equals(input.bytes), `Stale quiz resource: ${name}`);
  return [name, input.data];
})));
const { algorithm, questions, results, partners, sources } = documents;
const source = (await read('content/blue-source.json')).data;
assert.equal(source.schemaVersion, 1);
assert.equal(source.scope, 'Original Blue Rescue Team opening through Tiny Woods only');

// These fingerprints are inherited from the independently reviewed original
// quiz proof and a record-by-record comparison against the retired donor JSON.
// They are not regenerated from projection output. Fact changes need source review.
const quizPins = {
  questions: '2dbe2d940f40e2bde3005a7c63910e46b04c629884480036d20f0f1de64ab0b1',
  genderResults: 'b0ae954c19fb9e922cee0b97f4da4e1c935f5ef092576b88418f4e34cd20335f',
  partnerPool: '66c420378f6bc074999cee9eb1381a6ace583b8456255d3f45efdd2ee3765bd6',
  startingProfiles: '548387800d44e7b0a4e339cb351420bd6cebcb0bc1e33a3b040c2f17ffcecdb8',
};
assert.deepEqual(sources.factualHashes, quizPins);
assert.equal(hashFacts(algorithm), '77b6063b7613d4aacd577b4cee16d9ca36722ec5c362e14940b00d8de9186bf8');
assert.equal(sources.blueprintHashes.algorithm, hashFacts(algorithm));
const factFields = ['starterProfiles', 'species', 'profiles', 'levels', 'learnsets', 'identities', 'actions', 'bodies', 'floors', 'generations', 'encounters', 'timers', 'ai'];
assert.equal(hashFacts(pick(source, factFields)), '7afe6f9373b1e1a5ab3063ea0f7e270420c2d9cf206b7d3f737a34ef90cb7e52', 'Selected donor facts changed; review their source before changing this pin');
assert.equal(Object.keys(source.donorFiles).length, 28);
assert.equal(hashFacts(source.donorFiles), 'b6cbdf102a347d0327c561778704eba54fc1556f601491cfecd33705d45ba684', 'Historical donor attribution changed');
for (const [file, sha256] of Object.entries(source.donorFiles)) {
  assert.match(file, /^(?:games\/pokemon-dungeon-reimagined\/content\/(?:species|effects|dungeons|onboarding)\/|tools\/pokemon-dungeon\/content\/steel\/)[a-z0-9-]+\.json$/);
  hash(sha256); // Historical hashes are attribution, not live-file dependencies.
}

const natures = ['hardy', 'docile', 'brave', 'jolly', 'impish', 'naive', 'timid', 'hasty', 'sassy', 'calm', 'relaxed', 'lonely', 'quirky'];
const pokemon = dex => `pokemon-${String(dex).padStart(3, '0')}`;
const heroes = [1, 4, 7, 25, 52, 54, 66, 104, 133, 152, 155, 158, 252, 255, 258, 300].map(pokemon);
const speciesIds = [...heroes, ...[10, 12, 16, 102, 191, 265].map(pokemon)].sort();
assert.deepEqual(algorithm.natureOrder, natures);
assert.deepEqual(algorithm.initialScores, Object.fromEntries(natures.map(nature => [nature, 0])));
assert.deepEqual(pick(algorithm.sampling, ['mainQuestionCount', 'maximumFollowUps', 'rejectUsedCategory', 'markEntireCategoryBeforePresentation', 'uniformCategoryDraw', 'rejectionConsumesMainSlot', 'followUpConsumesMainSlot', 'followUpConsumesCategory', 'applyTriggerScores', 'genderAfterMainQuestions']),
  { mainQuestionCount: 8, maximumFollowUps: 1, rejectUsedCategory: true, markEntireCategoryBeforePresentation: true, uniformCategoryDraw: false, rejectionConsumesMainSlot: false, followUpConsumesMainSlot: false, followUpConsumesCategory: false, applyTriggerScores: false, genderAfterMainQuestions: true });
assert.deepEqual(algorithm.sampling.selectableIndices, Array.from({ length: 55 }, (_, index) => index));
assert.deepEqual(pick(algorithm.sampling, ['followUpQuestionId', 'followUpTriggerOptionId', 'followUpSourceMenuValue']),
  { followUpQuestionId: 'brave-q2b', followUpTriggerOptionId: 'brave-q2a-a0', followUpSourceMenuValue: 99 });
assert.deepEqual(pick(algorithm.tieBreak, ['kind', 'randomStart', 'visitCountAfterStart', 'ascendingOrder', 'wrapModulus', 'replaceOnlyIfStrictlyGreater', 'uniformAmongMaxima']),
  { kind: 'circular-first-maximum', randomStart: true, visitCountAfterStart: 12, ascendingOrder: true, wrapModulus: 13, replaceOnlyIfStrictlyGreater: true, uniformAmongMaxima: false });
assert.deepEqual(algorithm.tieBreak.exampleTiedIds, ['hardy', 'docile']);
assert.deepEqual(algorithm.tieBreak.exampleIdealWeights, [12, 1]);
assert.deepEqual(algorithm.tieBreak.exampleUint16Weights, [60495, 5041]);
const buckets = count => Array.from({ length: count }, (_, index) => Math.ceil((index + 1) * 65536 / count) - Math.ceil(index * 65536 / count));
assert.deepEqual(algorithm.integerMapper.questionBucketSizes, buckets(55));
assert.deepEqual(algorithm.integerMapper.tieBucketSizes, buckets(13));
assert.equal(algorithm.integerMapper.nativeSequenceParityClaimed, false);

const sourceIds = unique(sources.sources), evidenceIds = unique(sources.evidence);
assert.equal(sources.sourceCommit, '6bcbec4f906938c0243aa2026bcbd41b577bab85');
assert.equal(sources.blueBinaryBuildVerified, false);
for (const record of sources.sources) {
  assert.match(record.url, /^https:\/\//);
  if (record.gitBlob !== null) assert.match(record.gitBlob, /^[a-f0-9]{40}$/);
  if (record.id.startsWith('red:')) assert(record.url.includes(sources.sourceCommit));
}
for (const record of sources.evidence) for (const id of record.sourceIds) assert(sourceIds.has(id), `Unknown evidence source: ${id}`);
function references(value) {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach(references); return; }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'evidenceId' || key.endsWith('EvidenceId')) assert(evidenceIds.has(child), `Unknown evidence: ${child}`);
    if (key === 'sourceId') assert(sourceIds.has(child), `Unknown source: ${child}`);
    if (key === 'textProvenanceId') assert.equal(child, sources.textProvenance.id);
    references(child);
  }
}
Object.values(documents).forEach(references);
unique(questions.records); unique(questions.records, 'originalIndex');
assert.equal(questions.records.length, 56);
assert.equal(unique(questions.records.flatMap(question => question.options), 'optionId').size, 140);
const questionFacts = questions.records.map((question, index) => {
  assert.equal(question.originalIndex, index);
  assert.equal(question.id, question.originalQuestionId.toLowerCase().replaceAll('_', '-'));
  assert.equal(question.selectable, index < 55);
  assert.equal(question.categoryId, index === 55 ? 'brave' : [...natures, 'misc'][Math.floor(index / 4)]);
  assert(typeof question.prompt === 'string' && question.prompt.length > 0);
  for (const [slot, option] of question.options.entries()) {
    const followUp = option.optionId === 'brave-q2a-a0';
    assert.equal(option.index, slot); assert.equal(option.optionId, `${question.id}-a${slot}`);
    assert.equal(option.originalAnswerId, `${question.originalQuestionId}_A${slot}`);
    assert.equal(option.originalMenuValue, followUp ? 99 : slot);
    assert.equal(option.followUp, followUp ? 'brave-q2b' : null);
    assert.equal(Object.keys(option.scores).length === 0, followUp);
    for (const [nature, score] of Object.entries(option.scores)) { assert(natures.includes(nature)); integer(score, 1, 4); }
    assert(typeof option.text === 'string' && option.text.length > 0);
  }
  const facts = { ...pick(question, ['id', 'originalIndex', 'sourceSymbol', 'originalQuestionId', 'categoryId', 'selectable']), options: question.options.map(option => pick(option, ['index', 'originalAnswerId', 'originalMenuValue', 'scores', 'followUp', 'optionId'])) };
  assert.equal(hashFacts(facts), question.factsSha256);
  return facts;
});
assert.equal(hashFacts(questionFacts), quizPins.questions);
assert.equal(algorithm.categories.length, 14);
for (const [index, category] of algorithm.categories.entries()) {
  const members = questions.records.filter(question => question.selectable && question.categoryId === category.id);
  assert.equal(category.id, [...natures, 'misc'][index]); assert.equal(category.originalCategoryIndex, index);
  assert.deepEqual(category.selectableQuestionIds, members.map(question => question.id));
  assert.equal(category.questionCount, index === 13 ? 3 : 4);
  assert.equal(category.firstDrawUint16Weight, members.reduce((sum, question) => sum + buckets(55)[question.originalIndex], 0));
}
const genderPairs = [[4, 25], [1, 152], [66, 4], [7, 158], [25, 104], [158, 133], [155, 258], [255, 300], [252, 255], [258, 1], [54, 7], [104, 54], [52, 252]];
const resultFacts = results.records.map(result => pick(result, ['natureId', 'maleSpeciesId', 'femaleSpeciesId']));
assert.deepEqual(resultFacts, natures.map((natureId, index) => ({ natureId, maleSpeciesId: pokemon(genderPairs[index][0]), femaleSpeciesId: pokemon(genderPairs[index][1]) })));
assert.equal(hashFacts(resultFacts), quizPins.genderResults);
assert.deepEqual(pick(results.gender, ['sourceValues', 'changesScores', 'changesResultColumn', 'directSpeciesOverride']),
  { sourceValues: { male: 0, female: 1 }, changesScores: false, changesResultColumn: true, directSpeciesOverride: false });

const species = unique(source.species), profiles = unique(source.profiles), levels = unique(source.levels), learns = unique(source.learnsets);
const moves = unique(source.identities.moves, 'originalId'), actions = unique(source.actions, 'internalId');
const types = unique(source.identities.types, 'originalId'), abilities = unique(source.identities.abilities, 'originalId');
assert.deepEqual([...species.keys()].sort(), speciesIds); assert.deepEqual([...profiles.keys()].sort(), speciesIds);
assert.equal(levels.size, 22); assert.equal(learns.size, 22); assert.equal(actions.size, 115);
for (const level of levels.values()) {
  assert.equal(level.id, `level-${digest(JSON.stringify(pick(level, ['baseStats', 'rows'])))}`);
  assert.equal(level.baseStats.length, 5); assert.equal(level.rows.length, 100);
  let previous = -1;
  for (const [index, row] of level.rows.entries()) {
    assert.equal(row.length, 6); row.forEach((value, slot) => integer(value, 0, slot === 0 ? 2147483647 : slot === 1 ? 65535 : 255));
    assert(row[0] > previous); previous = row[0]; if (index === 0) assert.deepEqual(row, [0, 0, 0, 0, 0, 0]);
  }
}
const selectedMoves = new Set([352, 355, 357]);
for (const learn of learns.values()) {
  assert.equal(learn.id, `learn-${digest(JSON.stringify(pick(learn, ['levelUp', 'auxiliary'])))}`);
  let previous = 0;
  for (const [level, move] of learn.levelUp) { integer(level, 1, 100); assert(level >= previous); previous = level; assert(moves.has(move) && actions.has(move)); selectedMoves.add(move); }
}
assert.deepEqual([...actions.keys()].sort((a, b) => a - b), [...selectedMoves].sort((a, b) => a - b));
for (const profile of profiles.values()) {
  const dex = Number(profile.speciesId.slice(-3));
  assert.equal(profile.internalId, dex <= 200 ? dex : dex + 25); assert.equal(profile.formId, null);
  assert(levels.has(profile.levelResourceId) && learns.has(profile.learnsetResourceId));
  for (const type of profile.typeIds) assert(types.has(type));
  for (const ability of profile.abilityIds) assert(ability === null || abilities.has(ability));
  const level = levels.get(profile.levelResourceId), cumulative = [...level.baseStats];
  const numericRows = level.rows.map((row, index) => { for (let stat = 0; stat < 5; stat++) cumulative[stat] += row[stat + 1]; return [index + 1, ...cumulative, row[0]]; });
  assert.equal(digest(JSON.stringify(numericRows)), profile.levelEvidence.redNumericTableSha256);
  if (profile.evidence.experience === 'upc-shared-original-corroborated-red') assert.equal(profile.levelEvidence.upcNumericTableSha256, profile.levelEvidence.redNumericTableSha256);
  else { assert.equal(profile.evidence.experience, 'red-comparative-only'); assert.equal(profile.levelEvidence.upcNumericTableSha256, null); }
}
const starts = unique(source.starterProfiles.records, 'speciesId');
assert.deepEqual([...starts.keys()].sort(), heroes);
const profileFacts = source.starterProfiles.records.map(profile => {
  const canonicalProfile = profiles.get(profile.speciesId), level = levels.get(canonicalProfile.levelResourceId), start = profile.firstPlayable;
  assert.deepEqual(profile.typeIds, canonicalProfile.typeIds); assert.equal(profile.originalInternalId, canonicalProfile.internalId);
  assert.equal(start.level, 5); assert.equal(start.cumulativeExp, level.rows[4][0]); assert.equal(start.currentHP, start.stats.hp);
  const learned = learns.get(canonicalProfile.learnsetResourceId).levelUp.filter(([at]) => at <= 5).slice(0, 4);
  assert.equal(start.moves.length, learned.length); assert.equal(start.emptyMoveSlots, 4 - learned.length);
  for (const [slot, move] of start.moves.entries()) {
    assert.deepEqual([move.learnedAtLevel, move.originalMoveId], learned[slot]); assert.equal(move.slot, slot);
    assert.equal(move.moveId, moves.get(move.originalMoveId).id);
    assert.equal(move.maximumPP, actions.get(move.originalMoveId).numeric.pp); assert.equal(move.currentPP, move.maximumPP);
    assert.equal(move.enabledForAI, true); assert.equal(move.linkedToPrevious, false); assert.equal(move.setForShortcut, false); assert.equal(move.ginsengBoost, 0);
  }
  for (const id of Object.values(profile.evidence)) assert(evidenceIds.has(id));
  return { ...pick(profile, ['speciesId', 'profileId', 'formId', 'originalInternalId', 'friendAreaId', 'typeIds', 'catalogResources']), ...start };
});
assert.equal(hashFacts(profileFacts), quizPins.startingProfiles);
assert.deepEqual(partners.orderedPool, [4, 1, 7, 25, 152, 158, 155, 255, 252, 258].map(pokemon));
assert.equal(hashFacts(partners.orderedPool), quizPins.partnerPool);
assert.deepEqual(pick(partners.policy, ['excludeAnySharedNonNoneType', 'preservePoolOrder', 'genderConditioned']), { excludeAnySharedNonNoneType: true, preservePoolOrder: true, genderConditioned: false });
assert.equal(partners.pairs.length, 129); assert.equal(new Set(partners.pairs.map(pair => `${pair.heroSpeciesId}/${pair.partnerSpeciesId}`)).size, 129);
for (const hero of starts.values()) {
  const allowed = partners.orderedPool.filter(id => !starts.get(id).typeIds.some(type => type !== 0 && hero.typeIds.includes(type)));
  const pairs = partners.pairs.filter(pair => pair.heroSpeciesId === hero.speciesId);
  assert.deepEqual(pairs.map(pair => pair.partnerSpeciesId), allowed);
  for (const pair of pairs) { assert.equal(pair.heroFormId, null); assert.equal(pair.partnerFormId, null); assert.deepEqual(pair.ownedFriendAreaIds, [...new Set([hero.friendAreaId, starts.get(pair.partnerSpeciesId).friendAreaId])]); }
}

const generations = unique(source.generations), encounters = unique(source.encounters);
assert.deepEqual(source.floors.map(floor => floor.id), ['tiny-woods-floor-01', 'tiny-woods-floor-02', 'tiny-woods-floor-03']);
for (const floor of source.floors) {
  assert.equal(floor.dungeonId, 'tiny-woods'); assert(generations.has(floor.generationId) && encounters.has(floor.encounterPoolId));
  const candidates = encounters.get(floor.encounterPoolId).rows.filter(row => row.entryRole === 'weighted-candidate');
  assert.deepEqual(candidates.map(row => [row.speciesId, row.level, row.selectionThreshold]), (floor.localFloor === 3 ? [[16, 2857], [102, 4286], [191, 7143], [265, 10000]] : [[16, 3333], [191, 6667], [265, 10000]]).map(([dex, threshold]) => [pokemon(dex), 1, threshold]));
}
const spawn = (await read('content/blue-wild-spawns.json')).data, gates = (await read('content/blue-secondary-gates.json')).data;
for (const facts of [spawn, gates]) assert.equal(facts.sourceCommit, '013475aa04f5be3191e5527c186d9bfceae7cae0');
assert.deepEqual(spawn.dungeon, { id: 'tiny-woods', randomMovementChance: 0 });
assert.deepEqual(spawn.species.map(row => [row.speciesId, row.internalId, row.bodySize, row.chanceAsleep]), [[pokemon(16), 16, 1, 8], [pokemon(102), 102, 1, 40], [pokemon(191), 191, 1, 5], [pokemon(265), 290, 1, 5]]);
assert.deepEqual(gates.records.map(row => [row.moveId, row.internalId, row.gate, row.chanceArgument]), [['move-mud-slap', 213, 'sub_805727C', 0], ['move-dynamic-punch', 246, 'sub_805727C', 0]]);
const chart = (await read('content/rule-runtime/type-matchups.json')).data;
assert.equal(chart.scope, 'original-rescue-team-type-table-facts'); assert.equal(chart.evidenceClass, 'original-red-engine-comparative');
assert.equal(chart.source.commit, '6bcbec4f906938c0243aa2026bcbd41b577bab85'); assert.equal(chart.source.symbol, 'gTypeEffectivenessChart'); hash(chart.source.sha256);
assert.deepEqual(chart.types, ['None', 'Normal', 'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel']);
assert.deepEqual(chart.classes, ['little', 'resist', 'neutral', 'super']); assert.equal(chart.cells.length, 18);
for (const row of chart.cells) { assert.equal(row.length, 18); assert(row.every(value => chart.classes.includes(value))); }
assert.equal(hashFacts(chart.cells), 'f89db28bece3867d49171cac70ce11ac2dfdad938aa29a10b81b4aa9d7a1fe30');
console.log('Blue JSON facts checked: 56 questions, eight main questions with category exclusion, follow-up/tie policies, 26 gender outcomes, 129 partner pairs, 16 starting loadouts, 22 profiles, 115 actions, three floors and 324 type cells. No game execution.');
