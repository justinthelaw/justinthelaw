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
including the native target phase before accuracy 1 resolves. Razor Leaf's 288
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
