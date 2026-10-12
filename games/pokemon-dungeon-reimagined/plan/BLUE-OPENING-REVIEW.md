# Blue Rescue Team opening review

## Scope and readiness

PR #397 implements the original Blue Rescue Team opening through Caterpie's
Tiny Woods rescue: title/save menus, personality quiz, partner and hero naming,
awakening, Butterfree's request, three dungeon floors, reunion, three berry
rewards, Adventure Log, loss/retry and completed-save Continue. Town, team
formation, later dungeons and the historical Three.js runtime are excluded from
the website export. Existing save namespaces and journal safeguards remain.

The PR remains draft. The opening has completed manual browser runs, but exact
cartridge parity and the current local changes' full release checks are not
complete. Background music is intentionally absent at Justin's request;
gameplay and UI effects remain. No production deployment is claimed.

## Current local candidate 39

The distribution contains **151 local files / 2,997,009 bytes**, below the
unchanged 3 MiB cap. Its **66 battle effects in three banks** occupy 2,553,856
decoded bytes; including the separately owned Hypnosis background, effect memory
is **2,607,104 bytes**, below 4 MiB. The PCM catalog contains **28 cues, 20
buffers, 494,812 decoded bytes, 124 notes and 80 pinned source records**. Audio
groups 5 and 6 retain limits of 15 and 5 sources, with a shared ceiling of 32.

Changes held locally after published `6dc8466262bd475c865c441478364934ca7edd16`:

- [Safeguard](../../../tools/pokemon-dungeon/reference/blue-safeguard.md) adds
  Chikorita's level-43 room protection, shared-class duration and per-status
  guards, with its red shield, effect 238 and sequence 776. When all enabled
  moves have represented no-foe resolvers, its AI keeps the normal opportunity
  draw without a visible foe and checks targets afterward.
- Lossless indexed PNG encoding saves 74,848 bytes across 46 images. All 49
  shipped PNGs preserve exact dimensions and decoded RGBA pixels, independently
  checked with two decoders. Runtime loaders and decoded-memory caps are unchanged.
- [Protect](../../../tools/pokemon-dungeon/reference/blue-protect.md) now covers
  Squirtle at level 28 and Mudkip at level 37. It retains the self-accuracy draw,
  shared defensive-status class, expiry, blocked regular attacks and charged
  releases, effect 140, its green shield and sequence 708. A typed guarded-target
  result preserves target effects, failure sound, text and marker order without
  rolling accuracy; its bounded sound path leaves global voice limits unchanged.
- A saved move-learning continuation pauses at a four-move replacement choice
  before later actors run. Six bounded scheduler stages resume the remaining
  EXP recipient and actor work without replaying upkeep, actions or RNG draws.
  Legacy queued choices remain valid. A damaging money throw retires its pose
  within its original result; Continue never replays its visual cleanup.

- A fresh browser launch exposed a stale 144-pixel status-atlas height after
  Light Screen added a tenth row. Atlas height and count now derive from the
  curated symbol table; a static AST check compares that table to exported
  artwork. Browser revalidation reached the title menu, fresh quiz, character naming
  and awakening on frozen candidate 36; the longer run remains active.
- A successful verified save deletion clears its stale warning. Failure and
  stale-write safeguards are unchanged; testing has not deleted a browser save.
- The website's Mobile Safari animation test scrolls the stable card ancestor
  instead of its moving SVG body. Both animation assertions remain intact.
- Treecko's level-16 [Pursuit](../../../tools/pokemon-dungeon/reference/blue-counter.md)
  implements the Counter stance and physical rebound. EXP from an acting wild
  fainting to Counter waits until the next eligible actor's beginning upkeep
  finishes, before AI/input. The optional pending award survives active
  playing/stairs saves and clears on defeat, rescue, floor change and retry.
- Pikachu's level-50 and Chikorita's level-36
  [Light Screen](../../../tools/pokemon-dungeon/reference/blue-light-screen.md)
  share status application with Reflect and Counter. This removes redundant
  Counter plumbing and corrects Reflect's effect drain and duplicate/expiry
  messages. The defense effect follows ability announcements and precedes
  accuracy 2; Light Screen waits while Reflect continues with it visible.
- Beginning-of-opportunity timers use native status-class order, so simultaneous
  expiry messages no longer depend on property insertion order. The same 16
  saved status keys, indefinite timers, RNG behavior and separate Bide/Rage
  end-of-turn handling remain. This adds no missing expiry messages.

The retained runtime also includes source-qualified charge/release handling,
move chains, constriction, actor targeting, status and item effects, first-entry
and retry counters, Continue progress cards, shared play time and save-journal
migration. Detailed rules and qualifications belong to the owning references
below. The unsupported retry inventory is **7 move IDs across 8 learnset rows**;
those choices remain visibly unavailable without consuming a turn or PP.

## Validation and publication

| Evidence | Result and boundary |
| --- | --- |
| Local candidate 39 | Pinned Node 24.21.0 full static suite passed: syntax, lint, strict types, factual/provenance inputs, lossless PNG round trips, assets and distribution closure. Full pre-commit checks passed. |
| Audio sources | PCM and SE2 exporter checks passed against pinned comparative source. This does not establish Blue waveform/driver identity or physical sound output. |
| Published `6dc8466` | Game Static Checks, lint and CodeQL passed. Playwright failed in Mobile Safari while waiting for the moving SVG to stabilize; the local stable-ancestor repair above has not run in hosted CI. |
| Requested Codex review of `6dc8466` | Exact-head response reported no new findings. Four older unresolved threads remain: audio focus, music documentation, inclusive AI weighting and Quicksave. Source review supports the inclusive weighting; the other three have published fixes. Thread resolution is pending authorization. |
| Retained Pages artifact at `58929350e955171a10fe1f6bb6337bcb94b329cf` | All 151 declared runtime files, project-site base paths and iframe integration were verified. It predates the current local candidate; no `6dc8466` Pages artifact is available. |

The full local website flight check and publication are blocked. The required
pre-push app ESLint check could not run because root dependencies are absent;
the normal pinned installation returned Socket Security Policy E403 for recently
published packages. An approved dependency installation or policy exception is
pending. No dependency versions, security policy, hooks or checks were weakened.
The website repair has syntax-only local validation until those dependencies
are available.

No game or native module was executed by automated checks, and no automated
playthrough was added. Manual browser observations and static source evidence
are separate. The latest Counter, Light Screen, Protect, Safeguard and timer-order changes have not
been manually exercised. Candidate 37 also reached its normal Start game screen in a separate loader
smoke check with no browser warnings/errors. No adventure was created in that
check, and its tab/server were closed. The new move-learning continuation has
independent static review; its
replacement-menu and resumed-turn behavior still need manual verification.

## Manual browser evidence

Later edits do not expand what an earlier run proved. The table retains the
most relevant release evidence; full earlier observations and limitations remain
in the review history and local ledgers.

| Checkpoint | Observed behavior | Limits |
| --- | --- | --- |
| Candidate 36, active Rook/Bolt run | Fresh quiz, Machop/Pikachu naming, awakening, B1F combat and B2F. Bolt reached level 6 and learned Tail Whip; the move list shows 22/22 PP. Low Kick shortcut, facing controls, Poké pickup tutorial and stairs worked. | Still active; no replacement choice or rescue yet. Its immutable runtime predates Protect, Safeguard and the PNG optimization. |
| Signed `e8e641dd9e5fbb0a37132beb6e96c9d6ef743d8d` | Fresh website-embedded boot/title, quiz, Squirtle/Treecko creation, all three floors, Caterpie reunion, all three berries and completed Continue. Root independently read the 40-turn Adventure Log; both warning/error logs were empty. | Both partners stayed level 5. No new learned move, physical audio audition or confirmed B2F knockout. |
| Candidate 29, separate Sprout/Finn save | B1F save restored, B2F reached, two visible Sunkern defeated with Tackle; PP 21/22 to 19/22, final hit 18 damage and 16 EXP each. Help/download/Return worked; warning/error log empty. | No Solar Beam cast, full fresh run or new Quicksave/Continue claim. |
| `901951e`, Mimi/Shell continuation | Preserved B1F save through all three floors, reunion, rewards, 91-turn Adventure Log and completed Continue; warning/error log empty. | A continuation, not a fresh immutable onboarding-to-rescue run. |
| Candidate 15, frozen mechanics `120baa72…` | Fresh Charmander/Squirtle run through rescue and completed Continue in 227 turns; both reached level 6; warning/error log empty. | Predates later pruning, mechanics and media changes. |
| Candidate 12 save checks | Legacy namespace isolation and sequential stale-write rejection were observed through ordinary UI; both logs clean. | No exhaustive interleavings, quota failure or corruption injection. The separate hidden-read trial is excluded from acceptance. |
| Candidate 25–26 metadata | Fresh entry/retry count increments, completed-location precedence, play time persistence and unchanged count on stairs were observed. | Bounded runs; exact clock exclusion and physical-device acceptance remain unmeasured. |

Earlier 390×844 and 844×390 viewport checks showed both 256×192 screens and touch
controls fitting portrait and landscape. This is browser viewport evidence,
not physical iOS/Android acceptance. Completed runs' tabs and servers are closed;
the active candidate 36 trial and its automatic checkpoint remain open. Quicksave
failure testing remains pending explicit test-save approval.

## Remaining fidelity gaps

- Dialogue remains an authored adaptation. Some sound effects, exact animation
  and dialogue timing, the third native menu illustration and moving title-cloud
  layer remain unresolved or comparative.
- Blue-specific audio waveforms, driver behavior, global phase, channel
  competition, resampling and physical output are unproved. Native Red source
  is comparative evidence unless separately corroborated for Blue.
- The native-family RNG core is implemented, but original seed history, the
  complete draw schedule, floor generation and broader movement/IQ scheduling
  do not establish cartridge replay identity.
- Seven unsupported retry moves and interactions introduced by them still
  require implementation and review. The new learning continuation needs manual
  acceptance at a naturally reached replacement choice.
- New high-level routes, every first-attempt effect binding, reduced-motion
  completion and physical audio/device behavior have not all been manually
  exercised. Successful rescue runs establish their recorded paths only.
- Browser saving, screenshot download, touch controls and the scoped menu are
  browser adaptations. Later communication modes are excluded. Public asset
  provenance does not assert a rights-holder reuse grant.

## Owning references

- [Current scope](BLUE-OPENING.md)
- [Visual and interface evidence](../../../tools/pokemon-dungeon/reference/blue-visual.md)
- [Opening choreography](../../../tools/pokemon-dungeon/reference/blue-opening-choreography.md)
- [Battle artwork and timing](../../../tools/pokemon-dungeon/reference/blue-battle-visuals.md)
- [Battle event ownership](../../../tools/pokemon-dungeon/reference/blue-battle-events.md)
- [Protect](../../../tools/pokemon-dungeon/reference/blue-protect.md)
- [Safeguard](../../../tools/pokemon-dungeon/reference/blue-safeguard.md)
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

The cumulative review immediately before this consolidation is preserved at
`tools/pokemon-dungeon/.work/blue-ready-20261011/review-doc-history/candidate35-before-review-prune-20261012.md`
with SHA-256 `1acf91c8507bd9dedea1a18c2a5bf95831dc4459c9c50eae5b6cf16d643f09f1`.
Git head `6dc8466` retains the published predecessor; earlier consolidation
records and bounded browser ledgers remain under the same `.work` evidence root.
