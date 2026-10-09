# Browser input recovery implementation plan

> Resumed locally. Read the latest checkpoint in CODEX-HANDOFF-2026-10-09.md.
> Production focus repair and structural fixes are implemented and reviewed;
> after-profiling and current-head website fixtures remain open.

**Goal:** Keep the embedded game responsive to its controls after website
focus changes, and investigate turn stalls without weakening save validation.

**Architecture:** The website owns focus and synthetic key delivery. The game
keeps its existing blur pause and canonical command guards. Capture the exact
iframe document, restore focus before sending input, and keep keyboard release
in the host before a control activation enters the game.

**Tech stack:** React/TypeScript website, Playwright inert iframe fixtures,
JavaScript game source with independent static checks.

**Spec:** Root/game AGENTS.md, RECOVERY-2026-10-08-DIALOGUE.md and the
2026-10-09 request to continue PR work and prevent browser freezes.

## Constraints and review focus

- D05 prohibits tests importing/executing game source and automated playthroughs.
- Preserve existing typing protection, key ownership and cancellation.
- A replaced/disconnected iframe must not receive a delayed activation.
- Enter/Space release must stay in the host and emit exactly one game pulse.
- Preserve original save schemas, pins, canonical progression and raw proofs.
- Do not claim gameplay acceptance from fixture or static checks.

## Task 1: Recover control focus

**Files:** `src/components/arcade/{GameControls.tsx,useGameControls.ts}`,
`tests/game-controls.spec.ts`, root AGENTS.md and game plan/PROGRESS.md.

**Interface:** Existing pointer/pulse bridge accepts the current same-origin
iframe and key set. Only an admitted recipient may regain focus. Keyboard
activation is delivered after the owning host key is released.

- [x] Add fixture regressions for pointer input after toolbar focus and keyboard
  activation of a focused overlay control, including exact down/up delivery.
- [x] Observe the regressions fail before changing production code.
- [x] Restore exact frame focus before bridge delivery; preserve typing and
  document replacement guards and cancel interrupted keyboard activation.
- [ ] Run website lint/build/fixture suites and independent scoped review.
- [ ] Record actual evidence and update the existing PR #397.

## Task 2: Reuse immutable structural preflight

**Files:** `src/domain/state/escort-shape-proof.js`, the independent authoring
checker and check chain, and `plan/ESCORT-SHAPE-PREFLIGHT-CACHE.md`.

- [x] Identify repeated synchronous work: nested escort resource/learning
  proofs repeatedly detach and scan the entire state within one validation.
- [x] Cache only successful structural checks of exact deeply frozen input
  identities in a private WeakSet; prove all descendants frozen using data
  descriptors, without freezing callers. Mutable inputs always revalidate.
- [x] Keep every semantic/raw callback and original envelope proof intact;
  add a failing parser-only source audit before implementation.
- [ ] Run authoring static checks; record browser/device limits explicitly.

## Initial environment evidence

The local continuation later reproduced actual Tiny Woods stalls in Chrome.
Native DevTools recorded 42.395 seconds of scripting in a 46.425-second trace
and a 16.625-second interaction. The original structural inspector repeatedly
threw on null tile IDs and re-walked successful visitorless union branches.
See STRUCTURAL-PREFLIGHT.md for the reviewed fixes. This newer evidence does
not establish after-performance or whole-game acceptance.

- Live arcade reaches renderer construction, then reports WebGL 2 unavailable
  in the available cloud browser; gameplay cannot be verified there.
- Local production lint/types/build/export pass. Pinned Playwright browser
  installation downloads truncated ZIP archives before any fixture test runs.
- Use hosted fixture CI for executable website regression evidence. No real
  game response is allowed into those tests.

## Execution ledger

- Pre-flight: the website focus and immutable shape cache have no shared
  implementation interface. Both retain the game/website test boundary.
- Test-only checkpoint `7c119cf` is published for hosted regression evidence.
- Ruling: keep validation reuse structural and identity-based only; semantic
  results are never cached because their ownership depends on each callback.
- Ruling: use hosted browser fixtures because local pinned browser downloads
  are truncated; actual game acceptance remains blocked by cloud WebGL 2.

## User-requested stopping point

On 2026-10-09 Justin requested a committed handoff and PR comment, then an
immediate end to this turn. Focus regression tests are committed ahead of the
production fix; hosted results and the final head must be inspected next.
The structural-cache candidate and parser audit are preserved for independent
review and real-browser profiling. Full acceptance remains open.
