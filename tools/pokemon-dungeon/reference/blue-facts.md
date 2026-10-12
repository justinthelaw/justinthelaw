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
The four shipped quiz documents contain only character-creation fields. The
exporter checks their exact bytes; this checker independently compares every
projected value against the fully validated source catalogs. Source citations,
hashes, redundant indices and later-game Friend Area metadata remain offline.

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
`d8c13d77871528f7c9daec7152db8c8acb98111b67847c42c4aff4415e6e3b4f`
and the donor-attribution digest separately. Do not automatically refresh these
pins from a new projection. A factual correction needs source review and a
deliberate pin update. Object key order does not affect the canonical digest;
array order remains significant.

The reviewed Rapid Spin correction replaces a stale trap-removal claim with
its positive-damage, user-validity gate and chosen-move status-class cleanup.
Its six pinned native source owners are recorded on action 096. All 114 other
actions and the historical donor hashes remain unchanged; this deliberate
correction accounts for the selected-record digest update.

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

## Runtime projection

The reviewed authoring bundle retains 22 complete profiles,
115 actions and 60 timers. The browser projects 20 combat profiles and 101
moves: all 16 starters retain every level1–100 growth row and learned move;
the four Tiny Woods wilds retain level1 moves and the first two growth rows.
The second row preserves the exact next-level EXP rejection boundary in saved
wild validation, even though enemies are admitted only at level1. Hero/partner
EXP and learning survive failed rescues unchanged.

Caterpie and Butterfree remain in story names, actor/portrait artwork and all
23 sprite atlases; their unused combat profiles are omitted. Fourteen moves
used only by later wild/NPC levels leave the runtime projection and generated
motion dictionary. The retained move effects, PP, numeric parameters and motion
overrides are unchanged. Item routes still use their existing fixed inventory.

Unused runtime `hitCount`, `ginsengCap`, species `id` and duplicate `starting`
records are omitted. Combat uses the unchanged native `chainedHitsRaw` field.
Move numeric IDs remain in the raw authoring identities and three explicit
action-only IDs, where the motion exporter reads them. The opening checker now
compares projected level-five stats/PP against the independently pinned starting
profiles rather than requiring a duplicated runtime copy. No save schema,
validator, runtime algorithm, random call or preference migration changes.
