/** Browser entropy is deliberately separate from campaign streams. Preserve the
 * sourced low-16-bit product mapper and circular-first-maximum tie rule, without
 * claiming cartridge sequence parity. This controller owns only uncommitted quiz.
 * @param {import('../../content/onboarding.js').OnboardingCatalog} catalog */
export function createQuiz(catalog) {
  const algorithm = catalog.getAlgorithm();
  const scores = { ...algorithm.initialScores };
  const used = new Set();
  let count = 0;
  /** @type {import('../../content/onboarding.js').QuizQuestion|null} */ let question = null;
  let followUp = false;
  /** @param {number} maximum */
  function draw(maximum) {
    const word = window.crypto.getRandomValues(new Uint32Array(1))[0];
    if (word === undefined) throw new Error('Quiz entropy is unavailable.');
    return Math.floor((word & algorithm.integerMapper.nativeInputMask) * maximum / algorithm.integerMapper.denominator);
  }
  function next() {
    if (count >= algorithm.sampling.mainQuestionCount) { question = null; return; }
    // A bounded failure is recoverable; never introduce a biased fallback draw.
    for (let attempt = 0; attempt < 4096; attempt++) {
      const candidate = catalog.getSelectableQuestion(draw(algorithm.integerMapper.questionMaximumExclusive));
      if (used.has(candidate.categoryId)) continue;
      used.add(candidate.categoryId); count++; question = candidate; return;
    }
    throw new Error('Quiz sampling could not complete. Start a new quiz.');
  }
  next();
  return {
    current: () => question,
    progress: () => ({ count, total: algorithm.sampling.mainQuestionCount, followUp }),
    /** @param {string} optionId */
    answer(optionId) {
      const option = question?.options.find(row => row.optionId === optionId);
      if (!option) throw new Error('This answer is no longer available.');
      if (!option.followUp || algorithm.sampling.applyTriggerScores) for (const [id, points] of Object.entries(option.scores)) scores[id] = (scores[id] ?? 0) + points;
      if (option.followUp) { question = catalog.getQuestion(option.followUp); followUp = true; }
      else { followUp = false; next(); }
    },
    result() {
      if (question) throw new Error('Complete the quiz first.');
      const start = draw(algorithm.integerMapper.tieMaximumExclusive);
      let winner = algorithm.natureOrder[start];
      if (!winner) throw new Error('Missing quiz nature.');
      for (let visit = 1; visit <= algorithm.tieBreak.visitCountAfterStart; visit++) {
        const id = algorithm.natureOrder[(start + visit) % algorithm.tieBreak.wrapModulus];
        if (id && (scores[id] ?? 0) > (scores[winner] ?? 0)) winner = id;
      }
      return winner;
    },
  };
}

/** @returns {import('../contracts.js').RandomWords} */
export function campaignSeed() {
  const words = window.crypto.getRandomValues(new Uint32Array(4));
  if (words.every(word => word === 0)) return campaignSeed();
  return [words[0] ?? 0, words[1] ?? 0, words[2] ?? 0, words[3] ?? 0];
}

/** Application defaults are presentation preferences, never game-rule defaults.
 * @returns {import('../contracts/campaign.js').CampaignOptions} */
export function initialOptions() {
  return { audio: { master: .5, music: .35, effects: .5, muted: true }, reducedMotion: 'system',
    camera: { invertOrbitX: false, invertOrbitY: false, sensitivity: 1, zoom: 8 }, controls: { overlay: 'auto' },
    map: { showExplored: true, showMoveRange: false }, accessibility: { textScale: 1, highContrast: false, colorIndependentIndicators: true } };
}
