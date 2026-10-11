# Blue Rescue Team opening audio

The browser opening uses the project's original synthesized score. It does not
contain the Nintendo DS soundtrack, PCM samples or sound banks. Five menu roles
use four source-derived short PSG effects; two no-damage roles use two more.
These are Red Rescue Team comparative evidence until Blue playback is corroborated.
The scoped bank in `src/blue/audio-bank.js` contains 11 themes and 21 effects;
its editable source is `tools/pokemon-dungeon/audio/blue-original-score.json`.
The original opening composition lasts 18.9 seconds and plays once. It begins
after the silent 8.9-second boot sequence; the cinematic lasts 19.0 seconds.
These separate clocks are a qualified approximation, not an exact audio/video
match. The reunion theme loops for the entire scene.

From `tools/pokemon-dungeon`, run `node scripts/export-blue-original-audio.mjs`
to regenerate the selected bank, or add `--check` to verify it without writing.
This offline exporter reads only the opening's JSON. It checks the 32 selected
cues, all nine used oscillator patches, ordered notes and the existing voice
reservation bound. JSON token spelling is preserved, including the current
intro tempo and reunion loop settings. Later-campaign music IDs, dungeon-index
tables and scene-request catalogs are not part of this source or export.

## Reference cues

The [Blue Rescue Team soundtrack catalog](https://www.zophar.net/music/nintendo-ds-2sf/pokemon-mystery-dungeon-blue-rescue-team)
identifies these relevant tracks. The catalog is research evidence, not evidence
of permission to redistribute its recordings. No audio was downloaded from it.

| Scene | Blue track | Internal identifier |
| --- | --- | --- |
| Opening cinematic | Opening | `SND_BGM_M_SYS_TITLE_01` |
| Title | Pokémon Rescue Team Theme | `SND_BGM_M_SYS_TITLE_02` |
| Main menu | Top Menu | `SND_BGM_M_HABITAT_HOME_SHINKA` |
| Personality quiz | Welcome! To the World of Pokémon! | `SND_BGM_M_EVENT_YUME` |
| Awakening and introductions | Meeting with a Partner | `SND_BGM_M_EVENT_CALMLY` |
| Butterfree's request | There's Trouble! | `SND_BGM_M_EVENT_KINPAKU` |
| Tiny Woods floors | Tiny Woods | `SND_BGM_M_DUNGEON_CHIISANAMORI_01` |
| Caterpie clearing | In the Depths of the Pit | `SND_BGM_M_DUNGEON_EVENTFLOOR_01` |
| Reunion | Job Clear! | `SND_BGM_M_EVENT_CLEARD` |

## Comparative timing evidence

The following source is **Red Rescue Team comparative evidence**. Its numeric
IDs and script ticks have not been independently verified against Blue binary
execution. Pin: `pret/pmd-red@013475aa04f5be3191e5527c186d9bfceae7cae0`.

- [Tiny Woods entrance and reunion](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h):
  opening narration starts in silence; partner music fades in over 60 script
  ticks; the trouble cue begins after Butterfree arrives; the dungeon transition
  requests a 30-tick music fade; the reunion selects the successful-rescue BGM.
- [Caterpie clearing](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p02_station.h):
  the fixed clearing selects the pit track. Caterpie's jumping gesture uses
  effect 457, identified as `EVENT_MOTION_JUMP_02` by the source sound-name table.
- [Sound names](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/sound_names.c)
  and [music roles](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/include/constants/bg_music.h)
  cross-reference event and music identifiers. They were used for role research,
  not to copy melodies, sample bytes, or commercial sound effects.

The `DEMO_03` route runs post office inside, outside, town, then title station
224/group 3. The first three scenes all request `MUS_INTRO`; `StartNewBGM` in
`src/music.c` preserves an already-playing matching track. Town's white fade
therefore does not restart the opening music. Opcode `E0` in
`src/ground_script.c` waits while that track remains current, then title group 3
starts `MUS_TITLE_SCREEN`. Its letter/Pelipper animation and ready prompt use
the same track. `MUS_OPENING_TITLE` belongs to separate title group 2 and is not
selected by `DEMO_03` or the shortened `DEMO_04` route.

Static arithmetic over the controlling `seq_040` track's 876 wait ticks and
tempo changes gives a nominal 18.891713 seconds. The comparative GBA driver's
frame accumulator and end detection put its end around 19 seconds; these are
not verified DS driver timings. The browser's 19.0-second cinematic and
18.9-second authored cue are qualified timing approximations. Only
wait/tempo/control facts were inspected; no commercial note data is imported
into the authored score.

## Browser implementation and remaining parity

`createOpeningAudio(document)` in `src/blue/audio.js` owns a local Web Audio
transport and scoped bank, with no WebGL, network or game-state dependency.
Construction is silent. A trusted native iframe input must activate audio;
synthetic host-control events cannot unlock it. Hidden, blurred and removed
pages stop audio. A new trusted gesture resumes the retained music position;
old effects never replay. A resume promise retired by interruption cannot
silence a newer trusted activation. Disposal invalidates pending callbacks and releases
nodes and listeners. Bounds are one context, 32 voices and four new effects per
presentation. See [Web Audio autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
and [audio scheduling guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

On music resume or a delayed pump, binary search skips elapsed notes before
the 64-note scheduling limit applies. Seven scoped loops contain 76 notes;
scanning old notes against that limit previously delayed the remaining notes
by another 80-millisecond pump. For example, Tiny Woods resumed at 14.43 seconds
could drop its note at 14.454545 seconds, despite the transport's 25-millisecond
lead. This correction changes only the audio cursor, not score data, effect
consumption, voice bounds, game state or activation permission. Static score
ordering and timing arithmetic support the fix; browser audition remains open.

Exact commercial melodies, DS sample timbres, loop points, source fade timing,
scene-to-cue timing, SFX playback and mix remain unverified. Static type, syntax,
data and import checks do not establish human audition or soundtrack parity.
No claim of an exact DS audio reproduction is supported by this implementation.

## Source-derived menu effects — 2026-10-10

`audio/blue-menu-effects.json` pins 13 source files at the comparative commit
above. `export-blue-menu-effects.mjs --source-root PATH --check` verifies those
source bytes and regenerates only numerical short-effect facts. It never imports
or executes game code. The original Blue sound-effects archive at
[Spriters Resource](https://sounds.spriters-resource.com/ds_dsi/pokemonmysterydungeonbluerescueteam/asset/395434/)
remained behind its verification page in the normal browser; no archive was
downloaded and no Blue file-number mapping was guessed.

| Role | Sequence | Pulse duty | Audible events |
| --- | --- | --- | --- |
| Navigate | 301 | 50% | Key 84 for two ticks |
| Accept | 302 | 50% | Key 90 for two ticks; the preceding same-tick key 79 is replaced |
| Back / invalid | 303 | 25% | Keys 58,55,67,67 at ticks 0,3,5,6, with gates 2,2,1,1 |
| Open / information | 304 | 50% | Key 88 for one tick |

The source tempo resolves to one tick per GBA frame (280,896 cycles at
16,777,216 Hz). Pitch uses the original integer frequency-register table, and
center-pan/velocity arithmetic resolves to four-bit envelope levels. Attack and
release are instantaneous. Accept's remaining 384-tick track span is silence.
The SE2 player has priority checking disabled, so a new menu request replaces
its old cue, including scheduled future notes. General menus retain the four-frame
throttle; dungeon menu wrappers bypass it.

`audio-menu.js` owns at most four scheduled oscillators and three cached pulse
waveforms. Its voices share the existing 32-voice ceiling with the authored
synthesizer. Pause, mute, interruption, denial, epoch replacement and disposal
stop and disconnect both players; retired effects never replay on activation.
Web Audio band-limiting, a quiet browser gain and the existing output compressor
remain presentation choices. Their waveform phase, analog filtering, DS clock,
overall mix and exact Blue parity are not established by these comparative facts.

## Source-derived no-damage effects — 2026-10-11

`audio/blue-battle-effects.json` pins 21 public source files for two short PSG
effects. The same exporter verifies their hashes with `--source-root PATH` and
adds bounded `BATTLE_EFFECTS` data beside the unchanged menu tuples. The original
authored score is unchanged. No PCM, music or ROM data is added.

| Public audio API | Native ID / source name | Keys | Frequency divisors |
| --- | --- | --- | --- |
| `audio.effect('noDamageTeam')` | 342 / `MISS_PLAYER_M` | 74, 70, 66, 62 | 224, 282, 355, 447 |
| `audio.effect('noDamageOther')` | 343 / `MISS_ENEMY_M` | 65, 61, 57, 53 | 376, 473, 596, 751 |

The public sequences are [342](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_342.s)
and [343](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_343.s).
Both use bank 027 voice 61, 12.5% pulse duty, volume 78, velocity 120 and center
pan. Native volume truncation gives envelope 9; attack and release are immediate.
The player uses the source integer divisors, with frequency `131072 / divisor`.

The four three-tick notes start at sequence ticks 1, 4, 7 and 10. Unlike menu
effects, tempo 140 advances against the driver's threshold of 150. Its initial
150-tempo processing tick installs the new tempo. Integer frame conversion puts
the starts at 2, 5, 8 and 11 and the ends at 5, 8, 11 and 14, relative to that
initial driver tick. These frame offsets are exported; the runtime does not
approximate them with a fractional tick duration. Both tracks' remaining span
to tick 384 is silent and creates no browser timer or input wait. Request phase,
DS clock, waveform and mix remain unverified.

The two battle roles share the existing SE2 instance with menu sounds. A new
request replaces its predecessor's scheduled notes. They add one cached duty
shape, retain the four-oscillator and shared 32-voice bounds, and bypass the
general menu throttle. Native IDs are admitted explicitly; they have no fake
authored score entry or synthesized fallback when the voice budget is full.
Existing pause, mute, interruption, epoch and disposal paths retire these notes.

For raw zero damage, [the native owner](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_damage.c#L313)
plays the target-team-specific sound only when both attacker and target display.
Otherwise it waits 30 frames without that sound. The caller now uses a distinct
no-damage receipt on its existing message, with no damage number, MISS, HP patch
or hit reaction. The message precedes the conditional wait. General message-popup and
visibility qualifications still apply.

The same native sounds also serve other paths with different predicates:
accuracy 1 chooses by whether the attacker is the leader; accuracy 2 chooses by
target team and may display MISS, without the offscreen 30-frame wait. The new
roles do not change those existing authored miss routes. Static source, data and
type checks do not establish browser audition or exact Blue audio parity.
