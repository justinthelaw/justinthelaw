# Sourced species profile catalog

This catalog makes original Rescue Team numerical profiles available to later
browser consumers. It contains all 386 National Dex species, 413 persistent
profiles and six temporary Castform/Deoxys profiles. It does not implement
recruitment, learning, abilities, movement, evolution, actor advancement or the
Adventure. P02/P07 and whole-game acceptance remain open.

## Evidence and source decisions

The checked-in factual authoring records live in
`tools/pokemon-dungeon/content/species-runtime/`. Their `sources.json` records
pinned source URLs, local-input hashes, evidence qualifications, numerical
reconciliation counts and excluded identities. The browser export retains that
manifest. It contains independently structured numbers, identity names and source
references, without source implementations, descriptions, dialogue or artwork.
Public availability is not a blanket distribution license for those sources.

| Fields | Evidence and limit |
| --- | --- |
| Persistent base stats and growth | Blue-reported researcher data at `f8890eb4ae9867c380381b3b95349092076fa4a6`; all 413 profiles exactly agree with pinned Red |
| EXP for 256 persistent profiles | Peter O.'s shared-original UPC numerical tables independently agree with Red: 153,600 stat/EXP cells |
| EXP for remaining 157 persistent profiles | `red-comparative-only`; usable qualified numerical facts, without a Blue binary equivalence claim |
| Six temporary base/growth/EXP profiles | Red comparative only; no separate Blue-reported species-stat rows |
| Internal identity, raw type slots, base speed, regeneration and EXP yield | Red comparative facts at `6bcbec4f906938c0243aa2026bcbd41b577bab85` |
| Both persistent ability slots | Blue-reported IDs agree exactly with pinned Red; holder metadata does not implement effects |
| Persistent body size, Friend Area and recruitment base rate | Shared-original UPC research corroborates Red; temporary metadata remains comparative |
| All 419 raw learning resources | Blue-reported level-up and auxiliary lists exactly match Red numeric lists, including order and repetitions |

None is verified against an identified Blue ROM region/revision/hash. Numerical
reconciliation does not imply that every cross-version mechanic is identical.

Original Red source was read as evidence, never imported or executed. The
research decoder independently read numeric assembly directives; the repository
stores normalized numerical records and hashes, not compressed commercial data.
The optional `normalize-research.py` tool reauthors records from the separately
retained research cache and existing canonical identity inventories. Normal
export/check commands need no network, ROM or external research cache.

### Identity corrections

- Unown A-Z use comparative internal IDs 201-226, `!` uses 415 and `?` uses 416.
  Their Blue species dataset shares growth identifier 201. Neither resource
  equality nor that shared identifier erases any form identity or area mapping.
- Castform normal is 376, snowy 377, sunny 378 and rainy 379, as established by
  pinned `include/constants/monster.h`. Some labels in the Red learnset JSON
  describe those temporary rows in another order; numeric position and the
  constants establish identity. Their learning lists match without reassignment.
- Deoxys normal is 414, attack 417, defense 418 and speed 419. Separate learning
  resources preserve form-specific lists. This does not select a form or implement
  its learning/state behavior.
- Slaking uses Energetic Forest, Raticate uses Wild Plains, and Sentret's raw
  recruitment base is 73 tenths of one percent. These correct the Blue dataset's
  annotation errors. Unown punctuation rates are 1, with no A-form substitution.
- Red's `FRIEND_AREA_AGED_CHAMBER_O_EXCLAIM` maps to the established canonical
  `friend-area-aged-chamber-o-question` / Aged Chamber O? identity. There are 57
  actual areas; no area is created for the annotation typo.
- Munchlax (420), Decoy (421), Statue (422) and duplicate Rayquaza (423) are excluded
  from profile membership. Munchlax remains NPC-only; the unused Munchlax-to-Snorlax
  route is not included. No evolution relationship program is authored here.

## Schema version 1

All documents have `schemaVersion: 1`,
`catalogId: "original-blue-species-profiles"`,
`edition: "blue-rescue-team-qualified-facts"` and a specific `kind`.

| Document | Shape and meaning |
| --- | --- |
| `species.json` | 386 records: canonical `id`, `dexNo`, `name`, ordered `profileIds`, `defaultProfileId` |
| `profiles-1.json` through `profiles-5.json` | 419 profiles: exact `speciesId`/`formId`, persistence class, internal/resource crosswalk, metadata and field evidence IDs |
| `levels-1.json` through `levels-4.json` | 384 distinct complete numerical resources, deduplicated by exact base/growth/EXP equality and SHA-256 |
| `learnsets.json` | 386 distinct ordered raw learnsets, deduplicated by exact full-list equality and SHA-256 |
| `identities.json` | Crosswalks for 355 referenced moves, 76 holder abilities, 17 original types and all 57 Friend Areas |
| `sources.json` | Source URLs, input hashes, field evidence definitions, scope exclusions and narrow available capabilities |
| `manifest.json` | Deterministic browser export file names, exact byte counts/SHA-256 hashes and membership counts |

A non-form species has `formId: null`. Castform/Deoxys have explicit normal forms;
Unown has 28 distinct form IDs and no implicit default. A profile's `id` is its
canonical form ID when present, otherwise its species ID. `internalId` names the
Red comparative monster identity. `resources` separately stores
`blueGrowthResourceId`, `redGrowthResourceId`, `blueLearnsetResourceId` and
`redLearnsetResourceId`; a missing Blue species-stat resource is `null`.

Each numerical resource stores `baseStats` in this exact order:
`[hp, attack, specialAttack, defense, specialDefense]`. Its 100 `rows` each store
`[cumulativeExp, hpGain, attackGain, specialAttackGain, defenseGain, specialDefenseGain]`.
Index zero is level one, with zero EXP and zero gains. EXP thresholds strictly
increase. A level-L stat is its base plus gains at indices zero through L-1.
No derived cumulative stat array is duplicated, and no main-series growth formula
or level-transition state behavior is substituted.

`typeIds` are source monster-table type slots, not effective battle types.
In particular, the temporary Castform monster rows have Normal baseline metadata;
Forecast's effective type changes remain a separate unimplemented rule. Ability
slots always have length two, with an absent second ability represented by
`null`. Base movement speed and regeneration are raw comparative table values;
they are not turn frequency, terrain permission, HP recovery behavior or an
ability implementation. `experienceYield` is the base source value, not a final
battle reward formula.

`recruitment.baseRateTenthsPercent` preserves signed source values, including
`-999`. `eligibility` and `scriptedAcquisition` are explicitly `null` because this
catalog does not encode those rules. Celebi's raw base is 999; Latias/Latios are 1.
The source annotation saying automatic acquisition at 100% must not overwrite
those numeric base values or be inferred from them.

Learnsets store `levelUp: [[level, originalMoveId], ...]` and
`auxiliary: [originalMoveId, ...]`. Repeated levels and entries retain source order.
The auxiliary list is the source's `HMTMMoves` compatibility resource, confirmed
by the accessor and consumer source as well as complete table comparison. It is
not an inventory of available TM/HM items. For example, PMD-only Wide Slash and
Vacuum-Cut are present as compatibility identities; their presence does not imply
an obtainable machine. Eligibility, IQ gates, remembered moves, relearning,
form transitions and item availability remain separate rules. Struggle is in the
larger canonical move inventory but is not a learnset reference here; its absence
from the 355-entry learning crosswalk does not remove it from the game plan.

## Browser API

Import `loadSpeciesCatalog` from `content/species.js`. It accepts an optional
`{ signal: AbortSignal }` and returns a promise for a frozen catalog.

| API | Contract |
| --- | --- |
| `getSpecies(speciesId)` | Immutable species identity and its exact profile membership |
| `getProfile(speciesId, formId = null)` | Non-form profile or explicit normal default; Unown requires a form; mismatched/unknown forms reject |
| `getProfileById(profileId)` | Exact canonical profile identity |
| `getProfileByInternalId(internalId)` | Explicit Red-comparative identity crosswalk; never the shared Blue growth resource |
| `getGrowthAtLevel(profileId, level)` | Immutable `{ profileId, level, cumulativeExperience, growth, stats, experienceEvidence }`; level must be an integer 1-100 |
| `getLearnset(profileId)` | Immutable ordered raw learning resource; no learning decision or actor mutation |
| `getEvidence(evidenceId)` | Immutable field qualification and source IDs |
| `getSource(sourceId)` | Immutable source URL, scope and optional artifact hash/size |
| `identities` | Frozen arrays mapping original move/ability/type/area numbers to canonical identities/names |
| `capabilities` | Numeric, raw-learning and metadata lookup availability; `gameplayRules` is empty |
| `dispose()` | Idempotently clears private lookup maps; subsequent lookup calls reject |

The loader fetches only 14 explicitly named relative JSON resources. JSON strings
never supply fetch paths or module imports. It checks headers, schema, exact file
names/order, byte sizes, SHA-256 integrity, numeric shapes/ranges and structural
references before returning any catalog. It uses browser Web Crypto, available on
the HTTPS host. HTTP errors, cancellation, decoding, schema, missing references
and integrity failures reject with the underlying cause. Concurrent loading is
aborted on failure; there is no partial catalog, shared mutable cache, fallback
species or default stat table. Records remain deeply frozen even when retained
by callers after disposal. Source and evidence URLs are metadata, never fetched.

## Static validation and reproducibility

From `tools/pokemon-dungeon/`, using the pinned npm 12 toolchain:

```sh
npm run species:export
npm run species:check
node scripts/export-species.mjs --check
npm run check
```

The authoring checker parses JSON and source text only. It validates exact
386/419 membership and every canonical form/internal/resource crosswalk, excludes
420-423, checks all original identity references, 100-row shapes/ranges, monotonic
EXP, zero initial rows, content-hash deduplication and source evidence references.
It reconstructs all 419 cumulative numerical tables and compares each with the
retained source numerical SHA-256; the 256 UPC hashes must also match. It checks
the named corrections, no unused numeric/learning resources, deterministic export
equality, every file below 1,024 KiB and local resource paths. Independent game
lint and strict JSDoc checks include `content/**/*.js`; neither imports nor
executes the game modules. Human runtime acceptance remains separate.
