import { EARLY_JOB_FACTS } from './early-job-facts.js';
import { freezeData } from '../../src/domain/state/validate.js';
/** Native source joins: code_80958E8, dungeon_info, pokemon_mail and item masks.
 * Frozen early facts remain unchanged for every predecessor. */
export const FRIEND_JOB_FACTS = freezeData({ ...EARLY_JOB_FACTS,
  routes: [...EARLY_JOB_FACTS.routes.map(row => ({ ...row, excludedFloorNumbers: /** @type {number[]} */ ([]) })), {"nativeDungeonId": 2, "dungeonId": "mt-steel", "floorNumbers": [5, 6, 7, 8, 9], "excludedFloorNumbers": [9], "targetItemIds": ["item-oran-berry", "item-pecha-berry", "item-cheri-berry", "item-blast-seed", "item-max-elixir", "item-white-gummi", "item-orange-gummi", "item-switcher-orb", "item-blowback-orb", "item-warp-orb", "item-petrify-orb", "item-escape-orb", "item-hurl-orb"]}],
  eligibleSeenSpecies: ["pokemon-016", "pokemon-019", "pokemon-021", "pokemon-029", "pokemon-074", "pokemon-100", "pokemon-102", "pokemon-127", "pokemon-191", "pokemon-236", "pokemon-239", "pokemon-261", "pokemon-263", "pokemon-265", "pokemon-304", "pokemon-307", "pokemon-312", "pokemon-343", "pokemon-374"],
  favoriteItems: [['pokemon-307','item-orange-gummi'],['pokemon-021','item-white-gummi'],['pokemon-019','item-white-gummi'],['pokemon-263','item-white-gummi'],['pokemon-236','item-orange-gummi'],['pokemon-016','item-white-gummi']],
});
