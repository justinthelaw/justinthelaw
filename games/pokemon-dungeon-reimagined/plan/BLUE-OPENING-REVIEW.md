# Roux's Adventure review

## Story maintenance and Roux animation, 2026-10-20

This revision starts from `1444a4f34788241e59963d789bc24c68b0259030`.
The opening audit found the approved route intact: creation, awakening, Butterfree's
request, three Tiny Woods floors, Caterpie's reunion and the three berry rewards.
Named story beats and one movement-gate owner now replace duplicated offsets.
Dialogue, saved phase/line meanings, durations, retry rules and schemas are unchanged.
The [route guide](../../../tools/pokemon-dungeon/reference/blue-ground-scenes.md)
records the extension and save-compatibility boundaries. A static AST checker
pins the adaptation and rejects a fixture that skips the reunion.

Comparison with the 23 retained native character sets found missing Roux cast
markers and idle substitutions for Bite, Growl and Ground actions. The authored
[animation correction](../../../tools/pokemon-dungeon/reference/roux-adventure.md#artwork-and-verification-boundary)
adds action/recovery markers, a 24-tick contact/stride walk, ten-tick directional
recoil and the Eevee/Skitty shadow size. Concept A's exported PNG is byte-identical;
palette, source hashes, idle and sleep are preserved. Offline PNG/JSON comparisons
show all directions and action frames; schematic preview shadows are not native
renderer acceptance. The new animation checks fail against the old metadata.

Node 24.19.0/npm 12.2.0 authoring `npm run check` passed, including strict types,
facts, reproducible exports, the story contract and asset budgets. The distribution
is 136 files / 2,823,569 bytes, below 3 MiB. Website `npm run flight-check` passed
clean, lint and the static build/export, then stopped before browser tests:
Playwright's Chrome download returned an invalid archive. No compatible local
browser was installed. Browser execution, a new manual playthrough and physical
device acceptance remain unverified. No game/native source was executed.

## Concept A artwork refinement, 2026-10-13

The owner selected concept A and authorized its implementation on
`law/roux-sprite-refinement`. The replacement retains Roux's chocolate coat,
cream blaze/bib/paws and curled tail across eight directions and 48 body poses.
Separate centered normal, happy and shocked portraits replace the off-center
body crops. The awakening scene resolves its existing shocked expression.
Source decisions and generation provenance are recorded in the
[artwork brief](../../../tools/pokemon-dungeon/reference/roux-adventure.md#artwork-and-verification-boundary).

Independent PNG checks reproduced the old idle defect: pose 8 contained three
disconnected opaque components. The replacement passes the new connectedness,
border, ground-anchor, idle-stability, portrait-framing and palette checks.
Pinned Node 24.21.0 authoring lint/types and all reproducible exports/factual
checks passed. The distribution remains 136 files, now 2,820,862 bytes; the
Roux texture is 10,978 bytes with the same 237,568 decoded-byte footprint.
An enlarged review of the exported atlas showed complete ears/cheeks, centered
faces and no detached pixels. An offline animated asset preview uses the shipped
idle frames and timings; it does not import or execute game code.

Website lint and the static build passed. The initial sandboxed browser phase
could not launch Chromium, Firefox or WebKit; macOS denied browser startup
before any page loaded. With host launch permission, 468 of 470 inert-fixture
website cases passed. WebKit closed during one homepage context startup and
Mobile Safari failed one existing reduced-motion assertion; both passed on a
targeted serial `npm run test -- --last-failed --workers=1` rerun (2/2).
The exported website's Roux PNG, metadata and notice match the declared runtime
assets byte-for-byte. No game modules or automated gameplay were executed,
and no new manual gameplay acceptance is claimed.

## Roux candidate, 2026-10-13

The owner-requested rebrand starts directly at an authored chocolate/cream menu
and adds optional Normal/Ground Roux. The existing adventure ends at Caterpie's
rescue, with all original heroes and partner choices retained. The authored
[brief](../../../tools/pokemon-dungeon/reference/roux-adventure.md) records the
quiz route, moves, growth, Pickup and pet/art provenance separately from original
Blue facts.

Static authoring lint/types, factual pins, original-rule preservation,
reproducible exports, source closure and asset budgets passed. The final declared
distribution is 136 files / 2,876,693 bytes, below 3 MiB. Independent combat and
whole-branch source reviews approved after fixing underground Bide/projectile
receipts, removing an unrequested Protect entry and respecting reduced motion.
The quiz portrait remains above the new choices and previews Roux when selected;
the renamed menu preserves its helper text.

Website lint and the static build passed. A fresh serial website flight check
on the Dig follow-up passed all 470 inert-fixture browser cases. Local WebKit used existing
workspace libraries; its host-cache validation was bypassed after an inert
launch confirmed those libraries work. No game/native modules were executed,
no automated playthrough ran, and no new manual gameplay acceptance is claimed.
Pre-push source/documentation/security/size hooks passed. CI and the PR's current
Codex review are publication checks, distinct from these local results.

The first PR #406 pipeline passed all seven checks. Codex then found that Dig's
declared release multiplier was absent from the damage consumer. The follow-up
adds Dig to the existing 512/Q8 charge branch and a source-only AST gate linking
all declared charge multipliers to that consumer. The gate failed for Dig before
the fix and passed afterward. Roux's small-body Low Kick coefficient also uses
the admitted 153/Q8 size class instead of a unitless ordinal, with an independent
static admission check. No game code was executed. The final follow-up
verification and current-head CI/Codex outcomes are recorded with the PR.

The Dig follow-up pipeline also passed all seven checks. Its Codex review found
missing Special Defense presentation and a floor-entry Pickup narration gap.
The next follow-up maps Special Defense changes to pinned effects 401/400 and
packs their existing archive artwork; drops reuse the qualified defense-down
cue as an authored adaptation. Pickup now waits for tutorials and other surface
gates, then uses the shared message/narration owner. The previous timer already
paused under tutorials; the deferred publication also closes the actual
accessibility gap. Static stat-effect coverage failed before the mapping fix
and passed after it. Pending notices remain transient and retire with the scene.

## Historical original-opening review

PR #397 is merged. This record separates the historical checkpoint-40 acceptance
from the current documentation audit. The scope ends after Tiny Woods,
Caterpie's reunion and three berry rewards; later campaign/3D resources are excluded.
The owner's "95% viable product" target was not a measured fidelity score.

## Recorded checkpoint 40

The recorded distribution was 151 local files / 2,997,221 bytes, below 3 MiB.
Current parsed battle metadata still contains 66 effects across three banks:
2,553,856 decoded bytes, or 2,607,104 including Hypnosis, below 4 MiB.
The PCM catalog has 28 cues / 20 buffers / 494,812 decoded bytes. Voice limits
remain 15 for group 5, five for group 6 and 32 shared.

The checkpoint fixed indexed-PNG admission after a manual Continue exposed a
loader failure. It also included retained move-learning continuation, Counter,
Light Screen, Protect, Safeguard and native status-expiry ordering.
The recorded unsupported retry inventory was seven move IDs across eight
learnset rows; use [move coverage](../../../tools/pokemon-dungeon/reference/blue-move-coverage.md)
for source-qualified admission and limitations.

| Historical evidence | Result and boundary |
| --- | --- |
| Local checkpoint 40 | Pinned Node 24 static suite passed; website flight check with host browser permission: 439 passed, 21 skipped |
| Published `1e3b3bb` | Game Static Checks, lint, Playwright and CodeQL passed; the later manual Continue found the PNG loader issue |
| Review of `6dc8466` | Exact-head response recorded no new findings; thread status is historical, not rechecked here |
| Pages artifact `58929350e955171a10fe1f6bb6337bcb94b329cf` | 151 declared files, project-site paths and iframe integration verified; predates checkpoint 40 |

The [dependency checkpoint](../../../docs/dependency-upgrades/2026-10-12-pokemon-checkpoint.md)
records the installation adjustment. No policy, hook or test was disabled.
These earlier results are not fresh tests of this documentation revision.
Automated checks did not execute game/native modules or perform playthroughs.

## Manual browser evidence

Later changes do not broaden what an earlier run proved.

| Checkpoint | Observed behavior | Limits |
| --- | --- | --- |
| Candidate 36 → checkpoint 40, Rook/Bolt | Fresh quiz, Machop/Pikachu naming, awakening, B1F and early B2F on candidate 36. Normal Continue after the loader fix preserved levels/HP; checkpoint 40 completed B2F/B3F, Low Kick combat, Caterpie's reunion, all three berries and completed Continue. Adventure Log: 162 turns; Continue: Tiny Woods cleared, Adventures 1. Corrected-run warning/error logs were empty. | An explicit upgrade continuation, not one immutable fresh run. Bolt reached level 6 and learned Tail Whip before the upgrade. No replacement choice or high-level defensive move was exercised. |
| Signed `e8e641dd9e5fbb0a37132beb6e96c9d6ef743d8d` | Fresh website-embedded boot/title, quiz, Squirtle/Treecko creation, all three floors, Caterpie reunion, all three berries and completed Continue. Root independently read the 40-turn Adventure Log; both warning/error logs were empty. | Both partners stayed level 5. No new learned move, physical audio audition or confirmed B2F knockout. |
| Candidate 29, separate Sprout/Finn save | B1F save restored, B2F reached, two visible Sunkern defeated with Tackle; PP 21/22 to 19/22, final hit 18 damage and 16 EXP each. Help/download/Return worked; warning/error log empty. | No Solar Beam cast, full fresh run or new Quicksave/Continue claim. |
| `901951e`, Mimi/Shell continuation | Preserved B1F save through all three floors, reunion, rewards, 91-turn Adventure Log and completed Continue; warning/error log empty. | A continuation, not a fresh immutable onboarding-to-rescue run. |
| Candidate 15, frozen mechanics `120baa72…` | Fresh Charmander/Squirtle run through rescue and completed Continue in 227 turns; both reached level 6; warning/error log empty. | Predates later pruning, mechanics and media changes. |
| Candidate 12 save checks | Legacy namespace isolation and sequential stale-write rejection were observed through ordinary UI; both logs clean. | No exhaustive interleavings, quota failure or corruption injection. The separate hidden-read trial is excluded from acceptance. |
| Candidate 25–26 metadata | Fresh entry/retry count increments, completed-location precedence, play time persistence and unchanged count on stairs were observed. | Bounded runs; exact clock exclusion and physical-device acceptance remain unmeasured. |

Earlier 390x844 and 844x390 checks showed both native screens and touch controls
fitting portrait/landscape viewports. These were browser observations, not
physical-device acceptance. Browser saves were preserved; Quicksave failure,
quota, corruption and deletion acceptance remain incomplete.

## Current limitations

- Dialogue is authored. Exact animation/dialogue timing and full manual
  acceptance remain incomplete or qualified. The original file-menu illustration
  and title-cloud parity gaps are historical; those scenes are now retired.
- Blue waveform/driver identity, global audio phase/channel competition,
  resampling and physical output are unproved. Background music is intentionally absent.
- Native-family RNG does not establish original seed history, full draw schedules,
  floor generation or broader movement/IQ parity.
- New high-level moves, replacement-menu continuation, every effect binding,
  reduced-motion completion and physical-device behavior were not all manually exercised.
- Static documentation audit found that `render-status.js` loads Protect and
  Safeguard artwork but `statusMask()` does not select those two indicators.
  Their active shield display remains a runtime gap; this audit changes no game code.
- Browser saves, downloads, touch controls and the scoped menu are adaptations.
  Public source/asset provenance is not a rights-holder reuse grant.

## Evidence map

Start with [scope](BLUE-OPENING.md), then the authoring
[reference instructions](../../../tools/pokemon-dungeon/reference/AGENTS.md),
[visual](../../../tools/pokemon-dungeon/reference/blue-visual.md),
[mechanics](../../../tools/pokemon-dungeon/reference/blue-mechanics.md),
[audio](../../../tools/pokemon-dungeon/reference/blue-audio.md) and
[save](../../../tools/pokemon-dungeon/reference/blue-save-journal.md) records.
Individual move/presentation notes retain their owning evidence.

The [full pre-audit review](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/games/pokemon-dungeon-reimagined/plan/BLUE-OPENING-REVIEW.md)
preserves detailed change and acceptance history.
The ignored historical archive
`tools/pokemon-dungeon/.work/blue-ready-20261011/review-doc-history/candidate35-before-review-prune-20261012.md`
has SHA-256 `1acf91c8507bd9dedea1a18c2a5bf95831dc4459c9c50eae5b6cf16d643f09f1`.
Those local ledgers are not required checkout inputs.
