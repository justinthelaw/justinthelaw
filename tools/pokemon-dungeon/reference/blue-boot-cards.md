# Original Blue company cards

The selected opening now begins with four published original Blue images:
The Pokémon Company, the North American red Nintendo wordmark, CHUNSOFT and
its website, then the separate North American/European copyright card. The
copyright dates are 2006, 1995–2006 and 1993–2006. Platform firmware and
health-warning screens are excluded.

Original bytes, URLs, dimensions, hashes and the direct video observations are
pinned in `art/blue/native-scenery/boot-sources.json`. The four PNG captures
and three comparative logo-data files are preserved under `native-scenery/boot/`.
They are published commercial artwork; attribution does not claim a publisher
reuse license. The exporter never reads or downloads a ROM.

## Image proof

The public native `S04.bpl`, `S04c.bpc` and `S04m.bma` contain a 240×640 strip
of the same four pages. A temporary whole-chunk decode includes the last
eight padding rows; comparisons use only the declared 640-pixel image height.
The original Blue PNGs are each 255×192, omitting one blank display column.

| Blue capture | Native strip placement in the 255-pixel capture | Comparison |
| --- | --- | --- |
| [The Pokémon Company](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_The_Pokémon_Company_Logo.png) | Page 0 at (7,16) | All 48,960 pixels match at original five-bit color precision. |
| [North American Nintendo](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_North_American_Blue_Rescue_Team_Nintendo_Logo.png) | Page 1 at (7,16) | All 48,960 pixels match. |
| [CHUNSOFT](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_Chunsoft_Logo.png) | Page 2 at (7,16) | All 48,960 pixels match, including the website. |
| [North American/European copyright](https://mysterydungeonwiki.com/wiki/File:Rescue_Team_-_North_American_and_European_Copyright.png) | Page 3 at (7,25) | All 48,960 pixels match. Blue places the same lettering nine pixels lower. |

The runtime atlas preserves each original capture at x1 without scaling.
Only the missing blank column is restored, using the matching white or black
source background. Existing DS channel expansion converts the stored five-bit
colors. No logo, lettering or copyright layout is redrawn or guessed.

`scenery/boot-cards.png` is 256×768 and 9,151 bytes. Its four 256×192 rectangles
are in sequence order. `native-boot-format.mjs` repeats every byte/hash and pixel
comparison when the native scenery exporter runs. Startup loads this one PNG
with the other intro images; disposal closes its bitmap through the same owner.

## Comparative timing and direct Blue observations

The pinned source [S04 company sequence](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_s04_station.h)
uses a 20-tick fade in, 60-tick hold and 20-tick fade out for each card. The
controller waits 20 ticks between cards, with a cue delivered in each direction.
The next card therefore starts 122 ticks after the preceding one: starts are
0, 122, 244 and 366. The final card finishes its fade at tick 466.

The completion cue, four-tick controller wait, return to the parent,
`GroundMainGameEndRequest(60)` and palette-owner completion produce the selected
534-tick boot interval, or 8.9 seconds at nominal 60 Hz. The final exit still
fades the independent UI palette bank, even though the company image is already
black. Source owners are `ground_script.c`, `ground_main.c` and
`palette_util.c` at the same pinned commit. Driver startup and Blue frame
equivalence remain qualified; these numbers are not video frame measurements.

Manual inspection of the [original Blue intro](https://www.youtube.com/watch?v=4iTyZkVX9DI)
found the company card at 0:01, Nintendo at 0:03, CHUNSOFT at 0:05, and the
copyright card at 0:07 and 0:08. The frame was black at 0:09; the Post Office
interior was visible during its fade in at 0:10. This supports the sequence and
black exit interval. The compressed, stretched video shows one display, so it
does not establish exact palette channels, frame boundaries or top-display color.
An initial capture offset may also explain the player timestamps. One normal
public `yt-dlp` download attempt was rejected by YouTube's sign-in/bot check.
No video was retrieved; no cookies, authentication export, TLS changes or retry
were used. The result is recorded in `native-scenery/boot-video-download.json`.
No frame-based timing adjustment follows from that failed acquisition.

Reduced motion holds each card still at full brightness during its selected
interval and preserves the sequence and intervening black intervals.

## Integration contract

`IntroArtwork.opening()` draws the boot sequence first and subtracts
`BOOT_DURATION_MS` before sampling the existing cinematic. It requires no new
caller method. `BOOT_DURATION_MS` is 8,900 ms; `OPENING_DURATION_MS` is 27,900 ms,
including the existing qualified 19-second cinematic. `OPENING_MOVEMENT_MS`
includes the boot prefix. Title readiness and prompt clocks remain relative to
the title scene and are unchanged by this prefix.

The app must initialize its audio scene to `silent`. While its mode is `opening`,
it selects `opening` audio only when its pause-aware elapsed clock reaches
`BOOT_DURATION_MS`; otherwise it keeps `silent`. The existing idempotent
`setScene` method preserves playback on later frames. Skipping continues through
the existing title transition. The asset loader adds one PNG and no new runtime
metadata request.

The native scenery profile remains v2, with 13 PNGs totaling 184,512 bytes and a
127,981-byte manifest: 312,493 bytes in total. Manual browser acceptance of the
integrated boot/audio transition remains separate from asset and static checks.

Validation: the native scenery export check passed with all four 48,960-pixel
comparisons. Static lint passed for 597 authored files and strict types passed
for 463 source files. These checks did not execute game or native source.
