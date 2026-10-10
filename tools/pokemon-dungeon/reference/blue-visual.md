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
corroborated against ss01. The loader retains at most 12 species atlases and 8 MiB
of decoded species pixels, with abortable local fetches and disposed ImageBitmaps.
The largest dual-palette species image is 929,792 decoded bytes; the largest 12
fit within the species budget. The portrait atlas adds 1,382,400 decoded bytes.
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

## Remaining visual acceptance

Static pixel proofs cover the explicitly recorded samples, not the full game.
Exact Blue driver timing, every pose/species, all aura palette animation,
comprehensive menu geometry, story pacing, remaining reaction effects and
browser/device presentation still require direct review. The upper team panel
also needs a native-layout comparison independent of its now-correct font.

Human review should compare title, quiz, naming, all starter/partner sizes,
three-line dialogue, Tiny Woods battle HUD, visibility/minimap and Caterpie's
rescue at native resolution. It should check integer/fractional CSS scaling,
reduced motion, pause/resume and one-turn animation. Do not call the complete
browser game an exact replica solely because selected pixels or static checks
pass.
