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

## Current candidate 11

The static export contains **152 files totaling 2,926,450 bytes**, below the
unchanged 3 MiB distribution cap. The game uses local resources only and has no
runtime CDN dependency.

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
and tail behavior; all seven prior sample/cue tuples remain byte-exact. Eight
decoded buffers use 229,412 bytes, and both groups retain the shared 32-source
ceiling. Reapplying Whiffer consumes the source's discarded duration draw and
reports the existing status without replacing its timer or playing the helper
sound again. Source checks verify all 48 PCM input pins. A focused manual
Smokescreen trial verified fresh and duplicate applications, PP consumption and
normal control recovery with no browser warnings or errors. Exact Blue audio
and audition remain
qualified in [audio evidence](../../../tools/pokemon-dungeon/reference/blue-audio.md).

Held B+A now polls each eligible input opportunity, preserves modifier priority,
and requires nonzero integer Belly. Plain A remains edge-triggered. Duplicate
Sleep consumes the source duration draw and entry effect without replacing its
old timer. Existing sound data is connected to reviewed direct move/species
pairs, Ember casting and empty-adjacent Attract. An unreachable synthetic cast
fallback was removed. Other sound routes remain qualified.

## Static and hosted evidence

The composed Node 24.21.0 authoring checks cover lint, strict static types,
source facts, geometry, provenance, archive hashes, effect inventories, decoded
and encoded limits, and distribution closure. They do not import or execute the
game as a test.

Exact published head `11008c638843b8957092e7c887f2fa4f38a42b84`
passed the hosted lint, Game Static Checks, Playwright and CodeQL workflows.
Codex completed its review and added a thumbs-up after the trigger and workflow
creation timestamps. The normal watcher exited 2 on its false acknowledgment
classification; independent provider checks established completion after late
discovery, with no unresolved review threads. The current working tree is later than that published head and must be assessed with its own final exact-head checks after publication.

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
- Native AI and speed scheduling, cartridge RNG and call order, and Blue binary
  parity remain qualified. Source arithmetic and sampled captures do not prove
  complete behavioral identity.
- Candidate 8 has focused post-pruning browser acceptance, following the complete
  candidate 7 rescue. Newly admitted first-attempt visual routes are source/static
  reviewed and are not each manually cast.
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
