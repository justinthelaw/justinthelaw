# Blue Rescue Team opening audio

The browser opening uses the project's original synthesized score. It does not
contain the Nintendo DS soundtrack, extracted sequences, samples, or sound banks.
The scoped bank in `src/blue/audio-bank.js` contains 11 themes and 21 effects;
its editable source is `tools/pokemon-dungeon/audio/original-score.json`.
The original opening composition is retimed to the browser's 18.9-second
presentation and plays once. The reunion theme loops for the entire scene.

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
not verified DS driver timings. The browser's 18.9-second presentation is a
qualified timing approximation. Only wait/tempo/control facts were inspected;
no commercial note data is imported into the authored score.

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

Exact commercial melodies, DS sample timbres, loop points, source fade timing,
scene-to-cue timing, SFX playback and mix remain unverified. Static type, syntax,
data and import checks do not establish human audition or soundtrack parity.
No claim of an exact DS audio reproduction is supported by this implementation.
