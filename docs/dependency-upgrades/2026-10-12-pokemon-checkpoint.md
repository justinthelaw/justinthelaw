# PR 397 dependency checkpoint - 2026-10-12

Historical installation and validation evidence for
[PR #397](https://github.com/justinthelaw/justinthelaw/pull/397), since merged.
The [later audit](2026-10-12.md) supersedes these temporary pins;
[package.json](../../package.json) and its lockfile define current versions.
[Original report](https://github.com/justinthelaw/justinthelaw/blob/b5796bc4a0088f2fbee3939023511cb32304572e/docs/dependency-upgrades/2026-10-12-pokemon-checkpoint.md).

Registry installation failures led to user-authorized available stable versions
within existing framework/tooling lines, without changing registry policy:

| Package | Previous lock | Checkpoint pin |
| --- | --- | --- |
| Next.js | 16.4.0 | 16.3.8 |
| Transformers.js | 4.3.1 | 4.3.0 |
| Radix UI | 1.7.0 | 1.6.7 |
| Playwright | 1.64.0 | 1.63.0 |
| ESLint React | 5.24.8 | 5.24.4 |
| TypeScript ESLint | 8.71.1 | 8.71.0 |

Related families were coherently resolved. Commit `4187dc9` supplied compatibility
precedent for Next 16.3, Transformers.js 4.3.0 and Playwright 1.63.0. Parent-compatible
overrides selected update-browserslist-db 1.3.3, caniuse-lite 1.0.30001814,
electron-to-chromium 1.5.444 and Babel helpers/traverse 7.29.7. Existing security
overrides remained; native npm generated public-registry URLs and integrity values.

Recorded checks under Node 24.21.0 passed installation/graph, website lint/static
export, all 151 exported game resources and prefixed asset/iframe paths, and
pre-push hooks. Website fixtures passed **439 tests, 21 skipped** across five
browser projects, including Mobile Safari animation. Initial macOS browser startup
was sandbox-blocked; the full test stage subsequently passed with host permission.
No gate was disabled and automated tests did not execute game behavior.

Manual browser inspection covered the embedded opening, title/menu, screenshot
download and return-to-Play focus without warning/error logs. The audit retained
five high npm entries for the publisher's single `gh-pages -> braces` advisory,
with the [existing deferral](2026-10-07.md#migration-and-retained-constraints).
This was not a clean security audit or publisher migration.
