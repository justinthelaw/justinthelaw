# Browser input recovery implementation plan

> Execute inline under the existing continuation authorization. Use the
> executing-plans workflow and independent scoped review before publication.

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

- [ ] Add fixture regressions for pointer input after toolbar focus and keyboard
  activation of a focused overlay control, including exact down/up delivery.
- [ ] Observe the regressions fail before changing production code.
- [ ] Restore exact frame focus before bridge delivery; preserve typing and
  document replacement guards and cancel interrupted keyboard activation.
- [ ] Run website lint/build/fixture suites and independent scoped review.
- [ ] Record actual evidence and update the existing PR #397.

## Task 2: Diagnose turn latency

**Files:** Read-only trace of current escort policy/shape owners and callers.

- [ ] Identify repeated synchronous work with exact source evidence.
- [ ] Implement only a separately reviewed optimization that preserves every
  current raw proof, original-envelope boundary and frozen source pin.
- [ ] Run authoring static checks; record browser/device limits explicitly.

## Initial environment evidence

- Live arcade reaches renderer construction, then reports WebGL 2 unavailable
  in the available cloud browser; gameplay cannot be verified there.
- Local production lint/types/build/export pass. Pinned Playwright browser
  installation downloads truncated ZIP archives before any fixture test runs.
- Use hosted fixture CI for executable website regression evidence. No real
  game response is allowed into those tests.
