/**
 * Opening-only personality and partner selection.
 * Factual scoring/order comes from the qualified onboarding catalog. Text is
 * the repository's original English adaptation, not a commercial-script dump.
 */

/** @typedef {{index:number, optionId:string, text:string, scores:Record<string,number>, followUp:string|null}} QuizOption */
/** @typedef {{id:string, originalIndex:number, categoryId:string, selectable:boolean, prompt:string, options:QuizOption[]}} QuizQuestion */
/** @typedef {{natureId:string,description:string,maleSpeciesId:string,femaleSpeciesId:string}} NatureResult */
/** @typedef {{questions:QuizQuestion[],results:NatureResult[],natureOrder:string[],partnerOrder:string[],pairs:{heroSpeciesId:string,partnerSpeciesId:string}[]}} OnboardingData */
/** @typedef {{scores:Record<string,number>,usedCategories:string[],answered:number,questionId:string|null,followUp:boolean}} QuizState */

/** @type {Readonly<Record<string,string>>} */
export const SPECIES_NAMES = Object.freeze({
  'pokemon-001': 'Bulbasaur', 'pokemon-004': 'Charmander',
  'pokemon-007': 'Squirtle', 'pokemon-025': 'Pikachu',
  'pokemon-052': 'Meowth', 'pokemon-054': 'Psyduck',
  'pokemon-066': 'Machop', 'pokemon-104': 'Cubone',
  'pokemon-133': 'Eevee', 'pokemon-152': 'Chikorita',
  'pokemon-155': 'Cyndaquil', 'pokemon-158': 'Totodile',
  'pokemon-252': 'Treecko', 'pokemon-255': 'Torchic',
  'pokemon-258': 'Mudkip', 'pokemon-300': 'Skitty',
  'pokemon-010': 'Caterpie', 'pokemon-012': 'Butterfree',
  'pokemon-016': 'Pidgey', 'pokemon-191': 'Sunkern',
  'pokemon-265': 'Wurmple', 'pokemon-102': 'Exeggcute',
});

/** @param {string} id */
export function speciesName(id) { return SPECIES_NAMES[id] ?? 'Pokémon'; }

/** @param {string} filename @param {AbortSignal} [signal] */
async function readCatalog(filename, signal) {
  const url = new URL(`../../content/onboarding/${filename}.json`, import.meta.url);
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Unable to load personality data (${response.status}).`);
  const text = await response.text();
  if (text.length > 200000) throw new Error('Personality data is unexpectedly large.');
  return JSON.parse(text);
}

/** @param {AbortSignal} [signal] @returns {Promise<OnboardingData>} */
export async function loadOnboarding(signal) {
  const [questions, results, partners, algorithm] = await Promise.all([
    readCatalog('questions', signal), readCatalog('results', signal),
    readCatalog('partners', signal), readCatalog('algorithm', signal),
  ]);
  if (questions.records?.length !== 56 || results.records?.length !== 13 ||
      partners.orderedPool?.length !== 10 || algorithm.natureOrder?.length !== 13) {
    throw new Error('The opening personality catalog is incomplete.');
  }
  return {
    questions: questions.records, results: results.records,
    natureOrder: algorithm.natureOrder, partnerOrder: partners.orderedPool,
    pairs: partners.pairs,
  };
}

/** Original integer mapping; the browser seed is intentionally independent. @param {number} limit */
function draw(limit) {
  const words = new Uint16Array(1);
  window.crypto.getRandomValues(words);
  return Math.floor((words[0] ?? 0) * limit / 65536);
}

/** @param {OnboardingData} data @returns {QuizState} */
export function createQuiz(data) {
  return {
    scores: Object.fromEntries(data.natureOrder.map(nature => [nature, 0])),
    usedCategories: [], answered: 0, questionId: null, followUp: false,
  };
}

/** @param {QuizState} state @param {OnboardingData} data @returns {QuizQuestion|null} */
export function currentQuestion(state, data) {
  return data.questions.find(question => question.id === state.questionId) ?? null;
}

/** Draw a question index and reject used categories, as the original does.
 * @param {QuizState} state @param {OnboardingData} data @returns {QuizQuestion|null}
 */
export function nextQuestion(state, data) {
  if (state.answered >= 8) { state.questionId = null; return null; }
  const selectable = data.questions.filter(question => question.selectable);
  if (!selectable.some(question => !state.usedCategories.includes(question.categoryId))) {
    throw new Error('No unused personality category remains.');
  }
  // Each random rejection consumes another draw, not another question slot.
  // Yielding to the browser is unnecessary: eight of fourteen categories are used.
  for (let attempt = 0; attempt < 4096; attempt += 1) {
    const question = selectable[draw(55)];
    if (!question || state.usedCategories.includes(question.categoryId)) continue;
    state.usedCategories.push(question.categoryId);
    state.questionId = question.id;
    state.followUp = false;
    return question;
  }
  throw new Error('Unable to draw a new personality question. Please try again.');
}

/** @param {QuizState} state @param {OnboardingData} data @param {number} index */
export function answerQuestion(state, data, index) {
  const question = currentQuestion(state, data);
  const option = question?.options[index];
  if (!question || !option) return false;
  if (option.followUp) {
    const followUp = data.questions.find(candidate => candidate.id === option.followUp);
    if (!followUp || followUp.selectable) throw new Error('Invalid personality follow-up.');
    state.questionId = followUp.id;
    state.followUp = true;
    return true;
  }
  for (const [nature, points] of Object.entries(option.scores)) {
    if (!(nature in state.scores)) throw new Error('Invalid personality score.');
    state.scores[nature] = (state.scores[nature] ?? 0) + points;
  }
  state.answered += 1;
  state.questionId = null;
  state.followUp = false;
  return true;
}

/** A random start followed by cyclic strict-maximum selection; ties are not uniform.
 * @param {QuizState} state @param {OnboardingData} data
 * @returns {NatureResult}
 */
export function finishQuiz(state, data) {
  if (state.answered !== 8) throw new Error('The personality test is not complete.');
  const start = draw(data.natureOrder.length);
  let best = data.natureOrder[start];
  if (!best) throw new Error('The personality result is unavailable.');
  for (let offset = 1; offset < data.natureOrder.length; offset += 1) {
    const candidate = data.natureOrder[(start + offset) % data.natureOrder.length];
    if (candidate && (state.scores[candidate] ?? 0) > (state.scores[best] ?? 0)) best = candidate;
  }
  const result = data.results.find(record => record.natureId === best);
  if (!result) throw new Error('The personality result is unavailable.');
  return result;
}

/** @param {OnboardingData} data @param {string} heroSpeciesId */
export function eligiblePartners(data, heroSpeciesId) {
  const eligible = new Set(data.pairs.filter(pair => pair.heroSpeciesId === heroSpeciesId)
    .map(pair => pair.partnerSpeciesId));
  return data.partnerOrder.filter(id => eligible.has(id));
}

/** The English pixel alphabet supports printable Latin characters.
 * @param {string} value
 */
export function sanitizeName(value) {
  return Array.from(value.normalize('NFC')).filter(character => {
    const code = character.codePointAt(0) ?? 0;
    return code >= 32 && code <= 126 || character === 'é';
  }).slice(0, 10).join('');
}

/** The original name field holds ten characters. @param {string} value @param {string} fallback */
export function normalizeName(value, fallback) { return sanitizeName(value).trim() || fallback; }
