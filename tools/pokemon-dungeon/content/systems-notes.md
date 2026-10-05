# Blue systems authoring inventory

`systems.json` is an authoring identity catalog for P02. It contains no executable
rules, original numerical tables, asset files or runtime-ready content. Every
record assigns an implementation owner, P32 asset ownership and a pending
acceptance slot. `sourceStatus: supported` means the identity is supported within
its stated source scope; the record's `blockerIds` still prevent behavioral
completion. `original-confirmed` describes identity evidence only, including
source-internal names whose availability remains blocked.

The stable IDs are project keys, not recovered Nintendo indices. `coreMoveId`
and `coreAbilityId` are explicitly main-series crosswalks. No original move,
ability, status or trap index is asserted. All original-edition sources used here
include Blue in their stated scope, but this work does not establish equivalence
across every language, region or revision.

## Coverage

| Record kind | Actual records | Evidence boundary |
| --- | ---: | --- |
| `move` | 356 | 354 core identities matched to original PMD names, plus Wide Slash and Vacuum-Cut |
| `system-action` | 52 | Regular attack and 51 named source actions with unresolved availability/classification |
| `ability` | 77 | 76 original names plus blocked Cacophony reference candidate |
| `item-class` | 25 | Explicit DATA coverage groups; not individual item identities |
| `status` | 75 | Name column in the original-edition status list |
| `condition-flag` | 9 | Separate indicators and sealed-move state; not counted as ordinary statuses |
| `trap` | 19 | 18 supported identities and blocked Trip Trap availability |
| `weather` | 8 | Original-edition weather condition names |
| `iq-skill` | 23 | Checked-in original skill-name list |
| `friend-area` | 57 | Named original areas; historical count discrepancy remains open |
| **Total** | **701** | **648 identity-supported; 53 blocked source candidates** |

All 701 records remain `implementationStatus: unstarted` and
`acceptanceStatus: pending`. Each record has at least one field-scoped blocker;
no count in this file is a gameplay-completion claim. The catalog uses
`blockerDefinitions` and `blockerIds` to avoid repeating the same missing-field
explanation hundreds of times.

## Pinned reference inputs

Source family `T1` comes from DATA section 5 and Appendix B. Retrieval on
2026-10-05 used commit `bc92d3b6029ef1abe9e7ad424c400b338f3c11fe` and the
`data/v2/csv/` directory. The first two hashes and license hash match the
checked-in Appendix B. Ability inputs are newly recorded at the same commit.
Only IDs, names and the generation filter were used; numerical move fields and
main-series effect prose were discarded.

| Input | Bytes | SHA-256 |
| --- | ---: | --- |
| `moves.csv` | 42,322 | `8aafd37bf78f19471495c05b201545180f50f0a08a2a2a844d69f9837dd39ac9` |
| `move_names.csv` | 202,670 | `99e23ee38ea53d1473474d463b87651deac3cd4928750f8186feae66da45c147` |
| `abilities.csv` | 7,074 | `74c3588ad48e08e54ff01f432899a4028c3e91508bbd53201df85e1f6b9e9ef3` |
| `ability_names.csv` | 65,239 | `8acb80c42210f86ae747dc3347b060d69cd2574a9dbfaf74774ae632ca6348da` |
| `LICENSE.md` | 1,621 | `1c04595dc662981c20956ae4251dfa7b62b475c345eddf98bc9b904cb2373f2c` |

`ability_names.csv` was inspected as a reference input, but the catalog's
original display names come from the original-edition ability sources.
Cacophony is not present in the pinned 76-row Generation III ability selection;
it has no guessed numeric crosswalk. Its existing DATA research question is
retained as `reference-main-series` and blocked.

Raw URL pattern:
`https://raw.githubusercontent.com/PokeAPI/pokeapi/bc92d3b6029ef1abe9e7ad424c400b338f3c11fe/data/v2/csv/<filename>`.
The license is at the same commit's root `LICENSE.md`. The exact required notice
is preserved below. Temporary downloads are not runtime or committed inputs.

## Original move identity evidence

Existing source family `P01B-S-UPCINDEX` in `research/blue-rules-v2.json` links
its Battle System / Move List to:

<https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-moves.html>

The original-game scope is established by `P01B-S-UPCSCOPE` and
`P01B-S-UPCINDEX`, not by the nearby Explorers-only statistics destination.
Retrieval on 2026-10-05 extracted only the move-name column from the preformatted
rows. The catalog's provenance entry records the retrieved HTML hash. This is a
new identity-only expansion of that source family, not a change to the frozen
v1/v2 rule profiles.

The exact 354 main-series IDs from 1 through 354 were joined to their English
reference names and compared with the original PMD list. Case, spacing and
punctuation were ignored for comparison, while PMD display spelling was
preserved. Four nontrivial spelling crosswalks were reviewed explicitly:

| Core ID | Pinned reference name | Original source name |
| --- | --- | --- |
| 11 | Vise Grip | Vicegrip |
| 136 | High Jump Kick | Hi Jump Kick |
| 185 | Feint Attack | Faint Attack |
| 265 | Smelling Salts | Smellingsalt |

The list supports all 354 identities plus Wide Slash and Vacuum-Cut. G11/G12
independently establish those two PMD-exclusive moves. They have no later-game
PokéAPI number. The 354 crosswalk does not import learnsets, stats, effects or
availability exceptions from the main series.

The source has 413 parsed rows and 410 distinct name strings. Its repeated
hyphen-only label and one unreadable replacement-character label are not usable
identities and were not turned into fabricated content rows. Of the remaining
408 distinct source names, 356 are move identities and 52 are system actions.
The separate regular attack row is supported by the checked-in
`systems:regular` evidence. The other 51 source action names are represented
individually with `P02-SYS-ACTION-CLASSIFICATION`: the source mixes orb and
internal records, and a named row does not prove an obtainable move or item.
The source's hexadecimal effect-group headings are not original move indices.

## Original ability identity evidence

Existing source family `p01:source-4856d66dcb` is the original GBA/DS Ability
page. Its linked original list was retrieved on 2026-10-05 at revision 960775:

<https://mysterydungeonwiki.com/index.php?title=Rescue_Team:List_of_Abilities&oldid=960775>

The 76 name cells were corroborated against the 76 definition-term names at:

<https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-abilities.html>

Only names were used. Descriptions copied from the commercial game/guide on the
wiki were not copied into this catalog. `Compoundeyes` and `Lightningrod` retain
original source spelling; their stable IDs and optional core crosswalk use
`compound-eyes` and `lightning-rod`. The original simultaneous-ability policy
remains in P01; neither a hidden ability slot nor a selectable Cacophony perk is
introduced here.

## Status and condition evidence

Existing `P01B-S-STATUS` points to the original-edition researcher page:

<https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-status-conditions.html>

Retrieval on 2026-10-05 extracted 75 name cells from List of Statuses, with the
HTML hash recorded in the catalog. Duration and description columns were not
imported. These names are not a proof of a complete engine-status index.

The source separately names Low HP, Identifying, Famished, Sped up, Slowed down,
Weakened, Hungry Pal and Sped up attacks under Status Groups. Its Status Problems
section also identifies sealed-move state. These nine records use
`condition-flag` so they do not inflate the ordinary-status count. Their exact
state representation, speed-stage distinctions and UI labels remain blocked.

## Trap identity evidence

G16's original RB column was retrieved on 2026-10-05:

<https://bulbapedia.bulbagarden.net/wiki/Trap_(Mystery_Dungeon)>

The 17 named traps already listed by `research/systems.json` are represented,
along with Spiked Tile and the explicitly blocked Trip Trap. Spiked Tile is
separate from later Stealth Rock and Toxic Spikes. G16 currently marks Trip Trap
unavailable in RB with a footnote even though its RB index column has a value;
DATA's earlier text tentatively includes it. This catalog preserves the conflict
with `P02-SYS-TRIP-AVAILABILITY`, not an ordinary-spawn assumption.

Wonder Tile, stairs, warp exits, rescue spots, carpet and terrain are not
negative-trap rows. Their feature contracts belong to dungeon/navigation and
floor-interaction inventories; this file does not silently count them as traps.
The family still needs exact index and inclusion review, so displayed source
index values were not frozen into the catalog.

## Weather identity evidence

Existing `P01B-S-NOTES` was retrieved on 2026-10-05:

<https://upcarchive.playker.info/0/upokecenter/content/pokemon-mystery-dungeon-various-notes.html>

Weather / Conditions explicitly identifies Clear, Sunny, Sandstorm, Cloudy,
Rain, Hail, Fog and Snow. Only those names are imported. Their priorities,
form effects, damage and duration counters remain outside this identity pass.

## Friend Area identity evidence

Existing `systems:areas` supplies the Friend Area research family. Its broad
Bulbapedia destination mixes original names and DX replacements, so this
expansion uses the explicitly original GBA/DS list retrieved on 2026-10-05 at
revision 960782:

<https://mysterydungeonwiki.com/index.php?title=Rescue_Team:List_of_Friend_Areas&oldid=960782>

Its 57 concrete names appear as 57 records. Original spellings include
Mist-Rise Forest, Thunder Meadow, Furnace Desert, Mt. Deepgreen, Energetic
Forest, Peanut Swamp and Transform Forest. DX-renamed labels were not substituted.
`Aged Chamber O?` has the distinct project ID
`friend-area-aged-chamber-o-question`; punctuation does not erase its identity.

The historical `research/systems.json` friend_areas uncertainty says 58. Neither
that record nor the retrieved original list identifies an additional area. The
57-versus-58 conflict remains `P02-SYS-AREA-COUNT` on every area; no primary
edition-scoped count reconciliation was obtained. Next research should verify
an original Blue area-menu list or an original edition guide's complete area
index. No fabricated 58th row closes the discrepancy.

## Unresolved scopes

| Scope | Explicit remaining work | Owner |
| --- | --- | --- |
| Moves | Original internal crosswalk, each acquisition route, effects, targeting and numeric parameters; classify all 51 named action candidates and recover unreadable source labels if needed | P14/P15 |
| Abilities | Complete Blue holders, triggers, order, suppression and effects; resolve Cacophony/internal-value question | P14 |
| Individual items | Extract G15's full original identity corpus and classify ordinary, story, special-mode, region/version, unused and unknown rows; the 25 class records do not replace it | P15/P20 |
| Statuses/indicators | Original index crosswalk, all lifecycle/overwrite/immunity rules and clock boundaries; verify corpus and speed-state distinctions | P15/P16 |
| Traps | Resolve Trip availability and index mapping; fill per-trap behavior and floor occurrence tables | P15 |
| Weather | Original scheduling, effects and per-floor weather tables | P15 |
| IQ | Complete original exclusion groups, thresholds, effects, Gummi matrix and observed quirks | P17 |
| Friend Areas | Reconcile 57/58, then fill all prices, unlocks, capacity and species associations | P17 |

No raw commercial scripts, asset bytes, source explanatory paragraphs or
numerical behavior tables were added. No game module was imported or executed,
and no automated gameplay test was created or run. Static authoring validation
checks identity uniqueness and provenance/ownership joins only.

## PokéAPI license notice

Copyright (c) © 2013–2023 Paul Hallett and PokéAPI contributors (https://github.com/PokeAPI/pokeapi#contributing). Pokémon and Pokémon character names are trademarks of Nintendo.

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

* Neither the name of PokéAPI nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
