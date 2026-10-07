import { freezeData } from '../../src/domain/state/validate.js';

/** Early ordinary-job facts; Red comparative6bcbec4f, not Blue binary proof.
 * src/items.c SHA-256 b7fb55af3420e0afd9df767d0abda097e91c171882f3374672867afe17d16d5c
 * src/dungeon_info.c SHA-256 6ccf672c31673187bb796aa3efba549b4c7fcfedef4c306702340d111597a871
 * src/data/pokemon_mail_pre.h SHA-256 2858a138d0ece2012ebe0d2366c0afc0495dfdf44b72c7134912a3ebff483458
 * src/data/pokemon_mail.h SHA-256 689d93abdbf183e6953f1392c64782927a449c6049d694dd0bef465cad9741a7
 * include/constants/monster.h SHA-256 e7c8795acd4d98f29ef50c7e1af9bb250a3e4bb07b6070b5a6d866c8da8265f9
 * src/pokemon_3.c SHA-256 4198a6531fe283e0a13aba9cb613c7425f778072098647cad8b9d37d3bf2155b
 * src/code_803C1B4.c SHA-256 03f622b11bb45539b0713ef3b2a9756d69f61721cfc47a129a1b86006704805f
 * src/code_80958E8.c SHA-256 00669bfa30bdd675360b2134063ed1528f63f62e06291a4d331c3a12f46a8c9a
 * src/dungeon_data.c SHA-256 ca56c6807cb1a2918e9fee4bf4f8410fbde21ad52e3bcbfdffaa6d5766af66b4
 * src/friend_area.c SHA-256 6b675a3aa0dcddcfae224fc427efea4259c43bc01cecc8b348934c306c197ca8
 * include/constants/friend_area.h SHA-256 0b69749ffafdb948cb0114c254965f28da36897593e9c9b0d3adacbda75880d4
 * Static exporter proves no eligible pair/favorite-item substitution in this
 * finite seen pool. Generation still consumes the native subtype sample.
 */
export const EARLY_JOB_FACTS = freezeData({
  "routes": [
    {
      "dungeonId": "tiny-woods",
      "nativeDungeonId": 0,
      "floorNumbers": [
        2,
        3
      ],
      "missionDifficulty": 1,
      "rankPoints": 5,
      "targetItemIds": [
        "item-oran-berry",
        "item-pecha-berry"
      ]
    },
    {
      "dungeonId": "thunderwave-cave",
      "nativeDungeonId": 1,
      "floorNumbers": [
        3,
        4,
        5
      ],
      "missionDifficulty": 1,
      "rankPoints": 5,
      "targetItemIds": [
        "item-oran-berry",
        "item-pecha-berry",
        "item-cheri-berry",
        "item-sleep-seed",
        "item-blast-seed",
        "item-apple"
      ]
    }
  ],
  "eligibleSeenSpecies": [
    "pokemon-016",
    "pokemon-019",
    "pokemon-029",
    "pokemon-100",
    "pokemon-102",
    "pokemon-191",
    "pokemon-239",
    "pokemon-261",
    "pokemon-265",
    "pokemon-312"
  ],
  "fallbackClient": "pokemon-016",
  "fallbackTarget": "pokemon-265",
  "rewardCategories": [
    {
      "category": "thrown_arc",
      "threshold": 4000
    },
    {
      "category": "berries_seeds_vitamins",
      "threshold": 10000
    }
  ],
  "rewardItems": [
    {
      "itemId": "item-gravelerock",
      "category": "thrown_arc",
      "threshold": 10000
    },
    {
      "itemId": "item-reviver-seed",
      "category": "berries_seeds_vitamins",
      "threshold": 4000
    },
    {
      "itemId": "item-cheri-berry",
      "category": "berries_seeds_vitamins",
      "threshold": 6000
    },
    {
      "itemId": "item-max-elixir",
      "category": "berries_seeds_vitamins",
      "threshold": 10000
    }
  ],
  "unownedNativeMailAreaIds": [
    10,
    14,
    35,
    36
  ]
});
