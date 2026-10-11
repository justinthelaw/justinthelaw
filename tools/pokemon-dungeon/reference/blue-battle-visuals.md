# Opening battle visuals

The selected browser renderer uses native actor motions and two closed banks of
25 battle effects from the pinned comparative Red tables. A separate timeline
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

The existing basic atlas is 512×532, 21,890 encoded bytes and 1,089,536 decoded
bytes. Its 24,848-byte metadata preserves 197 pose variants, 149 unique images
and 15 effects. Nondirectional effects store one sequence; Growl stores eight.
The PNG is byte-identical to the reviewed study image. Static validation checks
the complete source inventory, source hashes, palette domains, source OAM bounds,
layer rectangles, attachment-set IDs, frame references and duration sums. Limits
are 256KiB encoded image, 128KiB metadata and 2MiB decoded image; the selected
distribution's independent 3MiB limit is unchanged.

A second initial bank retains effects 7,15,21,128,150,225,287,312,402 and 425. Its
seven indexed inputs (`efob000`, `efob020`, `efob023`, `efob051`, `efob073`,
`efob081`, `efob113`) and their native tables/palettes are pinned by
`native-battle-initial-sources.json` and a 92,918-byte offline archive. The atlas
is 512×771: 31,183 PNG bytes, 41,257 metadata bytes and 1,579,008 decoded bytes.
Absorb and Hypnosis travel retain all eight directional sequences. The original
basic PNG, metadata and pose evidence are byte-identical to their prior outputs.

The initial images cover healing, infatuation, shared cast, Absorb, Water Sport,
Hypnosis travel, Leer, Helping Hand, special-attack up and attack up. Image
availability does not imply that every producer callback is already joined.
Healing/full-HP and successful infatuation entry now have explicit receipts below.
The two selected banks total 2,668,544 decoded bytes under an aggregate 4MiB effect
limit. Per-bank limits stay unchanged. Each effect ID belongs to exactly one
bank, and every sampled layer keeps that bank's local pose rectangle.

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
tail without blocking its own handle wait. The other 24 selected effects have
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

The effect banks load lazily with the dungeon species. One pending load validates
bounded JSON, PNG dimensions, unique effect ownership and aggregate image memory
before decoding. It aborts sibling requests and closes partial, rejected or
disposed bitmaps; it publishes only a complete validated collection. Drawing
preserves separate effect depth layers and source per-pose attachments. The
timeline marks native generic-entity helpers explicitly, because the same image
can also use a move-target depth/sentinel route. No browser timer or gameplay
callback is owned by an image bank.

Adjacent Ember uses the already-produced accepted or empty endpoint receipt.
After the native launch frame, the compiler samples the current actor pose's
attachment, which may already be idle; it does not assume the cast motion is
still active. An Ember cast that reaches its natural end records the fresh idle
boundary within that presentation owner, so Cyndaquil's southwest launch uses
the first idle pose. Retired casts cannot supply that boundary. Broader untracked
idle continuity still uses the shared foreground clock and remains qualified.
For eight visible frames it applies the source signed16 recurrence
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
framebuffer sample survives until C+9. No target scan, turn, clock or RNG operation
is repeated by this geometry projection.

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
The existing authored heal sound now starts on the effect's first frame.
Native DirectSound effects 606/614 and exact Blue playback remain unimplemented.

## Remaining qualifications

Blue effect-pixel comparisons and complete driver timing remain open. Native
cosmetic animation-start jitter is deterministically zero; it does not consume
the gameplay RNG. The selected overlay banks are incomplete: 11 later-level
sprite effects and Hypnosis background 222 remain outside the distribution.
Hypnosis travel 225 is separate sprite artwork and does not replace its BG2 plane.
The source's brightness/blend control and Blue framing need their own admission.
The current Ember endpoint and attachment route is closed to adjacent Ember;
other travel geometry, Attract's sine trajectory and Far-Off Pals camera behavior
remain separate source/producer work. These gaps are distinct from the implemented
actor motions and rotation routines.

Static checks validate source, types, paths, images and provenance without
executing game code. Manual browser/Blue comparisons remain separate evidence.
Public source provenance does not assert a rights-holder reuse grant.
