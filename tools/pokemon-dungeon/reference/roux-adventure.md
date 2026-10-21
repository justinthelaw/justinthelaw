# Roux's Adventure authored additions

The owner's 2026-10-13 brief retains the existing personality test through
Caterpie's rescue, adds optional Roux, and retires the original pre-menu sequence.
The title is Pokémon Mystery Dungeon: Roux's Adventure. Its chocolate/cream menu
uses Roux's own art; other Pokémon, story scenery, controls and saves retain their
existing scope. Original Blue boot/title records remain offline evidence and are
excluded from the declared runtime distribution.

Roux is an authored, non-evolving Normal/Ground fan character. He has Pickup and
Keen Eye. Both ability names are shown by the existing summary UI; Keen Eye uses
the existing accuracy-drop guard. His Pickup adaptation is deliberately Roux-only:
one 20% roll after floor generation with an empty held slot, then 75% Oran Berry
or 25% Pecha Berry. There is no turn-based farming, inventory expansion or overwrite.
Floor-entry Pickup notices wait for the foreground dungeon surface after entry
tutorials and use the shared live-message/narration path. The pending notice is
transient and retires with its scene; it adds no saved state or audio replay.

| Level | Move |
| --- | --- |
| 1 | Bite, Growl |
| 6 | Dig |
| 9 | Sand-Attack |
| 12 | Howl |
| 15 | Quick Attack |
| 18 | Mud-Slap |
| 22 | Headbutt |
| 26 | Crunch |
| 30 | Mud Sport |
| 36 | Take Down |
| 42 | Earth Power |
| 50 | Double-Edge |

Dig reuses bounded charge/release ownership: one PP, two turns, underground
immunity, forced next action and explicit saved-slot validation. Howl boosts
Attack; Crunch can lower Special Defense; Earth Power reaches two forward tiles
and can lower Special Defense. These four move definitions and clips are authored
adaptations, not claims of original Blue numerical or animation parity. Other
move definitions remain byte-equivalent to their reviewed projections.
Special Defense changes use source-qualified native effect selectors 401/400,
packed from the existing pinned effect archive. Roux's Special Defense drops
reuse the admitted defense-down `se906` cue as an authored adaptation; this does
not claim the original Special Defense sound 908 is reproduced.

The authored [catalog](../content/roux-adventure.json) uses Eevee's reviewed
experience thresholds and a distinct 100-level stat curve. At level 5 Roux has
30 HP, 10 Attack, 8 Special Attack, 9 Defense and 9 Special Defense; level 100
has 155/75/61/72/60. Growth tapers without an evolution requirement. The small-body Low Kick coefficient is 153 in Q8, matching the admitted
Eevee/Skitty size class rather than a unitless body-size ordinal. The engine
retains four move slots and its existing move-learning/retry rules.

The two new random quiz categories reward mischief and energy. The eighth main
question always asks about treats: blueberries, chicken and bananas give 40
playful points, exceeding any possible rival score from the other seven answers.
Choosing other treats keeps original outcomes available; Play as Roux also appears
beside original recommendations. Original question/result/partner source catalogs
and factual pins stay immutable; playable projections label authored additions.
Legacy 13-nature saves remain admissible and receive a zero playful score in
memory; current saves keep the same schemas, namespaces and receipt guards.

## Artwork and verification boundary

The Work Pet is uniquely named Roux, ID `pet_6acc6b6df5e48191b8f7acf7533d6f15`:
a chocolate-and-white Pomeranian with a forehead blaze and fluffy curled tail.
The inspected reference PNG was 1536x2288, SHA-256
`ba2467027070cef0e9153bd11943c380c2dfcbe5262e4f664828613ef3389da5`.
No pet record was modified.

The owner selected refinement concept A on 2026-10-13. Built-in `image_gen`
produced a new eight-direction sheet with rest, two walk strides, attack and
sleep poses, plus dedicated normal, happy and shocked face portraits. The
[prompt set](../art/roux/concept-a-prompts.json) records the generation requests;
[the source ledger](../art/roux/source.json) preserves the approved concept hash,
actual image dimensions, generated/decoded hashes, lossless strip rectangles
and the previous source provenance. The earlier source strips remain retained
as historical evidence and are no longer inputs to the exporter.

The exporter verifies and reconstructs the source pixels, isolates the largest
connected subject in each cell, then fits it to the game's pixel grid with
binary alpha and a shared 16-color chocolate/cream palette. It checks connectivity
again after resampling. This removes the neighboring-row feet that contaminated
the previous second idle frame. One scale per direction preserves the relative
height of standing and sleeping poses; all feet share the same ground anchor.
The breathing frame derives from the resting sprite by a local one-pixel coat
shift, keeping its silhouette and feet fixed. Idle retains 48/24-tick rest/breathe
phases. Sleeping retains its single static pose; no extra breathing artwork or
cartridge timing parity is claimed.

The 2026-10-20 static comparison inspected the approved eight-direction atlas
and all 23 retained native character metadata sets, including Eevee and Skitty
at the same pixel scale. Roux's 16-tick two-stride walk was faster than every
retained native cycle (22–96 ticks; median 32). The authored walk now uses both
strides with resting contact phases in a 24-tick cycle. Roux uses the 16-pixel
small-body shadow shared by Eevee and Skitty, replacing his 8-pixel shadow.
These choices preserve the exported PNG bytes, source hashes, palette and poses.

| Authored action | Selector | Ticks | Presentation |
| --- | --- | --- | --- |
| Physical lunge | 1 | 24 | Anticipation, forward attack and recovery |
| Bite | 2 | 20 | Existing open-mouth attack with a short lunge |
| Growl | 3 | 24 | Existing open-mouth attack held at the ground anchor |
| Hit reaction | 6 | 10 | Brief backward recoil and return to rest |
| Ground action | 12 | 20 | Short plant-and-release for Sand-Attack/Mud Sport |

Action selectors 1, 2, 3 and 12 mark cast-effect launch with flag 2, then release
the presentation wait with flag 1, and finish at the resting ground anchor.
The renderer displays already-decided outcomes; these flags change no gameplay.
This repairs the previous all-zero flags that prevented Bite, Growl and Mud Sport
cast effects from launching. The three actions formerly also reused idle artwork. Body and shadow
offsets follow the same facing vector, bounded to four pixels. Hit reaction
matches the retained native ten-tick duration, but its authored recoil includes
an explicit return to rest. Rotation selectors 98/99 remain owned by the existing
presentation path rather than being interpreted as sprite animation indices.

The 256x232 atlas retains 48 body poses and eight directions. Dedicated 40x40
portrait cells center the full face, with space around the ears and cheeks;
they no longer crop the face from a body frame. The surprised expression uses
the existing `shocked` key for the awakening dialogue. Unsupported emotions
still fall back to normal. Independent static gates cover connected silhouettes,
cell margins, ground anchors, idle stability, centered portrait proportions,
required expressions and the 16-color limit. Additional gates read move routes as
inert JSON and check all of Roux's learned/action move selectors, ordered cast and
release markers, opposite walk strides and contact poses, bounded directional
offsets, ground recovery and recoil cadence. Asset-only comparison previews use
PNG/JSON data without importing or executing any game module. Roux has no claimed
cartridge pixel parity, and these checks do not establish a playthrough.
Original Blue asset notices and source qualifications remain separate. Attribution
and removing the old logo do not establish a franchise rights grant.

Static acceptance checks independently preserve the complete original selected
rule payload, the authored brief, quiz unlock, native/source pins, PNG geometry,
resource closure and memory budgets. They never import or execute game modules.
Website checks use inert fixtures. No new automated or manual game playthrough
is claimed by these checks; the historical opening observations remain in the
[review record](../../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING-REVIEW.md).
