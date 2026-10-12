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

## Current candidate 15

The verified pre-pruning candidate 15 export contains **152 files totaling
2,959,061 bytes**, below the unchanged 3 MiB distribution cap. Its immutable
snapshot manifest has SHA-256
`c173c2b68747f70fd79d90cfd1c09efc9ad09752cb281fd1fc277e1aa2eba788`
and uses 33 website-shell files from the `a59d065` Pages artifact. A later
reviewed deletion-only AI prune produces a 2,958,889-byte distribution, and
its full Node 24 static check passed. The game uses local
resources only and has no runtime CDN dependency.

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
pre-pruning candidate's full static and 57-source PCM checks. They have not been manually auditioned.

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
reachable adjacent-class branches. The broader native movement/IQ tree and
no-visible-foe scheduling remain qualified. The frozen manual candidate still
uses pre-pruning mechanics SHA-256
`120baa72eb96d1e0fa022cdc3fb5c81a0913c814904746e5f8ae02deee32c4d0`;
current mechanics SHA-256 is
`b03c629e0ef01d2c4661215e780713f688aacc26abc7c063a9e99cd78302dcfa`.
These corrections postdate the immutable candidate 12 browser run. The
post-pruning static suite passed; its manual continuation remains pending.
Original Blue seed history, the complete RNG call schedule and cartridge replay remain unproved.

## Static and hosted evidence

The pre-pruning candidate 15 Node 24.21.0 authoring checks passed and cover
lint, strict static types, source facts, geometry, provenance, archive hashes,
effect inventories, decoded and encoded limits, distribution closure and all
57 PCM source pins. They do not import or execute the game as a test. Its fresh
browser run is active on B1F. It has shown partner Tail Whip and Tackle, a wild
actor choosing different adjacent team actors, and normal Scratch menu use. It
has not reached rescue or cast Bubble or Water Sport. The current deletion-only
prune passed the full static suite at 152 files/2,958,889 bytes; the active
browser uses the frozen pre-pruning source and remains bounded ongoing evidence.

Exact published head `61fc0b3758e20a989ea5670b26f3a7b56719d4ca`
passed hosted lint, Game Static Checks, Playwright and CodeQL. Its exact-head
Codex review completed with no new findings. That head repairs the two real
findings from `a59d065`: stale README save/RNG wording and loss of an already
trusted audio activation when same-origin website controls briefly own focus.
The two repaired, outdated review threads remain unresolved pending the
separately required publication workflow. Candidate 15 postdates `61fc0b3`;
its current post-pruning source still requires publication, hosted checks and
exact-head review.
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
| Candidate 15, active | Fresh Charmander/Squirtle B1F run observed partner Tail Whip and Tackle, a Wurmple choosing different adjacent team actors, movement/recovery and normal Scratch menu use | Bounded ongoing evidence using frozen pre-pruning mechanics `120baa72…`; not rescue/completion evidence. Bubble and Water Sport were not cast, and no physical audio was auditioned |

A separate fresh candidate 12 native-family adventure trial is active. It is
not yet completion evidence and is not claimed by this table.

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
- Candidate 15 expands reachable front/self, two-tile and line AI targeting
  from pinned comparative source. Both pre-pruning and current deletion-only
  static suites passed; the active fresh browser run remains incomplete and uses
  the frozen pre-pruning mechanics. Native movement/IQ scheduling, original seed history, the complete
  RNG call order, and Blue binary parity remain qualified. The native-family core and
  sampled captures do not prove cartridge replay identity.
- Candidate 13 has a complete legacy-xoshiro continuation through rescue and
  visible two-recipient Hypnosis selection/recovery evidence. Candidate 14 adds
  focused host-control audio-activation evidence; true OS/window backgrounding
  and physical audio output remain unobserved. Leech Seed and
  PCM 807 were not cast. Candidate 12's separate fresh
  native-family tester remains pending after corrected failed hidden-read attempts
  and is not completion evidence. Newly admitted
  first-attempt visual and audio routes are not each manually cast or auditioned.
- Heal Bell, Charm and Screech are later retry paths and have not been manually
  cast in the current candidate. Their source and save contracts are statically
  reviewed.
- Repeated failed rescues retain EXP and can expose **16 later move IDs across 21
  learnset rows**. Those unsupported late routes remain visibly unavailable
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
