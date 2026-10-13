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

`image_gen` produced the directional sheet from that reference. Lossless strip
packing keeps each source file under the repository's added-file budget; the
original generated-image digest and decoded-pixel digest are preserved in
[the source ledger](../art/roux/source.json). The exporter verifies each strip,
reassembles identical pixels, downsamples by nearest neighbour with binary alpha,
and emits a 256x232 atlas with 48 body poses, eight directions, bounded clips and
two portraits with normal fallback. Roux has no claimed cartridge pixel parity.
Original Blue asset notices and source qualifications remain separate. Attribution
and removing the old logo do not establish a franchise rights grant.

Static acceptance checks independently preserve the complete original selected
rule payload, the authored brief, quiz unlock, native/source pins, PNG geometry,
resource closure and memory budgets. They never import or execute game modules.
Website checks use inert fixtures. No new automated or manual game playthrough
is claimed by these checks; the historical opening observations remain in the
[review record](../../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING-REVIEW.md).
