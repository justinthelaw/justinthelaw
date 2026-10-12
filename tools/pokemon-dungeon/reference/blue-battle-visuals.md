# Opening battle visuals

The selected browser renderer uses native actor motions and three closed banks of
56 sprite effects and the Hypnosis background from the pinned comparative Red
tables. A separate timeline
plays already committed presentation evidence; it never repeats gameplay,
draws randomness, or writes visual state into saves. This is source-derived
choreography with explicit Blue and coverage qualifications below.

The authoring owner parses `gUnknown_80BDBC4` and its scoped species overrides
from [effect_data.c](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_data.c).
It follows [sub_800EA44](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_main.c):
the first matching species override takes precedence over the move default.
All 101 moves in the current opening factual projection receive source records.
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

The selected indexed EFO inputs are pinned by the consolidated
`native-battle-sources.json` and its 236,117-byte offline archive. The archive
contains 113 exact source files for 27 EFO groups, including their literal tables,
palettes, and the native sine lookup owners. No ROM, game import, battle simulation
or scripted playback is used.

The deterministic exporter assigns all 58 effect records to three banks. `basic`
is 512×200, `initial` is 512×409, and `extra` is 512×355. Lossless sparse layer
partitioning retains at most four stable, nonoverlapping pieces per pose; pieces
keep their original depth and cropped anchor offsets. Images are neither rotated
nor resampled. Static validation checks the complete source inventory, source
hashes, palette domains, source OAM bounds, layer rectangles, equal-depth
disjointness, attachment-set IDs, frame references, duration sums and unique bank
ownership. The three atlases use 1,974,272 decoded bytes. Including the separately
owned 53,248-byte Hypnosis background, the aggregate is 2,027,520 bytes, leaving
2,166,784 bytes below the unchanged 4 MiB effect limit. All 56 previous effects
reconstruct byte-identical RGBA layers; 59 and 316 are the only additions.

The admitted records include the opening and conservative first-attempt move
routes, stat receipts, burn and cringe entry helpers, Heal Bell, Mud Sport,
Synthesis, and Rapid Spin. Artwork availability does not imply that every producer
callback is joined; presentation ownership and remaining qualifications are
recorded below. Full schema 2 authoring evidence validates source files,
animations, palettes, wait flags, and every reconstructed pose before emitting
schema 3 runtime records.

The selected effects cover shared damage impacts, preparation, sleep entry,
Scratch impact, Ember launch/travel/impact, Thundershock impact, directional Growl,
physical attack/defense down, paralysis entry and Rapid Spin. Ordinary attack/Tackle have no
separate move-overlay stage; their damage still uses the shared impact owner.

| Effect family | Source selection |
| --- | --- |
| Immune/resisted/neutral/super hit | Effects 8/9/10/11; `efob000` animations 3/15/16/4 |
| Scratch | Effect 138; `efob054` animation 0 |
| Thundershock | Preparation 22; impact 236, `efob119` animation 2 |
| Ember | Launch 144; travel 137 and impact 317, `efob053` animations 0/3 |
| Growl | Preparation 22; directional 274, `efob121` animations 0–7 |
| Attack/defense down | Effects 404/399; `efob000` animation 13 with distinct palettes |
| Rapid Spin | Target 83; `efob135` animation 0, preserving its encoded OAM palette 5 |

The decoder preserves fixed-versus-selected OAM palettes, source flips, offsets,
frame ticks and layer priority. The stat-down artwork contains depth −5 and depth 0
pieces; flattening all parts into one foreground image would lose native
interleaving. Four per-pose attachment sets have been recovered for all 23 retained
species, with set zero checked against the existing status metadata. Set 0 remains
`statusOffsets`. Each species' `effectOffsetSets` deduplicates triples for native
sets 1–3, and `effectOffsetIndices` selects one triple per pose. Full authoring
metadata checks the `[1,2,3]` descriptor and eight direction labels before actor
schema 3 omits those repeated constants and its unused edition label. Every
seven-field frame, attachment, clip and species identity remains intact.
Full four-set authoring evidence remains in
`native-attachment-evidence.json`. All 5,916 reconstructed pose records match that
evidence, and all 25 existing species/portrait/contact PNG outputs are unchanged.
The pooled fields add 73,742 metadata bytes across the 23 species, keeping the
current distribution cap without duplicating set 0. Runtime admission bounds each
pool, index and signed-coordinate pair.

The literal effect wait flag stays in full authoring metadata and pose/wait
evidence; runtime `blocksWait` retains its validated inverse. Sleep effect 37
has flag 1: it starts a 28-tick visual tail without blocking its own handle wait.
The other 55 selected effects have
flag 0. A native TRUE global drain still includes the sleep tail. This distinction
comes from `sub_800E9A8` and `sub_800E9FC` in the pinned
[effect_main.c](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_main.c).

Rapid Spin uses target effect 83, with no cast or travel effect. Its actual-target
receipt retains the normal four-frame preload and appears before a hit or miss.
Relative to effect creation H, the 52 payload ticks occupy H+1 through H+52;
H+53 retains the final pose, and removal returns at H+54 without a TRUE-drain
suffix. The existing terminal-hold helper is enabled only for Rapid Spin/83.
No target or a target that remains offscreen adds no effect or wait. Attachment
set −1 follows target feet with zero offset. The separately reviewed sound 678
starts on the fresh handle's first source update and can outlast the artwork;
see `blue-audio.md` for its comparative-source and playback qualifications.

## Presentation ownership

The conservative first-attempt ceiling of 2,310 additional EXP admits 30 move
IDs across the sixteen heroes and four wild species. Static checks now require
every nonzero preparation, cast, target and travel route for that roster in the
selected banks, except the separately owned Hypnosis background 222. The new
coverage includes Attract, Bite, Bubble, Disable, Focus Energy, Leech Seed,
Mud-Slap, Rage, Razor Leaf, Sand-Attack, Smokescreen, Vine Whip and Water Gun;
helper effects 76/323 and stat effects 394/397/398 are also present. All 33
previously selected effect records preserve their frame geometry and RGBA
pixels after repacking. This establishes source-qualified asset coverage, not
manual acceptance of every move or full Blue animation identity.

Projectile receipts distinguish the requested one-tile range from the actual
stopped endpoint. Comparative `sub_80566F8` and `sub_800E3AC` establish speeds
2/3/6, one to ten cells, and signed-short attachment decay with divisor six
times the stopped distance. Invisible cells advance sine phase without advancing
the effect or its attachment recurrence. Attract alone in this roster uses the
pinned 1,024-entry quarter-wave table and native quadrant lookup. Empty impact
artwork belongs only to the requested one-tile route; a line projectile stopped
by an adjacent wall must not acquire that impact. Actual-target artwork samples
its attachment once and retains the source's 99-coordinate suppression; generic
application helpers use their separately sourced feet fallback.

New burn and cringe entry effects apply only to successful status changes.
Paralysis publishes its message before effect 423. Focus Energy and Leech Seed
use native null helpers, Rage's false ENRAGED helper returns without artwork,
and Whiffer is sound-only. Those four paths publish their message and status
snapshot without creating an undefined effect receipt or draining a cast tail.
Whiffer sound 413 now uses the separately owned finite PCM group described in
[audio evidence](blue-audio.md). Sleep 37's helper wait completes
immediately because of its source wait flag; its visual tail remains live.
No gameplay RNG, PP, targeting or saved-state fields are owned by this visual
projection. The redundant Hypnosis readiness adapter has been removed because
dungeon entry already awaits both the effect banks and background resources.

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

The effect banks load lazily with the dungeon species. One pending load validates
bounded JSON, PNG dimensions, unique effect ownership and aggregate image memory
before decoding. It aborts sibling requests and closes partial, rejected or
disposed bitmaps; it publishes only a complete validated collection. Drawing
preserves separate effect depth layers and source per-pose attachments. The
timeline marks native generic-entity helpers explicitly, because the same image
can also use a move-target depth/sentinel route. No browser timer or gameplay
callback is owned by an image bank.

Adjacent Ember and Exeggcute's adjacent Hypnosis use the already-produced
accepted or empty endpoint receipt.
After the native launch frame, the compiler samples the current actor pose's
attachment, which may already be idle; it does not assume the cast motion is
still active. An admitted cast that reaches its natural end records the fresh idle
boundary within that presentation owner, so Cyndaquil's southwest launch and
Hypnosis delayed by an actual pre-travel LOOK drain use the source idle age.
Retired casts cannot supply that boundary. Broader untracked
idle continuity still uses the shared foreground clock and remains qualified.
Both moves have 3px-per-frame travel without sine wobble. For eight visible frames
the compiler applies the source signed16 recurrence
`x=trunc(x*5/6)` and `y=trunc((y+9)*5/6)-9`, including intermediate signed stores.
Raw 99 coordinates are transformed before the draw guard. Attachment set−1 stays
visually unoffset. Sorting uses unoffset world feet Y, divided toward zero by 2,
plus 1 for S/SE/E/W/SW or 0 for NE/N/NW; the attachment and each frame's image offset
do not move that anchor. The source owners are
[sub_8056564/sub_80566F8](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_move_util.c),
[sub_800E3AC](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/effect_main.c), and
[sub_800569C](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/sprite.c).
The fresh idle transition is owned by
[UpdateMonsterSprite](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_mon_sprite_render.c).
The first draw is C+1 and the last C+8; the handle wait retires at C+8 while the last
framebuffer sample survives until C+9.

Exeggcute's animation 3 releases on source tick 15 of 27; ordinary Hypnosis
captures set 0 after the next frame, while the cast is still active. Only the
source actor attachment is sampled: the destination is tile feet, never a
target pose. The 225 join is closed to Hypnosis/Exeggcute/one cell and reuses
Ember's unchanged recurrence. It adds no wait, drain, image, cue or gameplay
operation. No target scan, turn, clock or RNG operation is repeated.

Native persistent status symbols are already separate. For example, paralysis
has an application effect but no persistent status icon in the admitted source.

## Healing and infatuation application

Positive requested healing now emits its application even at full HP. The
presentation updates HP before the generic helper drains and plays effect 7,
then refreshes the low-HP warning, emits one result message and requests a
positive number only when HP was restored. A number-slot wait cannot delay the
preceding message. The warning holds only one pre-heal HP value per actor;
pause, finish, hiding and scene retirement retain the existing bounded lifecycle.
Canonical HP and saves are never altered by this display hold.

Successful infatuation adds generic effect 15 after the status duration draw.
Cute Charm uses this entry directly; Attract retains its separate earlier
move-target effect. The generic entry captures its attachment and unoffset
depth once, after the drain, with native invalid-99 fallback to the feet.
Both new application tracks retain the last pose on the terminator frame;
the next source call removes the handle. Creation-to-return is 72 ticks for
healing and 54 for infatuation. Other effect lifetimes remain separately
qualified and adjacent Ember's travel wait is unchanged.

These joins follow `HealTargetHP`, `InfatuateStatusTarget`, `sub_8041550`,
`sub_800DD0C` and `RunAxAnimationFrame` in the pinned comparative source.
Fresh displayed effects 7/15 now own one sound receipt at their first frame.
The bounded [PCM player](blue-audio.md) uses comparative native sequences
606/614, including full-HP healing and the heart's move/status routes. Carry,
redraw and silent completion cannot replay a receipt. Native global reverb,
mixing and exact Blue playback remain qualified.

## Hypnosis background ownership

Hypnosis alone adds effect 222 (`efbg005`) as a screen-relative background,
separate from its existing travel sprite 225. The offline exporter retains 54
pinned source files in a 148,746-byte authoring archive. Every source plane is
exactly periodic: 22 two-tick phases reduce to 13 opaque 32x32 patterns in a
2,963-byte 416x32 PNG. The background adds 53,248 decoded bytes; all selected
effect atlases now total 2,027,520 bytes under the unchanged 4MiB aggregate bound.
Confusion and Psybeam share this source preparation ID but remain outside this
background admission pending their separate timing review.

The timeline distinguishes the raw preload frame from ordinary dungeon frames.
Its wall/source mapping holds actor, effect and camera age for that one frame,
then retains the existing nonblocking preparation and TRUE global drain.
Source palette brightness is 15 on the first/last phase and 31 between them;
44 visible dungeon ticks end with a separate terminator. The HUD remains hidden
through that terminator and returns on the following dungeon frame. Minimap and
live-message windows follow their own background ownership; one ordered receipt
clears the live strings and notice cache without removing message history.
The existing LOOK request can drain the background before travel when it
actually changes the offscreen camera. It is not duplicated or bypassed.

The lower world is composed into one bounded scratch surface before the BG2
plane. Native priority makes the plane foremost over terrain and ordinary OBJ
pixels, including floating numbers. Eligible channels use the DS 6-bit 10/10
mix with rounding, then 6-to-8 expansion; Canvas source-over would differ.
The cleared BG0 retains its one-pixel guard at screen x=0, which is not an
eligible second target; the foreground pattern remains unblended there. Its
native font tile has eight `30000000` rows. In the independently anchored Blue
lower-display crop `(8,208,256,192)`, x=0 is black for all 192 rows, while the
opposite display edge varies with the scene. The first/last display rows each
have one black pixel; the adjacent outer screenshot rows are entirely black.
This distinguishes the selected display column from the surrounding screenshot
frame. These normal-screen pixels corroborate the guard, while Blue Hypnosis
priority and preload behavior remain separately qualified.

The independent hardware arithmetic source is
[melonDS GPU_ColorOp.h](https://github.com/melonDS-emu/melonDS/blob/906e9ebb27da8c6a715cd7abab4abfe8a8d29427/src/GPU_ColorOp.h),
with routing/lifetime from the pinned comparative Red effect/dungeon drivers.
The 256x192 crop at origin 0,0 is an explicit comparative assumption: Blue's
reader, framing and final effect pixels have not been independently verified.
Exact raw-preload display pixels and background 769 and travel 772 sounds remain
qualified or unselected. The adjacent 225 source attachment route is described
above; it does not establish exact Blue parity.

Only a transient empty Hypnosis endpoint receipt is added to mechanics, using
the existing impact scan. Combat calculations, PP, random calls, HP receipts and
saved state are unchanged. Pause freezes the owner; reduced-motion completion
consumes receipts once without replay, and scene retirement/disposal releases
its resources. No register-like tint persists after cancellation.

## Final faint publication

For a visible lethal reaction, the compiler retains the final C+40 image before
the matching faint removes its actor/status membership. Separate strict-time
patch and cue prefixes defer faint, item-drop, EXP and later same-tick work.
Creation limits and sparse original endpoints keep later tracks out of that
image. Only the matched hit pose gains its endpoint sample; other half-open
tracks retain their existing rules. Canonical HP and saved state are already
committed and never receive this transient projection.

One immutable frame and its semantic controls submit together. The same owner
releases only on a later eligible foreground RAF, so input and natural terminal
settlement cannot replace the image in its submission callback. Help, blur,
hidden state, scene retirement and disposal cancel the obligation without
replaying it. Initial reduced motion and explicit finish retain their existing
instant, silent settlement path. Ordinary source waits, random draws, audio
receipts and save ownership remain unchanged.

The compiler returns one exact dungeon time for actor sampling and rendering.
After a KO image is rendered successfully, a same-tiles lower bound prevents
binary64 rounding from moving the status/map/notice clock backward during a
following raw upload hold. It survives owner replacement and no-battle menus,
then retires when a different floor or non-dungeon scene is actually rendered.
Before the first checkpoint, ordinary clock arithmetic is unchanged. No epsilon,
extra source tick, fixed dwell or physical-paint acknowledgment is introduced.

The bounded recipes use the existing event ceiling; only one whole frame is
materialized. The corrected implementation and independent admission are under
`.work/blue-faint-publication-implementation-v2-20261011-1157/` and
`.work/blue-faint-implementation-independent-20261011-1153/`. Static source
checks preserve native cursor assignments, gameplay/audio calls, timers and
the source-time mapping. Manual observations remain separately recorded in
the opening review. Interrupted frames are outside the rendering-opportunity
promise, and splitting delivered cue batches retains the existing quota limits.

## Remaining qualifications

Blue effect-pixel comparisons and complete driver timing remain open. Native
cosmetic animation-start jitter is deterministically zero; it does not consume
the gameplay RNG. The selected overlay banks are incomplete: additional sprite
effects remain outside the distribution. Hypnosis now has the separate
BG2 owner above; its direct Blue framing and pixel comparison remain open.
The source attachment routes are closed to adjacent Ember and Exeggcute's
adjacent Hypnosis; other travel geometry and Attract's sine trajectory remain
separate work.
Far-Off Pals now has the bounded LOOK/SELF route described in
[visual evidence](blue-visual.md); direct Blue timing remains qualified.
These gaps are distinct from the implemented
actor motions and rotation routines.

Static checks validate source, types, paths, images and provenance without
executing game code. Manual browser/Blue comparisons remain separate evidence.
Public source provenance does not assert a rights-holder reuse grant.
