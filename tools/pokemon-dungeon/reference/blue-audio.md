# Blue Rescue Team opening audio

The browser opening uses original synthesized effects and selected
source-derived effects. It contains no background music or Nintendo DS soundtrack. Five
menu roles use four short PSG effects; regular attack uses one, and accuracy
misses/raw-zero damage share two more. Actual ground pickups add two PSG cues
and one PCM cue. The finite throw-spin and item-loss catalogs add one PSG
and one PCM cue. Healing, heart, Poké pickup, item loss, Rapid Spin, Synthesis, preparation and
Whiffer, Sleep helper, Vine Whip and Razor Leaf use eight public signed-8 PCM
samples and finite control data.
These are Red Rescue Team comparative evidence until Blue playback is corroborated.
The scoped bank in `src/blue/audio-bank.js` contains 8 effects and no themes;
its editable source is `tools/pokemon-dungeon/audio/blue-original-effects.json`.

From `tools/pokemon-dungeon`, run `node scripts/export-blue-original-effects.mjs`
to regenerate the selected bank, or add `--check` to verify it without writing.
This offline exporter reads only the effects JSON. It checks 8 cues, all six
used oscillator patches and ordered notes. JSON token spelling is preserved.
Music IDs, music timing, loop data and scene-request catalogs are absent.

The editable JSON retains the full original revision, authorship, titles and
role labels. The generated runtime bank omits those unused metadata fields;
its header names Codex for this project, links the canonical source path and
keeps the authored-effect qualification. Native NOTICE attribution is unchanged.
The exporter uses the existing Acorn authoring dependency only to locate JSON
token spans. All patch and id/bpm/beats/loop/notes tokens are preserved exactly;
the runtime imports no parser and gains no new code or dependency. Catalog,
native effects, save data and frame revision counters retain their existing
effect behavior. Static checks are not an audio audition.

## Background music removed — 2026-10-11

All 11 authored themes and 629 music notes were removed at the user's request.
The runtime bank fell from 47,240 to 3,210 bytes, saving 44,030 bytes. The
editable authoring input fell from 101,370 to 3,990 bytes, saving 97,380 bytes.
Three music-only oscillator patches (`air`, `bass`, `pulse`) were removed.

The transport no longer imports a music catalog, creates a music gain node,
tracks a selected cue or playback position, runs a lookahead timer, schedules
loops, or restarts music after visibility recovery. Scene changes remain silent
effect-presentation boundaries so existing app calls do not require an
integration change. Activation, mute, pause, visibility/pagehide retirement,
stop/dispose, effect revision consumption and all authored/native effect paths
remain.

The former mixed score JSON and exporter were moved to macOS Trash. Their
hashes and restore locations are recorded in
`tools/pokemon-dungeon/.work/blue-parity-20261011/stat-audio/music-retirement-ledger.md`.

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
  not to supply the authored music. Separate, selected short-effect admissions
  below now include public PCM literals with their source hashes and limits.

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
not verified DS driver timings. Before music removal, the browser's 19.0-second cinematic and 18.9-second
authored cue were qualified timing approximations; only the cinematic remains. Only
wait/tempo/control facts were inspected; no commercial note data is imported
into the authored score.

## Browser implementation and remaining parity

`createOpeningAudio(document)` in `src/blue/audio.js` owns a local Web Audio
transport and scoped bank, with no WebGL, network or game-state dependency.
Construction is silent. A trusted native iframe input must activate audio;
synthetic host-control events cannot unlock it. Hidden and removed pages, true
browser/application backgrounding and focus outside the game or its same-origin
host controls stop and suspend audio. While a same-origin host control briefly
owns focus, an already activated running context remains silent but retains its
activation; iframe refocus may restore that still-running context without a
synthetic unlock. A full pause still requires a new trusted gesture. Old effects
never replay, and a resume promise retired by interruption cannot silence a
newer trusted activation. Disposal invalidates pending callbacks and releases
nodes and listeners. Bounds are one context, 32 voices and four new effects per
presentation. See [Web Audio autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
and [audio scheduling guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

The effect-only transport has no music position, lookahead pump or looping
score. Historical music timing research above is retained as evidence only;
background music remains deliberately removed. Browser audition remains open.

Exact commercial melodies, DS sample timbres, loop points, source fade timing,
scene-to-cue timing, SFX playback and mix remain unverified. Static type, syntax,
data and import checks do not establish human audition or soundtrack parity.
No claim of an exact DS audio reproduction is supported by this implementation.

## Source-derived menu effects — 2026-10-10

`audio/blue-menu-effects.json` pins 14 source files at the comparative commit
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

`audio-menu.js` owns at most nine scheduled oscillators and three cached pulse
waveforms. Its voices share the existing 32-voice ceiling with the authored
synthesizer. Pause, mute, interruption, denial, epoch replacement and disposal
stop and disconnect both players; retired effects never replay on activation.
Web Audio band-limiting, a quiet browser gain and the existing output compressor
remain presentation choices. Their waveform phase, analog filtering, DS clock,
overall mix and exact Blue parity are not established by these comparative facts.

## Source-derived miss and raw-zero effects — 2026-10-11

`audio/blue-battle-effects.json` pins 35 public source files for the two short
miss/raw-zero PSG sequences, regular attack 351, pickups 330/331 and spin 356. The same exporter verifies their hashes with `--source-root PATH` and
adds bounded `BATTLE_EFFECTS` data beside the unchanged menu tuples. The retained
authored notes are unchanged by these native additions. No PCM, music or ROM data is added.

| Public audio API | Native ID / source name | Keys | Frequency divisors |
| --- | --- | --- | --- |
| `audio.effect('se342')` | 342 / `MISS_PLAYER_M` | 74, 70, 66, 62 | 224, 282, 355, 447 |
| `audio.effect('se343')` | 343 / `MISS_ENEMY_M` | 65, 61, 57, 53 | 376, 473, 596, 751 |

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
shape and retain their four-note bound within SE2's nine-oscillator maximum and
the shared 32-voice ceiling. All battle roles bypass the
general menu throttle. Native IDs are admitted explicitly; they have no fake
authored score entry or synthesized fallback when the voice budget is full.
Existing pause, mute, interruption, epoch and disposal paths retire these notes.

For raw zero damage, [the native owner](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_damage.c#L313)
plays the target-team-specific sound only when both attacker and target display.
Otherwise it waits 30 frames without that sound. The caller now uses a distinct
no-damage receipt on its existing message, with no damage number, MISS, HP patch
or hit reaction. The message precedes the conditional wait. General message-popup and
visibility qualifications still apply.

The explicit sequence roles also serve accuracy failures. Accuracy1 chooses 342
only for the leader attacker, otherwise 343, including the partner. Its private
sound receipt uses attacker visibility; the message precedes the independent
target-visible singleton MISS number and any wait for that number slot.
Accuracy2 requires a displayed attacker/target pair, then requests the MISS
number, message and target-team 342/343 in that order. Neither accuracy path
inherits raw-zero's offscreen 30-frame wait. The compiler keeps these three
branches separate; numerical hit decisions, RNG and other visual waits are
unchanged. The app retains its qualified same-tick log batching and browser
audio scheduling lead.

`se342` and `se343` map narrowly to the existing data IDs
`effect-no-damage-team` and `effect-no-damage-other`; their tuples are unchanged.
The removed `miss` role and authored two-note `effect-miss` body no longer have
an admitted caller. All retained authored note tokens and all nine live patches
are preserved. Source/AST checks do not establish audition or exact Blue audio.

## Source-derived regular attack — 2026-10-11

Only `moveId === 'regular-attack'` selects `audio.effect('regularAttack')`, mapped
to native 351 `EFF_ANIM_2`. Other learned-move casts remain authored; Bide release
does not inherit 351. The existing caster-visible cast receipt requests sound
before the actor animation, independent of whether a target is hit. Source
ownership is `effect_data.c:819`, `sub_800E790` and `sub_8040DA0` at the pin above.

[Sequence 351](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_351.s)
uses bank 027 voice 60, 50% pulse duty, envelope 0/0/15/0 and tempo 280. The exporter
retains all 14 original note commands and ten volume writes as editable facts,
then coalesces them at `ceil(150*tick/280)` frames. All sequence ticks in a frame
finish before `CgbSound`; same-frame replacement, zero-length gates and
zero-envelope notes produce no audible browser node. Five positive one-frame
segments remain: frames 2/3/4/5/6, divisors 158/210/354/298/198 and envelopes 7/8/9/8/6.
The fixed-type PWM correction applies to voice 60. FINE is tick 16/frame 9.

Regular attack schedules five nodes, with one positive segment at a time.
The unchanged shared SE2 owner now admits up to nine for the spin cue below. It still replaces pending notes before a new cue, shares 32
voices with synth/SE5, preserves menu-only throttle and consumes recognized
budget denial without an authored fallback. No new duty wave, timer, sample,
AudioContext or dependency is added. Menu and 342/343 tuples are unchanged.
Browser oscillator phase, band-limiting, mix, request phase and exact Blue
playback remain qualified. Impact 607–610 noise is still an authored substitute;
its separate SE3/global-envelope proposal has not been admitted.

## Selected healing and heart PCM — 2026-10-11

`audio/blue-pcm-effects.json` pins 45 public source files at the comparative
commit above, seven sample payloads and seven finite control tracks. The original
healing/heart subset described here retains its three sample payloads and all
control tuples; the later pickup, loss, move and effect 22 additions are described below. Run
`node scripts/export-blue-pcm-effects.mjs --check` from the authoring package
to verify the generated data; add `--source-root PATH` to compare all pinned
source bytes. The exporter uses Node built-ins and never imports or executes
game/native code or renders audio. Public availability is not a publisher reuse
grant, and no ROM or soundtrack archive was acquired for this admission.

| API | Native sequence | Voice/sample | Notes | Track end | Final envelope zero |
| --- | --- | --- | ---: | ---: | ---: |
| `audio.effect('heal')` | 606 HITPOINT_RECOVER | bank028 voice5 / wave094 | 13 | frame 72 | frame 82 |
| `audio.effect('heart')` | 614 EFF_HEART | bank 026 voices7,8 / waves102,103 | 5 | frame 43 | frame 43 |

The samples contain 11,080 signed-8 values plus two native interpolation guard
bytes: wave094 has 6,256 samples and loops [4,448,6,256), wave102 has 2,307 and
does not loop, and wave103 has 2,517 and loops [860,2,517). Their source base rate
is 18,157 Hz. The encoded payload is 14,780 base64 characters; the three decoded
mono buffers occupy 44,320 Float32 bytes. Buffers are allocated only after the
existing trusted gesture creates the AudioContext and are reused per context.

The generated data preserves the source integer pitch calculation, stepped
pitch bends, pan-modulation triangle, frame-based envelopes and integer stereo
levels. It contains 210 stereo rows and 27 frequency rows. Tempo 120 in 606 is
quantized against the native threshold 150 after the initial processing tick;
614 uses tempo 150. Both retain the comparative 280896/16777216-second clock.
Web Audio performs resampling, so exact GBA/DS sample interpolation and phase
are not established. The browser gain and output compressor remain mix choices.

Both cues share one SE5 PCM owner, separate from the unchanged SE2 menu/no-damage
owner. A new SE5 cue replaces attached notes and future notes. FINE detaches
release tails: 606 can leave two, which later SE5 replacement preserves until
their finite ends. Pause, mute, blur, visibility loss, denial, retired epochs,
context replacement and disposal stop all voices including detached tails.
There are at most 13 newly scheduled PCM sources plus two detached tails, seven
cached buffers and one stereo merger after the later cue admissions below. Every source shares the existing 32-voice
ceiling with authored effects and SE2. Recognized overload is consumed
without an authored fallback. No new timer, worklet, network fetch, playback
queue or gameplay callback is introduced.

Fresh displayed effect 7/15 creation emits one private sound receipt at its first
source frame. The app consumes it once; semantic heal events no longer play a
second tone. Heart coverage includes Attract's target effect, Charm/Covet
preparation and the separate successful infatuation application. Full-HP healing
keeps its effect 7 sound. Offscreen/hidden effects and missing effect metadata
emit none. Carry and redraw do not recreate receipts; explicit finish consumes
them silently. Collapsed/reduced-motion batches admit at most four cues in this
other-private bucket and discard excess receipts without deferred replay.
Pickup, throw, Rapid Spin/Synthesis and effect 22 have separate limits below. Visual waits, HP/status
patches, result messages, numbers, canonical mechanics and saves are unchanged.

606 sets native global reverb 60. 614's header 0 leaves that state unchanged; it
does not request a dry reset. The native owner combines earlier PCM buffer
contents, including other music and effects. This bounded player is dry and
adds no invented delay or convolution. Native five-channel PCM competition,
global integer mixing/overflow, reverb, Blue sample identity, browser scheduling
phase and human audition remain explicit fidelity gaps. Static source/data/type
checks establish neither listening acceptance nor exact Nintendo DS audio.

## Retired shadowed authored cues — 2026-10-11

The authored cursor, confirm, cancel, open, denied and healing cue bodies are
removed after native SE2/SE5 admission. Five menu roles use four native sequences;
denied aliases cancel. Native playback consumes recognized overload and failure
never falls through to an authored replacement. Menu IDs now have explicit
`MENU_EFFECTS` catalog admission; healing already has `PCM_EFFECTS` admission.

That shadowed-cue retirement left 11 themes, 15 effects, nine used patches and
671 notes before the later unrequested-role cleanup below. Removing these six bodies removes 15 unreachable notes. Every retained
cue, patch and numeric note token is unchanged, including the original intro
and reunion clocks. All nine patches still have live uses. Native sample/control
data, four menu tuples, SE2 replacement, SE5 tails and shared voice limits are
unchanged. Source/AST evidence establishes reachability and data preservation,
not listening acceptance or exact Nintendo DS audio.

## Fixed-type square frequency correction — 2026-10-11

The pinned driver initializes 8-bit DirectSound/PWM mode, setting the high
SOUNDBIAS bits to 0x40. `CgbSound` applies `(register + 1) & 0x7fe` to fixed-type
square voices in that mode. Bank 027 voices 60/64 are `ASquareWave1` (type 0x09);
voice 61 is ordinary `SquareWave1` (type 0x01). The exporter now records that
distinction and applies the source rounding only to the fixed-type voices.

The corrected menu divisors are confirm 88 and cancel/denied 562,668,334,334.
Cursor 126 and open 100 were already aligned. No-damage divisors remain
224,282,355,447 and 376,473,596,751, including their odd values. The earlier
pre-rounding menu tuples are superseded comparative-source evidence. Notes,
gates, velocities, envelope levels, aliasing, throttle and player lifecycle
are unchanged. Source/table checks establish this Red register correction;
Blue clock, waveform, output mix and listening acceptance remain qualified.

## Removed unrequested roles and wrapper — 2026-10-11

The closed opening runtime never requests the step, status, floor-entry, hunger
or story-spark roles. The app is the sole caller of `audio.effect`; its dynamic
private effect sound was then restricted to heal or heart. These five role
mappings, type members and authored cue bodies were removed, leaving 11 themes,
10 authored effects, nine live patches and 659 notes at that checkpoint. The
later native miss admission above removes its two authored notes; the
bank then had 9 authored effects and 657 notes. The pickup admission below
removes the two authored money notes, leaving 8 effects and 655 notes.

The private manager's uncalled `setVolumes` wrapper and return member are also
removed. The manager remains local to the app closure; no host bridge, global
object, re-export or documented external setter exposes it. Default levels,
normalization, transport preferences, mute, activation, status and lifecycle
logic are unchanged. This removal adds no new sound routing or playback claim.

## Blue impact-noise evidence gap

The Red comparative effects 607–610 use SE3 and a persistent driver/envelope
phase. Their IDs, hardware owner and c15 timing are not verified for Blue.
A bounded search located [Treevis121's attributed Blue SFX extraction](https://archive.vg-resource.com/post-495364.html)
and its [current asset listing](https://sounds.spriters-resource.com/ds_dsi/pokemonmysterydungeonbluerescueteam/asset/395434/).
The visible metadata lists unnamed WAV files, without a native ID or clock map.
The author identified VGMTrans; the archive contents and playback remain unread.
Direct access returned HTTP 403, and an ordinary browser visit remained on
Cloudflare verification. No challenge was solved or audio downloaded.

Existing Blue video observations establish visuals, not audio phase. Exact
impact admission needs Blue-specific driver/control evidence or attributable,
controlled recordings that test those assumptions. The authored impact cue
remains qualified; no guessed noise curve or broader sound engine was added.

## Source-derived ground pickups — 2026-10-11

The existing successful pickup boundary now emits one private presentation
receipt with the selected native sequence. Team Poké selects `se332`; a team
held-item pickup selects `se330`; a non-team pickup selects `se331`, including
Poké placed into that actor's held slot. Failed/full-slot attempts emit none.
The selection follows [leader pickup](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_items.c#L145)
and [other-actor pickup](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_ai_items.c#L429).
These direct sound calls have no actor-visibility gate. Their log/popup owners
remain separate and qualified; no new message wait or camera request is added.

The receipt precedes the unchanged numeric mutation and result message. Movement
pickups retain `afterWalk` deferral, so the compiler requests their sound at the
completed-walk cursor before the deferred message and item snapshot. No actor
rescan, item-kind inference, duplicate semantic item tone or persisted field is
introduced. Canonical item removal, money, held items, tutorials, RNG, saves,
source waits and walking poses are unchanged. The app still publishes each
batch's log/narration before iterating its audio requests, with the existing
scheduling lead; compiler source order is not literal browser audio-before-log
timing. That established message/audio batching qualification remains.

The app retains its four-cue limit for other private sounds and separately
admits at most 12 pickup requests per delivery batch. A single source result
has at most one opportunity for each of the hero, partner and ten wild actors.
Running does not concatenate results; higher levels/retries do not add turns
or a positive speed stage. This finite allowance preserves pickups after four
earlier heal/heart/miss cues, which the initial shared-cap draft could suppress.
It adds at most 74 finite source allocations across all 12 pickups, never 74
live voices: SE2/SE5 replacement and shared 32-voice admission still apply.
Muted, unavailable or voice-budget-denied playback can remain silent. Excess
receipts are consumed without replay; pause, silent finish, retired
floor/presentation and disposal behavior is unchanged.

| API | Native sequence | Owner | Finite data |
| --- | --- | --- | --- |
| `audio.effect('se330')` | 330 `ITEM_M` | SE2, bank 027 voice 60 | 7 positive pulse segments; FINE frame 21 |
| `audio.effect('se331')` | 331 `ITEM_M_03` | SE2, bank 027 voice 60 | 6 positive pulse segments; FINE frame 27 |
| `audio.effect('se332')` | 332 `MOTION_MONEY` | SE5, bank 026 voice 36/wave 127 | 2 notes; FINE frame 18; no detached tail |

330/331 retain eight source notes each, tempo 180/140, MOD 100, MODT 1 and the fresh
track's LFOS 22/phase 0. The exporter advances the source triangle once per tick,
coalesces source controls at integer frame boundaries, applies the established
fixed-type PWM rounding and keeps native integer volume truncation. Their
sustain counter 7 cannot expire within a gate of at most three frames, even with
one extra c15 step, so no global envelope phase is invented. Zero-envelope
notes create no node. Native register-write oscillator retriggers, Web Audio
phase/band-limiting, request phase, mix and the Blue clock remain qualified.
These cues reuse the existing 50% pulse wave; the three cached shapes, shared
SE2 replacement and menu-only throttle are unchanged. SE2 now reserves at most
nine finite oscillators within the existing shared 32-voice ceiling.

332 adds the pinned public [wave127 literal](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/wave/wave_127.s):
2,776 signed-8 samples, no loop or guard, source base rate 18,157 Hz and SHA256
`7aa26cf0e1e5cfebc234ca873890d76c664af21c85b8f666dcdd499e479b898f`.
The 3,704 base64 characters add 11,104 decoded Float32 bytes; that four-buffer
subset totals 55,424 bytes before the item-loss addition below. Tempo 200 quantizes starts to frames 1/3, source frequencies
to 24,236/18,157 Hz and envelope zero to frames 5/18. There are 20 new stereo rows
and two frequency rows; the pickup/healing/heart subset retains 20 notes, 230 stereo rows and
29 frequency rows. The nonloop sample naturally ends before the second gate;
the existing source callback releases it, with its declared end as a finite
upper bound. Header reverb 0 preserves native global reverb, not a dry reset.
The existing browser PCM owner remains dry and keeps the same 15-voice cap,
attached-note replacement, detached healing tails and shared 32-voice accounting.

The authored `effect-money` body and public `money` role are removed after all
actual pickup callers route through these receipts. The authored `effect-pickup`
body remains byte-for-byte for berry results, exposed narrowly as `berryResult`
on the existing tagged result sync. Eating and thrown-berry results keep the
same tone, timestamp and semantic event; this admission does not implement
native eating or throwing audio. All retained score tokens, nine live patches,
four menu sequences, miss/zero/regular tuples and healing/heart data are exact.
No new player, timer, queue, dependency, arbitrary reverb or general sound-bank
interpreter is added. Source/AST/data checks do not establish audition, native
hardware mixing or exact Nintendo DS identity; the Blue corroboration limit
above still applies.

## Finite throw-spin and item-loss catalogs — 2026-10-11

`audio.effect('se356')` maps to `effect-throw-spin` in the existing SE2 catalog;
`audio.effect('se711')` maps to `effect-item-loss` in SE5. Their ground-Poké
presentation receipt joins are a separate, jointly reviewed dependency. The
data/API admission alone does not enable a missing Throw UI or establish a
complete native throw sequence. No silent placeholder role is added for
unimplemented SE3 sounds.

[Sequence 356](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_356.s)
is `EFF_ANIM_12`, bank 027 fixed-type voice 60, 50% pulse, envelope 0/0/15/0 and
tempo 200. Its thirteen notes and ten volume writes coalesce to nine positive
one-frame segments at frames 1–9, with divisors 250/188/118/100/88/140/178/198/298
and envelope levels 4/5/7/7/8/8/6/6/3. FINE is frame 12. The offline exporter
shares its finite coalescing helper with regular 351; every earlier tuple
remains exact. Fixed-type PWM rounding is unchanged. SE2 priority checking
is disabled, so source priority 100 introduces no queue or new priority owner.
The admitted finite maximum becomes nine scheduled oscillators; only one
segment is audible at a time. The same three cached pulse shapes and shared
32-voice admission remain.

The native throw owner first requires `ShouldDisplayEntity`, then uses
`sub_80421C0`/`sub_8042768` for sound before eight two-frame direction changes.
The future private receipt belongs at that spin boundary. No sound is inferred
from a generic throw event or from message text.

[Sequence 711](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_711.s)
is `EFF_INVOKE_2`, SE5 bank 026 voice 22, envelope 255/255/0/0 and tempo 280. One
note starts at frame 2, reaches zero envelope at 18 and FINE at 19, without a
detached tail. Native pan modulation (LFOS 60, MOD 40/MODT 2), BENDR 36 and the
stepped downward bends produce 17 stereo rows and 12 frequency rows. Its first
rate is 13,602 Hz and last active rate is 3,476 Hz. These finite rows use the
existing PCM tuple/player grammar; no runtime interpreter is added.

The new [wave116](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/wave/wave_116.s)
has 13,629 nonlooping signed-8 samples, no guard, base rate 18,157 Hz and SHA256
`08444c2f94defc1aa4d46f8667aa228430f69867a1125b6e5435d6f13230eead`.
Before the Rapid Spin/Synthesis addition below, five cached buffers totaled
109,940 decoded Float32 bytes. That subset had 36,656 base64 characters and a
41,043-byte generated module under its then-current 41,100-byte limit. Its
controls were 21 notes, 247 stereo rows and 41 frequency rows, with per-note
limits of 17/12. Those samples and control tuples remain token-exact.

Wave 116 retains its complete source payload. A finite gate bounds playback
position, but the [Web Audio playback contract](https://www.w3.org/TR/webaudio-1.0/#playback-AudioBufferSourceNode)
leaves the resampling/interpolation neighborhood to the browser without a
fixed support radius. A prefix plus an assumed guard cannot establish equal
output across engines. No sample trim or engine-specific kernel assumption
is part of this admission.

Effect 144 owns 711 at its first update after failed nearby item placement.
Its pixel helper has no actor-display gate; ordinary effect-system mode and
sound gates remain. Out-of-map loss does not create this effect and must not
select 711. The future receipt must be effect-owned and consumed once. Audio
continues to its own finite end independently of visual-handle retirement.

The SE5 player retains its 15-voice maximum, thirteen scheduled notes plus at
most two detached healing tails, and the shared 32 ceiling. Native-before-
authored admission, recognized overload consumption, replacement, mute,
pause, blur/visibility loss, stale activation, epoch retirement and disposal
are unchanged. PCM source differs only by its cue-count comment. The transport,
synth and SE2 player are byte-identical. Both new roles bypass menu throttle.
The composed ground-Poké owner uses a
separate two-request throw counter per delivered batch, only for `se356` and
`se711`. One ActionResult admits at most one ground-Poké throw, with at most
one spin and one loss cue. Existing four-other and twelve-pickup counters
retain their separate budgets. Source order and the silent-return guard are
unchanged; excess requests are consumed without a deferred replay queue.

333 catch, 336 launch and 607/609 impact remain SE3 noise gaps. They are neither
PSG nor PCM substitutions. The authored berry-result and impact cues remain
live for their existing routes; no score note or patch is removed here. Header
reverb 0 preserves native global state, while browser PCM remains dry. The
comparative 280896/16777216-second clock, pulse phase/band-limiting, native
mixing/reverb, browser resampling, Blue identity and audition remain qualified.
No engine, timer, queue, dependency or arbitrary reverb is added.

## Rapid Spin and Synthesis finite PCM — 2026-10-11

Fresh displayed effect 83 and 271 handles request comparative sounds 678 and 809
on their first source update. The public roles are `se678`/`se809`, backed by
`effect-rapid-spin`/`effect-synthesis`. The joins follow handle admission, not
Canvas drawing or sampled attachment visibility. Missing/offscreen/hidden
handles emit nothing; carry and redraw cannot retrigger. Explicit finish is
silent. Artwork retirement does not stop a PCM cue.

Both use bank 026 voice 1, envelope 255/249/0/0, and full wave 096: 5,910 samples,
loop [4,209,5,910), one interpolation guard and 18,157 Hz base rate. The new buffer
uses 23,640 decoded Float32 bytes; the pre-621 six-buffer subset totals 133,580. Source sample/sequence
URLs and hashes remain in `audio/blue-pcm-effects.json`. Public source
availability is not a publisher reuse grant, and original Blue identity is
unverified.

678 has two notes at frames [5,65)/[6,66), FINE 69, 112 stereo rows and 89 rate rows.
809 has four consecutive notes at [1,11)/[11,20)/[20,30)/[30,40), FINE 40, 42 stereo
rows and 38 rate rows. Its MODT0 pitch term is exactly 16*modM before signed
coarse/fine splitting; the source-owned phase continues across notes with zero
LFO delay. The four earlier cue tuples and five sample literals remain exact.
The finite data row caps remain 59/45 per note. Before the effect 22 addition
below, the module was 52,109 bytes under its 52,200-byte allowance. Note maximum
13, envelope-end maximum 82 and live 15-PCM/shared 32
source ceilings are unchanged. Four future sources for 809 are allocation,
not four simultaneous sounding notes; its new-note interval peak is one.

SE5 replacement stays shared. At Synthesis handle creation H, 809 requests at
H+1 and the later healing 606 at H+37. Every 606 request delivered to the PCM
owner stops still-attached 809 before admission; a denied replacement does not
restore it or trigger an authored substitute. Existing detached healing tails
remain eligible under the unchanged player. No new engine, timer, save field,
queue, reverb model or audio-stop callback is added.

The new roles have their own two-request limit per delivered ActionResult
batch. Only party learners can produce them, with one chosen-move opportunity
and one selected cast/target each. Existing pickup 12, throw 2 and other-private 4
limits retain their order and budgets. The inherited private-four limit can
still consume a healing 606 receipt in an instant batch; then no delivered 606
exists to interrupt 809. In particular, an admitted-save Cubone Bone Rush /
whiffer 127 path can supply four visible misses before Chikorita's Synthesis;
hits() still consumes its existing draw before the whiffer miss. This is a
static saved-state counterexample, not a naturally acquired party, played seed
or cartridge replay claim. No synthetic stop hides this existing limitation.

This admission suppressed Rapid Spin/Synthesis authored cast-entry requests.
The separate effect 22 admission below extends that exact STOP-only policy;
the authored body remains live for other consumers. Rapid Spin's later authored damage sound is a separate qualified
fallback for held native impacts 607–610 and remains unchanged. Effect 22 /
sound 621 is admitted separately below. Native global
five-channel competition/reverb/mixing, Blue clock/sample identity, browser
resampling/request phase and audition remain qualified.

## Common effect 22 finite PCM — 2026-10-11

Fresh admitted effect 22 handles request `se621` / `effect-move-preparation`
once on their first source update. The common join covers 34 first-pass
preparations and Psyduck's single-pass Confusion cast: 35 move IDs and 58
reachable species/move pairs. No selected move owns both slots. The first-pass
gate, one chosen-move opportunity per actor and ten-wild-slot bound permit at
most 12 requests per ActionResult. Their separate twelve-request bucket preserves
pickup 12, throw 2, Rapid Spin/Synthesis 2 and other-private 4 budgets and order.

Sequence 621 (`EFF_INVOKE_1`) uses SE5, bank 028 voice 12, wave 117 and envelope
255/0/255/165. Its source has tempo 130, MOD 30/MODT 2 and one N18 note at tick 3,
key 60, velocity 127. The finite tuple starts at frame 4, reaches FINE/release 25
and nominal envelope zero 35, with 28 stereo rows and one rate row at 18,157 Hz.
The existing fresh-track LFO phase and zero-delay continuation rules apply.

The complete nonlooping wave has 6,656 signed-8 samples, no guard or padding,
and SHA256 `cd38d082062d42fd4f62db0d87ef4beddadf09863f28cc4a8a4d1375007a4ceb`.
At declared playbackRate 1 its buffer exhausts around cue frame 25.895, before
the conservative envelope stop. Existing AudioBufferSourceNode natural-end
cleanup owns that earlier release; no new timer, callback or estimated stop is
added. Exact native sample-boundary phase and browser resampling remain open.

Seven decoded buffers total 160,204 Float32 bytes. The generated module has
61,384 bytes under an explicit 61,400-byte cap; it contains 28 notes, 429 stereo
rows and 169 frequency rows. The prior six sample literals and six cue tuples
remain exact. Row bounds remain 59/45, cue notes 13, envelope end 82 and live
PCM/shared source ceilings 15/32. The largest old detached batch remains two
heal records; 621 adds only one source and cannot accumulate tail batches.

Sound creation follows existing actor-display and metadata admission, with no
Canvas/attachment visibility gate. Rejected creation, carry and redraw add no
request; explicit finish is silent. Artwork removal does not stop audio. Normal
reduced-motion batches deliver requests in source order; subsequent SE5 requests
replace attached notes. Rapid Spin's 678 follows 621 by 15 source frames, before
FINE 25. Other routes retain their own natural-end or detached-tail behavior.
Mute, pause, denial, blur/visibility loss, epoch retirement and disposal keep
the existing hard stops and one-time receipt consumption. The inherited
other-private-four suppression of a later 606 remains qualified.

Only the 34 all-STOP move IDs in `EFFECT22_SILENT_CASTS` suppress their authored
cast-entry request. They resolve STOP across 57 retained species/move pairs.
Machop's Cross Chop is the one other pair: its native direct-cast sound is 351,
so its current authored cast fallback remains explicitly qualified, with no
new 351 join. Synthesis's earlier suppression remains. Damage, impact, item,
miss, faint and level feedback are unchanged; Confusion's separate preparation
222/background sound is outside this admission.

Source URLs and 45 exact native file hashes remain in `blue-pcm-effects.json`.
Header 188 sets native reverb 60, while this player remains dry. Public source
availability is not a reuse grant. Original Blue sample/driver/clock identity,
native competition/mix/reverb, browser request phase and listening acceptance
remain unverified. No game/native code or audio rendering establishes them here.

## Whiffer sound-only PCM — 2026-10-11

Fresh successful Whiffer application requests `se413` / `effect-whiffer` before
its result message and icon sync, gated by the displayed target. The receipt
creates no bitmap, drain or wait. Already-active Whiffer requests no sound; the
separately reviewed mechanics correction retains its native duration draw and
already-status message. Offscreen, retired and silent-finish receipts do not
replay. Same-batch browser log/audio-call timing remains qualified.

Sequence 413 (STATE_SWING) uses bank 026 voice 21, direct signed-8 PCM and
envelope 255/255/0/0. Four two-tick notes start at ticks 1/4/7/10, keys
73/69/65/61 and velocities 120/120/120/100. Tempo 140 gives starts 2/5/8/11,
stops 4/7/10/13 and FINE 13 in the existing comparative frame conversion.
There is no modulation, bend, loop or detached tail. The full nonlooping
wave 115 has 17,302 samples, SHA256
`4f6c757d523f300594272c401c574213884f1dfdd27d090171a92bc8fe53150c`.
No sample prefix is trimmed on an assumed browser resampling margin.

The song-table label SE6 encodes numeric group 6; at this source pin it indexes
`gMPlayTable[6]`, named `gMPlayInfo_SE5`. Existing selected PCM uses numeric
group 5, whose structure is named SE4. These two replacement domains remain
separate in the reused finite renderer. Group 5 retains its 15 scheduled-source
allowance and detached tails; group 6 allows four, for at most 19 PCM sources
under the unchanged shared 32-source ceiling. All prior sample and cue tuples
remain exact. Recognized overload is consumed without authored fallback.

Only Charmander and Cyndaquil learn Smokescreen, and same-type partner exclusion
allows at most one user per admitted party. A separate one-request bucket per
delivered ActionResult preserves existing pickup 12, throw 2, move 2, preparation
12 and other-private 4 limits. Existing activation, mute, pause, blur/visibility,
denial, epoch and disposal owners stop all groups without delayed replay.

At the Whiffer admission, eight decoded buffers totaled 229,412 Float32 bytes
and the finite data had 32 notes, 440 stereo rows and 173 rate rows. Original source files and hashes
remain in blue-pcm-effects.json. Reverb byte 0 leaves native global state
unchanged; the browser remains dry. Native global PCM competition, integer
mixing/reverb, Blue sample/clock identity, request phase, resampling and audition
remain unverified. No music scheduler or SE3 noise substitute is added.

## Existing native move-sound joins — 2026-10-11

The first-attempt direct-cast joins reuse 351 for Scratch by Meowth, Psyduck,
Totodile and Torchic, Vine Whip by Bulbasaur, and the universal Struggle fallback.
Tail Whip by Squirtle, Pikachu, Psyduck and Cubone, plus Eevee's Sand-Attack,
reuse 356. These routes have no preparation; their immutable cast receipt owns
the request before the first actor frame. Charmander's Scratch 357, Treecko's
Pound 354, Eevee/Skitty's Tail Whip 362 and all unreviewed casts retain their
existing qualification. Source STOP 997 skips a direct request.

Ember's fresh cast 144 requests the existing PCM 711 at its first source update;
Attract's empty-adjacent target 15 requests the existing 614 at its first update.
Their source-STOP direct slots no longer emit the authored attack cue. Ordinary
actor/helper 15 keeps its existing heart request; travel 137/299 remains native
silent. No sound is added per projectile cell, carry, draw or attachment pixel.
No sample, sequence tuple, player, mixer, waveform, native-source input or
background music is added.

The two new artwork receipts carry a private move-origin tag. They share the
existing two-request bucket with Rapid Spin 678/Synthesis 809: a party actor can
choose only one of those four one-pass moves per action, and admitted level 1
wild slots know none of them. Bide release and delayed/carry records do not add
another such request. This leaves money throw 2, pickup 12, preparation 12,
Whiffer 1 and other-private 4 unchanged, including their overload qualifications.
Direct 351/356 use the existing semantic attack path, outside the item quota.
The shared 32 voice ceiling, group replacement, FINE tails, trusted activation,
pause/mute/visibility/disposal and consume-without-replay rules are unchanged.

The complete source inventory is preserved in
`tools/pokemon-dungeon/.work/first-attempt-audio-inventory/`. New native cue data
and unsupported pulse/noise behavior remain separate work; source-derived Red
requests, browser batching, output mix and audition remain qualified for Blue.

## Three cues reusing admitted PCM samples — 2026-10-11

Sleep helper 407 / `effect-sleep-helper` uses numeric replacement group 6, bank 026
voice 23, and the already admitted complete wave 117 with envelope 255/255/0/0.
Tempo 180 produces two notes starting at frames 2/10, ending 10/47, with FINE 49
and no detached tail. Its MOD 20 uses the native default LFO speed 22 and pitch
modulation mode 0; its volume/bend controls remain finite integer rows. Even a
maximum-rate bound consumes fewer than 5,350 source samples in the longer note,
below the retained 6,656 samples. No new sample buffer or prefix trimming occurs.

Vine Whip 745 / `effect-vine-whip` and Razor Leaf 825 / `effect-razor-leaf` use
group 5, bank 026 voice 1 and the existing complete looping wave 096. Each has one
note, start 1/end 20/FINE 20 and no detached tail, with its distinct native volume
and bend controls. Existing group 5 replacement and detached-tail handling are
unchanged; group 6 remains independent and capped at 4, group 5 at 15, shared voices
at 32. All eight sample strings and eight old cue tuples remain byte-exact.

The source-derived catalog now has 11 cues, 36 notes, 514 stereo rows and 249
frequency rows; 51 source records retain the original 48 entries and append only
the three sequence files. Decoded buffers remain 229,412 bytes. The exporter
admits exactly 86,616 generated bytes for this catalog, replacing its prior
85,200-byte allowance; the 3 MiB distribution cap, per-note 59/45 row limits,
82-frame end bound and all live voice limits remain unchanged. No runtime
interpreter, player, mixer, reverb or music scheduler is added.

The Sleep application receipt creates effect 37 and then requests 407 at the
post-helper cursor before its result message, on fresh and duplicate Sleep.
Effect 37's native nonblocking flag makes that helper return before its first
source update: its still-unadmitted bitmap sound 636 is separate, and this patch
does not pretend 636 already played or add a wait for it. The 407 request keeps
the target display gate and does not depend on a drawn pixel or successful
bitmap attachment. Initial sleeping actors, saved statuses and repeated draws
do not create this receipt.

Vine Whip target 194 requests 745 once on the admitted handle's first update,
including misses: native accuracy 1 is decided before this effect, then its result is presented afterward. Razor Leaf's 288
travel handle requests 825 once at its first visible-cell source update. The
existing elapsedOffset distinguishes that first update across all cells;
entirely hidden travel emits no request. Carry and later cell draws do not
replay it. Neither sound waits for artwork retirement or adds visual time.

The two move cues join the existing move-origin two-request bucket: each party
actor chooses only one of the six admitted one-pass move families, and level 1
wild slots know none. Sleep has a separate 19-request bucket: one Bulbasaur can
visit at most 8 distinct adjacent targets with Sleep Powder; Skitty's Sing has
range 8 (one forward/corner-cut target, not a room) and Skitty is hero-only;
ten level 1 wild slots can each use one Hypnosis. Type exclusions prevent two
Bulbasaur party members. This bound covers retries, duplicate Sleep and either
Bulbasaur party role. It preserves every prior quota, including other-private 4,
and does not add a delayed replay queue. Shared voice denial and collapsed
instant-batch timing remain qualified; no guaranteed audibility is claimed.

All facts remain comparative Red evidence at the established pin. Blue bank
identity, native phase/global channel competition/reverb, browser output and
audition remain unverified. Other first-attempt PCM/PSG/noise gaps remain in the
frozen inventory; background music stays intentionally absent.

## Leech Seed travel 807 — isolated finite addition

Sound 807 (`effect-leech-seed-travel`) uses numeric replacement group 5,
bank 026 voice 15 and one complete public wave 109. Its 1,646 signed-8 bytes
encode to 2,196 base64 characters and decode to 6,584 Float32 bytes. The same
source header rate and instant-attack envelope already fit the finite player;
no sample prefix, new channel engine, resampling assumption or reverb is added.
Tempo 180 and default LFO speed 22 with MOD 50/mode 0 produce ten positive
one-frame notes, 20 stereo rows and ten rate rows. All finish by native FINE
frame 9, with no detached tail; source sample consumption stays below the full
buffer even at the maximum 95,586 Hz rate. Concurrent notes remain distinct.

The first visible update of the single travel-269 handle requests 807 once,
using the same elapsedOffset owner as Razor Leaf. Hidden prefixes do not request
it, later cells/carry/draws do not replay it, and entirely hidden travel is
silent. Actual and empty recipients share this path before target phase/accuracy.
The native STOP direct-cast request for the sole admitted learner, Bulbasaur,
now suppresses its authored cast fallback. Target effect 270/sound 808 remains
unadmitted: its silent infinite sequence loop is a separate lifetime question.
This addition does not imply complete Leech Seed sound parity.

The unchanged two-request move bucket covers each party actor's one selected
move; no level-1 wild actor has Leech Seed, and retries do not change scheduler
multiplicity. All other quotas remain unchanged. Group-5 replacement, native
FINE tails, group-6 independence, shared-32 denial, activation/pause/mute/disposal
and consume-without-replay behavior are unchanged. No guaranteed instant-batch
audibility or literal browser audio/log call ordering is claimed.

All eight old sample strings, eleven cue tuples and 51 prior source records
remain exact. This catalog explicitly admits 89,283 generated bytes, 53 source
records, nine buffers/235,996 decoded bytes, 46 notes, 534 stereo rows and 259
rate rows. The 3 MiB distribution limit, group-5 15/group-6 4/shared 32 live caps,
13 notes per cue, 59/45 rows per note and 82-frame end bound remain unchanged.
Native Blue bank identity, global phase/channel competition/mix and browser
audition remain qualified. Background music stays intentionally absent.

## Two finite water-move cues

Bubble impact 628 (`effect-bubble-impact`) and Water Sport 717
(`effect-water-sport`) use numeric group 5 and the existing finite player.
Bank 026 voice 14 uses complete nonlooping wave 108: 1,842 signed-8 samples.
Voice 29 uses complete looping wave 120: 3,058 samples plus its one-byte native
guard, loop start 44. The two buffers add 19,600 decoded bytes. All nine old
sample strings and twelve cue tuples remain byte-exact; no source is truncated.

At tempo 152, cue 628 has three notes at [2,8), [8,14), [14,20), FINE 20.
At tempo 280, cue 717 has four at [2,9), [9,19), [20,44), [20,46), FINE 47.
All use priority 127, instantaneous attack and existing integer pitch/envelope
arithmetic, with no detached tails. Simultaneous notes remain separate sources.
With the corrected native LFO byte arithmetic below, wave 108 can naturally
exhaust during the first note before its nominal gate end; the existing
nonlooping buffer/onended owner remains authoritative. No padding, loop or
exact browser/native exhaustion-time claim is added. Wave 120 keeps its loop.

A fresh visible target-29 handle requests 628 on its first source update,
after the native accuracy-1 decision and before presenting its result, including
misses. The browser's existing committed target receipt owns this boundary.
Bubble's line stops at its first actor; empty long-range flight creates no
impact handle. Cast 150 requests 717 once on its first source update. Neither
request depends on drawing a pixel after handle admission. No visual wait,
numerical/RNG/save mutation, travel change or replay on carry/redraw is added.
Only these two verified STOP direct-cast routes lose their authored fallback,
including Squirtle's Bubble override. Water Gun's current route stays unchanged.

The two receipts share the unchanged move-origin two-request bucket with the
seven earlier families. Each party actor chooses one one-pass action, Bubble
targets at most one actor, and Water Sport creates one cast. No level-1 wild
learner qualifies. Full retained learners are Squirtle/Bubble 7 and
Psyduck/Water Sport 1. Running, faint splits, retry growth and carried artwork
do not multiply requests. Every other quota and all activation, pause/mute,
shared-budget denial, detached-tail replacement and teardown stay unchanged.

The fixed catalog admission is exactly 97,290 bytes: 11 buffers/255,596 decoded
bytes, 53 notes, 616 stereo rows, 299 rate rows and 57 pinned source records.
The original 53 records remain exact; only two sequences and two wave sources
are appended. Group-5 15/group-6 4/shared 32 limits, 13 notes per cue, 59/45 rows
per note, the 82-frame end bound and the 3 MiB distribution limit remain intact.

Water Gun travel 859 is held because later visible impact 860 must replace its
group-5 owner. Cue 860 has two tracks, MODT1 controls and a silent infinite wait
loop, plus two more full samples; it does not fit this bounded addition. No
new overlong 859 playback or silent replacement is introduced. Common 620,
Bubble travel 627/slow 901 and remaining noise/PSG cues also stay unadmitted.
This is partial move coverage, not Blue identity, mixing/phase or audition
parity. Background music remains intentionally absent.

## Tackle 344 direct cue

Tackle 344 (`effect-tackle`) uses the existing numeric group-5 PCM owner,
bank 026 voice 3 and the complete nonlooping wave 098. Its 3,286 signed-8 samples
encode to 4,384 base64 characters and add 13,144 decoded bytes. Tempo 160,
priority 127 and envelope 255/249/0/0 produce notes at [3,7) and [7,13), FINE 13,
with 12 stereo rows, two rate rows and no detached tail. Source exhaustion does
not precede either nominal gate; no prefix, guard, loop or padding is invented.

The existing semantic attack path selects `se344` only for the nine verified
Tackle species: Bulbasaur, Squirtle, Eevee, Chikorita, Cyndaquil, Mudkip, Skitty,
Pidgey and Wurmple. All retained learnsets and native species overrides resolve
to 344 and motion 1; every one of their 72 directional sequences has at least
19 payload ticks. Native sub_806CF18/sub_808DA44 and the current attack-tail
owner preserve the ordinary-paced margin beyond the 13-frame sound end.
No-target attacks still finish that tail, while target/miss/damage paths add
source time. Native initialization jitter only adds zero to three wait frames.

Only those nine `(move-tackle, species)` pairs replace the authored
`effect-attack` fallback. The fallback remains for other unreviewed pairs, and
all existing regular351, species351/356, hit/status/item/UI cues stay unchanged.
No private cue or quota is added: the existing attack event still makes one
request per chosen action through the same visible-cast gate. The compiler,
mechanics, saves, all private counters and the audio player are unchanged.

The fixed catalog admission is exactly 101,891 generated bytes, with 12 buffers
and 268,740 decoded bytes, 55 notes, 628 stereo rows, 301 rate rows and 59 source
records. All eleven old samples, fourteen old cue literals and 57 source
records stay exact. Only seq_344.s and wave_098.s are appended. Existing live
15/group-5, 4/group-6, shared 32, per-cue 13, per-note 59/45 and end-82 limits
remain intact, as does the 3 MiB distribution limit.

This is an ordinary-paced source-lifetime argument. The current transport can
collapse stalled/reduced-motion batches and start their delivered cues at the
current audio time; it does not replay elapsed native intervals. Universal
next-actor interruption, native global competition/mix/phase, Blue sound-bank
identity, browser resampling and audition remain qualified. No silent stop,
new scheduler, API or timing adjustment hides those limits. Generic damage
noise remains a separate gap; background music remains intentionally absent.

## Paralysis family 680 / 774 / 927 / 938

The first displayed source update of each fresh effect handle requests its
native role once: cast 85→680, target 236→774, fresh paralysis 423→927 and
Disable target 434→938. Numeric group 5 owns 680/774; group 6 owns 927/938.
The existing helper/display admission remains the gate, before drawing and
independent of attachment suppression. Carry, sampling and repeated draws do
not request again. No empty/offscreen target handle requests a target sound.
A visible Disable target still requests 938 on an eventual accuracy failure or
status refusal; only newly applied paralysis emits 927. Its result message
already precedes effect 423. Duplicate paralysis, saved status, upkeep and
Continue create no fresh helper or replay. No mechanics, RNG, saved field,
visual wait or status ownership changes are part of this audio join.

Disable's reviewed Psyduck direct slot is STOP, so its authored direct-cast
fallback is suppressed after the native joins. Thunder Shock/Wave/Bolt already
use the source-STOP preparation set. All other authored fallback paths remain;
no whole authored cue or patch becomes dead. Generic impact/noise and Thunder's
separate target sound remain outside this admission. Music remains absent.

Sequence 680 uses bank 026 voice 5/wave 100, two notes, FINE 43/end 41. Sequence 774
uses voice 39/wave 130, six notes, FINE 39/end 38. Sequence 927 uses that same voice
and full wave, five distinct notes, FINE/end 35. Sequence 938 uses voice 6/wave 101,
three notes, FINE 23/end 22. All are priority 127, constant-tempo, instant-attack
DirectSound with envelope 255/249/0/0 and no detached tails. Existing pitch/bend/
MODT0 arithmetic is unchanged. Waves 100/101 preserve their native loops and
source guard bytes; wave 130 is nonlooping. Its largest piecewise consumption
is below 4,372 of 5,558 source samples. No truncation or padding is introduced.

Bank 026 voice 5 is distinct from old heal 606's bank 028 voice 5. The offline
exporter now binds only these four new cues through explicit cue-bank-qualified
keys 026:5/026:6/026:39; numeric note.voice and VOICE controls remain original.
All old numeric voice records, notes, cue/sample literals and 59 source records
stay byte-exact. Four sequences and three complete wave files append to 66
source records. The runtime receives the same finite tuple schema, without a
new lookup, sample decoder, interpreter, timer or queue.

This fixed catalog is exactly 123,563 generated bytes: 15 buffers, 325,744 decoded
bytes, 71 notes, 761 stereo rows and 373 frequency rows. The additions are 21,672
runtime data bytes and 57,004 decoded bytes. Group6's reviewed eager-source limit
is five because 927 allocates five separate notes; group 5 stays 15 and the shared
live-source limit stays 32. Per-cue 13, per-note 59/45 and end 82 limits are unchanged.
The existing replacement loop retires attached 938 before any delivered 927
admission, including a denied allocation; group 5/680 remains independent.
Same-ID retriggers restart their own group. Old heal FINE tails and every
activation/pause/mute/blur/error/disposal path remain unchanged.

A separate family counter admits at most 29 delivered requests per result,
without changing any previous private bucket. The full retained retry/save
boundary includes Thunderbolt's eight adjacent targets and Body Slam: Pikachu
plus Psyduck permits at most 1 cast 680,8 targets 774,1 target 938 and 19 helper 927
requests; Pikachu plus Chikorita permits at most 8 targets 774 and 20 helpers 927.
Both bound new source allocations at 148 across the result, never simultaneous
live sources. Ten wild level 1 slots, one opportunity per actor, one Static
species, attained learnsets and the type-excluded party pair close the bound.
Body Slam's secondary paralysis and already-sampled Static remain two requests.
No denied/over-quota cue is queued or replayed.

The retained Detect motion record also names cast 85, but its protect status
is rejected by supportsMove before every action/cast producer. Saved learnsets
do not bypass that guard; no Detect cue is newly enabled. Any future handler
admission must recheck the common family ownership and request bounds.

This completes only the audited first-attempt numeric-group 6 request set
407/413/927/938. It does not establish every original-game/UI request or native
Blue sound-bank identity. A stalled or reduced-motion delivery can collapse
several source timestamps into one audio time; ordering/replacement is retained,
not a physical audibility guarantee. The app still publishes batch messages
before its audio loop. Global native competition, reverb/mix/phase, browser
resampling and physical audition remain qualified comparative Red evidence.

## Eevee and Skitty Tail Whip 362

The existing visible semantic cast now selects `se362` / `effect-tail-whip`
only for Eevee and Skitty's Tail Whip. Native overrides 1632 and 1635 select
362/motion 4; the four other retained learners keep their existing 356 mappings.
The full learned/save scope is Squirtle 4, Pikachu 6, Psyduck 5, Cubone 5,
Eevee 1 and Skitty 3. No global move-only replacement, private receipt, quota,
handler, save mutation, actor timing or target-result change is added.

Sequence 362 is numeric SE2, bank 027 voice 77, fixed square type 9, 50% duty,
envelope 0/7/0/0, priority 100, tempo 140 and centered VOL 80. Its six N03 notes
become [0,4,88,9], [4,3,78,9], [7,3,88,7], [10,3,78,7], [13,4,88,2] and
[17,3,78,2], using [start frame, gate frames, divisor, envelope]. FINE/end is
frame 20. The existing fixed-type PWM rounding and integer volume arithmetic
are unchanged. Decay counter 7 cannot expire during any four-frame gate even
with one extra c15 step; no envelope or phase owner is invented. No new sample,
decoded buffer or waveform duty is needed. All old voice/cue tokens remain exact.

All 16 affected directional motion-4 sequences have no early release flag 1:
Eevee has 72 payload ticks and Skitty 29, both beyond the sound's end at 20.
Native motion-tail handling and the current cast owner finish that motion even
for no-target uses. Later target/miss/stat-result requests therefore begin after
362 has finished under ordinary source pacing. Missing defense-down sound 906
is still a separate gap; this change does not claim complete Tail Whip audio.

The existing SE2 owner, all player functions, menu-only throttle, shared 32
sources, maximum nine positive pulse notes and every private counter stay
unchanged. The generated pulse module is 2,072 bytes, adding exactly 111 data
bytes and retaining all four menu sequences and six old battle cues. Only the
two reviewed species mappings replace the authored attack fallback; that body
remains live for other moves and is not removed. Generic SE3 impact remains held.

Stalled/reduced-motion batches can still collapse audio timestamps; source-order
replacement is not an audition or physical phase guarantee. This is comparative
Red evidence, with Blue bank identity, native global competition, browser
band-limiting/resampling, mix and audition still unverified. Music stays absent.

## Physical defense-down 906

A fresh displayed effect 399 requests `se906` / `effect-defense-down` at its
first source update. The existing physical stage and multiplier helpers own
that receipt before their result message, including an already-minimum stat.
Failed accuracy, protection or offscreen admission creates no sound handle.
The generic attachment/feet fallback, visual waits, carry and cancellation
owners are unchanged; sampling and Continue cannot replay the request.

Sequence 906 is numeric SE2, bank 027 voice 64, fixed square type 9, existing
25% duty, envelope 0/0/15/0, priority 127 and tempo 140. Its fifteen distinct
N01 notes end at frame 18, with a silent suffix to FINE 26. Existing integer
frequency/PWM/volume arithmetic and constant-level pulse primitives suffice.
The 22-tick blocking effect outlasts its audible notes, so a later missing cue
does not need to cut a newly introduced tail under ordinary source pacing.

This is a named finite-data admission only. The original `<=9` note assertion
still checks every prior battle cue; 906 is appended afterward and separately
asserted to have exactly 15 notes, gates no longer than two frames and audible
end at 18. All old tuples and voice facts remain exact. No player function,
waveform duty, sample, decoded buffer, scheduler, channel or phase owner changes.
The shared source ceiling remains 32. The pulse data module grows by exactly
231 bytes to 2,303 bytes; source evidence appends five pinned files.

Current effect-399 producers are only Leer, Tail Whip and Screech: one target
and one pass for each party action, covering 15 retained species/level entries
and 10 audited first-attempt pairs. None coincides with another move-owned cue;
level-one wild profiles, Bide and other status/item/residual paths select none.
The request therefore uses `moveOwned:true` and the existing two-request bucket.
The app and all private counters remain byte-identical. At most two requests
can ask for 30 new sources across a result, never 30 concurrently live sources.
A request denied by shared capacity is consumed without fallback or replay.

Native player-table priority checking is disabled (`unk_A`/`unk_B` zero), so
MPlayStart replaces the prior sequence regardless of song priority and TrackStop
turns off its CGB channel. The silent suffix needs no new priority owner. The
existing SE2 instance owns replacement; PCM groups remain separate. Global
native competition and browser overload parity remain qualified.

No authored cue becomes dead: this fills a previously silent helper. Existing
Leer/Screech cast or travel gaps, generic SE3 impact and all prior fallback paths
remain unchanged. The already-admitted Tail Whip direct cues and paralysis family
are untouched. Red remains comparative; Blue bank identity, oscillator phase,
band-limiting, mix/resampling and physical audition remain unverified. Stalled
or reduced-motion batches can collapse timestamps, and the app still publishes
batch messages before its audio loop. Music remains intentionally absent.

## Native LFO register and byte arithmetic correction

The pinned MPlayMain assembly stores its running phase as a byte while retaining
the unwrapped addition in the register used by one triangle branch. It then
stores modulation as a signed byte. The earlier offline expression wrapped the
phase before both branches and missed that distinction at sufficiently high
LFO speeds. The exporter now follows the exact register/byte order in
`src/m4a_1.s:1045–1069`; no runtime player code changes.

A finite scan of all 19 admitted PCM cues finds only Bubble impact 628 affected.
Its LFOS 100/MOD 40 reaches sums 344, 332 and 320 at ticks/frames 6, 11 and 16.
Signed native modM is 121, −128 and −120, replacing 25, 32 and 40. Exactly three
frequency rows change: note 0/frame 6 becomes 28,114 Hz; note 1/frame 11 becomes
11,438 Hz; note 2/frame 16 becomes 11,778 Hz. Notes, gates, FINE, stereo levels,
samples, source facts/pins, all 18 other cue tuples and every resource/voice cap
are unchanged. The generated catalog remains exactly 123,563 bytes.

Nominal piecewise consumption for the first note becomes 1,927.82 samples versus
the full nonlooping buffer's 1,842; the existing AudioBufferSource natural ending
therefore remains authoritative before the envelope's scheduled stop. The later
two notes consume about 1,697.51 and 1,693.79 samples. These calculations do not
assert identical browser/native interpolation or physical exhaustion timestamps.
No sample is padded, truncated or looped to conceal the correction.

The 12 admitted SE2 sequence sources do not reach this arithmetic discrepancy:
330/331 use default LFOS 22 with MOD 100; the others do not enable modulation.
Their existing tuples remain unchanged. This source-only correction was found
while auditing the still-separate sound 605 admission; it is not an audio
rendering or audition result. Blue global phase, resampling and mix remain
qualified.

## Shared effect 6 sound 605

Fresh effect 6 handles now request 605 once at their first source update: Thrash's
first preparation, Swagger's cast, and Rage's target. The common effect helper
admits the request after displayed-actor/metadata creation and before attachment
or drawing. Hidden or absent handles request nothing; carried tracks, subsequent
frames, saved statuses and Continue do not replay. Later Thrash passes do not
recreate its first preparation. Swagger casts even at an empty front tile; Rage
creates its self-target effect before the status handler, including duplicate
Rage. Existing visual clocks, waits, damage/RNG and status-result ownership stay
unchanged.

The complete selected producer closure is Cubone 37 Thrash, Meowth 45 Swagger,
and Totodile 7, Charmander 19 and Cubone 29 Rage. Each chosen party action creates at
most one effect 6 and selects none of the other moveOwned sound routes. No wild
level 1 slot, Bide release, regular attack, Struggle or helper record creates 6.
Two valid party actions therefore fit the existing two-request move bucket,
including two different Rage learners. The same result can request 621 from
Rage/Swagger preparation in its existing separate bucket. No quota is increased.
Thrash's three authored cast sounds are suppressed because its native direct
slot is STOP; Rage/Swagger were already in the source-STOP preparation set.
Other authored attack/impact roles remain live.

Sequence 605 is numeric SE5/group 5, priority 127, bank 028 voice 9, DirectSound
wave 095, envelope 255/235/0/127. It has ten notes at constant tempo 144, FINE
frame 39 and zero envelopes by 45; two release tails detach at FINE. The complete
4,183-sample waveform and its source loop 613/guard byte are retained. It adds
4,184 literal bytes, 5,580 base64 characters and 16,732 decoded Float32 bytes.
Existing phase-zero per-source playback, group replacement, detached-tail and
hard-stop lifecycles remain unchanged. A delivered 605 replaces attached 621 or
other group 5 notes; its FINE tails survive a later request only until their
finite ends. Group 6, SE2 and the shared 32 live-source cap stay unchanged.

The runtime player and tuple format already support the required finite stereo
levels. Only offline arithmetic gains native MODT 1 tremolo: TrkVolPitSet scales
track volume using `x = (x * (modM + 128)) >>> 7` before stereo pan/velocity/envelope truncation. LFO
phase follows the corrected native register/byte arithmetic above and continues
across nonzero MOD/LFOS and MODT changes; 605 switches from
MODT 1 to MODT 2 pan at tick 10. The exporter permits this new MODT 1 admission only
for 605. Its signed bend and existing frequency interpolation remain unchanged.
For all nine MODT 1 ticks, the intermediate volume is 60–265; the subsequent
volML/volMR values are 29–131 and 30–132. Across all modes the final stores are
29–179 and 0–132. Each fits its native unsigned byte, so no clamp or omitted
byte truncation changes these selected values. The pre-shift product stays
7,740–34,020, within unsigned 32-bit arithmetic.

The new cue has 74 stereo rows and 41 rate rows, maxima 9/8 per note, within the
unchanged 59/45-row and end 82 limits; ten notes fit the unchanged 13-note catalog
and 15 eager group 5-source bounds. Recognition under overload consumes a request
without fallback or deferred replay.

The exact catalog admission is 130,502 runtime bytes: 16 buffers / 342,476 decoded
bytes, 81 notes, 835 stereo rows and 414 rates. After the separate LFO byte correction, all 19 prior cue tuples, 15 prior
sample strings, 16 prior voice records and 66 source pins are unchanged; only 605,
full wave 095 and bank-qualified 028:9 append. This is comparative Red control/data
admission, not Blue sound identity, hardware-clock/mixer parity or physical
audition. Collapsed batches and global-budget rejection retain their explicit
limits. Background music remains absent.

## Solar Beam 768, 785 and 784

Visible effect 221 requests 768 on its first source update. A charged release
requests 785 from effect 247, then effect 246 requests 784 after the ordinary
24-frame preparation interval. Hidden, absent, carried and Continue paths do
not recreate those receipts. The opening roster permits at most one of the two
Solar learners in a party, so a private two-receipt result bucket covers one
release without displacing the existing move-owned bucket.

The catalog now contains 23 cues, 18 samples and 104 notes. Cue 784 alone owns
the reviewed 14-note exception; cue 785 alone owns end 107 and FINE 138. Group
5 remains 15, group 6 remains 5 and the shared ceiling remains 32. The paced
route clears any two detached 605 tails before 784. A synthetic collapse to six
frames or less can still reject 784 at 16 sources; no capacity limit is relaxed.
