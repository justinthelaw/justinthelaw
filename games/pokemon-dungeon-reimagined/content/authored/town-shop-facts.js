import { freezeData } from '../../src/domain/state/validate.js';

/** First native story tier, MAIN < (11,0). Red comparative source at
 * 6bcbec4f906938c0243aa2026bcbd41b577bab85. No unsupported stock is pruned.
 * source dungeon_info.c SHA-256: 6ccf672c31673187bb796aa3efba549b4c7fcfedef4c306702340d111597a871
 * @type {readonly {serviceId:string,slots:number,sourceSymbol:string,categories:readonly {category:string,threshold:number}[],items:readonly {itemId:string,category:string,threshold:number,order:number}[]}[]} */
export const TOWN_SHOP_POOLS = freezeData([
  {
    "serviceId": "kecleon-items",
    "slots": 8,
    "sourceSymbol": "sRandomItemsSetKecleonShop1",
    "categories": [
      {
        "category": "thrown_arc",
        "threshold": 1250
      },
      {
        "category": "berries_seeds_vitamins",
        "threshold": 6250
      },
      {
        "category": "food_gummies",
        "threshold": 10000
      }
    ],
    "items": [
      {
        "itemId": "item-gravelerock",
        "category": "thrown_arc",
        "threshold": 10000,
        "order": 52
      },
      {
        "itemId": "item-oran-berry",
        "category": "berries_seeds_vitamins",
        "threshold": 1667,
        "order": 78
      },
      {
        "itemId": "item-reviver-seed",
        "category": "berries_seeds_vitamins",
        "threshold": 3750,
        "order": 93
      },
      {
        "itemId": "item-rawst-berry",
        "category": "berries_seeds_vitamins",
        "threshold": 4583,
        "order": 80
      },
      {
        "itemId": "item-pecha-berry",
        "category": "berries_seeds_vitamins",
        "threshold": 5417,
        "order": 79
      },
      {
        "itemId": "item-cheri-berry",
        "category": "berries_seeds_vitamins",
        "threshold": 6250,
        "order": 76
      },
      {
        "itemId": "item-sleep-seed",
        "category": "berries_seeds_vitamins",
        "threshold": 7083,
        "order": 94
      },
      {
        "itemId": "item-warp-seed",
        "category": "berries_seeds_vitamins",
        "threshold": 7500,
        "order": 97
      },
      {
        "itemId": "item-blast-seed",
        "category": "berries_seeds_vitamins",
        "threshold": 8333,
        "order": 83
      },
      {
        "itemId": "item-stun-seed",
        "category": "berries_seeds_vitamins",
        "threshold": 9167,
        "order": 95
      },
      {
        "itemId": "item-max-elixir",
        "category": "berries_seeds_vitamins",
        "threshold": 10000,
        "order": 101
      },
      {
        "itemId": "item-apple",
        "category": "food_gummies",
        "threshold": 5000,
        "order": 53
      },
      {
        "itemId": "item-big-apple",
        "category": "food_gummies",
        "threshold": 10000,
        "order": 55
      }
    ]
  },
  {
    "serviceId": "kecleon-wares",
    "slots": 4,
    "sourceSymbol": "sRandomItemsSetKecleonWares1",
    "categories": [
      {
        "category": "tms_hms",
        "threshold": 2500
      },
      {
        "category": "orbs",
        "threshold": 10000
      }
    ],
    "items": [
      {
        "itemId": "item-tm-calm-mind",
        "category": "tms_hms",
        "threshold": 357,
        "order": 130
      },
      {
        "itemId": "item-tm-roar",
        "category": "tms_hms",
        "threshold": 1071,
        "order": 156
      },
      {
        "itemId": "item-tm-bullet-seed",
        "category": "tms_hms",
        "threshold": 1429,
        "order": 129
      },
      {
        "itemId": "item-tm-hidden-power",
        "category": "tms_hms",
        "threshold": 2143,
        "order": 145
      },
      {
        "itemId": "item-tm-taunt",
        "category": "tms_hms",
        "threshold": 2857,
        "order": 169
      },
      {
        "itemId": "item-tm-ice-beam",
        "category": "tms_hms",
        "threshold": 3214,
        "order": 147
      },
      {
        "itemId": "item-tm-light-screen",
        "category": "tms_hms",
        "threshold": 3571,
        "order": 149
      },
      {
        "itemId": "item-tm-frustration",
        "category": "tms_hms",
        "threshold": 3929,
        "order": 143
      },
      {
        "itemId": "item-tm-thunderbolt",
        "category": "tms_hms",
        "threshold": 4286,
        "order": 172
      },
      {
        "itemId": "item-tm-return",
        "category": "tms_hms",
        "threshold": 4643,
        "order": 155
      },
      {
        "itemId": "item-tm-dig",
        "category": "tms_hms",
        "threshold": 5000,
        "order": 132
      },
      {
        "itemId": "item-tm-brick-break",
        "category": "tms_hms",
        "threshold": 5357,
        "order": 127
      },
      {
        "itemId": "item-tm-reflect",
        "category": "tms_hms",
        "threshold": 5714,
        "order": 153
      },
      {
        "itemId": "item-tm-shock-wave",
        "category": "tms_hms",
        "threshold": 6071,
        "order": 161
      },
      {
        "itemId": "item-tm-torment",
        "category": "tms_hms",
        "threshold": 6786,
        "order": 173
      },
      {
        "itemId": "item-tm-facade",
        "category": "tms_hms",
        "threshold": 7500,
        "order": 137
      },
      {
        "itemId": "item-tm-secret-power",
        "category": "tms_hms",
        "threshold": 8214,
        "order": 159
      },
      {
        "itemId": "item-tm-rest",
        "category": "tms_hms",
        "threshold": 8571,
        "order": 154
      },
      {
        "itemId": "item-tm-attract",
        "category": "tms_hms",
        "threshold": 9286,
        "order": 125
      },
      {
        "itemId": "item-tm-thief",
        "category": "tms_hms",
        "threshold": 10000,
        "order": 170
      },
      {
        "itemId": "item-switcher-orb",
        "category": "orbs",
        "threshold": 714,
        "order": 222
      },
      {
        "itemId": "item-blowback-orb",
        "category": "orbs",
        "threshold": 2143,
        "order": 179
      },
      {
        "itemId": "item-warp-orb",
        "category": "orbs",
        "threshold": 2857,
        "order": 230
      },
      {
        "itemId": "item-petrify-orb",
        "category": "orbs",
        "threshold": 3571,
        "order": 199
      },
      {
        "itemId": "item-escape-orb",
        "category": "orbs",
        "threshold": 7143,
        "order": 183
      },
      {
        "itemId": "item-scanner-orb",
        "category": "orbs",
        "threshold": 7857,
        "order": 211
      },
      {
        "itemId": "item-radar-orb",
        "category": "orbs",
        "threshold": 8571,
        "order": 204
      },
      {
        "itemId": "item-hurl-orb",
        "category": "orbs",
        "threshold": 10000,
        "order": 187
      }
    ]
  }
]);
