# Blue Rescue Team opening review

## Review boundary

This branch adapts the original Blue Rescue Team opening through Caterpie's
Tiny Woods rescue for PR #397. It includes title and save menus, personality
quiz, partner and hero naming, the awakening and Butterfree request, three
playable dungeon floors, rescue and reunion scenes, rewards, Adventure Log,
loss/retry and completed-save Continue.

The selected website export excludes later chapters, the historical Three.js
runtime, plans and art studies. Historical source and saves remain recoverable.
This document describes the current review candidate and its qualifications; it
does not claim perfect cartridge replication or production deployment.

## Current candidate 26

Candidate 26 contains **151 files totaling 2,804,438 bytes**, below the
unchanged 3 MiB distribution cap. It retains candidate 25's independently
reviewed Continue progress card and restores Play time to the in-dungeon main
menu through the same formatter. The menu snapshots the live foreground clock
when it is built, uses the native-aligned label and value positions, and exposes
the value through its non-dialogue accessibility announcement. It adds no timer
or scheduler; the owned clock continues while the menu is open, while the
displayed snapshot remains fixed until the next menu build.

New adventures persist genuine foreground play frames, fresh-entry adventure
count and checkpoint/quicksave/completed kind. Legacy payload history remains
explicitly Unknown rather than reconstructed. Candidate 26 also admits the
reviewed level-37 Cubone Thrash route and removes an invented confused-facing
draw from latent Bide release. Candidate 25's full pinned Node 24.21.0 aggregate
suite and all three bounded Continue browser checks passed. Candidate 26's full
pinned Node 24.21.0 aggregate suite and bounded menu-clock dungeon continuation
also passed. All resources remain local with no runtime CDN dependency.

The native battle presentation contains **56 distinct indexed effects in three
banks**. Their decoded atlases use 3,948,544 bytes. Including the separately
owned 53,248-byte Hypnosis background, aggregate decoded effect memory is
**4,001,792 bytes**, leaving 192,512 bytes below the 4 MiB limit. Every one of
the 33 previously shipped effects retains exact timing, geometry, depth and
layer RGBA after repacking.

A conservative first-attempt bound allows at most 2,310 additional EXP and
covers 30 distinct starting, wild and level 6–12 moves. Every nonzero native
preparation, cast, target and travel route for those moves is admitted, along
with the reachable stat and status helper effects. Hypnosis effect 222 remains
a dedicated background resource. Static review also proves from pinned
`effect_data.c` that Attract is the only first-attempt route using native sine
wobble.

The consolidated authoring archive retains 113 pinned source files. It preserves
all 96 entries from the two earlier battle archives byte for byte and adds the
source owners for admitted EFO groups and native sine. The generated 1,024-entry
quarter-wave table and four-quadrant wrapper contain no `Math.sin`
approximation.

The current controller follows source-qualified fixed target capture, travel,
attachment recurrence, invisible-cell phase progression and empty-target
behavior. The four source-proven no-bitmap status helpers publish their result
and icon snapshot without draining an unrelated cast tail. These are static source claims until a
specific route is manually exercised.

Whiffer's sound-only helper now uses its pinned four-note PCM sequence in
numeric replacement group 6. Existing group 5 cues retain their own replacement
and tail behavior; all seven prior sample/cue tuples remain byte-exact. Nine
decoded buffers use 235,996 bytes, and both groups retain the shared 32-source
ceiling. Reapplying Whiffer consumes the source's discarded duration draw and
reports the existing status without replacing its timer or playing the helper
sound again. Candidate 14's pinned native-source check passed for all 53 then-admitted
PCM input pins. The admitted source joins include Sleep helper 407, Vine Whip 745,
Razor Leaf 825 and Leech Seed travel 807. Effect 807 adds one finite source wave;
the earlier joins retain their existing decoded samples and playback bounds.
A focused manual
Smokescreen trial verified fresh and duplicate applications, PP consumption and
normal control recovery with no browser warnings or errors. Exact Blue audio
and audition remain
qualified in [audio evidence](../../../tools/pokemon-dungeon/reference/blue-audio.md).

Held B+A now polls each eligible input opportunity, preserves modifier priority,
and requires nonzero integer Belly. Plain A remains edge-triggered. Duplicate
Sleep consumes the source duration draw and entry effect without replacing its
old timer. Existing sound data is connected to reviewed direct move/species
pairs, Ember casting and empty-adjacent Attract. An unreachable synthetic cast
fallback was removed. Other sound routes remain qualified. Candidate 15 admits
source-derived Bubble impact 628 and Water Sport 717 through the existing
finite PCM player. The current catalog describes 11 buffers (255,596 decoded
bytes), 53 notes and 57 pinned source records, and these additions passed the
pre-pruning candidate's full static and 57-source PCM checks. Candidate 16 adds
finite group-5 Tackle 344 for the nine verified opening species/move pairs. It
appends only full nonlooping wave 098 and sequence 344, preserving all 11 prior
sample tokens, 14 cue tuples and 57 source records. The catalog now contains 12
buffers (268,740 decoded bytes), 55 notes and 59 pinned source records. Tackle's
ordinary source animation tail exceeds FINE 13 by at least six ticks. Candidate
19 adds the unchanged ten-pair paralysis family, bringing the catalog to **15
buffers, 325,744 decoded bytes, 71 notes and 66 pinned source records**. Numeric
group 6 raises its eager-source cap from four to five for the five real notes in
fresh-paralysis cue 927; group 5 remains 15 and the shared live cap remains 32.
The four new cues use a separate 29-request family counter. Collapsed browser
batches, native/Blue mixing, phase, channel competition, resampling and physical
audition remain qualified. Candidate 20 also admits comparative SE2 Tail Whip 362 only for
Eevee and Skitty's source-overridden direct casts. It adds six bounded pulse
notes and no decoded buffer; the other four retained Tail Whip learners keep
their existing mapping. Candidate 23 admits comparative defense-down SE2 cue
906 for the 15 reviewed species/level pairs using Leer, Tail Whip or Screech.
The 15-note pulse cue joins the existing effect-399 receipt; native defense
helpers request that effect before mutation and clamp reporting, including at
the minimum stage. This adds no decoded PCM buffer and does not change player,
quota, counter, phase or stat mechanics. Blue instrument identity, waveform
phase, mixing and physical audition remain unverified.

Candidate 24 admits Squirtle's exact level-40 Skull Bash row. The first use
spends PP once, records the charge and exact slot, and grants the effective
physical Defense bonus; release uses the source-qualified second-turn route.
Save validation, floor/faint/status/slot replacement and leader/autonomous
action cleanup own the stored phase. Initial autonomous use follows the tuple-
zero adjacent scan and fallback. This removes one factual late move from the
unsupported inventory. Candidate 26 additionally admits Cubone's exact
level-37 Thrash row: three fixed passes each perform the blocker check, draw a
new native-order facing and scan a fresh target, including an empty later pass;
Thrash does not add Outrage's post-move confusion. **14 move IDs across 19
learnset rows remain unsupported.**

For autonomous actors, paralysis or cringe now rejects attack selection before
weights or RNG and falls through to the existing movement owner. The bounded
confusion leaf keeps item selection first, applies the comparative 70% chooser
gate before charge/weights, randomizes admitted attack facing at execution, and
uses native direction order for nonleader confused walking. Confused item use,
leader walking, unsupported no-foe resolvers and exact Blue RNG-stream identity
remain outside this contract. Candidate 26's Bide release now retains its
existing facing instead of consuming an invented confused-direction draw, as
the native end-turn release does not enter the action-table confusion helper.
This is latent saved-state and future-producer correctness: the current opening
cannot normally create a confused Bide user, and downstream RNG identity is not
claimed.

The Continue payload version is now 2 and requires exactly the three metadata
keys; payload v1 remains readable only without them. First write promotes a
legacy adventure with null time/count and unknown kind. This makes cached older
readers reject the newer checksum-valid payload, while exact journal receipts
block an already-open older writer after promotion. The two-slot journal,
handled marker, untouched v1 migration source and older campaign keys retain
their owners. Play time uses the existing eligible foreground RAF delta, capped
at the source `9999:59:59`; Adventures increments only on first Tiny Woods entry
and fresh retry, never on stairs or Continue.

New adventures use the source-qualified native-family dungeon LCG core and
fresh-floor preseed progression. Historical xoshiro saves retain their exact
payload and sequence. The version-two journal isolates current snapshots from
cached v1 readers, migrates a verified v1 payload without altering its raw
slots, and retains a handled marker so explicit deletion cannot resurrect v1.
AI self-status choices that require a foe use their source-qualified adjacency
gate. Regular attack retains its weighted opportunity before target resolution
and scans from the actor's captured facing in native direction order. The eight
first-attempt adjacent corner-cut moves resolve targets only after selection in
persisted actor-slot order, apply wild Status Checker, and consume the native
target-choice draw even for one candidate. A failed final admission takes the
captured regular fallback without a redraw. Candidate 15 extends the same
post-selection contract to the reachable tuple-zero front/self, two-tile and
line classes. It keeps native direction or actor-slot candidate order, the
required target draw even for one candidate, Course Checker boundaries and the
captured regular fallback. Independent deletion-only review then removed four
unreachable hero-only AI branches: Attract, Disable, Low Kick and Bone Club.
The current source retains 13 reachable tuple-zero front/self branches and seven
reachable adjacent-class branches. Candidate 18 adds the source-qualified no-visible-foe scheduling branch for the
24 exact supported resolver IDs while preserving ordinary follow, heal and
stairs behavior. Candidate 17 manually continued Flare/Bud's preserved B1F save
through no-visible-foe walking/follow/heal, stairs, B2F combat, Quicksave,
Adventure Log and Continue with empty browser logs. It did not expose the
unseen two-tile branch or complete a rescue. Candidate 18 adds only actor
metadata pruning beyond that mechanics after-image. Its post-pruning browser
continuation restored the same B2F save, rendered Growl, walk/follow and HP
recovery with current actor metadata, then Quicksaved and continued at 21
turns with empty logs. This is bounded evidence rather than all-23-actor UI
coverage or a full-rescue run. The broader native movement/IQ tree remains
qualified.
Original Blue seed history, the complete RNG call schedule and cartridge replay remain unproved.

## Static and hosted evidence

Candidate 26's full pinned Node 24.21.0 aggregate suite passed at 151 files
totaling 2,804,438 bytes. Candidate 21's full Node 24.21.0 authoring checks passed at 151 files and
2,790,982 bytes. They cover the aggregate source, export and distribution
closure without importing or executing game source. Candidate 22's full pinned
Node 24.21.0 static suite also passed at 151 files and 2,791,623 bytes.
Candidate 23's full pinned Node 24.21.0 static suite passed at 151 files and
2,793,229 bytes; the canonical SE2 exporter also verified all 45 native source
pins. Candidate 24's full pinned Node 24.21.0 aggregate suite also passed at 151
files and 2,797,841 bytes. Candidate 25's full pinned Node 24.21.0 aggregate suite passed at 151 files
totaling 2,803,390 bytes. Candidate 15's
fresh browser run completed all three floors, rescue, reunion, all three berry
rewards, Adventure Log at 227 turns, Return to top menu and completed Continue.
Both party members reached level 6; warning/error logs were empty. Candidate 15's
deletion-only prune passed the full static suite at 152 files/2,958,889 bytes;
the completed browser run uses frozen pre-pruning mechanics `120baa72…`.
Bubble and Water Sport were not cast, and no physical audio was auditioned.
Candidate 16's focused B1F check observed Bulbasaur Tackle deal 18 damage and
KO after regular attacks and two Growls. Sound remained enabled; Help paused
and a trusted Return restored audio ownership; Quicksave, six-turn Adventure
Log, Continue and controls recovered with no warning/error logs. Only Bulbasaur
of the nine source-reviewed bindings was cast, and no physical audio was
auditioned.

Exact published head `b7600228c40b9b1c9e4960c36d37b9f8a83b07a9`
passed hosted lint, Game Static Checks, Playwright and CodeQL. Its requested
exact-head Codex review returned a qualifying thumbs-up, and its Pages artifact
was verified against all 151 declared runtime files totaling 2,803,390 bytes.
The watcher session was lost and had no remaining holder, so its terminal exit
is unknown; the individual hosted checks, review and artifact verification are
recorded independently.
The earlier `88bf722` evidence remains preserved under
`tools/pokemon-dungeon/.work/ci-88bf722/`.

Root's full local website lint/build/Playwright flight check remains blocked by
Socket Security Policy E403 while installing recently published pinned website
packages. Dependency versions, policy and checks were not weakened. Game
static/export validation and prior hosted website checks are separate evidence.

## Manual browser acceptance

The table identifies immutable or explicitly recorded checkpoints. A later
source change does not retroactively expand what an earlier browser run proved.

| Checkpoint | Observed behavior | Qualification |
| --- | --- | --- |
| Native opening snapshot | Title, menu, eight-category quiz, conditional follow-up, reload recovery, naming and Psyduck/Charmander selection | Opening only; no dungeon completion |
| Native completion snapshot | Existing B3F save, Moves menu, final stairs, Caterpie clearing, reunion, three rewards and completed Continue | Frozen earlier runtime; browser log was clean |
| `c62e846` | Ordinary three-floor rescue, Adventure Log, top-menu return and completed Continue | Published 149-file snapshot; timing/audio qualifications remain |
| `d040e116…` | Scratch KO, PP/EXP, later rescue continuation and completed-save flow | Immutable published distribution |
| Candidate 4 / `7b843bc` | Fresh naming and request ordering plus legacy `enter:1` migration, B1F/B2F combat, B3F rescue, reward and completed Continue | Full bounded opening accepted; predates current artwork/controller additions |
| Candidate 5 | Older Volt/Shell save, both battle banks, selected moves and screenshot download | Bank/save compatibility only; Heal Bell not cast |
| Candidate 6 | Mud Sport build: B1F Thundershock/EXP/save; independent Psyduck Water Sport cast and ten-turn expiry | Mud Sport was not cast; predates the three-bank candidate |
| Candidate 7 | Volt/Shell B1F–B3F, combat, shared EXP, level-ups, berry pickup, paralysis, Caterpie reunion and all three rewards; Adventure Log records 234 turns. Separate Machop/Charmander and Bulbasaur/Charmander runs also completed the rescue; the latter recorded 709 turns and all three berries with no browser warnings/errors | No newly learned level-7 move cast; Machop trial did not capture console logs |
| Candidate 8 | Completed Volt/Shell Continue; older Psyduck/Charmander B1F restored; Water Sport 18/19 to 17/19 with result message and controls returned | Focused post-pruning checks; both browser logs clean |
| Candidate 9 | Cyndaquil Smokescreen: duplicate Sunkern application, two fresh Wurmple applications, PP 9/10 to 6/10, control recovery and normal Quicksave | Warning/error log empty; no original-audio audition |
| Candidate 10 / early 11 | Same-path preview holds advanced one turn; inert controls proved both keys and animation frames remained active | Stale preview-module reuse isolated with fresh URLs; no game-defect causality claimed |
| Candidate 11, fresh module URLs | Held B+A for five seconds advanced 433 to 453 turns; held plain A for five seconds advanced 453 to 454; Quicksave and menus recovered | Browser log clean; standalone input check using unchanged runtime bytes |
| Candidate 12, migration | Current build migrated the visible 454-turn v1 xoshiro save, advanced and saved 455; the cached `88bf722` build then saved 456 in v1; current reload retained 455 | PASS for namespace isolation; both console logs clean. Corruption, unsupported revisions, quota failure and other interleavings remain static-only |
| Candidate 12, stale tab | Two current tabs loaded 455; the first saved 456 and the second received the visible changed-data warning; reload retained 456 | PASS for sequential stale-write rejection; not cross-process atomicity or exhaustive interleaving evidence |
| Candidate 13 | Continued the migrated 456-turn B1F save through B2F/B3F and rescue at 556 turns; Exeggcute selected Hypnosis first for Cyndaquil and then for the awake hero while its partner slept; both recovered, partner reached level 7, berry tutorial, Quicksave/Continue, all rewards and completed Continue passed | PASS for frozen legacy-xoshiro continuation; browser log clean. Leech Seed/PCM 807 was not cast; no hidden RNG-state claim |
| Candidate 14 | Reproduced the published loss of sound activation after host Show/Hide, then verified the local repair: pointer Show/Hide, host A, Return and Space toggles retained Sound On and continued play; explicit mute remained off; unrelated Back-button focus required a new trusted child click, after which host-control retention worked again | PASS for same-origin host-control focus ownership; browser log clean. OS/window backgrounding was not observed, and no physical audio output was auditioned |
| Candidate 15 | Fresh Hardy-boy Charmander Ember and Squirtle Shell completed all three floors, rescue/reunion, all three berry rewards, Adventure Log at 227 turns, Return to top menu and completed Continue; both reached level 6; Tail Whip/Tackle, changing adjacent wild targets and Scratch menu use were observed | PASS for the immutable pre-pruning mechanics `120baa72…`; warning/error log empty. No loss/retry, Bubble or Water Sport cast, physical audio audition or original-Blue parity claim |
| Candidate 16 | Fresh Hardy-boy Charmander Flare/Bulbasaur Bud B1F smoke: six manual waits produced regular hit/miss, two Growls and Bulbasaur Tackle for 18 damage/KO; Sound On, Help pause/trusted recovery, PP/EXP, Quicksave, six-turn Adventure Log and Continue passed | PASS for one bounded Tackle binding and control recovery; warning/error log empty. The other eight bindings remain source-reviewed, no physical audio was auditioned, and candidate 15 remains the separate complete run |
| Candidate 17 | Continued Flare/Bud from the preserved six-turn B1F save: no-visible-foe walking/follow/heal, stairs, B2F regular attack for 7 damage/KO, 8 EXP for both actors, menus, Quicksave, 17-turn Adventure Log and Continue | PASS for the isolated no-foe mechanics after-image; warning/error log empty. No hidden RNG measurement, unseen two-tile branch, or full rescue claim |
| Candidate 18 | Restored the same Flare/Bud B2F save at 17 turns with pruned actor metadata; hero Growl animated and consumed PP with no target, then three eastward steps, partner follow, HP recovery, Quicksave, 21-turn Adventure Log and Continue passed | PASS for the current trimmed metadata and bounded continuation; warning/error log empty. No all-23-actor UI coverage, hidden RNG measurement, physical audio audition or full-rescue claim |

| Candidate 19 | Fresh website-embedded Hasty-boy Torchic Flint/Pikachu Volt: B1F contact naturally activated Static and paralyzed Wurmple; Thundershock dealt 21 damage/KO, both actors gained 15 EXP, and PP changed 17/17 to 16/17. Sound On, Help pause/trusted recovery, Quicksave, four-turn Adventure Log and Continue passed | PASS for visible result messages, PP and save continuation; warning/error log empty. Frozen 152-file sound snapshot precedes the neutral render prune/comment; no exact effect-frame, audio audition, Disable cast or full-rescue claim |
| Candidate 20 | Fresh Hasty-girl Skitty Mimi/Squirtle Shell reached B1F; Skitty Tail Whip changed PP 22→21 and lowered Sunkern's Defense, Shell Tackle dealt 19 damage/KO, both gained 16 EXP, then two east moves, Help/Sound, Quicksave at three turns and Continue passed | PASS for one Skitty Tail Whip binding and bounded controls/save; warning/error log empty. Eevee, physical audio, junction movement measurement and a full rescue were not exercised. The run exposed the adapted BFS diagonal detour later addressed by candidate 21 |

| Candidate 21 | Restored Mimi/Shell B1F at three turns. Two eastward moves made Shell take the direct southeast/east steps and finish immediately west of Mimi on the same row; HP stayed 30/30, Help/Sound, Quicksave, five-turn Adventure Log and Continue passed | PASS for two legal empty Together direct steps and save recovery; warning/error log empty. Standalone fresh-module continuation; candidate20 supplies the iframe/cast evidence. No blocked-path, hidden junction/RNG, physical audio or full-rescue claim |
| Candidate 21, full continuation | Continued the preserved five-turn Mimi/Shell B1F save through all three floors, Caterpie clearing, reunion, all three berry rewards, a 91-turn Adventure Log, return to menu and completed Continue; Mimi remained level 5 at 30 HP and Shell reached level 6 at 33 HP | PASS for the current `901951e` runtime from B1F save through completion; warning/error log empty and no failure occurred. This standalone continuation is not one fresh immutable run from SHA onboarding through rescue |

| Candidate 22 | Restored Flare/Bud B2F from 21 turns, played 22 ordinary room/corridor movement turns, recovered Flare from 26 to 30 HP, then Quicksave, 43-turn Adventure Log and Continue passed | PASS for bounded movement, following and save recovery; warning/error log empty. No visible wild pursuit occurred, so the new wild direct-step branch remains source-static-qualified rather than manually demonstrated. The downstream browser surface was unavailable; root performed this check |

| Candidate 23 | Restored Psyduck/Charmander from the in-game B1F 12-turn log, descended to B2F and used Tail Whip on adjacent Wurmple: Defense fell and PP22→21. Help/Return, Quicksave, 19-turn Adventure Log and Continue passed | PASS for one Psyduck defense-down route and controls/save recovery; warning/error log empty. No physical audition, all-producer coverage, dedicated sight geometry measurement or full-rescue claim |

| Candidate 24 | Restored Flint/Volt B1F at four turns. With partner moves temporarily disabled and Exclusive Move-User enabled, Sunkern attacked Volt, Static paralyzed it, and the enemy moved after the party withdrew without another attack or recovery message. Restored partner settings, Quicksaved at eight turns and verified Continue, moves and IQ selections | PASS for one naturally paralyzed enemy movement opportunity and save/settings recovery; warning/error log empty. No hidden RNG measurement, cringe/confusion gameplay, level-40 Skull Bash cast/saved charge, physical audio or full-rescue claim |
| Candidate 25, legacy Continue | Restored the preserved Flint/Volt B1F eight-turn quicksave. The card showed Unknown legacy history; default No plus Z returned to root, X cancelled, and explicit Up held 220 ms plus Z resumed. A new Quicksave selected its specific prompt, which persisted after reload; Help/Sound and the eight-turn Adventure Log remained available | PASS for bounded card visibility, default/cancel/Yes routing, legacy Unknown fallback, reload and controls; warning/error log empty. No fresh metadata accumulation, completed-card, exact Blue geometry/pixels or full-rescue claim |
| Candidate 25, fresh metadata | Fresh website iframe: Hardy-boy Charmander Cinder/Treecko Fern completed quiz, naming, awakening and Butterfree request through B1F. Reopen during departure showed Before Tiny Woods, `0:02:05`, Adventures 0; No/root/Continue preserved both. First-entry Quicksave showed `0:05:00`, count 1. Give Up/Yes, Try again and Quicksave showed `0:05:52`, count 2; both remained level 5 at 30 HP, Help/Sound and B1F zero-turn Adventure Log worked | PASS for fresh timing persistence, entry/retry increments, zero-turn independence, confirmation/reopen and controls; warning/error log empty. No full rescue, floor-transition count, precise Help-clock exclusion or physical-device claim |
| Candidate 25, completed legacy save | Restored the preserved Mimi/Shell completed 91-turn save. The card showed `Tiny Woods cleared`, not the retained B3F dungeon location, with Unknown legacy history. Yes resumed the completed Caterpie state; Adventure Log retained all three berries and 91 turns. Return to top menu and Continue retained the cleared location; Help/Sound remained available | PASS for completed-location precedence, completed resume and repeated top-menu Continue; warning/error log empty. This reused an earlier completed save and does not establish a candidate-25 full rescue or fresh completed metadata |
| Candidate 26 | Restored Cinder/Fern at B1F with Adventures 2. The dungeon menu visibly and accessibly reported Play time from `0:05:54`; one step, Quicksave and Continue retained B1F at one turn, `0:06:51` and count 2. A separate continuation retained those values, showed `0:07:08`, used Help download/Return, descended to B2F without incrementing Adventures, took 9 damage from Pidgey Tackle, then Scratch dealt 17 damage/KO, consumed PP 22→21 and awarded 12 EXP each. Quicksave showed B2F, `0:10:01`, count 2 and a five-turn Adventure Log | PASS for the shared in-dungeon clock presentation, accessibility value, persistence, floor-transition count, bounded combat and controls; warning/error logs empty. Thrash, confused Bide, a full rescue and physical audio were not exercised |

The separate candidate-12 fresh trial is retired as invalid acceptance evidence
because it used hidden reads. Its preserved partial evidence does not extend the
manual claims in this table; candidate 15 supplies the valid fresh full run.

Prior portrait, native interface, touch layout, loss/retry, Give Up, item,
status, PP, EXP and save observations remain in the preserved review history and
bounded `.work/blue-ready-20261011/` ledgers. The current review should cite a
specific ledger or checkpoint when relying on one of those observations.

The earlier responsive inspection at 390×844 and 844×390 showed both 256×192
screens and expanded touch controls fitting portrait and landscape. This is
browser viewport evidence, not physical iOS or Android acceptance.

## Implemented scope

- All 16 original personality outcomes, source-derived partner exclusions,
  partner naming and hero naming.
- Native opening scenery, title elements, windows, font data, portraits, actor
  sprites, dungeon terrain, HUD, status icons and selected battle effects.
- Three Tiny Woods floors with selected wild roster, source spawn/wind order,
  moves and PP, damage, accuracy, critical hits, statuses, held items, IQ and
  tactics, level/EXP growth, stairs, loss and retry.
- Input-locked ground transitions for Butterfree's arrival, silent departure to
  Tiny Woods and the Caterpie clearing approach.
- Keyboard and touch controls, accessible menu mirrors and Help, interruption
  ownership, bounded caches, screenshot capture and alternating save journals.
- Backward admission for reviewed historical opening saves, including naming,
  request, floor-entry and completed-rescue checkpoints.

## Current limitations

- Dialogue and some sound effects remain authored substitutes. Exact animation,
  effect, dialogue and sound timing is not established for every route.
- Background music is intentionally absent at Justin's request from 2026-10-11.
  This is an explicit scope waiver rather than an unresolved implementation bug.
- Candidate 18 retains the reviewed front/self, two-tile and line AI targeting
  and adds the bounded no-visible-foe branch. Candidate 17 supplies focused
  walking/follow/heal, stairs and B2F continuation evidence; the unseen
  two-tile branch remains source-only. Native movement/IQ scheduling, original seed history, the complete
  RNG call order, and Blue binary parity remain qualified. The native-family core and
  sampled captures do not prove cartridge replay identity.
- Candidate 13 has a complete legacy-xoshiro continuation through rescue and
  visible two-recipient Hypnosis selection/recovery evidence. Candidate 14 adds
  focused host-control audio-activation evidence; true OS/window backgrounding
  and physical audio output remain unobserved. Leech Seed and
  PCM 807 were not cast. The separate candidate-12 fresh trial is invalid
  acceptance evidence because it used hidden reads. Newly admitted
  first-attempt visual and audio routes are not each manually cast or auditioned.
- Candidate 16's Tackle 344 admission passed static source, preservation,
  lifetime and cap checks plus one focused Bulbasaur browser cast. The other
  eight species bindings and physical audio output remain source-only.
- Candidate 19's paralysis-family PCM admission passed static source, arithmetic,
  lifecycle and cap checks. Its focused browser run observed Static/paralysis
  and Thundershock result messages, PP, EXP and save continuation. Exact effect
  frames, physical sound, Disable's 938-to-927 replacement and the private
  29-request ceiling remain source-reviewed rather than manually verified.
- Heal Bell, Charm and Screech are later retry paths and have not been manually
  cast in the current candidate. Their source and save contracts are statically
  reviewed.
- Repeated failed rescues retain EXP and can expose **15 later move IDs across 20
  learnset rows** after admitting Squirtle's exact level-40 Skull Bash row. Those
  unsupported late routes remain visibly unavailable
  without consuming a turn or PP. They are outside first-attempt acceptance.
- Blue-specific title/menu layers and some exact pixels/timings remain
  comparative or unresolved. Asset provenance does not assert a rights-holder
  reuse grant.
- Reduced-motion completion has not been manually reviewed through ordinary
  browser controls. Physical-device acceptance and exact audio output have not
  been measured.
- The title save menu, browser storage, screenshot action and touch controls are
  scoped browser adaptations. Later communication modes are excluded.
- No automated game-source execution or automated playthrough was added. Static
  checks and manual browser evidence remain separate.

## Owning references

- [Current scope](BLUE-OPENING.md)
- [Visual and interface evidence](../../../tools/pokemon-dungeon/reference/blue-visual.md)
- [Opening choreography](../../../tools/pokemon-dungeon/reference/blue-opening-choreography.md)
- [Battle artwork and timing](../../../tools/pokemon-dungeon/reference/blue-battle-visuals.md)
- [Battle event ownership](../../../tools/pokemon-dungeon/reference/blue-battle-events.md)
- [Move coverage](../../../tools/pokemon-dungeon/reference/blue-move-coverage.md)
- [Move execution](../../../tools/pokemon-dungeon/reference/blue-move-execution.md)
- [Mechanics](../../../tools/pokemon-dungeon/reference/blue-mechanics.md)
- [Targeting and AI prerequisite](../../../tools/pokemon-dungeon/reference/blue-targeting.md)
- [Wild spawns](../../../tools/pokemon-dungeon/reference/blue-wild-spawns.md)
- [Floor sports](../../../tools/pokemon-dungeon/reference/blue-floor-sports.md)
- [Heal Bell](../../../tools/pokemon-dungeon/reference/blue-heal-bell.md)
- [Charm and Screech multipliers](../../../tools/pokemon-dungeon/reference/blue-stat-multipliers.md)
- [Status artwork](../../../tools/pokemon-dungeon/reference/blue-status-effects.md)
- [Audio and music waiver](../../../tools/pokemon-dungeon/reference/blue-audio.md)
- [Save journal](../../../tools/pokemon-dungeon/reference/blue-save-journal.md)
- [Ground scenes](../../../tools/pokemon-dungeon/reference/blue-ground-scenes.md)
- [Original Blue introduction video](https://www.youtube.com/watch?v=RrglH3dOqrg)

The cumulative pre-consolidation review is preserved at
`tools/pokemon-dungeon/.work/blue-ready-20261011/review-doc-history/` with its
SHA-256 ledger. Git head `5918574` retains the prior tracked version.
