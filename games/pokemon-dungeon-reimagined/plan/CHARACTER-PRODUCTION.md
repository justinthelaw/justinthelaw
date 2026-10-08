# Starter character production handoff

The new tools-only starter wave implements editable original pixel candidates
for all sixteen original Blue quiz heroes (and therefore all ten selectable
partners). **Human art acceptance and runtime integration remain open.** This
is a bounded production-art implementation, not completion of W-B/P19/P32 or
the full roster. Selection portraits, evolution lines, remaining species/forms,
NPCs, effects and actual gameplay evidence remain separate work.

| Deliverable | Location |
| --- | --- |
| Frozen v2 streaming format | [Production contract](../../../tools/pokemon-dungeon/art/production/CONTRACT.md) |
| Exact canonical IDs, source/frame hashes and timing | [Manifest](../../../tools/pokemon-dungeon/art/production/manifest.json) |
| Small future loader handoff | [Page index](../../../tools/pokemon-dungeon/art/production/page-index.json) |
| Editable per-species anatomy | `tools/pokemon-dungeon/art/production/species/*.mjs` |
| Visual observations, corrections and limitations | [Review record](../../../tools/pokemon-dungeon/art/production/REVIEW.md) |
| Tools-only 3D/clip inspector | `tools/pokemon-dungeon/art-preview/production/index.html` |
| Native eight-view and twelve-clip sheets | `tools/pokemon-dungeon/art/production/evidence/` |
| Actual 3D/mobile art capture provenance | [Capture record](../../../tools/pokemon-dungeon/art/production/evidence/captures/capture-record.json) |

Each of 192 local species+clip pages contains eight directional rows and four
96×96 cells: 6,144 authored cells total. A 384×768 RGBA page is 1.125 MiB decoded.
All pages use fixed `[48,92]` feet, two-pixel transparent borders, nearest
sampling, no mipmaps, sRGB and binary straight alpha. World-facing selection
retains **heading minus bearing**; no domain direction/identity contract changes.
The twelve clips are idle, walk, turn, physical attack, special attack, status
cast, light hit, heavy hit, defeat, celebrate, sleep and interact. Timing and
loop/restart policy are explicit; animation never awards a turn or damage.

The art viewer loads only the selected page or three visible composition pages,
with explicit resource disposal and resident/peak counters. Its 3.375 MiB
character-page peak is evidence about that inspector only. The contract's
24 MiB future character-page ceiling allows at most 21 resident pages, with
CPU copies and renderer resources additional. Do not preload all starter clips:
that alone would allocate 216 MiB. No runtime streaming/cache is claimed.

Promotion requires human species/pose review, a reviewed game-facing adapter,
visibility filtering, lifecycle integration, campaign camera/contact evidence
and device acceptance. Preserve the older v1 candidates as historical evidence;
this wave does not silently replace or approve them.
