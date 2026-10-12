# Blue Rescue Team opening audio

The opening has **no background music**. Current static data contains eight
original effects with six oscillator patches, four native menu sequences (five
roles), eight battle PSG cues and 28 PCM cues over 20 buffers (494,812 decoded
Float32 bytes). Counts come from the current JSON literals in `src/blue/audio-bank.js`,
`audio-menu-data.js` and `audio-pcm-data.js`, without importing game modules.

All native control/sample evidence is comparative
[`pret/pmd-red@013475aa04f5be3191e5527c186d9bfceae7cae0`](https://github.com/pret/pmd-red/tree/013475aa04f5be3191e5527c186d9bfceae7cae0).
Blue bank identity, clock, phase, resampling, native channel competition,
integer mixing/reverb and listening acceptance remain unverified. The browser
PCM player is dry; header reverb zero preserves native global state rather than
requesting a dry reset. Public source availability is not a reuse grant.

[The immutable full evidence record](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/tools/pokemon-dungeon/reference/blue-audio.md)
preserves dated admissions, superseded byte/count checkpoints, source URLs,
wave hashes, finite tuples and independent-review qualifications. Current
contracts and exceptions follow; historical counts are not current inventory.

## Owners and verification

| Owner | Contract |
| --- | --- |
| `src/blue/audio.js`, `audio-transport.js` | Local Web Audio transport; construction is silent; one context and shared 32-source ceiling. |
| `audio-menu.js` | Shared SE2 replacement for menu and battle PSG; three cached duty waveforms. General menus throttle at four frames; dungeon/battle wrappers bypass that throttle. |
| `audio-pcm.js` | Numeric group 5 allows 15 sources; independent group 6 allows five. A request replaces attached notes before admission; FINE release tails survive only to their finite ends. |
| `audio/blue-original-effects.json` | Editable authored source; `node scripts/export-blue-original-effects.mjs --check` verifies the generated bank and preserves numeric token spelling. |
| `audio/blue-menu-effects.json`, `blue-battle-effects.json` | Pinned PSG source facts; `export-blue-menu-effects.mjs --source-root PATH --check` verifies source bytes and finite tuples. |
| `audio/blue-pcm-effects.json` | Pinned full sample literals and control facts; `node scripts/export-blue-pcm-effects.mjs --check`, optionally `--source-root PATH`, verifies the generated data/source bytes. |

Run exporters from `tools/pokemon-dungeon`. They parse data without importing or
executing game/native code or rendering audio. Acorn is an offline dependency
for locating authored JSON token spans; no parser ships in the game.

Only trusted native iframe input activates audio. Synthetic host controls cannot
unlock it. Hidden/removed pages, application backgrounding and focus outside the
game or same-origin controls suspend it. A brief host-control focus can retain an
already running activation silently; a full pause requires another trusted
input. Retired resume promises cannot silence newer activations. Mute, pause,
visibility loss, denial, epoch replacement and disposal stop voices, including
detached tails. Recognized overload consumes a request without authored fallback
or replay. Buffers are created after activation and reused per context.
See [autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
and [scheduling guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

Fresh admitted effect handles request sound once at their first source update,
before drawing; carry, redraw, saved statuses and Continue do not recreate them.
Explicit finish consumes pending receipts silently. Artwork retirement does not
stop an independent finite sound. App batches publish messages before their audio
loop, and stalled/reduced-motion delivery can collapse source timestamps into one
audio time. Source ordering and quotas do not guarantee physical audibility.

## Request bounds

The app has separate per-delivery counters; denied/excess receipts are consumed.
These bound requests/allocations, not simultaneously sounding sources. The shared
32-source ceiling and replacement rules still apply.

| Receipt family | Maximum | Scope |
| --- | ---: | --- |
| Pickup | 12 | Hero, partner and ten wild slots; 330/331/332 |
| Ground-money throw | 2 | One spin 356 and one loss 711 |
| Move-owned effects | 2 | One selected qualifying move per party actor |
| Preparation 621 | 12 | One fresh effect 22 per actor's chosen move |
| Whiffer 413 | 1 | Type exclusions permit one Smokescreen learner |
| Sleep helper 407 | 19 | Eight Bulbasaur targets, one Skitty target, ten wild Hypnosis targets |
| Paralysis/Disable | 29 | 680/774/927/938; includes multi-target Thunderbolt, Body Slam and Static |
| Solar Beam | 2 | At most one learner; release preparation plus travel |
| Counter 853 | 13 | One admitted Treecko holder |
| Light Screen application 851 | 2 | Party members |
| Reflect/Light Screen defense 890 | 74 | Shared effect 369 damage attempts |
| Protect 708 | 1 | Squirtle/Mudkip are mutually exclusive |
| Guarded target failure | 55 | Eleven attackers, at most five passes each |
| Other private effects | 4 | Includes healing/heart/miss receipts |

Direct semantic attack sounds use their existing path. The four-other limit can
suppress a later healing 606 after four visible misses; absent delivery cannot
interrupt an earlier Synthesis 809. A saved Cubone Bone Rush/Whiffer state is a
static counterexample, not a naturally acquired party or played seed. Solar
Beam's ordinary pacing clears detached 605 tails before 784; a synthetic collapse
to six frames or less can request 16 group-5 sources and reject 784. Neither case
is hidden with a synthetic stop or increased capacity.

## PSG sequences

All times below use the comparative frame clock `280896/16777216` seconds.
Integer frame conversion retains the initial driver processing tick. Silent
suffixes create no browser timer or input wait.

| Sequence / role | Source and finite behavior |
| --- | --- |
| 301 navigate | Bank 027, 50% pulse, key 84 for two ticks; divisor 126. |
| 302 accept | 50% pulse; same-tick key 79 is replaced by key 90 for two ticks; divisor 88; remaining 384-tick span is silent. |
| 303 back/invalid | 25% pulse; keys 58/55/67/67 at ticks 0/3/5/6, gates 2/2/1/1; divisors 562/668/334/334. |
| 304 open/info | 50% pulse; key 88 for one tick; divisor 100. |
| [342](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_342.s) / [343](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_343.s) miss/zero | Bank 027 voice 61, 12.5% pulse, envelope 9; starts 2/5/8/11, ends 5/8/11/14. Divisors 224/282/355/447 and 376/473/596/751; frequency `131072/divisor`. |
| [351 regular attack](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_351.s) | Voice 60, 50% pulse, tempo 280; 14 source notes/ten volume writes coalesce into five positive one-frame segments at frames 2-6. Divisors 158/210/354/298/198; envelopes 7/8/9/8/6; FINE frame 9. |
| 330 team item / 331 other pickup | Voice 60, 50% pulse; seven/six positive segments, FINE 21/27. Eight source notes each, tempo 180/140, MOD 100/MODT1, default LFOS22. |
| [356 throw spin](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_356.s) | Voice 60; thirteen notes/ten volume writes become nine one-frame segments at frames 1-9, FINE12. Divisors 250/188/118/100/88/140/178/198/298; envelopes 4/5/7/7/8/8/6/6/3. |
| 362 Eevee/Skitty Tail Whip | Voice77, type9, 50% pulse, tempo140. `[start,gate,divisor,envelope]`: `[0,4,88,9]`, `[4,3,78,9]`, `[7,3,88,7]`, `[10,3,78,7]`, `[13,4,88,2]`, `[17,3,78,2]`; FINE20. |
| 906 physical Defense down | Voice64, type9, 25% pulse, tempo140; explicit fifteen-note exception, gates at most two frames, audible end18/FINE26. The 22-tick effect399 outlasts it under ordinary pacing. |

The pinned PWM initialization sets SOUNDBIAS high bits to `0x40`; `CgbSound`
rounds fixed square registers as `(register + 1) & 0x7fe`. Bank027 voices60/64
are type `0x09`; voice61 is ordinary `0x01`, so its odd divisors stay intact.
SE2 priority checking is disabled: new requests replace pending notes regardless
of song priority. Short gates for 330/331/362 cannot reach their decay counter7,
even with an extra c15 step; no persistent envelope phase is invented.

Accuracy1 uses leader-attacker 342, otherwise343, gated by attacker visibility;
its message precedes independent target-visible MISS. Accuracy2 requires both
actors displayed and orders MISS, message, target-team sound. Raw zero uses a
separate receipt: message, then sound only when both display; otherwise a 30-frame
wait. It produces no number, MISS, HP patch or hit reaction. Source:
[`dungeon_damage.c:313`](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_damage.c#L313).

## PCM sequences and joins

Full samples remain intact: browser resampling has no fixed support-radius
promise, so a prefix plus guessed guard is insufficient
([Web Audio contract](https://www.w3.org/TR/webaudio-1.0/#playback-AudioBufferSourceNode)).
Pitch, bends, stereo levels and envelopes are finite source-derived rows.
Group5 is the default; group6 is independent despite inconsistent historical SE
structure names (`gMPlayTable[6]` is named `gMPlayInfo_SE5`).

| Sequence / wave | Source-owned request and finite behavior |
| --- | --- |
| 606 / 094 | Fresh heal effect 7, including full HP; 13 notes, FINE72/envelope zero82, at most two detached tails. Wave6256, loop4448-6256. |
| 614 / 102,103 | Heart effect15: Attract target, Charm/Covet preparation and successful infatuation; five notes, FINE/end43. Wave102:2307 nonloop; wave103:2517, loop860-2517. |
| 332 / 127 | Team Poké pickup; two notes at frames1/3, rates24236/18157 Hz, zero5/18, FINE18; 2776 samples, no loop/guard. |
| [711](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/songs/seq_711.s) / 116 | Effect144 item loss or Ember cast; one note start2/zero18/FINE19, 17 stereo/12 rate rows; 13629 nonloop samples. Out-of-map loss creates no handle/sound. |
| 678 / 096 | Rapid Spin effect83; two notes `[5,65)`/`[6,66)`, FINE69. |
| 809 / 096 | Synthesis effect271; four notes `[1,11)`/`[11,20)`/`[20,30)`/`[30,40)`, FINE40. Wave096:5910, loop4209-5910, one guard. Delivered healing606 replaces attached809. |
| 621 / 117 | Effect22: 34 first preparations plus Confusion cast; start4/FINE25/zero35, 28 stereo/one rate row. Wave6656 nonloop naturally exhausts near frame25.895 at rate1. Only verified STOP casts suppress authored fallback; Cross Chop's direct351 gap remains separate. |
| 413 / 115, group6 | Fresh Whiffer only, before message/icon; no bitmap or wait. Four notes start2/5/8/11, stop4/7/10/13, FINE13; 17302 nonloop samples. Duplicate application retains its mechanics draw/message but emits no sound. |
| 407 / 117, group6 | Fresh and duplicate Sleep after nonblocking helper37, before message; starts2/10, ends10/47, FINE49. Initial/saved sleep does not request it. Helper37's separate636 remains unadmitted. |
| 745,825 / 096 | Vine Whip target194, Razor Leaf travel288; one note start1/end20/FINE20 each. Target receipt precedes presented hit/miss; travel requests once at its first visible-cell update. |
| 807 / 109 | Leech Seed travel269; ten one-frame notes, all end by FINE9, 20 stereo/ten rate rows; 1646 samples. Hidden prefixes do not request it; entirely hidden travel is silent. Target270/sound808's infinite silent loop remains unadmitted. |
| 628 / 108 | Bubble target29 after accuracy1, including misses; notes `[2,8)`/`[8,14)`/`[14,20)`, FINE20; 1842 nonloop samples. Empty line flight creates no impact handle. |
| 717 / 120 | Water Sport cast150; notes `[2,9)`/`[9,19)`/`[20,44)`/`[20,46)`, FINE47; 3058 samples, loop44 plus one guard. |
| 344 / 098 | Visible Tackle cast, two notes `[3,7)`/`[7,13)`, FINE13; 3286 nonloop samples. Nine species only: Bulbasaur, Squirtle, Eevee, Chikorita, Cyndaquil, Mudkip, Skitty, Pidgey, Wurmple. Their 72 motions have at least19 payload ticks. |
| 680 / 100; 774 / 130 | Group5 cast85/target236; two/six notes, FINE43/39 and ends41/38. |
| 927 / 130; 938 / 101 | Group6 fresh paralysis423/Disable target434; five/three notes, FINE/end35 and FINE23/end22. Duplicate paralysis emits none; a visible Disable target can sound before a miss/refusal. |
| 605 / 095 | Effect6: Thrash first preparation, Swagger cast, Rage target; ten notes, FINE39/zero45, two detached tails; wave4183, loop613 plus guard. MODT1 tremolo switches to MODT2 pan at tick10. |
| 768,785,784 | Solar effect221; release effect247 then246 after24 preparation frames. 784 alone has14 notes; 785 alone has end107/FINE138. |
| 853 / 110 | [Pursuit/Counter](blue-counter.md), two notes; blocking helpers normally outlast it. |
| 851 / 110; 890 / 044 | [Light Screen/Reflect](blue-light-screen.md), target319 and shared defense369; wave044 adds31404 decoded bytes; release can outlast the shield effect. |
| 708 / 099 | [Protect](blue-protect.md); guarded342/343 failures use the separate request bound above. |
| 776 / 125 | [Safeguard](blue-safeguard.md); visible cast owns one356 and one effect-owned PCM request independent of recipients. |

Pickup selection follows [leader](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_items.c#L145)
and [other actor](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/dungeon_ai_items.c#L429)
owners without actor-visibility gates: team held item330, non-team pickup331,
team Poké332. Failed/full slots emit none. Walking defers receipt to completed
walk before its message/snapshot. `berryResult` retains authored eating/thrown
berry feedback; that is not native eating/throwing audio.

Direct351 also serves reviewed Scratch (Meowth/Psyduck/Totodile/Torchic),
Bulbasaur Vine Whip and universal Struggle. Direct356 serves
Squirtle/Pikachu/Psyduck/Cubone Tail Whip and Eevee Sand-Attack; Eevee/Skitty use
362. These immutable cast receipts precede the first actor frame. Source STOP997
skips a direct request. Unreviewed casts retain authored fallback; Bide release
does not inherit351. Regular attack source owners are `effect_data.c:819`,
`sub_800E790`, `sub_8040DA0`; throw spin uses displayed `sub_80421C0`/`sub_8042768`
before eight two-frame turns. Defense399 covers the fifteen reviewed
Leer/Tail Whip/Screech species-level rows, including minimum-stat attempts.

## Arithmetic corrections and evidence limits

`src/m4a_1.s:1045-1069` retains an unwrapped register addition for one LFO triangle
branch, then stores phase unsigned and modulation signed-byte. Correcting that
order changed only Bubble628 among the nineteen cues then admitted: at
frames6/11/16, modulation121/-128/-120 yields rates28114/11438/11778 Hz. First-note
nominal consumption1927.82 exceeds wave108's1842 samples; natural ending governs.
Later notes consume about1697.51/1693.79. Exact exhaustion phase remains open.

For605, native MODT1 applies `x = (x * (modM + 128)) >>> 7` before stereo
truncation. Its nine tremolo ticks have volume60-265; final stores across all
modes remain byte-safe (left29-179/right0-132), products7740-34020. Only this cue
admits the new offline mode; runtime tuple/player semantics are unchanged.

Selected payload hashes (SHA-256):

| Wave | Hash |
| --- | --- |
| [127](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/wave/wave_127.s) | `7aa26cf0e1e5cfebc234ca873890d76c664af21c85b8f666dcdd499e479b898f` |
| [116](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/sound/wave/wave_116.s) | `08444c2f94defc1aa4d46f8667aa228430f69867a1125b6e5435d6f13230eead` |
| 117 | `cd38d082062d42fd4f62db0d87ef4beddadf09863f28cc4a8a4d1375007a4ceb` |
| 115 | `4f6c757d523f300594272c401c574213884f1dfdd27d090171a92bc8fe53150c` |

SE3 impact607-610 and throw333/336/607/609 remain gaps. Red's persistent
driver/envelope phase is not Blue proof. [Treevis121's extraction attribution](https://archive.vg-resource.com/post-495364.html)
and [current listing](https://sounds.spriters-resource.com/ds_dsi/pokemonmysterydungeonbluerescueteam/asset/395434/)
name WAVs without a native ID/clock map; HTTP403/browser verification prevented
archive access. No challenge was bypassed or audio acquired. Water Gun859/860,
common620, Bubble627/901 and other held cues need separate lifetime review;
860 includes a silent infinite loop. Static data checks are not an audition.

## Retired music evidence

On 2026-10-11, eleven authored themes/629 notes and music-only `air`, `bass`,
`pulse` patches were removed. The transport has no music gain, cue position,
lookahead timer or loop scheduler. Scene boundaries remain silent. The former
mixed-score restore paths/hashes are recorded in ignored
`.work/blue-parity-20261011/stat-audio/music-retirement-ledger.md`.
Shadowed menu/heal/miss/money bodies, unrequested step/status/floor/hunger/spark
roles and the uncalled `setVolumes` wrapper were also removed; live authored
attack/impact/berry feedback remains qualified.

The [Blue soundtrack catalog](https://www.zophar.net/music/nintendo-ds-2sf/pokemon-mystery-dungeon-blue-rescue-team)
was role research, not a download or redistribution grant. Original track IDs,
scene mappings and timing calculations remain in the immutable evidence record.
Pinned [entrance/reunion](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p01_station.h),
[clearing](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/data/ground/ground_data_d01p02_station.h),
[sound names](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/src/sound_names.c)
and [music roles](https://github.com/pret/pmd-red/blob/013475aa04f5be3191e5527c186d9bfceae7cae0/include/constants/bg_music.h)
establish comparative requests: partner fade60, dungeon fade30, Caterpie jump457.
`DEMO_03` preserves `MUS_INTRO` across its three scenes (`src/music.c`), then
`src/ground_script.c` opcodeE0 waits before title group3 starts `MUS_TITLE_SCREEN`.
Separate group2's `MUS_OPENING_TITLE` is not selected by DEMO03/04. Sequence040's
876 waits/tempo controls give18.891713 nominal seconds, about19 under the GBA
driver; the retained 19-second cinematic remains an approximation, not DS timing.
