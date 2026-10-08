/** Pinned original-Red comparative data/monster/monster_data.json, adopted by
 * RULES-BROWSER-CONTRACT. These are percentage thresholds, not main-series
 * encounter rates. Species stats/moves remain in the accepted species catalog.
 * @type {Readonly<Record<string,number>>} */
export const OPENING_SLEEP_CHANCES = Object.freeze({ 'pokemon-016': 8, 'pokemon-191': 5, 'pokemon-265': 5, 'pokemon-102': 40 });
/** Native ResetMonEntityData and SetDefaultIQSkills(FALSE), source pokemon_3.c.
 * @type {readonly import('../../src/contracts/campaign.js').IqSkillId[]} */
export const DEFAULT_IQ = Object.freeze(/** @type {import('../../src/contracts/campaign.js').IqSkillId[]} */ (['iq-item-catcher', 'iq-course-checker', 'iq-item-master']));
