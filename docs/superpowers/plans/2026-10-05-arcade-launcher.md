# Arcade Launcher Implementation Plan

> **For agentic workers:** Execute autonomously with focused implementation agents and an independent whole-branch review. The user explicitly waived approval handoffs and external Codex review on 2026-10-05.

**Goal:** Replace the homepage arcade icon and first WIP card, launch the local game in a viewport-filling modal, and provide a usable keyboard/touch bridge.

**Architecture:** Retain shared icon/button sizing and Radix dialog primitives. Keep cards mounted while the player is open. A website-owned control adapter emits standard keyboard events into the same-origin iframe, independently of game simulation.

**Tech Stack:** Existing React, TypeScript, CSS modules, Radix and fixture-based Playwright tests; no added dependency.

**Spec:** Justin's 2026-10-05 request for the joystick, Pokemon card, full-page modal and GBA-style mobile controls; root `AGENTS.md` governs website integration.

## Global constraints

- New branch starts at merged PR #390, main SHA `41586f8b7f572a7d6e03165da11023316b29dea0`.
- Title: `Pokemon Mystery Dungeon Blue Rescue Team - Reimagined`.
- The current runtime has no playable campaign. Label it in development and identify the existing P06 image as an art study, not a gameplay screenshot.
- Keep the second and third placeholder cards, static export/base paths, social/chat sizing, fonts and existing tooltips.
- Never import or execute game source in website tests; replace every game navigation with inert HTML before Play.
- External Codex review is waived; inspect CI and use an independent code review.

## Review focus

- Portrait and short landscape: 44px minimum touch targets without clipping or opaque full-screen controls.
- Pointer cancellation, blur, hide, iframe reload and player close: release every held key.
- Overlapping pointer ownership: releasing one control must not release a key another pointer holds.
- Keyboard focus: focus the iframe on load and restore the triggering Play control on close.
- Preview versus campaign: the launcher must not claim the startup shell is a complete game.

## Task 1: Launcher and card

**Files:** `ArcadePortal.tsx`, `src/config/arcade.ts`, `public/arcade/blue-rescue-team-preview.jpg`, `tests/arcade.spec.ts`.

- [x] Add a regression expecting the exact first-card title and enabled Play; observe RED.
- [x] Replace the portal sprite with an aria-hidden 🕹️ glyph sized 28/32/36px in the shared 40/44/48px control.
- [x] Copy the existing P06 composition image as a labelled art-study preview, with a short in-development description and local entry point.
- [x] Verify joystick alignment, decoded preview, two remaining placeholders and reduced motion.

## Task 2: Full-page player

**Files:** `ArcadeGames.tsx`, new `GamePlayer.tsx`, `Arcade.module.css`, `tests/arcade.spec.ts`.

**Interface:** `GamePlayer({ game, onClose }: { game: ArcadeGame | null; onClose(): void })` owns the dialog and iframe.

- [x] Add fixture assertions for a viewport-sized dialog, prefixed iframe URL, keyboard focus and focus restoration.
- [x] Use Radix with a safe-area toolbar, always-visible Back to games and a flexing iframe; remove the inline 75svh player.
- [x] Keep cards mounted and restore Play focus after closing; no eager game loading.

## Task 3: Touch/keyboard bridge

**Files:** new `GameControls.tsx`, `useGameControls.ts`, `GameControls.module.css`, `tests/game-controls.spec.ts`.

**Interface:** `GameControls` consumes the iframe reference. Its adapter tracks pointer-owned keys and sends keydown/keyup to the frame's focused element, bubbling to its document/window.

- [x] Add inert-fixture tests for keys, diagonals and interruption cleanup.
- [x] Provide eight-direction D-pad, A/Z, B/X, Start/Enter, Select/Shift and Menu/Escape; desktop keyboard uses native iframe focus.
- [x] Show controls on touch/coarse-pointer sessions; preserve a manual show/hide choice for the mounted player.
- [x] Use semitransparent button surfaces, pass-through gaps, safe areas and responsive 44px-or-larger targets.
- [x] Clear pointer roles/pressed keys on cancel, capture loss, visibility loss, blur, hide, reload and disposal.

## Task 4: Verify and publish

**Files:** relevant root/game instructions, `games/README.md`, customization/integration notes, PR description.

- [x] Record the user's explicit launcher authorization separately from full-campaign completion.
- [ ] Run `npm run flight-check`, contribution checks and `git diff --check` when local tooling is available; report infrastructure blockers precisely.
- [ ] Inspect independent review, then publish scoped changes and monitor current-head CI until terminal success or a precise blocker.
- [ ] Leave the new PR unmerged for Justin; only PR #390 was authorized for merge.
