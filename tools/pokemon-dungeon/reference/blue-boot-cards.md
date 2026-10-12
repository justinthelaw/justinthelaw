# Original Blue company cards

The opening uses The Pokémon Company, North American Nintendo, CHUNSOFT/website
and North American/European copyright cards. Firmware/health-warning screens
are excluded. `art/blue/native-scenery/boot-sources.json` pins original bytes,
URLs, dimensions, hashes and video observations; four captures and three
comparative data files remain under `native-scenery/boot/`.
Attribution is not a reuse grant; the exporter reads no ROM.

## Pixel evidence

Comparative `S04.bpl/S04c.bpc/S04m.bma` decode to a 240x640 four-page strip.
Ignore the eight padding rows. Each Blue capture is 255x192, missing one blank
display column; the runtime restores only that matching background column.

| Blue capture | Native strip placement in the 255-pixel capture | Comparison |
| --- | --- | --- |
| [The Pokémon Company](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_The_Pokémon_Company_Logo.png) | Page 0 at (7,16) | All 48,960 pixels match at original five-bit color precision. |
| [North American Nintendo](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_North_American_Blue_Rescue_Team_Nintendo_Logo.png) | Page 1 at (7,16) | All 48,960 pixels match. |
| [CHUNSOFT](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Chunsoft_Logo.png) | Page 2 at (7,16) | All 48,960 pixels match, including the website. |
| [North American/European copyright](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_North_American_and_European_Copyright.png) | Page 3 at (7,25) | All 48,960 pixels match. Blue places the same lettering nine pixels lower. |

`native-boot-format.mjs` rechecks bytes/hashes/pixels. The four 256x192 atlas
rectangles preserve x1 capture placement and existing five-bit channel expansion.
Current encoded sizes belong in the scenery manifest.

## Timing and integration

[Pinned S04 sequence](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s04_station.h)
uses 20-tick fade in, 60 hold, 20 fade out and controller/cue waits:
starts 0/122/244/366, final image fade ends 466. Completion/parent return,
`GroundMainGameEndRequest(60)` and UI-palette completion yield 534 ticks
(8.9 seconds at nominal 60 Hz). `ground_script.c`, `ground_main.c` and
`palette_util.c` own those comparative calculations, not Blue frame measurements.

[Blue footage](https://www.youtube.com/watch?v=4iTyZkVX9DI) was observed at
0:01 company, 0:03 Nintendo, 0:05 CHUNSOFT, 0:07–08 copyright, 0:09 black
and 0:10 Post Office fade. The stretched one-display video corroborates order,
not exact timing/colors. A failed video download and its limits are recorded in
`native-scenery/boot-video-download.json`; no timing adjustment follows from it.

`IntroArtwork.opening()` subtracts `BOOT_DURATION_MS=8900` before the existing
19-second cinematic (`OPENING_DURATION_MS=27900`). Title-relative clocks are
unchanged. Reduced motion keeps sequence/black intervals with still bright cards.
One local atlas shares the intro loader/disposal owner. Boot schedules no sound;
a deliberate gesture unlocks gameplay/UI effects. Background music stays absent.
Static export checks and manual integrated boot/audio acceptance are separate.
