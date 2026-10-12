# Archived arcade-launcher plan - 2026-10-05

Historical plan from merged PR #390, main
`41586f8b7f572a7d6e03165da11023316b29dea0`.
[Original plan](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/docs/superpowers/plans/2026-10-05-arcade-launcher.md).
Its task-specific review waiver and publication instructions are not standing
permission. Current behavior is documented in [root instructions](../../../AGENTS.md),
[arcade configuration](../../../src/config/arcade.ts) and the
[Blue opening scope](../../../games/pokemon-dungeon-reimagined/plan/BLUE-OPENING.md).

The implementation checklist recorded these completed website changes:

- Shared corner portal sizing, first-card preview/entry point and two placeholders.
- A viewport-filling Radix player with a safe-area Back control, retained cards,
  prefixed iframe URL, keyboard focus and restoration to Play.
- A website-owned keyboard/touch bridge with eight-direction movement, A/Z,
  B/X, Start/Enter, Select/Shift and Menu/Escape; touch-default/manual visibility,
  targets at least 44px and interruption cleanup for every held key.
- Inert Playwright fixtures for sizing, routing, focus, diagonals, overlapping
  pointer ownership and cancellation; game source was outside automated tests.

The plan's startup-shell/no-campaign label, P06 art-study JPEG and provisional
card title were superseded by the native Tiny Woods PNG and scoped DS opening.
Flight-check, contribution checks, review, publication and CI remained unchecked
in this plan; it alone does not establish their later outcome. Keep future
changes aligned with the current component contracts and repository gates.
