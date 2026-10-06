# Concrete campaign content and opening

`content/state.js` now exports `createCampaignContent(catalogs, authoredContent?)`,
`createInitialSelection(catalogs,natureId,column,partnerSpeciesId)` and
`createInitialCampaignLookup(catalogs,authoredContent)`. It also exports
`createOpeningContent()`. The adapter supplies the existing `CampaignContent`
interface; no parallel save/state format or schema change is introduced.

## Composition

`catalogs` borrows live `species`, `effects`, `onboarding`, `dungeons` and
`campaign` catalogs. Optional `navigation` activates its real terrain/map joins
and floor validator. Loaders still own fetching, validation and disposal.
`authoredContent` is typed `AuthoredOpening` in `content/authored/opening.js`;
it contains the initial profile ID, story node, named roles, finite scene lines,
explicit town continuation and ground dimensions/placements. The adapter copies
and freezes it. Callers must change its revision whenever definitions change.
The default profile ID is `original-blue-opening-v1`.

The content revision binds semantic revision 1, authored revision, all five
factual catalog fingerprints, and the navigation fingerprint when supplied.
The species/onboarding manifest fingerprints are explicitly pinned here;
changing either requires updating this content binding. Effects, dungeon,
campaign and navigation bindings import their existing integrity constants.

The selection helper validates the sourced nature/result column and ordered
partner pair. `createCampaign` still requires explicit confirmed names, UTC
metadata, seed and preferences. Before team naming, the team name is `Pokémon`.
No UI defaults, quiz RNG draws, clocks or storage enter this adapter.

## Initial facts and authored decisions

The initializer joins the exact native level-one growth, zero EXP, ordered
level-one learned moves, unlinked/enabled settings, zero Ginseng/PP bonus,
IQ 1, three enabled starter skills, Let's Go Together, empty inventories,
zero wallets, zero rank and the ordered owned Friend Area union. Native stored
PP zero is not misrepresented as permanent current PP: current PP belongs to
session actors. The Tiny Woods level-five entry boost remains distinct.

A source-backed correction permits zero non-HP natural stats in the existing
permanent validator. `content/onboarding/profiles.json` explicitly contains
Bulbasaur Special Defense 0, Charmander Defense/Special Defense 0 and Chikorita
Special Defense 0 at level one. HP remains positive and every effective stat
still stays within its source cap. Starter join results now brand the identities
already checked against the species/move/Friend Area catalogs.

The browser prelude retains the source's native new-game reset, including eleven
zero scenario pairs, zero counters and event arrays, both 64-bit flag arrays
clear, dungeonEnter 0, dungeonEnterIndex -1, previousMap 162 and SCRIPT_MODE false.
This is the reset boundary before native scene assignments, not a claim that an
original cartridge awakening scene uses this exact cursor/scenario combination.
The independently authored prelude, day zero, 11 by 9 meadow, coordinates, role
IDs, dialogue and continuation are browser staging. Native map 162 remains
provenance; it is not rendered as the meadow. Names are confirmed before this
prelude according to the existing new-game input contract. Canonical acquisition
history includes both original starters in order; this is an explicit browser
interpretation, consistent with native starter species-seen flags.

Pinned original Red comparison remains qualified for the original Blue target:
`pret/pmd-red` commit `6bcbec4f906938c0243aa2026bcbd41b577bab85`.

| Source | Fact / inspected Git blob |
| --- | --- |
| `src/event_flag.c:ThoroughlyResetScriptVars` | Explicit scenarios/scalars and native previous map; existing verified blob `73675e3c8ae94304d2259fb97dc8901d9cfa499a` |
| `src/script_vars_info.c:gScriptVarInfo` | Zero defaults for entry frequency and complete event arrays; fetched blob `afdf6e56505de6b0831ae9a2acd92092b9cfc16c` |
| `include/constants/ground_map.h` | Personality-test cyan index 162; fetched blob `fc1b2db255cce354665e2b1c3f43f9eb8abc61c2` |
| `src/ground_main.c` | New-game SCRIPT_MODE false; fetched blob `1dea799868772c623aaca64538369750eafcfe36` |
| `src/exclusive_pokemon.c` | Initial persistent/pending flags clear; fetched blob `f0d5144c596e7a1e5bd9fef7ec05c7705880ac9a` |
| `src/rescue_team_info.c:InitializeRescueTeamInfo` | Initial name and rank points zero; existing pinned profile research |

The prior historical-versus-observed source hash discrepancy in
`PROGRESSION-STATE.md` remains qualified; this package neither rewrites that
history nor claims Blue binary parity.

## Semantic owners

Opening progress validation checks exact starter growth/moves/team/areas/economy,
native reset, absence of future history, original acquisition history and
once-only completed scenes. Scene admission checks the actual line cursor,
advance-only await state, two exact role bindings and exact continuation.
Ground admission checks the authored map, day, services, occupants, bounds and
collisions. Empty rescue state succeeds; actual exchange records name the
missing format/restoration owner. Jobs/results are checked only when present.

Actor admission checks effective stats, resources, PP/boosts, IQ/tactic and
roster-baseline identity. Conditions validate sourced stage/Q8/speed limits and
recompute ordinary speed from species/timers/paralysis. Actual overrides,
regeneration, gains, effect memory and nonempty status lifetimes retain explicit
requirements. The scheduler admits its exact engine-created initial boundary;
in-flight saved PCs require the matching action/effect program owner.

With navigation supplied, floor admission checks registered 56 by 32 geometry,
source generation-profile identity, all terrain identities, actor occupancy via
`canEnter`, usable Mobile Scarf/status/IQ mobility and ordinary next-floor stairs.
Variant, fixed encounter, exceptional exit, trap, weather contribution, sports,
shop and event states retain specific requirements when encountered. It does not
regenerate a saved map or demand an invented historical generation receipt.
Neutral natural weather uses an empty contribution list for source weather zero;
non-neutral mappings remain an explicit owner. Native procedural geometry is an
accepted browser adaptation from P11, not extracted commercial tiles.

Entry validation checks baseline projected HP and recognizes unchanged ordinary
projections. Every entry still requires its complete sourced entry rule and
outcome policy set, including failure/rescue behavior. Neither copied field names
nor an initial scheduler can establish those missing retention rules.

The concrete initial state can proceed through canonical creation/admission;
this statement is based on static contract/source review, not executed gameplay.
Scene commands, Tiny Woods entry/boost guard/outcomes, the remaining TurnHooks,
full story/jobs/town/rescue, persistence and application rendering are next owners.
No full-game, playable-dungeon or manual acceptance claim is made.
