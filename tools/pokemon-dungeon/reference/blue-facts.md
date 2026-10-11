# Scoped opening factual checks

`node tools/pokemon-dungeon/scripts/check-blue-facts.mjs` validates JSON only.
It imports Node built-ins and reads no game module, exporter, retired catalog,
schema, fixture or test framework. It preserves useful independent checks from
the former full-catalog onboarding/species/effects validators without retaining
their campaign dependencies.

Required inputs are `content/blue-source.json`, the five
`content/blue-onboarding/{algorithm,questions,results,partners,sources}.json`
documents, `content/blue-wild-spawns.json`, `content/blue-secondary-gates.json`,
and `content/rule-runtime/type-matchups.json`, relative to the authoring package.
The four shipped quiz documents are checked byte-for-byte against their inputs.

The quiz proof retains the reviewed factual fingerprints for all 56 questions
and 140 answer score maps, the 13-nature order and all 26 gender outcomes,
the ten-entry partner pool, 129 eligible ordered pairs and 16 starting loadouts.
It checks eight main questions with category exclusion, the unscored menu-99
Brave follow-up, and the circular first-maximum tie policy. The Hardy/Docile
tie remains weighted 60,495:5,041 over the 65,536-value mapper, rather than
uniformly between the two tied outcomes. These are data-policy checks, not
execution of the browser's quiz implementation.

The inherited sampling and tie evidence is pinned comparative Red source at
`6bcbec4f906938c0243aa2026bcbd41b577bab85`, principally
[`personality_test1.c`](https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/src/personality_test1.c).
The retained quiz source document distinguishes shared-original corroboration,
Blue-reported data and comparative Red rules; it does not claim Blue binary or
native correlated RNG parity. Wording remains independently authored.

Before retiring the donors on 2026-10-11, a separate static comparison verified
all 28 original donor file SHA-256 values and every selected record against
those files: 22 species/profiles/growth/learnset/body records, 115 move actions,
three floors and generation profiles, two encounter pools, 60 timers, selected
identities/AI facts and all starter profiles. The comparison was independent of
the opening exporter. Original donor paths and hashes remain in
`blue-source.json` as historical attribution, with the former implementation
recoverable in Git history (pre-pruning checkpoint
`882cdd14c25b7d79445a637f3dcd97d2c92f0c35`).

The checker pins the canonical selected-record digest
`7afe6f9373b1e1a5ab3063ea0f7e270420c2d9cf206b7d3f737a34ef90cb7e52`
and the donor-attribution digest separately. Do not automatically refresh these
pins from a new projection. A factual correction needs source review and a
deliberate pin update. Object key order does not affect the canonical digest;
array order remains significant.

Additional independent joins check content-addressed growth and learnset IDs,
100 strictly increasing EXP rows, the native cumulative numeric-table hashes,
level-five full-PP loadouts, same-type partner exclusions, the complete selected
move closure, original Tiny Woods encounter thresholds, wild sleep facts and
the two raw-zero secondary caller facts. Full growth/learnsets are retained
because failed rescues preserve EXP.

The small 324-cell type chart is retained as independent factual evidence for
the selected damage rules. Its source is
[`gTypeEffectivenessChart`](https://github.com/pret/pmd-red/blob/6bcbec4f906938c0243aa2026bcbd41b577bab85/src/dungeon_config.c#L382).
The JSON check verifies its pinned cells and original type identities. Ghost
handling, abilities and dual-type composition are separate rules; this check
does not certify the executing battle implementation or replace manual play.
