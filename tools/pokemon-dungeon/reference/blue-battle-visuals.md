# Opening battle visuals

Native actor motions and three sprite-effect banks present already committed
evidence. The timeline does not repeat gameplay, draw RNG or save visual state.
Source routing is comparative
[pret/pmd-red@013475aa04f5be3191e5527c186d9bfceae7cae0](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0);
Blue pixel/driver parity remains qualified. [The immutable full record](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-battle-visuals.md)
preserves original source URLs, archival hashes, earlier inventories and reviews.

## Selected effect artwork

Current runtime JSON banks contain **66 effects**, verified by data-only parsing:

| Bank | Effects | Dimensions | Decoded RGBA bytes |
| --- | ---: | --- | ---: |
| battle-effects.json | 17 | 512x444 | 909,312 |
| battle-effects-initial.json | 34 | 512x431 | 882,688 |
| battle-effects-extra.json | 15 | 512x372 | 761,856 |
| Hypnosis background | Separate | 416x32 | 53,248 |
| Total | | | 2,607,104 |

This leaves 1,587,200 bytes under the 4 MiB effect limit. Earlier 56/58-effect
counts and atlas sizes in the archived record are historical checkpoints.
Indexed EFO tables/palettes/sine inputs remain pinned in native-battle-sources.json
and the offline archive. Schema2 authoring evidence validates source hashes,
palette/OAM bounds, pose/frame/wait records, attachment IDs and unique ownership
before schema3 runtime export. Sparse layers retain up to four stable disjoint
pieces/pose, original depth/cropped offsets; no rotation/resampling.

The exporter parses gUnknown_80BDBC4 and first-matching species overrides
([effect_data.c](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_data.c),
[sub_800EA44](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_main.c)).
All101 projected moves have source records, not necessarily complete live artwork
joins. Regular/Tackle motion1, Scratch2 (Charmander4/Squirtle level 1), Thundershock11
(Pikachu4), Ember3, Growl3 (Skitty level 4), Tail Whip12 (Eevee/Skitty level 4).
Native98/99 are [rotation routines](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/code_8040094_1.c),
not invented atlas mappings.

| Family | Source selection |
| --- | --- |
| Immune/resisted/neutral/super hit | Effects8/9/10/11; efob000 animations3/15/16/4 |
| Scratch | 138, efob054 animation0 |
| Thundershock | Preparation22, impact236/efob119 animation2 |
| Ember | Launch144, travel137, impact317/efob053 animations0/3 |
| Growl | Preparation22, directional274/efob121 animations0-7 |
| Attack/Defense down | 404/399, efob000 animation13, distinct palettes |
| Rapid Spin | 83, efob135 animation0, fixed OAM palette5 |

Native palettes/flips/offsets/ticks/depth remain. Stat-down layers at depth-5/0
must interleave with actors. Four attachment sets for23 species retain set0 as
statusOffsets, deduplicate sets1-3 via effectOffsetSets/effectOffsetIndices, and
validate all5916 poses against native-attachment-evidence.json. The original
attachment admission added73,742 metadata bytes while preserving25 image outputs;
those are historical comparison results, not new checks in this documentation edit.

Runtime blocksWait is the inverse of the source wait flag. Sleep37 is nonblocking
with a28-tick visual tail; TRUE global drains still include it
(sub_800E9A8/sub_800E9FC in effect_main.c). Rapid Spin83 has four-frame preload,
52 payload ticks at H+1..H+52, terminal pose H+53, removal/return H+54, no TRUE-drain
suffix. Missing/offscreen target adds no handle/wait; set-1 uses feet. Sound678
has its own finite lifetime ([audio](blue-audio.md)).

## Presentation ownership

Conservative first-attempt coverage uses2310 additional EXP,30 move IDs across
16 heroes/four wild species. Static asset checks cover nonzero preparation,
cast/target/travel routes except separately owned Hypnosis222. Coverage includes
Attract/Bite/Bubble/Disable/Focus Energy/Leech Seed/Mud-Slap/Rage/Razor Leaf/
Sand-Attack/Smokescreen/Vine Whip/Water Gun and helpers76/323/stat394/397/398.
Asset presence does not prove every producer or manual animation acceptance.

BattlePresentation consumes immutable receipts in source order. Actor frame flags
own cast/release; target artwork precedes presented hit/miss; effectiveness selects
shared impact. Valid stat attempts remain visible at limits after immunity checks.
The singleton number lasts60 ticks with explicit MISS semantics; damage9999 uses
clamped numeric display, not the MISS sentinel.

The app owns one pause-aware clock. Help/blur/hidden/loading freeze it; completion
precedes input/settlement. Cursors consume each receipt once, including inaudible
ones. Bounded pose/effect/number tails carry between owners; floor/scene/Continue/
failure/disposal clears them. Reduced-motion finish silently consumes pending
audio, while newly begun reduced-motion actions keep ordinary semantic sound.
Bank loading validates bounded JSON, PNG dimensions, unique ownership and memory;
sibling failures abort/close partial bitmaps, publishing only complete collections.

Projectile receipts distinguish requested one-tile range from stopped endpoint.
Comparative sub_80566F8/sub_800E3AC use speed2/3/6, one-ten cells, signed-short
attachment decay with divisor six times stopped distance. Invisible cells advance
sine phase without advancing effect/attachment recurrence. Attract alone uses
the pinned1024-entry quarter-wave/quadrant lookup. Empty impact belongs only to
requested one-tile routes, not a line stopped by an adjacent wall. Actual targets
capture attachment once with native99 suppression; generic helpers have feet fallback.

Burn/cringe entry effects require fresh status; paralysis message precedes423.
Focus Energy/Leech Seed use null helpers; Rage's false ENRAGED helper has no art;
Whiffer is sound-only. These publish status/message without invented effect/drain.
Persistent icons are separate: paralysis has entry artwork but no admitted
persistent symbol. See [status evidence](blue-status-effects.md) for current
Protect/Safeguard rendering qualifications; artwork availability alone is insufficient.

## Adjacent travel and application effects

Ember and Exeggcute Hypnosis use existing accepted/empty endpoint receipts.
After launch, attachment samples the current pose, possibly freshly idle; only
a live cast records that idle boundary. Broader idle continuity still uses the
shared clock. Both move3 px/frame without wobble. Eight visible updates use signed16
x=trunc(x*5/6), y=trunc((y+9)*5/6)-9; raw99 is transformed before draw guard.
Set-1 remains unoffset. Depth uses unoffset feet Y divided toward zero by2,
plus1 for S/SE/E/W/SW or0 for NE/N/NW, independent of image/attachment offsets.

Sources: [sub_8056564/sub_80566F8](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_move_util.c),
[sub_800E3AC](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_main.c),
[sub_800569C](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/sprite.c),
[UpdateMonsterSprite](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_mon_sprite_render.c).
First draw C+1, last C+8, wait ends C+8, framebuffer tail C+9. Exeggcute motion3
releases tick15/27; ordinary Hypnosis captures set0 next frame while cast remains
active. Destination is tile feet, not target pose. The225 join is restricted to
Hypnosis/Exeggcute/one cell and adds no scan/turn/wait/RNG.

Positive requested healing applies even at full HP: HP patch, helper drain/effect 7,
low-HP-warning refresh, result text, then positive number only for restored HP.
A number-slot wait cannot delay text. One pre-heal HP display hold/actor never
changes canonical HP/save. Infatuation applies effect15 after duration draw;
Attract's earlier target effect remains distinct. Generic entry captures attachment/
unoffset depth after drain, falling back from99 to feet. Heal/heart retain terminal
pose, then remove next call:72/54 creation-to-return ticks. Owners: HealTargetHP,
InfatuateStatusTarget, sub_8041550, sub_800DD0C, RunAxAnimationFrame.
Fresh displayed7/15 request606/614 once; carry/redraw/finish cannot replay.

## Hypnosis background ownership

Only Hypnosis admits screen-relative222/efbg005, separately from travel225.
The original background archive pins54 files/148,746 bytes;22 two-tick phases
reduce to13 opaque32x32 patterns in a2963-byte416x32 PNG. Confusion/Psybeam share
the native preparation ID but lack this timing admission.

A raw preload frame holds actor/effect/camera age, then nonblocking preparation
and TRUE drain proceed. Palette brightness15 first/last,31 between;44 dungeon
ticks plus terminator. HUD remains hidden through terminator, returning next
dungeon frame. Ordered receipt clears live notice strings/cache, not message
history. A real changed-camera LOOK can drain background before travel.

A bounded world scratch surface precedes BG2, foremost over terrain/ordinary OBJ,
including numbers. Eligible channels use DS6-bit10/10 mix/rounding then6-to8 expansion,
not Canvas source-over. BG0's x0 guard remains unblended; its font tile has eight
30000000 rows. Blue crop(8,208,256,192) has black x0 throughout while opposite edge
varies; outer screenshot rows distinguish the frame. Normal pixels corroborate
the guard, not Blue Hypnosis priority/preload.

Hardware arithmetic is pinned to
[melonDS GPU_ColorOp.h@906e9ebb27da8c6a715cd7abab4abfe8a8d29427](https://github.com/melonDS-emu/melonDS/blob/906e9ebb27da8c6a715cd7abab4abfe8a8d29427/src/GPU_ColorOp.h);
routing/lifetime is comparative Red. Crop origin0,0, Blue reader/final pixels,
raw-preload appearance and sounds769/772 remain qualified. Empty Hypnosis evidence
uses the existing scan without changing combat/PP/RNG/saves. Pause freezes;
finish consumes once; retirement frees resources without persistent tint.

## Final faint publication

Visible lethal reactions retain final C+40 image before matching faint removes
actor/status membership. Strict-time patch/cue prefixes defer faint/drop/EXP and
later same-tick work; sparse endpoints exclude later tracks. Only matched hit
pose gains an endpoint sample; canonical HP/save already committed.

One immutable frame and semantic controls submit together; release waits for a
later eligible foreground RAF, preventing same-callback input/settlement replacement.
Help/blur/hidden/scene/disposal cancel without replay. Initial reduced motion and
explicit finish keep instant silent settlement. No native wait/RNG/audio/save
change follows. After successful KO rendering, a same-tiles time lower bound
prevents binary64 rollback through raw-upload hold; it survives owner/menu changes
and retires on actually rendered new floor/scene. No epsilon, extra source tick,
fixed dwell or physical-paint acknowledgment is claimed.

Only one full frame is materialized within existing event bounds. Detailed static
preservation/independent admission:
.work/blue-faint-publication-implementation-v2-20261011-1157/ and
.work/blue-faint-implementation-independent-20261011-1153/. Interrupted frames are
outside the rendering-opportunity promise; split deliveries keep audio quota limits.

## Remaining qualifications

Native cosmetic start jitter is deterministically zero without gameplay RNG.
Banks are selected, not complete. Blue pixels/driver timing, Hypnosis framing,
other travel geometry/Attract sine and broader idle continuity still need review.
Far-Off Pals LOOK/SELF is documented in [visual evidence](blue-visual.md).
Static checks validate source/types/paths/images/provenance without executing game
code; manual browser/Blue comparisons are separate. Public provenance is not a
rights-holder reuse grant.
