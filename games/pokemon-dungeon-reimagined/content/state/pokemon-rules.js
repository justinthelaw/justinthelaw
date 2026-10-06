/** Authored canonical crosswalks; facts from pinned original Red comparison.
 * See plan/STATE-PROFILE-POKEMON.md. Sentinels/unused tactics are not identities. */
/** @typedef {import('../../src/contracts/campaign.js').IqSkillId} IqSkillId */
/** @typedef {import('../../src/contracts/campaign.js').TacticId} TacticId */
/** @type {readonly Readonly<{id:IqSkillId,sourceSymbol:string,minimumIq:number,group:number}>[]} */
export const IQ_SKILLS = Object.freeze([
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-type-advantage-master'), sourceSymbol: 'IQ_TYPE_ADVANTAGE_MASTER', minimumIq: 105, group: 4 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-item-catcher'), sourceSymbol: 'IQ_ITEM_CATCHER', minimumIq: 1, group: 1 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-course-checker'), sourceSymbol: 'IQ_COURSE_CHECKER', minimumIq: 1, group: 2 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-sure-hit-attacker'), sourceSymbol: 'IQ_SURE_HIT_ATTACKER', minimumIq: 500, group: 4 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-quick-dodger'), sourceSymbol: 'IQ_QUICK_DODGER', minimumIq: 100, group: 4 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-pp-checker'), sourceSymbol: 'IQ_PP_CHECKER', minimumIq: 2, group: 6 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-nontraitor'), sourceSymbol: 'IQ_NONTRAITOR', minimumIq: 40, group: 7 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-status-checker'), sourceSymbol: 'IQ_STATUS_CHECKER', minimumIq: 25, group: 8 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-exp-go-getter'), sourceSymbol: 'IQ_EXP_GO_GETTER', minimumIq: 200, group: 9 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-efficiency-expert'), sourceSymbol: 'IQ_EFFICIENCY_EXPERT', minimumIq: 10, group: 9 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-weak-type-picker'), sourceSymbol: 'IQ_WEAK_TYPE_PICKER', minimumIq: 125, group: 9 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-all-terrain-hiker'), sourceSymbol: 'IQ_ALL_TERRAIN_HIKER', minimumIq: 400, group: 10 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-super-mobile'), sourceSymbol: 'IQ_SUPER_MOBILE', minimumIq: 990, group: 10 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-trap-avoider'), sourceSymbol: 'IQ_TRAP_AVOIDER', minimumIq: 140, group: 11 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-house-avoider'), sourceSymbol: 'IQ_HOUSE_AVOIDER', minimumIq: 800, group: 11 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-energy-saver'), sourceSymbol: 'IQ_ENERGY_SAVER', minimumIq: 250, group: 14 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-nonsleeper'), sourceSymbol: 'IQ_NONSLEEPER', minimumIq: 160, group: 14 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-self-curer'), sourceSymbol: 'IQ_SELF_CURER', minimumIq: 70, group: 14 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-trap-seer'), sourceSymbol: 'IQ_TRAP_SEER', minimumIq: 600, group: 16 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-lava-evader'), sourceSymbol: 'IQ_LAVA_EVADER', minimumIq: 300, group: 16 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-dedicated-traveler'), sourceSymbol: 'IQ_DEDICATED_TRAVELER', minimumIq: 1, group: 9 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-item-master'), sourceSymbol: 'IQ_ITEM_MASTER', minimumIq: 1, group: 17 }),
  Object.freeze({ id: /** @type {IqSkillId} */ ('iq-exclusive-move-user'), sourceSymbol: 'IQ_EXCLUSIVE_MOVE_USER', minimumIq: 1, group: 6 }),
 ]);
/** @type {readonly Readonly<{id:TacticId,sourceSymbol:string,leaderLevel:number}>[]} */
export const TACTICS = Object.freeze([
  Object.freeze({ id: /** @type {TacticId} */ ('tactic-lets-go-together'), sourceSymbol: 'TACTIC_LETS_GO_TOGETHER', leaderLevel: 1 }),
  Object.freeze({ id: /** @type {TacticId} */ ('tactic-go-the-other-way'), sourceSymbol: 'TACTIC_GO_THE_OTHER_WAY', leaderLevel: 25 }),
  Object.freeze({ id: /** @type {TacticId} */ ('tactic-go-after-foes'), sourceSymbol: 'TACTIC_GO_AFTER_FOES', leaderLevel: 1 }),
  Object.freeze({ id: /** @type {TacticId} */ ('tactic-avoid-the-first-hit'), sourceSymbol: 'TACTIC_AVOID_THE_FIRST_HIT', leaderLevel: 1 }),
  Object.freeze({ id: /** @type {TacticId} */ ('tactic-avoid-trouble'), sourceSymbol: 'TACTIC_AVOID_TROUBLE', leaderLevel: 35 }),
  Object.freeze({ id: /** @type {TacticId} */ ('tactic-be-patient'), sourceSymbol: 'TACTIC_BE_PATIENT', leaderLevel: 40 }),
  Object.freeze({ id: /** @type {TacticId} */ ('tactic-keep-your-distance'), sourceSymbol: 'TACTIC_KEEP_YOUR_DISTANCE', leaderLevel: 20 }),
  Object.freeze({ id: /** @type {TacticId} */ ('tactic-wait-there'), sourceSymbol: 'TACTIC_WAIT_THERE', leaderLevel: 15 }),
  Object.freeze({ id: /** @type {TacticId} */ ('tactic-get-away'), sourceSymbol: 'TACTIC_GET_AWAY', leaderLevel: 10 }),
]);

/** Bounded diagnostics shared by these two policies; invalid wins over missing facts. */
export function diagnostics() {
  /** @type {import('../../src/contracts/campaign.js').StateIssue[]} */ const issues = [];
  /** @type {Set<string>} */ const requirements = new Set();
  return {
    /** @param {unknown} condition @param {string} path @param {string} message */
    check(condition, path, message) { if (!condition && issues.length < 100) issues.push({ code: 'relationship', path, message }); },
    /** @param {string} id */
    need(id) { if (requirements.size < 100) requirements.add(id); },
    /** @returns {import('../../src/contracts/campaign.js').RuleCheck} */
    result() { return issues.length ? { ok: false, kind: 'invalid', issues } : requirements.size ? { ok: false, kind: 'unresolved', requirementIds: [...requirements] } : { ok: true }; },
  };
}
/** @param {number} value @param {number} min @param {number} max */
export function bounded(value, min, max) { return Number.isSafeInteger(value) && value >= min && value <= max; }
/** @param {import('../../src/contracts/campaign.js').SpeciesForm} a @param {import('../../src/contracts/campaign.js').SpeciesForm} b */
export function sameForm(a, b) { return a.speciesId === b.speciesId && a.formId === b.formId; }

/** Native name input has ten cells and rejects only zero length. Width changes
 * rendering, not the END acceptance branch. Keyboard bytes 85/91/92/93/94/
 * BD/BE/E9 map through explicit Unicode code points in the pinned charmap. One code point is
 * one source cell for this finite repertoire; no general Unicode width guess.
 * @param {string} name @param {string} defaultName @param {ReturnType<typeof diagnostics>} report @param {string} path
 */
export function checkName(name, defaultName, report, path) {
  report.check(name.length > 0 && [...name].length <= 10 && [...name].every(char => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127), path, 'Name requires one to ten native character cells and no control characters.');
  if (name !== defaultName && !/^[A-Za-z0-9 +,\-.!?:⋯\u2018\u2019\u201c\u201d♂♀é]+$/u.test(name)) report.need('P19:name-native-glyph-crosswalk');
}

/** Admission at the setting command boundary uses the selected dungeon leader.
 * This is not proof that a persisted tactic was selected by a historical leader.
 * @param {TacticId} tacticId @param {number} leaderLevel
 * @returns {import('../../src/contracts/campaign.js').RuleCheck} */
export function validateTacticSelection(tacticId, leaderLevel) {
  const report = diagnostics();
  const tactic = TACTICS.find(row => row.id === tacticId);
  report.check(tactic && bounded(leaderLevel, 1, 100) && leaderLevel >= tactic.leaderLevel, '', 'Tactic requires its sourced dungeon-leader level and a supported identity.');
  return report.result();
}
