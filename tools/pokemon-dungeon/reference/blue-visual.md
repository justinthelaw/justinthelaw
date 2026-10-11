# Blue Rescue Team opening visual evidence

Checked 2026-10-10 for the browser game scoped from opening cinematic through
Caterpie's rescue. The target is the original Nintendo DS Blue Rescue Team.
Native Rescue Team image data now replaces the earlier authored approximations.
Where the available source belongs to Red Rescue Team, its edition is recorded
and Blue identity is asserted only for the pixels actually compared.

## Direct Blue evidence

The eight original Blue press PNGs are retained in
[`art/blue/native-reference`](../art/blue/native-reference/manifest.json), with
original host URLs, source timestamps and SHA-256 hashes. The logical screens
occupy (8,8,256,192) and (8,208,256,192) in those 272×408 captures.

| Evidence | Result |
| --- | --- |
| `ss02`: entry meadow | The native 432×360 map cropped at (87,80) matches the background; independent actor/template comparisons establish the field viewport center (129,108). |
| `ss02`: character pixels | Selected native Charmander, Pikachu and Butterfree poses match every opaque pixel after DS palette expansion. Their AX anchors are (145,116),(113,116),(129,92). |
| `ss02` and `ss04`: portraits | Butterfree normal at (64,24) and Pikachu inspired at (24,80) each match all 1,600 pixels of their 40×40 image. |
| `ss02`: font and windows | 265 native glyph/shadow pixels, 1,796 dialogue-border pixels and 692 portrait-border pixels match exactly. The source font resolves Rescue Team's 0, 1 and colon variants. |
| `ss01`: dungeon actors | With the source dungeon brightness conversion, Pikachu pose18 matches 314 opaque pixels at AX anchor(128,108), and Charmander's corresponding image matches 237 pixels. |
| `ss01`: HUD and team marker | 256 fixed-palette HUD pixels and 50 exposed Pikachu team-marker pixels match. Dynamic palette index 8 brightness is explicitly excluded from the HUD assertion. |

These checks compare static image data; they do not execute the game. Durable
results live in `sprite-pixel-corroboration.json`, `dungeon-sprite-pixel-corroboration.json`,
`portrait-pixel-corroboration.json`, and `ui-pixel-corroboration.json` beside the
reference images. The native export command repeats the selected exact checks.
The larger sprite comparison is also preserved as a reference report; it does
not establish every pose, species or animation timing.

Additional presentation references:

- [Nintendo's Blue manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf), printed pp. 14–15 and 24–25: cloud-backed quiz, naming grid, two displays and dungeon HUD.
- [Original DS title capture](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/): black upper display and native lower-screen title. The scenery exporter records the exact image input and its complementary frame patch.
- [Original DS dungeon capture](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287134/): four team rows, including empty slots, and compact lower-screen HUD. This is a later dungeon, not evidence of a Tiny Woods layout.
- [Original Blue opening video](https://www.youtube.com/watch?v=PsqaxW-COlM): anonymous retrieval encountered a sign-in/bot challenge. No claim of frame comparison or timing is based on this video.

## Pixel and layout contract

Both Canvas2D displays are 256×192 logical pixels. Drawing uses native dimensions,
integer destination positions and nearest-neighbor scaling. The dungeon cell is
24×24 pixels. Native sprites keep every source direction, pose, flip, frame
length, composition offset and independent shadow offset.

Dialogue uses a 224×40 native type0 window at (16,136). Its 208-pixel content area
starts at x24, and source text begins at local (4,4): absolute(28,140). Line origins
are y140,151,162. The available width after the four-pixel indentation is 204.
The font uses 11 drawn rows and source proportional advances, including a
four-pixel space. There is no extra inter-character or trailing-pixel deduction.
The speaker name is yellow; the following colon and body text are white.
Automatic pagination preserves browser-authored text in three-row pages. The
original game used explicit script line breaks, so matching page breaks are not
claimed for paraphrased dialogue.

Portraits are native 40×40 images. Their visible four-pixel source border gives
a 48×48 frame. Hero placement is (24,80), partner is flipped at (192,80), upper-left
is (64,24), and upper-right is flipped at (152,24). Portraits receive no world-camera
offset. The emotion mapping is documented separately in
[`blue-portrait-mapping.md`](blue-portrait-mapping.md).

Native male/female window palettes use the source blue/pink border banks. The
window background is the source default blue. Source UI white is #fbfbfb and
speaker yellow is #fbfb00 under the corroborated DS channel expansion.

The battle hero anchor is (128,108), with the source world position at
(tileX×24+12, tileY×24+16). Team members use the gold/brown native marker; enemies
and field actors use black native shadow silhouettes. Native AX frame offsets
move the body separately from the marker. In particular, Charmander's idle 7
animation includes an eight-frame y=-3 pose, explaining the raised body in ss01
without inventing an additional walking bounce.

The lower HUD is built from the original 8×8 tiles. Its HP bar starts at x144 and
uses one pixel per maximum HP up to 96, then scales proportionally. Floating
numbers use original hp5font image data, six-pixel advances and separate source
damage/healing palettes. Their comparative source duration is 60 frames with a
46/256-pixel rise per frame, starting 24 pixels above the actor's shadow anchor.

## Source-derived opening sequence

The pinned [public Red source](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0)
provides ordering, waypoints and native image tables. It is comparative evidence
where a corresponding Blue frame or driver behavior has not been verified.
[`DEMO_03`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_event_data.h)
orders these stages:

| Stage | Source owner | Presentation |
| --- | --- | --- |
| Post office interior | [`t01p04`, group 5](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_t01p04_station.h) | A random eligible starter visits two Pelipper. The carrier waits, flaps, rises and leaves as the camera moves upward. |
| Post office exterior | [`t01p03`, group 29](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_t01p03_station.h) | Pelipper leaves the open-beaked building and accelerates northeast. |
| Aerial town | [`s03`, group 1](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s03_station.h) | The camera pans north; Pelipper curves right, grows as it sweeps toward the viewer and drops a letter. A 60-frame white fade precedes the title. |
| Animated title | [`s02`, group 3](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s02_station.h) | A descending letter, a small westbound Pelipper, then the native large Pelipper catching the letter. The prompt appears later and blinks in 10-frame intervals. |

The reconstruction uses nominal 60Hz script frames and the source fixed-point
waypoint speeds. Interior/exterior/aerial movement and fade windows are
497/115/407 frames. The opening holds white until a qualified 19-second boundary.
Native MUS_INTRO runs continuously across the cuts and waits for its nonlooping
end; its GBA driver duration is not proof of DS completion timing. Animated-title
cue and prompt boundaries are nominally 8.75 and 10.75 seconds. An explicit skip
selects the settled title. The commercial music is not imported.

Native Titleop1/Titleop2 composition and animation data supplies the large bird
and letter. The smaller carrier uses the native Pelipper animation selected by
the ground script. Scenery, tile assembly, map coordinates, title reconstruction
and the aura background have their own pinned input inventory in
`art/blue/native-scenery` and runtime `assets/blue/scenery/manifest.json`.

## Field staging

Entry/reunion use comparative
[`d01p01`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h)
waypoints with the directly corroborated field-camera offset. The entry hero and
partner settle at (113,116)/(145,116), and Butterfree at (129,92). Butterfree follows
the original eight approach segments. Its worried turning cycle uses four
30-frame directions. The ending follows
[`d01p02`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p02_station.h):
Caterpie waits facing north while the rescuers enter from below. Reunion reward
approach and eastward departure are visual state separate from game mechanics.

The browser narrative combines some original beats and uses newly written
dialogue, browser input pacing and some reconstructed reaction timing. Native images and source
waypoints do not establish an exact commercial script or complete frame parity.

## Offline assets, memory and provenance

`art/blue/export.mjs` produces 23 native species atlases, 213 native 40×40 portrait
emotions, two title ornaments and a compact synchronous native UI data module.
The original Red sprite PNG fragments, palettes and source AX tables are pinned
in offline archives. The portrait PNGs have Rescue Team-specific wiki names,
per-image URLs, timestamps and hashes. No Explorers glyph or sprite is silently
substituted for a Rescue Team asset.

Field and dungeon sprite palettes occupy two halves of each atlas. The latter
uses floor(sourceChannel×31/256) before DS bit expansion; this is separately
corroborated against ss01. After a load, the loader retains at most 12 species
atlases and 8 MiB of decoded species pixels, with abortable local fetches and
disposed ImageBitmaps. During a transition it can briefly retain the complete
23-species inventory, totaling 11,657,216 decoded bytes, before eviction. The
largest dual-palette species image is 929,792 decoded bytes; the largest 12 fit
within the steady-state budget. The portrait atlas adds 1,382,400 decoded bytes.
Generated text tints have a 16-entry cache; UI tile caches have a fixed small
palette inventory and explicit disposal hooks.

Generate and check with the repository's required Node 24.21.0 toolchain:

```sh
node tools/pokemon-dungeon/art/blue/export.mjs
node tools/pokemon-dungeon/art/blue/export.mjs --check
```

The non-mutating check parses source byte tables and image data, hashes output
bytes, and compares selected native pixels. It does not import a runtime game
module or run a playthrough. Node 26's different zlib build produces different
PNG bytes, so it must not be used to regenerate these committed outputs.

Source manifests and asset NOTICE files record original rights-holder
attribution. Public availability is not described as a publisher reuse grant.
No ROM, copied commercial narrative, or commercial music is included in this
image pipeline. There are no runtime CDN/font/image dependencies. Historical
original scene paintings remain recoverable but all four are excluded from the
release manifest, which now selects native scenery.

## Native menu and team-screen checkpoint

The upper dungeon display now uses original Blue row artwork from the pinned
`ss01.png` press capture and [MobyGames capture 287134](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287134/).
Each row is 256×48. The empty row matches all 12,288 pixels across the captures
after their documented RGB555 display normalization. Five native sprite masks
expose 2,170 of the 2,304 occupied-pedestal positions; **134 covered positions are
inferred** using the directly observed gray-to-gold palette correspondence.
Rounded panel edges are captured pixels, while the center's horizontal stripes
are reconstructed from an unobscured column. These qualifications are recorded
in `art/blue/native-reference/panel-pixel-corroboration.json`.

The pedestals carry unscaled southwest-facing world sprites, not portraits.
Pikachu, Charmander, Psyduck and reference-only Magnemite masks match their
captured opaque pixels at anchor (24,40), with Magnemite one pixel higher. The
runtime uses their original southwest walk sequences; the upper-screen playback
cadence still needs video timing. The two captures differ in text indent: ss01
uses name x72 and level/item x76, while capture 287134 uses x56 and x60. The
[official English Blue manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf#page=13),
printed page25, independently shows the compact x56/x60 layout at half size.
The selected English retail layout therefore follows capture287134: HP slash
x134, maximum-HP right edge x157, bar x162, and tactic x148. Seven native text
samples are compared pixel by pixel by the exporter. The captured manual image
is pinned for layout evidence only; its CMYK/JPEG conversion cannot prove native
colors. A pre-release/build difference could explain ss01, but that explanation
has not been established, and no text-indent setting was found.

Two original file-menu illustrations are retained from the [public Rescue Team
menu-background collection](https://projectpokemon.org/home/gallery/album/840-rescue-team-menu-backgrounds/).
The collection identifies them as Rescue Team art retained in Explorers of Sky.
Delivery matches 31,040 unobscured background pixels in the pinned [localized
Blue comparison](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Main_Menu_Comparison_Korean.png),
using the native brightness conversion and clipped x0 column. This is background
evidence, not proof of English-retail menu text. The parent agent's direct review
of [English Blue footage at 0:05](https://www.youtube.com/watch?v=RrglH3dOqrg&t=5s)
corroborates the mailbox scene's identity; compressed video does not prove its
pixel bytes. Mailbox is the selected default. The third original illustration
and the English upper-display menu logo are still missing.

File-menu choices occupy the upper-left frame and show short authored selection
help in a 224×40 window at (16,128). The source normal-window templates and
`menu_input.c` establish eight-pixel borders, first-entry y2, and 12-pixel rows.
The selected main frame (16,8) follows the approximate English-video placement;
the localized capture uses y16. These positions are not described as a common
binary coordinate across all Blue versions.

The dungeon main menu follows the five-entry window from
[`dungeon_main.c`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_main.c)
and the three full-menu templates in
[`dungeon_vram.c`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_vram.c).
The moves window follows
[`dungeon_menu_moves.c`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_menu_moves.c):
four 12-pixel slots, a notched header, PP at local x106, and a separate lower
help window. These Blue translations remain comparative source placements.
The browser's cancel/B action returns without adding a non-native Back row.
Leader set moves use original glyph
0x8741 (the E marker); partner-enabled moves use 0x8742 (the colored star).

Tiny Woods has no Toolbox. Its Team menu follows the normal-window branch in
[`dungeon_menu_team.c`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_menu_team.c):
14 content tiles, no header, first-entry y0, and three height tiles for the two
members. The leader star starts at local x9, names follow its eight-pixel advance,
and the heart starts at local x89. Names use native yellow. Both opening members
use **yellow** hearts because they have ordinary nonnegative recruited IDs;
[`sub_806A538`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_misc.c)
reserves red hearts for negative or guest sentinel IDs. Four heart sizes use
glyphs0x874A–0x874D and compare HP to q,2q,3q where q=floor(maxHP/4), preserving
the source's rounding order. The red0x8746–0x8749 masks are retained with their
palette indices as source data, rather than incorrectly assigned to the leader.

The Team selector now follows the source camera route in
[`TryPointCameraToMonster`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_misc.c):
when the target changes, wait four nominal frames, snap to that member, then
discover its minimap surroundings. The initially highlighted member is the
teammate immediately ahead of the leader if present, otherwise the leader.
Member submenus retain the chosen camera; cancel waits before returning to the
leader. This camera is transient and resets on phase exit/Continue. A bounded
browser confirmation waiting for the four-frame change is canceled by menu
replacement, Help or lost focus; native per-frame hardware input timing is not
claimed. No camera operation advances a gameplay turn or random stream.

All three scoped floor records have visibilityRange0 and trapDensity0. In
[`dungeon_tilemap.c`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_tilemap.c),
zero light range disables the world dimming window; it does not expose the whole
minimap. This matches the bright Tiny Woods field shown in ss01 and the official
English manual p24. World terrain and on-screen items/actors therefore remain
lit, while minimap enemy dots use the current camera member's room plus border
or two-tile corridor range. Item markers remain on discovered tiles. The camera
target supplies the HUD's HP, level and Belly; a nonleader uses the native second
digit bank and cyan HP bar.

[`DiscoverMinimap`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_map_access.c)
updates persistent map knowledge only for the leader's normal movement or an
explicit camera selection. The former automatic union of both members' sight
has been removed. Existing explored tiles in older opening saves are retained;
the renderer cannot reconstruct which were previously over-revealed. Native
`UpdateTrapsVisibility` rebuilds the tile display rather than revealing traps;
Tiny Woods has none to mutate. All consumers of `state.visible`/`explored` were
audited as presentation or the unused actor-list export. AI and targeting still
use the unchanged `inSight` helper directly. Native sprite-phase randomization
on camera refresh is not copied into the gameplay RNG.

The naming UI now renders the native special glyphs, rounded window frame,
double underline, selection arrow and flipped text caret. Nintendo's Blue manual,
printed p15, visibly shows rounded, layered borders on both naming panels. The
parent agent's direct review of [Blue footage at 1:37](https://www.youtube.com/watch?v=RrglH3dOqrg&t=97s)
corroborates that frame style and the outer boxes `(32,16,192,56)` and
`(8,88,240,88)`. `nativeNamingFrame` therefore uses the existing native normal
window tiles; the comparative Red borderless template's one-pixel outline is not
used for Blue. Text, key and caret positions are unchanged. The compressed video
and small manual image establish the frame family, not every border pixel.
Interior key positions remain comparative source coordinates. The editor owns
the exact source key adjacency and 60-pixel name width restriction separately
from rendering.

The live dungeon log preserves its original 224×40 visible window with three
11-pixel rows. Its fourth row is a scrolling buffer, not extra visible height.
The renderer advances one pixel per nominal frame for eleven frames, pauses
while a menu covers it, and keeps a bounded 24-line presentation queue. The app
owns the 240-frame expiry; the persisted message log is independent.

## Blue display modes and SELECT map

Nintendo's [English Blue manual, printed pp24–25](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf)
identifies the seven paired screen modes. Their exact ordering is retained in
[`DSMapOption`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/include/game_options.h):

| Mode | Upper screen | Lower map |
| --- | --- | --- |
| A | Team | Off |
| B | Team | Clear |
| C | Team | Shaded |
| D | Message Log | Off |
| E | Message Log | Clear |
| F | Message Log | Shaded |
| G | Map and Team | Off |

`InitializeGameOptions` selects B. Fresh browser preferences now do the same.
Existing exact v1 records migrate their explicit upper Team/Log/Map choices to
A/D/G, preserving text speed, dungeon speed, grid and sound preferences. The old
lower-map toggle was transient, so it cannot be recovered from saved preferences.
The storage key is unchanged; migration does not rewrite an unreadable record.
These are presentation preferences, separate from the adventure save.

SELECT follows the Blue-aware branch of
[`DungeonHandlePlayerInput`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_main.c).
It leaves the upper mode unchanged, temporarily enables Clear for A/D, and keeps
the existing Clear/Shaded variant for B/C/E/F. G ignores SELECT. The modal waits
ten nominal frames before accepting A to toggle **all** monster markers, including
the leader and partner. B or SELECT closes it, restores the original mode and
marker flag, then waits two display frames before normal input resumes. Help,
hidden tabs and lost focus pause these clocks. The world and object layers are
hidden by source mask0x1E; the map and native HUD remain over a black backdrop.
Entry clears only the live message window, preserving the saved Message Log.
Opening, toggling and closing the map consume no turn, RNG or map-discovery work.

The compact export parses the literal native
[`zmappat.inc`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/dungeon/zmappat.inc)
pointer table into 192 four-by-four masks: shaded, clear and upper-map banks.
Each record's four quadrant encodings are checked for agreement. Native shaded
floors use a transparent checker pattern; clear floors retain their edge lines
with transparent interiors. The upper bank uses a solid window-color interior.
The renderer uses source origins `(8,0)` on the lower display and `(16,4)` on the
upper display, with the source top-row exclusions and clipping. Wall-edge bits
are south/east/north/west in order. Existing discovered tiles, camera-local enemy
visibility and persistent item knowledge feed this presentation without changing
AI or targeting. Actor markers have priority over items and stairs; toggling
monsters off lets known items or stairs under them appear.

Five marker masks in the pinned
[retail Blue capture](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287134/)
match all 60 opaque pixels after the documented RGB555 display expansion:
red enemies at `(120,16)` and `(124,16)`, white leader at `(128,16)`, and yellow
allies at `(132,16)` and `(136,16)`. Transparent corners and unsampled floor-bank
pixels are not promoted to screenshot proof. The exporter records and rechecks
this evidence in `native-reference/ui-pixel-corroboration.json` without importing
or executing runtime game modules.

The normal leader marker follows `FlashLeaderIcon`'s eight-frame blink bit; a new
prepared player-input opportunity resets its phase, while menus and map toggles
within that opportunity do not. Forced sleep/infatuation/Bide opportunities do
not trigger the reset. SELECT uses the steady native player cell instead and
freezes the separate blink counter. Reduced motion keeps the marker visible.

The English manual's upper Map-and-Team illustration shows a rounded footer at
half-size `(8,64,112,32)`, corresponding to native `(16,128,224,64)`. It contains
two member rows, each with a yellow name, full **Level** label and current/max HP.
The former browser Belly/Money row is absent; those details belong to the separate
lower-screen main-menu summary pictured on printed p24. The renderer now uses
the measured footer frame and 12-pixel rows, with name/level/HP columns at roughly
x28/96/160. The untouched lower portion is blank for this two-member team.

`native-reference/map-blue-manual.png` retains the original embedded 128×96
illustration, and `map-footer-evidence.json` records its hash, PDF provenance and
measurement limitations. Whole-pixel text origins and three-character HP padding
are inferred from compressed half-size imagery; they are not native pixel proofs.
The public comparative source retains stubs for the DS upper-display path in
`unk_ds_only_feature.c` and `sprite.c`, so it cannot resolve those details.

The footer retains the observed male blue frame. A corresponding female dungeon
map capture has not yet been established. Pink overworld region-map labels and
the comparative DS palette-copy path are insufficient to prove this footer's
female palette. Gender behavior and the unchanged upper backdrop remain review
gaps; no exact-complete-screen claim follows from the measured correction.

## Remaining visual acceptance

Static pixel proofs cover the explicitly recorded samples, not the full game.
Exact Blue driver timing, every pose/species, all aura palette animation,
comprehensive menu geometry, story pacing, remaining reaction effects and
browser/device presentation still require direct review. The cause of the press
team-layout variant and preview animation timing remain explicitly unresolved.

Human review should compare title, quiz, naming, all starter/partner sizes,
three-line dialogue, Tiny Woods battle HUD, visibility/minimap and Caterpie's
rescue at native resolution. It should check integer/fractional CSS scaling,
reduced motion, pause/resume and one-turn animation. Do not call the complete
browser game an exact replica solely because selected pixels or static checks
pass.
