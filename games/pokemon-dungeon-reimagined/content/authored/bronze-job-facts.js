import { freezeData } from '../../src/domain/state/validate.js';
/** Parser-only pinned Bronze facts; no native assets or executable source. */
export const BRONZE_JOB_FACTS = freezeData({
  "commit": "6bcbec4f906938c0243aa2026bcbd41b577bab85",
  "qualification": "pinned-red-comparative-not-blue-binary-proof",
  "sourceFiles": [
    {
      "path": "src/dungeon_info.c",
      "sha256": "6ccf672c31673187bb796aa3efba549b4c7fcfedef4c306702340d111597a871",
      "locators": "704\u2013773;2763\u20132782"
    },
    {
      "path": "src/code_803C1B4.c",
      "sha256": "03f622b11bb45539b0713ef3b2a9756d69f61721cfc47a129a1b86006704805f",
      "locators": "12\u2013139;205\u2013238"
    },
    {
      "path": "src/code_80958E8.c",
      "sha256": "00669bfa30bdd675360b2134063ed1528f63f62e06291a4d331c3a12f46a8c9a",
      "locators": "175\u2013405;574\u2013645;947\u2013974"
    },
    {
      "path": "src/data/pokemon_mail_pre.h",
      "sha256": "2858a138d0ece2012ebe0d2366c0afc0495dfdf44b72c7134912a3ebff483458",
      "locators": "3\u201320;98\u2013106"
    },
    {
      "path": "src/dungeon_data.c",
      "sha256": "ca56c6807cb1a2918e9fee4bf4f8410fbde21ad52e3bcbfdffaa6d5766af66b4",
      "locators": "Wonder Mail area unlock rows"
    },
    {
      "path": "include/constants/friend_area.h",
      "sha256": "0b69749ffafdb948cb0114c254965f28da36897593e9c9b0d3adacbda75880d4",
      "locators": "10,14,35,36 identity constants"
    },
    {
      "path": "include/constants/monster.h",
      "sha256": "e7c8795acd4d98f29ef50c7e1af9bb250a3e4bb07b6070b5a6d866c8da8265f9",
      "locators": "six pair identities"
    },
    {
      "path": "src/mission_reward.c",
      "sha256": "ffb3feaf9fcbb4322640d3fff4d1c6435841cbbfef90cf03f25585e1ff4edb15",
      "locators": "192\u2013338"
    },
    {
      "path": "src/thank_you_messages.c",
      "sha256": "f33779e8f609e57ea52eabcbe80fcd4ed5739be6feaeb9e8180257e9940b19ec",
      "locators": "55\u201381;135\u2013179 client/target thanks and exclusive unlock"
    },
    {
      "path": "src/exclusive_pokemon.c",
      "sha256": "ee3d2acf14425d4e20c82e151de7dcde0881e929175c528b1b77814eb16a8241",
      "locators": "24\u201332 Red initializer;136\u2013147 exclusive identity unlock"
    },
    {
      "path": "include/exclusive_pokemon.h",
      "sha256": "e27ce157cd51abb7c521ea9f684ccf6a77b505995878b6302bbccc6780f0703d",
      "locators": "35\u201341 Blue default availability macro"
    },
    {
      "path": "src/script_vars_info.c",
      "sha256": "e68b36e69287694f2b7978e77ed07ee86efbe54bdd6f41a3ff130beebe433dca",
      "locators": "77 EVENT_B01P01 distinct16-bit array"
    },
    {
      "path": "include/items.h",
      "sha256": "4cf80c488631b8adacd21e8d8eff57ba07c408ec2ef59763cea430075e3e3c5d",
      "locators": "12 inclusive threshold contract"
    }
  ],
  "difficulty": 3,
  "rankIndex": 1,
  "rankPoints": 20,
  "rewardCategories": [
    {
      "category": "thrown_arc",
      "threshold": 800
    },
    {
      "category": "berries_seeds_vitamins",
      "threshold": 3200
    },
    {
      "category": "food_gummies",
      "threshold": 8000
    },
    {
      "category": "held_items",
      "threshold": 9200
    },
    {
      "category": "tms_hms",
      "threshold": 10000
    }
  ],
  "rewardItems": [
    {
      "itemId": "item-gravelerock",
      "category": "thrown_arc",
      "threshold": 10000,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-persim-band",
      "category": "held_items",
      "threshold": 2500,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-power-band",
      "category": "held_items",
      "threshold": 5000,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-pecha-scarf",
      "category": "held_items",
      "threshold": 7500,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-special-band",
      "category": "held_items",
      "threshold": 10000,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-heal-seed",
      "category": "berries_seeds_vitamins",
      "threshold": 2500,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-reviver-seed",
      "category": "berries_seeds_vitamins",
      "threshold": 5000,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-max-elixir",
      "category": "berries_seeds_vitamins",
      "threshold": 10000,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-white-gummi",
      "category": "food_gummies",
      "threshold": 588,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-red-gummi",
      "category": "food_gummies",
      "threshold": 1176,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-blue-gummi",
      "category": "food_gummies",
      "threshold": 1765,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-grass-gummi",
      "category": "food_gummies",
      "threshold": 2353,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-yellow-gummi",
      "category": "food_gummies",
      "threshold": 2941,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-clear-gummi",
      "category": "food_gummies",
      "threshold": 3529,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-orange-gummi",
      "category": "food_gummies",
      "threshold": 4118,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-pink-gummi",
      "category": "food_gummies",
      "threshold": 4706,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-brown-gummi",
      "category": "food_gummies",
      "threshold": 5294,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-sky-gummi",
      "category": "food_gummies",
      "threshold": 5882,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-gold-gummi",
      "category": "food_gummies",
      "threshold": 6471,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-green-gummi",
      "category": "food_gummies",
      "threshold": 7059,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-gray-gummi",
      "category": "food_gummies",
      "threshold": 7647,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-purple-gummi",
      "category": "food_gummies",
      "threshold": 8235,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-royal-gummi",
      "category": "food_gummies",
      "threshold": 8824,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-black-gummi",
      "category": "food_gummies",
      "threshold": 9412,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-silver-gummi",
      "category": "food_gummies",
      "threshold": 10000,
      "payload": {
        "kind": "none"
      }
    },
    {
      "itemId": "item-tm-calm-mind",
      "category": "tms_hms",
      "threshold": 357,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-calm-mind"
      }
    },
    {
      "itemId": "item-tm-roar",
      "category": "tms_hms",
      "threshold": 1071,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-roar"
      }
    },
    {
      "itemId": "item-tm-bullet-seed",
      "category": "tms_hms",
      "threshold": 1429,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-bullet-seed"
      }
    },
    {
      "itemId": "item-tm-hidden-power",
      "category": "tms_hms",
      "threshold": 2143,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-hidden-power"
      }
    },
    {
      "itemId": "item-tm-taunt",
      "category": "tms_hms",
      "threshold": 2857,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-taunt"
      }
    },
    {
      "itemId": "item-tm-ice-beam",
      "category": "tms_hms",
      "threshold": 3214,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-ice-beam"
      }
    },
    {
      "itemId": "item-tm-light-screen",
      "category": "tms_hms",
      "threshold": 3571,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-light-screen"
      }
    },
    {
      "itemId": "item-tm-frustration",
      "category": "tms_hms",
      "threshold": 3929,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-frustration"
      }
    },
    {
      "itemId": "item-tm-thunderbolt",
      "category": "tms_hms",
      "threshold": 4286,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-thunderbolt"
      }
    },
    {
      "itemId": "item-tm-return",
      "category": "tms_hms",
      "threshold": 4643,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-return"
      }
    },
    {
      "itemId": "item-tm-dig",
      "category": "tms_hms",
      "threshold": 5000,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-dig"
      }
    },
    {
      "itemId": "item-tm-brick-break",
      "category": "tms_hms",
      "threshold": 5357,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-brick-break"
      }
    },
    {
      "itemId": "item-tm-reflect",
      "category": "tms_hms",
      "threshold": 5714,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-reflect"
      }
    },
    {
      "itemId": "item-tm-shock-wave",
      "category": "tms_hms",
      "threshold": 6071,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-shock-wave"
      }
    },
    {
      "itemId": "item-tm-torment",
      "category": "tms_hms",
      "threshold": 6786,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-torment"
      }
    },
    {
      "itemId": "item-tm-facade",
      "category": "tms_hms",
      "threshold": 7500,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-facade"
      }
    },
    {
      "itemId": "item-tm-secret-power",
      "category": "tms_hms",
      "threshold": 8214,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-secret-power"
      }
    },
    {
      "itemId": "item-tm-rest",
      "category": "tms_hms",
      "threshold": 8571,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-rest"
      }
    },
    {
      "itemId": "item-tm-attract",
      "category": "tms_hms",
      "threshold": 9286,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-attract"
      }
    },
    {
      "itemId": "item-tm-thief",
      "category": "tms_hms",
      "threshold": 10000,
      "payload": {
        "kind": "machine",
        "state": "unused",
        "moveId": "move-thief"
      }
    }
  ],
  "escortPairs": [
    [
      "pokemon-032",
      "pokemon-029"
    ],
    [
      "pokemon-033",
      "pokemon-030"
    ],
    [
      "pokemon-034",
      "pokemon-031"
    ],
    [
      "pokemon-128",
      "pokemon-241"
    ],
    [
      "pokemon-313",
      "pokemon-314"
    ],
    [
      "pokemon-312",
      "pokemon-311"
    ]
  ],
  "eligiblePairCount": 0,
  "eligibleExclusiveSpecies": [
    {
      "speciesId": "pokemon-312",
      "alreadyBlueAvailable": true
    }
  ],
  "mailAreas": [
    {
      "nativeId": 10,
      "id": "friend-area-mt-moonview",
      "capacity": 6
    },
    {
      "nativeId": 14,
      "id": "friend-area-sky-blue-plains",
      "capacity": 13
    },
    {
      "nativeId": 35,
      "id": "friend-area-dragon-cave",
      "capacity": 3
    },
    {
      "nativeId": 36,
      "id": "friend-area-boulder-cave",
      "capacity": 4
    }
  ]
});
