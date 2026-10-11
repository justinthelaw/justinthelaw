# Pages development preview

## Artifact preparation

- Every pull request to `main` reuses the existing
  [website checks](../../../.github/workflows/app.test.yml): install the pinned
  dependencies, validate the lockfile, build, lint, and run the website browser
  projects with inert game fixtures.
- A successful run uploads `pages-preview-<build SHA>` for 14 days. Download it
  from that run's Artifacts section. Its contents are the complete `out/`
  directory, including hidden files; no game compilation or deployment occurs.
- The build SHA is GitHub's pull-request merge revision, including the current
  base branch. Record both that SHA and the pull-request head before review.
- The website is built with its configured production project base path,
  currently `/justinthelaw`. Game imports and resources remain relative to the
  game directory.
- A successful artifact is a reviewable development checkpoint. It does not
  establish manual gameplay, visual, device, complete-campaign or release
  acceptance.

## Local artifact preview

1. Extract the downloaded artifact into an empty `out/` directory in the
   corresponding checkout. The archive's root contains `index.html`; do not add
   another `out/` directory around it.
2. Run `npm start` from the checkout root. The existing static preview server
   reads the exported base path, so no rebuild or dependency installation is
   needed to serve the downloaded files.
3. Open `http://127.0.0.1:3000/justinthelaw/arcade/`, or the equivalent URL for
   the configured project path. Direct game access is
   `http://127.0.0.1:3000/justinthelaw/games/pokemon-dungeon-reimagined/index.html`.

## Review checklist

| Check | Evidence |
| --- | --- |
| Exact revision | Artifact build SHA, PR head and successful current-run CI |
| Static export | `index.html`, `arcade/index.html`, game entry, local modules/assets and notices exist in the downloaded tree |
| Website integration | Existing fixture checks cover preview decoding, no game preload, prefixed iframe URL, keyboard/touch bridge, Back and focus restoration |
| Game static checks | Current-head independent source/type/asset checks pass without importing or executing game modules |
| Human review | Separately record opening-route play, saves/reload, rendering, controls, audio, failure recovery and desktop/mobile observations |
| Scope | Preserve the development label and record incomplete campaign and acceptance gates |

## Publication remains explicit

- Artifact upload changes no Pages environment, branch, deployment permissions,
  or live website. The existing
  [Deploy workflow](../../../.github/workflows/deploy.yml) is unchanged.
- PR #392 was merged for the explicitly authorized opening MVP. Current full
  continuation PR #397 remains draft and unmerged. Follow
  [the current handoff](CODEX-HANDOFF-2026-10-09.md),
  [integration release gates](INTEGRATION.md) and current user authorization.
- Before an authorized run, verify **Settings → Pages** uses **GitHub Actions**
  as its build/deployment source and the **github-pages** environment's deployment
  branch policy permits the selected branch. These settings cannot be inferred
  from workflow YAML. If the branch is denied, hold deployment and inspect the
  existing policy; do not automatically change or weaken it.
- After explicit approval to publish a specific development checkpoint, select
  that approved revision's branch in **Actions → Deploy → Run workflow**. This
  workflow rebuilds, lints and runs website checks before publishing to the
  existing production GitHub Pages site. Verify that the selected branch still
  points to the approved commit; if it advances, review the new revision first.
- Manual Deploy publishes the whole website and `games/` tree. It replaces the
  current live site; downloading or reviewing the preview archive does not.
- After publication, record the deployment SHA and manually inspect the arcade,
  direct game entry and project-prefixed local resources on the live URL.
