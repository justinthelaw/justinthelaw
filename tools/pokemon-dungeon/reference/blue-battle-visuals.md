# Opening battle visuals

The selected browser renderer uses native actor motions and a closed bank of
15 battle effects from the pinned comparative Red tables. A separate timeline
plays already committed presentation evidence; it never repeats gameplay,
draws randomness, or writes visual state into saves. This is source-derived
choreography with explicit Blue and coverage qualifications below.

The authoring owner parses `gUnknown_80BDBC4` and its scoped species overrides
from [effect_data.c](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_data.c).
It follows [sub_800EA44](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_main.c):
the first matching species override takes precedence over the move default.
All 115 moves in the current opening factual projection receive source records.
The generated module is factual data, not an executed copy of the original code.

| Move | Actor animation | Relevant scoped override |
| --- | --- | --- |
| Regular attack / Tackle | 1 | None |
| Scratch | 2 | Charmander 4; Squirtle 1 |
| Thundershock | 11 | Pikachu 4 |
| Ember | 3 | None |
| Growl | 3 | Skitty 4 |
| Tail Whip | 12 | Eevee 4; Skitty 4 |

The numeric motions already exist in the local native atlases. `SpriteBank`
accepts a validated numeric animation override and plays its source direction,
poses, offsets and frame durations without changing the loaded image inventory.
The native IDs 98/99 invoke special rotation routines in
[code_8040094_1.c](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/code_8040094_1.c),
not ordinary atlas animations. The timeline now implements their source turns
instead of inventing an atlas mapping. The superseded preliminary
`moveAnimation` helper has been removed; `moveEffects` supplies the complete
source route and the first matching species override.

## Selected effect artwork

The ignored `tools/pokemon-dungeon/.work/native-battle-effects-study/` retains the
reviewed static prototype and 15 contact sheets. Its five public indexed image
inputs are now pinned by `native-battle-sources.json` and its offline source
archive: `efob000`, `efob053`, `efob054`,
`efob119` and `efob121`, with their literal pose/animation tables and palettes.
No ROM, game import, battle simulation or scripted playback is used.

The selected atlas is 512×532, 21,890 encoded bytes and 1,089,536 decoded
bytes. Its 24,848-byte metadata preserves 197 pose variants, 149 unique images
and 15 effects. Nondirectional effects store one sequence; Growl stores eight.
The PNG is byte-identical to the reviewed study image. Static validation checks
the complete source inventory, source hashes, palette domains, source OAM bounds,
layer rectangles, attachment-set IDs, frame references and duration sums. Limits
are 256KiB encoded image, 128KiB metadata and 2MiB decoded image; the selected
distribution's independent 3MiB limit is unchanged.

The selected effects cover shared damage impacts, preparation, sleep entry,
Scratch impact, Ember launch/travel/impact, Thundershock impact, directional Growl,
physical attack/defense down and paralysis entry. Ordinary attack/Tackle have no
separate move-overlay stage; their damage still uses the shared impact owner.

| Effect family | Source selection |
| --- | --- |
| Immune/resisted/neutral/super hit | Effects 8/9/10/11; `efob000` animations 3/15/16/4 |
| Scratch | Effect 138; `efob054` animation 0 |
| Thundershock | Preparation 22; impact 236, `efob119` animation 2 |
| Ember | Launch 144; travel 137 and impact 317, `efob053` animations 0/3 |
| Growl | Preparation 22; directional 274, `efob121` animations 0–7 |
| Attack/defense down | Effects 404/399; `efob000` animation 13 with distinct palettes |

The decoder preserves fixed-versus-selected OAM palettes, source flips, offsets,
frame ticks and layer priority. The stat-down artwork contains depth −5 and depth 0
pieces; flattening all parts into one foreground image would lose native
interleaving. Four per-pose attachment sets have been recovered for all 23 retained
species, with set zero checked against the existing status metadata. Set 0 remains
`statusOffsets`. Each species' `effectOffsetSets` deduplicates triples for native
sets 1–3, and `effectOffsetIndices` selects one triple per pose; the explicit
`effectOffsetSetIds` value is `[1,2,3]`. Full four-set authoring evidence remains in
`native-attachment-evidence.json`. All 5,916 reconstructed pose records match that
evidence, and all 25 existing species/portrait/contact PNG outputs are unchanged.
The pooled fields add 74,409 metadata bytes across the 23 species, keeping the
current distribution cap without duplicating set 0. Runtime admission bounds each
pool, index and signed-coordinate pair.

The literal effect wait flag is retained as `sourceWaitFlag`; `blocksWait` is
its validated inverse. Sleep effect 37 has flag 1: it starts a 28-tick visual
tail without blocking its own handle wait. The other 14 selected effects have
flag 0. A native TRUE global drain still includes the sleep tail. This distinction
comes from `sub_800E9A8` and `sub_800E9FC` in the pinned
[effect_main.c](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_main.c).

## Presentation ownership

`BattlePresentation` consumes immutable producer evidence in source order.
Actor frame flags select cast and release points; target effects precede the
final hit or miss outcome. Damage effectiveness chooses the shared impact, and
stat effects remain observable even at a stage limit after immunity checks.
The singleton native floating number has a 60-tick lifetime and explicit MISS
semantics, so ordinary damage 9999 still displays the clamped damage number.

The app supplies one pause-aware clock. Help, blur, hidden pages and artwork
loading do not advance it. Completion is explicit before input or settlement can
continue; semantic cue cursors consume each event once, including inaudible
offscreen events. Nonblocking pose, effect and number tails carry to the next
presentation owner and retire at bounded endpoints. Floor or scene changes,
Continue, failure and disposal clear the transient owner. Reduced motion finishes
an active owner without replaying pending audio; newly begun reduced-motion
actions keep their normal semantic sounds.

The effect bank loads lazily with the dungeon species. It validates bounded JSON
and PNG dimensions before decoding, shares one pending load, aborts sibling
requests on failure and closes rejected or disposed bitmaps. Drawing preserves
separate effect depth layers and source per-pose attachments. No browser timer
or gameplay callback is owned by the image bank.

Native persistent status symbols are already separate. For example, paralysis
has an application effect but no persistent status icon in the admitted source.

## Remaining qualifications

Blue effect-pixel comparisons and complete driver timing remain open. Native
cosmetic animation-start jitter is deterministically zero; it does not consume
the gameplay RNG. The selected overlay bank is incomplete: the separate ignored
`next-inventory` study identifies 21 additional reachable sprite effects and the
Hypnosis background plane. Those files are outside the selected distribution.
No-target projectile traces, Attract's sine trajectory and the broader
Far-Off Pals route need separate source/producer coverage. They are distinct
from the implemented actor motions and rotation routines.

Static checks validate source, types, paths, images and provenance without
executing game code. Manual browser/Blue comparisons remain separate evidence.
Public source provenance does not assert a rights-holder reuse grant.
