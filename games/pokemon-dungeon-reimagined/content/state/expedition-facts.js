import { OPENING_SLEEP_CHANCES } from './opening-facts.js';

/** R monster_data.json at 6bcbec4f; original-Red comparative, not Blue proof.
 * Separate from immutable predecessor constants.
 * @type {Readonly<Record<string,number>>} */
export const SPAWN_SLEEP_CHANCES = Object.freeze({ ...OPENING_SLEEP_CHANCES,
  'pokemon-019': 10, 'pokemon-029': 15, 'pokemon-261': 8,
  'pokemon-100': 0, 'pokemon-239': 8, 'pokemon-311': 8, 'pokemon-312': 8,
});
/** No exclusive species entitlement is available before first-request return.
 * The same predicate feeds initial placement and periodic arrival rejection.
 * @param {Readonly<import('../dungeons.js').EncounterPool['rows'][number]>} row */
export const eligibleEncounter = row => row.entryRole === 'weighted-candidate' && row.speciesId !== null && row.blueGate === 'default-available' && row.applicabilityPredicate === 'ordinary-floor-candidate';
