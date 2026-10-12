# Stable dependency checkpoint for PR 397

The required website checks were blocked because the configured registry could
not install several locked versions. Justin authorized the nearest reasonable
version adjustments. This checkpoint selects available stable releases within
the existing framework and tooling lines; it does not change registry policy.

| Direct package | Previous lock | Selected stable version |
| --- | --- | --- |
| Next.js | 16.4.0 | 16.3.8 |
| Transformers.js | 4.3.1 | 4.3.0 |
| Radix UI | 1.7.0 | 1.6.7 |
| Playwright | 1.64.0 | 1.63.0 |
| ESLint React | 5.24.8 | 5.24.4 |
| TypeScript ESLint | 8.71.1 | 8.71.0 |

These direct versions are pinned exactly, with their related packages resolved
as coherent families. Next.js 16.3.8 accepts the existing React 19 and Node 24
versions. The earlier repository lock at `4187dc9` supplies compatibility
precedent for Next.js 16.3, Transformers.js 4.3.0 and Playwright 1.63.0.

Five exact transitive overrides retain their parents' supported ranges:
`update-browserslist-db` 1.3.3, `caniuse-lite` 1.0.30001814,
`electron-to-chromium` 1.5.444, and Babel `helpers`/`traverse` 7.29.7.
Existing security overrides remain unchanged. Normal npm resolution generated
the lockfile; its public npm URLs preserve every selected version and integrity
value so GitHub Actions does not depend on a private registry hostname.

Validation used pinned Node 24.21.0:

- Normal `npm ci` succeeded; the installed dependency graph has no npm problems.
- Website lint and the Next.js static export passed. All 151 declared game files
  match the export, with `/justinthelaw` asset and iframe paths.
- The full website fixture suite passed: 439 passed and 21 skipped across five
  browser projects, including the Mobile Safari animation regression.
- All pre-push checks passed, including the required app ESLint hook.
- Manual browser inspection verified the actual embedded opening, title/menu,
  screenshot download and return-to-Play focus, with no warning/error logs.

The first local flight check reached browser tests but macOS sandbox permissions
blocked browser startup. Its evidence was preserved; the complete test stage
then passed with host browser-launch permission. No test or security gate was
disabled. Game behavior remains outside automated website tests.

The audit still reports five high entries for the existing manual publisher's
single `gh-pages → braces` advisory. Its prior
[documented deferral](2026-10-07.md) remains applicable; this is not a clean
security audit or a publisher migration.
