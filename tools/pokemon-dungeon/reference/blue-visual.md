# Blue Rescue Team opening visual evidence

Target: original Nintendo DS Blue, opening cinematic through Caterpie's rescue.
Native imagery replaces authored approximations; Red data is comparative unless
selected Blue pixels were compared. [The immutable full record](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-visual.md)
preserves the 2026-10-10 checkpoint, all URLs, measurements and qualifications.

## Direct Blue evidence

Eight original press PNGs in [the manifest](../art/blue/native-reference/manifest.json)
retain URLs, timestamps and SHA-256. Logical screens are (8,8,256,192) and
(8,208,256,192) in 272x408 captures. Adjacent corroboration JSON records are
rechecked by the exporter; static matches do not establish animation.

| Sample | Exact comparison / limitation |
| --- | --- |
| ss02 meadow | Native 432x360 map crop(87,80); independent actor/template center(129,108) |
| ss02 characters | Selected Charmander/Pikachu/Butterfree opaque pixels match after DS expansion; AX anchors(145,116)/(113,116)/(129,92) |
| ss02/ss04 portraits | Butterfree normal(64,24), Pikachu inspired(24,80): all 1,600 pixels each |
| ss02 UI | 265 glyph/shadow, 1,796 dialogue-border, 692 portrait-border pixels; source 0/1/colon variants |
| ss01 actors | Dungeon brightness: Pikachu pose 18, 314 opaque pixels at(128,108); Charmander237 |
| ss01 HUD/marker | 256 fixed-palette HUD pixels, 50 exposed marker pixels; dynamic palette-index 8 brightness excluded |

Reports: sprite-pixel-corroboration.json, dungeon-sprite-pixel-corroboration.json,
portrait-pixel-corroboration.json, ui-pixel-corroboration.json. Larger sprite
comparisons do not certify every pose/species. Supporting sources:
[Blue manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_ds_21/Manual_NintendoDS_PokemonMysteryDungeonBlueRescueTeam_EN.pdf)
pp14-15/24-25; [DS title](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287133/);
[later-dungeon capture](https://www.mobygames.com/game/24322/pokemon-mystery-dungeon-blue-rescue-team/screenshots/nintendo-ds/287134/)
(no Tiny Woods layout proof). [Opening video](https://www.youtube.com/watch?v=PsqaxW-COlM)
retrieval hit a sign-in/bot challenge; it supplies no compared frames/timing.

## Pixel and layout contract

| Surface | Geometry and ownership |
| --- | --- |
| Displays/world | Two 256x192 Canvas 2D displays, native integer positions, nearest-neighbor scaling; 24 px cells. Source directions/poses/flips/durations/body/shadow offsets remain. |
| Dialogue | Type 0 window 224x40 at(16,136); 208 px content from x24, text(28,140); line origins 140/151/162; 204 px after indentation. Eleven drawn font rows, proportional advances/four-pixel space; no extra spacing deduction. |
| Portraits | 40x40 art/48x48 frame: hero(24,80), flipped partner(192,80), upper-left(64,24), flipped upper-right(152,24); no camera offset. [Emotion mapping](blue-portrait-mapping.md). |
| Palette/text | Male/female blue/pink borders, default blue background; white #fbfbfb, speaker yellow #fbfb00, white colon/body. Authored three-row pagination does not reproduce native script line breaks. |
| Actor anchor | Hero(128,108), world(tileX*24+12,tileY*24+16); team gold/brown marker, enemies/field black shadow. Charmander idle7 contains eight frames y=-3, not invented bounce. |
| HUD/numbers | Native 8x8 tiles; HP bar x144, one pixel/maxHP through 96 then proportional. hp5font advances 6 px; comparative 60-frame duration,46/256 px rise/frame, start 24 px above shadow. |

## Opening and field staging

Comparative pin:
[pret/pmd-red@013475aa04f5be3191e5527c186d9bfceae7cae0](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0).
[DEMO_03](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_event_data.h)
orders post-office interior t01p04/group5, exterior t01p03/group29, aerial
town s03/group1, title s02/group3. Current scene clocks, title boundaries and boot prefix are owned by
[opening choreography](blue-opening-choreography.md) and
[boot-card evidence](blue-boot-cards.md). Skip selects the settled title.
Comparative GBA music timing is not DS proof; background music is absent.

Native Titleop1/2 supply large Pelipper/letter; small carrier uses the ground
script animation. Full source records live in art/blue/native-scenery and
native-scenery-metadata.json; runtime keeps terrain/aura fields.
Entry/reunion follow [d01p01](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h):
hero/partner(113,116)/(145,116), Butterfree(129,92), eight approach segments/four
30-frame worried turns. [d01p02](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p02_station.h)
has north-facing Caterpie as rescuers enter below. Reward/departure are visual
state. Combined beats, paraphrases, browser pacing and reconstructed reactions
do not establish exact commercial script/frame parity.

## Assets, memory and provenance

art/blue/export.mjs builds 23 species atlases, 89 selected portraits, two title
ornaments and synchronous UI data. Native fragments/palettes/AX tables are pinned
offline; all 213 portrait sources retain URL/time/hash. No Explorers substitution
is silent. Field/dungeon palettes occupy atlas halves; dungeon conversion is
floor(sourceChannel*31/256) before DS expansion, corroborated against ss01.

Loader steady state: at most 12 species/8 MiB decoded; transitions can briefly hold
all 23/11,657,216 bytes. Largest atlas 929,792 bytes; largest 12 fit the steady cap.
Scoped trimming retained 19,232 of29,589 animation rows, saving 199,380 JSON bytes
without changing PNGs/retained poses/attachments/clips. Removed motions are not
claimed globally unused. Portrait atlas 320x480 uses 614,400 decoded bytes
; current encoded sizes belong to the generated manifest. Omitted emotions save
768,000 decoded bytes. Text tint cache 16; bounded UI caches/ImageBitmaps have disposal hooks.

Run the native exporter or its non-mutating check with repository-pinned Node24:

- node tools/pokemon-dungeon/art/blue/export.mjs
- node tools/pokemon-dungeon/art/blue/export.mjs --check

Checks parse/hash tables/images and compare selected pixels without game imports.
Node 26 zlib produces different PNG bytes. NOTICE/manifests retain attribution;
public availability is not a reuse grant. No ROM/commercial narrative/music or
runtime CDN/font/image dependency is added. Four former scene paintings remain
recoverable but outside distribution.

## Menus, team screen and camera

| Evidence/owner | Current result and qualification |
| --- | --- |
| ss01/retail team panels | 256x48 rows; all 12,288 empty-row pixels match after RGB555 normalization. Masks expose 2170/2304 occupied-pedestal positions; 134 inferred gray-to-gold. Captured edges/stripe-column reconstruction: panel-pixel-corroboration.json. |
| English retail layout | Retail namex56/level-itemx60 versus ss01 x72/x76; manualp25 confirms compact layout at half size. Cause unknown. HP slash134/max right157/bar162/tactic148; seven exact text samples. Manual CMYK/JPEG cannot prove colors. |
| Upper actors | Unscaled southwest sprites at(24,40), reference Magnemite one pixel higher. Selected Pikachu/Charmander/Psyduck/Magnemite masks match; walk cadence needs video timing. |
| File-menu backgrounds | [Rescue Team collection](https://projectpokemon.org/home/gallery/album/840-rescue-team-menu-backgrounds/) retained in Explorers. Delivery matches31,040 [localized comparison](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Main_Menu_Comparison_Korean.png) pixels and36,352 unobscured [NA Blue capture](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Blue_NA_Menu_%26_Controls.png) pixels; wiki capture origin uncredited. Default Mailbox is corroborated by [English footage0:05](https://www.youtube.com/watch?v=RrglH3dOqrg&t=5s), not pixel proof. |
| Upper file-menu logo | NA foreground21,624 pixels via 64-color mapping plus menu mask/backdrop; all 49,152 normalized pixels match. European logo differs. |
| Third illustration | Manual p16 shows Charmander/Bulbasaur/Pelipper;240x180 wiki/240x160 Red rasters do not establish complete Blue image. [LoadTitleScreen](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/main_loops.c#L306) chooses three in Red; Blue selection remains open, with no invented two-image randomizer. |
| File-menu geometry | Root(16,16),96x40 for two choices, text(32,26), variable height; help(16,128),224x40. Eight-pixel borders/12 px rows;1241 label/help pixels match white/gray #414141. Glyphs clip to content, cursor does not; other confirmation shadows stay black. |
| Dungeon menus | dungeon_main.c/dungeon_vram.c/dungeon_menu_moves.c: five choices; four 12 px move slots/notched header/PP localx106. B cancels without Back row. Set glyph0x8741/enabled star0x8742. |
| No-Toolbox Team | dungeon_menu_team.c:14 content tiles/no header/firsty0/height3 tiles. Leader starx9/names+8/heartx89. Yellow names/hearts; glyphs0x874A-D compare q=floor(maxHP/4), q/2q/3q. Negative/guest IDs alone get red (dungeon_misc.c:sub_806A538). |

Team selection changes camera after four frames, discovers surroundings, keeps
chosen camera in member submenus and returns on cancel. Initial selection is
teammate ahead, otherwise leader. Replacement/Help/focus loss cancel pending
confirmation; no gameplay turn/RNG advances.

Far-Off Pals LOOK/SELF uses action/target receipts; line focus follows travel.
Manual p28 proves LOOK's purpose; timing is comparative. Changed automatic targets
drain effects, count toward 60-frame threshold, then wait four frames and snap;
unchanged targets do not wait. Input return resets counter before forced wait/
blink reset. Fresh/unprepared floors start 99, restored prepared boundaries 0,
without replayed upkeep. Camera age is unsaved. Discoveries deduplicate at most
1792 tiles, guarded by floor/transition; Help/blur/loading freeze time.
Preferences v3 add LOOK/SELF, preserving v1/v2. Level-up/summary focus, conditional
message waits and exact Blue phase remain qualified.

All floors have visibilityRange0/trapDensity0: no world dimming, not full minimap
knowledge ([tilemap](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_tilemap.c)).
Enemy dots use camera member room+border/two-tile corridor; known items remain.
Camera member supplies HUD, nonleader cyan HP/second digit bank.
[DiscoverMinimap](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_map_access.c)
runs for leader movement/actual camera changes, not automatic partner union.
Old over-revealed tiles stay. AI sight has separate owners; refresh jitter never
uses gameplay RNG.

Naming uses native glyphs/rounded frames/underline/arrows/caret. Manual p15 and
[footage1:37](https://www.youtube.com/watch?v=RrglH3dOqrg&t=97s) corroborate
outer(32,16,192,56)/(8,88,240,88), not every border pixel. Interior keys remain
comparative; editor owns source adjacency/60 px width. Live dungeon log224x40:
three 11 px rows plus scroll buffer, one pixel/frame for 11 frames, menu pause,
24-line queue,240-frame expiry; saved log independent.

## Blue display modes and SELECT map

Manual pp24-25 and [DSMapOption](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/include/game_options.h)
establish order. B is native/fresh default; old v1 Team/Log/Map migrate A/D/G
because the lower toggle was transient. Unreadable records stay untouched;
preferences and adventure saves are separate.

| Mode | Upper | Lower map |
| --- | --- | --- |
| A/B/C | Team | Off/Clear/Shaded respectively |
| D/E/F | Message Log | Off/Clear/Shaded respectively |
| G | Map and Team | Off |

SELECT keeps upper mode; A/D temporarily Clear, B/C/E/F retain variant, G ignores.
After ten frames A toggles all monster markers; B/SELECT restores flags and waits
two frames before input. Help/hidden/focus loss pause it. Mask0x1E hides world/
objects over black; HUD/map remain. Entry clears live text, not saved log.
No turn/RNG/discovery occurs.

[zmappat.inc](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/data/dungeon/zmappat.inc)
supplies 192 masks of 4x4: shaded checker/clear transparent interior/upper window
color. Origins lower(8,0)/upper(16,4), source clipping/top-row exclusions, wall bits
S/E/N/W. Actors outrank items/stairs; hiding monsters exposes known underlying
markers. Retail capture verifies 60 opaque pixels across five markers
(120,16)..(136,16), not corners/unsampled bank pixels. Leader's eight-frame blink
resets at prepared ordinary input only; SELECT freezes it/use steady marker;
reduced motion keeps it visible.

Manual's half-size Map-and-Team footer maps to(16,128,224,64), two rows of yellow
name/full Level/current-maxHP, blank below; no Belly/Money row. Approximate
columnsx28/96/160 and HP padding are inferred, not pixel proofs. Original 128x96
map-blue-manual.png and map-footer-evidence.json retain hash/PDF limits.
DS stubs in unk_ds_only_feature.c/sprite.c cannot resolve details. Male blue frame
is observed; female palette/upper backdrop remain open.

## Remaining visual acceptance

Selected pixels do not establish exact timing, every pose, aura palettes, complete
geometry/story pacing or device presentation. Compare title/quiz/naming, starter
sizes, dialogue, HUD/maps and rescue at native resolution; check CSS scaling,
reduced motion, pause/resume and turn animation. Press-layout cause, team cadence
and unverified Blue effects remain gaps; see [battle visuals](blue-battle-visuals.md).
