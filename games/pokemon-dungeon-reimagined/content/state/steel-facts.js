/** Pinned Red comparative monster_data.json@6bcbec4f; no Blue binary claim.
 * Fixed actors skip spawn-sleep entirely: SpawnWildMon(...,TRUE), nonzero
 * native behavior, dungeon_generation_fixed.c43-67 / dungeon_mon_spawn.c513-523.
 * Ordinary probabilities below retain the real native species crosswalk.
 * @type {Readonly<Record<string,number>>} */
export const STEEL_SLEEP_CHANCES = Object.freeze({
  'pokemon-021': 25, 'pokemon-263': 20, 'pokemon-304': 8,
  'pokemon-343': 10, 'pokemon-074': 5, 'pokemon-236': 8,
  'pokemon-307': 15, 'pokemon-374': 12, 'pokemon-127': 20,
});
/** Entire source floor pool is materialized, even when its optional use consumer
 * is still gated. No item reroll/filter substitutes a supported item. */
export const STEEL_FLOOR_ITEMS = Object.freeze(['item-gravelerock', 'item-oran-berry', 'item-pecha-berry', 'item-cheri-berry', 'item-blast-seed', 'item-max-elixir', 'item-white-gummi', 'item-orange-gummi', 'item-poke', 'item-switcher-orb', 'item-blowback-orb', 'item-warp-orb', 'item-petrify-orb', 'item-escape-orb', 'item-hurl-orb']);
