# Interrupted recovery checkpoint

This draft checkpoint preserves the available Git objects from local commit
`2974199d0b2b2f6b7e5cc6df6ced8b737888d3b6`. Its original complete tree was
`13e7c68ada6079d9c152a0010f385d2e7bde542c`. All runtime files and source text from that
checkpoint were uploaded; 62 authoring evidence images remain unavailable
because the execution workspace disconnected during transport. The exact
paths, sizes and Git blob hashes are in
[upload-missing-evidence.json](upload-missing-evidence.json).

This is not a finished or playable game. The startup shell still reports that
the adventure is in development. Keep the PR in draft and unmerged. Do not
weaken static checks or remove evidence requirements to make this interrupted
upload appear complete.

## Verified local work before the interruption

- Commit `2974199d0b2b2f6b7e5cc6df6ced8b737888d3b6`: recovered source, catalog,
  navigation, Adventure and scheduler foundations, progression validation,
  dungeon byte-integrity checks, directional art sources and provenance.
  Independent responsibility reviews, contribution hooks and the full game
  static tool check passed.
- A fresh checkout of that commit passed the full static tool check and
  regenerated the tools-only roster assets. The Pages production build
  succeeded; its exported game matched all 484 source files byte-for-byte
  (23,040,052 bytes, no missing or extra files).
- The fresh website browser suite could not start because downloading pinned
  Chromium produced a truncated archive. Older 334-pass/21-skip fixture
  results are historical and do not certify this published head.
- Later local commit `958b11f7dad1123f5158aa8bb45aed236f36bc7d` implements
  sourced item/economy snapshot policies. It passed independent review,
  contribution hooks, lint and types. Its source has not yet been uploaded.
- Later local commit `5625080f0263d2812ccd2f6517736ca1efc181da` implements
  profile and permanent Pokemon snapshot policies. It passed independent
  review, contribution hooks, lint and types. Explicit Unicode escapes
  preserve the sourced keyboard quote characters through formatting.
  Its source has not yet been uploaded.
- Read-only evolution research was completed locally: 183 ordinary edges
  join accepted permanent profiles, with Shedinja extra creation and excluded
  Munchlax lineage recorded separately. The report and evidence are in
  `.superpowers/sdd/FULL-GAME-EXECUTION/evolution-research-report.md` and
  its sibling `evolution-research/` directory. This research has not been
  accepted as runtime behavior.

## Resume without discarding work

1. Reconnect the existing `pokemon-full-game` worktree on
   `feat/pokemon-full-campaign`. Preserve its commits and the separate
   verification worktree. Do not reset it to this earlier remote snapshot.
2. Read the plan ledger and recovery reports. Recover the later two commits
   above, then restore each missing evidence blob using its recorded hash.
3. Compare a complete remote tree against the chosen local committed tree,
   accounting for this interruption record. Run current-head contribution,
   game static and Pages checks and fixture-based website CI.
4. Resume the full approved plan. The next narrow source responsibility is
   the evolution-edge catalog and stable policy crosswalk; actor, floor,
   conditions, scheduler, entry, progress, jobs, scenes, results, rescue and
   town policies still need completion before full CampaignContent assembly.
5. Complete shared mechanics, all main/postgame routes, roster promotion and
   actual manual play/visual acceptance before claiming the game works.

The user's external Codex Code Review waiver remains in effect. Independent
source review is recorded separately. No automated test imports or executes
game source; no automated playthrough is permitted by the approved D05
boundary. No merge or deployment occurred.
